#!/bin/bash
# startkafka.sh
# -----------------------
# Script to start a Kafka-compatible Redpanda container for local testing
#
# NOTES:
# - Uses Redpanda (Kafka API compatible) for quick local Kafka setup
# - Exposes Kafka port 9092 and Admin API port 9644
# - Container auto-removes on stop
# - Commands for connecting with kafkacat, kafka-console-producer/consumer, and kafka-topics provided
# - Suitable for testing FrankStack Travel AI microservices locally
#
# Author: Edoardo Sabatini
# Date: 02 October 2025
# 
docker run -d --rm --name redpanda-test \
  -p 9092:9092 -p 9644:9644 \
  redpandadata/redpanda:latest \
  redpanda start --overprovisioned --smp 1 --memory 1G \
  --reserve-memory 0M --node-id 0 --check=false

docker ps
