import { apiRequest } from '@/lib/queryClient';
import { Document, UpdateDocument } from '@shared/schema';

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

export async function saveDocumentToDrive(id: number): Promise<Document> {
  const response = await apiRequest('POST', `/api/documents/${id}/save-to-drive`);
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
