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

// app/dashboard/page.tsx
// "use client";

// import { useEffect, useMemo, useState } from "react";
// import {
//   Activity,
//   AlertCircle,
//   ArrowDownRight,
//   ArrowUpRight,
//   BarChart3,
//   BookOpen,
//   Calendar,
//   CheckCircle2,
//   Clock,
//   DollarSign,
//   GraduationCap,
//   Heart,
//   Minus,
//   PauseCircle,
//   PieChart as PieChartIcon,
//   RefreshCw,
//   Repeat,
//   ShieldAlert,
//   ShoppingCart,
//   Target,
//   TrendingDown,
//   TrendingUp,
//   UserMinus,
//   UserPlus,
//   Users,
//   WalletCards,
// } from "lucide-react";
// import {
//   Area,
//   AreaChart,
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   Legend,
//   Line,
//   LineChart,
//   Pie,
//   PieChart,
//   PolarAngleAxis,
//   PolarGrid,
//   Radar,
//   RadarChart,
//   RadialBar,
//   RadialBarChart,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from "recharts";

// import { supabase } from "@/lib/supabase/client";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// // Dashboard content only. Keep your existing app sidebar/header/theme toggle in layout.
// // Light mode background is white. Dark mode follows your existing dark class toggle.

// type Period = "all" | "today" | "weekly" | "monthly" | "yearly";
// type TrendDirection = "up" | "down" | "neutral";

// interface DashboardStats {
//   activeStudents: number;
//   newStudentsStarted: number;
//   studentsStopped: number;
//   reactivatedStudents: number;
//   onBreakStudents: number;
//   totalLessonsDelivered: number;
//   missedCancelledLessons: number;
//   avgLessonsPerStudent: number;
//   avgLessonsPerTutor: number;
//   netActiveStudents: number;

//   totalRevenue: number;
//   upsellRevenue: number;
//   crossSellsRevenue: number;
//   crossSellTransactions: number;
//   siblingEnrollment: number;
//   arpu: number;

//   activeTutors: number;
//   onboardingTutors: number;
//   totalAvailableHours: number;
//   totalHoursTaught: number;
//   utilizationPercent: number;

//   complaintsRaised: number;
//   complaintsResolved: number;
//   repeatedComplaints: number;
//   tutorChangeRequests: number;
//   tutorChangePending: number;
//   pausedSubscriptions: number;
//   refundRequests: number;
//   refundsApproved: number;
// }

// interface TrendDataPoint {
//   label: string;
//   students: number;
//   revenue: number;
//   lessons: number;
//   stopped: number;
// }

// interface PackageMixItem {
//   name: string;
//   percentage: number;
// }

// interface PrepaidPartialItem {
//   name: string;
//   value: number;
// }

// interface GradeDistributionItem {
//   grade: string;
//   count: number;
// }

// interface StateDistributionItem {
//   state: string;
//   count: number;
// }

// const CHART = {
//   blue: "#2563eb",
//   sky: "#0ea5e9",
//   green: "#10b981",
//   emerald: "#059669",
//   amber: "#f59e0b",
//   red: "#ef4444",
//   violet: "#8b5cf6",
//   fuchsia: "#d946ef",
//   cyan: "#06b6d4",
//   slate: "#64748b",
// };

// const CHART_COLORS = [CHART.blue, CHART.green, CHART.amber, CHART.red, CHART.violet, CHART.cyan, CHART.fuchsia];
// const PACKAGE_COLORS = [CHART.blue, CHART.violet, CHART.sky, CHART.green, CHART.amber];
// const STATE_COLORS = [CHART.green, CHART.emerald, CHART.cyan, CHART.sky, CHART.blue];
// const GRADE_COLORS = [CHART.blue, CHART.amber, CHART.green, CHART.red, CHART.violet, CHART.fuchsia];

// const emptyStats: DashboardStats = {
//   activeStudents: 0,
//   newStudentsStarted: 0,
//   studentsStopped: 0,
//   reactivatedStudents: 0,
//   onBreakStudents: 0,
//   totalLessonsDelivered: 0,
//   missedCancelledLessons: 0,
//   avgLessonsPerStudent: 0,
//   avgLessonsPerTutor: 0,
//   netActiveStudents: 0,

//   totalRevenue: 0,
//   upsellRevenue: 0,
//   crossSellsRevenue: 0,
//   crossSellTransactions: 0,
//   siblingEnrollment: 0,
//   arpu: 0,

//   activeTutors: 0,
//   onboardingTutors: 0,
//   totalAvailableHours: 0,
//   totalHoursTaught: 0,
//   utilizationPercent: 0,

//   complaintsRaised: 0,
//   complaintsResolved: 0,
//   repeatedComplaints: 0,
//   tutorChangeRequests: 0,
//   tutorChangePending: 0,
//   pausedSubscriptions: 0,
//   refundRequests: 0,
//   refundsApproved: 0,
// };

