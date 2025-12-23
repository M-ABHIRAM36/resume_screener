import React from "react"

export default function ScoreBadge({score}){
  const color = score >= 75 ? "bg-green-100 text-green-800" : score >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
  return (
    <div className={`px-3 py-1 rounded ${color} font-semibold`}>{score}%</div>
  )
}
