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
    <div className="max-w-4xl mx-auto py-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Resume Analysis Results</h2>
            <p className="text-sm text-gray-600">Job Role: <span className="font-semibold text-indigo-600">{job.name}</span></p>
          </div>
          <ScoreBadge score={score} />
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">Overall Match Score</span>
            <span className="text-2xl font-bold text-indigo-600">{matchPercent}%</span>
          </div>
          <ProgressBar value={matchPercent} max={100} height={16} />
          <div className="mt-3 flex justify-between text-xs text-gray-600">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Skills Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              ✅ Matched Skills ({matchedSkills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length ? matchedSkills.map(s => (
                <span key={s} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {s}
                </span>
              )) : <span className="text-sm text-gray-500">No matched skills</span>}
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              📝 Your Skills ({candidateSkills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {candidateSkills.length ? candidateSkills.map(s => (
                <span key={s} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {s}
                </span>
              )) : <span className="text-sm text-gray-500">No skills entered</span>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-6 border-t">
          <button onClick={() => nav('/candidate')} className="btn-secondary">
            ← Back to Dashboard
          </button>
          <button onClick={() => nav('/candidate/skill-gap', {state})} className="btn-primary bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            📊 View Skill Gap Analysis
          </button>
          <button onClick={() => nav('/candidate/roadmap', {state})} className="btn-primary">
            🗺️ View Learning Roadmap
          </button>
        </div>
      </div>
    </div>
  )
}
