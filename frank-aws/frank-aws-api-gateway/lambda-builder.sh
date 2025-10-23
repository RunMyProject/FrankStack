#!/bin/bash
# ================================================================
# lambda-builder.sh
# AWS Lambda Builder - Direct Directory Scanning
# Iterates over Maven source folders using direct directory listing.
# Cleans and recreates temporary and distribution directories.
# 
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ================================================================

# --- Variables ---
DEPLOY_BASE_DIR="../frank-aws-lambda"
TMP_DIR="./jar_tmp"
DIST_DIR="./jar_dist"

# Convert to absolute path
DEPLOY_BASE_DIR=$(realpath "$DEPLOY_BASE_DIR" 2>/dev/null || echo "$(pwd)/$DEPLOY_BASE_DIR")

# --- Error function for immediate exit ---
exit_on_error() {
    echo "❌ FATAL ERROR: $1" >&2
    exit 1
}

# --- Deploy function ---
deploy() {
    local folder_relative="$1"    # Relative folder name
    local folder_absolute="$2"    # Absolute path
    
    echo "⚙️ Maven compiling $folder_relative..."
    
    # Execute Maven package in the project directory
    cd "$folder_absolute" || exit_on_error "Cannot enter directory: $folder_absolute"
    
    # Execute mvn clean package skipping tests
    mvn clean package -DskipTests || exit_on_error "Maven compilation failed for $folder_relative"
    
    echo "✅ Maven compilation successful for $folder_relative"
    
    # Find the generated JAR file (look in target/ for .jar file)
    JAR_FILE=$(find target/ -name "*.jar" ! -name "*-sources.jar" ! -name "*-javadoc.jar" ! -name "original-*.jar" | head -1)
    
    if [ -n "$JAR_FILE" ] && [ -f "$JAR_FILE" ]; then
        # Copy JAR to dist directory
        cp "$JAR_FILE" "../../$DIST_DIR/$folder_relative.jar" || exit_on_error "Failed to copy JAR for $folder_relative"
        echo "📦 JAR copied to dist: $folder_relative.jar"
    else
        exit_on_error "No JAR file found for $folder_relative"
    fi
    
    # Return to original directory
    cd - > /dev/null
}

# --------------------------
# 1. Header and Initialization
# --------------------------

echo "📁 Lambda Builder"

# Check 1: DEPLOY_BASE_DIR MUST exist
if [ ! -d "$DEPLOY_BASE_DIR" ]; then
    exit_on_error "Base directory does not exist: $DEPLOY_BASE_DIR"
fi

# --- CLEAN AND RECREATE DIRECTORIES ---

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR" || exit_on_error "Failed to create distribution directory: $DIST_DIR"
echo "📁 jar_dist created"

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR" || exit_on_error "Failed to create temporary directory: $TMP_DIR"
echo "📁 jar_tmp created"

# --------------------------
# 2. COPY CORRECT SUBFOLDERS
# --------------------------

echo "------------"
echo "📁 Copying all lambda projects to tmp..."
# DIRECT COPY: all subfolders of the base folder
cp -r "$DEPLOY_BASE_DIR"/*/ "$TMP_DIR/" || exit_on_error "Failed to copy projects to tmp"

# Count how many folders were copied
COUNTER=$(ls -1 "$TMP_DIR" | wc -l)

echo "Total folders: $COUNTER"

# --------------------------
# 3. PRINT LIST WITH DEPLOY FUNCTION
# --------------------------

# Call deploy for each folder with both arguments
for folder in "$TMP_DIR"/*/; do
    if [ -d "$folder" ]; then
        folder_relative=$(basename "$folder")
        folder_absolute=$(realpath "$folder")
        deploy "$folder_relative" "$folder_absolute"
        echo "------------"
    fi
done

# --------------------------
# 4. PRINT FINAL DIST CONTENT
# --------------------------

echo "📦 DIST directory content:"
echo "=========================="
if [ "$(ls -A "$DIST_DIR")" ]; then
    for jar_file in "$DIST_DIR"/*.jar; do
        if [ -f "$jar_file" ]; then
            filename=$(basename "$jar_file")
            size=$(du -h "$jar_file" | cut -f1)
            echo "📄 $filename ($size)"
        fi
    done
else
    echo "📭 No JAR files found in dist directory"
fi

# --------------------------
# 5. CLEANUP TEMPORARY DIRECTORY
# --------------------------

# Count JAR files in dist directory
JAR_COUNT=$(ls -1 "$DIST_DIR"/*.jar 2>/dev/null | wc -l)

echo "------------"
echo "Total JARs: $JAR_COUNT"

# If JAR count matches folder count, safely remove tmp directory
if [ "$COUNTER" -eq "$JAR_COUNT" ]; then
    rm -rf "$TMP_DIR"
    echo "🧹 Temporary directory cleaned up"
else
    echo "⚠️  JAR count doesn't match folder count, keeping tmp directory for inspection"
fi

echo "done."