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
  Calculator,
  CheckCircle2,
  DollarSign,
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
  Target,
  Trash2,
  TrendingUp,
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
type PayrollStatus = "Paid" | "Pending" | "Partially Paid";

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

type PayrollRecord = {
  id: string;
  month: string;
  employee_id: string;
  employee_name: string;
  employee_code: string | null;
  department: string;
  role_category: RoleCategory;
  shift: Shift;
  base_pay: number | string;
  overtime_payout: number | string;
  extra_payout: number | string;
  bonus_incentive: number | string;
  deductions: number | string;
  gross_pay: number | string;
  net_pay_due: number | string;
  amount_paid: number | string;
  payment_status: PayrollStatus;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type RevenueRecord = {
  id: string;
  month: string;
  revenue_pkr: number | string;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type RevenueForm = {
  month: string;
  revenue_pkr: string;
  source: string;
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

function emptyRevenueForm(month = getCurrentMonth()): RevenueForm {
  return {
    month,
    revenue_pkr: "",
    source: "Finance",
    notes: "",
  };
}

function toAmount(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatPKR(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value || 0);
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

export default function HRPayrollRatiosPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [targetPayrollRatio, setTargetPayrollRatio] = useState("35");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [revenueForm, setRevenueForm] = useState<RevenueForm>(emptyRevenueForm());
  const [editingRevenueId, setEditingRevenueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingRevenue, setSavingRevenue] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const [employeesResponse, payrollResponse, revenueResponse] = await Promise.all([
        supabase
          .from("hr_employee_records")
          .select("*")
          .order("employee_name", { ascending: true }),

        supabase
          .from("hr_payroll_records")
          .select("*")
          .order("month", { ascending: false })
          .order("created_at", { ascending: false }),

        supabase
          .from("finance_monthly_revenue_records")
          .select("*")
          .order("month", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (employeesResponse.error) throw new Error(employeesResponse.error.message);
      if (payrollResponse.error) throw new Error(payrollResponse.error.message);
      if (revenueResponse.error) throw new Error(revenueResponse.error.message);

      setEmployees((employeesResponse.data || []) as EmployeeRecord[]);
      setPayrollRecords((payrollResponse.data || []) as PayrollRecord[]);
      setRevenueRecords((revenueResponse.data || []) as RevenueRecord[]);

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      const text = getErrorMessage(
        error,
        "Could not load payroll ratio data. Please check hr_employee_records, hr_payroll_records and finance_monthly_revenue_records."
      );
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedPayrollRecords = useMemo(
    () => payrollRecords.filter((record) => record.month === selectedMonth),
    [payrollRecords, selectedMonth]
  );

  const previousMonth = getPreviousMonth(selectedMonth);

  const previousPayrollRecords = useMemo(
    () => payrollRecords.filter((record) => record.month === previousMonth),
    [payrollRecords, previousMonth]
  );

  const selectedRevenueRecord = useMemo(
    () => revenueRecords.find((record) => record.month === selectedMonth),
    [revenueRecords, selectedMonth]
  );

  const previousRevenueRecord = useMemo(
    () => revenueRecords.find((record) => record.month === previousMonth),
    [revenueRecords, previousMonth]
  );

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "Active"),
    [employees]
  );

  const activeTutors = activeEmployees.filter((employee) => employee.role_category === "Tutor");
  const activeNonTeachingStaff = activeEmployees.filter((employee) => employee.role_category === "Non-Teaching Staff");

  const totalActiveEmployees = activeEmployees.length;
  const totalActiveTutors = activeTutors.length;
  const totalActiveNonTeachingStaff = activeNonTeachingStaff.length;

  const departmentOptions = useMemo(() => {
    const employeeDepartments = employees.map((employee) => employee.department).filter(Boolean);
    const payrollDepartments = payrollRecords.map((record) => record.department).filter(Boolean);
    return Array.from(new Set([...employeeDepartments, ...payrollDepartments])).sort();
  }, [employees, payrollRecords]);

  const totals = selectedPayrollRecords.reduce(
    (acc, record) => {
      const amountPaid = toAmount(record.amount_paid);
      const basePay = toAmount(record.base_pay);
      const overtimeExtra = toAmount(record.overtime_payout) + toAmount(record.extra_payout);
      const bonus = toAmount(record.bonus_incentive);
      const deductions = toAmount(record.deductions);

      acc.totalPayrollPaid += amountPaid;
      acc.basePayroll += basePay;
      acc.overtimeExtra += overtimeExtra;
      acc.bonuses += bonus;
      acc.deductions += deductions;

      if (record.role_category === "Tutor") acc.tutorPayroll += amountPaid;
      if (record.role_category === "Non-Teaching Staff") acc.nonTeachingPayroll += amountPaid;
      if (record.shift === "Morning") acc.morningPayroll += amountPaid;
      if (record.shift === "Night") acc.nightPayroll += amountPaid;
      if (record.shift === "Flexible") acc.flexiblePayroll += amountPaid;

      return acc;
    },
    {
      totalPayrollPaid: 0,
      basePayroll: 0,
      tutorPayroll: 0,
      nonTeachingPayroll: 0,
      morningPayroll: 0,
      nightPayroll: 0,
      flexiblePayroll: 0,
      overtimeExtra: 0,
      bonuses: 0,
      deductions: 0,
    }
  );

  const previousTotalPayrollPaid = previousPayrollRecords.reduce(
    (sum, record) => sum + toAmount(record.amount_paid),
    0
  );

  const monthlyRevenue = toAmount(selectedRevenueRecord?.revenue_pkr);
  const previousRevenue = toAmount(previousRevenueRecord?.revenue_pkr);

  const averagePayrollPerEmployee = totalActiveEmployees
    ? totals.totalPayrollPaid / totalActiveEmployees
    : 0;

  const averagePayrollPerTutor = totalActiveTutors
    ? totals.tutorPayroll / totalActiveTutors
    : 0;

  const averagePayrollPerNonTeachingStaff = totalActiveNonTeachingStaff
    ? totals.nonTeachingPayroll / totalActiveNonTeachingStaff
    : 0;

  const payrollAsRevenuePercent = monthlyRevenue
    ? (totals.totalPayrollPaid / monthlyRevenue) * 100
    : 0;

  const previousPayrollAsRevenuePercent = previousRevenue
    ? (previousTotalPayrollPaid / previousRevenue) * 100
    : 0;

  const payrollRatioMoM = previousPayrollAsRevenuePercent
    ? payrollAsRevenuePercent - previousPayrollAsRevenuePercent
    : payrollAsRevenuePercent > 0
      ? payrollAsRevenuePercent
      : 0;

  const payrollPaidMoM = previousTotalPayrollPaid
    ? ((totals.totalPayrollPaid - previousTotalPayrollPaid) / previousTotalPayrollPaid) * 100
    : totals.totalPayrollPaid > 0
      ? 100
      : 0;

  const revenueMoM = previousRevenue
    ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100
    : monthlyRevenue > 0
      ? 100
      : 0;

  const targetRatio = Number(targetPayrollRatio) || 35;
  const targetPayrollAmount = monthlyRevenue ? (monthlyRevenue * targetRatio) / 100 : 0;
  const payrollVarianceToTarget = targetPayrollAmount ? targetPayrollAmount - totals.totalPayrollPaid : 0;
  const revenuePerEmployee = totalActiveEmployees ? monthlyRevenue / totalActiveEmployees : 0;
  const revenuePerTutor = totalActiveTutors ? monthlyRevenue / totalActiveTutors : 0;

  const visiblePayrollRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedPayrollRecords
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
      .sort((a, b) => toAmount(b.amount_paid) - toAmount(a.amount_paid));
  }, [selectedPayrollRecords, departmentFilter, roleFilter, shiftFilter, searchQuery]);

  const departmentSummary = useMemo(() => {
    return departmentOptions
      .map((department) => {
        const payrollForDepartment = selectedPayrollRecords.filter((record) => record.department === department);
        const activeEmployeesForDepartment = activeEmployees.filter((employee) => employee.department === department);

        const payrollPaid = payrollForDepartment.reduce((sum, record) => sum + toAmount(record.amount_paid), 0);
        const tutorPayroll = payrollForDepartment
          .filter((record) => record.role_category === "Tutor")
          .reduce((sum, record) => sum + toAmount(record.amount_paid), 0);
        const nonTeachingPayroll = payrollForDepartment
          .filter((record) => record.role_category === "Non-Teaching Staff")
          .reduce((sum, record) => sum + toAmount(record.amount_paid), 0);

        return {
          department,
          payrollPaid,
          tutorPayroll,
          nonTeachingPayroll,
          activeEmployees: activeEmployeesForDepartment.length,
          averagePayroll: activeEmployeesForDepartment.length
            ? payrollPaid / activeEmployeesForDepartment.length
            : 0,
          payrollShare: totals.totalPayrollPaid ? (payrollPaid / totals.totalPayrollPaid) * 100 : 0,
        };
      })
      .filter((item) => item.payrollPaid > 0 || item.activeEmployees > 0)
      .sort((a, b) => b.payrollPaid - a.payrollPaid);
  }, [departmentOptions, selectedPayrollRecords, activeEmployees, totals.totalPayrollPaid]);

  const roleRatioData = [
    {
      name: "Tutor",
      payroll: totals.tutorPayroll,
      averagePayroll: averagePayrollPerTutor,
      headcount: totalActiveTutors,
    },
    {
      name: "Non-Teaching",
      payroll: totals.nonTeachingPayroll,
      averagePayroll: averagePayrollPerNonTeachingStaff,
      headcount: totalActiveNonTeachingStaff,
    },
  ];

  const shiftRatioData = [
    {
      name: "Morning",
      payroll: totals.morningPayroll,
      share: totals.totalPayrollPaid ? (totals.morningPayroll / totals.totalPayrollPaid) * 100 : 0,
    },
    {
      name: "Night",
      payroll: totals.nightPayroll,
      share: totals.totalPayrollPaid ? (totals.nightPayroll / totals.totalPayrollPaid) * 100 : 0,
    },
    {
      name: "Flexible",
      payroll: totals.flexiblePayroll,
      share: totals.totalPayrollPaid ? (totals.flexiblePayroll / totals.totalPayrollPaid) * 100 : 0,
    },
  ];

  const ratioTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const payrollForMonth = payrollRecords.filter((record) => record.month === month);
      const revenueForMonth = revenueRecords.find((record) => record.month === month);
      const payrollPaid = payrollForMonth.reduce((sum, record) => sum + toAmount(record.amount_paid), 0);
      const revenue = toAmount(revenueForMonth?.revenue_pkr);

      return {
        month: getMonthLabel(month),
        payrollPaid,
        revenue,
        payrollRatio: revenue ? (payrollPaid / revenue) * 100 : 0,
        avgPayrollPerEmployee: totalActiveEmployees ? payrollPaid / totalActiveEmployees : 0,
      };
    });
  }, [payrollRecords, revenueRecords, selectedMonth, totalActiveEmployees]);

  const topPayrollRecords = [...selectedPayrollRecords]
    .sort((a, b) => toAmount(b.amount_paid) - toAmount(a.amount_paid))
    .slice(0, 5);

  const ratioAlerts = useMemo(() => {
    const alerts = [];

    if (!monthlyRevenue) {
      alerts.push("Finance revenue is missing for this month. Add revenue to calculate payroll as % of revenue.");
    }

    if (monthlyRevenue && payrollAsRevenuePercent > targetRatio) {
      alerts.push(
        `Payroll ratio is ${plainPercentage(payrollAsRevenuePercent)}, which is above the selected ${plainPercentage(targetRatio)} target.`
      );
    }

    if (totals.overtimeExtra > totals.totalPayrollPaid * 0.15 && totals.totalPayrollPaid > 0) {
      alerts.push("Overtime / extra payouts are above 15% of payroll paid. Review overtime approvals.");
    }

    if (totals.bonuses > totals.totalPayrollPaid * 0.2 && totals.totalPayrollPaid > 0) {
      alerts.push("Bonuses / incentives are above 20% of payroll paid. Review incentive policy.");
    }

    if (averagePayrollPerTutor > 0 && averagePayrollPerNonTeachingStaff > 0 && averagePayrollPerTutor > averagePayrollPerNonTeachingStaff * 1.5) {
      alerts.push("Average tutor payroll is more than 1.5x non-teaching average. Review tutor cost structure.");
    }

    if (selectedPayrollRecords.length < activeEmployees.length) {
      alerts.push(`${activeEmployees.length - selectedPayrollRecords.length} active employee(s) do not have payroll records this month.`);
    }

    if (!alerts.length) {
      alerts.push("Payroll ratios look stable. Continue monitoring revenue, average payroll and overtime pressure.");
    }

    return alerts;
  }, [
    monthlyRevenue,
    payrollAsRevenuePercent,
    targetRatio,
    totals.overtimeExtra,
    totals.totalPayrollPaid,
    totals.bonuses,
    averagePayrollPerTutor,
    averagePayrollPerNonTeachingStaff,
    selectedPayrollRecords.length,
    activeEmployees.length,
  ]);

  function setRevenueFormValue<K extends keyof RevenueForm>(key: K, value: RevenueForm[K]) {
    setRevenueForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetRevenueForm() {
    setEditingRevenueId(null);
    setRevenueForm(emptyRevenueForm(selectedMonth));
  }

  function loadSelectedRevenueIntoForm() {
    if (!selectedRevenueRecord) {
      setEditingRevenueId(null);
      setRevenueForm(emptyRevenueForm(selectedMonth));
      return;
    }

    setEditingRevenueId(selectedRevenueRecord.id);
    setRevenueForm({
      month: selectedRevenueRecord.month,
      revenue_pkr: String(selectedRevenueRecord.revenue_pkr || ""),
      source: selectedRevenueRecord.source || "Finance",
      notes: selectedRevenueRecord.notes || "",
    });
  }

  async function handleRevenueSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const revenueAmount = toAmount(revenueForm.revenue_pkr);

    if (!revenueForm.month || revenueAmount <= 0) {
      setMessage({
        type: "error",
        text: "Please enter month and revenue amount greater than 0.",
      });
      return;
    }

    try {
      setSavingRevenue(true);
      setMessage(null);

      const existingRevenue = revenueRecords.find((record) => record.month === revenueForm.month);

      const payload = {
        month: revenueForm.month,
        revenue_pkr: revenueAmount,
        source: revenueForm.source.trim() || "Finance",
        notes: revenueForm.notes.trim() || null,
      };

      const response = editingRevenueId || existingRevenue
        ? await supabase
            .from("finance_monthly_revenue_records")
            .update(payload)
            .eq("id", editingRevenueId || existingRevenue?.id)
            .select()
            .single()
        : await supabase
            .from("finance_monthly_revenue_records")
            .insert(payload)
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      setSelectedMonth(revenueForm.month);
      setMessage({
        type: "success",
        text: editingRevenueId || existingRevenue ? "Finance revenue updated." : "Finance revenue created.",
      });

      resetRevenueForm();
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not save Finance revenue.");
      setMessage({ type: "error", text });
    } finally {
      setSavingRevenue(false);
    }
  }

  async function handleDeleteRevenue(record: RevenueRecord) {
    const confirmed = window.confirm(`Delete revenue record for ${record.month}?`);
    if (!confirmed) return;

    try {
      setMessage(null);

      const { error } = await supabase
        .from("finance_monthly_revenue_records")
        .delete()
        .eq("id", record.id);

      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Finance revenue record deleted." });
      resetRevenueForm();
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not delete Finance revenue.");
      setMessage({ type: "error", text });
    }
  }

  if (loading && employees.length === 0 && payrollRecords.length === 0 && revenueRecords.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading HR payroll ratios…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Department - Payroll Ratios</h1>
          <p className="text-muted-foreground">
            Track average payroll per employee, average payroll per tutor and payroll as percentage of Finance revenue.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-xs text-muted-foreground">Last updated: {lastUpdated}</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              setSelectedMonth(event.target.value);
              setRevenueForm((previous) => ({ ...previous, month: event.target.value }));
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

      <SectionTitle icon={Calculator} title="C. Payroll Ratios" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MetricCard
          title="Average payroll per employee"
          value={formatPKR(averagePayrollPerEmployee)}
          icon={Users}
          subtitle={`${formatNumber(totalActiveEmployees)} active employees`}
          highlight
        />

        <MetricCard
          title="Average payroll per tutor"
          value={formatPKR(averagePayrollPerTutor)}
          icon={GraduationCap}
          subtitle={`${formatNumber(totalActiveTutors)} active tutors`}
          highlight
        />

        <MetricCard
          title="Payroll as % of revenue"
          value={monthlyRevenue ? plainPercentage(payrollAsRevenuePercent) : "—"}
          icon={Target}
          subtitle={monthlyRevenue ? `${formatPKR(totals.totalPayrollPaid)} / ${formatPKR(monthlyRevenue)}` : "Finance revenue missing"}
          trend={<TrendBadge direction={trendDirection(payrollRatioMoM)} label={`${percentage(payrollRatioMoM)} pts MoM`} />}
          variant={monthlyRevenue && payrollAsRevenuePercent > targetRatio ? "warning" : "default"}
          highlight
        />

        <MetricCard
          title="Finance revenue"
          value={monthlyRevenue ? formatPKR(monthlyRevenue) : "—"}
          icon={DollarSign}
          subtitle={`${previousMonth}: ${formatPKR(previousRevenue)}`}
          trend={<TrendBadge direction={trendDirection(revenueMoM)} label={`${percentage(revenueMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Average non-teaching payroll"
          value={formatPKR(averagePayrollPerNonTeachingStaff)}
          icon={UserCog}
          subtitle={`${formatNumber(totalActiveNonTeachingStaff)} active non-teaching staff`}
          variant="outline"
        />

        <MetricCard
          title="Revenue per employee"
          value={monthlyRevenue ? formatPKR(revenuePerEmployee) : "—"}
          icon={BriefcaseBusiness}
          subtitle="Finance revenue ÷ active employees"
          variant="outline"
        />

        <MetricCard
          title="Revenue per tutor"
          value={monthlyRevenue ? formatPKR(revenuePerTutor) : "—"}
          icon={GraduationCap}
          subtitle="Finance revenue ÷ active tutors"
          variant="outline"
        />

        <MetricCard
          title="Target payroll variance"
          value={monthlyRevenue ? formatPKR(payrollVarianceToTarget) : "—"}
          icon={ShieldCheck}
          subtitle={`${plainPercentage(targetRatio)} target payroll ratio`}
          trend={
            monthlyRevenue ? (
              <TrendBadge
                direction={payrollVarianceToTarget >= 0 ? "up" : "down"}
                label={payrollVarianceToTarget >= 0 ? "Within target" : "Over target"}
              />
            ) : undefined
          }
          variant={monthlyRevenue && payrollVarianceToTarget < 0 ? "warning" : "outline"}
        />
      </div>

      <SectionTitle icon={LayoutDashboard} title="Payroll Ratio Overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total payroll paid"
          value={formatPKR(totals.totalPayrollPaid)}
          icon={DollarSign}
          subtitle={`${previousMonth}: ${formatPKR(previousTotalPayrollPaid)}`}
          trend={<TrendBadge direction={trendDirection(payrollPaidMoM)} label={`${percentage(payrollPaidMoM)} MoM`} />}
          variant="outline"
        />

        <MetricCard
          title="Tutor payroll share"
          value={plainPercentage(totals.totalPayrollPaid ? (totals.tutorPayroll / totals.totalPayrollPaid) * 100 : 0)}
          icon={GraduationCap}
          subtitle={formatPKR(totals.tutorPayroll)}
          variant="outline"
        />

        <MetricCard
          title="Non-teaching payroll share"
          value={plainPercentage(totals.totalPayrollPaid ? (totals.nonTeachingPayroll / totals.totalPayrollPaid) * 100 : 0)}
          icon={UserCog}
          subtitle={formatPKR(totals.nonTeachingPayroll)}
          variant="outline"
        />

        <MetricCard
          title="Overtime + bonus share"
          value={plainPercentage(
            totals.totalPayrollPaid
              ? ((totals.overtimeExtra + totals.bonuses) / totals.totalPayrollPaid) * 100
              : 0
          )}
          icon={TrendingUp}
          subtitle={`${formatPKR(totals.overtimeExtra + totals.bonuses)} extra cost`}
          variant={totals.overtimeExtra + totals.bonuses > totals.totalPayrollPaid * 0.25 && totals.totalPayrollPaid > 0 ? "warning" : "outline"}
        />
      </div>

      <SectionTitle icon={Plus} title={editingRevenueId ? "Update Finance Revenue" : "Add Finance Revenue"} />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Finance revenue input</CardTitle>
            <p className="text-sm text-muted-foreground">
              Payroll as % of revenue needs monthly revenue from Finance.
            </p>
          </div>

          <div className="flex gap-2">
            {selectedRevenueRecord && (
              <Button type="button" variant="outline" size="sm" onClick={loadSelectedRevenueIntoForm}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit selected month
              </Button>
            )}

            {editingRevenueId && (
              <Button type="button" variant="outline" size="sm" onClick={resetRevenueForm}>
                Cancel edit
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRevenueSubmit} className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <FieldLabel>Month</FieldLabel>
              <input
                type="month"
                value={revenueForm.month}
                onChange={(event) => setRevenueFormValue("month", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-3">
              <FieldLabel>Revenue PKR</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={revenueForm.revenue_pkr}
                onChange={(event) => setRevenueFormValue("revenue_pkr", event.target.value)}
                placeholder="2500000"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Source</FieldLabel>
              <input
                value={revenueForm.source}
                onChange={(event) => setRevenueFormValue("source", event.target.value)}
                placeholder="Finance"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Target payroll ratio %</FieldLabel>
              <input
                type="number"
                min="0"
                step="0.1"
                value={targetPayrollRatio}
                onChange={(event) => setTargetPayrollRatio(event.target.value)}
                placeholder="35"
                className={inputClassName()}
              />
            </div>

            <div className="flex items-end lg:col-span-3">
              <Button type="submit" disabled={savingRevenue} className="w-full">
                {savingRevenue ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingRevenueId ? <Edit3 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingRevenueId ? "Update Revenue" : "Save Revenue"}
              </Button>
            </div>

            <div className="lg:col-span-12">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                value={revenueForm.notes}
                onChange={(event) => setRevenueFormValue("notes", event.target.value)}
                placeholder="Optional: Finance source, revenue adjustments, notes for this month."
                className={textareaClassName()}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <SectionTitle icon={BarChart3} title="Payroll Ratio Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Payroll by Role</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleRatioData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip formatter={(value: unknown) => [formatPKR(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="payroll" name="Total Payroll" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="averagePayroll" name="Avg Payroll" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payroll Share by Shift</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftRatioData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip
                  formatter={(value: unknown, name) => {
                    if (name === "share") return [`${Number(value).toFixed(1)}%`, "Payroll Share"];
                    return [formatPKR(Number(value) || 0), "Payroll"];
                  }}
                />
                <Legend />
                <Bar dataKey="payroll" name="Payroll" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="share" name="Share %" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department-wise Payroll Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip
                  formatter={(value: unknown, name) => {
                    if (name === "payrollShare") return [`${Number(value).toFixed(1)}%`, "Payroll Share"];
                    if (name === "activeEmployees") return [formatNumber(Number(value) || 0), "Active Employees"];
                    return [formatPKR(Number(value) || 0), ""];
                  }}
                />
                <Legend />
                <Bar dataKey="payrollPaid" name="Payroll Paid" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="averagePayroll" name="Avg Payroll" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6-Month Payroll Ratio Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratioTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip
                  formatter={(value: unknown, name) => {
                    if (name === "Payroll % Revenue") return [`${Number(value).toFixed(1)}%`, name];
                    return [formatPKR(Number(value) || 0), name];
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="payrollRatio" name="Payroll % Revenue" stroke="#4f46e5" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="payrollPaid" name="Payroll Paid" stroke="#10b981" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#f59e0b" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={ShieldCheck} title="Payroll Ratio Controls & Alerts" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ratio Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Automatic checks for missing revenue, payroll over target, overtime pressure, bonus spikes and missing payroll records.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ratioAlerts.map((alert, index) => (
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
            <CardTitle className="text-base">Mandatory Ratio Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Average payroll per employee</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Average payroll per tutor</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Payroll as % of revenue</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Finance revenue input</span>
              {monthlyRevenue ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Search} title="Payroll Ratio Records" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Payroll records used for ratio calculations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visiblePayrollRecords.length)} of {formatNumber(selectedPayrollRecords.length)} records for {getMonthLabel(selectedMonth)}.
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
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Shift</th>
                  <th className="px-4 py-3 font-semibold">Payroll Paid</th>
                  <th className="px-4 py-3 font-semibold">Payroll Share</th>
                  <th className="px-4 py-3 font-semibold">Overtime / Extra</th>
                  <th className="px-4 py-3 font-semibold">Bonus</th>
                  <th className="px-4 py-3 font-semibold">Payment Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading ratio records…
                    </td>
                  </tr>
                ) : visiblePayrollRecords.length ? (
                  visiblePayrollRecords.map((record) => {
                    const amountPaid = toAmount(record.amount_paid);
                    const payrollShare = totals.totalPayrollPaid ? (amountPaid / totals.totalPayrollPaid) * 100 : 0;

                    return (
                      <tr key={record.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold">{record.employee_name}</p>
                            <p className="text-xs text-muted-foreground">{record.employee_code || "No code"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{record.department}</td>
                        <td className="px-4 py-3">{record.role_category}</td>
                        <td className="px-4 py-3">{record.shift}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-600">{formatPKR(amountPaid)}</td>
                        <td className="px-4 py-3">{plainPercentage(payrollShare)}</td>
                        <td className="px-4 py-3">{formatPKR(toAmount(record.overtime_payout) + toAmount(record.extra_payout))}</td>
                        <td className="px-4 py-3">{formatPKR(toAmount(record.bonus_incentive))}</td>
                        <td className="px-4 py-3">
                          <TrendBadge
                            direction={
                              record.payment_status === "Paid"
                                ? "up"
                                : record.payment_status === "Partially Paid"
                                  ? "neutral"
                                  : "down"
                            }
                            label={record.payment_status}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      No payroll records found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Payroll Cost Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPayrollRecords.length ? (
                topPayrollRecords.map((record, index) => (
                  <div key={record.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-semibold">
                        {index + 1}. {record.employee_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.department} · {record.role_category} · {record.shift}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-indigo-600">{formatPKR(toAmount(record.amount_paid))}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No payroll records available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Finance Revenue Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Month</th>
                    <th className="px-4 py-3 font-semibold">Revenue</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Notes</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {revenueRecords.length ? (
                    revenueRecords.slice(0, 8).map((record) => (
                      <tr key={record.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">{record.month}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-600">{formatPKR(toAmount(record.revenue_pkr))}</td>
                        <td className="px-4 py-3">{record.source || "Finance"}</td>
                        <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">{record.notes || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setEditingRevenueId(record.id);
                                setRevenueForm({
                                  month: record.month,
                                  revenue_pkr: String(record.revenue_pkr || ""),
                                  source: record.source || "Finance",
                                  notes: record.notes || "",
                                });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteRevenue(record)}
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        No Finance revenue records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}