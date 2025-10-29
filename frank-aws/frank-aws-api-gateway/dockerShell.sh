# ================================================================
# dockerShell.sh
# Connect to Frank-AWS-API-Gateway Microservice Container
# 
# Author: Edoardo Sabatini
# Date: 29 October 2025
# ================================================================

echo dockershell
# docker exec -it --workdir /app frank-aws-api-gateway /bin/bash
docker exec -it frankstack-aws-api-gateway /bin/bash
# ================================================================
# End of dockerShell.sh
# ================================================================
