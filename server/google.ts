import { google } from 'googleapis';
import { storage } from './storage';

// Drive API setup
export async function getDriveClient(userId: number) {
  const user = await storage.getUser(userId);
  
  if (!user || !user.accessToken) {
    throw new Error('User not found or missing access token');
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Create or get the LetterDrive folder
export async function getOrCreateLetterDriveFolder(userId: number): Promise<string> {
  const drive = await getDriveClient(userId);
  
  // Check if "LetterDrive" folder exists
  const response = await drive.files.list({
    q: "name='LetterDrive' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    spaces: 'drive',
    fields: 'files(id, name)'
  });
  
  // If folder exists and has valid ID
  if (response.data.files && 
      response.data.files.length > 0 && 
      response.data.files[0].id) {
    return response.data.files[0].id;
  }
  
  // Create folder if it doesn't exist
  const folderMetadata = {
    name: 'LetterDrive',
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id'
  });
  
  if (!folder.data.id) {
    throw new Error('Failed to create LetterDrive folder');
  }
  
  return folder.data.id;
}

// Create or get category folder inside LetterDrive
export async function getOrCreateCategoryFolder(userId: number, categoryName: string): Promise<string> {
  const drive = await getDriveClient(userId);
  const parentFolderId = await getOrCreateLetterDriveFolder(userId);
  
  // Check if category folder exists
  const response = await drive.files.list({
    q: `name='${categoryName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    spaces: 'drive',
    fields: 'files(id, name)'
  });
  
  if (response.data.files && 
      response.data.files.length > 0 &&
      response.data.files[0].id) {
    return response.data.files[0].id;
  }
  
  // Create folder if it doesn't exist
  const folderMetadata = {
    name: categoryName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId]
  };
  
  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id'
  });
  
  if (!folder.data.id) {
    throw new Error(`Failed to create category folder: ${categoryName}`);
  }
  
  return folder.data.id;
}

// Get all category folders
export async function getCategoryFolders(userId: number) {
  const drive = await getDriveClient(userId);
  const parentFolderId = await getOrCreateLetterDriveFolder(userId);
  
  const response = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    spaces: 'drive',
    fields: 'files(id, name, createdTime)'
  });
  
  return response.data.files || [];
}

// Save document to Google Drive
export async function saveDocumentToDrive(
  userId: number,
  documentId: number,
  title: string,
  content: string,
  category?: string,
  driveId?: string,
  permission?: string
): Promise<string> {
  const drive = await getDriveClient(userId);
  
  // Get appropriate folder - use category folder if provided, otherwise use main folder
  let folderId: string;
  if (category && category !== 'main') {
    folderId = await getOrCreateCategoryFolder(userId, category);
  } else {
    folderId = await getOrCreateLetterDriveFolder(userId);
  }

  // Ensure title is not empty
  if (!title || !title.trim()) {
    throw new Error('Document title is required');
  }

  const finalTitle = title.trim();
  
  // Parse content if it seems to be JSON and extract text
  let textContent = content;
  if (content && (content.startsWith('{') || content.startsWith('['))) {
    try {
      const contentObj = JSON.parse(content);
      if (contentObj.blocks && Array.isArray(contentObj.blocks)) {
        textContent = contentObj.blocks
          .map((block: any) => block.text)
          .filter(Boolean)
          .join('\n\n');
      }
    } catch (e) {
      // Not valid JSON, use as is
      console.log('Error parsing JSON content:', e);
    }
  }
  
  // Format the content as HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${finalTitle}</title>
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        ${textContent.split('\n\n').map(para => `<p>${para}</p>`).join('')}
      </div>
    </body>
    </html>
  `;
  
  if (driveId) {
    // Update existing file
    await drive.files.update({
      fileId: driveId,
      requestBody: {
        name: finalTitle
      },
      media: {
        mimeType: 'text/html',
        body: htmlContent
      }
    });
    
    // Update permissions if specified
    if (permission) {
      try {
        // First get current permissions
        const permissionResponse = await drive.permissions.list({
          fileId: driveId
        });
        
        // If permission is 'anyone' and no 'anyone' permission exists
        if (permission === 'anyone' && 
            !permissionResponse.data.permissions?.some(p => p.type === 'anyone')) {
          await drive.permissions.create({
            fileId: driveId,
            requestBody: {
              role: 'reader',
              type: 'anyone'
            }
          });
        } 
        // If permission is 'private' and 'anyone' permission exists, remove it
        else if (permission === 'private') {
          const anyonePermission = permissionResponse.data.permissions?.find(p => p.type === 'anyone');
          if (anyonePermission && anyonePermission.id) {
            await drive.permissions.delete({
              fileId: driveId,
              permissionId: anyonePermission.id
            });
          }
        }
      } catch (permissionError) {
        console.error('Error updating permissions:', permissionError);
        // Continue even if permission update fails
      }
    }
    
    return driveId;
  } else {
    // Create new file
    const fileMetadata = {
      name: finalTitle,
      parents: [folderId],
      mimeType: 'application/vnd.google-apps.document'
    };
    
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: 'text/html',
        body: htmlContent
      },
      fields: 'id,webViewLink'
    });
    
    if (!file.data.id) {
      throw new Error(`Failed to create document in Google Drive: ${finalTitle}`);
    }
    
    // Set permissions if specified
    if (permission === 'anyone') {
      try {
        await drive.permissions.create({
          fileId: file.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      } catch (permissionError) {
        console.error('Error setting permissions:', permissionError);
        // Continue even if permission setting fails
      }
    }
    
    return file.data.id;
  }
}

// Fetch documents from Google Drive
export async function getDocumentsFromDrive(userId: number, categoryName?: string) {
  const drive = await getDriveClient(userId);
  
  try {
    let folderId: string;
    
    // If category is specified, get documents from that category folder
    if (categoryName && categoryName !== 'main') {
      folderId = await getOrCreateCategoryFolder(userId, categoryName);
    } else {
      folderId = await getOrCreateLetterDriveFolder(userId);
    }
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.document'`,
      spaces: 'drive',
      fields: 'files(id, name, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc'
    });
    
    return response.data.files || [];
  } catch (error) {
    console.error('Error fetching documents from Drive:', error);
    return [];
  }
}

