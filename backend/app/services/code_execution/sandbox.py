from typing import List, Dict, Any
import asyncio
import random

class SandboxSimulator:
    """
    Simulates a secure, isolated sandbox environment for repository execution.
    In a production environment, this would interface with Docker/Kubernetes.
    """

    @staticmethod
    async def run_example(repo_name: str, use_gpu: bool = False) -> List[Dict[str, Any]]:
        """
        Simulates running an example script for a repository.
        Returns a list of log entries with timestamps and status.
        """
        logs = []

        # Simulated initialization
        logs.append({"time": "00:00:01", "type": "info", "message": f"Initializing sandbox for {repo_name}..."})
        await asyncio.sleep(0.5)

        resource_msg = "Allocating resources: 2 vCPUs, 4GB RAM..."
        if use_gpu:
            resource_msg = "Allocating resources: 8 vCPUs, 32GB RAM, 1x NVIDIA H100 GPU..."

        logs.append({"time": "00:00:02", "type": "info", "message": resource_msg})
        await asyncio.sleep(0.3)

        logs.append({"time": "00:00:03", "type": "info", "message": "Mounting repository filesystem (read-only)..."})
        await asyncio.sleep(0.4)

        if use_gpu:
            logs.append({"time": "00:00:04", "type": "info", "message": "NVIDIA Driver 535.104.05 detected. CUDA 12.2 Initialized."})
            await asyncio.sleep(0.2)

        logs.append({"time": "00:00:05", "type": "info", "message": "Installing dependencies from requirements.txt..."})
        await asyncio.sleep(0.8)

        # Simulated execution based on repo type
        if "transformer" in repo_name.lower():
            exec_time = "420ms" if not use_gpu else "12ms (GPU Accelerated)"
            logs.extend([
                {"time": "00:00:07", "type": "success", "message": "$ python examples/inference.py --model=base" + (" --device=cuda" if use_gpu else "")},
                {"time": "00:00:08", "type": "info", "message": f"Loading pre-trained weights into simulated {'CUDA' if use_gpu else 'CPU'} device..."},
                {"time": "00:00:10", "type": "info", "message": "Tokenizing input sequence: 'The future of AI is...'"},
                {"time": "00:00:12", "type": "info", "message": f"Forward pass completed in {exec_time}"},
                {"time": "00:00:13", "type": "output", "message": "Generated: '...bright and full of possibilities for human-AI collaboration.'"},
                {"time": "00:00:14", "type": "info", "message": f"Peak Memory Usage: {'4.2GB (VRAM)' if use_gpu else '1.2GB'}"},
            ])
        elif "fastapi" in repo_name.lower():
            logs.extend([
                {"time": "00:00:07", "type": "success", "message": "$ uvicorn app.main:app --host 0.0.0.0 --port 8000"},
                {"time": "00:00:08", "type": "info", "message": "INFO:     Started server process [1]"},
                {"time": "00:00:09", "type": "info", "message": "INFO:     Waiting for application startup."},
                {"time": "00:00:09", "type": "info", "message": "INFO:     Application startup complete."},
                {"time": "00:00:11", "type": "output", "message": "GET /health_check HTTP/1.1 200 OK"},
                {"time": "00:00:12", "type": "output", "message": "POST /v1/predict HTTP/1.1 200 OK (15ms)"},
            ])
        else:
            logs.extend([
                {"time": "00:00:07", "type": "success", "message": "$ python main.py --test"},
                {"time": "00:00:09", "type": "info", "message": "Running test suite..."},
                {"time": "00:00:11", "type": "info", "message": "Test 1 (Data Loading): PASSED"},
                {"time": "00:00:12", "type": "info", "message": "Test 2 (Model Init): PASSED"},
                {"time": "00:00:14", "type": "success", "message": "All tests passed successfully (100% coverage)."},
            ])

        logs.append({"time": "00:00:15", "type": "info", "message": "Execution complete. Cleaning up sandbox..."})

        return logs

sandbox_simulator = SandboxSimulator()
