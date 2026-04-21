export type DocumentType = "rd" | "channel";

export interface ReconciliationDocument {
  id: string;
  type: DocumentType;
  title: string;
  statement_month: string;
  partner_name: string;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationItem {
  id?: string;
  document_id?: string;
  game_name: string;
  backend_revenue: number;
  discount_rate: number;
  discounted_revenue: number;
  voucher_amount: number;
  free_trial_amount: number;
  refund_amount: number;
  test_fee: number;
  welfare_coin: number;
  share_rate: number;
  tax_rate: number;
  channel_fee: number;
  billable_amount: number;
  share_amount: number;
  settlement_amount: number;
  sort_order: number;
}

export interface ReconciliationPayload {
  document: Omit<ReconciliationDocument, "id" | "created_at" | "updated_at">;
  items: ReconciliationItem[];
}
