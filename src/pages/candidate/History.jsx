import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get, del } from '../../api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function CandidateHistory() {
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [analysesRes, statsRes] = await Promise.all([
        get('/api/candidate/analyses'),
        get('/api/candidate/stats')
      ])
      setAnalyses(analysesRes)
      setStats(statsRes)
    } catch (e) {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this analysis?')) return
    try {
      await del(`/api/candidate/analyses/${id}`)
      setAnalyses(prev => prev.filter(a => a._id !== id))
      toast.success('Analysis deleted')
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  function handleViewDetails(analysis) {
    const job = analysis.jobData || { name: analysis.jobRole, requiredSkills: [], roadmapSteps: [] }
    nav('/candidate/score', {
      state: {
        role: analysis.jobRole,
        job,
        candidateSkills: analysis.skills || [],
        matchedSkills: analysis.matchedSkills || [],
        matchPercent: analysis.matchPercentage || 0,
        score: analysis.score || 0,
        candidateData: analysis.candidateData || {}
      }
    })
  }

  const filtered = filter
    ? analyses.filter(a => a.jobRole.toLowerCase().includes(filter.toLowerCase()))
    : analyses

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Analysis History</h1>
            <p className="text-indigo-200 text-sm">Track your resume analysis journey over time</p>
          </div>
          <button
            onClick={() => nav('/candidate')}
            className="px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white rounded-xl font-medium text-sm hover:bg-white/25 transition-all border border-white/20"
          >
            + New Analysis
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total</div>
            <div className="text-3xl font-bold text-indigo-600">{stats.totalAnalyses}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Best Score</div>
            <div className="text-3xl font-bold text-green-600">{stats.bestScore}%</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Avg Score</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.avgScore}%</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Skills</div>
            <div className="text-3xl font-bold text-purple-600">{stats.totalSkills}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Roles</div>
            <div className="text-3xl font-bold text-pink-600">{stats.rolesAnalyzed}</div>
          </div>
        </div>
      )}

      {/* Search/Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search by job role..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Analysis List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No analyses yet</h3>
          <p className="text-gray-500 mb-6">Upload your resume and analyze it against a job role to get started.</p>
          <button onClick={() => nav('/candidate')} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200">
            Start Your First Analysis
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((analysis) => (
            <div key={analysis._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Score Circle */}
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg flex-shrink-0 ${
                      analysis.score >= 75 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                      analysis.score >= 50 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                      'bg-gradient-to-br from-red-500 to-pink-500'
                    }`}>
                      <div className="text-xl font-bold leading-none">{analysis.score}</div>
                      <div className="text-[10px] opacity-80">score</div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 leading-snug">{analysis.jobRole}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{new Date(analysis.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        <span className="text-gray-300">|</span>
                        <span className="font-medium text-indigo-600">{analysis.matchPercentage}% match</span>
                      </div>

                      {/* Skills preview */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(analysis.matchedSkills || []).slice(0, 4).map(s => (
                          <span key={s} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-lg font-medium border border-green-100">
                            {s}
                          </span>
                        ))}
                        {(analysis.missingSkills || []).slice(0, 3).map(s => (
                          <span key={s} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-lg font-medium border border-red-100">
                            {s}
                          </span>
                        ))}
                        {((analysis.matchedSkills?.length || 0) + (analysis.missingSkills?.length || 0)) > 7 && (
                          <span className="px-2.5 py-1 text-gray-400 text-xs">
                            +{(analysis.matchedSkills?.length || 0) + (analysis.missingSkills?.length || 0) - 7} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewDetails(analysis)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(analysis._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
