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
export async function getOrCreateLetterDriveFolder(userId: number) {
  const drive = await getDriveClient(userId);
  
  // Check if "LetterDrive" folder exists
  const response = await drive.files.list({
    q: "name='LetterDrive' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    spaces: 'drive',
    fields: 'files(id, name)'
  });
  
  let letterDriveFolderId: string;
  
  if (response.data.files && response.data.files.length > 0) {
    letterDriveFolderId = response.data.files[0].id;
  } else {
    // Create folder if it doesn't exist
    const folderMetadata = {
      name: 'LetterDrive',
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id'
    });
    
    letterDriveFolderId = folder.data.id;
  }
  
  return letterDriveFolderId;
}

// Create or get category folder inside LetterDrive
export async function getOrCreateCategoryFolder(userId: number, categoryName: string) {
  const drive = await getDriveClient(userId);
  const parentFolderId = await getOrCreateLetterDriveFolder(userId);
  
  // Check if category folder exists
  const response = await drive.files.list({
    q: `name='${categoryName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    spaces: 'drive',
    fields: 'files(id, name)'
  });
  
  if (response.data.files && response.data.files.length > 0) {
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
  driveId?: string
) {
  const drive = await getDriveClient(userId);
  
  // Get appropriate folder - use category folder if provided, otherwise use main folder
  let folderId: string;
  if (category) {
    folderId = await getOrCreateCategoryFolder(userId, category);
  } else {
    folderId = await getOrCreateLetterDriveFolder(userId);
  }
  
  // Format the content as HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
  
  if (driveId) {
    // Update existing file
    await drive.files.update({
      fileId: driveId,
      requestBody: {
        name: title
      },
      media: {
        mimeType: 'text/html',
        body: htmlContent
      }
    });
    
    return driveId;
  } else {
    // Create new file
    const fileMetadata = {
      name: title,
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
    
    return file.data.id;
  }
}

// Fetch documents from Google Drive
export async function getDocumentsFromDrive(userId: number, categoryName?: string) {
  const drive = await getDriveClient(userId);
  
  try {
    let folderId: string;
    
    // If category is specified, get documents from that category folder
    if (categoryName) {
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
