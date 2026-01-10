
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
    """Extract internship/co-op information with better pattern matching"""
    if not text:
        return []
    
    internships = []
    text_lower = text.lower()
    lines = text.split('\n')
    
    # Known major companies (for better matching)
    major_companies = [
        'microsoft', 'google', 'amazon', 'apple', 'meta', 'facebook', 'netflix', 'tesla', 'ibm', 'oracle',
        'salesforce', 'adobe', 'intel', 'nvidia', 'uber', 'airbnb', 'twitter', 'linkedin', 'github',
        'stripe', 'paypal', 'visa', 'mastercard', 'jpmorgan', 'goldman', 'sachs', 'morgan stanley',
        'mckinsey', 'bcg', 'bain', 'deloitte', 'pwc', 'ey', 'kpmg', 'accenture', 'tcs', 'infosys',
        'wipro', 'cognizant', 'capgemini', 'hcl', 'tech mahindra', 'mindtree', 'l&t', 'reliance'
    ]
    
    # Pattern 1: "Intern at Company" or "Internship at Company"
    for keyword in internship_keywords:
        # Pattern: "Intern at Microsoft" or "Internship at Google"
        pattern1 = re.compile(rf'{keyword}\s+(?:at|with|in)\s+([A-Z][a-zA-Z\s&\.]+?)(?:\s|$|,|\.)', re.IGNORECASE)
        matches1 = pattern1.findall(text)
        for match in matches1:
            company = match.strip()
            # Clean up company name
            company = re.sub(r'\s+', ' ', company).strip()
            if len(company) > 2 and len(company) < 50:
                internships.append(company.title())
        
        # Pattern: "Company - Intern" or "Company | Intern"
        pattern2 = re.compile(rf'([A-Z][a-zA-Z\s&\.]+?)\s*[-–—|]\s*{keyword}', re.IGNORECASE)
        matches2 = pattern2.findall(text)
        for match in matches2:
            company = match.strip()
            company = re.sub(r'\s+', ' ', company).strip()
            if len(company) > 2 and len(company) < 50:
                internships.append(company.title())
    
    # Pattern 2: Look for internship section with structured format
    in_internship_section = False
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        
        # Detect internship section header
        if any(keyword in line_lower for keyword in ['internship', 'internships', 'intern', 'co-op', 'coop', 'trainee']):
            if any(word in line_lower for word in ['experience', 'history', 'background', 'positions']):
                in_internship_section = True
                continue
        
        # If in internship section, look for company names
        if in_internship_section:
            # Check for date patterns (usually before company)
            if re.search(r'\d{4}', line):
                # Next line or same line might have company
                words = line.split()
                for word in words:
                    word_lower = word.lower().strip('.,;:')
                    # Check if it's a known company
                    for company in major_companies:
                        if company in word_lower or word_lower in company:
                            internships.append(word.title() if word[0].isupper() else company.title())
                            break
                    
                    # Or check for capitalized words that might be company
                    if word[0].isupper() and len(word) > 2:
                        # Skip common words
                        if word_lower not in ['at', 'in', 'with', 'as', 'the', 'and', 'or', 'of', 'for']:
                            # Check if it looks like a company name (multiple capitalized words)
                            if i < len(lines) - 1:
                                next_line = lines[i+1] if i+1 < len(lines) else ''
                                if any(indicator in next_line.lower() for indicator in ['intern', 'internship', 'trainee']):
                                    internships.append(word.title())
    
    # Pattern 3: Look for company names near internship keywords
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in internship_keywords):
            # Check current line and next 2 lines for company names
            for j in range(max(0, i-1), min(len(lines), i+3)):
                check_line = lines[j]
                # Look for known companies
                for company in major_companies:
                    if company in check_line.lower():
                        # Extract the actual company name from line
                        words = check_line.split()
                        for word in words:
                            if company in word.lower():
                                company_name = word.title() if word[0].isupper() else company.title()
                                internships.append(company_name)
                                break
    
    # Clean, deduplicate, and limit to top 2
    seen = set()
    final_internships = []
    for intern in internships:
        intern_clean = intern.strip().title()
        intern_lower = intern_clean.lower()
        # Filter out common false positives
        if (len(intern_clean) > 2 and len(intern_clean) < 50 and 
            intern_lower not in seen and
            intern_lower not in ['intern', 'internship', 'trainee', 'co-op', 'experience', 'work']):
            seen.add(intern_lower)
            final_internships.append(intern_clean)
            if len(final_internships) >= 2:  # Top 2 only
                break
    
    return final_internships


