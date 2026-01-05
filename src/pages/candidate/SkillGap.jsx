import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SkillBadge from "../../components/SkillBadge";
import ProgressBar from "../../components/ProgressBar";

export default function SkillGap(){
  const { state } = useLocation()
  const nav = useNavigate()
  const job = state?.job || {name:'Selected Role', requiredSkills:[]}
  const candidateSkills = state?.candidateSkills || []
  const matchedSkills = state?.matchedSkills || []
  const missing = (job.requiredSkills||[]).filter(s => !matchedSkills.map(m=>m.toLowerCase()).includes(s.toLowerCase()))
  const matchPercent = state?.matchPercent ?? 0

  const gapPercent = 100 - matchPercent

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Skill Gap Analysis</h2>
            <p className="text-sm text-gray-600">Job Role: <span className="font-semibold text-indigo-600">{job.name}</span></p>
          </div>
        </div>

        {/* Gap Summary */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Skill Gap</div>
              <div className="text-4xl font-bold text-red-600">{gapPercent}%</div>
            </div>
            <div className="text-5xl">📉</div>
          </div>
          <div className="mt-4">
            <ProgressBar value={gapPercent} max={100} height={12} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-green-200 rounded-xl p-6 bg-green-50">
            <h4 className="font-bold text-lg text-green-800 mb-4 flex items-center gap-2">
              ✅ Matched Skills ({matchedSkills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length ? matchedSkills.map(s => (
                <span key={s} className="bg-green-200 text-green-800 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                  {s}
                </span>
              )) : (
                <div className="text-sm text-gray-500 italic">No matched skills found</div>
              )}
            </div>
          </div>
          <div className="border-2 border-red-200 rounded-xl p-6 bg-red-50">
            <h4 className="font-bold text-lg text-red-800 mb-4 flex items-center gap-2">
              ❌ Missing Skills ({missing.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {missing.length ? missing.map(s => (
                <span key={s} className="bg-red-200 text-red-800 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                  {s}
                </span>
              )) : (
                <div className="text-sm text-gray-500 italic">No missing skills - Great job! 🎉</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-6 border-t">
          <button onClick={() => nav('/candidate/score', {state})} className="btn-secondary">
            ← Back to Score
          </button>
          <button onClick={() => nav('/candidate/roadmap', {state})} className="btn-primary">
            🗺️ View Learning Roadmap →
          </button>
        </div>
      </div>
    </div>
  )
}
