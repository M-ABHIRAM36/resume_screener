import React, { useState, useEffect, useRef } from 'react'
import { get, post, del } from '../../api'
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

  async function deleteSession(id) {
    if (!window.confirm('Delete this chat session?')) return
    try {
      await del(`/api/chat/roadmap/session/${id}`)
      setHistory(prev => prev.filter(h => h._id !== id))
      if (sessionId === id) {
        setSessionId(null)
        setMessages([])
        setActiveRoleName('')
      }
    } catch (e) {
      console.error('Failed to delete session:', e)
    }
  }

  async function deleteAllSessions() {
    if (!window.confirm('Delete ALL roadmap chat history? This cannot be undone.')) return
    try {
      await del('/api/chat/roadmap/history')
      setHistory([])
      setSessionId(null)
      setMessages([])
      setActiveRoleName('')
    } catch (e) {
      console.error('Failed to delete history:', e)
    }
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

  function renderInline(line) {
    const source = String(line || '')

    function isSafeUrl(url) {
      try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        return false
      }
    }

    function renderBold(text, keyPrefix) {
      const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
      return parts.map((part, idx) => {
        const isBold = /^\*\*[^*]+\*\*$/.test(part)
        if (isBold) return <strong key={`${keyPrefix}-b-${idx}`}>{part.slice(2, -2)}</strong>
        return <React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>
      })
    }

    function renderTextWithUrls(text, keyPrefix) {
      const urlParts = String(text).split(/(https?:\/\/[^\s)]+)/g)
      return urlParts.flatMap((part, idx) => {
        const isUrl = /^https?:\/\//.test(part) && isSafeUrl(part)
        if (isUrl) {
          return [
            <a
              key={`${keyPrefix}-u-${idx}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-700 underline hover:text-indigo-800"
            >
              {part}
            </a>
          ]
        }
        return renderBold(part, `${keyPrefix}-p-${idx}`)
      })
    }

    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
    const nodes = []
    let lastIndex = 0
    let match
    let index = 0

    while ((match = markdownLinkRegex.exec(source)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(...renderTextWithUrls(source.slice(lastIndex, match.index), `m-${index}`))
      }

      const label = match[1]
      const href = match[2]
      if (isSafeUrl(href)) {
        nodes.push(
          <a
            key={`md-link-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-700 underline hover:text-indigo-800"
          >
            {label}
          </a>
        )
      } else {
        nodes.push(...renderBold(match[0], `unsafe-${index}`))
      }

      lastIndex = markdownLinkRegex.lastIndex
      index += 1
    }

    if (lastIndex < source.length) {
      nodes.push(...renderTextWithUrls(source.slice(lastIndex), 'tail'))
    }

    return nodes.length ? nodes : renderBold(source, 'fallback')
  }

  function renderAssistantText(text) {
    const lines = String(text || '').split('\n')
    const blocks = []
    let listItems = []

    const flushList = () => {
      if (!listItems.length) return
      blocks.push(
        <ul key={`list-${blocks.length}`} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      )
      listItems = []
    }

    lines.forEach((raw, idx) => {
      const line = raw.trimEnd()
      if (!line.trim()) {
        flushList()
        blocks.push(<div key={`sp-${idx}`} className="h-2" />)
        return
      }

      const bullet = line.match(/^\s*[*-]\s+(.*)$/)
      if (bullet) {
        listItems.push(bullet[1])
        return
      }

      flushList()

      if (line.startsWith('### ')) {
        blocks.push(
          <h4 key={`h3-${idx}`} className="font-semibold text-slate-900 mt-1 mb-1">
            {renderInline(line.slice(4))}
          </h4>
        )
        return
      }

      if (line.startsWith('## ')) {
        blocks.push(
          <h3 key={`h2-${idx}`} className="font-bold text-slate-900 mt-1 mb-1">
            {renderInline(line.slice(3))}
          </h3>
        )
        return
      }

      blocks.push(
        <p key={`p-${idx}`} className="my-0.5 text-slate-900">
          {renderInline(line)}
        </p>
      )
    })

    flushList()
    return blocks
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
            <div className="p-4 bg-gray-50 rounded-t-2xl flex items-center justify-between">
              <h2 className="font-semibold text-gray-700 text-sm">Previous Sessions</h2>
              {history.length > 0 && (
                <button onClick={deleteAllSessions} className="text-xs text-gray-400 hover:text-rose-500 flex items-center gap-1 transition-colors" title="Delete all history">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Clear All
                </button>
              )}
            </div>
            {history.map(s => (
              <div key={s._id} className="group flex items-center justify-between px-5 py-4 hover:bg-indigo-50 transition-colors">
                <button onClick={() => loadSession(s._id)} className="flex-1 text-left">
                  <span className="font-medium text-gray-800 text-sm">
                    {s.roadmapRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{formatDate(s.createdAt)}</span>
                  <button
                    onClick={() => deleteSession(s._id)}
                    className="p-1 rounded text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete session"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
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
                : 'bg-slate-100 text-slate-900 border border-slate-300 shadow-sm rounded-bl-md'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AI Assistant</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">
                {msg.role === 'assistant' ? renderAssistantText(msg.text) : msg.text}
              </div>
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
