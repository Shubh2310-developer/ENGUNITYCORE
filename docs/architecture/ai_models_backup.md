# ==========================================
# AI Models Backup Manifest (Updated)
# (ai_models_backup.md)
# ==========================================
# UPDATED: 2026-04-08 (Post-Relocation Audit)
# PURPOSE: Track all AI model files in the NEW root-level structure.
# ==========================================

## ⚠️ Critical Warning
These files are git-ignored and MUST be manually backed up.

---

## 📦 Model Files & Locations

### YOLOv8 Object Detection Model
| File | Location | Status |
|------|----------|--------|
| `yolov8n.pt` | `./yolov8n.pt` (Root) | ✅ FOUND |
| `yolov8n.pt` | `backend/yolov8n.pt` | ✅ FOUND |

**Download Command:**
```bash
python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

---

### FlashRank Reranker (ONNX)
| File | Location | Status |
|------|----------|--------|
| `flashrank-*.onnx` | `~/.cache/flashrank/` | 🔄 AUTO-DOWNLOADS |

**Note:** FlashRank usually caches models in your home directory or a local cache folder. The library handles this automatically.

---

### Vector Store Indices (FAISS & Pickle)
| File | Location | Status |
|------|----------|--------|
| `index.faiss` | `backend/app/storage/vector_store/` | ✅ FOUND |
| `bm25.pkl` | `backend/app/storage/vector_store/` | ❌ MISSING (Rebuild needed) |
| `metadata.pkl` | `backend/app/storage/vector_store/` | ❌ MISSING (Rebuild needed) |

**Regeneration Command:**
These files are built from your documentation. To regenerate the missing `.pkl` files, run:
```bash
cd backend
python3 -c "from app.storage.vector_store import VectorStoreManager; vs = VectorStoreManager(); vs.rebuild()"
```
*Or run the ingestion script if available:*
```bash
python3 scripts/init_db.py
```

---

## 🔁 Quick Backup Command
```bash
mkdir -p ~/MODEL_BACKUP/$(date +%Y-%m-%d)
cp yolov8n.pt ~/MODEL_BACKUP/$(date +%Y-%m-%d)/
cp backend/yolov8n.pt ~/MODEL_BACKUP/$(date +%Y-%m-%d)/yolov8n_backend.pt
cp -r backend/app/storage/vector_store/ ~/MODEL_BACKUP/$(date +%Y-%m-%d)/vector_store/
echo "Backup complete: ~/MODEL_BACKUP/$(date +%Y-%m-%d)/"
```
