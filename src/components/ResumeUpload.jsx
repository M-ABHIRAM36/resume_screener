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
    
    // Send job data - both ID and full job object
    if(currentJob){
      if(currentJob.id) fd.append('jobId', currentJob.id)
      // Send full job data as JSON string so backend can use it if jobId not found
      const jobDescription = currentJob.description 
        || (currentJob.roadmapSteps && currentJob.roadmapSteps.length > 0 
          ? currentJob.roadmapSteps.join('. ') 
          : currentJob.name)
      fd.append('jobData', JSON.stringify({
        name: currentJob.name,
        requiredSkills: currentJob.requiredSkills || [],
        description: jobDescription,
        location: currentJob.location || ''
      }))
    } else {
      console.warn('No job selected! Please select a job role before uploading resumes.');
      alert('Please select a job role first!');
      setLoading(false);
      return;
    }
    
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
      console.log('Upload response:', res)
      if(onUploaded) {
        if(res && res.analyzed && Array.isArray(res.analyzed)){
          onUploaded(res)
        } else if(res && res.error){
          console.error('Backend error:', res.error)
          alert('Error: ' + res.error)
        } else {
          console.warn('Unexpected response format:', res)
          alert('Unexpected response from server. Check console for details.')
        }
      }
    }catch(e){
      setLoading(false)
      console.error('upload error', e)
      alert('Upload failed: ' + (e.message || String(e)))
      if(onUploaded) onUploaded({ error: String(e), analyzed: [] })
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <input 
          type="file" 
          multiple={!single} 
          accept=".pdf,.docx,.doc" 
          onChange={handleSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
        />
      </div>
      {files.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-1">Selected Files ({files.length}):</div>
          <div className="text-xs text-gray-600 space-y-1">
            {files.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span>📄</span>
                <span className="truncate">{f.name}</span>
                <span className="text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button 
          onClick={handleSubmit} 
          disabled={loading || files.length===0 || !currentJob} 
          className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Processing...' : '🚀 Submit to ML'}
        </button>
        <button 
          onClick={()=>setFiles([])} 
          disabled={loading || files.length===0} 
          className="btn-secondary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
      {!currentJob && (
        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
          ⚠️ Please select a job role first before uploading resumes.
        </div>
      )}
      {loading && (
        <div className="text-sm text-indigo-600 bg-indigo-50 p-2 rounded border border-indigo-200 flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          <span>Uploading & analyzing resumes with ML service...</span>
        </div>
      )}
    </div>
  )
}
