import { db } from "../Database/database";
import inquirer from "inquirer";
import { memberSubscriptions } from "../Models/subscription";
import { MembershipPlanService } from "./membershipplans_service";
import { MemberService } from "./member_service";

export class MemberSubscriptionService {
  static async addMemberSubscriptionPrompt(): Promise<void> {
    console.log("\nCurrent Members:");
    await MemberService.viewMembers();

    const memberAnswer = await inquirer.prompt([
      { type: "input", name: "member_ID", message: "Enter Member ID:" },
    ]);

    if (memberAnswer.member_ID.toLowerCase() === "cancel") {
      console.log("❌ Add subscription cancelled.");
      return;
    }

    console.log("\nCurrent Plans:");
    await MembershipPlanService.viewMembershipPlans();

    const planAnswer = await inquirer.prompt([
      { type: "input", name: "plan_ID", message: "Enter Plan ID:" },
    ]);

    if (planAnswer.plan_ID.toLowerCase() === "cancel") {
      console.log("❌ Add subscription cancelled.");
      return;
    }

    const plan = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT duration_days FROM membershipPlans_tb WHERE membership_ID = ?`,
        [planAnswer.plan_ID],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (!plan) {
      console.log("❌ Plan not found.");
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration_days);

    const newSubscription: Omit<memberSubscriptions, "id"> = {
      member_id: parseInt(memberAnswer.member_ID),
      plan_id: parseInt(planAnswer.plan_ID),
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "active",
    };

    db.run(
      `INSERT INTO memberSubscriptions_tb (member_ID, plan_ID, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)`,
      [
        newSubscription.member_id,
        newSubscription.plan_id,
        newSubscription.start_date,
        newSubscription.end_date,
        newSubscription.status,
      ],
      function (err) {
        if (err) console.error("❌ Failed to add subscription:", err.message);
        else console.log(`✅ Subscription added! ID: ${this.lastID}`);
      }
    );
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

    const subscription = await new Promise<any | null>((resolve, reject) => {
      db.get(
        `
      SELECT ms.*, p.duration_days
      FROM memberSubscriptions_tb ms
      JOIN membershipPlans_tb p ON ms.plan_ID = p.membership_ID
      WHERE ms.memberSubscriptions_ID = ?
      `,
        [id],
        (err, row) => (err ? reject(err) : resolve(row ?? null))
      );
    });

    if (!subscription) {
      console.log("❌ Subscription not found.");
      return;
    }

    // 🔹 Choose update action
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to update? \n Change Membership Plan, Extend Subscription, Change Status or Cancel Update: \n",
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
      const plans = await new Promise<any[]>((resolve, reject) => {
        db.all(
          `SELECT membership_ID, name, duration_days FROM membershipPlans_tb`,
          [],
          (err, rows) => (err ? reject(err) : resolve(rows))
        );
      });

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

      const startDate = new Date(subscription.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + selectedPlan.duration_days);

      await db.run(
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

      await db.run(
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

      await db.run(
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

    const subscription = await new Promise<any | null>((resolve, reject) => {
      db.get(
        `SELECT * FROM memberSubscriptions_tb 
       WHERE memberSubscriptions_ID = ?`,
        [id],
        (err, row) => (err ? reject(err) : resolve(row ?? null))
      );
    });

    if (!subscription) {
      console.log("❌ Subscription not found.");
      return;
    }

    await new Promise<void>((resolve, reject) => {
      db.run(
        `DELETE FROM memberSubscriptions_tb 
       WHERE memberSubscriptions_ID = ?`,
        [id],
        (err) => (err ? reject(err) : resolve())
      );
    });

    console.log("✅ Member subscription successfully deleted.");
  }

  static async viewMemberSubscriptions(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.all(
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
      `,
        [],
        async (err, rows: any[]) => {
          if (err) {
            console.error("❌ Failed to fetch subscriptions:", err.message);
            reject(err);
            return;
          }

          if (!rows || rows.length === 0) {
            console.log("⚠️ No subscriptions found.");
            await inquirer.prompt([
              {
                type: "input",
                name: "pause",
                message: "Press Enter to continue...",
              },
            ]);
            resolve();
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
          await inquirer.prompt([
            {
              type: "input",
              name: "pause",
              message: "Press Enter to continue...",
            },
          ]);

          resolve();
        }
      );
    });
  }
}
