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
  Archive,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Edit3,
  FileCheck2,
  FileText,
  Filter,
  Gauge,
  Loader2,
  Package,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  X,
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
type StatusFilter = "all" | MonthStatus;
type AuditRiskFilter = "all" | "ready" | "watch" | "high";
type InventoryFilter = "all" | "updated" | "not_updated";

type AssetComplianceRecord = {
  id: string;
  office_name: string;
  record_month: string;
  status: MonthStatus;

  assets_purchased: number | string | null;
  assets_disposed: number | string | null;
  assets_issued_to_staff: number | string | null;
  missing_damaged_assets: number | string | null;
  inventory_register_updated: boolean | null;

  admin_expenses_approved: number | string | null;
  admin_expenses_rejected: number | string | null;
  pending_approvals: number | string | null;
  average_pending_approval_age_days: number | string | null;
  policy_violations_admin: number | string | null;

  bills_filed: boolean | null;
  receipts_attached: boolean | null;
  petty_cash_reconciliation_completed: boolean | null;
  missing_documents_count: number | string | null;

  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type AssetComplianceForm = {
  office_name: string;
  record_month: string;
  status: MonthStatus;

  assets_purchased: string;
  assets_disposed: string;
  assets_issued_to_staff: string;
  missing_damaged_assets: string;
  inventory_register_updated: "yes" | "no";

  admin_expenses_approved: string;
  admin_expenses_rejected: string;
  pending_approvals: string;
  average_pending_approval_age_days: string;
  policy_violations_admin: string;

  bills_filed: "yes" | "no";
  receipts_attached: "yes" | "no";
  petty_cash_reconciliation_completed: "yes" | "no";
  missing_documents_count: string;

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

function emptyForm(): AssetComplianceForm {
  return {
    office_name: "",
    record_month: getCurrentMonth(),
    status: "Open",

    assets_purchased: "0",
    assets_disposed: "0",
    assets_issued_to_staff: "0",
    missing_damaged_assets: "0",
    inventory_register_updated: "yes",

    admin_expenses_approved: "0",
    admin_expenses_rejected: "0",
    pending_approvals: "0",
    average_pending_approval_age_days: "0",
    policy_violations_admin: "0",

    bills_filed: "yes",
    receipts_attached: "yes",
    petty_cash_reconciliation_completed: "yes",
    missing_documents_count: "0",

    notes: "",
  };
}

function recordToForm(record: AssetComplianceRecord): AssetComplianceForm {
  return {
    office_name: record.office_name || "",
    record_month: record.record_month || getCurrentMonth(),
    status: record.status || "Open",

    assets_purchased: String(toNumber(record.assets_purchased, 0)),
    assets_disposed: String(toNumber(record.assets_disposed, 0)),
    assets_issued_to_staff: String(toNumber(record.assets_issued_to_staff, 0)),
    missing_damaged_assets: String(toNumber(record.missing_damaged_assets, 0)),
    inventory_register_updated: record.inventory_register_updated === false ? "no" : "yes",

    admin_expenses_approved: String(toNumber(record.admin_expenses_approved, 0)),
    admin_expenses_rejected: String(toNumber(record.admin_expenses_rejected, 0)),
    pending_approvals: String(toNumber(record.pending_approvals, 0)),
    average_pending_approval_age_days: String(toNumber(record.average_pending_approval_age_days, 0)),
    policy_violations_admin: String(toNumber(record.policy_violations_admin, 0)),

    bills_filed: record.bills_filed === false ? "no" : "yes",
    receipts_attached: record.receipts_attached === false ? "no" : "yes",
    petty_cash_reconciliation_completed: record.petty_cash_reconciliation_completed === false ? "no" : "yes",
    missing_documents_count: String(toNumber(record.missing_documents_count, 0)),

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

function getAssetHealthScore(record: AssetComplianceRecord) {
  const missingPenalty = toNumber(record.missing_damaged_assets, 0) * 12;
  const inventoryPenalty = record.inventory_register_updated ? 0 : 25;
  const issuePressure = Math.max(0, toNumber(record.assets_disposed, 0) - toNumber(record.assets_purchased, 0)) * 3;
  return Math.max(0, Math.min(100, Math.round(100 - missingPenalty - inventoryPenalty - issuePressure)));
}

function getAuditReadinessScore(record: AssetComplianceRecord) {
  const documentPenalty = toNumber(record.missing_documents_count, 0) * 8;
  const pendingApprovalPenalty = toNumber(record.pending_approvals, 0) * 4;
  const ageingPenalty = Math.min(25, toNumber(record.average_pending_approval_age_days, 0));
  const policyPenalty = toNumber(record.policy_violations_admin, 0) * 12;
  const billsPenalty = record.bills_filed ? 0 : 12;
  const receiptsPenalty = record.receipts_attached ? 0 : 12;
  const pettyCashPenalty = record.petty_cash_reconciliation_completed ? 0 : 15;
  const inventoryPenalty = record.inventory_register_updated ? 0 : 10;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - documentPenalty - pendingApprovalPenalty - ageingPenalty - policyPenalty - billsPenalty - receiptsPenalty - pettyCashPenalty - inventoryPenalty)
    )
  );
}

function getPolicyRiskLevel(record: AssetComplianceRecord) {
  const violations = toNumber(record.policy_violations_admin, 0);
  const pendingApprovals = toNumber(record.pending_approvals, 0);
  const missingDocs = toNumber(record.missing_documents_count, 0);

  if (violations >= 3 || missingDocs >= 5 || pendingApprovals >= 10) return "High";
  if (violations >= 1 || missingDocs >= 2 || pendingApprovals >= 4) return "Medium";
  return "Low";
}

function getAuditRiskFilter(record: AssetComplianceRecord): "ready" | "watch" | "high" {
  const score = getAuditReadinessScore(record);
  if (score >= 85) return "ready";
  if (score >= 65) return "watch";
  return "high";
}

function getRiskLabel(score: number) {
  if (score >= 85) return "Ready";
  if (score >= 65) return "Watch";
  return "High Risk";
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

function YesNoBadge({ value, yesText = "Yes", noText = "No" }: { value: boolean | null | undefined; yesText?: string; noText?: string }) {
  const active = value === true;
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}>
      {active ? yesText : noText}
    </span>
  );
}