// const fallbackTrendData: TrendDataPoint[] = [
//   { label: "Jan", students: 28, revenue: 42000, lessons: 310, stopped: 4 },
//   { label: "Feb", students: 34, revenue: 47500, lessons: 355, stopped: 6 },
//   { label: "Mar", students: 31, revenue: 46200, lessons: 338, stopped: 5 },
//   { label: "Apr", students: 42, revenue: 53600, lessons: 392, stopped: 7 },
//   { label: "May", students: 47, revenue: 58900, lessons: 428, stopped: 6 },
//   { label: "Jun", students: 51, revenue: 62400, lessons: 470, stopped: 8 },
// ];

// const fallbackPackageMix: PackageMixItem[] = [
//   { name: "1x/week", percentage: 20 },
//   { name: "2x/week", percentage: 35 },
//   { name: "3x/week", percentage: 30 },
//   { name: "4x/week", percentage: 15 },
// ];

// const fallbackGradeDistribution: GradeDistributionItem[] = [
//   { grade: "Year 2", count: 22 },
//   { grade: "Year 3", count: 35 },
//   { grade: "Year 4", count: 44 },
//   { grade: "Year 5", count: 51 },
//   { grade: "Year 6", count: 48 },
//   { grade: "Year 7", count: 31 },
// ];

// const fallbackStateDistribution: StateDistributionItem[] = [
//   { state: "NSW", count: 92 },
//   { state: "VIC", count: 74 },
//   { state: "QLD", count: 58 },
//   { state: "WA", count: 39 },
//   { state: "SA", count: 26 },
// ];

// const defaultPrepaidPartial: PrepaidPartialItem[] = [
//   { name: "Prepaid", value: 75 },
//   { name: "Partial", value: 25 },
// ];

// function getStartDate(period: Period) {
//   const now = new Date();

//   if (period === "all") return null;

//   if (period === "today") {
//     now.setHours(0, 0, 0, 0);
//     return now;
//   }

//   if (period === "weekly") {
//     now.setDate(now.getDate() - 7);
//     now.setHours(0, 0, 0, 0);
//     return now;
//   }

//   if (period === "monthly") {
//     now.setMonth(now.getMonth() - 1);
//     now.setHours(0, 0, 0, 0);
//     return now;
//   }

//   if (period === "yearly") {
//     now.setFullYear(now.getFullYear() - 1);
//     now.setHours(0, 0, 0, 0);
//     return now;
//   }

//   return null;
// }

// function inPeriod(dateValue: string | null | undefined, startDate: Date | null) {
//   if (!dateValue) return false;
//   if (!startDate) return true;

//   const date = new Date(dateValue);
//   return date >= startDate;
// }

// function sumRecordValues(value: unknown): number {
//   if (!value || typeof value !== "object") return 0;

//   return Object.values(value as Record<string, unknown>).reduce<number>((sum, item) => {
//     const num = Number(item || 0);
//     return sum + (Number.isFinite(num) ? num : 0);
//   }, 0);
// }

// function monthLabel(dateValue: string | null | undefined) {
//   if (!dateValue) return "Unknown";
//   const date = new Date(dateValue);
//   return date.toLocaleString("en-US", { month: "short" });
// }

// function formatMoney(value: number) {
//   return new Intl.NumberFormat("en-AU", {
//     style: "currency",
//     currency: "AUD",
//     maximumFractionDigits: 0,
//   }).format(value || 0);
// }

// function safePercent(part: number, total: number) {
//   if (!total) return 0;
//   return Number(((part / total) * 100).toFixed(1));
// }

// function BaseCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
//   return (
//     <Card className={`rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
//       {children}
//     </Card>
//   );
// }

// function SectionTitle({
//   icon: Icon,
//   title,
//   subtitle,
// }: {
//   icon: React.ElementType;
//   title: string;
//   subtitle: string;
// }) {
//   return (
//     <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
//       <div>
//         <div className="flex items-center gap-2">
//           <span className="rounded-2xl bg-blue-50 p-2 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
//             <Icon className="h-5 w-5" />
//           </span>
//           <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-2xl">{title}</h2>
//         </div>
//         <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
//       </div>
//     </div>
//   );
// }

// function TrendBadge({ direction, label }: { direction: TrendDirection; label: string }) {
//   const config = {
//     up: {
//       bg: "bg-emerald-50 dark:bg-emerald-500/10",
//       text: "text-emerald-700 dark:text-emerald-300",
//       icon: ArrowUpRight,
//     },
//     down: {
//       bg: "bg-red-50 dark:bg-red-500/10",
//       text: "text-red-700 dark:text-red-300",
//       icon: ArrowDownRight,
//     },
//     neutral: {
//       bg: "bg-slate-100 dark:bg-slate-800",
//       text: "text-slate-600 dark:text-slate-300",
//       icon: Minus,
//     },
//   };

//   const { bg, text, icon: Icon } = config[direction];

//   return (
//     <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${bg} ${text}`}>
//       <Icon className="h-3 w-3" />
//       {label}
//     </span>
//   );
// }

// function MetricCard({
//   title,
//   value,
//   icon: Icon,
//   subtitle,
//   trend,
//   tone = "blue",
//   highlight = false,
// }: {
//   title: string;
//   value: string | number;
//   icon: React.ElementType;
//   subtitle?: string;
//   trend?: React.ReactNode;
//   tone?: "blue" | "green" | "red" | "amber" | "violet" | "slate";
//   highlight?: boolean;
// }) {
//   const tones = {
//     blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
//     green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
//     red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
//     amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
//     violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
//     slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
//   };

