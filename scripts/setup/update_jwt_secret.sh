#!/bin/bash

# Helper script to update Supabase JWT secret

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         Supabase JWT Secret Update Helper                        ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Current JWT secret (first 20 chars):"
cd backend
CURRENT_SECRET=$(grep SUPABASE_JWT_SECRET .env | cut -d'=' -f2)
echo "   ${CURRENT_SECRET:0:20}..."
echo ""

echo "🔗 Get your JWT secret from Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/amddbmoltlwqsrwwdyvc/settings/api"
echo ""
echo "   Look for: JWT Settings → JWT Secret (click to reveal)"
echo ""

read -p "📝 Paste your JWT secret here: " NEW_SECRET

if [ -z "$NEW_SECRET" ]; then
    echo "❌ No secret provided. Exiting."
    exit 1
fi

echo ""
echo "🔄 Updating backend/.env..."

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup created"

# Update the JWT secret
sed -i.tmp "s|SUPABASE_JWT_SECRET=.*|SUPABASE_JWT_SECRET=$NEW_SECRET|" .env
rm -f .env.tmp
echo "   ✅ JWT secret updated"

echo ""
echo "🧪 Verifying new secret..."

# Verify the secret
python3 << 'PYEOF'
import jwt
import base64
import os
from dotenv import load_dotenv

load_dotenv()

anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZGRibW9sdGx3cXNyd3dkeXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzQ5MDcsImV4cCI6MjA4MzExMDkwN30.62w7IMWGQdOEgyO8gTf-EfYhfh9qnGQSpwqvpGxgGiI"
secret = os.getenv("SUPABASE_JWT_SECRET")

try:
    # Try base64 decode if it looks base64
    if "=" in secret:
        decoded_secret = base64.b64decode(secret)
    else:
        decoded_secret = secret.encode()
    
    payload = jwt.decode(anon_key, decoded_secret, algorithms=["HS256"], options={"verify_aud": False})
    print("   ✅ ✅ ✅ SECRET IS CORRECT!")
    print(f"   Project: {payload.get('ref')}")
    exit(0)
except jwt.InvalidSignatureError:
    print("   ❌ SECRET IS STILL WRONG!")
    print("   Make sure you copied the JWT Secret (not the anon key)")
    exit(1)
except Exception as e:
    print(f"   ❌ Error: {e}")
    exit(1)
PYEOF

VERIFY_RESULT=$?

echo ""

if [ $VERIFY_RESULT -eq 0 ]; then
    echo "🔄 Restarting backend server..."
    
    # Kill existing backend
    pkill -f "uvicorn app.main" 2>/dev/null
    sleep 2
    
    # Start new backend
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/backend.log 2>&1 &
    
    echo "   ✅ Backend restarting..."
    sleep 5
    
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                    ✅ SUCCESS!                                    ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Your JWT secret has been updated and verified!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Go to: http://localhost:3000/login"
    echo "   2. Click 'Continue with GitHub'"
    echo "   3. GitHub OAuth should now work perfectly!"
    echo ""
    echo "📊 Monitor logs:"
    echo "   tail -f /tmp/backend.log"
    echo ""
else
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                    ⚠️  VERIFICATION FAILED                        ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "The secret you entered doesn't match Supabase's anon key signature."
    echo ""
    echo "Please double-check:"
    echo "   1. You copied from 'JWT Settings' section (not Project API keys)"
    echo "   2. You copied the entire secret"
    echo "   3. You didn't add extra spaces or quotes"
    echo ""
    echo "Your original .env has been backed up."
    echo "You can restore it with: cp .env.backup.* .env"
    echo ""
fi
