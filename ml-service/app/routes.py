from fastapi import APIRouter, UploadFile, File, Form
from typing import List
from . import resume_parser, skill_extractor, scorer
from .schemas import AnalyzeResponse
from io import BytesIO
import re
import time

router = APIRouter()

email_re = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
exp_re = re.compile(r"(\d+)\s*(?:\+?\s*years|yrs|year|y)", re.IGNORECASE)

@router.post('/analyze-resumes', response_model=List[AnalyzeResponse])
async def analyze_resumes(
    job_title: str = Form(...),
    job_description: str = Form(...),
    required_skills: List[str] = Form([]),
    resumes: List[UploadFile] = File(...)
):
    results = []
    job_desc = job_description or ''
    req_skills = [s.lower() for s in (required_skills or [])]

    for i, f in enumerate(resumes):
        content = await f.read()
        text = resume_parser.extract_text_from_bytes(content, f.filename or '')
        # name via simple heuristics: first PERSON-like by spaCy omitted here, use filename fallback
        # attempt extract email
        email_m = email_re.search(text)
        email = email_m.group(0) if email_m else (f.filename or '')
        # simple experience extraction
        exp_m = exp_re.search(text)
        experience = int(exp_m.group(1)) if exp_m else 1
        # skills
        skills = [s for s in skill_extractor.extract_skills(text)]
        missing = [s for s in req_skills if s not in skills]
        # compute sims
        try:
            bert_sim = scorer.semantic_similarity(job_desc, text)
        except Exception:
            bert_sim = 0.0
        try:
            tfidf_sim = scorer.keyword_similarity(job_desc, text)
        except Exception:
            tfidf_sim = 0.0
        skill_ratio = (len(req_skills) - len(missing)) / max(1, len(req_skills)) if req_skills else 0.0
        final = scorer.compute_score(bert_sim, tfidf_sim, skill_ratio)
        score_int = int(round(final * 100))
        matchPercentage = score_int
        score = score_int
        resumeStrength = 'Strong' if score > 75 else ('Average' if score > 50 else 'Weak')
        jobFitLevel = 'High' if matchPercentage > 80 else ('Medium' if matchPercentage > 70 else 'Low')
        name = (f.filename or f'candidate_{i}').rsplit('.',1)[0]
        college = None
        location = None
        candidate = {
            'candidateId': f'cand_{int(time.time())}_{i}',
            'name': name,
            'email': email,
            'skills': skills,
            'missingSkills': missing,
            'experience': experience,
            'college': college,
            'location': location,
            'matchPercentage': matchPercentage,
            'score': score,
            'resumeStrength': resumeStrength,
            'jobFitLevel': jobFitLevel
        }
        results.append(candidate)
    return results
