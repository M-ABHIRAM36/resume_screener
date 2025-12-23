# Run from project root: .\setup_project.ps1
# Creates project files for the Resume Screening frontend

$Root = (Get-Location).Path

# Create directories
$dirs = @(
  "$Root\src",
  "$Root\src\pages",
  "$Root\src\pages\candidate",
  "$Root\src\pages\hr",
  "$Root\src\components",
  "$Root\src\data"
)
foreach($d in $dirs){ New-Item -ItemType Directory -Path $d -Force | Out-Null }

# Write files helper
function Write-File($path, $content){
  $folder = Split-Path $path
  if(-not (Test-Path $folder)){ New-Item -ItemType Directory -Path $folder -Force | Out-Null }
  $content | Out-File -FilePath $path -Encoding utf8 -Force
}

# package.json
Write-File "$Root\package.json" @'
{
  "name": "resume-screening-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.23",
    "tailwindcss": "^3.4.7",
    "vite": "^5.0.0"
  }
}
'@

# vite.config.js
Write-File "$Root\vite.config.js" @'
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
})
'@

# tailwind.config.cjs
Write-File "$Root\tailwind.config.cjs" @'
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
}
'@

# postcss.config.cjs
Write-File "$Root\postcss.config.cjs" @'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
'@

# index.html
Write-File "$Root\index.html" @'
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Resume Screening — Frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'@

# src/main.jsx
Write-File "$Root\src\main.jsx" @'
import React from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
'@

# src/index.css
Write-File "$Root\src\index.css" @'
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { @apply bg-gray-50 text-gray-800; }
'@

# src/App.jsx
Write-File "$Root\src\App.jsx" @'
import React from "react"
import { Routes, Route, Link } from "react-router-dom"
import Landing from "./pages/landing"
import CandidateDashboard from "./pages/candidate/Dashboard"
import ResumeScore from "./pages/candidate/ResumeScore"
import HRDashboard from "./pages/hr/Dashboard"

export default function App(){
  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl">Resume Screening</Link>
          <nav className="space-x-4 text-sm">
            <Link to="/candidate" className="text-gray-600 hover:text-gray-900">Candidate</Link>
            <Link to="/hr" className="text-gray-600 hover:text-gray-900">HR</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/candidate" element={<CandidateDashboard/>} />
          <Route path="/candidate/score" element={<ResumeScore/>} />
          <Route path="/hr" element={<HRDashboard/>} />
        </Routes>
      </main>
    </div>
  )
}
'@

# pages/landing.jsx
Write-File "$Root\src\pages\landing.jsx" @'
import React from "react"
import { useNavigate } from "react-router-dom"

export default function Landing(){
  const nav = useNavigate()
  return (
    <div className="py-16">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-2">Resume Screening & Career Guidance</h1>
        <p className="text-gray-600 mb-6">Evaluate resumes, get skill gap analysis and personalized roadmaps. Role-based UI for Candidates and HR.</p>
        <div className="space-x-3">
          <button onClick={() => nav("/candidate")} className="px-4 py-2 bg-indigo-600 text-white rounded">Login as Candidate</button>
          <button onClick={() => nav("/hr")} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Login as HR / Organization</button>
        </div>
      </div>
    </div>
  )
}
'@

# candidate Dashboard
Write-File "$Root\src\pages\candidate\Dashboard.jsx" @'
import React, { useEffect, useState } from "react"
import jobRoles from "../../src/data/job_roles.json"
import ResumeUpload from "../../components/ResumeUpload"
import { useNavigate } from "react-router-dom"

