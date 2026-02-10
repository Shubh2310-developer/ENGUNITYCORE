# GitHub Repos Feature - Implementation Prompt

**Use this prompt with an AI assistant to implement the GitHub Repos feature end-to-end**

---

## 🎯 Master Implementation Prompt

Copy and paste this prompt to an AI coding assistant (Claude, ChatGPT, Cursor, etc.) to implement all missing features:

---

```
I need you to implement the missing features for the GitHub Repository Intelligence feature in my Engunity application. I have comprehensive documentation at /home/agentrogue/Engunity/docs/Githubrepos/ that contains all the details.

## Context

My application is a full-stack AI platform with:
- **Backend**: FastAPI (Python) at /home/agentrogue/Engunity/backend/
- **Frontend**: Next.js (TypeScript/React) at /home/agentrogue/Engunity/frontend/
- **Databases**: PostgreSQL (metadata), MongoDB (AI analysis), Redis (cache)
- **Storage**: Supabase (optional file storage)

## Current Status

The GitHub Repos feature is 80% complete. The following are working:
- ✅ User authentication with JWT
- ✅ Repository CRUD (Create, Read) - GET and POST endpoints
- ✅ Repository listing with search/filter/sort in frontend
- ✅ Repository details view with 6-tab UI
- ✅ Mock AI analysis storage in MongoDB
- ✅ Simulated sandbox execution
- ✅ Full frontend UI (931 lines in page.tsx)

The following are MISSING and need implementation:
- ❌ GitHub API integration for importing repos
- ❌ AI tool endpoint (/ai-tool)
- ❌ Bulk analysis endpoint (/bulk/analyze)
- ❌ Update repository endpoint (PUT)
- ❌ Delete repository endpoint (DELETE)
- ❌ Real AI analysis (currently mocked)

## Documentation Available

Please read these files in this order:
1. /home/agentrogue/Engunity/docs/Githubrepos/README.md - Overview and navigation
2. /home/agentrogue/Engunity/docs/Githubrepos/GITHUB_REPOS_COMPLETE_GUIDE.md - Complete implementation guide with all the code
3. /home/agentrogue/Engunity/docs/Githubrepos/IMPLEMENTATION_CHECKLIST.md - Track what needs to be done

## What I Need You To Do

### Phase 1: Essential Features (Priority)

1. **GitHub API Integration**
   - Install PyGithub: `pip install PyGithub`
   - Create `/home/agentrogue/Engunity/backend/app/services/github/__init__.py`
   - Create `/home/agentrogue/Engunity/backend/app/services/github/client.py`
   - Implement the GitHubClient class (code is in the Complete Guide, Section: "Adding Real GitHub Integration")
   - Test GitHub API connection

2. **Import Repository Endpoint**
   - Add POST `/api/v1/githubrepos/import` endpoint to `/home/agentrogue/Engunity/backend/app/api/v1/githubrepos.py`
   - Implementation code is in Complete Guide, Section: "Missing Features & Implementation Guide" -> "POST /api/v1/githubrepos/import"
   - Fetch repo data from GitHub API
   - Store in PostgreSQL and MongoDB
   - Test with real GitHub repos

3. **AI Tool Endpoint**
   - Add POST `/api/v1/githubrepos/{repo_id}/ai-tool` endpoint
   - Implementation code is in Complete Guide, Section: "Missing Features & Implementation Guide" -> "POST /api/v1/githubrepos/{id}/ai-tool"
   - Support 4 tool types: explain, trace, bottleneck, dead_code
   - Return AI-generated analysis
   - Test all tool types

4. **Bulk Analysis Endpoint**
   - Add POST `/api/v1/githubrepos/bulk/analyze` endpoint
   - Implementation code is in Complete Guide, Section: "Missing Features & Implementation Guide" -> "POST /api/v1/githubrepos/bulk/analyze"
   - Accept array of repo IDs
   - Trigger analysis for each
   - Return status for all

5. **Update and Delete Endpoints**
   - Add PUT `/api/v1/githubrepos/{repo_id}` endpoint
   - Add DELETE `/api/v1/githubrepos/{repo_id}` endpoint
   - Implementation code is in Complete Guide, Section: "Missing Features & Implementation Guide"
   - Clean up MongoDB data on delete
   - Test update and delete operations

### Phase 2: Enhanced Features (If Time Permits)

6. **Real AI Analysis**
   - Create `/home/agentrogue/Engunity/backend/app/services/github/analyzer.py`
   - Implement GitHubAnalyzer class
   - Implementation code is in Complete Guide, Section: "Real AI Analysis Implementation"
   - Use Groq API for real code analysis
   - Update analyze endpoint to use real analyzer
   - Test with various repository types

7. **Update Frontend (if needed)**
   - Verify frontend service calls work with new endpoints
   - Test import functionality in UI
   - Test AI tools in Code Intelligence tab
   - Test bulk analysis

## Requirements

- Follow the exact implementation code provided in the Complete Guide
- Maintain the existing code structure and patterns
- Use the existing authentication system (JWT)
- Store metadata in PostgreSQL, analysis in MongoDB
- Add proper error handling and validation
- Test each endpoint after implementation
- Update requirements.txt if adding new dependencies

## Environment Variables Needed

Ensure these are in `/home/agentrogue/Engunity/backend/.env`:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/engunity
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379/0
GROQ_API_KEY=your_groq_key
GITHUB_TOKEN=ghp_your_github_token  # Get from https://github.com/settings/tokens
SECRET_KEY=your_secret_key
```

