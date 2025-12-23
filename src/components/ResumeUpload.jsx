import React, { useState } from 'react'
import { postForm } from '../api'

export default function ResumeUpload({ single=true, onUploaded, currentJob, filters }){
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  function handleSelect(e){
    const f = Array.from(e.target.files || [])
    setFiles(f)
  }

  async function handleSubmit(){
    if(files.length===0) return;
    const fd = new FormData()
    files.forEach(file=> fd.append('resumes', file))
    if(currentJob && currentJob.id) fd.append('jobId', currentJob.id)
    // attach filters
    if(filters){
      if(filters.skill) fd.append('skill', filters.skill)
      if(filters.location) fd.append('location', filters.location)
      if(filters.college) fd.append('college', filters.college)
      if(filters.experience) fd.append('experience', filters.experience)
      if(filters.minMatch) fd.append('minMatchPercentage', filters.minMatch)
    }
    setLoading(true)
    try{
      const res = await postForm('/hr/resumes', fd)
      setLoading(false)
      if(onUploaded) onUploaded(res)
    }catch(e){
      setLoading(false)
      console.error('upload error', e)
      if(onUploaded) onUploaded({ error: String(e) })
    }
  }

  return (
    <div>
      <input type="file" multiple={!single} accept=".pdf,.docx,.doc" onChange={handleSelect} />
      <div className="mt-2 flex gap-2">
        <button onClick={handleSubmit} disabled={loading || files.length===0} className="px-3 py-1 bg-indigo-600 text-white rounded">Submit to ML</button>
        <button onClick={()=>setFiles([])} disabled={loading || files.length===0} className="px-3 py-1 bg-gray-200 rounded">Clear</button>
      </div>
      {loading && <div className="text-sm text-gray-500 mt-2">Uploading & analyzing...</div>}
      {files.length>0 && <div className="text-xs text-gray-600 mt-2">Selected: {files.map(f=>f.name).join(', ')}</div>}
    </div>
  )
}
