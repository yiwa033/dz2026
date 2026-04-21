import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/reconciliation/document-editor";
import { supabaseAdmin } from "@/lib/supabase";

export default async function ChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: doc } = await supabaseAdmin.from("reconciliation_documents").select("*").eq("id", id).single();
  if (!doc) return notFound();
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
        title: doc.title,
        statement_month: doc.statement_month,
        partner_name: doc.partner_name,
        remark: doc.remark ?? "",
        items: (items ?? []) as any
      }}
    />
  );
}
