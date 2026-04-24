import React from "react"
import { useLocation, useNavigate } from "react-router-dom"

function PriorityBadge({ level }) {
  const styles = {
    Critical: 'bg-rose-50 text-rose-700 border-rose-200',
    Important: 'bg-amber-50 text-amber-700 border-amber-200',
    'Nice to Have': 'bg-sky-50 text-sky-700 border-sky-200',
  }
  const dots = { Critical: 'bg-rose-500', Important: 'bg-amber-500', 'Nice to Have': 'bg-sky-500' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${styles[level] || styles['Nice to Have']}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[level] || dots['Nice to Have']}`}></span>
      {level}
    </span>
  )
}

function RingChart({ value, size = 80, strokeWidth = 7, color = '#6366f1' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-gray-800">{value}%</span>
      </div>
    </div>
  )
}

export default function SkillGap() {
  const { state } = useLocation()
  const nav = useNavigate()
  const job = state?.job || { name: 'Selected Role', requiredSkills: [] }
  const matchedSkills = state?.matchedSkills || []
  const missingSkills = state?.missingSkills || []
  const candidateSkills = state?.candidateSkills || []
  const matchPercent = state?.matchPercent ?? 0
  const categoryScores = state?.categoryScores || {}

  const gapPercent = 100 - matchPercent
  const totalRequired = (job.requiredSkills || []).length

  const prioritizedMissing = missingSkills.map((skill) => {
    const reqIdx = (job.requiredSkills || []).findIndex(
      rs => rs.toLowerCase() === skill.toLowerCase()
    )
    let priority = 'Nice to Have'
    if (reqIdx >= 0 && reqIdx < Math.ceil(totalRequired * 0.4)) priority = 'Critical'
    else if (reqIdx >= 0 && reqIdx < Math.ceil(totalRequired * 0.7)) priority = 'Important'
    return { skill, priority, order: reqIdx >= 0 ? reqIdx : 999 }
  }).sort((a, b) => a.order - b.order)

  const extraSkills = candidateSkills.filter(
    s => !matchedSkills.map(m => m.toLowerCase()).includes(s.toLowerCase()) &&
         !missingSkills.map(m => m.toLowerCase()).includes(s.toLowerCase())
  )

  const categories = [
    { key: 'skillMatch', label: 'Skill Match', icon: '\ud83c\udfaf' },
    { key: 'experience', label: 'Experience', icon: '\ud83d\udcbc' },
    { key: 'projects', label: 'Projects', icon: '\ud83d\udd28' },
    { key: 'keywords', label: 'Keywords', icon: '\ud83d\udd11' },
    { key: 'education', label: 'Education', icon: '\ud83c\udf93' },
  ]

  const weakAreas = categories.filter(item => (categoryScores[item.key] ?? 100) < 50)
  const strongAreas = categories.filter(item => (categoryScores[item.key] ?? 0) >= 50)

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full text-orange-600 text-xs font-semibold mb-3">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Gap Analysis
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Skill Gap Report</h2>
            <p className="text-sm text-gray-500">Target: <span className="font-semibold text-gray-700">{job.name}</span></p>
          </div>
          <RingChart value={matchPercent} color={matchPercent >= 70 ? '#10b981' : matchPercent >= 40 ? '#f59e0b' : '#ef4444'} />
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-rose-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-extrabold text-rose-600">{gapPercent}%</div>
          <div className="text-[11px] text-gray-400 font-medium mt-0.5">Skill Gap</div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-extrabold text-emerald-600">{matchedSkills.length}</div>
          <div className="text-[11px] text-gray-400 font-medium mt-0.5">Matched</div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-extrabold text-amber-600">{missingSkills.length}</div>
          <div className="text-[11px] text-gray-400 font-medium mt-0.5">Missing</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-extrabold text-gray-700">{totalRequired}</div>
          <div className="text-[11px] text-gray-400 font-medium mt-0.5">Required</div>
        </div>
      </div>

      {/* Coverage Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Skill Coverage</span>
          <span className="text-sm font-bold text-indigo-600">{matchedSkills.length} / {totalRequired} skills</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ease-out ${matchPercent >= 70 ? 'bg-emerald-500' : matchPercent >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.min(matchPercent, 100)}%` }} />
        </div>
        <p className="text-[11px] text-gray-400 mt-2">You cover {matchPercent}% of the required skills for this role</p>
      </div>

      {/* Category Strength/Weakness */}
      {categoryScores && Object.keys(categoryScores).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-1 text-base">Area Analysis</h3>
          <p className="text-xs text-gray-400 mb-5">Your performance across evaluation categories</p>
          <div className="space-y-2">
            {weakAreas.map(item => (
              <div key={item.key} className="flex items-center gap-3 bg-rose-50 rounded-xl px-4 py-3 border border-rose-100">
                <span className="text-base">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-rose-800">{item.label}</span>
                    <span className="text-xs text-rose-500 font-semibold">{categoryScores[item.key]}%</span>
                  </div>
                  <div className="w-full bg-rose-100 rounded-full h-1.5 mt-1.5">
                    <div className="h-full rounded-full bg-rose-400 transition-all" style={{ width: `${categoryScores[item.key]}%` }} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md whitespace-nowrap">Needs Work</span>
              </div>
            ))}
            {strongAreas.map(item => (
              <div key={item.key} className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
                <span className="text-base">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-emerald-800">{item.label}</span>
                    <span className="text-xs text-emerald-500 font-semibold">{categoryScores[item.key]}%</span>
                  </div>
                  <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-1.5">
                    <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${categoryScores[item.key]}%` }} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md whitespace-nowrap">Strong</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills — Priority Ranked */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-1 text-base">Missing Skills</h3>
        <p className="text-xs text-gray-400 mb-4">Ranked by priority for the target role</p>
        {prioritizedMissing.length > 0 ? (
          <div className="space-y-2">
            {prioritizedMissing.map(({ skill, priority }, i) => (
              <div key={skill} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 hover:bg-gray-100/70 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-gray-300 w-5 text-right">{i + 1}</span>
                  <span className="font-medium text-gray-800 text-sm">{skill}</span>
                </div>
                <PriorityBadge level={priority} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="font-semibold text-gray-700">Perfect Match!</p>
            <p className="text-xs text-gray-400 mt-1">You have all the required skills for this role</p>
          </div>
        )}
      </div>

      {/* Skills Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6">
          <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Matched <span className="text-emerald-600 bg-emerald-100 text-xs px-2 py-0.5 rounded-full ml-1">{matchedSkills.length}</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.length ? matchedSkills.map(s => (
              <span key={s} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200">{s}</span>
            )) : <span className="text-xs text-gray-400 italic">No skills matched yet</span>}
          </div>
        </div>

        {extraSkills.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h4 className="font-semibold text-gray-700 mb-1 text-sm">Other Skills</h4>
            <p className="text-[11px] text-gray-400 mb-3">Skills you have that aren't required but add value</p>
            <div className="flex flex-wrap gap-1.5">
              {extraSkills.map(s => (
                <span key={s} className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs border border-gray-200 font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => nav('/candidate/score', { state })} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Score Report
          </button>
          <button onClick={() => nav('/candidate/roadmap', { state })} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            Learning Roadmap
          </button>
        </div>
      </div>
    </div>
  )
}
