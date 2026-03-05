import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get, del, put } from '../../api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function HRSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [sessionResults, setSessionResults] = useState({})
  const nav = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [sessRes, statsRes] = await Promise.all([
        get('/api/hr/sessions'),
        get('/api/hr/stats')
      ])
      setSessions(sessRes)
      setStats(statsRes)
    } catch (e) {
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  async function handleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!sessionResults[id]) {
      try {
        const res = await get(`/api/hr/sessions/${id}`)
        setSessionResults(prev => ({ ...prev, [id]: res.results || [] }))
      } catch (e) {
        toast.error('Failed to load results')
      }
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this session and all its results?')) return
    try {
      await del(`/api/hr/sessions/${id}`)
      setSessions(prev => prev.filter(s => s._id !== id))
      toast.success('Session deleted')
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await put(`/api/hr/sessions/${id}`, { status })
      setSessions(prev => prev.map(s => s._id === id ? { ...s, status } : s))
      toast.success(`Session ${status}`)
    } catch (e) {
      toast.error('Failed to update')
    }
  }

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
            <h1 className="text-3xl font-bold mb-1">Hiring Sessions</h1>
            <p className="text-indigo-200 text-sm">Manage and review your screening sessions</p>
          </div>
          <button
            onClick={() => nav('/hr')}
            className="px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white rounded-xl font-medium text-sm hover:bg-white/25 transition-all border border-white/20"
          >
            + New Session
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Sessions</div>
            <div className="text-3xl font-bold text-indigo-600">{stats.totalSessions}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active</div>
            <div className="text-3xl font-bold text-green-600">{stats.activeSessions}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Candidates</div>
            <div className="text-3xl font-bold text-purple-600">{stats.totalCandidates}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Avg Score</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.avgScore}%</div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No sessions yet</h3>
          <p className="text-gray-500 mb-6">Go to the dashboard to create a hiring session and upload resumes.</p>
          <button onClick={() => nav('/hr')} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200">
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              {/* Session Header */}
              <div className="p-6 cursor-pointer" onClick={() => handleExpand(session._id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg flex-shrink-0 ${
                      session.status === 'active' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                      session.status === 'closed' ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                      'bg-gradient-to-br from-yellow-500 to-orange-500'
                    }`}>
                      <div className="text-lg font-bold leading-none">{session.totalCandidates || 0}</div>
                      <div className="text-[9px] opacity-80">candidates</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-gray-900">{session.jobRole}</h3>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          session.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                          session.status === 'closed' ? 'bg-gray-50 text-gray-500 border border-gray-200' :
                          'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{new Date(session.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        {session.jobLocation && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>{session.jobLocation}</span>
                          </>
                        )}
                        {session.avgScore > 0 && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="font-medium text-indigo-600">Avg Score: {session.avgScore}%</span>
                          </>
                        )}
                      </div>
                      {session.requiredSkills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {session.requiredSkills.slice(0, 5).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-lg font-medium border border-indigo-100">{s}</span>
                          ))}
                          {session.requiredSkills.length > 5 && (
                            <span className="text-xs text-gray-400">+{session.requiredSkills.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {session.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(session._id, 'closed')}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Close
                      </button>
                    )}
                    {session.status === 'closed' && (
                      <button
                        onClick={() => handleStatusChange(session._id, 'active')}
                        className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                      >
                        Reopen
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(session._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === session._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Results */}
              {expandedId === session._id && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  {!sessionResults[session._id] ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                  ) : sessionResults[session._id].length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      No candidates analyzed in this session yet.
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase tracking-wider">
                              <th className="px-4 py-2 text-left font-semibold">Candidate</th>
                              <th className="px-4 py-2 text-left font-semibold">Score</th>
                              <th className="px-4 py-2 text-left font-semibold">Match</th>
                              <th className="px-4 py-2 text-left font-semibold">Experience</th>
                              <th className="px-4 py-2 text-left font-semibold">Skills</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {sessionResults[session._id].map((r, idx) => (
                              <tr key={r._id || idx} className="hover:bg-white transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-sm text-gray-800">{r.candidateName}</div>
                                  <div className="text-xs text-gray-500">{r.candidateEmail || '—'}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-bold ${
                                    r.score >= 75 ? 'bg-green-50 text-green-700' :
                                    r.score >= 50 ? 'bg-yellow-50 text-yellow-700' :
                                    'bg-red-50 text-red-600'
                                  }`}>
                                    {r.score}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-indigo-600">{r.matchPercentage}%</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {r.experience > 0 && r.experience < 50 ? `${r.experience} yrs` : '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {(r.skills || []).slice(0, 4).map((s, i) => (
                                      <span key={`${s}-${i}`} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">{s}</span>
                                    ))}
                                    {(r.skills || []).length > 4 && <span className="text-xs text-gray-400">+{r.skills.length - 4}</span>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
