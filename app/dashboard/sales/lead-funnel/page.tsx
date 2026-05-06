// app/dashboard/sales/lead-funnel/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  AlertCircle,
  BadgeDollarSign,
  CheckCircle2,
  Edit3,
  Loader2,
  RefreshCw,
  Save,
  Target,
  Trash2,
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


type FunnelReport = {
  id: string;
  report_month: string;
  total_leads_received: number;
  qualified_parent_leads: number;
  trials_booked: number;
  trials_conducted: number;
  paid_sign_ups: number;
  lead_to_trial_percent: number;
  lead_to_paid_conversion_percent: number;
  trial_to_paid_conversion_percent: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type FunnelForm = {
  report_month: string;
  total_leads_received: string;
  qualified_parent_leads: string;
  trials_booked: string;
  trials_conducted: string;
  paid_sign_ups: string;
  notes: string;
};

type HistoryRow = {
  month: string;
  leads: number;
  qualified: number;
  trials: number;
  conducted: number;
  paid: number;
  leadToTrial: number;
  leadToPaid: number;
  trialToPaid: number;
};

const COLORS = {
  blue: "#2563eb",
  sky: "#0ea5e9",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
};

const CHART_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.violet, COLORS.cyan, COLORS.red];

const fallbackReport: FunnelReport = {
  id: "fallback",
  report_month: new Date().toISOString().slice(0, 7),
  total_leads_received: 320,
  qualified_parent_leads: 245,
  trials_booked: 120,
  trials_conducted: 98,
  paid_sign_ups: 85,
  lead_to_trial_percent: 37.5,
  lead_to_paid_conversion_percent: 26.6,
  trial_to_paid_conversion_percent: 86.7,
  notes: "Demo data. Save your first report to replace this.",
};

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

