import React from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login(){
  const nav = useNavigate()
  return (
    <div className="max-w-md bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <div className="space-y-3">
        <input placeholder="Email" className="w-full border p-2 rounded" />
        <input placeholder="Password" type="password" className="w-full border p-2 rounded" />
        <div className="flex items-center justify-between">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded">Login</button>
          <Link to="/auth/signup" className="text-sm text-indigo-600">Create account</Link>
        </div>
      </div>
    </div>
  )
}