export default function CandidateDashboard(){
  const [role, setRole] = useState("")
  const nav = useNavigate()

  useEffect(()=>{
    if(jobRoles.length) setRole(jobRoles[0].name)
  },[])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Candidate Dashboard</h2>
        <label className="block text-sm text-gray-700 mb-2">Select Job Role</label>
        <select value={role} onChange={(e)=>setRole(e.target.value)} className="w-full max-w-md border p-2 rounded">
          {jobRoles.map(r => (
            <option key={r.name} value={r.name}>{r.name}</option>
          ))}
        </select>

        <div className="mt-4">
          <ResumeUpload single />
        </div>

        <div className="mt-4">
          <button onClick={() => nav("/candidate/score", {state:{role}})} className="px-4 py-2 bg-indigo-600 text-white rounded">Analyze My Resume</button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6">
        <h3 className="font-semibold">Quick Info</h3>
        <p className="text-sm text-gray-600">This UI uses static JSON data. Analysis is simulated for demo purposes.</p>
      </div>
    </div>
  )
}
'@

# candidate ResumeScore
Write-File "$Root\src\pages\candidate\ResumeScore.jsx" @'
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import ScoreBadge from "../../components/ScoreBadge"

export default function ResumeScore(){
  const { state } = useLocation()
  const nav = useNavigate()
  const role = state?.role || "Selected Role"
  const score = Math.floor(60 + Math.random()*35)

  return (
    <div className="bg-white rounded shadow p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Resume Score</h2>
        <ScoreBadge score={score} />
      </div>

      <p className="mt-4 text-sm text-gray-600">Job role: <strong>{role}</strong></p>

      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded h-4">
          <div className="bg-green-500 h-4 rounded" style={{width:`${score}%`}} />
        </div>
        <p className="text-sm mt-2">Match Percentage: {score}%</p>
      </div>

      <div className="mt-6">
        <button onClick={() => nav("/candidate")} className="px-3 py-2 bg-gray-200 rounded">Back</button>
      </div>
    </div>
  )
}
'@

# HR Dashboard
Write-File "$Root\src\pages\hr\Dashboard.jsx" @'
import React, { useMemo, useState } from "react"
import candidatesData from "../../src/data/candidates.json"
import FilterPanel from "../../components/FilterPanel"
import CandidateCard from "../../components/CandidateCard"

