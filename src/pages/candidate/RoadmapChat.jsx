import React, { useState, useEffect, useRef } from 'react'
import { get, post } from '../../api'
import { useNavigate } from 'react-router-dom'

export default function RoadmapChat() {
  const [roles, setRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [activeRoleName, setActiveRoleName] = useState('')
  const bottomRef = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    loadRoles()
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadRoles() {
    try {
      const res = await get('/api/chat/roadmap/roles')
      if (res.roles) setRoles(res.roles)
    } catch (e) {
      console.error('Failed to load roles:', e)
    }
  }

  async function loadHistory() {
    try {
      const res = await get('/api/chat/roadmap/history')
      if (res.sessions) setHistory(res.sessions)
    } catch (e) {
      console.error('Failed to load history:', e)
    }
  }

  async function startSession() {
    if (!selectedRole) return
    setLoading(true)
    try {
      const res = await post('/api/chat/roadmap/start', { roadmapRole: selectedRole })
      if (res.success && res.session) {
        setSessionId(res.session._id)
        setMessages(res.session.messages || [])
        const role = roles.find(r => r.slug === selectedRole)
        setActiveRoleName(role?.name || selectedRole)
        loadHistory()
      }
    } catch (e) {
      console.error('Failed to start session:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadSession(id) {
    setLoading(true)
    try {
      const res = await get(`/api/chat/roadmap/session/${id}`)
      if (res.success && res.session) {
        setSessionId(res.session._id)
        setMessages(res.session.messages || [])
        const slug = res.session.roadmapRole
        const role = roles.find(r => r.slug === slug)
        setActiveRoleName(role?.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
        setShowHistory(false)
      }
    } catch (e) {
      console.error('Failed to load session:', e)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || !sessionId || sending) return
    const text = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setSending(true)
    try {
      const res = await post('/api/chat/roadmap/message', { sessionId, text })
      if (res.success && res.message) {
        setMessages(prev => [...prev, res.message])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setSending(false)
    }
  }

  function newSession() {
    setSessionId(null)
    setMessages([])
    setActiveRoleName('')
    setSelectedRole('')
  }

  function formatDate(d) {
    const date = new Date(d)
    const now = new Date()
    const diff = now - date
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  const quickPrompts = [
    'What should I learn first?',
    'What projects should I build?',
    'How long will this roadmap take?',
    'What are the best free resources?'
  ]

  // Role selection view
  if (!sessionId) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Roadmap Learning Assistant</h1>
            <p className="text-gray-500 text-sm mt-1">Choose a role and ask AI for personalized learning guidance</p>
          </div>
          <div className="flex gap-2">
            {history.length > 0 && (
              <button onClick={() => setShowHistory(!showHistory)} className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors">
                {showHistory ? 'Choose Role' : `History (${history.length})`}
              </button>
            )}
            <button onClick={() => nav('/candidate')} className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors">
              ← Dashboard
            </button>
          </div>
        </div>

        {showHistory ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            <div className="p-4 bg-gray-50 rounded-t-2xl">
              <h2 className="font-semibold text-gray-700 text-sm">Previous Sessions</h2>
            </div>
            {history.map(s => (
              <button key={s._id} onClick={() => loadSession(s._id)} className="w-full text-left px-5 py-4 hover:bg-indigo-50 transition-colors flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-800 text-sm">
                    {s.roadmapRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(s.createdAt)}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Role grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {roles.map(r => (
                <button
                  key={r.slug}
                  onClick={() => setSelectedRole(r.slug)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    selectedRole === r.slug
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  {r.hasKnowledge && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full" title="Detailed roadmap available"></span>
                  )}
                  <div className="text-sm font-semibold text-gray-800 truncate">{r.name}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{r.slug}</div>
                </button>
              ))}
            </div>

            {selectedRole && (
              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={startSession}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  {loading ? 'Starting...' : `Start Chat — ${roles.find(r => r.slug === selectedRole)?.name || selectedRole}`}
                </button>
                {roles.find(r => r.slug === selectedRole)?.image && (
                  <span className="text-xs text-gray-400">Roadmap image available</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // Chat view
  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-t-2xl border border-gray-100 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={newSession} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">{activeRoleName} Roadmap</h2>
            <p className="text-[11px] text-gray-400">Learning Assistant</p>
          </div>
        </div>
        <div className="flex gap-2">
          {roles.find(r => r.slug === (messages.length ? selectedRole || '' : ''))?.image && (
            <button
              onClick={() => {
                const role = roles.find(r => r.name === activeRoleName) || roles.find(r => r.slug === selectedRole)
                if (role?.image) window.open(role.image, '_blank')
              }}
              className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
            >
              View Roadmap Image
            </button>
          )}
          <button onClick={newSession} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            New Session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 border-x border-gray-100 px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-md'
                : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="bg-gray-50 border-x border-gray-100 px-5 pb-3">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => { setInput(p); }}
                className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 bg-white border border-gray-100 rounded-b-2xl px-4 py-3 shadow-sm">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about this learning roadmap..."
          className="flex-1 text-sm border-0 outline-none bg-transparent placeholder-gray-400"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}
