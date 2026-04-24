import React, { useState, useMemo } from 'react'

export default function FilterPanel({ filters, setFilters, setSortBy, sortBy, currentJob, candidatesList = [] }) {
  const [customKeyword, setCustomKeyword] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const candidates = candidatesList || []

  // Derive unique values from candidates for dropdown options
  const skills = useMemo(() =>
    Array.from(new Set(candidates.flatMap(c => c.skills || []))).sort(), [candidates])
  const locations = useMemo(() =>
    Array.from(new Set(candidates.map(c => c.location).filter(Boolean).filter(l => l !== 'Not specified' && l !== '—'))).sort(), [candidates])
  const colleges = useMemo(() =>
    Array.from(new Set(candidates.map(c => c.college).filter(Boolean))).sort(), [candidates])
  const degrees = useMemo(() =>
    Array.from(new Set(candidates.map(c => c.branch || c.degree).filter(Boolean))).sort(), [candidates])

  const minMatchDisabled = !currentJob

  function handleAddKeyword() {
    const kw = customKeyword.trim()
    if (!kw) return
    const existing = filters.keywords || []
    if (!existing.includes(kw)) {
      setFilters({ ...filters, keywords: [...existing, kw] })
    }
    setCustomKeyword('')
  }

  function handleRemoveKeyword(kw) {
    setFilters({ ...filters, keywords: (filters.keywords || []).filter(k => k !== kw) })
  }

  function handleMultiSkillToggle(skill) {
    const existing = filters.selectedSkills || []
    if (existing.includes(skill)) {
      setFilters({ ...filters, selectedSkills: existing.filter(s => s !== skill) })
    } else {
      setFilters({ ...filters, selectedSkills: [...existing, skill] })
    }
  }

  // Quick preset filters
  const presets = [
    { label: '🏆 Top 5 Candidates', sort: 'top5_score' },
    { label: '⭐ Score ≥ 80', action: () => setFilters({ ...filters, minScore: 80 }) },
    { label: '🎯 Match ≥ 70%', action: () => setFilters({ ...filters, minMatch: 70 }) },
    { label: '💼 3+ Yrs Exp', action: () => setFilters({ ...filters, experience: '3' }) },
    { label: '💪 Strong Resumes', action: () => setFilters({ ...filters, resumeStrength: 'Strong' }) },
    { label: '🔗 Has Portfolio', action: () => setFilters({ ...filters, hasPortfolio: true }) },
  ]

  return (
    <div>
      {/* Quick Presets */}
      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
        ⚡ Quick Filters
      </h4>
      <div className="flex flex-wrap gap-2 mb-5">
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              if (p.sort) setSortBy(p.sort)
              if (p.action) p.action()
            }}
            className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors font-medium"
          >
            {p.label}
          </button>
        ))}
      </div>

      <hr className="mb-4 border-gray-200" />

      {/* Sort By */}
      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
        📊 Sort &amp; Rank
      </h4>
      <select
        value={sortBy || ''}
        onChange={e => setSortBy(e.target.value)}
        className="input-field mb-4 text-sm"
      >
        <option value="">Default Order</option>
        <optgroup label="Top N">
          <option value="top5_score">Top 5 by Score</option>
          <option value="top10_score">Top 10 by Score</option>
          <option value="top5_match">Top 5 by Match %</option>
          <option value="top10_match">Top 10 by Match %</option>
          <option value="top5_exp">Top 5 by Experience</option>
        </optgroup>
        <optgroup label="Sort All">
          <option value="highest_score">Highest Score First</option>
          <option value="lowest_score">Lowest Score First</option>
          <option value="highest_match">Highest Match % First</option>
          <option value="most_experience">Most Experience First</option>
          <option value="least_experience">Least Experience First</option>
          <option value="name_asc">Name A → Z</option>
          <option value="name_desc">Name Z → A</option>
          <option value="most_skills">Most Skills First</option>
        </optgroup>
      </select>

      <hr className="mb-4 border-gray-200" />

      {/* Core Filters */}
      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
        🔍 Filters
      </h4>
      <div className="space-y-3">
        {/* Search / Keyword */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">🔎 Search Name / Email</label>
          <input
            type="text"
            value={filters.searchText || ''}
            onChange={e => setFilters({ ...filters, searchText: e.target.value })}
            className="input-field text-sm"
            placeholder="Type name or email..."
          />
        </div>

        {/* Skill Filter */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">🛠 Skill</label>
          <select value={filters.skill || ''} onChange={e => setFilters({ ...filters, skill: e.target.value })} className="input-field text-sm">
            <option value="">Any Skill</option>
            {skills.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Score Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">📈 Min Score</label>
            <input
              type="number"
              min="0" max="100"
              value={filters.minScore || ''}
              onChange={e => setFilters({ ...filters, minScore: e.target.value })}
              className="input-field text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">📉 Max Score</label>
            <input
              type="number"
              min="0" max="100"
              value={filters.maxScore || ''}
              onChange={e => setFilters({ ...filters, maxScore: e.target.value })}
              className="input-field text-sm"
              placeholder="100"
            />
          </div>
        </div>

        {/* Match % */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">🎯 Min Match %</label>
          <input
            type="range"
            min="0" max="100" step="5"
            value={filters.minMatch || 0}
            onChange={e => setFilters({ ...filters, minMatch: Number(e.target.value) })}
            className="w-full accent-indigo-600"
            disabled={minMatchDisabled}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span className="font-bold text-indigo-600">{filters.minMatch || 0}%</span>
            <span>100%</span>
          </div>
          {minMatchDisabled && (
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <span>⚠️</span><span>Select a job to enable.</span>
            </div>
          )}
        </div>

        {/* Experience */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">💼 Min Experience (years)</label>
          <input
            type="number"
            min="0"
            value={filters.experience || ''}
            onChange={e => setFilters({ ...filters, experience: e.target.value })}
            className="input-field text-sm"
            placeholder="e.g. 2"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">📍 Location</label>
          <select value={filters.location || ''} onChange={e => setFilters({ ...filters, location: e.target.value })} className="input-field text-sm">
            <option value="">Any Location</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* College */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">🏫 College</label>
          <select value={filters.college || ''} onChange={e => setFilters({ ...filters, college: e.target.value })} className="input-field text-sm">
            <option value="">Any College</option>
            {colleges.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Resume Strength */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">💪 Resume Strength</label>
          <select value={filters.resumeStrength || ''} onChange={e => setFilters({ ...filters, resumeStrength: e.target.value })} className="input-field text-sm">
            <option value="">Any</option>
            <option value="Strong">🟢 Strong</option>
            <option value="Average">🟡 Average</option>
            <option value="Weak">🔴 Weak</option>
          </select>
        </div>

        {/* Job Fit Level */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">🎯 Job Fit Level</label>
          <select value={filters.jobFitLevel || ''} onChange={e => setFilters({ ...filters, jobFitLevel: e.target.value })} className="input-field text-sm">
            <option value="">Any</option>
            <option value="High">🟢 High Fit</option>
            <option value="Medium">🟡 Medium Fit</option>
            <option value="Low">🔴 Low Fit</option>
          </select>
        </div>
      </div>

      {/* Advanced / Custom Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-4 w-full text-xs text-indigo-600 font-semibold py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        {showAdvanced ? '▲ Hide Advanced Filters' : '▼ Show Advanced Filters'}
      </button>

      {showAdvanced && (
        <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {/* Degree / Branch */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">🎓 Degree / Branch</label>
            <select value={filters.degree || ''} onChange={e => setFilters({ ...filters, degree: e.target.value })} className="input-field text-sm">
              <option value="">Any</option>
              {degrees.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Has Portfolio */}
          <div className="flex items-center justify-between py-1">
            <label className="text-xs font-semibold text-gray-600">🔗 Has Portfolio Links</label>
            <button
              type="button"
              role="switch"
              aria-checked={filters.hasPortfolio}
              onClick={() => setFilters({ ...filters, hasPortfolio: !filters.hasPortfolio })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${filters.hasPortfolio ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${filters.hasPortfolio ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Has Internships */}
          <div className="flex items-center justify-between py-1">
            <label className="text-xs font-semibold text-gray-600">💼 Has Internships</label>
            <button
              type="button"
              role="switch"
              aria-checked={filters.hasInternships}
              onClick={() => setFilters({ ...filters, hasInternships: !filters.hasInternships })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${filters.hasInternships ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${filters.hasInternships ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Min Skills Count */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">🔢 Min Skills Count</label>
            <input
              type="number"
              min="0"
              value={filters.minSkillsCount || ''}
              onChange={e => setFilters({ ...filters, minSkillsCount: e.target.value })}
              className="input-field text-sm"
              placeholder="e.g. 5"
            />
          </div>

          {/* Multi-Skill Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">🧩 Must Have Skills (multi-select)</label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
              {skills.length > 0 ? skills.map(s => (
                <label key={s} className="flex items-center gap-2 py-0.5 text-xs cursor-pointer hover:bg-indigo-50 px-1 rounded">
                  <input
                    type="checkbox"
                    checked={(filters.selectedSkills || []).includes(s)}
                    onChange={() => handleMultiSkillToggle(s)}
                    className="accent-indigo-600"
                  />
                  <span>{s}</span>
                </label>
              )) : <span className="text-xs text-gray-400">No skills available yet</span>}
            </div>
            {(filters.selectedSkills || []).length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {filters.selectedSkills.map(s => (
                  <span key={s} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    {s}
                    <button onClick={() => handleMultiSkillToggle(s)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Custom Keywords */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">🏷 Custom Keywords (search in all fields)</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={customKeyword}
                onChange={e => setCustomKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                className="input-field text-sm flex-1"
                placeholder="Add keyword & press Enter"
              />
              <button onClick={handleAddKeyword} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">+</button>
            </div>
            {(filters.keywords || []).length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {filters.keywords.map(kw => (
                  <span key={kw} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    {kw}
                    <button onClick={() => handleRemoveKeyword(kw)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Experience Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Min Exp</label>
              <input
                type="number" min="0"
                value={filters.experience || ''}
                onChange={e => setFilters({ ...filters, experience: e.target.value })}
                className="input-field text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Max Exp</label>
              <input
                type="number" min="0"
                value={filters.maxExperience || ''}
                onChange={e => setFilters({ ...filters, maxExperience: e.target.value })}
                className="input-field text-sm"
                placeholder="Any"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Count */}
      {(() => {
        const count = [
          filters.skill, filters.location, filters.college, filters.searchText,
          filters.minScore, filters.maxScore, filters.resumeStrength, filters.jobFitLevel,
          filters.degree, filters.hasPortfolio, filters.hasInternships, filters.minSkillsCount,
          filters.maxExperience,
          (filters.selectedSkills || []).length > 0 ? 'y' : '',
          (filters.keywords || []).length > 0 ? 'y' : '',
          filters.minMatch > 0 ? 'y' : '',
          filters.experience ? 'y' : ''
        ].filter(Boolean).length
        return count > 0 ? (
          <div className="mt-3 text-xs text-center text-indigo-600 font-semibold bg-indigo-50 py-1.5 rounded-lg">
            {count} active filter{count !== 1 ? 's' : ''} applied
          </div>
        ) : null
      })()}
    </div>
  )
}