//   return (
//     <BaseCard className={`${highlight ? "ring-1 ring-blue-200 dark:ring-blue-800" : ""} transition hover:-translate-y-0.5 hover:shadow-md`}>
//       <CardContent className="p-5">
//         <div className="flex items-start justify-between gap-4">
//           <div className="min-w-0 flex-1">
//             <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
//             <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
//             {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
//             {trend ? <div className="mt-3">{trend}</div> : null}
//           </div>
//           <div className={`rounded-2xl p-3 ${tones[tone]}`}>
//             <Icon className="h-5 w-5" />
//           </div>
//         </div>
//       </CardContent>
//     </BaseCard>
//   );
// }

// function MiniSparkCard({
//   title,
//   value,
//   icon: Icon,
//   children,
// }: {
//   title: string;
//   value: string | number;
//   icon: React.ElementType;
//   children: React.ReactNode;
// }) {
//   return (
//     <BaseCard>
//       <CardContent className="p-5">
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
//             <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
//           </div>
//           <div className="rounded-2xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
//             <Icon className="h-5 w-5" />
//           </div>
//         </div>
//         <div className="mt-3 h-20">{children}</div>
//       </CardContent>
//     </BaseCard>
//   );
// }

// function ProgressRow({ label, value, right }: { label: string; value: number; right: string }) {
//   return (
//     <div className="space-y-2">
//       <div className="flex items-center justify-between gap-3 text-sm">
//         <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
//         <span className="text-slate-500 dark:text-slate-400">{right}</span>
//       </div>
//       <Progress value={Math.min(value, 100)} className="h-2 bg-slate-200 dark:bg-slate-800" />
//     </div>
//   );
// }

// function TableWrap({ children }: { children: React.ReactNode }) {
//   return <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">{children}</div>;
// }

// function Th({ children }: { children: React.ReactNode }) {
//   return <th className="whitespace-nowrap bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">{children}</th>;
// }

// function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
//   return <td className={`whitespace-nowrap border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800 ${className}`}>{children}</td>;
// }

// export default function AdminDashboardPage() {
//   const [period, setPeriod] = useState<Period>("all");
//   const [stats, setStats] = useState<DashboardStats>(emptyStats);
//   const [trendData, setTrendData] = useState<TrendDataPoint[]>(fallbackTrendData);
//   const [packageMix, setPackageMix] = useState<PackageMixItem[]>(fallbackPackageMix);
//   const [prepaidPartial] = useState<PrepaidPartialItem[]>(defaultPrepaidPartial);
//   const [gradeDistribution, setGradeDistribution] = useState<GradeDistributionItem[]>(fallbackGradeDistribution);
//   const [stateDistribution, setStateDistribution] = useState<StateDistributionItem[]>(fallbackStateDistribution);
//   const [loading, setLoading] = useState(false);
//   const [lastUpdated, setLastUpdated] = useState<string>("Just now");

//   const fetchDashboardData = async (selectedPeriod: Period) => {
//     try {
//       setLoading(true);

//       const startDate = getStartDate(selectedPeriod);

//       const [studentsRes, leftOutRes, followUpRes, classRecordsRes, teachersRes] = await Promise.all([
//         supabase.from("current_students").select("*").is("deleted_at", null),
//         supabase.from("leftout_tracker").select("*"),
//         supabase.from("followup_tracker").select("*"),
//         supabase.from("class_portal_records").select("date_iso,data"),
//         supabase.from("class_portal_teachers").select("*"),
//       ]);

//       const students = studentsRes.data || [];
//       const leftOuts = leftOutRes.data || [];
//       const followUps = followUpRes.data || [];
//       const classRecords = classRecordsRes.data || [];
//       const teachers = teachersRes.data || [];

//       const activeStudents = students.filter((s: any) => (s.status || "active") === "active" || s.status === "reactivated");
//       const onBreakStudents = students.filter((s: any) => s.status === "on_break");
//       const newStudentsStarted = students.filter((s: any) => inPeriod(s.start_date, startDate));
//       const reactivatedStudents = students.filter((s: any) => inPeriod(s.reactivated_at, startDate));
//       const studentsStopped = leftOuts.filter((s: any) => inPeriod(s.leaving_date || s.created_at, startDate));
//       const periodClassRecords = classRecords.filter((r: any) => inPeriod(r.date_iso, startDate));

//       const totalLessonsDelivered = periodClassRecords.reduce((sum: number, row: any) => sum + sumRecordValues(row.data?.completed), 0);
//       const missedCancelledLessons = periodClassRecords.reduce((sum: number, row: any) => sum + sumRecordValues(row.data?.cancelled), 0);
//       const activeTutors = teachers.filter((t: any) => t.is_active !== false);
//       const totalClassesPerWeek = activeStudents.reduce((sum: number, student: any) => sum + Number(student.classes_per_week || 0), 0);
//       const avgLessonsPerStudent = activeStudents.length > 0 ? Number((totalClassesPerWeek / activeStudents.length).toFixed(1)) : 0;
//       const avgLessonsPerTutor = activeTutors.length > 0 ? Number((totalLessonsDelivered / activeTutors.length).toFixed(1)) : 0;
//       const netActiveStudents = activeStudents.length - studentsStopped.length;