def extract_name_smart(text: str) -> Optional[str]:
    """Extract name from resume content - prioritize content over filename"""
    if not text or len(text.strip()) < 10:
        return None
    
    # Common false positives to exclude (degrees, exams, etc.)
    false_positives = {
        'jee main', 'jee advanced', 'jee mains', 'jee', 'gate', 'cat', 'gre', 'gmat', 'toefl', 'ielts',
        'air', 'rank', 'percentage', 'cgpa', 'gpa', 'marks', 'score', 'certificate', 'certification',
        'project', 'projects', 'experience', 'skills', 'education', 'degree', 'bachelor', 'master',
        'phd', 'doctorate', 'resume', 'cv', 'curriculum vitae', 'objective', 'summary', 'profile',
        'telangana', 'andhra', 'board', 'intermediate', 'secondary', 'university', 'college', 'institute',
        'b.tech', 'btech', 'b.tech.', 'm.tech', 'mtech', 'm.tech.', 'b.e', 'be', 'b.e.', 'm.e', 'me', 'm.e.',
        'b.sc', 'bsc', 'b.sc.', 'm.sc', 'msc', 'm.sc.', 'b.com', 'bcom', 'b.com.', 'm.com', 'mcom',
        'b.a', 'ba', 'b.a.', 'm.a', 'ma', 'm.a.', 'ph.d', 'phd', 'ph.d.', 'mba', 'm.b.a', 'm.b.a.',
        'diploma', 'pgdm', 'pg', 'ug', 'undergraduate', 'postgraduate'
    }
    
    # Degree patterns to exclude
    degree_patterns = [
        r'\b[bms]\.?\s*tech\.?\b',
        r'\b[bms]\.?\s*e\.?\b',
        r'\b[bms]\.?\s*sc\.?\b',
        r'\b[bms]\.?\s*com\.?\b',
        r'\b[bms]\.?\s*a\.?\b',
        r'\bph\.?\s*d\.?\b',
        r'\bm\.?\s*b\.?\s*a\.?\b',
        r'\bpgdm\b',
        r'\bdiploma\b'
    ]
    
    # Get first 1000 characters (header section of resume) - name is ALWAYS at top
    header = text[:1000].strip()
    lines = [l.strip() for l in header.split('\n') if l.strip()]
    
    # #region agent log
    import json
    log_path = r'c:\Users\DELL\Desktop\Resume screening project\.cursor\debug.log'
    try:
        with open(log_path, 'a', encoding='utf-8') as log_file:
            log_file.write(json.dumps({
                'sessionId': 'debug-session',
                'runId': 'run1',
                'hypothesisId': 'D',
                'location': 'routes.py:extract_name_smart',
                'message': 'Name extraction started',
                'data': {
                    'header_length': len(header),
                    'first_5_lines': lines[:5],
                    'text_preview': text[:200]
                },
                'timestamp': int(time.time() * 1000)
            }) + '\n')
    except: pass
    # #endregion
    
    # Try to find name in first 3-5 lines (name is ALWAYS at the very top)
    # Prioritize first few lines heavily
    for i, line in enumerate(lines[:5]):
        if not line or len(line) < 3:
            continue
        
        line_lower = line.lower().strip()
        
        # Skip lines that are clearly not names
        if any(fp in line_lower for fp in false_positives):
            continue
        
        # Skip lines with degree patterns
        if any(re.search(pattern, line_lower, re.IGNORECASE) for pattern in degree_patterns):
            continue
        
        # Skip lines with email/phone patterns
        if '@' in line or re.search(r'\d{10,}', line):
            continue
        
        # Skip lines that are too long (likely descriptions) - but allow up to 80 chars for longer names
        if len(line) > 80:
            continue
        
        # Skip lines that are too short (likely initials or single words) - but allow 3+ chars
        if len(line) < 3:
            continue
        
        # Skip lines that look like skills/tools (all lowercase or mixed case tools)
        if line_lower in ['latex', 'git', 'github', 'docker', 'python', 'java', 'javascript']:
            continue
        
        # Pattern 1: "Name: John Doe" or "Name : John Doe" or "Name- John Doe"
        name_match = re.search(r'name\s*[-:]\s*([A-Z][a-zA-Z\s\.]+)', line, re.IGNORECASE)
        if name_match:
            name = name_match.group(1).strip()
            # Clean up name
            name = re.sub(r'\s+', ' ', name).strip()
            if 2 <= len(name.split()) <= 5 and len(name) > 2:
                # #region agent log
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'D',
                            'location': 'routes.py:extract_name_smart',
                            'message': 'Name found via pattern 1',
                            'data': {'name': name, 'line': line},
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                return name.title()
        
        # Pattern 2: First substantial line with 2-8 capitalized words (likely name - can be long Indian names)
        # HEAVILY prioritize first 2 lines for name
        words = [w.strip() for w in line.split() if w.strip()]
        if 2 <= len(words) <= 8:  # Allow longer names (e.g., "B S P Krishna Chaitanya Reddy")
            # Check if most words start with capital (name pattern)
            capitalized_count = sum(1 for w in words if w and w[0].isupper())
            if capitalized_count >= len(words) * 0.8:  # At least 80% capitalized
                # Exclude if contains numbers (except for middle initials like "John D. Smith")
                if not re.search(r'\d', line.replace('.', '')):
                    # Exclude special chars except periods and hyphens (for names like "Mary-Jane")
                    if not any(char in line for char in ['@', '#', '$', '%', '&', '*', '(', ')', '/', '\\']):
                        potential_name = ' '.join(words).strip()
                        potential_name_lower = potential_name.lower()
                        
                        # Check for degree patterns
                        is_degree = any(re.search(pattern, potential_name_lower, re.IGNORECASE) for pattern in degree_patterns)
                        
                        # Check if it's a single word that's a degree (like "B.Tech")
                        is_single_word_degree = (len(words) == 1 and is_degree)
                        
                        # Check if line contains common name indicators (first name patterns)
                        common_first_names = ['krishna', 'chaitanya', 'reddy', 'kumar', 'singh', 'patel', 'sharma', 
                                             'gupta', 'verma', 'mehta', 'jain', 'agarwal', 'malhotra', 'kapoor',
                                             'john', 'michael', 'david', 'james', 'robert', 'william', 'richard',
                                             'mary', 'jennifer', 'lisa', 'susan', 'karen', 'nancy', 'betty']
                        has_name_like_words = any(name in potential_name_lower for name in common_first_names)
                        
                        # Exclude table-like structures
                        has_table_structure = any(word in potential_name_lower for word in ['degree', 'university', 'institute', 'year', 'cgpa', 'marks'])
                        
                        # Final check: not a false positive, not a degree, not table structure
                        # For first 2 lines, be more lenient (name is likely there)
                        is_top_line = i < 2
                        if (not is_degree and
                            not is_single_word_degree and
                            not has_table_structure and
                            potential_name_lower not in false_positives and 
                            not any(fp in potential_name_lower for fp in false_positives) and
                            # Additional check: names usually don't end with common degree suffixes
                            not potential_name_lower.endswith(('.tech', '.e', '.sc', '.com', '.a', '.d', 'tech', 'e', 'sc'))):
                            # For top lines, accept if it looks like a name (3+ words or has name-like words)
                            # For later lines, require name-like words
                            if is_top_line or has_name_like_words or len(words) >= 3:
                                # #region agent log
                                try:
                                    with open(log_path, 'a', encoding='utf-8') as log_file:
                                        log_file.write(json.dumps({
                                            'sessionId': 'debug-session',
                                            'runId': 'run1',
                                            'hypothesisId': 'D',
                                            'location': 'routes.py:extract_name_smart',
                                            'message': 'Name found via pattern 2',
                                            'data': {'name': potential_name, 'line': line, 'line_index': i},
                                            'timestamp': int(time.time() * 1000)
                                        }) + '\n')
                                except: pass
                                # #endregion
                                return potential_name.title()
    
    # Pattern 3: Use NER but filter false positives and prioritize header area
    if nlp:
        try:
            # Check first 1000 chars more carefully
            doc = nlp(text[:1000])
            person_entities = []
            for ent in doc.ents:
                if ent.label_ == 'PERSON':
                    name_candidate = ent.text.strip()
                    name_lower = name_candidate.lower()
                    
                    # Check for degree patterns
                    is_degree = any(re.search(pattern, name_lower, re.IGNORECASE) for pattern in degree_patterns)
                    
                    # Filter out false positives and degrees
                    if (not is_degree and
                        name_lower not in false_positives and 
                        len(name_candidate.split()) <= 8 and  # Allow longer names
                        len(name_candidate) > 2 and
                        not any(fp in name_lower for fp in false_positives) and
                        not name_lower.endswith(('.tech', '.e', '.sc', 'tech', 'e', 'sc'))):
                        # Check if it's in the first 500 chars (header area)
                        pos = text.find(name_candidate)
                        if pos < 500:
                            person_entities.append((name_candidate, pos))
            
            # Sort by position (earlier = more likely to be name)
            if person_entities:
                person_entities.sort(key=lambda x: x[1])
                best_name = person_entities[0][0]
                # #region agent log
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'D',
                            'location': 'routes.py:extract_name_smart',
                            'message': 'Name found via NER',
                            'data': {'name': best_name, 'position': person_entities[0][1]},
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                return best_name.title()
        except Exception as e:
            # #region agent log
            try:
                with open(log_path, 'a', encoding='utf-8') as log_file:
                    log_file.write(json.dumps({
                        'sessionId': 'debug-session',
                        'runId': 'run1',
                        'hypothesisId': 'D',
                        'location': 'routes.py:extract_name_smart',
                        'message': 'NER extraction failed',
                        'data': {'error': str(e)},
                        'timestamp': int(time.time() * 1000)
                    }) + '\n')
            except: pass
            # #endregion
            pass
    
    # #region agent log
    try:
        with open(log_path, 'a', encoding='utf-8') as log_file:
            log_file.write(json.dumps({
                'sessionId': 'debug-session',
                'runId': 'run1',
                'hypothesisId': 'D',
                'location': 'routes.py:extract_name_smart',
                'message': 'Name extraction failed - returning None',
                'data': {'lines_checked': len(lines[:7])},
                'timestamp': int(time.time() * 1000)
            }) + '\n')
    except: pass
    # #endregion
    
    return None


