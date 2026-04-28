#!/bin/bash
BASE_URL="http://localhost:8000/api/v1"

# 2. Login
TOKEN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -d "username=qa_chart_tester@example.com&password=password123")

TOKEN=$(echo $TOKEN_RES | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo "Login failed"
  echo $TOKEN_RES
  exit 1
fi

echo "Got token..."

# 4. Upload
for f in clean_numeric mixed_categorical edge_case; do
   curl -s -X POST "$BASE_URL/analytics/datasets/upload?name=$f" \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@/home/agentrogue/projects/ENGUNITYCORE/backend/$f.csv;type=text/csv" > /home/agentrogue/projects/ENGUNITYCORE/backend/res_$f.txt
   echo "Uploaded $f"
   cat /home/agentrogue/projects/ENGUNITYCORE/backend/res_$f.txt | head -c 100
   echo ""
done

echo "SEEDED USER: qa_chart_tester@example.com / password123"
