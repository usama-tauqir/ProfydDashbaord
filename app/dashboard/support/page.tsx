// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserMinus,
  RefreshCw,
  AlertCircle,
  ShoppingCart,
  Calendar,
  BarChart3,
  Activity,
  Heart,
  UserPlus,
  Clock,
  Target,
  ShieldAlert,
  PauseCircle,
  Repeat,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
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
interface DashboardStats {
  activeStudents: number;
  newStudentsStarted: number;
  studentsStopped: number;
  reactivatedStudents: number;
  totalLessonsDelivered: number;
  missedCancelledLessons: number;
  avgLessonsPerStudent: number;
  avgLessonsPerTutor: number;
  netActiveStudents: number;
  totalRevenue: number;
  upsellRevenue: number;
  crossSellsRevenue: number;
  crossSellTransactions: number;
  siblingEnrollment: number;
  arpu: number;
  activeTutors: number;
  onboardingTutors: number;
  totalAvailableHours: number;
  totalHoursTaught: number;
  utilizationPercent: number;
  complaintsRaised: number;
  complaintsResolved: number;
  repeatedComplaints: number;
  tutorChangeRequests: number;
  tutorChangePending: number;
  pausedSubscriptions: number;
  refundRequests: number;
  refundsApproved: number;
}

interface TrendDataPoint {
  label: string;
  students: number;
  revenue: number;
}

interface PackageMixItem {
  name: string;
  percentage: number;
}

interface PrepaidPartialItem {
  name: string;
  value: number;
}

interface GradeDistributionItem {
  grade: string;
  count: number;
}

interface StateDistributionItem {
  state: string;
  count: number;
}

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------
const PIE_COLORS = ["#4f46e5", "#e5e7eb"];
const PACKAGE_COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc"];
const GRADE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];
const STATE_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"];

type Period = "all" | "today" | "weekly" | "monthly" | "yearly";

// ----------------------------------------------------------------------
// Mock data generator based on period
// ----------------------------------------------------------------------
const getMockStats = (period: Period): DashboardStats => {
  // Base values (all time)
  const base: DashboardStats = {
    activeStudents: 1245,
    newStudentsStarted: 85,
    studentsStopped: 12,
    reactivatedStudents: 8,
    totalLessonsDelivered: 3402,
    missedCancelledLessons: 45,
    avgLessonsPerStudent: 2.7,
    avgLessonsPerTutor: 22.4,
    netActiveStudents: 1233,
    totalRevenue: 148500,
    upsellRevenue: 12200,
    crossSellsRevenue: 4500,
    crossSellTransactions: 32,
    siblingEnrollment: 14,
    arpu: 119.28,
    activeTutors: 42,
    onboardingTutors: 3,
    totalAvailableHours: 1250,
    totalHoursTaught: 980,
    utilizationPercent: 78.4,
    complaintsRaised: 5,
    complaintsResolved: 4,
    repeatedComplaints: 1,
    tutorChangeRequests: 3,
    tutorChangePending: 1,
    pausedSubscriptions: 8,
    refundRequests: 2,
    refundsApproved: 0,
  };

  const factor =
    period === "all"
      ? 1
      : period === "yearly"
      ? 1
      : period === "monthly"
      ? 1 / 12
      : period === "weekly"
      ? 1 / 52
      : 1 / 365; // today

  const scale = (value: number) => Math.round(value * factor);

  return {
    activeStudents: base.activeStudents, // active students typically constant across short periods
    newStudentsStarted: scale(base.newStudentsStarted),
    studentsStopped: scale(base.studentsStopped),
    reactivatedStudents: scale(base.reactivatedStudents),
    totalLessonsDelivered: scale(base.totalLessonsDelivered),
    missedCancelledLessons: scale(base.missedCancelledLessons),
    avgLessonsPerStudent: period === "all" ? base.avgLessonsPerStudent : +(base.avgLessonsPerStudent * factor).toFixed(1),
    avgLessonsPerTutor: period === "all" ? base.avgLessonsPerTutor : +(base.avgLessonsPerTutor * factor).toFixed(1),
    netActiveStudents: base.netActiveStudents,
    totalRevenue: scale(base.totalRevenue),
    upsellRevenue: scale(base.upsellRevenue),
    crossSellsRevenue: scale(base.crossSellsRevenue),
    crossSellTransactions: scale(base.crossSellTransactions),
    siblingEnrollment: scale(base.siblingEnrollment),
    arpu: period === "all" ? base.arpu : +(base.arpu * factor).toFixed(2),
    activeTutors: base.activeTutors,
    onboardingTutors: base.onboardingTutors,
    totalAvailableHours: scale(base.totalAvailableHours),
    totalHoursTaught: scale(base.totalHoursTaught),
    utilizationPercent: base.utilizationPercent, // keep roughly same
    complaintsRaised: scale(base.complaintsRaised),
    complaintsResolved: scale(base.complaintsResolved),
    repeatedComplaints: scale(base.repeatedComplaints),
    tutorChangeRequests: scale(base.tutorChangeRequests),
    tutorChangePending: base.tutorChangePending,
    pausedSubscriptions: scale(base.pausedSubscriptions),
    refundRequests: scale(base.refundRequests),
    refundsApproved: base.refundsApproved,
  };
};

