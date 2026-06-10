#!/bin/bash
# Reorganization script for ENGUNITYCORE workspace
set -e

WORKSPACE_DIR="/home/agentrogue/projects/ENGUNITYCORE"
cd "$WORKSPACE_DIR"

echo "📂 Starting repository reorganization..."

# 1. Ensure target directories exist
mkdir -p docs/papers
mkdir -p docs/reports/research-paper
mkdir -p docs/reports/summaries
mkdir -p docs/reports/security
mkdir -p docs/architecture
mkdir -p docs/fixes
mkdir -p docs/testing
mkdir -p docs/ai-agents
mkdir -p logs
mkdir -p scripts/maintenance
mkdir -p scripts/testing
mkdir -p backend/exercises
mkdir -p backend/tests/fixtures
mkdir -p backend/database
mkdir -p tests/load

# 2. Reorganize ROOT directory files

echo "📄 Moving PDF research papers and formats to docs/papers/..."
for f in "10326.pdf" \
         "2022-PPNA-Asurveyonsecurityinconsensusandsmartcontracts.pdf" \
         "B_Tech_M_Tech__Report_Format_Latex.pdf" \
         "BlackBook Cotent.pdf" \
         "Blockchain-based_Decentralized_Application_A_Surve.pdf" \
         "Ethereum-A-Secure-Decentralised-Generalised-Transaction-Ledger-Yellow-Paper.pdf" \
         "IPFS-Based_Blockchain_Solution_for_Secure_and_Effi.pdf"; do
    if [ -f "$f" ]; then
        mv "$f" docs/papers/
        echo "   ✓ Moved $f to docs/papers/"
    fi
done

echo "📦 Moving Latex folders and zips to docs/reports/research-paper/..."
for f in "B.Tech_M.Tech._Report_Format_Latex (1)" \
         "B.Tech_M.Tech._Report_Format_Latex (1).zip" \
         "conference-latex-template (2)"; do
    if [ -e "$f" ]; then
        mv "$f" docs/reports/research-paper/
        echo "   ✓ Moved $f to docs/reports/research-paper/"
    fi
done

echo "📦 Moving old reports to docs/reports/summaries/..."
for f in "olld_report" "olld_report.zip"; do
    if [ -e "$f" ]; then
        mv "$f" docs/reports/summaries/
        echo "   ✓ Moved $f to docs/reports/summaries/"
    fi
done

echo "📝 Moving root markdown documents to appropriate docs/ folders..."
# Architecture docs
for f in "CHAT_ARCHITECTURE.md" "chat_system_dependency_map.md" "ai_models_backup.md"; do
    if [ -f "$f" ]; then
        mv "$f" docs/architecture/
        echo "   ✓ Moved $f to docs/architecture/"
    fi
done

# Fixes docs
for f in "CHAT_STORAGE_FIX_REPORT.md"; do
    if [ -f "$f" ]; then
        mv "$f" docs/fixes/
        echo "   ✓ Moved $f to docs/fixes/"
    fi
done

# Security docs
for f in "SECURITY_AUDIT_REPORT.md"; do
    if [ -f "$f" ]; then
        mv "$f" docs/reports/security/
        echo "   ✓ Moved $f to docs/reports/security/"
    fi
done

# Verification & testing docs
for f in "VERIFICATION_CODE_TEAM.md" "VERIFICATION_E2E.md" "VERIFICATION_LOCAL.md"; do
    if [ -f "$f" ]; then
        mv "$f" docs/testing/
        echo "   ✓ Moved $f to docs/testing/"
    fi
done

# Prompts docs
for f in "prompt.md"; do
    if [ -f "$f" ]; then
        mv "$f" docs/ai-agents/
        echo "   ✓ Moved $f to docs/ai-agents/"
    fi
done

# Recovery reports
for f in "recovery_report.md"; do
    if [ -f "$f" ]; then
        mv "$f" docs/reports/summaries/
        echo "   ✓ Moved $f to docs/reports/summaries/"
    fi
done

echo "📂 Moving root script files to appropriate script subdirectories..."
if [ -f "project_scout.py" ]; then
    mv "project_scout.py" scripts/maintenance/
    echo "   ✓ Moved project_scout.py to scripts/maintenance/"
fi
if [ -f "test_coding_team.py" ]; then
    mv "test_coding_team.py" scripts/testing/
    echo "   ✓ Moved test_coding_team.py to scripts/testing/"
fi

echo "📋 Moving root log files to logs/..."
for f in "backend.log" "frontend.log" "frontend_new.log" "nohup.out"; do
    if [ -f "$f" ]; then
        mv "$f" logs/
        echo "   ✓ Moved $f to logs/"
    fi
done

echo "📋 Moving root SQL fixes to docs/fixes/..."
if [ -f "supabase_rls_fix.sql" ]; then
    mv "supabase_rls_fix.sql" docs/fixes/
    echo "   ✓ Moved supabase_rls_fix.sql to docs/fixes/"
