# ================================================================
# startOllama_old.sh
# frank-orchestrator
# Author: Edoardo Sabatini
# Date: 27 October 2025
# ================================================================

#!/bin/bash

# Set the OLLAMA_MODELS environment variable
export OLLAMA_MODELS=/media/edoardo/data2/ollama_models/models

# Start the Ollama service (make sure the ollama path is in your PATH)
ollama serve
