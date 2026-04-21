import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateSummary, formatMoney } from "@/lib/reconciliation-formulas";

type ExportItemRow = {
  game_name: string;
  backend_revenue: number | string | null;
  discount_rate: number | string | null;
  discounted_revenue: number | string | null;
  voucher_amount: number | string | null;
  free_trial_amount: number | string | null;
  refund_amount: number | string | null;
  test_fee: number | string | null;
  welfare_coin: number | string | null;
  share_rate: number | string | null;
  tax_rate: number | string | null;
  channel_fee: number | string | null;
  billable_amount: number | string | null;
  share_amount: number | string | null;
  settlement_amount: number | string | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) {
      return NextResponse.json({ success: false, message: "缺少 documentId", data: null }, { status: 400 });
    }

    const { data: doc } = await supabaseAdmin
      .from("reconciliation_documents")
      .select("*")
      .eq("id", documentId)
      .single();
    const { data: items } = await supabaseAdmin
      .from("reconciliation_items")
      .select("*")
      .eq("document_id", documentId)
      .order("sort_order", { ascending: true });
    if (!doc) {
      return NextResponse.json({ success: false, message: "未找到对账单", data: null }, { status: 404 });
    }

    const detailRows = ((items ?? []) as ExportItemRow[]).map((i: ExportItemRow) => ({
      游戏名称: i.game_name,
      后台流水: Number(i.backend_revenue).toFixed(2),
      折扣系数: i.discount_rate,
      总流水: Number(i.discounted_revenue).toFixed(2),
      代金券: Number(i.voucher_amount).toFixed(2),
      无忧试: Number(i.free_trial_amount).toFixed(2),
      玩家退款: Number(i.refund_amount).toFixed(2),
      测试费: Number(i.test_fee).toFixed(2),
      福利币: Number(i.welfare_coin).toFixed(2),
      "分成%": i.share_rate,
      "税率%": i.tax_rate,
      通道费: Number(i.channel_fee).toFixed(2),
      计费额: Number(i.billable_amount).toFixed(2),
      分成额: Number(i.share_amount).toFixed(2),
      结算额: Number(i.settlement_amount).toFixed(2)
    }));
    const totals = calculateSummary((items ?? []) as any);
    detailRows.push({
      游戏名称: "汇总",
      后台流水: formatMoney(totals.backend_revenue),
      折扣系数: "",
      总流水: formatMoney(totals.discounted_revenue),
      代金券: "",
      无忧试: "",
      玩家退款: "",
      测试费: "",
      福利币: "",
      "分成%": "",
      "税率%": "",
      通道费: "",
      计费额: formatMoney(totals.billable_amount),
      分成额: formatMoney(totals.share_amount),
      结算额: formatMoney(totals.settlement_amount)
    });

    const infoRows = [
      { 字段: "对账类型", 值: doc.type === "rd" ? "研发对账" : "渠道对账" },
      { 字段: "对账单标题", 值: doc.title },
      { 字段: "对账月份", 值: doc.statement_month },
      { 字段: "合作方", 值: doc.partner_name },
      { 字段: "备注", 值: doc.remark ?? "" },
      { 字段: "更新时间", 值: new Date(doc.updated_at).toLocaleString() }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infoRows), "主表信息");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), "明细数据");

    const filePrefix = doc.type === "rd" ? "研发对账" : "渠道对账";
    const filename = `${filePrefix}_${doc.statement_month}_${doc.partner_name}.xlsx`;
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "导出失败",
        data: null
      },
      { status: 500 }
    );
  }
}
