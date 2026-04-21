"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateRdLegacyRow, calculateRow, calculateSummary, formatMoney } from "@/lib/reconciliation-formulas";
import { DocumentType, ReconciliationPayload } from "@/types/reconciliation";

const itemSchema = z.object({
  game_name: z.string().default(""),
  backend_revenue: z.coerce.number().default(0),
  discount_rate: z.coerce.number().default(0),
  discounted_revenue: z.coerce.number().default(0),
  voucher_amount: z.coerce.number().default(0),
  free_trial_amount: z.coerce.number().default(0),
  refund_amount: z.coerce.number().default(0),
  test_fee: z.coerce.number().default(0),
  welfare_coin: z.coerce.number().default(0),
  share_rate: z.coerce.number().default(0),
  tax_rate: z.coerce.number().default(0),
  channel_fee: z.coerce.number().default(0),
  billable_amount: z.coerce.number().default(0),
  share_amount: z.coerce.number().default(0),
  settlement_amount: z.coerce.number().default(0),
  sort_order: z.coerce.number().default(0)
});

const formSchema = z.object({
  title: z.string().min(1, "请输入标题"),
  statement_month: z.string().min(1, "请输入账期"),
  partner_name: z.string().min(1, "请输入合作方"),
  remark: z.string().optional(),
  items: z.array(itemSchema).min(1, "至少保留一行")
});

type FormValues = z.infer<typeof formSchema>;

const emptyRow = {
  game_name: "",
  backend_revenue: 0,
  discount_rate: 1,
  discounted_revenue: 0,
  voucher_amount: 0,
  free_trial_amount: 0,
  refund_amount: 0,
  test_fee: 0,
  welfare_coin: 0,
  share_rate: 30,
  tax_rate: 5,
  channel_fee: 0,
  billable_amount: 0,
  share_amount: 0,
  settlement_amount: 0,
  sort_order: 1
};

