import React, { useState, useEffect } from "react"
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom"
import Landing from "./pages/landing"
import CandidateDashboard from "./pages/candidate/Dashboard"
import ResumeScore from "./pages/candidate/ResumeScore"
import SkillGap from "./pages/candidate/SkillGap"
import Roadmap from "./pages/candidate/Roadmap"
import HRDashboard from "./pages/hr/Dashboard"
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import CandidateLogin from "./pages/auth/CandidateLogin"
import CandidateSignup from "./pages/auth/CandidateSignup"
import RoleSelect from "./pages/auth/RoleSelect"
import { isLoggedIn, getUser, logout } from "./api"

export default function App(){
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [user, setUser] = useState(getUser())
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const check = () => {
      setLoggedIn(isLoggedIn())
      setUser(getUser())
    }
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  // Re-check auth state when route changes
  useEffect(() => {
    setLoggedIn(isLoggedIn())
    setUser(getUser())
  }, [location.pathname])

  function handleLogout() {
    logout()
    setLoggedIn(false)
    setUser(null)
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Resume Screening
          </Link>
          <nav className="flex items-center space-x-6 text-sm">
            <Link to="/candidate" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Candidate</Link>
            <Link to="/hr" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">HR</Link>
            {loggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-xs font-medium bg-gray-50 px-3 py-1 rounded-full">
                  {user?.role === 'candidate' ? user?.name : user?.companyName || user?.email || 'Logged In'}
                  <span className="ml-1 text-indigo-500">({user?.role === 'candidate' ? 'Candidate' : 'HR'})</span>
                </span>
                <button onClick={handleLogout} className="text-rose-500 hover:text-rose-600 font-semibold transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/auth/login" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Login</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/candidate" element={<CandidateDashboard/>} />
          <Route path="/candidate/score" element={<ResumeScore/>} />
          <Route path="/candidate/skill-gap" element={<SkillGap/>} />
          <Route path="/candidate/roadmap" element={<Roadmap/>} />
          <Route path="/hr" element={<HRDashboard/>} />
          <Route path="/auth/login" element={<Login/>} />
          <Route path="/auth/signup" element={<Signup/>} />
          <Route path="/auth/candidate/login" element={<CandidateLogin/>} />
          <Route path="/auth/candidate/signup" element={<CandidateSignup/>} />
          <Route path="/auth/role" element={<RoleSelect/>} />
        </Routes>
      </main>
    </div>
  )
}
