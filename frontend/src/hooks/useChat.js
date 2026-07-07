import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { chatApi } from '@/api/index'

export function useChatSessions() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => chatApi.getSessions().then((r) => r.data.data),
  })
}

export function useChatSession(sessionId) {
  return useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: () => chatApi.getSession(sessionId).then((r) => r.data.data),
    enabled: !!sessionId,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: chatApi.send,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      if (variables.sessionId) {
        queryClient.invalidateQueries({ queryKey: ['chat-session', variables.sessionId] })
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send message'),
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: chatApi.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      toast.success('Session deleted')
    },
  })
}
