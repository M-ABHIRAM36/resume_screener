import React from 'react'
import candidates from '../data/candidates.json'

export default function FilterPanel({filters, setFilters, setSortBy, currentJob}){
  const skills = Array.from(new Set(candidates.flatMap(c=>c.skills))).slice(0,30)
  const locations = Array.from(new Set(candidates.map(c=>c.location)))
  const colleges = Array.from(new Set(candidates.map(c=>c.college)))

  const minMatchDisabled = !currentJob

  return (
    <div className="bg-white rounded shadow p-4">
      <h4 className="font-semibold mb-3">Filters</h4>
      <div className="space-y-3">
        <div>
          <label className="text-sm">Skill</label>
          <select value={filters.skill} onChange={e=>setFilters({...filters, skill:e.target.value})} className="w-full border p-2 rounded mt-1">
            <option value="">Any</option>
            {skills.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm">Location</label>
          <select value={filters.location} onChange={e=>setFilters({...filters, location:e.target.value})} className="w-full border p-2 rounded mt-1">
            <option value="">Any</option>
            {locations.map(l=> <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm">College</label>
          <select value={filters.college} onChange={e=>setFilters({...filters, college:e.target.value})} className="w-full border p-2 rounded mt-1">
            <option value="">Any</option>
            {colleges.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm">Minimum Match %</label>
          <input type="number" value={filters.minMatch} onChange={e=>setFilters({...filters, minMatch:e.target.value})} className={`w-full border p-2 rounded mt-1 ${minMatchDisabled? 'bg-gray-100 cursor-not-allowed':''}`} disabled={minMatchDisabled} />
          {minMatchDisabled && <div className="text-xs text-gray-500 mt-1">Activate a job to enable match filters.</div>}
        </div>

        <div>
          <label className="text-sm">Experience (years)</label>
          <input type="number" value={filters.experience} onChange={e=>setFilters({...filters, experience:e.target.value})} className="w-full border p-2 rounded mt-1" />
        </div>

        <div>
          <label className="text-sm">Sort</label>
          <select onChange={e=>setSortBy(e.target.value)} className="w-full border p-2 rounded mt-1">
            <option value="">Default</option>
            <option value="top5">Top 5</option>
            <option value="highest_score">Highest score</option>
            <option value="most_experience">Most experience</option>
          </select>
        </div>
      </div>
    </div>
  )
}
