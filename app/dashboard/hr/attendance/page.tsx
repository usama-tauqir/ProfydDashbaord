"use client";

import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
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
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Minus,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Timer,
  Trash2,
  TrendingUp,
  UserCog,
  UserX,
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

type RoleCategory = "Tutor" | "Non-Teaching Staff";
type Shift = "Morning" | "Night" | "Flexible";
type EmployeeStatus = "Active" | "On Leave" | "Inactive";

type EmployeeRecord = {
  id: string;
  employee_name: string;
  employee_code: string | null;
  department: string;
  role_title: string;
  role_category: RoleCategory;
  shift: Shift;
  status: EmployeeStatus;
  start_date: string;
  end_date: string | null;
  fte: number | string | null;
  created_at: string;
  updated_at: string | null;
};

type AttendanceLeaveRecord = {
  id: string;
  month: string;
  employee_id: string;
  employee_name: string;
  employee_code: string | null;
  department: string;
  role_category: RoleCategory;
  shift: Shift;
  total_working_days: number | string;
  approved_leaves: number | string;
  unplanned_absences: number | string;
  late_arrivals: number | string;
  remote_work_days: number | string;
  half_days: number | string;
  overtime_hours: number | string;
  late_minutes: number | string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type AttendanceForm = {
  month: string;
  employee_id: string;
  total_working_days: string;
  approved_leaves: string;
  unplanned_absences: string;
  late_arrivals: string;
  remote_work_days: string;
  half_days: string;
  overtime_hours: string;
  late_minutes: string;
  notes: string;
};

type DepartmentFilter = "all" | string;
type RoleFilter = "all" | RoleCategory;
type ShiftFilter = "all" | Shift;

const ROLE_CATEGORIES: RoleCategory[] = ["Tutor", "Non-Teaching Staff"];
const SHIFTS: Shift[] = ["Morning", "Night", "Flexible"];

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return date.toISOString().slice(0, 7);
}

function getMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getLastMonths(selectedMonth: string, count = 6) {
  const [year, monthNumber] = selectedMonth.split("-").map(Number);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, monthNumber - 1 - (count - 1 - index), 1);
    return date.toISOString().slice(0, 7);
  });
}

function emptyForm(month = getCurrentMonth()): AttendanceForm {
  return {
    month,
    employee_id: "",
    total_working_days: "",
    approved_leaves: "",
    unplanned_absences: "",
    late_arrivals: "",
    remote_work_days: "",
    half_days: "",
    overtime_hours: "",
    late_minutes: "",
    notes: "",
  };
}

