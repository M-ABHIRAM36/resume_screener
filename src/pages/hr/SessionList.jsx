import React, { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { get, del } from "../../api"

export default function SessionList() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchSessions() }, [])

  async function fetchSessions() {
    setLoading(true)
    try {
      const data = await get('/hr/session/list')
      setSessions(data)
    } catch (e) {
      console.error('Failed to load sessions:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this session and all its results?')) return
    try {
      await del(`/hr/session/${id}`)
      setSessions(prev => prev.filter(s => s._id !== id))
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions
    const q = search.toLowerCase()
    return sessions.filter(s =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.jobRole || '').toLowerCase().includes(q) ||
      (s.college || '').toLowerCase().includes(q)
    )
  }, [sessions, search])

  // Aggregate stats
  const globalStats = useMemo(() => {
    const total = sessions.length
    const totalCandidates = sessions.reduce((sum, s) => sum + (s.candidateCount || 0), 0)
    const avgScore = total > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.avgScore || 0), 0) / total) : 0
    const totalHighFit = sessions.reduce((sum, s) => sum + (s.highFitCount || 0), 0)
    const totalStrong = sessions.reduce((sum, s) => sum + (s.strongCount || 0), 0)
    return { total, totalCandidates, avgScore, totalHighFit, totalStrong }
  }, [sessions])

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="card flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            📋
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hiring Sessions</h1>
            <p className="text-sm text-gray-500 mt-1">Organize and manage resume screening across sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/hr" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">
            ← Dashboard
          </Link>
          <Link to="/hr/sessions/create" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-sm text-sm">
            + Create Session
          </Link>
        </div>
      </div>

      {/* Global Stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="text-xs font-semibold text-gray-600 mb-1">Total Sessions</div>
            <div className="text-3xl font-bold text-indigo-600">{globalStats.total}</div>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="text-xs font-semibold text-gray-600 mb-1">Total Candidates</div>
            <div className="text-3xl font-bold text-green-600">{globalStats.totalCandidates}</div>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="text-xs font-semibold text-gray-600 mb-1">Avg Score</div>
            <div className="text-3xl font-bold text-purple-600">{globalStats.avgScore}</div>
          </div>
          <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <div className="text-xs font-semibold text-gray-600 mb-1">High Fit</div>
            <div className="text-3xl font-bold text-emerald-600">{globalStats.totalHighFit}</div>
          </div>
          <div className="card bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
            <div className="text-xs font-semibold text-gray-600 mb-1">Strong Resumes</div>
            <div className="text-3xl font-bold text-orange-600">{globalStats.totalStrong}</div>
          </div>
        </div>
      )}

      {/* Search */}
      {sessions.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search sessions by title, job role, or college…"
                className="input-field pl-10 text-sm"
              />
            </div>
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold text-indigo-600">{filtered.length}</span> of {sessions.length}
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-500 font-medium">Loading sessions…</p>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No sessions yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">Create your first hiring session to start organizing your resume screening workflow</p>
          <Link to="/hr/sessions/create" className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-sm">
            + Create Your First Session
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(s => (
            <div key={s._id} className="card hover:shadow-lg transition-all duration-300 border-l-4 border-l-indigo-500">
              <div className="flex items-start justify-between gap-4">
                <Link to={`/hr/sessions/${s._id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                      {s.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">{s.jobRole}</span>
                    {s.college && <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs">🏫 {s.college}</span>}
                    {s.batch && <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs">🎓 {s.batch}</span>}
                    {s.jobLocation && <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs">📍 {s.jobLocation}</span>}
                  </div>
                  {/* Session Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-indigo-600">{s.candidateCount || 0}</div>
                      <div className="text-[10px] text-gray-500 font-medium">Candidates</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{s.avgScore || 0}</div>
                      <div className="text-[10px] text-gray-500 font-medium">Avg Score</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{s.avgMatch || 0}%</div>
                      <div className="text-[10px] text-gray-500 font-medium">Avg Match</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-emerald-600">{s.highFitCount || 0}</div>
                      <div className="text-[10px] text-gray-500 font-medium">High Fit</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">{s.strongCount || 0}</div>
                      <div className="text-[10px] text-gray-500 font-medium">Strong</div>
                    </div>
                  </div>
                  {s.description && <p className="text-gray-400 text-sm mt-3 line-clamp-2">{s.description}</p>}
                </Link>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Link to={`/hr/sessions/${s._id}`} className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-semibold transition-colors">
                    Open →
                  </Link>
                  <button onClick={() => handleDelete(s._id)} className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors border border-red-200">
                    Delete
                  </button>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
