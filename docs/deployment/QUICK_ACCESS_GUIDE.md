# Decision Vault - Quick Access Guide

## 🚀 Instant Access

**Frontend URL**: http://localhost:3000/decisionvault  
**API Base**: http://localhost:8000/api/v1/decisions/  
**Test User**: test@example.com / testpassword123

---

## 📋 Key Features Available Now

### 1. **Create Decisions** 
Click "New Decision" button → Follow 5-step wizard:
- Identity (Title, Type, Problem)
- Context (Background, Constraints)  
- Options (Multiple alternatives)
- Evidence (Link to sources)
- AI Analysis (Get adversarial review)

### 2. **AI Adversarial Analysis**
The system detects:
- ✓ Sunk Cost Fallacy
- ✓ Confirmation Bias / Missing Options
- ✓ Weak Evidence
- ✓ Overconfidence
- ✓ Logical Contradictions

### 3. **Cross-Module Integration**
Convert existing work to decisions:
- From **Chat**: Click "Convert to Decision" button
- From **Research**: Click "Finalize as Decision" button

### 4. **View Modes**
- **Active**: Kanban board (Tentative → Confirmed → Revisited → Deprecated)
- **Timeline**: Chronological decision history
- **Analytics**: Metrics and insights

---

## 🧪 Test It Now

```bash
# Quick API test
curl -X POST http://localhost:8000/api/v1/auth/login \
  -d "username=test@example.com&password=testpassword123"

# Get decisions (replace TOKEN)
curl http://localhost:8000/api/v1/decisions/ \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Current Status

✅ Backend API: 5/5 endpoints functional  
✅ Frontend UI: Fully rendered and interactive  
✅ AI Service: Adversarial analysis working  
✅ Database: PostgreSQL with 2 test decisions  
✅ Cross-Module: Chat & Research integration active

---

## 🎯 Next Steps

1. **Try the UI**: Navigate to http://localhost:3000/decisionvault
2. **Create a Decision**: Use the wizard to make your first decision
3. **Test AI Analysis**: See how it challenges your thinking
4. **Explore Views**: Switch between Active, Timeline, and Analytics

---

**Full Documentation**: See `DECISION_VAULT_VERIFICATION_REPORT.md` for complete details.
