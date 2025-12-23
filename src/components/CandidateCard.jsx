import React from "react"
import SkillBadge from "./SkillBadge"

export default function CandidateCard({candidate}){
  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{candidate.name}</div>
          <div className="text-sm text-gray-500">{candidate.college} â€¢ {candidate.location}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">Score: {candidate.score}</div>
          <div className="text-sm text-gray-500">Match: {candidate.matchPercent}%</div>
        </div>
      </div>
      <div className="mt-3">
        {candidate.skills.map(s => <SkillBadge key={s} skill={s} />)}
      </div>
    </div>
  )
}
