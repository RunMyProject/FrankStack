# ================================================================
# Dockerfile
# frank-aws-service-payment-card
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ================================================================

# STAGE 1: Build (Maven + JDK)
# ------------------------------
# syntax=docker/dockerfile:1.4  <-- ADD THIS LINE to enable BuildKit features
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

# Compile without tests
RUN mvn clean package -DskipTests

# STAGE 2: Run (JRE)
# ------------------
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy compiled jar
COPY --from=build /app/target/*.jar app.jar

# Copy configuration (modifiable without full rebuild)
COPY --from=build /app/application.yml /app/application.yml

EXPOSE 18082
CMD ["java", "-jar", "app.jar"]
