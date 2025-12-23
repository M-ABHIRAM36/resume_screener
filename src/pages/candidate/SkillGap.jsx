import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SkillBadge from "../../components/SkillBadge";

export default function SkillGap(){
  const { state } = useLocation()
  const nav = useNavigate()
  const job = state?.job || {name:'Selected Role', requiredSkills:[]}
  const candidateSkills = state?.candidateSkills || []
  const matchedSkills = state?.matchedSkills || []
  const missing = (job.requiredSkills||[]).filter(s => !matchedSkills.map(m=>m.toLowerCase()).includes(s.toLowerCase()))
  const matchPercent = state?.matchPercent ?? 0

  return (
    <div className="bg-white rounded shadow p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Skill Gap Analysis</h2>
        <div className="text-sm text-gray-600">Job: <strong>{job.name}</strong></div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-2">Matched Skills</h4>
          <div className="flex flex-wrap">
            {matchedSkills.length? matchedSkills.map(s => <SkillBadge key={s} skill={s} color="green"/>): <div className="text-sm text-gray-500">No matched skills</div>}
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Missing Skills</h4>
          <div className="flex flex-wrap">
            {missing.length? missing.map(s => <SkillBadge key={s} skill={s} />): <div className="text-sm text-gray-500">No missing skills</div>}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-600">Skill Gap: <strong>{100 - matchPercent}%</strong></div>
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={() => nav('/candidate/score', {state})} className="px-3 py-2 bg-gray-200 rounded">Back to Score</button>
        <button onClick={() => nav('/candidate/roadmap', {state})} className="px-3 py-2 bg-indigo-600 text-white rounded">View Roadmap</button>
      </div>
    </div>
  )
}
