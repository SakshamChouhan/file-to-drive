import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authRouter, isAuthenticated, isAdmin, configureAuth, type User } from "./auth";
import { 
  saveDocumentToDrive, 
  getDocumentsFromDrive, 
  getAllDocumentsFromDrive, 
  getCategoryFolders,
  getOrCreateCategoryFolder
} from "./google";
import express from "express";
import { updateDocumentSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure authentication
  configureAuth(app);
  
  // Authentication routes
  app.use('/api/auth', authRouter);
  
  // Documents API
  const documentsRouter = express.Router();
  
  // Get all documents for the current user
  documentsRouter.get('/', isAuthenticated, async (req, res) => {
    try {
      // Cast req.user to User type
      const user = req.user as User;
      const documents = await storage.getDocumentsByUserId(user.id);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  });
  
  // Get a single document
  documentsRouter.get('/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const user = req.user as User;
      if (document.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to document' });
      }
      
      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ message: 'Failed to fetch document' });
    }
  });
  
  // Create a new document
  documentsRouter.post('/', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const newDocument = await storage.createDocument(validatedData);
      res.status(201).json(newDocument);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid document data', errors: error.errors });
      }
      console.error('Error creating document:', error);
      res.status(500).json({ message: 'Failed to create document' });
    }
  });
  
  // Update a document
  documentsRouter.put('/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const user = req.user as User;
      if (document.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized to update this document' });
      }
      
      const validatedData = updateDocumentSchema.parse(req.body);
      const updatedDocument = await storage.updateDocument(id, validatedData);
      
      res.json(updatedDocument);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid document data', errors: error.errors });
      }
      
      console.error('Error updating document:', error);
      res.status(500).json({ message: 'Failed to update document' });
    }
  });
  
  // Delete a document
  documentsRouter.delete('/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const user = req.user as User;
      if (document.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized to delete this document' });
      }
      
      await storage.deleteDocument(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: 'Failed to delete document' });
    }
  });
  
  // Save document to Google Drive
  documentsRouter.post('/:id/save-to-drive', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const user = req.user as User;
      if (document.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized to save this document' });
      }
      
      const { category } = req.body;
      
      const driveId = await saveDocumentToDrive(
        user.id,
        id,
        document.title,
        document.content || '',
        category,
        document.driveId || undefined
      );
      
      // Update document with Drive ID
      const updatedDocument = await storage.updateDocument(id, {
        driveId,
        isInDrive: true
      });
      
      res.json(updatedDocument);
    } catch (error) {
      console.error('Error saving document to Drive:', error);
      res.status(500).json({ message: 'Failed to save document to Google Drive' });
    }
  });
  
  // Get Google Drive documents
  documentsRouter.get('/drive/list', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const { category } = req.query;
      
      let driveDocuments;
      if (category) {
        // Get documents from specific category
        driveDocuments = await getDocumentsFromDrive(user.id, category as string);
      } else {
        // Get all documents
        driveDocuments = await getAllDocumentsFromDrive(user.id);
      }
      
      res.json(driveDocuments);
    } catch (error) {
      console.error('Error fetching Drive documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents from Google Drive' });
    }
  });
  
  // Get or create a category folder
  documentsRouter.post('/drive/categories', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const { categoryName } = req.body;
      
      if (!categoryName || typeof categoryName !== 'string') {
        return res.status(400).json({ message: 'Category name is required' });
      }
      
      const folderId = await getOrCreateCategoryFolder(user.id, categoryName);
      
      res.json({ id: folderId, name: categoryName });
    } catch (error) {
      console.error('Error creating category folder:', error);
      res.status(500).json({ message: 'Failed to create category folder' });
    }
  });
  
  // Get all category folders
  documentsRouter.get('/drive/categories', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const categories = await getCategoryFolders(user.id);
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching category folders:', error);
      res.status(500).json({ message: 'Failed to fetch category folders' });
    }
  });
  
  // Register the documents router
  app.use('/api/documents', documentsRouter);
  
  // Admin API
  const adminRouter = express.Router();
  
  // Get all users (admin only)
  adminRouter.get('/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Filter out sensitive information
      const safeUsers = users.map(user => ({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });
  
  // Update user role (admin only)
  adminRouter.patch('/users/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const { role, isAdmin } = req.body;
      
      if (typeof isAdmin !== 'boolean' && role === undefined) {
        return res.status(400).json({ message: 'Invalid role or admin status' });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedUser = await storage.updateUserRole(
        id,
        role || user.role,
        isAdmin !== undefined ? isAdmin : user.isAdmin
      );
      
      // Filter out sensitive information
      const safeUser = {
        id: updatedUser.id,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
        isAdmin: updatedUser.isAdmin,
        createdAt: updatedUser.createdAt
      };
      
      res.json(safeUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });
  
  // Get all documents (admin only)
  adminRouter.get('/documents', isAdmin, async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error('Error fetching all documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  });
  
  // Register the admin router
  app.use('/api/admin', adminRouter);
  
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store document sessions
  const documentSessions: Record<string, Set<any>> = {};
  
  wss.on('connection', (ws) => {
    let userId: number | null = null;
    let documentId: string | null = null;
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'join':
            // User joins a document editing session
            userId = data.userId;
            documentId = data.documentId;
            
            if (!documentSessions[documentId]) {
              documentSessions[documentId] = new Set();
            }
            
            documentSessions[documentId].add(ws);
            
            // Notify others that someone joined
            broadcastToOthers(documentId, ws, {
              type: 'user-joined',
              userId,
              timestamp: new Date().toISOString()
            });
            break;
            
          case 'leave':
            // User leaves a document editing session
            if (documentId && documentSessions[documentId]) {
              documentSessions[documentId].delete(ws);
              
              // Clean up empty sessions
              if (documentSessions[documentId].size === 0) {
                delete documentSessions[documentId];
              } else {
                // Notify others that someone left
                broadcastToOthers(documentId, ws, {
                  type: 'user-left',
                  userId,
                  timestamp: new Date().toISOString()
                });
              }
            }
            break;
            
          case 'update':
            // User made changes to the document
            if (documentId && documentSessions[documentId]) {
              // Broadcast the changes to all other users editing this document
              broadcastToOthers(documentId, ws, {
                type: 'document-updated',
                content: data.content,
                userId,
                timestamp: new Date().toISOString(),
                selection: data.selection
              });
            }
            break;
            
          case 'cursor-move':
            // User moved their cursor
            if (documentId && documentSessions[documentId]) {
              // Broadcast cursor position to other users
              broadcastToOthers(documentId, ws, {
                type: 'cursor-position',
                position: data.position,
                userId,
                timestamp: new Date().toISOString()
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      if (documentId && documentSessions[documentId]) {
        documentSessions[documentId].delete(ws);
        
        // Clean up empty sessions
        if (documentSessions[documentId].size === 0) {
          delete documentSessions[documentId];
        } else {
          // Notify others that someone left
          broadcastToOthers(documentId, ws, {
            type: 'user-left',
            userId,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });
  
  // Helper function to broadcast messages to all other clients editing the same document
  function broadcastToOthers(documentId: string, sender: any, message: any) {
    if (documentSessions[documentId]) {
      documentSessions[documentId].forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }
  
  return httpServer;
}
