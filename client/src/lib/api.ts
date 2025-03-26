import { apiRequest } from '@/lib/queryClient';
import { Document, UpdateDocument } from '@shared/schema';
import { convertFromDraftToPlainText } from '@/lib/utils';

export interface DriveDocument {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

export async function createNewDocument(title: string = 'Untitled Letter'): Promise<Document> {
  const response = await apiRequest('POST', '/api/documents', { title });
  return await response.json();
}

export async function getDocument(id: number): Promise<Document> {
  const response = await apiRequest('GET', `/api/documents/${id}`);
  return await response.json();
}

export async function updateDocument(id: number, data: UpdateDocument): Promise<Document> {
  const response = await apiRequest('PUT', `/api/documents/${id}`, data);
  return await response.json();
}

export async function saveDocumentToDrive(
  id: number, 
  title?: string, 
  category?: string, 
  permission?: string
): Promise<Document> {
  // Get the document content first
  const document = await getDocument(id);
  
  // Convert the content to plain text
  const plainTextContent = convertFromDraftToPlainText(document.content || '');
  
  const response = await apiRequest('POST', `/api/documents/${id}/save-to-drive`, {
    plainTextContent,
    title: title || document.title, // Pass the title parameter
    category,
    permission // Pass the permission parameter
  });
  
  return await response.json();
}

export async function deleteDocument(id: number): Promise<void> {
  await apiRequest('DELETE', `/api/documents/${id}`);
}

export async function getAllDocuments(): Promise<Document[]> {
  const response = await apiRequest('GET', '/api/documents');
  return await response.json();
}

export async function getDriveDocuments(): Promise<DriveDocument[]> {
  const response = await apiRequest('GET', '/api/documents/drive/list');
  return await response.json();
}
