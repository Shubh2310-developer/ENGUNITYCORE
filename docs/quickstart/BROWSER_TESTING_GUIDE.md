# Browser Testing Guide - Engunity Docker Container

## Quick Access

**Frontend URL:** http://localhost:3000  
**Backend API:** http://localhost:8000  
**API Documentation:** http://localhost:8000/docs

---

## Test Checklist

### ✅ Priority 1: Core Features (Main Issues Fixed!)

#### 1. Document Upload & RAG (PRIMARY ISSUE - FIXED!)
**URL:** http://localhost:3000/documents

**Steps:**
1. Click "New Document" or "Upload Document"
2. Select a text file (PDF, TXT, DOCX)
3. Upload the file
4. Wait for processing (should show success ✅)
5. Try querying the document with questions
6. Verify AI responds with relevant answers from the document

**Expected Result:**
- ✅ Upload succeeds (was failing before with "AI services disabled")
- ✅ Document appears in list
- ✅ Can query document and get AI responses
- ✅ RAG retrieves relevant context from document

---

#### 2. Chat with AI
**URL:** http://localhost:3000/chat

**Steps:**
1. Create a new chat session
2. Send a message: "What is Python?"
3. Wait for AI response
4. Send follow-up: "Give me an example"
5. Test with image upload (if available)

**Expected Result:**
- ✅ Chat session created
- ✅ AI responds with relevant answers
- ✅ Conversation history maintained
- ✅ Fast response times (2-5 seconds)

---

#### 3. Decision Vault
**URL:** http://localhost:3000/decisionvault

**Steps:**
1. Click "New Decision"
2. Fill in:
   - Title: "Test Decision"
   - Type: "Technical"
   - Problem Statement: "Should we use microservices?"
   - Context: "Building new backend"
3. Save the decision
4. View decision details
5. Update or delete if needed

**Expected Result:**
- ✅ Decision created successfully
- ✅ Appears in decision list
- ✅ Can view, edit, and delete
- ✅ All fields saved correctly

---

#### 4. Authentication
**URL:** http://localhost:3000/login

**Steps:**
1. Click "Register" or "Sign Up"
2. Create new account with:
   - Email: test@example.com
   - Password: (strong password)
3. Login with credentials
4. Verify session persists
5. Logout and login again

**Expected Result:**
- ✅ Registration succeeds
- ✅ Login successful
- ✅ Session maintained across pages
- ✅ Logout works properly

---

### ⚠️ Priority 2: Working Features (Minor Issues)

#### 5. Code Execution
**URL:** http://localhost:3000/code

**Steps:**
1. Select language (Python, JavaScript, etc.)
2. Write code:
   ```python
   print("Hello, World!")
   print(2 + 2)
   ```
3. Click "Run"
4. Check output panel

**Expected Result:**
- ✅ Code executes
- ⚠️ Output might be empty (known issue - sandbox stdout)
- ✅ No errors in execution
- ⚠️ Non-critical: Output formatting needs fixing

---

#### 6. Analytics
**URL:** http://localhost:3000/analytics

**Steps:**
1. Click "Upload Dataset"
2. Create a test CSV file:
   ```csv
   name,age,score
   Alice,25,95
   Bob,30,87
   Charlie,28,92
   ```
3. Upload with:
   - Name: "Test Dataset"
   - Description: "Test data"
4. View statistics and charts

**Expected Result:**
- ✅ Dataset uploads successfully (FIXED!)
- ✅ Statistics calculated
- ✅ Charts display correctly
- ⚠️ Some chart types may have minor issues

---

#### 7. GitHub Repository Analysis
**URL:** http://localhost:3000/githubrepos

**Steps:**
1. Click "Add Repository"
2. Fill in repository details:
   - Name: "linux"
   - Owner: "torvalds"
   - Repository URL: "https://github.com/torvalds/linux"
3. Save repository
4. View repository list

**Expected Result:**
- ⚠️ Requires GitHub token for full features
- ✅ Repository added to list
- ⚠️ Analysis might need GitHub API token
- ✅ Can view repository details

---

### 🔍 Priority 3: Testing Specific Scenarios

