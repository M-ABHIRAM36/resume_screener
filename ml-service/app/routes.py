
from fastapi import APIRouter, UploadFile, File, Form, Request
from typing import List, Optional
from . import resume_parser, skill_extractor, scorer

# spaCy NER
try:
    import spacy
    nlp = spacy.load('en_core_web_sm')
except Exception:
    nlp = None
from .schemas import AnalyzeResponse
from io import BytesIO
import re
import time
import datetime

router = APIRouter()

email_re = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
# Improved experience extraction - multiple patterns
exp_patterns = [
    re.compile(r"(\d+)\s*\+?\s*(?:years?|yrs?|yr)\s+(?:of\s+)?experience", re.IGNORECASE),
    re.compile(r"experience[:\s]+(\d+)\s*(?:years?|yrs?)", re.IGNORECASE),
    re.compile(r"(\d+)\s*(?:years?|yrs?)\s+(?:in|of|with)", re.IGNORECASE),
    re.compile(r"(?:since|from)\s+\d{4}.*?(?:to|present|\d{4})", re.IGNORECASE),  # Date range
    re.compile(r"(\d+)\s*\+?\s*(?:years?|yrs?)", re.IGNORECASE),  # Fallback
]


def extract_ner(text: str):
    name = None
    college = None
    location = None
    if not text or nlp is None:
        return name, college, location
    try:
        # Use more text for better extraction
        doc = nlp(text[:20000])
        for ent in doc.ents:
            if ent.label_ == 'PERSON' and not name:
                name = ent.text.strip()
            if ent.label_ == 'ORG' and not college:
                if any(k.lower() in ent.text.lower() for k in ['university','college','institute','iit','iiit','nit','school','academy','univ']):
                    college = ent.text.strip()
            if ent.label_ in ('GPE','LOC') and not location:
                location = ent.text.strip()
    except Exception:
        pass
    return name, college, location


def extract_experience(text: str) -> int:
    """Extract years of experience from resume text"""
    if not text:
        return 0
    
    text_lower = text.lower()
    max_exp = 0
    
    # Try pattern-based extraction first
    for pattern in exp_patterns:
        matches = pattern.findall(text)
        if matches:
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                try:
                    years = int(match)
                    max_exp = max(max_exp, years)
                except (ValueError, TypeError):
                    continue
    
    # Try date range extraction (e.g., "2018-2024" = 6 years)
    date_range_pattern = re.compile(r'(\d{4})\s*(?:[-–—to]|present)\s*(\d{4}|present)', re.IGNORECASE)
    date_matches = date_range_pattern.findall(text)
    if date_matches:
        current_year = datetime.datetime.now().year
        for start, end in date_matches:
            try:
                start_year = int(start)
                end_year = int(end) if end.lower() != 'present' else current_year
                years_diff = end_year - start_year
                if 0 < years_diff <= 50:  # Reasonable range
                    max_exp = max(max_exp, years_diff)
            except (ValueError, TypeError):
                continue
    
    # If still no experience found, check for senior/junior keywords
    if max_exp == 0:
        if any(word in text_lower for word in ['senior', 'lead', 'principal', 'architect', 'manager', 'director']):
            max_exp = 5  # Assume senior = 5+ years
        elif any(word in text_lower for word in ['mid-level', 'mid level', 'intermediate']):
            max_exp = 3
        elif any(word in text_lower for word in ['junior', 'entry', 'fresher', 'intern']):
            max_exp = 1
    
    return min(max_exp, 20)  # Cap at 20 years


