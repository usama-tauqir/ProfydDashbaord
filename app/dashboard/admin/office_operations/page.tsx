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
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Eye,
  Filter,
  Gauge,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
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

type OfficeStatus = "Active" | "Inactive" | "Under Maintenance";
type OfficeType = "Head Office" | "Branch" | "Training Center" | "Support Office" | "Remote Hub";
type CleaningStatus = "Excellent" | "Good" | "Needs Attention" | "Critical";
type SecurityCoverage = "24/7" | "Day Shift" | "Night Shift" | "Partial" | "None";

type OfficeRecord = {
  id: string;
  office_name: string;
  office_type: OfficeType;
  city: string;
  address: string | null;
  status: OfficeStatus;
  working_days_per_week: number | string | null;
  working_hours: string | null;
  office_boys_count: number | string | null;
  helpers_count: number | string | null;
  guards_count: number | string | null;
  cleaners_count: number | string | null;
  admin_staff_count: number | string | null;
  attendance_issues_count: number | string | null;
  open_facility_issues_count: number | string | null;
  security_incidents_count: number | string | null;
  cleaning_status: CleaningStatus;
  security_coverage: SecurityCoverage;
  compliance_score: number | string | null;
  last_inspection_date: string | null;
  next_inspection_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type OfficeForm = {
  office_name: string;
  office_type: OfficeType;
  city: string;
  address: string;
  status: OfficeStatus;
  working_days_per_week: string;
  working_hours: string;
  office_boys_count: string;
  helpers_count: string;
  guards_count: string;
  cleaners_count: string;
  admin_staff_count: string;
  attendance_issues_count: string;
  open_facility_issues_count: string;
  security_incidents_count: string;
  cleaning_status: CleaningStatus;
  security_coverage: SecurityCoverage;
  compliance_score: string;
  last_inspection_date: string;
  next_inspection_date: string;
  notes: string;
};

type StatusFilter = "all" | OfficeStatus;
type TypeFilter = "all" | OfficeType;
type CleaningFilter = "all" | CleaningStatus;

const OFFICE_STATUSES: OfficeStatus[] = ["Active", "Inactive", "Under Maintenance"];
const OFFICE_TYPES: OfficeType[] = ["Head Office", "Branch", "Training Center", "Support Office", "Remote Hub"];
const CLEANING_STATUSES: CleaningStatus[] = ["Excellent", "Good", "Needs Attention", "Critical"];
const SECURITY_COVERAGES: SecurityCoverage[] = ["24/7", "Day Shift", "Night Shift", "Partial", "None"];
const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#64748b"];

function emptyForm(): OfficeForm {
  return {
    office_name: "",
    office_type: "Branch",
    city: "",
    address: "",
    status: "Active",
    working_days_per_week: "6",
    working_hours: "09:00 AM - 06:00 PM",
    office_boys_count: "0",
    helpers_count: "0",
    guards_count: "0",
    cleaners_count: "0",
    admin_staff_count: "0",
    attendance_issues_count: "0",
    open_facility_issues_count: "0",
    security_incidents_count: "0",
    cleaning_status: "Good",
    security_coverage: "Day Shift",
    compliance_score: "90",
    last_inspection_date: "",
    next_inspection_date: "",
    notes: "",
  };
}

function officeToForm(office: OfficeRecord): OfficeForm {
  return {
    office_name: office.office_name || "",
    office_type: office.office_type || "Branch",
    city: office.city || "",
    address: office.address || "",
    status: office.status || "Active",
    working_days_per_week: String(toNumber(office.working_days_per_week, 6)),
    working_hours: office.working_hours || "09:00 AM - 06:00 PM",
    office_boys_count: String(toNumber(office.office_boys_count, 0)),
    helpers_count: String(toNumber(office.helpers_count, 0)),
    guards_count: String(toNumber(office.guards_count, 0)),
    cleaners_count: String(toNumber(office.cleaners_count, 0)),
    admin_staff_count: String(toNumber(office.admin_staff_count, 0)),
    attendance_issues_count: String(toNumber(office.attendance_issues_count, 0)),
    open_facility_issues_count: String(toNumber(office.open_facility_issues_count, 0)),
    security_incidents_count: String(toNumber(office.security_incidents_count, 0)),
    cleaning_status: office.cleaning_status || "Good",
    security_coverage: office.security_coverage || "Day Shift",
    compliance_score: String(toNumber(office.compliance_score, 90)),
    last_inspection_date: office.last_inspection_date ? office.last_inspection_date.slice(0, 10) : "",
    next_inspection_date: office.next_inspection_date ? office.next_inspection_date.slice(0, 10) : "",
    notes: office.notes || "",
  };
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const numberValue = Number(value ?? fallback);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getDaysUntil(value: string | null | undefined) {
  if (!value) return null;
  const today = new Date();
  const target = new Date(value);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getStaffHeadcount(office: OfficeRecord) {
  return (
    toNumber(office.office_boys_count, 0) +
    toNumber(office.helpers_count, 0) +
    toNumber(office.guards_count, 0) +
    toNumber(office.cleaners_count, 0) +
    toNumber(office.admin_staff_count, 0)
  );
}

function getOperationalHealthScore(office: OfficeRecord) {
  const compliance = Math.min(100, Math.max(0, toNumber(office.compliance_score, 90)));
  const attendancePenalty = toNumber(office.attendance_issues_count, 0) * 4;
  const facilityPenalty = toNumber(office.open_facility_issues_count, 0) * 3;
  const securityPenalty = toNumber(office.security_incidents_count, 0) * 8;
  const cleaningPenalty = office.cleaning_status === "Critical" ? 20 : office.cleaning_status === "Needs Attention" ? 10 : 0;
  const statusPenalty = office.status === "Inactive" ? 35 : office.status === "Under Maintenance" ? 15 : 0;

  return Math.max(0, Math.round(compliance - attendancePenalty - facilityPenalty - securityPenalty - cleaningPenalty - statusPenalty));
}

function getHealthLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Attention";
  return "Critical";
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

function StatusBadge({ status }: { status: OfficeStatus }) {
  const config = {
    Active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Inactive: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    "Under Maintenance": "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  } satisfies Record<OfficeStatus, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[status]}`}>{status}</span>;
}

function CleaningBadge({ status }: { status: CleaningStatus }) {
  const config = {
    Excellent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Good: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    "Needs Attention": "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    Critical: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  } satisfies Record<CleaningStatus, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[status]}`}>{status}</span>;
}

function HealthBadge({ score }: { score: number }) {
  const label = getHealthLabel(score);
  const config = {
    Excellent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Good: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    "Needs Attention": "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    Critical: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
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
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
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

export default function AdminOfficeOperationsPage() {
  const [offices, setOffices] = useState<OfficeRecord[]>([]);
  const [form, setForm] = useState<OfficeForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [cleaningFilter, setCleaningFilter] = useState<CleaningFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOffices = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("admin_office_operations")
        .select("*")
        .order("status", { ascending: true })
        .order("office_name", { ascending: true });

      if (response.error) throw new Error(response.error.message);

      setOffices((response.data || []) as OfficeRecord[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Could not load office operations. Please check the admin_office_operations Supabase table."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffices();

    const channel = supabase
      .channel("admin-office-operations-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_office_operations" },
        () => fetchOffices()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOffices]);

  const activeOffices = useMemo(() => offices.filter((office) => office.status === "Active"), [offices]);
  const activeOfficeLocations = activeOffices.length;
  const averageWorkingDays = activeOffices.length
    ? Math.round((activeOffices.reduce((sum, office) => sum + toNumber(office.working_days_per_week, 0), 0) / activeOffices.length) * 10) / 10
    : 0;
  const officeStaffHeadcount = activeOffices.reduce((sum, office) => sum + getStaffHeadcount(office), 0);
  const officeAttendanceIssues = activeOffices.reduce((sum, office) => sum + toNumber(office.attendance_issues_count, 0), 0);
  const openFacilityIssues = activeOffices.reduce((sum, office) => sum + toNumber(office.open_facility_issues_count, 0), 0);
  const securityIncidents = activeOffices.reduce((sum, office) => sum + toNumber(office.security_incidents_count, 0), 0);
  const averageHealthScore = activeOffices.length
    ? Math.round(activeOffices.reduce((sum, office) => sum + getOperationalHealthScore(office), 0) / activeOffices.length)
    : 0;
  const inspectionsDue = activeOffices.filter((office) => {
    const days = getDaysUntil(office.next_inspection_date);
    return days !== null && days <= 7;
  }).length;

  const staffByOffice = useMemo(() => {
    return activeOffices.map((office) => ({
      office: office.office_name,
      staff: getStaffHeadcount(office),
      officeBoys: toNumber(office.office_boys_count, 0),
      helpers: toNumber(office.helpers_count, 0),
      guards: toNumber(office.guards_count, 0),
      cleaners: toNumber(office.cleaners_count, 0),
      admin: toNumber(office.admin_staff_count, 0),
    }));
  }, [activeOffices]);

  const issuesByOffice = useMemo(() => {
    return activeOffices.map((office) => ({
      office: office.office_name,
      attendance: toNumber(office.attendance_issues_count, 0),
      facility: toNumber(office.open_facility_issues_count, 0),
      security: toNumber(office.security_incidents_count, 0),
    }));
  }, [activeOffices]);

  const cityDistribution = useMemo(() => {
    const map = new Map<string, number>();
    activeOffices.forEach((office) => {
      map.set(office.city, (map.get(office.city) || 0) + 1);
    });
    return Array.from(map.entries()).map(([city, officesCount]) => ({ city, offices: officesCount }));
  }, [activeOffices]);

  const healthByOffice = useMemo(() => {
    return activeOffices.map((office) => ({
      office: office.office_name,
      health: getOperationalHealthScore(office),
      compliance: toNumber(office.compliance_score, 0),
    }));
  }, [activeOffices]);

  const visibleOffices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return offices
      .filter((office) => statusFilter === "all" || office.status === statusFilter)
      .filter((office) => typeFilter === "all" || office.office_type === typeFilter)
      .filter((office) => cleaningFilter === "all" || office.cleaning_status === cleaningFilter)
      .filter((office) => {
        if (!query) return true;
        return [
          office.office_name,
          office.office_type,
          office.city,
          office.address || "",
          office.status,
          office.cleaning_status,
          office.security_coverage,
          office.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const statusWeight = { Active: 0, "Under Maintenance": 1, Inactive: 2 } satisfies Record<OfficeStatus, number>;
        if (statusWeight[a.status] !== statusWeight[b.status]) return statusWeight[a.status] - statusWeight[b.status];
        return a.office_name.localeCompare(b.office_name);
      });
  }, [offices, statusFilter, typeFilter, cleaningFilter, searchQuery]);

  const operationInsights = useMemo(() => {
    const insights = [];
    const highestAttendance = [...activeOffices].sort((a, b) => toNumber(b.attendance_issues_count, 0) - toNumber(a.attendance_issues_count, 0))[0];
    const lowestHealth = [...activeOffices].sort((a, b) => getOperationalHealthScore(a) - getOperationalHealthScore(b))[0];

    if (activeOfficeLocations === 0) {
      insights.push("No active office locations are currently recorded. Add office records to activate operational tracking.");
    }

    if (officeAttendanceIssues > 0 && highestAttendance) {
      insights.push(`${highestAttendance.office_name} has the highest attendance issues. Review punctuality, leaves or shift coverage.`);
    }

    if (openFacilityIssues > 0) {
      insights.push(`${openFacilityIssues} open facility issue(s) are recorded across active offices. Prioritise safety, comfort and daily operations issues.`);
    }

    if (securityIncidents > 0) {
      insights.push(`${securityIncidents} security incident(s) are recorded. Review guard coverage and visitor control immediately.`);
    }

    if (lowestHealth && getOperationalHealthScore(lowestHealth) < 70) {
      insights.push(`${lowestHealth.office_name} has a low operational health score. Review cleaning, attendance, facility issues and security coverage.`);
    }

    if (inspectionsDue > 0) {
      insights.push(`${inspectionsDue} office inspection(s) are due within 7 days. Schedule admin follow-up before they become overdue.`);
    }

    if (averageWorkingDays < 5 && activeOfficeLocations > 0) {
      insights.push("Average working days are below 5. Confirm whether office availability matches company operations.");
    }

    if (!insights.length) {
      insights.push("Office operations look healthy. Continue monitoring attendance issues, facility issues, security coverage, cleaning and inspection dates.");
    }

    return insights;
  }, [activeOffices, activeOfficeLocations, officeAttendanceIssues, openFacilityIssues, securityIncidents, inspectionsDue, averageWorkingDays]);

  function setFormValue<K extends keyof OfficeForm>(key: K, value: OfficeForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
    setMessage(null);
  }

  function openEditModal(office: OfficeRecord) {
    setEditingId(office.id);
    setForm(officeToForm(office));
    setIsModalOpen(true);
    setMessage(null);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  function buildPayload() {
    return {
      office_name: form.office_name.trim(),
      office_type: form.office_type,
      city: form.city.trim(),
      address: form.address.trim() || null,
      status: form.status,
      working_days_per_week: Number(form.working_days_per_week || 0),
      working_hours: form.working_hours.trim() || null,
      office_boys_count: Number(form.office_boys_count || 0),
      helpers_count: Number(form.helpers_count || 0),
      guards_count: Number(form.guards_count || 0),
      cleaners_count: Number(form.cleaners_count || 0),
      admin_staff_count: Number(form.admin_staff_count || 0),
      attendance_issues_count: Number(form.attendance_issues_count || 0),
      open_facility_issues_count: Number(form.open_facility_issues_count || 0),
      security_incidents_count: Number(form.security_incidents_count || 0),
      cleaning_status: form.cleaning_status,
      security_coverage: form.security_coverage,
      compliance_score: Number(form.compliance_score || 0),
      last_inspection_date: form.last_inspection_date || null,
      next_inspection_date: form.next_inspection_date || null,
      notes: form.notes.trim() || null,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.office_name.trim() || !form.city.trim()) {
      setMessage({ type: "error", text: "Please enter office name and city." });
      return;
    }

    const workingDays = Number(form.working_days_per_week || 0);
    const compliance = Number(form.compliance_score || 0);

    if (!Number.isFinite(workingDays) || workingDays < 0 || workingDays > 7) {
      setMessage({ type: "error", text: "Office working days must be between 0 and 7." });
      return;
    }

    if (!Number.isFinite(compliance) || compliance < 0 || compliance > 100) {
      setMessage({ type: "error", text: "Compliance score must be between 0 and 100." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = buildPayload();
      const response = editingId
        ? await supabase.from("admin_office_operations").update(payload).eq("id", editingId).select().single()
        : await supabase.from("admin_office_operations").insert(payload).select().single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId ? "Office operation record updated successfully." : "Office operation record added successfully.",
      });
      closeModal();
      await fetchOffices();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save office operation record.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(office: OfficeRecord, status: OfficeStatus) {
    try {
      setMessage(null);
      const response = await supabase.from("admin_office_operations").update({ status }).eq("id", office.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: `${office.office_name} marked as ${status}.` });
      await fetchOffices();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not update office status.") });
    }
  }

  async function handleDelete(office: OfficeRecord) {
    const confirmed = window.confirm(`Delete office record: ${office.office_name}?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const { error } = await supabase.from("admin_office_operations").delete().eq("id", office.id);
      if (error) throw new Error(error.message);
      setMessage({ type: "success", text: "Office record deleted." });
      await fetchOffices();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not delete this office record.") });
    }
  }

  if (loading && offices.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading office operations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin - Office Operations</h1>
          <p className="text-muted-foreground">
            Daily office running status: active locations, working days, support staff, attendance issues, facility issues, security, cleaning and inspections.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-xs text-muted-foreground">Last updated: {lastUpdated}</span>
          <Button onClick={fetchOffices} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openAddModal} size="sm" className="shadow-lg shadow-indigo-500/20">
            <Plus className="mr-2 h-4 w-4" />
            Add Office
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

      <SectionTitle icon={Building2} title="1. Office Operations" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Office locations active" value={formatNumber(activeOfficeLocations)} icon={MapPin} subtitle="Currently active company offices" color="indigo" />
        <MetricCard title="Office working days" value={`${averageWorkingDays}/week`} icon={CalendarDays} subtitle="Average active office working days" color="emerald" />
        <MetricCard title="Office staff headcount" value={formatNumber(officeStaffHeadcount)} icon={Users} subtitle="Office boys, helpers, guards, cleaners, admin" color="violet" />
        <MetricCard title="Office attendance issues" value={formatNumber(officeAttendanceIssues)} icon={UserCheck} subtitle="Current attendance issue count" color={officeAttendanceIssues > 0 ? "red" : "sky"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Operational health" value={`${averageHealthScore}%`} icon={Gauge} subtitle="Daily office running health" color={averageHealthScore >= 75 ? "emerald" : "amber"} />
        <MetricCard title="Open facility issues" value={formatNumber(openFacilityIssues)} icon={Wrench} subtitle="Facility issues logged, not cost" color={openFacilityIssues > 0 ? "amber" : "emerald"} />
        <MetricCard title="Security incidents" value={formatNumber(securityIncidents)} icon={ShieldCheck} subtitle="Incidents needing admin review" color={securityIncidents > 0 ? "red" : "emerald"} />
        <MetricCard title="Inspections due" value={formatNumber(inspectionsDue)} icon={ClipboardCheck} subtitle="Due within the next 7 days" color={inspectionsDue > 0 ? "amber" : "sky"} />
      </div>

      <SectionTitle icon={BarChart3} title="Charts & Operational Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Office Staff Headcount by Location</CardTitle>
            <p className="text-sm text-muted-foreground">Shows support staff coverage across office locations.</p>
          </CardHeader>
          <CardContent className="h-80">
            {staffByOffice.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffByOffice} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="office" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                  <Legend />
                  <Bar dataKey="staff" name="Total staff" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="officeBoys" name="Office boys" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="guards" name="Guards" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cleaners" name="Cleaners" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No active office data yet.</div>}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Office Issues by Location</CardTitle>
            <p className="text-sm text-muted-foreground">Compare attendance, open facility and security issue counts.</p>
          </CardHeader>
          <CardContent className="h-80">
            {issuesByOffice.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={issuesByOffice} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="office" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Issues"]} />
                  <Legend />
                  <Bar dataKey="attendance" name="Attendance" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="facility" name="Facility" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="security" name="Security" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No issue data yet.</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Operational Health Score</CardTitle>
            <p className="text-sm text-muted-foreground">Calculated from compliance, attendance, facility issues, security and cleaning status.</p>
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
                  <Line type="monotone" dataKey="health" name="Health score" stroke="#4f46e5" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="compliance" name="Compliance" stroke="#10b981" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No health data yet.</div>}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Active Offices by City</CardTitle>
            <p className="text-sm text-muted-foreground">Location distribution for admin operations planning.</p>
          </CardHeader>
          <CardContent className="h-80">
            {cityDistribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={cityDistribution} dataKey="offices" nameKey="city" cx="50%" cy="50%" outerRadius={95} label={(props) => {
                    const payload = (props as { payload?: { city?: string; offices?: number } }).payload;
                    return `${payload?.city ?? "City"}: ${payload?.offices ?? 0}`;
                  }}>
                    {cityDistribution.map((entry, index) => <Cell key={entry.city} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Offices"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No city data yet.</div>}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={TrendingUp} title="Automated Office Insights" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Smart Office Operation Notes</CardTitle>
            <p className="text-sm text-muted-foreground">Automatic recommendations based on daily office status, staffing, attendance, security, cleaning and inspections.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operationInsights.map((insight, index) => (
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
              "Office active status tracked",
              "Working days automated",
              "Support staff headcount stored",
              "Attendance issues counted",
              "Open facility issues monitored",
              "Security coverage visible",
              "Inspection dates visible",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Filter} title="Office Operation Records" />

      <Card className="bg-white dark:bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter and manage offices</CardTitle>
              <p className="text-sm text-muted-foreground">Showing {formatNumber(visibleOffices.length)} of {formatNumber(offices.length)} office records.</p>
            </div>
            <Button onClick={openAddModal} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Office
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <FieldLabel>Status</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {OFFICE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Office Type</FieldLabel>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TypeFilter)}>
                <SelectTrigger><SelectValue placeholder="Office type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {OFFICE_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Cleaning</FieldLabel>
              <Select value={cleaningFilter} onValueChange={(value) => setCleaningFilter(value as CleaningFilter)}>
                <SelectTrigger><SelectValue placeholder="Cleaning" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cleaning statuses</SelectItem>
                  {CLEANING_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search office, city..." className={inputClassName("pl-9")} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1450px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Office</th>
                  <th className="px-4 py-3 font-semibold">City</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Working Days</th>
                  <th className="px-4 py-3 font-semibold">Staff</th>
                  <th className="px-4 py-3 font-semibold">Attendance Issues</th>
                  <th className="px-4 py-3 font-semibold">Facility Issues</th>
                  <th className="px-4 py-3 font-semibold">Security</th>
                  <th className="px-4 py-3 font-semibold">Cleaning</th>
                  <th className="px-4 py-3 font-semibold">Health</th>
                  <th className="px-4 py-3 font-semibold">Next Inspection</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading office records…
                    </td>
                  </tr>
                ) : visibleOffices.length ? (
                  visibleOffices.map((office) => {
                    const inspectionDays = getDaysUntil(office.next_inspection_date);
                    const inspectionDue = inspectionDays !== null && inspectionDays <= 7;
                    return (
                      <tr key={office.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold">{office.office_name}</p>
                          <p className="text-xs text-muted-foreground">{office.office_type} • {office.address || "No address"}</p>
                        </td>
                        <td className="px-4 py-3">{office.city}</td>
                        <td className="px-4 py-3"><StatusBadge status={office.status} /></td>
                        <td className="px-4 py-3">{toNumber(office.working_days_per_week, 0)}/week</td>
                        <td className="px-4 py-3">{getStaffHeadcount(office)}</td>
                        <td className={toNumber(office.attendance_issues_count, 0) > 0 ? "px-4 py-3 font-semibold text-red-600" : "px-4 py-3"}>{toNumber(office.attendance_issues_count, 0)}</td>
                        <td className={toNumber(office.open_facility_issues_count, 0) > 0 ? "px-4 py-3 font-semibold text-amber-600" : "px-4 py-3"}>{toNumber(office.open_facility_issues_count, 0)}</td>
                        <td className="px-4 py-3">{office.security_coverage} • {toNumber(office.security_incidents_count, 0)} incident(s)</td>
                        <td className="px-4 py-3"><CleaningBadge status={office.cleaning_status} /></td>
                        <td className="px-4 py-3"><HealthBadge score={getOperationalHealthScore(office)} /></td>
                        <td className={inspectionDue ? "px-4 py-3 font-semibold text-amber-600" : "px-4 py-3"}>{formatDate(office.next_inspection_date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(office)}>
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {office.status !== "Active" && <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(office, "Active")}>Activate</Button>}
                            {office.status === "Active" && <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(office, "Under Maintenance")}>Maintain</Button>}
                            <Button type="button" variant="outline" size="icon" onClick={() => handleDelete(office)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">No office records found for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-6xl overflow-hidden bg-white shadow-2xl dark:bg-card">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Plus className="h-5 w-5" />
                    {editingId ? "Edit Office Operation" : "Add Office Operation"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-white/80">
                    {editingId
                      ? "Update daily office running status, staff coverage, attendance issues, security, cleaning and inspections."
                      : "Add one office record. The dashboard will automatically calculate active locations, working days, headcount, issues and health."}
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
                      <h3 className="font-semibold">Office Details</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Office name *</FieldLabel>
                        <input value={form.office_name} onChange={(event) => setFormValue("office_name", event.target.value)} placeholder="Main Campus / Lahore Branch" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Office type</FieldLabel>
                        <Select value={form.office_type} onValueChange={(value) => setFormValue("office_type", value as OfficeType)}>
                          <SelectTrigger><SelectValue placeholder="Office type" /></SelectTrigger>
                          <SelectContent>{OFFICE_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>City *</FieldLabel>
                        <input value={form.city} onChange={(event) => setFormValue("city", event.target.value)} placeholder="Lahore / Karachi / Islamabad" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Status</FieldLabel>
                        <Select value={form.status} onValueChange={(value) => setFormValue("status", value as OfficeStatus)}>
                          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>{OFFICE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Address</FieldLabel>
                        <input value={form.address} onChange={(event) => setFormValue("address", event.target.value)} placeholder="Office address" className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Working Days & Staff Headcount</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Working days per week *</FieldLabel>
                        <input type="number" min="0" max="7" value={form.working_days_per_week} onChange={(event) => setFormValue("working_days_per_week", event.target.value)} className={inputClassName()} />
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Working hours</FieldLabel>
                        <input value={form.working_hours} onChange={(event) => setFormValue("working_hours", event.target.value)} placeholder="09:00 AM - 06:00 PM" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Office boys</FieldLabel>
                        <input type="number" min="0" value={form.office_boys_count} onChange={(event) => setFormValue("office_boys_count", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Helpers</FieldLabel>
                        <input type="number" min="0" value={form.helpers_count} onChange={(event) => setFormValue("helpers_count", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Guards</FieldLabel>
                        <input type="number" min="0" value={form.guards_count} onChange={(event) => setFormValue("guards_count", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Cleaners</FieldLabel>
                        <input type="number" min="0" value={form.cleaners_count} onChange={(event) => setFormValue("cleaners_count", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Admin staff</FieldLabel>
                        <input type="number" min="0" value={form.admin_staff_count} onChange={(event) => setFormValue("admin_staff_count", event.target.value)} className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Daily Issues, Security & Inspection</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Attendance issues</FieldLabel>
                        <input type="number" min="0" value={form.attendance_issues_count} onChange={(event) => setFormValue("attendance_issues_count", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Open facility issues</FieldLabel>
                        <input type="number" min="0" value={form.open_facility_issues_count} onChange={(event) => setFormValue("open_facility_issues_count", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Security incidents</FieldLabel>
                        <input type="number" min="0" value={form.security_incidents_count} onChange={(event) => setFormValue("security_incidents_count", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Cleaning status</FieldLabel>
                        <Select value={form.cleaning_status} onValueChange={(value) => setFormValue("cleaning_status", value as CleaningStatus)}>
                          <SelectTrigger><SelectValue placeholder="Cleaning status" /></SelectTrigger>
                          <SelectContent>{CLEANING_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Security coverage</FieldLabel>
                        <Select value={form.security_coverage} onValueChange={(value) => setFormValue("security_coverage", value as SecurityCoverage)}>
                          <SelectTrigger><SelectValue placeholder="Security coverage" /></SelectTrigger>
                          <SelectContent>{SECURITY_COVERAGES.map((coverage) => <SelectItem key={coverage} value={coverage}>{coverage}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Compliance score</FieldLabel>
                        <input type="number" min="0" max="100" value={form.compliance_score} onChange={(event) => setFormValue("compliance_score", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Last inspection</FieldLabel>
                        <input type="date" value={form.last_inspection_date} onChange={(event) => setFormValue("last_inspection_date", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Next inspection</FieldLabel>
                        <input type="date" value={form.next_inspection_date} onChange={(event) => setFormValue("next_inspection_date", event.target.value)} className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Admin Notes</h3>
                    </div>
                    <FieldLabel>Notes</FieldLabel>
                    <textarea value={form.notes} onChange={(event) => setFormValue("notes", event.target.value)} placeholder="Add daily operation notes, attendance reasons, facility issue context, cleaning/security notes or next actions..." className={textareaClassName()} />
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><Eye className="h-5 w-5 text-indigo-600" />Office Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                        <p className="text-xs text-muted-foreground">Office</p>
                        <p className="font-semibold">{form.office_name || "New office"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">City</p><p className="font-semibold">{form.city || "—"}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold">{form.status}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Staff</p><p className="font-semibold">{Number(form.office_boys_count || 0) + Number(form.helpers_count || 0) + Number(form.guards_count || 0) + Number(form.cleaners_count || 0) + Number(form.admin_staff_count || 0)}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Issues</p><p className="font-semibold">{Number(form.attendance_issues_count || 0) + Number(form.open_facility_issues_count || 0) + Number(form.security_incidents_count || 0)}</p></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-card">
                    <CardHeader><CardTitle className="text-base">Why this helps future operations</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-2"><Building2 className="mt-0.5 h-4 w-4 text-indigo-600" />Owners can see active office locations instantly.</div>
                      <div className="flex gap-2"><Users className="mt-0.5 h-4 w-4 text-indigo-600" />Staff coverage is clear for office boys, helpers, guards and cleaners.</div>
                      <div className="flex gap-2"><UserCheck className="mt-0.5 h-4 w-4 text-indigo-600" />Attendance issue count shows daily operational discipline.</div>
                      <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-600" />Security and inspection tracking reduces operational risk.</div>
                      <div className="flex gap-2"><Wrench className="mt-0.5 h-4 w-4 text-indigo-600" />Open facility issues help admin prioritise work quickly without mixing finance data.</div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={saving} className="w-full sm:w-auto">Cancel</Button>
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      {editingId ? "Update Office" : "Save Office"}
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
