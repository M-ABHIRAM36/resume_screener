import React, { useMemo, useState, useEffect } from "react"
import FilterPanel from "../../components/FilterPanel"
import CandidateCard from "../../components/CandidateCard"
import ResumeUpload from "../../components/ResumeUpload"
import ScoreBadge from "../../components/ScoreBadge"
import { get, post } from "../../api"

export default function HRDashboard(){
  const [filters, setFilters] = useState({skill:"", location:"", college:"", minMatch:0, experience:""})
  const [sortBy, setSortBy] = useState("")
  const [view, setView] = useState('cards')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [currentJob, setCurrentJob] = useState(null)
  const [jobTitle, setJobTitle] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [candidatesList, setCandidatesList] = useState([])
  const [jobRoles, setJobRoles] = useState([])

  // Only treat these as "predefined" roles
  function isPredefinedRole(job){
    if(!job || !job.name) return false
    const n = job.name.toLowerCase()
    return n.includes('front') || n.includes('back') || n.includes('data') || n.includes('data scientist')
  }

  useEffect(()=>{
    // load predefined jobs from backend
    get('/hr/jobs').then(jobs=>{
      setJobRoles(jobs || [])
      // pick first predefined role if available
      const firstPre = (jobs||[]).find(isPredefinedRole)
      if(firstPre) setSelectedRoleId(firstPre.id)
    }).catch(err=> console.warn('jobs load', err))
    // initial candidates: empty until job selected
    setCandidatesList([])
  },[])

  async function computeMatchesForJob(job){
    if(!job || !job.id) return;
    const params = new URLSearchParams();
    if(filters.skill) params.append('skill', filters.skill)
    if(filters.location) params.append('location', filters.location)
    if(filters.college) params.append('college', filters.college)
    if(filters.experience) params.append('experience', filters.experience)
    if(filters.minMatch) params.append('minMatchPercentage', filters.minMatch)

    const url = `/hr/dashboard/${job.id}?` + params.toString()
    try{
      const list = await get(url)
      setCandidatesList(list)
    }catch(e){
      console.error('computeMatchesForJob', e)
    }
  }

  async function handleCreateJob(){
    // If a predefined role (by id) is selected, use it; otherwise create via backend
    const found = jobRoles.find(j => j.id === selectedRoleId)
    if(found && isPredefinedRole(found)){
      setCurrentJob(found)
    } else {
      try{
        const created = await post('/hr/jobs', { jobTitle: jobTitle || 'Custom Job', requiredSkills: [], experienceRange:'', location: jobLocation })
        setCurrentJob(created)
        // refresh jobs
        const all = await get('/hr/jobs')
        setJobRoles(all)
      }catch(e){ console.error('create job', e) }
    }
  }

  useEffect(()=>{
    if(selectedRoleId){
      const found = jobRoles.find(j => j.id === selectedRoleId);
      if(found){
        setCurrentJob(found);
        setJobTitle(found.name);
        setJobLocation(found.location || '');
        setJobDesc((found.roadmapSteps||[]).join('; '));
        computeMatchesForJob(found);
      }
    }
  },[selectedRoleId, jobRoles])

  const filtered = useMemo(()=>{
    let list = candidatesList.slice()
    if(filters.skill) list = list.filter(c => c.skills.map(s=>s.toLowerCase()).includes(filters.skill.toLowerCase()))
    if(filters.location) list = list.filter(c => c.location.toLowerCase() === filters.location.toLowerCase())
    if(filters.college) list = list.filter(c => c.college.toLowerCase() === filters.college.toLowerCase())
    if(filters.experience) list = list.filter(c => c.experience >= Number(filters.experience))
    if(filters.minMatch) list = list.filter(c => c.matchPercentage >= Number(filters.minMatch))

    if(sortBy === 'highest_score') list.sort((a,b)=>b.score-a.score)
    if(sortBy === 'most_experience') list.sort((a,b)=>b.experience-a.experience)
    if(sortBy === 'top5') list = list.slice(0,5)

    return list
  },[filters, sortBy, candidatesList])

  const stats = useMemo(()=>{
    const total = candidatesList.length
    const avgScore = Math.round((candidatesList.reduce((s,c)=>s+c.score,0)/total)||0)
    const avgExp = Math.round((candidatesList.reduce((s,c)=>s+c.experience,0)/total)||0)
    const topSkills = Object.entries(candidatesList.flatMap(c=>c.skills).reduce((acc,s)=>{acc[s]=(acc[s]||0)+1;return acc},{}) ).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0])
    const matchedCount = candidatesList.filter(c=>c.matchPercentage>=70).length
    return {total, avgScore, avgExp, topSkills, matchedCount}
  },[candidatesList])

  // only show predefined roles in the select
  const predefinedOptions = jobRoles.filter(isPredefinedRole)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded shadow p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">HR Dashboard</h2>
          <p className="text-sm text-gray-600">Company: <strong>Demo Corp</strong></p>
        </div>
        <div className="flex gap-4">
          <div className="text-sm text-gray-600">Logged in as <strong>HR</strong></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded p-4 shadow">
              <div className="text-sm text-gray-500">Total Candidates</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white rounded p-4 shadow">
              <div className="text-sm text-gray-500">Avg Score</div>
              <div className="flex items-center gap-2"><div className="text-2xl font-bold">{stats.avgScore}</div><ScoreBadge score={stats.avgScore} /></div>
            </div>
            <div className="bg-white rounded p-4 shadow">
              <div className="text-sm text-gray-500">Avg Experience</div>
              <div className="text-2xl font-bold">{stats.avgExp} yrs</div>
            </div>
            <div className="bg-white rounded p-4 shadow">
              <div className="text-sm text-gray-500">Top Skills</div>
              <div className="mt-2 flex flex-wrap">{stats.topSkills.map(s=> <span key={s} className="bg-gray-100 text-sm px-2 py-1 rounded mr-2 mb-2">{s}</span>)}</div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h4 className="font-semibold mb-2">Create / Select Job</h4>
            <label className="text-sm text-gray-600">Predefined Roles</label>
            <select value={selectedRoleId} onChange={e=>setSelectedRoleId(e.target.value)} className="w-full border p-2 rounded mb-2">
              <option value="">-- Select role --</option>
              {predefinedOptions.map(j=> <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>

            <div className="text-sm text-gray-600 mb-1">Or enter custom job title</div>
            <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="Job Title" className="w-full border p-2 rounded mb-2" />
            <input value={jobLocation} onChange={e=>setJobLocation(e.target.value)} placeholder="Location" className="w-full border p-2 rounded mb-2" />
            <textarea value={jobDesc} onChange={e=>setJobDesc(e.target.value)} placeholder="Short description" className="w-full border p-2 rounded mb-2" rows={3} />
            <div className="flex gap-2">
              <button onClick={handleCreateJob} className="px-3 py-2 bg-indigo-600 text-white rounded">Create Job / Apply Role</button>
              <button onClick={()=>{setSelectedRoleId(''); setJobTitle(''); setJobDesc(''); setJobLocation(''); setCurrentJob(null); setCandidatesList([])}} className="px-3 py-2 bg-gray-200 rounded">Reset</button>
            </div>

            {currentJob && (
              <div className="mt-3 border-t pt-3 text-sm text-gray-700">
                <div className="font-semibold">Active Job:</div>
                <div>{currentJob.name}</div>
                <div className="text-xs text-gray-500 mt-1">Required Skills: {(currentJob.requiredSkills||[]).join(', ')}</div>
                <div className="text-xs text-gray-500 mt-1">Matched candidates (greater than 70%): {stats.matchedCount}</div>
              </div>
            )}

          </div>

          <div className="bg-white rounded shadow p-4">
            <h4 className="font-semibold mb-2">Upload Resumes</h4>
            <ResumeUpload single={false} currentJob={currentJob} filters={filters} onUploaded={(res)=>{ console.log('uploaded',res); if(res && res.analyzed){ setCandidatesList(res.analyzed); } }} />
            <p className="text-xs text-gray-500 mt-2">Supports 1–200 files (UI-only)</p>
          </div>

          <div className="bg-white rounded shadow p-4">
            <FilterPanel filters={filters} setFilters={setFilters} setSortBy={setSortBy} currentJob={currentJob} candidatesList={candidatesList} />
          </div>
        </div>

        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">Results: <strong>{filtered.length}</strong></div>
              <div className="text-sm text-gray-600">Sort:</div>
              <select onChange={e=>setSortBy(e.target.value)} className="border p-1 rounded">
                <option value="">Default</option>
                <option value="top5">Top 5</option>
                <option value="highest_score">Highest score</option>
                <option value="most_experience">Most experience</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={()=>setView('cards')} className={`px-2 py-1 rounded ${view==='cards'?'bg-indigo-600 text-white':'bg-gray-100'}`}>Card View</button>
              <button onClick={()=>setView('table')} className={`px-2 py-1 rounded ${view==='table'?'bg-indigo-600 text-white':'bg-gray-100'}`}>Table View</button>
            </div>
          </div>

          {view === 'cards' && (
            <div className="space-y-3">
              {filtered.map(c => <CandidateCard key={c.candidateId} candidate={c} />)}
              {filtered.length===0 && <p className="text-gray-500">No candidates match the filters.</p>}
            </div>
          )}

          {view === 'table' && (
            <div className="bg-white rounded shadow overflow-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Location</th>
                    <th className="px-4 py-2 text-left">College</th>
                    <th className="px-4 py-2 text-left">Experience</th>
                    <th className="px-4 py-2 text-left">Score</th>
                    <th className="px-4 py-2 text-left">Match %</th>
                    <th className="px-4 py-2 text-left">Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c=> (
                    <tr key={c.candidateId} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3">{c.location}</td>
                      <td className="px-4 py-3">{c.college}</td>
                      <td className="px-4 py-3">{c.experience} yrs</td>
                      <td className="px-4 py-3"><ScoreBadge score={c.score} /></td>
                      <td className="px-4 py-3">{c.matchPercentage}%</td>
                      <td className="px-4 py-3"><div className="flex flex-wrap">{c.skills.slice(0,6).map(s=> <span key={s} className="bg-gray-100 text-sm px-2 py-1 rounded mr-2 mb-2">{s}</span>)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
