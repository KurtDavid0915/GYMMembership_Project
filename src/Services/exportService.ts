import fs from "fs";
import path from "path";
import { dbAll } from "../Database/database";

export class ExportService {
  private static async queryAll<T>(sql: string): Promise<T[]> {
    return (await dbAll(sql)) as T[];
  }

  static async exportAllToJson(outputFile?: string): Promise<void> {
    try {
      const members = await this.queryAll<{
        id: number;
        full_name: string;
        phone: string;
        email: string;
        join_date: string;
      }>(`
        SELECT ID AS id, Full_Name AS full_name, Phone AS phone, Email AS email, Join_Date AS join_date FROM members_tb
      `);

      const plans = await this.queryAll<{
        id: number;
        plan_name: string;
        duration_days: number;
        price: number;
      }>(`
        SELECT membership_ID AS id, name AS plan_name, duration_days, price FROM membershipPlans_tb
      `);

      const subscriptions = await this.queryAll<{
        id: number;
        member_name: string;
        plan_name: string;
        start_date: string;
        end_date: string;
        status: string;
      }>(`
        SELECT ms.memberSubscriptions_ID AS id,
               m.Full_Name AS member_name,
               p.name AS plan_name,
               ms.start_date,
               ms.end_date,
               ms.status
        FROM memberSubscriptions_tb ms
        JOIN members_tb m ON ms.member_ID = m.ID
        JOIN membershipPlans_tb p ON ms.plan_ID = p.membership_ID
      `);

      const data = { members, plans, subscriptions };

      const outPath = outputFile ?? path.join(process.cwd(), "Exports", "gym_data_export.json");

      await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
      await fs.promises.writeFile(outPath, JSON.stringify(data, null, 2), "utf8");

      console.log(`✅ Exported data to ${outPath}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("❌ Failed to export data:", msg);
    }
  }
}
