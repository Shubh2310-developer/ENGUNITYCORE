import re

def sanitize_code_output(output: str) -> str:
    """
    Remove potentially dangerous content and ANSI escape codes from code output.
    Also truncates output if it exceeds a safe limit for the frontend.
    """
    if not output:
        return ""

    # Remove ANSI escape codes (colors, cursor movements, etc.)
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    cleaned = ansi_escape.sub('', output)

    # Truncate if too long (10,000 characters is usually plenty for logs)
    max_length = 10000
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length] + "\n... (output truncated for performance)"

    return cleaned
