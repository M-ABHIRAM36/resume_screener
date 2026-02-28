"""
Resume analysis routes — ML service
Extracts candidate information from uploaded resumes and scores them against
a job description / required-skills list.
"""

from fastapi import APIRouter, UploadFile, File, Form, Request
from typing import List, Optional
from . import resume_parser, skill_extractor, scorer

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

# ═══════════════════════════════════════════════════════════════════════════════
# Compiled regex patterns
# ═══════════════════════════════════════════════════════════════════════════════

email_re = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

phone_patterns = [
    re.compile(r'\+91[-.\s]?\d{5}[-.\s]?\d{5}'),
    re.compile(r'\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'),
    re.compile(r'\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}'),
    re.compile(r'\b\d{10}\b'),
]

portfolio_patterns = [
    re.compile(r'https?://(?:www\.)?(github\.com|gitlab\.com|bitbucket\.org)/[\w\-]+', re.I),
    re.compile(r'https?://(?:www\.)?linkedin\.com/in/[\w\-]+', re.I),
    re.compile(r'https?://[\w\-\.]+\.(com|net|org|io|dev|me)/?[\w\-/]*', re.I),
]

internship_keywords = ['intern', 'internship', 'interned', 'trainee', 'traineeship', 'co-op', 'coop']

# ═══════════════════════════════════════════════════════════════════════════════
# Constants for extraction
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
}

