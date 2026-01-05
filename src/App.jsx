import React from "react"
import { Routes, Route, Link } from "react-router-dom"
import Landing from "./pages/landing"
import CandidateDashboard from "./pages/candidate/Dashboard"
import ResumeScore from "./pages/candidate/ResumeScore"
import SkillGap from "./pages/candidate/SkillGap"
import Roadmap from "./pages/candidate/Roadmap"
import HRDashboard from "./pages/hr/Dashboard"
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import RoleSelect from "./pages/auth/RoleSelect"

export default function App(){
  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Resume Screening
          </Link>
          <nav className="space-x-6 text-sm">
            <Link to="/candidate" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Candidate</Link>
            <Link to="/hr" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">HR</Link>
            <Link to="/auth/login" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Login</Link>
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
          <Route path="/auth/role" element={<RoleSelect/>} />
        </Routes>
      </main>
    </div>
  )
}
