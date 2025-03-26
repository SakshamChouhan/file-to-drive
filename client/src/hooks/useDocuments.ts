import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Document, UpdateDocument } from '@shared/schema';

export function useDocuments() {
  const documentsQuery = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  const driveDocumentsQuery = useQuery<any[]>({
    queryKey: ['/api/documents/drive/list'],
  });
  
  const createDocument = useMutation({
    mutationFn: async (document: { title: string, content?: string }) => {
      const response = await apiRequest('POST', '/api/documents', document);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });
  
  const updateDocument = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: UpdateDocument }) => {
      const response = await apiRequest('PUT', `/api/documents/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${variables.id}`] });
    },
  });
  
  const deleteDocument = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/documents/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });
  
  const saveToDrive = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/documents/${id}/save-to-drive`);
      return response.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/drive/list'] });
    },
  });
  
  const getDocument = (id: number) => {
    return useQuery<Document>({
      queryKey: [`/api/documents/${id}`],
      enabled: !!id,
    });
  };
  
  return {
    documents: documentsQuery.data || [],
    driveDocuments: driveDocumentsQuery.data || [],
    isLoading: documentsQuery.isLoading || driveDocumentsQuery.isLoading,
    createDocument,
    updateDocument,
    deleteDocument,
    saveToDrive,
    getDocument,
  };
}