//       const gradeMap: Record<string, number> = {};
//       activeStudents.forEach((s: any) => {
//         const grade = s.grade_year || "Unknown";
//         gradeMap[grade] = (gradeMap[grade] || 0) + 1;
//       });
//       const nextGradeDistribution = Object.entries(gradeMap).map(([grade, count]) => ({ grade, count }));
//       setGradeDistribution(nextGradeDistribution.length ? nextGradeDistribution : fallbackGradeDistribution);

//       const stateMap: Record<string, number> = {};
//       activeStudents.forEach((s: any) => {
//         const state = s.state || "Unknown";
//         stateMap[state] = (stateMap[state] || 0) + 1;
//       });
//       const nextStateDistribution = Object.entries(stateMap)
//         .map(([state, count]) => ({ state, count }))
//         .sort((a, b) => b.count - a.count)
//         .slice(0, 5);
//       setStateDistribution(nextStateDistribution.length ? nextStateDistribution : fallbackStateDistribution);

//       const packageMap: Record<string, number> = {};
//       activeStudents.forEach((s: any) => {
//         const weeklyCount = Number(s.classes_per_week || 0);
//         const plan = s.learning_plan || (weeklyCount ? `${weeklyCount}x/week` : "Unknown");
//         packageMap[plan] = (packageMap[plan] || 0) + 1;
//       });
//       const packageTotal = Object.values(packageMap).reduce((a, b) => a + b, 0);
//       const nextPackageMix = Object.entries(packageMap).map(([name, count]) => ({
//         name,
//         percentage: packageTotal > 0 ? Number(((count / packageTotal) * 100).toFixed(1)) : 0,
//       }));
//       setPackageMix(nextPackageMix.length ? nextPackageMix : fallbackPackageMix);

//       const trendMap: Record<string, { students: number; revenue: number; lessons: number; stopped: number }> = {};
//       students.forEach((s: any) => {
//         const label = monthLabel(s.start_date);
//         if (!trendMap[label]) trendMap[label] = { students: 0, revenue: 0, lessons: 0, stopped: 0 };
//         trendMap[label].students += 1;
//       });
//       leftOuts.forEach((s: any) => {
//         const label = monthLabel(s.leaving_date || s.created_at);
//         if (!trendMap[label]) trendMap[label] = { students: 0, revenue: 0, lessons: 0, stopped: 0 };
//         trendMap[label].stopped += 1;
//       });
//       classRecords.forEach((row: any) => {
//         const label = monthLabel(row.date_iso);
//         if (!trendMap[label]) trendMap[label] = { students: 0, revenue: 0, lessons: 0, stopped: 0 };
//         trendMap[label].lessons += sumRecordValues(row.data?.completed);
//       });
//       const nextTrendData = Object.entries(trendMap).map(([label, value]) => ({ label, ...value }));
//       setTrendData(nextTrendData.length ? nextTrendData : fallbackTrendData);

//       const complaintsRaised = followUps.length;
//       const complaintsResolved = followUps.filter((f: any) => String(f.reason_for_status || "").toLowerCase().includes("resolved")).length;
//       const tutorChangeRequests = followUps.filter((f: any) => String(f.reason_for_status || "").toLowerCase().includes("tutor")).length;
//       const repeatedComplaints = Math.max(0, complaintsRaised - new Set(followUps.map((f: any) => f.student_id || f.student_name || f.id)).size);
//       const pausedSubscriptions = onBreakStudents.length;

//       setStats({
//         activeStudents: activeStudents.length,
//         newStudentsStarted: newStudentsStarted.length,
//         studentsStopped: studentsStopped.length,
//         reactivatedStudents: reactivatedStudents.length,
//         onBreakStudents: onBreakStudents.length,
//         totalLessonsDelivered,
//         missedCancelledLessons,
//         avgLessonsPerStudent,
//         avgLessonsPerTutor,
//         netActiveStudents,

//         totalRevenue: 0,
//         upsellRevenue: 0,
//         crossSellsRevenue: 0,
//         crossSellTransactions: 0,
//         siblingEnrollment: 0,
//         arpu: 0,

//         activeTutors: activeTutors.length,
//         onboardingTutors: teachers.filter((t: any) => t.is_active === false).length,
//         totalAvailableHours: activeTutors.length * 30,
//         totalHoursTaught: totalLessonsDelivered,
//         utilizationPercent: activeTutors.length > 0 ? Number(((totalLessonsDelivered / (activeTutors.length * 30)) * 100).toFixed(1)) : 0,

//         complaintsRaised,
//         complaintsResolved,
//         repeatedComplaints,
//         tutorChangeRequests,
//         tutorChangePending: tutorChangeRequests,
//         pausedSubscriptions,
//         refundRequests: 0,
//         refundsApproved: 0,
//       });

//       setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
//     } catch (error) {
//       console.error("Error fetching dashboard data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData(period);
//   }, [period]);

