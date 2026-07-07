import { FileText, Brain, CreditCard, Clock, TrendingUp, Flame, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import { useAuthStore } from '@/store/authStore'
import { InlineLoader } from '@/components/common/Spinner'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white font-display mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function QuickAction({ to, icon: Icon, label, description, color }) {
  return (
    <Link to={to} className="card hover:border-primary-500/50 transition-all duration-200 group flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-medium text-white text-sm">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useDashboard()

  const stats = data?.stats || {}
  const recentQuizzes = data?.recentQuizzes || []
  const weeklyActivity = data?.weeklyActivity || []

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Here's your study overview</p>
        </div>
        <Link to="/documents" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Upload PDF
        </Link>
      </div>

      {isLoading ? (
        <InlineLoader text="Loading dashboard…" />
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FileText} label="Documents" value={stats.totalDocuments ?? 0} color="bg-blue-600" sub="Uploaded PDFs" />
            <StatCard icon={Brain} label="Quizzes Taken" value={stats.totalQuizzesTaken ?? 0} color="bg-purple-600" sub={`Avg score: ${stats.avgQuizScore ?? 0}%`} />
            <StatCard icon={CreditCard} label="Flashcards" value={stats.flashcardsReviewed ?? 0} color="bg-emerald-600" sub="Cards reviewed" />
            <StatCard icon={Flame} label="Study Streak" value={`${stats.studyStreak ?? 0}d`} color="bg-orange-600" sub="Keep it up!" />
          </div>

          {/* Chart + Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Activity chart */}
            <div className="card lg:col-span-2">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-400" />
                Weekly Activity
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyActivity} margin={{ top: 5, right: 5, bottom: 5, left: -30 }}>
                  <defs>
                    <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => format(new Date(v), 'EEE')} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={(v) => format(new Date(v), 'MMM d')}
                  />
                  <Area type="monotone" dataKey="studyTime" stroke="#6366f1" fill="url(#studyGrad)" strokeWidth={2} name="Study Time (min)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick actions */}
            <div className="space-y-3">
              <h2 className="font-semibold text-white">Quick Actions</h2>
              <QuickAction to="/documents" icon={FileText} label="Upload Document" description="Add a new PDF to study" color="bg-blue-600" />
              <QuickAction to="/quiz" icon={Brain} label="Take a Quiz" description="Test your knowledge" color="bg-purple-600" />
              <QuickAction to="/flashcards" icon={CreditCard} label="Review Flashcards" description="Spaced repetition study" color="bg-emerald-600" />
              <QuickAction to="/chat" icon={Clock} label="AI Chat" description="Ask questions about docs" color="bg-amber-600" />
            </div>
          </div>

          {/* Recent quizzes */}
          {recentQuizzes.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-white mb-4">Recent Quizzes</h2>
              <div className="space-y-3">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz._id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{quiz.documentId?.title || 'Untitled'}</p>
                      <p className="text-xs text-slate-500">{format(new Date(quiz.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${quiz.percentage >= 70 ? 'badge-success' : quiz.percentage >= 40 ? 'badge-warning' : 'badge-error'}`}>
                        {quiz.percentage ?? '--'}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
