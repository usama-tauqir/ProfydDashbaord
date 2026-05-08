"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Edit3,
  Filter,
  Lightbulb,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Market = "AU" | "UK" | "US" | "CA" | "NZ" | "EU" | "PK";
type MarketFilter = "all" | Market;
type LeadSource = "Meta Ads" | "Google Ads" | "Website / Organic" | "Referrals" | "Other";

type LeadGenerationRecord = {
  id: string;
  month: string;
  market: Market;
  source: LeadSource;
  other_source: string | null;
  campaign_name: string | null;
  leads_count: number | string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type FunnelPerformanceRecord = {
  id: string;
  month: string;
  market: Market;
  trials_booked: number | string;
  trials_attended: number | string;
  paid_conversions: number | string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type AdSpendRecord = {
  id?: string;
  month: string;
  market: Market;
  ad_spend?: number | string | null;
  spend?: number | string | null;
  spend_amount?: number | string | null;
  total_spend?: number | string | null;
  amount?: number | string | null;
  created_at?: string;
  updated_at?: string | null;
};

type FunnelForm = {
  month: string;
  market: Market;
  trials_booked: string;
  trials_attended: string;
  paid_conversions: string;
  notes: string;
};

const MARKETS: Market[] = ["AU", "UK", "US", "CA", "NZ", "EU", "PK"];

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return date.toISOString().slice(0, 7);
}

function emptyForm(month = getCurrentMonth()): FunnelForm {
  return {
    month,
    market: "AU",
    trials_booked: "",
    trials_attended: "",
    paid_conversions: "",
    notes: "",
  };
}

function toCount(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getAdSpendValue(record: AdSpendRecord) {
  return toCount(
    record.ad_spend ??
      record.spend ??
      record.spend_amount ??
      record.total_spend ??
      record.amount ??
      0
  );
}

function toChartNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (Array.isArray(value)) return Number(value[0]) || 0;
  return 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String((error as { message?: unknown }).message || "");
    if (message) return message;
  }

  if (typeof error === "string" && error) return error;

  return fallback;
}

function percentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function plainPercentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function trendDirection(value: number): "up" | "down" | "neutral" {
  if (!Number.isFinite(value) || value === 0) return "neutral";
  return value > 0 ? "up" : "down";
}

function inputClassName(extra = "") {
  return `h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${extra}`;
}

function textareaClassName(extra = "") {
  return `min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${extra}`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</label>;
}

