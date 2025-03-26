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
  
  if (response.data.files && response.data.files.length > 0) {
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
  
  return folder.data.id;
}

// Save document to Google Drive
export async function saveDocumentToDrive(
  userId: number,
  documentId: number,
  title: string,
  content: string,
  driveId?: string
) {
  const drive = await getDriveClient(userId);
  const folderId = await getOrCreateLetterDriveFolder(userId);
  
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
      fields: 'id'
    });
    
    return file.data.id;
  }
}

// Fetch documents from Google Drive
export async function getDocumentsFromDrive(userId: number) {
  const drive = await getDriveClient(userId);
  
  try {
    const folderId = await getOrCreateLetterDriveFolder(userId);
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
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
