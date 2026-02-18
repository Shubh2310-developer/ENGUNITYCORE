import json
from typing import Dict, Any, List
from app.services.ai.groq_client import groq_client
from app.agents.coding_team.state import AgentState
from app.agents.coding_team.tools import read_file, write_file, list_files, rag_search_code

async def team_lead_node(state: AgentState) -> Dict[str, Any]:
    """
    Team Lead: Plans and delegates.
    """
    messages = state.get("messages", [])
    task = state.get("task_description", "")
    iteration = state.get("iteration_count", 0)
    feedback = state.get("review_feedback", "")

    # Construct prompt
    system_prompt = (
        "You are the Team Lead of a crack coding squad. "
        "Your goal is to plan the implementation of a coding task. "
        "You have access to tools to find files. "
        "Identify the file that needs modification and provide clear instructions to the Coder."
    )

    user_content = f"Task: {task}\nIteration: {iteration}"
    if feedback:
        user_content += f"\nPrevious Review Feedback: {feedback}\nPlease adjust the plan."

    # In a real agent, we'd bind tools and let the LLM call them.
    # For this simplified orchestrator, we'll do a robust heuristic/chain.

    # 1. Search if file not known
    current_file = state.get("current_file")
    if not current_file:
        # Use RAG to find relevant files
        try:
            search_results = rag_search_code.invoke({"query": task})
        except Exception as e:
            search_results = f"RAG search failed: {e}"

        # If RAG didn't return much, fallback to listing files (e.g. in frontend/src)
        if "No results found" in search_results or "AI services are disabled" in search_results:
             files_listing = list_files.invoke({"directory": "frontend/src"})
             context_str = f"Available files:\n{files_listing}"
        else:
             context_str = f"Found relevant code snippets:\n{search_results}"

        planning_prompt = f"""
        {system_prompt}

        {context_str}

        User Request: {task}

        Output a JSON object with the following keys:
        - "thought": "your reasoning"
        - "target_file": "path/to/file" (Use the EXACT path requested by the user. Do not add 'output/' or other prefixes unless asked.)
        - "instructions": "detailed instructions for the coder"

        Example:
        {{
            "thought": "User wants to create a simple script.",
            "target_file": "script.py",
            "instructions": "Create a file named script.py that prints hello."
        }}
        """

        response = await groq_client.get_completion([{"role": "user", "content": planning_prompt}])

        try:
            # simple json extraction
            import re
            json_match = re.search(r"\{.*\}", response, re.DOTALL)
            if json_match:
                plan_data = json.loads(json_match.group(0))
                current_file = plan_data.get("target_file", "unknown_file.txt")
                instructions = plan_data.get("instructions", "Check the file")
            else:
                # Heuristic fallback: try to extract filename from the task
                file_match = re.search(r"named ['\"]?([\w\./_-]+)['\"]?", task)
                if not file_match:
                    # Try other patterns like "create X", "make X", "a X file"
                    file_match = re.search(r"(?:create|make|write|build)\s+(?:a\s+)?(?:new\s+)?(?:file\s+(?:called|named)\s+)?['\"]?([\w\./_-]+\.[\w]+)['\"]?", task, re.IGNORECASE)
                if not file_match:
                    # Try: "X file" pattern (e.g., "go file", "python file")
                    ext_match = re.search(r"\b(go|python|rust|java|js|ts|rb|c|cpp|sh)\b.*\bfile\b", task, re.IGNORECASE)
                    if ext_match:
                        lang = ext_match.group(1).lower()
                        ext_map = {"go": ".go", "python": ".py", "rust": ".rs", "java": ".java", "js": ".js", "ts": ".ts", "rb": ".rb", "c": ".c", "cpp": ".cpp", "sh": ".sh"}
                        ext = ext_map.get(lang, ".txt")
                        current_file = f"main{ext}"
                        instructions = task
                    else:
                        current_file = "output.txt"
                        instructions = task
                if file_match:
                    current_file = file_match.group(1)
                    instructions = task
        except Exception:
            current_file = "output.txt"
            instructions = task

    else:
        # We already have a file
        if feedback:
            instructions = f"Fix the issues mentioned: {feedback}"
        else:
            instructions = f"Please implement the following task on {current_file}: {task}"

    return {
        "current_file": current_file,
        "plan": instructions,
        "status": "coding",
        "messages": [{"role": "assistant", "content": f"Team Lead: Assigned {current_file} to Coder. Instructions: {instructions}"}]
    }

async def coder_node(state: AgentState) -> Dict[str, Any]:
    """
    Coder: Executes the changes. Handles both new file creation and existing file modification.
    """
    current_file = state.get("current_file")
    instructions = state.get("plan")

    if not current_file:
        return {"status": "failed", "messages": [{"role": "assistant", "content": "Coder: No file provided!"}]}

    # 1. Read file (may not exist for new file creation)
    content = read_file.invoke({"file_path": current_file})
    is_new_file = content.startswith("Error reading file") or content.startswith("Error")

    # 2. Generate code
    if is_new_file:
        prompt = f"""
You are an expert Coder. You need to CREATE a brand new file: {current_file}

Instructions: {instructions}

Generate the COMPLETE file content from scratch. Output ONLY the file content wrapped in markdown code blocks (e.g. ```go ... ``` or ```python ... ```).
Do NOT include any explanations outside the code block.
"""
    else:
        prompt = f"""
You are an expert Coder.
Current File ({current_file}):
```
{content}
```

Instructions: {instructions}

Output the FULL updated file content wrapped in markdown code blocks (e.g. ```typescript ... ```).
Do NOT include any explanations outside the code block.
"""

    new_content = await groq_client.get_completion([{"role": "user", "content": prompt}])

    # Robust markdown stripping
    import re
    # Match content inside ```...```
    match = re.search(r"```(?:\w+)?\n?(.*?)```", new_content, re.DOTALL)
    if match:
        new_content = match.group(1).strip()
    else:
        # Fallback: just return content, maybe stripping lines if they look like markers
        lines = new_content.strip().splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        new_content = "\n".join(lines).strip()

    # 3. Write
    write_file.invoke({"file_path": current_file, "content": new_content})

    return {
        "file_content": new_content,
        "diff": f"Updated {current_file}",
        "status": "reviewing",
        "messages": [{"role": "assistant", "content": f"Coder: Updated {current_file}"}]
    }

async def reviewer_node(state: AgentState) -> Dict[str, Any]:
    """
    Reviewer: Checks the code.
    """
    current_file = state.get("current_file")
    content = state.get("file_content")
    task = state.get("task_description")

    prompt = f"""
    You are a Code Reviewer.
    Task: {task}
    File: {current_file}

    Content:
    {content}

    Check for:
    1. Syntax errors
    2. Logic errors
    3. Adherence to task

    If Good, reply "APPROVED".
    If Bad, reply "REJECTED: <reason>"
    """

    review = await groq_client.get_completion([{"role": "user", "content": prompt}])

    if "APPROVED" in review:
        return {
            "status": "completed",
            "review_feedback": "Looks good!",
            "messages": [{"role": "assistant", "content": "Reviewer: Approved."}]
        }
    else:
        return {
            "status": "planning", # Loop back to lead
            "iteration_count": state.get("iteration_count", 0) + 1,
            "review_feedback": review,
            "messages": [{"role": "assistant", "content": f"Reviewer: {review}"}]
        }
