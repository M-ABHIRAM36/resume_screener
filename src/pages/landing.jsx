import React from "react"
import { useNavigate, Link } from "react-router-dom"

export default function Landing(){
  const nav = useNavigate()
  return (
    <div className="py-16">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-2">Resume Screening & Career Guidance</h1>
        <p className="text-gray-600 mb-6">Evaluate resumes, get skill gap analysis and personalized roadmaps. Role-based UI for Candidates and HR.</p>
        <div className="space-x-3 mb-4">
          <button onClick={() => nav("/candidate")} className="px-4 py-2 bg-indigo-600 text-white rounded">Login as Candidate</button>
          <button onClick={() => nav('/hr')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Login as HR / Organization</button>
        </div>
        <div className="text-sm text-gray-600">New here? <Link to="/auth/signup" className="text-indigo-600">Create an account</Link></div>
      </div>
    </div>
  )
}
