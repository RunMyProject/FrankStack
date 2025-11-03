#!/bin/bash
# ================================================================
# show-topic.sh 
# Periodically check if SNS topics exist in Localstack ⏰
# and exit once they appear.
#
# Author: Edoardo Sabatini
# Date: 03 November 2025
# ================================================================

# 🕐 Check interval (in seconds)
INTERVAL=10

echo "⏰ Wake-up check: monitoring Localstack SNS topics every $INTERVAL seconds..."
echo "It will stop automatically once topics appear."
echo "========================================================="

while true; do
  echo
  echo "🔍 Checking topics at $(date '+%H:%M:%S')..."
  
  # Try to list SNS topics
  OUTPUT=$(docker exec frankstack-localstack awslocal sns list-topics 2>/dev/null)
  STATUS=$?

  if [ $STATUS -ne 0 ]; then
    echo "⚠️  Could not reach Localstack or AWS CLI failed!"
  else
    # Check if the output contains any TopicArn
    if echo "$OUTPUT" | grep -q "TopicArn"; then
      echo "✅ Topics found!"
      echo "$OUTPUT"
      echo "🏁 Exiting watcher."
      exit 0
    else
      echo "❌ No topics found yet. Sleeping for $INTERVAL seconds..."
    fi
  fi
  
  echo "========================================================="
  sleep $INTERVAL
done