@router.post('/analyze-resumes', response_model=List[AnalyzeResponse])
async def analyze_resumes(
    request: Request,
    job_title: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    required_skills: Optional[List[str]] = Form(None),
    resumes: Optional[List[UploadFile]] = File(None)
):
    results = []

    # Determine source: form-data or JSON
    is_json = False
    try:
        ct = request.headers.get('content-type', '')
        is_json = 'application/json' in ct
    except Exception:
        is_json = False

    job_desc = ''
    req_skills = []

    if is_json:
        try:
            body = await request.json()
        except Exception:
            body = {}
        job = body.get('job') or body.get('jobDescription') or body.get('job_description') or {}
        if isinstance(job, dict):
            job_desc = job.get('description') or job.get('jobDescription') or job.get('job_description') or ''
            title = job.get('name') or job.get('title') or job.get('job_title')
        else:
            job_desc = ''
            title = None
        req_skills = [s.lower() for s in (job.get('requiredSkills') or job.get('required_skills') or [])] if isinstance(job, dict) else []
        files_meta = body.get('filesMeta') or {}
        count = int(files_meta.get('count', 0)) if isinstance(files_meta, dict) else 0
        # If no file contents provided, synthesize placeholder candidates
        if count and not resumes:
            for i in range(count):
                candidate = {
                    'candidateId': f'cand_stub_{int(time.time())}_{i}',
                    'name': f'candidate_{i}',
                    'email': '',
                    'skills': [],
                    'missingSkills': req_skills,
                    'experience': 0,
                    'college': None,
                    'location': None,
                    'matchPercentage': 0,
                    'score': 0,
                    'resumeStrength': 'Weak',
                    'jobFitLevel': 'Low'
                }
                results.append(candidate)
            return results
    else:
        job_desc = job_description or ''
        req_skills = [s.lower() for s in (required_skills or [])]

    # Build comprehensive job description if empty
    if not job_desc and job_title:
        job_desc = job_title
    if req_skills and len(req_skills) > 0:
        skills_text = ", ".join(req_skills)
        job_desc = f"{job_desc} {skills_text}".strip()
    
    # If we have uploaded files, process them
    if resumes:
        for i, f in enumerate(resumes):
            try:
                content = await f.read()
                text = resume_parser.extract_text_from_bytes(content, f.filename or '')
                
                if not text or len(text.strip()) < 50:
                    print(f"Warning: Extracted text is too short for {f.filename}")
                    # Skip or use filename as fallback
                    text = f.filename or 'resume'
                
                name_ner, college_ner, location_ner = extract_ner(text)
                email_m = email_re.search(text)
                email = email_m.group(0) if email_m else (f.filename or '')
                
                # Improved experience extraction
                experience = extract_experience(text)
                
                # Extract skills with better matching
                skills = skill_extractor.extract_skills(text)
                
                # Normalize skills and required skills for comparison
                skills_normalized = [s.lower().strip() for s in skills]
                req_skills_normalized = [s.lower().strip() for s in req_skills]
                
                # Find matched and missing skills (with fuzzy matching)
                matched_skills = []
                missing_skills = []
                
                for req_skill in req_skills_normalized:
                    found = False
                    # Exact match
                    if req_skill in skills_normalized:
                        matched_skills.append(req_skill)
                        found = True
                    else:
                        # Partial match (e.g., "react" matches "react.js", "reactjs")
                        for skill in skills_normalized:
                            if req_skill in skill or skill in req_skill:
                                matched_skills.append(req_skill)
                                found = True
                                break
                    
                    if not found:
                        missing_skills.append(req_skill)
                
                # Calculate skill ratio
                skill_ratio = len(matched_skills) / max(1, len(req_skills_normalized)) if req_skills_normalized else 0.5
                
                # Calculate similarity scores only if job description is meaningful
                bert_sim = 0.0
                tfidf_sim = 0.0
                
                if job_desc and len(job_desc.strip()) > 10:
                    try:
                        bert_sim = scorer.semantic_similarity(job_desc, text)
                    except Exception as e:
                        print(f"BERT similarity error: {e}")
                        bert_sim = 0.0
                    
                    try:
                        tfidf_sim = scorer.keyword_similarity(job_desc, text)
                    except Exception as e:
                        print(f"TF-IDF similarity error: {e}")
                        tfidf_sim = 0.0
                else:
                    # If no job description, rely more on skills
                    bert_sim = skill_ratio * 0.7  # Scale skill ratio to similarity range
                    tfidf_sim = skill_ratio * 0.6
                
                # Calculate score with improved weighting (skills matter more, experience bonus)
                base_score = scorer.compute_score(bert_sim, tfidf_sim, skill_ratio)
                
                # Add experience bonus (0-10 points)
                exp_bonus = min(experience * 0.02, 0.10)  # Max 10% bonus for 5+ years
                
                # Adjust weights: Skills 40%, BERT 40%, TF-IDF 15%, Experience 5%
                if req_skills_normalized:
                    # If we have required skills, prioritize skill matching
                    adjusted_score = (0.40 * skill_ratio) + (0.40 * max(0, bert_sim)) + (0.15 * max(0, tfidf_sim)) + exp_bonus
                else:
                    # If no required skills, use original scoring with experience bonus
                    adjusted_score = base_score + exp_bonus
                
                final_score = min(max(adjusted_score, 0.0), 1.0)
                score_int = int(round(final_score * 100))
                
                # Ensure minimum score if skills match well
                if skill_ratio >= 0.5 and score_int < 40:
                    score_int = 40  # Minimum 40% if 50%+ skills match
                if skill_ratio >= 0.7 and score_int < 60:
                    score_int = 60  # Minimum 60% if 70%+ skills match
                if skill_ratio >= 0.9 and score_int < 75:
                    score_int = 75  # Minimum 75% if 90%+ skills match
                
                matchPercentage = score_int
                score = score_int
                resumeStrength = 'Strong' if score > 75 else ('Average' if score > 50 else 'Weak')
                jobFitLevel = 'High' if matchPercentage > 80 else ('Medium' if matchPercentage > 60 else 'Low')
                
                # Use original case for skills in response
                matched_skills_display = []
                for ms in matched_skills:
                    # Find original case version from skills list
                    orig_skill = next((s for s in skills if s.lower() == ms), ms.title())
                    matched_skills_display.append(orig_skill)
                
                name = name_ner or (f.filename or f'candidate_{i}').rsplit('.',1)[0].replace('_', ' ').title()
                college = college_ner or 'Not specified'
                location = location_ner or 'Not specified'
                
                candidate = {
                    'candidateId': f'cand_{int(time.time())}_{i}',
                    'name': name,
                    'email': email,
                    'skills': skills[:20],  # Limit to top 20 skills
                    'missingSkills': missing_skills,
                    'experience': experience,
                    'college': college,
                    'location': location,
                    'matchPercentage': matchPercentage,
                    'score': score,
                    'resumeStrength': resumeStrength,
                    'jobFitLevel': jobFitLevel
                }
                results.append(candidate)
                
                print(f"Processed {f.filename}: {len(skills)} skills, {experience} yrs exp, score: {score}%")
                
            except Exception as e:
                print(f"Error processing file {f.filename}: {e}")
                # Add error candidate
                results.append({
                    'candidateId': f'cand_error_{int(time.time())}_{i}',
                    'name': (f.filename or f'candidate_{i}').rsplit('.',1)[0],
                    'email': '',
                    'skills': [],
                    'missingSkills': req_skills,
                    'experience': 0,
                    'college': None,
                    'location': None,
                    'matchPercentage': 0,
                    'score': 0,
                    'resumeStrength': 'Weak',
                    'jobFitLevel': 'Low'
                })
        
        return results

    # If we reach here and no files were provided, return empty list
    return results