def extract_college_smart(text: str) -> Optional[str]:
    """Extract college name with better pattern matching - avoid table headers"""
    if not text:
        return None
    
    # Table header patterns to exclude
    table_header_patterns = [
        r'degree\s+university',
        r'university/institute',
        r'year\s+cgpa',
        r'cgpa/marks',
        r'marks\s*\(%\)',
        r'university/institute\s+year',
        r'degree\s+university/institute'
    ]
    
    # Known college patterns (prioritize these)
    college_keywords = ['iit', 'nit', 'iiit', 'bits', 'iisc', 'iim', 'university', 'college', 'institute', 'school']
    
    # Common college name patterns
    college_patterns = [
        # Pattern: "IIT Hyderabad" or "IIT Delhi"
        re.compile(r'\b(iit|nit|iiit|bits|iisc)\s+([a-z\s]+?)(?:\s|$|,|\.|\n)', re.IGNORECASE),
        # Pattern: "University Name" or "College Name"
        re.compile(r'\b([a-z\s]+?)\s+(university|college|institute|school)\b', re.IGNORECASE),
        # Pattern: "Name University" or "Name College"
        re.compile(r'\b([A-Z][a-zA-Z\s&]+?)\s+(University|College|Institute|School)\b'),
    ]
    
    lines = text.split('\n')
    
    # Look for college in education section (usually after "Education" or "Academic")
    in_education_section = False
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        
        # Detect education section
        if any(keyword in line_lower for keyword in ['education', 'academic', 'qualification', 'degree']):
            in_education_section = True
            continue
        
        # Skip table headers
        if any(re.search(pattern, line_lower, re.IGNORECASE) for pattern in table_header_patterns):
            continue
        
        # Skip lines that are clearly table headers
        if any(word in line_lower for word in ['degree', 'university/institute', 'year', 'cgpa', 'marks(%)', 'cgpa/marks']):
            if 'iit' not in line_lower and 'nit' not in line_lower:  # Allow if it contains actual college name
                continue
        
        # Look for college patterns
        if in_education_section or i < 50:  # Check first 50 lines or education section
            # Try IIT/NIT pattern first (most common)
            iit_match = re.search(r'\b(iit|nit|iiit|bits|iisc)\s+([a-z\s]+?)(?:\s|$|,|\.|\n)', line, re.IGNORECASE)
            if iit_match:
                college_type = iit_match.group(1).upper()
                college_name = iit_match.group(2).strip()
                # Clean up college name
                college_name = re.sub(r'\s+', ' ', college_name).strip()
                # Remove common suffixes that might be attached
                college_name = re.sub(r'\s+(degree|university|college|institute|year|cgpa|marks).*$', '', college_name, flags=re.IGNORECASE)
                if len(college_name) > 1 and len(college_name) < 50:
                    return f"{college_type} {college_name.title()}"
            
            # Try other college patterns
            for pattern in college_patterns[1:]:
                match = pattern.search(line)
                if match:
                    college_candidate = match.group(0).strip()
                    # Clean up - remove table header text
                    college_candidate = re.sub(r'\s+(degree|year|cgpa|marks|university/institute).*$', '', college_candidate, flags=re.IGNORECASE)
                    # Remove common false positives
                    if not any(word in college_candidate.lower() for word in ['degree', 'cgpa', 'marks', 'year', 'university/institute']):
                        if len(college_candidate) > 5 and len(college_candidate) < 80:
                            return college_candidate.strip()
    
    # Fallback: Use NER but with strict filtering
    if nlp:
        try:
            doc = nlp(text[:5000])  # Check first 5000 chars
            for ent in doc.ents:
                if ent.label_ == 'ORG':
                    ent_text = ent.text.strip()
                    ent_lower = ent_text.lower()
                    # Must contain college keywords
                    if any(kw in ent_lower for kw in college_keywords):
                        # Exclude table headers
                        if not any(re.search(pattern, ent_lower, re.IGNORECASE) for pattern in table_header_patterns):
                            # Exclude if contains table header words (unless it's part of actual name)
                            if not any(word in ent_lower for word in ['degree', 'cgpa', 'marks(%)', 'year', 'university/institute']):
                                if len(ent_text) > 3 and len(ent_text) < 80:
                                    return ent_text
        except Exception:
            pass
    
    return None


