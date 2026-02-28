import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import ProgressBar from "../../components/ProgressBar"

function PriorityBadge({ level }) {
  const styles = {
    Critical: 'bg-red-100 text-red-700 border-red-300',
    Important: 'bg-orange-100 text-orange-700 border-orange-300',
    'Nice to Have': 'bg-blue-100 text-blue-700 border-blue-300',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${styles[level] || styles['Nice to Have']}`}>
      {level}
    </span>
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

  // Prioritize missing skills by position in requiredSkills list
  const prioritizedMissing = missingSkills.map((skill, idx) => {
    const reqIdx = (job.requiredSkills || []).findIndex(
      rs => rs.toLowerCase() === skill.toLowerCase()
    )
    let priority = 'Nice to Have'
    if (reqIdx >= 0 && reqIdx < Math.ceil(totalRequired * 0.4)) priority = 'Critical'
    else if (reqIdx >= 0 && reqIdx < Math.ceil(totalRequired * 0.7)) priority = 'Important'
    return { skill, priority, order: reqIdx >= 0 ? reqIdx : 999 }
  }).sort((a, b) => a.order - b.order)

  // Extra skills (candidate has but not required)
  const extraSkills = candidateSkills.filter(
    s => !matchedSkills.map(m => m.toLowerCase()).includes(s.toLowerCase()) &&
         !missingSkills.map(m => m.toLowerCase()).includes(s.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Skill Gap Analysis</h2>
            <p className="text-sm text-gray-500">Target Role: <span className="font-semibold text-indigo-600">{job.name}</span></p>
          </div>
        </div>
      </div>

      {/* Gap Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center py-5 border-red-200 bg-red-50">
          <div className="text-3xl font-bold text-red-600">{gapPercent}%</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Skill Gap</div>
        </div>
        <div className="card text-center py-5 border-green-200 bg-green-50">
          <div className="text-3xl font-bold text-green-600">{matchedSkills.length}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Skills Matched</div>
        </div>
        <div className="card text-center py-5 border-orange-200 bg-orange-50">
          <div className="text-3xl font-bold text-orange-600">{missingSkills.length}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Skills Missing</div>
        </div>
        <div className="card text-center py-5">
          <div className="text-3xl font-bold text-gray-700">{totalRequired}</div>
          <div className="text-xs text-gray-500 mt-1 font-medium">Total Required</div>
        </div>
      </div>

      {/* Gap Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Coverage Progress</span>
          <span className="text-lg font-bold text-indigo-600">{matchPercent}%</span>
        </div>
        <ProgressBar value={matchPercent} max={100} height={14} />
        <p className="text-xs text-gray-400 mt-2">
          You cover {matchedSkills.length} of {totalRequired} required skills for this role
        </p>
      </div>

      {/* Category Weakness Indicators */}
      {categoryScores && Object.keys(categoryScores).length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">📉 Weak Areas</h3>
          <div className="space-y-3">
            {[
              { key: 'skillMatch', label: 'Skill Match', icon: '🎯' },
              { key: 'experience', label: 'Experience', icon: '💼' },
              { key: 'projects', label: 'Projects & Portfolio', icon: '🔨' },
              { key: 'keywords', label: 'Keyword Relevance', icon: '🔑' },
              { key: 'education', label: 'Education', icon: '🎓' },
            ].filter(item => (categoryScores[item.key] ?? 100) < 50).map(item => (
              <div key={item.key} className="flex items-center gap-3 bg-red-50 rounded-lg px-4 py-3 border border-red-100">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-red-800">{item.label}</span>
                  <span className="text-xs text-red-600 ml-2">({categoryScores[item.key]}%)</span>
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">Needs Improvement</span>
              </div>
            ))}
            {[
              { key: 'skillMatch', label: 'Skill Match', icon: '🎯' },
              { key: 'experience', label: 'Experience', icon: '💼' },
              { key: 'projects', label: 'Projects & Portfolio', icon: '🔨' },
              { key: 'keywords', label: 'Keyword Relevance', icon: '🔑' },
              { key: 'education', label: 'Education', icon: '🎓' },
            ].filter(item => (categoryScores[item.key] ?? 0) >= 50).map(item => (
              <div key={item.key} className="flex items-center gap-3 bg-green-50 rounded-lg px-4 py-3 border border-green-100">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-green-800">{item.label}</span>
                  <span className="text-xs text-green-600 ml-2">({categoryScores[item.key]}%)</span>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">Good</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills with Priority */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4">❌ Missing Skills — Priority Ranked</h3>
        {prioritizedMissing.length > 0 ? (
          <div className="space-y-2">
            {prioritizedMissing.map(({ skill, priority }, i) => (
              <div key={skill} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-6">{i + 1}.</span>
                  <span className="font-medium text-gray-800">{skill}</span>
                </div>
                <PriorityBadge level={priority} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-medium">No missing skills — You match all requirements!</p>
          </div>
        )}
      </div>

      {/* Matched Skills */}
      <div className="card border-green-200 bg-green-50">
        <h3 className="font-bold text-green-800 mb-3">✅ Matched Skills ({matchedSkills.length})</h3>
        <div className="flex flex-wrap gap-2">
          {matchedSkills.map(s => (
            <span key={s} className="bg-green-200 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">{s}</span>
          ))}
          {matchedSkills.length === 0 && <span className="text-sm text-gray-500 italic">No skills matched yet</span>}
        </div>
      </div>

      {/* Extra Skills */}
      {extraSkills.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">📝 Your Other Skills ({extraSkills.length})</h3>
          <p className="text-xs text-gray-500 mb-3">Skills you have that aren't required for this specific role — but still valuable!</p>
          <div className="flex flex-wrap gap-2">
            {extraSkills.map(s => (
              <span key={s} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-sm border border-gray-200">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => nav('/candidate/score', { state })} className="btn-secondary">
            ← Back to Score
          </button>
          <button onClick={() => nav('/candidate/roadmap', { state })} className="btn-primary">
            🗺️ View Learning Roadmap →
          </button>
        </div>
      </div>
    </div>
  )
}
