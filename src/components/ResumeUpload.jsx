import React from "react"

export default function ResumeUpload({single}){
  return (
    <div className="border-dashed border-2 border-gray-200 rounded p-4 max-w-md">
      <label className="block text-sm text-gray-700 mb-2">Upload Resume {single? "(single file)":"(multiple)"}</label>
      <input type="file" accept=".pdf,.doc,.docx" multiple={!single} className="" />
    </div>
  )
}
