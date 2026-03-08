import React from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Landing() {
  const nav = useNavigate()
  const { isAuthenticated, user } = useAuth()

  return (
<<<<<<< HEAD
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
=======
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-10 md:p-14 text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-white rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-white/90 text-xs font-semibold mb-6 tracking-wide">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              AI-Powered Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Resume Screening<br className="hidden md:block" /> & Career Guidance
            </h1>
            <p className="text-indigo-200 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Evaluate resumes with ATS-level scoring, discover skill gaps, and get personalized learning roadmaps — all powered by AI.
>>>>>>> development2
            </p>
          </div>
        </div>

<<<<<<< HEAD
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
=======
        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-1.5">Smart Analysis</h3>
            <p className="text-sm text-gray-500 leading-relaxed">5-category scoring with skill match, experience, projects, keywords & education breakdown.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-1.5">Skill Gap Analysis</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Priority-ranked missing skills with Critical, Important, and Nice-to-have ratings.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-1.5">Learning Roadmap</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Phased path from Foundation to Job-Ready with time estimates for each stage.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Get Started</h2>
          <p className="text-sm text-gray-500 mb-6">Choose your role to continue</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <button
              onClick={() => nav("/auth/candidate/login")}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl transition-all sm:min-w-[220px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Login as Candidate
            </button>
            <button
              onClick={() => nav('/auth/login')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all sm:min-w-[220px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Login as HR / Organization
            </button>
          </div>
          <p className="text-xs text-gray-400">
            New here? <Link to="/auth/signup" className="text-indigo-600 font-semibold hover:text-indigo-700">Create an account</Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-[11px] text-gray-400">Built with React, FastAPI, spaCy & Sentence Transformers</p>
>>>>>>> development2
        </div>
      </div>
    </div>
  )
}
