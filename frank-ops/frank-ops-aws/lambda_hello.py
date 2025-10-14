#!/usr/bin/env python3
# lambda_hello.py
# 
# Author: Edoardo Sabatini
# Date: 14 October 2025
# -----------------------------------------------------------------------------
def handler(event, context):
    return {
        "correlationID": event["correlationID"],
        "message": event["message"]
    }