## Testing

After implementation, test using these commands (from Complete Guide):

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpassword123" \
  | jq -r '.access_token')

# Test import
curl -X POST http://localhost:8000/api/v1/githubrepos/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "fastapi",
    "repo_name": "fastapi"
  }' | jq

# Test AI tool
curl -X POST "http://localhost:8000/api/v1/githubrepos/REPO_ID/ai-tool?tool_type=explain" \
  -H "Authorization: Bearer $TOKEN" | jq

# Test bulk analysis
curl -X POST http://localhost:8000/api/v1/githubrepos/bulk/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"repo_ids": ["id1", "id2"]}' | jq
```

## Success Criteria

The implementation is successful when:
- [ ] Can import real GitHub repositories using GitHub API
- [ ] All 4 AI tools work (explain, trace, bottleneck, dead_code)
- [ ] Bulk analysis processes multiple repos
- [ ] Update and delete endpoints work correctly
- [ ] All tests pass
- [ ] Frontend UI works with new endpoints
- [ ] No breaking changes to existing functionality

## Notes

- All implementation code is provided in the Complete Guide - you don't need to write from scratch
- Follow the existing code patterns in `/home/agentrogue/Engunity/backend/app/api/v1/githubrepos.py`
- The frontend already has service functions defined, just need backend to work
- Use background tasks for long-running operations if needed
- Add proper logging and error handling

## Documentation Reference

- Complete implementation code: Section "Missing Features & Implementation Guide" in GITHUB_REPOS_COMPLETE_GUIDE.md
- API examples: Section "API Documentation" in GITHUB_REPOS_COMPLETE_GUIDE.md
- Testing guide: Section "Testing Guide" in GITHUB_REPOS_COMPLETE_GUIDE.md
- Troubleshooting: Section "Troubleshooting" in GITHUB_REPOS_COMPLETE_GUIDE.md

Please implement Phase 1 features first, then move to Phase 2 if time permits. Let me know when each feature is complete so I can test it.
```

---

## 🎯 Alternative: Phase-by-Phase Prompts

If you prefer to implement features one at a time, use these individual prompts:

---

### Prompt 1: GitHub API Integration

```
I need to implement GitHub API integration for my Engunity application.

## Task
Set up PyGithub and create a GitHubClient service to fetch repository data from GitHub.

## Location
- Create: /home/agentrogue/Engunity/backend/app/services/github/__init__.py
- Create: /home/agentrogue/Engunity/backend/app/services/github/client.py

## Reference
The complete implementation code is in:
/home/agentrogue/Engunity/docs/Githubrepos/GITHUB_REPOS_COMPLETE_GUIDE.md
Section: "Adding Real GitHub Integration" -> "Step 2: Create GitHub Service"

## Requirements
1. Install PyGithub: `pip install PyGithub`
2. Create GitHubClient class with methods:
   - get_repository_info(owner, repo_name)
   - get_file_tree(owner, repo_name)
   - get_file_content(owner, repo_name, file_path)
   - get_recent_commits(owner, repo_name)
   - _get_language_color(language)
3. Support both authenticated and unauthenticated requests
4. Handle GitHub API errors gracefully

## Environment
Add to .env: GITHUB_TOKEN=ghp_your_token

## Testing
After implementation, test with:
```python
from app.services.github.client import github_client
info = github_client.get_repository_info("fastapi", "fastapi")
print(info)
```

Please implement this following the code in the Complete Guide.
```

