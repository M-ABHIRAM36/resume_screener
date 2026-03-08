import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function CircleScore({ value, size = 120, strokeWidth = 10, color = '#6366f1' }) {
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
        <span className="text-2xl font-extrabold text-gray-800">{value}</span>
        <span className="text-[10px] text-gray-400 font-medium -mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

function CategoryBar({ label, value, icon, color }) {
  const colorMap = {
    indigo: 'bg-indigo-500', green: 'bg-emerald-500', orange: 'bg-amber-500',
    blue: 'bg-sky-500', purple: 'bg-violet-500', red: 'bg-rose-500',
  }
  const bgMap = {
    indigo: 'bg-indigo-50', green: 'bg-emerald-50', orange: 'bg-amber-50',
    blue: 'bg-sky-50', purple: 'bg-violet-50', red: 'bg-rose-50',
  }
  return (
    <div className={`rounded-xl p-4 ${bgMap[color] || 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <span className="text-base">{icon}</span>{label}
        </span>
        <span className="text-sm font-bold text-gray-800">{value}%</span>
      </div>
      <div className="w-full bg-white/80 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${colorMap[color] || 'bg-gray-500'} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  )
}

function BonusBadge({ label, active }) {
  if (!active) return null
  return (
    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
      <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
      {label}
    </span>
  )
}

export default function ResumeScore() {
  const { state } = useLocation()
  const nav = useNavigate()
  const job = state?.job || { name: 'Selected Role', requiredSkills: [], roadmapSteps: [] }
  const candidateSkills = state?.candidateSkills || []
  const matchedSkills = state?.matchedSkills || []
  const missingSkills = state?.missingSkills || []
  const score = state?.score ?? 0
  const matchPercent = state?.matchPercent ?? 0
  const resumeStrength = state?.resumeStrength || 'Weak'
  const jobFitLevel = state?.jobFitLevel || 'Low Fit'
  const summary = state?.summary || ''
  const categoryScores = state?.categoryScores || {}
  const bonusFactors = state?.bonusFactors || {}
  const candidateData = state?.candidateData || {}

  const scoreColor = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444'
  const matchColor = matchPercent >= 80 ? '#6366f1' : matchPercent >= 60 ? '#3b82f6' : matchPercent >= 40 ? '#f59e0b' : '#ef4444'

  const strengthStyle = resumeStrength === 'Strong' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : resumeStrength === 'Average' ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-rose-700 bg-rose-50 border-rose-200'

  const fitStyle = jobFitLevel.includes('Excellent') ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : jobFitLevel.includes('Good') ? 'text-blue-700 bg-blue-50 border-blue-200'
    : jobFitLevel.includes('Partial') ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-rose-700 bg-rose-50 border-rose-200'

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Report Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 text-xs font-semibold mb-3">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Analysis Complete
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Resume Analysis Report</h2>
            <p className="text-sm text-gray-500">Target: <span className="font-semibold text-gray-700">{job.name}</span></p>
          </div>
          <div className="flex items-center gap-5">
            <CircleScore value={score} size={100} strokeWidth={8} color={scoreColor} />
            <div className="hidden sm:block">
              <CircleScore value={matchPercent} size={100} strokeWidth={8} color={matchColor} />
              <div className="text-[10px] text-gray-400 text-center mt-1">Job Match</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-extrabold text-gray-800">{score}</div>
          <div className="text-[11px] text-gray-400 font-medium mt-0.5">Resume Score</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-extrabold text-gray-800">{matchPercent}%</div>
          <div className="text-[11px] text-gray-400 font-medium mt-0.5">Job Match</div>
        </div>
        <div className={`rounded-xl border p-4 text-center shadow-sm ${strengthStyle}`}>
          <div className="text-base font-bold">{resumeStrength}</div>
          <div className="text-[11px] font-medium mt-0.5 opacity-70">Strength</div>
        </div>
        <div className={`rounded-xl border p-4 text-center shadow-sm ${fitStyle}`}>
          <div className="text-base font-bold">{jobFitLevel}</div>
          <div className="text-[11px] font-medium mt-0.5 opacity-70">Job Fit</div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-1 text-base">Score Breakdown</h3>
        <p className="text-xs text-gray-400 mb-5">How your resume was evaluated across 5 categories</p>
        <div className="grid md:grid-cols-2 gap-3">
          <CategoryBar label="Skill Match" value={categoryScores.skillMatch ?? 0} icon="🎯" color="indigo" />
          <CategoryBar label="Experience" value={categoryScores.experience ?? 0} icon="💼" color="green" />
          <CategoryBar label="Projects" value={categoryScores.projects ?? 0} icon="🔨" color="orange" />
          <CategoryBar label="Keywords" value={categoryScores.keywords ?? 0} icon="🔑" color="blue" />
          <CategoryBar label="Education" value={categoryScores.education ?? 0} icon="🎓" color="purple" />
        </div>
      </div>

      {/* Bonus Factors */}
      {Object.keys(bonusFactors).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-1 text-base">Bonus Factors</h3>
          <p className="text-xs text-gray-400 mb-4">Additional signals detected that strengthen your profile</p>
          <div className="flex flex-wrap gap-2">
            <BonusBadge label="Projects" active={bonusFactors.projects} />
            <BonusBadge label="Achievements" active={bonusFactors.achievements} />
            <BonusBadge label="Publications" active={bonusFactors.publications} />
            <BonusBadge label="Leadership" active={bonusFactors.leadership} />
            <BonusBadge label="Technical Depth" active={bonusFactors.technicalDepth} />
            <BonusBadge label="Top Education" active={bonusFactors.topEducation} />
            <BonusBadge label={`Internships (${bonusFactors.internships || 0})`} active={bonusFactors.internships} />
            <BonusBadge label="Portfolio" active={bonusFactors.portfolio} />
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6">
          <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Matched Skills <span className="text-emerald-600 bg-emerald-100 text-xs px-2 py-0.5 rounded-full ml-1">{matchedSkills.length}</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.length ? matchedSkills.map(s => (
              <span key={s} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200">{s}</span>
            )) : <span className="text-xs text-gray-400 italic">No matched skills</span>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6">
          <h4 className="font-semibold text-rose-800 mb-3 flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Missing Skills <span className="text-rose-600 bg-rose-100 text-xs px-2 py-0.5 rounded-full ml-1">{missingSkills.length}</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.length ? missingSkills.map(s => (
              <span key={s} className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-200">{s}</span>
            )) : <span className="text-xs text-gray-400 italic">No gaps — Perfect match! 🎉</span>}
          </div>
        </div>
      </div>

      {/* All Skills */}
      {candidateSkills.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h4 className="font-semibold text-gray-700 mb-1 text-sm">Your Skills ({candidateSkills.length})</h4>
          <p className="text-xs text-gray-400 mb-3">All skills extracted from your resume</p>
          <div className="flex flex-wrap gap-1.5">
            {candidateSkills.map(s => {
              const isMatched = matchedSkills.map(m => m.toLowerCase()).includes(s.toLowerCase())
              return (
                <span key={s} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  isMatched ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {isMatched && <span className="text-emerald-500 mr-1">✓</span>}{s}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Extracted Profile */}
      {candidateData && (candidateData.experience > 0 || candidateData.college || candidateData.degree) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h4 className="font-semibold text-gray-700 mb-4 text-sm">Extracted Profile</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {candidateData.experience > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-[11px] text-gray-400 font-medium">Experience</span>
                <div className="font-semibold text-gray-800 text-sm mt-0.5">{candidateData.experience} yr{candidateData.experience !== 1 ? 's' : ''}</div>
              </div>
            )}
            {candidateData.college && (
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-[11px] text-gray-400 font-medium">College</span>
                <div className="font-semibold text-gray-800 text-sm mt-0.5">{candidateData.college}</div>
              </div>
            )}
            {candidateData.degree && (
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-[11px] text-gray-400 font-medium">Degree</span>
                <div className="font-semibold text-gray-800 text-sm mt-0.5">{candidateData.degree}</div>
              </div>
            )}
            {candidateData.location && (
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-[11px] text-gray-400 font-medium">Location</span>
                <div className="font-semibold text-gray-800 text-sm mt-0.5">{candidateData.location}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => nav('/candidate')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </button>
          <button onClick={() => nav('/candidate/skill-gap', { state })} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Skill Gap Analysis
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
