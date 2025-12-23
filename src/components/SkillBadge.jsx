import React from "react"

export default function SkillBadge({skill, color="gray"}){
  const bg = color==="green"? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${bg} mr-2 mb-2`}>{skill}</span>
  )
}
