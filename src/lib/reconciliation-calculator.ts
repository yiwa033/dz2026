import { ReconciliationItem } from "@/types/reconciliation";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const normalizeRate = (value: number) => {
  if (value > 1) return value / 100;
  return value;
};

export function toNumber(value: string | number | null | undefined) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export function calculateRow(
  row: Pick<
    ReconciliationItem,
    | "backend_revenue"
    | "discount_rate"
    | "voucher_amount"
    | "free_trial_amount"
    | "refund_amount"
    | "test_fee"
    | "welfare_coin"
    | "channel_fee"
    | "share_rate"
    | "tax_rate"
  >
) {
  const backendRevenue = toNumber(row.backend_revenue);
  const discountRate = toNumber(row.discount_rate);
  const voucher = toNumber(row.voucher_amount);
  const freeTrial = toNumber(row.free_trial_amount);
  const refund = toNumber(row.refund_amount);
  const testFee = toNumber(row.test_fee);
  const welfareCoin = toNumber(row.welfare_coin);
  const channelFee = toNumber(row.channel_fee);
  const shareRate = normalizeRate(toNumber(row.share_rate));
  const taxRate = normalizeRate(toNumber(row.tax_rate));

  const discounted_revenue = round2(backendRevenue * discountRate);
  const billable_amount = round2(
    discounted_revenue -
      voucher -
      freeTrial -
      refund -
      testFee -
      welfareCoin -
      channelFee
  );
  const share_amount = round2(billable_amount * shareRate);
  const settlement_amount = round2(share_amount * (1 - taxRate));

  return {
    discounted_revenue,
    billable_amount,
    share_amount,
    settlement_amount,
    share_rate: shareRate,
    tax_rate: taxRate
  };
}

export function calculateTotals(items: ReconciliationItem[]) {
  return items.reduce(
    (acc, item) => {
      acc.backend_revenue = round2(acc.backend_revenue + toNumber(item.backend_revenue));
      acc.discounted_revenue = round2(acc.discounted_revenue + toNumber(item.discounted_revenue));
      acc.billable_amount = round2(acc.billable_amount + toNumber(item.billable_amount));
      acc.share_amount = round2(acc.share_amount + toNumber(item.share_amount));
      acc.settlement_amount = round2(acc.settlement_amount + toNumber(item.settlement_amount));
      return acc;
    },
    {
      backend_revenue: 0,
      discounted_revenue: 0,
      billable_amount: 0,
      share_amount: 0,
      settlement_amount: 0
    }
  );
}

export function formatMoney(value: number) {
  return toNumber(value).toFixed(2);
}
