"use client";

import { useMemo } from "react";
import type { ElementType, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Clock3,
  DollarSign,
  Globe2,
  Layers3,
  MessageCircle,
  PieChart as PieChartLucide,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  WalletCards,
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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// app/dashboard/sales/page.tsx
// Dashboard content only: no sidebar, no header, no popups, no routing cards.
// Your existing app layout can keep the header/sidebar and your existing light/dark/system toggle.

type Trend = "up" | "down" | "flat";

type SourceRow = {
  source: string;
  leads: number;
  trials: number;
  conducted: number;
  paidSignUps: number;
  conversion: number;
};

type FunnelRow = {
  stage: string;
  count: number;
};

type AreaRow = {
  area: string;
  students: number;
  revenue: number;
};

type DropOffRow = {
  reason: string;
  approxPercent: number;
};

const currency = "AUD";

const executive = {
  owner: "Sales Manager",
  frequency: "Monthly",
  totalNewStudentsSigned: 85,
  netActiveStudents: 1233,
  totalRevenueCollected: 148500,
  performanceVsLastMonth: "up" as Trend,
  keyWin: "Upsell revenue grew 8.2% this month.",
  keyConcern: "Paused subscriptions increased by 2 and need a faster win-back flow.",
};

const funnelRows: FunnelRow[] = [
  { stage: "Total leads received", count: 320 },
  { stage: "Qualified parent leads", count: 245 },
  { stage: "Trials booked (new leads only)", count: 120 },
  { stage: "Trials conducted", count: 98 },
  { stage: "Paid sign-ups", count: 85 },
];

const sourceRows: SourceRow[] = [
  { source: "WhatsApp Ads – AU", leads: 120, trials: 45, conducted: 38, paidSignUps: 32, conversion: 26.7 },
  { source: "WhatsApp Ads – NZ", leads: 65, trials: 22, conducted: 18, paidSignUps: 15, conversion: 23.1 },
  { source: "Website", leads: 90, trials: 35, conducted: 30, paidSignUps: 25, conversion: 27.8 },
  { source: "Referrals", leads: 30, trials: 12, conducted: 10, paidSignUps: 8, conversion: 26.7 },
  { source: "Other", leads: 15, trials: 6, conducted: 5, paidSignUps: 5, conversion: 33.3 },
];

const revenueQuality = {
  arpu: 119.28,
  packageMix: [
    { name: "1x/week", value: 20 },
    { name: "2x/week", value: 35 },
    { name: "3x/week", value: 30 },
    { name: "4x/week", value: 15 },
  ],
  paymentMix: [
    { name: "Prepaid", value: 75 },
    { name: "Partial", value: 25 },
  ],
  areaWise: [
    { area: "AU", students: 138, revenue: 58200 },
    { area: "NZ", students: 74, revenue: 31800 },
    { area: "UK", students: 56, revenue: 24950 },
    { area: "USA", students: 48, revenue: 21150 },
    { area: "Other", students: 26, revenue: 12400 },
  ] as AreaRow[],
  planUpgrades: 7,
  expectedMrrNextMonth: 12000,
};

const salesEfficiency = {
  avgFirstResponseMinutes: 3,
  avgLeadToTrialDays: 2.3,
  avgTrialToPaymentDays: 4.1,
  followUpsPerConvertedLead: 2.8,
};

const efficiencyTrend = [
  { week: "W1", response: 5.2, leadToTrial: 3.4, trialToPayment: 5.0, followUps: 3.6 },
  { week: "W2", response: 4.4, leadToTrial: 3.0, trialToPayment: 4.8, followUps: 3.2 },
  { week: "W3", response: 3.7, leadToTrial: 2.6, trialToPayment: 4.5, followUps: 3.0 },
  { week: "W4", response: 3.0, leadToTrial: 2.3, trialToPayment: 4.1, followUps: 2.8 },
];

const dropOffRows: DropOffRow[] = [
  { reason: "Price", approxPercent: 35 },
  { reason: "Timing / holidays", approxPercent: 22 },
  { reason: "No response", approxPercent: 18 },
  { reason: "Comparison shopping", approxPercent: 12 },
  { reason: "Academic mismatch", approxPercent: 8 },
  { reason: "Other", approxPercent: 5 },
];

const supportActions = {
  ceo: "Approve discount budget for at-risk leads and faster fee exception approvals.",
  marketing: "Increase high-quality AU/NZ WhatsApp lead targeting and improve landing-page copy.",
  salesChange: "Tighter 15-minute first-response SLA and segmented follow-up scripts by market.",
  how: ["One Google Sheet tab", "Market-wise rows"],
};

const monthlyRevenue = [
  { month: "Jan", revenue: 112000, target: 120000, signups: 68 },
  { month: "Feb", revenue: 121000, target: 123000, signups: 74 },
  { month: "Mar", revenue: 118000, target: 125000, signups: 71 },
  { month: "Apr", revenue: 136000, target: 128000, signups: 82 },
  { month: "May", revenue: 142500, target: 135000, signups: 86 },
  { month: "Jun", revenue: 148500, target: 140000, signups: 85 },
];

const actionImpact = [
  { name: "CEO", urgency: 85, impact: 90 },
  { name: "Marketing", urgency: 78, impact: 82 },
  { name: "Sales", urgency: 92, impact: 88 },
];

const COLORS = {
  blue: "#4f46e5",
  sky: "#6366f1",
  green: "#10b981",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  cyan: "#ec4899",
  slate: "#64748b",
};

const CHART_COLORS = [COLORS.blue, COLORS.amber, COLORS.green, COLORS.red, COLORS.violet, COLORS.cyan];

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
};