//   const retentionRate = useMemo(() => {
//     const total = stats.activeStudents + stats.studentsStopped;
//     return total ? Number(((stats.activeStudents / total) * 100).toFixed(1)) : 0;
//   }, [stats.activeStudents, stats.studentsStopped]);

//   const resolutionRate = useMemo(() => safePercent(stats.complaintsResolved, stats.complaintsRaised), [stats.complaintsResolved, stats.complaintsRaised]);
//   const cancellationRate = useMemo(() => safePercent(stats.missedCancelledLessons, stats.totalLessonsDelivered + stats.missedCancelledLessons), [stats.missedCancelledLessons, stats.totalLessonsDelivered]);

//   const studentLifecycleData = useMemo(
//     () => [
//       { name: "Active", value: stats.activeStudents },
//       { name: "New", value: stats.newStudentsStarted },
//       { name: "Stopped", value: stats.studentsStopped },
//       { name: "On Break", value: stats.onBreakStudents },
//       { name: "Reactivated", value: stats.reactivatedStudents },
//     ],
//     [stats]
//   );

//   const lessonDeliveryData = useMemo(
//     () => [
//       { name: "Delivered", value: stats.totalLessonsDelivered },
//       { name: "Missed / Cancelled", value: stats.missedCancelledLessons },
//     ],
//     [stats.totalLessonsDelivered, stats.missedCancelledLessons]
//   );

//   const revenueCards = useMemo(
//     () => [
//       { label: "Revenue", value: stats.totalRevenue },
//       { label: "Upsell", value: stats.upsellRevenue },
//       { label: "Cross-sell", value: stats.crossSellsRevenue },
//       { label: "ARPU", value: stats.arpu },
//     ],
//     [stats.totalRevenue, stats.upsellRevenue, stats.crossSellsRevenue, stats.arpu]
//   );

//   const tutorRadar = useMemo(
//     () => [
//       { metric: "Utilization", value: Math.min(stats.utilizationPercent || 0, 100) },
//       { metric: "Available", value: safePercent(stats.totalAvailableHours, Math.max(stats.totalAvailableHours, stats.totalHoursTaught)) },
//       { metric: "Delivery", value: safePercent(stats.totalHoursTaught, Math.max(stats.totalAvailableHours, 1)) },
//       { metric: "Active Tutors", value: safePercent(stats.activeTutors, Math.max(stats.activeTutors + stats.onboardingTutors, 1)) },
//       { metric: "Avg/Tutor", value: Math.min((stats.avgLessonsPerTutor || 0) * 5, 100) },
//     ],
//     [stats]
//   );

//   const retentionHealth = useMemo(
//     () => [
//       { name: "Retention", value: retentionRate, fill: CHART.green },
//       { name: "Resolved", value: resolutionRate, fill: CHART.blue },
//       { name: "Cancellation", value: cancellationRate, fill: CHART.red },
//     ],
//     [retentionRate, resolutionRate, cancellationRate]
//   );

//   if (loading) {
//     return (
//       <div className="flex h-[80vh] items-center justify-center bg-white dark:bg-slate-950">
//         <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
//           <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
//           <p className="text-sm text-slate-600 dark:text-slate-400">Loading dashboard…</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8 bg-white p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-50 sm:p-6 lg:p-8">
//       <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
//         <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
//           <div>
//             <div className="mb-3 flex flex-wrap items-center gap-2">
//               <Badge className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600 dark:bg-blue-500">Overview</Badge>
//               <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">Last updated: {lastUpdated}</Badge>
//               <Badge variant="outline" className="rounded-full border-slate-200 dark:border-slate-700">Period: {period}</Badge>
//             </div>
//             <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Overview Dashboard</h1>
//             <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
//               Student lifecycle, lesson delivery, revenue performance, tutor capacity, retention signals, and business health charts in one dashboard.
//             </p>
//           </div>

//           <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//             <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
//               <SelectTrigger className="h-10 w-[150px] rounded-full border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
//                 <SelectValue placeholder="Select period" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Time</SelectItem>
//                 <SelectItem value="today">Today</SelectItem>
//                 <SelectItem value="weekly">This Week</SelectItem>
//                 <SelectItem value="monthly">This Month</SelectItem>
//                 <SelectItem value="yearly">This Year</SelectItem>
//               </SelectContent>
//             </Select>

//             <Button onClick={() => fetchDashboardData(period)} variant="outline" size="sm" className="h-10 rounded-full border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
//               <RefreshCw className="mr-2 h-4 w-4" />
//               Refresh
//             </Button>
//           </div>
//         </div>
//       </section>

//       <section className="space-y-5">
//         <SectionTitle icon={BarChart3} title="Executive Overview" subtitle="High-level business health and performance summary" />

//         <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           <MetricCard title="Active students" value={stats.activeStudents.toLocaleString()} icon={Users} tone="blue" trend={<TrendBadge direction="neutral" label="Live" />} />
//           <MetricCard title="Net active students" value={stats.netActiveStudents.toLocaleString()} icon={UserPlus} tone="green" subtitle="Active minus drop-offs" />
//           <MetricCard title="Total lessons delivered" value={stats.totalLessonsDelivered.toLocaleString()} icon={BookOpen} tone="violet" highlight subtitle="From class records" />
//           <MetricCard title="Retention rate" value={`${retentionRate}%`} icon={ShieldAlert} tone="green" subtitle="Active vs stopped students" />
//         </div>

