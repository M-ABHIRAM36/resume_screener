import React, { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export default function Roadmap() {
  const { state } = useLocation()
  const nav = useNavigate()
  const job = state?.job || { name: 'Selected Role', roadmapSteps: [], requiredSkills: [] }
  const matchedSkills = state?.matchedSkills || []
  const missingSkills = state?.missingSkills || []
  const matchPercent = state?.matchPercent ?? 0

  const phases = useMemo(() => {
    const steps = job.roadmapSteps || []
    const matchedLower = new Set(matchedSkills.map(s => s.toLowerCase()))
    const missingLower = missingSkills.map(s => s.toLowerCase())

    const foundation = []
    const coreSteps = []
    const practice = []
    const jobReady = []

    steps.forEach((step, i) => {
      const sl = step.toLowerCase()
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

    missingLower.forEach(sk => {
      const alreadyCovered = coreSteps.some(s => s.text.toLowerCase().includes(sk))
      if (!alreadyCovered && sk.length > 1) {
        coreSteps.push({ text: `Learn ${sk.charAt(0).toUpperCase() + sk.slice(1)}`, done: false, idx: -1 })
      }
    })

    if (practice.length === 0 && missingSkills.length > 0) {
      practice.push({ text: `Build a project using ${missingSkills.slice(0, 3).join(', ')}`, done: false, idx: -1 })
      practice.push({ text: 'Add project to GitHub with README', done: false, idx: -1 })
    }

    if (jobReady.length === 0) {
      jobReady.push({ text: 'Update resume with new skills and projects', done: false, idx: -1 })
      jobReady.push({ text: 'Prepare for technical interviews', done: false, idx: -1 })
    }

    const result = []
    if (foundation.length > 0) {
      result.push({ title: 'Foundation', subtitle: 'Skills you already have', color: 'emerald', weeks: '', items: foundation })
    }
    if (coreSteps.length > 0) {
      const weeksEstimate = Math.max(2, coreSteps.length * 1.5)
      result.push({ title: 'Core Learning', subtitle: 'Skills to build', color: 'indigo', weeks: `~${Math.round(weeksEstimate)} weeks`, items: coreSteps })
    }
    if (practice.length > 0) {
      result.push({ title: 'Practical Application', subtitle: 'Build real projects', color: 'amber', weeks: '~2-3 weeks', items: practice })
    }
    if (jobReady.length > 0) {
      result.push({ title: 'Job-Ready', subtitle: 'Final preparation', color: 'violet', weeks: '~1-2 weeks', items: jobReady })
    }
    return result
  }, [job, matchedSkills, missingSkills])

  const totalSteps = phases.reduce((sum, p) => sum + p.items.length, 0)
  const completedSteps = phases.reduce((sum, p) => sum + p.items.filter(i => i.done).length, 0)
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  const colorThemes = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', head: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', track: 'bg-emerald-200', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', head: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', track: 'bg-indigo-200', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', head: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', track: 'bg-amber-200', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', head: 'text-violet-800', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500', track: 'bg-violet-200', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
  }

  const phaseIcons = [
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  ]

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-50 px-3 py-1 rounded-full text-violet-600 text-xs font-semibold mb-3">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              Personalized Plan
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Learning Roadmap</h2>
            <p className="text-sm text-gray-500">Target: <span className="font-semibold text-gray-700">{job.name}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-indigo-600">{progressPercent}%</div>
              <div className="text-[11px] text-gray-400 font-medium">Complete</div>
            </div>
            <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
            <div className="text-center hidden md:block">
              <div className="text-lg font-bold text-gray-700">{completedSteps}/{totalSteps}</div>
              <div className="text-[11px] text-gray-400 font-medium">Steps</div>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-5">
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Phase Cards */}
      {phases.length > 0 ? (
        phases.map((phase, pIdx) => {
          const t = colorThemes[phase.color] || colorThemes.indigo
          return (
            <div key={pIdx} className={`bg-white rounded-2xl shadow-sm border ${t.border} overflow-hidden`}>
              {/* Phase Header */}
              <div className={`${t.bg} px-6 py-4 border-b ${t.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${t.iconBg} flex items-center justify-center ${t.iconText}`}>
                      {phaseIcons[pIdx] || phaseIcons[0]}
                    </div>
                    <div>
                      <h3 className={`font-bold text-base ${t.head}`}>Phase {pIdx + 1}: {phase.title}</h3>
                      <p className="text-[11px] text-gray-500">{phase.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {phase.weeks && (
                      <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${t.badge}`}>{phase.weeks}</span>
                    )}
                    <span className="text-xs text-gray-400 font-medium">{phase.items.length} items</span>
                  </div>
                </div>
              </div>

              {/* Phase Items */}
              <div className="p-6">
                <div className="relative ml-2">
                  {/* Track */}
                  <div className={`absolute left-[7px] top-0 bottom-0 w-0.5 ${t.track}`}></div>

                  <div className="space-y-3">
                    {phase.items.map((item, iIdx) => (
                      <div key={iIdx} className="relative flex items-start pl-8">
                        {/* Dot */}
                        <div className={`absolute left-0 top-3 w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-sm ${
                          item.done
                            ? `${t.dot} border-transparent`
                            : 'bg-white border-gray-300'
                        }`}>
                          {item.done && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          )}
                        </div>

                        <div className={`flex-1 py-2.5 px-4 rounded-xl border transition-all ${
                          item.done
                            ? 'bg-gray-50/60 border-gray-100'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}>
                          <span className={`text-sm font-medium ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {item.text}
                          </span>
                          {item.done && (
                            <span className="ml-2 text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">Done</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center py-16">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <p className="font-semibold text-gray-600">No roadmap available for this role</p>
          <p className="text-xs text-gray-400 mt-1">Please select a different job role to view a learning path</p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => nav('/candidate')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </button>
          {state?.score !== undefined && (
            <button onClick={() => nav('/candidate/score', { state })} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Score Report
            </button>
          )}
          <button onClick={() => nav('/candidate/skill-gap', { state })} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Skill Gap Analysis
          </button>
        </div>
      </div>
    </div>
  )
}
