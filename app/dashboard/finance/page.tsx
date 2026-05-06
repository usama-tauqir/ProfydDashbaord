// app/dashboard/finance/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  AlertCircle,
  Banknote,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Edit3,
  FileText,
  Loader2,
  Receipt,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";


type FinanceReport = {
  id: string;
  report_month: string;
  owner: string;
  frequency: string;
  invoiced_amount: number;
  cash_collected: number;
  outstanding_receivables: number;
  aging_0_30: number;
  aging_31_60: number;
  aging_61_90: number;
  aging_90_plus: number;
  voids_count: number;
  voids_value: number;
  refunds_count: number;
  refunds_value: number;
  chargebacks_count: number;
  chargebacks_value: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type FinanceForm = {
  report_month: string;
  owner: string;
  frequency: string;
  invoiced_amount: string;
  cash_collected: string;
  outstanding_receivables: string;
  aging_0_30: string;
  aging_31_60: string;
  aging_61_90: string;
  aging_90_plus: string;
  voids_count: string;
  voids_value: string;
  refunds_count: string;
  refunds_value: string;
  chargebacks_count: string;
  chargebacks_value: string;
  notes: string;
};

type HistoryRow = {
  month: string;
  invoiced: number;
  collected: number;
  outstanding: number;
  voids: number;
  refunds: number;
  chargebacks: number;
  collectionRate: number;
};

const COLORS = {
  blue: "#2563eb",
  sky: "#0ea5e9",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  slate: "#64748b",
};

const CHART_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.red, COLORS.violet, COLORS.cyan];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function toNumber(value: string | number | null | undefined) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function calcPercent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function money(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatMonth(value: string) {
  if (!value) return "Unknown";
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const emptyForm: FinanceForm = {
  report_month: currentMonth(),
  owner: "Farah and Zeeshan",
  frequency: "Monthly",
  invoiced_amount: "",
  cash_collected: "",
  outstanding_receivables: "",
  aging_0_30: "",
  aging_31_60: "",
  aging_61_90: "",
  aging_90_plus: "",
  voids_count: "",
  voids_value: "",
  refunds_count: "",
  refunds_value: "",
  chargebacks_count: "",
  chargebacks_value: "",
  notes: "",
};

function fallbackReport(): FinanceReport {
  return {
    id: "fallback",
    report_month: currentMonth(),
    owner: "Farah and Zeeshan",
    frequency: "Monthly",
    invoiced_amount: 148500,
    cash_collected: 132800,
    outstanding_receivables: 15700,
    aging_0_30: 8200,
    aging_31_60: 4200,
    aging_61_90: 2100,
    aging_90_plus: 1200,
    voids_count: 6,
    voids_value: 1850,
    refunds_count: 4,
    refunds_value: 2200,
    chargebacks_count: 1,
    chargebacks_value: 450,
    notes: "Demo data. Save your first monthly finance report to replace this.",
  };
}

function reportToForm(report: FinanceReport): FinanceForm {
  return {
    report_month: report.report_month,
    owner: report.owner ?? "Farah and Zeeshan",
    frequency: report.frequency ?? "Monthly",
    invoiced_amount: String(report.invoiced_amount ?? 0),
    cash_collected: String(report.cash_collected ?? 0),
    outstanding_receivables: String(report.outstanding_receivables ?? 0),
    aging_0_30: String(report.aging_0_30 ?? 0),
    aging_31_60: String(report.aging_31_60 ?? 0),
    aging_61_90: String(report.aging_61_90 ?? 0),
    aging_90_plus: String(report.aging_90_plus ?? 0),
    voids_count: String(report.voids_count ?? 0),
    voids_value: String(report.voids_value ?? 0),
    refunds_count: String(report.refunds_count ?? 0),
    refunds_value: String(report.refunds_value ?? 0),
    chargebacks_count: String(report.chargebacks_count ?? 0),
    chargebacks_value: String(report.chargebacks_value ?? 0),
    notes: report.notes ?? "",
  };
}

function reportToHistoryRow(report: FinanceReport): HistoryRow {
  return {
    month: report.report_month,
    invoiced: toNumber(report.invoiced_amount),
    collected: toNumber(report.cash_collected),
    outstanding: toNumber(report.outstanding_receivables),
    voids: toNumber(report.voids_value),
    refunds: toNumber(report.refunds_value),
    chargebacks: toNumber(report.chargebacks_value),
    collectionRate: calcPercent(toNumber(report.cash_collected), toNumber(report.invoiced_amount)),
  };
}

function BaseCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <Card className={`rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
      {children}
    </Card>
  );
}

function KpiCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "blue",
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: ElementType;
  tone?: "blue" | "green" | "amber" | "violet" | "red" | "slate";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <BaseCard>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{helper}</p>
          </div>
          <div className={`rounded-2xl p-3 ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </BaseCard>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{title}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "number",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "number" | "text";
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
      <Input
        type={type}
        min={type === "number" ? "0" : undefined}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        placeholder={placeholder ?? (type === "number" ? "0" : "Enter text")}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
      />
    </div>
  );
}

function ProgressLine({ label, value, rightLabel }: { label: string; value: number; rightLabel: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">{rightLabel}</span>
      </div>
      <Progress value={Math.min(value, 100)} className="h-2 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export default function FinanceDashboardPage() {
  const [form, setForm] = useState<FinanceForm>(emptyForm);
  const [reports, setReports] = useState<FinanceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeReport = reports[0] ?? fallbackReport();

  const formNumbers = useMemo(() => {
    const invoiced = toNumber(form.invoiced_amount);
    const collected = toNumber(form.cash_collected);
    const outstanding = toNumber(form.outstanding_receivables);
    const voidsValue = toNumber(form.voids_value);
    const refundsValue = toNumber(form.refunds_value);
    const chargebacksValue = toNumber(form.chargebacks_value);

    return {
      invoiced,
      collected,
      outstanding,
      collectionRate: calcPercent(collected, invoiced),
      receivablesRate: calcPercent(outstanding, invoiced),
      voidRate: calcPercent(voidsValue, invoiced),
      refundRate: calcPercent(refundsValue, invoiced),
      chargebackRate: calcPercent(chargebacksValue, invoiced),
    };
  }, [form]);

  const agingRows = useMemo(
    () => [
      { bucket: "0–30 days", value: toNumber(activeReport.aging_0_30) },
      { bucket: "31–60 days", value: toNumber(activeReport.aging_31_60) },
      { bucket: "61–90 days", value: toNumber(activeReport.aging_61_90) },
      { bucket: "90+ days", value: toNumber(activeReport.aging_90_plus) },
    ],
    [activeReport]
  );

  const issueRows = useMemo(
    () => [
      { type: "Voids", count: toNumber(activeReport.voids_count), value: toNumber(activeReport.voids_value) },
      { type: "Refunds", count: toNumber(activeReport.refunds_count), value: toNumber(activeReport.refunds_value) },
      { type: "Chargebacks", count: toNumber(activeReport.chargebacks_count), value: toNumber(activeReport.chargebacks_value) },
    ],
    [activeReport]
  );

  const cashMixRows = useMemo(
    () => [
      { name: "Cash collected", value: toNumber(activeReport.cash_collected) },
      { name: "Outstanding", value: toNumber(activeReport.outstanding_receivables) },
      { name: "Voids", value: toNumber(activeReport.voids_value) },
      { name: "Refunds", value: toNumber(activeReport.refunds_value) },
      { name: "Chargebacks", value: toNumber(activeReport.chargebacks_value) },
    ],
    [activeReport]
  );

  const healthRows = useMemo(() => {
    const invoiced = toNumber(activeReport.invoiced_amount);
    return [
      { name: "Collection rate", value: calcPercent(toNumber(activeReport.cash_collected), invoiced) },
      { name: "Receivables rate", value: calcPercent(toNumber(activeReport.outstanding_receivables), invoiced) },
      { name: "Refund rate", value: calcPercent(toNumber(activeReport.refunds_value), invoiced) },
      { name: "Chargeback rate", value: calcPercent(toNumber(activeReport.chargebacks_value), invoiced) },
    ];
  }, [activeReport]);

  const historyRows = useMemo<HistoryRow[]>(() => {
    if (!reports.length) return [reportToHistoryRow(fallbackReport())];
    return [...reports].reverse().map(reportToHistoryRow);
  }, [reports]);

  const collectionRate = calcPercent(toNumber(activeReport.cash_collected), toNumber(activeReport.invoiced_amount));
  const outstandingRate = calcPercent(toNumber(activeReport.outstanding_receivables), toNumber(activeReport.invoiced_amount));
  const agingTotal = agingRows.reduce((sum, row) => sum + row.value, 0);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("finance_invoicing_reports")
        .select("*")
        .order("report_month", { ascending: false })
        .limit(18);

      if (fetchError) throw fetchError;

      const nextReports = (data ?? []) as FinanceReport[];
      setReports(nextReports);

      if (nextReports[0]) {
        localStorage.setItem("financeInvoicingLatest", JSON.stringify(nextReports[0]));
      }
    } catch (fetchError: any) {
      console.error(fetchError);
      setError(fetchError?.message ?? "Failed to load finance reports. Make sure the Supabase table exists and RLS policies allow access.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateForm = (key: keyof FinanceForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setError(null);
    setMessage(null);
  };

  const editReport = (report: FinanceReport) => {
    setForm(reportToForm(report));
    setError(null);
    setMessage(null);
  };

  const saveReport = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      if (!form.report_month) {
        setError("Please select a report month.");
        return;
      }

      const payload = {
        report_month: form.report_month,
        owner: form.owner || "Farah and Zeeshan",
        frequency: form.frequency || "Monthly",
        invoiced_amount: toNumber(form.invoiced_amount),
        cash_collected: toNumber(form.cash_collected),
        outstanding_receivables: toNumber(form.outstanding_receivables),
        aging_0_30: toNumber(form.aging_0_30),
        aging_31_60: toNumber(form.aging_31_60),
        aging_61_90: toNumber(form.aging_61_90),
        aging_90_plus: toNumber(form.aging_90_plus),
        voids_count: toNumber(form.voids_count),
        voids_value: toNumber(form.voids_value),
        refunds_count: toNumber(form.refunds_count),
        refunds_value: toNumber(form.refunds_value),
        chargebacks_count: toNumber(form.chargebacks_count),
        chargebacks_value: toNumber(form.chargebacks_value),
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error: saveError } = await supabase
        .from("finance_invoicing_reports")
        .upsert(payload, { onConflict: "report_month" })
        .select()
        .single();

      if (saveError) throw saveError;

      localStorage.setItem("financeInvoicingLatest", JSON.stringify(data));
      window.dispatchEvent(new Event("finance-invoicing-updated"));
      setMessage("Finance / Invoicing report saved. Your Finance Dashboard now shows this latest monthly report.");
      await fetchReports();
    } catch (saveError: any) {
      console.error(saveError);
      setError(saveError?.message ?? "Failed to save finance report.");
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async (report: FinanceReport) => {
    if (!report.id || report.id === "fallback") return;

    try {
      setDeletingId(report.id);
      setError(null);
      setMessage(null);

      const { error: deleteError } = await supabase.from("finance_invoicing_reports").delete().eq("id", report.id);
      if (deleteError) throw deleteError;

      setMessage(`${formatMonth(report.report_month)} finance report deleted.`);
      await fetchReports();
    } catch (deleteError: any) {
      console.error(deleteError);
      setError(deleteError?.message ?? "Failed to delete finance report.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 bg-white p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-50 sm:p-6 lg:p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600 dark:bg-blue-500">3⃣ Finance / Invoicing</Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">Owner: Farah and Zeeshan</Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">Frequency: Monthly</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Finance / Invoicing Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
              Monthly cash and billing reporting for invoiced amount, cash collected, receivables aging, voids, refunds, and chargebacks.
            </p>
          </div>

          <Button onClick={fetchReports} disabled={loading} variant="outline" className="h-10 rounded-full border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </section>

      {error ? (
        <Alert className="rounded-3xl border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-200">Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert className="rounded-3xl border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800 dark:text-emerald-200">Saved</AlertTitle>
          <AlertDescription className="text-emerald-700 dark:text-emerald-300">{message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Invoiced amount" value={money(activeReport.invoiced_amount)} helper="Total amount billed this month" icon={Receipt} tone="blue" />
        <KpiCard title="Cash collected" value={money(activeReport.cash_collected)} helper={`${collectionRate}% collection rate`} icon={Wallet} tone="green" />
        <KpiCard title="Outstanding receivables" value={money(activeReport.outstanding_receivables)} helper={`${outstandingRate}% of invoiced amount`} icon={CreditCard} tone="red" />
        <KpiCard title="Chargebacks" value={`${activeReport.chargebacks_count} / ${money(activeReport.chargebacks_value)}`} helper="Count + value" icon={ShieldAlert} tone="amber" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Submit Monthly Cash & Billing Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <InputField label="Report Month" type="text" value={form.report_month} onChange={(value) => updateForm("report_month", value)} placeholder="YYYY-MM" />
              <InputField label="Owner" type="text" value={form.owner} onChange={(value) => updateForm("owner", value)} />
              <InputField label="Frequency" type="text" value={form.frequency} onChange={(value) => updateForm("frequency", value)} />
            </div>

            <SectionHeading title="Cash & Billing" subtitle="Mandatory monthly finance submission" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <InputField label="Invoiced amount" value={form.invoiced_amount} onChange={(value) => updateForm("invoiced_amount", value)} />
              <InputField label="Cash collected" value={form.cash_collected} onChange={(value) => updateForm("cash_collected", value)} />
              <InputField label="Outstanding receivables" value={form.outstanding_receivables} onChange={(value) => updateForm("outstanding_receivables", value)} />
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <p className="mb-4 font-semibold text-slate-950 dark:text-white">Outstanding receivables aging</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InputField label="0–30 days" value={form.aging_0_30} onChange={(value) => updateForm("aging_0_30", value)} />
                <InputField label="31–60 days" value={form.aging_31_60} onChange={(value) => updateForm("aging_31_60", value)} />
                <InputField label="61–90 days" value={form.aging_61_90} onChange={(value) => updateForm("aging_61_90", value)} />
                <InputField label="90+ days" value={form.aging_90_plus} onChange={(value) => updateForm("aging_90_plus", value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="mb-4 font-semibold text-slate-950 dark:text-white">Voids</p>
                <div className="grid gap-4">
                  <InputField label="Voids count" value={form.voids_count} onChange={(value) => updateForm("voids_count", value)} />
                  <InputField label="Voids value" value={form.voids_value} onChange={(value) => updateForm("voids_value", value)} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="mb-4 font-semibold text-slate-950 dark:text-white">Refunds</p>
                <div className="grid gap-4">
                  <InputField label="Refunds count" value={form.refunds_count} onChange={(value) => updateForm("refunds_count", value)} />
                  <InputField label="Refunds value" value={form.refunds_value} onChange={(value) => updateForm("refunds_value", value)} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="mb-4 font-semibold text-slate-950 dark:text-white">Chargebacks</p>
                <div className="grid gap-4">
                  <InputField label="Chargebacks count" value={form.chargebacks_count} onChange={(value) => updateForm("chargebacks_count", value)} />
                  <InputField label="Chargebacks value" value={form.chargebacks_value} onChange={(value) => updateForm("chargebacks_value", value)} />
                </div>
              </div>
            </div>

            <InputField label="Notes" type="text" value={form.notes} onChange={(value) => updateForm("notes", value)} placeholder="Optional finance notes" />

            <div className="grid gap-3 md:grid-cols-3">
              <KpiCard title="Collection rate" value={`${formNumbers.collectionRate}%`} helper="Cash collected / invoiced" icon={Banknote} tone="green" />
              <KpiCard title="Receivables rate" value={`${formNumbers.receivablesRate}%`} helper="Outstanding / invoiced" icon={CreditCard} tone="red" />
              <KpiCard title="Refund + chargeback rate" value={`${Number((formNumbers.refundRate + formNumbers.chargebackRate).toFixed(1))}%`} helper="Refunds + chargebacks / invoiced" icon={RotateCcw} tone="amber" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={saveReport} disabled={saving} className="rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save / Update Month
              </Button>
              <Button onClick={resetForm} type="button" variant="outline" className="rounded-full border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                Clear Form
              </Button>
            </div>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Latest Finance Report Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest month</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{formatMonth(activeReport.report_month)}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{activeReport.notes ?? "No notes added."}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <KpiCard title="Voids" value={`${activeReport.voids_count} / ${money(activeReport.voids_value)}`} helper="Count + value" icon={XCircle} tone="slate" />
              <KpiCard title="Refunds" value={`${activeReport.refunds_count} / ${money(activeReport.refunds_value)}`} helper="Count + value" icon={RotateCcw} tone="amber" />
              <KpiCard title="Aging total" value={money(agingTotal)} helper="All aging buckets combined" icon={Clock3} tone="red" />
              <KpiCard title="Collection rate" value={`${collectionRate}%`} helper="Collected / invoiced" icon={CheckCircle2} tone="green" />
            </div>

            <div className="space-y-4">
              {agingRows.map((row) => (
                <ProgressLine key={row.bucket} label={row.bucket} value={calcPercent(row.value, Math.max(agingTotal, 1))} rightLabel={money(row.value)} />
              ))}
            </div>
          </CardContent>
        </BaseCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Invoiced, Cash Collected & Outstanding Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyRows} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="invoiceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => money(Number(value ?? 0))} />
                <Legend />
                <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke={COLORS.blue} strokeWidth={3} fill="url(#invoiceFill)" />
                <Area type="monotone" dataKey="collected" name="Cash collected" stroke={COLORS.green} strokeWidth={3} fill="url(#cashFill)" />
                <Line type="monotone" dataKey="outstanding" name="Outstanding" stroke={COLORS.red} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Cash & Billing Mix</CardTitle>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cashMixRows} dataKey="value" nameKey="name" innerRadius={62} outerRadius={108} paddingAngle={4}>
                  {cashMixRows.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => money(Number(value ?? 0))} />
                <Legend iconSize={9} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Receivables Aging</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingRows} layout="vertical" margin={{ top: 8, right: 20, left: 78, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <YAxis type="category" dataKey="bucket" width={76} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => money(Number(value ?? 0))} />
                <Bar dataKey="value" name="Receivables" radius={[0, 8, 8, 0]}>
                  {agingRows.map((entry, index) => (
                    <Cell key={entry.bucket} fill={index < 2 ? COLORS.amber : COLORS.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Voids, Refunds & Chargebacks</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueRows} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="type" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Count" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
                <Bar yAxisId="right" dataKey="value" name="Value" fill={COLORS.red} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Finance Health</CardTitle>
          </CardHeader>
          <CardContent className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="22%" outerRadius="92%" data={healthRows} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={10} background>
                  {healthRows.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </RadialBar>
                <Legend iconSize={9} layout="vertical" verticalAlign="middle" align="right" />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => `${Number(value ?? 0)}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Collection Rate History</CardTitle>
          </CardHeader>
          <CardContent className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyRows} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => `${Number(value ?? 0)}%`} />
                <Legend />
                <Line type="monotone" dataKey="collectionRate" name="Collection rate" stroke={COLORS.green} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>
      </section>

      <BaseCard>
        <CardHeader>
          <CardTitle className="text-base">Saved Finance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr>
                  {[
                    "Month",
                    "Invoiced",
                    "Cash collected",
                    "Outstanding",
                    "Voids",
                    "Refunds",
                    "Chargebacks",
                    "Actions",
                  ].map((header) => (
                    <th key={header} className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.length ? (
                  reports.map((report) => (
                    <tr key={report.id}>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">{formatMonth(report.report_month)}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{money(report.invoiced_amount)}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm font-bold text-emerald-600 dark:border-slate-800 dark:text-emerald-400">{money(report.cash_collected)}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm font-bold text-red-600 dark:border-slate-800 dark:text-red-400">{money(report.outstanding_receivables)}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.voids_count} / {money(report.voids_value)}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.refunds_count} / {money(report.refunds_value)}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.chargebacks_count} / {money(report.chargebacks_value)}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
                        <div className="flex gap-2">
                          <Button onClick={() => editReport(report)} size="sm" variant="outline" className="rounded-full border-slate-200 dark:border-slate-800">
                            <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button onClick={() => deleteReport(report)} size="sm" variant="outline" disabled={deletingId === report.id} className="rounded-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">
                            {deletingId === report.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="border-t border-slate-100 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      No saved finance reports yet. Enter your first monthly report above and click Save / Update Month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </BaseCard>
    </div>
  );
}
