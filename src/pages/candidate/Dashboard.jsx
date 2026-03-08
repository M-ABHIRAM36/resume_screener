<<<<<<< HEAD
import React, { useEffect, useState, useMemo } from 'react'
import ResumeUpload from '../../components/ResumeUpload'
import { useNavigate } from 'react-router-dom'
import { post, get } from '../../api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import jobRolesData from '../../data/job_roles.json'

export default function CandidateDashboard(){
  const { user } = useAuth()
  const [role, setRole] = useState('')
  const [candidateSkills, setCandidateSkills] = useState('')
=======
import React, { useMemo, useState, useEffect } from "react"
import ResumeUpload from "../../components/ResumeUpload"
import { useNavigate } from "react-router-dom"
import { post, getUser } from "../../api"
import jobRolesData from "../../data/job_roles.json"

export default function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState('score')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [customJD, setCustomJD] = useState('')
  const [useCustomJD, setUseCustomJD] = useState(false)
>>>>>>> development2
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [stats, setStats] = useState(null)
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const nav = useNavigate()
  const currentUser = getUser()

  const jobRoles = useMemo(() => {
    const unique = []
    const seen = new Set()
    jobRolesData.forEach(r => {
      if (!seen.has(r.name)) { seen.add(r.name); unique.push(r) }
    })
    return unique.sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  useEffect(() => {
    if (jobRoles.length && !selectedRoleId) setSelectedRoleId(jobRoles[0].id)
  }, [jobRoles])

<<<<<<< HEAD
  // Fetch stats and recent analyses on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, analysesRes] = await Promise.all([
          get('/api/candidate/stats'),
          get('/api/candidate/analyses')
        ])
        setStats(statsRes)
        setRecentAnalyses(analysesRes.slice(0, 3))
      } catch (e) {
        console.log('Stats fetch:', e.message)
      }
    }
    fetchData()
  }, [])

  async function handleAnalyze(){
    const job = jobRoles.find(j => j.name === role) || {name:role, requiredSkills:[], roadmapSteps:[]}
    
    // If files are uploaded, send to ML backend
    if(uploadedFiles.length > 0) {
      setIsAnalyzing(true)
      try {
        const formData = new FormData()
        uploadedFiles.forEach(f => formData.append('resumes', f))
        formData.append('jobId', job.id || role)
        formData.append('jobTitle', job.name || role)
        formData.append('requiredSkills', JSON.stringify(job.requiredSkills || []))
        
        const res = await post('/hr/resumes', formData, true)
        
        let candidate = null
        if(res?.analyzed && res.analyzed.length > 0) {
          candidate = res.analyzed[0]
        } else if(res?.candidates && res.candidates.length > 0) {
          candidate = res.candidates[0]
        }

        if (candidate) {
          const stateData = {
            role,
            job,
            candidateSkills: candidate.skills || [],
            matchedSkills: candidate.matchedSkills || [],
            matchPercent: candidate.matchPercentage || 0,
            score: candidate.score || 0,
            candidateData: candidate
          }

          // Save to DB
          try {
            const missingSkills = (job.requiredSkills || []).filter(
              s => !(candidate.matchedSkills || []).map(m => m.toLowerCase()).includes(s.toLowerCase())
            )
            await post('/api/candidate/analyses', {
              jobRole: role,
              score: candidate.score || 0,
              matchPercentage: candidate.matchPercentage || 0,
              skills: candidate.skills || [],
              matchedSkills: candidate.matchedSkills || [],
              missingSkills,
              experience: candidate.experience || 0,
              candidateData: candidate,
              jobData: job
            })
            toast.success('Analysis saved to your history!')
          } catch (e) {
            console.log('Save analysis:', e.message)
          }

          nav('/candidate/score', { state: stateData })
          return
        }
      } catch(e) {
        console.error('ML analysis error:', e)
        toast.error('Analysis failed, using fallback mode')
      } finally {
        setIsAnalyzing(false)
      }
    }
    
    // Fallback: use manually entered skills
    const parsed = candidateSkills.split(',').map(s=>s.trim()).filter(Boolean)
    const req = job.requiredSkills || []
    const matched = req.filter(s => parsed.map(p=>p.toLowerCase()).includes(s.toLowerCase()))
    const missing = req.filter(s => !parsed.map(p=>p.toLowerCase()).includes(s.toLowerCase()))
    const matchPercent = req.length>0? Math.round((matched.length / req.length)*100):0
    const score = Math.floor(60 + Math.random()*35)
    
    // Save fallback analysis
    try {
      await post('/api/candidate/analyses', {
        jobRole: role,
        score,
        matchPercentage: matchPercent,
        skills: parsed,
        matchedSkills: matched,
        missingSkills: missing,
        experience: 0,
        candidateData: {},
        jobData: job
      })
      toast.success('Analysis saved to your history!')
    } catch (e) {
      console.log('Save analysis:', e.message)
    }

    nav('/candidate/score', {state:{role, job, candidateSkills:parsed, matchedSkills:matched, matchPercent, score}})
  }

  return (
    <div className="space-y-6 py-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-indigo-200 text-sm">Upload your resume and get AI-powered career insights</p>
          </div>
          <button
            onClick={() => nav('/candidate/history')}
            className="px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white rounded-xl font-medium text-sm hover:bg-white/25 transition-all border border-white/20"
          >
            View History →
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Analyses</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{stats.totalAnalyses}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Best Score</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.bestScore}%</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Avg Score</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{stats.avgScore}%</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Skills Found</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.totalSkills}</div>
          </div>
        </div>
      )}

      {/* Recent Analyses Quick View */}
      {recentAnalyses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Recent Analyses</h3>
            <button onClick={() => nav('/candidate/history')} className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">
              View all →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAnalyses.map(a => (
              <div key={a._id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                    a.score >= 75 ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                    a.score >= 50 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                    'bg-gradient-to-br from-red-500 to-pink-500'
                  }`}>
                    {a.score}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">{a.jobRole}</div>
                    <div className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-indigo-600">{a.matchPercentage}% match</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Analysis Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200">
            🔍
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Resume Analysis</h2>
            <p className="text-sm text-gray-500">Select a role and upload your resume to get started</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target Job Role <span className="text-red-500">*</span>
            </label>
            <select 
              value={role} 
              onChange={(e)=>setRole(e.target.value)} 
              className="w-full max-w-md border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
            >
              {jobRoles.map(r => (
                <option key={r.id||r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Upload Resume
            </label>
            <ResumeUpload 
              single 
              onFilesChange={(files) => setUploadedFiles(files)}
              hideSubmitButton={true}
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Manual Skills Entry <span className="text-xs text-gray-400 font-normal">(Optional - for testing)</span>
            </label>
            <input 
              value={candidateSkills} 
              onChange={e=>setCandidateSkills(e.target.value)} 
              className="w-full max-w-md border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" 
              placeholder="e.g. React, Node.js, SQL, Python, Docker"
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <button 
              onClick={handleAnalyze} 
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!role || isAnalyzing}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Analyzing...
                </span>
              ) : 'Analyze My Resume'}
            </button>
=======
  const activeJob = useMemo(() => {
    if (useCustomJD && customJD.trim()) {
      const skillKeywords = [
        'react','angular','vue','javascript','typescript','python','java','c++','c#',
        'node.js','nodejs','express','django','flask','spring','sql','mongodb','postgres',
        'docker','kubernetes','aws','azure','gcp','git','html','css','tailwind',
        'tensorflow','pytorch','pandas','numpy','scikit-learn','figma','photoshop',
        'rest api','graphql','redis','firebase','linux','bash','go','golang','rust','swift',
        'kotlin','flutter','react native','next.js','nuxt','svelte','php','laravel','ruby','rails'
      ]
      const jdLower = customJD.toLowerCase()
      const extracted = skillKeywords.filter(sk => jdLower.includes(sk))
      return {
        id: 'custom_jd',
        name: 'Custom Job Description',
        requiredSkills: extracted.length > 0 ? extracted.map(s => s.charAt(0).toUpperCase() + s.slice(1)) : [],
        roadmapSteps: [],
        description: customJD
      }
    }
    return jobRoles.find(j => j.id === selectedRoleId) || jobRoles[0] || null
  }, [selectedRoleId, useCustomJD, customJD, jobRoles])

  async function handleAnalyze() {
    if (!activeJob) return alert('Please select a job role or paste a job description')

    if (activeTab === 'roadmap' && uploadedFiles.length === 0) {
      nav('/candidate/roadmap', {
        state: {
          job: activeJob,
          candidateSkills: [],
          matchedSkills: [],
          missingSkills: activeJob.requiredSkills || [],
          matchPercent: 0,
          score: 0,
          candidateData: null,
          categoryScores: null,
          summary: ''
        }
      })
      return
    }

    if (activeTab === 'score' && uploadedFiles.length === 0) {
      return alert('Please upload your resume')
    }

    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('resumes', uploadedFiles[0])
      formData.append('jobId', activeJob.id || '')
      formData.append('jobTitle', activeJob.name || '')
      formData.append('requiredSkills', JSON.stringify(activeJob.requiredSkills || []))
      formData.append('nameMethod', 'filename')
      if (activeJob.description) {
        formData.append('jobDescription', activeJob.description)
      } else if (activeJob.roadmapSteps?.length) {
        formData.append('jobDescription', activeJob.name + '. ' + activeJob.roadmapSteps.join('. '))
      }

      const res = await post('/candidate/analyze', formData, true)

      if (res?.success && res.candidate) {
        const c = res.candidate
        const navState = {
          job: activeJob,
          candidateSkills: c.skills || [],
          matchedSkills: c.matchedSkills || [],
          missingSkills: c.missingSkills || [],
          matchPercent: c.matchPercentage || 0,
          score: c.score || 0,
          candidateData: c,
          categoryScores: c.categoryScores || null,
          bonusFactors: c.bonusFactors || {},
          summary: res.summary || '',
          resumeStrength: c.resumeStrength || 'Weak',
          jobFitLevel: c.jobFitLevel || 'Low Fit'
        }

        if (activeTab === 'score') {
          nav('/candidate/score', { state: navState })
        } else {
          nav('/candidate/roadmap', { state: navState })
        }
      } else {
        alert('Could not analyze resume. Please try again.')
      }
    } catch (e) {
      console.error('Analysis error:', e)
      alert('Failed to analyze resume: ' + e.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-[80vh]">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-2xl mb-8 p-8 md:p-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full"></div>
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white/90 text-xs font-medium mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            AI-Powered Analysis
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
            {currentUser?.name ? `Welcome, ${currentUser.name}` : 'Career Analysis'}
          </h1>
          <p className="text-indigo-200 text-base max-w-lg">Get an industry-standard ATS score or build a personalized learning roadmap for your dream role.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tab Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActiveTab('score')}
              className={`relative py-4 text-center font-semibold text-sm transition-all ${
                activeTab === 'score'
                  ? 'text-indigo-700 bg-indigo-50/60'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {activeTab === 'score' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Resume Score
              </span>
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`relative py-4 text-center font-semibold text-sm transition-all ${
                activeTab === 'roadmap'
                  ? 'text-indigo-700 bg-indigo-50/60'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {activeTab === 'roadmap' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                Skill Gap & Roadmap
              </span>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* Banner */}
          {activeTab === 'score' ? (
            <div className="flex items-start gap-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 mb-6 border border-indigo-100">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Resume Score Evaluation</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Upload your resume and select a target role. Get a realistic ATS-style score with 5-category breakdown, bonus factor detection, and actionable insights.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-6 border border-emerald-100">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Skill Gap & Learning Roadmap</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Select a target role. Upload your resume for a personalized path, or skip it to see the full roadmap from scratch.</p>
              </div>
            </div>
          )}

          {/* Job Input */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Target Job</label>
              <div className="flex items-center gap-5 mb-3">
                <label className="inline-flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="jobInput" checked={!useCustomJD} onChange={() => setUseCustomJD(false)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-800">Select Role</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="jobInput" checked={useCustomJD} onChange={() => setUseCustomJD(true)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-800">Paste Job Description</span>
                </label>
              </div>

              {!useCustomJD ? (
                <div>
                  <select value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)} className="input-field max-w-md">
                    {jobRoles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                  </select>
                  {activeJob?.requiredSkills?.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Required Skills</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {activeJob.requiredSkills.map(s => (
                          <span key={s} className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-md border border-gray-200 font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <textarea
                    value={customJD} onChange={e => setCustomJD(e.target.value)} rows={5}
                    className="input-field w-full text-sm"
                    placeholder="Paste a job description here...\n\nExample: We are looking for a Backend Developer with experience in Node.js, Express, MongoDB, REST APIs, and Docker..."
                  />
                  {activeJob?.requiredSkills?.length > 0 && useCustomJD && (
                    <div className="mt-3">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Detected Skills</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {activeJob.requiredSkills.map(s => (
                          <span key={s} className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-md border border-blue-200 font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resume Upload */}
            <div className="pt-5 border-t border-gray-100">
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Resume {activeTab === 'score' ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal text-xs">(optional)</span>}
              </label>
              <ResumeUpload single onFilesChange={files => setUploadedFiles(files)} hideSubmitButton={true} />
              <p className="text-[11px] text-gray-400 mt-2">PDF or DOCX — max 10 MB</p>
            </div>

            {/* Submit */}
            <div className="pt-5 border-t border-gray-100">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Analyzing...
                  </>
                ) : activeTab === 'score' ? (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> Analyze Resume</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> Generate Roadmap</>
                )}
              </button>
            </div>
>>>>>>> development2
          </div>
        </div>

<<<<<<< HEAD
      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-lg flex-shrink-0">
            ℹ️
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">How It Works</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Select a job role, upload your resume, and get instant analysis including match score, 
              skill gap analysis, and a personalized learning roadmap. All analyses are saved to your history.
            </p>
=======
        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-4 pb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h4 className="font-semibold text-gray-800 text-sm mb-1">5-Category Score</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Skills, experience, projects, keywords & education — each scored individually.</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h4 className="font-semibold text-gray-800 text-sm mb-1">Priority Skill Gaps</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Missing skills ranked as Critical, Important, or Nice-to-have.</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            </div>
            <h4 className="font-semibold text-gray-800 text-sm mb-1">Phased Roadmap</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Foundation → Core → Practice → Job-Ready with time estimates.</p>
>>>>>>> development2
          </div>
        </div>
      </div>
    </div>
  )
}
