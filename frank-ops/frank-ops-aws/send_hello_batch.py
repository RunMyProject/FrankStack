#!/usr/bin/env python3
# send_hello_batch.py
# 
# Author: Edoardo Sabatini
# Date: 14 October 2025
# -----------------------------------------------------------------------------
import json

payload = {"message":"hello world","correlationID":"123"}
print(payload["correlationID"], ",", payload["message"])

def handler(event, context):
    print("Lambda invoked! Event:", event)
    return {"correlationID": event.get("correlationID"), "message": event.get("message")}
