"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
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
  Banknote,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Coins,
  Droplets,
  Edit3,
  FileText,
  Filter,
  Fuel,
  Home,
  Loader2,
  NotebookPen,
  PackageCheck,
  Phone,
  PieChart as PieChartIcon,
  PlugZap,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingBasket,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthStatus = "Open" | "Submitted" | "Approved" | "Rejected";
type RentPendingFilter = "all" | "yes" | "no";
type StatusFilter = "all" | MonthStatus;

type FinanceFacilityRecord = {
  id: string;
  office_name: string;
  record_month: string;
  status: MonthStatus;

  opening_petty_cash_balance: number | string | null;
  petty_cash_received: number | string | null;
  petty_cash_spent: number | string | null;
  petty_cash_vouchers_count: number | string | null;
  unapproved_petty_cash_entries: number | string | null;

  electricity_bill_amount: number | string | null;
  gas_bill_amount: number | string | null;
  water_bill_amount: number | string | null;
  internet_bill_amount: number | string | null;
  generator_ups_expense: number | string | null;
  mobile_office_phone_expense: number | string | null;
  bills_pending_count: number | string | null;

  stationery_expense: number | string | null;
  office_supplies_expense: number | string | null;
  kitchen_refreshments_expense: number | string | null;
  cleaning_supplies_expense: number | string | null;
  stock_shortage_incidents_count: number | string | null;

  office_rent_paid: number | string | null;
  rent_pending: boolean | null;
  maintenance_expense: number | string | null;
  repairs_conducted_count: number | string | null;
  facility_issues_logged: number | string | null;

  monthly_budget: number | string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type FinanceFacilityForm = {
  office_name: string;
  record_month: string;
  status: MonthStatus;

  opening_petty_cash_balance: string;
  petty_cash_received: string;
  petty_cash_spent: string;
  petty_cash_vouchers_count: string;
  unapproved_petty_cash_entries: string;

  electricity_bill_amount: string;
  gas_bill_amount: string;
  water_bill_amount: string;
  internet_bill_amount: string;
  generator_ups_expense: string;
  mobile_office_phone_expense: string;
  bills_pending_count: string;

  stationery_expense: string;
  office_supplies_expense: string;
  kitchen_refreshments_expense: string;
  cleaning_supplies_expense: string;
  stock_shortage_incidents_count: string;

  office_rent_paid: string;
  rent_pending: "yes" | "no";
  maintenance_expense: string;
  repairs_conducted_count: string;
  facility_issues_logged: string;

  monthly_budget: string;
  notes: string;
};

const STATUSES: MonthStatus[] = ["Open", "Submitted", "Approved", "Rejected"];
const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#64748b"];

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getMonthStart(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1);
}

function getMonthLabel(month: string) {
  return getMonthStart(month).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getLastMonths(selectedMonth: string, count = 6) {
  const [year, monthNumber] = selectedMonth.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, monthNumber - 1 - (count - 1 - index), 1);
    return date.toISOString().slice(0, 7);
  });
}

function emptyForm(): FinanceFacilityForm {
  return {
    office_name: "",
    record_month: getCurrentMonth(),
    status: "Open",

    opening_petty_cash_balance: "0",
    petty_cash_received: "0",
    petty_cash_spent: "0",
    petty_cash_vouchers_count: "0",
    unapproved_petty_cash_entries: "0",

    electricity_bill_amount: "0",
    gas_bill_amount: "0",
    water_bill_amount: "0",
    internet_bill_amount: "0",
    generator_ups_expense: "0",
    mobile_office_phone_expense: "0",
    bills_pending_count: "0",

    stationery_expense: "0",
    office_supplies_expense: "0",
    kitchen_refreshments_expense: "0",
    cleaning_supplies_expense: "0",
    stock_shortage_incidents_count: "0",

    office_rent_paid: "0",
    rent_pending: "no",
    maintenance_expense: "0",
    repairs_conducted_count: "0",
    facility_issues_logged: "0",

    monthly_budget: "",
    notes: "",
  };
}

