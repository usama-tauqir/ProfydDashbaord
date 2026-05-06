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
  BarChart3,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  Filter,
  Loader2,
  Megaphone,
  Minus,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Market = "AU" | "UK" | "US" | "CA" | "NZ" | "EU" | "PK";
type Currency = "AUD" | "GBP" | "USD" | "CAD" | "NZD" | "EUR" | "PKR";
type MarketFilter = "all" | Market;

type MarketingSpendRecord = {
  id: string;
  month: string;
  market: Market;
  platform: string;
  campaign_name: string;
  spend_amount: number | string;
  currency: Currency;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type SpendForm = {
  month: string;
  market: Market;
  platform: string;
  campaign_name: string;
  spend_amount: string;
  currency: Currency;
  notes: string;
};

const MARKETS: Market[] = ["AU", "UK", "US", "CA", "NZ", "EU", "PK"];

const MARKET_CURRENCY: Record<Market, Currency> = {
  AU: "AUD",
  UK: "GBP",
  US: "USD",
  CA: "CAD",
  NZ: "NZD",
  EU: "EUR",
  PK: "PKR",
};

const CURRENCIES: Currency[] = ["AUD", "GBP", "USD", "CAD", "NZD", "EUR", "PKR"];

const PLATFORMS = [
  "Meta",
  "Google",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Influencer",
  "Referral",
  "Other",
];

const USD_RATES: Record<Currency, number> = {
  AUD: 0.66,
  GBP: 1.25,
  USD: 1,
  CAD: 0.73,
  NZD: 0.61,
  EUR: 1.08,
  PKR: 0.0036,
};

const CHART_COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return date.toISOString().slice(0, 7);
}

function emptyForm(month = getCurrentMonth()): SpendForm {
  return {
    month,
    market: "AU",
    platform: "Meta",
    campaign_name: "",
    spend_amount: "",
    currency: "AUD",
    notes: "",
  };
}

function toAmount(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toChartNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (Array.isArray(value)) return Number(value[0]) || 0;
  return 0;
}

function normalizeToUsd(amount: number | string, currency: Currency) {
  return toAmount(amount) * (USD_RATES[currency] || 1);
}

