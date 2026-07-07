import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Plus, Trash2, MessageSquare, BookOpen } from 'lucide-react'
import { useSendMessage, useChatSessions, useChatSession, useDeleteSession } from '@/hooks/useChat'
import { useDocuments } from '@/hooks/useDocuments'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import clsx from 'clsx'
import Spinner from '@/components/common/Spinner'
import EmptyState from '@/components/common/EmptyState'

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={clsx('flex gap-3 animate-slide-up', isUser && 'flex-row-reverse')}>
      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1', isUser ? 'bg-primary-700' : 'bg-emerald-700')}>
        {isUser ? <User className="w-4 h-4 text-primary-200" /> : <Bot className="w-4 h-4 text-emerald-200" />}
      </div>
      <div className={clsx('max-w-[80%] space-y-2', isUser && 'items-end flex flex-col')}>
        <div className={clsx('px-4 py-3 rounded-2xl text-sm leading-relaxed', isUser ? 'bg-primary-700 text-white rounded-tr-sm' : 'bg-surface-800 text-slate-200 rounded-tl-sm border border-slate-700/50')}>
          {msg.content}
        </div>
        {msg.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.sources.slice(0, 3).map((s, i) => (
              <span key={i} className="text-xs bg-surface-900 border border-slate-700 rounded-full px-2 py-0.5 text-slate-400">
                p.{s.page_number || '?'} · {Math.round(s.score * 100)}% match
              </span>
            ))}
          </div>
        )}
        {msg.confidence != null && (
          <span className="text-xs text-slate-600">Confidence: {Math.round(msg.confidence * 100)}%</span>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(() => uuidv4())
  const [messages, setMessages] = useState([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const messagesEndRef = useRef(null)

  const { mutate: sendMsg, isPending } = useSendMessage()
  const { data: sessionsData } = useChatSessions()
  const { data: docsData } = useDocuments({ status: 'ready' })
  const { mutate: deleteSession } = useDeleteSession()

  const sessions = sessionsData?.sessions || []
  const documents = docsData?.documents || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isPending) return

    const userMsg = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    sendMsg(
      { message: trimmed, sessionId, documentId: selectedDocId || undefined },
      {
        onSuccess: ({ data }) => {
          const { answer, sources, confidence } = data.data
          setMessages((prev) => [...prev, { role: 'assistant', content: answer, sources, confidence }])
        },
        onError: () => {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
        },
      }
    )
  }

  const startNewChat = () => {
    setSessionId(uuidv4())
    setMessages([])
    setInput('')
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 animate-slide-up">
      {/* Sidebar */}
      <div className="hidden lg:flex w-64 flex-col gap-3">
        <button onClick={startNewChat} className="btn-primary flex items-center gap-2 text-sm w-full">
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        {/* Document filter */}
        <div>
          <label className="label text-xs">Filter by document</label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="input text-xs"
          >
            <option value="">All documents</option>
            {documents.map((d) => (
              <option key={d._id} value={d._id}>{d.title}</option>
            ))}
          </select>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 pb-1">Recent</p>
          {sessions.map((s) => (
            <div key={s.sessionId} className="flex items-center gap-2 group">
              <button
                onClick={() => { setSessionId(s.sessionId); setMessages([]) }}
                className={clsx('flex-1 text-left px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-surface-800 hover:text-white transition-all truncate', sessionId === s.sessionId && 'bg-surface-800 text-white')}
              >
                {s.title || 'Untitled Chat'}
              </button>
              <button
                onClick={() => deleteSession(s.sessionId)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col card p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-white text-sm">AI Study Assistant</span>
            {selectedDocId && (
              <span className="badge badge-info text-xs">
                <BookOpen className="w-3 h-3" />
                Filtered
              </span>
            )}
          </div>
          <button onClick={startNewChat} className="btn-ghost text-xs flex items-center gap-1.5 lg:hidden">
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Start a conversation"
              description="Ask questions about your documents. I'll use RAG to give grounded answers with source citations."
            />
          ) : (
            messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
          )}
          {isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="bg-surface-800 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-slate-400">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask a question about your documents…"
              className="input flex-1"
              disabled={isPending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isPending}
              className="btn-primary px-4 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