function TrendBadge({
  direction,
  label,
}: {
  direction: "up" | "down" | "neutral";
  label: string;
}) {
  const config = {
    up: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: ArrowUpRight,
    },
    down: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-700 dark:text-red-300",
      icon: ArrowDownRight,
    },
    neutral: {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-600 dark:text-gray-400",
      icon: Minus,
    },
  };

  const { bg, text, icon: Icon } = config[direction];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${bg} ${text}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
      <Icon className="h-5 w-5 text-indigo-600" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  highlight = false,
  variant = "default",
  children,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: React.ReactNode;
  highlight?: boolean;
  variant?: "default" | "outline" | "warning";
  children?: React.ReactNode;
}) {
  const variantStyles = {
    default: "bg-card border-border",
    outline: "bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700",
    warning: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
  };

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        highlight ? "ring-1 ring-indigo-200 dark:ring-indigo-800" : ""
      } ${variantStyles[variant]}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
            {trend && <div className="mt-2">{trend}</div>}
            {children}
          </div>
          <div className="ml-3 rounded-full bg-muted/60 p-2.5">
            <Icon className="h-5 w-5 text-indigo-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketingFunnelPerformancePage() {
  const [funnelRecords, setFunnelRecords] = useState<FunnelPerformanceRecord[]>([]);
  const [leadRecords, setLeadRecords] = useState<LeadGenerationRecord[]>([]);
  const [adSpendRecords, setAdSpendRecords] = useState<AdSpendRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<FunnelForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adSpendWarning, setAdSpendWarning] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setAdSpendWarning(null);

      const [funnelResponse, leadsResponse, adSpendResponse] = await Promise.all([
        supabase
          .from("marketing_funnel_records")
          .select("*")
          .order("month", { ascending: false })
          .order("created_at", { ascending: false }),

        supabase
          .from("marketing_lead_generation_records")
          .select("*")
          .order("month", { ascending: false })
          .order("created_at", { ascending: false }),

        supabase
          .from("marketing_ad_spend_records")
          .select("*")
          .order("month", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (funnelResponse.error) throw new Error(funnelResponse.error.message);
      if (leadsResponse.error) throw new Error(leadsResponse.error.message);

      if (adSpendResponse.error) {
        setAdSpendRecords([]);
        setAdSpendWarning(
          "Ad spend data could not be loaded. Check that your Supabase table is named marketing_ad_spend_records and has month, market and spend/ad_spend columns."
        );
      } else {
        setAdSpendRecords((adSpendResponse.data || []) as AdSpendRecord[]);
      }

      setFunnelRecords((funnelResponse.data || []) as FunnelPerformanceRecord[]);
      setLeadRecords((leadsResponse.data || []) as LeadGenerationRecord[]);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      const text = getErrorMessage(error, "Could not load funnel performance records.");
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const selectedFunnelRecords = useMemo(
    () => funnelRecords.filter((record) => record.month === selectedMonth),
    [funnelRecords, selectedMonth]
  );

  const selectedLeadRecords = useMemo(
    () => leadRecords.filter((record) => record.month === selectedMonth),
    [leadRecords, selectedMonth]
  );

  const selectedAdSpendRecords = useMemo(
    () => adSpendRecords.filter((record) => record.month === selectedMonth),
    [adSpendRecords, selectedMonth]
  );

  const previousFunnelRecords = useMemo(
    () => funnelRecords.filter((record) => record.month === getPreviousMonth(selectedMonth)),
    [funnelRecords, selectedMonth]
  );

  const previousAdSpendRecords = useMemo(
    () => adSpendRecords.filter((record) => record.month === getPreviousMonth(selectedMonth)),
    [adSpendRecords, selectedMonth]
  );

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedFunnelRecords
      .filter((record) => marketFilter === "all" || record.market === marketFilter)
      .filter((record) => {
        if (!query) return true;
        return [record.month, record.market, record.notes || ""]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => toCount(b.paid_conversions) - toCount(a.paid_conversions));
  }, [selectedFunnelRecords, marketFilter, searchQuery]);

  const marketSummary = useMemo(() => {
    return MARKETS.map((market) => {
      const marketFunnelRecords = selectedFunnelRecords.filter((record) => record.market === market);
      const marketLeadRecords = selectedLeadRecords.filter((record) => record.market === market);
      const marketAdSpendRecords = selectedAdSpendRecords.filter((record) => record.market === market);
      const previousMarketFunnelRecords = previousFunnelRecords.filter((record) => record.market === market);
      const previousMarketAdSpendRecords = previousAdSpendRecords.filter((record) => record.market === market);

      const leadsGenerated = marketLeadRecords.reduce((sum, record) => sum + toCount(record.leads_count), 0);
      const trialsBooked = marketFunnelRecords.reduce((sum, record) => sum + toCount(record.trials_booked), 0);
      const trialsAttended = marketFunnelRecords.reduce((sum, record) => sum + toCount(record.trials_attended), 0);
      const paidConversions = marketFunnelRecords.reduce((sum, record) => sum + toCount(record.paid_conversions), 0);
      const adSpend = marketAdSpendRecords.reduce((sum, record) => sum + getAdSpendValue(record), 0);

      const previousPaidConversions = previousMarketFunnelRecords.reduce(
        (sum, record) => sum + toCount(record.paid_conversions),
        0
      );
      const previousAdSpend = previousMarketAdSpendRecords.reduce(
        (sum, record) => sum + getAdSpendValue(record),
        0
      );

      return {
        market,
        leadsGenerated,
        trialsBooked,
        trialsAttended,
        paidConversions,
        adSpend,
        previousPaidConversions,
        previousAdSpend,
        records: marketFunnelRecords.length,
        leadToTrialRate: leadsGenerated ? (trialsBooked / leadsGenerated) * 100 : 0,
        attendanceRate: trialsBooked ? (trialsAttended / trialsBooked) * 100 : 0,
        trialToPaidRate: trialsAttended ? (paidConversions / trialsAttended) * 100 : 0,
        cac: paidConversions ? adSpend / paidConversions : 0,
        paidConversionsMoM: previousPaidConversions
          ? ((paidConversions - previousPaidConversions) / previousPaidConversions) * 100
          : paidConversions > 0
            ? 100
            : 0,
        adSpendMoM: previousAdSpend
          ? ((adSpend - previousAdSpend) / previousAdSpend) * 100
          : adSpend > 0
            ? 100
            : 0,
      };
    });
  }, [
    selectedFunnelRecords,
    selectedLeadRecords,
    selectedAdSpendRecords,
    previousFunnelRecords,
    previousAdSpendRecords,
  ]);

  const totals = marketSummary.reduce(
    (acc, item) => {
      acc.leadsGenerated += item.leadsGenerated;
      acc.trialsBooked += item.trialsBooked;
      acc.trialsAttended += item.trialsAttended;
      acc.paidConversions += item.paidConversions;
      acc.adSpend += item.adSpend;
      return acc;
    },
    {
      leadsGenerated: 0,
      trialsBooked: 0,
      trialsAttended: 0,
      paidConversions: 0,
      adSpend: 0,
    }
  );

  const previousPaidConversions = previousFunnelRecords.reduce(
    (sum, record) => sum + toCount(record.paid_conversions),
    0
  );

  const previousTotalAdSpend = previousAdSpendRecords.reduce(
    (sum, record) => sum + getAdSpendValue(record),
    0
  );

  const paidConversionsMoM = previousPaidConversions
    ? ((totals.paidConversions - previousPaidConversions) / previousPaidConversions) * 100
    : totals.paidConversions > 0
      ? 100
      : 0;

  const adSpendMoM = previousTotalAdSpend
    ? ((totals.adSpend - previousTotalAdSpend) / previousTotalAdSpend) * 100
    : totals.adSpend > 0
      ? 100
      : 0;

  const blendedCAC = totals.paidConversions ? totals.adSpend / totals.paidConversions : 0;

  const activeMarketSummary = marketSummary.filter(
    (item) =>
      item.leadsGenerated ||
      item.trialsBooked ||
      item.trialsAttended ||
      item.paidConversions ||
      item.adSpend
  );

  const topMarket = [...activeMarketSummary].sort((a, b) => {
    if (b.paidConversions !== a.paidConversions) return b.paidConversions - a.paidConversions;
    if (b.trialToPaidRate !== a.trialToPaidRate) return b.trialToPaidRate - a.trialToPaidRate;
    return a.cac - b.cac;
  })[0];

  const worstMarket = [...activeMarketSummary].sort((a, b) => {
    if (a.paidConversions !== b.paidConversions) return a.paidConversions - b.paidConversions;
    if (a.trialToPaidRate !== b.trialToPaidRate) return a.trialToPaidRate - b.trialToPaidRate;
    return b.cac - a.cac;
  })[0];

  const bestLeadToTrialMarket = [...marketSummary]
    .filter((item) => item.leadsGenerated > 0)
    .sort((a, b) => b.leadToTrialRate - a.leadToTrialRate)[0];

  const bestMarketReason = topMarket
    ? `${formatNumber(topMarket.paidConversions)} paid students, ${plainPercentage(
        topMarket.trialToPaidRate
      )} trial → paid rate${
        topMarket.adSpend ? ` and ${formatCurrency(topMarket.cac)} CAC` : ""
      }.`
    : "No market activity yet for this month.";

  const worstMarketReason = worstMarket
    ? worstMarket.paidConversions === 0
      ? `No paid students yet from ${formatNumber(worstMarket.leadsGenerated)} leads and ${formatNumber(
          worstMarket.trialsAttended
        )} attended trials.`
      : `${formatNumber(worstMarket.paidConversions)} paid students, ${plainPercentage(
          worstMarket.trialToPaidRate
        )} trial → paid rate${
          worstMarket.adSpend ? ` and ${formatCurrency(worstMarket.cac)} CAC` : ""
        }.`
    : "No market activity yet for this month.";

  function getImprovementPlan(item: (typeof marketSummary)[number]) {
    if (!item.leadsGenerated && !item.trialsBooked && !item.trialsAttended && !item.paidConversions) {
      return "Start tracking lead volume and trial activity so next month has a baseline.";
    }

    if (item.leadsGenerated > 0 && item.leadToTrialRate < 20) {
      return "Improve lead qualification and booking follow-up to increase Lead → Trial rate.";
    }

    if (item.trialsBooked > 0 && item.attendanceRate < 60) {
      return "Reduce no-shows with stronger reminders, WhatsApp follow-ups and clearer trial expectations.";
    }

    if (item.trialsAttended > 0 && item.trialToPaidRate < 25) {
      return "Improve sales closing after attended trials with faster follow-up and stronger offers.";
    }

    if (item.cac > 0 && blendedCAC > 0 && item.cac > blendedCAC * 1.2) {
      return "Reduce CAC by pausing weaker campaigns and shifting spend to better converting creatives.";
    }

    if (item.paidConversions > 0) {
      return "Scale the current winning campaigns while monitoring CAC and conversion quality.";
    }

    return "Review campaign quality, sales follow-up and trial attendance before increasing spend.";
  }

  function setFormValue<K extends keyof FunnelForm>(key: K, value: FunnelForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(selectedMonth));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trialsBooked = Number(form.trials_booked);
    const trialsAttended = Number(form.trials_attended);
    const paidConversions = Number(form.paid_conversions);

    if (
      !form.month ||
      !form.market ||
      !Number.isFinite(trialsBooked) ||
      !Number.isFinite(trialsAttended) ||
      !Number.isFinite(paidConversions) ||
      trialsBooked < 0 ||
      trialsAttended < 0 ||
      paidConversions < 0
    ) {
      setMessage({
        type: "error",
        text: "Please enter month, market, trials booked, trials attended and paid conversions.",
      });
      return;
    }

    if (trialsAttended > trialsBooked) {
      setMessage({
        type: "error",
        text: "Trials attended cannot be greater than trials booked.",
      });
      return;
    }

    if (paidConversions > trialsAttended) {
      setMessage({
        type: "error",
        text: "Paid conversions cannot be greater than trials attended.",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        month: form.month,
        market: form.market,
        trials_booked: trialsBooked,
        trials_attended: trialsAttended,
        paid_conversions: paidConversions,
        notes: form.notes.trim() || null,
      };

      const response = editingId
        ? await supabase
            .from("marketing_funnel_records")
            .update(payload)
            .eq("id", editingId)
            .select()
            .single()
        : await supabase
            .from("marketing_funnel_records")
            .insert(payload)
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      setSelectedMonth(form.month);
      setMessage({
        type: "success",
        text: editingId ? "Funnel performance record updated." : "Funnel performance record created.",
      });
      resetForm();
      await fetchRecords();
    } catch (error) {
      const text = getErrorMessage(error, "Could not save funnel performance record.");
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(record: FunnelPerformanceRecord) {
    setEditingId(record.id);
    setForm({
      month: record.month,
      market: record.market,
      trials_booked: String(record.trials_booked),
      trials_attended: String(record.trials_attended),
      paid_conversions: String(record.paid_conversions),
      notes: record.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(record: FunnelPerformanceRecord) {
    const confirmed = window.confirm(`Delete ${record.market} funnel record?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const { error } = await supabase.from("marketing_funnel_records").delete().eq("id", record.id);
      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Funnel performance record deleted." });
      await fetchRecords();
    } catch (error) {
      const text = getErrorMessage(error, "Could not delete funnel performance record.");
      setMessage({ type: "error", text });
    }
  }

  if (loading && funnelRecords.length === 0 && leadRecords.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading funnel performance…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funnel Performance</h1>
          <p className="text-muted-foreground">
            Track market-wise leads generated, trials booked, trials attended and paid conversions.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-xs text-muted-foreground">Last updated: {lastUpdated}</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              setSelectedMonth(event.target.value);
              setForm((previous) => ({ ...previous, month: event.target.value }));
            }}
            className={inputClassName("w-full sm:w-[150px]")}
          />
          <Button onClick={fetchRecords} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {message && (
        <Card
          className={
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
          }
        >
          <CardContent className="flex items-start gap-3 py-4">
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            )}
            <p className={message.type === "success" ? "text-sm text-emerald-700 dark:text-emerald-300" : "text-sm text-red-700 dark:text-red-300"}>
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      <SectionTitle icon={Zap} title="3. Funnel Performance (Market-wise)" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Leads generated"
          value={formatNumber(totals.leadsGenerated)}
          icon={Users}
          subtitle="Auto-pulled from Lead Generation page"
          trend={<TrendBadge direction="neutral" label="Automated" />}
          highlight
        />
        <MetricCard
          title="Trials booked"
          value={formatNumber(totals.trialsBooked)}
          icon={Calendar}
          subtitle={`${plainPercentage(totals.leadsGenerated ? (totals.trialsBooked / totals.leadsGenerated) * 100 : 0)} Lead → Trial`}
        />
        <MetricCard
          title="Trials attended"
          value={formatNumber(totals.trialsAttended)}
          icon={CheckCircle2}
          subtitle={`${plainPercentage(totals.trialsBooked ? (totals.trialsAttended / totals.trialsBooked) * 100 : 0)} attendance rate`}
        />
        <MetricCard
          title="Paid conversions"
          value={formatNumber(totals.paidConversions)}
          icon={TrendingUp}
          subtitle={`${plainPercentage(totals.trialsAttended ? (totals.paidConversions / totals.trialsAttended) * 100 : 0)} Trial → Paid`}
          trend={<TrendBadge direction={trendDirection(paidConversionsMoM)} label={`${percentage(paidConversionsMoM)} MoM`} />}
        />
        <MetricCard
          title="Top market"
          value={topMarket?.market || "—"}
          icon={BarChart3}
          subtitle={topMarket ? `${formatNumber(topMarket.paidConversions)} paid conversions` : "No conversions yet"}
          variant="outline"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Lead → Trial best"
          value={bestLeadToTrialMarket?.market || "—"}
          icon={Target}
          subtitle={bestLeadToTrialMarket ? plainPercentage(bestLeadToTrialMarket.leadToTrialRate) : "No leads yet"}
          trend={<TrendBadge direction="up" label="Highest rate" />}
        />
        <MetricCard
          title="Previous paid conversions"
          value={formatNumber(previousPaidConversions)}
          icon={RefreshCw}
          subtitle={getPreviousMonth(selectedMonth)}
          variant="outline"
        />
        <MetricCard
          title="Visible records"
          value={visibleRecords.length}
          icon={Search}
          subtitle={`${selectedFunnelRecords.length} records this month`}
          variant="outline"
        />
        <MetricCard
          title="Active markets"
          value={activeMarketSummary.length}
          icon={Filter}
          subtitle="Markets with funnel activity"
          variant="outline"
        />
      </div>

      <SectionTitle icon={Plus} title={editingId ? "Update Funnel Performance" : "Add Funnel Performance"} />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{editingId ? "Edit funnel performance record" : "New funnel performance record"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Leads generated are calculated automatically from your Lead Generation page. Add trials and paid conversions here.
            </p>
          </div>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <FieldLabel>Month</FieldLabel>
              <input
                type="month"
                value={form.month}
                onChange={(event) => setFormValue("month", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Market</FieldLabel>
              <Select value={form.market} onValueChange={(value) => setFormValue("market", value as Market)}>
                <SelectTrigger>
                  <SelectValue placeholder="Market" />
                </SelectTrigger>
                <SelectContent>
                  {MARKETS.map((market) => (
                    <SelectItem key={market} value={market}>
                      {market}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Trials booked</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.trials_booked}
                onChange={(event) => setFormValue("trials_booked", event.target.value)}
                placeholder="120"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Trials attended</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.trials_attended}
                onChange={(event) => setFormValue("trials_attended", event.target.value)}
                placeholder="90"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Paid conversions</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.paid_conversions}
                onChange={(event) => setFormValue("paid_conversions", event.target.value)}
                placeholder="35"
                className={inputClassName()}
              />
            </div>

            <div className="flex items-end lg:col-span-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit3 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Update" : "Save"}
              </Button>
            </div>

            <div className="lg:col-span-12">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => setFormValue("notes", event.target.value)}
                placeholder="Optional: trial no-show reasons, sales follow-up notes, conversion blockers, quality notes, etc."
                className={textareaClassName()}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <SectionTitle icon={BarChart3} title="Market-wise Funnel Analysis" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funnel Performance by Market</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={marketSummary.filter(
                (item) => item.leadsGenerated || item.trialsBooked || item.trialsAttended || item.paidConversions
              )}
              margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="market" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: unknown) => [formatNumber(toChartNumber(value)), ""]} />
              <Legend />
              <Bar dataKey="leadsGenerated" name="Leads Generated" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="trialsBooked" name="Trials Booked" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="trialsAttended" name="Trials Attended" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paidConversions" name="Paid Conversions" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Rates by Market</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={marketSummary.filter((item) => item.leadsGenerated || item.trialsAttended)}
              margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="market" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value: unknown) => [`${toChartNumber(value).toFixed(1)}%`, ""]} />
              <Legend />
              <Line type="monotone" dataKey="leadToTrialRate" name="Lead → Trial" stroke="#4f46e5" strokeWidth={2.5} />
              <Line type="monotone" dataKey="attendanceRate" name="Attendance Rate" stroke="#6366f1" strokeWidth={2.5} />
              <Line type="monotone" dataKey="trialToPaidRate" name="Trial → Paid" stroke="#10b981" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle icon={Search} title="Stored Funnel Records" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Market-wise funnel records</CardTitle>
              <p className="text-sm text-muted-foreground">View, filter, edit and delete records stored in Supabase.</p>
            </div>
            <Button onClick={fetchRecords} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[160px_160px_1fr]">
            <div>
              <FieldLabel>Month</FieldLabel>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => {
                  setSelectedMonth(event.target.value);
                  setForm((previous) => ({ ...previous, month: event.target.value }));
                }}
                className={inputClassName()}
              />
            </div>

            <div>
              <FieldLabel>Market</FieldLabel>
              <Select value={marketFilter} onValueChange={(value) => setMarketFilter(value as MarketFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Market" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All markets</SelectItem>
                  {MARKETS.map((market) => (
                    <SelectItem key={market} value={market}>
                      {market}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search market, month or notes"
                  className={inputClassName("pl-9")}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">Leads Generated</th>
                  <th className="px-4 py-3 font-semibold">Trials Booked</th>
                  <th className="px-4 py-3 font-semibold">Trials Attended</th>
                  <th className="px-4 py-3 font-semibold">Paid Conversions</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => {
                    const marketLeads = selectedLeadRecords
                      .filter((leadRecord) => leadRecord.market === record.market)
                      .reduce((sum, leadRecord) => sum + toCount(leadRecord.leads_count), 0);

                    return (
                      <tr key={record.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">{record.month}</td>
                        <td className="px-4 py-3 font-semibold">{record.market}</td>
                        <td className="px-4 py-3">{formatNumber(marketLeads)}</td>
                        <td className="px-4 py-3">{formatNumber(toCount(record.trials_booked))}</td>
                        <td className="px-4 py-3">{formatNumber(toCount(record.trials_attended))}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-600">{formatNumber(toCount(record.paid_conversions))}</td>
                        <td className="max-w-[320px] truncate px-4 py-3 text-muted-foreground">{record.notes || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="icon" onClick={() => handleEdit(record)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(record)}
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      No funnel performance records found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <SectionTitle icon={Filter} title="Market Summary" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {marketSummary.map((item) => (
          <MetricCard
            key={item.market}
            title={`${item.market} funnel`}
            value={formatNumber(item.paidConversions)}
            icon={Target}
            subtitle={`${formatNumber(item.leadsGenerated)} leads · ${formatNumber(item.trialsBooked)} trials booked`}
            trend={<TrendBadge direction={item.paidConversions > 0 ? "up" : "neutral"} label={`${plainPercentage(item.trialToPaidRate)} Trial → Paid`} />}
            variant={item.paidConversions > 0 ? "default" : "outline"}
          >
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Trials attended:</span> {formatNumber(item.trialsAttended)}
              </p>
              <p className="mt-1">
                <span className="font-medium text-foreground">Lead → Trial:</span> {plainPercentage(item.leadToTrialRate)}
              </p>
              <p className="mt-1">
                <span className="font-medium text-foreground">Attendance:</span> {plainPercentage(item.attendanceRate)}
              </p>
            </div>
          </MetricCard>
        ))}
      </div>

      <SectionTitle icon={Award} title="6. Performance Summary (Short)" />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          title="Best performing market"
          value={topMarket?.market || "—"}
          icon={Award}
          subtitle={bestMarketReason}
          trend={<TrendBadge direction="up" label="Best performer" />}
          highlight
        />

        <MetricCard
          title="Worst performing market"
          value={worstMarket?.market || "—"}
          icon={AlertCircle}
          subtitle={worstMarketReason}
          trend={<TrendBadge direction="down" label="Needs improvement" />}
          variant="warning"
        />

        <MetricCard
          title="Main improvement focus"
          value={worstMarket?.market || "—"}
          icon={Lightbulb}
          subtitle={worstMarket ? getImprovementPlan(worstMarket) : "Add market data to generate improvement focus."}
          variant="outline"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">One improvement planned for next month per market</CardTitle>
          <p className="text-sm text-muted-foreground">
            These recommendations are automatically generated from each market’s weakest funnel stage.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {marketSummary.map((item) => (
              <div key={item.market} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-semibold">{item.market}</p>
                  <TrendBadge
                    direction={item.paidConversions > 0 ? "up" : "neutral"}
                    label={`${formatNumber(item.paidConversions)} paid`}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{getImprovementPlan(item)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <SectionTitle icon={ClipboardCheck} title="7. Required Output (Non-Negotiable)" />

      {adSpendWarning && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-300">{adSpendWarning}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total ad spend"
          value={formatCurrency(totals.adSpend)}
          icon={DollarSign}
          subtitle={`${getPreviousMonth(selectedMonth)}: ${formatCurrency(previousTotalAdSpend)}`}
          trend={<TrendBadge direction={trendDirection(adSpendMoM)} label={`${percentage(adSpendMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Total paid students acquired"
          value={formatNumber(totals.paidConversions)}
          icon={Users}
          subtitle={`${getPreviousMonth(selectedMonth)}: ${formatNumber(previousPaidConversions)}`}
          trend={<TrendBadge direction={trendDirection(paidConversionsMoM)} label={`${percentage(paidConversionsMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Blended CAC"
          value={totals.paidConversions ? formatCurrency(blendedCAC) : "—"}
          icon={Target}
          subtitle="Total ad spend ÷ total paid students"
          variant="outline"
        />

        <MetricCard
          title="Month-over-month comparison"
          value={`${percentage(paidConversionsMoM)}`}
          icon={RefreshCw}
          subtitle="Paid students acquired MoM"
          trend={<TrendBadge direction={trendDirection(paidConversionsMoM)} label="Paid student trend" />}
          variant="outline"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CAC by Market + Month-over-Month Comparison</CardTitle>
          <p className="text-sm text-muted-foreground">
            Shows ad spend, paid students acquired, CAC and MoM movement for each market.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">Total Ad Spend</th>
                  <th className="px-4 py-3 font-semibold">Paid Students Acquired</th>
                  <th className="px-4 py-3 font-semibold">CAC</th>
                  <th className="px-4 py-3 font-semibold">Previous Paid Students</th>
                  <th className="px-4 py-3 font-semibold">Paid Students MoM</th>
                  <th className="px-4 py-3 font-semibold">Previous Ad Spend</th>
                  <th className="px-4 py-3 font-semibold">Ad Spend MoM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {marketSummary.map((item) => (
                  <tr key={item.market} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 font-semibold">{item.market}</td>
                    <td className="px-4 py-3">{formatCurrency(item.adSpend)}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">{formatNumber(item.paidConversions)}</td>
                    <td className="px-4 py-3">{item.paidConversions ? formatCurrency(item.cac) : "—"}</td>
                    <td className="px-4 py-3">{formatNumber(item.previousPaidConversions)}</td>
                    <td className="px-4 py-3">
                      <TrendBadge
                        direction={trendDirection(item.paidConversionsMoM)}
                        label={percentage(item.paidConversionsMoM)}
                      />
                    </td>
                    <td className="px-4 py-3">{formatCurrency(item.previousAdSpend)}</td>
                    <td className="px-4 py-3">
                      <TrendBadge
                        direction={trendDirection(item.adSpendMoM)}
                        label={percentage(item.adSpendMoM)}
                      />
                    </td>
                  </tr>
                ))}

                <tr className="bg-muted/40 font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3">{formatCurrency(totals.adSpend)}</td>
                  <td className="px-4 py-3 text-indigo-600">{formatNumber(totals.paidConversions)}</td>
                  <td className="px-4 py-3">{totals.paidConversions ? formatCurrency(blendedCAC) : "—"}</td>
                  <td className="px-4 py-3">{formatNumber(previousPaidConversions)}</td>
                  <td className="px-4 py-3">
                    <TrendBadge direction={trendDirection(paidConversionsMoM)} label={percentage(paidConversionsMoM)} />
                  </td>
                  <td className="px-4 py-3">{formatCurrency(previousTotalAdSpend)}</td>
                  <td className="px-4 py-3">
                    <TrendBadge direction={trendDirection(adSpendMoM)} label={percentage(adSpendMoM)} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-200 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/20">
        <CardContent className="grid gap-4 p-5 md:grid-cols-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold">Report check</p>
              <p className="text-xs text-muted-foreground">Total ad spend is visible.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold">Paid students</p>
              <p className="text-xs text-muted-foreground">Total paid students acquired is visible.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold">CAC by market</p>
              <p className="text-xs text-muted-foreground">Every market has a CAC row.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold">MoM comparison</p>
              <p className="text-xs text-muted-foreground">Paid students and ad spend are compared month-over-month.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}