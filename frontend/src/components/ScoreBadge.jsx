import React from "react"

export default function ScoreBadge({score}){
  const color = score >= 75 
    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg" 
    : score >= 50 
    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg" 
    : "bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-lg"
  
  return (
    <div className={`px-6 py-3 rounded-xl ${color} font-bold text-xl shadow-md transform hover:scale-105 transition-transform`}>
      {score}%
    </div>
  )
}
