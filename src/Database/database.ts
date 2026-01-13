import sqlite3 from "sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "Data", "GymMembership_DB.db");

export let db: sqlite3.Database;

export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
 