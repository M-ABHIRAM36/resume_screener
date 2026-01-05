import React, { useMemo, useState, useEffect } from "react"
import FilterPanel from "../../components/FilterPanel"
import CandidateCard from "../../components/CandidateCard"
import ResumeUpload from "../../components/ResumeUpload"
import ScoreBadge from "../../components/ScoreBadge"
import { get, post } from "../../api"
import jobRolesData from "../../data/job_roles.json"

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
  
  // Use static job roles data - remove duplicates by name
  const jobRoles = useMemo(() => {
    const uniqueRoles = []
    const seenNames = new Set()
    jobRolesData.forEach(role => {
      if (!seenNames.has(role.name)) {
        seenNames.add(role.name)
        uniqueRoles.push(role)
      }
    })
    return uniqueRoles.sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  useEffect(()=>{
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
    // If a predefined role (by id) is selected, use it
    const found = jobRoles.find(j => j.id === selectedRoleId)
    if(found){
      setCurrentJob(found)
      computeMatchesForJob(found)
    } else if(jobTitle.trim()){
      // Create custom job via backend if title is provided
      try{
        const created = await post('/hr/jobs', { 
          jobTitle: jobTitle.trim(), 
          requiredSkills: [], 
          experienceRange:'', 
          location: jobLocation 
        })
        setCurrentJob(created)
        computeMatchesForJob(created)
      }catch(e){ 
        console.error('create job', e)
        // Fallback: create local job object
        const localJob = {
          id: `custom_${Date.now()}`,
          name: jobTitle.trim(),
          requiredSkills: [],
          roadmapSteps: [],
          location: jobLocation
        }
        setCurrentJob(localJob)
      }
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

  return (
    <div className="space-y-6 py-6">
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            🏢
          </div>
          <div>
            <h2 className="text-3xl font-bold">HR Dashboard</h2>
            <p className="text-sm text-gray-600">Company: <span className="font-semibold text-indigo-600">Demo abhi Corp</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
          <span className="text-sm text-gray-600">Logged in as</span>
          <span className="font-semibold text-indigo-600">HR</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">Total Candidates</div>
              <div className="text-3xl font-bold text-indigo-600">{stats.total}</div>
              <div className="text-xs text-gray-500 mt-1">📊 All applicants</div>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">Avg Score</div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-green-600">{stats.avgScore}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">⭐ Average rating</div>
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">Avg Experience</div>
              <div className="text-3xl font-bold text-purple-600">{stats.avgExp} yrs</div>
              <div className="text-xs text-gray-500 mt-1">💼 Years of exp</div>
            </div>
            <div className="card bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">Top Skills</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {stats.topSkills.slice(0, 3).map(s=> (
                  <span key={s} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">{s}</span>
                ))}
              </div>
              {stats.topSkills.length > 3 && (
                <div className="text-xs text-gray-500 mt-1">+{stats.topSkills.length - 3} more</div>
              )}
            </div>
          </div>

          <div className="card">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              💼 Create / Select Job
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Select Job Role <span className="text-indigo-600">({jobRoles.length} roles)</span>
                </label>
                <select 
                  value={selectedRoleId} 
                  onChange={e=>{
                    setSelectedRoleId(e.target.value)
                    const selected = jobRoles.find(j => j.id === e.target.value)
                    if(selected){
                      setJobTitle(selected.name)
                      setJobLocation(selected.location || '')
                      setJobDesc((selected.roadmapSteps||[]).join('; ') || '')
                    }
                  }} 
                  className="input-field"
                >
                  <option value="">-- Select a job role --</option>
                  {jobRoles.map(j=> (
                    <option key={j.id} value={j.id}>{j.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Choose from {jobRoles.length} predefined roles</p>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>Or</span>
                  <span className="text-xs font-normal text-gray-500">create custom job</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Job Title *</label>
                    <input 
                      value={jobTitle} 
                      onChange={e=>setJobTitle(e.target.value)} 
                      placeholder="e.g. Senior Software Engineer" 
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Location</label>
                    <input 
                      value={jobLocation} 
                      onChange={e=>setJobLocation(e.target.value)} 
                      placeholder="e.g. Bangalore, Remote" 
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                    <textarea 
                      value={jobDesc} 
                      onChange={e=>setJobDesc(e.target.value)} 
                      placeholder="Brief job description..." 
                      className="input-field"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleCreateJob} 
                  className="btn-primary flex-1 text-sm py-2.5"
                  disabled={!selectedRoleId && !jobTitle.trim()}
                >
                  {selectedRoleId ? 'Apply Selected Role' : 'Create Custom Job'}
                </button>
                <button 
                  onClick={()=>{
                    setSelectedRoleId('')
                    setJobTitle('')
                    setJobDesc('')
                    setJobLocation('')
                    setCurrentJob(null)
                    setCandidatesList([])
                  }} 
                  className="btn-secondary text-sm py-2.5 px-4"
                >
                  Reset
                </button>
              </div>

              {currentJob && (
                <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <div className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                    ✅ Active Job
                  </div>
                  <div className="font-semibold text-gray-800 mb-2">{currentJob.name}</div>
                  {currentJob.location && (
                    <div className="text-xs text-gray-600 mb-1">
                      📍 <strong>Location:</strong> {currentJob.location}
                    </div>
                  )}
                  {currentJob.requiredSkills && currentJob.requiredSkills.length > 0 && (
                    <div className="text-xs text-gray-600 mb-1">
                      <strong>Required Skills:</strong> {currentJob.requiredSkills.join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-indigo-200">
                    <strong>Matched candidates (≥70%):</strong> <span className="font-bold text-green-600">{stats.matchedCount}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h4 className="font-semibold mb-2">Upload Resumes</h4>
            <ResumeUpload 
              single={false} 
              currentJob={currentJob} 
              filters={filters} 
              onUploaded={(res)=>{ 
                console.log('Upload response received:', res); 
                if(res && res.error){
                  console.error('Upload error:', res.error);
                  alert('Error: ' + res.error);
                  return;
                }
                if(res && res.analyzed && Array.isArray(res.analyzed)){
                  console.log('Setting candidates list:', res.analyzed.length, 'candidates');
                  setCandidatesList(res.analyzed);
                  if(res.analyzed.length === 0){
                    alert('No candidates found. Make sure you have selected a job role and uploaded resume files.');
                  }
                } else {
                  console.warn('Unexpected response format:', res);
                  alert('Unexpected response format. Check console for details.');
                }
              }} 
            />
            <p className="text-xs text-gray-500 mt-2">Supports 1�200 files (UI-only)</p>
          </div>

          <div className="bg-white rounded shadow p-4">
            <FilterPanel filters={filters} setFilters={setFilters} setSortBy={setSortBy} currentJob={currentJob} candidatesList={candidatesList} />
          </div>
        </div>

        <div className="lg:col-span-9">
          <div className="card mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Results: <span className="font-bold text-indigo-600 text-lg">{filtered.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort:</span>
                  <select onChange={e=>setSortBy(e.target.value)} className="input-field text-sm py-2 max-w-[180px]">
                    <option value="">Default</option>
                    <option value="top5">Top 5</option>
                    <option value="highest_score">Highest score</option>
                    <option value="most_experience">Most experience</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={()=>setView('cards')} 
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    view==='cards'
                      ?'bg-indigo-600 text-white shadow-md' 
                      :'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📋 Card View
                </button>
                <button 
                  onClick={()=>setView('table')} 
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    view==='table'
                      ?'bg-indigo-600 text-white shadow-md' 
                      :'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📊 Table View
                </button>
              </div>
            </div>
          </div>

          {view === 'cards' && (
            <div className="space-y-4">
              {filtered.length > 0 ? (
                filtered.map(c => <CandidateCard key={c.candidateId} candidate={c} />)
              ) : (
                <div className="card text-center py-12">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-600 font-medium">No candidates match the filters.</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your filter criteria.</p>
                </div>
              )}
            </div>
          )}

          {view === 'table' && (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">College</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Experience</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Match %</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Skills</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.length > 0 ? (
                      filtered.map(c=> (
                        <tr key={c.candidateId} className="hover:bg-indigo-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{c.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">📍 {c.location}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">🏫 {c.college}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">{c.experience} yrs</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ScoreBadge score={c.score} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-indigo-600">{c.matchPercentage}%</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {c.skills.slice(0,6).map(s=> (
                                <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                                  {s}
                                </span>
                              ))}
                              {c.skills.length > 6 && (
                                <span className="text-xs text-gray-500 px-2 py-1">+{c.skills.length - 6}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="text-5xl mb-4">🔍</div>
                          <p className="text-gray-600 font-medium">No candidates match the filters.</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your filter criteria.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