---

### Prompt 2: Import Repository Endpoint

```
I need to add an import repository endpoint to fetch repos from GitHub.

## Task
Add POST /api/v1/githubrepos/import endpoint to allow importing repos from GitHub.

## Location
File: /home/agentrogue/Engunity/backend/app/api/v1/githubrepos.py

## Reference
Complete implementation code is in:
/home/agentrogue/Engunity/docs/Githubrepos/GITHUB_REPOS_COMPLETE_GUIDE.md
Section: "Missing Features & Implementation Guide" -> "POST /api/v1/githubrepos/import"

## Requirements
1. Accept owner, repo_name, optional github_token
2. Use GitHubClient to fetch repo info from GitHub
3. Check for duplicates
4. Store in PostgreSQL (GitHubRepository model)
5. Store file tree in MongoDB (repo_analysis collection)
6. Return created repository object
7. Handle authentication (JWT required)
8. Proper error handling

## Testing
```bash
TOKEN="your_jwt_token"
curl -X POST http://localhost:8000/api/v1/githubrepos/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"owner": "fastapi", "repo_name": "fastapi"}' | jq
```

Please implement following the exact code in the Complete Guide.
```

---

### Prompt 3: AI Tool Endpoint

```
I need to add an AI tool endpoint for code analysis tools.

## Task
Add POST /api/v1/githubrepos/{repo_id}/ai-tool endpoint with 4 tool types.

## Location
File: /home/agentrogue/Engunity/backend/app/api/v1/githubrepos.py

## Reference
Complete implementation code is in:
/home/agentrogue/Engunity/docs/Githubrepos/GITHUB_REPOS_COMPLETE_GUIDE.md
Section: "Missing Features & Implementation Guide" -> "POST /api/v1/githubrepos/{repo_id}/ai-tool"

## Requirements
1. Accept repo_id and tool_type query parameter
2. Support 4 tool types:
   - explain: Code explanation
   - trace: Execution trace
   - bottleneck: Performance audit
   - dead_code: Dead code detection
3. Return analysis result with title and content
4. Log tool execution to MongoDB (ai_logs collection)
5. Require JWT authentication
6. Verify repository belongs to user

## Testing
```bash
TOKEN="your_jwt_token"
REPO_ID="your_repo_id"
curl -X POST "http://localhost:8000/api/v1/githubrepos/$REPO_ID/ai-tool?tool_type=explain" \
  -H "Authorization: Bearer $TOKEN" | jq
```

The frontend already calls this endpoint, so implement exactly as shown in the guide.
```

---

### Prompt 4: Bulk Analysis Endpoint

```
I need to add a bulk analysis endpoint to analyze multiple repos at once.

## Task
Add POST /api/v1/githubrepos/bulk/analyze endpoint.

## Location
File: /home/agentrogue/Engunity/backend/app/api/v1/githubrepos.py

## Reference
Complete implementation code is in:
/home/agentrogue/Engunity/docs/Githubrepos/GITHUB_REPOS_COMPLETE_GUIDE.md
Section: "Missing Features & Implementation Guide" -> "POST /api/v1/githubrepos/bulk/analyze"

## Requirements
1. Accept array of repo_ids in request body
2. Loop through each repo_id
3. Verify each repo belongs to current user
4. Trigger analysis for each (or queue as background task)
5. Return status for each repo (queued, error, not found)
6. Return summary (total, queued count)
7. Log bulk analysis event to MongoDB
8. Require JWT authentication

## Testing
```bash
TOKEN="your_jwt_token"
curl -X POST http://localhost:8000/api/v1/githubrepos/bulk/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"repo_ids": ["id1", "id2", "id3"]}' | jq
```

Frontend already calls this, implement as shown in the guide.
```

---

### Prompt 5: Update and Delete Endpoints

