import React, { useMemo, useState } from "react"
import candidatesData from "../../data/candidates.json"
import FilterPanel from "../../components/FilterPanel"
import CandidateCard from "../../components/CandidateCard"

export default function HRDashboard(){
  const [filters, setFilters] = useState({skill:"", location:"", college:"", minMatch:0, experience:""})
  const [sortBy, setSortBy] = useState("")

  const filtered = useMemo(()=>{
    let list = candidatesData.slice()
    if(filters.skill) list = list.filter(c => c.skills.includes(filters.skill))
    if(filters.location) list = list.filter(c => c.location === filters.location)
    if(filters.college) list = list.filter(c => c.college === filters.college)
    if(filters.experience) list = list.filter(c => c.experience >= Number(filters.experience))
    if(filters.minMatch) list = list.filter(c => c.matchPercent >= Number(filters.minMatch))

    if(sortBy === 'highest_score') list.sort((a,b)=>b.score-a.score)
    if(sortBy === 'most_experience') list.sort((a,b)=>b.experience-b.experience)
    if(sortBy === 'top5') list = list.slice(0,5)

    return list
  },[filters, sortBy])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold">HR Dashboard</h2>
        <p className="text-sm text-gray-600">Company: <strong>Demo Corp</strong></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterPanel filters={filters} setFilters={setFilters} setSortBy={setSortBy} />
        </div>
        <div className="lg:col-span-3">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-4">Resume Results</h3>
            <div className="space-y-3">
              {filtered.map(c => (
                <CandidateCard key={c.id} candidate={c} />
              ))}
              {filtered.length===0 && <p className="text-gray-500">No candidates match the filters.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
