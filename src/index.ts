#!/usr/bin/env node
// TEMP: DB connection test
import { initDatabase } from "./Database/database";
import { showMainMenu } from "./Cli/MainMenu";

(async () => {
  try {
    await initDatabase(); // wait for DB connection first
    console.log("🏋️ GymTrack CLI started");
    console.log("✅ Connected to existing DB: GymMembership_DB.db\n");

    await showMainMenu(); // call menu after DB is ready
  } catch (err) {
    console.error("❌ Failed to connect to DB:", err);
    process.exit(1);
  }
})();