function recordToForm(record: FinanceFacilityRecord): FinanceFacilityForm {
  return {
    office_name: record.office_name || "",
    record_month: record.record_month || getCurrentMonth(),
    status: record.status || "Open",

    opening_petty_cash_balance: String(toNumber(record.opening_petty_cash_balance, 0)),
    petty_cash_received: String(toNumber(record.petty_cash_received, 0)),
    petty_cash_spent: String(toNumber(record.petty_cash_spent, 0)),
    petty_cash_vouchers_count: String(toNumber(record.petty_cash_vouchers_count, 0)),
    unapproved_petty_cash_entries: String(toNumber(record.unapproved_petty_cash_entries, 0)),

    electricity_bill_amount: String(toNumber(record.electricity_bill_amount, 0)),
    gas_bill_amount: String(toNumber(record.gas_bill_amount, 0)),
    water_bill_amount: String(toNumber(record.water_bill_amount, 0)),
    internet_bill_amount: String(toNumber(record.internet_bill_amount, 0)),
    generator_ups_expense: String(toNumber(record.generator_ups_expense, 0)),
    mobile_office_phone_expense: String(toNumber(record.mobile_office_phone_expense, 0)),
    bills_pending_count: String(toNumber(record.bills_pending_count, 0)),

    stationery_expense: String(toNumber(record.stationery_expense, 0)),
    office_supplies_expense: String(toNumber(record.office_supplies_expense, 0)),
    kitchen_refreshments_expense: String(toNumber(record.kitchen_refreshments_expense, 0)),
    cleaning_supplies_expense: String(toNumber(record.cleaning_supplies_expense, 0)),
    stock_shortage_incidents_count: String(toNumber(record.stock_shortage_incidents_count, 0)),

    office_rent_paid: String(toNumber(record.office_rent_paid, 0)),
    rent_pending: record.rent_pending ? "yes" : "no",
    maintenance_expense: String(toNumber(record.maintenance_expense, 0)),
    repairs_conducted_count: String(toNumber(record.repairs_conducted_count, 0)),
    facility_issues_logged: String(toNumber(record.facility_issues_logged, 0)),

    monthly_budget: record.monthly_budget ? String(record.monthly_budget) : "",
    notes: record.notes || "",
  };
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const numberValue = Number(value ?? fallback);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatCurrency(value: number | string | null | undefined) {
  const numberValue = toNumber(value, 0);
  return `PKR ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numberValue || 0)}`;
}

function getClosingPettyCash(record: FinanceFacilityRecord) {
  return (
    toNumber(record.opening_petty_cash_balance, 0) +
    toNumber(record.petty_cash_received, 0) -
    toNumber(record.petty_cash_spent, 0)
  );
}

function getUtilitiesTotal(record: FinanceFacilityRecord) {
  return (
    toNumber(record.electricity_bill_amount, 0) +
    toNumber(record.gas_bill_amount, 0) +
    toNumber(record.water_bill_amount, 0) +
    toNumber(record.internet_bill_amount, 0) +
    toNumber(record.generator_ups_expense, 0) +
    toNumber(record.mobile_office_phone_expense, 0)
  );
}

function getSuppliesTotal(record: FinanceFacilityRecord) {
  return (
    toNumber(record.stationery_expense, 0) +
    toNumber(record.office_supplies_expense, 0) +
    toNumber(record.kitchen_refreshments_expense, 0) +
    toNumber(record.cleaning_supplies_expense, 0)
  );
}

function getRentFacilitiesTotal(record: FinanceFacilityRecord) {
  return toNumber(record.office_rent_paid, 0) + toNumber(record.maintenance_expense, 0);
}

function getMonthlyAdminExpenseTotal(record: FinanceFacilityRecord) {
  return toNumber(record.petty_cash_spent, 0) + getUtilitiesTotal(record) + getSuppliesTotal(record) + getRentFacilitiesTotal(record);
}

function isOverBudget(record: FinanceFacilityRecord) {
  const budget = toNumber(record.monthly_budget, 0);
  return budget > 0 && getMonthlyAdminExpenseTotal(record) > budget;
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
  return `h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${extra}`;
}

function textareaClassName(extra = "") {
  return `min-h-28 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${extra}`;
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

function StatusBadge({ status }: { status: MonthStatus }) {
  const config = {
    Open: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    Submitted: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    Approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Rejected: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  } satisfies Record<MonthStatus, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[status]}`}>{status}</span>;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  icon: ElementType;
  subtitle: string;
  color: "indigo" | "emerald" | "amber" | "violet" | "sky" | "red" | "slate";
}) {
  const styles = {
    indigo: { border: "border-indigo-200 dark:border-indigo-900", bg: "bg-indigo-50 dark:bg-indigo-950/30", icon: "text-indigo-600 dark:text-indigo-300", accent: "bg-indigo-600" },
    emerald: { border: "border-emerald-200 dark:border-emerald-900", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600 dark:text-emerald-300", accent: "bg-emerald-600" },
    amber: { border: "border-amber-200 dark:border-amber-900", bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-amber-600 dark:text-amber-300", accent: "bg-amber-500" },
    violet: { border: "border-violet-200 dark:border-violet-900", bg: "bg-violet-50 dark:bg-violet-950/30", icon: "text-violet-600 dark:text-violet-300", accent: "bg-violet-600" },
    sky: { border: "border-sky-200 dark:border-sky-900", bg: "bg-sky-50 dark:bg-sky-950/30", icon: "text-sky-600 dark:text-sky-300", accent: "bg-sky-600" },
    red: { border: "border-red-200 dark:border-red-900", bg: "bg-red-50 dark:bg-red-950/30", icon: "text-red-600 dark:text-red-300", accent: "bg-red-600" },
    slate: { border: "border-slate-200 dark:border-slate-800", bg: "bg-slate-100 dark:bg-slate-900", icon: "text-slate-600 dark:text-slate-300", accent: "bg-slate-600" },
  }[color];

  return (
    <Card className={`relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${styles.border}`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${styles.accent}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`rounded-full p-3 ${styles.bg}`}>
            <Icon className={`h-5 w-5 ${styles.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminFinanceFacilitiesPage() {
  const [records, setRecords] = useState<FinanceFacilityRecord[]>([]);
  const [form, setForm] = useState<FinanceFacilityForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rentPendingFilter, setRentPendingFilter] = useState<RentPendingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("admin_finance_facilities")
        .select("*")
        .order("record_month", { ascending: false })
        .order("office_name", { ascending: true });

      if (response.error) throw new Error(response.error.message);

      setRecords((response.data || []) as FinanceFacilityRecord[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Could not load admin finance and facilities records. Please check the admin_finance_facilities Supabase table."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel("admin-finance-facilities-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_finance_facilities" },
        () => fetchRecords()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  const monthRecords = useMemo(() => records.filter((record) => record.record_month === selectedMonth), [records, selectedMonth]);

  const pettyCashOpening = monthRecords.reduce((sum, record) => sum + toNumber(record.opening_petty_cash_balance, 0), 0);
  const pettyCashReceived = monthRecords.reduce((sum, record) => sum + toNumber(record.petty_cash_received, 0), 0);
  const pettyCashSpent = monthRecords.reduce((sum, record) => sum + toNumber(record.petty_cash_spent, 0), 0);
  const pettyCashClosing = monthRecords.reduce((sum, record) => sum + getClosingPettyCash(record), 0);
  const pettyCashVouchers = monthRecords.reduce((sum, record) => sum + toNumber(record.petty_cash_vouchers_count, 0), 0);
  const unapprovedPettyCashEntries = monthRecords.reduce((sum, record) => sum + toNumber(record.unapproved_petty_cash_entries, 0), 0);

  const electricityBillAmount = monthRecords.reduce((sum, record) => sum + toNumber(record.electricity_bill_amount, 0), 0);
  const gasBillAmount = monthRecords.reduce((sum, record) => sum + toNumber(record.gas_bill_amount, 0), 0);
  const waterBillAmount = monthRecords.reduce((sum, record) => sum + toNumber(record.water_bill_amount, 0), 0);
  const internetBillAmount = monthRecords.reduce((sum, record) => sum + toNumber(record.internet_bill_amount, 0), 0);
  const generatorUpsExpense = monthRecords.reduce((sum, record) => sum + toNumber(record.generator_ups_expense, 0), 0);
  const mobileOfficePhoneExpense = monthRecords.reduce((sum, record) => sum + toNumber(record.mobile_office_phone_expense, 0), 0);
  const billsPendingCount = monthRecords.reduce((sum, record) => sum + toNumber(record.bills_pending_count, 0), 0);

  const stationeryExpense = monthRecords.reduce((sum, record) => sum + toNumber(record.stationery_expense, 0), 0);
  const officeSuppliesExpense = monthRecords.reduce((sum, record) => sum + toNumber(record.office_supplies_expense, 0), 0);
  const kitchenRefreshmentsExpense = monthRecords.reduce((sum, record) => sum + toNumber(record.kitchen_refreshments_expense, 0), 0);
  const cleaningSuppliesExpense = monthRecords.reduce((sum, record) => sum + toNumber(record.cleaning_supplies_expense, 0), 0);
  const stockShortageIncidents = monthRecords.reduce((sum, record) => sum + toNumber(record.stock_shortage_incidents_count, 0), 0);

  const officeRentPaid = monthRecords.reduce((sum, record) => sum + toNumber(record.office_rent_paid, 0), 0);
  const rentPendingCount = monthRecords.filter((record) => Boolean(record.rent_pending)).length;
  const maintenanceExpense = monthRecords.reduce((sum, record) => sum + toNumber(record.maintenance_expense, 0), 0);
  const repairsConductedCount = monthRecords.reduce((sum, record) => sum + toNumber(record.repairs_conducted_count, 0), 0);
  const facilityIssuesLogged = monthRecords.reduce((sum, record) => sum + toNumber(record.facility_issues_logged, 0), 0);

  const monthlyAdminExpenseTotal = monthRecords.reduce((sum, record) => sum + getMonthlyAdminExpenseTotal(record), 0);
  const overBudgetRecords = monthRecords.filter(isOverBudget).length;

  const expenseByCategory = [
    { category: "Petty Cash", amount: pettyCashSpent },
    { category: "Utilities & Bills", amount: monthRecords.reduce((sum, record) => sum + getUtilitiesTotal(record), 0) },
    { category: "Supplies", amount: monthRecords.reduce((sum, record) => sum + getSuppliesTotal(record), 0) },
    { category: "Rent & Facilities", amount: monthRecords.reduce((sum, record) => sum + getRentFacilitiesTotal(record), 0) },
  ].filter((item) => item.amount > 0);

  const utilitiesBreakdown = [
    { category: "Electricity", amount: electricityBillAmount },
    { category: "Gas", amount: gasBillAmount },
    { category: "Water", amount: waterBillAmount },
    { category: "Internet", amount: internetBillAmount },
    { category: "Generator / UPS", amount: generatorUpsExpense },
    { category: "Mobile / Phone", amount: mobileOfficePhoneExpense },
  ].filter((item) => item.amount > 0);

  const officeWiseExpense = useMemo(() => {
    return monthRecords
      .map((record) => ({
        office: record.office_name,
        total: getMonthlyAdminExpenseTotal(record),
        pettyCash: toNumber(record.petty_cash_spent, 0),
        utilities: getUtilitiesTotal(record),
        supplies: getSuppliesTotal(record),
        rentFacilities: getRentFacilitiesTotal(record),
        budget: toNumber(record.monthly_budget, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [monthRecords]);

  const monthlyTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const monthData = records.filter((record) => record.record_month === month);
      return {
        month: getMonthLabel(month),
        total: monthData.reduce((sum, record) => sum + getMonthlyAdminExpenseTotal(record), 0),
        pettyCash: monthData.reduce((sum, record) => sum + toNumber(record.petty_cash_spent, 0), 0),
        bills: monthData.reduce((sum, record) => sum + getUtilitiesTotal(record), 0),
        supplies: monthData.reduce((sum, record) => sum + getSuppliesTotal(record), 0),
        facilities: monthData.reduce((sum, record) => sum + getRentFacilitiesTotal(record), 0),
      };
    });
  }, [records, selectedMonth]);

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records
      .filter((record) => record.record_month === selectedMonth)
      .filter((record) => statusFilter === "all" || record.status === statusFilter)
      .filter((record) => rentPendingFilter === "all" || (rentPendingFilter === "yes" ? record.rent_pending : !record.rent_pending))
      .filter((record) => {
        if (!query) return true;
        return [record.office_name, record.record_month, record.status, record.notes || ""]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => a.office_name.localeCompare(b.office_name));
  }, [records, selectedMonth, statusFilter, rentPendingFilter, searchQuery]);

  const financeInsights = useMemo(() => {
    const insights = [];

    if (monthRecords.length === 0) {
      insights.push("No finance and facilities records are available for this month. Add office monthly records to activate tracking.");
    }

    if (unapprovedPettyCashEntries > 0) {
      insights.push(`${unapprovedPettyCashEntries} unapproved petty cash entr${unapprovedPettyCashEntries === 1 ? "y" : "ies"} need review before month closing.`);
    }

    if (billsPendingCount > 0) {
      insights.push(`${billsPendingCount} bill(s) are pending. Clear pending utilities before due dates to avoid service disruption.`);
    }

    if (rentPendingCount > 0) {
      insights.push(`${rentPendingCount} office rent payment(s) are still pending for ${getMonthLabel(selectedMonth)}.`);
    }

    if (stockShortageIncidents > 0) {
      insights.push(`${stockShortageIncidents} stock shortage incident(s) were recorded. Review stationery, kitchen and cleaning stock levels.`);
    }

    if (facilityIssuesLogged > 0) {
      insights.push(`${facilityIssuesLogged} facility issue(s) were logged. Coordinate repairs and admin follow-up.`);
    }

    if (overBudgetRecords > 0) {
      insights.push(`${overBudgetRecords} office record(s) are over budget. Review spending by category before approval.`);
    }

    if (pettyCashClosing < 0) {
      insights.push("Closing petty cash is negative. Check petty cash received, spent entries and voucher approvals.");
    }

    if (!insights.length) {
      insights.push("Admin finance and facilities look controlled for this month. Continue monitoring petty cash, pending bills, stock shortages and rent status.");
    }

    return insights;
  }, [
    monthRecords.length,
    unapprovedPettyCashEntries,
    billsPendingCount,
    rentPendingCount,
    stockShortageIncidents,
    facilityIssuesLogged,
    overBudgetRecords,
    pettyCashClosing,
    selectedMonth,
  ]);

  function setFormValue<K extends keyof FinanceFacilityForm>(key: K, value: FinanceFacilityForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm({ ...emptyForm(), record_month: selectedMonth });
    setIsModalOpen(true);
    setMessage(null);
  }

  function openEditModal(record: FinanceFacilityRecord) {
    setEditingId(record.id);
    setForm(recordToForm(record));
    setIsModalOpen(true);
    setMessage(null);
  }

  function closeModal() {
    if (saving) return;
    setEditingId(null);
    setIsModalOpen(false);
    setForm(emptyForm());
  }

  function getFormClosingCash() {
    return Number(form.opening_petty_cash_balance || 0) + Number(form.petty_cash_received || 0) - Number(form.petty_cash_spent || 0);
  }

  function getFormTotalExpense() {
    return (
      Number(form.petty_cash_spent || 0) +
      Number(form.electricity_bill_amount || 0) +
      Number(form.gas_bill_amount || 0) +
      Number(form.water_bill_amount || 0) +
      Number(form.internet_bill_amount || 0) +
      Number(form.generator_ups_expense || 0) +
      Number(form.mobile_office_phone_expense || 0) +
      Number(form.stationery_expense || 0) +
      Number(form.office_supplies_expense || 0) +
      Number(form.kitchen_refreshments_expense || 0) +
      Number(form.cleaning_supplies_expense || 0) +
      Number(form.office_rent_paid || 0) +
      Number(form.maintenance_expense || 0)
    );
  }

  function buildPayload() {
    return {
      office_name: form.office_name.trim(),
      record_month: form.record_month,
      status: form.status,

      opening_petty_cash_balance: Number(form.opening_petty_cash_balance || 0),
      petty_cash_received: Number(form.petty_cash_received || 0),
      petty_cash_spent: Number(form.petty_cash_spent || 0),
      petty_cash_vouchers_count: Number(form.petty_cash_vouchers_count || 0),
      unapproved_petty_cash_entries: Number(form.unapproved_petty_cash_entries || 0),

      electricity_bill_amount: Number(form.electricity_bill_amount || 0),
      gas_bill_amount: Number(form.gas_bill_amount || 0),
      water_bill_amount: Number(form.water_bill_amount || 0),
      internet_bill_amount: Number(form.internet_bill_amount || 0),
      generator_ups_expense: Number(form.generator_ups_expense || 0),
      mobile_office_phone_expense: Number(form.mobile_office_phone_expense || 0),
      bills_pending_count: Number(form.bills_pending_count || 0),

      stationery_expense: Number(form.stationery_expense || 0),
      office_supplies_expense: Number(form.office_supplies_expense || 0),
      kitchen_refreshments_expense: Number(form.kitchen_refreshments_expense || 0),
      cleaning_supplies_expense: Number(form.cleaning_supplies_expense || 0),
      stock_shortage_incidents_count: Number(form.stock_shortage_incidents_count || 0),

      office_rent_paid: Number(form.office_rent_paid || 0),
      rent_pending: form.rent_pending === "yes",
      maintenance_expense: Number(form.maintenance_expense || 0),
      repairs_conducted_count: Number(form.repairs_conducted_count || 0),
      facility_issues_logged: Number(form.facility_issues_logged || 0),

      monthly_budget: form.monthly_budget ? Number(form.monthly_budget) : null,
      notes: form.notes.trim() || null,
    };
  }

  function validateForm() {
    if (!form.office_name.trim()) return "Please enter office name.";
    if (!form.record_month) return "Please select record month.";

    const numericFields: Array<keyof FinanceFacilityForm> = [
      "opening_petty_cash_balance",
      "petty_cash_received",
      "petty_cash_spent",
      "petty_cash_vouchers_count",
      "unapproved_petty_cash_entries",
      "electricity_bill_amount",
      "gas_bill_amount",
      "water_bill_amount",
      "internet_bill_amount",
      "generator_ups_expense",
      "mobile_office_phone_expense",
      "bills_pending_count",
      "stationery_expense",
      "office_supplies_expense",
      "kitchen_refreshments_expense",
      "cleaning_supplies_expense",
      "stock_shortage_incidents_count",
      "office_rent_paid",
      "maintenance_expense",
      "repairs_conducted_count",
      "facility_issues_logged",
    ];

    for (const field of numericFields) {
      const value = Number(form[field] || 0);
      if (!Number.isFinite(value) || value < 0) return "All amount/count fields must be zero or greater.";
    }

    if (form.monthly_budget) {
      const budget = Number(form.monthly_budget);
      if (!Number.isFinite(budget) || budget < 0) return "Monthly budget must be zero or greater.";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = buildPayload();
      const response = editingId
        ? await supabase.from("admin_finance_facilities").update(payload).eq("id", editingId).select().single()
        : await supabase.from("admin_finance_facilities").insert(payload).select().single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId ? "Finance and facilities record updated successfully." : "Finance and facilities record added successfully.",
      });
      closeModal();
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save finance and facilities record.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(record: FinanceFacilityRecord, status: MonthStatus) {
    try {
      setMessage(null);
      const response = await supabase.from("admin_finance_facilities").update({ status }).eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: `${record.office_name} marked as ${status}.` });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not update record status.") });
    }
  }

  async function handleDelete(record: FinanceFacilityRecord) {
    const confirmed = window.confirm(`Delete finance record for ${record.office_name} - ${record.record_month}?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const { error } = await supabase.from("admin_finance_facilities").delete().eq("id", record.id);
      if (error) throw new Error(error.message);
      setMessage({ type: "success", text: "Finance and facilities record deleted." });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not delete this record.") });
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading admin finance and facilities…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin - Finance & Facilities</h1>
          <p className="text-muted-foreground">
            Track petty cash, utilities, office supplies, rent, facility expenses, pending bills and monthly admin spending.
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
          <Button onClick={fetchRecords} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openAddModal} size="sm" className="shadow-lg shadow-indigo-500/20">
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </div>
      </div>

      {message && (
        <Card className={message.type === "success" ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"}>
          <CardContent className="flex items-start gap-3 py-4">
            {message.type === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />}
            <p className={message.type === "success" ? "text-sm text-emerald-700 dark:text-emerald-300" : "text-sm text-red-700 dark:text-red-300"}>{message.text}</p>
          </CardContent>
        </Card>
      )}

      <SectionTitle icon={Wallet} title="2. Petty Cash Management (PKR)" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Opening petty cash" value={formatCurrency(pettyCashOpening)} icon={Wallet} subtitle="Opening balance this month" color="indigo" />
        <MetricCard title="Petty cash received" value={formatCurrency(pettyCashReceived)} icon={Banknote} subtitle="Cash added during month" color="emerald" />
        <MetricCard title="Petty cash spent" value={formatCurrency(pettyCashSpent)} icon={Coins} subtitle="Recorded petty cash spending" color="amber" />
        <MetricCard title="Closing petty cash" value={formatCurrency(pettyCashClosing)} icon={ReceiptText} subtitle="Auto-calculated balance" color={pettyCashClosing < 0 ? "red" : "sky"} />
        <MetricCard title="Petty cash vouchers" value={formatNumber(pettyCashVouchers)} icon={FileText} subtitle="Voucher count" color="violet" />
        <MetricCard title="Unapproved entries" value={formatNumber(unapprovedPettyCashEntries)} icon={ShieldAlert} subtitle="Need approval before closing" color={unapprovedPettyCashEntries > 0 ? "red" : "emerald"} />
      </div>

      <SectionTitle icon={Zap} title="3. Utilities & Bills (PKR)" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard title="Electricity bill" value={formatCurrency(electricityBillAmount)} icon={Zap} subtitle="Electricity bill amount" color="amber" />
        <MetricCard title="Gas bill" value={formatCurrency(gasBillAmount)} icon={Fuel} subtitle="Gas bill amount" color="violet" />
        <MetricCard title="Water bill" value={formatCurrency(waterBillAmount)} icon={Droplets} subtitle="Water bill amount" color="sky" />
        <MetricCard title="Internet bill" value={formatCurrency(internetBillAmount)} icon={Wifi} subtitle="Internet bill amount" color="indigo" />
        <MetricCard title="Generator / UPS" value={formatCurrency(generatorUpsExpense)} icon={PlugZap} subtitle="Backup power expense" color="slate" />
        <MetricCard title="Mobile / phone" value={formatCurrency(mobileOfficePhoneExpense)} icon={Phone} subtitle="Office phone expense" color="emerald" />
        <MetricCard title="Bills pending" value={formatNumber(billsPendingCount)} icon={ShieldAlert} subtitle="Pending bill count" color={billsPendingCount > 0 ? "red" : "emerald"} />
      </div>

      <SectionTitle icon={ShoppingBasket} title="4. Office Supplies & Consumables" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Stationery expense" value={formatCurrency(stationeryExpense)} icon={NotebookPen} subtitle="Stationery spending" color="indigo" />
        <MetricCard title="Office supplies" value={formatCurrency(officeSuppliesExpense)} icon={PackageCheck} subtitle="General office supplies" color="emerald" />
        <MetricCard title="Kitchen / refreshments" value={formatCurrency(kitchenRefreshmentsExpense)} icon={Utensils} subtitle="Kitchen and refreshment cost" color="amber" />
        <MetricCard title="Cleaning supplies" value={formatCurrency(cleaningSuppliesExpense)} icon={ShoppingBasket} subtitle="Cleaning consumables" color="sky" />
        <MetricCard title="Stock shortages" value={formatNumber(stockShortageIncidents)} icon={ShieldAlert} subtitle="Shortage incident count" color={stockShortageIncidents > 0 ? "red" : "emerald"} />
      </div>

      <SectionTitle icon={Home} title="5. Office Rent & Facilities" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Office rent paid" value={formatCurrency(officeRentPaid)} icon={Home} subtitle="Rent paid this month" color="indigo" />
        <MetricCard title="Rent pending" value={rentPendingCount > 0 ? "Yes" : "No"} icon={ShieldAlert} subtitle={`${rentPendingCount} office(s) pending`} color={rentPendingCount > 0 ? "red" : "emerald"} />
        <MetricCard title="Maintenance expense" value={formatCurrency(maintenanceExpense)} icon={Wrench} subtitle="Facility maintenance spending" color="amber" />
        <MetricCard title="Repairs conducted" value={formatNumber(repairsConductedCount)} icon={Wrench} subtitle="Repair count" color="sky" />
        <MetricCard title="Facility issues logged" value={formatNumber(facilityIssuesLogged)} icon={ClipboardList} subtitle="Issues logged this month" color={facilityIssuesLogged > 0 ? "amber" : "emerald"} />
      </div>

      <SectionTitle icon={TrendingUp} title="Future-Ready Finance Automation" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Monthly admin expense" value={formatCurrency(monthlyAdminExpenseTotal)} icon={BarChart3} subtitle="All admin categories combined" color="indigo" />
        <MetricCard title="Over-budget offices" value={formatNumber(overBudgetRecords)} icon={ShieldAlert} subtitle="Compared with monthly budget" color={overBudgetRecords > 0 ? "red" : "emerald"} />
        <MetricCard title="Pending warnings" value={formatNumber(billsPendingCount + unapprovedPettyCashEntries + rentPendingCount)} icon={AlertCircle} subtitle="Bills, rent and approvals" color={billsPendingCount + unapprovedPettyCashEntries + rentPendingCount > 0 ? "red" : "emerald"} />
        <MetricCard title="Records this month" value={formatNumber(monthRecords.length)} icon={Building2} subtitle={`Office records for ${getMonthLabel(selectedMonth)}`} color="violet" />
      </div>

      <SectionTitle icon={PieChartIcon} title="Charts & Expense Analytics" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Expense by Category</CardTitle>
            <p className="text-sm text-muted-foreground">Petty cash, utilities, supplies and rent/facilities split.</p>
          </CardHeader>
          <CardContent className="h-80">
            {expenseByCategory.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={expenseByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={95} label={(props) => {
                    const payload = (props as { payload?: { category?: string; amount?: number } }).payload;
                    return `${payload?.category ?? "Category"}: ${formatCurrency(payload?.amount ?? 0)}`;
                  }}>
                    {expenseByCategory.map((entry, index) => <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatCurrency(Number(value) || 0), "Amount"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No expense category data yet.</div>}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Utilities & Bills Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">Electricity, gas, water, internet, generator/UPS and phone expense.</p>
          </CardHeader>
          <CardContent className="h-80">
            {utilitiesBreakdown.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilitiesBreakdown} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatCurrency(Number(value) || 0), "Amount"]} />
                  <Bar dataKey="amount" name="Amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No utility data yet.</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Monthly Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Last 6 months of admin finance and facilities spending.</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatCurrency(Number(value) || 0), ""]} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke="#4f46e5" strokeWidth={2.5} />
                <Line type="monotone" dataKey="pettyCash" name="Petty cash" stroke="#10b981" strokeWidth={2.5} />
                <Line type="monotone" dataKey="bills" name="Bills" stroke="#f59e0b" strokeWidth={2.5} />
                <Line type="monotone" dataKey="facilities" name="Facilities" stroke="#ef4444" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Office-wise Expense Comparison</CardTitle>
            <p className="text-sm text-muted-foreground">Compare total monthly admin expense by office.</p>
          </CardHeader>
          <CardContent className="h-80">
            {officeWiseExpense.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={officeWiseExpense} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="office" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatCurrency(Number(value) || 0), ""]} />
                  <Legend />
                  <Bar dataKey="total" name="Total expense" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget" name="Budget" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No office expense data yet.</div>}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={ShieldAlert} title="Automated Finance & Facilities Insights" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Smart Admin Finance Notes</CardTitle>
            <p className="text-sm text-muted-foreground">Automatic alerts for petty cash, pending bills, rent, shortages, facility issues and budget control.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financeInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <p className="text-sm text-muted-foreground">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Future-Ready Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Closing cash auto-calculated",
              "Pending bills warning",
              "Unapproved petty cash alert",
              "Over-budget category alert",
              "Monthly expense trend",
              "Office-wise comparison",
              "Facility cost tracking",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Filter} title="Finance & Facilities Records" />
      <Card className="bg-white dark:bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter and manage monthly office records</CardTitle>
              <p className="text-sm text-muted-foreground">Showing {formatNumber(visibleRecords.length)} of {formatNumber(monthRecords.length)} records for {getMonthLabel(selectedMonth)}.</p>
            </div>
            <Button onClick={openAddModal} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <FieldLabel>Status</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Rent Pending</FieldLabel>
              <Select value={rentPendingFilter} onValueChange={(value) => setRentPendingFilter(value as RentPendingFilter)}>
                <SelectTrigger><SelectValue placeholder="Rent pending" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All records</SelectItem>
                  <SelectItem value="yes">Rent pending</SelectItem>
                  <SelectItem value="no">No rent pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search office or notes..." className={inputClassName("pl-9")} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1700px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Office</th>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Petty Cash</th>
                  <th className="px-4 py-3 font-semibold">Closing Cash</th>
                  <th className="px-4 py-3 font-semibold">Vouchers</th>
                  <th className="px-4 py-3 font-semibold">Unapproved</th>
                  <th className="px-4 py-3 font-semibold">Utilities</th>
                  <th className="px-4 py-3 font-semibold">Pending Bills</th>
                  <th className="px-4 py-3 font-semibold">Supplies</th>
                  <th className="px-4 py-3 font-semibold">Shortages</th>
                  <th className="px-4 py-3 font-semibold">Rent</th>
                  <th className="px-4 py-3 font-semibold">Maintenance</th>
                  <th className="px-4 py-3 font-semibold">Facilities</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Budget</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={17} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => {
                    const total = getMonthlyAdminExpenseTotal(record);
                    const budget = toNumber(record.monthly_budget, 0);
                    return (
                      <tr key={record.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3 font-semibold">{record.office_name}</td>
                        <td className="px-4 py-3">{record.record_month}</td>
                        <td className="px-4 py-3">{formatCurrency(record.petty_cash_spent)}</td>
                        <td className={getClosingPettyCash(record) < 0 ? "px-4 py-3 font-semibold text-red-600" : "px-4 py-3"}>{formatCurrency(getClosingPettyCash(record))}</td>
                        <td className="px-4 py-3">{toNumber(record.petty_cash_vouchers_count, 0)}</td>
                        <td className={toNumber(record.unapproved_petty_cash_entries, 0) > 0 ? "px-4 py-3 font-semibold text-red-600" : "px-4 py-3"}>{toNumber(record.unapproved_petty_cash_entries, 0)}</td>
                        <td className="px-4 py-3">{formatCurrency(getUtilitiesTotal(record))}</td>
                        <td className={toNumber(record.bills_pending_count, 0) > 0 ? "px-4 py-3 font-semibold text-red-600" : "px-4 py-3"}>{toNumber(record.bills_pending_count, 0)}</td>
                        <td className="px-4 py-3">{formatCurrency(getSuppliesTotal(record))}</td>
                        <td className={toNumber(record.stock_shortage_incidents_count, 0) > 0 ? "px-4 py-3 font-semibold text-amber-600" : "px-4 py-3"}>{toNumber(record.stock_shortage_incidents_count, 0)}</td>
                        <td className={record.rent_pending ? "px-4 py-3 font-semibold text-red-600" : "px-4 py-3"}>{formatCurrency(record.office_rent_paid)} • {record.rent_pending ? "Pending" : "Paid"}</td>
                        <td className="px-4 py-3">{formatCurrency(record.maintenance_expense)}</td>
                        <td className="px-4 py-3">{toNumber(record.facility_issues_logged, 0)} issues</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(total)}</td>
                        <td className={budget > 0 && total > budget ? "px-4 py-3 font-semibold text-red-600" : "px-4 py-3"}>{budget ? formatCurrency(budget) : "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(record)}>
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {record.status !== "Approved" && <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(record, "Approved")}>Approve</Button>}
                            {record.status === "Open" && <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(record, "Submitted")}>Submit</Button>}
                            <Button type="button" variant="outline" size="icon" onClick={() => handleDelete(record)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={17} className="px-4 py-10 text-center text-muted-foreground">No finance and facilities records found for this month.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-7xl overflow-hidden bg-white shadow-2xl dark:bg-card">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Plus className="h-5 w-5" />
                    {editingId ? "Edit Finance & Facilities Record" : "Add Finance & Facilities Record"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-white/80">
                    Add monthly office finance data once. Closing cash, total expense, warnings, charts and comparisons update automatically.
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={closeModal} disabled={saving} className="text-white hover:bg-white/20 hover:text-white">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="max-h-[calc(92vh-96px)] overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-8">
                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Record Details</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Office name *</FieldLabel>
                        <input value={form.office_name} onChange={(event) => setFormValue("office_name", event.target.value)} placeholder="Lahore Office" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Record month *</FieldLabel>
                        <input type="month" value={form.record_month} onChange={(event) => setFormValue("record_month", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Status</FieldLabel>
                        <Select value={form.status} onValueChange={(value) => setFormValue("status", value as MonthStatus)}>
                          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><Wallet className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Petty Cash Management</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Opening balance</FieldLabel><input type="number" min="0" value={form.opening_petty_cash_balance} onChange={(event) => setFormValue("opening_petty_cash_balance", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Petty cash received</FieldLabel><input type="number" min="0" value={form.petty_cash_received} onChange={(event) => setFormValue("petty_cash_received", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Petty cash spent</FieldLabel><input type="number" min="0" value={form.petty_cash_spent} onChange={(event) => setFormValue("petty_cash_spent", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Vouchers count</FieldLabel><input type="number" min="0" value={form.petty_cash_vouchers_count} onChange={(event) => setFormValue("petty_cash_vouchers_count", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Unapproved entries</FieldLabel><input type="number" min="0" value={form.unapproved_petty_cash_entries} onChange={(event) => setFormValue("unapproved_petty_cash_entries", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Closing balance auto</FieldLabel><input value={formatCurrency(getFormClosingCash())} readOnly className={inputClassName("bg-muted/40 font-semibold")} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Utilities & Bills</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Electricity bill</FieldLabel><input type="number" min="0" value={form.electricity_bill_amount} onChange={(event) => setFormValue("electricity_bill_amount", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Gas bill</FieldLabel><input type="number" min="0" value={form.gas_bill_amount} onChange={(event) => setFormValue("gas_bill_amount", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Water bill</FieldLabel><input type="number" min="0" value={form.water_bill_amount} onChange={(event) => setFormValue("water_bill_amount", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Internet bill</FieldLabel><input type="number" min="0" value={form.internet_bill_amount} onChange={(event) => setFormValue("internet_bill_amount", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Generator / UPS expense</FieldLabel><input type="number" min="0" value={form.generator_ups_expense} onChange={(event) => setFormValue("generator_ups_expense", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Mobile / phone expense</FieldLabel><input type="number" min="0" value={form.mobile_office_phone_expense} onChange={(event) => setFormValue("mobile_office_phone_expense", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Bills pending count</FieldLabel><input type="number" min="0" value={form.bills_pending_count} onChange={(event) => setFormValue("bills_pending_count", event.target.value)} className={inputClassName()} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><ShoppingBasket className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Office Supplies & Consumables</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Stationery expense</FieldLabel><input type="number" min="0" value={form.stationery_expense} onChange={(event) => setFormValue("stationery_expense", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Office supplies expense</FieldLabel><input type="number" min="0" value={form.office_supplies_expense} onChange={(event) => setFormValue("office_supplies_expense", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Kitchen / refreshments</FieldLabel><input type="number" min="0" value={form.kitchen_refreshments_expense} onChange={(event) => setFormValue("kitchen_refreshments_expense", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Cleaning supplies</FieldLabel><input type="number" min="0" value={form.cleaning_supplies_expense} onChange={(event) => setFormValue("cleaning_supplies_expense", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Stock shortage incidents</FieldLabel><input type="number" min="0" value={form.stock_shortage_incidents_count} onChange={(event) => setFormValue("stock_shortage_incidents_count", event.target.value)} className={inputClassName()} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><Home className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Office Rent & Facilities</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Office rent paid</FieldLabel><input type="number" min="0" value={form.office_rent_paid} onChange={(event) => setFormValue("office_rent_paid", event.target.value)} className={inputClassName()} /></div>
                      <div>
                        <FieldLabel>Rent pending</FieldLabel>
                        <Select value={form.rent_pending} onValueChange={(value) => setFormValue("rent_pending", value as "yes" | "no")}>
                          <SelectTrigger><SelectValue placeholder="Rent pending" /></SelectTrigger>
                          <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div><FieldLabel>Maintenance expense</FieldLabel><input type="number" min="0" value={form.maintenance_expense} onChange={(event) => setFormValue("maintenance_expense", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Repairs conducted</FieldLabel><input type="number" min="0" value={form.repairs_conducted_count} onChange={(event) => setFormValue("repairs_conducted_count", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Facility issues logged</FieldLabel><input type="number" min="0" value={form.facility_issues_logged} onChange={(event) => setFormValue("facility_issues_logged", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Monthly budget</FieldLabel><input type="number" min="0" value={form.monthly_budget} onChange={(event) => setFormValue("monthly_budget", event.target.value)} placeholder="Optional" className={inputClassName()} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <FieldLabel>Notes</FieldLabel>
                    <textarea value={form.notes} onChange={(event) => setFormValue("notes", event.target.value)} placeholder="Add notes about pending bills, petty cash approvals, stock shortages, repairs, rent or monthly admin spending..." className={textareaClassName()} />
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="h-5 w-5 text-indigo-600" />Record Preview</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Office</p><p className="font-semibold">{form.office_name || "New office record"}</p></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Month</p><p className="font-semibold">{form.record_month}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold">{form.status}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Closing cash</p><p className="font-semibold">{formatCurrency(getFormClosingCash())}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Total expense</p><p className="font-semibold">{formatCurrency(getFormTotalExpense())}</p></div>
                      </div>
                      {form.monthly_budget && Number(form.monthly_budget) > 0 && getFormTotalExpense() > Number(form.monthly_budget) && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                          This record is over budget by {formatCurrency(getFormTotalExpense() - Number(form.monthly_budget))}.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-card">
                    <CardHeader><CardTitle className="text-base">Why this helps future admin work</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-2"><Wallet className="mt-0.5 h-4 w-4 text-indigo-600" />Closing petty cash is calculated automatically.</div>
                      <div className="flex gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 text-indigo-600" />Pending bills and unapproved entries are highlighted.</div>
                      <div className="flex gap-2"><BarChart3 className="mt-0.5 h-4 w-4 text-indigo-600" />Expense category charts help owners see where money goes.</div>
                      <div className="flex gap-2"><Building2 className="mt-0.5 h-4 w-4 text-indigo-600" />Office-wise comparison makes branch spending easy to review.</div>
                      <div className="flex gap-2"><Wrench className="mt-0.5 h-4 w-4 text-indigo-600" />Facilities and repairs stay connected with admin expense control.</div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={saving} className="w-full sm:w-auto">Cancel</Button>
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      {editingId ? "Update Record" : "Save Record"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