//         <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Student & Lesson Growth Trend</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[340px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart data={trendData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
//                   <defs>
//                     <linearGradient id="studentsFill" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor={CHART.blue} stopOpacity={0.35} />
//                       <stop offset="95%" stopColor={CHART.blue} stopOpacity={0.03} />
//                     </linearGradient>
//                     <linearGradient id="lessonsFill" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor={CHART.green} stopOpacity={0.25} />
//                       <stop offset="95%" stopColor={CHART.green} stopOpacity={0.02} />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
//                   <XAxis dataKey="label" axisLine={false} tickLine={false} />
//                   <YAxis axisLine={false} tickLine={false} />
//                   <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
//                   <Legend />
//                   <Area type="monotone" dataKey="students" name="New Students" stroke={CHART.blue} strokeWidth={3} fill="url(#studentsFill)" />
//                   <Area type="monotone" dataKey="lessons" name="Lessons" stroke={CHART.green} strokeWidth={3} fill="url(#lessonsFill)" />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>

//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Business Health</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[340px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <RadialBarChart innerRadius="24%" outerRadius="92%" data={retentionHealth} startAngle={90} endAngle={-270}>
//                   <RadialBar dataKey="value" cornerRadius={10} background />
//                   <Legend iconSize={9} layout="vertical" verticalAlign="middle" align="right" />
//                   <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value: number) => `${value}%`} />
//                 </RadialBarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>
//         </div>
//       </section>

//       <section className="space-y-5">
//         <SectionTitle icon={Users} title="Student & Delivery Stats" subtitle="Student lifecycle, delivered classes, cancellations, and net movement" />

//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
//           <MetricCard title="Active students" value={stats.activeStudents.toLocaleString()} icon={Users} tone="blue" trend={<TrendBadge direction="neutral" label="Live" />} />
//           <MetricCard title="New students started" value={stats.newStudentsStarted} icon={UserPlus} tone="green" trend={<TrendBadge direction="up" label="Started" />} />
//           <MetricCard title="Students stopped" value={stats.studentsStopped} icon={UserMinus} tone="red" trend={<TrendBadge direction="down" label="Left-out" />} />
//           <MetricCard title="On break" value={stats.onBreakStudents} icon={PauseCircle} tone="amber" trend={<TrendBadge direction="neutral" label="Paused" />} />
//           <MetricCard title="Reactivated students" value={stats.reactivatedStudents} icon={Repeat} tone="violet" trend={<TrendBadge direction="up" label="Back" />} />
//           <MetricCard title="Total lessons delivered" value={stats.totalLessonsDelivered.toLocaleString()} icon={BookOpen} tone="blue" highlight />
//           <MetricCard title="Missed / cancelled" value={stats.missedCancelledLessons} icon={AlertCircle} tone="red" />
//           <MetricCard title="Avg lessons / student" value={stats.avgLessonsPerStudent} icon={Activity} tone="green" subtitle="Classes per active student" />
//           <MetricCard title="Avg lessons / tutor" value={stats.avgLessonsPerTutor} icon={Target} tone="violet" subtitle="Delivered per tutor" />
//           <MetricCard title="Net active students" value={stats.netActiveStudents.toLocaleString()} icon={Users} tone="slate" subtitle="Active minus drop-offs" />
//         </div>

//         <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Student Lifecycle Share</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[340px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie data={studentLifecycleData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={105} paddingAngle={4} label>
//                     {studentLifecycleData.map((entry, index) => (
//                       <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
//                   <Legend iconSize={9} />
//                 </PieChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>

//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Students Started vs Stopped</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[340px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={trendData} margin={{ top: 14, right: 12, left: -12, bottom: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
//                   <XAxis dataKey="label" axisLine={false} tickLine={false} />
//                   <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
//                   <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
//                   <Legend />
//                   <Bar dataKey="students" name="Started" fill={CHART.green} radius={[8, 8, 0, 0]} />
//                   <Bar dataKey="stopped" name="Stopped" fill={CHART.red} radius={[8, 8, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>
//         </div>
//       </section>

//       <section className="space-y-5">
//         <SectionTitle icon={DollarSign} title="Revenue & Performance" subtitle="Revenue, upsells, cross-sells, package mix, and payment quality" />

//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
//           <MetricCard title="Total revenue (AUD)" value={formatMoney(stats.totalRevenue)} icon={DollarSign} tone="green" highlight trend={<TrendBadge direction="neutral" label="Connect revenue table" />} />
//           <MetricCard title="Upsell" value={formatMoney(stats.upsellRevenue)} icon={TrendingUp} tone="blue" />
//           <MetricCard title="Cross sells" value={formatMoney(stats.crossSellsRevenue)} icon={ShoppingCart} tone="violet" />
//           <MetricCard title="Sibling enrollment" value={stats.siblingEnrollment} icon={Heart} tone="red" />
//           <MetricCard title="ARPU" value={formatMoney(stats.arpu)} icon={BarChart3} tone="amber" />
//         </div>

