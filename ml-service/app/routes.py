
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

router = APIRouter()

email_re = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
exp_re = re.compile(r"(\d+)\s*(?:\+?\s*years|yrs|year|y)", re.IGNORECASE)


def extract_ner(text: str):
    name = None
    college = None
    location = None
    if not text or nlp is None:
        return name, college, location
    try:
        doc = nlp(text[:10000])
        for ent in doc.ents:
            if ent.label_ == 'PERSON' and not name:
                name = ent.text.strip()
            if ent.label_ == 'ORG' and not college:
                if any(k.lower() in ent.text.lower() for k in ['university','college','institute','iit','iiit','nit','school','academy']):
                    college = ent.text.strip()
            if ent.label_ in ('GPE','LOC') and not location:
                location = ent.text.strip()
    except Exception:
        pass
    return name, college, location


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

    # If we have uploaded files, process them
    if resumes:
        for i, f in enumerate(resumes):
            content = await f.read()
            text = resume_parser.extract_text_from_bytes(content, f.filename or '')
            name_ner, college_ner, location_ner = extract_ner(text)
            email_m = email_re.search(text)
            email = email_m.group(0) if email_m else (f.filename or '')
            exp_m = exp_re.search(text)
            experience = int(exp_m.group(1)) if exp_m else 1
            skills = [s for s in skill_extractor.extract_skills(text)]
            missing = [s for s in req_skills if s not in skills]
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
            name = name_ner or (f.filename or f'candidate_{i}').rsplit('.',1)[0]
            college = college_ner
            location = location_ner
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

    # If we reach here and no files were provided, return empty list
    return results
