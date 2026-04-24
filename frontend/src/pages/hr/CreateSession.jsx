import React, { useState, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import { post } from "../../api"
import jobRolesData from "../../data/job_roles.json"

export default function CreateSession() {
  const navigate = useNavigate()
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [form, setForm] = useState({
    title: '', jobRole: '', college: '', batch: '', description: '', jobLocation: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const jobRoles = useMemo(() => {
    const unique = []
    const seen = new Set()
    jobRolesData.forEach(r => { if (!seen.has(r.name)) { seen.add(r.name); unique.push(r) } })
    return unique.sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const selectedRole = useMemo(() => jobRoles.find(j => j.id === selectedRoleId), [selectedRoleId, jobRoles])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleRoleSelect(e) {
    const roleId = e.target.value
    setSelectedRoleId(roleId)
    const found = jobRoles.find(j => j.id === roleId)
    if (found) {
      setForm(prev => ({
        ...prev,
        jobRole: found.name,
        jobLocation: found.location || prev.jobLocation
      }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim() || !form.jobRole.trim()) { setError('Title and Job Role are required'); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        requiredSkills: selectedRole?.requiredSkills || []
      }
      const res = await post('/hr/session/create', payload)
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
    <div className="space-y-6 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">+</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/hr/sessions" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">← Sessions</Link>
              <span className="text-gray-300">/</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Hiring Session</h1>
            <p className="text-sm text-gray-500 mt-0.5">Set up a new session to organize resume screening</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="card bg-red-50 border-red-200 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Session Info */}
        <div className="card space-y-5">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">📝 Session Info</h3>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session Title <span className="text-red-500">*</span></label>
            <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Backend Hiring – IIT Hyderabad 2025" className="input-field" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">College</label>
              <input type="text" name="college" value={form.college} onChange={handleChange} placeholder="e.g. IIT Hyderabad" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Batch / Year</label>
              <input type="text" name="batch" value={form.batch} onChange={handleChange} placeholder="e.g. 2026" className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Optional notes about this hiring session…" className="input-field resize-none" />
          </div>
        </div>

        {/* Job Role Selection */}
        <div className="card space-y-5">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">💼 Job Role</h3>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select from Preset Roles</label>
            <select value={selectedRoleId} onChange={handleRoleSelect} className="input-field">
              <option value="">-- Select a job role --</option>
              {jobRoles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Or enter custom role <span className="text-red-500">*</span></label>
            <input type="text" name="jobRole" value={form.jobRole} onChange={handleChange} placeholder="e.g. Backend Developer, Data Scientist" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Job Location</label>
            <input type="text" name="jobLocation" value={form.jobLocation} onChange={handleChange} placeholder="e.g. Remote, Bangalore, Hyderabad" className="input-field" />
          </div>

          {/* Skills Preview */}
          {selectedRole && selectedRole.requiredSkills && selectedRole.requiredSkills.length > 0 && (
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🎯</span>
                <span className="text-sm font-bold text-gray-800">{selectedRole.name} — Required Skills ({selectedRole.requiredSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedRole.requiredSkills.map(skill => (
                  <span key={skill} className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">{skill}</span>
                ))}
              </div>
              {selectedRole.roadmapSteps && selectedRole.roadmapSteps.length > 0 && (
                <div className="mt-4 pt-3 border-t border-indigo-200">
                  <div className="text-xs font-semibold text-gray-600 mb-2">📚 Learning Roadmap</div>
                  <ul className="text-xs text-gray-600 space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedRole.roadmapSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="bg-indigo-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="card flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary px-8 py-3 text-sm">
            {saving ? '⏳ Creating…' : '🚀 Create Session'}
          </button>
          <Link to="/hr/sessions" className="btn-secondary px-6 py-3 text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
