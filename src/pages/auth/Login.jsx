import React, { useState } from 'react'
import { post } from '../../api'
import { useNavigate, Link } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setLoading(true)
    setError('')
    try{
      const res = await post('/hr/auth/login', { email, password })
      localStorage.setItem('token', res.token)
      navigate('/hr')
    }catch(err){
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your HR account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" type="email" className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type="password" className="input-field" required />
            </div>
            {error && (
              <div className="bg-rose-50 text-rose-600 text-sm px-4 py-2.5 rounded-xl border border-rose-200">{error}</div>
            )}
            <button disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account? <Link to="/auth/signup" className="text-indigo-600 font-semibold hover:text-indigo-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
