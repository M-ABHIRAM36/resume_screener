import React, { useState } from 'react'
import { postForm } from '../api'

export default function ResumeUpload({ single=true, onUploaded }){
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleFiles(e){
    const f = Array.from(e.target.files || [])
    setFiles(f)
    if(f.length===0) return
    const fd = new FormData()
    f.forEach(file=> fd.append('resumes', file))
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
      <input type="file" multiple={!single} accept=".pdf,.docx,.doc" onChange={handleFiles} />
      {loading && <div className="text-sm text-gray-500 mt-2">Uploading...</div>}
      {files.length>0 && <div className="text-xs text-gray-600 mt-2">Selected: {files.map(f=>f.name).join(', ')}</div>}
    </div>
  )
}
