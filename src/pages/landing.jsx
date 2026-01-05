import React from "react"
import { useNavigate, Link } from "react-router-dom"

export default function Landing(){
  const nav = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Resume Screening & Career Guidance
          </h1>
          <p className="text-xl text-gray-600 mb-2">AI-Powered Resume Analysis Platform</p>
          <p className="text-gray-500">Evaluate resumes, get skill gap analysis, and personalized learning roadmaps</p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2">Smart Analysis</h3>
            <p className="text-sm text-gray-600">Get instant resume scores and match percentages</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-semibold text-lg mb-2">Skill Gap Analysis</h3>
            <p className="text-sm text-gray-600">Identify missing skills and areas for improvement</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <h3 className="font-semibold text-lg mb-2">Learning Roadmap</h3>
            <p className="text-sm text-gray-600">Personalized step-by-step career guidance</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Get Started</h2>
            <p className="text-gray-600">Choose your role to continue</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button 
              onClick={() => nav("/candidate")} 
              className="btn-primary flex-1 sm:flex-none min-w-[200px]"
            >
              👤 Login as Candidate
            </button>
            <button 
              onClick={() => nav('/hr')} 
              className="btn-secondary flex-1 sm:flex-none min-w-[200px]"
            >
              🏢 Login as HR / Organization
            </button>
          </div>
          <div className="text-center text-sm text-gray-600">
            New here? <Link to="/auth/signup" className="text-indigo-600 font-semibold hover:text-indigo-700">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
