import re
import asyncio
from typing import List, Dict, Optional, Any, Callable
from loguru import logger
from ..code_executor.sandbox import SecureSandbox
from .prompts.recursive import RLM_SYSTEM_PROMPT

class RecursiveReasoningAgent:
    """
    Implements the Recursive Language Model paradigm.
    Offloads context to a REPL and uses symbolic recursion to solve tasks.
    """
    def __init__(self, llm_client, max_steps: int = 10):
        self.llm = llm_client
        self.max_steps = max_steps

    async def solve(
        self,
        query: str,
        context: str,
        on_step: Optional[Callable[[Dict], None]] = None
    ) -> Dict[str, Any]:
        """
        Main loop for recursive reasoning.
        """
        # 1. Initialize Sandbox with the large context
        sandbox = SecureSandbox(context=context)

        # 2. Register the recursive tool
        async def async_llm_query(prompt: str) -> str:
            # This is the recursive call back to a simpler model/flow
            # For now, we'll just use a direct completion
            logger.info(f"RLM Sub-query initiated: {prompt[:50]}...")
            if on_step:
                on_step({"type": "sub_query_start", "prompt": prompt})

            response = await self.llm.get_completion([{"role": "user", "content": prompt}])

            if on_step:
                on_step({"type": "sub_query_end", "response": response})
            return response

        # Bridge async to sync for the sandbox (since exec is sync)
        def llm_query_sync(prompt: str) -> str:
            return asyncio.run_coroutine_threadsafe(async_llm_query(prompt), asyncio.get_event_loop()).result()

        sandbox.register_tool("llm_query", llm_query_sync)

        # 3. Initialize Conversation
        history = [
            {"role": "system", "content": RLM_SYSTEM_PROMPT},
            {"role": "user", "content": f"User Query: {query}\n\nContext Metadata: Length={len(context)} characters."}
        ]

        steps = []
        final_answer = None

        for step_idx in range(self.max_steps):
            logger.info(f"RLM Step {step_idx + 1}/{self.max_steps}")

            # 4. Generate next thought/action
            response = await self.llm.get_completion(history, temperature=0.2)

            # Check for FINAL answer
            final_match = re.search(r'FINAL\((.*?)\)', response, re.DOTALL)
            final_var_match = re.search(r'FINAL_VAR\((.*?)\)', response, re.DOTALL)

            # ENFORCE MULTI-STEP PROTOCOL: If FINAL() is called too early (before 3 reasoning steps)
            if (final_match or final_var_match) and step_idx < 3:
                logger.warning(f"RLM attempted to finalize too early at step {step_idx}. Enforcing multi-step protocol.")
                history.append({"role": "assistant", "content": response})
                history.append({
                    "role": "user",
                    "content": "You are in EXHAUSTIVE mode. You must complete at least 3 reasoning steps (Analysis, Retrieval, and Synthesis) using `repl` blocks before finalizing. Please continue your research."
                })
                # Log the intercepted attempt as a step
                steps.append({
                    "thought": response,
                    "output": "INTERCEPTED: Attempted to finalize too early. Enforcing multi-step research."
                })
                continue

            if final_match:
                final_answer = final_match.group(1).strip()
                # Append the final thought to steps before breaking
                steps.append({
                    "thought": response,
                    "output": "FINAL_ANSWER_REACHED"
                })
                break
            elif final_var_match:
                var_name = final_var_match.group(1).strip()
                final_answer = str(sandbox.get_variable(var_name))
                steps.append({
                    "thought": response,
                    "output": f"FINAL_VAR_REACHED: {var_name}"
                })
                break

            # 5. Extract and execute code
            code_blocks = re.findall(r'```repl\n(.*?)\n```', response, re.DOTALL)
            if not code_blocks:
                # If no code but no FINAL, the model might just be thinking or confused
                history.append({"role": "assistant", "content": response})
                history.append({"role": "user", "content": "Please provide either a `repl` code block to continue your research or a `FINAL()` answer if you are done."})
                continue

            # Execute code blocks
            output_combined = ""
            for code in code_blocks:
                logger.info(f"RLM Executing code step {step_idx}")
                output = sandbox.execute(code)
                output_combined += output + "\n"

                if on_step:
                    on_step({
                        "type": "code_execution",
                        "step": step_idx,
                        "code": code,
                        "output": output
                    })

            # 6. Update history with results
            history.append({"role": "assistant", "content": response})
            history.append({"role": "user", "content": f"REPL Execution Output:\n{output_combined}"})

            steps.append({
                "thought": response,
                "output": output_combined
            })

        if not final_answer:
            final_answer = "I was unable to reach a final conclusion within the maximum number of reasoning steps."

        return {
            "response": final_answer,
            "steps": steps,
            "metadata": {
                "steps_count": len(steps),
                "context_length": len(context)
            }
        }
