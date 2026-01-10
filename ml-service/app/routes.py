
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
# Phone number patterns (international formats)
phone_patterns = [
    re.compile(r'\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}'),  # General phone
    re.compile(r'\+91[-.\s]?\d{10}'),  # Indian format
    re.compile(r'\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'),  # US format
    re.compile(r'\d{10}'),  # Simple 10 digits
]
# Portfolio/Profile links
portfolio_patterns = [
    re.compile(r'https?://(?:www\.)?(github\.com|gitlab\.com|bitbucket\.org)/[\w\-]+', re.IGNORECASE),
    re.compile(r'https?://(?:www\.)?(linkedin\.com/in/|linkedin\.com/pub/)[\w\-]+', re.IGNORECASE),
    re.compile(r'https?://(?:www\.)?(portfolio|personal|website)[\w\-\.]*\.[a-z]{2,}/?[\w\-/]*', re.IGNORECASE),
    re.compile(r'https?://[\w\-\.]+\.(com|net|org|io|dev|me)/?[\w\-/]*', re.IGNORECASE),
]
# Internship patterns
internship_keywords = ['intern', 'internship', 'interned', 'trainee', 'traineeship', 'co-op', 'coop']
# Improved experience extraction - multiple patterns
exp_patterns = [
    re.compile(r"(\d+)\s*\+?\s*(?:years?|yrs?|yr)\s+(?:of\s+)?experience", re.IGNORECASE),
    re.compile(r"experience[:\s]+(\d+)\s*(?:years?|yrs?)", re.IGNORECASE),
    re.compile(r"(\d+)\s*(?:years?|yrs?)\s+(?:in|of|with)", re.IGNORECASE),
    re.compile(r"(?:since|from)\s+\d{4}.*?(?:to|present|\d{4})", re.IGNORECASE),  # Date range
    re.compile(r"(\d+)\s*\+?\s*(?:years?|yrs?)", re.IGNORECASE),  # Fallback
]


def extract_phone(text: str) -> Optional[str]:
    """Extract phone number from text"""
    if not text:
        return None
    for pattern in phone_patterns:
        matches = pattern.findall(text)
        if matches:
            # Return first valid phone number (clean it up)
            phone = matches[0].strip()
            # Remove common separators but keep the number
            phone = re.sub(r'[^\d+]', '', phone)
            if len(phone) >= 10:  # Valid phone should have at least 10 digits
                return phone
    return None


def extract_portfolio_links(text: str) -> List[str]:
    """Extract portfolio/profile links from text"""
    if not text:
        return []
    links = []
    seen = set()
    for pattern in portfolio_patterns:
        matches = pattern.findall(text)
        for match in matches:
            if isinstance(match, tuple):
                match = match[0] if match[0] else text[pattern.search(text).start():pattern.search(text).end()]
            else:
                # Find the full URL
                match_obj = pattern.search(text)
                if match_obj:
                    match = text[match_obj.start():match_obj.end()]
            if match and match not in seen:
                # Ensure it starts with http
                if not match.startswith('http'):
                    match = 'https://' + match
                links.append(match)
                seen.add(match)
    return links[:5]  # Limit to top 5 links


