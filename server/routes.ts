import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authRouter, isAuthenticated, configureAuth, type User } from "./auth";
import { saveDocumentToDrive, getDocumentsFromDrive } from "./google";
import express from "express";
import { updateDocumentSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";

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
      
      const driveId = await saveDocumentToDrive(
        user.id,
        id,
        document.title,
        document.content || '',
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
      const driveDocuments = await getDocumentsFromDrive(user.id);
      res.json(driveDocuments);
    } catch (error) {
      console.error('Error fetching Drive documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents from Google Drive' });
    }
  });
  
  // Register the documents router
  app.use('/api/documents', documentsRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
