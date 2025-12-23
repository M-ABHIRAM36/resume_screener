import React, { useEffect, useState } from 'react'
import jobRoles from '../../data/job_roles.json'
import ResumeUpload from '../../components/ResumeUpload'
import { useNavigate } from 'react-router-dom'

export default function CandidateDashboard(){
  const [role, setRole] = useState('')
  const [candidateSkills, setCandidateSkills] = useState('')
  const nav = useNavigate()

  useEffect(()=>{
    if(jobRoles.length) setRole(jobRoles[0].name)
  },[])

  function handleAnalyze(){
    const job = jobRoles.find(j => j.name === role) || {name:role, requiredSkills:[], roadmapSteps:[]}
    const parsed = candidateSkills.split(',').map(s=>s.trim()).filter(Boolean)
    const req = job.requiredSkills || []
    const matched = req.filter(s => parsed.map(p=>p.toLowerCase()).includes(s.toLowerCase()))
    const matchPercent = req.length>0? Math.round((matched.length / req.length)*100):0
    const score = Math.floor(60 + Math.random()*35)
    // navigate with analysis state
    nav('/candidate/score', {state:{role, job, candidateSkills:parsed, matchedSkills:matched, matchPercent, score}})
  }

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
          <label className="text-sm text-gray-600">Simulate extracted skills (comma-separated)</label>
          <input value={candidateSkills} onChange={e=>setCandidateSkills(e.target.value)} className="w-full max-w-md border p-2 rounded mt-1" placeholder="e.g. React, Node.js, SQL" />
        </div>

        <div className="mt-4">
          <button onClick={handleAnalyze} className="px-4 py-2 bg-indigo-600 text-white rounded">Analyze My Resume</button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6">
        <h3 className="font-semibold">Quick Info</h3>
        <p className="text-sm text-gray-600">This UI uses static JSON data. Analysis is simulated for demo purposes. Use the skills input to mock extracted resume skills.</p>
      </div>
    </div>
  )
}
