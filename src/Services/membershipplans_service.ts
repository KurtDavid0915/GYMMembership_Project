import inquirer from "inquirer";
import { dbGet, dbAll, dbRun } from "../Database/database";
import { membership_plans } from "../Models/membership_plans";
import { waitForEnter } from "./Helper";

export class MembershipPlanService {
  
  static async addMembershipPlanPrompt(): Promise<void> {
    console.log("\nCurrent Plans:");
    await this.viewMembershipPlans();
    
    const answers = await inquirer.prompt([
      { type: "input", name: "name", message: "Plan Name:", validate: (v) => v.trim() !== "" || "Plan name is required" },
      { type: "input", name: "duration_days", message: "Duration (days):", validate: (v) => !isNaN(Number(v)) || "Enter a valid number" },
      { type: "input", name: "price", message: "Price:", validate: (v) => !isNaN(Number(v)) || "Enter a valid price" },
    ]);

    const newPlan: Omit<membership_plans, "id"> = {
      plan_name: answers.name,
      duration_days: parseInt(answers.duration_days),
      price: parseFloat(answers.price),
    };

    const res = await dbRun(
      `INSERT INTO membershipPlans_tb (name, duration_days, price) VALUES (?, ?, ?)`,
      [newPlan.plan_name, newPlan.duration_days, newPlan.price]
    );
    if (res && res.lastID) console.log(`✅ Membership plan added! ID: ${res.lastID}`);
  }

  static async viewMembershipPlans(): Promise<void> {
    const rows: membership_plans[] = await dbAll<membership_plans>(
      `SELECT 
        membership_ID AS id,
        name AS plan_name,
        duration_days,
        price
       FROM membershipPlans_tb`
    );

    if (!rows || rows.length === 0) {
      console.log("⚠️ No membership plans found.");
      await waitForEnter();
      return;
    }

    console.log("\n--- Membership Plans ---");
    rows.forEach((p) => {
      const price = Number(p.price) || 0;
      console.log(
        `ID: ${p.id} | Plan Name: ${p.plan_name} | Duration: ${p.duration_days} days | Price: ₱${price.toFixed(2)}`
      );
    });

    await waitForEnter();
  }

  static async updateMembershipPlan(): Promise<void> {
    console.log("\nCurrent Plans:");
    await this.viewMembershipPlans();

    const { id } = await inquirer.prompt([
      {
        type: "input",
        name: "id",
        message:
          "Enter the ID of the membership plan to update (type 'exit' to cancel):",
        validate: (v) => v.trim() !== "" || "ID is required",
      },
    ]);

    // 🔹 Cancel operation
    if (id.toLowerCase() === "exit") {
      console.log("❌ Update cancelled.");
      return;
    }

    const plan = (await dbGet(`SELECT * FROM membershipPlans_tb WHERE membership_ID = ?`, [id])) as membership_plans | null;

    if (!plan) {
      console.log("❌ Membership plan not found.");
      return;
    }

    const updates = await inquirer.prompt([
      {
        type: "input",
        name: "plan_name",
        message: "Plan Name (type 'exit' to cancel):",
        default: plan.plan_name,
      },
      {
        type: "input",
        name: "duration_days",
        message: "Duration (days) (type 'exit' to cancel):",
        default: plan.duration_days.toString(),
      },
      {
        type: "input",
        name: "price",
        message: "Price (type 'exit' to cancel):",
        default: plan.price.toString(),
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
      `UPDATE membershipPlans_tb
       SET name = ?, duration_days = ?, price = ?
       WHERE membership_ID = ?`,
      [updates.plan_name, Number(updates.duration_days), Number(updates.price), id]
    );

    console.log("✅ Membership plan successfully updated.");
  }
  
  static async deleteMembershipPlan(): Promise<void> {
    console.log("\nCurrent Plans:");
    await this.viewMembershipPlans();

    const { id } = await inquirer.prompt([
      {
        type: "input",
        name: "id",
        message:
          "Enter the ID of the membership plan to delete (type 'exit' to cancel):",
        validate: (v) => v.trim() !== "" || "ID is required",
      },
    ]);
    // 🔹 Cancel operation
    if (id.toLowerCase() === "exit") {
      console.log("❌ Deletion cancelled.");
      return;
    }
    const plan = (await dbGet(`SELECT * FROM membershipPlans_tb WHERE membership_ID = ?`, [id])) as membership_plans | null;

    if (!plan) {
      console.log("❌ Membership plan not found.");
      return;
    }

    await dbRun(`DELETE FROM membershipPlans_tb WHERE membership_ID = ?`, [id]);

    console.log("✅ Membership plan successfully deleted.");
  }
}
