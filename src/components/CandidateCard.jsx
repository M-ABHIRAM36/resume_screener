import React from "react"
import SkillBadge from "./SkillBadge"
import ScoreBadge from "./ScoreBadge"

export default function CandidateCard({candidate}){
  return (
    <div className="card hover:shadow-xl transition-all duration-300 border-l-4 border-l-indigo-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {candidate.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="font-bold text-lg text-gray-800">{candidate.name}</div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span>🏫 {candidate.college}</span>
                <span>•</span>
                <span>📍 {candidate.location}</span>
                <span>•</span>
                <span>💼 {candidate.experience} yrs</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <ScoreBadge score={candidate.score || candidate.matchPercentage || 0} />
          <div className="text-xs text-gray-500 mt-1">Match: {candidate.matchPercentage || candidate.matchPercent || 0}%</div>
        </div>
      </div>
      <div className="border-t pt-3">
        <div className="text-xs font-semibold text-gray-600 mb-2">Skills:</div>
        <div className="flex flex-wrap gap-2">
          {candidate.skills?.slice(0, 8).map(s => <SkillBadge key={s} skill={s} />)}
          {candidate.skills?.length > 8 && (
            <span className="text-xs text-gray-500 px-2 py-1">+{candidate.skills.length - 8} more</span>
          )}
        </div>
      </div>
    </div>
  )
}
