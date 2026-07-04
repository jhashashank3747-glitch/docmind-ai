# DocMind AI 🧠

An AI-powered multi-PDF question answering system built with the MERN stack and RAG (Retrieval Augmented Generation) architecture.

> Built as a portfolio project to demonstrate RAG architecture, vector databases, and full-stack AI integration.

Live Demo: [Coming Soon](#)

---

## ✨ Features

- **Multi-PDF support** — Upload multiple PDFs and ask questions across all of them simultaneously
- **RAG-powered answers** — Answers are grounded in your actual documents, not hallucinated
- **Source citations** — Every answer shows exactly which document and chunk it came from, expandable inline
- **Chat history** — All conversations are saved and accessible from the sidebar
- **Drag and drop upload** — Clean upload zone with real-time processing status
- **Local embeddings** — Uses Xenova Transformers locally — no external embedding API needed
- **JWT authentication** — Secure signup/login with access/refresh token rotation

---

## 🏗 Architecture

```
UPLOAD PHASE:
PDF file → extract text (pdf-parse) → 
split into 500-word chunks (50-word overlap) → 
generate embeddings (all-MiniLM-L6-v2, 384 dimensions) → 
store vectors in Pinecone with metadata

QUERY PHASE:
User question → generate embedding → 
search Pinecone for top 5 similar chunks → 
send question + chunks to Groq LLaMA → 
return answer + source citations
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework |
| Tailwind CSS | Styling |
| React Router v7 | Client-side routing |
| React Dropzone | Drag and drop file upload |
| Axios | HTTP requests |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Metadata storage (documents, chat history) |
| Pinecone | Vector database for embeddings |
| Xenova Transformers | Local embedding generation (all-MiniLM-L6-v2) |
| Groq SDK (LLaMA 3.1) | LLM for answer generation |
| pdf-parse | PDF text extraction |
| Multer | File upload handling |
| JWT | Authentication |

---

## ⚡ Key Technical Decisions

**Why RAG instead of sending the whole PDF to the LLM?**
LLMs have context window limits — a 100-page PDF can't be sent directly. RAG solves this by finding only the most relevant chunks (via semantic search) and sending those, giving better answers with less token usage.

**Why local embeddings instead of an API?**
Using Xenova Transformers runs the `all-MiniLM-L6-v2` model locally — no API costs, no network dependency, and works in regions where embedding APIs are blocked or unreliable.

**Why 500-word chunks with 50-word overlap?**
500 words captures one complete idea well. The 50-word overlap prevents important context from being lost at chunk boundaries — sentences that span two chunks still appear fully in at least one.

**Why Pinecone over other vector databases?**
Pinecone is fully managed, has a generous free tier, and supports metadata filtering — which lets us filter search results by specific document IDs, enabling true multi-PDF targeted search.

**Why cosine similarity as the metric?**
Cosine similarity measures the angle between vectors (semantic direction) rather than magnitude — making it robust to text length differences between chunks.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)
- Pinecone account (free tier) with an index of 384 dimensions
- Groq API key (free at console.groq.com)

### 1. Clone the repository
```bash
git clone https://github.com/jhashashank3747-glitch/docmind-ai.git
cd docmind-ai
```

### 2. Set up the backend
```bash
cd server
npm install
```

Create a `.env` file inside `server/`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=docmind
HUGGINGFACE_API_KEY=not_needed_using_local
```

Start the backend:
```bash
npm run dev
```

Note: First run will download the embedding model (~30MB). This only happens once.

### 3. Set up the frontend
```bash
cd ../client
npm install
npm run dev
```

### 4. Open the app
Go to `http://localhost:5173` in your browser.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/documents/upload` | Upload and process a PDF |
| GET | `/api/documents` | Get all user documents |
| DELETE | `/api/documents/:id` | Delete document and its vectors |

### Q&A
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/qa/ask` | Ask a question across selected documents |
| GET | `/api/qa/history` | Get all chat histories |
| GET | `/api/qa/history/:id` | Get a specific chat |
| DELETE | `/api/qa/history/:id` | Delete a chat |

---

## 🔄 RAG Pipeline Detail

```
1. PDF Upload
   └── Multer saves file to /uploads
   └── MongoDB document created (status: processing)
   └── Response sent immediately (async processing)

2. Background Processing
   └── pdf-parse extracts raw text
   └── Text split into 500-word chunks (50-word overlap)
   └── Each chunk → Xenova all-MiniLM-L6-v2 → 384-dim vector
   └── Vectors upserted to Pinecone with metadata
   └── MongoDB status updated to 'ready'
   └── PDF file deleted from disk

3. Query
   └── Question → 384-dim embedding
   └── Pinecone similarity search (top 5 chunks, filtered by documentId)
   └── Context built from retrieved chunks
   └── Groq LLaMA generates answer from context
   └── Answer + sources returned to frontend
   └── Conversation saved to MongoDB
```

---

## 🛣 Roadmap

- [ ] Deployment (Vercel + Render)
- [ ] Support for scanned PDFs (OCR)
- [ ] Export chat as PDF
- [ ] Shareable chat links
- [ ] Support for other file types (DOCX, TXT)

---

## 👨‍💻 Author

**Shashank** — [GitHub](https://github.com/jhashashank3747-glitch/docmind-ai)

---