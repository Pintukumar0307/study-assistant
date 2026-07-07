import { useEffect } from 'react'
import AppRoutes from '@/routes'
import { useThemeStore } from '@/store/themeStore'

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme)

  useEffect(() => {
    initTheme()
  }, [initTheme])

  return <AppRoutes />
}
