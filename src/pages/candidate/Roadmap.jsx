import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RoadmapTimeline from "../../components/RoadmapTimeline";
import ProgressBar from "../../components/ProgressBar";

export default function Roadmap(){
  const { state } = useLocation()
  const nav = useNavigate()
  const job = state?.job || {name:'Selected Role', roadmapSteps:[]}
  const matchPercent = state?.matchPercent ?? 0
  const steps = job.roadmapSteps || []
  const completedCount = Math.round((matchPercent/100) * steps.length)
  const completedIndices = Array.from({length:completedCount}).map((_,i)=>i)

  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Learning Roadmap</h2>
            <p className="text-sm text-gray-600">Job Role: <span className="font-semibold text-indigo-600">{job.name}</span></p>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Roadmap Progress</div>
              <div className="text-3xl font-bold text-indigo-600">{progressPercent}%</div>
              <div className="text-sm text-gray-600 mt-1">
                {completedCount} of {steps.length} steps completed
              </div>
            </div>
            <div className="text-5xl">🎯</div>
          </div>
          <ProgressBar value={progressPercent} max={100} height={12} />
        </div>

        <div className="mt-6">
          {steps.length ? (
            <RoadmapTimeline steps={steps} completed={completedIndices} />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-3">📚</div>
              <div className="text-gray-600 font-medium">No roadmap available for this role.</div>
              <div className="text-sm text-gray-500 mt-1">Please select a different job role.</div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6 border-t mt-6">
          <button onClick={() => nav('/candidate/score', {state})} className="btn-secondary">
            ← Back to Score
          </button>
          <button onClick={() => nav('/candidate/skill-gap', {state})} className="btn-secondary">
            ← Skill Gap Analysis
          </button>
        </div>
      </div>
    </div>
  )
}
