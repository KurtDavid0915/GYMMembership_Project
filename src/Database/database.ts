import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "Data");
const dbPath = path.join(dataDir, "GymMembership_DB.db");

export let db: sqlite3.Database;

type DBParams = unknown[];

async function ensureDataDir(): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(dataDir, { recursive: true }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function ensureTables(): Promise<void> {
  const createMembers = `CREATE TABLE IF NOT EXISTS members_tb (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Full_Name TEXT NOT NULL,
    Phone TEXT,
    Email TEXT,
    Join_Date TEXT NOT NULL
  );`;

  const createPlans = `CREATE TABLE IF NOT EXISTS membershipPlans_tb (
    membership_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    price INTEGER NOT NULL
  );`;

  const createSubscriptions = `CREATE TABLE IF NOT EXISTS memberSubscriptions_tb (
    memberSubscriptions_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    member_ID INTEGER NOT NULL,
    plan_ID INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY(member_ID) REFERENCES members_tb(ID),
    FOREIGN KEY(plan_ID) REFERENCES membershipPlans_tb(membership_ID)
  );`;

  await dbRun(createMembers);
  await dbRun(createPlans);
  await dbRun(createSubscriptions);
}

export function initDatabase(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      await ensureDataDir();
    } catch (err) {
      return reject(err);
    }

    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) return reject(err);

      try {
        await ensureTables();
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

export function dbGet<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    db.get(sql, params as DBParams, (err, row) => {
      if (err) reject(err);
      else resolve((row as T) ?? null);
    });
  });
}

export function dbAll<T = unknown>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params as DBParams, (err, rows) => {
      if (err) reject(err);
      else resolve((rows as T[]) ?? []);
    });
  });
}

export function dbRun(
  sql: string,
  params: unknown[] = []
): Promise<{ lastID?: number; changes?: number }> {
  return new Promise((resolve, reject) => {
    db.run(
      sql,
      params as DBParams,
      function (this: sqlite3.RunResult, err: Error | null) {
        if (err) reject(err);
        else {
          const r = this as unknown as { lastID?: number; changes?: number };
          resolve({ lastID: r.lastID, changes: r.changes });
        }
      }
    );
  });
}
