import React, { useState, useRef, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { post, get, del } from "../../api"

export default function ResumeChat() {
  const { state } = useLocation()
  const nav = useNavigate()
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [activeJobRole, setActiveJobRole] = useState("")
  const [activeScore, setActiveScore] = useState(0)
  const [activeMatch, setActiveMatch] = useState(0)
  const bottomRef = useRef(null)

  const jobRole = state?.jobRole || state?.job?.name || "General"
  const score = state?.score ?? 0
  const matchPercentage = state?.matchPercent ?? state?.matchPercentage ?? 0
  const skills = state?.candidateSkills || state?.skills || []
  const missingSkills = state?.missingSkills || []

  useEffect(() => {
    loadHistory()
    if (state) {
      startNewSession()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function loadHistory() {
    try {
      const res = await get("/chat/resume/history")
      if (res.success) setHistory(res.sessions || [])
    } catch {}
  }

  async function startNewSession() {
    setStarting(true)
    setError("")
    setMessages([])
    setSessionId(null)
    setActiveJobRole(jobRole)
    setActiveScore(score)
    setActiveMatch(matchPercentage)
    try {
      const res = await post("/chat/resume/start", {
        jobRole, score, matchPercentage, skills, missingSkills
      })
      if (res.success && res.session) {
        setSessionId(res.session._id)
        setMessages(res.session.messages || [])
        loadHistory()
      } else {
        setError("Failed to start chat session")
      }
    } catch (e) {
      setError(e.message || "Failed to start chat session")
    } finally {
      setStarting(false)
    }
  }

  async function loadSession(id) {
    setStarting(true)
    setError("")
    setMessages([])
    setShowHistory(false)
    try {
      const res = await get(`/chat/resume/session/${id}`)
      if (res.success && res.session) {
        setSessionId(res.session._id)
        setMessages(res.session.messages || [])
        setActiveJobRole(res.session.jobRole || "General")
        setActiveScore(res.session.score || 0)
        setActiveMatch(res.session.matchPercentage || 0)
      } else {
        setError("Failed to load chat session")
      }
    } catch (e) {
      setError(e.message || "Failed to load chat session")
    } finally {
      setStarting(false)
    }
  }

  async function deleteSession(id) {
    if (!window.confirm("Delete this chat session?")) return
    try {
      await del(`/chat/resume/session/${id}`)
      setHistory(prev => prev.filter(h => h._id !== id))
      if (sessionId === id) {
        setSessionId(null)
        setMessages([])
      }
    } catch (e) {
      setError(e.message || "Failed to delete session")
    }
  }

  async function deleteAllSessions() {
    if (!window.confirm("Delete ALL chat history? This cannot be undone.")) return
    try {
      await del("/chat/resume/history")
      setHistory([])
      setSessionId(null)
      setMessages([])
    } catch (e) {
      setError(e.message || "Failed to delete history")
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !sessionId || loading) return

    setInput("")
    setMessages(prev => [...prev, { role: "user", text }])
    setLoading(true)
    setError("")

    try {
      const res = await post("/chat/resume/message", { sessionId, text })
      if (res.success && res.message) {
        setMessages(prev => [...prev, res.message])
      } else {
        setError("Failed to get response")
      }
    } catch (e) {
      setError(e.message || "Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  function formatDate(d) {
    const dt = new Date(d)
    const now = new Date()
    const diff = now - dt
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  function renderInline(line) {
    const source = String(line || "")

    function isSafeUrl(url) {
      try {
        const parsed = new URL(url)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
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
      nodes.push(...renderTextWithUrls(source.slice(lastIndex), "tail"))
    }

    return nodes.length ? nodes : renderBold(source, "fallback")
  }

  function renderAssistantText(text) {
    const lines = String(text || "").split("\n")
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

      if (line.startsWith("### ")) {
        blocks.push(
          <h4 key={`h3-${idx}`} className="font-semibold text-slate-900 mt-1 mb-1">
            {renderInline(line.slice(4))}
          </h4>
        )
        return
      }

      if (line.startsWith("## ")) {
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

  return (
    <div className="max-w-5xl mx-auto py-6 flex gap-4" style={{ height: "calc(100vh - 140px)" }}>
      {/* History Sidebar */}
      <div className={`${showHistory ? "block" : "hidden"} md:block w-72 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Chat History</h3>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button onClick={deleteAllSessions} title="Delete all chats" className="text-gray-400 hover:text-rose-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
              <button onClick={() => setShowHistory(false)} className="md:hidden text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          {state && (
            <button
              onClick={startNewSession}
              disabled={starting}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Chat
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {history.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">No previous chats</p>
          )}
          {history.map(h => (
            <div
              key={h._id}
              className={`group w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                sessionId === h._id
                  ? "bg-indigo-50 border border-indigo-200"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <button onClick={() => loadSession(h._id)} className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold truncate ${sessionId === h._id ? "text-indigo-700" : "text-gray-700"}`}>
                      {h.jobRole || "General"}
                    </span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{formatDate(h.createdAt)}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Score: {h.score}/100 · Match: {h.matchPercentage}%
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(h._id); }}
                  className="ml-2 p-1 rounded text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete chat"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowHistory(!showHistory)} className="md:hidden w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Resume Chat Assistant</h2>
                <p className="text-xs text-gray-500">
                  {sessionId ? (
                    <>
                      <span className="font-semibold text-indigo-600">{activeJobRole}</span>
                      <span className="ml-2 text-gray-400">Score: {activeScore}/100 · Match: {activeMatch}%</span>
                    </>
                  ) : "Select a chat or start a new one"}
                </p>
              </div>
            </div>
            <button onClick={() => nav(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 space-y-4">
          {!sessionId && !starting && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm font-medium">No active chat</p>
              <p className="text-xs mt-1">Select a previous conversation from the sidebar or analyze a resume to start a new chat.</p>
            </div>
          )}

          {starting && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-500">
                <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading chat...
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-slate-100 text-slate-900 border border-slate-300 rounded-bl-md"
              }`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AI Assistant</span>
                  </div>
                )}
                {msg.role === "assistant" ? renderAssistantText(msg.text) : msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-2.5 mb-3">
            {error}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={sessionId ? "Ask about your resume, skills, interview tips..." : "Select or start a chat first"}
            disabled={!sessionId || starting || loading}
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || !sessionId || starting || loading}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        {/* Quick prompts */}
        {sessionId && messages.length <= 1 && !starting && (
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              "How can I improve my resume score?",
              "What skills should I learn first?",
              "Help me write a better summary",
              "Interview tips for this role"
            ].map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
