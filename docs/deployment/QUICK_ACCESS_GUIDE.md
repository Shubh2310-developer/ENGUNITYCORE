# Decision Vault - Quick Access Guide

## 🚀 Instant Access

**Frontend URL**: http://localhost:3000/decisionvault  
**API Base**: http://localhost:8000/api/v1/decisions/  
**Test User**: test@example.com / testpassword123

---

## 📋 Key Features Available Now

### 1. **Create Decisions**
Click "New Decision" button → Follow the **7-step wizard**:
1. **Identity** — Title, Category (type), Initial Confidence
2. **Context** — Problem Statement and background
3. **Options** — Minimum 2 alternatives with effort & risk levels
4. **Evidence** — Attach evidence manually or via "Scan Project" (simulated AI context linker)
5. **Analysis** — Tradeoff Matrix (6-dimension sliders: 1–5)
6. **AI Review** — Adversarial review of biases and logical gaps (calls `/api/v1/decisions/analyze`)
7. **Resolution** — Final option selection, rationale, privacy, status, and revisit rule

### 2. **AI Adversarial Analysis**
The backend `DecisionAIService` detects:
- ✓ Sunk Cost Fallacy
- ✓ Confirmation Bias / Missing Options
- ✓ Weak Evidence (high confidence + zero primary sources)
- ✓ Optimism Bias in Tradeoff Matrix
- ✓ Logical Contradictions

> **Note:** AI Review is triggered automatically when transitioning from Step 5 → Step 6
> (`nextStep()` calls `generateAIFlags()` at `currentStep === 5`). AI flags are
> displayed in Step 6 and also visible in the decision detail drawer post-creation.

### 3. **Cross-Module Integration**
Convert existing work to decisions:
- From **Chat**: Navigates to `/decisionvault?source=chat&title=...&problem=...`
- From **Research**: Navigates to `/decisionvault?source=research&title=...&context=...`
- From **Code**: Navigates to `/decisionvault?source=code&...`
- The wizard auto-prefills Identity and Context from URL query parameters.

### 4. **View Modes**
- **Active**: Kanban board (Tentative → Confirmed → Revisited → Deprecated)
- **Timeline**: Chronological decision history
- **Analytics**: Decision Velocity, Evidence Quality, Reversal Rate, Category Distribution

### 5. **Post-Creation Analysis (Detail Drawer)**
Click any decision card to open the detail drawer, which provides:
- **STAR Breakdown** — Client-side template generation using stored decision fields (Situation, Task, Action, Result). *Not an LLM call; uses structured field interpolation.*
- **ADR Export** — Generates a copyable Markdown Architecture Decision Record from decision fields. *Copy-to-clipboard only; no file download or GitHub commit.*

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
✅ Frontend UI: Fully rendered and interactive (7-step wizard)  
✅ AI Service: Adversarial analysis via `/api/v1/decisions/analyze`  
✅ Database: PostgreSQL (`decisions` table via SQLAlchemy)  
✅ Cross-Module: Chat & Research context passing active  
⚠️ Evidence "Project Scan": Returns mock/simulated data (not a live codebase scan)  
⚠️ ADR Export: Copy-to-clipboard only (no file download or GitHub integration)  
⚠️ STAR Analysis: Client-side template interpolation (not a separate AI call)

---

## 🎯 Next Steps

1. **Try the UI**: Navigate to http://localhost:3000/decisionvault
2. **Create a Decision**: Use the 7-step wizard to make your first decision
3. **Test AI Analysis**: Step 6 will adversarially challenge your reasoning
4. **Explore Views**: Switch between Active, Timeline, and Analytics

---

**Full Documentation**: See `docs/testing/DECISION_VAULT_VERIFICATION_REPORT.md` for the E2E verification report.  
**Feature Guide**: See `docs/features/decision-vault/decisionvault.md` for the complete design specification.
