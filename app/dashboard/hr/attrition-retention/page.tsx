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
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingDown,
  UserCog,
  UserMinus,
  UserX,
  Users,
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

type ExitType = "Voluntary" | "Involuntary" | "Contract End" | "Performance" | "Other";

type ExitReason =
  | "Resignation"
  | "Better Opportunity"
  | "Relocation"
  | "Personal Reasons"
  | "Compensation"
  | "Performance Issue"
  | "Contract Completed"
  | "Policy Violation"
  | "Role Redundancy"
  | "Other";

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

type ExitRecord = {
  id: string;
  month: string;
  employee_id: string;
  employee_name: string;
  employee_code: string | null;
  department: string;
  role_title: string | null;
  role_category: RoleCategory;
  shift: Shift;
  start_date: string;
  exit_date: string;
  exit_type: ExitType;
  exit_reason: ExitReason;
  regrettable_exit: boolean;
  replacement_required: boolean;
  replacement_hired: boolean;
  rehire_eligible: boolean;
  knowledge_handover_done: boolean;
  final_settlement_done: boolean;
  exit_interview_done: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type ExitForm = {
  month: string;
  employee_id: string;
  exit_date: string;
  exit_type: ExitType;
  exit_reason: ExitReason;
  regrettable_exit: string;
  replacement_required: string;
  replacement_hired: string;
  rehire_eligible: string;
  knowledge_handover_done: string;
  final_settlement_done: string;
  exit_interview_done: string;
  notes: string;
};

type DepartmentFilter = "all" | string;
type RoleFilter = "all" | RoleCategory;
type ShiftFilter = "all" | Shift;
type ExitTypeFilter = "all" | ExitType;

const ROLE_CATEGORIES: RoleCategory[] = ["Tutor", "Non-Teaching Staff"];
const SHIFTS: Shift[] = ["Morning", "Night", "Flexible"];
const EXIT_TYPES: ExitType[] = ["Voluntary", "Involuntary", "Contract End", "Performance", "Other"];

const EXIT_REASONS: ExitReason[] = [
  "Resignation",
  "Better Opportunity",
  "Relocation",
  "Personal Reasons",
  "Compensation",
  "Performance Issue",
  "Contract Completed",
  "Policy Violation",
  "Role Redundancy",
  "Other",
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

function emptyForm(month = getCurrentMonth()): ExitForm {
  return {
    month,
    employee_id: "",
    exit_date: getTodayDate(),
    exit_type: "Voluntary",
    exit_reason: "Resignation",
    regrettable_exit: "false",
    replacement_required: "true",
    replacement_hired: "false",
    rehire_eligible: "true",
    knowledge_handover_done: "false",
    final_settlement_done: "false",
    exit_interview_done: "false",
    notes: "",
  };
}

function toBool(value: string | boolean | null | undefined) {
  if (typeof value === "boolean") return value;
  return value === "true";
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

function isEmployeeActiveAtMonthEnd(employee: EmployeeRecord, month: string) {
  const monthEnd = getMonthEnd(month);
  const startDate = employee.start_date ? new Date(employee.start_date) : null;
  const endDate = employee.end_date ? new Date(employee.end_date) : null;

  if (!startDate || startDate > monthEnd) return false;
  if (endDate && endDate <= monthEnd) return false;

  return true;
}

function getTenureDays(startDateValue: string | null | undefined, endDateValue: string | null | undefined) {
  if (!startDateValue || !endDateValue) return 0;

  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;

  return Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatTenure(days: number) {
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} mo`;

  const years = Math.floor(days / 365);
  const months = Math.round((days % 365) / 30);

  return months ? `${years}y ${months}m` : `${years}y`;
}

export default function HRAttritionRetentionPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [exitTypeFilter, setExitTypeFilter] = useState<ExitTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<ExitForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const [employeesResponse, exitsResponse] = await Promise.all([
        supabase
          .from("hr_employee_records")
          .select("*")
          .order("employee_name", { ascending: true }),

        supabase
          .from("hr_exit_records")
          .select("*")
          .order("month", { ascending: false })
          .order("exit_date", { ascending: false }),
      ]);

      if (employeesResponse.error) throw new Error(employeesResponse.error.message);
      if (exitsResponse.error) throw new Error(exitsResponse.error.message);

      setEmployees((employeesResponse.data || []) as EmployeeRecord[]);
      setExitRecords((exitsResponse.data || []) as ExitRecord[]);

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      const text = getErrorMessage(
        error,
        "Could not load attrition records. Please check hr_employee_records and hr_exit_records."
      );
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedExitRecords = useMemo(
    () => exitRecords.filter((record) => record.month === selectedMonth),
    [exitRecords, selectedMonth]
  );

  const previousMonth = getPreviousMonth(selectedMonth);

  const previousExitRecords = useMemo(
    () => exitRecords.filter((record) => record.month === previousMonth),
    [exitRecords, previousMonth]
  );

  const departmentOptions = useMemo(() => {
    const employeeDepartments = employees.map((employee) => employee.department).filter(Boolean);
    const exitDepartments = exitRecords.map((record) => record.department).filter(Boolean);
    return Array.from(new Set([...employeeDepartments, ...exitDepartments])).sort();
  }, [employees, exitRecords]);

  const previousMonthHeadcount = useMemo(
    () => employees.filter((employee) => isEmployeeActiveAtMonthEnd(employee, previousMonth)).length,
    [employees, previousMonth]
  );

  const currentMonthHeadcount = useMemo(
    () => employees.filter((employee) => isEmployeeActiveAtMonthEnd(employee, selectedMonth)).length,
    [employees, selectedMonth]
  );

  const activeEmployeeCount = employees.filter((employee) => employee.status === "Active").length;

  const averageHeadcount = previousMonthHeadcount
    ? (previousMonthHeadcount + currentMonthHeadcount) / 2
    : currentMonthHeadcount || activeEmployeeCount;

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedExitRecords
      .filter((record) => departmentFilter === "all" || record.department === departmentFilter)
      .filter((record) => roleFilter === "all" || record.role_category === roleFilter)
      .filter((record) => shiftFilter === "all" || record.shift === shiftFilter)
      .filter((record) => exitTypeFilter === "all" || record.exit_type === exitTypeFilter)
      .filter((record) => {
        if (!query) return true;

        return [
          record.employee_name,
          record.employee_code || "",
          record.department,
          record.role_title || "",
          record.role_category,
          record.shift,
          record.exit_type,
          record.exit_reason,
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => new Date(b.exit_date).getTime() - new Date(a.exit_date).getTime());
  }, [selectedExitRecords, departmentFilter, roleFilter, shiftFilter, exitTypeFilter, searchQuery]);

  const totalExits = selectedExitRecords.length;
  const tutorExits = selectedExitRecords.filter((record) => record.role_category === "Tutor").length;
  const nonTeachingExits = selectedExitRecords.filter((record) => record.role_category === "Non-Teaching Staff").length;

  const earlyAttrition = selectedExitRecords.filter(
    (record) => getTenureDays(record.start_date, record.exit_date) < 90
  ).length;

  const attritionRate = averageHeadcount ? (totalExits / averageHeadcount) * 100 : 0;
  const retentionRate = averageHeadcount ? ((averageHeadcount - totalExits) / averageHeadcount) * 100 : 100;

  const previousAverageHeadcount = previousMonthHeadcount || averageHeadcount;
  const previousAttritionRate = previousAverageHeadcount
    ? (previousExitRecords.length / previousAverageHeadcount) * 100
    : 0;

  const attritionRateMoM = previousAttritionRate
    ? attritionRate - previousAttritionRate
    : attritionRate > 0
      ? attritionRate
      : 0;

  const exitMoM = previousExitRecords.length
    ? ((totalExits - previousExitRecords.length) / previousExitRecords.length) * 100
    : totalExits > 0
      ? 100
      : 0;

  const voluntaryExits = selectedExitRecords.filter((record) => record.exit_type === "Voluntary").length;
  const involuntaryExits = selectedExitRecords.filter((record) => record.exit_type === "Involuntary").length;
  const contractEndExits = selectedExitRecords.filter((record) => record.exit_type === "Contract End").length;
  const regrettableExits = selectedExitRecords.filter((record) => record.regrettable_exit).length;
  const replacementRequired = selectedExitRecords.filter((record) => record.replacement_required).length;
  const replacementHired = selectedExitRecords.filter((record) => record.replacement_hired).length;
  const exitInterviewsPending = selectedExitRecords.filter((record) => !record.exit_interview_done).length;
  const handoverPending = selectedExitRecords.filter((record) => !record.knowledge_handover_done).length;
  const settlementPending = selectedExitRecords.filter((record) => !record.final_settlement_done).length;

  const averageTenureAtExitDays = totalExits
    ? selectedExitRecords.reduce((sum, record) => sum + getTenureDays(record.start_date, record.exit_date), 0) / totalExits
    : 0;

  const departmentSummary = useMemo(() => {
    return departmentOptions
      .map((department) => {
        const records = selectedExitRecords.filter((record) => record.department === department);
        const departmentHeadcount = employees.filter(
          (employee) =>
            employee.department === department &&
            isEmployeeActiveAtMonthEnd(employee, selectedMonth)
        ).length;

        const exits = records.length;
        const early = records.filter((record) => getTenureDays(record.start_date, record.exit_date) < 90).length;

        return {
          department,
          exits,
          tutorExits: records.filter((record) => record.role_category === "Tutor").length,
          nonTeachingExits: records.filter((record) => record.role_category === "Non-Teaching Staff").length,
          earlyAttrition: early,
          attritionRate: departmentHeadcount ? (exits / departmentHeadcount) * 100 : 0,
        };
      })
      .filter((item) => item.exits > 0)
      .sort((a, b) => b.exits - a.exits);
  }, [departmentOptions, selectedExitRecords, employees, selectedMonth]);

  const roleSummary = [
    {
      name: "Tutor",
      exits: tutorExits,
      earlyAttrition: selectedExitRecords.filter(
        (record) => record.role_category === "Tutor" && getTenureDays(record.start_date, record.exit_date) < 90
      ).length,
      regrettableExits: selectedExitRecords.filter(
        (record) => record.role_category === "Tutor" && record.regrettable_exit
      ).length,
    },
    {
      name: "Non-Teaching",
      exits: nonTeachingExits,
      earlyAttrition: selectedExitRecords.filter(
        (record) =>
          record.role_category === "Non-Teaching Staff" &&
          getTenureDays(record.start_date, record.exit_date) < 90
      ).length,
      regrettableExits: selectedExitRecords.filter(
        (record) => record.role_category === "Non-Teaching Staff" && record.regrettable_exit
      ).length,
    },
  ];

  const shiftSummary = [
    {
      name: "Morning",
      exits: selectedExitRecords.filter((record) => record.shift === "Morning").length,
      earlyAttrition: selectedExitRecords.filter(
        (record) => record.shift === "Morning" && getTenureDays(record.start_date, record.exit_date) < 90
      ).length,
    },
    {
      name: "Night",
      exits: selectedExitRecords.filter((record) => record.shift === "Night").length,
      earlyAttrition: selectedExitRecords.filter(
        (record) => record.shift === "Night" && getTenureDays(record.start_date, record.exit_date) < 90
      ).length,
    },
    {
      name: "Flexible",
      exits: selectedExitRecords.filter((record) => record.shift === "Flexible").length,
      earlyAttrition: selectedExitRecords.filter(
        (record) => record.shift === "Flexible" && getTenureDays(record.start_date, record.exit_date) < 90
      ).length,
    },
  ];

  const reasonSummary = EXIT_REASONS.map((reason) => ({
    reason,
    exits: selectedExitRecords.filter((record) => record.exit_reason === reason).length,
  })).filter((item) => item.exits > 0);

  const attritionTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const records = exitRecords.filter((record) => record.month === month);
      const previous = getPreviousMonth(month);
      const previousHeadcount = employees.filter((employee) => isEmployeeActiveAtMonthEnd(employee, previous)).length;
      const currentHeadcount = employees.filter((employee) => isEmployeeActiveAtMonthEnd(employee, month)).length;
      const avgHeadcount = previousHeadcount ? (previousHeadcount + currentHeadcount) / 2 : currentHeadcount;
      const exits = records.length;
      const early = records.filter((record) => getTenureDays(record.start_date, record.exit_date) < 90).length;

      return {
        month: getMonthLabel(month),
        exits,
        earlyAttrition: early,
        attritionRate: avgHeadcount ? (exits / avgHeadcount) * 100 : 0,
      };
    });
  }, [exitRecords, employees, selectedMonth]);

  const alerts = useMemo(() => {
    const items = [];

    if (attritionRate > 10) {
      items.push(`Attrition rate is ${plainPercentage(attritionRate)}, which is above the 10% watch level for this month.`);
    }

    if (earlyAttrition > 0) {
      items.push(`${earlyAttrition} employee(s) left within 90 days. Review hiring quality, onboarding and manager support.`);
    }

    if (regrettableExits > 0) {
      items.push(`${regrettableExits} regrettable exit(s) recorded. Prioritize retention review for similar roles.`);
    }

    if (tutorExits > nonTeachingExits && tutorExits > 0) {
      items.push("Tutor exits are higher than non-teaching exits. Check tutor workload, pay, scheduling and manager support.");
    }

    if (exitInterviewsPending > 0) {
      items.push(`${exitInterviewsPending} exit interview(s) are still pending.`);
    }

    if (handoverPending > 0) {
      items.push(`${handoverPending} knowledge handover(s) are still pending.`);
    }

    if (settlementPending > 0) {
      items.push(`${settlementPending} final settlement(s) are still pending.`);
    }

    if (replacementRequired > replacementHired) {
      items.push(`${replacementRequired - replacementHired} required replacement(s) are still not hired.`);
    }

    if (!items.length) {
      items.push("Retention looks stable. Continue monitoring exit reasons, early attrition and regrettable exits.");
    }

    return items;
  }, [
    attritionRate,
    earlyAttrition,
    regrettableExits,
    tutorExits,
    nonTeachingExits,
    exitInterviewsPending,
    handoverPending,
    settlementPending,
    replacementRequired,
    replacementHired,
  ]);

  const earlyAttritionRecords = selectedExitRecords
    .filter((record) => getTenureDays(record.start_date, record.exit_date) < 90)
    .sort((a, b) => getTenureDays(a.start_date, a.exit_date) - getTenureDays(b.start_date, b.exit_date))
    .slice(0, 5);

  function setFormValue<K extends keyof ExitForm>(key: K, value: ExitForm[K]) {
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

    if (!form.month || !selectedEmployee || !form.exit_date || !form.exit_type || !form.exit_reason) {
      setMessage({
        type: "error",
        text: "Please select month, employee, exit date, exit type and exit reason.",
      });
      return;
    }

    if (selectedEmployee.start_date && new Date(form.exit_date) < new Date(selectedEmployee.start_date)) {
      setMessage({
        type: "error",
        text: "Exit date cannot be before employee start date.",
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
        role_title: selectedEmployee.role_title,
        role_category: selectedEmployee.role_category,
        shift: selectedEmployee.shift,
        start_date: selectedEmployee.start_date,
        exit_date: form.exit_date,
        exit_type: form.exit_type,
        exit_reason: form.exit_reason,
        regrettable_exit: toBool(form.regrettable_exit),
        replacement_required: toBool(form.replacement_required),
        replacement_hired: toBool(form.replacement_hired),
        rehire_eligible: toBool(form.rehire_eligible),
        knowledge_handover_done: toBool(form.knowledge_handover_done),
        final_settlement_done: toBool(form.final_settlement_done),
        exit_interview_done: toBool(form.exit_interview_done),
        notes: form.notes.trim() || null,
      };

      const response = editingId
        ? await supabase
            .from("hr_exit_records")
            .update(payload)
            .eq("id", editingId)
            .select()
            .single()
        : await supabase
            .from("hr_exit_records")
            .insert(payload)
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      const employeeUpdate = await supabase
        .from("hr_employee_records")
        .update({
          status: "Inactive",
          end_date: form.exit_date,
        })
        .eq("id", selectedEmployee.id);

      if (employeeUpdate.error) throw new Error(employeeUpdate.error.message);

      setSelectedMonth(form.month);
      setMessage({
        type: "success",
        text: editingId ? "Exit record updated." : "Exit record created and employee marked inactive.",
      });

      resetForm();
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not save exit record.");
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(record: ExitRecord) {
    setEditingId(record.id);
    setForm({
      month: record.month,
      employee_id: record.employee_id,
      exit_date: record.exit_date,
      exit_type: record.exit_type,
      exit_reason: record.exit_reason,
      regrettable_exit: String(record.regrettable_exit),
      replacement_required: String(record.replacement_required),
      replacement_hired: String(record.replacement_hired),
      rehire_eligible: String(record.rehire_eligible),
      knowledge_handover_done: String(record.knowledge_handover_done),
      final_settlement_done: String(record.final_settlement_done),
      exit_interview_done: String(record.exit_interview_done),
      notes: record.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(record: ExitRecord) {
    const confirmed = window.confirm(`Delete exit record for ${record.employee_name}?`);
    if (!confirmed) return;

    try {
      setMessage(null);

      const { error } = await supabase.from("hr_exit_records").delete().eq("id", record.id);

      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Exit record deleted." });
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not delete exit record.");
      setMessage({ type: "error", text });
    }
  }

  if (loading && employees.length === 0 && exitRecords.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading HR attrition records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Department - Attrition & Retention</h1>
          <p className="text-muted-foreground">
            Track exits, tutor exits, non-teaching exits, attrition rate and early attrition under 90 days.
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

      <SectionTitle icon={UserMinus} title="E. Attrition & Retention" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Total exits"
          value={formatNumber(totalExits)}
          icon={UserX}
          subtitle={`${previousMonth}: ${formatNumber(previousExitRecords.length)} exits`}
          trend={<TrendBadge direction={trendDirection(exitMoM)} label={`${percentage(exitMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Tutor exits"
          value={formatNumber(tutorExits)}
          icon={GraduationCap}
          subtitle={`${plainPercentage(totalExits ? (tutorExits / totalExits) * 100 : 0)} of exits`}
          highlight
        />

        <MetricCard
          title="Non-teaching exits"
          value={formatNumber(nonTeachingExits)}
          icon={UserCog}
          subtitle={`${plainPercentage(totalExits ? (nonTeachingExits / totalExits) * 100 : 0)} of exits`}
          highlight
        />

        <MetricCard
          title="Attrition rate %"
          value={plainPercentage(attritionRate)}
          icon={TrendingDown}
          subtitle={`Average headcount: ${formatNumber(Math.round(averageHeadcount))}`}
          trend={<TrendBadge direction={trendDirection(attritionRateMoM)} label={`${percentage(attritionRateMoM)} pts MoM`} />}
          variant={attritionRate > 10 ? "warning" : "default"}
          highlight
        />

        <MetricCard
          title="Early attrition <90 days"
          value={formatNumber(earlyAttrition)}
          icon={AlertCircle}
          subtitle={`${plainPercentage(totalExits ? (earlyAttrition / totalExits) * 100 : 0)} of exits`}
          variant={earlyAttrition > 0 ? "warning" : "default"}
          highlight
        />
      </div>

      <SectionTitle icon={LayoutDashboard} title="Retention Overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Retention rate" value={plainPercentage(retentionRate)} icon={ShieldCheck} subtitle="100% minus attrition impact" variant="outline" />
        <MetricCard title="Voluntary exits" value={formatNumber(voluntaryExits)} icon={ArrowDownRight} subtitle={`${plainPercentage(totalExits ? (voluntaryExits / totalExits) * 100 : 0)} of exits`} variant="outline" />
        <MetricCard title="Regrettable exits" value={formatNumber(regrettableExits)} icon={AlertCircle} subtitle="High-value exits HR should review" variant={regrettableExits > 0 ? "warning" : "outline"} />
        <MetricCard title="Average tenure at exit" value={formatTenure(Math.round(averageTenureAtExitDays))} icon={Calendar} subtitle="Average service length before exit" variant="outline" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Involuntary exits" value={formatNumber(involuntaryExits)} icon={UserMinus} subtitle="Terminated or company-led exits" variant="outline" />
        <MetricCard title="Contract end exits" value={formatNumber(contractEndExits)} icon={BriefcaseBusiness} subtitle="Contract completed exits" variant="outline" />
        <MetricCard title="Replacement required" value={formatNumber(replacementRequired)} icon={Users} subtitle={`${formatNumber(replacementHired)} replacement(s) hired`} variant={replacementRequired > replacementHired ? "warning" : "outline"} />
        <MetricCard title="Pending exit tasks" value={formatNumber(exitInterviewsPending + handoverPending + settlementPending)} icon={ClipboardCheck} subtitle="Interviews, handovers or settlements pending" variant={exitInterviewsPending + handoverPending + settlementPending > 0 ? "warning" : "outline"} />
      </div>

      <SectionTitle icon={Plus} title={editingId ? "Update Exit Record" : "Add Exit Record"} />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{editingId ? "Edit employee exit details" : "New employee exit record"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select an employee. Department, role, shift and start date are copied automatically from HR headcount.
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
              <FieldLabel>Exit date</FieldLabel>
              <input type="date" value={form.exit_date} onChange={(event) => setFormValue("exit_date", event.target.value)} className={inputClassName()} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Exit type</FieldLabel>
              <Select value={form.exit_type} onValueChange={(value) => setFormValue("exit_type", value as ExitType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Exit type" />
                </SelectTrigger>
                <SelectContent>
                  {EXIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Exit reason</FieldLabel>
              <Select value={form.exit_reason} onValueChange={(value) => setFormValue("exit_reason", value as ExitReason)}>
                <SelectTrigger>
                  <SelectValue placeholder="Exit reason" />
                </SelectTrigger>
                <SelectContent>
                  {EXIT_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {[
              ["regrettable_exit", "Regrettable exit?"],
              ["replacement_required", "Replacement required?"],
              ["replacement_hired", "Replacement hired?"],
              ["rehire_eligible", "Rehire eligible?"],
              ["knowledge_handover_done", "Handover done?"],
              ["final_settlement_done", "Settlement done?"],
              ["exit_interview_done", "Exit interview done?"],
            ].map(([key, label]) => (
              <div className="lg:col-span-2" key={key}>
                <FieldLabel>{label}</FieldLabel>
                <Select value={form[key as keyof ExitForm]} onValueChange={(value) => setFormValue(key as keyof ExitForm, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="flex items-end lg:col-span-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit3 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Update Exit" : "Save Exit"}
              </Button>
            </div>

            <div className="lg:col-span-12">
              <FieldLabel>Exit notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => setFormValue("notes", event.target.value)}
                placeholder="Optional: exit interview notes, retention risk, replacement plan, manager feedback, settlement notes, etc."
                className={textareaClassName()}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <SectionTitle icon={BarChart3} title="Attrition Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role-wise Exits</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="exits" name="Total Exits" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earlyAttrition" name="Early Attrition" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="regrettableExits" name="Regrettable Exits" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shift-wise Exits</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="exits" name="Total Exits" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earlyAttrition" name="Early Attrition" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department-wise Attrition</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: unknown, name) => {
                    if (name === "attritionRate") return [`${Number(value).toFixed(1)}%`, "Attrition Rate"];
                    return [formatNumber(Number(value) || 0), ""];
                  }}
                />
                <Legend />
                <Bar dataKey="exits" name="Total Exits" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earlyAttrition" name="Early Attrition" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attritionRate" name="Attrition Rate %" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6-Month Attrition Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attritionTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: unknown, name) => {
                    if (name === "Attrition Rate") return [`${Number(value).toFixed(1)}%`, name];
                    return [formatNumber(Number(value) || 0), name];
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="attritionRate" name="Attrition Rate" stroke="#ef4444" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="exits" name="Total Exits" stroke="#4f46e5" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="earlyAttrition" name="Early Attrition" stroke="#f59e0b" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exit Reason Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="reason" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Exits"]} />
                <Bar dataKey="exits" name="Exits" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Early Attrition Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {earlyAttritionRecords.length ? (
                earlyAttritionRecords.map((record, index) => {
                  const tenureDays = getTenureDays(record.start_date, record.exit_date);

                  return (
                    <div key={record.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                      <div>
                        <p className="text-sm font-semibold">
                          {index + 1}. {record.employee_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.department} · {record.role_category} · {record.exit_reason}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-amber-600">{formatTenure(tenureDays)}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No early attrition records this month.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={ShieldCheck} title="Retention Controls & Alerts" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Retention Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Automatic checks for high attrition, early exits, regrettable exits, pending handovers and replacement gaps.
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
            <CardTitle className="text-base">Mandatory Attrition Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Total exits", "Tutor exits", "Non-teaching exits", "Attrition rate %", "Early attrition <90 days"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Search} title="Exit Records" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter, edit and delete exit records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleRecords.length)} of {formatNumber(selectedExitRecords.length)} exit records for {getMonthLabel(selectedMonth)}.
              </p>
            </div>

            <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
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
                    <SelectItem key={department} value={department}>{department}</SelectItem>
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
                    <SelectItem key={role} value={role}>{role}</SelectItem>
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
                    <SelectItem key={shift} value={shift}>{shift}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Exit type</FieldLabel>
              <Select value={exitTypeFilter} onValueChange={(value) => setExitTypeFilter(value as ExitTypeFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Exit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All exit types</SelectItem>
                  {EXIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
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
                  placeholder="Search employee, reason..."
                  className={inputClassName("pl-9")}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1520px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Shift</th>
                  <th className="px-4 py-3 font-semibold">Exit Date</th>
                  <th className="px-4 py-3 font-semibold">Tenure</th>
                  <th className="px-4 py-3 font-semibold">Exit Type</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Early?</th>
                  <th className="px-4 py-3 font-semibold">Regrettable?</th>
                  <th className="px-4 py-3 font-semibold">Replacement</th>
                  <th className="px-4 py-3 font-semibold">Exit Tasks</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={15} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading exit records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => {
                    const tenureDays = getTenureDays(record.start_date, record.exit_date);
                    const isEarly = tenureDays < 90;
                    const pendingTasks = [
                      !record.exit_interview_done,
                      !record.knowledge_handover_done,
                      !record.final_settlement_done,
                    ].filter(Boolean).length;

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
                        <td className="px-4 py-3">{record.role_title || "—"}</td>
                        <td className="px-4 py-3">{record.role_category}</td>
                        <td className="px-4 py-3">{record.shift}</td>
                        <td className="px-4 py-3">{record.exit_date}</td>
                        <td className="px-4 py-3">{formatTenure(tenureDays)}</td>
                        <td className="px-4 py-3">{record.exit_type}</td>
                        <td className="px-4 py-3">{record.exit_reason}</td>
                        <td className="px-4 py-3">
                          <TrendBadge direction={isEarly ? "down" : "neutral"} label={isEarly ? "Early" : "No"} />
                        </td>
                        <td className="px-4 py-3">
                          <TrendBadge direction={record.regrettable_exit ? "down" : "neutral"} label={record.regrettable_exit ? "Yes" : "No"} />
                        </td>
                        <td className="px-4 py-3">
                          {record.replacement_required ? (
                            <TrendBadge direction={record.replacement_hired ? "up" : "down"} label={record.replacement_hired ? "Hired" : "Required"} />
                          ) : (
                            <TrendBadge direction="neutral" label="Not required" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <TrendBadge direction={pendingTasks > 0 ? "down" : "up"} label={pendingTasks > 0 ? `${pendingTasks} pending` : "Complete"} />
                        </td>
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
                      No exit records found for this filter.
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