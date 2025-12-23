import React, {useState, useEffect} from "react";
import { useNavigate, Link } from "react-router-dom";

function validateEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Login(){
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('candidate')
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(()=>{
    const e = {}
    if(!email) e.email = 'Email is required.'
    else if(!validateEmail(email)) e.email = 'Enter a valid email.'
    if(!password) e.password = 'Password is required.'
    setErrors(e)
  },[email,password])

  function handleLogin(){
    setTouched({email:true,password:true})
    if(Object.keys(errors).length === 0){
      // UI-only: route based on selected role
      if(role === 'hr') nav('/hr')
      else nav('/candidate')
    }
  }

  function showError(field){
    return touched[field] && errors[field]
  }

  return (
    <div className="max-w-md bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <div className="space-y-3">
        <label className="text-sm">Role</label>
        <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border p-2 rounded">
          <option value="candidate">Candidate</option>
          <option value="hr">HR / Organization</option>
        </select>

        <div>
          <label className="text-sm">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} onBlur={()=>setTouched(t=>({...t,email:true}))} placeholder="Email" className="w-full border p-2 rounded mt-1" />
          {showError('email') && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
        </div>

        <div>
          <label className="text-sm">Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} onBlur={()=>setTouched(t=>({...t,password:true}))} placeholder="Password" type="password" className="w-full border p-2 rounded mt-1" />
          {showError('password') && <div className="text-red-600 text-sm mt-1">{errors.password}</div>}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">New here? <Link to="/auth/signup" className="text-indigo-600">Create account</Link></div>
          <button onClick={handleLogin} disabled={Object.keys(errors).length>0} className={`px-4 py-2 rounded ${Object.keys(errors).length>0? 'bg-gray-300 text-gray-600' : 'bg-indigo-600 text-white'}`}>
            Login
          </button>
        </div>
      </div>
    </div>
  )
}