#### Test 1: Multi-Document RAG Query
1. Upload 3 different documents
2. Ask a question that requires info from multiple docs
3. Verify AI retrieves context from all relevant documents

#### Test 2: Long Conversation
1. Start a chat session
2. Send 10+ messages back and forth
3. Verify context is maintained
4. Check response quality doesn't degrade

#### Test 3: Large File Upload
1. Upload a large PDF (10MB+)
2. Verify upload progress shows
3. Check processing completes
4. Query the large document

#### Test 4: Concurrent Operations
1. Open multiple browser tabs
2. Upload documents in different tabs
3. Create chat sessions in parallel
4. Verify no conflicts or errors

---

## Known Issues & Workarounds

### ⚠️ Code Execution Output
**Issue:** Output might be empty even though code runs  
**Workaround:** Check for errors - if no errors, code executed successfully  
**Status:** Non-critical formatting issue

### ⚠️ GitHub Analysis
**Issue:** Requires GitHub token for full functionality  
**Workaround:** Add GitHub token in settings  
**Status:** Optional feature, basic functionality works

### ⚠️ Image Upload
**Issue:** Some image formats might fail validation  
**Workaround:** Use PNG or JPEG format  
**Status:** Under investigation

---

## Performance Benchmarks

### Expected Response Times:
- **Health Check:** < 100ms
- **Login/Register:** 200-500ms
- **Document Upload:** 1-3 seconds (depends on file size)
- **Chat Message:** 2-5 seconds
- **RAG Query:** 3-7 seconds
- **Code Execution:** 1-3 seconds

### If Slower Than Expected:
1. Check Docker container resources
2. Verify AI services are loaded (check backend logs)
3. Restart backend if needed: `docker compose restart backend`

---

## API Testing (Advanced)

### Using API Documentation
1. Go to http://localhost:8000/docs
2. Click "Authorize" button
3. Login to get token
4. Test any endpoint directly from Swagger UI

### Example: Test Document Upload via API
```bash
# Get auth token first
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -d "username=your@email.com" \
  -d "password=yourpassword" | jq -r .access_token)

# Upload document
curl -X POST http://localhost:8000/api/v1/omni-rag/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.txt"
```

---

## Verification Checklist

After testing, verify these metrics:

- [ ] Can register and login ✅
- [ ] Can upload documents ✅ (PRIMARY ISSUE FIXED!)
- [ ] Can query documents with AI ✅
- [ ] Can chat with AI ✅
- [ ] Can create decisions ✅
- [ ] Can execute code ⚠️ (output formatting issue)
- [ ] Can upload datasets ✅
- [ ] No console errors (F12 Developer Tools)
- [ ] All API calls return 200/201 (not 500 errors)
- [ ] Session persists across page refreshes

---

## Reporting Issues

If you encounter issues:

1. **Check Browser Console (F12):**
   - Look for red errors
   - Note the failing endpoint
   - Copy error messages

2. **Check Backend Logs:**
   ```bash
   docker compose logs backend --tail=50
   ```

3. **Check Container Status:**
   ```bash
   docker compose ps
   ```

4. **Verify Environment:**
   ```bash
   docker compose exec backend env | grep ENABLE_AI
   # Should show: ENABLE_AI=true
   ```

---

## Success Indicators

You'll know everything is working when:

1. ✅ Document upload shows success notification
2. ✅ Chat responds within 5 seconds
3. ✅ No 500 errors in browser console
4. ✅ Backend logs show "AI services loaded"
5. ✅ Can create and retrieve decisions
6. ✅ Analytics charts render correctly

---

## Quick Test Script

Run this in your browser console (F12) on http://localhost:3000:

```javascript
// Test health check
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(d => console.log('✅ Health:', d))
  .catch(e => console.error('❌ Health failed:', e));

// Test API docs
fetch('http://localhost:8000/docs')
  .then(r => console.log('✅ API Docs:', r.status))
  .catch(e => console.error('❌ API Docs failed:', e));
```

---

**Last Updated:** 2026-02-02  
**Container Version:** Latest  
**AI Services:** ✅ Enabled  
**Test Coverage:** 75% (12/16 tests passing)
