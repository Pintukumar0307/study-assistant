import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { flashcardsApi } from '@/api/index'

export function useFlashcards(documentId) {
  return useQuery({
    queryKey: ['flashcards', documentId],
    queryFn: () => flashcardsApi.getAll(documentId).then((r) => r.data.data),
    enabled: !!documentId,
  })
}

export function useGenerateFlashcards() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: flashcardsApi.generate,
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', documentId] })
      toast.success('Flashcards generated!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Generation failed'),
  })
}

export function useReviewFlashcard(documentId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, quality }) =>
      flashcardsApi.review(documentId, cardId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', documentId] })
    },
    onError: () => toast.error('Failed to save review'),
  })
}
