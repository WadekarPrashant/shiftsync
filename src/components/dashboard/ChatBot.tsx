'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTED = [
  'How many visa hours do I have left?',
  'How much did I earn this month?',
  'Which job pays me the most?',
  'Am I on track for my goal?',
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm ShiftSync AI 👋 Ask me anything about your shifts, earnings, or visa hours." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = text ?? input.trim()
    if (!content || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages([...newMessages, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'API error')
      }

      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: data.reply }
        return updated
      })
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: `Error: ${err}` }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center text-2xl hover:opacity-90 transition-opacity"
        aria-label="Open AI chat"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: '520px' }}>
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <div className="font-semibold text-sm">ShiftSync AI</div>
              <div className="text-xs opacity-75">Powered by Llama 3.3</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  {m.content || <span className="opacity-50">▋</span>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions (only at start) */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1">
              {SUGGESTED.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-muted hover:bg-accent px-2 py-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your shifts..."
              disabled={loading}
              className="flex-1 text-sm bg-muted rounded-full px-3 py-2 outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}
