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
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Filter,
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
  Trash2,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  UsersRound,
  BarChart3
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
type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Freelance" | "Intern";
type WorkMode = "On-site" | "Remote" | "Hybrid";

type EmployeeRecord = {
  id: string;
  employee_name: string;
  employee_code: string | null;
  email: string | null;
  phone: string | null;
  department: string;
  role_title: string;
  role_category: RoleCategory;
  employment_type: EmploymentType;
  shift: Shift;
  status: EmployeeStatus;
  work_mode: WorkMode;
  start_date: string;
  end_date: string | null;
  fte: number | string | null;
  manager_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type EmployeeForm = {
  employee_name: string;
  employee_code: string;
  email: string;
  phone: string;
  department: string;
  role_title: string;
  role_category: RoleCategory;
  employment_type: EmploymentType;
  shift: Shift;
  status: EmployeeStatus;
  work_mode: WorkMode;
  start_date: string;
  end_date: string;
  fte: string;
  manager_name: string;
  notes: string;
};

type StatusFilter = "all" | EmployeeStatus;
type ShiftFilter = "all" | Shift;
type RoleFilter = "all" | RoleCategory;
type DepartmentFilter = "all" | string;

const ROLE_CATEGORIES: RoleCategory[] = ["Tutor", "Non-Teaching Staff"];
const SHIFTS: Shift[] = ["Morning", "Night", "Flexible"];
const STATUSES: EmployeeStatus[] = ["Active", "On Leave", "Inactive"];
const EMPLOYMENT_TYPES: EmploymentType[] = ["Full-time", "Part-time", "Contract", "Freelance", "Intern"];
const WORK_MODES: WorkMode[] = ["On-site", "Remote", "Hybrid"];

const DEFAULT_DEPARTMENTS = [
  "HR",
  "Teaching",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "Customer Support",
  "Admin",
  "Academic Coordination",
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return date.toISOString().slice(0, 7);
}

function getMonthStart(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1);
}

function getMonthEnd(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0);
}

function getMonthLabel(month: string) {
  const date = getMonthStart(month);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getLastMonths(selectedMonth: string, count = 6) {
  const [year, monthNumber] = selectedMonth.split("-").map(Number);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, monthNumber - 1 - (count - 1 - index), 1);
    return date.toISOString().slice(0, 7);
  });
}

