import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { documentsApi } from '@/api/documents'

export function useDocuments(params) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.getAll(params).then((r) => r.data.data),
  })
}

export function useDocument(id) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.getOne(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document uploaded! Processing started.')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Upload failed')
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document deleted')
    },
    onError: () => toast.error('Failed to delete document'),
  })
}

export function useSummarize(id) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => documentsApi.summarize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', id] })
      toast.success('Summary generated!')
    },
    onError: () => toast.error('Failed to generate summary'),
  })
}
