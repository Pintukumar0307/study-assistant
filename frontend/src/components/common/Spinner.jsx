import clsx from 'clsx'

export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div
      className={clsx(
        'border-2 border-slate-700 border-t-primary-500 rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
    </div>
  )
}

export function InlineLoader({ text = 'Loading…' }) {
  return (
    <div className="flex items-center gap-3 text-slate-400 py-8 justify-center">
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