fi

echo "📋 Moving root text files to docs/reports/summaries/..."
for f in "kiro_test.txt" "rigorous_audit_results.txt"; do
    if [ -f "$f" ]; then
        mv "$f" docs/reports/summaries/
        echo "   ✓ Moved $f to docs/reports/summaries/"
    fi
done

echo "🛡️ Handling duplicate / root DB & weight files..."
if [ -f "yolov8n.pt" ]; then
    mv "yolov8n.pt" backend/yolov8n.pt
    echo "   ✓ Overwrote backend/yolov8n.pt with root copy"
fi
if [ -f "test.db" ]; then
    mv "test.db" backend/test_root_backup.db
    echo "   ✓ Backed up root test.db to backend/test_root_backup.db"
fi
if [ -f "test_turbo_quant_integration.db" ]; then
    mv "test_turbo_quant_integration.db" backend/test_turbo_quant_integration_root_backup.db
    echo "   ✓ Backed up root test_turbo_quant_integration.db to backend/test_turbo_quant_integration_root_backup.db"
fi


# 3. Reorganize BACKEND directory files

echo "⚙️ Organizing backend/ directory..."

# Algorithms/exercises
for f in "MultithreadingExample.java" "fibonacci.cpp" "palindrome.cpp" "two_sum.go" "two_sum.py" "solution.py"; do
    if [ -f "backend/$f" ]; then
        mv "backend/$f" backend/exercises/
        echo "   ✓ Moved backend/$f to backend/exercises/"
    fi
done

# Migration SQL / scripts
for f in "add_provider_column.py" \
         "alembic_migration_analytics.sql" \
         "add_decision_idempotency_columns.sql" \
         "add_performance_indexes.sql" \
         "migration_fix_columns.py"; do
    if [ -f "backend/$f" ]; then
        mv "backend/$f" backend/database/
        echo "   ✓ Moved backend/$f to backend/database/"
    fi
done

# Backend logs/run files
for f in "backend.log" "uvicorn.log" "vllm.log"; do
    if [ -f "backend/$f" ]; then
        mv "backend/$f" logs/backend_${f}
        echo "   ✓ Moved backend/$f to logs/backend_${f}"
    fi
done

# Backend test utilities
for f in "test_auth_fallback.py" "test_chat_sessions.py" "test_jwt.py" "test_vllm_fallback.py"; do
    if [ -f "backend/$f" ]; then
        mv "backend/$f" backend/tests/
        echo "   ✓ Moved backend/$f to backend/tests/"
    fi
done

if [ -f "backend/check_users.py" ]; then
    mv "backend/check_users.py" scripts/maintenance/check_users_backend.py
    echo "   ✓ Moved backend/check_users.py to scripts/maintenance/check_users_backend.py"
fi

# Performance/Load testing tools
for f in "load_test.js" "k6_after.json" "baseline_metrics.json" "quality_metrics.jsonl" "perf_baseline.py"; do
    if [ -f "backend/$f" ]; then
        mv "backend/$f" tests/load/
        echo "   ✓ Moved backend/$f to tests/load/"
    fi
done

# Monitoring files to infra/monitoring/
for f in "monitoring_commands.sh" "monitoring_dashboard.py"; do
    if [ -f "backend/$f" ]; then
        mv "backend/$f" infra/monitoring/
        echo "   ✓ Moved backend/$f to infra/monitoring/"
    fi
done

# CSV datasets and results to fixtures
for f in "clean_numeric.csv" "edge_case.csv" "mixed_categorical.csv" \
         "res_clean_numeric.txt" "res_edge_case.txt" "res_mixed_categorical.txt"; do
    if [ -f "backend/$f" ]; then
        mv "backend/$f" backend/tests/fixtures/
        echo "   ✓ Moved backend/$f to backend/tests/fixtures/"
    fi
done


# 4. Reorganize FRONTEND directory files

echo "🎨 Organizing frontend/ directory..."
if [ -f "frontend/frontend.log" ]; then
    mv "frontend/frontend.log" frontend/logs/
    echo "   ✓ Moved frontend/frontend.log to frontend/logs/"
fi
if [ -f "frontend/tsc_output.txt" ]; then
    mv "frontend/tsc_output.txt" frontend/logs/
    echo "   ✓ Moved frontend/tsc_output.txt to frontend/logs/"
fi
if [ -f "frontend/test.db" ]; then
    mv "frontend/test.db" backend/tests/integration/test_frontend_backup.db
    echo "   ✓ Backed up frontend/test.db to backend/tests/integration/test_frontend_backup.db"
fi
if [ -f "frontend/yolov8n.pt" ]; then
    rm "frontend/yolov8n.pt"
    echo "   ✓ Removed duplicate yolov8n.pt in frontend/"
fi

# 5. Update index files
echo "📝 Reorganization execution finished successfully!"