```
I need to add update and delete endpoints for repositories.

## Task
Add PUT and DELETE endpoints for repository management.

## Location
File: /home/agentrogue/Engunity/backend/app/api/v1/githubrepos.py

## Reference
Complete implementation code is in:
/home/agentrogue/Engunity/docs/Githubrepos/GITHUB_REPOS_COMPLETE_GUIDE.md
Section: "Missing Features & Implementation Guide" -> "PUT /api/v1/githubrepos/{repo_id}" and "DELETE"

## Requirements

### PUT /api/v1/githubrepos/{repo_id}
1. Accept repo_id and GitHubRepositoryUpdate schema
2. Verify repo belongs to user
3. Update only provided fields
4. Return updated repository

### DELETE /api/v1/githubrepos/{repo_id}
1. Accept repo_id
2. Verify repo belongs to user
3. Delete from PostgreSQL
4. Delete analysis data from MongoDB
5. Return success message

## Testing
```bash
TOKEN="your_jwt_token"
REPO_ID="your_repo_id"

# Update
curl -X PUT "http://localhost:8000/api/v1/githubrepos/$REPO_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}' | jq

# Delete
curl -X DELETE "http://localhost:8000/api/v1/githubrepos/$REPO_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Implement following the code in the Complete Guide.
```

---

### Prompt 6: Real AI Analysis (Advanced)

```
I need to implement real AI analysis using Groq API instead of mock data.

## Task
Create GitHubAnalyzer service for real code analysis and update the analyze endpoint.

## Location
- Create: /home/agentrogue/Engunity/backend/app/services/github/analyzer.py
- Update: /home/agentrogue/Engunity/backend/app/api/v1/githubrepos.py (analyze endpoint)

## Reference
Complete implementation code is in:
/home/agentrogue/Engunity/docs/Githubrepos/GITHUB_REPOS_COMPLETE_GUIDE.md
Section: "Real AI Analysis Implementation"

## Requirements
1. Create GitHubAnalyzer class
2. Implement analyze_repository() method
3. Use Groq API to analyze code structure
4. Perform security audit
5. Calculate quality score
6. Store results in MongoDB
7. Update quality_score in PostgreSQL
8. Use GitHub API to fetch code samples

## Environment
Ensure GROQ_API_KEY is set in .env

## Testing
```bash
TOKEN="your_jwt_token"
REPO_ID="your_repo_id"
curl -X POST "http://localhost:8000/api/v1/githubrepos/$REPO_ID/analyze" \
  -H "Authorization: Bearer $TOKEN" | jq

# Check MongoDB for real analysis results
mongosh
> use engunity
> db.repo_analysis.findOne({repo_id: "your_repo_id"})
```

This will replace mock analysis with real AI-powered insights.
```

---

## 📋 Prompt Usage Guide

### For Complete Implementation (Recommended)
Use the **Master Implementation Prompt** - it covers all Phase 1 features in one go.

### For Step-by-Step Implementation
Use **Phase-by-Phase Prompts** (Prompts 1-6) in order:
1. GitHub API Integration (foundation)
2. Import Endpoint (uses #1)
3. AI Tool Endpoint (independent)
4. Bulk Analysis (uses analyze endpoint)
5. Update/Delete (CRUD completion)
6. Real AI Analysis (enhancement)

### Tips for Using These Prompts

1. **Always reference the documentation path**: `/home/agentrogue/Engunity/docs/Githubrepos/`
2. **Specify exact file locations**: Helps AI understand project structure
3. **Include testing commands**: Verify implementation works
4. **Mention existing code**: AI can maintain consistency
5. **Set clear success criteria**: Know when you're done

---

## 🚀 Quick Start

Copy this into your AI assistant:

```
I have comprehensive documentation for implementing GitHub Repos feature at:
/home/agentrogue/Engunity/docs/Githubrepos/

Please read /home/agentrogue/Engunity/docs/Githubrepos/GITHUB_REPOS_COMPLETE_GUIDE.md
and implement all missing features listed in Section "Missing Features & Implementation Guide".

Start with Phase 1 (Essential Features):
1. GitHub API Integration
2. Import Repository Endpoint
3. AI Tool Endpoint
4. Bulk Analysis Endpoint
5. Update/Delete Endpoints

All implementation code is provided in the guide. Follow it exactly and test each feature after implementation.
```

---

## ✅ Success Checklist

After using these prompts, you should have:
- [ ] PyGithub installed and configured
- [ ] GitHub API integration working
- [ ] Can import real GitHub repos
- [ ] AI tools endpoint working (4 tools)
- [ ] Bulk analysis endpoint working
- [ ] Update/delete endpoints working
- [ ] All tests passing
- [ ] Frontend UI working with new endpoints

---

**Ready to implement? Copy the Master Implementation Prompt above and paste it into your AI assistant!**
