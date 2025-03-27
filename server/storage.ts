import { users, documents, type User, type InsertUser, type Document, type InsertDocument, type UpdateDocument } from "@shared/schema";
import { db } from "./db.ts";

import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(id: number, accessToken: string, refreshToken: string): Promise<User>;
  updateUserRole(id: number, role: string, isAdmin: boolean): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Document methods
  getDocumentById(id: number): Promise<Document | undefined>;
  getDocumentsByUserId(userId: number): Promise<Document[]>;
  getAllDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, data: UpdateDocument): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserTokens(id: number, accessToken: string, refreshToken: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ accessToken, refreshToken })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
  
  async updateUserRole(id: number, role: string, isAdmin: boolean): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ role, isAdmin })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Document methods
  async getDocumentById(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByUserId(userId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.userId, userId));
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: number, data: UpdateDocument): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ ...data, lastSaved: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return true; // In Drizzle, delete doesn't return count, so we assume success if no error
  }
}

export const storage = new DatabaseStorage();