// Get all documents from all folders recursively
export async function getAllDocumentsFromDrive(userId: number) {
  const drive = await getDriveClient(userId);
  
  try {
    const rootFolderId = await getOrCreateLetterDriveFolder(userId);
    const allFiles = [];
    
    // Get files directly in the main folder
    const mainFolderResponse = await drive.files.list({
      q: `'${rootFolderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.document'`,
      spaces: 'drive',
      fields: 'files(id, name, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc'
    });
    
    if (mainFolderResponse.data.files) {
      allFiles.push(...mainFolderResponse.data.files);
    }
    
    // Get folders
    const foldersResponse = await drive.files.list({
      q: `'${rootFolderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
      spaces: 'drive',
      fields: 'files(id, name)'
    });
    
    // For each subfolder, get files
    if (foldersResponse.data.files) {
      for (const folder of foldersResponse.data.files) {
        const folderResponse = await drive.files.list({
          q: `'${folder.id}' in parents and trashed=false and mimeType='application/vnd.google-apps.document'`,
          spaces: 'drive',
          fields: 'files(id, name, modifiedTime, webViewLink, parents)',
          orderBy: 'modifiedTime desc'
        });
        
        if (folderResponse.data.files) {
          // Add category information to each file
          const filesWithCategory = folderResponse.data.files.map(file => ({
            ...file,
            category: folder.name
          }));
          
          allFiles.push(...filesWithCategory);
        }
      }
    }
    
    // Sort by most recently modified
    return allFiles.sort((a, b) => {
      const dateA = new Date(a.modifiedTime || 0);
      const dateB = new Date(b.modifiedTime || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
  } catch (error) {
    console.error('Error fetching all documents from Drive:', error);
    return [];
  }
}