//         <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           {revenueCards.map((item, index) => (
//             <MiniSparkCard key={item.label} title={item.label} value={formatMoney(item.value)} icon={WalletCards}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart data={fallbackTrendData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
//                   <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[index % CHART_COLORS.length]} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </MiniSparkCard>
//           ))}
//         </div>

//         <div className="grid gap-4 xl:grid-cols-3">
//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Package Mix (%)</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[330px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={packageMix} layout="vertical" margin={{ top: 0, right: 20, left: 86, bottom: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
//                   <XAxis type="number" tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
//                   <YAxis type="category" dataKey="name" width={90} axisLine={false} tickLine={false} />
//                   <Tooltip formatter={(value: any) => `${value}%`} contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
//                   <Bar dataKey="percentage" radius={[0, 8, 8, 0]} barSize={28}>
//                     {packageMix.map((_, idx) => (
//                       <Cell key={`package-${idx}`} fill={PACKAGE_COLORS[idx % PACKAGE_COLORS.length]} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>

//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Prepaid vs Partial Payments</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[330px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie data={prepaidPartial} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={105} innerRadius={58} paddingAngle={4} label={({ name, value }) => `${name}: ${value}%`}>
//                     {prepaidPartial.map((_, idx) => (
//                       <Cell key={`payment-${idx}`} fill={idx === 0 ? CHART.green : CHART.amber} />
//                     ))}
//                   </Pie>
//                   <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
//                   <Legend />
//                 </PieChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>

//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Revenue Trend Preview</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[330px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={fallbackTrendData} margin={{ top: 14, right: 12, left: -12, bottom: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
//                   <XAxis dataKey="label" axisLine={false} tickLine={false} />
//                   <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v) / 1000}k`} />
//                   <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
//                   <Legend />
//                   <Line type="monotone" dataKey="revenue" name="Revenue" stroke={CHART.violet} strokeWidth={3} dot={{ r: 4 }} />
//                 </LineChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>
//         </div>
//       </section>

//       <section className="space-y-5">
//         <SectionTitle icon={Clock} title="Tutor Capacity" subtitle="Tutor availability, taught hours, utilization, and capacity health" />

//         <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           <MetricCard title="Active tutors" value={stats.activeTutors} icon={Users} tone="blue" subtitle={`${stats.onboardingTutors} inactive / onboarding`} />
//           <MetricCard title="Total available hours" value={stats.totalAvailableHours.toLocaleString()} icon={Calendar} tone="green" subtitle="Estimated at 30 hours per tutor" />
//           <MetricCard title="Total hours taught" value={stats.totalHoursTaught.toLocaleString()} icon={BookOpen} tone="violet" subtitle="Actual delivery" />
//           <MetricCard title="Utilization %" value={`${stats.utilizationPercent}%`} icon={Target} tone="amber" subtitle="Delivered / available hours" />
//         </div>

//         <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Lessons Delivered vs Cancelled</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[340px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={lessonDeliveryData} margin={{ top: 14, right: 12, left: -12, bottom: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
//                   <XAxis dataKey="name" axisLine={false} tickLine={false} />
//                   <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
//                   <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
//                   <Bar dataKey="value" name="Lessons" radius={[10, 10, 0, 0]}>
//                     {lessonDeliveryData.map((entry, index) => (
//                       <Cell key={entry.name} fill={index === 0 ? CHART.green : CHART.red} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>

//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Tutor Capacity Radar</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[340px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <RadarChart data={tutorRadar}>
//                   <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
//                   <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
//                   <Radar name="Capacity" dataKey="value" stroke={CHART.blue} fill={CHART.blue} fillOpacity={0.25} />
//                   <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} formatter={(value: number) => `${Number(value).toFixed(1)}%`} />
//                 </RadarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>
//         </div>

//         <BaseCard>
//           <CardHeader>
//             <CardTitle className="text-base">Capacity Utilization Progress</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-5">
//             <ProgressRow label="Tutor utilization" value={stats.utilizationPercent} right={`${stats.utilizationPercent}%`} />
//             <ProgressRow label="Hours taught vs available" value={safePercent(stats.totalHoursTaught, Math.max(stats.totalAvailableHours, 1))} right={`${stats.totalHoursTaught} / ${stats.totalAvailableHours}`} />
//             <ProgressRow label="Active tutor ratio" value={safePercent(stats.activeTutors, Math.max(stats.activeTutors + stats.onboardingTutors, 1))} right={`${stats.activeTutors} active tutors`} />
//           </CardContent>
//         </BaseCard>
//       </section>

//       <section className="space-y-5">
//         <SectionTitle icon={ShieldAlert} title="Retention Signals" subtitle="Follow-ups, tutor changes, paused subscriptions, refunds, and complaint health" />

