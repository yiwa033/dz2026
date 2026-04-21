import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ReconciliationPayload } from "@/types/reconciliation";
import { calculateRow } from "@/lib/reconciliation-formulas";
import { calculateRdRow } from "@/lib/rd-reconciliation-formulas";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: doc, error: docError } = await supabaseAdmin
      .from("reconciliation_documents")
      .select("*")
      .eq("id", id)
      .single();
    if (docError) throw new Error(docError.message);
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("reconciliation_items")
      .select("*")
      .eq("document_id", id)
      .order("sort_order", { ascending: true });
    if (itemsError) throw new Error(itemsError.message);
    return NextResponse.json({
      success: true,
      message: "查询成功",
      data: { document: doc, items: items ?? [] }
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as ReconciliationPayload;

    const { error: docError } = await supabaseAdmin
      .from("reconciliation_documents")
      .update(body.document as any)
      .eq("id", id);
    if (docError) throw new Error(docError.message);

    const { error: oldItemsError } = await supabaseAdmin
      .from("reconciliation_items")
      .delete()
      .eq("document_id", id);
    if (oldItemsError) throw new Error(oldItemsError.message);

    const payload = body.items.map((item, idx) => {
      const calculated = body.document.type === "rd" ? calculateRdRow(item) : calculateRow(item);
      return {
        ...item,
        ...calculated,
        document_id: id,
        sort_order: idx + 1
      };
    });
    const { error: itemError } = await supabaseAdmin.from("reconciliation_items").insert(payload as any);
    if (itemError) throw new Error(itemError.message);

    return NextResponse.json({
      success: true,
      message: "保存成功",
      data: { id }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "保存失败",
        data: null
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error: itemError } = await supabaseAdmin
      .from("reconciliation_items")
      .delete()
      .eq("document_id", id);
    if (itemError) throw new Error(itemError.message);
    const { error } = await supabaseAdmin.from("reconciliation_documents").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({
      success: true,
      message: "删除成功",
      data: { id }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "删除失败",
        data: null
      },
      { status: 500 }
    );
  }
}
