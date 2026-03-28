"""
Resume analysis routes — ML service
Extracts candidate information from uploaded resumes and scores them against
a job description / required-skills list.

Extraction methods:
    - Name: from filename (preferred) or from text (fallback)
    - Phone: regex, always returned as string (never scientific notation)
    - Experience: section-aware, ignores education dates
    - Location: strict whitelist only (no NER garbage)
    - College: pattern + NER with validation
    - Branch/Degree: careful regex to avoid partial word matches
    - Skills: canonical mapping + skills.json
"""

from fastapi import APIRouter, UploadFile, File, Form, Request
from typing import List, Optional
from . import resume_parser, skill_extractor, scorer
import sys
sys.stdout.reconfigure(encoding='utf-8')
try:
    import spacy
    nlp = spacy.load('en_core_web_sm')
except Exception:
    nlp = None

from .schemas import AnalyzeResponse
import re
import time
import datetime

router = APIRouter()

# ═══════════════════════════════════════════════════════════════════════════════
# Compiled regex patterns
# ═══════════════════════════════════════════════════════════════════════════════

email_re = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

phone_patterns = [
    re.compile(r'\+91[-.\s]?\d{5}[-.\s]?\d{5}'),
    re.compile(r'\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'),
    re.compile(r'(?<!\d)(\d{10})(?!\d)'),
    re.compile(r'\+?\d{1,4}[-.\s]?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}'),
]

portfolio_patterns = [
    re.compile(r'https?://(?:www\.)?(github\.com|gitlab\.com|bitbucket\.org)/[\w\-]+', re.I),
    re.compile(r'https?://(?:www\.)?linkedin\.com/in/[\w\-]+', re.I),
    re.compile(r'https?://[\w\-\.]+\.(com|net|org|io|dev|me)/?[\w\-/]*', re.I),
]

internship_keywords = ['intern', 'internship', 'interned', 'trainee', 'traineeship', 'co-op', 'coop']

# ═══════════════════════════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════════════════════════

SECTION_HEADERS = {
    'education', 'academic', 'academics', 'qualification', 'qualifications',
    'scholastic', 'experience', 'employment', 'work history', 'work experience',
    'professional experience', 'career', 'professional summary',
    'skills', 'technical skills', 'competencies', 'technologies', 'tools',
    'projects', 'project work', 'academic projects', 'personal projects',
    'certifications', 'certificates', 'awards', 'achievements',
    'publications', 'research', 'papers',
    'references', 'hobbies', 'interests', 'extra-curricular',
    'extracurricular', 'co-curricular', 'activities',
    'objective', 'summary', 'profile', 'about me', 'about',
    'personal details', 'personal information', 'contact',
    'contact information', 'contact details', 'declaration',
    'languages', 'strengths', 'responsibilities',
    'relevant courses', 'relevant coursework', 'coursework',
    'courses', 'course work', 'training', 'workshops',
    'minor', 'major', 'specialization', 'concentration',
    'technical proficiency', 'areas of interest',
    'positions of responsibility', 'por',
}

# Words that should NEVER appear in a person's name
NAME_REJECT_WORDS = {
    # Section/resume keywords
    'resume', 'curriculum', 'vitae', 'cv', 'objective', 'summary',
    'profile', 'contact', 'about', 'declaration', 'personal',
    'relevant', 'courses', 'coursework', 'course', 'training',
    'minor', 'major', 'specialization', 'concentration',
    'semester', 'term', 'year', 'batch', 'class',
    'appendix', 'annex', 'reference', 'referee',
    # Institution keywords
    'iit', 'nit', 'iiit', 'bits', 'iisc', 'iim',
    'university', 'college', 'institute', 'school',
    'academy', 'polytechnic', 'vidyalaya', 'vidyapeeth',
    'narayana', 'narayanaa', 'chaitanya', 'sri',
    # Degree keywords
    'bachelor', 'master', 'masters', 'doctorate', 'diploma',
    'engineering', 'technology', 'science', 'arts',
    'btech', 'mtech', 'bsc', 'msc', 'mba', 'bca', 'mca', 'phd',
    # Subject/field keywords
    'economics', 'entrepreneurship', 'management',
    'mechanical', 'electrical', 'civil', 'chemical',
    'biomedical', 'biotechnology', 'bioinformatics',
    'computer', 'information', 'electronics', 'physics',
    'materials', 'metallurgical', 'aerospace',
    'scholar', 'innovation', 'specialisation',
    # Common non-name words at top of resumes
    'page', 'date', 'gender', 'nationality', 'religion',
    'marital', 'status', 'passport', 'visa',
    'updated', 'version', 'final', 'draft',
    'candidate', 'applicant', 'position',
    # Location-type words that appear at top
    'hyderabad', 'bangalore', 'bengaluru', 'mumbai', 'delhi',
    'chennai', 'pune', 'kolkata', 'india',
}

# Words to strip from filenames
FILENAME_STRIP_WORDS = {
    'resume', 'cv', 'final', 'updated', 'version', 'profile', 'doc',
    'document', 'copy', 'new', 'old', 'latest', 'v1', 'v2', 'v3',
    'application', 'job', 'apply', 'submission',
}