NAME_TITLE_PREFIXES = {'mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'shri', 'smt'}

DEGREE_TOKENS = {
    'b.tech', 'btech', 'm.tech', 'mtech', 'b.e', 'be', 'm.e', 'me',
    'b.sc', 'bsc', 'm.sc', 'msc', 'b.com', 'bcom', 'm.com', 'mcom',
    'b.a', 'ba', 'm.a', 'ma', 'ph.d', 'phd', 'mba', 'bca', 'mca',
    'bachelor', 'master', 'masters', 'doctorate', 'diploma', 'pgdm',
    'university', 'college', 'institute', 'school', 'degree',
    'intermediate', 'secondary', 'board', 'semester',
    'cgpa', 'gpa', 'percentage', 'marks', 'grade', 'result',
}

TECH_TERMS = {
    'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
    'docker', 'kubernetes', 'aws', 'azure', 'linux', 'git', 'github', 'gitlab',
    'html', 'css', 'sql', 'node', 'flutter', 'swift', 'kotlin', 'golang',
    'ruby', 'php', 'scala', 'rust', 'matlab', 'terraform', 'jenkins',
    'mongodb', 'redis', 'mysql', 'postgresql', 'firebase', 'heroku',
    'tensorflow', 'pytorch', 'pandas', 'numpy', 'flask', 'django',
    'express', 'spring', 'laravel', 'bootstrap', 'tailwind',
}

_LOCATION_FALSE_POSITIVES = TECH_TERMS | {
    'c', 'c++', 'c#', 'r', 'go', 'dart', 'perl',
    'sass', 'less', 'svelte', 'jquery', 'next.js', 'nuxt',
    'elasticsearch', 'cassandra', 'dynamodb',
    'ansible', 'circleci', 'travis',
    'keras', 'scikit', 'scipy', 'opencv', 'nltk', 'spacy',
    'api', 'rest', 'graphql', 'json', 'xml', 'http', 'https',
    'algorithms', 'data structures', 'machine learning', 'deep learning',
    'experience', 'project', 'skills', 'education', 'work',
    'reddy', 'kumar', 'singh', 'sharma', 'patel', 'gupta',
    'jira', 'latex', 'bash', 'powershell', 'vim', 'emacs',
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
    # States
    'andhra pradesh', 'karnataka', 'kerala', 'maharashtra', 'tamil nadu',
    'telangana', 'uttar pradesh', 'west bengal', 'rajasthan', 'gujarat',
    'haryana', 'punjab', 'madhya pradesh', 'bihar', 'odisha', 'jharkhand',
    'chhattisgarh', 'uttarakhand', 'himachal pradesh', 'assam',
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
    if not text:
        return None
    for pattern in phone_patterns:
        matches = pattern.findall(text[:3000])
        if matches:
            raw = matches[0] if isinstance(matches[0], str) else str(matches[0])
            digits = re.sub(r'[^\d+]', '', raw)
            if len(digits) >= 10:
                return digits
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

    # Pattern 1: "Intern at Company"
    for kw in internship_keywords:
        for m in re.finditer(
            rf'{kw}\s+(?:at|with|in)\s+([A-Z][a-zA-Z\s&\.]+?)(?:\s|$|,|\.)',
            text, re.I
        ):
            company = re.sub(r'\s+', ' ', m.group(1)).strip()
            if 3 < len(company) < 50:
                internships.append(company.title())

        # Pattern 2: "Company — Intern"
        for m in re.finditer(
            rf'([A-Z][a-zA-Z\s&\.]+?)\s*[-–—|]\s*{kw}', text, re.I
        ):
            company = re.sub(r'\s+', ' ', m.group(1)).strip()
            if 3 < len(company) < 50:
                internships.append(company.title())

    # Pattern 3: known companies near internship keywords
    for i, line in enumerate(lines):
        if any(kw in line.lower() for kw in internship_keywords):
            window = ' '.join(lines[max(0, i - 1):min(len(lines), i + 3)]).lower()
            for company in MAJOR_COMPANIES:
                if company in window:
                    internships.append(company.title())

    # Deduplicate
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
# Name extraction  (the most critical function)
# ═══════════════════════════════════════════════════════════════════════════════

def _format_name(name: str) -> str:
    """Normalise name to clean Title Case."""
    name = re.sub(r'\s+', ' ', name).strip()
    # Strip title prefixes  (Mr. / Dr. / Prof. …)
    words = name.split()
    if words and words[0].lower().rstrip('.') in NAME_TITLE_PREFIXES:
        words = words[1:]
    # Strip trailing suffix after comma  ("Doe, PhD")
    name = ' '.join(words)
    name = re.split(r',\s*', name)[0].strip()
    if name.isupper() or name.islower():
        return name.title()
    return name


def _is_name_segment(seg: str) -> bool:
    """Return True if *seg* could plausibly be a person's name."""
    if not seg or len(seg) < 2:
        return False

    seg_lower = seg.lower().strip()

    # ── reject section headers ──
    if seg_lower in SECTION_HEADERS:
        return False
    for h in ('resume', 'curriculum', 'vitae', 'objective', 'summary',
              'profile', 'contact', 'about', 'declaration', 'personal'):
        if seg_lower.startswith(h):
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
    if re.search(r'\b(19|20)\d{2}\b', seg) and len(seg.split()) > 4:
        return False

    # ── reject lines starting with location/address labels ──
    if re.match(r'^(address|location|city|phone|mobile|tel|email|e-mail)', seg_lower):
        return False

    # ── reject known tech terms (single-word) ──
    if seg_lower in TECH_TERMS:
        return False

    # ── word-structure checks ──
    words = seg.split()
    if not (2 <= len(words) <= 6):
        return False  # require 2-6 words for a name

    # Every word must be alphabetic  (allow . ' - for initials / hyphenated names)
    for w in words:
        if not re.match(r'^[a-zA-Z][a-zA-Z.\'\-]*$', w):
            return False

    # At least the first word must start with an uppercase letter
    if not words[0][0].isupper():
        return False

    return True


def extract_name_smart(text: str) -> Optional[str]:
    """
    Extract the candidate's name from the resume.

    Strategy
    --------
    * Names are almost always at the very top of the resume.
    * Layout-extracted PDFs may produce wide lines with column gaps
      (multiple spaces).  We split each line on 3+ space runs to
      isolate individual segments before testing.
    """
    if not text or len(text.strip()) < 10:
        return None

    header = text[:2000]
    raw_lines = header.split('\n')

    # Build segments: strip each line, split on 3+ space gaps (column separator)
    segments: List[str] = []
    for raw_line in raw_lines[:25]:
        stripped = raw_line.strip()
        if not stripped:
            continue
        # Split on column-gap whitespace
        parts = re.split(r'\s{3,}', stripped)
        for part in parts:
            part = part.strip()
            # Strip common decorative chars
            part = re.sub(r'^[★☆●◆■□▪▫•·|–—―─\s]+', '', part)
            part = re.sub(r'[★☆●◆■□▪▫•·|–—―─\s]+$', '', part)
            if part and len(part) >= 2:
                segments.append(part)
        if len(segments) >= 30:
            break

    # ── Pass 1: "Name: …" / "Name - …" label ──
    for seg in segments[:12]:
        m = re.match(r'^name\s*[:=\-–]\s*(.+)', seg, re.I)
        if m:
            candidate = m.group(1).strip()
            if _is_name_segment(candidate):
                return _format_name(candidate)

    # ── Pass 2: first segment that looks like a name ──
    for i, seg in enumerate(segments[:15]):
        if _is_name_segment(seg):
            # Accept it  (early segments are heavily favoured)
            return _format_name(seg)

    # ── Pass 3: relaxed single-word check for first 3 segments ──
    # Some resumes have a single first-name on the top line
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
                    and w.lower() not in DEGREE_TOKENS):
                # single word at the very top — likely a mononym or partial name
                return _format_name(w)

    # ── Pass 4: spaCy NER fallback ──
    if nlp:
        try:
            doc = nlp(header[:1500])
            persons = []
            for ent in doc.ents:
                if ent.label_ == 'PERSON':
                    name = ent.text.strip()
                    pos = text.find(name)
                    if 2 < len(name.split()) <= 6 and pos < 800:
                        persons.append((name, pos))
            if persons:
                persons.sort(key=lambda x: x[1])
                return _format_name(persons[0][0])
        except Exception:
            pass

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# College extraction
# ═══════════════════════════════════════════════════════════════════════════════

def extract_college_smart(text: str) -> Optional[str]:
    if not text:
        return None

    table_header_words = {'degree', 'cgpa', 'marks(%)', 'year', 'university/institute', 'cgpa/marks'}
    college_kw = ['iit', 'nit', 'iiit', 'bits', 'iisc', 'iim',
                  'university', 'college', 'institute', 'school of']

    lines = text.split('\n')
    in_education = False

    for i, line in enumerate(lines):
        ll = line.strip().lower()
        if any(kw in ll for kw in ['education', 'academic', 'qualification']):
            in_education = True
            continue

        # Skip table headers
        if len(set(ll.split()) & table_header_words) >= 2:
            continue

        if in_education or i < 60:
            # IIT / NIT / BITS / IIIT / IISC
            m = re.search(
                r'\b(IIT|NIT|IIIT|BITS|IISC)\s+([A-Za-z][a-zA-Z\s]+?)(?:\s*[,\n(]|$)',
                line, re.I
            )
            if m:
                prefix = m.group(1).upper()
                campus = re.sub(r'\s+', ' ', m.group(2)).strip()
                campus = re.sub(r'\s+(degree|year|cgpa|marks).*$', '', campus, flags=re.I)
                if 1 < len(campus) < 40:
                    return f"{prefix} {campus.title()}"

            # "XYZ University" / "XYZ College" / "XYZ Institute of ..."
            m = re.search(
                r'\b([A-Z][a-zA-Z\s&\.\'-]{2,50})\s+'
                r'(University|College|Institute(?:\s+of\s+\w+)?)\b',
                line
            )
            if m:
                name = (m.group(1).strip() + ' ' + m.group(2).strip()).strip()
                name = re.sub(r'\s+(degree|year|cgpa|marks).*$', '', name, flags=re.I)
                if len(name) > 5 and not any(w in name.lower() for w in table_header_words):
                    return name

    # NER fallback
    if nlp:
        try:
            doc = nlp(text[:5000])
            for ent in doc.ents:
                if ent.label_ == 'ORG':
                    t = ent.text.strip()
                    if any(kw in t.lower() for kw in college_kw):
                        if not any(w in t.lower() for w in table_header_words):
                            if 3 < len(t) < 80:
                                return t
        except Exception:
            pass
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# Location extraction
# ═══════════════════════════════════════════════════════════════════════════════

def extract_location_smart(text: str) -> Optional[str]:
    if not text:
        return None

    header = text[:3000]

    # Pattern-based
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
            if loc.lower() not in _LOCATION_FALSE_POSITIVES and 2 < len(loc) < 50:
                return loc.title()

    # Known-location scan (longer names first to avoid partial matches)
    text_lower = text[:4000].lower()
    for loc in sorted(_KNOWN_LOCATIONS, key=len, reverse=True):
        if re.search(r'\b' + re.escape(loc) + r'\b', text_lower):
            return loc.title()

    # NER fallback
    if nlp:
        try:
            doc = nlp(text[:5000])
            for ent in doc.ents:
                if ent.label_ in ('GPE', 'LOC'):
                    t = ent.text.strip().lower()
                    if (t not in _LOCATION_FALSE_POSITIVES
                            and 2 < len(t) < 50
                            and not any(c in t for c in ['+', '#', '.js', '()'])):
                        return ent.text.strip().title()
        except Exception:
            pass

    return None


def extract_ner(text: str):
    """Return (college, location)."""
    return extract_college_smart(text), extract_location_smart(text)


# ═══════════════════════════════════════════════════════════════════════════════
# Branch / degree extraction
# ═══════════════════════════════════════════════════════════════════════════════

def extract_branch_degree(text: str) -> Optional[str]:
    if not text:
        return None

    patterns = [
        (r'\bb\.?\s*tech\.?\s*(?:in\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'B.Tech'),
        (r'\bbtech\.?\s*(?:in\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'B.Tech'),
        (r'\bb\.?\s*e\.?\s*(?:in\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'B.E.'),
        (r'\bm\.?\s*tech\.?\s*(?:in\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'M.Tech'),
        (r'\bmtech\.?\s*(?:in\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'M.Tech'),
        (r'\bm\.?\s*e\.?\s*(?:in\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'M.E.'),
        (r'\bb\.?\s*sc\.?\s*(?:in\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'B.Sc'),
        (r'\bm\.?\s*sc\.?\s*(?:in\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'M.Sc'),
        (r'\bmba\.?\s*(?:in\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'MBA'),
        (r'\bbca\b', 'BCA'),
        (r'\bmca\b', 'MCA'),
        (r'\bph\.?\s*d\.?\s*(?:in\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'Ph.D'),
        (r'\bbachelor(?:\'?s)?\s+(?:of\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'Bachelor'),
        (r'\bmaster(?:\'?s)?\s+(?:of\s+)?([a-zA-Z\s&]+?)(?:\s+from|\s+at|\s*,|\s*\n|\s*\(|\s*-|$)', 'Master'),
    ]

    for pat, deg in patterns:
        m = re.search(pat, text, re.I)
        if m:
            if m.groups():
                branch = re.sub(r'\s+', ' ', m.group(1)).strip()
                branch = re.sub(r'^(in|of)\s+', '', branch, flags=re.I).strip()
                if 1 < len(branch) < 60:
                    return f"{deg} {branch.title()}"
            else:
                return deg

    # Abbreviated fallback
    branch_map = {
        'cse': 'Computer Science', 'cs': 'Computer Science',
        'it': 'Information Technology', 'ece': 'Electronics & Communication',
        'eee': 'Electrical & Electronics', 'me': 'Mechanical', 'ce': 'Civil',
    }
    for abbr, full in branch_map.items():
        if re.search(rf'(?:tech|degree|engineering|b\.?e|m\.?e)\b.*?\b{abbr}\b', text[:3000], re.I):
            return full

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# Experience extraction  (section-aware — avoids counting education dates)
# ═══════════════════════════════════════════════════════════════════════════════

def extract_experience(text: str) -> int:
    """
    Extract years of **work** experience.

    * Pass 1 — explicit "X years experience" mentions  (most reliable)
    * Pass 2 — date ranges inside work/experience sections only
    * Pass 3 — date ranges near job-title keywords (fallback)
    * Pass 4 — seniority-keyword heuristic  (last resort)

    Education-section date ranges are deliberately skipped.
    """
    if not text:
        return 0

    text_lower = text.lower()
    max_exp = 0

    # ── Pass 1: explicit "X years experience" ───────────────────────────────
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

    # ── Date-range regex (month optional, supports "– Present") ─────────────
    date_range_re = re.compile(
        r'(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?'
        r'(\d{4})\s*[-–—]\s*'
        r'(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?'
        r'(\d{4}|present|current|till\s*date|ongoing|now)',
        re.I,
    )

    education_markers = {
        'education', 'academic', 'qualification', 'scholastic',
        'b.tech', 'btech', 'm.tech', 'mtech', 'b.e', 'be', 'm.e',
        'b.sc', 'bsc', 'm.sc', 'msc', 'bachelor', 'master', 'ph.d', 'phd',
        'mba', 'bca', 'mca', 'diploma', 'school', 'class', 'board',
        'university', 'college', 'institute', 'degree', 'cgpa', 'gpa',
        'intermediate', 'secondary', 'higher secondary', 'hsc', 'ssc',
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

    # ── Pass 2: date ranges in recognised WORK sections ─────────────────────
    for line_idx, line in enumerate(lines):
        ll = line.strip().lower()

        # Detect section headers (short lines)
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

                # Context from ±2 lines
                nearby = ' '.join(
                    lines[max(0, line_idx - 2):min(len(lines), line_idx + 3)]
                ).lower()

                has_edu = any(em in nearby for em in education_markers)
                has_work = any(wm in nearby for wm in work_markers)

                # Skip education-section date ranges
                if section == 'education' and not has_work:
                    continue
                if has_edu and not has_work and section != 'work':
                    continue

                work_years.append(years)
            except (ValueError, TypeError):
                continue

    if work_years:
        max_exp = max(max_exp, max(work_years))

    if max_exp > 0:
        return min(max_exp, 25)

    # ── Pass 3: date ranges near job-title keywords (any section) ───────────
    for line_idx, line in enumerate(lines):
        ll = line.strip().lower()
        if any(wm in ll for wm in work_markers):
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

    if max_exp > 0:
        return min(max_exp, 25)

    # ── Pass 4: seniority heuristic ─────────────────────────────────────────
    if any(kw in text_lower for kw in ('senior ', 'lead ', 'principal', 'staff engineer', 'architect')):
        return 5
    if any(kw in text_lower for kw in ('mid-level', 'intermediate', 'mid level')):
        return 3
    if any(kw in text_lower for kw in ('junior ', 'entry level', 'entry-level')):
        return 1
    if any(kw in text_lower for kw in ('fresher', 'fresh graduate', 'recent graduate')):
        return 0

    return 0


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
):
    results: List[dict] = []

    # ── Determine content-type ──
    ct = request.headers.get('content-type', '')
    is_json = 'application/json' in ct

    job_desc = ''
    req_skills: List[str] = []

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

    # Build full job text for similarity comparison
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
                print(f"⚠  Short/empty text for {f.filename}")
                text = f.filename or 'resume'

            # ── Extract all fields ──────────────────────────────────────────
            name        = extract_name_smart(text)
            email_m     = email_re.search(text)
            email       = email_m.group(0) if email_m else ''
            phone       = extract_phone(text)
            portfolio   = extract_portfolio_links(text)
            internships = extract_internships(text)
            experience  = extract_experience(text)
            college, location = extract_ner(text)
            branch      = extract_branch_degree(text)
            skills      = skill_extractor.extract_skills(text)

            # ── Name fallback ───────────────────────────────────────────────
            if not name or not name.strip():
                if email and '@' in email:
                    uname = email.split('@')[0]
                    if '.' in uname or '_' in uname:
                        name = uname.replace('.', ' ').replace('_', ' ').title()
                    else:
                        name = f'Candidate {idx + 1}'
                else:
                    name = ((f.filename or f'candidate_{idx}')
                            .rsplit('.', 1)[0]
                            .replace('_', ' ').replace('-', ' ').title())

            # ── Skill matching ──────────────────────────────────────────────
            skills_lower = {s.lower() for s in skills}
            req_lower = [s.lower().strip() for s in req_skills]

            matched, missing = [], []
            for rs in req_lower:
                found = rs in skills_lower
                if not found:
                    # Check variation / substring match
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
                r'\b(lead|leader|head|coordinator|manager|organized|supervised)\b', tl
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
            #  SCORING  — matchPercentage ≠ score
            # ════════════════════════════════════════════════════════════════

            # --- Match Percentage (how well candidate fits THIS JOB) ---
            #   Heavy weight on skill overlap (the HR's primary filter)
            raw_match = (
                0.55 * skill_ratio
                + 0.30 * max(bert_sim, 0)
                + 0.15 * max(tfidf_sim, 0)
            )
            # Small bonus for relevant experience
            if experience >= 3:
                raw_match += 0.03
            elif experience >= 1:
                raw_match += 0.01

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
            exp_weight     = min(experience / 8.0, 1.0)

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
                + q_bonus            # up to 0.20
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

            # ── Build result ────────────────────────────────────────────────
            results.append({
                'candidateId':    f'cand_{int(time.time())}_{idx}',
                'name':           _format_name(name) if name else f'Candidate {idx + 1}',
                'email':          email.strip() if email else '',
                'phone':          phone or None,
                'skills':         [s.strip() for s in skills[:20] if s.strip()],
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
            })

            print(f"✓ {f.filename}: name={name}, skills={len(skills)}, "
                  f"exp={experience}yrs, match={match_pct}%, score={score}%")

        except Exception as e:
            print(f"✗ Error processing {f.filename}: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                'candidateId': f'cand_err_{int(time.time())}_{idx}',
                'name': ((f.filename or f'candidate_{idx}')
                         .rsplit('.', 1)[0].replace('_', ' ').title()),
                'email': '', 'skills': [], 'missingSkills': req_skills,
                'experience': 0, 'college': None, 'branch': None, 'degree': None,
                'location': None, 'matchPercentage': 0, 'score': 0,
                'resumeStrength': 'Weak', 'jobFitLevel': 'Low',
            })

    return results
