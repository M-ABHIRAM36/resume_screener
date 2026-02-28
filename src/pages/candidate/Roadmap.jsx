import React, { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import ProgressBar from "../../components/ProgressBar"

export default function Roadmap() {
  const { state } = useLocation()
  const nav = useNavigate()
  const job = state?.job || { name: 'Selected Role', roadmapSteps: [], requiredSkills: [] }
  const matchedSkills = state?.matchedSkills || []
  const missingSkills = state?.missingSkills || []
  const matchPercent = state?.matchPercent ?? 0
  const candidateData = state?.candidateData || null

  // Build personalized phases from roadmap steps + skills
  const phases = useMemo(() => {
    const steps = job.roadmapSteps || []
    const matchedLower = new Set(matchedSkills.map(s => s.toLowerCase()))
    const missingLower = missingSkills.map(s => s.toLowerCase())

    // Phase 1: Foundation — steps the candidate already knows
    const foundation = []
    // Phase 2: Core Learning — main steps to learn
    const coreSteps = []
    // Phase 3: Practice — build projects
    const practice = []
    // Phase 4: Job-Ready — final steps
    const jobReady = []

    steps.forEach((step, i) => {
      const sl = step.toLowerCase()
      // Guess if this step relates to a matched skill
      const relatesMatched = [...matchedLower].some(sk =>
        sl.includes(sk) || sk.split(/[\s/]+/).some(w => w.length > 2 && sl.includes(w))
      )

      if (relatesMatched) {
        foundation.push({ text: step, done: true, idx: i })
      } else if (sl.includes('project') || sl.includes('portfolio') || sl.includes('build') || sl.includes('practice')) {
        practice.push({ text: step, done: false, idx: i })
      } else if (sl.includes('deploy') || sl.includes('interview') || sl.includes('resume') || sl.includes('job')) {
        jobReady.push({ text: step, done: false, idx: i })
      } else {
        coreSteps.push({ text: step, done: false, idx: i })
      }
    })

    // Add missing skills as learning items if they're not already covered
    missingLower.forEach(sk => {
      const alreadyCovered = coreSteps.some(s => s.text.toLowerCase().includes(sk))
      if (!alreadyCovered && sk.length > 1) {
        coreSteps.push({ text: `Learn ${sk.charAt(0).toUpperCase() + sk.slice(1)}`, done: false, idx: -1 })
      }
    })

    // If no practice steps, add generic ones
    if (practice.length === 0 && missingSkills.length > 0) {
      practice.push({ text: `Build a project using ${missingSkills.slice(0, 3).join(', ')}`, done: false, idx: -1 })
      practice.push({ text: 'Add project to GitHub with README', done: false, idx: -1 })
    }

    // If no job-ready steps, add generic
    if (jobReady.length === 0) {
      jobReady.push({ text: 'Update resume with new skills and projects', done: false, idx: -1 })
      jobReady.push({ text: 'Prepare for technical interviews', done: false, idx: -1 })
    }

    const result = []
    if (foundation.length > 0) {
      result.push({
        title: 'Foundation',
        subtitle: 'Skills you already have',
        icon: '✅',
        color: 'green',
        weeks: '',
        items: foundation
      })
    }
    if (coreSteps.length > 0) {
      const weeksEstimate = Math.max(2, coreSteps.length * 1.5)
      result.push({
        title: 'Core Learning',
        subtitle: 'Skills to build',
        icon: '📚',
        color: 'indigo',
        weeks: `~${Math.round(weeksEstimate)} weeks`,
        items: coreSteps
      })
    }
    if (practice.length > 0) {
      result.push({
        title: 'Practical Application',
        subtitle: 'Build real projects',
        icon: '🔨',
        color: 'orange',
        weeks: '~2-3 weeks',
        items: practice
      })
    }
    if (jobReady.length > 0) {
      result.push({
        title: 'Job-Ready',
        subtitle: 'Final preparation',
        icon: '🎯',
        color: 'purple',
        weeks: '~1-2 weeks',
        items: jobReady
      })
    }

    return result
  }, [job, matchedSkills, missingSkills])

  const totalSteps = phases.reduce((sum, p) => sum + p.items.length, 0)
  const completedSteps = phases.reduce((sum, p) => sum + p.items.filter(i => i.done).length, 0)
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  const phaseColors = {
    green: {
      bg: 'bg-green-50', border: 'border-green-200', head: 'text-green-800', badge: 'bg-green-100 text-green-700',
      circle: 'bg-green-500 border-green-600', line: 'bg-green-300'
    },
    indigo: {
      bg: 'bg-indigo-50', border: 'border-indigo-200', head: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700',
      circle: 'bg-indigo-400 border-indigo-500', line: 'bg-indigo-200'
    },
    orange: {
      bg: 'bg-orange-50', border: 'border-orange-200', head: 'text-orange-800', badge: 'bg-orange-100 text-orange-700',
      circle: 'bg-orange-400 border-orange-500', line: 'bg-orange-200'
    },
    purple: {
      bg: 'bg-purple-50', border: 'border-purple-200', head: 'text-purple-800', badge: 'bg-purple-100 text-purple-700',
      circle: 'bg-purple-400 border-purple-500', line: 'bg-purple-200'
    },
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Learning Roadmap</h2>
            <p className="text-sm text-gray-500">Target Role: <span className="font-semibold text-indigo-600">{job.name}</span></p>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Roadmap Progress</div>
            <div className="text-3xl font-bold text-indigo-600">{progressPercent}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {completedSteps} of {totalSteps} steps covered
            </div>
          </div>
          <div className="text-5xl">🎯</div>
        </div>
        <ProgressBar value={progressPercent} max={100} height={12} />
      </div>

      {/* Phases */}
      {phases.length > 0 ? (
        phases.map((phase, pIdx) => {
          const c = phaseColors[phase.color] || phaseColors.indigo
          return (
            <div key={pIdx} className={`card ${c.border} ${c.bg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{phase.icon}</span>
                  <div>
                    <h3 className={`font-bold text-lg ${c.head}`}>Phase {pIdx + 1}: {phase.title}</h3>
                    <p className="text-xs text-gray-500">{phase.subtitle}</p>
                  </div>
                </div>
                {phase.weeks && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${c.badge}`}>
                    {phase.weeks}
                  </span>
                )}
              </div>

              <div className="relative ml-4">
                {/* Vertical line */}
                <div className={`absolute left-2 top-0 bottom-0 w-0.5 ${c.line}`}></div>

                <div className="space-y-3">
                  {phase.items.map((item, iIdx) => (
                    <div key={iIdx} className="relative flex items-start pl-7">
                      {/* Circle */}
                      <div className={`absolute left-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        item.done
                          ? `${c.circle} shadow-sm`
                          : 'bg-white border-gray-300'
                      }`}>
                        {item.done && <span className="text-white text-[9px]">✓</span>}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                        item.done
                          ? 'bg-white/70 border-green-200'
                          : 'bg-white border-gray-200'
                      }`}>
                        <span className={`text-sm font-medium ${item.done ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                          {item.done ? '✓ ' : ''}{item.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })
      ) : (
        <div className="card text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-3">📚</div>
          <div className="text-gray-600 font-medium">No roadmap available for this role.</div>
          <div className="text-sm text-gray-500 mt-1">Please select a different job role.</div>
        </div>
      )}

      {/* Actions */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => nav('/candidate')} className="btn-secondary">
            ← Back to Dashboard
          </button>
          {state?.score !== undefined && (
            <button onClick={() => nav('/candidate/score', { state })} className="btn-secondary">
              📊 View Score
            </button>
          )}
          <button onClick={() => nav('/candidate/skill-gap', { state })} className="btn-primary bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
            📊 Skill Gap Analysis
          </button>
        </div>
      </div>
    </div>
  )
}
