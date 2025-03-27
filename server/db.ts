import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;

import * as schema from "../shared/schema.js"; 

import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Ensure SSL is properly handled
});

export const db = drizzle(pool, { schema });