function money(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 ? 2 : 0,
  }).format(value);
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function trendMeta(trend: Trend) {
  if (trend === "up") {
    return {
      label: "Up vs last month",
      icon: ArrowUpRight,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    };
  }
  if (trend === "down") {
    return {
      label: "Down vs last month",
      icon: ArrowDownRight,
      className: "bg-red-500/10 text-red-600 dark:text-red-400",
    };
  }
  return {
    label: "Flat vs last month",
    icon: ArrowRight,
    className: "bg-muted text-muted-foreground",
  };
}

function SectionTitle({ code, title, subtitle }: { code: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">{code}</span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function BaseCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <Card className={`rounded-3xl border-border bg-card text-card-foreground shadow-sm ${className}`}>
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
  tone?: "blue" | "green" | "red" | "amber" | "violet";
}) {
  const tones = {
    blue: "bg-primary/10 text-primary",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };

  return (
    <BaseCard>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{helper}</p>
          </div>
          <div className={`rounded-2xl p-3 ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </BaseCard>
  );
}

function MiniChartCard({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <BaseCard>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <div className="mt-3 h-20">{children}</div>
      </CardContent>
    </BaseCard>
  );
}

function DataTable({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl border border-border">{children}</div>;
}

function TableHeaderCell({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap bg-muted px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">{children}</th>;
}

function TableCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap border-t border-border px-4 py-3 text-sm ${className}`}>{children}</td>;
}

function ProgressLine({ label, value, rightLabel }: { label: string; value: number; rightLabel: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{rightLabel}</span>
      </div>
      <Progress value={value} className="h-2 bg-muted" />
    </div>
  );
}

export default function SalesDashboardPage() {
  const leadToTrial = percent(funnelRows[2].count, funnelRows[0].count);
  const leadToPaid = percent(funnelRows[4].count, funnelRows[0].count);
  const trialToPaid = percent(funnelRows[4].count, funnelRows[3].count);

  const totalSourceLeads = useMemo(() => sourceRows.reduce((sum, row) => sum + row.leads, 0), []);
  const totalPaidSignups = useMemo(() => sourceRows.reduce((sum, row) => sum + row.paidSignUps, 0), []);
  const trend = trendMeta(executive.performanceVsLastMonth);
  const TrendIcon = trend.icon;

  const funnelChartRows = funnelRows.map((row, index) => ({
    ...row,
    percentOfLead: percent(row.count, funnelRows[0].count),
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const funnelConversionRows = [
    { metric: "Lead → Trial", value: leadToTrial },
    { metric: "Lead → Paid", value: leadToPaid },
    { metric: "Trial → Paid", value: trialToPaid },
  ];

  return (
    <div className="space-y-8 p-6">
      <section className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:bg-primary">2⃣ SALES</Badge>
              <Badge variant="outline" className="rounded-full border-border">Owner: {executive.owner}</Badge>
              <Badge variant="outline" className="rounded-full border-border">Frequency: ● {executive.frequency}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Sales Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Monthly sales reporting tab with executive summary, funnel overview, source performance, revenue quality, efficiency, drop-offs, and support actions.
            </p>
          </div>
          <div className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${trend.className}`}>
            <TrendIcon className="h-4 w-4" />
            {trend.label}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle code="A" title="Executive Summary" subtitle="5-line mandatory monthly summary plus visual health charts" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Total new students signed" value={executive.totalNewStudentsSigned} helper="Monthly new paid sign-ups" icon={UserCheck} tone="blue" />
          <KpiCard title="Net active students" value={executive.netActiveStudents.toLocaleString()} helper="After drop-offs" icon={Users} tone="green" />
          <KpiCard title={`Total revenue collected (${currency})`} value={money(executive.totalRevenueCollected)} helper="Collected this month" icon={DollarSign} tone="violet" />
          <KpiCard title="Overall performance" value="⬆ Up" helper="Compared with last month" icon={TrendingUp} tone="green" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <BaseCard>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Executive Summary — 5 Lines Max</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-2xl bg-muted/50 p-4">
                  <span className="text-muted-foreground">● Total new students signed:</span>
                  <strong className="ml-2 text-foreground">{executive.totalNewStudentsSigned}</strong>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <span className="text-muted-foreground">● Net active students:</span>
                  <strong className="ml-2 text-foreground">{executive.netActiveStudents.toLocaleString()}</strong>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <span className="text-muted-foreground">● Revenue collected:</span>
                  <strong className="ml-2 text-foreground">{money(executive.totalRevenueCollected)}</strong>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <span className="text-muted-foreground">● Performance:</span>
                  <strong className="ml-2 text-emerald-600 dark:text-emerald-400">⬆ vs last month</strong>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">● Key win:</span>
                  <p className="mt-1 text-emerald-700 dark:text-emerald-300">{executive.keyWin}</p>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <span className="font-semibold text-red-600 dark:text-red-400">● Key concern:</span>
                  <p className="mt-1 text-red-700 dark:text-red-300">{executive.keyConcern}</p>
                </div>
              </div>
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[285px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 12, right: 8, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="executiveRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.38} />
                      <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${Number(v) / 1000}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => money(Number(value ?? 0))} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.blue} strokeWidth={3} fill="url(#executiveRevenue)" />
                  <Line type="monotone" dataKey="target" name="Target" stroke={COLORS.green} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle code="B" title="Lead Funnel Overview" subtitle="Funnel count table, stage bars, conversion percentages, and visual funnel charts" />

        <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Funnel Stage Counts</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <TableHeaderCell>Funnel Stage</TableHeaderCell>
                      <TableHeaderCell>Count</TableHeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {funnelRows.map((row) => (
                      <tr key={row.stage}>
                        <TableCell className="font-medium text-foreground">{row.stage}</TableCell>
                        <TableCell className="font-bold text-foreground">{row.count.toLocaleString()}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTable>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <KpiCard title="Lead → Trial %" value={`${leadToTrial}%`} helper="Trials booked / total leads" icon={Target} tone="blue" />
                <KpiCard title="Lead → Paid %" value={`${leadToPaid}%`} helper="Paid sign-ups / leads" icon={BadgeDollarSign} tone="green" />
                <KpiCard title="Trial → Paid %" value={`${trialToPaid}%`} helper="Paid / trials conducted" icon={CheckCircle2} tone="violet" />
              </div>
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Funnel Progress Bars</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {funnelChartRows.map((row) => (
                <ProgressLine key={row.stage} label={row.stage} value={row.percentOfLead} rightLabel={`${row.count.toLocaleString()} • ${row.percentOfLead}%`} />
              ))}
            </CardContent>
          </BaseCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <BaseCard className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Funnel Stage Bar Chart</CardTitle>
            </CardHeader>
            <CardContent className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChartRows} layout="vertical" margin={{ top: 8, right: 18, left: 150, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border" />
                  <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="stage" width={145} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Count" radius={[0, 8, 8, 0]} barSize={25}>
                    {funnelChartRows.map((entry) => (
                      <Cell key={entry.stage} fill={entry.fill} />
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
            <CardContent className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="22%" outerRadius="92%" data={funnelConversionRows} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={10} background>
                    {funnelConversionRows.map((entry, index) => (
                      <Cell key={entry.metric} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </RadialBar>
                  <Legend iconSize={9} layout="vertical" verticalAlign="middle" align="right" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${Number(value ?? 0)}%`} />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle code="C" title="Source-wise Performance" subtitle="Market-wise lead source rows with table, grouped bar chart, and conversion pie" />

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Source Performance Table</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <TableHeaderCell>Source</TableHeaderCell>
                    <TableHeaderCell>Leads</TableHeaderCell>
                    <TableHeaderCell>Trials</TableHeaderCell>
                    <TableHeaderCell>Conducted</TableHeaderCell>
                    <TableHeaderCell>Paid Sign-ups</TableHeaderCell>
                    <TableHeaderCell>Conversion %</TableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {sourceRows.map((row) => (
                    <tr key={row.source}>
                      <TableCell className="font-semibold text-foreground">{row.source}</TableCell>
                      <TableCell>{row.leads}</TableCell>
                      <TableCell>{row.trials}</TableCell>
                      <TableCell>{row.conducted}</TableCell>
                      <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">{row.paidSignUps}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{row.conversion}%</span>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTable>
          </CardContent>
        </BaseCard>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Leads, Trials, Conducted & Paid by Source</CardTitle>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceRows} margin={{ top: 10, right: 8, left: -10, bottom: 46 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                  <XAxis dataKey="source" axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" fontSize={11} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="leads" name="Leads" fill={COLORS.blue} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="trials" name="Trials" fill={COLORS.amber} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="conducted" name="Conducted" fill={COLORS.sky} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="paidSignUps" name="Paid" fill={COLORS.green} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Paid Sign-up Share</CardTitle>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceRows} dataKey="paidSignUps" nameKey="source" innerRadius={60} outerRadius={105} paddingAngle={4}>
                    {sourceRows.map((entry, index) => (
                      <Cell key={entry.source} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconSize={9} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle code="D" title="Revenue Quality" subtitle="ARPU, package mix, payments, area categorisation, upgrades, and expected MRR" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Average revenue per student (ARPU)" value={money(revenueQuality.arpu)} helper="Average monthly student value" icon={WalletCards} tone="blue" />
          <KpiCard title="Plan upgrades this month" value={revenueQuality.planUpgrades} helper="Students moved to higher plans" icon={TrendingUp} tone="green" />
          <KpiCard title="Expected MRR from joining next month" value={money(revenueQuality.expectedMrrNextMonth)} helper="Pipeline-ready recurring revenue" icon={BadgeDollarSign} tone="violet" />
          <KpiCard title="Prepaid vs partial payments" value={`${revenueQuality.paymentMix[0].value}% / ${revenueQuality.paymentMix[1].value}%`} helper="Prepaid / partial split" icon={PieChartLucide} tone="amber" />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Package Mix (%)</CardTitle>
            </CardHeader>
            <CardContent className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueQuality.packageMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={105} paddingAngle={5} label={({ name, value }) => `${name}: ${value}%`}>
                    {revenueQuality.packageMix.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${Number(value ?? 0)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Prepaid vs Partial Payments (%)</CardTitle>
            </CardHeader>
            <CardContent className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueQuality.paymentMix} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${Number(value ?? 0)}%`} />
                  <Bar dataKey="value" name="Payment %" radius={[10, 10, 0, 0]}>
                    {revenueQuality.paymentMix.map((entry, index) => (
                      <Cell key={entry.name} fill={index === 0 ? COLORS.green : COLORS.amber} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Expected MRR Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v) / 1000}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => money(Number(value ?? 0))} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.violet} strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="target" name="Target" stroke={COLORS.green} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>
        </div>

        <BaseCard>
          <CardHeader>
            <CardTitle className="text-base">Area Wise Categorisation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
            <DataTable>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <TableHeaderCell>Area</TableHeaderCell>
                    <TableHeaderCell>Students</TableHeaderCell>
                    <TableHeaderCell>Revenue</TableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {revenueQuality.areaWise.map((row) => (
                    <tr key={row.area}>
                      <TableCell className="font-semibold text-foreground">{row.area}</TableCell>
                      <TableCell>{row.students}</TableCell>
                      <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">{money(row.revenue)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTable>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueQuality.areaWise} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                  <XAxis dataKey="area" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v) / 1000}k`} />
                  <Tooltip contentStyle={tooltipStyle} />
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
        <SectionTitle code="E" title="Sales Efficiency" subtitle="Speed, conversion timing, follow-ups, and efficiency trend analysis" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Avg first response time to new lead" value={`${salesEfficiency.avgFirstResponseMinutes} min`} helper="Target: under 15 minutes" icon={Clock3} tone="green" />
          <KpiCard title="Avg days from lead → trial" value={`${salesEfficiency.avgLeadToTrialDays} days`} helper="Lead booking speed" icon={Target} tone="blue" />
          <KpiCard title="Avg days from trial → payment" value={`${salesEfficiency.avgTrialToPaymentDays} days`} helper="Payment conversion time" icon={BadgeDollarSign} tone="violet" />
          <KpiCard title="Follow-ups per converted lead" value={salesEfficiency.followUpsPerConvertedLead} helper="Average follow-up count" icon={MessageCircle} tone="amber" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Weekly Efficiency Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={efficiencyTrend} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="response" name="First Response (min)" stroke={COLORS.green} strokeWidth={3} />
                  <Line type="monotone" dataKey="leadToTrial" name="Lead → Trial (days)" stroke={COLORS.blue} strokeWidth={3} />
                  <Line type="monotone" dataKey="trialToPayment" name="Trial → Payment (days)" stroke={COLORS.violet} strokeWidth={3} />
                  <Line type="monotone" dataKey="followUps" name="Follow-ups" stroke={COLORS.amber} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Efficiency Radar</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[
                  { metric: "Response", score: 92 },
                  { metric: "Lead→Trial", score: 78 },
                  { metric: "Trial→Pay", score: 72 },
                  { metric: "Follow-up", score: 84 },
                  { metric: "Close Rate", score: 88 },
                ]}>
                  <PolarGrid stroke="currentColor" className="text-border" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <Radar name="Efficiency" dataKey="score" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.25} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle code="F" title="Drop-offs & Loss Reasons" subtitle="Loss reason table, percentage bars, and distribution pie" />

        <div className="grid gap-4 xl:grid-cols-[.95fr_1.05fr]">
          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Loss Reasons Table</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <TableHeaderCell>Reason</TableHeaderCell>
                      <TableHeaderCell>Approx %</TableHeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {dropOffRows.map((row) => (
                      <tr key={row.reason}>
                        <TableCell className="font-semibold text-foreground">{row.reason}</TableCell>
                        <TableCell className="font-bold text-red-600 dark:text-red-400">{row.approxPercent}%</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTable>

              <div className="mt-5 space-y-4">
                {dropOffRows.map((row) => (
                  <ProgressLine key={row.reason} label={row.reason} value={row.approxPercent} rightLabel={`${row.approxPercent}%`} />
                ))}
              </div>
            </CardContent>
          </BaseCard>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <BaseCard>
              <CardHeader>
                <CardTitle className="text-base">Loss Distribution Pie</CardTitle>
              </CardHeader>
              <CardContent className="h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dropOffRows} dataKey="approxPercent" nameKey="reason" innerRadius={55} outerRadius={95} paddingAngle={4} label>
                      {dropOffRows.map((entry, index) => (
                        <Cell key={entry.reason} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${Number(value ?? 0)}%`} />
                    <Legend iconSize={9} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </BaseCard>

            <BaseCard>
              <CardHeader>
                <CardTitle className="text-base">Loss Reason Bar Chart</CardTitle>
              </CardHeader>
              <CardContent className="h-[330px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dropOffRows} layout="vertical" margin={{ top: 8, right: 16, left: 116, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border" />
                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="reason" width={112} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${Number(value ?? 0)}%`} />
                    <Bar dataKey="approxPercent" name="Approx %" radius={[0, 8, 8, 0]}>
                      {dropOffRows.map((entry, index) => (
                        <Cell key={entry.reason} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </BaseCard>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle code="G" title="Action Items / Support Needed" subtitle="CEO, marketing, sales changes, and operating format shown inline" />

        <div className="grid gap-4 lg:grid-cols-3">
          <BaseCard>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">What sales needs from CEO</p>
                  <p className="text-xs text-muted-foreground">Approval and commercial support</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-foreground">{supportActions.ceo}</p>
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">What sales needs from marketing</p>
                  <p className="text-xs text-muted-foreground">Lead quality and campaign support</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-foreground">{supportActions.marketing}</p>
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-600 dark:text-violet-400">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">What sales will change next month</p>
                  <p className="text-xs text-muted-foreground">Process improvements</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-foreground">{supportActions.salesChange}</p>
            </CardContent>
          </BaseCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">How</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supportActions.how.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </BaseCard>

          <BaseCard>
            <CardHeader>
              <CardTitle className="text-base">Action Priority Chart</CardTitle>
            </CardHeader>
            <CardContent className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionImpact} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="urgency" name="Urgency" fill={COLORS.red} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="impact" name="Impact" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </BaseCard>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniChartCard title="Total leads received" value={totalSourceLeads.toLocaleString()}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <Area type="monotone" dataKey="signups" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </MiniChartCard>
          <MiniChartCard title="Paid sign-ups" value={totalPaidSignups.toLocaleString()}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <Line type="monotone" dataKey="signups" stroke={COLORS.green} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </MiniChartCard>
          <MiniChartCard title="Lead → Paid" value={`${leadToPaid}%`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelConversionRows} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="value" fill={COLORS.violet} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </MiniChartCard>
          <MiniChartCard title="Revenue collected" value={money(executive.totalRevenueCollected)}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <Area type="monotone" dataKey="revenue" stroke={COLORS.amber} fill={COLORS.amber} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </MiniChartCard>
        </div>
      </section>
    </div>
  );
}
