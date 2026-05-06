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
  BadgePercent,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  ExternalLink,
  Filter,
  Link2,
  Loader2,
  Megaphone,
  Minus,
  MousePointerClick,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
  Users,
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
type MarketFilter = "all" | Market;
type Currency = "AUD" | "GBP" | "USD" | "CAD" | "NZD" | "EUR" | "PKR";
type Platform = "Meta" | "Google" | "TikTok" | "YouTube" | "LinkedIn" | "Organic" | "Referral" | "Other";
type PlatformFilter = "all" | Platform;
type DiscountReason = "Promo" | "Retention" | "Competitive" | "Sales override";
type ReasonFilter = "all" | DiscountReason;
type ContentType = "Post" | "Story" | "Reel" | "Ad" | "Landing Page" | "Email" | "WhatsApp" | "Other";

type OfferDiscountRecord = {
  id: string;
  month: string;
  market: Market;
  platform: Platform;
  campaign_name: string | null;
  offer_name: string;
  content_type: ContentType;
  post_url: string | null;
  ad_url: string | null;
  target_audience: string | null;
  original_price: number | string;
  discounted_price: number | string;
  average_discount_percent: number | string;
  discounted_deals: number | string;
  students_acquired: number | string;
  leads_generated: number | string;
  trials_booked: number | string;
  ad_spend_amount: number | string;
  currency: Currency;
  impressions: number | string;
  clicks: number | string;
  reactions: number | string;
  comments: number | string;
  shares: number | string;
  saves: number | string;
  reason: DiscountReason;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type OfferForm = {
  month: string;
  market: Market;
  platform: Platform;
  campaign_name: string;
  offer_name: string;
  content_type: ContentType;
  post_url: string;
  ad_url: string;
  target_audience: string;
  original_price: string;
  discounted_price: string;
  average_discount_percent: string;
  discounted_deals: string;
  students_acquired: string;
  leads_generated: string;
  trials_booked: string;
  ad_spend_amount: string;
  currency: Currency;
  impressions: string;
  clicks: string;
  reactions: string;
  comments: string;
  shares: string;
  saves: string;
  reason: DiscountReason;
  notes: string;
};

const MARKETS: Market[] = ["AU", "UK", "US", "CA", "NZ", "EU", "PK"];
const PLATFORMS: Platform[] = ["Meta", "Google", "TikTok", "YouTube", "LinkedIn", "Organic", "Referral", "Other"];
const CURRENCIES: Currency[] = ["AUD", "GBP", "USD", "CAD", "NZD", "EUR", "PKR"];
const CONTENT_TYPES: ContentType[] = ["Post", "Story", "Reel", "Ad", "Landing Page", "Email", "WhatsApp", "Other"];
const DISCOUNT_REASONS: DiscountReason[] = ["Promo", "Retention", "Competitive", "Sales override"];

const MARKET_CURRENCY: Record<Market, Currency> = {
  AU: "AUD",
  UK: "GBP",
  US: "USD",
  CA: "CAD",
  NZ: "NZD",
  EU: "EUR",
  PK: "PKR",
};

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

function emptyForm(month = getCurrentMonth()): OfferForm {
  return {
    month,
    market: "AU",
    platform: "Meta",
    campaign_name: "",
    offer_name: "",
    content_type: "Post",
    post_url: "",
    ad_url: "",
    target_audience: "",
    original_price: "",
    discounted_price: "",
    average_discount_percent: "",
    discounted_deals: "",
    students_acquired: "",
    leads_generated: "",
    trials_booked: "",
    ad_spend_amount: "",
    currency: "AUD",
    impressions: "",
    clicks: "",
    reactions: "",
    comments: "",
    shares: "",
    saves: "",
    reason: "Promo",
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

function plainPercentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function discountPerStudent(record: OfferDiscountRecord) {
  const originalPrice = toAmount(record.original_price);
  const discountedPrice = toAmount(record.discounted_price);
  const discountPercent = toAmount(record.average_discount_percent);

  if (originalPrice > 0 && discountedPrice > 0) {
    return Math.max(originalPrice - discountedPrice, 0);
  }

  if (originalPrice > 0 && discountPercent > 0) {
    return originalPrice * (discountPercent / 100);
  }

  return 0;
}

function totalDiscountGiven(record: OfferDiscountRecord) {
  const students = toAmount(record.students_acquired) || toAmount(record.discounted_deals);
  return discountPerStudent(record) * students;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String((error as { message?: unknown }).message || "");
    if (message) return message;
  }

  if (typeof error === "string" && error) return error;
  return fallback;
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

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function externalUrl(value: string | null) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

export default function MarketingOffersDiscountsPage() {
  const [records, setRecords] = useState<OfferDiscountRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<OfferForm>(emptyForm());
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
        .from("marketing_offer_discount_records")
        .select("*")
        .order("month", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      setRecords((data || []) as OfferDiscountRecord[]);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not load offer and discount records.") });
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
      .filter((record) => reasonFilter === "all" || record.reason === reasonFilter)
      .filter((record) => {
        if (!query) return true;
        return [
          record.month,
          record.market,
          record.platform,
          record.campaign_name || "",
          record.offer_name,
          record.content_type,
          record.post_url || "",
          record.ad_url || "",
          record.target_audience || "",
          record.reason,
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => toAmount(b.students_acquired) - toAmount(a.students_acquired));
  }, [selectedMonthRecords, marketFilter, platformFilter, reasonFilter, searchQuery]);

  const totalOffersCreated = selectedMonthRecords.length;
  const totalDiscountedDeals = selectedMonthRecords.reduce((sum, record) => sum + toAmount(record.discounted_deals), 0);
  const totalStudentsAcquired = selectedMonthRecords.reduce((sum, record) => sum + toAmount(record.students_acquired), 0);
  const totalLeads = selectedMonthRecords.reduce((sum, record) => sum + toAmount(record.leads_generated), 0);
  const totalTrials = selectedMonthRecords.reduce((sum, record) => sum + toAmount(record.trials_booked), 0);
  const totalSpendUsd = selectedMonthRecords.reduce((sum, record) => sum + normalizeToUsd(record.ad_spend_amount, record.currency), 0);
  const totalDiscountUsd = selectedMonthRecords.reduce((sum, record) => sum + normalizeToUsd(totalDiscountGiven(record), record.currency), 0);
  const totalClicks = selectedMonthRecords.reduce((sum, record) => sum + toAmount(record.clicks), 0);
  const totalImpressions = selectedMonthRecords.reduce((sum, record) => sum + toAmount(record.impressions), 0);
  const totalEngagements = selectedMonthRecords.reduce(
    (sum, record) => sum + toAmount(record.reactions) + toAmount(record.comments) + toAmount(record.shares) + toAmount(record.saves),
    0
  );

  const previousStudents = previousMonthRecords.reduce((sum, record) => sum + toAmount(record.students_acquired), 0);
  const previousDiscountUsd = previousMonthRecords.reduce((sum, record) => sum + normalizeToUsd(totalDiscountGiven(record), record.currency), 0);
  const studentsMoM = previousStudents ? ((totalStudentsAcquired - previousStudents) / previousStudents) * 100 : 0;
  const discountMoM = previousDiscountUsd ? ((totalDiscountUsd - previousDiscountUsd) / previousDiscountUsd) * 100 : 0;

  const blendedCAC = totalStudentsAcquired ? totalSpendUsd / totalStudentsAcquired : 0;
  const clickToStudentRate = totalClicks ? (totalStudentsAcquired / totalClicks) * 100 : 0;
  const ctr = totalImpressions ? (totalClicks / totalImpressions) * 100 : 0;
  const engagementRate = totalImpressions ? (totalEngagements / totalImpressions) * 100 : 0;

  const marketSummary = useMemo(() => {
    return MARKETS.map((market) => {
      const marketRecords = selectedMonthRecords.filter((record) => record.market === market);
      const offers = marketRecords.length;
      const deals = marketRecords.reduce((sum, record) => sum + toAmount(record.discounted_deals), 0);
      const students = marketRecords.reduce((sum, record) => sum + toAmount(record.students_acquired), 0);
      const spendUsd = marketRecords.reduce((sum, record) => sum + normalizeToUsd(record.ad_spend_amount, record.currency), 0);
      const discountUsd = marketRecords.reduce((sum, record) => sum + normalizeToUsd(totalDiscountGiven(record), record.currency), 0);
      const platforms = Array.from(new Set(marketRecords.map((record) => record.platform)));
      const topOffer = [...marketRecords].sort((a, b) => toAmount(b.students_acquired) - toAmount(a.students_acquired))[0];

      return {
        market,
        offers,
        deals,
        students,
        spendUsd,
        discountUsd,
        platforms,
        topOffer,
        cac: students ? spendUsd / students : 0,
      };
    });
  }, [selectedMonthRecords]);

  const reasonSummary = useMemo(() => {
    return DISCOUNT_REASONS.map((reason) => {
      const reasonRecords = selectedMonthRecords.filter((record) => record.reason === reason);
      return {
        reason,
        offers: reasonRecords.length,
        deals: reasonRecords.reduce((sum, record) => sum + toAmount(record.discounted_deals), 0),
        students: reasonRecords.reduce((sum, record) => sum + toAmount(record.students_acquired), 0),
        discountUsd: reasonRecords.reduce((sum, record) => sum + normalizeToUsd(totalDiscountGiven(record), record.currency), 0),
      };
    }).sort((a, b) => b.students - a.students);
  }, [selectedMonthRecords]);

  const platformSummary = useMemo(() => {
    return PLATFORMS.map((platform) => {
      const platformRecords = selectedMonthRecords.filter((record) => record.platform === platform);
      return {
        platform,
        offers: platformRecords.length,
        spendUsd: platformRecords.reduce((sum, record) => sum + normalizeToUsd(record.ad_spend_amount, record.currency), 0),
        students: platformRecords.reduce((sum, record) => sum + toAmount(record.students_acquired), 0),
        leads: platformRecords.reduce((sum, record) => sum + toAmount(record.leads_generated), 0),
      };
    }).filter((item) => item.offers > 0 || item.students > 0 || item.spendUsd > 0)
      .sort((a, b) => b.students - a.students);
  }, [selectedMonthRecords]);

  const topOffer = [...selectedMonthRecords].sort((a, b) => toAmount(b.students_acquired) - toAmount(a.students_acquired))[0];
  const topReason = reasonSummary.find((item) => item.students > 0 || item.deals > 0);
  const topMarket = [...marketSummary].sort((a, b) => b.students - a.students)[0];
  const activeMarkets = marketSummary.filter((item) => item.offers > 0 || item.students > 0);

  function setFormValue<K extends keyof OfferForm>(key: K, value: OfferForm[K]) {
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

    const discountedDeals = Number(form.discounted_deals || 0);
    const studentsAcquired = Number(form.students_acquired || 0);
    const leadsGenerated = Number(form.leads_generated || 0);
    const trialsBooked = Number(form.trials_booked || 0);
    const originalPrice = Number(form.original_price || 0);
    const discountedPrice = Number(form.discounted_price || 0);
    const averageDiscountPercent = Number(form.average_discount_percent || 0);
    const adSpendAmount = Number(form.ad_spend_amount || 0);
    const impressions = Number(form.impressions || 0);
    const clicks = Number(form.clicks || 0);
    const reactions = Number(form.reactions || 0);
    const comments = Number(form.comments || 0);
    const shares = Number(form.shares || 0);
    const saves = Number(form.saves || 0);

    if (!form.month || !form.market || !form.platform || !form.offer_name.trim() || !form.reason || !form.currency) {
      setMessage({ type: "error", text: "Please enter month, market, platform, offer name, reason and currency." });
      return;
    }

    if (!isValidUrl(form.post_url) || !isValidUrl(form.ad_url)) {
      setMessage({ type: "error", text: "Please enter valid URLs for post URL and ad URL, or leave them empty." });
      return;
    }

    if (discountedPrice > originalPrice && originalPrice > 0) {
      setMessage({ type: "error", text: "Discounted price cannot be greater than original price." });
      return;
    }

    if (clicks > impressions && impressions > 0) {
      setMessage({ type: "error", text: "Clicks cannot be greater than impressions." });
      return;
    }

    if (studentsAcquired > leadsGenerated && leadsGenerated > 0) {
      setMessage({ type: "error", text: "Students acquired cannot be greater than leads generated." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        month: form.month,
        market: form.market,
        platform: form.platform,
        campaign_name: form.campaign_name.trim() || null,
        offer_name: form.offer_name.trim(),
        content_type: form.content_type,
        post_url: form.post_url.trim() || null,
        ad_url: form.ad_url.trim() || null,
        target_audience: form.target_audience.trim() || null,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        average_discount_percent: averageDiscountPercent,
        discounted_deals: discountedDeals,
        students_acquired: studentsAcquired,
        leads_generated: leadsGenerated,
        trials_booked: trialsBooked,
        ad_spend_amount: adSpendAmount,
        currency: form.currency,
        impressions,
        clicks,
        reactions,
        comments,
        shares,
        saves,
        reason: form.reason,
        notes: form.notes.trim() || null,
      };

      const response = editingId
        ? await supabase
            .from("marketing_offer_discount_records")
            .update(payload)
            .eq("id", editingId)
            .select()
            .single()
        : await supabase
            .from("marketing_offer_discount_records")
            .insert(payload)
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      setSelectedMonth(form.month);
      setMessage({ type: "success", text: editingId ? "Offer and discount record updated." : "Offer and discount record created." });
      resetForm();
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save offer and discount record.") });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(record: OfferDiscountRecord) {
    setEditingId(record.id);
    setForm({
      month: record.month,
      market: record.market,
      platform: record.platform,
      campaign_name: record.campaign_name || "",
      offer_name: record.offer_name,
      content_type: record.content_type,
      post_url: record.post_url || "",
      ad_url: record.ad_url || "",
      target_audience: record.target_audience || "",
      original_price: String(record.original_price || ""),
      discounted_price: String(record.discounted_price || ""),
      average_discount_percent: String(record.average_discount_percent || ""),
      discounted_deals: String(record.discounted_deals || ""),
      students_acquired: String(record.students_acquired || ""),
      leads_generated: String(record.leads_generated || ""),
      trials_booked: String(record.trials_booked || ""),
      ad_spend_amount: String(record.ad_spend_amount || ""),
      currency: record.currency,
      impressions: String(record.impressions || ""),
      clicks: String(record.clicks || ""),
      reactions: String(record.reactions || ""),
      comments: String(record.comments || ""),
      shares: String(record.shares || ""),
      saves: String(record.saves || ""),
      reason: record.reason,
      notes: record.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(record: OfferDiscountRecord) {
    const confirmed = window.confirm(`Delete offer record: ${record.offer_name}?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const { error } = await supabase.from("marketing_offer_discount_records").delete().eq("id", record.id);
      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Offer and discount record deleted." });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not delete offer and discount record.") });
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading offers and discounts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offers & Discounts</h1>
          <p className="text-muted-foreground">
            Track every offer, post, ad URL, discount value, spend, engagement and students acquired.
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

      <SectionTitle icon={BadgePercent} title="Offer & Discount Summary" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Offers created"
          value={formatNumber(totalOffersCreated)}
          icon={Tag}
          subtitle="Total offer/post/ad records"
          trend={<TrendBadge direction="neutral" label={selectedMonth} />}
          highlight
        />
        <MetricCard
          title="Total discount given"
          value={money(totalDiscountUsd, "USD", true)}
          icon={BadgePercent}
          subtitle="Estimated discount value"
          trend={<TrendBadge direction={discountMoM >= 0 ? "up" : "down"} label={`${percentage(discountMoM)} MoM`} />}
        />
        <MetricCard
          title="Students acquired"
          value={formatNumber(totalStudentsAcquired)}
          icon={Users}
          subtitle={`${formatNumber(totalDiscountedDeals)} discounted deals`}
          trend={<TrendBadge direction={studentsMoM >= 0 ? "up" : "down"} label={`${percentage(studentsMoM)} MoM`} />}
        />
        <MetricCard
          title="Ad spend"
          value={money(totalSpendUsd, "USD", true)}
          icon={WalletCards}
          subtitle={`${money(blendedCAC, "USD")} CAC from offers`}
          variant="outline"
        />
        <MetricCard
          title="Top offer"
          value={topOffer?.offer_name || "—"}
          icon={TrendingUp}
          subtitle={topOffer ? `${formatNumber(toAmount(topOffer.students_acquired))} students acquired` : "No offer yet"}
          variant="outline"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Leads from offers"
          value={formatNumber(totalLeads)}
          icon={MousePointerClick}
          subtitle={`${plainPercentage(totalLeads ? (totalStudentsAcquired / totalLeads) * 100 : 0)} lead → student`}
        />
        <MetricCard
          title="Trials booked"
          value={formatNumber(totalTrials)}
          icon={ShoppingBag}
          subtitle="From offer/ad records"
        />
        <MetricCard
          title="CTR"
          value={plainPercentage(ctr)}
          icon={Link2}
          subtitle={`${formatNumber(totalClicks)} clicks from ${formatNumber(totalImpressions)} impressions`}
          variant="outline"
        />
        <MetricCard
          title="Engagement rate"
          value={plainPercentage(engagementRate)}
          icon={Share2}
          subtitle={`${formatNumber(totalEngagements)} reactions/comments/shares/saves`}
          variant="outline"
        />
      </div>

      <SectionTitle icon={Plus} title={editingId ? "Update Offer Record" : "Add Offer Record"} />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{editingId ? "Edit offer/post/ad record" : "New offer/post/ad record"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Store the exact offer, post URL, ad URL, spend, discount, engagement and student acquisition result.
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
              <input type="month" value={form.month} onChange={(event) => setFormValue("month", event.target.value)} className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Market</FieldLabel>
              <Select value={form.market} onValueChange={(value) => changeMarket(value as Market)}>
                <SelectTrigger><SelectValue placeholder="Market" /></SelectTrigger>
                <SelectContent>{MARKETS.map((market) => <SelectItem key={market} value={market}>{market}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Platform</FieldLabel>
              <Select value={form.platform} onValueChange={(value) => setFormValue("platform", value as Platform)}>
                <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((platform) => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Content type</FieldLabel>
              <Select value={form.content_type} onValueChange={(value) => setFormValue("content_type", value as ContentType)}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>{CONTENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Reason</FieldLabel>
              <Select value={form.reason} onValueChange={(value) => setFormValue("reason", value as DiscountReason)}>
                <SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger>
                <SelectContent>{DISCOUNT_REASONS.map((reason) => <SelectItem key={reason} value={reason}>{reason}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Currency</FieldLabel>
              <Select value={form.currency} onValueChange={(value) => setFormValue("currency", value as Currency)}>
                <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3">
              <FieldLabel>Offer used</FieldLabel>
              <input value={form.offer_name} onChange={(event) => setFormValue("offer_name", event.target.value)} placeholder="Example: Ramadan 20% off" className={inputClassName()} />
            </div>

            <div className="lg:col-span-3">
              <FieldLabel>Campaign name</FieldLabel>
              <input value={form.campaign_name} onChange={(event) => setFormValue("campaign_name", event.target.value)} placeholder="Example: Meta Parents Retargeting" className={inputClassName()} />
            </div>

            <div className="lg:col-span-3">
              <FieldLabel>Post URL</FieldLabel>
              <input value={form.post_url} onChange={(event) => setFormValue("post_url", event.target.value)} placeholder="https://..." className={inputClassName()} />
            </div>

            <div className="lg:col-span-3">
              <FieldLabel>Ad URL</FieldLabel>
              <input value={form.ad_url} onChange={(event) => setFormValue("ad_url", event.target.value)} placeholder="https://..." className={inputClassName()} />
            </div>

            <div className="lg:col-span-4">
              <FieldLabel>Target audience / client segment</FieldLabel>
              <input value={form.target_audience} onChange={(event) => setFormValue("target_audience", event.target.value)} placeholder="Example: Parents of Grade 8–10 students" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Original price</FieldLabel>
              <input type="number" min="0" step="0.01" value={form.original_price} onChange={(event) => setFormValue("original_price", event.target.value)} placeholder="500" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Discounted price</FieldLabel>
              <input type="number" min="0" step="0.01" value={form.discounted_price} onChange={(event) => setFormValue("discounted_price", event.target.value)} placeholder="400" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Avg discount %</FieldLabel>
              <input type="number" min="0" max="100" step="0.1" value={form.average_discount_percent} onChange={(event) => setFormValue("average_discount_percent", event.target.value)} placeholder="20" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Discounted deals</FieldLabel>
              <input type="number" min="0" step="1" value={form.discounted_deals} onChange={(event) => setFormValue("discounted_deals", event.target.value)} placeholder="15" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Students / clients acquired</FieldLabel>
              <input type="number" min="0" step="1" value={form.students_acquired} onChange={(event) => setFormValue("students_acquired", event.target.value)} placeholder="12" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Ad spend</FieldLabel>
              <input type="number" min="0" step="0.01" value={form.ad_spend_amount} onChange={(event) => setFormValue("ad_spend_amount", event.target.value)} placeholder="250" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Leads generated</FieldLabel>
              <input type="number" min="0" step="1" value={form.leads_generated} onChange={(event) => setFormValue("leads_generated", event.target.value)} placeholder="80" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Trials booked</FieldLabel>
              <input type="number" min="0" step="1" value={form.trials_booked} onChange={(event) => setFormValue("trials_booked", event.target.value)} placeholder="30" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Impressions</FieldLabel>
              <input type="number" min="0" step="1" value={form.impressions} onChange={(event) => setFormValue("impressions", event.target.value)} placeholder="12000" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Clicks</FieldLabel>
              <input type="number" min="0" step="1" value={form.clicks} onChange={(event) => setFormValue("clicks", event.target.value)} placeholder="450" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Reactions</FieldLabel>
              <input type="number" min="0" step="1" value={form.reactions} onChange={(event) => setFormValue("reactions", event.target.value)} placeholder="150" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Comments</FieldLabel>
              <input type="number" min="0" step="1" value={form.comments} onChange={(event) => setFormValue("comments", event.target.value)} placeholder="25" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Shares</FieldLabel>
              <input type="number" min="0" step="1" value={form.shares} onChange={(event) => setFormValue("shares", event.target.value)} placeholder="18" className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Saves</FieldLabel>
              <input type="number" min="0" step="1" value={form.saves} onChange={(event) => setFormValue("saves", event.target.value)} placeholder="30" className={inputClassName()} />
            </div>

            <div className="lg:col-span-10">
              <FieldLabel>Notes</FieldLabel>
              <textarea value={form.notes} onChange={(event) => setFormValue("notes", event.target.value)} placeholder="Optional: why offer was used, client engagement insight, sales feedback, creative notes, etc." className={textareaClassName()} />
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

      <SectionTitle icon={BarChart3} title="Offer Performance Analysis" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Students Acquired by Market</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketSummary.filter((item) => item.offers > 0)} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="market" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(toChartNumber(value)), "Students"]} />
                <Bar dataKey="students" name="Students" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reason for Discount</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reasonSummary.filter((item) => item.deals > 0 || item.students > 0)}
                  dataKey="deals"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={52}
                  label={({ name, percent }) => `${String(name || "")}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {reasonSummary.map((_, index) => (
                    <Cell key={`reason-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => [formatNumber(toChartNumber(value)), "Discounted Deals"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Compare spend, students and leads from each platform.</p>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: unknown, name: unknown) => [formatNumber(toChartNumber(value)), String(name || "")]} />
              <Legend />
              <Bar dataKey="leads" name="Leads" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="students" name="Students" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle icon={Search} title="Stored Offer Records" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Every offer, post and ad record</CardTitle>
              <p className="text-sm text-muted-foreground">Filter, edit and delete all stored records with post/ad attribution.</p>
            </div>
            <Button onClick={fetchRecords} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[150px_150px_170px_180px_1fr]">
            <div>
              <FieldLabel>Month</FieldLabel>
              <input type="month" value={selectedMonth} onChange={(event) => { setSelectedMonth(event.target.value); setForm((previous) => ({ ...previous, month: event.target.value })); }} className={inputClassName()} />
            </div>

            <div>
              <FieldLabel>Market</FieldLabel>
              <Select value={marketFilter} onValueChange={(value) => setMarketFilter(value as MarketFilter)}>
                <SelectTrigger><SelectValue placeholder="Market" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All markets</SelectItem>{MARKETS.map((market) => <SelectItem key={market} value={market}>{market}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Platform</FieldLabel>
              <Select value={platformFilter} onValueChange={(value) => setPlatformFilter(value as PlatformFilter)}>
                <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All platforms</SelectItem>{PLATFORMS.map((platform) => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Reason</FieldLabel>
              <Select value={reasonFilter} onValueChange={(value) => setReasonFilter(value as ReasonFilter)}>
                <SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All reasons</SelectItem>{DISCOUNT_REASONS.map((reason) => <SelectItem key={reason} value={reason}>{reason}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search offer, campaign, URL, audience or notes" className={inputClassName("pl-9")} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">Platform</th>
                  <th className="px-4 py-3 font-semibold">Offer</th>
                  <th className="px-4 py-3 font-semibold">Post / Ad</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Deals</th>
                  <th className="px-4 py-3 font-semibold">Students</th>
                  <th className="px-4 py-3 font-semibold">Spend</th>
                  <th className="px-4 py-3 font-semibold">CAC</th>
                  <th className="px-4 py-3 font-semibold">Leads</th>
                  <th className="px-4 py-3 font-semibold">Trials</th>
                  <th className="px-4 py-3 font-semibold">Engagement</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={15} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => {
                    const recordSpendUsd = normalizeToUsd(record.ad_spend_amount, record.currency);
                    const students = toAmount(record.students_acquired);
                    const recordCac = students ? recordSpendUsd / students : 0;
                    const engagement = toAmount(record.reactions) + toAmount(record.comments) + toAmount(record.shares) + toAmount(record.saves);
                    const postUrl = externalUrl(record.post_url);
                    const adUrl = externalUrl(record.ad_url);

                    return (
                      <tr key={record.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">{record.month}</td>
                        <td className="px-4 py-3 font-semibold">{record.market}</td>
                        <td className="px-4 py-3">{record.platform}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{record.offer_name}</div>
                          <div className="text-xs text-muted-foreground">{record.campaign_name || "No campaign"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {postUrl ? <a href={postUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"><ExternalLink className="h-3 w-3" /> Post</a> : <span className="text-xs text-muted-foreground">No post</span>}
                            {adUrl ? <a href={adUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"><ExternalLink className="h-3 w-3" /> Ad</a> : <span className="text-xs text-muted-foreground">No ad</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{plainPercentage(toAmount(record.average_discount_percent))}</div>
                          <div className="text-xs text-muted-foreground">{money(totalDiscountGiven(record), record.currency)} given</div>
                        </td>
                        <td className="px-4 py-3">{formatNumber(toAmount(record.discounted_deals))}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-600">{formatNumber(students)}</td>
                        <td className="px-4 py-3">{money(toAmount(record.ad_spend_amount), record.currency)}</td>
                        <td className="px-4 py-3">{money(recordCac, "USD")}</td>
                        <td className="px-4 py-3">{formatNumber(toAmount(record.leads_generated))}</td>
                        <td className="px-4 py-3">{formatNumber(toAmount(record.trials_booked))}</td>
                        <td className="px-4 py-3">
                          <div>{formatNumber(engagement)}</div>
                          <div className="text-xs text-muted-foreground">{formatNumber(toAmount(record.clicks))} clicks</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">{record.reason}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="icon" onClick={() => handleEdit(record)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" onClick={() => handleDelete(record)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={15} className="px-4 py-10 text-center text-muted-foreground">
                      No offer and discount records found for this filter.
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
            title={`${item.market} offers`}
            value={formatNumber(item.offers)}
            icon={BadgePercent}
            subtitle={`${formatNumber(item.students)} students · ${formatNumber(item.deals)} deals`}
            trend={<TrendBadge direction={item.students > 0 ? "up" : "neutral"} label={`${money(item.cac, "USD")} CAC`} />}
            variant={item.offers > 0 ? "default" : "outline"}
          >
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <p className="truncate"><span className="font-medium text-foreground">Platforms:</span> {item.platforms.length ? item.platforms.join(", ") : "—"}</p>
              <p className="mt-1 truncate"><span className="font-medium text-foreground">Top offer:</span> {item.topOffer?.offer_name || "—"}</p>
              <p className="mt-1"><span className="font-medium text-foreground">Discount given:</span> {money(item.discountUsd, "USD")}</p>
            </div>
          </MetricCard>
        ))}
      </div>
    </div>
  );
}
