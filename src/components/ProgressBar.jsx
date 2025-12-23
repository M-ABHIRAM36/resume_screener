import React from "react";

export default function ProgressBar({value=0, max=100, height=8}){
  const pct = Math.max(0, Math.min(100, Math.round((value/max)*100)))
  return (
    <div className="w-full bg-gray-200 rounded" style={{height}}>
      <div className="bg-green-500 h-full rounded" style={{width:`${pct}%`}} />
    </div>
  )
}
