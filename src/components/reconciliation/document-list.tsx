"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DocumentType, ReconciliationDocument } from "@/types/reconciliation";

type ListRow = ReconciliationDocument & {
  itemCount: number;
  settlementTotal: number;
};

interface Props {
  type: DocumentType;
  title: string;
}

export function DocumentList({ type, title }: Props) {
  const [list, setList] = useState<ListRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statementMonth, setStatementMonth] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const totalPage = Math.max(1, Math.ceil(total / pageSize));

  async function loadData() {
    const params = new URLSearchParams({
      type,
      keyword,
      statementMonth,
      page: String(page),
      pageSize: String(pageSize)
    });
    const res = await fetch(`/api/documents?${params.toString()}`);
    const json = await res.json();
    if (!json.success) return;
    setList(json.data?.list ?? []);
    setTotal(json.data?.total ?? 0);
  }

  useEffect(() => {
    void loadData();
  }, [type, keyword, statementMonth, page]);

  const newHref = useMemo(
    () => (type === "rd" ? "/rd-reconciliation/new" : "/channel-reconciliation/new"),
    [type]
  );

  const detailHref = (id: string) =>
    type === "rd" ? `/rd-reconciliation/${id}` : `/channel-reconciliation/${id}`;

  async function remove(id: string) {
    if (!window.confirm("确认删除该对账单？此操作不可恢复。")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      alert(json.message || "删除失败");
      return;
    }
    await loadData();
  }

  return (
    <Card className="p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">{title}</div>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="搜索标题/合作方"
            value={keyword}
            onChange={(e) => {
              setPage(1);
              setKeyword(e.target.value);
            }}
            className="w-52"
          />
          <Input
            type="month"
            value={statementMonth}
            onChange={(e) => {
              setPage(1);
              setStatementMonth(e.target.value);
            }}
            className="w-40"
          />
          <Link href={newHref}>
            <Button>新建对账单</Button>
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 text-left">
            <th className="border border-slate-200 px-2 py-2">对账单标题</th>
            <th className="border border-slate-200 px-2 py-2">对账月份</th>
            <th className="border border-slate-200 px-2 py-2">合作方</th>
            <th className="border border-slate-200 px-2 py-2 text-right">明细条数</th>
            <th className="border border-slate-200 px-2 py-2 text-right">结算总额</th>
            <th className="border border-slate-200 px-2 py-2">更新时间</th>
            <th className="border border-slate-200 px-2 py-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td className="border border-slate-200 px-2 py-8 text-center text-slate-500" colSpan={7}>
                暂无对账数据，请先新建对账单。
              </td>
            </tr>
          ) : null}
          {list.map((item) => (
            <tr key={item.id}>
              <td className="border border-slate-200 px-2 py-2">{item.title}</td>
              <td className="border border-slate-200 px-2 py-2">{item.statement_month}</td>
              <td className="border border-slate-200 px-2 py-2">{item.partner_name}</td>
              <td className="border border-slate-200 px-2 py-2 text-right">{item.itemCount}</td>
              <td className="border border-slate-200 px-2 py-2 text-right">{item.settlementTotal.toFixed(2)}</td>
              <td className="border border-slate-200 px-2 py-2">
                {new Date(item.updated_at).toLocaleString()}
              </td>
              <td className="border border-slate-200 px-2 py-2">
                <div className="flex gap-2">
                  <Link href={detailHref(item.id)}>
                    <Button variant="outline">查看</Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/api/export?documentId=${item.id}`, "_blank")}
                  >
                    导出
                  </Button>
                  <Button variant="danger" onClick={() => void remove(item.id)}>
                    删除
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          上一页
        </Button>
        <span className="text-xs text-slate-600">
          第 {page}/{totalPage} 页，共 {total} 条
        </span>
        <Button variant="outline" disabled={page >= totalPage} onClick={() => setPage((p) => p + 1)}>
          下一页
        </Button>
      </div>
    </Card>
  );
}
