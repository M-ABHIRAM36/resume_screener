# Resume Screening and Career Guidance System

## Academic Project Documentation

---

## Table of Contents

1. [Project Introduction](#1-project-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [System Overview](#4-system-overview)
5. [Technology Stack](#5-technology-stack)
6. [Module Description](#6-module-description)
7. [Advantages](#7-advantages)
8. [Limitations](#8-limitations)
9. [Future Enhancements](#9-future-enhancements)
10. [Conclusion](#10-conclusion)

---

## 1. Project Introduction

The **Resume Screening and Career Guidance System** is a web-based application designed to automate the process of screening resumes and providing career guidance to job seekers. The system addresses the challenges faced by Human Resource (HR) professionals in manually reviewing large volumes of resumes and helps candidates understand their skill gaps for specific job roles.

The application provides two distinct user interfaces:
- **HR Portal**: For recruiters to upload, analyze, and rank multiple candidate resumes against job requirements
- **Candidate Portal**: For job seekers to upload their resume, receive scores, identify skill gaps, and get personalized career roadmaps

This project combines web technologies with natural language processing (NLP) techniques to deliver an efficient, accurate, and user-friendly recruitment support system.

---

## 2. Problem Statement

In today's competitive job market, organizations receive hundreds or thousands of resumes for each job posting. Manual screening of these resumes is:

- **Time-consuming**: HR professionals spend significant hours reviewing each resume individually
- **Inconsistent**: Different reviewers may evaluate the same resume differently
- **Error-prone**: Important qualifications may be overlooked during manual review
- **Resource-intensive**: Requires substantial human effort and organizational resources

Additionally, job seekers face challenges in:
- Understanding how well their skills match job requirements
- Identifying specific skills they need to develop
- Creating a structured learning path for career advancement

This project aims to solve these problems by automating resume analysis, providing objective scoring, and generating actionable career guidance.

---

## 3. Objectives

The primary objectives of this project are:

### For HR Professionals:
1. **Automate Resume Parsing**: Extract relevant information from resumes in PDF and DOCX formats
2. **Extract Skills Automatically**: Identify technical and professional skills from resume text
3. **Calculate Match Scores**: Compute similarity between candidate profiles and job requirements
4. **Rank Candidates**: Provide a ranked list of candidates based on match scores
5. **Filter and Sort**: Enable filtering by skills, location, experience, and match percentage

### For Candidates:
1. **Analyze Resume Quality**: Provide comprehensive analysis of uploaded resumes
2. **Identify Skill Gaps**: Compare candidate skills against job role requirements
3. **Generate Career Roadmap**: Create personalized learning paths with recommended resources
4. **Provide Actionable Feedback**: Offer specific suggestions for career improvement

### Technical Objectives:
1. **Build a Responsive Web Interface**: Create an intuitive user experience
2. **Implement Text Processing Pipeline**: Develop robust text extraction and analysis
3. **Ensure Scalability**: Design system to handle multiple concurrent users
4. **Maintain Accuracy**: Achieve reliable skill extraction and matching

---

## 4. System Overview

The Resume Screening and Career Guidance System follows a three-tier architecture:

### 4.1 Presentation Layer (Frontend)
- Built with React.js framework
- Responsive design using Tailwind CSS
- Separate interfaces for HR and Candidate users
- Real-time feedback and interactive components

### 4.2 Application Layer (Backend)
- Node.js with Express.js framework
- RESTful API architecture
- File upload and management
- Request routing and validation

### 4.3 Processing Layer (Python Service)
- FastAPI framework for high-performance processing
- Natural Language Processing using spaCy
- Text similarity computation using sentence-transformers
- Skill extraction and matching algorithms

### 4.4 System Workflow

```
User (HR/Candidate) → Upload Resume → Backend Server → Processing Service
                                                              ↓
                                                      Text Extraction
                                                              ↓
                                                      Skill Extraction
                                                              ↓
                                                      Score Calculation
                                                              ↓
User ← Display Results ← Backend Server ← Return Analysis
```

---

## 5. Technology Stack

### 5.1 Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| React.js | User Interface Framework | 18.x |
| React Router | Client-side Navigation | 6.x |
| Tailwind CSS | Styling and Responsive Design | 3.x |
| Vite | Build Tool and Development Server | 5.x |
| Axios | HTTP Client for API Calls | - |

### 5.2 Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Server Runtime Environment | 18.x |
| Express.js | Web Application Framework | 4.x |
| Multer | File Upload Handling | - |
| CORS | Cross-Origin Resource Sharing | - |
| Axios | HTTP Client for Service Communication | - |

### 5.3 Processing Service Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Python | Programming Language | 3.9+ |
| FastAPI | High-Performance API Framework | 0.100+ |
| spaCy | Natural Language Processing | 3.x |
| sentence-transformers | Semantic Text Similarity | - |
| scikit-learn | TF-IDF Vectorization | - |
| pdfplumber | PDF Text Extraction | - |
| python-docx | DOCX Text Extraction | - |

### 5.4 Data Storage

| Technology | Purpose |
|------------|---------|
| JSON Files | Job roles, skills database, user data |
| File System | Resume file storage |
| MongoDB (Optional) | Persistent data storage |

---

## 6. Module Description

### 6.1 Resume Analysis Module

The Resume Analysis Module is responsible for extracting text content from uploaded resume files.

**Key Functions:**
- **File Format Detection**: Identifies whether the uploaded file is PDF, DOCX, or DOC format
- **Text Extraction**: Uses appropriate parser based on file format
  - `pdfplumber` for PDF files with layout-aware extraction
  - `python-docx` for DOCX files including tables and headers
- **Text Cleaning**: Removes excessive whitespace while preserving document structure
- **Table Extraction**: Separately extracts tabular data for comprehensive analysis

**Input**: Resume file (PDF/DOCX/DOC)  
**Output**: Clean, structured text content

**Code Location**: `ml-service/app/resume_parser.py`

---

### 6.2 Text Processing Module

The Text Processing Module handles the extraction of meaningful information from resume text using Natural Language Processing techniques.

**Key Functions:**
- **Named Entity Recognition (NER)**: Uses spaCy to identify:
  - Person names
  - Organizations (companies, educational institutions)
  - Locations
  - Dates
- **Contact Information Extraction**: Extracts email addresses and phone numbers using regex patterns
- **Experience Extraction**: Identifies years of experience from various text patterns
- **Portfolio Link Detection**: Extracts GitHub, LinkedIn, and other professional profile links

**Input**: Raw text from resume  
**Output**: Structured candidate information (name, email, phone, experience, etc.)

**Code Location**: `ml-service/app/routes.py`

---

### 6.3 Skill Extraction Module

The Skill Extraction Module identifies technical and professional skills mentioned in the resume.

**Key Functions:**
- **Pattern Matching**: Uses word-boundary regex for accurate skill detection
- **Canonical Skill Mapping**: Normalizes skill variations to standard names
  - Example: "js", "javascript", "es6" → "JavaScript"
- **Skills Database Lookup**: Matches against a comprehensive skills database
- **Deduplication**: Ensures each skill is counted only once

**Skill Categories Covered:**
- Programming Languages (Python, Java, JavaScript, etc.)
- Frameworks (React, Django, Spring Boot, etc.)
- Databases (MySQL, MongoDB, PostgreSQL, etc.)
- Cloud Platforms (AWS, Azure, GCP)
- Tools (Git, Docker, Kubernetes, etc.)
- Methodologies (Agile, Scrum)

**Input**: Resume text  
**Output**: List of identified skills

**Code Location**: `ml-service/app/skill_extractor.py`

---

### 6.4 Similarity Calculation Module

The Similarity Calculation Module computes how closely a candidate's profile matches the job requirements using two complementary approaches.

#### 6.4.1 Semantic Similarity (BERT-based)

Uses the `all-MiniLM-L6-v2` sentence transformer model to compute semantic similarity:
- Converts resume text and job description into dense vector embeddings
- Calculates cosine similarity between the two vectors
- Captures meaning and context, not just keywords

#### 6.4.2 Keyword Similarity (TF-IDF based)

Uses Term Frequency-Inverse Document Frequency (TF-IDF) vectorization:
- Creates sparse vectors based on word importance
- Removes common English stop words
- Calculates cosine similarity between vectors
- Captures exact keyword matches

**Input**: Resume text, Job description  
**Output**: Semantic similarity score, Keyword similarity score

**Code Location**: `ml-service/app/scorer.py`

---

### 6.5 Resume Scoring Module

The Resume Scoring Module combines multiple metrics to generate a final match score for each candidate.

**Scoring Formula:**
```
Final Score = (0.45 × Skill Match Ratio) + (0.40 × Semantic Similarity) + (0.15 × Keyword Similarity)
```

**Weight Distribution:**
| Component | Weight | Justification |
|-----------|--------|---------------|
| Skill Match Ratio | 45% | Direct measurement of required skill coverage |
| Semantic Similarity | 40% | Captures overall context and meaning alignment |
| Keyword Similarity | 15% | Ensures important terminology is present |

**Score Normalization:**
- All component scores are normalized to [0, 1] range
- Final score is clipped to ensure valid output
- Converted to percentage (0-100%) for display

**Input**: Skill match ratio, Semantic similarity, Keyword similarity  
**Output**: Final match score (0-100%)

**Code Location**: `ml-service/app/scorer.py`

---

### 6.6 Career Guidance Module

The Career Guidance Module provides personalized career development recommendations to candidates.

**Key Functions:**

#### 6.6.1 Skill Gap Analysis
- Compares candidate's skills against job role requirements
- Identifies missing skills
- Prioritizes skills by importance for the role

#### 6.6.2 Roadmap Generation
- Creates step-by-step learning path
- Includes recommended resources for each skill
- Provides estimated time for skill acquisition
- Organizes learning into phases (Foundation, Intermediate, Advanced)

#### 6.6.3 Score Interpretation
- Provides context for the match score
- Suggests improvement areas
- Offers actionable recommendations

**Input**: Candidate skills, Job requirements, Match score  
**Output**: Skill gaps, Learning roadmap, Recommendations

**Code Location**: `src/pages/candidate/SkillGap.jsx`, `src/pages/candidate/Roadmap.jsx`

---

## 7. Advantages

### 7.1 For HR Professionals

1. **Time Efficiency**: Reduces resume screening time from hours to minutes
2. **Objective Evaluation**: Eliminates personal bias in candidate assessment
3. **Consistency**: Applies the same evaluation criteria to all candidates
4. **Scalability**: Handles large volumes of resumes simultaneously
5. **Better Shortlisting**: Identifies top candidates based on quantitative metrics
6. **Flexible Filtering**: Allows filtering by multiple criteria (skills, location, experience)

### 7.2 For Candidates

1. **Instant Feedback**: Receives immediate analysis of resume quality
2. **Self-Assessment**: Understands current skill level relative to job requirements
3. **Clear Direction**: Gets specific guidance on skills to develop
4. **Structured Learning**: Receives organized roadmap for career development
5. **Market Awareness**: Understands industry skill requirements

### 7.3 Technical Advantages

1. **Modular Architecture**: Easy to maintain and extend
2. **Multi-format Support**: Handles PDF, DOCX, and DOC files
3. **Accurate Skill Detection**: Uses both pattern matching and NLP
4. **Balanced Scoring**: Combines multiple metrics for reliable results
5. **Fast Processing**: Efficient algorithms for quick analysis

---

## 8. Limitations

### 8.1 Technical Limitations

1. **File Format Dependency**: Complex PDF layouts may affect text extraction accuracy
2. **Language Support**: Currently optimized for English resumes only
3. **Skill Database**: Limited to predefined skill categories; new skills require manual addition
4. **No Image Processing**: Cannot extract text from images or scanned documents
5. **Internet Dependency**: Requires stable internet connection for processing

### 8.2 Functional Limitations

1. **No Soft Skills Assessment**: Focuses on technical skills; cannot evaluate soft skills
2. **No Experience Verification**: Cannot verify authenticity of claimed experience
3. **Context Sensitivity**: May miss skills mentioned in unconventional ways
4. **Job Description Dependency**: Scoring accuracy depends on quality of job description
5. **No Interview Scheduling**: Does not include interview management features

### 8.3 Scope Limitations

1. **Single Language**: English language resumes only
2. **No Video Resume Support**: Text-based resumes only
3. **Limited Industry Coverage**: Optimized for IT and technical roles

---

## 9. Future Enhancements

### 9.1 Short-term Enhancements

1. **Multi-language Support**: Add support for resumes in Hindi, Spanish, and other languages
2. **OCR Integration**: Enable text extraction from scanned documents and images
3. **Custom Skill Database**: Allow users to add custom skills and categories
4. **Resume Templates**: Provide optimized resume templates for different roles
5. **Email Notifications**: Send automated notifications to shortlisted candidates

### 9.2 Medium-term Enhancements

1. **Interview Scheduling**: Integrate calendar and scheduling functionality
2. **Candidate Tracking**: Add full applicant tracking system (ATS) features
3. **Analytics Dashboard**: Provide hiring analytics and trend reports
4. **Social Media Integration**: Import profiles from LinkedIn and GitHub
5. **Collaborative Features**: Enable team-based candidate evaluation

### 9.3 Long-term Enhancements

1. **Predictive Analytics**: Predict candidate success based on historical data
2. **Video Resume Analysis**: Process and analyze video introductions
3. **Certification Verification**: Integrate with certification authorities
4. **Industry Benchmarking**: Compare candidates against industry standards
5. **Mobile Application**: Develop native mobile apps for iOS and Android

---

## 10. Conclusion

The **Resume Screening and Career Guidance System** successfully addresses the challenges of manual resume screening and career planning. By leveraging modern web technologies and natural language processing techniques, the system provides:

- **Efficient Resume Processing**: Automated text extraction and analysis
- **Accurate Skill Matching**: Combination of pattern matching and semantic analysis
- **Objective Scoring**: Multi-factor scoring algorithm for fair evaluation
- **Actionable Guidance**: Personalized career roadmaps for candidates

The project demonstrates the practical application of:
- Full-stack web development (React, Node.js, Python)
- Natural Language Processing (spaCy, sentence-transformers)
- Text similarity computation (TF-IDF, cosine similarity)
- RESTful API design and microservices architecture

The system has been designed with modularity and scalability in mind, allowing for future enhancements and extensions. It serves as a valuable tool for both HR professionals seeking to streamline their recruitment process and job seekers looking to improve their career prospects.

---

## References

1. Bird, S., Klein, E., & Loper, E. (2009). Natural Language Processing with Python. O'Reilly Media.
2. Jurafsky, D., & Martin, J. H. (2020). Speech and Language Processing (3rd ed.).
3. Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks.
4. React Documentation: https://react.dev
5. FastAPI Documentation: https://fastapi.tiangolo.com
6. spaCy Documentation: https://spacy.io

---

## Project Team

**Project Title**: Resume Screening and Career Guidance System  
**Academic Year**: 2025-2026  
**Institution**: [Your Institution Name]

---

*Document Generated: January 2026*
