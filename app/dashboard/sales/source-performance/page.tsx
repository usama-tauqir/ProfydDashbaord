// app/dashboard/sales/source-performance/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Edit3,
  Globe2,
  Loader2,
  Megaphone,
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


type SourceName = "WhatsApp Ads – AU" | "WhatsApp Ads – NZ" | "Website" | "Referrals" | "Other";

type SourcePerformanceReport = {
  id: string;
  report_month: string;
  source: SourceName | string;
  leads: number;
  trials: number;
  conducted: number;
  paid_sign_ups: number;
  conversion_percent: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type SourceFormRow = {
  source: SourceName;
  leads: string;
  trials: string;
  conducted: string;
  paid_sign_ups: string;
};

type MonthHistoryRow = {
  month: string;
  leads: number;
  trials: number;
  conducted: number;
  paid: number;
  conversion: number;
};

const SOURCE_NAMES: SourceName[] = ["WhatsApp Ads – AU", "WhatsApp Ads – NZ", "Website", "Referrals", "Other"];

// Updated palette – indigo‑first, matching admin dashboard’s primary accent
const COLORS = {
  primary: "#4f46e5", // indigo
  sky: "#0ea5e9",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
};

const CHART_COLORS = [COLORS.primary, COLORS.green, COLORS.amber, COLORS.violet, COLORS.cyan, COLORS.red];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function emptyRows(): SourceFormRow[] {
  return SOURCE_NAMES.map((source) => ({ source, leads: "", trials: "", conducted: "", paid_sign_ups: "" }));
}

function fallbackRows(month = currentMonth()): SourcePerformanceReport[] {
  return [
    { id: "fallback-au", report_month: month, source: "WhatsApp Ads – AU", leads: 120, trials: 45, conducted: 38, paid_sign_ups: 32, conversion_percent: 26.7, notes: "Demo data" },
    { id: "fallback-nz", report_month: month, source: "WhatsApp Ads – NZ", leads: 65, trials: 22, conducted: 18, paid_sign_ups: 15, conversion_percent: 23.1, notes: "Demo data" },
    { id: "fallback-website", report_month: month, source: "Website", leads: 90, trials: 35, conducted: 30, paid_sign_ups: 25, conversion_percent: 27.8, notes: "Demo data" },
    { id: "fallback-referrals", report_month: month, source: "Referrals", leads: 30, trials: 12, conducted: 10, paid_sign_ups: 8, conversion_percent: 26.7, notes: "Demo data" },
    { id: "fallback-other", report_month: month, source: "Other", leads: 15, trials: 6, conducted: 5, paid_sign_ups: 5, conversion_percent: 33.3, notes: "Demo data" },
  ];
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

function rowsFromReports(reports: SourcePerformanceReport[], month: string): SourceFormRow[] {
  return SOURCE_NAMES.map((source) => {
    const found = reports.find((report) => report.report_month === month && report.source === source);
    return {
      source,
      leads: String(found?.leads ?? ""),
      trials: String(found?.trials ?? ""),
      conducted: String(found?.conducted ?? ""),
      paid_sign_ups: String(found?.paid_sign_ups ?? ""),
    };
  });
}

// BaseCard now uses shadcn theme tokens
function BaseCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <Card className={`border-border bg-card text-card-foreground ${className}`}>
      {children}
    </Card>
  );
}

// Simplified KPI card – uses primary accent
function KpiCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: ElementType;
}) {
  return (
    <BaseCard>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground/70">{helper}</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </BaseCard>
  );
}

function NumberInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Input
      type="number"
      min="0"
      inputMode="numeric"
      value={value}
      placeholder="0"
      onChange={(event) => onChange(event.target.value)}
      className="h-10 min-w-[90px] rounded-xl border-border bg-background"
    />
  );
}

function ProgressLine({ label, value, rightLabel }: { label: string; value: number; rightLabel: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{rightLabel}</span>
      </div>
      <Progress value={Math.min(value, 100)} className="h-2 bg-muted" />
    </div>
  );
}

