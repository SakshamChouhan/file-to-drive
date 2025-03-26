import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: text("google_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  profilePicture: text("profile_picture"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull().default("Untitled Letter"),
  content: text("content").default(""),
  driveId: text("drive_id"),
  isInDrive: boolean("is_in_drive").default(false),
  lastSaved: timestamp("last_saved").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true 
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  createdAt: true, 
  lastSaved: true 
});

export const updateDocumentSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  driveId: z.string().optional(),
  isInDrive: z.boolean().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
