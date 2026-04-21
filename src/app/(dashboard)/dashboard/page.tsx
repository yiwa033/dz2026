import { Card } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase";

type ItemSummary = {
  settlement_amount: number | string | null;
  discounted_revenue: number | string | null;
  document_id: string | null;
};

type DocumentId = { id: string };

type RecentDocument = {
  id: string;
  type: "rd" | "channel";
  title: string;
  statement_month: string;
  partner_name: string;
  created_at: string;
};

export default async function DashboardPage() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { data: latestItems } = await supabaseAdmin
    .from("reconciliation_items")
    .select("settlement_amount, discounted_revenue, document_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: latestDocs } = await supabaseAdmin
    .from("reconciliation_documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: rdDocIds } = await supabaseAdmin
    .from("reconciliation_documents")
    .select("id")
    .eq("type", "rd")
    .gte("created_at", start.toISOString());
  const { data: channelDocIds } = await supabaseAdmin
    .from("reconciliation_documents")
    .select("id")
    .eq("type", "channel")
    .gte("created_at", start.toISOString());

  const rdIds = new Set(((rdDocIds ?? []) as DocumentId[]).map((d) => d.id));
  const channelIds = new Set(((channelDocIds ?? []) as DocumentId[]).map((d) => d.id));
  const currentMonthItems = ((latestItems ?? []) as ItemSummary[]).filter(
    (i): i is ItemSummary & { document_id: string } => Boolean(i.document_id)
  );

  const rdTotal = currentMonthItems
    .filter((i) => rdIds.has(i.document_id))
    .reduce((sum, i) => sum + Number(i.settlement_amount ?? 0), 0);
  const channelTotal = currentMonthItems
    .filter((i) => channelIds.has(i.document_id))
    .reduce((sum, i) => sum + Number(i.settlement_amount ?? 0), 0);
  const totalFlow = currentMonthItems.reduce((sum, i) => sum + Number(i.discounted_revenue ?? 0), 0);
  const typedLatestDocs = (latestDocs ?? []) as RecentDocument[];
  const pendingCount = typedLatestDocs.length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "本月研发结算总额", value: rdTotal },
          { label: "本月渠道结算总额", value: channelTotal },
          { label: "本月总流水", value: totalFlow },
          { label: "待处理记录数", value: pendingCount, integer: true }
        ].map((item) => (
          <Card key={item.label} className="p-3">
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="mt-2 text-xl font-semibold text-slate-800">
              {item.integer ? item.value : Number(item.value).toFixed(2)}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-3">
        <div className="mb-2 text-sm font-semibold">最近录入记录</div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="border border-slate-200 px-2 py-2">类型</th>
              <th className="border border-slate-200 px-2 py-2">标题</th>
              <th className="border border-slate-200 px-2 py-2">账期</th>
              <th className="border border-slate-200 px-2 py-2">合作方</th>
              <th className="border border-slate-200 px-2 py-2">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {typedLatestDocs.map((doc) => (
              <tr key={doc.id}>
                <td className="border border-slate-200 px-2 py-2">
                  {doc.type === "rd" ? "研发对账" : "渠道对账"}
                </td>
                <td className="border border-slate-200 px-2 py-2">{doc.title}</td>
                <td className="border border-slate-200 px-2 py-2">{doc.statement_month}</td>
                <td className="border border-slate-200 px-2 py-2">{doc.partner_name}</td>
                <td className="border border-slate-200 px-2 py-2">
                  {new Date(doc.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
