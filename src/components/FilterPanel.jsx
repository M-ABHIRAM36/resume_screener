import React from 'react'

export default function FilterPanel({filters, setFilters, setSortBy, currentJob, candidatesList=[]}){
  const candidates = candidatesList || []
  const skills = Array.from(new Set(candidates.flatMap(c=>c.skills))).slice(0,30)
  const locations = Array.from(new Set(candidates.map(c=>c.location)))
  const colleges = Array.from(new Set(candidates.map(c=>c.college)))

  const minMatchDisabled = !currentJob

  return (
    <div>
      <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
        🔍 Filters
      </h4>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1 block">Skill</label>
          <select value={filters.skill} onChange={e=>setFilters({...filters, skill:e.target.value})} className="input-field">
            <option value="">Any Skill</option>
            {skills.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1 block">Location</label>
          <select value={filters.location} onChange={e=>setFilters({...filters, location:e.target.value})} className="input-field">
            <option value="">Any Location</option>
            {locations.map(l=> <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1 block">College</label>
          <select value={filters.college} onChange={e=>setFilters({...filters, college:e.target.value})} className="input-field">
            <option value="">Any College</option>
            {colleges.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1 block">Minimum Match %</label>
          <input 
            type="number" 
            value={filters.minMatch} 
            onChange={e=>setFilters({...filters, minMatch:e.target.value})} 
            className={`input-field ${minMatchDisabled? 'bg-gray-100 cursor-not-allowed':''}`} 
            disabled={minMatchDisabled}
            placeholder="e.g. 70"
          />
          {minMatchDisabled && (
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span>⚠️</span>
              <span>Activate a job to enable match filters.</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1 block">Experience (years)</label>
          <input 
            type="number" 
            value={filters.experience} 
            onChange={e=>setFilters({...filters, experience:e.target.value})} 
            className="input-field"
            placeholder="e.g. 3"
          />
        </div>
      </div>
    </div>
  )
}
