import React, { useState, useEffect, useMemo, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { get, post } from "../../api"
import FilterPanel from "../../components/FilterPanel"
import CandidateCard from "../../components/CandidateCard"
import ScoreBadge from "../../components/ScoreBadge"
import ResumeUpload from "../../components/ResumeUpload"

function TableSkillsCell({ skills = [] }) {
  const [expanded, setExpanded] = useState(false)
  const PREVIEW = 4
  const hasMore = skills.length > PREVIEW
  const visible = expanded ? skills : skills.slice(0, PREVIEW)
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((s, idx) => (
        <span key={`${s}-${idx}`} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
      ))}
      {hasMore && !expanded && (
        <button onClick={() => setExpanded(true)} className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full font-medium border border-indigo-200">
          +{skills.length - PREVIEW} more
        </button>
      )}
      {expanded && hasMore && (
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-500 hover:text-indigo-600 px-1 py-0.5 font-medium">▲ less</button>
      )}
    </div>
  )
}

function isValidLocation(loc) {
  if (!loc || loc === 'Not specified' || loc === '—') return false
  const invalidLocations = ['c++','c#','java','python','javascript','html','css','react','node.js','sql','mysql','mongodb','docker','kubernetes','git','github','linux','scikit','numpy','pandas','tensorflow','pytorch','jupyter','flask','django','express','angular','vue','typescript','rust','go','ruby','php','swift','kotlin','scala','r','matlab','bash','powershell','aws','azure','gcp','api','apis','rest','graphql','json','xml','calculus','algebra','statistics','algorithms','data structures','machine learning','deep learning','ai','ml','nlp','computer vision']
  const locLower = loc.toLowerCase().trim()
  if (invalidLocations.includes(locLower)) return false
  if (locLower.length < 3) return false
  if (/^[\d\W]+$/.test(locLower)) return false
  return true
}

function cleanCandidateData(candidates) {
  return candidates.map(c => ({
    ...c,
    location: isValidLocation(c.location) ? c.location : null,
    experience: (c.experience && c.experience > 0 && c.experience < 50) ? c.experience : 0
  }))
}

