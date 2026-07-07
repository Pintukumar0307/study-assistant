import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/index'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => usersApi.getDashboard().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  })
}
