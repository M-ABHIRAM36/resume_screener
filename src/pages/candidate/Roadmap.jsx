import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RoadmapTimeline from "../../components/RoadmapTimeline";

export default function Roadmap(){
  const { state } = useLocation()
  const nav = useNavigate()
  const job = state?.job || {name:'Selected Role', roadmapSteps:[]}
  const matchPercent = state?.matchPercent ?? 0
  const steps = job.roadmapSteps || []
  const completedCount = Math.round((matchPercent/100) * steps.length)
  const completedIndices = Array.from({length:completedCount}).map((_,i)=>i)

  return (
    <div className="bg-white rounded shadow p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Learning Roadmap</h2>
        <div className="text-sm text-gray-600">Job: <strong>{job.name}</strong></div>
      </div>

      <div className="mt-4">
        {steps.length? <RoadmapTimeline steps={steps} completed={completedIndices} /> : <div className="text-sm text-gray-500">No roadmap available for this role.</div>}
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={() => nav('/candidate/score', {state})} className="px-3 py-2 bg-gray-200 rounded">Back to Score</button>
      </div>
    </div>
  )
}
