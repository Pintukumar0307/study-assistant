import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'

export default function TopBar({ onMenuClick }) {
  const { isDark, toggleTheme } = useThemeStore()
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-14 bg-surface-850 border-b border-slate-700/50 flex items-center justify-between px-4 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-all"
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications placeholder */}
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center ml-1">
          <span className="text-primary-200 font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
      </div>
    </header>
  )
}
