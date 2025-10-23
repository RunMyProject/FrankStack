#!/bin/bash
# ==========================================================
# list functions
#
# Author: Edoardo Sabatini
# Date: 23 October 2025
# ==========================================================

aws --endpoint-url=http://localhost:4566 lambda list-functions --region eu-central-1 --query "Functions[*].[FunctionName,Runtime,Handler]" --output table
