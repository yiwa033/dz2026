import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ReconciliationPayload } from "@/types/reconciliation";
import { calculateRdLegacyRow, calculateRow } from "@/lib/reconciliation-formulas";

type DocRow = { id: string; [key: string]: any };
type ItemAggRow = { document_id: string; settlement_amount: number | string | null };

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const keyword = searchParams.get("keyword") ?? "";
    const statementMonth = searchParams.get("statementMonth") ?? "";
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "10");
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (!hasSupabaseEnv()) {
      return NextResponse.json({
        success: true,
        message: "Supabase 环境变量未配置，返回空数据。",
        data: {
          list: [],
          total: 0,
          page,
          pageSize
        }
      });
    }

    let countQuery = supabaseAdmin
      .from("reconciliation_documents")
      .select("id", { count: "exact", head: true });
    let listQuery = supabaseAdmin
      .from("reconciliation_documents")
      .select("*")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (type) {
      countQuery = countQuery.eq("type", type);
      listQuery = listQuery.eq("type", type);
    }
    if (statementMonth) {
      countQuery = countQuery.eq("statement_month", statementMonth);
      listQuery = listQuery.eq("statement_month", statementMonth);
    }
    if (keyword) {
      const cond = `title.ilike.%${keyword}%,partner_name.ilike.%${keyword}%`;
      countQuery = countQuery.or(cond);
      listQuery = listQuery.or(cond);
    }

    const [{ count, error: countError }, { data: docs, error: docsError }] = await Promise.all([
      countQuery,
      listQuery
    ]);
    if (countError || docsError) {
      throw new Error(countError?.message || docsError?.message || "查询失败");
    }

    const ids = ((docs ?? []) as DocRow[]).map((doc: DocRow) => doc.id);
    let itemsMap = new Map<string, { itemCount: number; settlementTotal: number }>();
    if (ids.length) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from("reconciliation_items")
        .select("document_id, settlement_amount")
        .in("document_id", ids);
      if (itemsError) throw new Error(itemsError.message);
      itemsMap = ((items ?? []) as ItemAggRow[]).reduce((map, item: ItemAggRow) => {
        const current = map.get(item.document_id) ?? { itemCount: 0, settlementTotal: 0 };
        current.itemCount += 1;
        current.settlementTotal += Number(item.settlement_amount ?? 0);
        map.set(item.document_id, current);
        return map;
      }, new Map<string, { itemCount: number; settlementTotal: number }>());
    }

    const list = ((docs ?? []) as DocRow[]).map((doc: DocRow) => ({
      ...doc,
      itemCount: itemsMap.get(doc.id)?.itemCount ?? 0,
      settlementTotal: Number((itemsMap.get(doc.id)?.settlementTotal ?? 0).toFixed(2))
    }));

    return NextResponse.json({
      success: true,
      message: "查询成功",
      data: {
        list,
        total: count ?? 0,
        page,
        pageSize
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "查询失败",
        data: null
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReconciliationPayload;
    const { data: doc, error: docError } = await supabaseAdmin
      .from("reconciliation_documents")
      .insert(body.document)
      .select("id")
      .single();
    if (docError || !doc) throw new Error(docError?.message || "新建主表失败");

    const payload = body.items.map((item, idx) => {
      const calculated = body.document.type === "rd" ? calculateRdLegacyRow(item) : calculateRow(item);
      return {
        ...item,
        ...calculated,
        document_id: doc.id,
        sort_order: idx + 1
      };
    });
    const { error: itemError } = await supabaseAdmin.from("reconciliation_items").insert(payload);
    if (itemError) throw new Error(itemError.message);

    return NextResponse.json({
      success: true,
      message: "新建成功",
      data: { id: doc.id }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "新建失败",
        data: null
      },
      { status: 500 }
    );
  }
}
