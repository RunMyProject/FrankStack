#!/bin/bash
# -----------------------------------------------------------------------------
# test_miscellaneous_aws.sh
# AWS miscellaneous test script on LocalStack + placeholder for EKS/K8s
# Author: Edoardo Sabatini
# Date: 14/10/2025
# -----------------------------------------------------------------------------

# ------------------------------
# VARIABLES
# ------------------------------
ENDPOINT="http://localhost:4566"
IAM_USER="edoardo"

# ------------------------------
# CHECK SNS TOPICS
# ------------------------------
echo "📢 Listing SNS topics..."
aws --endpoint-url=$ENDPOINT sns list-topics
echo "----------------------------------------"

# ------------------------------
# CHECK DYNAMODB TABLES
# ------------------------------
echo "📊 Listing DynamoDB tables..."
aws --endpoint-url=$ENDPOINT dynamodb list-tables
echo "----------------------------------------"

# ------------------------------
# CHECK CLOUDWATCH LOG GROUPS
# ------------------------------
echo "📚 Describing CloudWatch log groups..."
aws --endpoint-url=$ENDPOINT logs describe-log-groups
echo "----------------------------------------"

# ------------------------------
# CHECK CONFIGURED REGION
# ------------------------------
echo "🌍 Current AWS CLI region:"
aws configure get region
echo "----------------------------------------"

# ------------------------------
# CHECK IAM POLICIES
# ------------------------------
echo "🔐 Listing IAM policies (names only)..."
aws --endpoint-url=$ENDPOINT iam list-policies --query 'Policies[].PolicyName' --output table
echo "----------------------------------------"

# ------------------------------
# CREATE IAM USER IF NOT EXISTS
# ------------------------------
EXISTING=$(aws --endpoint-url=$ENDPOINT iam list-users --query "Users[?UserName=='$IAM_USER'].UserName" --output text)
if [ -z "$EXISTING" ]; then
    echo "👤 Creating IAM user: $IAM_USER"
    aws --endpoint-url=$ENDPOINT iam create-user --user-name $IAM_USER
    echo "✅ User created: $IAM_USER"
else
    echo "👤 IAM user already exists: $IAM_USER"
fi
echo "----------------------------------------"

# ------------------------------
# LIST IAM USERS
# ------------------------------
echo "👤 Listing IAM users (names only)..."
aws --endpoint-url=$ENDPOINT iam list-users --query 'Users[].UserName' --output table
echo "----------------------------------------"

# ------------------------------
# KUBERNETES / EKS PLACEHOLDER
# ------------------------------
echo "☸️ Checking Kubernetes / EKS cluster..."
# Replace with actual kubectl or eksctl commands when connected to a real cluster
echo "⚠ Placeholder: no cluster connected yet"
echo "----------------------------------------"

# ------------------------------
# AWS CLI VERSION
# ------------------------------
echo "🛠 AWS CLI version:"
aws --version
echo "----------------------------------------"

aws --endpoint-url=http://localhost:4566 iam list-users

echo "🎉 Miscellaneous AWS + K8s/EKS checks completed!"