def extract_location_smart(text: str) -> Optional[str]:
    """Extract location with better filtering"""
    if not text:
        return None
    
    # Common false positives for location (tools, skills, etc.)
    location_false_positives = {
        'latex', 'git', 'github', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
        'python', 'java', 'javascript', 'typescript', 'react', 'node', 'sql',
        'html', 'css', 'json', 'xml', 'yaml', 'markdown', 'bash', 'shell',
        'linux', 'windows', 'macos', 'ubuntu', 'debian', 'centos', 'reddy'
    }
    
    # Common city/state names to prioritize
    common_locations = [
        'bangalore', 'mumbai', 'delhi', 'hyderabad', 'chennai', 'pune', 'kolkata',
        'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'indore',
        'thane', 'bhopal', 'visakhapatnam', 'patna', 'vadodara', 'gurgaon',
        'noida', 'faridabad', 'coimbatore', 'mysore', 'vijayawada', 'warangal'
    ]
    
    # Pattern-based extraction first
    location_patterns = [
        re.compile(r'location\s*:?\s*([A-Z][a-zA-Z\s,]+)', re.IGNORECASE),
        re.compile(r'📍\s*([A-Z][a-zA-Z\s,]+)', re.IGNORECASE),
        re.compile(r'address\s*:?\s*([A-Z][a-zA-Z\s,]+)', re.IGNORECASE),
    ]
    
    for pattern in location_patterns:
        match = pattern.search(text[:1000])
        if match:
            loc_candidate = match.group(1).strip()
            loc_lower = loc_candidate.lower()
            loc_candidate = re.sub(r',\s*$', '', loc_candidate).strip()
            if (loc_lower not in location_false_positives and
                len(loc_candidate) > 2 and len(loc_candidate) < 50):
                return loc_candidate
    
    # Use NER as fallback
    if nlp:
        try:
            doc = nlp(text[:5000])
            for ent in doc.ents:
                if ent.label_ in ('GPE','LOC'):
                    ent_text_lower = ent.text.lower().strip()
                    if (ent_text_lower not in location_false_positives and
                        len(ent.text.strip()) > 2 and
                        len(ent.text.strip()) < 50):
                        if any(city in ent_text_lower for city in common_locations):
                            return ent.text.strip()
                        elif not any(fp in ent_text_lower for fp in location_false_positives):
                            if not re.search(r'[a-z]+\.[a-z]+', ent_text_lower):
                                return ent.text.strip()
        except Exception:
            pass
    
    return None