function RiskBadge({ score }: { score: number }) {
  const label = getRiskLabel(score);
  const config = {
    Ready: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Watch: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    "High Risk": "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  } satisfies Record<string, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[label]}`}>{score}% • {label}</span>;
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

export default function AdminAssetsComplianceRecordsPage() {
  const [records, setRecords] = useState<AssetComplianceRecord[]>([]);
  const [form, setForm] = useState<AssetComplianceForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [auditRiskFilter, setAuditRiskFilter] = useState<AuditRiskFilter>("all");
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("admin_assets_compliance_records")
        .select("*")
        .order("record_month", { ascending: false })
        .order("office_name", { ascending: true });

      if (response.error) throw new Error(response.error.message);

      setRecords((response.data || []) as AssetComplianceRecord[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Could not load assets, compliance and documentation records. Please check the admin_assets_compliance_records Supabase table."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel("admin-assets-compliance-records-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_assets_compliance_records" },
        () => fetchRecords()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  const monthRecords = useMemo(() => records.filter((record) => record.record_month === selectedMonth), [records, selectedMonth]);

  const assetsPurchased = monthRecords.reduce((sum, record) => sum + toNumber(record.assets_purchased, 0), 0);
  const assetsDisposed = monthRecords.reduce((sum, record) => sum + toNumber(record.assets_disposed, 0), 0);
  const assetsIssuedToStaff = monthRecords.reduce((sum, record) => sum + toNumber(record.assets_issued_to_staff, 0), 0);
  const missingDamagedAssets = monthRecords.reduce((sum, record) => sum + toNumber(record.missing_damaged_assets, 0), 0);
  const inventoryRegisterUpdatedCount = monthRecords.filter((record) => record.inventory_register_updated === true).length;
  const inventoryNotUpdatedCount = monthRecords.filter((record) => record.inventory_register_updated !== true).length;

  const adminExpensesApproved = monthRecords.reduce((sum, record) => sum + toNumber(record.admin_expenses_approved, 0), 0);
  const adminExpensesRejected = monthRecords.reduce((sum, record) => sum + toNumber(record.admin_expenses_rejected, 0), 0);
  const pendingApprovals = monthRecords.reduce((sum, record) => sum + toNumber(record.pending_approvals, 0), 0);
  const policyViolationsAdmin = monthRecords.reduce((sum, record) => sum + toNumber(record.policy_violations_admin, 0), 0);
  const averagePendingApprovalAge = monthRecords.length
    ? Math.round(monthRecords.reduce((sum, record) => sum + toNumber(record.average_pending_approval_age_days, 0), 0) / monthRecords.length)
    : 0;

  const billsFiledCount = monthRecords.filter((record) => record.bills_filed === true).length;
  const receiptsAttachedCount = monthRecords.filter((record) => record.receipts_attached === true).length;
  const pettyCashReconciliationCompletedCount = monthRecords.filter((record) => record.petty_cash_reconciliation_completed === true).length;
  const missingDocumentsCount = monthRecords.reduce((sum, record) => sum + toNumber(record.missing_documents_count, 0), 0);

  const averageAssetHealthScore = monthRecords.length
    ? Math.round(monthRecords.reduce((sum, record) => sum + getAssetHealthScore(record), 0) / monthRecords.length)
    : 0;
  const averageAuditReadinessScore = monthRecords.length
    ? Math.round(monthRecords.reduce((sum, record) => sum + getAuditReadinessScore(record), 0) / monthRecords.length)
    : 0;
  const highRiskRecords = monthRecords.filter((record) => getAuditRiskFilter(record) === "high").length;
  const mediumPolicyRiskRecords = monthRecords.filter((record) => getPolicyRiskLevel(record) === "Medium").length;
  const highPolicyRiskRecords = monthRecords.filter((record) => getPolicyRiskLevel(record) === "High").length;

  const assetMovementByOffice = useMemo(() => {
    return monthRecords.map((record) => ({
      office: record.office_name,
      purchased: toNumber(record.assets_purchased, 0),
      disposed: toNumber(record.assets_disposed, 0),
      issued: toNumber(record.assets_issued_to_staff, 0),
      missingDamaged: toNumber(record.missing_damaged_assets, 0),
    }));
  }, [monthRecords]);

  const complianceByOffice = useMemo(() => {
    return monthRecords.map((record) => ({
      office: record.office_name,
      approved: toNumber(record.admin_expenses_approved, 0),
      rejected: toNumber(record.admin_expenses_rejected, 0),
      pending: toNumber(record.pending_approvals, 0),
      violations: toNumber(record.policy_violations_admin, 0),
    }));
  }, [monthRecords]);

  const healthByOffice = useMemo(() => {
    return monthRecords.map((record) => ({
      office: record.office_name,
      assetHealth: getAssetHealthScore(record),
      auditReadiness: getAuditReadinessScore(record),
    }));
  }, [monthRecords]);

  const documentationStatusData = [
    { name: "Bills Filed", value: billsFiledCount },
    { name: "Bills Missing", value: Math.max(0, monthRecords.length - billsFiledCount) },
    { name: "Receipts Attached", value: receiptsAttachedCount },
    { name: "Receipts Missing", value: Math.max(0, monthRecords.length - receiptsAttachedCount) },
    { name: "Petty Cash Reconciled", value: pettyCashReconciliationCompletedCount },
    { name: "Petty Cash Pending", value: Math.max(0, monthRecords.length - pettyCashReconciliationCompletedCount) },
  ].filter((item) => item.value > 0);

  const monthlyTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const monthData = records.filter((record) => record.record_month === month);
      return {
        month: getMonthLabel(month),
        missingDamaged: monthData.reduce((sum, record) => sum + toNumber(record.missing_damaged_assets, 0), 0),
        missingDocs: monthData.reduce((sum, record) => sum + toNumber(record.missing_documents_count, 0), 0),
        pendingApprovals: monthData.reduce((sum, record) => sum + toNumber(record.pending_approvals, 0), 0),
        policyViolations: monthData.reduce((sum, record) => sum + toNumber(record.policy_violations_admin, 0), 0),
      };
    });
  }, [records, selectedMonth]);

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records
      .filter((record) => record.record_month === selectedMonth)
      .filter((record) => statusFilter === "all" || record.status === statusFilter)
      .filter((record) => auditRiskFilter === "all" || getAuditRiskFilter(record) === auditRiskFilter)
      .filter((record) => inventoryFilter === "all" || (inventoryFilter === "updated" ? record.inventory_register_updated === true : record.inventory_register_updated !== true))
      .filter((record) => {
        if (!query) return true;
        return [record.office_name, record.record_month, record.status, record.notes || ""]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const aRisk = getAuditRiskFilter(a);
        const bRisk = getAuditRiskFilter(b);
        const riskWeight = { high: 0, watch: 1, ready: 2 } satisfies Record<"ready" | "watch" | "high", number>;
        if (riskWeight[aRisk] !== riskWeight[bRisk]) return riskWeight[aRisk] - riskWeight[bRisk];
        return a.office_name.localeCompare(b.office_name);
      });
  }, [records, selectedMonth, statusFilter, auditRiskFilter, inventoryFilter, searchQuery]);

  const insights = useMemo(() => {
    const output = [];

    if (monthRecords.length === 0) {
      output.push("No asset, compliance and documentation records are available for this month. Add monthly office records to activate audit tracking.");
    }

    if (missingDamagedAssets > 0) {
      output.push(`${missingDamagedAssets} missing or damaged asset(s) are recorded. Investigate asset custody and update the inventory register.`);
    }

    if (inventoryNotUpdatedCount > 0) {
      output.push(`${inventoryNotUpdatedCount} office record(s) have inventory register not updated. Complete inventory updates before month closing.`);
    }

    if (pendingApprovals > 0) {
      output.push(`${pendingApprovals} approval(s) are pending with an average age of ${averagePendingApprovalAge} day(s). Prioritise ageing approvals.`);
    }

    if (policyViolationsAdmin > 0) {
      output.push(`${policyViolationsAdmin} admin policy violation(s) recorded. Review policy compliance and approval discipline.`);
    }

    if (missingDocumentsCount > 0) {
      output.push(`${missingDocumentsCount} missing document(s) found. Attach bills, receipts and reconciliation documents before audit review.`);
    }

    if (averageAuditReadinessScore < 70 && monthRecords.length > 0) {
      output.push("Audit readiness is below 70%. Focus on missing documents, pending approvals, inventory updates and petty cash reconciliation.");
    }

    if (highRiskRecords > 0) {
      output.push(`${highRiskRecords} office record(s) are high audit risk. Review them first in the records table.`);
    }

    if (!output.length) {
      output.push("Assets, compliance and documentation look audit-ready this month. Continue monitoring missing documents, pending approvals and damaged assets.");
    }

    return output;
  }, [
    monthRecords.length,
    missingDamagedAssets,
    inventoryNotUpdatedCount,
    pendingApprovals,
    averagePendingApprovalAge,
    policyViolationsAdmin,
    missingDocumentsCount,
    averageAuditReadinessScore,
    highRiskRecords,
  ]);

  function setFormValue<K extends keyof AssetComplianceForm>(key: K, value: AssetComplianceForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm({ ...emptyForm(), record_month: selectedMonth });
    setIsModalOpen(true);
    setMessage(null);
  }

  function openEditModal(record: AssetComplianceRecord) {
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

  function getFormAssetHealthScore() {
    const record = {
      assets_purchased: form.assets_purchased,
      assets_disposed: form.assets_disposed,
      missing_damaged_assets: form.missing_damaged_assets,
      inventory_register_updated: form.inventory_register_updated === "yes",
    } as AssetComplianceRecord;
    return getAssetHealthScore(record);
  }

  function getFormAuditReadinessScore() {
    const record = {
      missing_documents_count: form.missing_documents_count,
      pending_approvals: form.pending_approvals,
      average_pending_approval_age_days: form.average_pending_approval_age_days,
      policy_violations_admin: form.policy_violations_admin,
      bills_filed: form.bills_filed === "yes",
      receipts_attached: form.receipts_attached === "yes",
      petty_cash_reconciliation_completed: form.petty_cash_reconciliation_completed === "yes",
      inventory_register_updated: form.inventory_register_updated === "yes",
    } as AssetComplianceRecord;
    return getAuditReadinessScore(record);
  }

  function buildPayload() {
    return {
      office_name: form.office_name.trim(),
      record_month: form.record_month,
      status: form.status,

      assets_purchased: Number(form.assets_purchased || 0),
      assets_disposed: Number(form.assets_disposed || 0),
      assets_issued_to_staff: Number(form.assets_issued_to_staff || 0),
      missing_damaged_assets: Number(form.missing_damaged_assets || 0),
      inventory_register_updated: form.inventory_register_updated === "yes",

      admin_expenses_approved: Number(form.admin_expenses_approved || 0),
      admin_expenses_rejected: Number(form.admin_expenses_rejected || 0),
      pending_approvals: Number(form.pending_approvals || 0),
      average_pending_approval_age_days: Number(form.average_pending_approval_age_days || 0),
      policy_violations_admin: Number(form.policy_violations_admin || 0),

      bills_filed: form.bills_filed === "yes",
      receipts_attached: form.receipts_attached === "yes",
      petty_cash_reconciliation_completed: form.petty_cash_reconciliation_completed === "yes",
      missing_documents_count: Number(form.missing_documents_count || 0),

      notes: form.notes.trim() || null,
    };
  }

  function validateForm() {
    if (!form.office_name.trim()) return "Please enter office name.";
    if (!form.record_month) return "Please select record month.";

    const numericFields: Array<keyof AssetComplianceForm> = [
      "assets_purchased",
      "assets_disposed",
      "assets_issued_to_staff",
      "missing_damaged_assets",
      "admin_expenses_approved",
      "admin_expenses_rejected",
      "pending_approvals",
      "average_pending_approval_age_days",
      "policy_violations_admin",
      "missing_documents_count",
    ];

    for (const field of numericFields) {
      const value = Number(form[field] || 0);
      if (!Number.isFinite(value) || value < 0) return "All count fields must be zero or greater.";
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
        ? await supabase.from("admin_assets_compliance_records").update(payload).eq("id", editingId).select().single()
        : await supabase.from("admin_assets_compliance_records").insert(payload).select().single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId ? "Assets, compliance and records entry updated successfully." : "Assets, compliance and records entry added successfully.",
      });
      closeModal();
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save assets, compliance and documentation record.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(record: AssetComplianceRecord, status: MonthStatus) {
    try {
      setMessage(null);
      const response = await supabase.from("admin_assets_compliance_records").update({ status }).eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: `${record.office_name} marked as ${status}.` });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not update record status.") });
    }
  }

  async function handleDelete(record: AssetComplianceRecord) {
    const confirmed = window.confirm(`Delete record for ${record.office_name} - ${record.record_month}?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const { error } = await supabase.from("admin_assets_compliance_records").delete().eq("id", record.id);
      if (error) throw new Error(error.message);
      setMessage({ type: "success", text: "Assets, compliance and documentation record deleted." });
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
          <p className="text-sm text-muted-foreground">Loading assets, compliance and records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin - Assets, Compliance & Documentation</h1>
          <p className="text-muted-foreground">
            Track asset control, inventory status, approvals, policy violations, records, missing documents and audit readiness.
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

      <SectionTitle icon={Package} title="8. Asset & Inventory Control" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Assets purchased" value={formatNumber(assetsPurchased)} icon={PackagePlus} subtitle="New assets added this month" color="indigo" />
        <MetricCard title="Assets disposed" value={formatNumber(assetsDisposed)} icon={PackageMinus} subtitle="Disposed/retired assets" color="slate" />
        <MetricCard title="Assets issued to staff" value={formatNumber(assetsIssuedToStaff)} icon={UserCheck} subtitle="Assets assigned to staff" color="emerald" />
        <MetricCard title="Missing / damaged assets" value={formatNumber(missingDamagedAssets)} icon={ShieldAlert} subtitle="Needs investigation" color={missingDamagedAssets > 0 ? "red" : "emerald"} />
        <MetricCard title="Inventory register updated" value={inventoryNotUpdatedCount > 0 ? "No" : "Yes"} icon={PackageCheck} subtitle={`${inventoryRegisterUpdatedCount}/${monthRecords.length || 0} records updated`} color={inventoryNotUpdatedCount > 0 ? "amber" : "emerald"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard title="Asset health score" value={`${averageAssetHealthScore}%`} icon={Gauge} subtitle="Based on missing/damaged assets and inventory status" color={averageAssetHealthScore >= 80 ? "emerald" : averageAssetHealthScore >= 60 ? "amber" : "red"} />
        <MetricCard title="Inventory update status" value={inventoryNotUpdatedCount > 0 ? `${inventoryNotUpdatedCount} pending` : "Updated"} icon={Archive} subtitle="Register update completion" color={inventoryNotUpdatedCount > 0 ? "amber" : "emerald"} />
      </div>

      <SectionTitle icon={ShieldCheck} title="10. Compliance & Approvals" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Admin expenses approved" value={formatNumber(adminExpensesApproved)} icon={BadgeCheck} subtitle="Approved admin expenses" color="emerald" />
        <MetricCard title="Admin expenses rejected" value={formatNumber(adminExpensesRejected)} icon={ShieldAlert} subtitle="Rejected admin expenses" color={adminExpensesRejected > 0 ? "red" : "sky"} />
        <MetricCard title="Pending approvals" value={formatNumber(pendingApprovals)} icon={ClipboardCheck} subtitle={`Avg age: ${averagePendingApprovalAge} day(s)`} color={pendingApprovals > 0 ? "amber" : "emerald"} />
        <MetricCard title="Policy violations" value={formatNumber(policyViolationsAdmin)} icon={ShieldAlert} subtitle="Admin-related policy violations" color={policyViolationsAdmin > 0 ? "red" : "emerald"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard title="Policy violation risk" value={highPolicyRiskRecords > 0 ? "High" : mediumPolicyRiskRecords > 0 ? "Medium" : "Low"} icon={ShieldAlert} subtitle={`${highPolicyRiskRecords} high risk, ${mediumPolicyRiskRecords} medium risk records`} color={highPolicyRiskRecords > 0 ? "red" : mediumPolicyRiskRecords > 0 ? "amber" : "emerald"} />
        <MetricCard title="Audit readiness score" value={`${averageAuditReadinessScore}%`} icon={Gauge} subtitle={`${highRiskRecords} high-risk record(s)`} color={averageAuditReadinessScore >= 85 ? "emerald" : averageAuditReadinessScore >= 65 ? "amber" : "red"} />
      </div>

      <SectionTitle icon={FileText} title="11. Documentation & Records" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Bills filed" value={billsFiledCount === monthRecords.length && monthRecords.length > 0 ? "Yes" : "No"} icon={FileCheck2} subtitle={`${billsFiledCount}/${monthRecords.length || 0} records filed`} color={billsFiledCount === monthRecords.length && monthRecords.length > 0 ? "emerald" : "amber"} />
        <MetricCard title="Receipts attached" value={receiptsAttachedCount === monthRecords.length && monthRecords.length > 0 ? "Yes" : "No"} icon={ReceiptIcon} subtitle={`${receiptsAttachedCount}/${monthRecords.length || 0} records attached`} color={receiptsAttachedCount === monthRecords.length && monthRecords.length > 0 ? "emerald" : "amber"} />
        <MetricCard title="Petty cash reconciliation" value={pettyCashReconciliationCompletedCount === monthRecords.length && monthRecords.length > 0 ? "Yes" : "No"} icon={ClipboardList} subtitle={`${pettyCashReconciliationCompletedCount}/${monthRecords.length || 0} completed`} color={pettyCashReconciliationCompletedCount === monthRecords.length && monthRecords.length > 0 ? "emerald" : "amber"} />
        <MetricCard title="Missing documents" value={formatNumber(missingDocumentsCount)} icon={ShieldAlert} subtitle="Missing documents count" color={missingDocumentsCount > 0 ? "red" : "emerald"} />
      </div>

      <MetricCard title="Missing document alert" value={missingDocumentsCount > 0 ? "Action Required" : "Clear"} icon={AlertCircle} subtitle="Bills, receipts and reconciliation documents" color={missingDocumentsCount > 0 ? "red" : "emerald"} />

      <SectionTitle icon={BarChart3} title="Charts & Audit Analytics" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Asset Movement & Missing/Damaged Assets</CardTitle>
            <p className="text-sm text-muted-foreground">Compare purchased, disposed, issued and missing/damaged assets by office.</p>
          </CardHeader>
          <CardContent className="h-80">
            {assetMovementByOffice.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetMovementByOffice} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="office" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                  <Legend />
                  <Bar dataKey="purchased" name="Purchased" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="disposed" name="Disposed" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="issued" name="Issued" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="missingDamaged" name="Missing/Damaged" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No asset data yet.</div>}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Compliance & Approval Status</CardTitle>
            <p className="text-sm text-muted-foreground">Approved, rejected, pending approvals and policy violations by office.</p>
          </CardHeader>
          <CardContent className="h-80">
            {complianceByOffice.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceByOffice} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="office" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                  <Legend />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="violations" name="Violations" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No compliance data yet.</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Asset Health vs Audit Readiness</CardTitle>
            <p className="text-sm text-muted-foreground">Compare operational asset health and audit readiness score by office.</p>
          </CardHeader>
          <CardContent className="h-80">
            {healthByOffice.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthByOffice} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="office" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: unknown) => [`${Number(value) || 0}%`, ""]} />
                  <Legend />
                  <Line type="monotone" dataKey="assetHealth" name="Asset health" stroke="#4f46e5" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="auditReadiness" name="Audit readiness" stroke="#10b981" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No health data yet.</div>}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Documentation Readiness</CardTitle>
            <p className="text-sm text-muted-foreground">Bills, receipts and petty cash reconciliation status.</p>
          </CardHeader>
          <CardContent className="h-80">
            {documentationStatusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={documentationStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={(props) => {
                    const payload = (props as { payload?: { name?: string; value?: number } }).payload;
                    return `${payload?.name ?? "Status"}: ${payload?.value ?? 0}`;
                  }}>
                    {documentationStatusData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Records"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No documentation data yet.</div>}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="text-base">Compliance Trend</CardTitle>
          <p className="text-sm text-muted-foreground">Track missing/damaged assets, missing documents, pending approvals and policy violations over time.</p>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
              <Legend />
              <Line type="monotone" dataKey="missingDamaged" name="Missing/Damaged Assets" stroke="#ef4444" strokeWidth={2.5} />
              <Line type="monotone" dataKey="missingDocs" name="Missing Documents" stroke="#f59e0b" strokeWidth={2.5} />
              <Line type="monotone" dataKey="pendingApprovals" name="Pending Approvals" stroke="#4f46e5" strokeWidth={2.5} />
              <Line type="monotone" dataKey="policyViolations" name="Policy Violations" stroke="#8b5cf6" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle icon={ShieldAlert} title="Automated Audit & Compliance Insights" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Smart Control Notes</CardTitle>
            <p className="text-sm text-muted-foreground">Automatic alerts for missing documents, pending approvals, policy violations, inventory updates and damaged assets.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
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
              "Asset health score",
              "Missing document alert",
              "Pending approval ageing",
              "Policy violation risk level",
              "Inventory update status",
              "Audit readiness score",
              "Compliance trend chart",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Filter} title="Assets, Compliance & Documentation Records" />
      <Card className="bg-white dark:bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter and manage monthly control records</CardTitle>
              <p className="text-sm text-muted-foreground">Showing {formatNumber(visibleRecords.length)} of {formatNumber(monthRecords.length)} records for {getMonthLabel(selectedMonth)}.</p>
            </div>
            <Button onClick={openAddModal} size="sm"><Plus className="mr-2 h-4 w-4" />Add Record</Button>
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
              <FieldLabel>Audit Risk</FieldLabel>
              <Select value={auditRiskFilter} onValueChange={(value) => setAuditRiskFilter(value as AuditRiskFilter)}>
                <SelectTrigger><SelectValue placeholder="Audit risk" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risks</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="watch">Watch</SelectItem>
                  <SelectItem value="high">High risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Inventory</FieldLabel>
              <Select value={inventoryFilter} onValueChange={(value) => setInventoryFilter(value as InventoryFilter)}>
                <SelectTrigger><SelectValue placeholder="Inventory" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All records</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="not_updated">Not updated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
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
                  <th className="px-4 py-3 font-semibold">Assets</th>
                  <th className="px-4 py-3 font-semibold">Missing/Damaged</th>
                  <th className="px-4 py-3 font-semibold">Inventory</th>
                  <th className="px-4 py-3 font-semibold">Asset Health</th>
                  <th className="px-4 py-3 font-semibold">Approvals</th>
                  <th className="px-4 py-3 font-semibold">Policy Risk</th>
                  <th className="px-4 py-3 font-semibold">Bills</th>
                  <th className="px-4 py-3 font-semibold">Receipts</th>
                  <th className="px-4 py-3 font-semibold">Petty Cash</th>
                  <th className="px-4 py-3 font-semibold">Missing Docs</th>
                  <th className="px-4 py-3 font-semibold">Audit Readiness</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={15} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />Loading records…</td></tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => {
                    const auditScore = getAuditReadinessScore(record);
                    const assetScore = getAssetHealthScore(record);
                    const policyRisk = getPolicyRiskLevel(record);
                    return (
                      <tr key={record.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3 font-semibold">{record.office_name}</td>
                        <td className="px-4 py-3">{record.record_month}</td>
                        <td className="px-4 py-3">Purchased: {toNumber(record.assets_purchased, 0)} • Issued: {toNumber(record.assets_issued_to_staff, 0)} • Disposed: {toNumber(record.assets_disposed, 0)}</td>
                        <td className={toNumber(record.missing_damaged_assets, 0) > 0 ? "px-4 py-3 font-semibold text-red-600" : "px-4 py-3"}>{toNumber(record.missing_damaged_assets, 0)}</td>
                        <td className="px-4 py-3"><YesNoBadge value={record.inventory_register_updated} yesText="Updated" noText="Not Updated" /></td>
                        <td className="px-4 py-3"><RiskBadge score={assetScore} /></td>
                        <td className="px-4 py-3">Approved: {toNumber(record.admin_expenses_approved, 0)} • Rejected: {toNumber(record.admin_expenses_rejected, 0)} • Pending: {toNumber(record.pending_approvals, 0)}</td>
                        <td className={policyRisk === "High" ? "px-4 py-3 font-semibold text-red-600" : policyRisk === "Medium" ? "px-4 py-3 font-semibold text-amber-600" : "px-4 py-3 text-emerald-600"}>{policyRisk}</td>
                        <td className="px-4 py-3"><YesNoBadge value={record.bills_filed} yesText="Filed" noText="Missing" /></td>
                        <td className="px-4 py-3"><YesNoBadge value={record.receipts_attached} yesText="Attached" noText="Missing" /></td>
                        <td className="px-4 py-3"><YesNoBadge value={record.petty_cash_reconciliation_completed} yesText="Done" noText="Pending" /></td>
                        <td className={toNumber(record.missing_documents_count, 0) > 0 ? "px-4 py-3 font-semibold text-red-600" : "px-4 py-3"}>{toNumber(record.missing_documents_count, 0)}</td>
                        <td className="px-4 py-3"><RiskBadge score={auditScore} /></td>
                        <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(record)}><Edit3 className="mr-1 h-3.5 w-3.5" />Edit</Button>
                            {record.status !== "Approved" && <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(record, "Approved")}>Approve</Button>}
                            {record.status === "Open" && <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(record, "Submitted")}>Submit</Button>}
                            <Button type="button" variant="outline" size="icon" onClick={() => handleDelete(record)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={15} className="px-4 py-10 text-center text-muted-foreground">No assets, compliance and documentation records found for this month.</td></tr>
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
                  <CardTitle className="flex items-center gap-2 text-xl"><Plus className="h-5 w-5" />{editingId ? "Edit Assets, Compliance & Records" : "Add Assets, Compliance & Records"}</CardTitle>
                  <p className="mt-1 text-sm text-white/80">Add monthly control data once. Asset health, audit readiness, missing documents and risk alerts update automatically.</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={closeModal} disabled={saving} className="text-white hover:bg-white/20 hover:text-white"><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>

            <CardContent className="max-h-[calc(92vh-96px)] overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-8">
                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Record Details</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Office name *</FieldLabel><input value={form.office_name} onChange={(event) => setFormValue("office_name", event.target.value)} placeholder="Lahore Office" className={inputClassName()} /></div>
                      <div><FieldLabel>Record month *</FieldLabel><input type="month" value={form.record_month} onChange={(event) => setFormValue("record_month", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Status</FieldLabel><Select value={form.status} onValueChange={(value) => setFormValue("status", value as MonthStatus)}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Asset & Inventory Control</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Assets purchased</FieldLabel><input type="number" min="0" value={form.assets_purchased} onChange={(event) => setFormValue("assets_purchased", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Assets disposed</FieldLabel><input type="number" min="0" value={form.assets_disposed} onChange={(event) => setFormValue("assets_disposed", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Assets issued to staff</FieldLabel><input type="number" min="0" value={form.assets_issued_to_staff} onChange={(event) => setFormValue("assets_issued_to_staff", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Missing / damaged assets</FieldLabel><input type="number" min="0" value={form.missing_damaged_assets} onChange={(event) => setFormValue("missing_damaged_assets", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Inventory register updated</FieldLabel><Select value={form.inventory_register_updated} onValueChange={(value) => setFormValue("inventory_register_updated", value as "yes" | "no")}><SelectTrigger><SelectValue placeholder="Inventory updated" /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Asset health auto</FieldLabel><input value={`${getFormAssetHealthScore()}% • ${getRiskLabel(getFormAssetHealthScore())}`} readOnly className={inputClassName("bg-muted/40 font-semibold")} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Compliance & Approvals</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Admin expenses approved</FieldLabel><input type="number" min="0" value={form.admin_expenses_approved} onChange={(event) => setFormValue("admin_expenses_approved", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Admin expenses rejected</FieldLabel><input type="number" min="0" value={form.admin_expenses_rejected} onChange={(event) => setFormValue("admin_expenses_rejected", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Pending approvals</FieldLabel><input type="number" min="0" value={form.pending_approvals} onChange={(event) => setFormValue("pending_approvals", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Average pending approval age</FieldLabel><input type="number" min="0" value={form.average_pending_approval_age_days} onChange={(event) => setFormValue("average_pending_approval_age_days", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Policy violations</FieldLabel><input type="number" min="0" value={form.policy_violations_admin} onChange={(event) => setFormValue("policy_violations_admin", event.target.value)} className={inputClassName()} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Documentation & Records</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Bills filed</FieldLabel><Select value={form.bills_filed} onValueChange={(value) => setFormValue("bills_filed", value as "yes" | "no")}><SelectTrigger><SelectValue placeholder="Bills filed" /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Receipts attached</FieldLabel><Select value={form.receipts_attached} onValueChange={(value) => setFormValue("receipts_attached", value as "yes" | "no")}><SelectTrigger><SelectValue placeholder="Receipts attached" /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Petty cash reconciliation</FieldLabel><Select value={form.petty_cash_reconciliation_completed} onValueChange={(value) => setFormValue("petty_cash_reconciliation_completed", value as "yes" | "no")}><SelectTrigger><SelectValue placeholder="Petty cash reconciliation" /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Missing documents count</FieldLabel><input type="number" min="0" value={form.missing_documents_count} onChange={(event) => setFormValue("missing_documents_count", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Audit readiness auto</FieldLabel><input value={`${getFormAuditReadinessScore()}% • ${getRiskLabel(getFormAuditReadinessScore())}`} readOnly className={inputClassName("bg-muted/40 font-semibold")} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <FieldLabel>Notes</FieldLabel>
                    <textarea value={form.notes} onChange={(event) => setFormValue("notes", event.target.value)} placeholder="Add audit notes, missing document details, asset investigation notes, approval reasons or compliance follow-up actions..." className={textareaClassName()} />
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-5 w-5 text-indigo-600" />Record Preview</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Office</p><p className="font-semibold">{form.office_name || "New office record"}</p></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Month</p><p className="font-semibold">{form.record_month}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold">{form.status}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Asset health</p><p className="font-semibold">{getFormAssetHealthScore()}%</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Audit readiness</p><p className="font-semibold">{getFormAuditReadinessScore()}%</p></div>
                      </div>
                      {(Number(form.missing_documents_count || 0) > 0 || Number(form.policy_violations_admin || 0) > 0 || form.inventory_register_updated === "no") && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                          This record needs audit attention before month closing.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-card">
                    <CardHeader><CardTitle className="text-base">Why this helps future admin work</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-2"><PackageCheck className="mt-0.5 h-4 w-4 text-indigo-600" />Asset health shows missing, damaged and inventory-update risk.</div>
                      <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-600" />Approval tracking helps owners control admin expenses.</div>
                      <div className="flex gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 text-indigo-600" />Policy violation risk highlights weak process areas.</div>
                      <div className="flex gap-2"><FileText className="mt-0.5 h-4 w-4 text-indigo-600" />Documentation tracking improves audit readiness.</div>
                      <div className="flex gap-2"><Gauge className="mt-0.5 h-4 w-4 text-indigo-600" />Audit readiness score helps management see control quality instantly.</div>
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

function ReceiptIcon(props: React.ComponentProps<typeof FileText>) {
  return <FileText {...props} />;
}
