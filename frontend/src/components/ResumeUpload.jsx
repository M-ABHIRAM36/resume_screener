import React, { useState } from 'react'
import { post } from '../api'

export default function ResumeUpload({ single = false, currentJob, filters, onUploaded, onFilesChange, hideSubmitButton = false }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  function handleFiles(newFiles) {
    const validFiles = Array.from(newFiles).filter(f => 
      f.type === 'application/pdf' || 
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      f.name.endsWith('.pdf') || 
      f.name.endsWith('.docx')
    )
    
    const updatedFiles = single ? validFiles.slice(0, 1) : [...files, ...validFiles]
    setFiles(updatedFiles)
    
    if (onFilesChange) {
      onFilesChange(updatedFiles)
    }
  }

  function removeFile(index) {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    
    if (onFilesChange) {
      onFilesChange(updatedFiles)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  async function handleSubmit() {
    if (files.length === 0) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('resumes', f))
      if (currentJob?.id) formData.append('jobId', currentJob.id)
      if (filters?.skill) formData.append('skill', filters.skill)
      if (filters?.location) formData.append('location', filters.location)
      
      const res = await post('/hr/resumes', formData, true)
      
      if (onUploaded) {
        onUploaded(res)
      }
      
      // Clear files after successful upload
      setFiles([])
      if (onFilesChange) {
        onFilesChange([])
      }
    } catch (e) {
      console.error('Upload error:', e)
      if (onUploaded) {
        onUploaded({ error: e.message })
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
        }`}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          multiple={!single}
          accept=".pdf,.docx"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="text-4xl mb-2">📄</div>
        <p className="text-gray-600 font-medium">
          {single ? 'Drop your resume here' : 'Drop resumes here'}
        </p>
        <p className="text-sm text-gray-500 mt-1">or click to browse (PDF, DOCX)</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                <span className="text-sm text-gray-700 truncate flex-1">{f.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="text-red-500 hover:text-red-700 ml-2 text-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button - only show if hideSubmitButton is false */}
      {!hideSubmitButton && files.length > 0 && (
        <button 
          onClick={handleSubmit} 
          disabled={uploading}
          className="btn-primary w-full"
        >
          {uploading ? '⏳ Processing...' : '📤 Submit to ML'}
        </button>
      )}
    </div>
  )
}
