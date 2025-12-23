from flask import Flask, request, jsonify
import random
import time

app = Flask(__name__)
NAMES = ["abhiram","abhiram2","abhiram3","abhiram4","abhiram5","abhiram6","abhiram7","abhiram8","abhiram9","abhiram10"]
#NAMES = ['Amit Kumar','Priya Singh','Rohit Sharma','Anita Desai','Diana Ross','Vikram Desai','Uma Rao','Karan Patel','Sara Ali','John Doe']
EXTRA_SKILLS = ['APIs','Docker','Kubernetes','SQL','NoSQL','CI/CD','GraphQL','TypeScript','Python','Django','Flask','React','Node.js','AWS','GCP','Azure']
COLLEGES = ['IIT Bombay','IIT Delhi','NIT Trichy','IIIT Hyderabad','Anna University','BITS Pilani','Delhi University','Mumbai University']
LOCATIONS = ['Bangalore','Mumbai','Delhi','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad']

def rand_int(a,b):
    return random.randint(a,b)

def pick(arr, n):
    a = arr[:] 
    random.shuffle(a)
    return a[:n]

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json() or {}
    job = data.get('job', {})
    files_meta = data.get('filesMeta', {})
    count = files_meta.get('count', 5) or 5
    required = job.get('requiredSkills', []) if job else []

    out = []
    for i in range(count):
        name = NAMES[i % len(NAMES)]
        email = name.lower().replace(' ','') + str(rand_int(1,99)) + '@example.com'
        matches_count = max(1, int(len(required) * (0.5 + random.random()*0.4))) if required else rand_int(1,3)
        matched = pick(required, min(matches_count, len(required))) if required else pick(EXTRA_SKILLS, rand_int(1,3))
        extra = pick(EXTRA_SKILLS, rand_int(0,2))
        skills = list(dict.fromkeys(matched + extra))
        missing = [s for s in (required or []) if s not in [x for x in skills]]
        location = LOCATIONS[i % len(LOCATIONS)]
        college = COLLEGES[i % len(COLLEGES)]
        experience = rand_int(1,12)
        baseMatch = (len(matched) / len(required) * 100) if required else rand_int(60,80)
        matchPercentage = min(95, max(60, int(baseMatch + rand_int(-5,10))))
        score = min(100, max(0, int(matchPercentage*0.7) + rand_int(-10,10)))
        resumeStrength = 'Strong' if score>75 else ('Average' if score>50 else 'Weak')
        jobFitLevel = 'High' if matchPercentage>80 else ('Medium' if matchPercentage>70 else 'Low')

        out.append({
            'candidateId': f'flask_cand_{int(time.time())}_{i}',
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
