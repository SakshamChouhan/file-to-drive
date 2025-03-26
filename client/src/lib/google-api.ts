import { apiRequest } from './queryClient';

/**
 * Get a list of folders from Google Drive
 */
export async function getGoogleDriveFolders() {
  try {
    const response = await apiRequest('GET', '/api/gdrive/folders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Google Drive folders:', error);
    throw error;
  }
}

/**
 * Get a list of documents from Google Drive
 */
export async function getGoogleDriveDocuments() {
  try {
    const response = await apiRequest('GET', '/api/gdrive/documents');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Google Drive documents:', error);
    throw error;
  }
}

/**
 * Create a new folder in Google Drive
 */
export async function createGoogleDriveFolder(name: string) {
  try {
    const response = await apiRequest('POST', '/api/gdrive/folders', { name });
    return await response.json();
  } catch (error) {
    console.error('Error creating Google Drive folder:', error);
    throw error;
  }
}

/**
 * Export document to Google Drive
 */
export async function exportToGoogleDrive(documentId: string, title: string, folderId: string) {
  try {
    const response = await apiRequest('POST', `/api/gdrive/export/${documentId}`, {
      title,
      folderId,
    });
    return await response.json();
  } catch (error) {
    console.error('Error exporting to Google Drive:', error);
    throw error;
  }
}
