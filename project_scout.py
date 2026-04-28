#!/usr/bin/env python3
import os
import glob
import json
from pathlib import Path

def scan_project(root_dir):
    root = Path(root_dir)
    report = {
        "env_files": [],
        "secrets": [],
        "models": [],
        "ignored_but_present": [],
        "claude_artifacts": []
    }

    # Patterns
    env_patterns = [".env*", "*.env", ".env.code"]
    secret_patterns = ["*.pem", "*.key", "secrets.yaml", "credentials.json", "auth.json"]
    model_patterns = ["*.pt", "*.pth", "*.h5", "*.onnx", "*.joblib", "*.pkl", "*.model", "*.bin"]
    
    # 1. Scan for Env and Secrets
    for p in env_patterns + secret_patterns:
        for f in root.rglob(p):
            if "node_modules" in str(f) or ".git" in str(f): continue
            if any(pat in f.name for pat in [".env.example", ".env.sample", ".env.template"]):
                continue
            if p in env_patterns:
                report["env_files"].append(str(f))
            else:
                report["secrets"].append(str(f))

    # 2. Scan for Models
    for p in model_patterns:
        for f in root.rglob(p):
            if "node_modules" in str(f) or ".git" in str(f): continue
            # Filter out small files if needed, but for now keep all
            report["models"].append(str(f))

    # 3. Check Gitignore
    gitignore_path = root / ".gitignore"
    if gitignore_path.exists():
        with open(gitignore_path, "r") as g:
            ignored_patterns = [line.strip() for line in g if line.strip() and not line.startswith("#")]
        
        # This is a bit simplified, but checks for directories/files specifically named in gitignore
        for pattern in ignored_patterns:
            # Handle basic patterns
            found = glob.glob(str(root / pattern))
            for f in found:
                if os.path.exists(f):
                    report["ignored_but_present"].append(f)

    # 4. Claude Artifacts
    claude_dir = root / ".claude"
    if claude_dir.exists():
        for f in claude_dir.rglob("*"):
            if f.is_file():
                report["claude_artifacts"].append(str(f))

    return report

def generate_report(report_data):
    md = "# Project Recovery Audit Report\n\n"
    
    md += "## Environment & Secret Files\n"
    if report_data["env_files"] or report_data["secrets"]:
        for f in report_data["env_files"]: md += f"- [ ] `{f}` (Env)\n"
        for f in report_data["secrets"]: md += f"- [ ] `{f}` (Secret)\n"
    else:
        md += "No critical secrets or env files found (check if they are already lost!)\n"

    md += "\n## AI Models & Binary Blobs\n"
    if report_data["models"]:
        for f in report_data["models"]: md += f"- [ ] `{f}`\n"
    else:
        md += "No model files found.\n"

    md += "\n## Git-Ignored Items (Potential Data Loss Risk)\n"
    if report_data["ignored_but_present"]:
        # Deduplicate
        for f in sorted(list(set(report_data["ignored_but_present"]))):
            md += f"- [ ] `{f}`\n"
    else:
        md += "No ignored files found currently in the workspace.\n"

    md += "\n## Claude Agents & Skills\n"
    if report_data["claude_artifacts"]:
        for f in report_data["claude_artifacts"]: md += f"- [ ] `{f}`\n"
    else:
        md += "No Claude artifacts found.\n"

    return md

if __name__ == "__main__":
    project_path = "/home/agentrogue/projects/ENGUNITYCORE"
    data = scan_project(project_path)
    report_md = generate_report(data)
    
    report_file = os.path.join(project_path, "recovery_report.md")
    with open(report_file, "w") as f:
        f.write(report_md)
    print(f"Recovery report generated at {report_file}")
