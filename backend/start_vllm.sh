#!/bin/bash
# start_vllm.sh
python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-3.1-8B-Instruct \
    --gpu-memory-utilization 0.85 \
    --enable-prefix-caching \
    --max-model-len 4096 \
    --port 8005 \
    --host 0.0.0.0
