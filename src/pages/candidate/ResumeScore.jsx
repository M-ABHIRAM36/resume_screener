import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ScoreBadge from '../../components/ScoreBadge'
import ProgressBar from '../../components/ProgressBar'

export default function ResumeScore(){
  const { state } = useLocation()
  const nav = useNavigate()
  const role = state?.role || 'Selected Role'
  const job = state?.job || {name:role, requiredSkills:[], roadmapSteps:[]}
  const candidateSkills = state?.candidateSkills || []
  const matchedSkills = state?.matchedSkills || []
  const score = state?.score ?? Math.floor(60 + Math.random()*35)
  const matchPercent = state?.matchPercent ?? 0

  return (
    <div className="bg-white rounded shadow p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Resume Score</h2>
        <ScoreBadge score={score} />
      </div>

      <p className="mt-4 text-sm text-gray-600">Job role: <strong>{job.name}</strong></p>

      <div className="mt-6">
        <ProgressBar value={matchPercent} max={100} height={12} />
        <p className="text-sm mt-2">Match Percentage: {matchPercent}%</p>
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={() => nav('/candidate')} className="px-3 py-2 bg-gray-200 rounded">Back</button>
        <button onClick={() => nav('/candidate/skill-gap', {state})} className="px-3 py-2 bg-green-600 text-white rounded">Skill Gap</button>
        <button onClick={() => nav('/candidate/roadmap', {state})} className="px-3 py-2 bg-indigo-600 text-white rounded">Roadmap</button>
      </div>

      <div className="mt-6">
        <div className="text-sm text-gray-600">Candidate Skills: <strong>{candidateSkills.join(', ') || '—'}</strong></div>
        <div className="text-sm text-gray-600 mt-1">Matched Skills: <strong>{matchedSkills.join(', ') || '—'}</strong></div>
      </div>
    </div>
  )
}
