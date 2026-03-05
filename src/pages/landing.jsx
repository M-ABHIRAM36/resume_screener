import React from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Landing() {
  const nav = useNavigate()
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-5xl w-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-medium text-indigo-700 mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          AI-Powered Resume Analysis Platform
        </div>

        {/* Hero */}
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent leading-tight">
          Screen Resumes.
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Build Careers.
          </span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Get instant resume scores, skill gap analysis, and personalized learning roadmaps.
          The smartest way to hire and grow talent.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          {isAuthenticated ? (
            <button
              onClick={() => nav(user?.role === 'hr' ? '/hr' : '/candidate')}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-0.5"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link
                to="/auth/signup"
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
              <Link
                to="/auth/login"
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-xl mb-4 shadow-lg shadow-blue-200">
              📊
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">Smart Analysis</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Upload resumes and get instant AI-powered scoring with detailed match percentages against any role.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xl mb-4 shadow-lg shadow-green-200">
              🎯
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">Skill Gap Detection</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Identify exactly which skills are missing and get actionable insights to bridge the gap.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl mb-4 shadow-lg shadow-purple-200">
              🗺️
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">Learning Roadmap</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Get a personalized step-by-step learning path to become the ideal candidate for your dream role.
            </p>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex -space-x-2">
            {['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ background: c }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Trusted by <span className="font-semibold text-gray-700">500+</span> recruiters and candidates
          </p>
        </div>
      </div>
    </div>
  )
}
