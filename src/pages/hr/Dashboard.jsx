import React, { useMemo, useState, useEffect } from "react"
import FilterPanel from "../../components/FilterPanel"
import CandidateCard from "../../components/CandidateCard"
import ResumeUpload from "../../components/ResumeUpload"
import ScoreBadge from "../../components/ScoreBadge"
import { get, post } from "../../api"
import jobRolesData from "../../data/job_roles.json"

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
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full font-medium border border-indigo-200"
        >
          +{skills.length - PREVIEW} more
        </button>
      )}
      {expanded && hasMore && (
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-gray-500 hover:text-indigo-600 px-1 py-0.5 font-medium"
        >
          ▲ less
        </button>
      )}
    </div>
  )
}

export default function HRDashboard(){
  const [filters, setFilters] = useState({
    skill:"", location:"", college:"", minMatch:0, experience:"",
    searchText:"", minScore:"", maxScore:"", resumeStrength:"", jobFitLevel:"",
    degree:"", hasPortfolio:false, hasInternships:false, minSkillsCount:"",
    selectedSkills:[], keywords:[], maxExperience:""
  })
  const [sortBy, setSortBy] = useState("")
  const [view, setView] = useState('cards')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [currentJob, setCurrentJob] = useState(null)
  const [jobTitle, setJobTitle] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [candidatesList, setCandidatesList] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [nameMethod, setNameMethod] = useState('filename')
  
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

  useEffect(() => {
    // initial candidates: empty until job selected
    setCandidatesList([])
  }, [])

  // Helper function to validate if a string is a valid location
  function isValidLocation(loc) {
    if (!loc || loc === 'Not specified' || loc === '—') return false
    
    // List of common programming terms/skills that should NOT be locations
    const invalidLocations = [
      'c++', 'c#', 'java', 'python', 'javascript', 'html', 'css', 'react', 'node.js',
      'sql', 'mysql', 'mongodb', 'docker', 'kubernetes', 'git', 'github', 'linux',
      'scikit', 'numpy', 'pandas', 'tensorflow', 'pytorch', 'jupyter', 'flask',
      'django', 'express', 'angular', 'vue', 'typescript', 'rust', 'go', 'ruby',
      'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'bash', 'powershell',
      'aws', 'azure', 'gcp', 'api', 'apis', 'rest', 'graphql', 'json', 'xml',
      'calculus', 'algebra', 'statistics', 'algorithms', 'data structures',
      'machine learning', 'deep learning', 'ai', 'ml', 'nlp', 'computer vision'
    ]
    
    const locLower = loc.toLowerCase().trim()
    
    // Check if it's in the invalid list
    if (invalidLocations.includes(locLower)) return false
    
    // Check if it's too short (likely not a real location)
    if (locLower.length < 3) return false
    
    // Check if it contains only special characters or numbers
    if (/^[\d\W]+$/.test(locLower)) return false
    
    return true
  }

  // Clean candidate data when setting candidates list
  function cleanCandidateData(candidates) {
    return candidates.map(c => ({
      ...c,
      location: isValidLocation(c.location) ? c.location : null,
      experience: (c.experience && c.experience > 0 && c.experience < 50) ? c.experience : 0
    }))
  }

  async function computeMatchesForJob(job) {
    if (!job || !job.id) return
    const params = new URLSearchParams()
    if (filters.skill) params.append('skill', filters.skill)
    if (filters.location) params.append('location', filters.location)
    if (filters.college) params.append('college', filters.college)
    if (filters.experience) params.append('experience', filters.experience)
    if (filters.minMatch) params.append('minMatchPercentage', filters.minMatch)

    const url = `/hr/dashboard/${job.id}?` + params.toString()
    try {
      const list = await get(url)
      setCandidatesList(cleanCandidateData(list))
    } catch (e) {
      console.error('computeMatchesForJob', e)
    }
  }

  async function handleApplyRoles() {
    const found = jobRoles.find(j => j.id === selectedRoleId)
    let activeJob = null

    if (found) {
      activeJob = found
      setCurrentJob(found)
    } else if (jobTitle.trim()) {
      const localJob = {
        id: `custom_${Date.now()}`,
        name: jobTitle.trim(),
        requiredSkills: [],
        roadmapSteps: [],
        location: jobLocation
      }
      activeJob = localJob
      setCurrentJob(localJob)
    }

    if (!activeJob) {
      alert('Please select a job role or enter a custom job title')
      return
    }

    // Process uploaded files with ML backend
    if (uploadedFiles.length > 0) {
      setIsProcessing(true)
      try {
        const formData = new FormData()
        // Use 'resumes' as field name - matching backend expectation
        uploadedFiles.forEach(f => formData.append('resumes', f))
        formData.append('jobId', activeJob.id || '')
        formData.append('jobTitle', activeJob.name || '')
        formData.append('requiredSkills', JSON.stringify(activeJob.requiredSkills || []))
        formData.append('nameMethod', nameMethod)
        if (activeJob.roadmapSteps && activeJob.roadmapSteps.length > 0) {
          formData.append('jobDescription', activeJob.name + '. ' + activeJob.roadmapSteps.join('. '))
        }
        if (activeJob.location) {
          formData.append('jobLocation', activeJob.location)
        }
        
        // POST to /hr/resumes - the correct backend endpoint
        const res = await post('/hr/resumes', formData, true)
        
        console.log('Upload response:', res)
        
        // Handle different response formats from backend and clean data
        if(res?.analyzed && Array.isArray(res.analyzed)) {
          setCandidatesList(cleanCandidateData(res.analyzed))
        } else if(res?.candidates && Array.isArray(res.candidates)) {
          setCandidatesList(cleanCandidateData(res.candidates))
        } else if(Array.isArray(res)) {
          setCandidatesList(cleanCandidateData(res))
        } else {
          console.log('Response format:', res)
          // Try to fetch candidates after upload
          computeMatchesForJob(activeJob)
        }
      } catch(e) {
        console.error('Upload error:', e)
        alert('Failed to upload resumes: ' + e.message)
      } finally {
        setIsProcessing(false)
      }
    } else {
      // No files uploaded, just set the job and try to fetch existing candidates
      computeMatchesForJob(activeJob)
    }
  }

  useEffect(() => {
    if (selectedRoleId) {
      const found = jobRoles.find(j => j.id === selectedRoleId)
      if (found) {
        setCurrentJob(found)
        setJobTitle(found.name)
        setJobLocation(found.location || '')
        setJobDesc((found.roadmapSteps || []).join('; '))
      }
    }
  }, [selectedRoleId, jobRoles])

  const filtered = useMemo(() => {
    let list = candidatesList.slice()

    // --- Text search ---
    if (filters.searchText) {
      const q = filters.searchText.toLowerCase()
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      )
    }

    // --- Core filters ---
    if (filters.skill) list = list.filter(c => c.skills?.map(s => s.toLowerCase()).includes(filters.skill.toLowerCase()))
    if (filters.location) list = list.filter(c => c.location?.toLowerCase() === filters.location.toLowerCase())
    if (filters.college) list = list.filter(c => c.college?.toLowerCase() === filters.college.toLowerCase())
    if (filters.experience) list = list.filter(c => (c.experience || 0) >= Number(filters.experience))
    if (filters.maxExperience) list = list.filter(c => (c.experience || 0) <= Number(filters.maxExperience))
    if (filters.minMatch) list = list.filter(c => (c.matchPercentage || 0) >= Number(filters.minMatch))

    // --- Score range ---
    if (filters.minScore) list = list.filter(c => (c.score || 0) >= Number(filters.minScore))
    if (filters.maxScore) list = list.filter(c => (c.score || 0) <= Number(filters.maxScore))

    // --- Resume strength & job fit ---
    if (filters.resumeStrength) list = list.filter(c => c.resumeStrength === filters.resumeStrength)
    if (filters.jobFitLevel) list = list.filter(c => c.jobFitLevel === filters.jobFitLevel)

    // --- Degree ---
    if (filters.degree) list = list.filter(c => (c.branch || c.degree || '').toLowerCase() === filters.degree.toLowerCase())

    // --- Boolean toggles ---
    if (filters.hasPortfolio) list = list.filter(c => c.portfolioLinks && c.portfolioLinks.length > 0)
    if (filters.hasInternships) list = list.filter(c => c.internships && c.internships.length > 0)

    // --- Min skills count ---
    if (filters.minSkillsCount) list = list.filter(c => (c.skills || []).length >= Number(filters.minSkillsCount))

    // --- Must-have skills (multi-select, AND logic) ---
    if (filters.selectedSkills && filters.selectedSkills.length > 0) {
      list = list.filter(c => {
        const cSkills = (c.skills || []).map(s => s.toLowerCase())
        return filters.selectedSkills.every(rs => cSkills.includes(rs.toLowerCase()))
      })
    }

    // --- Custom keywords (OR logic across all text fields) ---
    if (filters.keywords && filters.keywords.length > 0) {
      list = list.filter(c => {
        const blob = [
          c.name, c.email, c.college, c.location, c.branch, c.degree,
          ...(c.skills || []), ...(c.internships || []), ...(c.portfolioLinks || [])
        ].filter(Boolean).join(' ').toLowerCase()
        return filters.keywords.some(kw => blob.includes(kw.toLowerCase()))
      })
    }

    // --- Sorting ---
    const sortKey = sortBy || ''
    if (sortKey === 'highest_score' || sortKey.includes('top') && sortKey.includes('score')) {
      list.sort((a, b) => (b.score || 0) - (a.score || 0))
    } else if (sortKey === 'lowest_score') {
      list.sort((a, b) => (a.score || 0) - (b.score || 0))
    } else if (sortKey === 'highest_match' || sortKey.includes('top') && sortKey.includes('match')) {
      list.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
    } else if (sortKey === 'most_experience' || sortKey.includes('top') && sortKey.includes('exp')) {
      list.sort((a, b) => (b.experience || 0) - (a.experience || 0))
    } else if (sortKey === 'least_experience') {
      list.sort((a, b) => (a.experience || 0) - (b.experience || 0))
    } else if (sortKey === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else if (sortKey === 'name_desc') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
    } else if (sortKey === 'most_skills') {
      list.sort((a, b) => (b.skills || []).length - (a.skills || []).length)
    }

    // --- Top N slicing (after sort) ---
    if (sortKey === 'top5_score' || sortKey === 'top5_match' || sortKey === 'top5_exp') {
      list = list.slice(0, 5)
    } else if (sortKey === 'top10_score' || sortKey === 'top10_match') {
      list = list.slice(0, 10)
    }

    return list
  }, [filters, sortBy, candidatesList])

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
    if (filtered.length === 0) {
      alert('No candidates to download.')
      return
    }
    const headers = ['Name', 'Email', 'Phone', 'Location', 'College', 'Branch/Degree', 'Experience (Years)', 'Score', 'Match %', 'Skills', 'Internships', 'Portfolio Links']
    const rows = filtered.map(c => [
      c.name || '',
      c.email || '',
      c.phone ? `="${c.phone}"` : '',
      isValidLocation(c.location) ? c.location : '',
      c.college || '',
      c.branch || c.degree || '',
      c.experience && c.experience > 0 && c.experience < 50 ? c.experience : 0,
      c.score || 0,
      c.matchPercentage || 0,
      (c.skills || []).join('; '),
      (c.internships || []).join('; '),
      (c.portfolioLinks || []).join('; ')
    ])

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const metadata = [
      `"Job Role","${currentJob?.name || 'Not selected'}"`,
      `"Total","${filtered.length}"`,
      `"Date","${new Date().toLocaleString()}"`,
      ''
    ].join('\n')

    const blob = new Blob([metadata + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `candidates_${(currentJob?.name || 'all').replace(/\s+/g, '_')}_${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
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
        {/* Left Sidebar - increased to 4 columns */}
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

          {/* Resume Strength Breakdown */}
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
                {stats.topSkills.map(s => (
                  <span key={s} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Job Selection & Resume Upload Combined */}
          <div className="card">
            <h4 className="font-bold text-lg mb-4">💼 Create / Select Job Role</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Select Job Role</label>
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
                
                {/* Job Role Details Preview */}
                {selectedRoleId && currentJob && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📋</span>
                      <span className="text-sm font-bold text-gray-800">{currentJob.name}</span>
                    </div>
                    
                    {currentJob.requiredSkills && currentJob.requiredSkills.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-600 mb-1.5">🎯 Required Skills ({currentJob.requiredSkills.length})</div>
                        <div className="flex flex-wrap gap-1">
                          {currentJob.requiredSkills.slice(0, 10).map(skill => (
                            <span key={skill} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">{skill}</span>
                          ))}
                          {currentJob.requiredSkills.length > 10 && (
                            <span className="text-xs text-gray-500 px-2 py-0.5">+{currentJob.requiredSkills.length - 10} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {currentJob.roadmapSteps && currentJob.roadmapSteps.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1.5">📚 Learning Roadmap</div>
                        <ul className="text-xs text-gray-600 space-y-1.5 max-h-32 overflow-y-auto pr-2">
                          {currentJob.roadmapSteps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="bg-indigo-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">Or create custom job</div>
                <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="Job Title" className="input-field mb-2"/>
                <input value={jobLocation} onChange={e=>setJobLocation(e.target.value)} placeholder="Location (e.g., Remote, Bangalore)" className="input-field mb-2"/>
                <textarea 
                  value={jobDesc} 
                  onChange={e=>setJobDesc(e.target.value)} 
                  placeholder="Job Description / Requirements / Skills needed..." 
                  className="input-field text-sm" 
                  rows={3}
                />
              </div>

              {/* Name Extraction Method */}
              <div className="border-t pt-4">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Name Extraction Method</label>
                <div className="space-y-2 mb-3">
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    nameMethod === 'filename' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                  }`}>
                    <input
                      type="radio"
                      name="nameMethod"
                      value="filename"
                      checked={nameMethod === 'filename'}
                      onChange={() => setNameMethod('filename')}
                      className="mt-1 accent-indigo-600"
                    />
                    <div>
                      <div className="font-semibold text-sm text-gray-800">Standard Resume Names <span className="text-xs text-green-600 font-normal">(Recommended)</span></div>
                      <div className="text-xs text-gray-500 mt-0.5">Resume filename must be full name. e.g., <span className="font-mono bg-gray-100 px-1 rounded">Rahul Sharma.pdf</span></div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    nameMethod === 'auto' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                  }`}>
                    <input
                      type="radio"
                      name="nameMethod"
                      value="auto"
                      checked={nameMethod === 'auto'}
                      onChange={() => setNameMethod('auto')}
                      className="mt-1 accent-indigo-600"
                    />
                    <div>
                      <div className="font-semibold text-sm text-gray-800">Automatic Extraction</div>
                      <div className="text-xs text-gray-500 mt-0.5">Extract name from resume text using text analysis</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Resume Upload Section */}
              <div className="border-t pt-4">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Upload Resumes</label>
                <ResumeUpload 
                  single={false} 
                  currentJob={currentJob} 
                  filters={filters} 
                  onUploaded={(res)=>{ 
                    if(res?.analyzed) setCandidatesList(res.analyzed)
                  }}
                  onFilesChange={(files) => setUploadedFiles(files)}
                  hideSubmitButton={true}
                />
                <p className="text-xs text-gray-500 mt-2">Upload candidate resumes (PDF/DOCX) - Max 200 files</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleApplyRoles} 
                  className="btn-primary flex-1 text-sm py-2.5" 
                  disabled={(!selectedRoleId && !jobTitle.trim()) || isProcessing}
                >
                  {isProcessing ? '⏳ Processing...' : '🚀 Apply Roles'}
                </button>
                <button 
                  onClick={()=>{
                    setSelectedRoleId('')
                    setJobTitle('')
                    setJobDesc('')
                    setJobLocation('')
                    setCurrentJob(null)
                    setCandidatesList([])
                    setUploadedFiles([])
                  }} 
                  className="btn-secondary text-sm px-4 py-2.5"
                >
                  Reset
                </button>
              </div>

              {currentJob && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="font-bold text-indigo-800 mb-1">✅ Active: {currentJob.name}</div>
                  {currentJob.location && <div className="text-xs text-gray-600 mb-1">📍 {currentJob.location}</div>}
                  <div className="text-xs text-gray-600">Matched (≥70%): <span className="font-bold text-green-600">{stats.matchedCount}</span></div>
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
                  setFilters({
                    skill:"", location:"", college:"", minMatch:0, experience:"",
                    searchText:"", minScore:"", maxScore:"", resumeStrength:"", jobFitLevel:"",
                    degree:"", hasPortfolio:false, hasInternships:false, minSkillsCount:"",
                    selectedSkills:[], keywords:[], maxExperience:""
                  })
                  setSortBy("")
                }}
                className="btn-secondary w-full text-sm py-2"
              >
                🔄 Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - adjusted to 8 columns */}
        <div className="lg:col-span-8">
          {/* Controls Bar */}
          <div className="card mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing: <span className="font-bold text-indigo-600 text-lg">{filtered.length}</span>
                  {filtered.length !== candidatesList.length && (
                    <span className="text-xs text-gray-400 ml-1">of {candidatesList.length}</span>
                  )}
                </div>
                {sortBy && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    📊 {sortBy.replace(/_/g, ' ')}
                    <button onClick={() => setSortBy('')} className="hover:text-red-500 ml-1">×</button>
                  </span>
                )}
                <select value={sortBy || ''} onChange={e=>setSortBy(e.target.value)} className="input-field text-sm py-2 max-w-[220px]">
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
                <button onClick={()=>setView('cards')} className={`px-4 py-2 rounded-lg font-medium ${view==='cards'?'bg-indigo-600 text-white':'bg-gray-100 text-gray-600'}`}>
                  📋 Cards
                </button>
                <button onClick={()=>setView('table')} className={`px-4 py-2 rounded-lg font-medium ${view==='table'?'bg-indigo-600 text-white':'bg-gray-100 text-gray-600'}`}>
                  📊 Table
                </button>
              </div>
            </div>
          </div>

          {/* Card View */}
          {view === 'cards' && (
            <div className="space-y-4">
              {filtered.length > 0 ? filtered.map(c => <CandidateCard key={c.candidateId || c.id || c.email} candidate={c} />) : (
                <div className="card text-center py-12">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-600">No candidates found. Upload resumes and click "Apply Roles" to analyze.</p>
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
                      <tr key={c.candidateId || c.id || c.email} className="hover:bg-indigo-50">
                        <td className="px-4 py-4">
                          <div className="font-semibold">{c.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-600">{c.email || '—'}</div>
                          <div className="text-xs text-gray-600">{c.phone || '—'}</div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">{isValidLocation(c.location) ? c.location : '—'}</td>
                        <td className="px-4 py-4 text-gray-600">{c.college || '—'}</td>
                        <td className="px-4 py-4 text-gray-600">{c.branch || c.degree || '—'}</td>
                        <td className="px-4 py-4 text-gray-600">{c.experience > 0 && c.experience < 50 ? `${c.experience} yrs` : '—'}</td>
                        <td className="px-4 py-4"><ScoreBadge score={c.score} /></td>
                        <td className="px-4 py-4 font-semibold text-indigo-600">{c.matchPercentage || 0}%</td>
                        <td className="px-4 py-4">
                          <TableSkillsCell skills={c.skills || []} />
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="text-5xl mb-4">🔍</div>
                          <p className="text-gray-600">No candidates found.</p>
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