NAME_TITLE_PREFIXES = {'mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'shri', 'smt'}

DEGREE_TOKENS = {
    'b.tech', 'btech', 'm.tech', 'mtech', 'b.e', 'b.e.', 'be', 'm.e', 'm.e.', 'me',
    'b.sc', 'bsc', 'm.sc', 'msc', 'b.com', 'bcom', 'm.com', 'mcom',
    'b.a', 'ba', 'm.a', 'ma', 'ph.d', 'phd', 'mba', 'bca', 'mca',
    'bachelor', 'master', 'masters', 'doctorate', 'diploma', 'pgdm',
    'university', 'college', 'institute', 'school', 'degree',
    'intermediate', 'secondary', 'board', 'semester',
    'cgpa', 'gpa', 'percentage', 'marks', 'grade', 'result',
    'iit', 'nit', 'iiit', 'bits', 'iisc', 'iim',
}

TECH_TERMS = {
    'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
    'docker', 'kubernetes', 'aws', 'azure', 'linux', 'git', 'github', 'gitlab',
    'html', 'css', 'sql', 'node', 'flutter', 'swift', 'kotlin', 'golang',
    'ruby', 'php', 'scala', 'rust', 'matlab', 'terraform', 'jenkins',
    'mongodb', 'redis', 'mysql', 'postgresql', 'firebase', 'heroku',
    'tensorflow', 'pytorch', 'pandas', 'numpy', 'flask', 'django',
    'express', 'spring', 'laravel', 'bootstrap', 'tailwind',
    'scikit', 'scipy', 'opencv', 'nltk', 'spacy', 'keras',
    'hugging', 'transformers', 'lightning',
}

# Institution keywords set (used in name validation)
INSTITUTION_WORDS = {
    'iit', 'nit', 'iiit', 'bits', 'iisc', 'iim',
    'university', 'college', 'institute', 'school',
    'academy', 'polytechnic',
}

_KNOWN_LOCATIONS = {
    # Indian metros & major cities
    'bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi', 'hyderabad',
    'chennai', 'pune', 'kolkata', 'ahmedabad', 'jaipur', 'surat', 'lucknow',
    'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'vizag',
    'patna', 'vadodara', 'gurgaon', 'gurugram', 'noida', 'greater noida',
    'faridabad', 'ghaziabad', 'coimbatore', 'mysore', 'mysuru', 'vijayawada',
    'warangal', 'guntur', 'nellore', 'kochi', 'cochin', 'thiruvananthapuram',
    'trivandrum', 'chandigarh', 'ludhiana', 'amritsar', 'dehradun', 'ranchi',
    'jamshedpur', 'raipur', 'bhubaneswar', 'guwahati', 'shimla', 'srinagar',
    'pondicherry', 'puducherry', 'goa', 'mangalore', 'mangaluru', 'hubli',
    'belgaum', 'belagavi', 'davangere', 'tirupati', 'kakinada', 'rajahmundry',
    'madurai', 'trichy', 'tiruchirappalli', 'salem', 'erode', 'vellore',
    'thrissur', 'kozhikode', 'calicut', 'agra', 'varanasi', 'allahabad',
    'prayagraj', 'meerut', 'bareilly', 'aligarh', 'moradabad',
    'navi mumbai', 'howrah', 'jodhpur', 'udaipur', 'kota', 'bikaner',
    'ajmer', 'bhilai', 'cuttack', 'aurangabad', 'nellore', 'raichur',
    'secunderabad', 'khammam', 'karimnagar', 'nizamabad', 'anantapur',
    # States
    'andhra pradesh', 'karnataka', 'kerala', 'maharashtra', 'tamil nadu',
    'telangana', 'uttar pradesh', 'west bengal', 'rajasthan', 'gujarat',
    'haryana', 'punjab', 'madhya pradesh', 'bihar', 'odisha', 'jharkhand',
    'chhattisgarh', 'uttarakhand', 'himachal pradesh', 'assam',
    'meghalaya', 'tripura', 'mizoram', 'manipur', 'nagaland',
    'arunachal pradesh', 'sikkim', 'jammu and kashmir', 'ladakh',
    # International
    'usa', 'uk', 'canada', 'australia', 'germany', 'france', 'singapore',
    'dubai', 'uae', 'remote', 'work from home', 'wfh',
    'new york', 'san francisco', 'los angeles', 'chicago', 'seattle',
    'boston', 'austin', 'denver', 'atlanta', 'houston', 'dallas',
    'london', 'toronto', 'vancouver', 'sydney', 'melbourne', 'berlin',
}

MAJOR_COMPANIES = [
    'microsoft', 'google', 'amazon', 'apple', 'meta', 'facebook', 'netflix',
    'tesla', 'ibm', 'oracle', 'salesforce', 'adobe', 'intel', 'nvidia',
    'uber', 'airbnb', 'twitter', 'linkedin', 'github', 'stripe', 'paypal',
    'deloitte', 'pwc', 'ey', 'kpmg', 'accenture', 'tcs', 'infosys',
    'wipro', 'cognizant', 'capgemini', 'hcl', 'tech mahindra', 'mindtree',
    'zoho', 'freshworks', 'swiggy', 'zomato', 'flipkart', 'ola', 'paytm',
    'razorpay', 'phonepe', 'byju', 'unacademy', 'juspay', 'cred',
]


# ═══════════════════════════════════════════════════════════════════════════════
# Contact extraction
# ═══════════════════════════════════════════════════════════════════════════════

def extract_phone(text: str) -> Optional[str]:
    """Extract phone number. Always returns a STRING, never a number."""
    if not text:
        return None
    search_text = text[:3000]
    for pattern in phone_patterns:
        matches = pattern.findall(search_text)
        if matches:
            raw = matches[0] if isinstance(matches[0], str) else str(matches[0])
            digits = re.sub(r'[^\d]', '', raw)
            if len(digits) >= 10:
                # Format nicely as string
                if len(digits) == 12 and digits.startswith('91'):
                    return f"+91 {digits[2:7]} {digits[7:]}"
                elif len(digits) == 10:
                    return f"{digits[:5]} {digits[5:]}"
                else:
                    return str(digits)
    return None


def extract_portfolio_links(text: str) -> List[str]:
    if not text:
        return []
    links, seen = [], set()
    for pattern in portfolio_patterns:
        for m in pattern.finditer(text):
            url = m.group(0)
            if not url.startswith('http'):
                url = 'https://' + url
            if url not in seen:
                seen.add(url)
                links.append(url)
            if len(links) >= 5:
                return links
    return links


# ═══════════════════════════════════════════════════════════════════════════════
# Internship extraction
# ═══════════════════════════════════════════════════════════════════════════════

def extract_internships(text: str) -> List[str]:
    if not text:
        return []
    internships = []
    lines = text.split('\n')

    for kw in internship_keywords:
        for m in re.finditer(
            rf'{kw}\s+(?:at|with|in)\s+([A-Z][a-zA-Z\s&\.]+?)(?:\s|$|,|\.)',
            text, re.I
        ):
            company = re.sub(r'\s+', ' ', m.group(1)).strip()
            if 3 < len(company) < 50:
                internships.append(company.title())
        for m in re.finditer(
            rf'([A-Z][a-zA-Z\s&\.]+?)\s*[-–—|]\s*{kw}', text, re.I
        ):
            company = re.sub(r'\s+', ' ', m.group(1)).strip()
            if 3 < len(company) < 50:
                internships.append(company.title())

    for i, line in enumerate(lines):
        if any(kw in line.lower() for kw in internship_keywords):
            window = ' '.join(lines[max(0, i - 1):min(len(lines), i + 3)]).lower()
            for company in MAJOR_COMPANIES:
                if company in window:
                    internships.append(company.title())

    seen, result = set(), []
    skip = {'intern', 'internship', 'trainee', 'experience', 'work'}
    for item in internships:
        key = item.lower()
        if key not in seen and key not in skip and len(item) > 2:
            seen.add(key)
            result.append(item)
            if len(result) >= 3:
                break
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# NAME EXTRACTION — METHOD 1: From filename (Preferred)
# ═══════════════════════════════════════════════════════════════════════════════

def extract_name_from_filename(filename: str) -> Optional[str]:
    """
    Extract candidate name from the resume filename.

    Examples:
        Abhijit_Kumar.pdf → Abhijit Kumar
        SaiTejaResume.pdf → Sai Teja
        Mohit Sharma.pdf → Mohit Sharma
        john_doe_resume_final.pdf → John Doe
        1234567890_Rahul_Sharma.pdf → Rahul Sharma
    """
    if not filename:
        return None

    # Remove extension
    name = re.sub(r'\.(pdf|docx|doc|txt|rtf)$', '', filename, flags=re.I)

    # Replace separators with spaces
    name = name.replace('_', ' ').replace('-', ' ')

    # Remove leading timestamp prefixes (e.g., "1709312345_")
    name = re.sub(r'^\d{5,}\s*', '', name)
    name = re.sub(r'^\d+\s+', '', name)

    # Split CamelCase (e.g., SaiTejaResume → Sai Teja Resume)
    name = re.sub(r'([a-z])([A-Z])', r'\1 \2', name)

    # Remove strip words (resume, cv, final, etc.)
    words = name.split()
    cleaned = []
    for w in words:
        w_stripped = w.strip()
        if not w_stripped:
            continue
        if w_stripped.lower() in FILENAME_STRIP_WORDS:
            continue
        if re.match(r'^\d+$', w_stripped):
            continue
        cleaned.append(w_stripped)

    if not cleaned:
        return None

    # Take first 2-4 words that look like name parts
    name_parts = []
    for w in cleaned:
        if len(w) >= 2 and re.match(r'^[a-zA-Z][a-zA-Z.\'\-]*$', w):
            if w.lower() not in NAME_REJECT_WORDS and w.lower() not in TECH_TERMS:
                name_parts.append(w)
        if len(name_parts) >= 4:
            break

    if not name_parts:
        return None

    # Format as Title Case
    result = ' '.join(w.title() if w.islower() or w.isupper() else w for w in name_parts)

    if len(result.strip()) < 2:
        return None

    return result.strip()


# ═══════════════════════════════════════════════════════════════════════════════
# NAME EXTRACTION — METHOD 2: From text (Fallback)
# ═══════════════════════════════════════════════════════════════════════════════

def _format_name(name: str) -> str:
    """Normalise name to clean Title Case."""
    name = re.sub(r'\s+', ' ', name).strip()
    words = name.split()
    if words and words[0].lower().rstrip('.') in NAME_TITLE_PREFIXES:
        words = words[1:]
    name = ' '.join(words)
    name = re.split(r',\s*', name)[0].strip()
    if name.isupper() or name.islower():
        return name.title()
    return name


def _is_name_segment(seg: str) -> bool:
    """Return True if seg could plausibly be a person's name."""
    if not seg or len(seg) < 2:
        return False

    seg_lower = seg.lower().strip()

    # ── reject section headers ──
    if seg_lower in SECTION_HEADERS:
        return False

    # ── reject if starts with any known reject prefix ──
    reject_prefixes = (
        'resume', 'curriculum', 'vitae', 'objective', 'summary',
        'profile', 'contact', 'about', 'declaration', 'personal',
        'relevant', 'coursework', 'minor in', 'major in',
        'position', 'candidate',
    )
    for rp in reject_prefixes:
        if seg_lower.startswith(rp):
            return False

    # ── reject if ANY word in segment is a reject word ──
    seg_words = seg.split()
    seg_words_lower = {w.lower() for w in seg_words}

    if seg_words_lower & NAME_REJECT_WORDS:
        return False

    if seg_words_lower & INSTITUTION_WORDS:
        return False

    # ── reject degree tokens ──
    seg_tokens = set(re.split(r'[\s.]+', seg_lower))
    if seg_tokens & DEGREE_TOKENS:
        return False
    if re.search(r'\b[bm]\.?\s*tech\b', seg_lower):
        return False

    # ── reject lines with email / phone / URL ──
    if '@' in seg or 'http' in seg_lower or 'www.' in seg_lower:
        return False
    digits = re.sub(r'[^\d]', '', seg)
    if len(digits) >= 7:
        return False

    # ── reject date-heavy lines ──
    if re.search(r'\b(19|20)\d{2}\b', seg) and len(seg_words) > 3:
        return False

    # ── reject lines starting with labels ──
    if re.match(r'^(address|location|city|phone|mobile|tel|email|e-mail)', seg_lower):
        return False

    # ── reject known tech terms ──
    if seg_lower in TECH_TERMS:
        return False

    # ── word-structure checks ──
    if not (2 <= len(seg_words) <= 5):
        return False

    # Every word must be alphabetic (allow . ' - for initials/hyphens)
    for w in seg_words:
        if not re.match(r'^[a-zA-Z][a-zA-Z.\'\-]*$', w):
            return False

    # At least the first word must start with uppercase
    if not seg_words[0][0].isupper():
        return False

    # ── reject if too many common/filler words ──
    common_filler = {
        'the', 'and', 'for', 'with', 'from', 'that', 'this',
        'have', 'are', 'was', 'were', 'been', 'being',
        'not', 'but', 'all', 'can', 'had', 'her', 'his',
        'one', 'our', 'out', 'you', 'your', 'what', 'when',
        'who', 'will', 'more', 'about', 'into', 'than',
        'them', 'then', 'some', 'its', 'also', 'after',
        'work', 'using', 'used', 'based', 'built', 'developed',
        'designed', 'implemented', 'created', 'managed',
        'in', 'of', 'at', 'to', 'on', 'by', 'an', 'is',
        'or', 'if', 'it', 'as', 'so', 'up', 'do', 'no',
        'power', 'system', 'device', 'data', 'web', 'mobile',
    }
    non_filler = [w for w in seg_words if w.lower() not in common_filler]
    if len(non_filler) < max(1, len(seg_words) * 0.5):
        return False

    return True


def extract_name_smart(text: str) -> Optional[str]:
    """
    Extract candidate name from resume text.
    Searches first 5 lines primarily (up to 15 lines as fallback).
    """
    if not text or len(text.strip()) < 10:
        return None

    header = text[:2000]
    raw_lines = header.split('\n')

    # Build segments from first 15 lines
    segments: List[str] = []
    for raw_line in raw_lines[:15]:
        stripped = raw_line.strip()
        if not stripped:
            continue
        # Split on column-gap whitespace (3+ spaces)
        parts = re.split(r'\s{3,}', stripped)
        for part in parts:
            part = part.strip()
            part = re.sub(r'^[★☆●◆■□▪▫•·|–—―─\s]+', '', part)
            part = re.sub(r'[★☆●◆■□▪▫•·|–—―─\s]+$', '', part)
            if part and len(part) >= 2:
                segments.append(part)
        if len(segments) >= 20:
            break

    # ── Pass 1: "Name: …" label ──
    for seg in segments[:10]:
        m = re.match(r'^name\s*[:=\-–]\s*(.+)', seg, re.I)
        if m:
            candidate = m.group(1).strip()
            if _is_name_segment(candidate):
                return _format_name(candidate)

    # ── Pass 2: first segment that looks like a name (only first 8) ──
    for seg in segments[:8]:
        if _is_name_segment(seg):
            return _format_name(seg)

    # ── Pass 3: single-word at very top (mononym) ──
    for seg in segments[:3]:
        seg_clean = seg.strip()
        if not seg_clean:
            continue
        words = seg_clean.split()
        if len(words) == 1:
            w = words[0]
            if (len(w) >= 3 and w[0].isupper()
                    and re.match(r'^[a-zA-Z]+$', w)
                    and w.lower() not in SECTION_HEADERS
                    and w.lower() not in TECH_TERMS
                    and w.lower() not in DEGREE_TOKENS
                    and w.lower() not in NAME_REJECT_WORDS):
                return _format_name(w)

    # ── Pass 4: spaCy NER fallback ──
    if nlp:
        try:
            doc = nlp(header[:800])
            for ent in doc.ents:
                if ent.label_ == 'PERSON':
                    name = ent.text.strip()
                    name_words = name.split()
                    if 2 <= len(name_words) <= 4:
                        name_lower_set = {w.lower() for w in name_words}
                        if not (name_lower_set & NAME_REJECT_WORDS):
                            if not (name_lower_set & INSTITUTION_WORDS):
                                if all(re.match(r'^[a-zA-Z.\'\-]+$', w) for w in name_words):
                                    return _format_name(name)
        except Exception:
            pass

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# College extraction
# ═══════════════════════════════════════════════════════════════════════════════

def extract_college_smart(text: str) -> Optional[str]:
    """
    Extract the HIGHEST-LEVEL college/university.
    Prioritises B.Tech/M.Tech/degree institutions over 10th/12th schools.
    """
    if not text:
        return None

    table_header_words = {'degree', 'cgpa', 'marks(%)', 'year',
                          'university/institute', 'cgpa/marks'}

    # Keywords that indicate 10th / 12th / school-level — skip these
    school_level_keywords = {
        '10th', 'tenth', 'x ', 'xth', 'ssc', 'sslc', 'matriculation',
        '12th', 'twelfth', 'xii', 'hsc', 'intermediate', 'inter',
        'higher secondary', 'senior secondary', 'junior college',
        'pu college', 'p.u. college', 'pre-university',
        'high school', 'secondary school', 'cbse', 'icse', 'isc',
        'class 10', 'class 12', 'class x', 'class xii',
        'board of secondary', 'board of intermediate',
    }

    # Keywords that indicate UG/PG degree level — prefer these
    degree_level_keywords = {
        'b.tech', 'btech', 'm.tech', 'mtech', 'b.e', 'b.e.', 'm.e', 'm.e.',
        'b.sc', 'bsc', 'm.sc', 'msc', 'b.com', 'bcom', 'm.com', 'mcom',
        'b.a', 'ba', 'm.a', 'ma', 'mba', 'bca', 'mca',
        'ph.d', 'phd', 'pgdm', 'diploma in',
        'bachelor', 'master', 'doctorate',
        'engineering', 'technology',
    }

    lines = text.split('\n')
    in_education = False

    # Two-pass: first collect degree-level, then any college
    degree_college = None  # From lines near B.Tech/M.Tech etc.
    any_college = None     # Any college/university/institute

    for i, line in enumerate(lines):
        ll = line.strip().lower()
        if any(kw in ll for kw in ['education', 'academic', 'qualification']):
            in_education = True
            continue
        if len(set(ll.split()) & table_header_words) >= 2:
            continue

        if not (in_education or i < 60):
            continue

        # Check if this line or nearby lines are school-level (10th/12th)
        nearby_text = ' '.join(
            lines[max(0, i - 1):min(len(lines), i + 2)]
        ).lower()
        is_school_level = any(sk in nearby_text for sk in school_level_keywords)
        is_degree_level = any(dk in nearby_text for dk in degree_level_keywords)

        # ── IIT / NIT / BITS / IIIT / IISC (always top-priority) ──
        m = re.search(
            r'\b(IIT|NIT|IIIT|BITS|IISC)\s+([A-Za-z][a-zA-Z\s]+?)(?:\s*[,\n(]|$)',
            line, re.I
        )
        if m:
            prefix = m.group(1).upper()
            campus = re.sub(r'\s+', ' ', m.group(2)).strip()
            campus = re.sub(
                r'\s+(degree|year|cgpa|marks|btech|b\.tech|mtech|m\.tech|'
                r'engineering|science|technology|computer|electrical|'
                r'mechanical|civil|electronics).*$',
                '', campus, flags=re.I
            )
            campus_words = campus.split()
            if 1 <= len(campus_words) <= 3 and len(campus) < 30:
                return f"{prefix} {campus.title()}"  # IIT/NIT always wins

        # ── "XYZ University" / "XYZ College" / "XYZ Institute of ..." ──
        m = re.search(
            r'\b([A-Z][a-zA-Z\s&\.\'-]{2,50})\s+'
            r'(University|College|Institute(?:\s+of\s+\w+)?)\b',
            line
        )
        if m:
            name = (m.group(1).strip() + ' ' + m.group(2).strip()).strip()
            name = re.sub(r'\s+(degree|year|cgpa|marks).*$', '', name, flags=re.I)
            if len(name) <= 5:
                continue
            if any(w in name.lower() for w in table_header_words):
                continue

            name_lower = name.lower()

            # Skip obvious school-level names
            if re.match(r'^(pu|p\.u\.?|jr\.?|junior|base|govt\.?|government)\s+'
                        r'(college|school)$', name_lower):
                continue
            if any(sk in name_lower for sk in ('high school', 'secondary school',
                                                 'vidyalaya', 'senior secondary',
                                                 'junior college', 'pu college')):
                # Only save as fallback if nothing else found
                if not any_college and not is_degree_level:
                    any_college = name
                continue

            # If near degree-level keywords, it's the primary college
            if is_degree_level and not is_school_level:
                if not degree_college:
                    degree_college = name
            elif not is_school_level:
                # Not near any level markers — could be either
                if not degree_college:
                    degree_college = name
                elif not any_college:
                    any_college = name
            else:
                # School-level line — only use as last resort
                if not any_college:
                    any_college = name

    # Return degree-level college first, fall back to any college
    if degree_college:
        return degree_college
    if any_college:
        return any_college

    # NER fallback
    if nlp:
        try:
            doc = nlp(text[:5000])
            college_kw = ['iit', 'nit', 'iiit', 'bits', 'iisc', 'iim',
                          'university', 'college', 'institute']
            for ent in doc.ents:
                if ent.label_ == 'ORG':
                    t = ent.text.strip()
                    t_lower = t.lower()
                    if any(kw in t_lower for kw in college_kw):
                        if not any(w in t_lower for w in table_header_words):
                            # Skip school-level
                            if any(sk in t_lower for sk in ('high school', 'vidyalaya',
                                                              'junior college', 'pu college',
                                                              'secondary school')):
                                continue
                            if 3 < len(t) < 80:
                                return t
        except Exception:
            pass
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# Location extraction — STRICT whitelist only (no NER garbage)
# ═══════════════════════════════════════════════════════════════════════════════

def extract_location_smart(text: str) -> Optional[str]:
    """
    Extract location using strict whitelist matching.
    Does NOT use NER fallback to avoid garbage like 'Cancer', 'Hugging', etc.
    """
    if not text:
        return None

    header = text[:3000]

    # Pattern 1: Label-based (Location: Hyderabad)
    loc_pats = [
        re.compile(r'(?:location|address|city|place|residing)\s*[:–\-]\s*([A-Za-z][a-zA-Z\s,]+?)(?:\n|$|;|\|)', re.I),
        re.compile(r'📍\s*([A-Za-z][a-zA-Z\s,]+?)(?:\n|$|;|\|)', re.I),
        re.compile(r'(?:based in|located in|residing in|from)\s+([A-Za-z][a-zA-Z\s,]+?)(?:\n|$|;|\.|,)', re.I),
    ]
    for p in loc_pats:
        m = p.search(header)
        if m:
            loc = re.sub(r',\s*$', '', m.group(1)).strip()
            loc = re.sub(r'\s+', ' ', loc)
            loc_lower = loc.lower().strip()
            # Must match a known location
            if loc_lower in _KNOWN_LOCATIONS:
                return loc.title()
            # Check if any known location is a substring
            for known in sorted(_KNOWN_LOCATIONS, key=len, reverse=True):
                if known in loc_lower:
                    return known.title()

    # Pattern 2: Known-location scan in text (longer names first)
    text_lower = text[:4000].lower()
    for loc in sorted(_KNOWN_LOCATIONS, key=len, reverse=True):
        if re.search(r'\b' + re.escape(loc) + r'\b', text_lower):
            return loc.title()

    return None


def extract_ner(text: str):
    """Return (college, location)."""
    return extract_college_smart(text), extract_location_smart(text)


# ═══════════════════════════════════════════════════════════════════════════════
# Branch / degree extraction — FIXED to avoid greedy matching
# ═══════════════════════════════════════════════════════════════════════════════

def extract_branch_degree(text: str) -> Optional[str]:
    """
    Extract degree and branch. Carefully avoids matching partial words
    like 'be' in 'between' or 'me' in 'methods'.
    """
    if not text:
        return None

    # Build education-section text
    lines = text.split('\n')
    edu_text = ''
    in_education = False

    for i, line in enumerate(lines):
        ll = line.strip().lower()
        if any(kw in ll for kw in ['education', 'academic', 'qualification', 'scholastic']):
            in_education = True
        elif in_education and any(kw in ll for kw in ['experience', 'project', 'skill',
                                                       'certification', 'work', 'achievement']):
            in_education = False

        if in_education or i < 30:
            edu_text += line + '\n'

    if not edu_text.strip():
        edu_text = text[:3000]

    # Degree patterns — require dots or proper formatting to avoid partial matches
    # Key fix: B.E. requires at least one dot, M.E. requires at least one dot
    patterns = [
        # B.Tech / BTech with branch
        (r'\bB\.?\s*Tech(?:nology)?\.?\s+(?:in\s+)?([A-Za-z][a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|\s*\d|$)', 'B.Tech'),
        # M.Tech / MTech with branch
        (r'\bM\.?\s*Tech(?:nology)?\.?\s+(?:in\s+)?([A-Za-z][a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|\s*\d|$)', 'M.Tech'),
        # B.E. — MUST have dots (B.E. or B.E) to avoid matching "be" / "between"
        (r'\bB\.E\.?\s+(?:in\s+)?([A-Za-z][a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|\s*\d|$)', 'B.E.'),
        # M.E. — MUST have dots to avoid matching "me" / "methods"
        (r'\bM\.E\.?\s+(?:in\s+)?([A-Za-z][a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|\s*\d|$)', 'M.E.'),
        # B.Sc
        (r'\bB\.?\s*Sc\.?\s+(?:in\s+)?([A-Za-z][a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|\s*\d|$)', 'B.Sc'),
        # M.Sc
        (r'\bM\.?\s*Sc\.?\s+(?:in\s+)?([A-Za-z][a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|\s*\d|$)', 'M.Sc'),
        # MBA
        (r'\bMBA\.?\s+(?:in\s+)?([A-Za-z][a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|\s*\d|$)', 'MBA'),
        # BCA / MCA (standalone, no branch)
        (r'\bBCA\b', 'BCA'),
        (r'\bMCA\b', 'MCA'),
        # Ph.D
        (r'\bPh\.?\s*D\.?\s+(?:in\s+)?([A-Za-z][a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|\s*\d|$)', 'Ph.D'),
        # Full text: Bachelor of / Master of
        (r"\bBachelor(?:'?s)?\s+(?:of\s+)?([A-Za-z][a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|\s*\d|$)", 'Bachelor'),
        (r"\bMaster(?:'?s)?\s+(?:of\s+)?([A-Za-z][a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|\s*\d|$)", 'Master'),
    ]

    # Garbage words that should never appear in a branch name
    garbage_words = {
        'college', 'university', 'institute', 'school', 'academy',
        'cgpa', 'gpa', 'marks', 'grade', 'result', 'percentage',
        'ngaluru', 'tween', 'thods', 'ween', 'thed',
    }

    for pat, deg in patterns:
        m = re.search(pat, edu_text, re.I)
        if m:
            if m.groups():
                branch = re.sub(r'\s+', ' ', m.group(1)).strip()
                branch = re.sub(r'^(in|of)\s+', '', branch, flags=re.I).strip()
                if 2 < len(branch) < 60:
                    branch_lower = branch.lower()
                    # Reject garbage branches
                    if not any(gw in branch_lower for gw in garbage_words):
                        # Reject if branch is a single common word
                        if len(branch.split()) >= 1:
                            return f"{deg} {branch.title()}"
            else:
                return deg

    # Abbreviated fallback
    branch_map = {
        'cse': 'Computer Science', 'cs': 'Computer Science',
        'it': 'Information Technology', 'ece': 'Electronics & Communication',
        'eee': 'Electrical & Electronics', 'ee': 'Electrical Engineering',
        'me': 'Mechanical Engineering', 'ce': 'Civil Engineering',
        'ai': 'Artificial Intelligence',
    }
    for abbr, full in branch_map.items():
        if re.search(rf'(?:b\.?tech|m\.?tech|b\.e\.|m\.e\.)\b.*?\b{abbr}\b', edu_text, re.I):
            return full

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# Experience extraction — section-aware, conservative for students
# ═══════════════════════════════════════════════════════════════════════════════

def extract_experience(text: str) -> int:
    """
    Extract years of WORK experience.

    Strategy:
    1. Explicit "X years experience" (most reliable)
    2. Date ranges in work/experience sections ONLY
    3. Date ranges near job-title keywords (fallback)
    4. NO seniority heuristic (removes false positives for students)
    """
    if not text:
        return 0

    text_lower = text.lower()
    max_exp = 0

    # Detect student resumes (skip aggressive date-range heuristics)
    is_student = bool(re.search(
        r'\b(fresher|fresh graduate|recent graduate|undergraduate|'
        r'pursuing|currently studying|expected graduation|final year|'
        r'penultimate year|pre-final year)\b', text_lower
    ))

    # ── Pass 1: explicit "X years experience" ──
    explicit = [
        re.compile(r'(\d+)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:work\s+|professional\s+|industry\s+)?experience', re.I),
        re.compile(r'(?:experience|exp)\s*(?:of|:|-)\s*(\d+)\s*\+?\s*(?:years?|yrs?)', re.I),
        re.compile(r'(\d+)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional|industry)\b', re.I),
        re.compile(r'(\d+)\s*\+?\s*(?:years?|yrs?)\s+(?:in|of|with)\s+(?:software|web|mobile|data|cloud|backend|frontend|full)', re.I),
    ]
    for pat in explicit:
        for m in pat.finditer(text):
            try:
                yrs = int(m.group(1))
                if 0 < yrs <= 30:
                    max_exp = max(max_exp, yrs)
            except (ValueError, IndexError):
                continue
    if max_exp > 0:
        return min(max_exp, 25)

    # If explicitly a student, return 0
    if is_student:
        return 0

    # ── Date-range regex ──
    date_range_re = re.compile(
        r'(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?'
        r'(\d{4})\s*[-–—]\s*'
        r'(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?'
        r'(\d{4}|present|current|till\s*date|ongoing|now)',
        re.I,
    )

    education_markers = {
        'education', 'academic', 'qualification', 'scholastic',
        'b.tech', 'btech', 'm.tech', 'mtech', 'b.e', 'b.e.', 'm.e', 'm.e.',
        'b.sc', 'bsc', 'm.sc', 'msc', 'bachelor', 'master', 'ph.d', 'phd',
        'mba', 'bca', 'mca', 'diploma', 'school', 'class', 'board',
        'university', 'college', 'institute', 'degree', 'cgpa', 'gpa',
        'intermediate', 'secondary', 'higher secondary', 'hsc', 'ssc',
        'semester', 'course', 'coursework',
    }

    work_markers = {
        'experience', 'employment', 'work', 'career', 'professional',
        'engineer', 'developer', 'analyst', 'manager', 'consultant',
        'architect', 'lead', 'designer', 'administrator', 'specialist',
        'coordinator', 'associate', 'officer', 'executive', 'scientist',
        'researcher', 'programmer', 'devops', 'sre', 'qa', 'tester',
    }

    lines = text.split('\n')
    section = 'unknown'
    work_years: List[int] = []

    # ── Pass 2: date ranges in WORK sections only ──
    for line_idx, line in enumerate(lines):
        ll = line.strip().lower()

        if len(ll) < 60:
            if any(wm in ll for wm in ('experience', 'employment', 'work history',
                                        'career', 'professional')):
                section = 'work'
            elif any(em in ll for em in ('education', 'academic', 'qualification',
                                         'scholastic')):
                section = 'education'
            elif any(em in ll for em in ('project', 'skill', 'certification',
                                         'achievement', 'award', 'publication')):
                section = 'other'

        for m in date_range_re.finditer(line):
            try:
                start_year = int(m.group(1))
                end_raw = m.group(2).strip().lower()
                if end_raw in ('present', 'current', 'now', 'ongoing') or 'till' in end_raw:
                    end_year = datetime.datetime.now().year
                else:
                    end_year = int(end_raw)

                years = end_year - start_year
                if years <= 0 or years > 30:
                    continue

                nearby = ' '.join(
                    lines[max(0, line_idx - 2):min(len(lines), line_idx + 3)]
                ).lower()

                has_edu = any(em in nearby for em in education_markers)
                has_work = any(wm in nearby for wm in work_markers)

                # STRICT: skip if in education section
                if section == 'education':
                    continue
                if has_edu and not has_work:
                    continue

                # Only count if clearly work-related
                if section == 'work' or (has_work and not has_edu):
                    work_years.append(years)
            except (ValueError, TypeError):
                continue

    if work_years:
        max_exp = max(work_years)

    if max_exp > 0:
        return min(max_exp, 25)

    # ── Pass 3: date ranges near job-title keywords ──
    job_titles = ['engineer', 'developer', 'analyst', 'manager', 'consultant',
                  'architect', 'designer', 'specialist', 'programmer', 'scientist']
    for line_idx, line in enumerate(lines):
        ll = line.strip().lower()
        if any(jt in ll for jt in job_titles):
            # Check nearby context is not education
            nearby = ' '.join(lines[max(0, line_idx - 2):min(len(lines), line_idx + 3)]).lower()
            if any(em in nearby for em in education_markers):
                continue

            for m in date_range_re.finditer(line):
                try:
                    start_year = int(m.group(1))
                    end_raw = m.group(2).strip().lower()
                    if end_raw in ('present', 'current', 'now', 'ongoing') or 'till' in end_raw:
                        end_year = datetime.datetime.now().year
                    else:
                        end_year = int(end_raw)
                    years = end_year - start_year
                    if 0 < years <= 30:
                        max_exp = max(max_exp, years)
                except (ValueError, TypeError):
                    continue

    return min(max_exp, 25)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post('/analyze-resumes', response_model=List[AnalyzeResponse])
async def analyze_resumes(
    request: Request,
    job_title: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    required_skills: Optional[List[str]] = Form(None),
    resumes: Optional[List[UploadFile]] = File(None),
    name_method: Optional[str] = Form(None),
):
    results: List[dict] = []

    ct = request.headers.get('content-type', '')
    is_json = 'application/json' in ct

    job_desc = ''
    req_skills: List[str] = []
    name_extraction_method = name_method or 'auto'

    if is_json:
        try:
            body = await request.json()
        except Exception:
            body = {}
        job = body.get('job') or body.get('jobDescription') or body.get('job_description') or {}
        if isinstance(job, dict):
            job_desc = (job.get('description') or job.get('jobDescription')
                        or job.get('job_description') or '')
            jt = job.get('name') or job.get('title') or job.get('job_title') or ''
        else:
            job_desc, jt = '', ''
        req_skills = ([s.lower() for s in (job.get('requiredSkills')
                       or job.get('required_skills') or [])]
                      if isinstance(job, dict) else [])

        name_extraction_method = body.get('name_method', 'auto')

        files_meta = body.get('filesMeta') or {}
        count = int(files_meta.get('count', 0)) if isinstance(files_meta, dict) else 0
        if count and not resumes:
            for i in range(count):
                results.append({
                    'candidateId': f'cand_stub_{int(time.time())}_{i}',
                    'name': f'Candidate {i + 1}',
                    'email': '', 'skills': [], 'missingSkills': req_skills,
                    'experience': 0, 'college': None, 'branch': None, 'degree': None,
                    'location': None, 'matchPercentage': 0, 'score': 0,
                    'resumeStrength': 'Weak', 'jobFitLevel': 'Low',
                })
            return results
    else:
        job_desc = job_description or ''
        req_skills = [s.lower() for s in (required_skills or [])]
        name_extraction_method = name_method or 'auto'

    if not job_desc and job_title:
        job_desc = job_title
    if req_skills:
        job_desc = f"{job_desc} {', '.join(req_skills)}".strip()

    if not resumes:
        return results

    # ══════════════════════════════════════════════════════════════════════════
    #  Process each uploaded resume
    # ══════════════════════════════════════════════════════════════════════════
    for idx, f in enumerate(resumes):
        try:
            content = await f.read()
            text = resume_parser.extract_text_from_bytes(content, f.filename or '')

            if not text or len(text.strip()) < 30:
                text = f.filename or 'resume'

            # ── Name extraction ─────────────────────────────────────────────
            name = None

            if name_extraction_method == 'filename':
                # PRIMARY: extract from filename
                name = extract_name_from_filename(f.filename or '')
                # Fallback to text if filename extraction fails
                if not name:
                    name = extract_name_smart(text)
            else:
                # AUTO: try text first, then filename fallback
                name = extract_name_smart(text)
                if not name:
                    name = extract_name_from_filename(f.filename or '')

            # Final fallback
            if not name or not name.strip():
                fname_name = extract_name_from_filename(f.filename or '')
                if fname_name:
                    name = fname_name
                else:
                    email_match = email_re.search(text)
                    if email_match:
                        uname = email_match.group(0).split('@')[0]
                        if '.' in uname or '_' in uname:
                            name = uname.replace('.', ' ').replace('_', ' ').title()
                        else:
                            name = f'Candidate {idx + 1}'
                    else:
                        name = f'Candidate {idx + 1}'

            # ── Extract all other fields ────────────────────────────────────
            email_match = email_re.search(text)
            email = email_match.group(0) if email_match else ''
            phone = extract_phone(text)
            portfolio = extract_portfolio_links(text)
            internships = extract_internships(text)
            experience = extract_experience(text)
            college = extract_college_smart(text)
            location = extract_location_smart(text)
            branch = extract_branch_degree(text)
            skills = skill_extractor.extract_skills(text)

            # ── Skill matching ──────────────────────────────────────────────
            skills_lower = {s.lower() for s in skills}
            req_lower = [s.lower().strip() for s in req_skills]

            matched, missing = [], []
            for rs in req_lower:
                found = rs in skills_lower
                if not found:
                    found = any(rs in sk or sk in rs for sk in skills_lower)
                (matched if found else missing).append(rs)

            skill_ratio = len(matched) / max(len(req_lower), 1) if req_lower else 0.5

            # ── Similarity scores ───────────────────────────────────────────
            bert_sim = 0.0
            tfidf_sim = 0.0

            if job_desc and len(job_desc.strip()) > 10:
                try:
                    bert_sim = scorer.semantic_similarity(job_desc, text)
                except Exception:
                    pass
                try:
                    tfidf_sim = scorer.keyword_similarity(job_desc, text)
                except Exception:
                    pass
            else:
                bert_sim = skill_ratio * 0.7
                tfidf_sim = skill_ratio * 0.5

            # ── Quality signals ─────────────────────────────────────────────
            tl = text.lower()

            has_projects = bool(re.search(r'\bprojects?\b', tl))
            has_achievements = bool(re.search(
                r'award|certificate|certification|scholarship|merit|'
                r'winner|finalist|rank\s*\d+|air\s*\d+|topper|honor|distinction',
                tl,
            ))
            has_publications = bool(re.search(
                r'publication|paper|journal|conference|published', tl
            ))
            has_leadership = bool(re.search(
                r'\b(lead|leader|head|coordinator|organized|supervised)\b', tl
            ))
            has_technical_depth = bool(re.search(
                r'algorithm|data structure|system design|architecture|'
                r'optimization|scalability|distributed|microservice',
                tl,
            ))
            top_institutes = (
                'iit', 'nit', 'iisc', 'bits', 'iiit', 'iim',
                'stanford', 'mit', 'harvard', 'carnegie', 'berkeley',
            )
            has_top_edu = any(inst in tl for inst in top_institutes)

            # ════════════════════════════════════════════════════════════════
            #  SCORING
            #  Weights: Skill Match 50%, Experience 20%, Projects 15%, Keywords 15%
            # ════════════════════════════════════════════════════════════════

            # --- Match Percentage (job fit) ---
            raw_match = (
                0.50 * skill_ratio                               # 50% skill match
                + 0.20 * min(experience / 5.0, 1.0)              # 20% experience (capped at 5yr)
                + 0.15 * (0.5 if has_projects else 0.0)          # 15% projects
                + 0.15 * max(tfidf_sim, 0)                       # 15% keyword match
            )
            # Small BERT bonus
            raw_match += 0.05 * max(bert_sim, 0)

            match_pct = int(round(min(max(raw_match, 0), 1) * 100))

            # Floors tied to skill overlap
            if skill_ratio >= 0.9 and match_pct < 75:
                match_pct = 75
            elif skill_ratio >= 0.7 and match_pct < 60:
                match_pct = 60
            elif skill_ratio >= 0.5 and match_pct < 40:
                match_pct = 40

            # --- Score (overall candidate quality) ---
            skills_breadth = min(len(skills) / 12.0, 1.0)
            exp_weight = min(experience / 8.0, 1.0)

            q_bonus = 0.0
            if has_projects:         q_bonus += 0.05
            if has_achievements:     q_bonus += 0.04
            if has_publications:     q_bonus += 0.04
            if has_leadership:       q_bonus += 0.03
            if has_technical_depth:  q_bonus += 0.03
            if has_top_edu:          q_bonus += 0.04
            if internships:          q_bonus += 0.02 * min(len(internships), 3)
            if portfolio:            q_bonus += 0.03
            q_bonus = min(q_bonus, 0.20)

            raw_score = (
                0.25 * skill_ratio
                + 0.20 * skills_breadth
                + 0.15 * exp_weight
                + 0.15 * max(bert_sim, 0)
                + 0.05 * max(tfidf_sim, 0)
                + q_bonus
            )
            score = int(round(min(max(raw_score, 0), 1) * 100))

            # ── Strength & fit labels ───────────────────────────────────────
            resume_strength = (
                'Strong'  if score >= 70
                else 'Average' if score >= 45
                else 'Weak'
            )
            job_fit = (
                'Excellent Fit' if match_pct >= 80
                else 'Good Fit'    if match_pct >= 60
                else 'Partial Fit' if match_pct >= 40
                else 'Low Fit'
            )

            # ── Category scores (0-100 each) for candidate breakdown ──────
            cat_skill   = int(round(min(max(skill_ratio, 0), 1) * 100))
            cat_exp     = int(round(min(experience / 5.0, 1.0) * 100))
            cat_project = int(round((0.5 if has_projects else 0.0) * 100))
            cat_keyword = int(round(min(max(tfidf_sim, 0), 1) * 100))
            cat_edu     = 0
            if has_top_edu:
                cat_edu += 50
            if branch:
                cat_edu += 30
            if college:
                cat_edu += 20
            cat_edu = min(cat_edu, 100)

            bonus_detail = {}
            if has_projects:        bonus_detail['projects'] = True
            if has_achievements:    bonus_detail['achievements'] = True
            if has_publications:    bonus_detail['publications'] = True
            if has_leadership:      bonus_detail['leadership'] = True
            if has_technical_depth: bonus_detail['technicalDepth'] = True
            if has_top_edu:         bonus_detail['topEducation'] = True
            if internships:         bonus_detail['internships'] = len(internships[:3])
            if portfolio:           bonus_detail['portfolio'] = True

            # ── Build result ────────────────────────────────────────────────
            results.append({
                'candidateId':    f'cand_{int(time.time())}_{idx}',
                'name':           _format_name(name) if name else f'Candidate {idx + 1}',
                'email':          email.strip() if email else '',
                'phone':          str(phone) if phone else None,
                'skills':         [s.strip() for s in skills[:20] if s.strip()],
                'matchedSkills':  [s.strip() for s in matched if s.strip()],
                'missingSkills':  [s.strip() for s in missing if s.strip()],
                'experience':     max(0, min(experience, 30)),
                'internships':    internships[:3] if internships else None,
                'college':        college.strip() if college else None,
                'branch':         branch,
                'degree':         branch,
                'location':       location.strip() if location else None,
                'portfolioLinks': portfolio if portfolio else None,
                'matchPercentage': match_pct,
                'score':          score,
                'resumeStrength': resume_strength,
                'jobFitLevel':    job_fit,
                'categoryScores': {
                    'skillMatch':   cat_skill,
                    'experience':   cat_exp,
                    'projects':     cat_project,
                    'keywords':     cat_keyword,
                    'education':    cat_edu,
                },
                'bonusFactors':   bonus_detail,
            })

            print(f"✓ {f.filename}: name={name}, skills={len(skills)}, "
                  f"exp={experience}yrs, match={match_pct}%, score={score}%")

        except Exception as e:
            print(f"✗ Error processing {f.filename}: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                'candidateId': f'cand_err_{int(time.time())}_{idx}',
                'name': extract_name_from_filename(f.filename or '') or f'Candidate {idx + 1}',
                'email': '', 'skills': [], 'missingSkills': req_skills,
                'experience': 0, 'college': None, 'branch': None, 'degree': None,
                'location': None, 'matchPercentage': 0, 'score': 0,
                'resumeStrength': 'Weak', 'jobFitLevel': 'Low',
            })

    return results
