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

type Period = "all" | "today" | "weekly" | "monthly" | "yearly";

interface DashboardStats {
  activeStudents: number;
  newStudentsStarted: number;
  studentsStopped: number;
  reactivatedStudents: number;
  onBreakStudents: number;
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

const PIE_COLORS = ["#4f46e5", "#e5e7eb"];
const PACKAGE_COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc"];
const GRADE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];
const STATE_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"];

const emptyStats: DashboardStats = {
  activeStudents: 0,
  newStudentsStarted: 0,
  studentsStopped: 0,
  reactivatedStudents: 0,
  onBreakStudents: 0,
  totalLessonsDelivered: 0,
  missedCancelledLessons: 0,
  avgLessonsPerStudent: 0,
  avgLessonsPerTutor: 0,
  netActiveStudents: 0,

  totalRevenue: 0,
  upsellRevenue: 0,
  crossSellsRevenue: 0,
  crossSellTransactions: 0,
  siblingEnrollment: 0,
  arpu: 0,

  activeTutors: 0,
  onboardingTutors: 0,
  totalAvailableHours: 0,
  totalHoursTaught: 0,
  utilizationPercent: 0,

  complaintsRaised: 0,
  complaintsResolved: 0,
  repeatedComplaints: 0,
  tutorChangeRequests: 0,
  tutorChangePending: 0,
  pausedSubscriptions: 0,
  refundRequests: 0,
  refundsApproved: 0,
};

function getStartDate(period: Period) {
  const now = new Date();

  if (period === "all") return null;

  if (period === "today") {
    now.setHours(0, 0, 0, 0);
    return now;
  }

  if (period === "weekly") {
    now.setDate(now.getDate() - 7);
    now.setHours(0, 0, 0, 0);
    return now;
  }

  if (period === "monthly") {
    now.setMonth(now.getMonth() - 1);
    now.setHours(0, 0, 0, 0);
    return now;
  }

  if (period === "yearly") {
    now.setFullYear(now.getFullYear() - 1);
    now.setHours(0, 0, 0, 0);
    return now;
  }

  return null;
}

function inPeriod(dateValue: string | null | undefined, startDate: Date | null) {
  if (!dateValue) return false;
  if (!startDate) return true;

  const date = new Date(dateValue);
  return date >= startDate;
}

function sumRecordValues(value: unknown): number {
  if (!value || typeof value !== "object") return 0;

  return Object.values(value as Record<string, unknown>).reduce<number>(
    (sum: number, item: unknown) => {
      const num = Number(item || 0);
      return sum + (Number.isFinite(num) ? num : 0);
    },
    0
  );
}

