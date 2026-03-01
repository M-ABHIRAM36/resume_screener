<div align="center">

# 📄 Resume Screening & Career Guidance System

### AI-Powered Resume Analysis, Skill Gap Detection & Personalized Career Roadmaps

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![spaCy](https://img.shields.io/badge/spaCy-NLP-09A3D5?style=for-the-badge&logo=spacy&logoColor=white)](https://spacy.io)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

**A full-stack AI platform** that automates resume screening for HR teams and provides personalized career guidance for candidates — powered by NLP, BERT embeddings, TF-IDF analysis, and intelligent scoring algorithms.

[Features](#-features) •
[Architecture](#-system-architecture) •
[Quick Start](#-quick-start--local-setup) •
[API Reference](#-api-reference) •
[Contributing](#-contributing)

---

<img src="docs/screenshots/landing-preview.png" alt="Landing Page" width="700" />

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
  - [High-Level Architecture](#high-level-architecture)
  - [Data Flow](#data-flow)
  - [Tech Stack](#tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start / Local Setup](#-quick-start--local-setup)
  - [Prerequisites](#prerequisites)
  - [Step 1 — Clone the Repository](#step-1--clone-the-repository)
  - [Step 2 — ML Service (Python)](#step-2--ml-service-python)
  - [Step 3 — Backend (Node.js)](#step-3--backend-nodejs)
  - [Step 4 — Frontend (React)](#step-4--frontend-react)
  - [Running All Services](#running-all-services)
- [Usage Guide](#-usage-guide)
  - [Candidate Portal](#candidate-portal)
  - [HR Portal](#hr-portal)
- [Module Descriptions](#-module-descriptions)
  - [ML Service — Python FastAPI](#1-ml-service--python-fastapi)
  - [Backend — Node.js Express](#2-backend--nodejs-express)
  - [Frontend — React + Vite](#3-frontend--react--vite)
- [Scoring Algorithm](#-scoring-algorithm)
  - [Match Percentage Calculation](#match-percentage-calculation)
  - [Overall Score Calculation](#overall-score-calculation)
  - [Category Scores](#category-scores)
  - [Quality Bonus Factors](#quality-bonus-factors)
  - [Labels & Ratings](#labels--ratings)
- [API Reference](#-api-reference)
  - [ML Service Endpoints](#ml-service-endpoints-port-8000)
  - [Backend Endpoints](#backend-endpoints-port-5000)
- [Resume Parsing Pipeline](#-resume-parsing-pipeline)
- [Skill Extraction Engine](#-skill-extraction-engine)
- [Roadmap Image Integration](#-roadmap-image-integration)
- [Data Files Reference](#-data-files-reference)
- [Frontend Pages & Components](#-frontend-pages--components)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
  - [Contribution Guidelines](#contribution-guidelines)
  - [Development Workflow](#development-workflow)
  - [Code Style](#code-style)
  - [Pull Request Template](#pull-request-template)
- [Contributors](#-contributors)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## ✨ Features

### 🏢 HR Portal
| Feature | Description |
|---------|-------------|
| **Batch Resume Upload** | Upload & analyze up to 200 resumes simultaneously (PDF/DOCX) |
| **Intelligent Scoring** | 5-category scoring: Skill Match, Experience, Projects, Keywords, Education |
| **Advanced Filtering** | Filter by skills, location, college, experience, match percentage + 15+ filter types |
| **Candidate Ranking** | Auto-ranked candidates with sortable table view |
| **Job Management** | Create/manage job listings with required skills |
| **JWT Authentication** | Secure HR login/signup with JWT tokens |
| **Expandable Skills** | View all extracted skills per candidate in the dashboard table |
| **Quick Presets** | One-click filter presets for common screening scenarios |

### 👤 Candidate Portal
| Feature | Description |
|---------|-------------|
| **Resume Score Evaluation** | Get a realistic ATS-style score with detailed breakdown |
| **5-Category Breakdown** | Skill Match, Experience, Projects, Keywords, Education — each scored individually |
| **Circular Score Displays** | SVG-animated score rings with color-coded results |
| **Bonus Factor Detection** | Projects, achievements, publications, leadership, internships, portfolio |
| **Skill Gap Analysis** | Priority-ranked missing skills: Critical, Important, Nice-to-Have |
| **Area Strength Analysis** | Visual category bars showing weak vs strong areas |
| **Learning Roadmap** | Personalized 4-phase roadmap: Foundation → Core → Practice → Job-Ready |
| **Visual Career Roadmaps** | 80+ downloadable roadmap images for different career paths |
| **Custom Job Description** | Paste any JD — auto-detects 50+ skill keywords |
| **Extracted Profile** | Shows parsed name, email, phone, experience, college, degree, location |

### 🤖 AI / ML Capabilities
| Feature | Description |
|---------|-------------|
| **spaCy NER** | Named entity recognition for person names and organizations |
| **BERT Embeddings** | Sentence-transformers (`all-MiniLM-L6-v2`) for semantic resume-job similarity |
| **TF-IDF Matching** | Keyword relevance scoring using scikit-learn TF-IDF vectorizer |
| **Smart Skill Extraction** | 180+ skills from knowledge base + 80+ canonical variation mappings |
| **Section-Aware Parsing** | Experience extraction respects resume section boundaries |
| **College Detection** | Two-pass extraction: prefers B.Tech/M.Tech institutions, skips 10th/12th schools |
| **Indian Phone Support** | Regex patterns for Indian (+91), US (+1), and generic phone formats |
| **Portfolio Detection** | Auto-detects GitHub, LinkedIn, and personal website links |

---

## 🏗 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                   │
│                                                                             │
│   ┌─────────────┐   ┌─────────────┐   ┌──────────────┐   ┌──────────────┐  │
│   │  Landing     │   │  Candidate  │   │  HR Dashboard│   │  Auth Pages  │  │
│   │  Page        │   │  Portal     │   │  + Filters   │   │  Login/Signup│  │
│   └──────┬──────┘   └──────┬──────┘   └──────┬───────┘   └──────┬───────┘  │
│          │                 │                  │                   │          │
└──────────┼─────────────────┼──────────────────┼───────────────────┼──────────┘
           │                 │                  │                   │
           ▼                 ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND (Vite, Port 5173)                        │
│                                                                             │
│   ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │
│   │ App.jsx  │  │ api.js    │  │ Pages/   │  │Components/│  │ Data/     │  │
│   │ Router   │  │ GET/POST  │  │ 8 pages  │  │ 6 shared  │  │ job_roles │  │
│   └──────────┘  └─────┬─────┘  └──────────┘  └───────────┘  └───────────┘  │
│                       │                                                     │
└───────────────────────┼─────────────────────────────────────────────────────┘
                        │  HTTP (fetch)
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   NODE.JS BACKEND (Express, Port 5000)                      │
│                                                                             │
│   ┌──────────────┐  ┌───────────────┐  ┌────────────────┐  ┌────────────┐  │
│   │ HR Auth      │  │ HR Resume     │  │ HR Dashboard   │  │ Candidate  │  │
│   │ Controller   │  │ Controller    │  │ Controller     │  │ Controller │  │
│   │ JWT signup/  │  │ multer upload │  │ mock data gen  │  │ single     │  │
│   │ login        │  │ up to 200     │  │ filtering      │  │ analysis   │  │
│   └──────────────┘  └───────┬───────┘  └────────────────┘  └──────┬─────┘  │
│                             │                                      │        │
│                     ┌───────┴──────────────────────────────────────┘        │
│                     ▼                                                       │
│            ┌─────────────────┐   ┌──────────────────┐                       │
│            │  mlService.js   │   │ mockMlService.js  │                       │
│            │  FormData proxy │   │ Synthetic data    │                       │
│            └────────┬────────┘   └──────────────────┘                       │
│                     │                                                       │
└─────────────────────┼───────────────────────────────────────────────────────┘
                      │  HTTP (axios + FormData)
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  PYTHON ML SERVICE (FastAPI, Port 8000)                      │
│                                                                             │
│   ┌──────────────┐  ┌───────────────┐  ┌────────────────┐  ┌────────────┐  │
│   │ routes.py    │  │ resume_       │  │ skill_         │  │ scorer.py  │  │
│   │ /analyze-    │  │ parser.py     │  │ extractor.py   │  │ BERT +     │  │
│   │ resumes      │  │ PDF/DOCX      │  │ 180+ skills    │  │ TF-IDF     │  │
│   │ endpoint     │  │ extraction    │  │ extraction     │  │ scoring    │  │
│   └──────────────┘  └───────────────┘  └────────────────┘  └────────────┘  │
│                                                                             │
│   ┌──────────────┐  ┌───────────────┐  ┌────────────────┐                   │
│   │ schemas.py   │  │ main.py       │  │ data/          │                   │
│   │ Pydantic     │  │ FastAPI app   │  │ skills.json    │                   │
│   │ models       │  │ entry point   │  │ 180+ skills    │                   │
│   └──────────────┘  └───────────────┘  └────────────────┘                   │
│                                                                             │
│   NLP Models: spaCy (en_core_web_sm) + sentence-transformers                │
│               (all-MiniLM-L6-v2) + scikit-learn TF-IDF                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
                    ┌─────────────────────────────────────┐
                    │      CANDIDATE FLOW                   │
                    │                                       │
                    │   Upload Resume (PDF/DOCX)            │
                    │          │                             │
                    │          ▼                             │
                    │   Select Job Role / Paste JD          │
                    │          │                             │
                    │          ▼                             │
                    │   POST /candidate/analyze              │
                    │          │                             │
                    │          ▼                             │
                    │   Backend → ML Service                 │
                    │          │                             │
                    │          ▼                             │
                    │   ┌─────────────────────────┐         │
                    │   │ 1. Parse PDF/DOCX       │         │
                    │   │ 2. Extract text          │         │
                    │   │ 3. Extract: name, email  │         │
                    │   │    phone, experience,    │         │
                    │   │    college, skills        │         │
                    │   │ 4. Match skills vs JD    │         │
                    │   │ 5. BERT similarity       │         │
                    │   │ 6. TF-IDF keywords       │         │
                    │   │ 7. Quality bonus check   │         │
                    │   │ 8. Compute final score   │         │
                    │   └────────────┬────────────┘         │
                    │                │                       │
                    │                ▼                       │
                    │   Return: score, matchedSkills,       │
                    │   missingSkills, categoryScores,       │
                    │   bonusFactors, extracted profile      │
                    │                │                       │
                    │                ▼                       │
                    │   Navigate to Score / SkillGap /      │
                    │   Roadmap pages                        │
                    └─────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │         HR FLOW                        │
                    │                                       │
                    │   Login (JWT) → Select/Create Job     │
                    │          │                             │
                    │          ▼                             │
                    │   Upload up to 200 Resumes             │
                    │          │                             │
                    │          ▼                             │
                    │   POST /hr/resumes                     │
                    │          │                             │
                    │          ▼                             │
                    │   Same ML pipeline for each resume    │
                    │          │                             │
                    │          ▼                             │
                    │   Apply filters (skill, location,     │
                    │   college, experience, match%)         │
                    │          │                             │
                    │          ▼                             │
                    │   Return ranked candidate list        │
                    │   with scores and details              │
                    └─────────────────────────────────────┘
```

### Tech Stack

#### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.2 | UI component library |
| **React Router DOM** | 6.14 | Client-side routing |
| **Vite** | 5.x | Build tool & dev server |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **PostCSS** | 8.x | CSS processing |
| **Autoprefixer** | 10.x | Cross-browser CSS prefixes |

#### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 16+ | Server runtime |
| **Express** | 4.18 | HTTP framework |
| **Multer** | 1.x | File upload middleware |
| **Axios** | 1.x | HTTP client for ML service |
| **JSON Web Token** | 9.x | Authentication |
| **CORS** | 2.x | Cross-origin resource sharing |
| **Form-Data** | 4.x | Multipart form data builder |

#### ML Service
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.10+ | Language runtime |
| **FastAPI** | 0.95+ | Web framework |
| **Uvicorn** | 0.22+ | ASGI server |
| **spaCy** | 3.5+ | NLP — NER, tokenization |
| **sentence-transformers** | 2.2+ | BERT embeddings (`all-MiniLM-L6-v2`) |
| **scikit-learn** | 1.2+ | TF-IDF vectorizer, cosine similarity |
| **pdfplumber** | 0.7+ | PDF text extraction (layout-aware) |
| **python-docx** | 0.8+ | DOCX text extraction |
| **PyPDF2** | 3.0+ | Fallback PDF reader |
| **python-multipart** | 0.0+ | Multipart file upload support |
| **NumPy** | 1.x | Numerical operations |
| **PyTorch** | 1.12+ | Deep learning backend for BERT |

---

## 📁 Project Structure

```
resume-screening-project/
│
├── 📄 README.md                          ← You are here
├── 📄 package.json                       ← Frontend dependencies & scripts
├── 📄 vite.config.js                     ← Vite configuration
├── 📄 tailwind.config.cjs                ← Tailwind CSS configuration
├── 📄 postcss.config.cjs                 ← PostCSS configuration
├── 📄 index.html                         ← HTML entry point
│
├── 📂 src/                               ← REACT FRONTEND SOURCE
│   ├── 📄 main.jsx                       ← App entry (React 18 createRoot)
│   ├── 📄 App.jsx                        ← Router + layout + navigation
│   ├── 📄 api.js                         ← API helper (GET/POST to localhost:5000)
│   ├── 📄 index.css                      ← Global styles (Tailwind layers)
│   │
│   ├── 📂 pages/
│   │   ├── 📄 landing.jsx                ← Landing page (hero + role selection)
│   │   │
│   │   ├── 📂 auth/
│   │   │   ├── 📄 Login.jsx              ← HR login form
│   │   │   ├── 📄 Signup.jsx             ← HR signup form
│   │   │   └── 📄 RoleSelect.jsx         ← Role selection page
│   │   │
│   │   ├── 📂 candidate/
│   │   │   ├── 📄 Dashboard.jsx          ← Job selection + resume upload (314 lines)
│   │   │   ├── 📄 ResumeScore.jsx        ← Score report + category breakdown (272 lines)
│   │   │   ├── 📄 SkillGap.jsx           ← Gap analysis + priority ranking (237 lines)
│   │   │   └── 📄 Roadmap.jsx            ← Learning plan + roadmap images (342 lines)
│   │   │
│   │   └── 📂 hr/
│   │       └── 📄 Dashboard.jsx          ← HR dashboard + filters + table (732 lines)
│   │
│   ├── 📂 components/
│   │   ├── 📄 CandidateCard.jsx          ← Candidate summary card (HR view)
│   │   ├── 📄 FilterPanel.jsx            ← 15+ filter options for HR
│   │   ├── 📄 ProgressBar.jsx            ← Animated progress bar
│   │   ├── 📄 ResumeUpload.jsx           ← Drag & drop file uploader
│   │   ├── 📄 RoadmapTimeline.jsx        ← Vertical timeline component
│   │   ├── 📄 ScoreBadge.jsx             ← Gradient score badge
│   │   └── 📄 SkillBadge.jsx             ← Skill chip component
│   │
│   └── 📂 data/
│       └── 📄 job_roles.json             ← Job roles + required skills + roadmap steps (731 lines)
│
├── 📂 public/
│   └── 📂 roadmaps/                      ← 80+ career roadmap PNG images
│       ├── 📷 backend.png
│       ├── 📷 frontend.png
│       ├── 📷 full-stack.png
│       ├── 📷 react.png
│       ├── 📷 python.png
│       ├── 📷 machine-learning.png
│       ├── 📷 devops.png
│       └── 📷 ... (80+ more)
│
├── 📂 backend/                           ← NODE.JS BACKEND
│   ├── 📄 package.json                   ← Backend dependencies
│   ├── 📄 server.js                      ← HTTP server (port 5000)
│   ├── 📄 app.js                         ← Express app + route mounting
│   │
│   ├── 📂 controllers/
│   │   ├── 📄 hrAuthController.js        ← Signup/login with JWT
│   │   ├── 📄 hrJobController.js         ← Job CRUD + auto-generate up to 50
│   │   ├── 📄 hrResumeController.js      ← Batch resume upload + ML analysis
│   │   ├── 📄 hrDashboardController.js   ← Mock dashboard data + filtering
│   │   ├── 📄 hrDebugController.js       ← ML service health check
│   │   └── 📄 candidateController.js     ← Single resume analysis for candidates
│   │
│   ├── 📂 routes/
│   │   ├── 📄 hrAuthRoutes.js            ← POST /signup, /login
│   │   ├── 📄 hrJobRoutes.js             ← POST /, GET /, GET /:id
│   │   ├── 📄 hrResumeRoutes.js          ← POST / (multer, 200 files max)
│   │   ├── 📄 hrDashboardRoutes.js       ← GET /:jobId
│   │   ├── 📄 hrDebugRoutes.js           ← GET /check-ml
│   │   └── 📄 candidateRoutes.js         ← POST /analyze (multer, 1 file)
│   │
│   ├── 📂 services/
│   │   ├── 📄 mlService.js               ← ML service HTTP client (FormData proxy)
│   │   └── 📄 mockMlService.js           ← Synthetic candidate data generator
│   │
│   ├── 📂 data/
│   │   ├── 📄 hr_users.json              ← Stored HR accounts
│   │   ├── 📄 jobs.json                  ← Created job listings
│   │   ├── 📄 dummyColleges.json         ← College names for mock data
│   │   └── 📄 dummyLocations.json        ← Location names for mock data
│   │
│   └── 📂 uploads/                       ← Uploaded resume files (gitignored)
│
├── 📂 ml-service/                        ← PYTHON ML SERVICE
│   ├── 📄 requirements.txt              ← Python dependencies
│   │
│   ├── 📂 app/
│   │   ├── 📄 main.py                   ← FastAPI app entry point
│   │   ├── 📄 routes.py                 ← Main endpoint + all extraction logic (1304 lines)
│   │   ├── 📄 schemas.py                ← Pydantic response models
│   │   ├── 📄 scorer.py                 ← BERT + TF-IDF scoring engine
│   │   ├── 📄 skill_extractor.py        ← Skill extraction with 80+ variations
│   │   └── 📄 resume_parser.py          ← PDF/DOCX text extraction
│   │
│   └── 📂 data/
│       └── 📄 skills.json               ← 180+ skill knowledge base
│
└── 📂 docs/                             ← DOCUMENTATION
    ├── 📄 README.md                     ← Academic project documentation (432 lines)
    ├── 📄 system_architecture.html       ← System architecture document
    ├── 📄 system_architecture_ppt.html   ← Architecture presentation
    └── 📄 data_flow_diagrams.html        ← Data flow diagrams
```

---

## 🚀 Quick Start / Local Setup

### Prerequisites

Make sure you have the following installed on your system:

| Tool | Version | Check Command | Download |
|------|---------|---------------|----------|
| **Node.js** | 16+ | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | 8+ | `npm --version` | Comes with Node.js |
| **Python** | 3.10+ | `python --version` | [python.org](https://www.python.org/downloads/) |
| **pip** | 22+ | `pip --version` | Comes with Python |
| **Git** | 2.x | `git --version` | [git-scm.com](https://git-scm.com) |

### Step 1 — Clone the Repository

```bash
# Clone the project
git clone https://github.com/your-username/resume-screening-project.git

# Navigate to the project directory
cd resume-screening-project
```

### Step 2 — ML Service (Python)

The ML service is the AI brain of the platform. Set it up first since other services depend on it.

```bash
# Navigate to ML service directory
cd ml-service

# Create a Python virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# On Windows (CMD):
.\.venv\Scripts\activate.bat

# On macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Download the spaCy English model
python -m spacy download en_core_web_sm

# Start the ML service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Started reloader process
```

> **⏱️ First-time startup note:** The first run will download the `all-MiniLM-L6-v2` sentence-transformer model (~80 MB). This only happens once and may take 1-2 minutes depending on your internet speed.

> **💡 Verify:** Open `http://localhost:8000/docs` to see the FastAPI Swagger UI.

### Step 3 — Backend (Node.js)

Open a **new terminal** (keep ML service running):

```bash
# Navigate to backend directory
cd backend

# Install Node.js dependencies
npm install

# Start the backend server
node server.js

# You should see:
# Server running on port 5000
```

> **💡 Verify:** Open `http://localhost:5000` — you should see `{"message":"Resume Screening Backend (HR)"}`

### Step 4 — Frontend (React)

Open another **new terminal** (keep both ML service and backend running):

```bash
# Navigate to project root (not backend!)
cd resume-screening-project

# Install frontend dependencies
npm install

# Start the Vite dev server
npm run dev

# You should see:
#   VITE v5.x  ready in XXX ms
#   ➜  Local:   http://localhost:5173/
```

> **💡 Open:** Navigate to `http://localhost:5173` in your browser.

### Running All Services

You need **3 terminals** running simultaneously:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   Terminal 1 (ML Service):                                   │
│   cd ml-service                                              │
│   .\.venv\Scripts\Activate.ps1                               │
│   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 │
│                                                ✅ Port 8000  │
│                                                              │
│   Terminal 2 (Backend):                                      │
│   cd backend                                                 │
│   node server.js                                             │
│                                                ✅ Port 5000  │
│                                                              │
│   Terminal 3 (Frontend):                                     │
│   npm run dev                                                │
│                                                ✅ Port 5173  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Quick Verification Checklist

- [ ] `http://localhost:8000/docs` — FastAPI Swagger docs load
- [ ] `http://localhost:5000` — Backend responds with JSON
- [ ] `http://localhost:5000/hr/debug/check-ml` — ML connectivity check passes
- [ ] `http://localhost:5173` — React app loads with landing page

---

## 📖 Usage Guide

### Candidate Portal

1. **Open the app** → Click **"Login as Candidate"** on the landing page
2. **Select a target job role** from the dropdown (e.g., "Frontend Developer") or click **"Paste Job Description"** to paste a custom JD
3. **Upload your resume** (PDF or DOCX, max 10 MB)
4. **Click "Analyze Resume"** — wait for the AI analysis

You'll be navigated to the **Resume Score** page:

| Page | What You See |
|------|-------------|
| **Resume Score** | Overall score (0-100), job match %, 5-category breakdown bars, bonus factors, matched/missing skills, extracted profile |
| **Skill Gap** | Coverage %, priority-ranked missing skills (Critical/Important/Nice-to-Have), weak areas with inline progress bars |
| **Roadmap** | Personalized 4-phase learning plan (Foundation → Core → Practice → Job-Ready) + full career roadmap image |

### HR Portal

1. **Sign up** → Create an HR account with company name, email, password
2. **Login** → Authenticate with JWT
3. **Create a job** or **select an existing role**
4. **Upload resumes** (batch upload up to 200 files)
5. **View ranked candidates** → Sort, filter, and compare
6. **Use filters** → Filter by skills, location, experience, match percentage, and more

---

## 📦 Module Descriptions

### 1. ML Service — Python FastAPI

The ML service is the core intelligence layer responsible for all resume analysis.

#### `routes.py` (1,304 lines)

The largest file in the project. Contains:

| Function / Section | Lines | Purpose |
|---|---|---|
| **Regex Patterns** | 1-50 | Compiled patterns for email, phone (IN/US/generic), URLs |
| **`extract_name_from_text()`** | ~60-120 | spaCy NER → PERSON entities, title-case heuristics, fallback extraction |
| **`extract_email()`** | ~120-140 | Regex extraction of email addresses |
| **`extract_phone()`** | ~140-175 | Multi-format phone extraction (Indian +91, US +1, generic) |
| **`extract_portfolio_links()`** | ~175-220 | GitHub, LinkedIn, personal website detection |
| **`count_internships()`** | ~220-260 | Keyword counting for intern/internship mentions |
| **`extract_experience_years()`** | ~260-380 | Section-aware extraction: "X years of experience", date ranges, year counting |
| **`extract_location()`** | ~380-440 | Strict whitelist matching against Indian cities/states |
| **`extract_branch()`** | ~440-480 | Branch/specialization from degree (CSE, ECE, IT, etc.) |
| **`extract_degree()`** | ~480-535 | Degree detection (B.Tech, M.Tech, BCA, MCA, BE, ME, etc.) |
| **`extract_college_smart()`** | ~536-670 | Two-pass college extraction — skips 10th/12th schools, prefers university-level B.Tech/M.Tech institutions |
| **Quality signal detection** | ~670-800 | Projects, achievements, publications, leadership, technical depth, top institutes, portfolio |
| **Scoring logic** | ~800-990 | Match percentage, overall score, category scores, labels |
| **`POST /analyze-resumes`** | ~998-1304 | Main endpoint: file handling, orchestration, response building |

#### `scorer.py`

```python
# Lazy-loaded sentence-transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# BERT semantic similarity between resume text and job description
semantic_similarity(resume_text, job_description) → float [0, 1]

# TF-IDF keyword overlap
keyword_similarity(resume_text, job_description) → float [0, 1]

# Combined score
compute_score(resume_text, job_description, skill_scores) → float [0, 1]
#   Weights: Skills 45%, BERT 40%, TF-IDF 15%
```

#### `skill_extractor.py`

```python
# 80+ canonical variation mappings
SKILL_VARIATIONS = {
    "JavaScript": ["javascript", "js", "es6", "es2015", "ecmascript"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "reactjs", "react.js"],
    "Node.js": ["node.js", "nodejs", "node"],
    # ... 80+ more entries
}

# Extract skills from text
extract_skills(text) → List[str]
# 1. Check canonical variations (word boundary regex)
# 2. Check skills.json database (word boundary regex)
# 3. Map to canonical display names
# 4. Deduplicate
```

#### `resume_parser.py`

```python
# Supported formats
extract_text_from_bytes(file_bytes, filename) → str

# PDF:  pdfplumber (layout-aware with table extraction)
# DOCX: python-docx (headers + paragraphs + tables)
# DOC:  UTF-8 decode fallback for .doc files
```

#### `schemas.py`

```python
class AnalyzeResponse(BaseModel):
    candidateId: str
    name: str
    email: str
    phone: str
    skills: List[str] = []
    matchedSkills: List[str] = []
    missingSkills: List[str] = []
    experience: int = 0
    internships: int = 0
    college: str = ""
    branch: str = ""
    degree: str = ""
    location: str = ""
    portfolioLinks: List[str] = []
    matchPercentage: int = 0
    score: int = 0
    resumeStrength: str = "Weak"
    jobFitLevel: str = "Low Fit"
    categoryScores: Optional[Dict[str, int]] = None
    bonusFactors: Optional[Dict[str, Any]] = None
```

---

### 2. Backend — Node.js Express

#### Route Architecture

```
app.use('/hr/auth',      hrAuthRoutes)       → JWT signup/login
app.use('/hr/jobs',      hrJobRoutes)        → Job CRUD
app.use('/hr/resumes',   hrResumeRoutes)     → Batch resume analysis
app.use('/hr/dashboard', hrDashboardRoutes)  → Mock dashboard data
app.use('/candidate',    candidateRoutes)    → Single resume analysis
app.use('/hr/debug',     hrDebugRoutes)      → ML health check
```

#### `mlService.js` — ML Service Client

```javascript
// Sends resumes to Python ML service
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function analyze(files, jobData) {
    // 1. Build FormData with job_title, job_description, required_skills
    // 2. Append resume file streams
    // 3. POST to ML_URL/analyze-resumes
    // 4. Fallback: retry as JSON if multipart fails (422)
    // 5. Return array of candidate results
}
```

#### `candidateController.js` — Candidate Endpoint

```javascript
// POST /candidate/analyze
// Accepts: single resume file + job info
// Returns: { success, candidate, summary, jobTitle, requiredSkills }

// Summary generation:
// - "Matched X of Y required skills: ..."
// - "Missing skills: ..."
// - Experience assessment
// - Actionable feedback
```

#### `hrResumeController.js` — HR Batch Upload

```javascript
// POST /hr/resumes
// Accepts: up to 200 resume files (multer)
// Resolves job from: jobId in jobs.json OR form fields (jobTitle, requiredSkills)
// Calls: mlService.analyze(files, jobData)
// Applies: skill, location, college, experience, match% filters
// Returns: filtered & ranked candidate list
```

---

### 3. Frontend — React + Vite

#### Routing (`App.jsx`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Landing` | Landing page with role selection |
| `/candidate` | `CandidateDashboard` | Job selection + resume upload |
| `/candidate/score` | `ResumeScore` | Score report with breakdowns |
| `/candidate/skill-gap` | `SkillGap` | Skill gap analysis |
| `/candidate/roadmap` | `Roadmap` | Learning roadmap + career images |
| `/hr` | `HRDashboard` | HR portal with filters & table |
| `/auth/login` | `Login` | HR login form |
| `/auth/signup` | `Signup` | HR signup form |
| `/auth/role` | `RoleSelect` | Role selection |

#### Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| `CandidateCard` | `CandidateCard.jsx` | Individual candidate card view |
| `FilterPanel` | `FilterPanel.jsx` | 15+ filter types with presets |
| `ProgressBar` | `ProgressBar.jsx` | Animated bar with color transitions |
| `ResumeUpload` | `ResumeUpload.jsx` | Drag & drop file uploader |
| `RoadmapTimeline` | `RoadmapTimeline.jsx` | Vertical timeline display |
| `ScoreBadge` | `ScoreBadge.jsx` | Gradient score badge |
| `SkillBadge` | `SkillBadge.jsx` | Skill chip / tag |

#### State Management

Navigation-based state passing via React Router's `useNavigate` and `useLocation`:

```javascript
// Dashboard → ResumeScore
nav('/candidate/score', {
    state: {
        job,               // Selected job role object
        candidateSkills,   // All extracted skills
        matchedSkills,     // Skills matching job requirements
        missingSkills,     // Required skills not found
        matchPercent,      // Job match percentage
        score,             // Overall resume score
        candidateData,     // Full candidate data object
        categoryScores,    // { skillMatch, experience, projects, keywords, education }
        bonusFactors,      // { projects, achievements, publications, ... }
        summary,           // AI-generated summary text
        resumeStrength,    // "Strong" | "Average" | "Weak"
        jobFitLevel        // "Excellent Fit" | "Good Fit" | "Partial Fit" | "Low Fit"
    }
})
```

---

## 🧮 Scoring Algorithm

### Match Percentage Calculation

```
matchPercentage =
    (skillRatio × 50)           ← % of required skills found in resume
  + (experienceScore × 20)      ← years / 5, capped at 1.0
  + (projectsScore × 15)        ← project keywords detected (0 or 1)
  + (tfidfSimilarity × 15)      ← TF-IDF cosine similarity
  + (bertSimilarity × 5)        ← BERT semantic similarity bonus
```

### Overall Score Calculation

```
baseScore =
    (skillRatio × 25)           ← skill match ratio
  + (skillBreadth × 20)         ← total skills found / expected count
  + (experienceFactor × 15)     ← years / 5, capped at 1.0
  + (bertSimilarity × 15)       ← BERT semantic score
  + (tfidfSimilarity × 5)       ← TF-IDF keyword score

qualityBonus (up to +20):
  + projects      → +4
  + achievements  → +3
  + publications  → +3
  + leadership    → +2
  + technicalDepth → +3
  + topEducation  → +3
  + portfolio     → +2

finalScore = min(baseScore + qualityBonus, 100)
```

### Category Scores

Each category is scored 0-100 independently:

| Category | How It's Scored |
|----------|----------------|
| **Skill Match** | `(matchedSkills / requiredSkills) × 100` |
| **Experience** | `min(years / 5, 1.0) × 100` |
| **Projects** | Project/portfolio keywords detected → 0 or 80-100 |
| **Keywords** | `tfidfSimilarity × 100` |
| **Education** | Degree relevance + institution quality |

### Quality Bonus Factors

| Factor | Detection Method | Bonus Points |
|--------|-----------------|------|
| **Projects** | Keywords: "project", "built", "developed", "created" | +4 |
| **Achievements** | Keywords: "award", "achievement", "certification", "winner" | +3 |
| **Publications** | Keywords: "published", "paper", "journal", "conference" | +3 |
| **Leadership** | Keywords: "lead", "managed", "team leader", "coordinator" | +2 |
| **Technical Depth** | Long skill list (>10 skills) + project mentions | +3 |
| **Top Education** | IIT, NIT, IIIT, BITS, top-tier institutions | +3 |
| **Internships** | Count of "intern"/"internship" mentions | variable |
| **Portfolio** | GitHub, LinkedIn, personal website links detected | +2 |

### Labels & Ratings

| Score Range | Resume Strength | Job Fit Level |
|------------|----------------|---------------|
| 70-100 | Strong | Excellent Fit |
| 45-69 | Average | Good Fit (50+) / Partial Fit (45-49) |
| 0-44 | Weak | Low Fit |

---

## 🌐 API Reference

### ML Service Endpoints (Port 8000)

#### `POST /analyze-resumes`

Analyze one or more resumes against a job description.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resumes` | File(s) | Yes | PDF or DOCX resume files |
| `job_title` | string | No | Target job title |
| `job_description` | string | No | Full job description text |
| `required_skills` | JSON string | No | Array of required skill names |
| `name_method` | string | No | `"filename"` or `"text"` — how to extract candidate name |

**Response:** `List[AnalyzeResponse]`

```json
[
  {
    "candidateId": "cand_001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210",
    "skills": ["Python", "React", "Node.js", "Docker"],
    "matchedSkills": ["Python", "React"],
    "missingSkills": ["AWS", "Kubernetes"],
    "experience": 3,
    "internships": 1,
    "college": "IIT Delhi",
    "branch": "CSE",
    "degree": "B.Tech",
    "location": "Hyderabad",
    "portfolioLinks": ["https://github.com/johndoe"],
    "matchPercentage": 72,
    "score": 68,
    "resumeStrength": "Average",
    "jobFitLevel": "Good Fit",
    "categoryScores": {
      "skillMatch": 75,
      "experience": 60,
      "projects": 80,
      "keywords": 55,
      "education": 90
    },
    "bonusFactors": {
      "projects": true,
      "achievements": false,
      "publications": false,
      "leadership": true,
      "technicalDepth": true,
      "topEducation": true,
      "internships": 1,
      "portfolio": true
    }
  }
]
```

#### `GET /docs`

FastAPI auto-generated Swagger UI for interactive API testing.

---

### Backend Endpoints (Port 5000)

#### Authentication

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/hr/auth/signup` | `{ companyName, email, password }` | `{ token }` |
| `POST` | `/hr/auth/login` | `{ email, password }` | `{ token }` |

#### Jobs

| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| `POST` | `/hr/jobs` | `{ name, requiredSkills[], experienceRange, location }` | Created job |
| `GET` | `/hr/jobs` | — | Array of jobs (auto-fills to 50) |
| `GET` | `/hr/jobs/:id` | — | Single job object |

#### Resume Analysis

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/hr/resumes` | `FormData: resumes[] (up to 200), jobId, jobTitle, requiredSkills, jobDescription, jobLocation, filters` | `{ candidates[] }` |
| `POST` | `/candidate/analyze` | `FormData: resumes (1 file), jobId, jobTitle, requiredSkills, nameMethod, jobDescription` | `{ success, candidate, summary, jobTitle, requiredSkills }` |

#### Dashboard & Debug

| Method | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/hr/dashboard/:jobId` | Mock candidates for job with filters |
| `GET` | `/hr/debug/check-ml` | `{ status, mlServiceUrl }` |

---

## 🔍 Resume Parsing Pipeline

```
Input: PDF/DOCX file bytes
         │
         ▼
┌─────────────────────────────┐
│ 1. FORMAT DETECTION          │
│    .pdf → pdfplumber         │
│    .docx → python-docx       │
│    .doc → UTF-8 fallback     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 2. TEXT EXTRACTION           │
│    PDF: layout-aware with    │
│         table extraction     │
│    DOCX: headers +           │
│          paragraphs +        │
│          tables              │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 3. TEXT CLEANING             │
│    - Normalize line endings  │
│    - Preserve column gaps    │
│    - Collapse excess padding │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 4. ENTITY EXTRACTION         │
│    - Name (spaCy NER)        │
│    - Email (regex)           │
│    - Phone (regex: IN/US)    │
│    - Portfolio links (regex) │
│    - Experience (section-    │
│      aware parsing)          │
│    - College (two-pass)      │
│    - Degree (pattern match)  │
│    - Branch (abbreviation)   │
│    - Location (whitelist)    │
│    - Internships (count)     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 5. SKILL EXTRACTION          │
│    - Canonical variations    │
│    - skills.json database    │
│    - Word boundary matching  │
│    - Deduplication           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 6. SCORING                   │
│    - Skill match ratio       │
│    - BERT similarity         │
│    - TF-IDF similarity       │
│    - Quality bonus           │
│    - Category scores         │
│    - Labels & ratings        │
└──────────┬──────────────────┘
           │
           ▼
Output: AnalyzeResponse JSON
```

---

## 🔧 Skill Extraction Engine

The skill extraction pipeline uses a 3-step approach:

### Step 1: Canonical Variation Matching

80+ skill families with variation aliases:

```
JavaScript  →  js, es6, es2015, ecmascript
TypeScript  →  ts
React       →  reactjs, react.js
Node.js     →  nodejs, node
Python      →  py, python3
MongoDB     →  mongo
PostgreSQL  →  postgres, pg
Kubernetes  →  k8s
Amazon Web Services  →  aws
Google Cloud Platform  →  gcp
Machine Learning  →  ml
Deep Learning  →  dl
Natural Language Processing  →  nlp
Continuous Integration  →  ci/cd, cicd
... 80+ more families
```

### Step 2: Database Matching

180+ skills from `ml-service/data/skills.json`:

```json
[
  "Python", "Java", "C++", "C#", "Go", "Rust", "JavaScript",
  "TypeScript", "React", "Angular", "Vue.js", "Node.js",
  "Express", "Django", "Flask", "FastAPI", "Spring Boot",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP",
  "TensorFlow", "PyTorch", "scikit-learn", "Pandas",
  "MongoDB", "PostgreSQL", "Redis", "GraphQL",
  "Git", "Linux", "Terraform", "Ansible",
  "... 180+ total"
]
```

### Step 3: Deduplication & Canonical Display

Extracted skills are mapped to their canonical display names and deduplicated:

```
Input text: "... reactjs, React.js, REACT ..."
Output: ["React"]  (single canonical entry)
```

---

## 🗺️ Roadmap Image Integration

The Roadmap page includes 80+ career roadmap images from `public/roadmaps/`.

### How It Works

1. **Mapping:** `ROADMAP_MAP` maps 65+ job title variations to image slugs
2. **Resolution:** `resolveRoadmapSlug()` uses 3-tier matching:
   - Direct lookup (exact match)
   - Partial/substring match
   - Slugified fallback
3. **Validation:** `RoadmapImage` component pre-validates images with `new Image()` — only renders if the file exists
4. **Display:** Full-width image with rounded corners, shadow, and fade-in animation

### Supported Roadmap Images

| Category | Available Roadmaps |
|----------|-------------------|
| **Languages** | Python, JavaScript, TypeScript, Java, C++, Go, Rust, Kotlin, Swift, PHP, Ruby |
| **Frontend** | React, Angular, Vue, Next.js, Flutter, React Native, CSS, HTML |
| **Backend** | Node.js, Express, Django, Flask, Spring Boot, Laravel, ASP.NET Core |
| **Data / AI** | Data Analyst, Data Engineer, Data Scientist, Machine Learning, MLOps, Prompt Engineering, AI Engineer |
| **DevOps / Cloud** | DevOps, Docker, Kubernetes, AWS, Terraform, Linux |
| **Databases** | MongoDB, PostgreSQL, Redis, SQL |
| **Other** | System Design, Software Architect, Cyber Security, Blockchain, Game Developer, QA, UX Design, Product Manager, Technical Writer |

### Adding New Roadmaps

1. Add your PNG image to `public/roadmaps/` (e.g., `your-role.png`)
2. Add a mapping entry in `Roadmap.jsx`:

```javascript
// In ROADMAP_MAP object:
'your role name': 'your-role',  // matches your-role.png
```

---

## 📊 Data Files Reference

### `src/data/job_roles.json`

Contains all predefined job roles with skills and roadmap steps:

```json
{
  "id": "role_001",
  "name": "Frontend Developer",
  "requiredSkills": [
    "HTML", "CSS", "JavaScript", "React",
    "TypeScript", "Git", "Responsive Design"
  ],
  "roadmapSteps": [
    "Learn HTML5 fundamentals",
    "Master CSS3 and Flexbox/Grid",
    "JavaScript ES6+ deep dive",
    "Learn React.js framework",
    "Build portfolio projects",
    "Practice coding interviews",
    "Apply for frontend roles"
  ]
}
```

### `ml-service/data/skills.json`

Flat array of 180+ recognized skill names used by the skill extractor.

### `backend/data/jobs.json`

Stores HR-created job listings (runtime-generated).

### `backend/data/hr_users.json`

Stores registered HR user accounts (email, hashed password, company name).

### `backend/data/dummyColleges.json` & `dummyLocations.json`

Used by `mockMlService.js` to generate realistic synthetic candidate data for the HR dashboard demo.

---

## 🖥️ Frontend Pages & Components

### Landing Page (`src/pages/landing.jsx`)

- Gradient hero section with geometric circles
- "AI-Powered Platform" status badge
- 3 feature cards: Smart Analysis, Skill Gap, Learning Roadmap
- CTA buttons: Candidate login, HR login
- Signup link

### Candidate Dashboard (`src/pages/candidate/Dashboard.jsx`)

- Two-tab layout: "Resume Score" / "Skill Gap & Roadmap"
- Radio toggle: "Select Job Role" / "Paste Job Description"
- Dropdown with all roles from `job_roles.json`
- Custom JD auto-detects 50+ skill keywords
- File upload area (PDF/DOCX)
- Analyze button with loading spinner

### Resume Score (`src/pages/candidate/ResumeScore.jsx`)

- SVG circle score rings (animated) for score and match %
- 4 metric cards: Score, Match%, Strength, Fit
- AI-generated summary
- 5 category breakdown bars (colored backgrounds)
- Bonus factor badges (star icons)
- Matched skills (green) / Missing skills (red) side by side
- All extracted skills with check marks
- Extracted profile cards (experience, college, degree, location)
- Navigation to Skill Gap / Roadmap

### Skill Gap (`src/pages/candidate/SkillGap.jsx`)

- Ring chart for coverage percentage
- 4 metric cards: Gap%, Matched, Missing, Required
- Coverage progress bar
- Category strength/weakness analysis with inline bars
- Priority-ranked missing skills with badges (Critical/Important/Nice-to-Have)
- Matched skills / Extra skills sections

### Roadmap (`src/pages/candidate/Roadmap.jsx`)

- Gradient header with progress stats
- Progress bar (completed/total steps)
- Phase cards with colored headers, SVG icons, vertical timeline
- Phase items with done/pending dots and badges
- Full career roadmap image section (80+ images)
- Navigation actions

### HR Dashboard (`src/pages/hr/Dashboard.jsx`)

- Job role selector
- Batch resume upload (up to 200 files)
- Advanced filter panel (15+ filter types, quick presets)
- Candidate table with expandable skills cells
- Sort by score, match%, name
- Score badges with color gradients

---

## ⚙️ Environment Variables

All services work with defaults. Customize with environment variables:

### Backend (`backend/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend server port |
| `ML_SERVICE_URL` | `http://localhost:8000` | Python ML service URL |
| `JWT_SECRET` | `demo-secret` | JWT signing secret |

### ML Service (`ml-service/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | ML service port |

### Frontend (`src/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000` | Backend API URL (in `api.js`) |

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **ECONNREFUSED on port 8000** | ML service not running | Start ML service: `python -m uvicorn app.main:app --port 8000` |
| **ECONNREFUSED on port 5000** | Backend not running | Start backend: `cd backend && node server.js` |
| **Port already in use** | Previous process still running | Kill it: `npx kill-port 5000` or `npx kill-port 8000` |
| **`python-multipart` error** | Missing Python dependency | `pip install python-multipart` |
| **spaCy model not found** | Model not downloaded | `python -m spacy download en_core_web_sm` |
| **matchedSkills always 0** | Pydantic schema missing fields | Ensure `schemas.py` has `matchedSkills`, `categoryScores`, `bonusFactors` |
| **Job role IDs don't match** | Frontend uses `role_001`, backend uses `job_1001` | Backend reads `jobTitle` + `requiredSkills` from form fields as fallback |
| **First ML request is slow** | Model loading on first call | Normal — `all-MiniLM-L6-v2` loads ~3-5 sec on first request |
| **CORS errors** | Backend CORS not configured | Backend already uses `cors()` middleware — check if backend is running |
| **Resume upload fails** | File too large or wrong format | Check: PDF/DOCX only, < 10 MB per file |

### Windows-Specific

```powershell
# Kill process on specific port (Windows PowerShell)
$proc = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue |
        Select-Object -First 1
if ($proc) { Stop-Process -Id $proc.OwningProcess -Force }

# Activate Python venv (PowerShell)
.\.venv\Scripts\Activate.ps1

# If PowerShell execution policy blocks venv activation:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### macOS/Linux

```bash
# Kill process on specific port
lsof -ti:5000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Activate Python venv
source .venv/bin/activate
```

---

## 🤝 Contributing

We welcome contributions! Whether it's bug fixes, new features, documentation improvements, or roadmap images — all contributions are valued.

### Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch from `main`
3. **Make** your changes
4. **Test** your changes locally (all 3 services)
5. **Commit** with clear, descriptive messages
6. **Push** to your fork
7. **Open** a Pull Request

### Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/resume-screening-project.git
cd resume-screening-project

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Set up all 3 services (see Quick Start above)

# 4. Make your changes

# 5. Test locally
#    - Upload a resume and verify scoring works
#    - Check skill extraction accuracy
#    - Test HR batch upload
#    - Verify filters work correctly

# 6. Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name

# 7. Open a PR on GitHub
```

### Code Style

| Language | Style Guide |
|----------|-------------|
| **JavaScript/JSX** | ES6+, functional components, React Hooks |
| **Python** | PEP 8, type hints recommended |
| **CSS** | Tailwind CSS utility classes, avoid custom CSS where possible |
| **Commits** | [Conventional Commits](https://www.conventionalcommits.org/) preferred |

### What Can I Contribute?

| Area | Examples |
|------|---------|
| **New Roadmap Images** | Add `.png` images to `public/roadmaps/` + mapping in `Roadmap.jsx` |
| **More Job Roles** | Add entries to `src/data/job_roles.json` with skills + roadmap steps |
| **More Skills** | Add skills to `ml-service/data/skills.json` + variations in `skill_extractor.py` |
| **Better Extraction** | Improve name/college/experience parsing in `routes.py` |
| **UI Improvements** | Enhance any page component styling |
| **Tests** | Add unit/integration tests (currently none) |
| **Documentation** | Improve README, add CONTRIBUTING.md, add JSDoc/docstrings |
| **Docker** | Add Dockerfile / docker-compose for easy deployment |
| **Database** | Replace JSON file storage with MongoDB/PostgreSQL |
| **Auth** | Add candidate authentication, OAuth providers |
| **Deployment** | Add Vercel/Railway/Render deployment configs |

### Pull Request Template

When opening a PR, please include:

```markdown
## What does this PR do?
Brief description of changes.

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] New roadmap image(s)
- [ ] New job role(s)
- [ ] Other

## Checklist
- [ ] I've tested my changes locally
- [ ] All 3 services start without errors
- [ ] Resume upload and scoring still works
- [ ] No existing functionality is broken
- [ ] I've updated the README if needed

## Screenshots (if UI changes)
Before: ...
After: ...
```

---

## 👥 Contributors

<!-- ALL-CONTRIBUTORS-LIST:START -->
<table>
  <tr>
    <td align="center">
      <a href="https://github.com/your-username">
        <img src="https://github.com/M-ABHIRAM36.png" width="80px;" alt="abhiram"/>
        <br /><sub><b>M.Abhiram</b></sub>
      </a>
      <br />
      <sub>💻 Project Lead & Full-Stack Development</sub>
    </td>
  </tr>
</table>
<!-- ALL-CONTRIBUTORS-LIST:END -->

### How to Add Yourself as a Contributor

After your PR is merged, add yourself to the table above following this format:

```html
<td align="center">
  <a href="https://github.com/YOUR-GITHUB-USERNAME">
    <img src="https://github.com/YOUR-GITHUB-USERNAME.png" width="80px;" alt="Your Name"/>
    <br /><sub><b>Your Name</b></sub>
  </a>
  <br />
  <sub>EMOJI Your Contribution Type</sub>
</td>
```

**Contribution Type Emojis:**
| Emoji | Type |
|-------|------|
| 💻 | Code |
| 📖 | Documentation |
| 🎨 | Design / UI |
| 🐛 | Bug Fix |
| 🔧 | DevOps / Infra |
| 🤖 | ML / AI |
| 🗺️ | Roadmap Images |
| ✅ | Testing |

---

## 🔮 Future Enhancements

| Priority | Enhancement | Description |
|----------|-------------|-------------|
| 🔴 High | **Database Integration** | Replace JSON files with MongoDB or PostgreSQL for production use |
| 🔴 High | **Candidate Authentication** | Add login/signup for candidates with profile persistence |
| 🔴 High | **Docker Compose** | One-command deployment with `docker-compose up` |
| 🟡 Medium | **Resume Storage** | Cloud storage (S3/GCS) for uploaded resumes |
| 🟡 Medium | **Job Description Parser** | Auto-extract required skills from any pasted JD using NLP |
| 🟡 Medium | **Email Notifications** | Send score reports to candidates via email |
| 🟡 Medium | **Export Reports** | Download score reports as PDF |
| 🟡 Medium | **Batch Processing UI** | Progress bar for HR batch uploads showing per-resume status |
| 🟢 Low | **Dark Mode** | System-preference dark mode with Tailwind `dark:` classes |
| 🟢 Low | **Internationalization** | Multi-language support (Hindi, Telugu, etc.) |
| 🟢 Low | **Resume Templates** | Downloadable ATS-friendly resume templates |
| 🟢 Low | **Interview Prep** | AI-generated interview questions based on skill gaps |
| 🟢 Low | **Analytics Dashboard** | HR analytics: hiring funnel, skill trends, source tracking |
| 🟢 Low | **Mobile App** | React Native mobile app for candidates |
| 🟢 Low | **Video Resume** | Support video resume uploads with audio transcription |
| 🟢 Low | **ATS Integration** | API integration with popular ATS systems (Lever, Greenhouse) |

---

## 📑 Complete API Endpoint Summary

| # | Method | Endpoint | Service | Description |
|---|--------|----------|---------|-------------|
| 1 | `POST` | `/analyze-resumes` | ML (8000) | Analyze resumes with full NLP pipeline |
| 2 | `GET` | `/docs` | ML (8000) | Swagger interactive API docs |
| 3 | `GET` | `/` | Backend (5000) | Health check |
| 4 | `POST` | `/hr/auth/signup` | Backend (5000) | HR registration |
| 5 | `POST` | `/hr/auth/login` | Backend (5000) | HR authentication |
| 6 | `POST` | `/hr/jobs` | Backend (5000) | Create job listing |
| 7 | `GET` | `/hr/jobs` | Backend (5000) | List all jobs |
| 8 | `GET` | `/hr/jobs/:id` | Backend (5000) | Get specific job |
| 9 | `POST` | `/hr/resumes` | Backend (5000) | Batch resume analysis (up to 200) |
| 10 | `GET` | `/hr/dashboard/:jobId` | Backend (5000) | Mock dashboard data |
| 11 | `POST` | `/candidate/analyze` | Backend (5000) | Single resume analysis |
| 12 | `GET` | `/hr/debug/check-ml` | Backend (5000) | ML service connectivity check |

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Resume Screening & Career Guidance System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

| Resource | Usage |
|----------|-------|
| [spaCy](https://spacy.io/) | NLP library for named entity recognition |
| [sentence-transformers](https://www.sbert.net/) | BERT embeddings for semantic similarity |
| [scikit-learn](https://scikit-learn.org/) | TF-IDF vectorizer and cosine similarity |
| [FastAPI](https://fastapi.tiangolo.com/) | High-performance Python web framework |
| [React](https://react.dev/) | Frontend UI library |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework |
| [Vite](https://vitejs.dev/) | Frontend build tool |
| [pdfplumber](https://github.com/jsvine/pdfplumber) | PDF text extraction |
| [roadmap.sh](https://roadmap.sh/) | Career roadmap images and inspiration |

---

<div align="center">

**Built with ❤️ for smarter hiring and career growth**

⭐ Star this repository if you found it useful!

[Report Bug](https://github.com/your-username/resume-screening-project/issues) •
[Request Feature](https://github.com/your-username/resume-screening-project/issues) •
[Contribute](#-contributing)

</div>
