import React from "react"
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import Landing from "./pages/landing"
import CandidateDashboard from "./pages/candidate/Dashboard"
import ResumeScore from "./pages/candidate/ResumeScore"
import SkillGap from "./pages/candidate/SkillGap"
import Roadmap from "./pages/candidate/Roadmap"
import CandidateHistory from "./pages/candidate/History"
import HRDashboard from "./pages/hr/Dashboard"
import HRSessions from "./pages/hr/Sessions"
import Login from "./pages/auth/Login"
import Signup from "./pages/auth/Signup"
import RoleSelect from "./pages/auth/RoleSelect"

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (role && user?.role !== role) return <Navigate to={user?.role === 'hr' ? '/hr' : '/candidate'} replace />
  return children
}

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-all">
            RS
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
            ResumeScreen
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {isAuthenticated ? (
            <>
              {user?.role === 'candidate' && (
                <>
                  <Link to="/candidate"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/candidate') && !isActive('/candidate/history') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    Dashboard
                  </Link>
                  <Link to="/candidate/history"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/candidate/history') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    History
                  </Link>
                </>
              )}
              {user?.role === 'hr' && (
                <>
                  <Link to="/hr"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/hr') && !isActive('/hr/sessions') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    Dashboard
                  </Link>
                  <Link to="/hr/sessions"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/hr/sessions') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    Sessions
                  </Link>
                </>
              )}

              <div className="ml-2 pl-2 border-l border-gray-200 flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-full border border-gray-200/80">
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-gray-800 leading-tight">{user?.name}</div>
                    <div className="text-gray-500 capitalize leading-tight">{user?.role}</div>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                Login
              </Link>
              <Link to="/auth/signup" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg">
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Auth */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/role" element={<RoleSelect />} />

          {/* Candidate - Protected */}
          <Route path="/candidate" element={<ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>} />
          <Route path="/candidate/score" element={<ProtectedRoute role="candidate"><ResumeScore /></ProtectedRoute>} />
          <Route path="/candidate/skill-gap" element={<ProtectedRoute role="candidate"><SkillGap /></ProtectedRoute>} />
          <Route path="/candidate/roadmap" element={<ProtectedRoute role="candidate"><Roadmap /></ProtectedRoute>} />
          <Route path="/candidate/history" element={<ProtectedRoute role="candidate"><CandidateHistory /></ProtectedRoute>} />

          {/* HR - Protected */}
          <Route path="/hr" element={<ProtectedRoute role="hr"><HRDashboard /></ProtectedRoute>} />
          <Route path="/hr/sessions" element={<ProtectedRoute role="hr"><HRSessions /></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
