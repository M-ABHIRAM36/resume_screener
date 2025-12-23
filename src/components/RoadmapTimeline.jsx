import React from "react"

export default function RoadmapTimeline({steps, completed=[]}){
  return (
    <div className="space-y-3">
      {steps.map((s,i)=>{
        const done = completed.includes(i)
        return (
          <div key={i} className="flex items-start">
            <div className={`w-3 h-3 mt-1 rounded-full ${done? "bg-green-500":"bg-gray-300"}`} />
            <div className="ml-3">
              <div className={`font-medium ${done? "text-gray-800":"text-gray-600"}`}>{s}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
