import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ProgressBar from '../../components/ProgressBar'

function CategoryBar({ label, value, icon, color }) {
  const colorMap = {
    indigo: 'from-indigo-500 to-indigo-600',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-400 to-amber-500',
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-fuchsia-500',
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-6 text-center">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-bold text-gray-800">{value}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${colorMap[color] || colorMap.indigo} transition-all duration-700`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function BonusBadge({ label, active }) {
  if (!active) return null
  return (
    <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded-full border border-yellow-200 font-medium">
      ⭐ {label}
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

  const strengthColor = resumeStrength === 'Strong' ? 'text-green-600 bg-green-50 border-green-200'
    : resumeStrength === 'Average' ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
    : 'text-red-600 bg-red-50 border-red-200'

  const fitColor = jobFitLevel.includes('Excellent') ? 'text-green-600 bg-green-50 border-green-200'
    : jobFitLevel.includes('Good') ? 'text-blue-600 bg-blue-50 border-blue-200'
    : jobFitLevel.includes('Partial') ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
    : 'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Resume Analysis Report</h2>
            <p className="text-sm text-gray-500">Target Role: <span className="font-semibold text-indigo-600">{job.name}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border font-bold text-lg ${strengthColor}`}>
              {score}%
            </div>
          </div>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center py-5">
          <div className="text-3xl font-bold text-indigo-600">{score}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Resume Score</div>
        </div>
        <div className="card text-center py-5">
          <div className="text-3xl font-bold text-blue-600">{matchPercent}%</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Job Match</div>
        </div>
        <div className={`card text-center py-5 border ${strengthColor}`}>
          <div className="text-lg font-bold">{resumeStrength}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Strength</div>
        </div>
        <div className={`card text-center py-5 border ${fitColor}`}>
          <div className="text-lg font-bold">{jobFitLevel}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Job Fit</div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex gap-3">
            <div className="text-xl mt-0.5">💡</div>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </div>
        </div>
      )}

      {/* Match Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Overall Match Score</span>
          <span className="text-xl font-bold text-indigo-600">{matchPercent}%</span>
        </div>
        <ProgressBar value={matchPercent} max={100} height={14} />
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          📊 Score Breakdown
        </h3>
        <div className="space-y-4">
          <CategoryBar label="Skill Match" value={categoryScores.skillMatch ?? 0} icon="🎯" color="indigo" />
          <CategoryBar label="Experience" value={categoryScores.experience ?? 0} icon="💼" color="green" />
          <CategoryBar label="Projects & Portfolio" value={categoryScores.projects ?? 0} icon="🔨" color="orange" />
          <CategoryBar label="Keywords Relevance" value={categoryScores.keywords ?? 0} icon="🔑" color="blue" />
          <CategoryBar label="Education" value={categoryScores.education ?? 0} icon="🎓" color="purple" />
        </div>
      </div>

      {/* Bonus Factors */}
      {Object.keys(bonusFactors).length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            ⭐ Bonus Factors Detected
          </h3>
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
        <div className="card border-green-200 bg-green-50">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            ✅ Matched Skills ({matchedSkills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.length ? matchedSkills.map(s => (
              <span key={s} className="bg-green-200 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">{s}</span>
            )) : <span className="text-sm text-gray-500 italic">No matched skills</span>}
          </div>
        </div>
        <div className="card border-red-200 bg-red-50">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            ❌ Missing Skills ({missingSkills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length ? missingSkills.map(s => (
              <span key={s} className="bg-red-200 text-red-800 px-3 py-1.5 rounded-full text-sm font-medium">{s}</span>
            )) : <span className="text-sm text-gray-500 italic">No missing skills — Great! 🎉</span>}
          </div>
        </div>
      </div>

      {/* Extra Skills (candidate has but not required) */}
      {candidateSkills.length > 0 && (
        <div className="card">
          <h4 className="font-semibold text-gray-700 mb-3">📝 All Your Skills ({candidateSkills.length})</h4>
          <div className="flex flex-wrap gap-2">
            {candidateSkills.map(s => {
              const isMatched = matchedSkills.map(m => m.toLowerCase()).includes(s.toLowerCase())
              return (
                <span key={s} className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  isMatched ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {isMatched && '✓ '}{s}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Candidate Info */}
      {candidateData && (candidateData.experience > 0 || candidateData.college || candidateData.degree) && (
        <div className="card">
          <h4 className="font-semibold text-gray-700 mb-3">📋 Extracted Profile</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {candidateData.experience > 0 && (
              <div>
                <span className="text-gray-500 text-xs">Experience</span>
                <div className="font-medium">{candidateData.experience} year{candidateData.experience !== 1 ? 's' : ''}</div>
              </div>
            )}
            {candidateData.college && (
              <div>
                <span className="text-gray-500 text-xs">College</span>
                <div className="font-medium">{candidateData.college}</div>
              </div>
            )}
            {candidateData.degree && (
              <div>
                <span className="text-gray-500 text-xs">Degree</span>
                <div className="font-medium">{candidateData.degree}</div>
              </div>
            )}
            {candidateData.location && (
              <div>
                <span className="text-gray-500 text-xs">Location</span>
                <div className="font-medium">{candidateData.location}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => nav('/candidate')} className="btn-secondary">
            ← Back to Dashboard
          </button>
          <button onClick={() => nav('/candidate/skill-gap', { state })} className="btn-primary bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
            📊 Skill Gap Analysis
          </button>
          <button onClick={() => nav('/candidate/roadmap', { state })} className="btn-primary">
            🗺️ Learning Roadmap
          </button>
        </div>
      </div>
    </div>
  )
}
