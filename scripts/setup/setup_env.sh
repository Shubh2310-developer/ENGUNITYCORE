#!/bin/bash
# Script to configure VS Code to automatically activate the 'engunity' conda environment

# Ensure .vscode directory exists
mkdir -p .vscode

# 1. Create the Bash initialization script
cat > .vscode/bash_init.sh << 'EOF'
#!/bin/bash
# Source the global bashrc if it exists
if [ -f ~/.bashrc ]; then
    source ~/.bashrc
fi

# Initialize conda for this shell session if not already initialized
CONDA_BASE_PATH=$(conda info --base 2>/dev/null || echo "$HOME/miniconda3")
if [ -f "$CONDA_BASE_PATH/etc/profile.d/conda.sh" ]; then
    source "$CONDA_BASE_PATH/etc/profile.d/conda.sh"
fi

# Activate the engunity environment
conda activate engunity
EOF
chmod +x .vscode/bash_init.sh

# 2. Create the Zsh initialization script
cat > .vscode/.zshrc << 'EOF'
# Source the global zshrc if it exists
if [ -f ~/.zshrc ]; then
    source ~/.zshrc
fi

# Initialize conda for this shell session
CONDA_BASE_PATH=$(conda info --base 2>/dev/null || echo "$HOME/miniconda3")
if [ -f "$CONDA_BASE_PATH/etc/profile.d/conda.sh" ]; then
    source "$CONDA_BASE_PATH/etc/profile.d/conda.sh"
fi

# Activate the engunity environment
conda activate engunity
EOF

# 3. Create or update settings.json
python3 -c '
import json
import os

settings_path = ".vscode/settings.json"
if os.path.exists(settings_path):
    with open(settings_path, "r") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            data = {}
else:
    data = {}

data["python.defaultInterpreterPath"] = os.path.expanduser("~/miniconda3/envs/engunity")
data["python.terminal.activateEnvironment"] = True

profiles = data.get("terminal.integrated.profiles.linux", {})
profiles["engunity-bash"] = {
    "path": "bash",
    "args": ["--rcfile", "${workspaceFolder}/.vscode/bash_init.sh"]
}
profiles["engunity-zsh"] = {
    "path": "zsh",
    "args": ["-i"],
    "env": {
        "ZDOTDIR": "${workspaceFolder}/.vscode"
    }
}
data["terminal.integrated.profiles.linux"] = profiles

# Set default profile based on current user shell
current_shell = os.environ.get("SHELL", "")
if "zsh" in current_shell:
    data["terminal.integrated.defaultProfile.linux"] = "engunity-zsh"
else:
    data["terminal.integrated.defaultProfile.linux"] = "engunity-bash"

with open(settings_path, "w") as f:
    json.dump(data, f, indent=2)
'

echo "Configuration complete! Please restart VS Code or open a new terminal."
