# ================================================================
# Dockerfile
# Frank-AWS-API-Gateway Microservice Container (cache-optimized)
# 
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ================================================================

# STAGE 1: Build (Maven + JDK)
# ------------------------------
# syntax=docker/dockerfile:1.4  <-- enable BuildKit features
FROM maven:3.9.8-eclipse-temurin-21 AS build

WORKDIR /app

# Copy only pom.xml first to leverage Docker cache for dependencies
COPY pom.xml .

# Use BuildKit cache mount for Maven's local repository (.m2)
# The 'cache' type ensures that dependencies are stored outside the image layers.
# This prevents Maven from re-downloading dependencies if pom.xml hasn't changed.
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B

# Copy source code and config
COPY src ./src
COPY src/main/resources/application.yml /app/application.yml

# Compile the project using cached dependencies
RUN mvn clean package -DskipTests

# STAGE 2: Run (JRE)
# ------------------
FROM eclipse-temurin:21-jre

WORKDIR /app

###############################################
# AWS Tools Installation
###############################################

RUN echo "🚀 Starting AWS tools installation"

# Copy tools folder (contains aws + unzip)
COPY tools /app/tools

# Copy the deploy script into app
COPY deploy-lambda-docker.sh /app

WORKDIR /app/tools

# Unzip AWS CLI
RUN ./unzip awscliv2.zip

# Add AWS CLI to PATH
ENV PATH="$PATH:/app/tools/aws/dist"

WORKDIR /app

# Verify AWS installation
RUN aws --version > /app/dummy.txt

###############################################
# COPY LOCAL JARS FROM jar_dist
###############################################

# Copy all JARs from host jar_dist folder into container
COPY jar_dist /app/jar_dist

# Copy compiled jar and config from build stage
COPY --from=build /app/target/*.jar app.jar
COPY --from=build /app/application.yml /app/application.yml

# Expose API port
EXPOSE 18081

# Final working directory
WORKDIR /app

# Default command
CMD ["bash", "-c", "/app/deploy-lambda-docker.sh && java -jar app.jar"]
