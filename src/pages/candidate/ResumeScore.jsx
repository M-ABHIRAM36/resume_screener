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