export function DocumentEditor({
  type,
  initialData,
  documentId
}: {
  type: DocumentType;
  initialData?: FormValues;
  documentId?: string;
}) {
  const [submitMode, setSubmitMode] = useState<"save" | "continue">("save");
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? {
      title: "",
      statement_month: "",
      partner_name: "",
      remark: "",
      items: [{ ...emptyRow }]
    }
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const items = form.watch("items");
  const totals = useMemo(() => calculateSummary(items), [items]);

  useEffect(() => {
    items.forEach((row, index) => {
      const calc = type === "rd" ? calculateRdLegacyRow(row) : calculateRow(row);
      const current = form.getValues(`items.${index}`);
      if (Number(current.discounted_revenue) !== calc.discounted_revenue) {
        form.setValue(`items.${index}.discounted_revenue`, calc.discounted_revenue);
      }
      if (Number(current.billable_amount) !== calc.billable_amount) {
        form.setValue(`items.${index}.billable_amount`, calc.billable_amount);
      }
      if (Number(current.share_amount) !== calc.share_amount) {
        form.setValue(`items.${index}.share_amount`, calc.share_amount);
      }
      if (Number(current.settlement_amount) !== calc.settlement_amount) {
        form.setValue(`items.${index}.settlement_amount`, calc.settlement_amount);
      }
      if (Number(current.share_rate) !== calc.share_rate) {
        form.setValue(`items.${index}.share_rate`, calc.share_rate);
      }
      if (Number(current.tax_rate) !== calc.tax_rate) {
        form.setValue(`items.${index}.tax_rate`, calc.tax_rate);
      }
    });
  }, [items, type, form]);

  const listHref = type === "rd" ? "/rd-reconciliation" : "/channel-reconciliation";

  async function onSubmit(values: FormValues) {
    const payload: ReconciliationPayload = {
      document: {
        type,
        title: values.title,
        statement_month: values.statement_month,
        partner_name: values.partner_name,
        remark: values.remark ?? ""
      },
      items: values.items.map((item, idx) => ({ ...item, sort_order: idx + 1 }))
    };

    const url = documentId ? `/api/documents/${documentId}` : "/api/documents";
    const method = documentId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      alert("保存失败，请检查数据");
      return;
    }
    const json = await res.json();
    const id = json.data?.id ?? documentId;
    if (!id) return;
    const detailUrl = type === "rd" ? `/rd-reconciliation/${id}` : `/channel-reconciliation/${id}`;
    if (!documentId && submitMode === "save") {
      window.location.href = detailUrl;
      return;
    }
    if (!documentId && submitMode === "continue") {
      form.reset({
        title: "",
        statement_month: values.statement_month,
        partner_name: values.partner_name,
        remark: values.remark ?? "",
        items: [{ ...emptyRow }]
      });
      alert("保存成功，已保留公共信息继续新增。");
      return;
    }
    alert("保存成功");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
      <Card className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">1）公共信息</div>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-slate-600">渠道/公司简称 *</div>
            <Input placeholder="如：广州触点互联网科技有限公司" {...form.register("title")} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-slate-600">合作方</div>
            <Input placeholder="可选" {...form.register("partner_name")} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-600">结算周期（月/份）</div>
            <Input placeholder="----年--月" {...form.register("statement_month")} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-600">通道费率（%）整单共用</div>
            <Input type="number" step="0.01" defaultValue={0} />
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">2）游戏明细（每行独立按公式计算结算金额）</div>
          <Button type="button" variant="outline" onClick={() => append({ ...emptyRow, sort_order: fields.length + 1 })}>
            + 新增一行游戏
          </Button>
        </div>
        <div className="mb-2 text-xs text-slate-500">
          折扣系数仅填数字（如 0.005 表示 0.05 折）。结算与导出均以「折算后总流水」为准。
        </div>
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1400px] border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50">
              {[
                "游戏名称",
                "后台流水",
                "折扣系数",
                "总流水",
                "代金券",
                "无忧试",
                "玩家退款",
                "测试费",
                "福利币",
                "分成%",
                "税率%",
                "通道费",
                "计费额",
                "分成额",
                "结算额",
                "操作"
              ].map((h) => (
                <th key={h} className="border border-slate-200 px-2 py-2 text-left whitespace-nowrap text-slate-700">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id}>
                <td className="border border-slate-200 px-1 py-1">
                  <Input {...form.register(`items.${index}.game_name`)} />
                </td>
                {[
                  "backend_revenue",
                  "discount_rate",
                  "discounted_revenue",
                  "voucher_amount",
                  "free_trial_amount",
                  "refund_amount",
                  "test_fee",
                  "welfare_coin",
                  "share_rate",
                  "tax_rate",
                  "channel_fee",
                  "billable_amount",
                  "share_amount",
                  "settlement_amount"
                ].map((name) => {
                  const readOnly = ["discounted_revenue", "billable_amount", "share_amount", "settlement_amount"].includes(
                    name
                  );
                  return (
                    <td key={name} className="border border-slate-200 px-1 py-1">
                      <Input
                        className="text-right"
                        readOnly={readOnly}
                        {...form.register(`items.${index}.${name as keyof (typeof items)[number]}` as const, {
                          valueAsNumber: true
                        })}
                      />
                    </td>
                  );
                })}
                <td className="border border-slate-200 px-1 py-1">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ ...form.getValues(`items.${index}`), sort_order: fields.length + 1 })}
                    >
                      复制
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      删除
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-50">
            <tr className="font-medium">
              <td className="border border-slate-200 px-2 py-2">汇总</td>
              <td className="border border-slate-200 px-2 py-2 text-right">{formatMoney(totals.backend_revenue)}</td>
              <td className="border border-slate-200 px-2 py-2 text-right">-</td>
              <td className="border border-slate-200 px-2 py-2 text-right">
                {formatMoney(totals.discounted_revenue)}
              </td>
              <td className="border border-slate-200 px-2 py-2 text-right">-</td>
              <td className="border border-slate-200 px-2 py-2 text-right">-</td>
              <td className="border border-slate-200 px-2 py-2 text-right">-</td>
              <td className="border border-slate-200 px-2 py-2 text-right">-</td>
              <td className="border border-slate-200 px-2 py-2 text-right">-</td>
              <td className="border border-slate-200 px-2 py-2 text-right">-</td>
              <td className="border border-slate-200 px-2 py-2 text-right">-</td>
              <td className="border border-slate-200 px-2 py-2 text-right">-</td>
              <td className="border border-slate-200 px-2 py-2 text-right">{formatMoney(totals.billable_amount)}</td>
              <td className="border border-slate-200 px-2 py-2 text-right">{formatMoney(totals.share_amount)}</td>
              <td className="border border-slate-200 px-2 py-2 text-right">{formatMoney(totals.settlement_amount)}</td>
              <td className="border border-slate-200 px-2 py-2 text-right">-</td>
            </tr>
          </tfoot>
        </table>
        </div>
      </Card>
      <Card className="p-3">
        <div className="mb-2 text-sm font-semibold text-slate-700">3）汇总</div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <div className="text-[11px] text-slate-500">原始后台流水合计</div>
            <div className="text-base font-semibold text-emerald-700">{formatMoney(totals.backend_revenue)}</div>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <div className="text-[11px] text-slate-500">折算后总流水（结算用）</div>
            <div className="text-base font-semibold text-emerald-700">{formatMoney(totals.discounted_revenue)}</div>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <div className="text-[11px] text-slate-500">总代金券</div>
            <div className="text-base font-semibold text-emerald-700">{formatMoney(items.reduce((s, i) => s + Number(i.voucher_amount || 0), 0))}</div>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <div className="text-[11px] text-slate-500">总结算金额</div>
            <div className="text-base font-semibold text-emerald-700">{formatMoney(totals.settlement_amount)}</div>
          </div>
        </div>
      </Card>
      <Card className="p-3">
        <div className="mb-2 text-sm font-semibold text-slate-700">备注与其它</div>
        <Input placeholder="备注" {...form.register("remark")} />
      </Card>
      <div className="flex items-center justify-between rounded-sm border border-slate-200 bg-white px-3 py-2">
        <div className="text-sm font-semibold text-slate-700">预计结算金额 ¥{formatMoney(totals.settlement_amount)}</div>
        <div className="flex gap-2">
          <Link href={listHref}>
            <Button type="button" variant="outline">
              返回列表
            </Button>
          </Link>
          {!documentId ? (
            <Button
              type="submit"
              variant="outline"
              onClick={() => {
                setSubmitMode("continue");
              }}
            >
              保存并继续新增
            </Button>
          ) : null}
          <Button
            type="submit"
            onClick={() => {
              setSubmitMode("save");
            }}
          >
            保存
          </Button>
        </div>
      </div>
    </form>
  );
}