function emptyForm(): EmployeeForm {
  return {
    employee_name: "",
    employee_code: "",
    email: "",
    phone: "",
    department: "Teaching",
    role_title: "",
    role_category: "Tutor",
    employment_type: "Full-time",
    shift: "Morning",
    status: "Active",
    work_mode: "On-site",
    start_date: getTodayDate(),
    end_date: "",
    fte: "1",
    manager_name: "",
    notes: "",
  };
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const numberValue = Number(value ?? fallback);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getFte(value: number | string | null | undefined) {
  const numberValue = toNumber(value, 1);
  if (numberValue <= 0) return 1;
  return numberValue;
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

function isSameMonth(dateValue: string | null | undefined, month: string) {
  if (!dateValue) return false;
  return dateValue.slice(0, 7) === month;
}

function isEmployeeActiveNow(employee: EmployeeRecord) {
  return employee.status === "Active";
}

function isEmployeeActiveAtMonthEnd(employee: EmployeeRecord, month: string) {
  const monthEnd = getMonthEnd(month);
  const startDate = employee.start_date ? new Date(employee.start_date) : null;
  const endDate = employee.end_date ? new Date(employee.end_date) : null;

  if (!startDate || startDate > monthEnd) return false;
  if (endDate && endDate <= monthEnd) return false;
  if (employee.status === "Inactive" && endDate && endDate <= monthEnd) return false;

  return true;
}

function getTenureMonths(startDateValue: string | null | undefined, endDateValue?: string | null) {
  if (!startDateValue) return 0;

  const startDate = new Date(startDateValue);
  const endDate = endDateValue ? new Date(endDateValue) : new Date();

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;

  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  return Math.max(0, months);
}

function formatTenure(months: number) {
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths ? `${years}y ${remainingMonths}m` : `${years}y`;
}

function getDaysUntil(dateValue: string | null | undefined) {
  if (!dateValue) return null;

  const today = new Date();
  const target = new Date(dateValue);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getMissingFields(employee: EmployeeRecord) {
  const missing = [];

  if (!employee.employee_name) missing.push("name");
  if (!employee.email) missing.push("email");
  if (!employee.phone) missing.push("phone");
  if (!employee.department) missing.push("department");
  if (!employee.role_title) missing.push("role");
  if (!employee.start_date) missing.push("start date");
  if (!employee.manager_name) missing.push("manager");

  return missing;
}

export default function HRHeadcountPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<EmployeeForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("hr_employee_records")
        .select("*")
        .order("status", { ascending: true })
        .order("employee_name", { ascending: true });

      if (response.error) throw new Error(response.error.message);

      setEmployees((response.data || []) as EmployeeRecord[]);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      const text = getErrorMessage(
        error,
        "Could not load HR employee records. Please check your hr_employee_records Supabase table."
      );
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const departmentOptions = useMemo(() => {
    const recordDepartments = employees.map((employee) => employee.department).filter(Boolean);
    return Array.from(new Set([...DEFAULT_DEPARTMENTS, ...recordDepartments])).sort();
  }, [employees]);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => isEmployeeActiveNow(employee)),
    [employees]
  );

  const previousMonth = getPreviousMonth(selectedMonth);

  const previousMonthActiveCount = useMemo(
    () => employees.filter((employee) => isEmployeeActiveAtMonthEnd(employee, previousMonth)).length,
    [employees, previousMonth]
  );

  const currentMonthActiveCount = useMemo(
    () => employees.filter((employee) => isEmployeeActiveAtMonthEnd(employee, selectedMonth)).length,
    [employees, selectedMonth]
  );

  const selectedMonthHires = useMemo(
    () => employees.filter((employee) => isSameMonth(employee.start_date, selectedMonth)),
    [employees, selectedMonth]
  );

  const selectedMonthExits = useMemo(
    () => employees.filter((employee) => isSameMonth(employee.end_date, selectedMonth)),
    [employees, selectedMonth]
  );

  const headcountMoM = previousMonthActiveCount
    ? ((currentMonthActiveCount - previousMonthActiveCount) / previousMonthActiveCount) * 100
    : currentMonthActiveCount > 0
      ? 100
      : 0;

  const averageHeadcount = previousMonthActiveCount
    ? (previousMonthActiveCount + currentMonthActiveCount) / 2
    : currentMonthActiveCount;

  const turnoverRate = averageHeadcount ? (selectedMonthExits.length / averageHeadcount) * 100 : 0;

  const totalActiveEmployees = activeEmployees.length;
  const totalActiveTutors = activeEmployees.filter((employee) => employee.role_category === "Tutor").length;
  const totalActiveNonTeachingStaff = activeEmployees.filter(
    (employee) => employee.role_category === "Non-Teaching Staff"
  ).length;
  const morningShiftHeadcount = activeEmployees.filter((employee) => employee.shift === "Morning").length;
  const nightShiftHeadcount = activeEmployees.filter((employee) => employee.shift === "Night").length;
  const flexibleShiftHeadcount = activeEmployees.filter((employee) => employee.shift === "Flexible").length;
  const onLeaveHeadcount = employees.filter((employee) => employee.status === "On Leave").length;
  const inactiveHeadcount = employees.filter((employee) => employee.status === "Inactive").length;
  const totalFte = activeEmployees.reduce((sum, employee) => sum + getFte(employee.fte), 0);

  const averageTenureMonths = activeEmployees.length
    ? activeEmployees.reduce((sum, employee) => sum + getTenureMonths(employee.start_date), 0) /
      activeEmployees.length
    : 0;

  const contractEndingSoon = activeEmployees.filter((employee) => {
    const days = getDaysUntil(employee.end_date);
    return days !== null && days >= 0 && days <= 45;
  });

  const incompleteProfiles = activeEmployees.filter((employee) => getMissingFields(employee).length > 0);

  const tutorRatio = totalActiveEmployees ? (totalActiveTutors / totalActiveEmployees) * 100 : 0;
  const nonTeachingRatio = totalActiveEmployees ? (totalActiveNonTeachingStaff / totalActiveEmployees) * 100 : 0;
  const nightShiftRatio = totalActiveEmployees ? (nightShiftHeadcount / totalActiveEmployees) * 100 : 0;

  const visibleEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return employees
      .filter((employee) => departmentFilter === "all" || employee.department === departmentFilter)
      .filter((employee) => statusFilter === "all" || employee.status === statusFilter)
      .filter((employee) => shiftFilter === "all" || employee.shift === shiftFilter)
      .filter((employee) => roleFilter === "all" || employee.role_category === roleFilter)
      .filter((employee) => {
        if (!query) return true;

        return [
          employee.employee_name,
          employee.employee_code || "",
          employee.email || "",
          employee.phone || "",
          employee.department,
          employee.role_title,
          employee.role_category,
          employee.shift,
          employee.status,
          employee.manager_name || "",
          employee.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "Active" ? -1 : 1;
        return a.employee_name.localeCompare(b.employee_name);
      });
  }, [employees, departmentFilter, statusFilter, shiftFilter, roleFilter, searchQuery]);

  const departmentSummary = useMemo(() => {
    return departmentOptions
      .map((department) => {
        const departmentEmployees = activeEmployees.filter((employee) => employee.department === department);
        const tutors = departmentEmployees.filter((employee) => employee.role_category === "Tutor").length;
        const nonTeaching = departmentEmployees.filter(
          (employee) => employee.role_category === "Non-Teaching Staff"
        ).length;

        return {
          department,
          headcount: departmentEmployees.length,
          tutors,
          nonTeaching,
          fte: departmentEmployees.reduce((sum, employee) => sum + getFte(employee.fte), 0),
        };
      })
      .filter((item) => item.headcount > 0)
      .sort((a, b) => b.headcount - a.headcount);
  }, [activeEmployees, departmentOptions]);

  const shiftSummary = [
    { shift: "Morning", headcount: morningShiftHeadcount },
    { shift: "Night", headcount: nightShiftHeadcount },
    { shift: "Flexible", headcount: flexibleShiftHeadcount },
  ];

  const roleSummary = [
    { role: "Tutors", headcount: totalActiveTutors },
    { role: "Non-teaching", headcount: totalActiveNonTeachingStaff },
  ];

  const headcountTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const activeCount = employees.filter((employee) => isEmployeeActiveAtMonthEnd(employee, month)).length;
      const hires = employees.filter((employee) => isSameMonth(employee.start_date, month)).length;
      const exits = employees.filter((employee) => isSameMonth(employee.end_date, month)).length;

      return {
        month: getMonthLabel(month),
        headcount: activeCount,
        hires,
        exits,
      };
    });
  }, [employees, selectedMonth]);

  const hrRecommendations = useMemo(() => {
    const recommendations = [];

    if (nightShiftRatio > 55) {
      recommendations.push("Night shift is carrying more than half of active headcount. Review workload balance and fatigue risk.");
    }

    if (morningShiftHeadcount === 0 && totalActiveEmployees > 0) {
      recommendations.push("No morning shift employees are currently active. Add morning coverage if operations require daytime support.");
    }

    if (nightShiftHeadcount === 0 && totalActiveEmployees > 0) {
      recommendations.push("No night shift employees are currently active. Add night coverage if after-hours support is required.");
    }

    if (totalActiveTutors < totalActiveNonTeachingStaff) {
      recommendations.push("Tutors are lower than non-teaching staff. Check whether tutor hiring is aligned with student growth.");
    }

    if (contractEndingSoon.length > 0) {
      recommendations.push(`${contractEndingSoon.length} active employee contract(s) end within 45 days. Start renewal or replacement planning.`);
    }

    if (incompleteProfiles.length > 0) {
      recommendations.push(`${incompleteProfiles.length} active employee profile(s) need missing HR information completed.`);
    }

    if (turnoverRate > 10) {
      recommendations.push("Turnover is above 10% for the selected month. Review exit reasons and retention risks.");
    }

    if (!recommendations.length) {
      recommendations.push("Headcount looks stable. Continue monitoring shift coverage, tutor capacity and contract end dates.");
    }

    return recommendations;
  }, [
    nightShiftRatio,
    morningShiftHeadcount,
    nightShiftHeadcount,
    totalActiveEmployees,
    totalActiveTutors,
    totalActiveNonTeachingStaff,
    contractEndingSoon.length,
    incompleteProfiles.length,
    turnoverRate,
  ]);

  function setFormValue<K extends keyof EmployeeForm>(key: K, value: EmployeeForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fte = Number(form.fte || 1);

    if (
      !form.employee_name.trim() ||
      !form.department.trim() ||
      !form.role_title.trim() ||
      !form.role_category ||
      !form.employment_type ||
      !form.shift ||
      !form.status ||
      !form.work_mode ||
      !form.start_date ||
      !Number.isFinite(fte) ||
      fte <= 0
    ) {
      setMessage({
        type: "error",
        text: "Please enter employee name, department, role, category, employment type, shift, status, work mode, start date and valid FTE.",
      });
      return;
    }

    if (form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
      setMessage({
        type: "error",
        text: "End date cannot be before start date.",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        employee_name: form.employee_name.trim(),
        employee_code: form.employee_code.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        department: form.department.trim(),
        role_title: form.role_title.trim(),
        role_category: form.role_category,
        employment_type: form.employment_type,
        shift: form.shift,
        status: form.status,
        work_mode: form.work_mode,
        start_date: form.start_date,
        end_date: form.end_date || null,
        fte,
        manager_name: form.manager_name.trim() || null,
        notes: form.notes.trim() || null,
      };

      const response = editingId
        ? await supabase
            .from("hr_employee_records")
            .update(payload)
            .eq("id", editingId)
            .select()
            .single()
        : await supabase
            .from("hr_employee_records")
            .insert(payload)
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId ? "Employee record updated." : "Employee record created.",
      });

      resetForm();
      await fetchEmployees();
    } catch (error) {
      const text = getErrorMessage(error, "Could not save employee record.");
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(employee: EmployeeRecord) {
    setEditingId(employee.id);
    setForm({
      employee_name: employee.employee_name || "",
      employee_code: employee.employee_code || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || "Teaching",
      role_title: employee.role_title || "",
      role_category: employee.role_category || "Tutor",
      employment_type: employee.employment_type || "Full-time",
      shift: employee.shift || "Morning",
      status: employee.status || "Active",
      work_mode: employee.work_mode || "On-site",
      start_date: employee.start_date || getTodayDate(),
      end_date: employee.end_date || "",
      fte: String(employee.fte || 1),
      manager_name: employee.manager_name || "",
      notes: employee.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(employee: EmployeeRecord) {
    const confirmed = window.confirm(`Delete ${employee.employee_name}'s HR record?`);
    if (!confirmed) return;

    try {
      setMessage(null);

      const { error } = await supabase.from("hr_employee_records").delete().eq("id", employee.id);
      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Employee record deleted." });
      await fetchEmployees();
    } catch (error) {
      const text = getErrorMessage(error, "Could not delete employee record.");
      setMessage({ type: "error", text });
    }
  }

  if (loading && employees.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading HR headcount records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Department - Headcount</h1>
          <p className="text-muted-foreground">
            Track active employees, tutors, non-teaching staff, shift coverage and workforce planning.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-xs text-muted-foreground">Last updated: {lastUpdated}</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className={inputClassName("w-full sm:w-[150px]")}
          />
          <Button onClick={fetchEmployees} variant="outline" size="sm" disabled={loading}>
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

      <SectionTitle icon={UsersRound} title="A. Headcount" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Total active employees"
          value={formatNumber(totalActiveEmployees)}
          icon={Users}
          subtitle={`${formatNumber(currentMonthActiveCount)} active at selected month end`}
          trend={<TrendBadge direction={trendDirection(headcountMoM)} label={`${percentage(headcountMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Total active tutors"
          value={formatNumber(totalActiveTutors)}
          icon={GraduationCap}
          subtitle={`${plainPercentage(tutorRatio)} of active employees`}
          trend={<TrendBadge direction="neutral" label="Teaching capacity" />}
          highlight
        />

        <MetricCard
          title="Total non-teaching staff"
          value={formatNumber(totalActiveNonTeachingStaff)}
          icon={UserCog}
          subtitle={`${plainPercentage(nonTeachingRatio)} of active employees`}
          trend={<TrendBadge direction="neutral" label="Support capacity" />}
          highlight
        />

        <MetricCard
          title="Morning shift headcount"
          value={formatNumber(morningShiftHeadcount)}
          icon={Sun}
          subtitle="Active employees assigned to morning shift"
          trend={<TrendBadge direction={morningShiftHeadcount > 0 ? "up" : "neutral"} label="Morning coverage" />}
          highlight
        />

        <MetricCard
          title="Night shift headcount"
          value={formatNumber(nightShiftHeadcount)}
          icon={Moon}
          subtitle={`${plainPercentage(nightShiftRatio)} of active employees`}
          trend={<TrendBadge direction={nightShiftHeadcount > 0 ? "up" : "neutral"} label="Night coverage" />}
          highlight
        />
      </div>

      <SectionTitle icon={LayoutDashboard} title="HR Workforce Overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total FTE capacity"
          value={totalFte.toFixed(2)}
          icon={BriefcaseBusiness}
          subtitle="Full-time equivalent across active employees"
          variant="outline"
        />

        <MetricCard
          title="New hires this month"
          value={formatNumber(selectedMonthHires.length)}
          icon={UserCheck}
          subtitle={getMonthLabel(selectedMonth)}
          trend={<TrendBadge direction={selectedMonthHires.length > 0 ? "up" : "neutral"} label="Hiring movement" />}
          variant="outline"
        />

        <MetricCard
          title="Exits this month"
          value={formatNumber(selectedMonthExits.length)}
          icon={ArrowDownRight}
          subtitle={`${plainPercentage(turnoverRate)} turnover rate`}
          trend={<TrendBadge direction={selectedMonthExits.length > 0 ? "down" : "neutral"} label="Employee exits" />}
          variant={selectedMonthExits.length > 0 ? "warning" : "outline"}
        />

        <MetricCard
          title="Average tenure"
          value={formatTenure(Math.round(averageTenureMonths))}
          icon={TrendingUp}
          subtitle="Average active employee service length"
          variant="outline"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="On leave"
          value={formatNumber(onLeaveHeadcount)}
          icon={Calendar}
          subtitle="Employees temporarily away"
          variant="outline"
        />

        <MetricCard
          title="Inactive records"
          value={formatNumber(inactiveHeadcount)}
          icon={Minus}
          subtitle="Exited or inactive employees"
          variant="outline"
        />

        <MetricCard
          title="Contracts ending soon"
          value={formatNumber(contractEndingSoon.length)}
          icon={AlertCircle}
          subtitle="Active employees ending within 45 days"
          variant={contractEndingSoon.length > 0 ? "warning" : "outline"}
        />

        <MetricCard
          title="Incomplete HR profiles"
          value={formatNumber(incompleteProfiles.length)}
          icon={ClipboardCheck}
          subtitle="Missing email, phone, manager or key details"
          variant={incompleteProfiles.length > 0 ? "warning" : "outline"}
        />
      </div>

      <SectionTitle icon={Plus} title={editingId ? "Update Employee Record" : "Add Employee Record"} />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{editingId ? "Edit employee details" : "New HR employee record"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add tutors, non-teaching staff, shift details, employment status and FTE capacity.
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
            <div className="lg:col-span-3">
              <FieldLabel>Employee name</FieldLabel>
              <input
                value={form.employee_name}
                onChange={(event) => setFormValue("employee_name", event.target.value)}
                placeholder="Ayesha Khan"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Employee code</FieldLabel>
              <input
                value={form.employee_code}
                onChange={(event) => setFormValue("employee_code", event.target.value)}
                placeholder="EMP-001"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-3">
              <FieldLabel>Email</FieldLabel>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setFormValue("email", event.target.value)}
                placeholder="employee@company.com"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Phone</FieldLabel>
              <input
                value={form.phone}
                onChange={(event) => setFormValue("phone", event.target.value)}
                placeholder="+92..."
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Department</FieldLabel>
              <Select value={form.department} onValueChange={(value) => setFormValue("department", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3">
              <FieldLabel>Role title</FieldLabel>
              <input
                value={form.role_title}
                onChange={(event) => setFormValue("role_title", event.target.value)}
                placeholder="Math Tutor / HR Executive"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Role category</FieldLabel>
              <Select
                value={form.role_category}
                onValueChange={(value) => setFormValue("role_category", value as RoleCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Employment type</FieldLabel>
              <Select
                value={form.employment_type}
                onValueChange={(value) => setFormValue("employment_type", value as EmploymentType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Employment type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Shift</FieldLabel>
              <Select value={form.shift} onValueChange={(value) => setFormValue("shift", value as Shift)}>
                <SelectTrigger>
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFTS.map((shift) => (
                    <SelectItem key={shift} value={shift}>
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Status</FieldLabel>
              <Select value={form.status} onValueChange={(value) => setFormValue("status", value as EmployeeStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Work mode</FieldLabel>
              <Select value={form.work_mode} onValueChange={(value) => setFormValue("work_mode", value as WorkMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Work mode" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Start date</FieldLabel>
              <input
                type="date"
                value={form.start_date}
                onChange={(event) => setFormValue("start_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>End date / contract end</FieldLabel>
              <input
                type="date"
                value={form.end_date}
                onChange={(event) => setFormValue("end_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>FTE</FieldLabel>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.fte}
                onChange={(event) => setFormValue("fte", event.target.value)}
                placeholder="1"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-3">
              <FieldLabel>Manager name</FieldLabel>
              <input
                value={form.manager_name}
                onChange={(event) => setFormValue("manager_name", event.target.value)}
                placeholder="Line manager"
                className={inputClassName()}
              />
            </div>

            <div className="flex items-end lg:col-span-3">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit3 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Update Employee" : "Save Employee"}
              </Button>
            </div>

            <div className="lg:col-span-12">
              <FieldLabel>HR notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => setFormValue("notes", event.target.value)}
                placeholder="Optional: contract notes, performance flags, shift preferences, hiring notes, training needs, etc."
                className={textareaClassName()}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <SectionTitle icon={BarChart3} title="Headcount Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shift Headcount</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shift" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Headcount"]} />
                <Bar dataKey="headcount" name="Headcount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tutors vs Non-Teaching Staff</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Headcount"]} />
                <Bar dataKey="headcount" name="Headcount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="tutors" name="Tutors" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonTeaching" name="Non-Teaching Staff" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6-Month Headcount Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={headcountTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Line type="monotone" dataKey="headcount" name="Headcount" stroke="#4f46e5" strokeWidth={2.5} />
                <Line type="monotone" dataKey="hires" name="Hires" stroke="#10b981" strokeWidth={2.5} />
                <Line type="monotone" dataKey="exits" name="Exits" stroke="#ef4444" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={ShieldCheck} title="Future HR Planning Alerts" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">HR Recommendations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Automatic suggestions based on headcount, shift coverage, tutor ratio, contracts and profile completeness.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hrRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <p className="text-sm text-muted-foreground">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mandatory Headcount Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Total active employees</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Total active tutors</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Total non-teaching staff</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Morning shift headcount</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Night shift headcount</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {contractEndingSoon.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-base">Contracts Ending Within 45 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-amber-200 dark:border-amber-800">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-amber-100/60 text-xs uppercase tracking-wide text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">End Date</th>
                    <th className="px-4 py-3 font-semibold">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200 dark:divide-amber-900">
                  {contractEndingSoon.map((employee) => {
                    const daysLeft = getDaysUntil(employee.end_date);

                    return (
                      <tr key={employee.id}>
                        <td className="px-4 py-3 font-semibold">{employee.employee_name}</td>
                        <td className="px-4 py-3">{employee.department}</td>
                        <td className="px-4 py-3">{employee.role_title}</td>
                        <td className="px-4 py-3">{employee.end_date}</td>
                        <td className="px-4 py-3">{daysLeft ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <SectionTitle icon={Search} title="Employee Records" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter, edit and delete HR records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleEmployees.length)} of {formatNumber(employees.length)} employee records.
              </p>
            </div>

            <Button onClick={fetchEmployees} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
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
              <FieldLabel>Status</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
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
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search name, role, email..."
                  className={inputClassName("pl-9")}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1320px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Shift</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">FTE</th>
                  <th className="px-4 py-3 font-semibold">Start Date</th>
                  <th className="px-4 py-3 font-semibold">Tenure</th>
                  <th className="px-4 py-3 font-semibold">Manager</th>
                  <th className="px-4 py-3 font-semibold">Profile</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading employee records…
                    </td>
                  </tr>
                ) : visibleEmployees.length ? (
                  visibleEmployees.map((employee) => {
                    const missingFields = getMissingFields(employee);
                    const tenure = getTenureMonths(employee.start_date, employee.end_date || undefined);

                    return (
                      <tr key={employee.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold">{employee.employee_name}</p>
                            <p className="text-xs text-muted-foreground">{employee.email || "No email"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{employee.employee_code || "—"}</td>
                        <td className="px-4 py-3">{employee.department}</td>
                        <td className="px-4 py-3">{employee.role_title}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                            {employee.role_category}
                          </span>
                        </td>
                        <td className="px-4 py-3">{employee.shift}</td>
                        <td className="px-4 py-3">
                          <TrendBadge
                            direction={
                              employee.status === "Active"
                                ? "up"
                                : employee.status === "On Leave"
                                  ? "neutral"
                                  : "down"
                            }
                            label={employee.status}
                          />
                        </td>
                        <td className="px-4 py-3">{getFte(employee.fte).toFixed(2)}</td>
                        <td className="px-4 py-3">{employee.start_date}</td>
                        <td className="px-4 py-3">{formatTenure(tenure)}</td>
                        <td className="px-4 py-3">{employee.manager_name || "—"}</td>
                        <td className="px-4 py-3">
                          {missingFields.length ? (
                            <span className="text-xs text-amber-700 dark:text-amber-300">
                              Missing {missingFields.length}
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-700 dark:text-emerald-300">Complete</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="icon" onClick={() => handleEdit(employee)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(employee)}
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
                    <td colSpan={13} className="px-4 py-10 text-center text-muted-foreground">
                      No HR employee records found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}