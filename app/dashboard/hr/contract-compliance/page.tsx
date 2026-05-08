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
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FileCheck,
  FileWarning,
  Gavel,
  LayoutDashboard,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Trash2,
  UserCheck,
  UserCog,
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

type ContractStatus =
  | "Probation"
  | "Confirmed"
  | "Contract"
  | "Intern"
  | "Consultant";

type ComplianceStatus =
  | "Compliant"
  | "Pending"
  | "At Risk"
  | "Non-Compliant";

type DisciplinaryActionType =
  | "None"
  | "Verbal Warning"
  | "Written Warning"
  | "Final Warning"
  | "Suspension"
  | "Termination Recommendation"
  | "Other";

type DisciplinarySeverity = "Low" | "Medium" | "High" | "Critical";

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

type ContractComplianceRecord = {
  id: string;
  month: string;
  employee_id: string;
  employee_name: string;
  employee_code: string | null;
  department: string;
  role_title: string | null;
  role_category: RoleCategory;
  shift: Shift;

  contract_status: ContractStatus;
  probation_start_date: string | null;
  probation_end_date: string | null;
  confirmation_date: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;

  compliance_status: ComplianceStatus;
  policy_acknowledged: boolean;
  documents_complete: boolean;
  background_check_done: boolean;

  disciplinary_action_issued: boolean;
  disciplinary_action_type: DisciplinaryActionType;
  disciplinary_action_date: string | null;
  disciplinary_severity: DisciplinarySeverity | null;
  action_closed: boolean;

  next_review_date: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string | null;
};

type ComplianceForm = {
  month: string;
  employee_id: string;

  contract_status: ContractStatus;
  probation_start_date: string;
  probation_end_date: string;
  confirmation_date: string;
  contract_start_date: string;
  contract_end_date: string;

  compliance_status: ComplianceStatus;
  policy_acknowledged: string;
  documents_complete: string;
  background_check_done: string;

  disciplinary_action_issued: string;
  disciplinary_action_type: DisciplinaryActionType;
  disciplinary_action_date: string;
  disciplinary_severity: DisciplinarySeverity;
  action_closed: string;

  next_review_date: string;
  notes: string;
};

type DepartmentFilter = "all" | string;
type RoleFilter = "all" | RoleCategory;
type ShiftFilter = "all" | Shift;
type ContractStatusFilter = "all" | ContractStatus;
type ComplianceStatusFilter = "all" | ComplianceStatus;

const ROLE_CATEGORIES: RoleCategory[] = ["Tutor", "Non-Teaching Staff"];
const SHIFTS: Shift[] = ["Morning", "Night", "Flexible"];

const CONTRACT_STATUSES: ContractStatus[] = [
  "Probation",
  "Confirmed",
  "Contract",
  "Intern",
  "Consultant",
];

const COMPLIANCE_STATUSES: ComplianceStatus[] = [
  "Compliant",
  "Pending",
  "At Risk",
  "Non-Compliant",
];

const DISCIPLINARY_ACTION_TYPES: DisciplinaryActionType[] = [
  "None",
  "Verbal Warning",
  "Written Warning",
  "Final Warning",
  "Suspension",
  "Termination Recommendation",
  "Other",
];

