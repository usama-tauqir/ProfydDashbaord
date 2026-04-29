// app/dashboard/finance/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  CreditCard,
  AlertCircle,
  Receipt,
  RotateCcw,
  Ban,
  Calendar,
  Clock,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
type Period = "all" | "today" | "weekly" | "monthly" | "yearly";

interface FinanceStats {
  invoicedAmount: number;
  cashCollected: number;
  outstandingReceivables: number;
  voidsCount: number;
  voidsValue: number;
  refundsCount: number;
  refundsValue: number;
  chargebacksCount: number;
  chargebacksValue: number;
}

interface AgingBucket {
  bucket: string; // "0-30 days", "31-60 days", etc.
  amount: number;
}

// ----------------------------------------------------------------------
// Mock data generator (scales with period)
// ----------------------------------------------------------------------
const getMockData = (period: Period) => {
  const factor =
    period === "all"
      ? 1
      : period === "yearly"
      ? 1
      : period === "monthly"
      ? 1 / 12
      : period === "weekly"
      ? 1 / 52
      : 1 / 365;

  const scale = (val: number) => Math.round(val * factor);

  const stats: FinanceStats = {
    invoicedAmount: scale(185000),
    cashCollected: scale(148500),
    outstandingReceivables: scale(36500),
    voidsCount: scale(12),
    voidsValue: scale(2400),
    refundsCount: scale(5),
    refundsValue: scale(1200),
    chargebacksCount: scale(2),
    chargebacksValue: scale(600),
  };

  // Aging breakdown (assume proportional to outstanding)
  const totalOutstanding = stats.outstandingReceivables;
  const aging: AgingBucket[] = [
    { bucket: "0-30 days", amount: Math.round(totalOutstanding * 0.6) },
    { bucket: "31-60 days", amount: Math.round(totalOutstanding * 0.25) },
    { bucket: "61-90 days", amount: Math.round(totalOutstanding * 0.1) },
    { bucket: "91+ days", amount: Math.round(totalOutstanding * 0.05) },
  ];

  return { stats, aging };
};

const AGING_COLORS = ["#4f46e5", "#f59e0b", "#ef4444", "#8b5cf6"];

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function FinanceDashboardPage() {
  const [period, setPeriod] = useState<Period>("monthly"); // default to monthly
  const [data, setData] = useState(() => getMockData("monthly"));
  const [loading, setLoading] = useState(false);

  const fetchData = (selectedPeriod: Period) => {
    setLoading(true);
    setData(getMockData(selectedPeriod));
    setLoading(false);
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const { stats, aging } = data;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground">
            Cash & Billing metrics – invoiced, collected, outstanding, voids, refunds, chargebacks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Frequency: Monthly</span>
          </div>
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="yearly">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchData(period)} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Invoicing & Collection Cards */}
      <SectionTitle icon={DollarSign} title="Cash & Billing" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Invoiced Amount"
          value={`$${stats.invoicedAmount.toLocaleString()}`}
          icon={Receipt}
          highlight
        />
        <MetricCard
          title="Cash Collected"
          value={`$${stats.cashCollected.toLocaleString()}`}
          icon={CreditCard}
          highlight
        />
        <MetricCard
          title="Outstanding Receivables"
          value={`$${stats.outstandingReceivables.toLocaleString()}`}
          icon={AlertCircle}
          variant="warning"
        />
        <MetricCard
          title="Voids (Count)"
          value={stats.voidsCount}
          icon={Ban}
          subtitle={`Value: $${stats.voidsValue.toLocaleString()}`}
        />
        <MetricCard
          title="Refunds (Count)"
          value={stats.refundsCount}
          icon={RotateCcw}
          subtitle={`Value: $${stats.refundsValue.toLocaleString()}`}
        />
        {stats.chargebacksCount > 0 && (
          <MetricCard
            title="Chargebacks (if any)"
            value={stats.chargebacksCount}
            icon={AlertCircle}
            subtitle={`Value: $${stats.chargebacksValue.toLocaleString()}`}
            variant="warning"
          />
        )}
      </div>

      {/* Aging Analysis */}
      <SectionTitle icon={Clock} title="Outstanding Receivables Aging" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aging Buckets</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aging} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40}>
                  {aging.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={AGING_COLORS[idx % AGING_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outstanding Share</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aging}
                  dataKey="amount"
                  nameKey="bucket"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) =>
  `${name}: $${(Number(value) / 1000).toFixed(0)}k`
}
                >
                  {aging.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={AGING_COLORS[idx % AGING_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Collection Rate</p>
              <p className="text-2xl font-bold">
                {stats.invoicedAmount > 0
                  ? ((stats.cashCollected / stats.invoicedAmount) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Outstanding % of Invoiced</p>
              <p className="text-2xl font-bold">
                {stats.invoicedAmount > 0
                  ? ((stats.outstandingReceivables / stats.invoicedAmount) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Voids + Refunds % of Invoiced</p>
              <p className="text-2xl font-bold">
                {stats.invoicedAmount > 0
                  ? (
                      ((stats.voidsValue + stats.refundsValue) / stats.invoicedAmount) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------
// Reusable Components
// ----------------------------------------------------------------------
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
  highlight = false,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  highlight?: boolean;
  variant?: "default" | "outline" | "warning";
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
      <CardContent className="p-5 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-full bg-muted/60 p-2.5">
          <Icon className="h-5 w-5 text-indigo-500" />
        </div>
      </CardContent>
    </Card>
  );
}