function monthLabel(dateValue: string | null | undefined) {
  if (!dateValue) return "Unknown";
  const date = new Date(dateValue);
  return date.toLocaleString("en-US", { month: "short" });
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [packageMix, setPackageMix] = useState<PackageMixItem[]>([]);
  const [prepaidPartial, setPrepaidPartial] = useState<PrepaidPartialItem[]>([
    { name: "Prepaid", value: 75 },
    { name: "Partial", value: 25 },
  ]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistributionItem[]>([]);
  const [stateDistribution, setStateDistribution] = useState<StateDistributionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");

  const fetchDashboardData = async (selectedPeriod: Period) => {
    try {
      setLoading(true);

      const startDate = getStartDate(selectedPeriod);

      const [
        studentsRes,
        leftOutRes,
        followUpRes,
        classRecordsRes,
        teachersRes,
      ] = await Promise.all([
        supabase
          .from("current_students")
          .select("*")
          .is("deleted_at", null),

        supabase
          .from("leftout_tracker")
          .select("*"),

        supabase
          .from("followup_tracker")
          .select("*"),

        supabase
          .from("class_portal_records")
          .select("date_iso,data"),

        supabase
          .from("class_portal_teachers")
          .select("*"),
      ]);

      const students = studentsRes.data || [];
      const leftOuts = leftOutRes.data || [];
      const followUps = followUpRes.data || [];
      const classRecords = classRecordsRes.data || [];
      const teachers = teachersRes.data || [];

      const activeStudents = students.filter(
        (s: any) => (s.status || "active") === "active" || s.status === "reactivated"
      );

      const onBreakStudents = students.filter((s: any) => s.status === "on_break");

      const newStudentsStarted = students.filter((s: any) =>
        inPeriod(s.start_date, startDate)
      );

      const reactivatedStudents = students.filter((s: any) =>
        inPeriod(s.reactivated_at, startDate)
      );

      const studentsStopped = leftOuts.filter((s: any) =>
        inPeriod(s.leaving_date || s.created_at, startDate)
      );

      const periodClassRecords = classRecords.filter((r: any) =>
        inPeriod(r.date_iso, startDate)
      );

      const totalLessonsDelivered = periodClassRecords.reduce((sum: number, row: any) => {
        return sum + sumRecordValues(row.data?.completed);
      }, 0);

      const missedCancelledLessons = periodClassRecords.reduce((sum: number, row: any) => {
        return sum + sumRecordValues(row.data?.cancelled);
      }, 0);

      const activeTutors = teachers.filter((t: any) => t.is_active !== false);

      const totalClassesPerWeek = activeStudents.reduce((sum: number, student: any) => {
        return sum + Number(student.classes_per_week || 0);
      }, 0);

      const avgLessonsPerStudent =
        activeStudents.length > 0
          ? Number((totalClassesPerWeek / activeStudents.length).toFixed(1))
          : 0;

      const avgLessonsPerTutor =
        activeTutors.length > 0
          ? Number((totalLessonsDelivered / activeTutors.length).toFixed(1))
          : 0;

      const netActiveStudents = activeStudents.length - studentsStopped.length;

      const gradeMap: Record<string, number> = {};
      activeStudents.forEach((s: any) => {
        const grade = s.grade_year || "Unknown";
        gradeMap[grade] = (gradeMap[grade] || 0) + 1;
      });

      setGradeDistribution(
        Object.entries(gradeMap).map(([grade, count]) => ({ grade, count }))
      );

      const stateMap: Record<string, number> = {};
      activeStudents.forEach((s: any) => {
        const state = s.state || "Unknown";
        stateMap[state] = (stateMap[state] || 0) + 1;
      });

      setStateDistribution(
        Object.entries(stateMap)
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );

      const packageMap: Record<string, number> = {};
      activeStudents.forEach((s: any) => {
        const plan =
          s.learning_plan ||
          `${Number(s.classes_per_week || 0)}x/week` ||
          "Unknown";

        packageMap[plan] = (packageMap[plan] || 0) + 1;
      });

      const packageTotal = Object.values(packageMap).reduce((a, b) => a + b, 0);

      setPackageMix(
        Object.entries(packageMap).map(([name, count]) => ({
          name,
          percentage: packageTotal > 0 ? Number(((count / packageTotal) * 100).toFixed(1)) : 0,
        }))
      );

      const trendMap: Record<string, { students: number; revenue: number }> = {};

      students.forEach((s: any) => {
        const label = monthLabel(s.start_date);
        if (!trendMap[label]) trendMap[label] = { students: 0, revenue: 0 };
        trendMap[label].students += 1;
      });

      setTrendData(
        Object.entries(trendMap).map(([label, value]) => ({
          label,
          students: value.students,
          revenue: value.revenue,
        }))
      );

      const complaintsRaised = followUps.length;
      const complaintsResolved = followUps.filter((f: any) =>
        String(f.reason_for_status || "").toLowerCase().includes("resolved")
      ).length;

      const tutorChangeRequests = followUps.filter((f: any) =>
        String(f.reason_for_status || "").toLowerCase().includes("tutor")
      ).length;

      const pausedSubscriptions = onBreakStudents.length;

      setStats({
        activeStudents: activeStudents.length,
        newStudentsStarted: newStudentsStarted.length,
        studentsStopped: studentsStopped.length,
        reactivatedStudents: reactivatedStudents.length,
        onBreakStudents: onBreakStudents.length,
        totalLessonsDelivered,
        missedCancelledLessons,
        avgLessonsPerStudent,
        avgLessonsPerTutor,
        netActiveStudents,

        // Keep revenue fields ready for your future revenue table.
        totalRevenue: 0,
        upsellRevenue: 0,
        crossSellsRevenue: 0,
        crossSellTransactions: 0,
        siblingEnrollment: 0,
        arpu: 0,

        activeTutors: activeTutors.length,
        onboardingTutors: teachers.filter((t: any) => t.is_active === false).length,
        totalAvailableHours: activeTutors.length * 30,
        totalHoursTaught: totalLessonsDelivered,
        utilizationPercent:
          activeTutors.length > 0
            ? Number(((totalLessonsDelivered / (activeTutors.length * 30)) * 100).toFixed(1))
            : 0,

        complaintsRaised,
        complaintsResolved,
        repeatedComplaints: 0,
        tutorChangeRequests,
        tutorChangePending: tutorChangeRequests,
        pausedSubscriptions,
        refundRequests: 0,
        refundsApproved: 0,
      });

      setLastUpdated(new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(period);
  }, [period]);

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
      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${bg} ${text}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview Dashboard</h1>
          <p className="text-muted-foreground">
            Student lifecycle, lessons, tutor capacity & retention — all in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Last updated: {lastUpdated}</span>

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

      <SectionTitle icon={Users} title="Student & Delivery Stats" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Active students"
          value={stats.activeStudents.toLocaleString()}
          icon={Users}
          trend={<TrendBadge direction="neutral" label="Live" />}
        />

        <MetricCard
          title="New students started"
          value={stats.newStudentsStarted}
          icon={UserPlus}
          trend={<TrendBadge direction="up" label="From current students" />}
        />

        <MetricCard
          title="Students stopped"
          value={stats.studentsStopped}
          icon={UserMinus}
          trend={<TrendBadge direction="down" label="Left-out" />}
        />

        <MetricCard
          title="On break"
          value={stats.onBreakStudents}
          icon={PauseCircle}
          trend={<TrendBadge direction="neutral" label="Paused" />}
        />

        <MetricCard
          title="Reactivated students"
          value={stats.reactivatedStudents}
          icon={Repeat}
          trend={<TrendBadge direction="up" label="Back after break" />}
        />

        <MetricCard
          title="Total lessons delivered"
          value={stats.totalLessonsDelivered.toLocaleString()}
          icon={BookOpen}
          trend={<TrendBadge direction="up" label="From class records" />}
          highlight
        />

        <MetricCard
          title="Missed / cancelled"
          value={stats.missedCancelledLessons}
          icon={AlertCircle}
          trend={<TrendBadge direction="down" label="Cancelled" />}
        />

        <MetricCard
          title="Avg lessons / student"
          value={stats.avgLessonsPerStudent}
          icon={Activity}
          subtitle="Based on package/classes per week"
        />

        <MetricCard
          title="Avg lessons / tutor"
          value={stats.avgLessonsPerTutor}
          icon={Target}
          subtitle="From delivered lessons"
        />

        <MetricCard
          title="Net active students"
          value={stats.netActiveStudents.toLocaleString()}
          icon={Users}
          subtitle="Active minus drop-offs"
          trend={<TrendBadge direction="neutral" label="Live" />}
          variant="outline"
        />
      </div>

      <SectionTitle icon={DollarSign} title="Revenue & Performance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Total revenue (AUD)"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          highlight
        >
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            <TrendBadge direction="neutral" label="Connect revenue table" />
          </div>
        </MetricCard>

        <MetricCard title="Upsell" value={`$${stats.upsellRevenue.toLocaleString()}`} icon={TrendingUp} />
        <MetricCard title="Cross sells" value={`$${stats.crossSellsRevenue.toLocaleString()}`} icon={ShoppingCart} />
        <MetricCard title="Sibling enrollment" value={stats.siblingEnrollment} icon={Heart} />
        <MetricCard title="ARPU" value={`$${stats.arpu.toFixed(2)}`} icon={BarChart3} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Package Mix (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={packageMix} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={90} />
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

      <SectionTitle icon={Clock} title="Tutor Capacity" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active tutors"
          value={stats.activeTutors}
          icon={Users}
          subtitle={`${stats.onboardingTutors} inactive / onboarding`}
        />

        <MetricCard
          title="Total available hours"
          value={stats.totalAvailableHours.toLocaleString()}
          icon={Calendar}
          subtitle="Estimated"
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
          subtitle="Based on delivered lessons"
        >
          <div className="mt-3">
            <div className="h-2.5 w-full rounded-full bg-muted">
              <div
                className="h-2.5 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(stats.utilizationPercent, 100)}%` }}
              />
            </div>
          </div>
        </MetricCard>
      </div>

      <SectionTitle icon={ShieldAlert} title="Retention Signals" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Follow-up records" value={stats.complaintsRaised} icon={AlertCircle} />
        <MetricCard title="Resolved follow-ups" value={stats.complaintsResolved} icon={Activity} />
        <MetricCard title="Repeated complaints" value={stats.repeatedComplaints} icon={AlertCircle} variant="warning" />
        <MetricCard title="Tutor change requests" value={stats.tutorChangeRequests} icon={RefreshCw} />
        <MetricCard title="Paused subscriptions" value={stats.pausedSubscriptions} icon={PauseCircle} />
        <MetricCard title="Refund requests" value={stats.refundRequests} icon={DollarSign} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 States</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateDistribution} layout="vertical" margin={{ top: 0, right: 20, left: 50, bottom: 0 }}>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Growth Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="students" name="New Students" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href="/dashboard/support/current-students">
            <UserPlus className="mr-2 h-4 w-4 text-blue-600" />
            <div className="text-left">
              <p className="text-sm font-medium">Add Current Student</p>
              <p className="text-xs text-muted-foreground">Enroll or update student</p>
            </div>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href="/dashboard/support/schedule">
            <UserMinus className="mr-2 h-4 w-4 text-red-600" />
            <div className="text-left">
              <p className="text-sm font-medium">Schedule</p>
              <p className="text-xs text-muted-foreground">Log inactive student</p>
            </div>
          </Link>
        </Button>
        

        <Button asChild variant="outline" className="h-auto justify-start py-3">
          <Link href="/dashboard/support/retention">
            <UserMinus className="mr-2 h-4 w-4 text-red-600" />
            <div className="text-left">
              <p className="text-sm font-medium">Retention</p>
              <p className="text-xs text-muted-foreground">Current-student retention</p>
            </div>
          </Link>
        </Button>


        
      </div>

      {(stats.complaintsRaised > 0 || stats.pausedSubscriptions > 0) && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Attention Required
              </h3>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>• {stats.complaintsRaised} follow-up records need review.</li>
                <li>• {stats.pausedSubscriptions} students are currently on break.</li>
                <li>• Retention rate is being monitored from left-out records.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
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