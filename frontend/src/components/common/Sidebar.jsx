import { NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpen, LayoutDashboard, FileText, MessageSquare,
  Brain, CreditCard, X, LogOut, User
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/quiz', icon: Brain, label: 'Quiz' },
  { to: '/flashcards', icon: CreditCard, label: 'Flashcards' },
]

export default function Sidebar({ open, onClose }) {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()

  return (
    <aside
      className={clsx(
        'fixed lg:static inset-y-0 left-0 z-30 w-64 bg-surface-850 border-r border-slate-700/50 flex flex-col transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">StudyAI</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 pb-2">
          Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-surface-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-700/50 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          disabled={isPending}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isPending ? 'Logging out…' : 'Log Out'}
        </button>
      </div>
    </aside>
  )
}
