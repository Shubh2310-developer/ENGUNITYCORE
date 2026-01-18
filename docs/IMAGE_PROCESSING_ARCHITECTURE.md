# 🖼️ Multi-Modal Vision Architecture (SOTA Fusion)

This document outlines the advanced, production-grade vision pipeline implemented in Engunity. It moves beyond simple image descriptions to provide true **Spatial Grounding** and **Contextual Fusion** optimized for local hardware (RTX 4050 / 6GB VRAM).

---

## 🏗️ Vision Pipeline Workflow

The Engunity vision engine uses a staged, multi-model approach to extract the maximum amount of semantic information from any image.

### Stage 1: Fast Synchronous Validation
- **MIME & Integrity Check**: Uses magic bytes and PIL to ensure file safety.
- **Privacy Stripping**: Automatically removes EXIF data (GPS, camera serials) before storage.
- **Supabase Upload**: Original image is stored securely with Row-Level Security (RLS).

### Stage 2: Parallel SOTA Fusion (Background)
Once uploaded, the system triggers an asynchronous processing chain:

1.  **Scene Understanding (Gemini 2.0 Flash)**:
    - Generates a high-level natural language description of the entire image context.
2.  **Object Detection (YOLOv8-nano)**:
    - Identifies specific entities (people, cars, devices, etc.) with high precision.
    - Optimized for low VRAM usage (6GB friendly).
3.  **Spatial Layout Analysis**:
    - A custom geometric engine maps YOLO bounding boxes to 5 spatial regions: **Top, Bottom, Left, Right, Center**.
    - Result: "In the center: laptop. In the top: person."
4.  **OCR Extraction (EasyOCR)**:
    - Extracts printed text, code snippets, and numbers from the image.
    - Specifically tuned to identify code blocks for technical assistance.

### Stage 3: Semantic Indexing
The fused results (Description + Objects + Layout + Text) are combined into a single text block and indexed into the **HNSW Vector Store**. This enables:
- **Image-to-Text Search**: "Find that screenshot where I had the database error."
- **Contextual Recall**: The AI "remembers" visual details from previous turns in the chat.

---

## 🛠️ Implementation Details

### Spatial Grounding Logic
Located in `backend/app/services/ai/image_processor.py`, the `_generate_layout_summary` method converts raw coordinates into human-readable spatial context:

```python
# Regional Mapping Logic
if cy < height / 3: regions["top"].append(label)
elif cy > 2 * height / 3: regions["bottom"].append(label)
# ... etc
```

### Visual Context Block
The LLM receives visual information in a structured format:
```text
[Visual Context 1]: Image (screenshot.png) [Tags: laptop, monitor, code]:
Description: A desk with a laptop showing a code editor.
Spatial Layout: In the center: laptop. In the top: monitor.
Extracted Text: def main(): print("hello world")
```

---

## 📉 Performance & Resource Tuning

| Component | Model | VRAM Usage | Latency |
| :--- | :--- | :--- | :--- |
| **Object Detection** | YOLOv8-nano | ~0.5 GB | ~15ms |
| **OCR** | EasyOCR | ~1.0 GB | ~200ms |
| **Scene Analysis**| Gemini 2.0 | 0 GB (Cloud API) | ~1.5s |
| **Total Pipeline** | **Integrated** | **~1.5 GB** | **~2s** |

---

*Status: **Fully Integrated & Optimized for RTX 4050***
*Last Updated: 2026-01-17*
