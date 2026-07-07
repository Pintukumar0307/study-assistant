import { useState } from 'react'
import { Brain, CheckCircle, XCircle, Clock, Trophy, ChevronRight, RefreshCw } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useDocuments } from '@/hooks/useDocuments'
import { useGenerateQuiz, useQuizHistory, useQuiz, useSubmitQuiz } from '@/hooks/useQuiz'
import { InlineLoader } from '@/components/common/Spinner'
import EmptyState from '@/components/common/EmptyState'
import { format } from 'date-fns'
import clsx from 'clsx'

function QuizRunner({ quiz, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [startTime] = useState(Date.now())
  const { mutate: submit, isPending } = useSubmitQuiz()

  const q = quiz.questions[currentIdx]
  const total = quiz.questions.length
  const progress = ((currentIdx + 1) / total) * 100

  const handleAnswer = (answer) => {
    setAnswers((prev) => ({ ...prev, [currentIdx]: answer }))
  }

  const handleNext = () => {
    if (currentIdx < total - 1) setCurrentIdx(currentIdx + 1)
  }

  const handleSubmit = () => {
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    const answersArr = Object.entries(answers).map(([idx, answer]) => ({
      questionIndex: parseInt(idx),
      answer,
    }))
    submit({ id: quiz._id, answers: answersArr, timeTaken }, { onSuccess: onComplete })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Question {currentIdx + 1} of {total}</span>
          <span className="capitalize text-xs badge badge-info">{q.question_type?.replace('_', ' ')}</span>
        </div>
        <div className="w-full bg-surface-900 rounded-full h-1.5">
          <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="card">
        <p className="text-white font-medium text-lg leading-relaxed mb-6">{q.question_text}</p>

        {/* Options */}
        {q.options ? (
          <div className="space-y-3">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all',
                  answers[currentIdx] === opt
                    ? 'border-primary-500 bg-primary-500/10 text-white'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-surface-700'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={answers[currentIdx] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer…"
            className="input min-h-[100px] resize-none"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="btn-secondary">
          Previous
        </button>
        {currentIdx < total - 1 ? (
          <button onClick={handleNext} disabled={!answers[currentIdx]} className="btn-primary flex items-center gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isPending} className="btn-primary">
            {isPending ? 'Submitting…' : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}

function QuizResults({ quiz }) {
  const navigate = useNavigate()
  const passed = quiz.percentage >= 70
  const correct = quiz.questions.filter((q) => q.isCorrect).length

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Score card */}
      <div className={clsx('card text-center py-10', passed ? 'border-emerald-500/30' : 'border-red-500/20')}>
        <Trophy className={clsx('w-16 h-16 mx-auto mb-4', passed ? 'text-amber-400' : 'text-slate-500')} />
        <p className="font-display text-5xl font-bold text-white mb-2">{quiz.percentage}%</p>
        <p className={clsx('font-medium', passed ? 'text-emerald-400' : 'text-red-400')}>
          {passed ? 'Great job! 🎉' : 'Keep practicing!'}
        </p>
        <p className="text-slate-400 text-sm mt-2">{correct} / {quiz.questions.length} correct</p>
      </div>

      {/* Review answers */}
      <div className="space-y-3">
        <h2 className="font-semibold text-white">Review</h2>
        {quiz.questions.map((q, i) => (
          <div key={i} className={clsx('card border', q.isCorrect ? 'border-emerald-500/20' : q.userAnswer ? 'border-red-500/20' : 'border-slate-700/50')}>
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {q.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{q.question_text}</p>
                {q.userAnswer && (
                  <p className={clsx('text-xs mt-1', q.isCorrect ? 'text-emerald-400' : 'text-red-400')}>
                    Your answer: {q.userAnswer}
                  </p>
                )}
                {!q.isCorrect && (
                  <p className="text-xs text-emerald-400 mt-0.5">Correct: {q.correct_answer}</p>
                )}
                {q.explanation && (
                  <p className="text-xs text-slate-500 mt-1 border-t border-slate-700/50 pt-1">{q.explanation}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/quiz')} className="btn-secondary w-full flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Back to Quizzes
      </button>
    </div>
  )
}

export default function Quiz() {
  const [searchParams] = useSearchParams()
  const [activeQuizId, setActiveQuizId] = useState(null)
  const [showResults, setShowResults] = useState(false)

  const prefillDocId = searchParams.get('documentId') || ''
  const [selectedDocId, setSelectedDocId] = useState(prefillDocId)

  const { data: docsData } = useDocuments({ status: 'ready' })
  const { data: historyData, isLoading: historyLoading } = useQuizHistory()
  const { data: activeQuizData } = useQuiz(activeQuizId)
  const { mutate: generate, isPending: generating } = useGenerateQuiz()

  const documents = docsData?.documents || []
  const quizzes = historyData?.quizzes || []
  const activeQuiz = activeQuizData?.quiz

  if (activeQuizId && activeQuiz) {
    if (activeQuiz.status === 'completed' || showResults) {
      return <QuizResults quiz={activeQuiz} />
    }
    return (
      <QuizRunner
        quiz={activeQuiz}
        onComplete={() => { setShowResults(true) }}
      />
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Quiz</h1>
        <p className="text-slate-400 text-sm mt-1">Generate and take AI-powered quizzes from your documents</p>
      </div>

      {/* Generate quiz */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary-400" />
          Generate New Quiz
        </h2>
        <div className="flex gap-3">
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="input flex-1"
          >
            <option value="">Select a document…</option>
            {documents.map((d) => (
              <option key={d._id} value={d._id}>{d.title}</option>
            ))}
          </select>
          <button
            onClick={() => generate(selectedDocId, { onSuccess: ({ data }) => setActiveQuizId(data.data.quiz._id) })}
            disabled={!selectedDocId || generating}
            className="btn-primary whitespace-nowrap"
          >
            {generating ? 'Generating…' : 'Generate Quiz'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Generates 10 MCQs, 5 True/False, and 5 Short Answer questions</p>
      </div>

      {/* History */}
      <div>
        <h2 className="font-semibold text-white mb-3">Quiz History</h2>
        {historyLoading ? (
          <InlineLoader />
        ) : quizzes.length === 0 ? (
          <EmptyState icon={Brain} title="No quizzes yet" description="Generate your first quiz above" />
        ) : (
          <div className="space-y-3">
            {quizzes.map((q) => (
              <div key={q._id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', (q.percentage ?? 0) >= 70 ? 'bg-emerald-500/20' : 'bg-surface-900')}>
                    <Brain className={clsx('w-5 h-5', (q.percentage ?? 0) >= 70 ? 'text-emerald-400' : 'text-slate-500')} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{q.documentId?.title || 'Untitled'}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(q.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {q.status === 'completed' ? (
                    <span className={`badge ${(q.percentage ?? 0) >= 70 ? 'badge-success' : 'badge-error'}`}>
                      {q.percentage}%
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveQuizId(q._id)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Take Quiz
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
