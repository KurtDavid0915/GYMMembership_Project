export interface memberSubscriptions {
  id?: number;
  member_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "canceled";
}