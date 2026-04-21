import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/reconciliation/document-editor";
import { supabaseAdmin } from "@/lib/supabase";

export default async function ChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: doc } = await supabaseAdmin.from("reconciliation_documents").select("*").eq("id", id).single();
  if (!doc) return notFound();
  const document = doc as {
    title: string;
    statement_month: string;
    partner_name: string;
    remark: string | null;
  };
  const { data: items } = await supabaseAdmin
    .from("reconciliation_items")
    .select("*")
    .eq("document_id", id)
    .order("sort_order", { ascending: true });
  return (
    <DocumentEditor
      type="channel"
      documentId={id}
      initialData={{
        title: document.title,
        statement_month: document.statement_month,
        partner_name: document.partner_name,
        remark: document.remark ?? "",
        items: (items ?? []) as any
      }}
    />
  );
}