export default function SessionDetail() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [candidatesList, setCandidatesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [nameMethod, setNameMethod] = useState('filename')
  const [view, setView] = useState('cards')
  const [filters, setFilters] = useState({
    skill:"", location:"", college:"", minMatch:0, experience:"",
    searchText:"", minScore:"", maxScore:"", resumeStrength:"", jobFitLevel:"",
    degree:"", hasPortfolio:false, hasInternships:false, minSkillsCount:"",
    selectedSkills:[], keywords:[], maxExperience:""
  })
  const [sortBy, setSortBy] = useState("")

  useEffect(() => { fetchSession() }, [id])

  async function fetchSession() {
    setLoading(true)
    try {
      const data = await get(`/hr/session/${id}`)
      setSession(data)
      setCandidatesList(cleanCandidateData(data.candidates || []))
    } catch (e) {
      console.error('Failed to load session:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (uploadedFiles.length === 0) return
    setUploading(true)
    try {
      const formData = new FormData()
      uploadedFiles.forEach(f => formData.append('resumes', f))
      formData.append('nameMethod', nameMethod)

      const res = await post(`/hr/session/${id}/upload`, formData, true)
      if (res.success) {
        await fetchSession()
        setUploadedFiles([])
      }
    } catch (e) {
      console.error('Upload failed:', e)
      alert('Resume upload failed. Make sure the ML service is running.')
    } finally {
      setUploading(false)
    }
  }

  // Filtering logic - same as master Dashboard
  const filtered = useMemo(() => {
    let list = candidatesList.slice()
    if (filters.searchText) {
      const q = filters.searchText.toLowerCase()
      list = list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q))
    }
    if (filters.skill) list = list.filter(c => c.skills?.map(s => s.toLowerCase()).includes(filters.skill.toLowerCase()))
    if (filters.location) list = list.filter(c => c.location?.toLowerCase() === filters.location.toLowerCase())
    if (filters.college) list = list.filter(c => c.college?.toLowerCase() === filters.college.toLowerCase())
    if (filters.experience) list = list.filter(c => (c.experience || 0) >= Number(filters.experience))
    if (filters.maxExperience) list = list.filter(c => (c.experience || 0) <= Number(filters.maxExperience))
    if (filters.minMatch) list = list.filter(c => (c.matchPercentage || 0) >= Number(filters.minMatch))
    if (filters.minScore) list = list.filter(c => (c.score || 0) >= Number(filters.minScore))
    if (filters.maxScore) list = list.filter(c => (c.score || 0) <= Number(filters.maxScore))
    if (filters.resumeStrength) list = list.filter(c => c.resumeStrength === filters.resumeStrength)
    if (filters.jobFitLevel) list = list.filter(c => c.jobFitLevel === filters.jobFitLevel)
    if (filters.degree) list = list.filter(c => (c.branch || c.degree || '').toLowerCase() === filters.degree.toLowerCase())
    if (filters.hasPortfolio) list = list.filter(c => c.portfolioLinks && c.portfolioLinks.length > 0)
    if (filters.hasInternships) list = list.filter(c => c.internships && c.internships.length > 0)
    if (filters.minSkillsCount) list = list.filter(c => (c.skills || []).length >= Number(filters.minSkillsCount))
    if (filters.selectedSkills && filters.selectedSkills.length > 0) {
      list = list.filter(c => {
        const cSkills = (c.skills || []).map(s => s.toLowerCase())
        return filters.selectedSkills.every(rs => cSkills.includes(rs.toLowerCase()))
      })
    }
    if (filters.keywords && filters.keywords.length > 0) {
      list = list.filter(c => {
        const blob = [c.name, c.email, c.college, c.location, c.branch, c.degree, ...(c.skills || []), ...(c.internships || []), ...(c.portfolioLinks || [])].filter(Boolean).join(' ').toLowerCase()
        return filters.keywords.some(kw => blob.includes(kw.toLowerCase()))
      })
    }
    // Sorting
    const sortKey = sortBy || ''
    if (sortKey === 'highest_score' || (sortKey.includes('top') && sortKey.includes('score'))) list.sort((a, b) => (b.score || 0) - (a.score || 0))
    else if (sortKey === 'lowest_score') list.sort((a, b) => (a.score || 0) - (b.score || 0))
    else if (sortKey === 'highest_match' || (sortKey.includes('top') && sortKey.includes('match'))) list.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
    else if (sortKey === 'most_experience' || (sortKey.includes('top') && sortKey.includes('exp'))) list.sort((a, b) => (b.experience || 0) - (a.experience || 0))
    else if (sortKey === 'least_experience') list.sort((a, b) => (a.experience || 0) - (b.experience || 0))
    else if (sortKey === 'name_asc') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    else if (sortKey === 'name_desc') list.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    else if (sortKey === 'most_skills') list.sort((a, b) => (b.skills || []).length - (a.skills || []).length)
    // Top N
    if (sortKey === 'top5_score' || sortKey === 'top5_match' || sortKey === 'top5_exp') list = list.slice(0, 5)
    else if (sortKey === 'top10_score' || sortKey === 'top10_match') list = list.slice(0, 10)
    return list
  }, [filters, sortBy, candidatesList])

  // Stats - same as master Dashboard
  const stats = useMemo(() => {
    const total = candidatesList.length
    const avgScore = Math.round((candidatesList.reduce((s, c) => s + (c.score || 0), 0) / total) || 0)
    const avgExp = Math.round((candidatesList.reduce((s, c) => s + (c.experience || 0), 0) / total) || 0)
    const topSkills = Object.entries(candidatesList.flatMap(c => c.skills || []).reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0])
    const matchedCount = candidatesList.filter(c => (c.matchPercentage || 0) >= 70).length
    const strongCount = candidatesList.filter(c => c.resumeStrength === 'Strong').length
    const avgCount = candidatesList.filter(c => c.resumeStrength === 'Average').length
    const weakCount = candidatesList.filter(c => c.resumeStrength === 'Weak').length
    const highFitCount = candidatesList.filter(c => c.jobFitLevel === 'High').length
    const withPortfolio = candidatesList.filter(c => c.portfolioLinks && c.portfolioLinks.length > 0).length
    return { total, avgScore, avgExp, topSkills, matchedCount, strongCount, avgCount, weakCount, highFitCount, withPortfolio }
  }, [candidatesList])

  function downloadCSV() {
    if (filtered.length === 0) { alert('No candidates to download.'); return }
    const headers = ['Name','Email','Phone','Location','College','Branch/Degree','Experience (Years)','Score','Match %','Resume Strength','Job Fit','Skills','Missing Skills','Internships','Portfolio Links']
    const rows = filtered.map(c => [
      c.name || '', c.email || '', c.phone ? `="${c.phone}"` : '', isValidLocation(c.location) ? c.location : '', c.college || '', c.branch || c.degree || '',
      c.experience && c.experience > 0 && c.experience < 50 ? c.experience : 0, c.score || 0, c.matchPercentage || 0,
      c.resumeStrength || '', c.jobFitLevel || '', (c.skills || []).join('; '), (c.missingSkills || []).join('; '), (c.internships || []).join('; '), (c.portfolioLinks || []).join('; ')
    ])
    const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
    const metadata = [`"Session","${session?.title || ''}"`, `"Job Role","${session?.jobRole || ''}"`, `"Total","${filtered.length}"`, `"Date","${new Date().toLocaleString()}"`, ''].join('\n')
    const blob = new Blob([metadata + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `session_${(session?.title || 'export').replace(/\s+/g, '_')}_${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 font-medium">Loading session…</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🚫</div>
        <p className="text-gray-500 text-lg font-medium">Session not found</p>
        <Link to="/hr/sessions" className="text-indigo-600 hover:text-indigo-800 mt-3 inline-block font-semibold">← Back to Sessions</Link>
      </div>
    )
  }

  const currentJob = { id: `session_${session._id}`, name: session.jobRole, requiredSkills: session.requiredSkills || [], location: session.jobLocation || '' }

  return (
    <div className="space-y-6 py-6">
      {/* Session Header */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link to="/hr/sessions" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">← Sessions</Link>
                <span className="text-gray-300">/</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">{session.jobRole}</span>
                {session.college && <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">🏫 {session.college}</span>}
                {session.batch && <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm">🎓 Batch {session.batch}</span>}
                {session.jobLocation && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">📍 {session.jobLocation}</span>}
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            Created {new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        {session.description && <p className="text-gray-500 text-sm mt-4 border-t pt-3">{session.description}</p>}
        {session.requiredSkills && session.requiredSkills.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <span className="text-xs font-semibold text-gray-600 mr-2">🎯 Required Skills:</span>
            <div className="inline-flex flex-wrap gap-1 mt-1">
              {session.requiredSkills.map(s => <span key={s} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">{s}</span>)}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">Total Candidates</div>
              <div className="text-3xl font-bold text-indigo-600">{stats.total}</div>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">Avg Score</div>
              <div className="text-3xl font-bold text-green-600">{stats.avgScore}</div>
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">Avg Experience</div>
              <div className="text-3xl font-bold text-purple-600">{stats.avgExp} yrs</div>
            </div>
            <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="text-xs font-semibold text-gray-600 mb-1">High Fit</div>
              <div className="text-3xl font-bold text-emerald-600">{stats.highFitCount}</div>
            </div>
          </div>

          {/* Resume Strength Distribution */}
          {stats.total > 0 && (
            <div className="card">
              <div className="text-xs font-semibold text-gray-600 mb-2">Resume Strength Distribution</div>
              <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-100">
                {stats.strongCount > 0 && <div className="bg-green-500 transition-all" style={{ width: `${(stats.strongCount / stats.total) * 100}%` }} title={`Strong: ${stats.strongCount}`} />}
                {stats.avgCount > 0 && <div className="bg-yellow-400 transition-all" style={{ width: `${(stats.avgCount / stats.total) * 100}%` }} title={`Average: ${stats.avgCount}`} />}
                {stats.weakCount > 0 && <div className="bg-red-400 transition-all" style={{ width: `${(stats.weakCount / stats.total) * 100}%` }} title={`Weak: ${stats.weakCount}`} />}
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                <span>🟢 {stats.strongCount} Strong</span>
                <span>🟡 {stats.avgCount} Avg</span>
                <span>🔴 {stats.weakCount} Weak</span>
              </div>
            </div>
          )}

          {/* Top Skills */}
          {stats.topSkills.length > 0 && (
            <div className="card bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
              <div className="text-xs font-semibold text-gray-600 mb-2">🔥 Top Skills Across Candidates</div>
              <div className="flex flex-wrap gap-1">
                {stats.topSkills.map(s => <span key={s} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">{s}</span>)}
              </div>
            </div>
          )}

          {/* Upload Resumes */}
          <div className="card">
            <h4 className="font-bold text-lg mb-4">📄 Upload More Resumes</h4>
            <div className="space-y-4">
              {/* Name Extraction Method */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Name Extraction Method</label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${nameMethod === 'filename' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                    <input type="radio" name="nameMethod" value="filename" checked={nameMethod === 'filename'} onChange={() => setNameMethod('filename')} className="mt-1 accent-indigo-600" />
                    <div>
                      <div className="font-semibold text-sm text-gray-800">Standard Resume Names <span className="text-xs text-green-600 font-normal">(Recommended)</span></div>
                      <div className="text-xs text-gray-500 mt-0.5">Filename must be full name. e.g., <span className="font-mono bg-gray-100 px-1 rounded">Rahul Sharma.pdf</span></div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${nameMethod === 'auto' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                    <input type="radio" name="nameMethod" value="auto" checked={nameMethod === 'auto'} onChange={() => setNameMethod('auto')} className="mt-1 accent-indigo-600" />
                    <div>
                      <div className="font-semibold text-sm text-gray-800">Automatic Extraction</div>
                      <div className="text-xs text-gray-500 mt-0.5">Extract name from resume text using text analysis</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Upload Resumes</label>
                <ResumeUpload
                  single={false}
                  currentJob={currentJob}
                  filters={filters}
                  onUploaded={() => {}}
                  onFilesChange={(files) => setUploadedFiles(files)}
                  hideSubmitButton={true}
                />
                <p className="text-xs text-gray-500 mt-2">Upload candidate resumes (PDF/DOCX) - Max 200 files</p>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading || uploadedFiles.length === 0}
                className="btn-primary w-full text-sm py-2.5"
              >
                {uploading ? '⏳ Analyzing Resumes…' : `🚀 Upload & Analyze${uploadedFiles.length > 0 ? ` (${uploadedFiles.length} files)` : ''}`}
              </button>

              {uploading && (
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing resumes through ML service…
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="card">
            <FilterPanel filters={filters} setFilters={setFilters} setSortBy={setSortBy} sortBy={sortBy} currentJob={currentJob} candidatesList={candidatesList} />
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  setFilters({ skill:"", location:"", college:"", minMatch:0, experience:"", searchText:"", minScore:"", maxScore:"", resumeStrength:"", jobFitLevel:"", degree:"", hasPortfolio:false, hasInternships:false, minSkillsCount:"", selectedSkills:[], keywords:[], maxExperience:"" })
                  setSortBy("")
                }}
                className="btn-secondary w-full text-sm py-2"
              >
                🔄 Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8">
          {/* Controls Bar */}
          <div className="card mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing: <span className="font-bold text-indigo-600 text-lg">{filtered.length}</span>
                  {filtered.length !== candidatesList.length && <span className="text-xs text-gray-400 ml-1">of {candidatesList.length}</span>}
                </div>
                {sortBy && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    📊 {sortBy.replace(/_/g, ' ')}
                    <button onClick={() => setSortBy('')} className="hover:text-red-500 ml-1">×</button>
                  </span>
                )}
                <select value={sortBy || ''} onChange={e => setSortBy(e.target.value)} className="input-field text-sm py-2 max-w-[220px]">
                  <option value="">Sort: Default</option>
                  <option value="top5_score">Top 5 by Score</option>
                  <option value="top10_score">Top 10 by Score</option>
                  <option value="top5_match">Top 5 by Match %</option>
                  <option value="highest_score">Highest Score</option>
                  <option value="lowest_score">Lowest Score</option>
                  <option value="highest_match">Highest Match %</option>
                  <option value="most_experience">Most Experience</option>
                  <option value="name_asc">Name A→Z</option>
                  <option value="most_skills">Most Skills</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadCSV} className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700" disabled={filtered.length === 0}>
                  📥 Download CSV
                </button>
                <button onClick={() => setView('cards')} className={`px-4 py-2 rounded-lg font-medium ${view === 'cards' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  📋 Cards
                </button>
                <button onClick={() => setView('table')} className={`px-4 py-2 rounded-lg font-medium ${view === 'table' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  📊 Table
                </button>
              </div>
            </div>
          </div>

          {/* Card View */}
          {view === 'cards' && (
            <div className="space-y-4">
              {filtered.length > 0 ? filtered.map(c => <CandidateCard key={c._id || c.id || c.email} candidate={c} />) : (
                <div className="card text-center py-12">
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-gray-600">{candidatesList.length === 0 ? 'No candidates yet. Upload resumes to get started.' : 'No candidates match your filters.'}</p>
                </div>
              )}
            </div>
          )}

          {/* Table View */}
          {view === 'table' && (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Name & Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">College</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Branch/Degree</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Experience</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Match %</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Skills</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.length > 0 ? filtered.map(c => (
                      <tr key={c._id || c.id || c.email} className="hover:bg-indigo-50">
                        <td className="px-4 py-4">
                          <div className="font-semibold">{c.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-600">{c.email || '—'}</div>
                          {c.phone && <div className="text-xs text-gray-600">{c.phone}</div>}
                        </td>
                        <td className="px-4 py-4 text-gray-600">{isValidLocation(c.location) ? c.location : '—'}</td>
                        <td className="px-4 py-4 text-gray-600">{c.college || '—'}</td>
                        <td className="px-4 py-4 text-gray-600">{c.branch || c.degree || '—'}</td>
                        <td className="px-4 py-4 text-gray-600">{c.experience > 0 && c.experience < 50 ? `${c.experience} yrs` : '—'}</td>
                        <td className="px-4 py-4"><ScoreBadge score={c.score} /></td>
                        <td className="px-4 py-4 font-semibold text-indigo-600">{c.matchPercentage || 0}%</td>
                        <td className="px-4 py-4"><TableSkillsCell skills={c.skills || []} /></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="text-5xl mb-4">📄</div>
                          <p className="text-gray-600">{candidatesList.length === 0 ? 'No candidates yet.' : 'No candidates match your filters.'}</p>
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
