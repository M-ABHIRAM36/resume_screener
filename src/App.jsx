import React from "react"
import { Routes, Route, Link } from "react-router-dom"
import Landing from "./pages/landing"
import CandidateDashboard from "./pages/candidate/Dashboard"
import ResumeScore from "./pages/candidate/ResumeScore"
import HRDashboard from "./pages/hr/Dashboard"
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import RoleSelect from "./pages/auth/RoleSelect"

export default function App(){
  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl">Resume Screening</Link>
          <nav className="space-x-4 text-sm">
            <Link to="/candidate" className="text-gray-600 hover:text-gray-900">Candidate</Link>
            <Link to="/hr" className="text-gray-600 hover:text-gray-900">HR</Link>
            <Link to="/auth/login" className="text-gray-600 hover:text-gray-900">Login</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/candidate" element={<CandidateDashboard/>} />
          <Route path="/candidate/score" element={<ResumeScore/>} />
          <Route path="/hr" element={<HRDashboard/>} />
          <Route path="/auth/login" element={<Login/>} />
          <Route path="/auth/signup" element={<Signup/>} />
          <Route path="/auth/role" element={<RoleSelect/>} />
        </Routes>
      </main>
    </div>
  )
}