def extract_ner(text: str):
    """Extract college and location using improved smart extraction"""
    college = extract_college_smart(text)
    location = extract_location_smart(text)
    return college, location


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
    # But first check if this is a student (has education keywords, no work experience keywords)
    is_student = any(word in text_lower for word in ['student', 'studying', 'pursuing', 'b.tech', 'm.tech', 'bachelor', 'master', 'degree'])
    has_work_experience = any(word in text_lower for word in ['experience', 'worked', 'work experience', 'professional', 'employed', 'job', 'position'])
    
    if max_exp == 0:
        # If student and no work experience mentioned, likely 0-1 years (internships/projects only)
        if is_student and not has_work_experience:
            # Check for internships
            if any(word in text_lower for word in ['intern', 'internship', 'trainee']):
                max_exp = 1  # Internship experience
            else:
                max_exp = 0  # Pure student, no work experience
        elif any(word in text_lower for word in ['senior', 'lead', 'principal', 'architect', 'manager', 'director']):
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
                            'data': {
                                'filename': f.filename, 
                                'text_length': len(text),
                                'first_200_chars': text[:200]
                            },
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                
                # Extract name using smart extraction (from top of resume)
                name = extract_name_smart(text)
                
                # #region agent log
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'G',
                            'location': 'routes.py:600',
                            'message': 'Name extracted from content',
                            'data': {
                                'extracted_name': name,
                                'first_10_lines': '\n'.join(text.split('\n')[:10]),
                                'filename': f.filename
                            },
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                
                # Extract college and location using improved smart extraction
                college_ner, location_ner = extract_ner(text)
                
                # #region agent log
                try:
                    # Find education section for debugging
                    education_section = ''
                    lines = text.split('\n')
                    for i, line in enumerate(lines):
                        if any(kw in line.lower() for kw in ['education', 'academic', 'qualification']):
                            education_section = '\n'.join(lines[max(0, i-2):min(len(lines), i+10)])
                            break
                    
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'H',
                            'location': 'routes.py:690',
                            'message': 'College and location extracted',
                            'data': {
                                'college': college_ner,
                                'location': location_ner,
                                'education_section_preview': education_section[:500],
                                'filename': f.filename
                            },
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                
                # Extract email
                email_m = email_re.search(text)
                email = email_m.group(0) if email_m else ''
                
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
                            'message': 'Extracted contact info and name',
                            'data': {
                                'name': name,
                                'phone': phone, 
                                'email': email, 
                                'portfolio_count': len(portfolio_links), 
                                'internships': internships,
                                'college': college_ner,
                                'location': location_ner
                            },
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
                
                # Extract additional resume elements for intelligent scoring
                text_lower = text.lower()
                
                # Count projects (more projects = better)
                project_keywords = ['project', 'projects', 'developed', 'built', 'implemented', 'created', 'designed', 'architected']
                project_count = sum(1 for keyword in project_keywords if keyword in text_lower)
                has_projects = project_count > 0
                
                # Count achievements (rankings, awards, certifications)
                achievement_patterns = [
                    r'rank\s*\d+', r'air\s*\d+', r'topper', r'award', r'certificate', r'certification',
                    r'scholarship', r'merit', r'winner', r'finalist', r'honor', r'distinction'
                ]
                achievement_count = sum(1 for pattern in achievement_patterns if re.search(pattern, text_lower))
                has_achievements = achievement_count > 0
                
                # Count relevant courses (more courses = better preparation)
                course_keywords = ['course', 'courses', 'curriculum', 'syllabus', 'subject', 'studied', 'learned']
                course_count = sum(1 for keyword in course_keywords if keyword in text_lower)
                has_courses = course_count > 0
                
                # Publications and research
                has_publications = any(keyword in text_lower for keyword in ['publication', 'paper', 'research', 'journal', 'conference', 'published'])
                
                # Leadership and responsibilities
                leadership_keywords = ['lead', 'leader', 'head', 'coordinator', 'manager', 'director', 'president', 'vice', 'organized', 'managed', 'supervised']
                leadership_count = sum(1 for keyword in leadership_keywords if keyword in text_lower)
                has_leadership = leadership_count > 0
                
                # Technical depth indicators
                has_technical_depth = any(keyword in text_lower for keyword in [
                    'algorithm', 'data structure', 'system design', 'architecture', 'optimization',
                    'performance', 'scalability', 'distributed', 'microservices', 'api design'
                ])
                
                # Education quality (IIT, NIT, top universities)
                top_institutes = ['iit', 'nit', 'iisc', 'bits', 'iiit', 'iim', 'stanford', 'mit', 'harvard', 'carnegie']
                has_top_education = any(inst in text_lower for inst in top_institutes)
                
                # Calculate score with improved weighting (skills matter more, experience bonus)
                base_score = scorer.compute_score(bert_sim, tfidf_sim, skill_ratio)
                
                # Add experience bonus (0-10 points)
                exp_bonus = min(experience * 0.02, 0.10)  # Max 10% bonus for 5+ years
                
                # Intelligent scoring: Consider resume quality and depth
                quality_bonus = 0.0
                
                # Projects (scaled by count, max 4%)
                if has_projects:
                    quality_bonus += min(0.01 * project_count, 0.04)
                
                # Achievements (rankings, awards - strong indicator)
                if has_achievements:
                    quality_bonus += min(0.01 * achievement_count, 0.03)
                
                # Relevant courses (shows preparation)
                if has_courses:
                    quality_bonus += min(0.005 * course_count, 0.02)
                
                # Publications (research capability)
                if has_publications:
                    quality_bonus += 0.03
                
                # Leadership (soft skills)
                if has_leadership:
                    quality_bonus += min(0.01 * leadership_count, 0.02)
                
                # Internships (real-world experience)
                if len(internships) > 0:
                    quality_bonus += 0.02 * len(internships)  # 2% per internship
                
                # Technical depth (beyond basic skills)
                if has_technical_depth:
                    quality_bonus += 0.02
                
                # Top-tier education (IIT, NIT, etc.)
                if has_top_education:
                    quality_bonus += 0.03
                
                quality_bonus = min(quality_bonus, 0.15)  # Cap at 15% for quality
                
                # Intelligent scoring with contextual weights
                # Base: Skills 35%, Semantic (BERT) 35%, Keywords (TF-IDF) 15%, Experience 5%, Quality 10%
                if req_skills_normalized:
                    # When we have required skills, prioritize matching
                    base_match_score = (0.35 * skill_ratio) + (0.35 * max(0, bert_sim)) + (0.15 * max(0, tfidf_sim))
                    adjusted_score = base_match_score + exp_bonus + quality_bonus
                else:
                    # No required skills - rely more on semantic similarity and quality
                    adjusted_score = (0.50 * max(0, bert_sim)) + (0.25 * max(0, tfidf_sim)) + exp_bonus + quality_bonus
                
                # Ensure score reflects overall candidate quality, not just keyword matching
                # If candidate has strong profile (top education + projects + achievements), boost score
                if has_top_education and has_projects and has_achievements:
                    adjusted_score = min(adjusted_score + 0.05, 1.0)  # Extra 5% for exceptional profiles
                
                # #region agent log
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'B',
                            'location': 'routes.py:380',
                            'message': 'Intelligent scoring calculation',
                            'data': {
                                'skill_ratio': skill_ratio,
                                'bert_sim': bert_sim,
                                'tfidf_sim': tfidf_sim,
                                'exp_bonus': exp_bonus,
                                'quality_bonus': quality_bonus,
                                'has_projects': has_projects,
                                'project_count': project_count,
                                'has_achievements': has_achievements,
                                'achievement_count': achievement_count,
                                'has_courses': has_courses,
                                'has_top_education': has_top_education,
                                'has_technical_depth': has_technical_depth,
                                'final_score': adjusted_score
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
                
                # Use extracted name - ONLY use filename as last resort if extraction completely fails
                # #region agent log
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'E',
                            'location': 'routes.py:685',
                            'message': 'Name validation before assignment',
                            'data': {
                                'extracted_name': name,
                                'filename': f.filename,
                                'text_has_content': len(text.strip()) > 50
                            },
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                
                if not name or name.strip() == '':
                    # Only use filename if text extraction failed or name extraction failed
                    # Try one more time with a different approach
                    if len(text.strip()) > 50:
                        # Text was extracted, try alternative name extraction
                        # Look for email username as fallback (before @)
                        if email and '@' in email:
                            email_username = email.split('@')[0]
                            # If email username looks like a name (has dots or underscores)
                            if '.' in email_username or '_' in email_username:
                                name = email_username.replace('.', ' ').replace('_', ' ').title()
                            else:
                                # Use generic candidate name instead of filename
                                name = f'Candidate {i+1}'
                        else:
                            name = f'Candidate {i+1}'
                    else:
                        # Text extraction failed, use filename as last resort
                        name = (f.filename or f'candidate_{i}').rsplit('.',1)[0].replace('_', ' ').title()
                else:
                    name = name.title()  # Ensure proper case
                
                # #region agent log
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'E',
                            'location': 'routes.py:710',
                            'message': 'Final name assigned',
                            'data': {'final_name': name, 'source': 'content' if name != f.filename else 'filename'},
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                
                # Properly categorize and clean data
                college = college_ner.strip() if college_ner and college_ner.strip() else 'Not specified'
                location = location_ner.strip() if location_ner and location_ner.strip() else 'Not specified'
                
                # Ensure proper data types and categories
                candidate = {
                    # Personal Information
                    'candidateId': f'cand_{int(time.time())}_{i}',
                    'name': name.strip() if name else f'Candidate {i+1}',
                    'email': email.strip() if email else '',
                    'phone': phone.strip() if phone else None,
                    
                    # Skills Information
                    'skills': [s.strip() for s in skills[:20] if s.strip()],  # Limit to top 20, clean whitespace
                    'missingSkills': [s.strip() for s in missing_skills if s.strip()],
                    
                    # Experience Information
                    'experience': int(experience) if experience else 0,
                    'internships': internships[:2] if internships and len(internships) > 0 else None,  # Top 2 only
                    
                    # Education Information
                    'college': college if college != 'Not specified' else None,
                    'location': location if location != 'Not specified' else None,
                    
                    # Portfolio/Links
                    'portfolioLinks': portfolio_links if portfolio_links and len(portfolio_links) > 0 else None,
                    
                    # Scoring Information
                    'matchPercentage': int(matchPercentage),
                    'score': int(score),
                'resumeStrength': resumeStrength,
                'jobFitLevel': jobFitLevel
            }
                
                # #region agent log
                try:
                    with open(log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(json.dumps({
                            'sessionId': 'debug-session',
                            'runId': 'run1',
                            'hypothesisId': 'F',
                            'location': 'routes.py:730',
                            'message': 'Candidate data categorized',
                            'data': {
                                'name': candidate['name'],
                                'email': candidate['email'],
                                'phone': candidate['phone'],
                                'college': candidate['college'],
                                'location': candidate['location'],
                                'skills_count': len(candidate['skills']),
                                'internships': candidate['internships'],
                                'portfolio_links_count': len(candidate['portfolioLinks']) if candidate['portfolioLinks'] else 0
                            },
                            'timestamp': int(time.time() * 1000)
                        }) + '\n')
                except: pass
                # #endregion
                
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