function formatMonth(value: string) {
  if (!value) return "Unknown";
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function reportToForm(report: FunnelReport): FunnelForm {
  return {
    report_month: report.report_month,
    total_leads_received: String(report.total_leads_received ?? 0),
    qualified_parent_leads: String(report.qualified_parent_leads ?? 0),
    trials_booked: String(report.trials_booked ?? 0),
    trials_conducted: String(report.trials_conducted ?? 0),
    paid_sign_ups: String(report.paid_sign_ups ?? 0),
    notes: report.notes ?? "",
  };
}

function reportToHistoryRow(report: FunnelReport): HistoryRow {
  return {
    month: report.report_month,
    leads: report.total_leads_received,
    qualified: report.qualified_parent_leads,
    trials: report.trials_booked,
    conducted: report.trials_conducted,
    paid: report.paid_sign_ups,
    leadToTrial: Number(report.lead_to_trial_percent ?? 0),
    leadToPaid: Number(report.lead_to_paid_conversion_percent ?? 0),
    trialToPaid: Number(report.trial_to_paid_conversion_percent ?? 0),
  };
}

const emptyForm: FunnelForm = {
  report_month: currentMonth(),
  total_leads_received: "",
  qualified_parent_leads: "",
  trials_booked: "",
  trials_conducted: "",
  paid_sign_ups: "",
  notes: "",
};

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

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
      <Input
        type="number"
        min="0"
        inputMode="numeric"
        value={value}
        placeholder={placeholder ?? "0"}
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

export default function SalesLeadFunnelPage() {
  const [form, setForm] = useState<FunnelForm>(emptyForm);
  const [reports, setReports] = useState<FunnelReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formNumbers = useMemo(() => {
    const totalLeads = toNumber(form.total_leads_received);
    const qualified = toNumber(form.qualified_parent_leads);
    const trialsBooked = toNumber(form.trials_booked);
    const trialsConducted = toNumber(form.trials_conducted);
    const paidSignUps = toNumber(form.paid_sign_ups);

    return {
      totalLeads,
      qualified,
      trialsBooked,
      trialsConducted,
      paidSignUps,
      leadToTrial: calcPercent(trialsBooked, totalLeads),
      leadToPaid: calcPercent(paidSignUps, totalLeads),
      trialToPaid: calcPercent(paidSignUps, trialsConducted),
    };
  }, [form]);

  const activeReport = reports[0] ?? fallbackReport;

  const latestFunnelRows = useMemo(
    () => [
      { stage: "Total leads received", count: activeReport.total_leads_received },
      { stage: "Qualified parent leads", count: activeReport.qualified_parent_leads },
      { stage: "Trials booked (new leads only)", count: activeReport.trials_booked },
      { stage: "Trials conducted", count: activeReport.trials_conducted },
      { stage: "Paid sign-ups", count: activeReport.paid_sign_ups },
    ],
    [activeReport]
  );

  const latestConversionRows = useMemo(
    () => [
      { metric: "Lead → Trial %", value: Number(activeReport.lead_to_trial_percent ?? 0) },
      { metric: "Lead → Paid Conversion %", value: Number(activeReport.lead_to_paid_conversion_percent ?? 0) },
      { metric: "Trial → Paid Conversion %", value: Number(activeReport.trial_to_paid_conversion_percent ?? 0) },
    ],
    [activeReport]
  );

  const historyRows = useMemo<HistoryRow[]>(() => {
    if (!reports.length) return [reportToHistoryRow(fallbackReport)];
    return [...reports].reverse().map(reportToHistoryRow);
  }, [reports]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("sales_lead_funnel_reports")
        .select("*")
        .order("report_month", { ascending: false })
        .limit(18);

      if (fetchError) throw fetchError;

      const nextReports = (data ?? []) as FunnelReport[];
      setReports(nextReports);

      if (nextReports[0]) {
        localStorage.setItem("salesLeadFunnelLatest", JSON.stringify(nextReports[0]));
      }
    } catch (fetchError: any) {
      console.error(fetchError);
      setError(fetchError?.message ?? "Failed to load lead funnel reports. Make sure the Supabase table exists and RLS policies allow access.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateForm = (key: keyof FunnelForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setMessage(null);
    setError(null);
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
        total_leads_received: formNumbers.totalLeads,
        qualified_parent_leads: formNumbers.qualified,
        trials_booked: formNumbers.trialsBooked,
        trials_conducted: formNumbers.trialsConducted,
        paid_sign_ups: formNumbers.paidSignUps,
        lead_to_trial_percent: formNumbers.leadToTrial,
        lead_to_paid_conversion_percent: formNumbers.leadToPaid,
        trial_to_paid_conversion_percent: formNumbers.trialToPaid,
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error: saveError } = await supabase
        .from("sales_lead_funnel_reports")
        .upsert(payload, { onConflict: "report_month" })
        .select()
        .single();

      if (saveError) throw saveError;

      localStorage.setItem("salesLeadFunnelLatest", JSON.stringify(data));
      window.dispatchEvent(new Event("sales-lead-funnel-updated"));

      setMessage("Lead funnel report saved. Your Sales Dashboard can now read this latest report from Supabase.");
      await fetchReports();
    } catch (saveError: any) {
      console.error(saveError);
      setError(saveError?.message ?? "Failed to save lead funnel report.");
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async (report: FunnelReport) => {
    if (!report.id || report.id === "fallback") return;

    try {
      setDeletingId(report.id);
      setError(null);
      setMessage(null);

      const { error: deleteError } = await supabase.from("sales_lead_funnel_reports").delete().eq("id", report.id);
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
              <Badge className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600 dark:bg-blue-500">B. Lead Funnel Overview</Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">Data Entry + View</Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">Dashboard Source: Supabase</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Lead Funnel Overview</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
              Enter monthly funnel counts, automatically calculate conversion percentages, view saved reports, and use the latest report on the Sales Dashboard.
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

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Enter Monthly Funnel Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Report Month</Label>
              <Input
                type="month"
                value={form.report_month}
                onChange={(event) => updateForm("report_month", event.target.value)}
                className="h-11 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Total leads received" value={form.total_leads_received} onChange={(value) => updateForm("total_leads_received", value)} />
              <InputField label="Qualified parent leads" value={form.qualified_parent_leads} onChange={(value) => updateForm("qualified_parent_leads", value)} />
              <InputField label="Trials booked (new leads only)" value={form.trials_booked} onChange={(value) => updateForm("trials_booked", value)} />
              <InputField label="Trials conducted" value={form.trials_conducted} onChange={(value) => updateForm("trials_conducted", value)} />
              <InputField label="Paid sign-ups" value={form.paid_sign_ups} onChange={(value) => updateForm("paid_sign_ups", value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notes</Label>
              <Input
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                placeholder="Optional short note for this month"
                className="h-11 rounded-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <KpiCard title="Lead → Trial %" value={`${formNumbers.leadToTrial}%`} helper="Trials booked / total leads" icon={Target} tone="blue" />
              <KpiCard title="Lead → Paid %" value={`${formNumbers.leadToPaid}%`} helper="Paid sign-ups / total leads" icon={BadgeDollarSign} tone="green" />
              <KpiCard title="Trial → Paid %" value={`${formNumbers.trialToPaid}%`} helper="Paid sign-ups / trials conducted" icon={CheckCircle2} tone="violet" />
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
            <CardTitle className="text-base">Latest Report Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest month</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{formatMonth(activeReport.report_month)}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{activeReport.notes ?? "No notes added."}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard title="Total leads" value={activeReport.total_leads_received.toLocaleString()} helper="All inbound leads" icon={Users} tone="blue" />
              <KpiCard title="Qualified leads" value={activeReport.qualified_parent_leads.toLocaleString()} helper="Parent leads qualified" icon={Target} tone="amber" />
              <KpiCard title="Paid sign-ups" value={activeReport.paid_sign_ups.toLocaleString()} helper="Converted students" icon={BadgeDollarSign} tone="green" />
            </div>

            <div className="space-y-4">
              {latestFunnelRows.map((row) => (
                <ProgressLine
                  key={row.stage}
                  label={row.stage}
                  value={calcPercent(row.count, activeReport.total_leads_received)}
                  rightLabel={`${row.count.toLocaleString()} • ${calcPercent(row.count, activeReport.total_leads_received)}%`}
                />
              ))}
            </div>
          </CardContent>
        </BaseCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <BaseCard className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Funnel Stage Bar Chart</CardTitle>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latestFunnelRows} layout="vertical" margin={{ top: 8, right: 18, left: 155, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="stage" width={150} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
                <Bar dataKey="count" name="Count" radius={[0, 8, 8, 0]} barSize={26}>
                  {latestFunnelRows.map((entry, index) => (
                    <Cell key={entry.stage} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Conversion Radial Chart</CardTitle>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="22%" outerRadius="92%" data={latestConversionRows} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={10} background>
                  {latestConversionRows.map((entry, index) => (
                    <Cell key={entry.metric} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </RadialBar>
                <Legend iconSize={9} layout="vertical" verticalAlign="middle" align="right" />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => `${Number(value ?? 0)}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Monthly Funnel History</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyRows} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
                <Legend />
                <Line type="monotone" dataKey="leads" name="Leads" stroke={COLORS.blue} strokeWidth={3} />
                <Line type="monotone" dataKey="qualified" name="Qualified" stroke={COLORS.amber} strokeWidth={3} />
                <Line type="monotone" dataKey="trials" name="Trials Booked" stroke={COLORS.violet} strokeWidth={3} />
                <Line type="monotone" dataKey="paid" name="Paid Sign-ups" stroke={COLORS.green} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Conversion Mix</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={latestConversionRows} dataKey="value" nameKey="metric" innerRadius={58} outerRadius={105} paddingAngle={4} label={({ value }) => `${value}%`}>
                  {latestConversionRows.map((entry, index) => (
                    <Cell key={entry.metric} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => `${Number(value ?? 0)}%`} />
                <Legend iconSize={9} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>
      </section>

      <BaseCard>
        <CardHeader>
          <CardTitle className="text-base">Saved Funnel Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr>
                  {[
                    "Month",
                    "Total leads",
                    "Qualified parent leads",
                    "Trials booked",
                    "Trials conducted",
                    "Paid sign-ups",
                    "Lead → Trial %",
                    "Lead → Paid %",
                    "Trial → Paid %",
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
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.total_leads_received}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.qualified_parent_leads}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.trials_booked}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.trials_conducted}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm font-bold text-emerald-600 dark:border-slate-800 dark:text-emerald-400">{report.paid_sign_ups}</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.lead_to_trial_percent}%</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.lead_to_paid_conversion_percent}%</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">{report.trial_to_paid_conversion_percent}%</td>
                      <td className="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
                        <div className="flex gap-2">
                          <Button onClick={() => setForm(reportToForm(report))} size="sm" variant="outline" className="rounded-full border-slate-200 dark:border-slate-800">
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
                    <td colSpan={10} className="border-t border-slate-100 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      No saved reports yet. Enter the first month above and click Save / Update Month.
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
