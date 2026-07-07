import { Outlet } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-surface-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-600 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">StudyAI</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="font-display text-5xl font-bold text-white leading-tight">
            Learn smarter,<br />
            not harder.
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed max-w-sm">
            Upload your PDFs and let AI help you understand, quiz yourself, and master any subject with spaced repetition.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: 'Documents Processed', value: '10K+' },
              { label: 'Quizzes Generated', value: '50K+' },
              { label: 'Flashcard Sets', value: '25K+' },
              { label: 'Students', value: '5K+' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="font-display text-2xl font-bold text-white">{value}</div>
                <div className="text-primary-300 text-sm mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-primary-400 text-sm">
          © {new Date().getFullYear()} StudyAI. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">StudyAI</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
