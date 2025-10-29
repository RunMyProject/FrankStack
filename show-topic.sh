#!/bin/bash
# ================================================================
# show-topic.sh 
# List all SNS topics in the localstack environment
# 
# Author: Edoardo Sabatini
# Date: 29 October 2025
# ================================================================
docker exec frankstack-localstack awslocal sns list-topics
