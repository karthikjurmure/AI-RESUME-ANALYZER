# 📄 AI Resume Analyzer

A powerful, AI-driven tool for analyzing resumes against job descriptions to provide ATS scores, skill gap analysis, and professional suggestions.

## 🚀 Project Flow

The application follows a modular workflow between the frontend, backend, and AI intelligence layers:

### 1. User Interaction (Frontend)
- **Framework:** Streamlit (Python)
- **Features:**
    - Optional User Authentication (Login/Register).
    - PDF Resume Upload & Job Description input.
    - Real-time status polling for AI analysis.
    - PDF report export functionality.

### 2. File Handling & Authentication (Backend)
- **Framework:** Express.js (Node.js)
- **Storage:** Persisted in MongoDB for logged-in users.
- **Auto-Provisioning:** Automatically ensures `uploads/` directory exists at startup.

### 3. Data Extraction (Services)
- **PDF Extraction:** Uses `pdf-parse` for fast text conversion.
- **AI Orchestration:**
    - Uses **DeepSeek (via OpenRouter)** to extract structured skills from both the resume and JD.
    - Performs an initial "Categorical Extraction" to identify both deep technical tools and broad domain skills.

### 4. Matching Logic (The Hybrid Engine)
The project supports two high-performance matching strategies:

#### A. Direct Node.js Semantic Matching (Default)
- Uses **Transformers.js** with the `all-MiniLM-L6-v2` model directly inside the Node.js backend.
- Performs local vector embedding comparison (Cosine Similarity) for millisecond matching speeds.

#### B. External Python ML Service (Optional)
- A separate **FastAPI** service (`services/mlService.py`) for specialized NLP tasks.
- Can be run independently to handle high-concurrency semantic math.

### 5. Enhancement & Audit
- **Link Auditor:** AI-driven verification of portfolios, LinkedIn, and certificates for professionalism and security.
- **Suggestions:** Context-aware improvement tips based on specific skill gaps found during analysis.

---

## 🛠 Tech Stack

- **Frontend:** [Streamlit](https://streamlit.io/)
- **Backend:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Machine Learning:** [Transformers.js](https://github.com/xenova/transformers.js) & [Sentence-Transformers](https://www.sbert.net/)
- **Database:** [MongoDB](https://www.mongodb.com/)
- **AI Intelligence:** [OpenRouter API](https://openrouter.ai/) (DeepSeek V3 / Gemini 1.5 Pro)

---

## 📦 Local Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (Running locally or via Atlas)

### 2. Setup .env
Create a `.env` file in the root with:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
OPENROUTER_API_KEY=your_openrouter_key
```

### 3. Install Dependencies
```bash
# Node dependencies
npm install

# Python dependencies
pip install -r requirements.txt
```

### 4. Running the Application

**Run the Backend:**
```bash
cd backend
node server.js
```

**Run the Frontend:**
```bash
# From the root directory
streamlit run frontend/app.py
```

**(Optional) Run the Python ML Service:**
```bash
# From the root directory
uvicorn ml-service.mlService:app --reload --port 8000
```

---


