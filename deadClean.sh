#!/bin/bash
# ==========================================================
# deadClean.sh
# 
# Author: Edoardo Sabatini
# Date: 03 November 2025
# ==========================================================
#!/bin/bash
echo "🏖️ Starting DeadClean: removing untagged Docker images..."

# Removes only dangling images (those with <none>)
docker image prune -f

echo
echo "✅ Orphan images removed. Current status:"
docker images

echo
echo "🏁 Cleanup complete. Everything needed (ollama, cuda, localstack) is safe."
# End of deadClean.sh
# ==========================================================
# deadClean.sh
