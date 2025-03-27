import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync(path.join(__dirname, 'migrations', '0000_create_session_table.sql'), 'utf8');
    await client.query(sql);
    console.log('Session table created successfully');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();
