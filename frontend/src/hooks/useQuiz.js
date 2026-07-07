import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { quizApi } from '@/api/index'

export function useQuizHistory(params) {
  return useQuery({
    queryKey: ['quizzes', params],
    queryFn: () => quizApi.getAll(params).then((r) => r.data.data),
  })
}

export function useQuiz(id) {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizApi.getOne(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: quizApi.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      toast.success('Quiz generated!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Quiz generation failed'),
  })
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => quizApi.submit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      toast.success('Quiz submitted!')
    },
    onError: () => toast.error('Failed to submit quiz'),
  })
}
