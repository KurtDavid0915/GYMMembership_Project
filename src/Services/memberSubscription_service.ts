import { dbGet, dbAll, dbRun } from "../Database/database";
import inquirer from "inquirer";
import { memberSubscriptions } from "../Models/subscription";
import { MembershipPlanService } from "./membershipplans_service";
import { MemberService } from "./member_service";
import { waitForEnter } from "./Helper";

export class MemberSubscriptionService {
  static async addMemberSubscriptionPrompt(): Promise<void> {
    console.log("\nCurrent Members:");
    await MemberService.viewMembers();

    // 🔹 Ask for Member ID
    const memberAnswer = await inquirer.prompt([
      {
        type: "input",
        name: "member_ID",
        message: "Enter Member ID (type 'cancel' to exit):",
      },
    ]);

    if (memberAnswer.member_ID.toLowerCase() === "cancel") {
      console.log("❌ Add subscription cancelled.");
      return;
    }

    const memberID = parseInt(memberAnswer.member_ID);
    if (isNaN(memberID)) {
      console.log("❌ Invalid Member ID. Must be a number.");
      return;
    }

    // 🔹 Check member exists
    const memberExists = await dbGet(`SELECT * FROM members_tb WHERE ID = ?`, [memberID]);

    if (!memberExists) {
      console.log("❌ Member not found.");
      return;
    }

    console.log("\nCurrent Plans:");
    await MembershipPlanService.viewMembershipPlans();

    // 🔹 Ask for Plan ID
    const planAnswer = await inquirer.prompt([
      {
        type: "input",
        name: "plan_ID",
        message: "Enter Plan ID (type 'cancel' to exit):",
      },
    ]);

    if (planAnswer.plan_ID.toLowerCase() === "cancel") {
      console.log("❌ Add subscription cancelled.");
      return;
    }

    const planID = parseInt(planAnswer.plan_ID);
    if (isNaN(planID)) {
      console.log("❌ Invalid Plan ID. Must be a number.");
      return;
    }

    // 🔹 Check plan exists and get duration
    const plan = await dbGet<{ duration_days: number }>(`SELECT duration_days FROM membershipPlans_tb WHERE membership_ID = ?`, [planID]);

    if (!plan) {
      console.log("❌ Plan not found.");
      return;
    }

    // 🔹 Calculate start and end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration_days);

    const newSubscription: Omit<memberSubscriptions, "id"> = {
      member_id: memberID,
      plan_id: planID,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "active",
    };

    // 🔹 Insert subscription
    try {
      await dbRun(
        `INSERT INTO memberSubscriptions_tb (member_ID, plan_ID, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)`,
        [
          newSubscription.member_id,
          newSubscription.plan_id,
          newSubscription.start_date,
          newSubscription.end_date,
          newSubscription.status,
        ]
      );
      console.log(`✅ Subscription added for Member ID ${memberID}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("❌ Failed to add subscription:", msg);
    }
  }

  static async updateMemberSubscription(): Promise<void> {
    console.log("\nCurrent Subscriptions:");
    await this.viewMemberSubscriptions();

    const { id } = await inquirer.prompt([
      {
        type: "input",
        name: "id",
        message: "Enter Subscription ID to update (type 'exit' to cancel):",
        validate: (v) => v.trim() !== "" || "ID is required",
      },
    ]);

    if (id.toLowerCase() === "exit") {
      console.log("❌ Update cancelled.");
      return;
    }

    type SubscriptionWithDuration = {
      memberSubscriptions_ID: number;
      member_ID: number;
      plan_ID: number;
      start_date: string;
      end_date: string;
      status: "active" | "expired" | "canceled";
      duration_days: number;
    };

    const subscription = await dbGet<SubscriptionWithDuration>(
      `
      SELECT ms.*, p.duration_days
      FROM memberSubscriptions_tb ms
      JOIN membershipPlans_tb p ON ms.plan_ID = p.membership_ID
      WHERE ms.memberSubscriptions_ID = ?
      `,
      [id]
    );

    if (!subscription) {
      console.log("❌ Subscription not found.");
      return;
    }

    // 🔹 Choose update action
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message:
          "What would you like to update? \n Change Membership Plan, Extend Subscription, Change Status or Cancel Update: \n",
        choices: [
          "Change Membership Plan",
          "Extend Subscription",
          "Change Status",
          "Cancel Update",
        ],
      },
    ]);

    if (action === "Cancel Update") {
      console.log("❌ Update cancelled.");
      return;
    }

    // 🔄 CHANGE PLAN
    if (action === "Change Membership Plan") {
      const plans = await dbAll<{ membership_ID: number; name: string; duration_days: number }>(`SELECT membership_ID, name, duration_days FROM membershipPlans_tb`);

      const { plan_ID } = await inquirer.prompt([
        {
          type: "list",
          name: "plan_ID",
          message: "Select new plan:",
          choices: plans.map((p) => ({
            name: `${p.name} (${p.duration_days} days)`,
            value: p.membership_ID,
          })),
        },
      ]);

      const selectedPlan = plans.find((p) => p.membership_ID === plan_ID);
      if (!selectedPlan) {
        console.log("❌ Selected plan not found.");
        return;
      }

      const startDate = new Date(subscription.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + selectedPlan.duration_days);

      await dbRun(
        `
      UPDATE memberSubscriptions_tb
      SET plan_ID = ?, end_date = ?, status = 'active'
      WHERE memberSubscriptions_ID = ?
      `,
        [plan_ID, endDate.toISOString().split("T")[0], id]
      );

      console.log("✅ Plan updated and dates recalculated.");
      return;
    }

    // ➕ EXTEND SUBSCRIPTION
    if (action === "Extend Subscription") {
      const { extraDays } = await inquirer.prompt([
        {
          type: "input",
          name: "extraDays",
          message: "Enter number of days to extend:",
          validate: (v) => !isNaN(Number(v)) || "Enter a valid number",
        },
      ]);

      const endDate = new Date(subscription.end_date);
      endDate.setDate(endDate.getDate() + Number(extraDays));

      await dbRun(
        `
      UPDATE memberSubscriptions_tb
      SET end_date = ?, status = 'active'
      WHERE memberSubscriptions_ID = ?
      `,
        [endDate.toISOString().split("T")[0], id]
      );

      console.log(`✅ Subscription extended by ${extraDays} days.`);
      return;
    }

    // 🔁 CHANGE STATUS ONLY
    if (action === "Change Status") {
      const { status } = await inquirer.prompt([
        {
          type: "list",
          name: "status",
          message: "Select new status:",
          choices: ["active", "expired", "canceled"],
        },
      ]);

      await dbRun(
        `
      UPDATE memberSubscriptions_tb
      SET status = ?
      WHERE memberSubscriptions_ID = ?
      `,
        [status, id]
      );

      console.log("✅ Subscription status updated.");
      return;
    }
  }

  static async deleteMemberSubscription(): Promise<void> {
    console.log("\nCurrent Subscriptions:");
    await this.viewMemberSubscriptions();

    const { id } = await inquirer.prompt([
      {
        type: "input",
        name: "id",
        message: "Enter the Subscription ID to delete (type 'exit' to cancel):",
        validate: (v) => v.trim() !== "" || "ID is required",
      },
    ]);

    // 🔹 Cancel
    if (id.toLowerCase() === "exit") {
      console.log("❌ Deletion cancelled.");
      return;
    }

    const subscription = await dbGet(`SELECT * FROM memberSubscriptions_tb WHERE memberSubscriptions_ID = ?`, [id]);

    if (!subscription) {
      console.log("❌ Subscription not found.");
      return;
    }

    await dbRun(`DELETE FROM memberSubscriptions_tb WHERE memberSubscriptions_ID = ?`, [id]);

    console.log("✅ Member subscription successfully deleted.");
  }

  static async viewMemberSubscriptions(): Promise<void> {
    type SubscriptionView = {
      id: number;
      member_name: string;
      plan_name: string;
      start_date: string;
      end_date: string;
      status: string;
    };

    const rows: SubscriptionView[] = await dbAll<SubscriptionView>(
      `
      SELECT 
        ms.memberSubscriptions_ID AS id,
        m.Full_Name AS member_name,
        p.name AS plan_name,
        ms.start_date,
        ms.end_date,
        ms.status
      FROM memberSubscriptions_tb ms
      JOIN members_tb m ON ms.member_ID = m.ID
      JOIN membershipPlans_tb p ON ms.plan_ID = p.membership_ID
      `
    );

    if (!rows || rows.length === 0) {
      console.log("⚠️ No subscriptions found.");
      await waitForEnter();
      return;
    }

    console.log("\n--- Member Subscriptions ---");
    rows.forEach((s) => {
      console.log(
        `ID: ${s.id} | Member: ${s.member_name} | Plan: ${s.plan_name} | ` +
          `Start: ${s.start_date} | End: ${s.end_date} | Status: ${s.status}`
      );
    });
    console.log("-----------------------------\n");

    // 🔹 Pause so user can read table
    await waitForEnter();
  }
}
