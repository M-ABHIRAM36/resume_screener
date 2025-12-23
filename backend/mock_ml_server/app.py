from flask import Flask, request, jsonify
import random
import time
from io import BytesIO
import os

# optional dependencies: PyPDF2, python-docx
try:
    from PyPDF2 import PdfReader
except Exception:
    PdfReader = None
try:
    import docx
except Exception:
    docx = None

app = Flask(__name__)

EXTRA_SKILLS = ['APIs','Docker','Kubernetes','SQL','NoSQL','CI/CD','GraphQL','TypeScript','Python','Django','Flask','React','Node.js','AWS','GCP','Azure','Java','C++','C#','Go','TensorFlow','PyTorch','Pandas','NumPy','HTML','CSS','JavaScript']
COLLEGES = ['IIT Bombay','IIT Delhi','NIT Trichy','IIIT Hyderabad','Anna University','BITS Pilani','Delhi University','Mumbai University']
LOCATIONS = ['Bangalore','Mumbai','Delhi','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad']

rand = random.Random()


def extract_text_from_file_storage(fs):
    filename = fs.filename or 'file'
    data = fs.read()
    lower = filename.lower()
    # txt
    if lower.endswith('.txt'):
        try:
            return data.decode('utf-8', errors='ignore')
        except Exception:
            return ''
    # pdf
    if lower.endswith('.pdf') and PdfReader:
        try:
            reader = PdfReader(BytesIO(data))
            text = []
            for p in reader.pages:
                try:
                    text.append(p.extract_text() or '')
                except Exception:
                    pass
            return '\n'.join(text)
        except Exception:
            return ''
    # docx
    if (lower.endswith('.docx') or lower.endswith('.doc')) and docx:
        try:
            bio = BytesIO(data)
            d = docx.Document(bio)
            return '\n'.join([p.text for p in d.paragraphs])
        except Exception:
            return ''
    # fallback: try decode
    try:
        return data.decode('utf-8', errors='ignore')
    except Exception:
        return ''


def detect_skills(text):
    found = []
    t = (text or '').lower()
    for s in EXTRA_SKILLS:
        if s.lower() in t:
            found.append(s)
    # add a few random skills to diversify
    extras = [s for s in EXTRA_SKILLS if s not in found]
    rand.shuffle(extras)
    found += extras[:rand.randint(0,2)]
    return list(dict.fromkeys(found))


@app.route('/analyze', methods=['POST'])
def analyze():
    job = None
    try:
        # job may be sent as JSON field or in JSON body
        if 'job' in request.form:
            import json
            job = json.loads(request.form.get('job') or '{}')
        else:
            data = request.get_json(silent=True) or {}
            job = data.get('job')
    except Exception:
        job = None

    required = job.get('requiredSkills', []) if job else []

    files = request.files.getlist('resumes') if request.files else []
    out = []

    if not files:
        # fallback to previous behavior (generate N samples)
        count = (request.get_json(silent=True) or {}).get('filesMeta', {}).get('count', 5) or 5
        files = [None] * count

    for i, fs in enumerate(files):
        text = ''
        if fs:
            try:
                text = extract_text_from_file_storage(fs)
            except Exception:
                text = ''
            name = os.path.splitext(fs.filename)[0] if fs and fs.filename else f'candidate_{i}'
            email = (name.replace(' ', '').lower() + str(rand.randint(1,99)) + '@example.com') if name else f'user{i}@example.com'
        else:
            name = f'candidate_{i}'
            email = f'user{i}@example.com'
            text = ''

        skills = detect_skills(text)
        matched = [s for s in (required or []) if s in skills]
        missing = [s for s in (required or []) if s not in skills]
        location = LOCATIONS[i % len(LOCATIONS)]
        college = COLLEGES[i % len(COLLEGES)]
        experience = rand.randint(1,12)
        baseMatch = (len(matched) / len(required) * 100) if required and len(required)>0 else rand.randint(60,80)
        matchPercentage = min(95, max(40, int(baseMatch + rand.randint(-10,10))))
        score = min(100, max(0, int(matchPercentage*0.7) + rand.randint(-10,10)))
        resumeStrength = 'Strong' if score>75 else ('Average' if score>50 else 'Weak')
        jobFitLevel = 'High' if matchPercentage>80 else ('Medium' if matchPercentage>70 else 'Low')

        out.append({
            'candidateId': f'real_cand_{int(time.time())}_{i}',
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
        })

    return jsonify(out)


if __name__ == '__main__':
    app.run(port=8000)