function money(value: number, currency: Currency | "USD" = "USD", compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function percentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
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

export default function MarketingSpendPage() {
  const [records, setRecords] = useState<MarketingSpendRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<SpendForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const { data, error } = await supabase
        .from("marketing_spend_records")
        .select("*")
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRecords((data || []) as MarketingSpendRecord[]);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not load marketing spend records.";
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const selectedMonthRecords = useMemo(
    () => records.filter((record) => record.month === selectedMonth),
    [records, selectedMonth]
  );

  const previousMonthRecords = useMemo(
    () => records.filter((record) => record.month === getPreviousMonth(selectedMonth)),
    [records, selectedMonth]
  );

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedMonthRecords
      .filter((record) => marketFilter === "all" || record.market === marketFilter)
      .filter((record) => platformFilter === "all" || record.platform === platformFilter)
      .filter((record) => {
        if (!query) return true;
        return [
          record.month,
          record.market,
          record.platform,
          record.campaign_name,
          record.currency,
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => normalizeToUsd(b.spend_amount, b.currency) - normalizeToUsd(a.spend_amount, a.currency));
  }, [selectedMonthRecords, marketFilter, platformFilter, searchQuery]);

  const totalSpendUsd = selectedMonthRecords.reduce(
    (sum, record) => sum + normalizeToUsd(record.spend_amount, record.currency),
    0
  );

  const previousSpendUsd = previousMonthRecords.reduce(
    (sum, record) => sum + normalizeToUsd(record.spend_amount, record.currency),
    0
  );

  const monthOverMonth = previousSpendUsd ? ((totalSpendUsd - previousSpendUsd) / previousSpendUsd) * 100 : 0;

  const marketSummary = useMemo(() => {
    return MARKETS.map((market) => {
      const marketRecords = selectedMonthRecords.filter((record) => record.market === market);
      const nativeTotal = marketRecords.reduce((sum, record) => sum + toAmount(record.spend_amount), 0);
      const totalUsd = marketRecords.reduce(
        (sum, record) => sum + normalizeToUsd(record.spend_amount, record.currency),
        0
      );
      const platforms = Array.from(new Set(marketRecords.map((record) => record.platform)));
      const topCampaign = [...marketRecords].sort((a, b) => toAmount(b.spend_amount) - toAmount(a.spend_amount))[0];

      return {
        market,
        currency: marketRecords[0]?.currency || MARKET_CURRENCY[market],
        campaigns: marketRecords.length,
        nativeTotal,
        totalUsd,
        platforms,
        topCampaign,
      };
    });
  }, [selectedMonthRecords]);

  const platformSummary = useMemo(() => {
    const map = new Map<string, number>();

    selectedMonthRecords.forEach((record) => {
      map.set(record.platform, (map.get(record.platform) || 0) + normalizeToUsd(record.spend_amount, record.currency));
    });

    return Array.from(map.entries())
      .map(([platform, spend]) => ({ platform, spend }))
      .sort((a, b) => b.spend - a.spend);
  }, [selectedMonthRecords]);

  const uniquePlatforms = useMemo(() => {
    return Array.from(new Set([...PLATFORMS, ...records.map((record) => record.platform)])).filter(Boolean);
  }, [records]);

  const activeMarkets = marketSummary.filter((item) => item.totalUsd > 0);
  const topMarket = [...activeMarkets].sort((a, b) => b.totalUsd - a.totalUsd)[0];
  const topPlatform = platformSummary[0];
  const averageCampaignSpend = selectedMonthRecords.length ? totalSpendUsd / selectedMonthRecords.length : 0;

  function setFormValue<K extends keyof SpendForm>(key: K, value: SpendForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function changeMarket(market: Market) {
    setForm((previous) => ({ ...previous, market, currency: MARKET_CURRENCY[market] }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(selectedMonth));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const spendAmount = Number(form.spend_amount);

    if (!form.month || !form.market || !form.platform || !form.campaign_name || !form.currency || !Number.isFinite(spendAmount) || spendAmount <= 0) {
      setMessage({
        type: "error",
        text: "Please enter month, market, platform, campaign name, currency and a valid spend amount.",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        month: form.month,
        market: form.market,
        platform: form.platform.trim(),
        campaign_name: form.campaign_name.trim(),
        spend_amount: spendAmount,
        currency: form.currency,
        notes: form.notes.trim() || null,
      };

      const response = editingId
        ? await supabase.from("marketing_spend_records").update(payload).eq("id", editingId)
        : await supabase.from("marketing_spend_records").insert(payload);

      if (response.error) throw response.error;

      setSelectedMonth(form.month);
      setMessage({
        type: "success",
        text: editingId ? "Marketing spend record updated." : "Marketing spend record created.",
      });
      resetForm();
      await fetchRecords();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not save this marketing spend record.";
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(record: MarketingSpendRecord) {
    setEditingId(record.id);
    setForm({
      month: record.month,
      market: record.market,
      platform: record.platform,
      campaign_name: record.campaign_name,
      spend_amount: String(record.spend_amount),
      currency: record.currency,
      notes: record.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(record: MarketingSpendRecord) {
    const confirmed = window.confirm(`Delete ${record.campaign_name} from ${record.market}?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const { error } = await supabase.from("marketing_spend_records").delete().eq("id", record.id);
      if (error) throw error;

      setMessage({ type: "success", text: "Marketing spend record deleted." });
      await fetchRecords();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not delete this marketing spend record.";
      setMessage({ type: "error", text });
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading marketing spend…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Spend</h1>
          <p className="text-muted-foreground">
            Store, update and monitor market-wise campaign spend by platform, campaign and currency.
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

      <SectionTitle icon={WalletCards} title="Spend Summary" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Total ad spend"
          value={money(totalSpendUsd, "USD", true)}
          icon={WalletCards}
          subtitle="USD equivalent for comparison"
          trend={<TrendBadge direction={monthOverMonth >= 0 ? "up" : "down"} label={`${percentage(monthOverMonth)} MoM`} />}
          highlight
        />
        <MetricCard
          title="Campaign records"
          value={selectedMonthRecords.length}
          icon={Megaphone}
          subtitle={`${visibleRecords.length} visible after filters`}
          trend={<TrendBadge direction="neutral" label="Live records" />}
        />
        <MetricCard
          title="Active markets"
          value={activeMarkets.length}
          icon={BarChart3}
          subtitle="Markets with spend this month"
          trend={<TrendBadge direction="neutral" label={selectedMonth} />}
        />
        <MetricCard
          title="Top market"
          value={topMarket?.market || "—"}
          icon={CircleDollarSign}
          subtitle={topMarket ? money(topMarket.totalUsd, "USD") : "No spend yet"}
          trend={<TrendBadge direction="up" label="Highest spend" />}
        />
        <MetricCard
          title="Avg campaign spend"
          value={money(averageCampaignSpend, "USD")}
          icon={Calendar}
          subtitle={topPlatform ? `Top platform: ${topPlatform.platform}` : "No platform yet"}
          variant="outline"
        />
      </div>

      <SectionTitle icon={Plus} title={editingId ? "Update Marketing Spend" : "Add Marketing Spend"} />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{editingId ? "Edit campaign spend record" : "New campaign spend record"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add one row per campaign. Market totals are calculated automatically from saved records.
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
              <Select value={form.market} onValueChange={(value) => changeMarket(value as Market)}>
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
              <FieldLabel>Platform</FieldLabel>
              <Select value={form.platform} onValueChange={(value) => setFormValue("platform", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  {uniquePlatforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3">
              <FieldLabel>Campaign name</FieldLabel>
              <input
                value={form.campaign_name}
                onChange={(event) => setFormValue("campaign_name", event.target.value)}
                placeholder="Example: Meta Trial Leads"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Spend amount</FieldLabel>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.spend_amount}
                onChange={(event) => setFormValue("spend_amount", event.target.value)}
                placeholder="8500"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-1">
              <FieldLabel>Currency</FieldLabel>
              <Select value={form.currency} onValueChange={(value) => setFormValue("currency", value as Currency)}>
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-10">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => setFormValue("notes", event.target.value)}
                placeholder="Optional: promo details, invoice reference, targeting notes, owner, etc."
                className={textareaClassName()}
              />
            </div>

            <div className="flex items-end lg:col-span-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit3 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SectionTitle icon={BarChart3} title="Market & Platform Analysis" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marketing Spend by Market</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketSummary.filter((item) => item.totalUsd > 0)} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="market" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => money(Number(value), "USD", true)} />
                <Tooltip formatter={(value: unknown) => [money(toChartNumber(value), "USD"), "Spend"]} />
                <Bar dataKey="totalUsd" name="Spend" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Spend Mix</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformSummary}
                  dataKey="spend"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={52}
                  label={({ name, percent }) =>
  `${String(name || "")}: ${((percent || 0) * 100).toFixed(0)}%`
}
                >
                  {platformSummary.map((_, index) => (
                    <Cell key={`platform-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => [money(toChartNumber(value), "USD"), "Spend"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Search} title="Stored Spend Records" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Campaign-wise spend records</CardTitle>
              <p className="text-sm text-muted-foreground">View, filter, edit and delete records stored in Supabase.</p>
            </div>
            <Button onClick={fetchRecords} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[160px_160px_180px_1fr]">
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
              <FieldLabel>Platform</FieldLabel>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  {uniquePlatforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
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
                  placeholder="Search campaign, platform, notes or currency"
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
                  <th className="px-4 py-3 font-semibold">Platform</th>
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Spend</th>
                  <th className="px-4 py-3 font-semibold">Currency</th>
                  <th className="px-4 py-3 font-semibold">USD Eq.</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3">{record.month}</td>
                      <td className="px-4 py-3 font-semibold">{record.market}</td>
                      <td className="px-4 py-3">{record.platform}</td>
                      <td className="px-4 py-3 font-medium">{record.campaign_name}</td>
                      <td className="px-4 py-3">{money(toAmount(record.spend_amount), record.currency)}</td>
                      <td className="px-4 py-3">{record.currency}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">
                        {money(normalizeToUsd(record.spend_amount, record.currency), "USD")}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-3 text-muted-foreground">{record.notes || "—"}</td>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      No marketing spend records found for this filter.
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
            title={`${item.market} total spend`}
            value={money(item.nativeTotal, item.currency)}
            icon={CircleDollarSign}
            subtitle={`${money(item.totalUsd, "USD")} USD eq. · ${item.currency}`}
            trend={<TrendBadge direction={item.totalUsd > 0 ? "up" : "neutral"} label={`${item.campaigns} campaigns`} />}
            variant={item.totalUsd > 0 ? "default" : "outline"}
          >
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <p className="truncate">
                <span className="font-medium text-foreground">Platforms:</span> {item.platforms.length ? item.platforms.join(", ") : "—"}
              </p>
              <p className="mt-1 truncate">
                <span className="font-medium text-foreground">Top campaign:</span> {item.topCampaign?.campaign_name || "—"}
              </p>
            </div>
          </MetricCard>
        ))}
      </div>
    </div>
  );
}
