import React from "react";

export default function ProgressBar({value=0, max=100, height=8}){
  const pct = Math.max(0, Math.min(100, Math.round((value/max)*100)))
  const colorClass = pct >= 75 ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                   : pct >= 50 ? "bg-gradient-to-r from-yellow-400 to-orange-400" 
                   : "bg-gradient-to-r from-red-400 to-pink-400"
  
  return (
    <div className="w-full bg-gray-200 rounded-full overflow-hidden shadow-inner" style={{height}}>
      <div 
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass} shadow-sm`} 
        style={{width:`${pct}%`}}
      />
    </div>
  )
}
