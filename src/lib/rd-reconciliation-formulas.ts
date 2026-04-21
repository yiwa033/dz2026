export type RdNumericLike = number | string | null | undefined;

export interface RdRowInput {
  backend_revenue: RdNumericLike;
  discount_rate: RdNumericLike;
  voucher_amount: RdNumericLike;
  free_trial_amount: RdNumericLike;
  refund_amount: RdNumericLike;
  test_fee: RdNumericLike;
  welfare_coin: RdNumericLike;
  share_rate: RdNumericLike;
  tax_rate: RdNumericLike;
  channel_fee: RdNumericLike;
}

export interface RdRowResult {
  discounted_revenue: number;
  billable_amount: number;
  share_amount: number;
  settlement_amount: number;
  share_rate: number;
  tax_rate: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function toNumber(value: RdNumericLike) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

/**
 * 迁移自旧项目 src/domain/channel/channelBillingForm.js 的 resolveDiscountFactor：
 * 折扣系数空/非法/<=0 时按 1。
 */
function resolveDiscountFactor(discountRate: RdNumericLike) {
  if (discountRate === "" || discountRate === undefined || discountRate === null) return 1;
  const n = parseFloat(String(discountRate));
  if (!Number.isFinite(n) || n <= 0) return 1;
  return n;
}

/**
 * 研发对账单行计算：按旧项目 channelBillingForm.js 口径原样迁移
 * - 总流水 = 后台流水 * 折扣系数（2位）
 * - 计费额 = 总流水 - 代金券 - 无忧试 - 玩家退款 - 测试费 - 福利币
 * - 分成额 = 计费额 * (分成% / 100)
 * - 结算额 = 分成额 - 通道费 - (分成额 * 税率% / 100)
 */
export function calculateRdRow(row: RdRowInput): RdRowResult {
  const flow = toNumber(row.backend_revenue);
  const discountFactor = resolveDiscountFactor(row.discount_rate);
  const voucher = toNumber(row.voucher_amount);
  const noWorry = toNumber(row.free_trial_amount);
  const refund = toNumber(row.refund_amount);
  const test = toNumber(row.test_fee);
  const welfare = toNumber(row.welfare_coin);
  const shareRate = toNumber(row.share_rate);
  const taxRate = toNumber(row.tax_rate);
  const gatewayCost = toNumber(row.channel_fee);

  const discounted_revenue = round2(flow * discountFactor);
  const billableRaw = discounted_revenue - voucher - noWorry - refund - test - welfare;
  const shareRaw = billableRaw * (shareRate / 100);
  const settlementRaw = shareRaw - gatewayCost - shareRaw * (taxRate / 100);

  return {
    discounted_revenue,
    billable_amount: round2(billableRaw),
    share_amount: round2(shareRaw),
    settlement_amount: round2(settlementRaw),
    share_rate: shareRate,
    tax_rate: taxRate
  };
}
