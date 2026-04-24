import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { env } from "@/lib/config/env";
import * as schema from "@/lib/db/schema";

type AppDatabase = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __juanbingSqlite?: Database.Database;
  __juanbingDb?: AppDatabase;
  __juanbingMigrated?: boolean;
};

function ensureDataDirectory(databaseUrl: string) {
  if (databaseUrl === ":memory:" || databaseUrl.startsWith("file:")) {
    return;
  }

  const directory = path.dirname(databaseUrl);
  fs.mkdirSync(directory, { recursive: true });
}

function createDatabase() {
  ensureDataDirectory(env.DATABASE_URL);
  const sqlite = new Database(env.DATABASE_URL);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (!globalForDb.__juanbingMigrated && fs.existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder });
    globalForDb.__juanbingMigrated = true;
  }

  return { sqlite, db };
}

const existingSqlite = globalForDb.__juanbingSqlite;
const existingDb = globalForDb.__juanbingDb;

if (!existingSqlite || !existingDb) {
  const { sqlite, db } = createDatabase();
  globalForDb.__juanbingSqlite = sqlite;
  globalForDb.__juanbingDb = db;
}

export const sqlite = globalForDb.__juanbingSqlite!;
export const db = globalForDb.__juanbingDb!;
