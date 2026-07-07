import { useState, useRef } from 'react'
import { FileText, Upload, Trash2, Eye, Sparkles, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react'
import { useDocuments, useUploadDocument, useDeleteDocument, useSummarize } from '@/hooks/useDocuments'
import { InlineLoader } from '@/components/common/Spinner'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

function StatusBadge({ status }) {
  const map = {
    ready: { cls: 'badge-success', icon: CheckCircle, label: 'Ready' },
    processing: { cls: 'badge-warning', icon: Clock, label: 'Processing' },
    error: { cls: 'badge-error', icon: AlertCircle, label: 'Error' },
    uploading: { cls: 'badge-info', icon: Clock, label: 'Uploading' },
  }
  const { cls, icon: Icon, label } = map[status] || map.uploading
  return (
    <span className={`badge ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

function UploadModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()
  const { mutate: upload, isPending } = useUploadDocument()

  const handleFile = (f) => {
    if (f?.type === 'application/pdf') {
      setFile(f)
      if (!title) setTitle(f.name.replace('.pdf', ''))
    }
  }

  const handleSubmit = () => {
    if (!file) return
    const fd = new FormData()
    fd.append('pdf', file)
    fd.append('title', title || file.name)
    fd.append('subject', subject)
    upload(fd, { onSuccess: () => { onClose(); setFile(null); setTitle(''); setSubject('') } })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload PDF Document">
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          className={clsx(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
            dragging ? 'border-primary-500 bg-primary-500/10' : 'border-slate-700 hover:border-primary-600 hover:bg-surface-900/50'
          )}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          {file ? (
            <div>
              <FileText className="w-10 h-10 text-primary-400 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">{file.name}</p>
              <p className="text-slate-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 font-medium text-sm">Drop PDF here or click to browse</p>
              <p className="text-slate-500 text-xs mt-1">Max 50 MB</p>
            </div>
          )}
        </div>

        <div>
          <label className="label">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Document title" />
        </div>
        <div>
          <label className="label">Subject <span className="text-slate-600">(optional)</span></label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input" placeholder="e.g. Mathematics, History…" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={!file || isPending} className="btn-primary flex-1">
            {isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function SummaryModal({ doc, isOpen, onClose }) {
  const { mutate: summarize, isPending } = useSummarize(doc?._id)
  const summary = doc?.summary

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Document Summary" size="lg">
      <div className="space-y-4">
        {!summary?.short ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-primary-400 mx-auto mb-3" />
            <p className="text-slate-300 mb-4">Generate an AI summary for this document</p>
            <button onClick={() => summarize()} disabled={isPending} className="btn-primary">
              {isPending ? 'Generating…' : 'Generate Summary'}
            </button>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Short Summary</h3>
              <p className="text-slate-200 text-sm leading-relaxed">{summary.short}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Detailed Summary</h3>
              <p className="text-slate-200 text-sm leading-relaxed">{summary.detailed}</p>
            </div>
            {summary.keyConcepts?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Concepts</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.keyConcepts.map((c) => (
                    <span key={c} className="badge badge-info">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {summary.formulas?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Formulas</h3>
                {summary.formulas.map((f) => (
                  <code key={f} className="block bg-surface-900 rounded px-3 py-1.5 text-sm font-mono text-primary-300 mb-1">{f}</code>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

export default function Documents() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [summaryDoc, setSummaryDoc] = useState(null)
  const { data, isLoading } = useDocuments()
  const { mutate: deleteDoc } = useDeleteDocument()

  const documents = data?.documents || []

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Documents</h1>
          <p className="text-slate-400 text-sm mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Upload PDF
        </button>
      </div>

      {isLoading ? (
        <InlineLoader text="Loading documents…" />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload your first PDF to start studying with AI"
          action={
            <button onClick={() => setUploadOpen(true)} className="btn-primary flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload your first PDF
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <div key={doc._id} className="card hover:border-slate-600 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-400" />
                </div>
                <StatusBadge status={doc.status} />
              </div>

              <h3 className="font-semibold text-white text-sm leading-tight mb-1 line-clamp-2">{doc.title}</h3>
              <p className="text-xs text-slate-500 mb-3">
                {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                {doc.pageCount > 0 && ` · ${doc.pageCount} pages`}
                {doc.subject && ` · ${doc.subject}`}
              </p>
              <p className="text-xs text-slate-600 mb-4">{format(new Date(doc.createdAt), 'MMM d, yyyy')}</p>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
                <button
                  onClick={() => setSummaryDoc(doc)}
                  disabled={doc.status !== 'ready'}
                  title="View Summary"
                  className="btn-ghost text-xs flex items-center gap-1.5 disabled:opacity-30"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Summary
                </button>
                <Link
                  to={`/quiz?documentId=${doc._id}`}
                  className={clsx('btn-ghost text-xs flex items-center gap-1.5', doc.status !== 'ready' && 'pointer-events-none opacity-30')}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Quiz
                </Link>
                <button
                  onClick={() => { if (confirm('Delete this document?')) deleteDoc(doc._id) }}
                  className="btn-ghost text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
      {summaryDoc && (
        <SummaryModal doc={summaryDoc} isOpen={!!summaryDoc} onClose={() => setSummaryDoc(null)} />
      )}
    </div>
  )
}