function toCount(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function plainPercentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function percentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function trendDirection(value: number): "up" | "down" | "neutral" {
  if (!Number.isFinite(value) || value === 0) return "neutral";
  return value > 0 ? "up" : "down";
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

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</label>;
}

function SectionTitle({ icon: Icon, title }: { icon: ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
      <Icon className="h-5 w-5 text-indigo-600" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
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
  icon: ElementType;
  subtitle?: string;
  trend?: ReactNode;
  highlight?: boolean;
  variant?: "default" | "outline" | "warning";
  children?: ReactNode;
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

export default function HRAttendanceLeavesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceLeaveRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<AttendanceForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const [employeesResponse, attendanceResponse] = await Promise.all([
        supabase
          .from("hr_employee_records")
          .select("*")
          .order("employee_name", { ascending: true }),

        supabase
          .from("hr_attendance_leave_records")
          .select("*")
          .order("month", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (employeesResponse.error) throw new Error(employeesResponse.error.message);
      if (attendanceResponse.error) throw new Error(attendanceResponse.error.message);

      setEmployees((employeesResponse.data || []) as EmployeeRecord[]);
      setAttendanceRecords((attendanceResponse.data || []) as AttendanceLeaveRecord[]);

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      const text = getErrorMessage(
        error,
        "Could not load attendance records. Please check hr_employee_records and hr_attendance_leave_records."
      );
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "Active"),
    [employees]
  );

  const selectedAttendanceRecords = useMemo(
    () => attendanceRecords.filter((record) => record.month === selectedMonth),
    [attendanceRecords, selectedMonth]
  );

  const previousMonth = getPreviousMonth(selectedMonth);

  const previousAttendanceRecords = useMemo(
    () => attendanceRecords.filter((record) => record.month === previousMonth),
    [attendanceRecords, previousMonth]
  );

  const departmentOptions = useMemo(() => {
    const employeeDepartments = employees.map((employee) => employee.department).filter(Boolean);
    const attendanceDepartments = attendanceRecords.map((record) => record.department).filter(Boolean);
    return Array.from(new Set([...employeeDepartments, ...attendanceDepartments])).sort();
  }, [employees, attendanceRecords]);

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedAttendanceRecords
      .filter((record) => departmentFilter === "all" || record.department === departmentFilter)
      .filter((record) => roleFilter === "all" || record.role_category === roleFilter)
      .filter((record) => shiftFilter === "all" || record.shift === shiftFilter)
      .filter((record) => {
        if (!query) return true;

        return [
          record.employee_name,
          record.employee_code || "",
          record.department,
          record.role_category,
          record.shift,
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => toCount(b.unplanned_absences) - toCount(a.unplanned_absences));
  }, [selectedAttendanceRecords, departmentFilter, roleFilter, shiftFilter, searchQuery]);

  const totals = selectedAttendanceRecords.reduce(
    (acc, record) => {
      const workingDays = toCount(record.total_working_days);
      const approvedLeaves = toCount(record.approved_leaves);
      const unplannedAbsences = toCount(record.unplanned_absences);
      const lateArrivals = toCount(record.late_arrivals);
      const remoteWorkDays = toCount(record.remote_work_days);
      const halfDays = toCount(record.half_days);
      const overtimeHours = toCount(record.overtime_hours);
      const lateMinutes = toCount(record.late_minutes);
      const presentDays = Math.max(workingDays - approvedLeaves - unplannedAbsences, 0);

      acc.totalWorkingDays += workingDays;
      acc.companyWorkingDays = Math.max(acc.companyWorkingDays, workingDays);
      acc.approvedLeaves += approvedLeaves;
      acc.unplannedAbsences += unplannedAbsences;
      acc.lateArrivals += lateArrivals;
      acc.remoteWorkDays += remoteWorkDays;
      acc.halfDays += halfDays;
      acc.overtimeHours += overtimeHours;
      acc.lateMinutes += lateMinutes;
      acc.presentDays += presentDays;

      if (record.role_category === "Tutor") {
        acc.tutorWorkingDays += workingDays;
        acc.tutorApprovedLeaves += approvedLeaves;
        acc.tutorUnplannedAbsences += unplannedAbsences;
        acc.tutorLateArrivals += lateArrivals;
      }

      if (record.role_category === "Non-Teaching Staff") {
        acc.nonTeachingWorkingDays += workingDays;
        acc.nonTeachingApprovedLeaves += approvedLeaves;
        acc.nonTeachingUnplannedAbsences += unplannedAbsences;
        acc.nonTeachingLateArrivals += lateArrivals;
      }

      if (record.shift === "Morning") {
        acc.morningWorkingDays += workingDays;
        acc.morningApprovedLeaves += approvedLeaves;
        acc.morningUnplannedAbsences += unplannedAbsences;
        acc.morningLateArrivals += lateArrivals;
      }

      if (record.shift === "Night") {
        acc.nightWorkingDays += workingDays;
        acc.nightApprovedLeaves += approvedLeaves;
        acc.nightUnplannedAbsences += unplannedAbsences;
        acc.nightLateArrivals += lateArrivals;
      }

      return acc;
    },
    {
      companyWorkingDays: 0,
      totalWorkingDays: 0,
      presentDays: 0,
      approvedLeaves: 0,
      unplannedAbsences: 0,
      lateArrivals: 0,
      remoteWorkDays: 0,
      halfDays: 0,
      overtimeHours: 0,
      lateMinutes: 0,

      tutorWorkingDays: 0,
      tutorApprovedLeaves: 0,
      tutorUnplannedAbsences: 0,
      tutorLateArrivals: 0,

      nonTeachingWorkingDays: 0,
      nonTeachingApprovedLeaves: 0,
      nonTeachingUnplannedAbsences: 0,
      nonTeachingLateArrivals: 0,

      morningWorkingDays: 0,
      morningApprovedLeaves: 0,
      morningUnplannedAbsences: 0,
      morningLateArrivals: 0,

      nightWorkingDays: 0,
      nightApprovedLeaves: 0,
      nightUnplannedAbsences: 0,
      nightLateArrivals: 0,
    }
  );

  const previousTotals = previousAttendanceRecords.reduce(
    (acc, record) => {
      acc.totalWorkingDays += toCount(record.total_working_days);
      acc.approvedLeaves += toCount(record.approved_leaves);
      acc.unplannedAbsences += toCount(record.unplanned_absences);
      acc.lateArrivals += toCount(record.late_arrivals);
      return acc;
    },
    {
      totalWorkingDays: 0,
      approvedLeaves: 0,
      unplannedAbsences: 0,
      lateArrivals: 0,
    }
  );

  const attendanceRate = totals.totalWorkingDays
    ? (totals.presentDays / totals.totalWorkingDays) * 100
    : 0;

  const absenceRate = totals.totalWorkingDays
    ? (totals.unplannedAbsences / totals.totalWorkingDays) * 100
    : 0;

  const leaveRate = totals.totalWorkingDays
    ? (totals.approvedLeaves / totals.totalWorkingDays) * 100
    : 0;

  const lateArrivalRate = totals.totalWorkingDays
    ? (totals.lateArrivals / totals.totalWorkingDays) * 100
    : 0;

  const previousAbsenceRate = previousTotals.totalWorkingDays
    ? (previousTotals.unplannedAbsences / previousTotals.totalWorkingDays) * 100
    : 0;

  const absenceRateMoM = previousAbsenceRate
    ? absenceRate - previousAbsenceRate
    : absenceRate > 0
      ? absenceRate
      : 0;

  const approvedLeavesMoM = previousTotals.approvedLeaves
    ? ((totals.approvedLeaves - previousTotals.approvedLeaves) / previousTotals.approvedLeaves) * 100
    : totals.approvedLeaves > 0
      ? 100
      : 0;

  const lateArrivalsMoM = previousTotals.lateArrivals
    ? ((totals.lateArrivals - previousTotals.lateArrivals) / previousTotals.lateArrivals) * 100
    : totals.lateArrivals > 0
      ? 100
      : 0;

  const departmentSummary = useMemo(() => {
    return departmentOptions
      .map((department) => {
        const records = selectedAttendanceRecords.filter((record) => record.department === department);

        const workingDays = records.reduce((sum, record) => sum + toCount(record.total_working_days), 0);
        const approvedLeaves = records.reduce((sum, record) => sum + toCount(record.approved_leaves), 0);
        const unplannedAbsences = records.reduce((sum, record) => sum + toCount(record.unplanned_absences), 0);
        const lateArrivals = records.reduce((sum, record) => sum + toCount(record.late_arrivals), 0);
        const presentDays = records.reduce((sum, record) => {
          const working = toCount(record.total_working_days);
          const leaves = toCount(record.approved_leaves);
          const absences = toCount(record.unplanned_absences);
          return sum + Math.max(working - leaves - absences, 0);
        }, 0);

        return {
          department,
          workingDays,
          approvedLeaves,
          unplannedAbsences,
          lateArrivals,
          records: records.length,
          attendanceRate: workingDays ? (presentDays / workingDays) * 100 : 0,
          absenceRate: workingDays ? (unplannedAbsences / workingDays) * 100 : 0,
        };
      })
      .filter((item) => item.records > 0)
      .sort((a, b) => b.unplannedAbsences - a.unplannedAbsences);
  }, [departmentOptions, selectedAttendanceRecords]);

  const roleSummary = [
    {
      name: "Tutor",
      workingDays: totals.tutorWorkingDays,
      approvedLeaves: totals.tutorApprovedLeaves,
      unplannedAbsences: totals.tutorUnplannedAbsences,
      lateArrivals: totals.tutorLateArrivals,
      absenceRate: totals.tutorWorkingDays
        ? (totals.tutorUnplannedAbsences / totals.tutorWorkingDays) * 100
        : 0,
    },
    {
      name: "Non-Teaching",
      workingDays: totals.nonTeachingWorkingDays,
      approvedLeaves: totals.nonTeachingApprovedLeaves,
      unplannedAbsences: totals.nonTeachingUnplannedAbsences,
      lateArrivals: totals.nonTeachingLateArrivals,
      absenceRate: totals.nonTeachingWorkingDays
        ? (totals.nonTeachingUnplannedAbsences / totals.nonTeachingWorkingDays) * 100
        : 0,
    },
  ];

  const shiftSummary = [
    {
      name: "Morning",
      workingDays: totals.morningWorkingDays,
      approvedLeaves: totals.morningApprovedLeaves,
      unplannedAbsences: totals.morningUnplannedAbsences,
      lateArrivals: totals.morningLateArrivals,
      absenceRate: totals.morningWorkingDays
        ? (totals.morningUnplannedAbsences / totals.morningWorkingDays) * 100
        : 0,
    },
    {
      name: "Night",
      workingDays: totals.nightWorkingDays,
      approvedLeaves: totals.nightApprovedLeaves,
      unplannedAbsences: totals.nightUnplannedAbsences,
      lateArrivals: totals.nightLateArrivals,
      absenceRate: totals.nightWorkingDays
        ? (totals.nightUnplannedAbsences / totals.nightWorkingDays) * 100
        : 0,
    },
  ];

  const attendanceTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const records = attendanceRecords.filter((record) => record.month === month);

      const workingDays = records.reduce((sum, record) => sum + toCount(record.total_working_days), 0);
      const approvedLeaves = records.reduce((sum, record) => sum + toCount(record.approved_leaves), 0);
      const unplannedAbsences = records.reduce((sum, record) => sum + toCount(record.unplanned_absences), 0);
      const lateArrivals = records.reduce((sum, record) => sum + toCount(record.late_arrivals), 0);
      const presentDays = records.reduce((sum, record) => {
        const working = toCount(record.total_working_days);
        const leaves = toCount(record.approved_leaves);
        const absences = toCount(record.unplanned_absences);
        return sum + Math.max(working - leaves - absences, 0);
      }, 0);

      return {
        month: getMonthLabel(month),
        attendanceRate: workingDays ? (presentDays / workingDays) * 100 : 0,
        approvedLeaves,
        unplannedAbsences,
        lateArrivals,
      };
    });
  }, [attendanceRecords, selectedMonth]);

  const missingAttendanceEmployees = activeEmployees.filter((employee) => {
    return !selectedAttendanceRecords.some((record) => record.employee_id === employee.id);
  });

  const topAbsenceRecords = [...selectedAttendanceRecords]
    .sort((a, b) => toCount(b.unplanned_absences) - toCount(a.unplanned_absences))
    .slice(0, 5);

  const alerts = useMemo(() => {
    const items = [];

    if (missingAttendanceEmployees.length > 0) {
      items.push(`${missingAttendanceEmployees.length} active employee(s) do not have attendance records for ${getMonthLabel(selectedMonth)}.`);
    }

    if (absenceRate > 5) {
      items.push(`Unplanned absence rate is ${plainPercentage(absenceRate)}, which is above the recommended 5% watch level.`);
    }

    if (lateArrivalRate > 10) {
      items.push(`Late arrival rate is ${plainPercentage(lateArrivalRate)}. Review punctuality by department and shift.`);
    }

    if (totals.lateMinutes > 0 && totals.lateArrivals > 0) {
      items.push(`Average late minutes per late arrival is ${Math.round(totals.lateMinutes / totals.lateArrivals)} minutes.`);
    }

    if (totals.overtimeHours > 0) {
      items.push(`${formatNumber(totals.overtimeHours)} overtime hours recorded. Review if overtime is linked to staffing gaps.`);
    }

    if (!items.length) {
      items.push("Attendance looks stable. Continue monitoring unplanned absences, late arrivals and missing records.");
    }

    return items;
  }, [
    missingAttendanceEmployees.length,
    selectedMonth,
    absenceRate,
    lateArrivalRate,
    totals.lateMinutes,
    totals.lateArrivals,
    totals.overtimeHours,
  ]);

  const totalWorkingDaysPreview = toCount(form.total_working_days);
  const approvedLeavesPreview = toCount(form.approved_leaves);
  const unplannedAbsencesPreview = toCount(form.unplanned_absences);
  const presentDaysPreview = Math.max(totalWorkingDaysPreview - approvedLeavesPreview - unplannedAbsencesPreview, 0);

  function setFormValue<K extends keyof AttendanceForm>(key: K, value: AttendanceForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(selectedMonth));
  }

  function handleEmployeeChange(employeeId: string) {
    setForm((previous) => ({
      ...previous,
      employee_id: employeeId === "none" ? "" : employeeId,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedEmployee = employees.find((employee) => employee.id === form.employee_id);

    const totalWorkingDays = toCount(form.total_working_days);
    const approvedLeaves = toCount(form.approved_leaves);
    const unplannedAbsences = toCount(form.unplanned_absences);
    const lateArrivals = toCount(form.late_arrivals);
    const remoteWorkDays = toCount(form.remote_work_days);
    const halfDays = toCount(form.half_days);
    const overtimeHours = toCount(form.overtime_hours);
    const lateMinutes = toCount(form.late_minutes);

    if (!form.month || !selectedEmployee || totalWorkingDays <= 0) {
      setMessage({
        type: "error",
        text: "Please select month, employee and total working days greater than 0.",
      });
      return;
    }

    if (
      approvedLeaves < 0 ||
      unplannedAbsences < 0 ||
      lateArrivals < 0 ||
      remoteWorkDays < 0 ||
      halfDays < 0 ||
      overtimeHours < 0 ||
      lateMinutes < 0
    ) {
      setMessage({
        type: "error",
        text: "Attendance values cannot be negative.",
      });
      return;
    }

    if (approvedLeaves + unplannedAbsences > totalWorkingDays) {
      setMessage({
        type: "error",
        text: "Approved leaves plus unplanned absences cannot be greater than total working days.",
      });
      return;
    }

    if (lateArrivals > totalWorkingDays) {
      setMessage({
        type: "error",
        text: "Late arrivals cannot be greater than total working days.",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        month: form.month,
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.employee_name,
        employee_code: selectedEmployee.employee_code,
        department: selectedEmployee.department,
        role_category: selectedEmployee.role_category,
        shift: selectedEmployee.shift,
        total_working_days: totalWorkingDays,
        approved_leaves: approvedLeaves,
        unplanned_absences: unplannedAbsences,
        late_arrivals: lateArrivals,
        remote_work_days: remoteWorkDays,
        half_days: halfDays,
        overtime_hours: overtimeHours,
        late_minutes: lateMinutes,
        notes: form.notes.trim() || null,
      };

      const response = editingId
        ? await supabase
            .from("hr_attendance_leave_records")
            .update(payload)
            .eq("id", editingId)
            .select()
            .single()
        : await supabase
            .from("hr_attendance_leave_records")
            .insert(payload)
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      setSelectedMonth(form.month);
      setMessage({
        type: "success",
        text: editingId ? "Attendance record updated." : "Attendance record created.",
      });

      resetForm();
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not save attendance record.");
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(record: AttendanceLeaveRecord) {
    setEditingId(record.id);
    setForm({
      month: record.month,
      employee_id: record.employee_id,
      total_working_days: String(record.total_working_days || ""),
      approved_leaves: String(record.approved_leaves || ""),
      unplanned_absences: String(record.unplanned_absences || ""),
      late_arrivals: String(record.late_arrivals || ""),
      remote_work_days: String(record.remote_work_days || ""),
      half_days: String(record.half_days || ""),
      overtime_hours: String(record.overtime_hours || ""),
      late_minutes: String(record.late_minutes || ""),
      notes: record.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(record: AttendanceLeaveRecord) {
    const confirmed = window.confirm(`Delete attendance record for ${record.employee_name}?`);
    if (!confirmed) return;

    try {
      setMessage(null);

      const { error } = await supabase
        .from("hr_attendance_leave_records")
        .delete()
        .eq("id", record.id);

      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Attendance record deleted." });
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not delete attendance record.");
      setMessage({ type: "error", text });
    }
  }

  if (loading && employees.length === 0 && attendanceRecords.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading HR attendance records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Department - Attendance & Leaves</h1>
          <p className="text-muted-foreground">
            Track working days, approved leaves, unplanned absences and late arrivals.
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
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
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
            <p
              className={
                message.type === "success"
                  ? "text-sm text-emerald-700 dark:text-emerald-300"
                  : "text-sm text-red-700 dark:text-red-300"
              }
            >
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      <SectionTitle icon={CalendarDays} title="D. Attendance & Leaves" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total working days"
          value={formatNumber(totals.companyWorkingDays)}
          icon={CalendarDays}
          subtitle={`${formatNumber(totals.totalWorkingDays)} employee-working days recorded`}
          highlight
        />

        <MetricCard
          title="Approved leaves"
          value={formatNumber(totals.approvedLeaves)}
          icon={CalendarCheck}
          subtitle={`${plainPercentage(leaveRate)} leave rate`}
          trend={<TrendBadge direction={trendDirection(approvedLeavesMoM)} label={`${percentage(approvedLeavesMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Unplanned absences"
          value={formatNumber(totals.unplannedAbsences)}
          icon={UserX}
          subtitle={`${plainPercentage(absenceRate)} absence rate`}
          trend={<TrendBadge direction={trendDirection(absenceRateMoM)} label={`${percentage(absenceRateMoM)} pts MoM`} />}
          variant={absenceRate > 5 ? "warning" : "default"}
          highlight
        />

        <MetricCard
          title="Late arrivals"
          value={formatNumber(totals.lateArrivals)}
          icon={Clock}
          subtitle={`${plainPercentage(lateArrivalRate)} late arrival rate`}
          trend={<TrendBadge direction={trendDirection(lateArrivalsMoM)} label={`${percentage(lateArrivalsMoM)} MoM`} />}
          variant={lateArrivalRate > 10 ? "warning" : "default"}
          highlight
        />
      </div>

      <SectionTitle icon={LayoutDashboard} title="Attendance Overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Attendance rate"
          value={plainPercentage(attendanceRate)}
          icon={TrendingUp}
          subtitle={`${formatNumber(totals.presentDays)} present days`}
          variant="outline"
        />

        <MetricCard
          title="Remote work days"
          value={formatNumber(totals.remoteWorkDays)}
          icon={BriefcaseBusiness}
          subtitle="Optional remote work tracking"
          variant="outline"
        />

        <MetricCard
          title="Half days"
          value={formatNumber(totals.halfDays)}
          icon={Minus}
          subtitle="Half-day records this month"
          variant="outline"
        />

        <MetricCard
          title="Overtime hours"
          value={formatNumber(totals.overtimeHours)}
          icon={Timer}
          subtitle={`${formatNumber(totals.lateMinutes)} total late minutes`}
          variant={totals.overtimeHours > 0 ? "warning" : "outline"}
        />
      </div>

      <SectionTitle icon={Plus} title={editingId ? "Update Attendance Record" : "Add Attendance Record"} />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{editingId ? "Edit attendance details" : "New attendance record"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select an employee. Department, role category and shift will be copied automatically from HR headcount.
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

            <div className="lg:col-span-4">
              <FieldLabel>Employee</FieldLabel>
              <Select value={form.employee_id || "none"} onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select employee</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.employee_name} · {employee.role_category} · {employee.shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Total working days</FieldLabel>
              <input
                type="number"
                min="1"
                step="1"
                value={form.total_working_days}
                onChange={(event) => setFormValue("total_working_days", event.target.value)}
                placeholder="22"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Approved leaves</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.approved_leaves}
                onChange={(event) => setFormValue("approved_leaves", event.target.value)}
                placeholder="2"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Unplanned absences</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.unplanned_absences}
                onChange={(event) => setFormValue("unplanned_absences", event.target.value)}
                placeholder="1"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Late arrivals</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.late_arrivals}
                onChange={(event) => setFormValue("late_arrivals", event.target.value)}
                placeholder="3"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Remote work days</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.remote_work_days}
                onChange={(event) => setFormValue("remote_work_days", event.target.value)}
                placeholder="0"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Half days</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.half_days}
                onChange={(event) => setFormValue("half_days", event.target.value)}
                placeholder="0"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Overtime hours</FieldLabel>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.overtime_hours}
                onChange={(event) => setFormValue("overtime_hours", event.target.value)}
                placeholder="4"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Late minutes</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.late_minutes}
                onChange={(event) => setFormValue("late_minutes", event.target.value)}
                placeholder="45"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Auto present days</FieldLabel>
              <input value={formatNumber(presentDaysPreview)} readOnly className={inputClassName("bg-muted/40")} />
            </div>

            <div className="flex items-end lg:col-span-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit3 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Update" : "Save"}
              </Button>
            </div>

            <div className="lg:col-span-12">
              <FieldLabel>Attendance notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => setFormValue("notes", event.target.value)}
                placeholder="Optional: leave reason, absence reason, late arrival explanation, attendance concerns, HR follow-up, etc."
                className={textareaClassName()}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <SectionTitle icon={BarChart3} title="Attendance Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role-wise Attendance & Leaves</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="approvedLeaves" name="Approved Leaves" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unplannedAbsences" name="Unplanned Absences" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lateArrivals" name="Late Arrivals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shift-wise Attendance & Leaves</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="approvedLeaves" name="Approved Leaves" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unplannedAbsences" name="Unplanned Absences" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lateArrivals" name="Late Arrivals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: unknown, name) => {
                    if (name === "attendanceRate" || name === "absenceRate") {
                      return [`${Number(value).toFixed(1)}%`, name];
                    }
                    return [formatNumber(Number(value) || 0), ""];
                  }}
                />
                <Legend />
                <Bar dataKey="approvedLeaves" name="Approved Leaves" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unplannedAbsences" name="Unplanned Absences" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lateArrivals" name="Late Arrivals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6-Month Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: unknown, name) => {
                    if (name === "Attendance Rate") return [`${Number(value).toFixed(1)}%`, name];
                    return [formatNumber(Number(value) || 0), name];
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="attendanceRate" name="Attendance Rate" stroke="#4f46e5" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="approvedLeaves" name="Approved Leaves" stroke="#818cf8" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="unplannedAbsences" name="Unplanned Absences" stroke="#ef4444" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="lateArrivals" name="Late Arrivals" stroke="#f59e0b" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={ShieldCheck} title="Attendance Controls & Alerts" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Attendance Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Automatic checks for missing attendance records, high absence rate, late arrivals and overtime pressure.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <p className="text-sm text-muted-foreground">{alert}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mandatory Attendance Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Total working days</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Approved leaves</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Unplanned absences</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Late arrivals</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Search} title="Attendance Records" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter, edit and delete attendance records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleRecords.length)} of {formatNumber(selectedAttendanceRecords.length)} records for {getMonthLabel(selectedMonth)}.
              </p>
            </div>

            <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <FieldLabel>Department</FieldLabel>
              <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departmentOptions.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Role category</FieldLabel>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Role category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLE_CATEGORIES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Shift</FieldLabel>
              <Select value={shiftFilter} onValueChange={(value) => setShiftFilter(value as ShiftFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All shifts</SelectItem>
                  {SHIFTS.map((shift) => (
                    <SelectItem key={shift} value={shift}>
                      {shift}
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
                  placeholder="Search employee, department..."
                  className={inputClassName("pl-9")}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1420px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Shift</th>
                  <th className="px-4 py-3 font-semibold">Working Days</th>
                  <th className="px-4 py-3 font-semibold">Approved Leaves</th>
                  <th className="px-4 py-3 font-semibold">Unplanned Absences</th>
                  <th className="px-4 py-3 font-semibold">Late Arrivals</th>
                  <th className="px-4 py-3 font-semibold">Present Days</th>
                  <th className="px-4 py-3 font-semibold">Remote</th>
                  <th className="px-4 py-3 font-semibold">Half Days</th>
                  <th className="px-4 py-3 font-semibold">Overtime</th>
                  <th className="px-4 py-3 font-semibold">Late Minutes</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={15} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading attendance records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => {
                    const workingDays = toCount(record.total_working_days);
                    const approvedLeaves = toCount(record.approved_leaves);
                    const unplannedAbsences = toCount(record.unplanned_absences);
                    const presentDays = Math.max(workingDays - approvedLeaves - unplannedAbsences, 0);

                    return (
                      <tr key={record.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">{record.month}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold">{record.employee_name}</p>
                            <p className="text-xs text-muted-foreground">{record.employee_code || "No code"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{record.department}</td>
                        <td className="px-4 py-3">{record.role_category}</td>
                        <td className="px-4 py-3">{record.shift}</td>
                        <td className="px-4 py-3">{formatNumber(workingDays)}</td>
                        <td className="px-4 py-3">{formatNumber(approvedLeaves)}</td>
                        <td className="px-4 py-3 font-semibold text-red-600">{formatNumber(unplannedAbsences)}</td>
                        <td className="px-4 py-3">{formatNumber(toCount(record.late_arrivals))}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-600">{formatNumber(presentDays)}</td>
                        <td className="px-4 py-3">{formatNumber(toCount(record.remote_work_days))}</td>
                        <td className="px-4 py-3">{formatNumber(toCount(record.half_days))}</td>
                        <td className="px-4 py-3">{formatNumber(toCount(record.overtime_hours))}</td>
                        <td className="px-4 py-3">{formatNumber(toCount(record.late_minutes))}</td>
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
                    <td colSpan={15} className="px-4 py-10 text-center text-muted-foreground">
                      No attendance records found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Unplanned Absence Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {topAbsenceRecords.length ? (
              topAbsenceRecords.map((record, index) => (
                <div key={record.id} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">
                    {index + 1}. {record.employee_name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {record.department} · {record.role_category} · {record.shift}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-red-600">
                    {formatNumber(toCount(record.unplanned_absences))}
                  </p>
                  <p className="text-xs text-muted-foreground">unplanned absences</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No absence records available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}