import React from "react"
import SkillBadge from "./SkillBadge"
import ScoreBadge from "./ScoreBadge"

// Helper function to validate location
function isValidLocation(loc) {
  if (!loc || loc === 'Not specified' || loc === '—') return false
  const invalidLocations = [
    'c++', 'c#', 'java', 'python', 'javascript', 'html', 'css', 'react', 'node.js',
    'sql', 'mysql', 'mongodb', 'docker', 'kubernetes', 'git', 'github', 'linux',
    'scikit', 'numpy', 'pandas', 'tensorflow', 'pytorch', 'jupyter', 'flask',
    'django', 'express', 'angular', 'vue', 'typescript', 'rust', 'go', 'ruby',
    'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'bash', 'powershell',
    'aws', 'azure', 'gcp', 'api', 'apis', 'rest', 'graphql', 'json', 'xml',
    'calculus', 'algebra', 'statistics', 'algorithms', 'data structures',
    'machine learning', 'deep learning', 'ai', 'ml', 'nlp', 'computer vision'
  ]
  const locLower = loc.toLowerCase().trim()
  if (invalidLocations.includes(locLower)) return false
  if (locLower.length < 3) return false
  if (/^[\d\W]+$/.test(locLower)) return false
  return true
}

export default function CandidateCard({ candidate }) {
  const c = candidate
  const validLocation = isValidLocation(c.location) ? c.location : null
  const validExperience = c.experience > 0 && c.experience < 50 ? c.experience : null
  
  return (
    <div className="card hover:shadow-xl transition-all duration-300 border-l-4 border-l-indigo-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {c.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="font-bold text-lg text-gray-800">{c.name || 'Unknown'}</div>
              <div className="text-sm text-gray-500">{c.email || ''}</div>
              {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <ScoreBadge score={c.score || c.matchPercentage || 0} />
          <div className="text-xs text-gray-500 mt-1">Match: {c.matchPercentage || c.matchPercent || 0}%</div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm border-t pt-3 mb-3">
        <div>
          <span className="text-gray-500">📍 Location:</span>
          <span className="ml-1 font-medium">{validLocation || '—'}</span>
        </div>
        <div>
          <span className="text-gray-500">🏫 College:</span>
          <span className="ml-1 font-medium">{c.college || '—'}</span>
        </div>
        <div>
          <span className="text-gray-500">🎓 Branch:</span>
          <span className="ml-1 font-medium">{c.branch || c.degree || '—'}</span>
        </div>
        <div>
          <span className="text-gray-500">💼 Experience:</span>
          <span className="ml-1 font-medium">{validExperience ? `${validExperience} yrs` : '—'}</span>
        </div>
      </div>

      {/* Skills */}
      <div className="border-t pt-3">
        <div className="text-xs font-semibold text-gray-600 mb-2">Skills:</div>
        <div className="flex flex-wrap gap-2">
          {c.skills?.slice(0, 8).map((s, idx) => <SkillBadge key={`${s}-${idx}`} skill={s} />)}
          {c.skills?.length > 8 && (
            <span className="text-xs text-gray-500 px-2 py-1">+{c.skills.length - 8} more</span>
          )}
        </div>
      </div>

      {/* Internships if available */}
      {c.internships && c.internships.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">💼 Internships:</div>
          <div className="text-sm text-gray-700">
            {c.internships.slice(0, 3).map((intern, idx) => (
              <div key={idx} className="text-indigo-600">• {intern}</div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Links if available */}
      {c.portfolioLinks && c.portfolioLinks.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">🔗 Links:</div>
          <div className="flex flex-wrap gap-2">
            {c.portfolioLinks.slice(0, 3).map((link, idx) => (
              <a key={idx} href={link} target="_blank" rel="noopener noreferrer" 
                className="text-xs text-indigo-600 hover:underline bg-indigo-50 px-2 py-1 rounded">
                {link.includes('github') ? '📂 GitHub' : link.includes('linkedin') ? '💼 LinkedIn' : '🔗 Portfolio'}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
