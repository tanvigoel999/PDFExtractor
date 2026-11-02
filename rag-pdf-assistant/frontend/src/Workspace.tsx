import { useRef, useState, type FormEvent } from 'react'
import './Workspace.css'

type Source = { text: string; source: string; score: number }
type Message = { id: string; role: 'user' | 'assistant'; text: string; sources?: Source[] }
type DocumentInfo = { filename: string; chunks: number }

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const suggestions = [
  'What are the main takeaways?',
  'Find the key dates and deadlines',
  'Summarize this document in plain language',
]

function App() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  async function uploadFile(file?: File) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setNotice('Choose a PDF file to add it to this workspace.')
      return
    }

    setBusy(true)
    setNotice('Reading your document...')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch(`${apiUrl}/documents`, { method: 'POST', body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail ?? 'The PDF could not be uploaded.')
      setDocuments((current) => [...current, result as DocumentInfo])
      setNotice(`${file.name} is ready to search.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not connect to the PDF service.')
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prompt = question.trim()
    if (!prompt || busy) return
    if (documents.length === 0) {
      setNotice('Add a PDF before asking a question.')
      return
    }

    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: prompt }])
    setQuestion('')
    setBusy(true)
    setNotice('')
    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail ?? 'The question could not be answered.')
      setMessages((current) => [...current, {
        id: crypto.randomUUID(), role: 'assistant', text: result.answer, sources: result.sources,
      }])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not connect to the PDF service.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#workspace" aria-label="Folio home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>folio<span className="wordmark-dot">.</span></span>
        </a>
        <div className="topbar-meta">
          <span className="topbar-label">PDF RESEARCH DESK</span>
          <span className="connection"><span /> Local workspace</span>
        </div>
      </header>

      <div className="workspace" id="workspace">
        <aside className="library-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">YOUR LIBRARY</p><h1>Documents</h1></div>
            <span className="document-count">{documents.length.toString().padStart(2, '0')}</span>
          </div>
          <button className="upload-zone" type="button" onClick={() => fileInput.current?.click()} disabled={busy}>
            <span className="upload-symbol" aria-hidden="true">+</span>
            <span className="upload-copy"><strong>Add a PDF</strong><small>Choose a file from your device</small></span>
            <span className="upload-arrow" aria-hidden="true">↗</span>
          </button>
          <input ref={fileInput} className="visually-hidden" type="file" accept="application/pdf,.pdf"
            onChange={(event) => uploadFile(event.target.files?.[0])} />
          <div className="library-list" aria-live="polite">
            {documents.length === 0 ? <p className="empty-library">Your source files will appear here.</p> : documents.map((document, index) => (
              <div className="document-row" key={`${document.filename}-${index}`}>
                <span className="pdf-badge">PDF</span>
                <span className="document-info"><strong title={document.filename}>{document.filename}</strong><small>{document.chunks} passages indexed</small></span>
                <span className="ready-dot" aria-label="Ready" />
              </div>
            ))}
          </div>
          <div className="library-footer"><span className="footer-rule" /><p>Files stay in this session and are cleared when the API restarts.</p></div>
        </aside>

        <section className="conversation-panel" aria-label="Document conversation">
          <div className="conversation-header">
            <div><p className="eyebrow">READ BETWEEN THE LINES</p><h2>Ask your documents<span className="heading-period">.</span></h2></div>
            <div className="session-tag"><span className="session-dot" /> PRIVATE SESSION</div>
          </div>
          <div className="conversation-body" aria-live="polite">
            {messages.length === 0 ? (
              <div className="welcome-state">
                <div className="welcome-index">01 <span /> START HERE</div>
                <p className="welcome-title">A clearer way<br />through the <em>fine print.</em></p>
                <p className="welcome-description">Add a PDF, then ask a question. Answers are grounded in passages from your files.</p>
                {documents.length > 0 && <div className="suggestion-group">
                  <p className="eyebrow">A FEW PLACES TO BEGIN</p>
                  {suggestions.map((suggestion, index) => <button className="suggestion" key={suggestion} type="button" onClick={() => setQuestion(suggestion)}>
                    <span>0{index + 1}</span>{suggestion}<b aria-hidden="true">↗</b>
                  </button>)}
                </div>}
              </div>
            ) : <div className="message-list">
              {messages.map((message) => <article className={`message message-${message.role}`} key={message.id}>
                <p className="message-label">{message.role === 'user' ? 'YOU ASKED' : 'FOLIO ANSWER'}</p>
                <p className="message-text">{message.text}</p>
                {message.sources && message.sources.length > 0 && <details className="source-list">
                  <summary>{message.sources.length} source passages</summary>
                  {message.sources.map((source, index) => <blockquote key={`${source.source}-${index}`}>
                    <span>{source.source}</span><p>{source.text}</p>
                  </blockquote>)}
                </details>}
              </article>)}
              {busy && <p className="thinking"><span /> Searching your documents...</p>}
            </div>}
          </div>
          <div className="composer-wrap">
            {notice && <p className="notice" role="status">{notice}</p>}
            <form className="composer" onSubmit={askQuestion}>
              <label className="visually-hidden" htmlFor="question">Ask a question about your PDFs</label>
              <input id="question" value={question} onChange={(event) => setQuestion(event.target.value)}
                placeholder={documents.length ? 'Ask something specific...' : 'Add a PDF to begin'}
                disabled={documents.length === 0 || busy} />
              <button type="submit" disabled={!question.trim() || documents.length === 0 || busy} aria-label="Send question">
                <span>ASK</span><b aria-hidden="true">↗</b>
              </button>
            </form>
            <p className="composer-hint">Answers are based on your uploaded files, not the open web.</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App