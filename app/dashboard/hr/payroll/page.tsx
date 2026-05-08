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
  DollarSign,
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
  email: string | null;
  phone: string | null;
  department: string;
  role_title: string;
  role_category: RoleCategory;
  shift: Shift;
  status: EmployeeStatus;
  start_date: string;
  end_date: string | null;
  fte: number | string | null;
  manager_name: string | null;
  notes: string | null;
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

type PayrollForm = {
  month: string;
  employee_id: string;
  base_pay: string;
  overtime_payout: string;
  extra_payout: string;
  bonus_incentive: string;
  deductions: string;
  amount_paid: string;
  payment_status: PayrollStatus;
  payment_date: string;
  notes: string;
};

type DepartmentFilter = "all" | string;
type RoleFilter = "all" | RoleCategory;
type ShiftFilter = "all" | Shift;
type PayrollStatusFilter = "all" | PayrollStatus;

const ROLE_CATEGORIES: RoleCategory[] = ["Tutor", "Non-Teaching Staff"];
const SHIFTS: Shift[] = ["Morning", "Night", "Flexible"];
const PAYROLL_STATUSES: PayrollStatus[] = ["Paid", "Pending", "Partially Paid"];

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
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

function emptyForm(month = getCurrentMonth()): PayrollForm {
  return {
    month,
    employee_id: "",
    base_pay: "",
    overtime_payout: "",
    extra_payout: "",
    bonus_incentive: "",
    deductions: "",
    amount_paid: "",
    payment_status: "Paid",
    payment_date: getTodayDate(),
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

function percentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function plainPercentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
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

export default function HRPayrollPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [statusFilter, setStatusFilter] = useState<PayrollStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<PayrollForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const [employeesResponse, payrollResponse] = await Promise.all([
        supabase
          .from("hr_employee_records")
          .select("*")
          .order("employee_name", { ascending: true }),

        supabase
          .from("hr_payroll_records")
          .select("*")
          .order("month", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (employeesResponse.error) throw new Error(employeesResponse.error.message);
      if (payrollResponse.error) throw new Error(payrollResponse.error.message);

      setEmployees((employeesResponse.data || []) as EmployeeRecord[]);
      setPayrollRecords((payrollResponse.data || []) as PayrollRecord[]);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      const text = getErrorMessage(
        error,
        "Could not load payroll records. Please check your hr_payroll_records and hr_employee_records Supabase tables."
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

  const departmentOptions = useMemo(() => {
    const employeeDepartments = employees.map((employee) => employee.department).filter(Boolean);
    const payrollDepartments = payrollRecords.map((record) => record.department).filter(Boolean);
    return Array.from(new Set([...employeeDepartments, ...payrollDepartments])).sort();
  }, [employees, payrollRecords]);

  const selectedPayrollRecords = useMemo(
    () => payrollRecords.filter((record) => record.month === selectedMonth),
    [payrollRecords, selectedMonth]
  );

  const previousMonth = getPreviousMonth(selectedMonth);

  const previousPayrollRecords = useMemo(
    () => payrollRecords.filter((record) => record.month === previousMonth),
    [payrollRecords, previousMonth]
  );

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedPayrollRecords
      .filter((record) => departmentFilter === "all" || record.department === departmentFilter)
      .filter((record) => roleFilter === "all" || record.role_category === roleFilter)
      .filter((record) => shiftFilter === "all" || record.shift === shiftFilter)
      .filter((record) => statusFilter === "all" || record.payment_status === statusFilter)
      .filter((record) => {
        if (!query) return true;

        return [
          record.employee_name,
          record.employee_code || "",
          record.department,
          record.role_category,
          record.shift,
          record.payment_status,
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => toAmount(b.amount_paid) - toAmount(a.amount_paid));
  }, [
    selectedPayrollRecords,
    departmentFilter,
    roleFilter,
    shiftFilter,
    statusFilter,
    searchQuery,
  ]);

  const totals = selectedPayrollRecords.reduce(
    (acc, record) => {
      const basePay = toAmount(record.base_pay);
      const overtime = toAmount(record.overtime_payout);
      const extra = toAmount(record.extra_payout);
      const bonus = toAmount(record.bonus_incentive);
      const deductions = toAmount(record.deductions);
      const grossPay = toAmount(record.gross_pay);
      const netPayDue = toAmount(record.net_pay_due);
      const amountPaid = toAmount(record.amount_paid);

      acc.basePay += basePay;
      acc.overtimeExtra += overtime + extra;
      acc.bonusIncentive += bonus;
      acc.deductions += deductions;
      acc.grossPay += grossPay;
      acc.netPayDue += netPayDue;
      acc.amountPaid += amountPaid;

      if (record.role_category === "Tutor") acc.tutorPayroll += amountPaid;
      if (record.role_category === "Non-Teaching Staff") acc.nonTeachingPayroll += amountPaid;
      if (record.shift === "Morning") acc.morningPayroll += amountPaid;
      if (record.shift === "Night") acc.nightPayroll += amountPaid;
      if (record.shift === "Flexible") acc.flexiblePayroll += amountPaid;

      if (record.payment_status === "Pending") acc.pendingAmount += netPayDue;
      if (record.payment_status === "Partially Paid") acc.pendingAmount += Math.max(netPayDue - amountPaid, 0);

      return acc;
    },
    {
      basePay: 0,
      overtimeExtra: 0,
      bonusIncentive: 0,
      deductions: 0,
      grossPay: 0,
      netPayDue: 0,
      amountPaid: 0,
      tutorPayroll: 0,
      nonTeachingPayroll: 0,
      morningPayroll: 0,
      nightPayroll: 0,
      flexiblePayroll: 0,
      pendingAmount: 0,
    }
  );

  const previousTotalPaid = previousPayrollRecords.reduce(
    (sum, record) => sum + toAmount(record.amount_paid),
    0
  );

  const payrollMoM = previousTotalPaid
    ? ((totals.amountPaid - previousTotalPaid) / previousTotalPaid) * 100
    : totals.amountPaid > 0
      ? 100
      : 0;

  const averagePayrollPerEmployee = selectedPayrollRecords.length
    ? totals.amountPaid / selectedPayrollRecords.length
    : 0;

  const pendingRecords = selectedPayrollRecords.filter((record) => record.payment_status !== "Paid");

  const departmentSummary = useMemo(() => {
    return departmentOptions
      .map((department) => {
        const records = selectedPayrollRecords.filter((record) => record.department === department);
        const amountPaid = records.reduce((sum, record) => sum + toAmount(record.amount_paid), 0);
        const overtimeExtra = records.reduce(
          (sum, record) => sum + toAmount(record.overtime_payout) + toAmount(record.extra_payout),
          0
        );
        const bonusIncentive = records.reduce((sum, record) => sum + toAmount(record.bonus_incentive), 0);

        return {
          department,
          payroll: amountPaid,
          overtimeExtra,
          bonusIncentive,
          employees: records.length,
        };
      })
      .filter((item) => item.payroll || item.overtimeExtra || item.bonusIncentive)
      .sort((a, b) => b.payroll - a.payroll);
  }, [departmentOptions, selectedPayrollRecords]);

  const highestPayrollDepartment = departmentSummary[0];

  const payrollByRole = [
    {
      name: "Tutor",
      payroll: totals.tutorPayroll,
    },
    {
      name: "Non-Teaching",
      payroll: totals.nonTeachingPayroll,
    },
  ];

  const payrollByShift = [
    {
      name: "Morning",
      payroll: totals.morningPayroll,
    },
    {
      name: "Night",
      payroll: totals.nightPayroll,
    },
    {
      name: "Flexible",
      payroll: totals.flexiblePayroll,
    },
  ];

  const statusSummary = PAYROLL_STATUSES.map((status) => {
    const records = selectedPayrollRecords.filter((record) => record.payment_status === status);
    return {
      status,
      records: records.length,
      amount: records.reduce((sum, record) => sum + toAmount(record.amount_paid), 0),
    };
  });

  const payrollTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const records = payrollRecords.filter((record) => record.month === month);

      return {
        month: getMonthLabel(month),
        totalPaid: records.reduce((sum, record) => sum + toAmount(record.amount_paid), 0),
        overtimeExtra: records.reduce(
          (sum, record) => sum + toAmount(record.overtime_payout) + toAmount(record.extra_payout),
          0
        ),
        bonuses: records.reduce((sum, record) => sum + toAmount(record.bonus_incentive), 0),
      };
    });
  }, [payrollRecords, selectedMonth]);

  const auditAlerts = useMemo(() => {
    const alerts = [];

    if (pendingRecords.length > 0) {
      alerts.push(`${pendingRecords.length} payroll record(s) are pending or partially paid for ${getMonthLabel(selectedMonth)}.`);
    }

    if (totals.overtimeExtra > totals.amountPaid * 0.15 && totals.amountPaid > 0) {
      alerts.push("Overtime / extra payouts are above 15% of total payroll paid. Review extra payout approval.");
    }

    if (totals.bonusIncentive > totals.amountPaid * 0.2 && totals.amountPaid > 0) {
      alerts.push("Bonuses / incentives are above 20% of total payroll paid. Review incentive policy and approvals.");
    }

    if (selectedPayrollRecords.length < activeEmployees.length) {
      alerts.push(
        `${activeEmployees.length - selectedPayrollRecords.length} active employee(s) do not have payroll records for this month.`
      );
    }

    if (!alerts.length) {
      alerts.push("Payroll looks complete for the selected month. Continue monitoring pending payments, overtime and incentives.");
    }

    return alerts;
  }, [
    pendingRecords.length,
    totals.overtimeExtra,
    totals.amountPaid,
    totals.bonusIncentive,
    selectedPayrollRecords.length,
    activeEmployees.length,
    selectedMonth,
  ]);

  const grossPayPreview =
    toAmount(form.base_pay) +
    toAmount(form.overtime_payout) +
    toAmount(form.extra_payout) +
    toAmount(form.bonus_incentive);

  const netPayPreview = Math.max(grossPayPreview - toAmount(form.deductions), 0);

  function setFormValue<K extends keyof PayrollForm>(key: K, value: PayrollForm[K]) {
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

    const basePay = toAmount(form.base_pay);
    const overtimePayout = toAmount(form.overtime_payout);
    const extraPayout = toAmount(form.extra_payout);
    const bonusIncentive = toAmount(form.bonus_incentive);
    const deductions = toAmount(form.deductions);
    const grossPay = basePay + overtimePayout + extraPayout + bonusIncentive;
    const netPayDue = Math.max(grossPay - deductions, 0);
    const amountPaid = form.amount_paid === "" ? netPayDue : toAmount(form.amount_paid);

    if (!form.month || !selectedEmployee || !form.payment_status) {
      setMessage({
        type: "error",
        text: "Please select month, employee and payment status.",
      });
      return;
    }

    if (basePay < 0 || overtimePayout < 0 || extraPayout < 0 || bonusIncentive < 0 || deductions < 0 || amountPaid < 0) {
      setMessage({
        type: "error",
        text: "Payroll amounts cannot be negative.",
      });
      return;
    }

    if (form.payment_status === "Paid" && amountPaid <= 0) {
      setMessage({
        type: "error",
        text: "Paid payroll must have an amount paid greater than 0.",
      });
      return;
    }

    if (form.payment_status === "Pending" && amountPaid > 0) {
      setMessage({
        type: "error",
        text: "Pending payroll should not have an amount paid. Use Partially Paid if some amount was paid.",
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
        base_pay: basePay,
        overtime_payout: overtimePayout,
        extra_payout: extraPayout,
        bonus_incentive: bonusIncentive,
        deductions,
        gross_pay: grossPay,
        net_pay_due: netPayDue,
        amount_paid: amountPaid,
        payment_status: form.payment_status,
        payment_date: form.payment_date || null,
        notes: form.notes.trim() || null,
      };

      const response = editingId
        ? await supabase
            .from("hr_payroll_records")
            .update(payload)
            .eq("id", editingId)
            .select()
            .single()
        : await supabase
            .from("hr_payroll_records")
            .insert(payload)
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      setSelectedMonth(form.month);
      setMessage({
        type: "success",
        text: editingId ? "Payroll record updated." : "Payroll record created.",
      });

      resetForm();
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not save payroll record.");
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(record: PayrollRecord) {
    setEditingId(record.id);
    setForm({
      month: record.month,
      employee_id: record.employee_id,
      base_pay: String(record.base_pay || ""),
      overtime_payout: String(record.overtime_payout || ""),
      extra_payout: String(record.extra_payout || ""),
      bonus_incentive: String(record.bonus_incentive || ""),
      deductions: String(record.deductions || ""),
      amount_paid: String(record.amount_paid || ""),
      payment_status: record.payment_status,
      payment_date: record.payment_date || "",
      notes: record.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(record: PayrollRecord) {
    const confirmed = window.confirm(`Delete payroll record for ${record.employee_name}?`);
    if (!confirmed) return;

    try {
      setMessage(null);

      const { error } = await supabase.from("hr_payroll_records").delete().eq("id", record.id);
      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Payroll record deleted." });
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not delete payroll record.");
      setMessage({ type: "error", text });
    }
  }

  if (loading && payrollRecords.length === 0 && employees.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading HR payroll records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Department - Payroll</h1>
          <p className="text-muted-foreground">
            Track payroll paid in PKR by tutors, non-teaching staff, shifts, overtime and incentives.
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

      <SectionTitle icon={DollarSign} title="B. Payroll (PKR)" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MetricCard
          title="Total payroll paid"
          value={formatPKR(totals.amountPaid)}
          icon={DollarSign}
          subtitle={`${previousMonth}: ${formatPKR(previousTotalPaid)}`}
          trend={<TrendBadge direction={trendDirection(payrollMoM)} label={`${percentage(payrollMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Tutor payroll"
          value={formatPKR(totals.tutorPayroll)}
          icon={GraduationCap}
          subtitle={`${plainPercentage(totals.amountPaid ? (totals.tutorPayroll / totals.amountPaid) * 100 : 0)} of paid payroll`}
          highlight
        />

        <MetricCard
          title="Non-teaching payroll"
          value={formatPKR(totals.nonTeachingPayroll)}
          icon={UserCog}
          subtitle={`${plainPercentage(totals.amountPaid ? (totals.nonTeachingPayroll / totals.amountPaid) * 100 : 0)} of paid payroll`}
          highlight
        />

        <MetricCard
          title="Morning shift payroll"
          value={formatPKR(totals.morningPayroll)}
          icon={Sun}
          subtitle="Paid payroll for morning shift"
          highlight
        />

        <MetricCard
          title="Night shift payroll"
          value={formatPKR(totals.nightPayroll)}
          icon={Moon}
          subtitle="Paid payroll for night shift"
          highlight
        />

        <MetricCard
          title="Overtime / extra payouts"
          value={formatPKR(totals.overtimeExtra)}
          icon={TrendingUp}
          subtitle={`${plainPercentage(totals.amountPaid ? (totals.overtimeExtra / totals.amountPaid) * 100 : 0)} of paid payroll`}
          variant={totals.overtimeExtra > totals.amountPaid * 0.15 && totals.amountPaid > 0 ? "warning" : "default"}
          highlight
        />

        <MetricCard
          title="Bonuses / incentives"
          value={formatPKR(totals.bonusIncentive)}
          icon={CheckCircle2}
          subtitle={`${plainPercentage(totals.amountPaid ? (totals.bonusIncentive / totals.amountPaid) * 100 : 0)} of paid payroll`}
          variant={totals.bonusIncentive > totals.amountPaid * 0.2 && totals.amountPaid > 0 ? "warning" : "default"}
          highlight
        />

        <MetricCard
          title="Pending payroll"
          value={formatPKR(totals.pendingAmount)}
          icon={AlertCircle}
          subtitle={`${pendingRecords.length} pending / partially paid records`}
          variant={pendingRecords.length > 0 ? "warning" : "outline"}
        />
      </div>

      <SectionTitle icon={LayoutDashboard} title="Payroll Overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Gross payroll"
          value={formatPKR(totals.grossPay)}
          icon={BriefcaseBusiness}
          subtitle="Base + overtime + extra + bonus"
          variant="outline"
        />

        <MetricCard
          title="Total deductions"
          value={formatPKR(totals.deductions)}
          icon={ArrowDownRight}
          subtitle="Deductions recorded this month"
          variant="outline"
        />

        <MetricCard
          title="Average paid / employee"
          value={formatPKR(averagePayrollPerEmployee)}
          icon={Users}
          subtitle={`${formatNumber(selectedPayrollRecords.length)} payroll records`}
          variant="outline"
        />

        <MetricCard
          title="Highest payroll department"
          value={highestPayrollDepartment?.department || "—"}
          icon={BarChart3}
          subtitle={highestPayrollDepartment ? formatPKR(highestPayrollDepartment.payroll) : "No payroll yet"}
          variant="outline"
        />
      </div>

      <SectionTitle icon={Plus} title={editingId ? "Update Payroll Record" : "Add Payroll Record"} />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{editingId ? "Edit payroll details" : "New payroll record"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select an employee from HR headcount records. Department, role category and shift are copied automatically.
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
              <FieldLabel>Base pay</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.base_pay}
                onChange={(event) => setFormValue("base_pay", event.target.value)}
                placeholder="50000"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Overtime payout</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.overtime_payout}
                onChange={(event) => setFormValue("overtime_payout", event.target.value)}
                placeholder="5000"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Extra payout</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.extra_payout}
                onChange={(event) => setFormValue("extra_payout", event.target.value)}
                placeholder="2000"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Bonus / incentive</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.bonus_incentive}
                onChange={(event) => setFormValue("bonus_incentive", event.target.value)}
                placeholder="10000"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Deductions</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.deductions}
                onChange={(event) => setFormValue("deductions", event.target.value)}
                placeholder="0"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Amount paid</FieldLabel>
              <input
                type="number"
                min="0"
                step="1"
                value={form.amount_paid}
                onChange={(event) => setFormValue("amount_paid", event.target.value)}
                placeholder={String(netPayPreview)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Payment status</FieldLabel>
              <Select
                value={form.payment_status}
                onValueChange={(value) => setFormValue("payment_status", value as PayrollStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  {PAYROLL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Payment date</FieldLabel>
              <input
                type="date"
                value={form.payment_date}
                onChange={(event) => setFormValue("payment_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Auto gross pay</FieldLabel>
              <input value={formatPKR(grossPayPreview)} readOnly className={inputClassName("bg-muted/40")} />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Auto net pay due</FieldLabel>
              <input value={formatPKR(netPayPreview)} readOnly className={inputClassName("bg-muted/40")} />
            </div>

            <div className="flex items-end lg:col-span-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit3 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Update Payroll" : "Save Payroll"}
              </Button>
            </div>

            <div className="lg:col-span-12">
              <FieldLabel>Payroll notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => setFormValue("notes", event.target.value)}
                placeholder="Optional: overtime reason, incentive reason, approval notes, deductions explanation, etc."
                className={textareaClassName()}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <SectionTitle icon={BarChart3} title="Payroll Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payroll by Role Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollByRole} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip formatter={(value: unknown) => [formatPKR(Number(value) || 0), "Payroll"]} />
                <Bar dataKey="payroll" name="Payroll Paid" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payroll by Shift</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollByShift} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip formatter={(value: unknown) => [formatPKR(Number(value) || 0), "Payroll"]} />
                <Bar dataKey="payroll" name="Payroll Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department-wise Payroll</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip formatter={(value: unknown) => [formatPKR(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="payroll" name="Payroll Paid" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overtimeExtra" name="Overtime / Extra" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bonusIncentive" name="Bonus / Incentive" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6-Month Payroll Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip formatter={(value: unknown) => [formatPKR(Number(value) || 0), ""]} />
                <Legend />
                <Line type="monotone" dataKey="totalPaid" name="Total Paid" stroke="#4f46e5" strokeWidth={2.5} />
                <Line type="monotone" dataKey="overtimeExtra" name="Overtime / Extra" stroke="#f59e0b" strokeWidth={2.5} />
                <Line type="monotone" dataKey="bonuses" name="Bonuses" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={ShieldCheck} title="Payroll Controls & Alerts" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Payroll Audit Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Automatic checks for pending payroll, missing active employee payroll, overtime pressure and incentive spikes.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditAlerts.map((alert, index) => (
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
            <CardTitle className="text-base">Mandatory Payroll Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Total payroll paid</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Tutor payroll</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Non-teaching payroll</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Morning shift payroll</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Night shift payroll</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Overtime / bonuses</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Search} title="Payroll Records" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter, edit and delete payroll records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleRecords.length)} of {formatNumber(selectedPayrollRecords.length)} records for {getMonthLabel(selectedMonth)}.
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
              <FieldLabel>Status</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PayrollStatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {PAYROLL_STATUSES.map((status) => (
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
                  <th className="px-4 py-3 font-semibold">Base Pay</th>
                  <th className="px-4 py-3 font-semibold">Overtime / Extra</th>
                  <th className="px-4 py-3 font-semibold">Bonus</th>
                  <th className="px-4 py-3 font-semibold">Deductions</th>
                  <th className="px-4 py-3 font-semibold">Net Due</th>
                  <th className="px-4 py-3 font-semibold">Amount Paid</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Payment Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading payroll records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => (
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
                      <td className="px-4 py-3">{formatPKR(toAmount(record.base_pay))}</td>
                      <td className="px-4 py-3">{formatPKR(toAmount(record.overtime_payout) + toAmount(record.extra_payout))}</td>
                      <td className="px-4 py-3">{formatPKR(toAmount(record.bonus_incentive))}</td>
                      <td className="px-4 py-3">{formatPKR(toAmount(record.deductions))}</td>
                      <td className="px-4 py-3">{formatPKR(toAmount(record.net_pay_due))}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">{formatPKR(toAmount(record.amount_paid))}</td>
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
                      <td className="px-4 py-3">{record.payment_date || "—"}</td>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-muted-foreground">
                      No payroll records found for this filter.
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