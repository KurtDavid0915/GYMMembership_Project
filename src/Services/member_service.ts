import { db } from "../Database/database";
import inquirer from "inquirer";
import { Member } from "../Models/members";

export class MemberService {
  // Add a new member
  static async addMemberPrompt(): Promise<void> {

    console.log("\nCurrent Members:");
    await this.viewMembers();
    
    const answers = await inquirer.prompt([
      { type: "input", name: "full_name", message: "Full Name:" },
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

    db.run(
      `INSERT INTO members_tb (full_name, phone, email, join_date) VALUES (?, ?, ?, ?)`,
      [newMember.full_name, newMember.phone, newMember.email, newMember.join_date],
      function (err) {
        if (err) console.error("❌ Failed to add member:", err.message);
        else console.log(`✅ Member added! ID: ${this.lastID.toString()}`);
      }
    );
  }
    // View all members
  static async viewMembers(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
        ID AS id, 
        Full_Name AS full_name, 
        Phone AS phone, 
        Email AS email, 
        Join_Date AS join_date 
      FROM members_tb`,
      [],
      (err, rows: Member[]) => {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }

        if (!rows || rows.length === 0) {
          console.log("No members found.");
          resolve(); // ✅ still resolve
          return;
        }

        console.log("\n--- GYM Members ---");
        rows.forEach((m: Member) =>
          console.log(
            `ID: ${m.id ?? "-"} | Name: ${m.full_name} | Phone: ${m.phone ?? "-"} | Email: ${m.email ?? "-"}`
          )
        );
        console.log("---------------\n");

        resolve(); // 🔹 CRITICAL LINE
      }
    );
  });
  }
    // Delete a member by ID
  static async deleteMember(): Promise<void> {
    console.log("\nCurrent Members:");
    await this.viewMembers();

    const { ID } = await inquirer.prompt([
      {
        type: "input",
        name: "ID",
        message: "Enter ID of Individual to DELETE (type 'exit' to cancel):",
        validate: (val) => val.trim() !== "" || "ID is required"
      }
    ]);

    // 🔹 Cancel operation
    if (ID.toLowerCase() === "exit") {
      console.log("❌ Deletion cancelled.");
      return;
    }

    const member = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT ID, Full_Name FROM members_tb WHERE ID = ?`,
        [ID],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (!member) {
      console.log("❌ Member not found.");
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to delete ${member.Full_Name}?`,
        default: false
      }
    ]);

    if (!confirm) {
      console.log("❌ Deletion cancelled.");
      return;
    }

    await new Promise<void>((resolve, reject) => {
      db.run(
        `DELETE FROM members_tb WHERE ID = ?`,
        [ID],
        (err) => (err ? reject(err) : resolve())
      );
    });

    console.log("✅ Member successfully deleted.");
  }
  // Update a member by ID
  static async updateMember(): Promise<void> {
    console.log("\nCurrent Members:");
    await this.viewMembers();

    const { ID } = await inquirer.prompt([
      {
        type: "input",
        name: "ID",
        message: "Enter ID of Individual to UPDATE (type 'exit' to cancel):",
        validate: (val) => val.trim() !== "" || "ID is required"
      }
    ]);

    // 🔹 Cancel operation
    if (ID.toLowerCase() === "exit") {
      console.log("❌ Update cancelled.");
      return;
    }

    const member = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT * FROM members_tb WHERE ID = ?`,
        [ID],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (!member) {
      console.log("❌ Member not found.");
      return;
    }

    const updates = await inquirer.prompt([
      {
        type: "input",
        name: "full_name",
        message: "Full Name (type 'exit' to cancel):",
        default: member.Full_Name
      },
      {
        type: "input",
        name: "phone",
        message: "Phone (type 'exit' to cancel):",
        default: member.Phone || ""
      },
      {
        type: "input",
        name: "email",
        message: "Email (type 'exit' to cancel):",
        default: member.Email || ""
      }
    ]);

    // 🔹 Cancel if ANY field is 'exit'
    if (
      Object.values(updates).some(
        v => typeof v === "string" && v.toLowerCase() === "exit"
      )
    ) {
      console.log("❌ Update cancelled.");
      return;
    }

    await new Promise<void>((resolve, reject) => {
      db.run(
        `UPDATE members_tb
        SET Full_Name = ?, Phone = ?, Email = ?
        WHERE ID = ?`,
        [
          updates.full_name,
          updates.phone || null,
          updates.email || null,
          ID
        ],
        (err) => (err ? reject(err) : resolve())
      );
    });

    console.log("✅ Member successfully updated.");
  }

}