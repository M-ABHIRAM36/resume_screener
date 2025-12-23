import React, {useState} from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup(){
  const [role,setRole]=useState('candidate')
  const [company,setCompany]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const nav = useNavigate()

  function handleSignup(){
    // UI-only: simulate signup and navigate to appropriate dashboard
    if(role==='hr') nav('/hr')
    else nav('/candidate')
  }

  return (
    <div className="max-w-md bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Signup</h2>
      <div className="space-y-3">
        <label className="text-sm">Role</label>
        <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border p-2 rounded">
          <option value="candidate">Candidate</option>
          <option value="hr">HR / Organization</option>
        </select>

        {role==='hr' && (
          <div>
            <label className="text-sm">Company Name</label>
            <input placeholder="Company Name" value={company} onChange={e=>setCompany(e.target.value)} className="w-full border p-2 rounded mt-1" />
          </div>
        )}

        <div>
          <label className="text-sm">Email</label>
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-2 rounded mt-1" />
        </div>

        <div>
          <label className="text-sm">Password</label>
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border p-2 rounded mt-1" />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Already have an account? <Link to="/auth/login" className="text-indigo-600">Login</Link></div>
          <button onClick={handleSignup} className="px-4 py-2 bg-indigo-600 text-white rounded">Create Account</button>
        </div>
      </div>
    </div>
  )
}