export default function SalesSourcePerformancePage() {
  const [reportMonth, setReportMonth] = useState(currentMonth());
  const [notes, setNotes] = useState("");
  const [formRows, setFormRows] = useState<SourceFormRow[]>(emptyRows());
  const [reports, setReports] = useState<SourcePerformanceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculatedFormRows = useMemo(
    () =>
      formRows.map((row) => {
        const leads = toNumber(row.leads);
        const trials = toNumber(row.trials);
        const conducted = toNumber(row.conducted);
        const paid = toNumber(row.paid_sign_ups);
        return {
          source: row.source,
          leads,
          trials,
          conducted,
          paid,
          conversion: calcPercent(paid, leads),
        };
      }),
    [formRows]
  );

  const activeMonth = reports[0]?.report_month ?? reportMonth;
  const latestRows = useMemo(() => {
    const rows = reports.filter((report) => report.report_month === activeMonth);
    return rows.length ? rows : fallbackRows(activeMonth);
  }, [reports, activeMonth]);

  const totals = useMemo(() => {
    const leads = latestRows.reduce((sum, row) => sum + toNumber(row.leads), 0);
    const trials = latestRows.reduce((sum, row) => sum + toNumber(row.trials), 0);
    const conducted = latestRows.reduce((sum, row) => sum + toNumber(row.conducted), 0);
    const paid = latestRows.reduce((sum, row) => sum + toNumber(row.paid_sign_ups), 0);
    return {
      leads,
      trials,
      conducted,
      paid,
      conversion: calcPercent(paid, leads),
      trialConductRate: calcPercent(conducted, trials),
    };
  }, [latestRows]);

  const historyRows = useMemo<MonthHistoryRow[]>(() => {
    const source = reports.length ? reports : fallbackRows();
    const map = new Map<string, MonthHistoryRow>();

    source.forEach((row) => {
      const existing = map.get(row.report_month) ?? {
        month: row.report_month,
        leads: 0,
        trials: 0,
        conducted: 0,
        paid: 0,
        conversion: 0,
      };

      existing.leads += toNumber(row.leads);
      existing.trials += toNumber(row.trials);
      existing.conducted += toNumber(row.conducted);
      existing.paid += toNumber(row.paid_sign_ups);
      existing.conversion = calcPercent(existing.paid, existing.leads);
      map.set(row.report_month, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [reports]);

  const sourceShareRows = useMemo(
    () => latestRows.map((row) => ({ source: row.source, value: toNumber(row.paid_sign_ups) })),
    [latestRows]
  );

  const conversionRows = useMemo(
    () => latestRows.map((row) => ({ source: row.source, conversion: Number(row.conversion_percent ?? 0) })),
    [latestRows]
  );

  const bestSource = useMemo(() => {
    return [...latestRows].sort((a, b) => Number(b.conversion_percent ?? 0) - Number(a.conversion_percent ?? 0))[0];
  }, [latestRows]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("sales_source_performance_reports")
        .select("*")
        .order("report_month", { ascending: false })
        .order("source", { ascending: true })
        .limit(120);

      if (fetchError) throw fetchError;

      const nextReports = (data ?? []) as SourcePerformanceReport[];
      setReports(nextReports);

      if (nextReports.length) {
        const latestMonth = nextReports[0].report_month;
        setReportMonth(latestMonth);
        setFormRows(rowsFromReports(nextReports, latestMonth));
        setNotes(nextReports.find((report) => report.report_month === latestMonth)?.notes ?? "");
        localStorage.setItem("salesSourcePerformanceLatest", JSON.stringify(nextReports.filter((report) => report.report_month === latestMonth)));
      }
    } catch (fetchError: any) {
      console.error(fetchError);
      setError(fetchError?.message ?? "Failed to load source-wise performance reports. Make sure the Supabase table exists and RLS policies allow access.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateRow = (source: SourceName, key: keyof Omit<SourceFormRow, "source">, value: string) => {
    setFormRows((current) => current.map((row) => (row.source === source ? { ...row, [key]: value } : row)));
  };

  const resetForm = () => {
    setReportMonth(currentMonth());
    setNotes("");
    setFormRows(emptyRows());
    setMessage(null);
    setError(null);
  };

  const saveReport = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      if (!reportMonth) {
        setError("Please select a report month.");
        return;
      }

      const payload = calculatedFormRows.map((row) => ({
        report_month: reportMonth,
        source: row.source,
        leads: row.leads,
        trials: row.trials,
        conducted: row.conducted,
        paid_sign_ups: row.paid,
        conversion_percent: row.conversion,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }));

      const { data, error: saveError } = await supabase
        .from("sales_source_performance_reports")
        .upsert(payload, { onConflict: "report_month,source" })
        .select();

      if (saveError) throw saveError;

      localStorage.setItem("salesSourcePerformanceLatest", JSON.stringify(data ?? []));
      window.dispatchEvent(new Event("sales-source-performance-updated"));

      setMessage("Source-wise performance saved. Your Sales Dashboard can now read this latest report from Supabase.");
      await fetchReports();
    } catch (saveError: any) {
      console.error(saveError);
      setError(saveError?.message ?? "Failed to save source-wise performance report.");
    } finally {
      setSaving(false);
    }
  };

  const editMonth = (month: string) => {
    setReportMonth(month);
    setFormRows(rowsFromReports(reports, month));
    setNotes(reports.find((report) => report.report_month === month)?.notes ?? "");
    setMessage(null);
    setError(null);
  };

  const deleteMonthReports = async (month: string) => {
    try {
      setDeletingMonth(month);
      setError(null);
      setMessage(null);

      const { error: deleteError } = await supabase.from("sales_source_performance_reports").delete().eq("report_month", month);
      if (deleteError) throw deleteError;

      setMessage(`${formatMonth(month)} source-wise performance report deleted.`);
      await fetchReports();
    } catch (deleteError: any) {
      console.error(deleteError);
      setError(deleteError?.message ?? "Failed to delete source-wise performance report.");
    } finally {
      setDeletingMonth(null);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header – matches admin dashboard */}
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground">C. Source-wise Performance</Badge>
              <Badge variant="outline" className="rounded-full border-border">Data Entry + View</Badge>
              <Badge variant="outline" className="rounded-full border-border">Dashboard Source: Supabase</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Source-wise Performance</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Enter monthly source performance for WhatsApp AU, WhatsApp NZ, Website, Referrals, and Other. Conversion is calculated automatically from paid sign-ups divided by leads.
            </p>
          </div>

          <Button onClick={fetchReports} disabled={loading} variant="outline" className="h-10 rounded-full border-border bg-card">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </section>

      {error ? (
        <Alert className="rounded-lg border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-200">Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert className="rounded-lg border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800 dark:text-emerald-200">Saved</AlertTitle>
          <AlertDescription className="text-emerald-700 dark:text-emerald-300">{message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Enter Monthly Source Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Report Month</Label>
                <Input
                  type="month"
                  value={reportMonth}
                  onChange={(event) => setReportMonth(event.target.value)}
                  className="h-11 rounded-2xl border-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Notes</Label>
                <Input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional note for this month"
                  className="h-11 rounded-2xl border-border bg-background"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr>
                    {[
                      "Source",
                      "Leads",
                      "Trials",
                      "Conducted",
                      "Paid Sign-ups",
                      "Conversion %",
                    ].map((header) => (
                      <th key={header} className="bg-muted px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formRows.map((row) => {
                    const calculated = calculatedFormRows.find((item) => item.source === row.source);
                    return (
                      <tr key={row.source}>
                        <td className="border-t border-border px-4 py-3 text-sm font-semibold text-card-foreground">{row.source}</td>
                        <td className="border-t border-border px-4 py-3"><NumberInput value={row.leads} onChange={(value) => updateRow(row.source, "leads", value)} /></td>
                        <td className="border-t border-border px-4 py-3"><NumberInput value={row.trials} onChange={(value) => updateRow(row.source, "trials", value)} /></td>
                        <td className="border-t border-border px-4 py-3"><NumberInput value={row.conducted} onChange={(value) => updateRow(row.source, "conducted", value)} /></td>
                        <td className="border-t border-border px-4 py-3"><NumberInput value={row.paid_sign_ups} onChange={(value) => updateRow(row.source, "paid_sign_ups", value)} /></td>
                        <td className="border-t border-border px-4 py-3 text-sm font-bold text-primary">{calculated?.conversion ?? 0}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={saveReport} disabled={saving} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save / Update Month
              </Button>
              <Button onClick={resetForm} type="button" variant="outline" className="rounded-full border-border bg-card">
                Clear Form
              </Button>
            </div>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Latest Source Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">Latest month</p>
              <h2 className="mt-1 text-2xl font-bold text-card-foreground">{formatMonth(activeMonth)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{latestRows[0]?.notes ?? "No notes added."}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <KpiCard title="Total leads" value={totals.leads.toLocaleString()} helper="All sources combined" icon={Users} />
              <KpiCard title="Total trials" value={totals.trials.toLocaleString()} helper="Trials booked" icon={Target} />
              <KpiCard title="Conducted" value={totals.conducted.toLocaleString()} helper="Trials conducted" icon={CheckCircle2} />
              <KpiCard title="Paid sign-ups" value={totals.paid.toLocaleString()} helper={`${totals.conversion}% overall conversion`} icon={TrendingUp} />
            </div>

            <div className="space-y-4">
              {latestRows.map((row) => (
                <ProgressLine
                  key={row.source}
                  label={row.source}
                  value={Number(row.conversion_percent ?? 0)}
                  rightLabel={`${row.paid_sign_ups} paid • ${Number(row.conversion_percent ?? 0)}%`}
                />
              ))}
            </div>
          </CardContent>
        </BaseCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Leads, Trials, Conducted & Paid by Source</CardTitle>
          </CardHeader>
          <CardContent className="h-[370px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latestRows} margin={{ top: 14, right: 12, left: -10, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted-foreground/30" />
                <XAxis dataKey="source" axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" fontSize={11} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="leads" name="Leads" fill={COLORS.primary} radius={[7, 7, 0, 0]} />
                <Bar dataKey="trials" name="Trials" fill={COLORS.amber} radius={[7, 7, 0, 0]} />
                <Bar dataKey="conducted" name="Conducted" fill={COLORS.sky} radius={[7, 7, 0, 0]} />
                <Bar dataKey="paid_sign_ups" name="Paid" fill={COLORS.green} radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Paid Sign-up Share</CardTitle>
          </CardHeader>
          <CardContent className="h-[370px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceShareRows} dataKey="value" nameKey="source" innerRadius={60} outerRadius={108} paddingAngle={4} label>
                  {sourceShareRows.map((entry, index) => (
                    <Cell key={entry.source} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
                <Legend iconSize={9} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Conversion Radial Chart</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="22%" outerRadius="92%" data={conversionRows} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="conversion" cornerRadius={10} background>
                  {conversionRows.map((entry, index) => (
                    <Cell key={entry.source} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </RadialBar>
                <Legend iconSize={9} layout="vertical" verticalAlign="middle" align="right" />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} formatter={(value) => `${Number(value ?? 0)}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Monthly Source History</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyRows} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted-foreground/30" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="leads" name="Leads" stroke={COLORS.primary} strokeWidth={3} />
                <Line type="monotone" dataKey="trials" name="Trials" stroke={COLORS.amber} strokeWidth={3} />
                <Line type="monotone" dataKey="conducted" name="Conducted" stroke={COLORS.sky} strokeWidth={3} />
                <Line type="monotone" dataKey="paid" name="Paid" stroke={COLORS.green} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>
      </section>

      <BaseCard>
        <CardHeader>
          <CardTitle className="text-base">Saved Source-wise Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-primary">Best source this month</p>
                <p className="text-sm text-primary/80">
                  {bestSource?.source ?? "No source"} • {Number(bestSource?.conversion_percent ?? 0)}% conversion
                </p>
              </div>
              <div className="rounded-2xl bg-background p-3 text-primary shadow-sm">
                <Megaphone className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr>
                  {[
                    "Month",
                    "Source",
                    "Leads",
                    "Trials",
                    "Conducted",
                    "Paid Sign-ups",
                    "Conversion %",
                    "Actions",
                  ].map((header) => (
                    <th key={header} className="bg-muted px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.length ? (
                  reports.map((report) => (
                    <tr key={report.id}>
                      <td className="border-t border-border px-4 py-3 text-sm font-semibold text-card-foreground">{formatMonth(report.report_month)}</td>
                      <td className="border-t border-border px-4 py-3 text-sm font-semibold">{report.source}</td>
                      <td className="border-t border-border px-4 py-3 text-sm">{report.leads}</td>
                      <td className="border-t border-border px-4 py-3 text-sm">{report.trials}</td>
                      <td className="border-t border-border px-4 py-3 text-sm">{report.conducted}</td>
                      <td className="border-t border-border px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">{report.paid_sign_ups}</td>
                      <td className="border-t border-border px-4 py-3 text-sm font-bold text-primary">{report.conversion_percent}%</td>
                      <td className="border-t border-border px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button onClick={() => editMonth(report.report_month)} size="sm" variant="outline" className="rounded-full border-border bg-card">
                            <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit Month
                          </Button>
                          <Button onClick={() => deleteMonthReports(report.report_month)} size="sm" variant="outline" disabled={deletingMonth === report.report_month} className="rounded-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">
                            {deletingMonth === report.report_month ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}
                            Delete Month
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
                      No saved source reports yet. Enter the first month above and click Save / Update Month.
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