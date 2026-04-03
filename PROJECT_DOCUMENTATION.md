# 📄 Resume AI Analyzer - Complete Project Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [User Flow](#user-flow)
8. [Features](#features)
9. [Installation & Setup](#installation--setup)
10. [Running the Application](#running-the-application)

---

## 🎯 Project Overview

**Resume AI Analyzer** is a web application that helps users analyze their resumes against job descriptions using AI. The system:

- Extracts resume content from PDF files
- Uses AI to analyze skills and competencies
- Matches user skills with job requirements
- Calculates ATS (Applicant Tracking System) scores
- Provides personalized improvement suggestions
- Generates downloadable PDF reports
- Stores user analysis history

**Key Goal:** Empower job seekers to optimize their resumes for specific job positions.

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Streamlit UI  │ (Frontend - app.py)
│   (React-like)  │
└────────┬────────┘
         │ HTTP Requests
         │
┌────────▼─────────────┐
│   Express Backend    │ (Node.js Server)
│   (server.js)        │
└────────┬─────────────┘
         │
    ┌────┴──────┬────────────┬─────────────┐
    │            │            │             │
┌───▼───┐  ┌────▼────┐ ┌────▼────┐ ┌─────▼─────┐
│MongoDB│  │OpenRouter│  │PDF Parse│ │Multer     │
│Data   │  │AI Models │  │Library  │ │File Upload│
└───────┘  └──────────┘  └─────────┘ └───────────┘
```

---

## 💻 Tech Stack

### **Frontend**

- **Streamlit** - Interactive UI framework (Python)
- **Requests** - HTTP client for API calls
- **Python 3.9+**

### **Backend**

- **Node.js** - Runtime environment
- **Express.js** - REST API framework
- **MongoDB** - NoSQL database (Atlas cloud)

### **Libraries & Tools**

| Library        | Purpose                              |
| -------------- | ------------------------------------ |
| `mongoose`     | MongoDB ODM (Object Document Mapper) |
| `bcryptjs`     | Password hashing and security        |
| `jsonwebtoken` | JWT authentication tokens            |
| `multer`       | File upload handling                 |
| `pdf-parse`    | PDF text extraction                  |
| `axios`        | HTTP client                          |
| `dotenv`       | Environment variables management     |

### **External Services**

- **MongoDB Atlas** - Cloud database
- **OpenRouter API** - AI model access (DeepSeek Chat)
- **Puppeteer** - PDF generation (if needed)

---

## 📁 Project Structure

```
resume-ai-analyzer/
├── app.py                      # Streamlit frontend application
├── server.js                   # Express server entry point
├── .env                        # Environment variables (API keys)
├── package.json                # Node.js dependencies
│
├── config/
│   └── db.js                   # MongoDB connection setup
│
├── models/
│   ├── User.js                 # User schema (email, password)
│   └── Resume.js               # Resume data schema
│
├── controllers/
│   ├── authController.js       # Register & Login logic
│   └── resumeController.js     # Resume analysis & report logic
│
├── routes/
│   ├── authRoutes.js           # Auth endpoints
│   └── resumeRoutes.js         # Resume endpoints
│
├── middlewares/
│   └── uploadMiddleware.js     # JWT auth & file upload validation
│
├── services/
│   ├── aiServices.js           # OpenRouter AI integration
│   ├── matchingService.js      # Skill matching logic
│   ├── pdfService.js           # PDF text extraction
│   └── pdfreportService.js     # PDF report generation
│
├── utils/
│   └── errorHandler.js         # Error handling utilities
│
└── uploads/                    # Temporary PDF file storage
```

---

## 🗄️ Database Schema

### **User Collection**

```javascript
{
  _id: ObjectId,
  email: String (required, unique, indexed),
  password: String (hashed with bcryptjs),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### **Resume Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to User),  // Null if anonymous
  fileName: String,
  filePath: String,
  text: String (extracted resume text),
  atsScore: Number (0-100),
  matchedSkills: [String],
  missingSkills: [String],
  suggestions: [String],
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## 🔌 API Endpoints

### **Authentication Endpoints**

#### 1. Register New User

```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "secure_password"
}

Response (201):
{
  "message": "User registered successfully"
}

Response (400):
{
  "message": "User already exists"
}
```

#### 2. Login User

```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "secure_password"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Login successful"
}

Response (401):
{
  "message": "Invalid email or password"
}
```

---

### **Resume Analysis Endpoints**

#### 3. Analyze Resume

```
POST /api/resume/analyze
Authorization: Bearer {token} (optional)
Content-Type: multipart/form-data

Request:
- resume: PDF file
- jobDescription: Text string

Response (200):
{
  "atsScore": 78,
  "matchedSkills": ["Python", "JavaScript", "MongoDB"],
  "missingSkills": ["Docker", "Kubernetes"],
  "suggestions": [
    "Add Docker experience to stand out",
    "Mention Kubernetes projects..."
  ]
}

Response (400):
{
  "message": "Resume file is required"
}
```

#### 4. Get Previous Reports

```
GET /api/resume/reports
Authorization: Bearer {token} (required)

Response (200):
[
  {
    "_id": "ObjectId",
    "fileName": "resume.pdf",
    "atsScore": 78,
    "matchedSkills": ["Python", "JavaScript"],
    "missingSkills": ["Docker"],
    "suggestions": [...],
    "createdAt": "2024-04-03T10:30:00Z"
  },
  ...
]

Response (401):
{
  "message": "Invalid or expired token"
}
```

#### 5. Download PDF Report

```
POST /api/resume/download-report
Content-Type: application/json

Request:
{
  "atsScore": 78,
  "matchedSkills": ["Python", "JavaScript"],
  "missingSkills": ["Docker"],
  "suggestions": [...]
}

Response (200):
- Binary PDF file attachment
```

---

## 👥 User Flow / Journey

### **Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION START                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Login/Register?│
        └────┬────────┬───┘
             │        │
      ┌──────▼──┐  ┌──▼───────┐
      │ Register │  │   Login   │
      └──┬───────┘  └──┬───────┘
         │             │
         ▼             ▼
    ┌────────────────────────┐
    │ Logged In - Home Page  │
    │ (Show User Email)      │
    └────────┬───────────────┘
             │
    ┌────────┴──────────────────┐
    │                           │
    ▼                           ▼
┌──────────────────┐     ┌──────────────────┐
│ Analyze Resume   │     │Load Previous     │
│ - Upload PDF     │     │Reports           │
│ - Enter Job Desc │     │ - Display Tabs   │
│ - Get Analysis   │     │ - View Details   │
└────────┬─────────┘     └──────────────────┘
         │
         ▼
    ┌────────────────────┐
    │ Show Results       │
    │ - ATS Score        │
    │ - Matched Skills   │
    │ - Missing Skills   │
    │ - Suggestions      │
    └────────┬───────────┘
             │
    ┌────────┴──────────┐
    │                   │
    ▼                   ▼
┌──────────────┐  ┌──────────────────┐
│Download PDF  │  │Previous Reports  │
│  Report      │  │Auto-Updates      │
└──────────────┘  │(Real-time)       │
                  └──────────────────┘
```

### **Step-by-Step User Journey**

#### **1. Registration Flow**

```
User → Submits Email & Password
    ↓
Backend → Validates input (email unique, password strong)
    ↓
Backend → Hash password with bcryptjs (10 rounds)
    ↓
Backend → Save to MongoDB
    ↓
Frontend → Show "Registration successful! Please login now"
```

#### **2. Login Flow**

```
User → Submits Email & Password
    ↓
Backend → Find user in MongoDB by email
    ↓
Backend → Compare hashed passwords (bcryptjs)
    ↓
Backend → Generate JWT token (7 days expiry)
    ↓
Frontend → Store token in session state
    ↓
Frontend → Show "✅ Logged In" + email display
```

#### **3. Resume Analysis Flow**

```
User → Upload PDF + Job Description
    ↓
Frontend → Sends to /api/resume/analyze with Auth header
    ↓
Backend → Extract text from PDF using pdf-parse
    ↓
Backend → Send resume text to OpenRouter AI
    ↓
AI → Parse resume → Return JSON with skills, achievements
    ↓
Backend → Send job description to OpenRouter AI
    ↓
AI → Extract job requirements → Return JSON with required skills
    ↓
Backend → MatchingService compares skills
    ↓
Backend → Calculate ATS score based on matching percentage
    ↓
Backend → Get AI suggestions for missing skills
    ↓
Backend → Save report to MongoDB (with userId if logged in)
    ↓
Backend → Auto-fetch updated reports if user is logged in
    ↓
Frontend → Display results + Update previous reports tabs
```

#### **4. View Previous Reports Flow**

```
User → Click "Load Previous Reports"
    ↓
Frontend → GET /api/resume/reports (with token)
    ↓
Backend → Query MongoDB for all reports where userId = currentUser
    ↓
Backend → Return array of reports
    ↓
Frontend → Create tabs for each report (Report 1, Report 2, etc.)
    ↓
Frontend → Display details for each tab:
           - ATS Score
           - Matching Skills
           - Missing Skills
           - Suggestions
```

#### **5. Download PDF Report Flow**

```
User → Click "📥 Download PDF Report"
    ↓
Frontend → POST request with analysis data
    ↓
Backend → Use puppeteer/pdf library to generate PDF
    ↓
Backend → Embed ATS score, skills, suggestions into PDF
    ↓
Backend → Send PDF file back to frontend
    ↓
Frontend → Show "💾 Click to Download PDF" button
    ↓
User → Click download button to save PDF locally
```

#### **6. Logout Flow**

```
User → Click "🚪 Logout"
    ↓
Frontend → Clear token from session state
    ↓
Frontend → Clear user email, analysis results, reports
    ↓
Frontend → Show "Logged out successfully!"
    ↓
Frontend → Rerun to show login form again
```

---

## ✨ Features

### **Authentication & Authorization**

- ✅ User registration with email validation
- ✅ Secure password hashing (bcryptjs)
- ✅ JWT-based authentication (7-day tokens)
- ✅ Session state management in Streamlit
- ✅ Email display when logged in
- ✅ Logout functionality with state cleanup

### **Resume Analysis**

- ✅ PDF file upload with validation
- ✅ AI-powered resume parsing
- ✅ Automatic text extraction from PDFs
- ✅ Skill identification and extraction
- ✅ Job description parsing
- ✅ Skill matching algorithm

### **Scoring & Insights**

- ✅ ATS score calculation (0-100%)
- ✅ Matched skills highlighting
- ✅ Missing skills identification
- ✅ AI-generated improvement suggestions
- ✅ Real-time analysis feedback

### **Report Management**

- ✅ Automatic report saving (logged-in users)
- ✅ Previous reports history with tabs
- ✅ Real-time report updates after analysis
- ✅ Detailed report display (score, skills, suggestions)
- ✅ PDF report generation and download

### **User Experience**

- ✅ Intuitive Streamlit interface
- ✅ Login/Register in sidebar
- ✅ Responsive tab-based report display
- ✅ Error handling and user feedback
- ✅ Loading indicators (spinners)
- ✅ Security indicators (login status, email display)

---

## 🚀 Installation & Setup

### **Prerequisites**

- Node.js (v16 or higher)
- Python 3.9+
- MongoDB Atlas account
- OpenRouter API account
- Git

### **Step 1: Clone & Install**

```bash
# Clone the repository
git clone <repo-url>
cd resume-ai-analyzer

# Create virtual environment (Python)
python -m venv .venv
source .venv/Scripts/activate  # On Windows

# Install Python dependencies
pip install streamlit requests

# Install Node dependencies
npm install
```

### **Step 2: Configure Environment**

Create `.env` file in root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxx.mongodb.net/resume-ai
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
JWT_SECRET=your_secret_key_here
```

### **Step 3: MongoDB Setup**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create a database user
4. Get connection string
5. Whitelist your IP address (0.0.0.0/0 for development)

### **Step 4: OpenRouter API Key**

1. Go to [OpenRouter](https://openrouter.ai)
2. Sign up and get API key
3. Add to `.env` file

---

## ▶️ Running the Application

### **Terminal 1: Start Backend Server**

```bash
# From project root
node server.js

# Expected output:
# ✅ MongoDB Connected Successfully
# 📊 Database: resume-ai
# 🚀 Server running on http://localhost:5000
```

### **Terminal 2: Start Streamlit Frontend**

```bash
# From project root (same virtual environment)
streamlit run app.py

# Expected output:
# Collecting usage statistics. To deactivate, set browser.gatherUsageStats to False.
# You can now view your Streamlit app in your browser.
# Local URL: http://localhost:8501
```

### **Open Application**

- Streamlit Frontend: `http://localhost:8501`
- Backend API: `http://localhost:5000`

---

## 🔄 Data Flow Example

```
┌─────────────────────────── USER PERSPECTIVE ──────────────────────┐
│                                                                    │
│  1. Open app → See login form                                     │
│  2. Register (john@example.com / password123)                     │
│  3. Login → See "✅ Logged In" + email display                    │
│  4. Upload resume.pdf + job description                           │
│  5. Click "Analyze Resume"                                        │
│  6. See results:                                                  │
│     - ATS Score: 78%                                              │
│     - ✅ Matching: Python, JavaScript, REST APIs                 │
│     - ❌ Missing: Docker, Kubernetes                              │
│     - 💡 Add Docker experience...                                 │
│  7. Click "📥 Download PDF Report"                                │
│  8. Download button appears → Save PDF                            │
│  9. Click "Load Previous Reports"                                 │
│  10. See all previous analyses in tabs (auto-updated!)            │
│  11. Click "🚪 Logout" → Return to login form                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── BACKEND PERSPECTIVE ─────────────────────┐
│                                                                      │
│  Registration:                                                      │
│    1. POST /api/auth/register                                       │
│    2. Validate email doesn't exist                                  │
│    3. Hash password (10 rounds)                                     │
│    4. Save User to MongoDB                                          │
│                                                                      │
│  Login:                                                             │
│    1. POST /api/auth/login                                          │
│    2. Find user by email in MongoDB                                 │
│    3. Compare password hash                                         │
│    4. Generate JWT token                                            │
│                                                                      │
│  Resume Analysis:                                                   │
│    1. POST /api/resume/analyze (multipart/form-data)               │
│    2. Extract text from PDF using pdf-parse                         │
│    3. Call OpenRouter API with resume text                          │
│    4. Parse AI response to get skills array                         │
│    5. Call OpenRouter API with job description                      │
│    6. Parse AI response to get requirements                         │
│    7. MatchingService.matchSkills() → get matched/missing           │
│    8. Calculate ATS score (matched% / total requirements)           │
│    9. Call AI for suggestions on missing skills                     │
│    10. Save Resume document to MongoDB with userId                  │
│    11. Auto-fetch all reports if logged in                          │
│    12. Return JSON to frontend                                      │
│                                                                      │
│  Get Reports:                                                       │
│    1. GET /api/resume/reports (with JWT token)                      │
│    2. Verify JWT token                                              │
│    3. Query MongoDB: Resume.find({ userId: currentUser })           │
│    4. Return array of previous reports                              │
│                                                                      │
│  Generate PDF:                                                      │
│    1. POST /api/resume/download-report (with report data)           │
│    2. Use puppeteer to create PDF                                   │
│    3. Embed analysis data (score, skills, suggestions)              │
│    4. Send PDF file back to frontend                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Key Improvements Made

1. **Auth Middleware** ✅
   - Added optional auth to `/analyze` route
   - User reports saved with `userId` for personalization
   - Removed duplicate login/register code from controllers

2. **Real-time Updates** ✅
   - Previous reports auto-fetch after new analysis
   - No need to logout/login to see new reports
   - Improved user experience

3. **Professional UI** ✅
   - Tab-based previous reports display
   - User email display when logged in
   - Logout button with state cleanup
   - Proper error messages (duplicate user, invalid credentials)

4. **PDF Download** ✅
   - Single-click PDF generation
   - One download button (not repeated)
   - Proper report data structure

---

## 🛡️ Security Features

| Feature             | Implementation              |
| ------------------- | --------------------------- |
| Password Hashing    | bcryptjs (10 rounds)        |
| JWT Tokens          | 7-day expiry                |
| Email Validation    | Unique constraint in DB     |
| Authorization       | JWT verification middleware |
| File Upload         | Multer with PDF validation  |
| CORS                | Express CORS handling       |
| Environment Secrets | Dotenv for API keys         |

---

## 📈 Future Enhancements

- [ ] OAuth integration (Google, LinkedIn)
- [ ] File size limits
- [ ] Rate limiting
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Resume templates
- [ ] Skill recommendations from industry data
- [ ] Resume version comparison
- [ ] Collaborative features (share reports)
- [ ] Advanced analytics dashboard
- [ ] Mobile app version

---

## 🤝 Support & Troubleshooting

### **MongoDB Connection Error**

- Ensure IP is whitelisted in MongoDB Atlas
- Check connection string in `.env`
- Verify network connectivity

### **API Key Issues**

- Confirm OpenRouter API key is valid
- Check rate limits haven't been exceeded
- Verify API key in `.env` is correct

### **PDF Upload Fails**

- Ensure file is valid PDF format
- Check file size isn't too large
- Verify multer middleware is configured

### **Reports Not Saving**

- Ensure user is logged in
- Check MongoDB connection
- Verify token is being sent in header

---

## 📝 Notes

- All timestamps are in UTC format
- JWT tokens expire after 7 days
- PDFs are generated from analysis data (not stored)
- Previous reports are stored indefinitely
- File uploads are temporarily stored in `/uploads` directory

---

**Last Updated:** April 3, 2026
**Version:** 1.0.0
