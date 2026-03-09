import React, { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { get, post } from "../../api"

export default function SessionDetail() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [sortBy, setSortBy] = useState('score')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchSession()
  }, [id])

  async function fetchSession() {
    setLoading(true)
    try {
      const data = await get(`/hr/session/${id}`)
      setSession(data)
      setCandidates(data.candidates || [])
    } catch (e) {
      console.error('Failed to load session:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    const files = fileInputRef.current?.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('resumes', files[i])
      }
      formData.append('nameMethod', 'filename')

      const res = await post(`/hr/session/${id}/upload`, formData, true)
      if (res.success) {
        // Refresh session data to get updated candidates
        await fetchSession()
        fileInputRef.current.value = ''
      }
    } catch (e) {
      console.error('Upload failed:', e)
      alert('Resume upload failed. Make sure the ML service is running.')
    } finally {
      setUploading(false)
    }
  }

  const sorted = [...candidates].sort((a, b) => {
    if (sortBy === 'score') return (b.score || 0) - (a.score || 0)
    if (sortBy === 'match') return (b.matchPercentage || 0) - (a.matchPercentage || 0)
    if (sortBy === 'name') return (a.candidateName || '').localeCompare(b.candidateName || '')
    return 0
  })

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading session…</div>
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Session not found</p>
        <Link to="/hr/sessions" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
          ← Back to Sessions
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/hr/sessions" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ← Back to Sessions
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
        <div className="flex flex-wrap gap-3 mt-3">
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
            {session.jobRole}
          </span>
          {session.college && (
            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
              🏫 {session.college}
            </span>
          )}
          {session.batch && (
            <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm">
              🎓 Batch {session.batch}
            </span>
          )}
        </div>
        {session.description && (
          <p className="text-gray-500 text-sm mt-3">{session.description}</p>
        )}
        <div className="text-xs text-gray-400 mt-3">
          Created {new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Resumes</h2>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            {uploading ? 'Analyzing…' : 'Upload & Analyze'}
          </button>
        </div>
        {uploading && (
          <div className="mt-3 text-sm text-indigo-600 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing resumes through ML service…
          </div>
        )}
      </div>

      {/* Candidate Ranking Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Candidates ({candidates.length})
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Sort by:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="score">Score (High → Low)</option>
              <option value="match">Match % (High → Low)</option>
              <option value="name">Name (A → Z)</option>
            </select>
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📄</div>
            <p>No candidates yet. Upload resumes to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-5 py-3 font-semibold">Candidate</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold text-center">Score</th>
                  <th className="px-5 py-3 font-semibold text-center">Match %</th>
                  <th className="px-5 py-3 font-semibold">Skills</th>
                  <th className="px-5 py-3 font-semibold">Missing Skills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((c, idx) => (
                  <tr key={c._id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{c.candidateName}</td>
                    <td className="px-5 py-3 text-gray-500">{c.email || '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        (c.score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                        (c.score || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {c.score || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        (c.matchPercentage || 0) >= 70 ? 'bg-green-100 text-green-700' :
                        (c.matchPercentage || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {c.matchPercentage || 0}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(c.skills || []).slice(0, 5).map((s, i) => (
                          <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                        {(c.skills || []).length > 5 && (
                          <span className="text-xs text-gray-400">+{c.skills.length - 5}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(c.missingSkills || []).slice(0, 3).map((s, i) => (
                          <span key={i} className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                        {(c.missingSkills || []).length > 3 && (
                          <span className="text-xs text-gray-400">+{c.missingSkills.length - 3}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
