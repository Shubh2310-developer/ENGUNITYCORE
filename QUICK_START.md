# ⚡ Quick Start - Engunity

## Start Everything (One Command)

```bash
npm run dev
```

That's it! This single command starts:
- ✅ Backend API (Port 8000)
- ✅ Frontend App (Port 3000)

## Access Your App

**Chat Interface:**
http://localhost:3000/chat

**API Documentation:**
http://localhost:8000/docs

**Memory Profile:**
http://localhost:8000/api/v1/memory/profile

## What's Running

### Backend Features (Automatic)
- 🧠 Semantic chunking for documents
- 👁️ Image processing with CLIP + YOLO + OCR
- 💾 Memory system (saves conversations)
- 📊 Quality evaluation (RAGAS)
- 🔍 Hybrid search (Vector + BM25)

### Frontend Features
- 💬 Real-time chat with streaming
- 🖼️ Image upload and analysis
- 📄 Document management
- 📊 Analytics dashboard
- 💻 Code lab with AI assistance

## First Time Setup

If this is your first time:

```bash
# 1. Install root dependencies
npm install

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Backend dependencies are already installed
# (llama-index, transformers, paddleocr, etc.)

# 4. Start everything
npm run dev
```

## Test New Features

### 1. Test Memory System
- Open http://localhost:3000/chat
- Say: "I prefer Python for AI development"
- Start a new chat
- Ask: "What programming languages do I like?"
- Memory will recall your preference!

### 2. Test Vision Processing
- Upload an image in chat
- Ask: "Describe this image"
- Try: "What's in the top-right corner?"

### 3. Test Semantic Chunking
- Upload a document
- Ask questions about it
- Notice improved accuracy

## Troubleshooting

**Port already in use?**
```bash
# Kill port 8000
lsof -ti:8000 | xargs kill -9

# Kill port 3000
lsof -ti:3000 | xargs kill -9

# Then restart
npm run dev
```

**Need to restart?**
- Press `Ctrl+C` to stop
- Run `npm run dev` again

## Environment Variables

Make sure `.env` exists in the root with:
```env
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
DATABASE_URL=postgresql://...
MONGODB_URL=mongodb://...
```

## Performance Note

**First startup:** 30-60 seconds (loading AI models)
**Subsequent startups:** 5-10 seconds (models cached)

## Success Indicators

You'll see:
```
[BACKEND] INFO:     Uvicorn running on http://0.0.0.0:8000
[FRONTEND] ✓ Ready in 2.3s
[FRONTEND] - Local: http://localhost:3000
```

## 🎉 Ready!

Your ChatGPT-level AI chat is now running!

**Full docs:** See `STARTUP_GUIDE.md` for details
