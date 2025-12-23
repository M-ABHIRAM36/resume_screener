import React, {useState, useEffect} from "react";
import { useNavigate, Link } from "react-router-dom";

function validateEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Signup(){
  const [role,setRole]=useState('candidate')
  const [company,setCompany]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [errors,setErrors]=useState({})
  const [touched,setTouched]=useState({})
  const nav = useNavigate()

  useEffect(()=>{
    const e = {}
    if(!email) e.email = 'Email is required.'
    else if(!validateEmail(email)) e.email = 'Enter a valid email.'
    if(!password) e.password = 'Password is required.'
    else if(password.length < 6) e.password = 'Password must be at least 6 characters.'
    if(role === 'hr' && !company) e.company = 'Company name is required for HR.'
    setErrors(e)
  },[email,password,company,role])

  function handleSignup(){
    setTouched({email:true,password:true,company:true})
    if(Object.keys(errors).length === 0){
      // UI-only: simulate signup and navigate to appropriate dashboard
      if(role==='hr') nav('/hr')
      else nav('/candidate')
    }
  }

  function showError(field){
    return touched[field] && errors[field]
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
            <input placeholder="Company Name" value={company} onChange={e=>setCompany(e.target.value)} onBlur={()=>setTouched(t=>({...t,company:true}))} className="w-full border p-2 rounded mt-1" />
            {showError('company') && <div className="text-red-600 text-sm mt-1">{errors.company}</div>}
          </div>
        )}

        <div>
          <label className="text-sm">Email</label>
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} onBlur={()=>setTouched(t=>({...t,email:true}))} className="w-full border p-2 rounded mt-1" />
          {showError('email') && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
        </div>

        <div>
          <label className="text-sm">Password</label>
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} onBlur={()=>setTouched(t=>({...t,password:true}))} className="w-full border p-2 rounded mt-1" />
          {showError('password') && <div className="text-red-600 text-sm mt-1">{errors.password}</div>}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Already have an account? <Link to="/auth/login" className="text-indigo-600">Login</Link></div>
          <button onClick={handleSignup} disabled={Object.keys(errors).length>0} className={`px-4 py-2 rounded ${Object.keys(errors).length>0? 'bg-gray-300 text-gray-600' : 'bg-indigo-600 text-white'}`}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}
