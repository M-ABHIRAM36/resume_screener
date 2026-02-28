import React, { useState } from 'react'
import { post } from '../../api'
import { useNavigate } from 'react-router-dom'

export default function Signup(){
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    try{
      const res = await post('/hr/auth/signup', { companyName, email, password })
      localStorage.setItem('token', res.token)
      navigate('/hr')
    }catch(err){
      setError(err.message || String(err))
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">HR Signup</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Company Name" className="w-full border p-2 rounded" />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border p-2 rounded" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full border p-2 rounded" />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button className="px-3 py-2 bg-indigo-600 text-white rounded">Signup</button>
      </form>
    </div>
  )
}
