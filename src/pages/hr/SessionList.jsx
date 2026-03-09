import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { get, del } from "../../api"

export default function SessionList() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hiring Sessions</h1>
          <p className="text-gray-500 mt-1">Organize your resume screening by session</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/hr"
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            ← Dashboard
          </Link>
          <Link
            to="/hr/sessions/create"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
          >
            + Create Session
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No sessions yet</h3>
          <p className="text-gray-400 mb-6">Create your first hiring session to start screening resumes</p>
          <Link
            to="/hr/sessions/create"
            className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
          >
            Create Session
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map(s => (
            <div key={s._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <Link to={`/hr/sessions/${s._id}`} className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                    {s.title}
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">
                      {s.jobRole}
                    </span>
                    {s.college && (
                      <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
                        🏫 {s.college}
                      </span>
                    )}
                    {s.batch && (
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full">
                        🎓 {s.batch}
                      </span>
                    )}
                    <span className="text-gray-400">
                      {s.candidateCount || 0} candidate{(s.candidateCount || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {s.description && (
                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">{s.description}</p>
                  )}
                </Link>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/hr/sessions/${s._id}`}
                    className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="px-3 py-1.5 text-sm bg-red-50 text-red-500 hover:bg-red-100 rounded-lg font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Created {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