//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
//           <MetricCard title="Follow-up records" value={stats.complaintsRaised} icon={AlertCircle} tone="amber" />
//           <MetricCard title="Resolved follow-ups" value={stats.complaintsResolved} icon={CheckCircle2} tone="green" />
//           <MetricCard title="Repeated complaints" value={stats.repeatedComplaints} icon={AlertCircle} tone="red" />
//           <MetricCard title="Tutor change requests" value={stats.tutorChangeRequests} icon={RefreshCw} tone="blue" />
//           <MetricCard title="Paused subscriptions" value={stats.pausedSubscriptions} icon={PauseCircle} tone="violet" />
//           <MetricCard title="Refund requests" value={stats.refundRequests} icon={DollarSign} tone="red" />
//         </div>

//         <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Retention Signal Mix</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[340px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={[
//                       { name: "Follow-ups", value: stats.complaintsRaised },
//                       { name: "Resolved", value: stats.complaintsResolved },
//                       { name: "Tutor changes", value: stats.tutorChangeRequests },
//                       { name: "Paused", value: stats.pausedSubscriptions },
//                       { name: "Refunds", value: stats.refundRequests },
//                     ]}
//                     dataKey="value"
//                     nameKey="name"
//                     innerRadius={55}
//                     outerRadius={105}
//                     paddingAngle={4}
//                     label
//                   >
//                     {CHART_COLORS.map((color, idx) => (
//                       <Cell key={color} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
//                   <Legend iconSize={9} />
//                 </PieChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>

//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Resolution & Risk Progress</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-5">
//               <ProgressRow label="Resolved follow-ups" value={resolutionRate} right={`${resolutionRate}%`} />
//               <ProgressRow label="Retention rate" value={retentionRate} right={`${retentionRate}%`} />
//               <ProgressRow label="Cancellation rate" value={cancellationRate} right={`${cancellationRate}%`} />
//               <ProgressRow label="Tutor change pending" value={safePercent(stats.tutorChangePending, Math.max(stats.tutorChangeRequests, 1))} right={`${stats.tutorChangePending} pending`} />
//             </CardContent>
//           </BaseCard>
//         </div>
//       </section>

//       <section className="space-y-5">
//         <SectionTitle icon={GraduationCap} title="Student Segmentation" subtitle="Students by grade/year and top state distribution" />

//         <div className="grid gap-4 lg:grid-cols-2">
//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Students by Grade / Year</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[350px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={gradeDistribution} margin={{ top: 14, right: 12, left: -12, bottom: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
//                   <XAxis dataKey="grade" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
//                   <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
//                   <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
//                   <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]} barSize={36}>
//                     {gradeDistribution.map((_, idx) => (
//                       <Cell key={`grade-${idx}`} fill={GRADE_COLORS[idx % GRADE_COLORS.length]} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>

//           <BaseCard>
//             <CardHeader>
//               <CardTitle className="text-base">Top 5 States</CardTitle>
//             </CardHeader>
//             <CardContent className="h-[350px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={stateDistribution} layout="vertical" margin={{ top: 14, right: 20, left: 60, bottom: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
//                   <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
//                   <YAxis type="category" dataKey="state" tick={{ fontSize: 12 }} width={55} axisLine={false} tickLine={false} />
//                   <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid rgba(148,163,184,.35)" }} />
//                   <Bar dataKey="count" name="Students" radius={[0, 8, 8, 0]} barSize={28}>
//                     {stateDistribution.map((_, idx) => (
//                       <Cell key={`state-${idx}`} fill={STATE_COLORS[idx % STATE_COLORS.length]} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </BaseCard>
//         </div>

//         <BaseCard>
//           <CardHeader>
//             <CardTitle className="text-base">Segment Table</CardTitle>
//           </CardHeader>
//           <CardContent className="grid gap-4 xl:grid-cols-2">
//             <TableWrap>
//               <table className="w-full text-left">
//                 <thead>
//                   <tr>
//                     <Th>Grade / Year</Th>
//                     <Th>Students</Th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {gradeDistribution.map((row) => (
//                     <tr key={row.grade}>
//                       <Td className="font-semibold text-slate-900 dark:text-white">{row.grade}</Td>
//                       <Td>{row.count}</Td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </TableWrap>

//             <TableWrap>
//               <table className="w-full text-left">
//                 <thead>
//                   <tr>
//                     <Th>State</Th>
//                     <Th>Students</Th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {stateDistribution.map((row) => (
//                     <tr key={row.state}>
//                       <Td className="font-semibold text-slate-900 dark:text-white">{row.state}</Td>
//                       <Td>{row.count}</Td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </TableWrap>
//           </CardContent>
//         </BaseCard>
//       </section>

//       {(stats.complaintsRaised > 0 || stats.pausedSubscriptions > 0) && (
//         <BaseCard className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
//           <CardContent className="flex items-start gap-4 p-6">
//             <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
//             <div>
//               <h3 className="font-semibold text-amber-900 dark:text-amber-100">Attention Required</h3>
//               <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
//                 <li>• {stats.complaintsRaised} follow-up records need review.</li>
//                 <li>• {stats.pausedSubscriptions} students are currently on break.</li>
//                 <li>• Retention rate is being monitored from left-out records.</li>
//               </ul>
//             </div>
//           </CardContent>
//         </BaseCard>
//       )}
//     </div>
//   );
// }
