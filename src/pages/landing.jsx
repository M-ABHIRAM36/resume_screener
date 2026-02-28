import React from "react"
import { useNavigate, Link } from "react-router-dom"

export default function Landing(){
  const nav = useNavigate()
  return (
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
            </p>
          </div>
        </div>

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
              onClick={() => nav("/candidate")}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl transition-all sm:min-w-[220px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Login as Candidate
            </button>
            <button
              onClick={() => nav('/hr')}
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
        </div>
      </div>
    </div>
  )
}
