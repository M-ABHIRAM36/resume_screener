import React from "react"

export default function RoadmapTimeline({steps, completed=[]}){
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      <div className="space-y-4">
        {steps.map((s,i)=>{
          const done = completed.includes(i)
          return (
            <div key={i} className="relative flex items-start pl-8">
              {/* Circle indicator */}
              <div className={`absolute left-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                done 
                  ? "bg-green-500 border-green-600 shadow-lg" 
                  : "bg-white border-gray-300"
              }`}>
                {done && <span className="text-white text-xs">✓</span>}
              </div>
              
              
              {/* Content */}
              <div className={`flex-1 p-4 rounded-lg border-2 transition-all duration-300 ${
                done 
                  ? "bg-green-50 border-green-200 shadow-sm" 
                  : "bg-gray-50 border-gray-200"
              }`}>
                <div className={`font-semibold text-lg mb-1 ${
                  done ? "text-green-800" : "text-gray-700"
                }`}>
                  Step {i + 1}
                </div>
                <div className={`text-sm ${done ? "text-green-700" : "text-gray-600"}`}>
                  {s}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