def extract_internships(text: str) -> List[str]:
    """Extract internship/co-op information"""
    if not text:
        return []
    internships = []
    text_lower = text.lower()
    
    # Look for internship sections
    lines = text.split('\n')
    in_internship_section = False
    internship_companies = []
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        # Check if this line mentions internship
        if any(keyword in line_lower for keyword in internship_keywords):
            in_internship_section = True
            # Try to extract company name from same line or next few lines
            # Look for company patterns (capitalized words, known companies)
            words = line.split()
            for word in words:
                # Skip common words
                if word.lower() in ['at', 'in', 'with', 'as', 'intern', 'internship', 'interned']:
                    continue
                # If word is capitalized and not too short, might be company
                if word[0].isupper() and len(word) > 2:
                    # Check if it's a known company name pattern
                    if any(known in word.lower() for known in ['microsoft', 'google', 'amazon', 'apple', 'meta', 'facebook', 'netflix', 'tesla', 'ibm', 'oracle', 'salesforce', 'adobe', 'intel', 'nvidia', 'uber', 'airbnb', 'twitter', 'linkedin', 'github', 'stripe', 'paypal', 'visa', 'mastercard', 'jpmorgan', 'goldman', 'morgan', 'stanley', 'mckinsey', 'bcg', 'bain', 'deloitte', 'pwc', 'ey', 'kpmg']):
                        internship_companies.append(word)
                        break
            # Also check next 2 lines for company name
            for j in range(i+1, min(i+3, len(lines))):
                next_line = lines[j]
                # Look for company indicators
                if any(indicator in next_line.lower() for indicator in ['company', 'organization', 'firm', 'corp', 'inc', 'ltd']):
                    # Extract potential company name
                    words = next_line.split()
                    for word in words:
                        if word[0].isupper() and len(word) > 2:
                            internship_companies.append(word)
                            break
    
    # Also do pattern matching for "Intern at Company" or "Company - Intern"
    for keyword in internship_keywords:
        pattern = re.compile(rf'{keyword}[:\s]+(?:at\s+)?([A-Z][a-zA-Z\s&]+)', re.IGNORECASE)
        matches = pattern.findall(text)
        internship_companies.extend(matches)
        
        pattern2 = re.compile(rf'([A-Z][a-zA-Z\s&]+)\s*[-–—]\s*{keyword}', re.IGNORECASE)
        matches2 = pattern2.findall(text)
        internship_companies.extend(matches2)
    
    # Clean and deduplicate
    seen = set()
    for company in internship_companies:
        company_clean = company.strip().title()
        if len(company_clean) > 2 and company_clean not in seen:
            internships.append(company_clean)
            seen.add(company_clean)
            if len(internships) >= 2:  # Top 2 only as requested
                break
    
    return internships


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
                
                # #region agent log
                import json
                log_path = r'c:\Users\DELL\Desktop\Resume screening project\.cursor\debug.log'
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'A',
                            'location': 'routes.py:301',
                            'message': 'Starting resume extraction',
                            'data': {'filename': f.filename, 'text_length': len(text)},
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                
                name_ner, college_ner, location_ner = extract_ner(text)
                email_m = email_re.search(text)
                email = email_m.group(0) if email_m else (f.filename or '')
                
                # Extract phone number
                phone = extract_phone(text)
                
                # Extract portfolio links
                portfolio_links = extract_portfolio_links(text)
                
                # Extract internships (top 2 only)
                internships = extract_internships(text)
                
                # Improved experience extraction
                experience = extract_experience(text)
                
                # Extract skills with better matching
                skills = skill_extractor.extract_skills(text)
                
                # #region agent log
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'A',
                            'location': 'routes.py:325',
                            'message': 'Extracted contact info',
                            'data': {'phone': phone, 'email': email, 'portfolio_count': len(portfolio_links), 'internships': internships},
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                
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
                
                # Extract additional resume elements for scoring
                text_lower = text.lower()
                has_projects = any(keyword in text_lower for keyword in ['project', 'projects', 'developed', 'built', 'implemented', 'created'])
                has_achievements = any(keyword in text_lower for keyword in ['achievement', 'award', 'certificate', 'certification', 'rank', 'topper', 'merit', 'scholarship'])
                has_courses = any(keyword in text_lower for keyword in ['course', 'courses', 'curriculum', 'syllabus', 'subject'])
                has_publications = any(keyword in text_lower for keyword in ['publication', 'paper', 'research', 'journal', 'conference'])
                has_leadership = any(keyword in text_lower for keyword in ['lead', 'leader', 'head', 'coordinator', 'manager', 'director', 'president', 'vice'])
                
                # Calculate score with improved weighting (skills matter more, experience bonus)
                base_score = scorer.compute_score(bert_sim, tfidf_sim, skill_ratio)
                
                # Add experience bonus (0-10 points)
                exp_bonus = min(experience * 0.02, 0.10)  # Max 10% bonus for 5+ years
                
                # Add bonus for resume richness (projects, achievements, courses, etc.)
                richness_bonus = 0.0
                if has_projects: richness_bonus += 0.03  # 3% for projects
                if has_achievements: richness_bonus += 0.02  # 2% for achievements
                if has_courses: richness_bonus += 0.02  # 2% for relevant courses
                if has_publications: richness_bonus += 0.03  # 3% for publications
                if has_leadership: richness_bonus += 0.02  # 2% for leadership roles
                if len(internships) > 0: richness_bonus += 0.02  # 2% for internships
                richness_bonus = min(richness_bonus, 0.10)  # Cap at 10%
                
                # Adjust weights: Skills 40%, BERT 40%, TF-IDF 15%, Experience 5%, Richness 10%
                if req_skills_normalized:
                    # If we have required skills, prioritize skill matching
                    adjusted_score = (0.40 * skill_ratio) + (0.40 * max(0, bert_sim)) + (0.15 * max(0, tfidf_sim)) + exp_bonus + richness_bonus
                else:
                    # If no required skills, use original scoring with bonuses
                    adjusted_score = base_score + exp_bonus + richness_bonus
                
                # #region agent log
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'B',
                            'location': 'routes.py:380',
                            'message': 'Scoring calculation',
                            'data': {
                                'skill_ratio': skill_ratio,
                                'bert_sim': bert_sim,
                                'tfidf_sim': tfidf_sim,
                                'exp_bonus': exp_bonus,
                                'richness_bonus': richness_bonus,
                                'has_projects': has_projects,
                                'has_achievements': has_achievements,
                                'has_courses': has_courses
                            },
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                
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
                    'phone': phone,
                    'skills': skills[:20],  # Limit to top 20 skills
                    'missingSkills': missing_skills,
                    'experience': experience,
                    'internships': internships[:2] if internships else None,  # Top 2 only
                    'college': college,
                    'location': location,
                    'portfolioLinks': portfolio_links if portfolio_links else None,
                    'matchPercentage': matchPercentage,
                    'score': score,
                    'resumeStrength': resumeStrength,
                    'jobFitLevel': jobFitLevel
                }
                results.append(candidate)
                
                # #region agent log
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'C',
                            'location': 'routes.py:420',
                            'message': 'Candidate created',
                            'data': {
                                'name': name,
                                'phone': phone,
                                'portfolio_count': len(portfolio_links) if portfolio_links else 0,
                                'internships_count': len(internships),
                                'score': score
                            },
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                
                print(f"Processed {f.filename}: {len(skills)} skills, {experience} yrs exp, {len(internships)} internships, score: {score}%")
                
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
