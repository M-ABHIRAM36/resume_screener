import React from "react";
import { useNavigate } from "react-router-dom";

export default function RoleSelect(){
  const nav = useNavigate()
  return (
    <div className="max-w-md bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Select Role</h2>
      <div className="space-x-3">
        <button onClick={()=>nav('/candidate')} className="px-4 py-2 bg-indigo-600 text-white rounded">Candidate</button>
        <button onClick={()=>nav('/hr')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">HR / Organization</button>
      </div>
    </div>
  )
}
