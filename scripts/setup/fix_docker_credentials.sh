#!/bin/bash
# Fix Docker credentials issue

echo "🔧 Fixing Docker credentials issue..."
echo ""

# Method 1: Remove pass from docker config
if [ -f ~/.docker/config.json ]; then
    echo "📝 Backing up Docker config..."
    cp ~/.docker/config.json ~/.docker/config.json.backup
    
    # Remove credsStore from config
    if command -v jq &> /dev/null; then
        jq 'del(.credsStore)' ~/.docker/config.json > ~/.docker/config.json.tmp
        mv ~/.docker/config.json.tmp ~/.docker/config.json
        echo "✅ Removed credsStore from Docker config"
    else
        echo "⚠️  jq not installed, manual edit needed"
        echo "   Edit ~/.docker/config.json and remove the 'credsStore' line"
    fi
fi

# Method 2: Logout and clear credentials
echo ""
echo "🔓 Clearing Docker credentials..."
docker logout 2>/dev/null || true

# Method 3: Try to pull base image directly
echo ""
echo "🐳 Testing Docker pull..."
if docker pull python:3.10-slim; then
    echo "✅ Docker pull successful!"
else
    echo "❌ Docker pull failed"
    echo ""
    echo "Please try one of these solutions:"
    echo ""
    echo "1. Edit ~/.docker/config.json and remove the 'credsStore' line"
    echo ""
    echo "2. Or run: sudo apt-get install pass gnupg2"
    echo ""
    echo "3. Or reinstall Docker credential helper:"
    echo "   sudo apt-get remove golang-docker-credential-helpers"
    echo "   sudo apt-get install golang-docker-credential-helpers"
fi

echo ""
echo "After fixing, try rebuilding:"
echo "   ./deploy_optimized_backend.sh"
