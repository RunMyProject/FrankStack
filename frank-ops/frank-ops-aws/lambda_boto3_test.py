#!/usr/bin/env python3
# lambda_boto3_test.py
#
# Author: Edoardo Sabatini
# Date: 14 October 2025
# -----------------------------------------------------------------------------
import boto3
import json

# LocalStack endpoint
endpoint = "http://localhost:4566"

# Connect to Lambda
lambda_client = boto3.client('lambda', endpoint_url=endpoint, region_name='us-east-1')

# Create Lambda function (if it does not already exist)
with open("lambda_hello.zip", "rb") as f:
    code_bytes = f.read()

try:
    response = lambda_client.create_function(
        FunctionName="helloLambda",
        Runtime="python3.11",
        Role="arn:aws:iam::000000000000:role/lambda-role",
        Handler="lambda_hello.handler",
        Code={"ZipFile": code_bytes},
    )
except lambda_client.exceptions.ResourceConflictException:
    print("Lambda helloLambda already exists, skipping creation")

# Invoke Lambda
payload = {"message": "hello world", "correlationID": "123"}
resp = lambda_client.invoke(
    FunctionName="helloLambda",
    Payload=json.dumps(payload)
)
data = json.loads(resp['Payload'].read())
print("Lambda response:", data)