const DISCIPLINARY_SEVERITIES: DisciplinarySeverity[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
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

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function emptyForm(month = getCurrentMonth()): ComplianceForm {
  return {
    month,
    employee_id: "",

    contract_status: "Probation",
    probation_start_date: getTodayDate(),
    probation_end_date: "",
    confirmation_date: "",
    contract_start_date: getTodayDate(),
    contract_end_date: "",

    compliance_status: "Pending",
    policy_acknowledged: "false",
    documents_complete: "false",
    background_check_done: "false",

    disciplinary_action_issued: "false",
    disciplinary_action_type: "None",
    disciplinary_action_date: "",
    disciplinary_severity: "Low",
    action_closed: "false",

    next_review_date: "",
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
}: {
  title: string;
  value: string | number;
  icon: ElementType;
  subtitle?: string;
  trend?: ReactNode;
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
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
            {trend && <div className="mt-2">{trend}</div>}
          </div>
          <div className="ml-3 rounded-full bg-muted/60 p-2.5">
            <Icon className="h-5 w-5 text-indigo-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function isWithinNextDays(dateValue: string | null | undefined, days: number) {
  if (!dateValue) return false;

  const today = new Date(getTodayDate());
  const future = addDays(today, days);
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return false;

  return date >= today && date <= future;
}

function getDaysUntil(dateValue: string | null | undefined) {
  if (!dateValue) return null;

  const today = new Date(getTodayDate());
  const target = new Date(dateValue);

  if (Number.isNaN(target.getTime())) return null;

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function HRContractCompliancePage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [records, setRecords] = useState<ContractComplianceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [contractStatusFilter, setContractStatusFilter] = useState<ContractStatusFilter>("all");
  const [complianceStatusFilter, setComplianceStatusFilter] = useState<ComplianceStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState<ComplianceForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const [employeesResponse, complianceResponse] = await Promise.all([
        supabase
          .from("hr_employee_records")
          .select("*")
          .order("employee_name", { ascending: true }),

        supabase
          .from("hr_contract_compliance_records")
          .select("*")
          .order("month", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (employeesResponse.error) throw new Error(employeesResponse.error.message);
      if (complianceResponse.error) throw new Error(complianceResponse.error.message);

      setEmployees((employeesResponse.data || []) as EmployeeRecord[]);
      setRecords((complianceResponse.data || []) as ContractComplianceRecord[]);

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      const text = getErrorMessage(
        error,
        "Could not load contract compliance records. Please check hr_employee_records and hr_contract_compliance_records."
      );
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedRecords = useMemo(
    () => records.filter((record) => record.month === selectedMonth),
    [records, selectedMonth]
  );

  const previousMonth = getPreviousMonth(selectedMonth);

  const previousRecords = useMemo(
    () => records.filter((record) => record.month === previousMonth),
    [records, previousMonth]
  );

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "Active" || employee.status === "On Leave"),
    [employees]
  );

  const departmentOptions = useMemo(() => {
    const employeeDepartments = employees.map((employee) => employee.department).filter(Boolean);
    const recordDepartments = records.map((record) => record.department).filter(Boolean);
    return Array.from(new Set([...employeeDepartments, ...recordDepartments])).sort();
  }, [employees, records]);

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedRecords
      .filter((record) => departmentFilter === "all" || record.department === departmentFilter)
      .filter((record) => roleFilter === "all" || record.role_category === roleFilter)
      .filter((record) => shiftFilter === "all" || record.shift === shiftFilter)
      .filter((record) => contractStatusFilter === "all" || record.contract_status === contractStatusFilter)
      .filter((record) => complianceStatusFilter === "all" || record.compliance_status === complianceStatusFilter)
      .filter((record) => {
        if (!query) return true;

        return [
          record.employee_name,
          record.employee_code || "",
          record.department,
          record.role_title || "",
          record.role_category,
          record.shift,
          record.contract_status,
          record.compliance_status,
          record.disciplinary_action_type,
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const aDays = getDaysUntil(a.contract_end_date) ?? 9999;
        const bDays = getDaysUntil(b.contract_end_date) ?? 9999;
        return aDays - bDays;
      });
  }, [
    selectedRecords,
    departmentFilter,
    roleFilter,
    shiftFilter,
    contractStatusFilter,
    complianceStatusFilter,
    searchQuery,
  ]);

  const employeesOnProbation = selectedRecords.filter(
    (record) => record.contract_status === "Probation"
  ).length;

  const confirmedEmployees = selectedRecords.filter(
    (record) => record.contract_status === "Confirmed"
  ).length;

  const contractExpiriesNext60Days = selectedRecords.filter((record) =>
    isWithinNextDays(record.contract_end_date, 60)
  ).length;

  const disciplinaryActionsIssued = selectedRecords.filter(
    (record) => record.disciplinary_action_issued
  ).length;

  const compliantRecords = selectedRecords.filter(
    (record) => record.compliance_status === "Compliant"
  ).length;

  const atRiskRecords = selectedRecords.filter(
    (record) => record.compliance_status === "At Risk" || record.compliance_status === "Non-Compliant"
  ).length;

  const pendingRecords = selectedRecords.filter(
    (record) => record.compliance_status === "Pending"
  ).length;

  const documentsPending = selectedRecords.filter((record) => !record.documents_complete).length;
  const policyPending = selectedRecords.filter((record) => !record.policy_acknowledged).length;
  const backgroundPending = selectedRecords.filter((record) => !record.background_check_done).length;
  const openDisciplinaryActions = selectedRecords.filter(
    (record) => record.disciplinary_action_issued && !record.action_closed
  ).length;

  const complianceRate = selectedRecords.length
    ? (compliantRecords / selectedRecords.length) * 100
    : 0;

  const previousProbation = previousRecords.filter(
    (record) => record.contract_status === "Probation"
  ).length;

  const previousConfirmed = previousRecords.filter(
    (record) => record.contract_status === "Confirmed"
  ).length;

  const previousActions = previousRecords.filter(
    (record) => record.disciplinary_action_issued
  ).length;

  const probationMoM = previousProbation
    ? ((employeesOnProbation - previousProbation) / previousProbation) * 100
    : employeesOnProbation > 0
      ? 100
      : 0;

  const confirmedMoM = previousConfirmed
    ? ((confirmedEmployees - previousConfirmed) / previousConfirmed) * 100
    : confirmedEmployees > 0
      ? 100
      : 0;

  const actionsMoM = previousActions
    ? ((disciplinaryActionsIssued - previousActions) / previousActions) * 100
    : disciplinaryActionsIssued > 0
      ? 100
      : 0;

  const departmentSummary = useMemo(() => {
    return departmentOptions
      .map((department) => {
        const departmentRecords = selectedRecords.filter((record) => record.department === department);

        const total = departmentRecords.length;
        const compliant = departmentRecords.filter((record) => record.compliance_status === "Compliant").length;

        return {
          department,
          probation: departmentRecords.filter((record) => record.contract_status === "Probation").length,
          confirmed: departmentRecords.filter((record) => record.contract_status === "Confirmed").length,
          expiries: departmentRecords.filter((record) => isWithinNextDays(record.contract_end_date, 60)).length,
          actions: departmentRecords.filter((record) => record.disciplinary_action_issued).length,
          atRisk: departmentRecords.filter(
            (record) => record.compliance_status === "At Risk" || record.compliance_status === "Non-Compliant"
          ).length,
          complianceRate: total ? (compliant / total) * 100 : 0,
        };
      })
      .filter((item) => item.probation + item.confirmed + item.expiries + item.actions + item.atRisk > 0)
      .sort((a, b) => b.atRisk + b.expiries + b.actions - (a.atRisk + a.expiries + a.actions));
  }, [departmentOptions, selectedRecords]);

  const roleSummary = ROLE_CATEGORIES.map((role) => {
    const roleRecords = selectedRecords.filter((record) => record.role_category === role);

    return {
      name: role === "Non-Teaching Staff" ? "Non-Teaching" : role,
      probation: roleRecords.filter((record) => record.contract_status === "Probation").length,
      confirmed: roleRecords.filter((record) => record.contract_status === "Confirmed").length,
      expiries: roleRecords.filter((record) => isWithinNextDays(record.contract_end_date, 60)).length,
      actions: roleRecords.filter((record) => record.disciplinary_action_issued).length,
    };
  });

  const shiftSummary = SHIFTS.map((shift) => {
    const shiftRecords = selectedRecords.filter((record) => record.shift === shift);

    return {
      name: shift,
      probation: shiftRecords.filter((record) => record.contract_status === "Probation").length,
      confirmed: shiftRecords.filter((record) => record.contract_status === "Confirmed").length,
      expiries: shiftRecords.filter((record) => isWithinNextDays(record.contract_end_date, 60)).length,
      actions: shiftRecords.filter((record) => record.disciplinary_action_issued).length,
    };
  });

  const complianceTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const monthRecords = records.filter((record) => record.month === month);
      const compliant = monthRecords.filter((record) => record.compliance_status === "Compliant").length;

      return {
        month: getMonthLabel(month),
        probation: monthRecords.filter((record) => record.contract_status === "Probation").length,
        confirmed: monthRecords.filter((record) => record.contract_status === "Confirmed").length,
        expiries: monthRecords.filter((record) => isWithinNextDays(record.contract_end_date, 60)).length,
        actions: monthRecords.filter((record) => record.disciplinary_action_issued).length,
        complianceRate: monthRecords.length ? (compliant / monthRecords.length) * 100 : 0,
      };
    });
  }, [records, selectedMonth]);

  const missingComplianceEmployees = activeEmployees.filter((employee) => {
    return !selectedRecords.some((record) => record.employee_id === employee.id);
  });

  const upcomingExpiryRecords = selectedRecords
    .filter((record) => isWithinNextDays(record.contract_end_date, 60))
    .sort((a, b) => (getDaysUntil(a.contract_end_date) ?? 9999) - (getDaysUntil(b.contract_end_date) ?? 9999))
    .slice(0, 5);

  const alerts = useMemo(() => {
    const items = [];

    if (missingComplianceEmployees.length > 0) {
      items.push(`${missingComplianceEmployees.length} active employee(s) do not have compliance records for ${getMonthLabel(selectedMonth)}.`);
    }

    if (contractExpiriesNext60Days > 0) {
      items.push(`${contractExpiriesNext60Days} contract(s) expire in the next 60 days. Start renewal or replacement planning.`);
    }

    if (employeesOnProbation > 0) {
      items.push(`${employeesOnProbation} employee(s) are on probation. Schedule confirmation reviews before probation end date.`);
    }

    if (disciplinaryActionsIssued > 0) {
      items.push(`${disciplinaryActionsIssued} disciplinary action(s) issued this month. Check whether action closure and documentation are complete.`);
    }

    if (openDisciplinaryActions > 0) {
      items.push(`${openDisciplinaryActions} disciplinary action(s) are still open.`);
    }

    if (documentsPending > 0) {
      items.push(`${documentsPending} employee document file(s) are incomplete.`);
    }

    if (policyPending > 0) {
      items.push(`${policyPending} employee(s) have not acknowledged required policies.`);
    }

    if (backgroundPending > 0) {
      items.push(`${backgroundPending} background check(s) are pending.`);
    }

    if (atRiskRecords > 0) {
      items.push(`${atRiskRecords} compliance record(s) are marked At Risk or Non-Compliant.`);
    }

    if (!items.length) {
      items.push("Contract and compliance status looks stable. Continue monitoring expiries, probation reviews and disciplinary closures.");
    }

    return items;
  }, [
    missingComplianceEmployees.length,
    selectedMonth,
    contractExpiriesNext60Days,
    employeesOnProbation,
    disciplinaryActionsIssued,
    openDisciplinaryActions,
    documentsPending,
    policyPending,
    backgroundPending,
    atRiskRecords,
  ]);

  function setFormValue<K extends keyof ComplianceForm>(key: K, value: ComplianceForm[K]) {
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

    if (!form.month || !selectedEmployee || !form.contract_status || !form.compliance_status) {
      setMessage({
        type: "error",
        text: "Please select month, employee, contract status and compliance status.",
      });
      return;
    }

    if (
      form.contract_start_date &&
      form.contract_end_date &&
      new Date(form.contract_end_date) < new Date(form.contract_start_date)
    ) {
      setMessage({
        type: "error",
        text: "Contract end date cannot be before contract start date.",
      });
      return;
    }

    if (
      form.probation_start_date &&
      form.probation_end_date &&
      new Date(form.probation_end_date) < new Date(form.probation_start_date)
    ) {
      setMessage({
        type: "error",
        text: "Probation end date cannot be before probation start date.",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const disciplinaryIssued = toBool(form.disciplinary_action_issued);

      const payload = {
        month: form.month,
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.employee_name,
        employee_code: selectedEmployee.employee_code,
        department: selectedEmployee.department,
        role_title: selectedEmployee.role_title,
        role_category: selectedEmployee.role_category,
        shift: selectedEmployee.shift,

        contract_status: form.contract_status,
        probation_start_date: form.probation_start_date || null,
        probation_end_date: form.probation_end_date || null,
        confirmation_date: form.confirmation_date || null,
        contract_start_date: form.contract_start_date || null,
        contract_end_date: form.contract_end_date || null,

        compliance_status: form.compliance_status,
        policy_acknowledged: toBool(form.policy_acknowledged),
        documents_complete: toBool(form.documents_complete),
        background_check_done: toBool(form.background_check_done),

        disciplinary_action_issued: disciplinaryIssued,
        disciplinary_action_type: disciplinaryIssued ? form.disciplinary_action_type : "None",
        disciplinary_action_date: disciplinaryIssued ? form.disciplinary_action_date || null : null,
        disciplinary_severity: disciplinaryIssued ? form.disciplinary_severity : null,
        action_closed: disciplinaryIssued ? toBool(form.action_closed) : false,

        next_review_date: form.next_review_date || null,
        notes: form.notes.trim() || null,
      };

      const response = editingId
        ? await supabase
            .from("hr_contract_compliance_records")
            .update(payload)
            .eq("id", editingId)
            .select()
            .single()
        : await supabase
            .from("hr_contract_compliance_records")
            .insert(payload)
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      setSelectedMonth(form.month);
      setMessage({
        type: "success",
        text: editingId ? "Contract compliance record updated." : "Contract compliance record created.",
      });

      resetForm();
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not save contract compliance record.");
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(record: ContractComplianceRecord) {
    setEditingId(record.id);
    setForm({
      month: record.month,
      employee_id: record.employee_id,

      contract_status: record.contract_status,
      probation_start_date: record.probation_start_date || "",
      probation_end_date: record.probation_end_date || "",
      confirmation_date: record.confirmation_date || "",
      contract_start_date: record.contract_start_date || "",
      contract_end_date: record.contract_end_date || "",

      compliance_status: record.compliance_status,
      policy_acknowledged: String(record.policy_acknowledged),
      documents_complete: String(record.documents_complete),
      background_check_done: String(record.background_check_done),

      disciplinary_action_issued: String(record.disciplinary_action_issued),
      disciplinary_action_type: record.disciplinary_action_type || "None",
      disciplinary_action_date: record.disciplinary_action_date || "",
      disciplinary_severity: record.disciplinary_severity || "Low",
      action_closed: String(record.action_closed),

      next_review_date: record.next_review_date || "",
      notes: record.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(record: ContractComplianceRecord) {
    const confirmed = window.confirm(`Delete compliance record for ${record.employee_name}?`);
    if (!confirmed) return;

    try {
      setMessage(null);

      const { error } = await supabase
        .from("hr_contract_compliance_records")
        .delete()
        .eq("id", record.id);

      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Contract compliance record deleted." });
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not delete contract compliance record.");
      setMessage({ type: "error", text });
    }
  }

  if (loading && employees.length === 0 && records.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading HR contract compliance records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Department - Contract & Compliance</h1>
          <p className="text-muted-foreground">
            Track probation, confirmation, contract expiries and disciplinary actions.
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

      <SectionTitle icon={ShieldCheck} title="F. Contract & Compliance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Employees on probation"
          value={formatNumber(employeesOnProbation)}
          icon={TimerReset}
          subtitle="Employees currently under probation"
          trend={<TrendBadge direction={trendDirection(probationMoM)} label={`${percentage(probationMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Confirmed employees"
          value={formatNumber(confirmedEmployees)}
          icon={UserCheck}
          subtitle="Employees with confirmed status"
          trend={<TrendBadge direction={trendDirection(confirmedMoM)} label={`${percentage(confirmedMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Contract expiries next 60 days"
          value={formatNumber(contractExpiriesNext60Days)}
          icon={CalendarClock}
          subtitle="Renewal or replacement required"
          variant={contractExpiriesNext60Days > 0 ? "warning" : "default"}
          highlight
        />

        <MetricCard
          title="Disciplinary actions issued"
          value={formatNumber(disciplinaryActionsIssued)}
          icon={Gavel}
          subtitle={`${formatNumber(openDisciplinaryActions)} open action(s)`}
          trend={<TrendBadge direction={trendDirection(actionsMoM)} label={`${percentage(actionsMoM)} MoM`} />}
          variant={disciplinaryActionsIssued > 0 ? "warning" : "default"}
          highlight
        />
      </div>

      <SectionTitle icon={LayoutDashboard} title="Compliance Overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Compliance rate"
          value={plainPercentage(complianceRate)}
          icon={ShieldCheck}
          subtitle={`${formatNumber(compliantRecords)} compliant record(s)`}
          variant="outline"
        />

        <MetricCard
          title="At-risk / non-compliant"
          value={formatNumber(atRiskRecords)}
          icon={ShieldAlert}
          subtitle="Needs HR follow-up"
          variant={atRiskRecords > 0 ? "warning" : "outline"}
        />

        <MetricCard
          title="Pending documents"
          value={formatNumber(documentsPending)}
          icon={FileWarning}
          subtitle="Incomplete employee files"
          variant={documentsPending > 0 ? "warning" : "outline"}
        />

        <MetricCard
          title="Policy acknowledgements pending"
          value={formatNumber(policyPending)}
          icon={ClipboardCheck}
          subtitle={`${formatNumber(backgroundPending)} background check(s) pending`}
          variant={policyPending + backgroundPending > 0 ? "warning" : "outline"}
        />
      </div>

      <SectionTitle icon={Plus} title={editingId ? "Update Compliance Record" : "Add Compliance Record"} />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">
              {editingId ? "Edit contract & compliance details" : "New contract & compliance record"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select an employee. Department, role and shift will be copied automatically from HR headcount.
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
              <FieldLabel>Contract status</FieldLabel>
              <Select
                value={form.contract_status}
                onValueChange={(value) => setFormValue("contract_status", value as ContractStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Contract status" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Compliance status</FieldLabel>
              <Select
                value={form.compliance_status}
                onValueChange={(value) => setFormValue("compliance_status", value as ComplianceStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Compliance status" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLIANCE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Probation start</FieldLabel>
              <input
                type="date"
                value={form.probation_start_date}
                onChange={(event) => setFormValue("probation_start_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Probation end</FieldLabel>
              <input
                type="date"
                value={form.probation_end_date}
                onChange={(event) => setFormValue("probation_end_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Confirmation date</FieldLabel>
              <input
                type="date"
                value={form.confirmation_date}
                onChange={(event) => setFormValue("confirmation_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Contract start</FieldLabel>
              <input
                type="date"
                value={form.contract_start_date}
                onChange={(event) => setFormValue("contract_start_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Contract end</FieldLabel>
              <input
                type="date"
                value={form.contract_end_date}
                onChange={(event) => setFormValue("contract_end_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Next review date</FieldLabel>
              <input
                type="date"
                value={form.next_review_date}
                onChange={(event) => setFormValue("next_review_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Policy acknowledged?</FieldLabel>
              <Select
                value={form.policy_acknowledged}
                onValueChange={(value) => setFormValue("policy_acknowledged", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Policy acknowledged?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Documents complete?</FieldLabel>
              <Select
                value={form.documents_complete}
                onValueChange={(value) => setFormValue("documents_complete", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Documents complete?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Background check done?</FieldLabel>
              <Select
                value={form.background_check_done}
                onValueChange={(value) => setFormValue("background_check_done", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Background check done?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Disciplinary action issued?</FieldLabel>
              <Select
                value={form.disciplinary_action_issued}
                onValueChange={(value) => setFormValue("disciplinary_action_issued", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Action issued?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Action type</FieldLabel>
              <Select
                value={form.disciplinary_action_type}
                onValueChange={(value) => setFormValue("disciplinary_action_type", value as DisciplinaryActionType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Action type" />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLINARY_ACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Action date</FieldLabel>
              <input
                type="date"
                value={form.disciplinary_action_date}
                onChange={(event) => setFormValue("disciplinary_action_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Action severity</FieldLabel>
              <Select
                value={form.disciplinary_severity}
                onValueChange={(value) => setFormValue("disciplinary_severity", value as DisciplinarySeverity)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLINARY_SEVERITIES.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {severity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Action closed?</FieldLabel>
              <Select
                value={form.action_closed}
                onValueChange={(value) => setFormValue("action_closed", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Action closed?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end lg:col-span-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit3 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Update" : "Save"}
              </Button>
            </div>

            <div className="lg:col-span-12">
              <FieldLabel>Compliance notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => setFormValue("notes", event.target.value)}
                placeholder="Optional: contract renewal notes, probation review, compliance issue, disciplinary follow-up, document missing, etc."
                className={textareaClassName()}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <SectionTitle icon={BarChart3} title="Contract & Compliance Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role-wise Compliance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="probation" name="Probation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="confirmed" name="Confirmed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expiries" name="Expiring Contracts" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actions" name="Disciplinary Actions" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shift-wise Compliance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="probation" name="Probation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="confirmed" name="Confirmed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expiries" name="Expiring Contracts" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actions" name="Disciplinary Actions" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department-wise Compliance Risk</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: unknown, name) => {
                    if (name === "complianceRate") return [`${Number(value).toFixed(1)}%`, "Compliance Rate"];
                    return [formatNumber(Number(value) || 0), ""];
                  }}
                />
                <Legend />
                <Bar dataKey="atRisk" name="At Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expiries" name="Expiries" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actions" name="Actions" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="complianceRate" name="Compliance Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6-Month Compliance Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complianceTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: unknown, name) => {
                    if (name === "Compliance Rate") return [`${Number(value).toFixed(1)}%`, name];
                    return [formatNumber(Number(value) || 0), name];
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="complianceRate" name="Compliance Rate" stroke="#10b981" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="probation" name="Probation" stroke="#f59e0b" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="expiries" name="Expiries" stroke="#ef4444" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="actions" name="Actions" stroke="#4f46e5" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={ShieldAlert} title="Compliance Controls & Alerts" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Compliance Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Automatic checks for missing records, contract expiries, probation reviews, documents, policy acknowledgement, background checks and disciplinary closures.
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
            <CardTitle className="text-base">Mandatory Compliance Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Employees on probation",
              "Confirmed employees",
              "Contract expiries next 60 days",
              "Disciplinary actions issued",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Contract Expiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingExpiryRecords.length ? (
                upcomingExpiryRecords.map((record, index) => {
                  const daysLeft = getDaysUntil(record.contract_end_date);

                  return (
                    <div key={record.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                      <div>
                        <p className="text-sm font-semibold">
                          {index + 1}. {record.employee_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.department} · {record.role_category} · {record.contract_end_date}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-amber-600">
                        {daysLeft !== null ? `${daysLeft} days` : "—"}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No contract expiries in the next 60 days.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Pending records</p>
              <p className="text-2xl font-bold">{formatNumber(pendingRecords)}</p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Open actions</p>
              <p className="text-2xl font-bold">{formatNumber(openDisciplinaryActions)}</p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Missing employee records</p>
              <p className="text-2xl font-bold">{formatNumber(missingComplianceEmployees.length)}</p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Background pending</p>
              <p className="text-2xl font-bold">{formatNumber(backgroundPending)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Search} title="Contract & Compliance Records" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter, edit and delete compliance records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleRecords.length)} of {formatNumber(selectedRecords.length)} records for {getMonthLabel(selectedMonth)}.
              </p>
            </div>

            <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-6">
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
              <FieldLabel>Contract status</FieldLabel>
              <Select
                value={contractStatusFilter}
                onValueChange={(value) => setContractStatusFilter(value as ContractStatusFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Contract status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All contract statuses</SelectItem>
                  {CONTRACT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Compliance status</FieldLabel>
              <Select
                value={complianceStatusFilter}
                onValueChange={(value) => setComplianceStatusFilter(value as ComplianceStatusFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Compliance status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All compliance statuses</SelectItem>
                  {COMPLIANCE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
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
                  placeholder="Search employee, status..."
                  className={inputClassName("pl-9")}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1680px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Shift</th>
                  <th className="px-4 py-3 font-semibold">Contract Status</th>
                  <th className="px-4 py-3 font-semibold">Compliance</th>
                  <th className="px-4 py-3 font-semibold">Probation End</th>
                  <th className="px-4 py-3 font-semibold">Contract End</th>
                  <th className="px-4 py-3 font-semibold">Expiry</th>
                  <th className="px-4 py-3 font-semibold">Policy</th>
                  <th className="px-4 py-3 font-semibold">Docs</th>
                  <th className="px-4 py-3 font-semibold">BG Check</th>
                  <th className="px-4 py-3 font-semibold">Disciplinary</th>
                  <th className="px-4 py-3 font-semibold">Next Review</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={17} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading compliance records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => {
                    const daysLeft = getDaysUntil(record.contract_end_date);
                    const expiring = isWithinNextDays(record.contract_end_date, 60);
                    const disciplinaryOpen = record.disciplinary_action_issued && !record.action_closed;

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
                        <td className="px-4 py-3">{record.contract_status}</td>
                        <td className="px-4 py-3">
                          <TrendBadge
                            direction={
                              record.compliance_status === "Compliant"
                                ? "up"
                                : record.compliance_status === "Pending"
                                  ? "neutral"
                                  : "down"
                            }
                            label={record.compliance_status}
                          />
                        </td>
                        <td className="px-4 py-3">{record.probation_end_date || "—"}</td>
                        <td className="px-4 py-3">{record.contract_end_date || "—"}</td>
                        <td className="px-4 py-3">
                          {record.contract_end_date ? (
                            <TrendBadge
                              direction={expiring ? "down" : "neutral"}
                              label={daysLeft !== null ? `${daysLeft} days` : "—"}
                            />
                          ) : (
                            <TrendBadge direction="neutral" label="No date" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <TrendBadge direction={record.policy_acknowledged ? "up" : "down"} label={record.policy_acknowledged ? "Yes" : "No"} />
                        </td>
                        <td className="px-4 py-3">
                          <TrendBadge direction={record.documents_complete ? "up" : "down"} label={record.documents_complete ? "Done" : "Pending"} />
                        </td>
                        <td className="px-4 py-3">
                          <TrendBadge direction={record.background_check_done ? "up" : "down"} label={record.background_check_done ? "Done" : "Pending"} />
                        </td>
                        <td className="px-4 py-3">
                          {record.disciplinary_action_issued ? (
                            <TrendBadge direction={disciplinaryOpen ? "down" : "up"} label={disciplinaryOpen ? "Open" : "Closed"} />
                          ) : (
                            <TrendBadge direction="neutral" label="None" />
                          )}
                        </td>
                        <td className="px-4 py-3">{record.next_review_date || "—"}</td>
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
                    <td colSpan={17} className="px-4 py-10 text-center text-muted-foreground">
                      No compliance records found for this filter.
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