import React, { useMemo, useState, useEffect } from "react"
import ResumeUpload from "../../components/ResumeUpload"
import { useNavigate } from "react-router-dom"
import { post } from "../../api"
import jobRolesData from "../../data/job_roles.json"

export default function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState('score')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [customJD, setCustomJD] = useState('')
  const [useCustomJD, setUseCustomJD] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const nav = useNavigate()

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
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
            🎯
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Career Analysis</h1>
            <p className="text-sm text-gray-500">Evaluate your resume or plan your learning path</p>
          </div>
        </div>
      </div>

      {/* Two Option Tabs */}
      <div className="card">
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('score')}
            className={`flex-1 py-3 text-center font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'score'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Resume Score Evaluation
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex-1 py-3 text-center font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'roadmap'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🗺️ Skill Gap & Roadmap
          </button>
        </div>

        {/* Tab Description */}
        {activeTab === 'score' ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-indigo-800 mb-1">How does your resume score?</h3>
            <p className="text-sm text-indigo-700">
              Upload your resume and select a target job role. Get a realistic ATS-style score with
              category breakdown — skill match, experience, projects, keywords, and education relevance.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-emerald-800 mb-1">What should you learn next?</h3>
            <p className="text-sm text-emerald-700">
              Select a target role to see what skills you're missing and get a step-by-step learning roadmap.
              Upload your resume for a personalized path, or skip it to see the full roadmap.
            </p>
          </div>
        )}

        {/* Job Input */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" name="jobInput" checked={!useCustomJD} onChange={() => setUseCustomJD(false)} className="text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Select Job Role</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" name="jobInput" checked={useCustomJD} onChange={() => setUseCustomJD(true)} className="text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Paste Job Description</span>
            </label>
          </div>

          {!useCustomJD ? (
            <div>
              <select value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)} className="input-field max-w-md">
                {jobRoles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
              {activeJob && activeJob.requiredSkills?.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Required Skills:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {activeJob.requiredSkills.map(s => (
                      <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full border border-gray-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={customJD} onChange={e => setCustomJD(e.target.value)} rows={6}
                className="input-field w-full"
                placeholder={"Paste a job description here...\n\nExample:\nWe are looking for a Backend Developer with experience in Node.js, Express, MongoDB, REST APIs, and Docker..."}
              />
              {activeJob && activeJob.requiredSkills?.length > 0 && useCustomJD && (
                <div className="mt-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detected Skills:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {activeJob.requiredSkills.map(s => (
                      <span key={s} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resume Upload */}
        <div className="mt-6 pt-6 border-t">
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            Upload Resume {activeTab === 'score' ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(optional for roadmap)</span>}
          </label>
          <ResumeUpload single onFilesChange={files => setUploadedFiles(files)} hideSubmitButton={true} />
          <p className="text-xs text-gray-400 mt-2">Supports PDF and DOCX formats</p>
        </div>

        {/* Action */}
        <div className="mt-6 pt-6 border-t">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="btn-primary w-full sm:w-auto px-8 py-3 text-base disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Analyzing...
              </span>
            ) : activeTab === 'score' ? '🔍 Analyze My Resume' : '🗺️ Generate Roadmap'}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex gap-3">
            <div className="text-2xl">📊</div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Score Evaluation</h4>
              <p className="text-xs text-gray-600">Get a realistic ATS score with breakdown across skill match, experience, projects, keywords, and education.</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex gap-3">
            <div className="text-2xl">🗺️</div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Skill Gap & Roadmap</h4>
              <p className="text-xs text-gray-600">See which skills you're missing and get a personalized step-by-step learning roadmap.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
