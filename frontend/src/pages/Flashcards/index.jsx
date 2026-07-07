import { useState } from 'react'
import { CreditCard, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Check, X, Minus } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { useFlashcards, useGenerateFlashcards, useReviewFlashcard } from '@/hooks/useFlashcards'
import { InlineLoader } from '@/components/common/Spinner'
import EmptyState from '@/components/common/EmptyState'
import clsx from 'clsx'

function FlashcardDeck({ documentId }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const { data, isLoading } = useFlashcards(documentId)
  const { mutate: review } = useReviewFlashcard(documentId)

  if (isLoading) return <InlineLoader />

  const cards = data?.flashcards || []
  if (cards.length === 0) return <EmptyState icon={CreditCard} title="No flashcards" description="Generate flashcards for this document" />

  const card = cards[currentIdx]
  const progress = ((currentIdx + 1) / cards.length) * 100

  const handleReview = (quality) => {
    review({ cardId: card._id, quality })
    setFlipped(false)
    setCurrentIdx((prev) => (prev + 1) % cards.length)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-slide-up">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>{currentIdx + 1} / {cards.length} cards</span>
          <span>{data?.dueCount ?? 0} due for review</span>
        </div>
        <div className="w-full bg-surface-900 rounded-full h-1.5">
          <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Card */}
      <div
        className="relative cursor-pointer"
        onClick={() => setFlipped(!flipped)}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none', minHeight: '240px' }}
        >
          {/* Front */}
          <div className="absolute inset-0 card flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden' }}>
            <span className="badge badge-info mb-4">Question</span>
            <p className="text-white font-medium text-lg leading-relaxed">{card.question}</p>
            <p className="text-slate-500 text-xs mt-6">Click to reveal answer</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 card flex flex-col items-center justify-center p-8 text-center bg-primary-900/30 border-primary-500/30" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <span className="badge badge-success mb-4">Answer</span>
            <p className="text-white font-medium text-lg leading-relaxed">{card.answer}</p>
            <span className={`badge mt-4 ${card.difficulty === 'easy' ? 'badge-success' : card.difficulty === 'hard' ? 'badge-error' : 'badge-warning'}`}>
              {card.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button onClick={() => { setCurrentIdx((prev) => (prev - 1 + cards.length) % cards.length); setFlipped(false) }} className="btn-ghost">
          <ChevronLeft className="w-5 h-5" />
        </button>

        {flipped ? (
          <div className="flex gap-3">
            <button onClick={() => handleReview(1)} title="Hard" className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 flex items-center justify-center transition-all">
              <X className="w-5 h-5 text-red-400" />
            </button>
            <button onClick={() => handleReview(3)} title="Medium" className="w-12 h-12 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 flex items-center justify-center transition-all">
              <Minus className="w-5 h-5 text-amber-400" />
            </button>
            <button onClick={() => handleReview(5)} title="Easy" className="w-12 h-12 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center transition-all">
              <Check className="w-5 h-5 text-emerald-400" />
            </button>
          </div>
        ) : (
          <button onClick={() => setFlipped(true)} className="btn-primary flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Flip Card
          </button>
        )}

        <button onClick={() => { setCurrentIdx((prev) => (prev + 1) % cards.length); setFlipped(false) }} className="btn-ghost">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default function Flashcards() {
  const [selectedDocId, setSelectedDocId] = useState('')
  const [studying, setStudying] = useState(false)
  const { data: docsData } = useDocuments({ status: 'ready' })
  const { mutate: generate, isPending } = useGenerateFlashcards()

  const documents = docsData?.documents || []

  if (studying && selectedDocId) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <button onClick={() => setStudying(false)} className="btn-ghost text-sm flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="font-display text-xl font-bold text-white">Flashcards</h1>
        </div>
        <FlashcardDeck documentId={selectedDocId} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Flashcards</h1>
        <p className="text-slate-400 text-sm mt-1">Spaced repetition flashcards from your documents</p>
      </div>

      {/* Generate + start */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-400" />
          Select Document
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="input flex-1"
          >
            <option value="">Choose a document…</option>
            {documents.map((d) => (
              <option key={d._id} value={d._id}>{d.title}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => generate(selectedDocId)}
              disabled={!selectedDocId || isPending}
              className="btn-secondary whitespace-nowrap"
            >
              {isPending ? 'Generating…' : 'Generate New'}
            </button>
            <button
              onClick={() => setStudying(true)}
              disabled={!selectedDocId}
              className="btn-primary whitespace-nowrap"
            >
              Study Now
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">Generates 20+ flashcards with SM-2 spaced repetition scheduling</p>
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Easy', desc: 'You knew it well', color: 'bg-emerald-500/20 border-emerald-500/30', icon: Check, iconColor: 'text-emerald-400', quality: 5 },
          { label: 'Medium', desc: 'Some hesitation', color: 'bg-amber-500/20 border-amber-500/30', icon: Minus, iconColor: 'text-amber-400', quality: 3 },
          { label: 'Hard', desc: 'Didn\'t recall it', color: 'bg-red-500/20 border-red-500/30', icon: X, iconColor: 'text-red-400', quality: 1 },
        ].map(({ label, desc, color, icon: Icon, iconColor }) => (
          <div key={label} className={`card border ${color}`}>
            <Icon className={`w-6 h-6 mb-2 ${iconColor}`} />
            <p className="text-white font-medium text-sm">{label}</p>
            <p className="text-slate-500 text-xs">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