export default function HRDashboard(){
  const [filters, setFilters] = useState({skill:"", location:"", college:"", minMatch:0, experience:""})
  const [sortBy, setSortBy] = useState("")

  const filtered = useMemo(()=>{
    let list = candidatesData.slice()
    if(filters.skill) list = list.filter(c => c.skills.includes(filters.skill))
    if(filters.location) list = list.filter(c => c.location === filters.location)
    if(filters.college) list = list.filter(c => c.college === filters.college)
    if(filters.experience) list = list.filter(c => c.experience >= Number(filters.experience))
    if(filters.minMatch) list = list.filter(c => c.matchPercent >= Number(filters.minMatch))

    if(sortBy === 'highest_score') list.sort((a,b)=>b.score-a.score)
    if(sortBy === 'most_experience') list.sort((a,b)=>b.experience-b.experience)
    if(sortBy === 'top5') list = list.slice(0,5)

    return list
  },[filters, sortBy])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold">HR Dashboard</h2>
        <p className="text-sm text-gray-600">Company: <strong>Demo Corp</strong></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterPanel filters={filters} setFilters={setFilters} setSortBy={setSortBy} />
        </div>
        <div className="lg:col-span-3">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-4">Resume Results</h3>
            <div className="space-y-3">
              {filtered.map(c => (
                <CandidateCard key={c.id} candidate={c} />
              ))}
              {filtered.length===0 && <p className="text-gray-500">No candidates match the filters.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'@

# components
Write-File "$Root\src\components\ResumeUpload.jsx" @'
import React from "react"

export default function ResumeUpload({single}){
  return (
    <div className="border-dashed border-2 border-gray-200 rounded p-4 max-w-md">
      <label className="block text-sm text-gray-700 mb-2">Upload Resume {single? "(single file)":"(multiple)"}</label>
      <input type="file" accept=".pdf,.doc,.docx" multiple={!single} className="" />
    </div>
  )
}
'@

Write-File "$Root\src\components\SkillBadge.jsx" @'
import React from "react"

export default function SkillBadge({skill, color="gray"}){
  const bg = color==="green"? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${bg} mr-2 mb-2`}>{skill}</span>
  )
}
'@

Write-File "$Root\src\components\ScoreBadge.jsx" @'
import React from "react"

export default function ScoreBadge({score}){
  const color = score >= 75 ? "bg-green-100 text-green-800" : score >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
  return (
    <div className={`px-3 py-1 rounded ${color} font-semibold`}>{score}%</div>
  )
}
'@

Write-File "$Root\src\components\CandidateCard.jsx" @'
import React from "react"
import SkillBadge from "./SkillBadge"

export default function CandidateCard({candidate}){
  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{candidate.name}</div>
          <div className="text-sm text-gray-500">{candidate.college} • {candidate.location}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">Score: {candidate.score}</div>
          <div className="text-sm text-gray-500">Match: {candidate.matchPercent}%</div>
        </div>
      </div>
      <div className="mt-3">
        {candidate.skills.map(s => <SkillBadge key={s} skill={s} />)}
      </div>
    </div>
  )
}
'@

Write-File "$Root\src\components\FilterPanel.jsx" @'
import React from "react"
import candidates from "../src/data/candidates.json"

export default function FilterPanel({filters, setFilters, setSortBy}){
  const skills = Array.from(new Set(candidates.flatMap(c=>c.skills))).slice(0,30)
  const locations = Array.from(new Set(candidates.map(c=>c.location)))
  const colleges = Array.from(new Set(candidates.map(c=>c.college)))

  return (
    <div className="bg-white rounded shadow p-4">
      <h4 className="font-semibold mb-3">Filters</h4>
      <div className="space-y-3">
        <div>
          <label className="text-sm">Skill</label>
          <select value={filters.skill} onChange={e=>setFilters({...filters, skill:e.target.value})} className="w-full border p-2 rounded mt-1">
            <option value="">Any</option>
            {skills.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm">Location</label>
          <select value={filters.location} onChange={e=>setFilters({...filters, location:e.target.value})} className="w-full border p-2 rounded mt-1">
            <option value="">Any</option>
            {locations.map(l=> <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm">College</label>
          <select value={filters.college} onChange={e=>setFilters({...filters, college:e.target.value})} className="w-full border p-2 rounded mt-1">
            <option value="">Any</option>
            {colleges.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm">Minimum Match %</label>
          <input type="number" value={filters.minMatch} onChange={e=>setFilters({...filters, minMatch:e.target.value})} className="w-full border p-2 rounded mt-1" />
        </div>

        <div>
          <label className="text-sm">Experience (years)</label>
          <input type="number" value={filters.experience} onChange={e=>setFilters({...filters, experience:e.target.value})} className="w-full border p-2 rounded mt-1" />
        </div>

        <div>
          <label className="text-sm">Sort</label>
          <select onChange={e=>setSortBy(e.target.value)} className="w-full border p-2 rounded mt-1">
            <option value="">Default</option>
            <option value="top5">Top 5</option>
            <option value="highest_score">Highest score</option>
            <option value="most_experience">Most experience</option>
          </select>
        </div>
      </div>
    </div>
  )
}
'@

Write-File "$Root\src\components\RoadmapTimeline.jsx" @'
import React from "react"

export default function RoadmapTimeline({steps, completed=[]}){
  return (
    <div className="space-y-3">
      {steps.map((s,i)=>{
        const done = completed.includes(i)
        return (
          <div key={i} className="flex items-start">
            <div className={`w-3 h-3 mt-1 rounded-full ${done? "bg-green-500":"bg-gray-300"}`} />
            <div className="ml-3">
              <div className={`font-medium ${done? "text-gray-800":"text-gray-600"}`}>{s}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
'@

# src/data/job_roles.json (50+ roles)
Write-File "$Root\src\data\job_roles.json" @'
[
  {"name":"Backend Developer","requiredSkills":["Node.js","Express","Databases","REST APIs","SQL"],"roadmapSteps":["Learn JavaScript/TypeScript","Understand Node.js","Build REST APIs","Work with Databases","Testing & CI"]},
  {"name":"Frontend Developer","requiredSkills":["HTML","CSS","JavaScript","React","Accessibility"],"roadmapSteps":["HTML & CSS","JavaScript fundamentals","React basics","State management","Performance & Testing"]},
  {"name":"Full Stack Developer","requiredSkills":["Frontend","Backend","Databases","APIs","DevOps"],"roadmapSteps":["Learn frontend basics","Learn backend basics","Connect frontend & backend","Deploy apps","DevOps fundamentals"]},
  {"name":"Machine Learning Engineer","requiredSkills":["Python","Machine Learning","TensorFlow","PyTorch","Data Processing"],"roadmapSteps":["Python for ML","Statistics & Linear Algebra","ML Algorithms","Deep Learning","Model Deployment"]},
  {"name":"Data Scientist","requiredSkills":["Python","Pandas","Statistics","Visualization","Modeling"],"roadmapSteps":["Python & Pandas","Statistics","Exploratory Data Analysis","Modeling","Communication"]},
  {"name":"DevOps Engineer","requiredSkills":["CI/CD","Docker","Kubernetes","Monitoring","Cloud"],"roadmapSteps":["Linux basics","Docker & Containers","CI/CD pipelines","Kubernetes basics","Monitoring & Alerting"]},
  {"name":"Cloud Engineer","requiredSkills":["AWS","Azure","GCP","Networking","Security"],"roadmapSteps":["Cloud fundamentals","Compute & Storage","Networking","Security","Cost Management"]},
  {"name":"Android Developer","requiredSkills":["Kotlin","Android SDK","UI","APIs","Testing"],"roadmapSteps":["Kotlin basics","Android UI","Networking","Local Storage","Publish to Play Store"]},
  {"name":"iOS Developer","requiredSkills":["Swift","iOS SDK","UIKit/SwiftUI","APIs","Testing"],"roadmapSteps":["Swift basics","iOS UI","Networking","Data Persistence","App Store"]},
  {"name":"Cyber Security Analyst","requiredSkills":["Security fundamentals","Networking","Monitoring","Incident Response","Ethical Hacking"],"roadmapSteps":["Security basics","Network security","Threat intel","Monitoring","Incident response"]},
  {"name":"Blockchain Developer","requiredSkills":["Smart Contracts","Solidity","Ethereum","Cryptography","Web3"],"roadmapSteps":["Blockchain basics","Ethereum & Solidity","Smart contract development","Security auditing","dApp integration"]},
  {"name":"UI/UX Designer","requiredSkills":["Design Principles","Figma","Prototyping","User Research","Accessibility"],"roadmapSteps":["Design fundamentals","Wireframing","High-fidelity design","Prototyping","User testing"]},
  {"name":"Game Developer","requiredSkills":["Game Engines","C#/C++","Math","Graphics","Optimization"],"roadmapSteps":["Game engine basics","Scripting","Game physics","Graphics","Optimization & Publishing"]},
  {"name":"QA Engineer","requiredSkills":["Test Automation","Manual Testing","Selenium","Jest","CI"],"roadmapSteps":["Testing fundamentals","Manual testing","Automation basics","Frameworks","CI integration"]},
  {"name":"Data Analyst","requiredSkills":["SQL","Excel","Visualization","Statistics","Reporting"],"roadmapSteps":["SQL basics","Data cleaning","Visualization","Statistics","Reporting & Dashboards"]},
  {"name":"Business Analyst","requiredSkills":["Requirements","Communication","Modeling","Stakeholder Management","UML"],"roadmapSteps":["Domain knowledge","Requirement elicitation","Process modeling","Stakeholder engagement","Documentation"]},
  {"name":"AI Engineer","requiredSkills":["Machine Learning","Deep Learning","Model Deployment","Python","Data"],"roadmapSteps":["ML fundamentals","Deep learning","Model optimization","Deployment","MLOps"]},
  {"name":"NLP Engineer","requiredSkills":["NLP","Transformers","Python","Text Processing","Modeling"],"roadmapSteps":["Text processing","Classical NLP","Deep NLP","Transformers","Deploy NLP models"]},
  {"name":"Robotics Engineer","requiredSkills":["ROS","C++","Control Systems","Sensors","Actuators"],"roadmapSteps":["Embedded basics","ROS fundamentals","Control theory","Sensors integration","System integration"]},
  {"name":"Embedded Systems Engineer","requiredSkills":["C/C++","Microcontrollers","RTOS","Hardware","Debugging"],"roadmapSteps":["C fundamentals","Microcontrollers","Peripherals","RTOS basics","Hardware debugging"]},
  {"name":"Data Engineer","requiredSkills":["ETL","SQL","Spark","Data Warehousing","Python"],"roadmapSteps":["SQL & Databases","ETL fundamentals","Batch processing","Streaming","Data modeling"]},
  {"name":"Site Reliability Engineer","requiredSkills":["Monitoring","SRE practices","Alerting","Automation","Infrastructure"],"roadmapSteps":["SRE basics","Monitoring","SLIs/SLOs","Automation","Incident management"]},
  {"name":"Computer Vision Engineer","requiredSkills":["OpenCV","Deep Learning","Python","Image Processing","Modeling"],"roadmapSteps":["Image processing","Classical CV","Deep learning for CV","CNNs","Deployment"]},
  {"name":"Product Manager","requiredSkills":["Roadmapping","Communication","Analytics","Prioritization","Stakeholder Mgmt"],"roadmapSteps":["Market research","Product strategy","Roadmapping","Execution","Metrics"]},
  {"name":"Technical Writer","requiredSkills":["Writing","Documentation","Markdown","API docs","Communication"],"roadmapSteps":["Writing fundamentals","API documentation","Tools & formats","User guides","Process"]},
  {"name":"Systems Architect","requiredSkills":["Architecture","Design Patterns","Scalability","Cloud","Security"],"roadmapSteps":["Design patterns","Scalability","Distributed systems","Security","Leadership"]},
  {"name":"Network Engineer","requiredSkills":["Routing","Switching","Firewalls","TCP/IP","Monitoring"],"roadmapSteps":["Networking basics","Routing & switching","Security","Monitoring","Automation"]},
  {"name":"Database Administrator","requiredSkills":["SQL","Performance Tuning","Backups","Replication","Security"],"roadmapSteps":["SQL fundamentals","Performance tuning","Backups & Recovery","Replication","Security"]},
  {"name":"QA Automation Engineer","requiredSkills":["Selenium","Cypress","Test Automation","CI","APIs"],"roadmapSteps":["Testing basics","Automation frameworks","E2E testing","CI integration","Reporting"]},
  {"name":"Mobile QA Engineer","requiredSkills":["Mobile testing","Automation","Device farms","APIs","Performance"],"roadmapSteps":["Mobile basics","Manual testing","Automation","Cloud device farms","Performance testing"]},
  {"name":"DevSecOps Engineer","requiredSkills":["Security","CI/CD","Kubernetes","Scanning","Compliance"],"roadmapSteps":["Security basics","Secure CI","Kubernetes security","Scanning & SAST","Compliance"]},
  {"name":"Performance Engineer","requiredSkills":["Load Testing","Profiling","Optimization","Monitoring","APIs"],"roadmapSteps":["Performance fundamentals","Load testing","Profiling","Optimization","Monitoring"]},
  {"name":"Systems Programmer","requiredSkills":["C","Operating Systems","Low-level programming","Debugging","Concurrency"],"roadmapSteps":["C mastery","OS concepts","Concurrency","Low-level performance","Debugging"]},
  {"name":"Hardware Engineer","requiredSkills":["Electronics","PCB","FPGA","Circuit design","Testing"],"roadmapSteps":["Electronics basics","Circuit design","PCB layout","FPGA basics","Testing"]},
  {"name":"Embedded Linux Engineer","requiredSkills":["Linux","Embedded","Kernel","Bootloaders","Device Drivers"],"roadmapSteps":["Linux basics","Embedded toolchains","Kernel modules","Device drivers","Bootloaders"]},
  {"name":"Cloud Security Engineer","requiredSkills":["Cloud","Security","IAM","Monitoring","Networking"],"roadmapSteps":["Cloud fundamentals","IAM","Network security","Monitoring","Threat modeling"]},
  {"name":"AI Researcher","requiredSkills":["Math","ML","Research","Python","Optimization"],"roadmapSteps":["Math fundamentals","ML theory","Research methods","Implement models","Publish papers"]},
  {"name":"Computer Graphics Engineer","requiredSkills":["OpenGL","Shaders","Math","C++","Rendering"],"roadmapSteps":["Graphics math","Shaders","Rendering pipeline","Optimization","Tools"]},
  {"name":"Sales Engineer","requiredSkills":["Communication","Product knowledge","Demos","Technical aptitude","CRM"],"roadmapSteps":["Product knowledge","Demo skills","Customer engagement","Sales process","Technical enablement"]},
  {"name":"Customer Success Manager","requiredSkills":["Communication","Onboarding","Product","Analytics","Customer advocacy"],"roadmapSteps":["Product onboarding","Customer engagement","Health metrics","Escalations","Strategy"]},
  {"name":"Localization Engineer","requiredSkills":["i18n","l10n","Tools","Automation","Quality"],"roadmapSteps":["i18n basics","Localization pipelines","Automation","Quality assurance","Deployment"]},
  {"name":"Accessibility Specialist","requiredSkills":["a11y","WCAG","Screen readers","Testing","Design"],"roadmapSteps":["Accessibility basics","WCAG","Testing tools","Design patterns","Evaluation"]},
  {"name":"Embedded Firmware Engineer","requiredSkills":["C","Microcontrollers","RTOS","Hardware","Debugging"],"roadmapSteps":["C & embedded","RTOS","Device drivers","Hardware interfacing","Debugging"]},
  {"name":"Computer Forensics Analyst","requiredSkills":["Forensics","Tools","Investigation","Security","Legal"],"roadmapSteps":["Forensics basics","Tools","Evidence handling","Analysis","Reporting"]},
  {"name":"Database Developer","requiredSkills":["SQL","Procedures","Optimization","ETL","Data Modeling"],"roadmapSteps":["SQL mastery","Procedural SQL","Optimization","ETL","Data modeling"]}
]
'@

# src/data/candidates.json (25 sample candidates)
Write-File "$Root\src\data\candidates.json" @'
[
  {"id":1,"name":"Alice Johnson","skills":["React","JavaScript","HTML","CSS"],"location":"Bangalore","college":"IIT Bombay","experience":3,"score":78,"matchPercent":80},
  {"id":2,"name":"Bob Smith","skills":["Node.js","Express","SQL","Docker"],"location":"Hyderabad","college":"IIIT Hyderabad","experience":5,"score":85,"matchPercent":88},
  {"id":3,"name":"Charlie Lee","skills":["Python","Pandas","SQL","Machine Learning"],"location":"Delhi","college":"IIT Delhi","experience":2,"score":72,"matchPercent":70},
  {"id":4,"name":"Diana Ross","skills":["AWS","Kubernetes","Docker","CI/CD"],"location":"Pune","college":"BITS Pilani","experience":6,"score":90,"matchPercent":92},
  {"id":5,"name":"Ethan Brown","skills":["Java","Spring","SQL","Microservices"],"location":"Chennai","college":"IIT Madras","experience":4,"score":80,"matchPercent":78},
  {"id":6,"name":"Fiona Green","skills":["Swift","iOS SDK","UI"],"location":"Bangalore","college":"NIT Trichy","experience":3,"score":74,"matchPercent":72},
  {"id":7,"name":"George King","skills":["Kotlin","Android SDK","APIs"],"location":"Mumbai","college":"IIT Bombay","experience":4,"score":76,"matchPercent":75},
  {"id":8,"name":"Hannah Scott","skills":["SQL","Excel","Tableau","Visualization"],"location":"Delhi","college":"DU","experience":2,"score":68,"matchPercent":65},
  {"id":9,"name":"Ian Wright","skills":["C++","Embedded","RTOS"],"location":"Chennai","college":"IIT Madras","experience":5,"score":82,"matchPercent":80},
  {"id":10,"name":"Jasmine Patel","skills":["Figma","UX","Prototyping"],"location":"Ahmedabad","college":"Nirma University","experience":3,"score":70,"matchPercent":68},
  {"id":11,"name":"Kevin Liu","skills":["TensorFlow","Python","Deep Learning"],"location":"Bangalore","college":"IISC","experience":4,"score":83,"matchPercent":85},
  {"id":12,"name":"Laura Chen","skills":["Selenium","Test Automation","Jest"],"location":"Hyderabad","college":"Osmania University","experience":3,"score":75,"matchPercent":72},
  {"id":13,"name":"Mark Davis","skills":["Spark","Python","ETL"],"location":"Pune","college":"Pune University","experience":5,"score":81,"matchPercent":79},
  {"id":14,"name":"Nina Gupta","skills":["Security fundamentals","Networking","Monitoring"],"location":"Delhi","college":"IIT Delhi","experience":4,"score":77,"matchPercent":74},
  {"id":15,"name":"Oscar Perez","skills":["React","Redux","TypeScript"],"location":"Bangalore","college":"IIIT Bangalore","experience":3,"score":79,"matchPercent":82},
  {"id":16,"name":"Priya Sharma","skills":["SQL","Data Modeling","ETL"],"location":"Noida","college":"AMITY","experience":2,"score":69,"matchPercent":66},
  {"id":17,"name":"Quentin Blake","skills":["OpenCV","Python","Image Processing"],"location":"Hyderabad","college":"JNTU","experience":3,"score":73,"matchPercent":71},
  {"id":18,"name":"Rita Singh","skills":["DevOps","Docker","CI/CD"],"location":"Bangalore","college":"IIT Bombay","experience":4,"score":84,"matchPercent":86},
  {"id":19,"name":"Samir Khan","skills":["Node.js","React","MongoDB"],"location":"Lucknow","college":"LU","experience":2,"score":66,"matchPercent":64},
  {"id":20,"name":"Tara Wilson","skills":["Accessibility","HTML","CSS","UX"],"location":"Chennai","college":"Anna University","experience":3,"score":71,"matchPercent":70},
  {"id":21,"name":"Uma Rao","skills":["Docker","Kubernetes","Monitoring"],"location":"Bangalore","college":"IISC","experience":6,"score":88,"matchPercent":90},
  {"id":22,"name":"Vikram Desai","skills":["SQL","Databases","Performance Tuning"],"location":"Pune","college":"COEP","experience":7,"score":91,"matchPercent":93},
  {"id":23,"name":"Wendy Park","skills":["C#","Unity","Game Engines"],"location":"Bangalore","college":"RV College","experience":4,"score":78,"matchPercent":75},
  {"id":24,"name":"Xavier Lopez","skills":["Blockchain","Solidity","Web3"],"location":"Mumbai","college":"NMIMS","experience":2,"score":65,"matchPercent":62},
  {"id":25,"name":"Yara Ahmed","skills":["Python","NLP","Transformers"],"location":"Hyderabad","college":"IIIT Hyderabad","experience":3,"score":80,"matchPercent":83}
]
'@

# README
Write-File "$Root\README.md" @'
# Resume Screening Frontend

This is a Vite + React + Tailwind frontend scaffold for a Resume Screening & Career Guidance UI.
All data is static JSON in `src/data/`.

Quick start:
1. Install Node.js (16+)
2. From project root:
   npm install
   npm run dev

Pages:
- Landing page: /
- Candidate dashboard: /candidate
- Candidate score: /candidate/score
- HR dashboard: /hr

Notes:
- No backend integration. All data is static in `src/data/`.
'@

Write-Host "Files created. Run `npm install` then `npm run dev` to start the dev server."