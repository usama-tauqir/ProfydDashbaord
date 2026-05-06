// app/dashboard/sales/quality-efficiency-actions/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  AlertCircle,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Clock3,
  DollarSign,
  Edit3,
  FileSpreadsheet,
  Layers3,
  Loader2,
  MessageCircle,
  PieChart as PieChartLucide,
  RefreshCw,
  Save,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
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



type AreaWiseRow = {
  area: string;
  students: number;
  revenue: number;
};

type SalesQualityReport = {
  id: string;
  report_month: string;
  arpu: number;
  package_1x_percent: number;
  package_2x_percent: number;
  package_3x_percent: number;
  package_4x_percent: number;
  prepaid_percent: number;
  partial_percent: number;
  area_wise: AreaWiseRow[];
  plan_upgrades: number;
  expected_mrr_next_month: number;
  avg_first_response_minutes: number;
  avg_lead_to_trial_days: number;
  avg_trial_to_payment_days: number;
  followups_per_converted_lead: number;
  dropoff_price_percent: number;
  dropoff_timing_holidays_percent: number;
  dropoff_no_response_percent: number;
  dropoff_comparison_shopping_percent: number;
  dropoff_academic_mismatch_percent: number;
  dropoff_other_percent: number;
  action_ceo: string | null;
  action_marketing: string | null;
  action_sales_change: string | null;
  how_google_sheet_tab: boolean;
  how_market_wise_rows: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type AreaFormRow = {
  area: string;
  students: string;
  revenue: string;
};

type ReportForm = {
  report_month: string;
  arpu: string;
  package_1x_percent: string;
  package_2x_percent: string;
  package_3x_percent: string;
  package_4x_percent: string;
  prepaid_percent: string;
  partial_percent: string;
  plan_upgrades: string;
  expected_mrr_next_month: string;
  avg_first_response_minutes: string;
  avg_lead_to_trial_days: string;
  avg_trial_to_payment_days: string;
  followups_per_converted_lead: string;
  dropoff_price_percent: string;
  dropoff_timing_holidays_percent: string;
  dropoff_no_response_percent: string;
  dropoff_comparison_shopping_percent: string;
  dropoff_academic_mismatch_percent: string;
  dropoff_other_percent: string;
  action_ceo: string;
  action_marketing: string;
  action_sales_change: string;
  how_google_sheet_tab: boolean;
  how_market_wise_rows: boolean;
  notes: string;
};

const COLORS = {
  blue: "#2563eb",
  sky: "#0ea5e9",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  fuchsia: "#d946ef",
};

const CHART_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.red, COLORS.violet, COLORS.cyan, COLORS.fuchsia];
const DEFAULT_AREAS = ["AU", "NZ", "UK", "USA", "Other"];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function toNumber(value: string | number | null | undefined) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatMonth(value: string) {
  if (!value) return "Unknown";
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function money(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function emptyAreaRows(): AreaFormRow[] {
  return DEFAULT_AREAS.map((area) => ({ area, students: "", revenue: "" }));
}

function fallbackReport(): SalesQualityReport {
  return {
    id: "fallback",
    report_month: currentMonth(),
    arpu: 119.28,
    package_1x_percent: 20,
    package_2x_percent: 35,
    package_3x_percent: 30,
    package_4x_percent: 15,
    prepaid_percent: 75,
    partial_percent: 25,
    area_wise: [
      { area: "AU", students: 138, revenue: 58200 },
      { area: "NZ", students: 74, revenue: 31800 },
      { area: "UK", students: 56, revenue: 24950 },
      { area: "USA", students: 48, revenue: 21150 },
      { area: "Other", students: 26, revenue: 12400 },
    ],
    plan_upgrades: 7,
    expected_mrr_next_month: 12000,
    avg_first_response_minutes: 3,
    avg_lead_to_trial_days: 2.3,
    avg_trial_to_payment_days: 4.1,
    followups_per_converted_lead: 2.8,
    dropoff_price_percent: 35,
    dropoff_timing_holidays_percent: 22,
    dropoff_no_response_percent: 18,
    dropoff_comparison_shopping_percent: 12,
    dropoff_academic_mismatch_percent: 8,
    dropoff_other_percent: 5,
    action_ceo: "Approve discount budget for at-risk leads and faster fee exception approvals.",
    action_marketing: "Increase high-quality AU/NZ WhatsApp lead targeting and improve landing page copy.",
    action_sales_change: "Tighter 15-minute first-response SLA and segmented follow-up scripts by market.",
    how_google_sheet_tab: true,
    how_market_wise_rows: true,
    notes: "Demo data. Save your first report to replace this.",
  };
}

const emptyForm: ReportForm = {
  report_month: currentMonth(),
  arpu: "",
  package_1x_percent: "",
  package_2x_percent: "",
  package_3x_percent: "",
  package_4x_percent: "",
  prepaid_percent: "",
  partial_percent: "",
  plan_upgrades: "",
  expected_mrr_next_month: "",
  avg_first_response_minutes: "",
  avg_lead_to_trial_days: "",
  avg_trial_to_payment_days: "",
  followups_per_converted_lead: "",
  dropoff_price_percent: "",
  dropoff_timing_holidays_percent: "",
  dropoff_no_response_percent: "",
  dropoff_comparison_shopping_percent: "",
  dropoff_academic_mismatch_percent: "",
  dropoff_other_percent: "",
  action_ceo: "",
  action_marketing: "",
  action_sales_change: "",
  how_google_sheet_tab: true,
  how_market_wise_rows: true,
  notes: "",
};

function reportToForm(report: SalesQualityReport): ReportForm {
  return {
    report_month: report.report_month,
    arpu: String(report.arpu ?? 0),
    package_1x_percent: String(report.package_1x_percent ?? 0),
    package_2x_percent: String(report.package_2x_percent ?? 0),
    package_3x_percent: String(report.package_3x_percent ?? 0),
    package_4x_percent: String(report.package_4x_percent ?? 0),
    prepaid_percent: String(report.prepaid_percent ?? 0),
    partial_percent: String(report.partial_percent ?? 0),
    plan_upgrades: String(report.plan_upgrades ?? 0),
    expected_mrr_next_month: String(report.expected_mrr_next_month ?? 0),
    avg_first_response_minutes: String(report.avg_first_response_minutes ?? 0),
    avg_lead_to_trial_days: String(report.avg_lead_to_trial_days ?? 0),
    avg_trial_to_payment_days: String(report.avg_trial_to_payment_days ?? 0),
    followups_per_converted_lead: String(report.followups_per_converted_lead ?? 0),
    dropoff_price_percent: String(report.dropoff_price_percent ?? 0),
    dropoff_timing_holidays_percent: String(report.dropoff_timing_holidays_percent ?? 0),
    dropoff_no_response_percent: String(report.dropoff_no_response_percent ?? 0),
    dropoff_comparison_shopping_percent: String(report.dropoff_comparison_shopping_percent ?? 0),
    dropoff_academic_mismatch_percent: String(report.dropoff_academic_mismatch_percent ?? 0),
    dropoff_other_percent: String(report.dropoff_other_percent ?? 0),
    action_ceo: report.action_ceo ?? "",
    action_marketing: report.action_marketing ?? "",
    action_sales_change: report.action_sales_change ?? "",
    how_google_sheet_tab: report.how_google_sheet_tab ?? true,
    how_market_wise_rows: report.how_market_wise_rows ?? true,
    notes: report.notes ?? "",
  };
}

function reportToAreaRows(report: SalesQualityReport): AreaFormRow[] {
  const rows = Array.isArray(report.area_wise) ? report.area_wise : [];
  if (!rows.length) return emptyAreaRows();
  return rows.map((row) => ({
    area: row.area,
    students: String(row.students ?? 0),
    revenue: String(row.revenue ?? 0),
  }));
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
  tone?: "blue" | "green" | "amber" | "violet" | "red";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
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

function SectionHeading({ code, title, subtitle }: { code: string; title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white dark:bg-blue-500">{code}</span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{title}</h2>
      </div>
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

export default function SalesQualityEfficiencyActionsPage() {
  const [form, setForm] = useState<ReportForm>(emptyForm);
  const [areaRows, setAreaRows] = useState<AreaFormRow[]>(emptyAreaRows());
  const [reports, setReports] = useState<SalesQualityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeReport = reports[0] ?? fallbackReport();

  const packageRows = useMemo(
    () => [
      { name: "1x/week", value: toNumber(activeReport.package_1x_percent) },
      { name: "2x/week", value: toNumber(activeReport.package_2x_percent) },
      { name: "3x/week", value: toNumber(activeReport.package_3x_percent) },
      { name: "4x/week", value: toNumber(activeReport.package_4x_percent) },
    ],
    [activeReport]
  );

  const paymentRows = useMemo(
    () => [
      { name: "Prepaid", value: toNumber(activeReport.prepaid_percent) },
      { name: "Partial", value: toNumber(activeReport.partial_percent) },
    ],
    [activeReport]
  );

  const dropoffRows = useMemo(
    () => [
      { reason: "Price", value: toNumber(activeReport.dropoff_price_percent) },
      { reason: "Timing / holidays", value: toNumber(activeReport.dropoff_timing_holidays_percent) },
      { reason: "No response", value: toNumber(activeReport.dropoff_no_response_percent) },
      { reason: "Comparison shopping", value: toNumber(activeReport.dropoff_comparison_shopping_percent) },
      { reason: "Academic mismatch", value: toNumber(activeReport.dropoff_academic_mismatch_percent) },
      { reason: "Other", value: toNumber(activeReport.dropoff_other_percent) },
    ],
    [activeReport]
  );

  const efficiencyRows = useMemo(
    () => [
      { metric: "First response", score: Math.max(0, 100 - toNumber(activeReport.avg_first_response_minutes) * 3) },
      { metric: "Lead → Trial", score: Math.max(0, 100 - toNumber(activeReport.avg_lead_to_trial_days) * 12) },
      { metric: "Trial → Pay", score: Math.max(0, 100 - toNumber(activeReport.avg_trial_to_payment_days) * 10) },
      { metric: "Follow-ups", score: Math.min(100, toNumber(activeReport.followups_per_converted_lead) * 25) },
      { metric: "MRR", score: Math.min(100, toNumber(activeReport.expected_mrr_next_month) / 200) },
    ],
    [activeReport]
  );

  const historyRows = useMemo(
    () =>
      (reports.length ? [...reports].reverse() : [fallbackReport()]).map((report) => ({
        month: report.report_month,
        arpu: toNumber(report.arpu),
        expectedMrr: toNumber(report.expected_mrr_next_month),
        upgrades: toNumber(report.plan_upgrades),
        response: toNumber(report.avg_first_response_minutes),
        dropoffPrice: toNumber(report.dropoff_price_percent),
      })),
    [reports]
  );

  const areaChartRows = useMemo(() => {
    const rows = Array.isArray(activeReport.area_wise) ? activeReport.area_wise : [];
    return rows.length ? rows : fallbackReport().area_wise;
  }, [activeReport]);

  const formPackageTotal = useMemo(
    () =>
      toNumber(form.package_1x_percent) +
      toNumber(form.package_2x_percent) +
      toNumber(form.package_3x_percent) +
      toNumber(form.package_4x_percent),
    [form.package_1x_percent, form.package_2x_percent, form.package_3x_percent, form.package_4x_percent]
  );

  const formPaymentTotal = useMemo(
    () => toNumber(form.prepaid_percent) + toNumber(form.partial_percent),
    [form.prepaid_percent, form.partial_percent]
  );

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("sales_quality_efficiency_actions_reports")
        .select("*")
        .order("report_month", { ascending: false })
        .limit(18);

      if (fetchError) throw fetchError;

      const nextReports = (data ?? []) as SalesQualityReport[];
      setReports(nextReports);

      if (nextReports[0]) {
        localStorage.setItem("salesQualityEfficiencyActionsLatest", JSON.stringify(nextReports[0]));
      }
    } catch (fetchError: any) {
      console.error(fetchError);
      setError(fetchError?.message ?? "Failed to load reports. Make sure the Supabase table exists and RLS policies allow access.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateForm = (key: keyof ReportForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateAreaRow = (index: number, key: keyof AreaFormRow, value: string) => {
    setAreaRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setAreaRows(emptyAreaRows());
    setError(null);
    setMessage(null);
  };

  const editReport = (report: SalesQualityReport) => {
    setForm(reportToForm(report));
    setAreaRows(reportToAreaRows(report));
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
        arpu: toNumber(form.arpu),
        package_1x_percent: toNumber(form.package_1x_percent),
        package_2x_percent: toNumber(form.package_2x_percent),
        package_3x_percent: toNumber(form.package_3x_percent),
        package_4x_percent: toNumber(form.package_4x_percent),
        prepaid_percent: toNumber(form.prepaid_percent),
        partial_percent: toNumber(form.partial_percent),
        area_wise: areaRows.map((row) => ({ area: row.area, students: toNumber(row.students), revenue: toNumber(row.revenue) })),
        plan_upgrades: toNumber(form.plan_upgrades),
        expected_mrr_next_month: toNumber(form.expected_mrr_next_month),
        avg_first_response_minutes: toNumber(form.avg_first_response_minutes),
        avg_lead_to_trial_days: toNumber(form.avg_lead_to_trial_days),
        avg_trial_to_payment_days: toNumber(form.avg_trial_to_payment_days),
        followups_per_converted_lead: toNumber(form.followups_per_converted_lead),
        dropoff_price_percent: toNumber(form.dropoff_price_percent),
        dropoff_timing_holidays_percent: toNumber(form.dropoff_timing_holidays_percent),
        dropoff_no_response_percent: toNumber(form.dropoff_no_response_percent),
        dropoff_comparison_shopping_percent: toNumber(form.dropoff_comparison_shopping_percent),
        dropoff_academic_mismatch_percent: toNumber(form.dropoff_academic_mismatch_percent),
        dropoff_other_percent: toNumber(form.dropoff_other_percent),
        action_ceo: form.action_ceo || null,
        action_marketing: form.action_marketing || null,
        action_sales_change: form.action_sales_change || null,
        how_google_sheet_tab: form.how_google_sheet_tab,
        how_market_wise_rows: form.how_market_wise_rows,
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error: saveError } = await supabase
        .from("sales_quality_efficiency_actions_reports")
        .upsert(payload, { onConflict: "report_month" })
        .select()
        .single();

      if (saveError) throw saveError;

      localStorage.setItem("salesQualityEfficiencyActionsLatest", JSON.stringify(data));
      window.dispatchEvent(new Event("sales-quality-efficiency-actions-updated"));
      setMessage("Revenue Quality, Sales Efficiency, Drop-offs, and Actions saved. Your Sales Dashboard can now read this latest report from Supabase.");
      await fetchReports();
    } catch (saveError: any) {
      console.error(saveError);
      setError(saveError?.message ?? "Failed to save report.");
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async (report: SalesQualityReport) => {
    if (!report.id || report.id === "fallback") return;

    try {
      setDeletingId(report.id);
      setError(null);
      setMessage(null);

      const { error: deleteError } = await supabase.from("sales_quality_efficiency_actions_reports").delete().eq("id", report.id);
      if (deleteError) throw deleteError;

      setMessage(`${formatMonth(report.report_month)} report deleted.`);
      await fetchReports();
    } catch (deleteError: any) {
      console.error(deleteError);
      setError(deleteError?.message ?? "Failed to delete report.");
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
              <Badge className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600 dark:bg-blue-500">D–G Sales Report</Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">Revenue + Efficiency + Loss + Actions</Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">Dashboard Source: Supabase</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Revenue Quality, Efficiency & Actions</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
              Enter monthly D, E, F, and G sales reporting data, save it to Supabase, view charts, and feed the latest data into the Sales Dashboard.
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

      <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Enter Monthly Report Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Report Month</Label>
                <Input
                  type="month"
                  value={form.report_month}
                  onChange={(event) => updateForm("report_month", event.target.value)}
                  className="h-11 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
              <InputField label="Notes" type="text" value={form.notes} onChange={(value) => updateForm("notes", value)} placeholder="Optional note for this report" />
            </div>

            <div className="space-y-4">
              <SectionHeading code="D" title="Revenue Quality" subtitle="ARPU, package mix, payment mix, area categorisation, upgrades, and expected MRR" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <InputField label="Average revenue per student (ARPU)" value={form.arpu} onChange={(value) => updateForm("arpu", value)} />
                <InputField label="Plan upgrades this month" value={form.plan_upgrades} onChange={(value) => updateForm("plan_upgrades", value)} />
                <InputField label="Expected MRR from joining next month" value={form.expected_mrr_next_month} onChange={(value) => updateForm("expected_mrr_next_month", value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InputField label="1x/week package %" value={form.package_1x_percent} onChange={(value) => updateForm("package_1x_percent", value)} />
                <InputField label="2x/week package %" value={form.package_2x_percent} onChange={(value) => updateForm("package_2x_percent", value)} />
                <InputField label="3x/week package %" value={form.package_3x_percent} onChange={(value) => updateForm("package_3x_percent", value)} />
                <InputField label="4x/week package %" value={form.package_4x_percent} onChange={(value) => updateForm("package_4x_percent", value)} />
              </div>
              <p className={`text-xs font-semibold ${formPackageTotal === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                Package mix total: {formPackageTotal}% {formPackageTotal === 100 ? "✓" : "— should usually equal 100%"}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Prepaid payments %" value={form.prepaid_percent} onChange={(value) => updateForm("prepaid_percent", value)} />
                <InputField label="Partial payments %" value={form.partial_percent} onChange={(value) => updateForm("partial_percent", value)} />
              </div>
              <p className={`text-xs font-semibold ${formPaymentTotal === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                Payment mix total: {formPaymentTotal}% {formPaymentTotal === 100 ? "✓" : "— should usually equal 100%"}
              </p>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr>
                      {['Area', 'Students', 'Revenue'].map((header) => (
                        <th key={header} className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {areaRows.map((row, index) => (
                      <tr key={`${row.area}-${index}`}>
                        <td className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                          <Input value={row.area} onChange={(event) => updateAreaRow(index, "area", event.target.value)} className="h-10 rounded-xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
                        </td>
                        <td className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                          <Input type="number" min="0" value={row.students} onChange={(event) => updateAreaRow(index, "students", event.target.value)} className="h-10 rounded-xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
                        </td>
                        <td className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                          <Input type="number" min="0" value={row.revenue} onChange={(event) => updateAreaRow(index, "revenue", event.target.value)} className="h-10 rounded-xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeading code="E" title="Sales Efficiency" subtitle="Response speed, lead-to-trial speed, payment speed, and follow-ups" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InputField label="Avg first response time to new lead (min)" value={form.avg_first_response_minutes} onChange={(value) => updateForm("avg_first_response_minutes", value)} />
                <InputField label="Avg days from lead → trial" value={form.avg_lead_to_trial_days} onChange={(value) => updateForm("avg_lead_to_trial_days", value)} />
                <InputField label="Avg days from trial → payment" value={form.avg_trial_to_payment_days} onChange={(value) => updateForm("avg_trial_to_payment_days", value)} />
                <InputField label="Follow-ups per converted lead (avg)" value={form.followups_per_converted_lead} onChange={(value) => updateForm("followups_per_converted_lead", value)} />
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeading code="F" title="Drop-offs & Loss Reasons" subtitle="Approximate loss reason percentages" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <InputField label="Price %" value={form.dropoff_price_percent} onChange={(value) => updateForm("dropoff_price_percent", value)} />
                <InputField label="Timing / holidays %" value={form.dropoff_timing_holidays_percent} onChange={(value) => updateForm("dropoff_timing_holidays_percent", value)} />
                <InputField label="No response %" value={form.dropoff_no_response_percent} onChange={(value) => updateForm("dropoff_no_response_percent", value)} />
                <InputField label="Comparison shopping %" value={form.dropoff_comparison_shopping_percent} onChange={(value) => updateForm("dropoff_comparison_shopping_percent", value)} />
                <InputField label="Academic mismatch %" value={form.dropoff_academic_mismatch_percent} onChange={(value) => updateForm("dropoff_academic_mismatch_percent", value)} />
                <InputField label="Other %" value={form.dropoff_other_percent} onChange={(value) => updateForm("dropoff_other_percent", value)} />
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeading code="G" title="Action Items / Support Needed" subtitle="CEO, marketing, sales changes, and how the report is maintained" />
              <div className="grid gap-4">
                <InputField label="What sales needs from CEO" type="text" value={form.action_ceo} onChange={(value) => updateForm("action_ceo", value)} />
                <InputField label="What sales needs from marketing" type="text" value={form.action_marketing} onChange={(value) => updateForm("action_marketing", value)} />
                <InputField label="What sales will change next month" type="text" value={form.action_sales_change} onChange={(value) => updateForm("action_sales_change", value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="button" variant={form.how_google_sheet_tab ? "default" : "outline"} onClick={() => updateForm("how_google_sheet_tab", !form.how_google_sheet_tab)} className="rounded-full">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> One Google Sheet tab {form.how_google_sheet_tab ? "✓" : ""}
                </Button>
                <Button type="button" variant={form.how_market_wise_rows ? "default" : "outline"} onClick={() => updateForm("how_market_wise_rows", !form.how_market_wise_rows)} className="rounded-full">
                  <Layers3 className="mr-2 h-4 w-4" /> Market-wise rows {form.how_market_wise_rows ? "✓" : ""}
                </Button>
              </div>
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
            <CardTitle className="text-base">Latest Saved Report Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest month</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{formatMonth(activeReport.report_month)}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{activeReport.notes ?? "No notes added."}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <KpiCard title="ARPU" value={money(activeReport.arpu)} helper="Average revenue per student" icon={DollarSign} tone="blue" />
              <KpiCard title="Plan upgrades" value={activeReport.plan_upgrades} helper="This month" icon={TrendingUp} tone="green" />
              <KpiCard title="Expected MRR" value={money(activeReport.expected_mrr_next_month)} helper="Joining next month leads" icon={BadgeDollarSign} tone="violet" />
              <KpiCard title="First response" value={`${activeReport.avg_first_response_minutes} min`} helper="Avg response speed" icon={Clock3} tone="amber" />
            </div>

            <div className="space-y-4">
              <ProgressLine label="Prepaid payments" value={activeReport.prepaid_percent} rightLabel={`${activeReport.prepaid_percent}%`} />
              <ProgressLine label="Partial payments" value={activeReport.partial_percent} rightLabel={`${activeReport.partial_percent}%`} />
              <ProgressLine label="Price drop-off" value={activeReport.dropoff_price_percent} rightLabel={`${activeReport.dropoff_price_percent}%`} />
              <ProgressLine label="No response drop-off" value={activeReport.dropoff_no_response_percent} rightLabel={`${activeReport.dropoff_no_response_percent}%`} />
            </div>
          </CardContent>
        </BaseCard>
      </section>

      <section className="space-y-5">
        <SectionHeading code="D" title="Revenue Quality Charts" subtitle="Package mix, payment split, area categorisation, and expected MRR trend" />
        <div className="grid gap-5 xl:grid-cols-3">
          <BaseCard>
            <CardHeader><CardTitle className="text-base">Package Mix (%)</CardTitle></CardHeader>
            <CardContent className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={packageRows} dataKey="value" nameKey="name" innerRadius={60} outerRadius={105} paddingAngle={5} label={({ name, value }) => `${name}: ${value}%`}>
                    {packageRows.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => `${Number(value ?? 0)}%`} />
                  <Legend iconSize={9} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardHeader><CardTitle className="text-base">Prepaid vs Partial Payments</CardTitle></CardHeader>
            <CardContent className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentRows} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => `${Number(value ?? 0)}%`} />
                  <Bar dataKey="value" name="Payment %" radius={[10, 10, 0, 0]}>
                    {paymentRows.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? COLORS.green : COLORS.amber} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardHeader><CardTitle className="text-base">Expected MRR Trend</CardTitle></CardHeader>
            <CardContent className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyRows} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => money(Number(value ?? 0))} />
                  <Legend />
                  <Line type="monotone" dataKey="expectedMrr" name="Expected MRR" stroke={COLORS.violet} strokeWidth={3} />
                  <Line type="monotone" dataKey="arpu" name="ARPU" stroke={COLORS.green} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>
        </div>

        <BaseCard>
          <CardHeader><CardTitle className="text-base">Area Wise Categorisation</CardTitle></CardHeader>
          <CardContent className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    {['Area', 'Students', 'Revenue'].map((header) => <th key={header} className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {areaChartRows.map((row) => (
                    <tr key={row.area}>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">{row.area}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{row.students}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm font-bold text-emerald-600 dark:border-slate-800 dark:text-emerald-400">{money(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaChartRows} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="area" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="students" name="Students" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill={COLORS.green} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </BaseCard>
      </section>

      <section className="space-y-5">
        <SectionHeading code="E" title="Sales Efficiency Charts" subtitle="Speed and follow-up performance" />
        <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <BaseCard>
            <CardHeader><CardTitle className="text-base">Efficiency Trend</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyRows} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
                  <Legend />
                  <Line type="monotone" dataKey="response" name="First Response (min)" stroke={COLORS.blue} strokeWidth={3} />
                  <Line type="monotone" dataKey="upgrades" name="Plan Upgrades" stroke={COLORS.green} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>
          <BaseCard>
            <CardHeader><CardTitle className="text-base">Efficiency Radar</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={efficiencyRows}>
                  <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <Radar name="Efficiency" dataKey="score" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.25} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading code="F" title="Drop-offs & Loss Reasons" subtitle="Reason table, progress bars, pie chart, and bar chart" />
        <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
          <BaseCard>
            <CardHeader><CardTitle className="text-base">Loss Reasons Table</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead><tr><th className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">Reason</th><th className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">Approx %</th></tr></thead>
                  <tbody>
                    {dropoffRows.map((row) => (
                      <tr key={row.reason}>
                        <td className="border-t border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">{row.reason}</td>
                        <td className="border-t border-slate-100 px-4 py-3 text-sm font-bold text-red-600 dark:border-slate-800 dark:text-red-400">{row.value}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {dropoffRows.map((row) => <ProgressLine key={row.reason} label={row.reason} value={row.value} rightLabel={`${row.value}%`} />)}
            </CardContent>
          </BaseCard>
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <BaseCard>
              <CardHeader><CardTitle className="text-base">Loss Distribution</CardTitle></CardHeader>
              <CardContent className="h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dropoffRows} dataKey="value" nameKey="reason" innerRadius={55} outerRadius={95} paddingAngle={4} label>
                      {dropoffRows.map((entry, index) => <Cell key={entry.reason} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => `${Number(value ?? 0)}%`} />
                    <Legend iconSize={9} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </BaseCard>
            <BaseCard>
              <CardHeader><CardTitle className="text-base">Loss Reason Bar Chart</CardTitle></CardHeader>
              <CardContent className="h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dropoffRows} layout="vertical" margin={{ top: 8, right: 16, left: 112, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                    <YAxis type="category" dataKey="reason" width={108} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => `${Number(value ?? 0)}%`} />
                    <Bar dataKey="value" name="Approx %" radius={[0, 8, 8, 0]}>
                      {dropoffRows.map((entry, index) => <Cell key={entry.reason} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </BaseCard>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading code="G" title="Action Items / Support Needed" subtitle="CEO, marketing, sales changes, and reporting method" />
        <div className="grid gap-5 lg:grid-cols-3">
          <BaseCard><CardContent className="p-5"><p className="font-bold text-slate-950 dark:text-white">What sales needs from CEO</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{activeReport.action_ceo || "No CEO action added."}</p></CardContent></BaseCard>
          <BaseCard><CardContent className="p-5"><p className="font-bold text-slate-950 dark:text-white">What sales needs from marketing</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{activeReport.action_marketing || "No marketing action added."}</p></CardContent></BaseCard>
          <BaseCard><CardContent className="p-5"><p className="font-bold text-slate-950 dark:text-white">What sales will change next month</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{activeReport.action_sales_change || "No sales change added."}</p></CardContent></BaseCard>
        </div>
        <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
          <BaseCard>
            <CardHeader><CardTitle className="text-base">How</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /><span className="font-medium">One Google Sheet tab: {activeReport.how_google_sheet_tab ? "Yes" : "No"}</span></div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /><span className="font-medium">Market-wise rows: {activeReport.how_market_wise_rows ? "Yes" : "No"}</span></div>
            </CardContent>
          </BaseCard>
          <BaseCard>
            <CardHeader><CardTitle className="text-base">Action Priority Chart</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="24%" outerRadius="92%" data={[{ name: "CEO", value: activeReport.action_ceo ? 90 : 10 }, { name: "Marketing", value: activeReport.action_marketing ? 82 : 10 }, { name: "Sales", value: activeReport.action_sales_change ? 88 : 10 }]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={10} background>
                    {[COLORS.blue, COLORS.green, COLORS.violet].map((color) => <Cell key={color} fill={color} />)}
                  </RadialBar>
                  <Legend iconSize={9} layout="vertical" verticalAlign="middle" align="right" />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>
        </div>
      </section>

      <BaseCard>
        <CardHeader><CardTitle className="text-base">Saved D–G Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[1000px] text-left">
              <thead>
                <tr>
                  {['Month', 'ARPU', 'Prepaid %', 'Plan upgrades', 'Expected MRR', 'First response', 'Price loss %', 'Actions'].map((header) => <th key={header} className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {reports.length ? reports.map((report) => (
                  <tr key={report.id}>
                    <td className="border-t border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">{formatMonth(report.report_month)}</td>
                    <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{money(report.arpu)}</td>
                    <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.prepaid_percent}%</td>
                    <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.plan_upgrades}</td>
                    <td className="border-t border-slate-100 px-4 py-3 text-sm font-bold text-emerald-600 dark:border-slate-800 dark:text-emerald-400">{money(report.expected_mrr_next_month)}</td>
                    <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.avg_first_response_minutes} min</td>
                    <td className="border-t border-slate-100 px-4 py-3 text-sm text-red-600 dark:border-slate-800 dark:text-red-400">{report.dropoff_price_percent}%</td>
                    <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
                      <div className="flex gap-2">
                        <Button onClick={() => editReport(report)} size="sm" variant="outline" className="rounded-full border-slate-200 dark:border-slate-800"><Edit3 className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                        <Button onClick={() => deleteReport(report)} size="sm" variant="outline" disabled={deletingId === report.id} className="rounded-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">
                          {deletingId === report.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />} Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="border-t border-slate-100 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">No saved reports yet. Enter your first month above and click Save / Update Month.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </BaseCard>
    </div>
  );
}
