import { dbGet, dbAll, dbRun } from "../Database/database";
import inquirer from "inquirer";
import { Member } from "../Models/members";
import { waitForEnter } from "./Helper";

export class MemberService {
  
  static async addMemberPrompt(): Promise<void> {
    console.log("\nCurrent Members:");
    await this.viewMembers(false); // ❌ Don't pause here

    const answers = await inquirer.prompt([
      { type: "input", name: "full_name", message: "Full Name:", validate: (v) => v.trim() !== "" || "Full name is required" },
      { type: "input", name: "phone", message: "Phone (optional):" },
      { type: "input", name: "email", message: "Email (optional):" },
    ]);

    const join_date = new Date().toISOString();

    const newMember: Omit<Member, "id"> = {
      full_name: answers.full_name,
      phone: answers.phone || null,
      email: answers.email || null,
      join_date,
    };

    const insertRes = await dbRun(
      `INSERT INTO members_tb (full_name, phone, email, join_date) VALUES (?, ?, ?, ?)`,
      [newMember.full_name, newMember.phone, newMember.email, newMember.join_date]
    );
    if (insertRes && insertRes.lastID) console.log(`✅ Member added! ID: ${insertRes.lastID}`);

    await waitForEnter(); // ✅ Pause only after member is added
  }
  static async viewMembers(pause: boolean = true): Promise<void> {
    const rows: Member[] = await dbAll(
      `SELECT ID AS id, Full_Name AS full_name, Phone AS phone, Email AS email, Join_Date AS join_date
       FROM members_tb`
    );

    if (!rows || rows.length === 0) {
      console.log("⚠️ No members found.");
      if (pause) await waitForEnter();
      return;
    }

    console.log("\n--- GYM Members ---");
    rows.forEach((m) =>
      console.log(
        `ID: ${m.id ?? "-"} | Name: ${m.full_name} | Phone: ${m.phone ?? "-"} | Email: ${m.email ?? "-"}`
      )
    );
    console.log("---------------\n");

    if (pause) await waitForEnter();
  }
  static async deleteMember(): Promise<void> {
    console.log("\nCurrent Members:");
    await this.viewMembers();

    const { ID } = await inquirer.prompt([
      {
        type: "input",
        name: "ID",
        message: "Enter ID of Individual to DELETE (type 'exit' to cancel):",
        validate: (val) => val.trim() !== "" || "ID is required",
      },
    ]);

    // 🔹 Cancel operation
    if (ID.toLowerCase() === "exit") {
      console.log("❌ Deletion cancelled.");
      return;
    }

    const member = await dbGet<{ ID: number; Full_Name: string }>(`SELECT ID, Full_Name FROM members_tb WHERE ID = ?`, [ID]);

    if (!member) {
      console.log("❌ Member not found.");
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to delete ${member.Full_Name}?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log("❌ Deletion cancelled.");
      return;
    }

    await dbRun(`DELETE FROM members_tb WHERE ID = ?`, [ID]);

    console.log("✅ Member successfully deleted.");
  }
  static async updateMember(): Promise<void> {
    console.log("\nCurrent Members:");
    await this.viewMembers();

    const { ID } = await inquirer.prompt([
      {
        type: "input",
        name: "ID",
        message: "Enter ID of Individual to UPDATE (type 'exit' to cancel):",
        validate: (val) => val.trim() !== "" || "ID is required",
      },
    ]);

    // 🔹 Cancel operation
    if (ID.toLowerCase() === "exit") {
      console.log("❌ Update cancelled.");
      return;
    }

    const member = await dbGet<{
      ID: number;
      Full_Name: string;
      Phone?: string;
      Email?: string;
      Join_Date?: string;
    }>(`SELECT * FROM members_tb WHERE ID = ?`, [ID]);

    if (!member) {
      console.log("❌ Member not found.");
      return;
    }

    const updates = await inquirer.prompt([
      {
        type: "input",
        name: "full_name",
        message: "Full Name (type 'exit' to cancel):",
        default: member.Full_Name,
      },
      {
        type: "input",
        name: "phone",
        message: "Phone (type 'exit' to cancel):",
        default: member.Phone || "",
      },
      {
        type: "input",
        name: "email",
        message: "Email (type 'exit' to cancel):",
        default: member.Email || "",
      },
    ]);

    // 🔹 Cancel if ANY field is 'exit'
    if (
      Object.values(updates).some(
        (v) => typeof v === "string" && v.toLowerCase() === "exit"
      )
    ) {
      console.log("❌ Update cancelled.");
      return;
    }

    await dbRun(
      `UPDATE members_tb
        SET Full_Name = ?, Phone = ?, Email = ?
        WHERE ID = ?`,
      [updates.full_name, updates.phone || null, updates.email || null, ID]
    );

    console.log("✅ Member successfully updated.");
  }
  static async searchMembers(): Promise<void> {
    console.log("\nSearch Members:");

    const { searchTerm } = await inquirer.prompt([
      {
        type: "input",
        name: "searchTerm",
        message:
          "\n(type Exit to go back to Menu)\nEnter name or ID to search for members:",
        validate: (val) => val.trim() !== "" || "Search term is required",
      },
    ]);

    const term = searchTerm.trim();
    if (term.toLowerCase() === "exit") {
      console.log("↩ Returning to main menu...");
      return;
    }

    // If user entered a pure integer, search by ID for exact match
    if (/^\d+$/.test(term)) {
      const m = await dbGet<Member>(
        `SELECT ID AS id, Full_Name AS full_name, Phone AS phone, Email AS email, Join_Date AS join_date FROM members_tb WHERE ID = ?`,
        [Number(term)]
      );

      if (!m) {
        console.log("⚠️ No member found with that ID.");
        await waitForEnter();
        return;
      }

      console.log("\n--- Member Found ---");
      console.log(
        `ID: ${m.id} | Name: ${m.full_name} | Phone: ${m.phone || "-"} | Email: ${m.email || "-"}`
      );
      console.log("---------------------\n");
      await waitForEnter();
      return;
    }

    // Otherwise perform a case-insensitive name search
    const rows: Member[] = await dbAll(
      `SELECT ID AS id, Full_Name AS full_name, Phone AS phone, Email AS email, Join_Date AS join_date FROM members_tb WHERE LOWER(Full_Name) LIKE ?`,
      [`%${term.toLowerCase()}%`]
    );

    if (!rows || rows.length === 0) {
      console.log("⚠️ No matching members found.");
      await waitForEnter();
      return;
    }

    console.log("\n--- Search Results ---");
    rows.forEach((m) => {
      console.log(
        `ID: ${m.id} | Name: ${m.full_name} | Phone: ${m.phone || "-"} | Email: ${m.email || "-"}`
      );
    });
    console.log("----------------------\n");
    await waitForEnter();
  }
}
