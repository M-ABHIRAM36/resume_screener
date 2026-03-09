import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { post } from "../../api"

export default function CreateSession() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    jobRole: '',
    college: '',
    batch: '',
    description: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim() || !form.jobRole.trim()) {
      setError('Title and Job Role are required')
      return
    }

    setSaving(true)
    try {
      const res = await post('/hr/session/create', form)
      if (res.success && res.session) {
        navigate(`/hr/sessions/${res.session._id}`)
      }
    } catch (err) {
      setError('Failed to create session. Please try again.')
      console.error('Create session error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link to="/hr/sessions" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ← Back to Sessions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-3">Create Hiring Session</h1>
        <p className="text-gray-500 mt-1">Set up a new session to organize resume screening</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Session Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Backend Hiring – IIT Hyderabad"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Job Role <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="jobRole"
            value={form.jobRole}
            onChange={handleChange}
            placeholder="e.g. Backend Developer, Data Scientist"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">College</label>
            <input
              type="text"
              name="college"
              value={form.college}
              onChange={handleChange}
              placeholder="e.g. IIT Hyderabad"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Batch</label>
            <input
              type="text"
              name="batch"
              value={form.batch}
              onChange={handleChange}
              placeholder="e.g. 2026"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Optional notes about this hiring session…"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-semibold transition-colors"
          >
            {saving ? 'Creating…' : 'Create Session'}
          </button>
          <Link
            to="/hr/sessions"
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
