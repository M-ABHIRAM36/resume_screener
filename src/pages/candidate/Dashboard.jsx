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
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [stats, setStats] = useState(null)
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const nav = useNavigate()

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
    if(jobRoles.length && !role) setRole(jobRoles[0].name)
  },[jobRoles, role])

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
          </div>
        </div>
      </div>

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
          </div>
        </div>
      </div>
    </div>
  )
}
