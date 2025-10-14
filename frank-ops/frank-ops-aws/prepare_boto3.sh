#!/bin/bash
# -----------------------------------------------------------------------------
# prepare_boto3.sh
# Prepare Python virtual environment and install boto3 for AWS LocalStack tests
# Author: Edoardo Sabatini
# Date: 14/10/2025
# -----------------------------------------------------------------------------

# VARIABLES
VENV_DIR="venv"        # Virtual environment directory
PYTHON_BIN="python3"   # Python executable
PIP_BIN="pip"          # Pip executable

# -----------------------------------------------------------------------------
# CHECK LOCALSTACK
# -----------------------------------------------------------------------------
if docker ps --filter "name=localstack" --filter "status=running" | grep -q localstack; then
  echo "✔ LocalStack is active in Docker"
else
  echo "❌ LocalStack is not running. Start the container first."
fi
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# CREATE VIRTUAL ENVIRONMENT
# -----------------------------------------------------------------------------
if [ ! -d "$VENV_DIR" ]; then
  echo "📦 Creating Python virtual environment: $VENV_DIR"
  $PYTHON_BIN -m venv $VENV_DIR
  echo "✅ Virtual environment created"
else
  echo "✔ Virtual environment already exists: $VENV_DIR"
fi
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# ACTIVATE VIRTUAL ENVIRONMENT
# -----------------------------------------------------------------------------
echo "🔧 Activating virtual environment..."
source $VENV_DIR/bin/activate
echo "✅ Virtual environment activated"
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# INSTALL BOTO3
# -----------------------------------------------------------------------------
echo "📥 Installing boto3 in virtual environment..."
$PIP_BIN install --upgrade pip >/dev/null
$PIP_BIN install boto3 >/dev/null
echo "✅ boto3 installed successfully"
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# TEST BOTO3 INSTALLATION
# -----------------------------------------------------------------------------
echo "🔍 Testing boto3 installation..."
python3 -c "import boto3; print('boto3 version:', boto3.__version__)"
echo "----------------------------------------"

# -----------------------------------------------------------------------------
# FINAL MESSAGE
# -----------------------------------------------------------------------------
echo "🎉 Executing lambda_boto3_test.sh..."
./lambda_boto3_test.sh
exit

