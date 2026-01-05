import React, { useEffect, useState, useMemo } from 'react'
import ResumeUpload from '../../components/ResumeUpload'
import { useNavigate } from 'react-router-dom'
import jobRolesData from '../../data/job_roles.json'

export default function CandidateDashboard(){
  const [role, setRole] = useState('')
  const [candidateSkills, setCandidateSkills] = useState('')
  const nav = useNavigate()

  // Use static job roles data - remove duplicates by name
  const jobRoles = useMemo(() => {
    const uniqueRoles = []
    const seenNames = new Set()
    jobRolesData.forEach(role => {
      if (!seenNames.has(role.name)) {
        seenNames.add(role.name)
        uniqueRoles.push(role)
      }
    })
    return uniqueRoles.sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  useEffect(()=>{
    if(jobRoles.length && !role) setRole(jobRoles[0].name)
  },[jobRoles, role])

  function handleAnalyze(){
    const job = jobRoles.find(j => j.name === role) || {name:role, requiredSkills:[], roadmapSteps:[]}
    const parsed = candidateSkills.split(',').map(s=>s.trim()).filter(Boolean)
    const req = job.requiredSkills || []
    const matched = req.filter(s => parsed.map(p=>p.toLowerCase()).includes(s.toLowerCase()))
    const matchPercent = req.length>0? Math.round((matched.length / req.length)*100):0
    const score = Math.floor(60 + Math.random()*35)
    nav('/candidate/score', {state:{role, job, candidateSkills:parsed, matchedSkills:matched, matchPercent, score}})
  }

  return (
    <div className="space-y-6 py-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            👤
          </div>
          <div>
            <h2 className="text-2xl font-bold">Candidate Dashboard</h2>
            <p className="text-sm text-gray-500">Analyze your resume and get career guidance</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Job Role <span className="text-red-500">*</span>
            </label>
            <select 
              value={role} 
              onChange={(e)=>setRole(e.target.value)} 
              className="input-field max-w-md"
            >
              {jobRoles.map(r => (
                <option key={r.id||r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Choose the role you want to match your resume against</p>
          </div>

          <div className="border-t pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Upload Resume
            </label>
            <ResumeUpload single />
            <p className="text-xs text-gray-500 mt-2">Upload your resume in PDF or DOCX format</p>
          </div>

          <div className="border-t pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Simulate Extracted Skills (Optional)
            </label>
            <input 
              value={candidateSkills} 
              onChange={e=>setCandidateSkills(e.target.value)} 
              className="input-field max-w-md" 
              placeholder="e.g. React, Node.js, SQL, Python, Docker"
            />
            <p className="text-xs text-gray-500 mt-1">Enter comma-separated skills for testing</p>
          </div>

          <div className="border-t pt-6">
            <button 
              onClick={handleAnalyze} 
              className="btn-primary"
              disabled={!role}
            >
              🔍 Analyze My Resume
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-semibold mb-1">How It Works</h3>
            <p className="text-sm text-gray-700">
              Select a job role, upload your resume, and get instant analysis including match score, 
              skill gap analysis, and a personalized learning roadmap.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
