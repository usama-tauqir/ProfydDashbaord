// app/dashboard/ceo/page.tsx
"use client";

import type { ElementType, ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  CreditCard,
  DollarSign,
  Percent,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// CEO dashboard with charts.
// The KPI section still follows the CEO rule: only the core 12–15 CEO numbers are shown as primary numbers.
// Charts are added for visual context without adding heavy table/detail noise.

type RiskTone = "critical" | "warning" | "info";

type CEOMetric = {
  title: string;
  value: string;
  helper: string;
  icon: ElementType;
  tone: "blue" | "green" | "amber" | "red" | "violet" | "slate";
};

const CHART = {
  blue: "#2563eb",
  sky: "#0ea5e9",
  green: "#10b981",
  emerald: "#059669",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
  slate: "#64748b",
};

const CHART_COLORS = [CHART.blue, CHART.green, CHART.amber, CHART.red, CHART.violet, CHART.cyan];

const currentMonthActive = 1900;
const previousMonthActive = 1735;
const netGrowth = 182;
const churnPercent = 3.1;
const monthlyRevenue = 55000;
const cashCollected = 48500;
const grossMarginPercent = 68;
const tutorUtilization = 87;
const cac = 125;
const paybackMonths = 4.2;
const outstandingReceivables = 12500;
const arpa = (monthlyRevenue / currentMonthActive).toFixed(2);

const ceoMetrics: CEOMetric[] = [
  {
    title: "Active students (M / N)",
    value: `${currentMonthActive.toLocaleString()} / ${previousMonthActive.toLocaleString()}`,
    helper: "Current month / previous month",
    icon: Users,
    tone: "blue",
  },
  {
    title: "Net student growth",
    value: `+${netGrowth}`,
    helper: "New students minus churned students",
    icon: TrendingUp,
    tone: "green",
  },
  {
    title: "Churn %",
    value: `${churnPercent}%`,
    helper: "Monthly student churn",
    icon: TrendingDown,
    tone: "red",
  },
  {
    title: "ARPA",
    value: `$${arpa}`,
    helper: "Average revenue per active account",
    icon: BarChart3,
    tone: "violet",
  },
  {
    title: "Revenue",
    value: `$${monthlyRevenue.toLocaleString()}`,
    helper: "Monthly recognized revenue",
    icon: DollarSign,
    tone: "green",
  },
  {
    title: "Cash collected",
    value: `$${cashCollected.toLocaleString()}`,
    helper: "Cash actually received this month",
    icon: Wallet,
    tone: "blue",
  },
  {
    title: "Gross margin %",
    value: `${grossMarginPercent}%`,
    helper: "After tutor and delivery costs",
    icon: Percent,
    tone: "green",
  },
  {
    title: "Tutor utilization %",
    value: `${tutorUtilization}%`,
    helper: "Used tutor capacity",
    icon: UserCheck,
    tone: "amber",
  },
  {
    title: "CAC",
    value: `$${cac}`,
    helper: "Customer acquisition cost",
    icon: Target,
    tone: "violet",
  },
  {
    title: "Payback months",
    value: `${paybackMonths}`,
    helper: "CAC payback period",
    icon: Clock,
    tone: "blue",
  },
  {
    title: "Outstanding receivables",
    value: `$${outstandingReceivables.toLocaleString()}`,
    helper: "Uncollected customer balance",
    icon: CreditCard,
    tone: "red",
  },
];

const revenueTrend = [
  { month: "Jan", revenue: 42000, cash: 37000, target: 40000 },
  { month: "Feb", revenue: 45000, cash: 40200, target: 42000 },
  { month: "Mar", revenue: 48000, cash: 43000, target: 45000 },
  { month: "Apr", revenue: 52000, cash: 46600, target: 48000 },
  { month: "May", revenue: 49000, cash: 42100, target: 50000 },
  { month: "Jun", revenue: 55000, cash: 48500, target: 52000 },
];

const studentGrowthTrend = [
  { month: "Jan", active: 1200, newStudents: 150, churned: 45 },
  { month: "Feb", active: 1305, newStudents: 180, churned: 52 },
  { month: "Mar", active: 1433, newStudents: 195, churned: 48 },
  { month: "Apr", active: 1580, newStudents: 210, churned: 55 },
  { month: "May", active: 1735, newStudents: 225, churned: 60 },
  { month: "Jun", active: 1900, newStudents: 240, churned: 58 },
];

const financeMix = [
  { name: "Cash collected", value: cashCollected },
  { name: "Receivables", value: outstandingReceivables },
];

const unitEconomics = [
  { name: "Gross margin", value: grossMarginPercent },
  { name: "Tutor utilization", value: tutorUtilization },
  { name: "CAC efficiency", value: 76 },
  { name: "Payback health", value: 82 },
];

const riskScores = [
  { risk: "Receivables", score: 86 },
  { risk: "CAC", score: 72 },
  { risk: "Tutor capacity", score: 78 },
];

const topRisks: { title: string; description: string; tone: RiskTone }[] = [
  {
    title: "Outstanding receivables are high",
    description: "Collections need tighter follow-up before aging becomes a cash-flow issue.",
    tone: "critical",
  },
  {
    title: "Marketing CAC pressure",
    description: "WhatsApp AU acquisition efficiency needs review before scaling spend further.",
    tone: "warning",
  },
  {
    title: "Tutor capacity constraint",
    description: "Morning shift availability is tight and recruitment should stay ahead of demand.",
    tone: "warning",
  },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function toneClasses(tone: CEOMetric["tone"]) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  return tones[tone];
}

function riskToneClasses(tone: RiskTone) {
  const tones = {
    critical: "border-red-200 bg-red-50 dark:border-red-900/70 dark:bg-red-950/30",
    warning: "border-amber-200 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/30",
    info: "border-blue-200 bg-blue-50 dark:border-blue-900/70 dark:bg-blue-950/30",
  };

  return tones[tone];
}

function riskIconClasses(tone: RiskTone) {
  const tones = {
    critical: "text-red-600 dark:text-red-300",
    warning: "text-amber-600 dark:text-amber-300",
    info: "text-blue-600 dark:text-blue-300",
  };

  return tones[tone];
}

function BaseCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <Card className={`rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
      {children}
    </Card>
  );
}

function CEOMetricCard({ metric }: { metric: CEOMetric }) {
  const Icon = metric.icon;

  return (
    <BaseCard className="transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{metric.title}</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metric.helper}</p>
          </div>
          <div className={`rounded-2xl p-3 ${toneClasses(metric.tone)}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </BaseCard>
  );
}

function ChartTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
      <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
    </CardHeader>
  );
}

export default function CEODashboardPage() {
  return (
    <div className="space-y-8 bg-white p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-50 sm:p-6 lg:p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600 dark:bg-blue-500">CEO Dashboard</Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">Monthly View</Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">Charts + Executive KPIs</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Executive Overview</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
              CEO-level KPIs with clean visual charts for revenue, students, unit economics, cash, utilization, and top risks.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Rule</p>
            <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">Primary KPI numbers stay CEO-only</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        {ceoMetrics.map((metric) => (
          <CEOMetricCard key={metric.title} metric={metric} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <BaseCard>
          <ChartTitle title="Revenue, Cash & Target Trend" subtitle="Revenue quality and cash collection across months" />
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.blue} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART.blue} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.green} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART.green} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => formatMoney(Number(value ?? 0))} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART.blue} strokeWidth={3} fill="url(#revenueFill)" />
                <Area type="monotone" dataKey="cash" name="Cash Collected" stroke={CHART.green} strokeWidth={3} fill="url(#cashFill)" />
                <Line type="monotone" dataKey="target" name="Target" stroke={CHART.amber} strokeWidth={2.5} strokeDasharray="6 6" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <ChartTitle title="Cash Collection Mix" subtitle="Collected cash vs outstanding balance" />
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={financeMix} dataKey="value" nameKey="name" innerRadius={68} outerRadius={112} paddingAngle={5}>
                  {financeMix.map((entry, index) => (
                    <Cell key={entry.name} fill={index === 0 ? CHART.green : CHART.red} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => formatMoney(Number(value ?? 0))} />
                <Legend iconSize={9} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <BaseCard>
          <ChartTitle title="Student Growth" subtitle="Active students, new students, and churned students" />
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentGrowthTrend} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
                <Legend />
                <Bar dataKey="newStudents" name="New" fill={CHART.green} radius={[8, 8, 0, 0]} />
                <Bar dataKey="churned" name="Churned" fill={CHART.red} radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="active" name="Active" stroke={CHART.blue} strokeWidth={3} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <ChartTitle title="Unit Economics Health" subtitle="Margin, tutor utilization, CAC efficiency, and payback health" />
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="22%" outerRadius="92%" data={unitEconomics} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={10} background>
                  {unitEconomics.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </RadialBar>
                <Legend iconSize={9} layout="vertical" verticalAlign="middle" align="right" />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value) => `${Number(value ?? 0)}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <BaseCard>
          <ChartTitle title="CEO KPI Progress" subtitle="Progress view for margin, utilization, cash collection, and risk" />
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Gross margin</span>
                <span className="text-slate-500 dark:text-slate-400">{grossMarginPercent}%</span>
              </div>
              <Progress value={grossMarginPercent} className="h-2 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Tutor utilization</span>
                <span className="text-slate-500 dark:text-slate-400">{tutorUtilization}%</span>
              </div>
              <Progress value={tutorUtilization} className="h-2 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Cash collection</span>
                <span className="text-slate-500 dark:text-slate-400">{Math.round((cashCollected / monthlyRevenue) * 100)}%</span>
              </div>
              <Progress value={Math.round((cashCollected / monthlyRevenue) * 100)} className="h-2 bg-slate-200 dark:bg-slate-800" />
            </div>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <ChartTitle title="Top 3 Risk Severity" subtitle="Executive risk ranking for this month" />
          <CardContent className="h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskScores} layout="vertical" margin={{ top: 10, right: 16, left: 95, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="risk" axisLine={false} tickLine={false} width={92} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
                <Bar dataKey="score" name="Risk score" radius={[0, 8, 8, 0]}>
                  {riskScores.map((risk, index) => (
                    <Cell key={risk.risk} fill={index === 0 ? CHART.red : CHART.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </BaseCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <BaseCard>
          <ChartTitle title="CEO Snapshot" subtitle="Short read before the leadership meeting" />
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Growth</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Student base is expanding while churn remains controlled.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cash</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Revenue is healthy, but collections need continued focus.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Capacity</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tutor capacity is strong but approaching a constraint in peak slots.</p>
            </div>
          </CardContent>
        </BaseCard>

        <BaseCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-300" />
              Top 3 Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topRisks.map((risk) => (
              <div key={risk.title} className={`flex items-start gap-4 rounded-2xl border p-4 ${riskToneClasses(risk.tone)}`}>
                <AlertTriangle className={`mt-0.5 h-5 w-5 ${riskIconClasses(risk.tone)}`} />
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">{risk.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{risk.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </BaseCard>
      </section>
    </div>
  );
}