const getTrendData = (period: Period): TrendDataPoint[] => {
  if (period === "all" || period === "yearly") {
    return [
      { label: "Jan", students: 1120, revenue: 41200 },
      { label: "Feb", students: 1180, revenue: 42800 },
      { label: "Mar", students: 1234, revenue: 45678 },
      { label: "Apr", students: 1245, revenue: 148500 },
      { label: "May", students: 1280, revenue: 152000 },
      { label: "Jun", students: 1310, revenue: 155000 },
    ];
  }
  if (period === "monthly") {
    return [
      { label: "W1", students: 310, revenue: 12000 },
      { label: "W2", students: 325, revenue: 12500 },
      { label: "W3", students: 340, revenue: 13000 },
      { label: "W4", students: 356, revenue: 13500 },
    ];
  }
  if (period === "weekly") {
    return [
      { label: "Mon", students: 45, revenue: 1600 },
      { label: "Tue", students: 52, revenue: 1800 },
      { label: "Wed", students: 48, revenue: 1700 },
      { label: "Thu", students: 55, revenue: 2000 },
      { label: "Fri", students: 50, revenue: 1900 },
    ];
  }
  // today
  return [
    { label: "8am", students: 5, revenue: 200 },
    { label: "10am", students: 8, revenue: 300 },
    { label: "12pm", students: 10, revenue: 400 },
    { label: "2pm", students: 7, revenue: 300 },
    { label: "4pm", students: 9, revenue: 350 },
  ];
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [stats, setStats] = useState<DashboardStats>(getMockStats("all"));
  const [trendData, setTrendData] = useState<TrendDataPoint[]>(getTrendData("all"));
  const [packageMix, setPackageMix] = useState<PackageMixItem[]>([
    { name: "4x/week", percentage: 15 },
    { name: "3x/week", percentage: 30 },
    { name: "2x/week", percentage: 35 },
    { name: "1x/week", percentage: 20 },
  ]);
  const [prepaidPartial, setPrepaidPartial] = useState<PrepaidPartialItem[]>([
    { name: "Prepaid", value: 75 },
    { name: "Partial", value: 25 },
  ]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistributionItem[]>([
    { grade: "Year 7", count: 210 },
    { grade: "Year 8", count: 185 },
    { grade: "Year 9", count: 260 },
    { grade: "Year 10", count: 310 },
    { grade: "Year 11", count: 175 },
    { grade: "Year 12", count: 105 },
  ]);
  const [stateDistribution, setStateDistribution] = useState<StateDistributionItem[]>([
    { state: "NSW", count: 420 },
    { state: "VIC", count: 350 },
    { state: "QLD", count: 210 },
    { state: "WA", count: 140 },
    { state: "SA", count: 85 },
  ]);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------------------------
  // Fetch all dashboard data (mock or from Supabase)
  // --------------------------------------------------------------------
  const fetchDashboardData = async (selectedPeriod: Period) => {
    try {
      setLoading(true);

      // In a real app, you would fetch from Supabase with date filters.
      // Here we use mock data based on the selected period.
      const mockStats = getMockStats(selectedPeriod);
      const mockTrend = getTrendData(selectedPeriod);

      // Optionally fetch from Supabase (replace with actual queries)
      // try {
      //   const startDate = getStartDate(selectedPeriod);
      //   const { data } = await supabase.from("lessons").select("*").gte("created_at", startDate);
      //   // process data...
      // } catch {}

      setStats(mockStats);
      setTrendData(mockTrend);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(period);
  }, [period]);

  // --------------------------------------------------------------------
  // Loading State
  // --------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // Helper: Trend Badge
  // --------------------------------------------------------------------
  const TrendBadge = ({
    direction,
    label,
  }: {
    direction: "up" | "down" | "neutral";
    label: string;
  }) => {
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
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${bg} ${text}`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  return (
    <div className="space-y-8 p-6">
      {/* ================================================================ */}
      {/* HEADER + FILTER */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview Dashboard</h1>
          <p className="text-muted-foreground">
            Student lifecycle, revenue, tutor capacity &amp; retention — all in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Last updated: Just now</span>
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
          <Button onClick={() => fetchDashboardData(period)} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 1 — STUDENT & DELIVERY STATS */}
      {/* ================================================================ */}
      <SectionTitle icon={Users} title="Student & Delivery Stats" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Active students"
          value={stats.activeStudents.toLocaleString()}
          icon={Users}
          trend={<TrendBadge direction="up" label="5.2%" />}
        />
        <MetricCard
          title="New students started"
          value={stats.newStudentsStarted}
          icon={UserPlus}
          trend={<TrendBadge direction="up" label="12%" />}
        />
        <MetricCard
          title="Students stopped"
          value={stats.studentsStopped}
          icon={UserMinus}
          trend={<TrendBadge direction="down" label="-2.1%" />}
        />
        <MetricCard
          title="Reactivated students"
          value={stats.reactivatedStudents}
          icon={Repeat}
          trend={<TrendBadge direction="neutral" label="0%" />}
        />
        <MetricCard
          title="Total lessons delivered"
          value={stats.totalLessonsDelivered.toLocaleString()}
          icon={BookOpen}
          trend={<TrendBadge direction="up" label="8%" />}
          highlight
        />
        <MetricCard
          title="Missed / cancelled"
          value={stats.missedCancelledLessons}
          icon={AlertCircle}
          trend={<TrendBadge direction="down" label="-1.5%" />}
        />
        <MetricCard
          title="Avg lessons / student"
          value={stats.avgLessonsPerStudent}
          icon={Activity}
          subtitle="Per month"
        />
        <MetricCard
          title="Avg lessons / tutor"
          value={stats.avgLessonsPerTutor}
          icon={Target}
          subtitle="Per week"
        />
        <MetricCard
          title="Net active students"
          value={stats.netActiveStudents.toLocaleString()}
          icon={Users}
          subtitle="After drop-offs"
          trend={<TrendBadge direction="neutral" label="Stable" />}
          variant="outline"
        />
      </div>

      {/* ================================================================ */}
      {/* SECTION 2 — REVENUE & PERFORMANCE */}
      {/* ================================================================ */}
      <SectionTitle icon={DollarSign} title="Revenue & Performance" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Total revenue (AUD)"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          highlight
        >
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            <TrendBadge direction="up" label="Revenue" />
            <TrendBadge direction="neutral" label="Volume" />
            <TrendBadge direction="down" label="Costs" />
          </div>
        </MetricCard>
        <MetricCard
          title="Upsell"
          value={`$${stats.upsellRevenue.toLocaleString()}`}
          icon={TrendingUp}
          subtitle="8.2% of total revenue"
        />
        <MetricCard
          title="Cross sells"
          value={`$${stats.crossSellsRevenue.toLocaleString()}`}
          icon={ShoppingCart}
          subtitle={`${stats.crossSellTransactions} transactions`}
        />
        <MetricCard
          title="Sibling enrollment"
          value={stats.siblingEnrollment}
          icon={Heart}
          trend={<TrendBadge direction="up" label="New families" />}
        />
        <MetricCard
          title="ARPU"
          value={`$${stats.arpu.toFixed(2)}`}
          icon={BarChart3}
          subtitle="Per month"
        />
      </div>

      {/* --- Package Mix & Prepaid/Partial Charts --- */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Package Mix — Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Package Mix (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={packageMix}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 60, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 40]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={70} />
                <Tooltip formatter={(value: any) => `${value}%`} />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={28}>
                  {packageMix.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={PACKAGE_COLORS[idx % PACKAGE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Prepaid vs Partial — Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prepaid vs Partial Payments</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prepaidPartial}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {prepaidPartial.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================ */}
      {/* SECTION 3 — TUTOR CAPACITY */}
      {/* ================================================================ */}
      <SectionTitle icon={Clock} title="Tutor Capacity" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active tutors"
          value={stats.activeTutors}
          icon={Users}
          subtitle={`${stats.onboardingTutors} onboarding`}
        />
        <MetricCard
          title="Total available hours"
          value={stats.totalAvailableHours.toLocaleString()}
          icon={Calendar}
          subtitle="This month"
        />
        <MetricCard
          title="Total hours taught"
          value={stats.totalHoursTaught.toLocaleString()}
          icon={BookOpen}
          subtitle="Actual delivery"
        />
        <MetricCard
          title="Utilization %"
          value={`${stats.utilizationPercent}%`}
          icon={Target}
          subtitle="Target: 80%"
        >
          <div className="mt-3">
            <div className="h-2.5 w-full rounded-full bg-muted">
              <div
                className="h-2.5 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${stats.utilizationPercent}%` }}
              />
            </div>
          </div>
        </MetricCard>
      </div>

      {/* ================================================================ */}
      {/* SECTION 4 — RETENTION SIGNALS */}
      {/* ================================================================ */}
      <SectionTitle icon={ShieldAlert} title="Retention Signals" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Complaints raised"
          value={stats.complaintsRaised}
          icon={AlertCircle}
          trend={<TrendBadge direction="down" label="Good" />}
        />
        <MetricCard
          title="Complaints resolved"
          value={stats.complaintsResolved}
          icon={Activity}
          subtitle="80% resolution rate"
        />
        <MetricCard
          title="Repeated complaints"
          value={stats.repeatedComplaints}
          icon={AlertCircle}
          subtitle="Requires attention"
          variant="warning"
        />
        <MetricCard
          title="Tutor change requests"
          value={stats.tutorChangeRequests}
          icon={RefreshCw}
          subtitle={`Pending: ${stats.tutorChangePending}`}
        />
        <MetricCard
          title="Paused subscriptions"
          value={stats.pausedSubscriptions}
          icon={PauseCircle}
          trend={<TrendBadge direction="up" label="+2" />}
        />
        <MetricCard
          title="Refund requests"
          value={stats.refundRequests}
          icon={DollarSign}
          subtitle={`${stats.refundsApproved} approved`}
        />
      </div>

      {/* ================================================================ */}
      {/* SECTION 5 — ADDITIONAL CHARTS */}
      {/* ================================================================ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grade Distribution — Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Students by Grade / Year</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                  {gradeDistribution.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={GRADE_COLORS[idx % GRADE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 States — Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 States</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stateDistribution}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 50, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 12 }} width={45} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
                  {stateDistribution.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={STATE_COLORS[idx % STATE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================ */}
      {/* SECTION 6 — STUDENT GROWTH TREND (Dual Axis) */}
      {/* ================================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Growth & Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="students" name="Students" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar yAxisId="right" dataKey="revenue" name="Revenue (AUD)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* SECTION 7 — WHY THIS MATTERS */}
      {/* ================================================================ */}
      <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                Why this matters
              </h3>
              <p className="text-sm leading-relaxed text-indigo-600/80 dark:text-indigo-400/80">
                Tracking these metrics allows us to proactively address churn, optimize tutor
                allocation, and ensure financial health. By monitoring retention signals early, we
                can intervene before a student leaves.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-500">
                This feeds:
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "Churn Analysis",
                  "Retention Rate",
                  "ARPA",
                  "Capacity Planning",
                  "Quality Risk Assessment",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* SECTION 8 — QUICK ACTIONS */}
      {/* ================================================================ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href="/support/current">
            <UserPlus className="mr-2 h-4 w-4 text-blue-600" />
            <div className="text-left">
              <p className="text-sm font-medium">Add Current Student</p>
              <p className="text-xs text-muted-foreground">Enroll a new active student</p>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href="/support/followup">
            <Calendar className="mr-2 h-4 w-4 text-orange-600" />
            <div className="text-left">
              <p className="text-sm font-medium">Schedule Follow-Up</p>
              <p className="text-xs text-muted-foreground">Create a follow-up task</p>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href="/support/leftout">
            <UserMinus className="mr-2 h-4 w-4 text-red-600" />
            <div className="text-left">
              <p className="text-sm font-medium">Record Left-Out</p>
              <p className="text-xs text-muted-foreground">Log inactive student</p>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href="/support">
            <Users className="mr-2 h-4 w-4 text-purple-600" />
            <div className="text-left">
              <p className="text-sm font-medium">View All Students</p>
              <p className="text-xs text-muted-foreground">Full student directory</p>
            </div>
          </Link>
        </Button>
      </div>

      {/* ================================================================ */}
      {/* ALERT BOX */}
      {/* ================================================================ */}
      {stats.complaintsRaised > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Attention Required
              </h3>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• {stats.complaintsRaised} open complaints — {stats.complaintsResolved} resolved.</li>
                <li>• {stats.pausedSubscriptions} paused subscriptions need review.</li>
                <li>• Retention rate is being monitored — check recent left-outs.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ======================================================================
// Reusable Components
// ======================================================================

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