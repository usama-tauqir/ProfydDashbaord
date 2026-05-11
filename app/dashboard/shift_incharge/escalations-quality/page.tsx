// app/dashboard/shift-incharge/escalations-quality/page.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
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
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit3,
  FileText,
  Filter,
  Gauge,
  GitBranch,
  Loader2,
  MessageSquareWarning,
  Network,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
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

type PageTab = "objections" | "escalations" | "quality_risks" | "department_followups";
type IssueType = "Objection" | "Escalation" | "Quality Risk" | "Department Follow-up";
type IssueSource = "Student" | "Parent" | "Tutor" | "Internal" | "Coordinator" | "QA Signal" | "Department";
type Department = "Shift" | "HR" | "T&D" | "Admin" | "Finance" | "Marketing" | "Management";
type Priority = "Low" | "Medium" | "High" | "Critical";
type IssueStatus = "Open" | "In Progress" | "Resolved" | "Escalated" | "Pending Department" | "Closed";
type PriorityFilter = "all" | Priority;
type StatusFilter = "all" | IssueStatus;
type DepartmentFilter = "all" | Department;

type EscalationQualityRecord = {
  id: string;
  issue_id: string;
  record_month: string;
  issue_type: IssueType;
  source: IssueSource;
  person_name: string;
  department: Department;
  priority: Priority;
  root_cause: string;
  status: IssueStatus;
  owner: string;
  due_date: string | null;
  resolution: string | null;
  preventive_action_taken: boolean | null;
  created_at: string;
  updated_at: string | null;
};

type EscalationQualityForm = {
  issue_id: string;
  record_month: string;
  issue_type: IssueType;
  source: IssueSource;
  person_name: string;
  department: Department;
  priority: Priority;
  root_cause: string;
  status: IssueStatus;
  owner: string;
  due_date: string;
  resolution: string;
  preventive_action_taken: "yes" | "no";
};

const ISSUE_TYPES: IssueType[] = ["Objection", "Escalation", "Quality Risk", "Department Follow-up"];
const SOURCES: IssueSource[] = ["Student", "Parent", "Tutor", "Internal", "Coordinator", "QA Signal", "Department"];
const DEPARTMENTS: Department[] = ["Shift", "HR", "T&D", "Admin", "Finance", "Marketing", "Management"];
const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Critical"];
const STATUSES: IssueStatus[] = ["Open", "In Progress", "Resolved", "Escalated", "Pending Department", "Closed"];
const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"];

const TAB_CONFIG: Array<{ key: PageTab; label: string; description: string; icon: ElementType }> = [
  {
    key: "objections",
    label: "Objections",
    description: "Student, parent, tutor and internal objections handled at shift level.",
    icon: MessageSquareWarning,
  },
  {
    key: "escalations",
    label: "Escalations",
    description: "Items that need HR, T&D, Admin, Finance, Marketing or Management support.",
    icon: Send,
  },
  {
    key: "quality_risks",
    label: "Quality Risks",
    description: "Early churn, dissatisfaction and stability signals requiring preventive action.",
    icon: ShieldAlert,
  },
  {
    key: "department_followups",
    label: "Department Follow-ups",
    description: "Cross-department actions, owners, due dates and pending closures.",
    icon: Network,
  },
];

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

function generateIssueId() {
  return `SI-${Date.now().toString().slice(-6)}`;
}

function emptyForm(): EscalationQualityForm {
  return {
    issue_id: generateIssueId(),
    record_month: getCurrentMonth(),
    issue_type: "Objection",
    source: "Student",
    person_name: "",
    department: "Shift",
    priority: "Medium",
    root_cause: "",
    status: "Open",
    owner: "",
    due_date: "",
    resolution: "",
    preventive_action_taken: "no",
  };
}

function recordToForm(record: EscalationQualityRecord): EscalationQualityForm {
  return {
    issue_id: record.issue_id || generateIssueId(),
    record_month: record.record_month || getCurrentMonth(),
    issue_type: record.issue_type || "Objection",
    source: record.source || "Student",
    person_name: record.person_name || "",
    department: record.department || "Shift",
    priority: record.priority || "Medium",
    root_cause: record.root_cause || "",
    status: record.status || "Open",
    owner: record.owner || "",
    due_date: record.due_date || "",
    resolution: record.resolution || "",
    preventive_action_taken: record.preventive_action_taken ? "yes" : "no",
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
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

function StatusBadge({ status }: { status: IssueStatus }) {
  const config = {
    Open: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    "In Progress": "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
    Resolved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Escalated: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    "Pending Department": "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    Closed: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  } satisfies Record<IssueStatus, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[status]}`}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const config = {
    Low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    High: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
    Critical: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  } satisfies Record<Priority, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[priority]}`}>{priority}</span>;
}

function TypeBadge({ type }: { type: IssueType }) {
  const config = {
    Objection: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
    Escalation: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    "Quality Risk": "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
    "Department Follow-up": "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
  } satisfies Record<IssueType, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[type]}`}>{type}</span>;
}

function YesNoBadge({ value }: { value: boolean | null | undefined }) {
  const active = value === true;
  return (
    <span
      className={`rounded-md px-2 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
      }`}
    >
      {active ? "Yes" : "No"}
    </span>
  );
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
    indigo: {
      border: "border-indigo-200 dark:border-indigo-900",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      icon: "text-indigo-600 dark:text-indigo-300",
      accent: "bg-indigo-600",
    },
    emerald: {
      border: "border-emerald-200 dark:border-emerald-900",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      icon: "text-emerald-600 dark:text-emerald-300",
      accent: "bg-emerald-600",
    },
    amber: {
      border: "border-amber-200 dark:border-amber-900",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      icon: "text-amber-600 dark:text-amber-300",
      accent: "bg-amber-500",
    },
    violet: {
      border: "border-violet-200 dark:border-violet-900",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      icon: "text-violet-600 dark:text-violet-300",
      accent: "bg-violet-600",
    },
    sky: {
      border: "border-sky-200 dark:border-sky-900",
      bg: "bg-sky-50 dark:bg-sky-950/30",
      icon: "text-sky-600 dark:text-sky-300",
      accent: "bg-sky-600",
    },
    red: {
      border: "border-red-200 dark:border-red-900",
      bg: "bg-red-50 dark:bg-red-950/30",
      icon: "text-red-600 dark:text-red-300",
      accent: "bg-red-600",
    },
    slate: {
      border: "border-slate-200 dark:border-slate-800",
      bg: "bg-slate-100 dark:bg-slate-900",
      icon: "text-slate-600 dark:text-slate-300",
      accent: "bg-slate-600",
    },
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

function getTabMatch(record: EscalationQualityRecord, activeTab: PageTab) {
  if (activeTab === "objections") return record.issue_type === "Objection";
  if (activeTab === "escalations") return record.issue_type === "Escalation" || record.status === "Escalated";
  if (activeTab === "quality_risks") return record.issue_type === "Quality Risk";
  return record.issue_type === "Department Follow-up" || record.status === "Pending Department";
}

function getRiskPressureScore(records: EscalationQualityRecord[]) {
  if (!records.length) return 100;

  const critical = records.filter((record) => record.priority === "Critical").length;
  const high = records.filter((record) => record.priority === "High").length;
  const escalated = records.filter((record) => record.status === "Escalated").length;
  const pending = records.filter((record) => record.status === "Pending Department" || record.status === "Open").length;

  const penalty = critical * 10 + high * 6 + escalated * 8 + pending * 3;
  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

function getDuplicateRootCauseCount(records: EscalationQualityRecord[]) {
  const counts = records.reduce<Record<string, number>>((acc, record) => {
    const key = record.root_cause.trim().toLowerCase();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.values(counts).reduce((sum, count) => sum + (count > 1 ? count : 0), 0);
}

function isDueSoon(dateValue: string | null) {
  if (!dateValue) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateValue);
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}

function isOverdue(record: EscalationQualityRecord) {
  if (!record.due_date || record.status === "Resolved" || record.status === "Closed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(record.due_date);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export default function ShiftInchargeEscalationsQualityPage() {
  const [records, setRecords] = useState<EscalationQualityRecord[]>([]);
  const [form, setForm] = useState<EscalationQualityForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState<PageTab>("objections");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("shift_escalations_quality_records")
        .select("*")
        .order("record_month", { ascending: false })
        .order("created_at", { ascending: false });

      if (response.error) throw new Error(response.error.message);

      setRecords((response.data || []) as EscalationQualityRecord[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(
          error,
          "Could not load objections, escalations and quality risk records. Please check the shift_escalations_quality_records Supabase table."
        ),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel("shift-escalations-quality-records-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_escalations_quality_records" },
        () => fetchRecords()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  const monthRecords = useMemo(
    () => records.filter((record) => record.record_month === selectedMonth),
    [records, selectedMonth]
  );

  const objections = monthRecords.filter((record) => record.issue_type === "Objection");
  const qualityRisks = monthRecords.filter((record) => record.issue_type === "Quality Risk");
  const departmentFollowUps = monthRecords.filter(
    (record) => record.issue_type === "Department Follow-up" || record.status === "Pending Department"
  );

  const objectionsReceived = objections.length;
  const resolvedAtShiftLevel = objections.filter(
    (record) => record.status === "Resolved" || record.status === "Closed"
  ).length;
  const escalatedObjections = objections.filter((record) => record.status === "Escalated").length;
  const repeatObjections = getDuplicateRootCauseCount(objections);

  const qualityRiskFlags = qualityRisks.length;
  const preventiveActionsTaken = qualityRisks.filter((record) => record.preventive_action_taken === true).length;
  const risksResolved = qualityRisks.filter(
    (record) => record.status === "Resolved" || record.status === "Closed"
  ).length;
  const risksEscalated = qualityRisks.filter((record) => record.status === "Escalated").length;
  const pendingDepartmentActions = departmentFollowUps.filter(
    (record) => record.status !== "Resolved" && record.status !== "Closed"
  ).length;

  const issuesEscalatedByDepartment = monthRecords.filter(
    (record) => record.issue_type === "Escalation" || record.status === "Escalated" || record.status === "Pending Department"
  ).length;
  const issuesResolved = monthRecords.filter(
    (record) => record.status === "Resolved" || record.status === "Closed"
  ).length;
  const overdueCount = monthRecords.filter(isOverdue).length;
  const dueSoonCount = monthRecords.filter((record) => isDueSoon(record.due_date)).length;
  const riskPressureScore = getRiskPressureScore(monthRecords);

  const issueTypeData = ISSUE_TYPES.map((type) => ({
    name: type,
    value: monthRecords.filter((record) => record.issue_type === type).length,
  })).filter((item) => item.value > 0);

  const departmentData = DEPARTMENTS.map((department) => ({
    name: department,
    value: monthRecords.filter((record) => record.department === department).length,
  })).filter((item) => item.value > 0);

  const priorityData = PRIORITIES.map((priority) => ({
    name: priority,
    value: monthRecords.filter((record) => record.priority === priority).length,
  })).filter((item) => item.value > 0);

  const statusData = STATUSES.map((status) => ({
    name: status,
    value: monthRecords.filter((record) => record.status === status).length,
  })).filter((item) => item.value > 0);

  const monthlyTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const monthData = records.filter((record) => record.record_month === month);
      return {
        month: getMonthLabel(month),
        objections: monthData.filter((record) => record.issue_type === "Objection").length,
        escalations: monthData.filter((record) => record.issue_type === "Escalation" || record.status === "Escalated").length,
        qualityRisks: monthData.filter((record) => record.issue_type === "Quality Risk").length,
        pendingActions: monthData.filter((record) => record.status === "Pending Department").length,
      };
    });
  }, [records, selectedMonth]);

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records
      .filter((record) => record.record_month === selectedMonth)
      .filter((record) => getTabMatch(record, activeTab))
      .filter((record) => statusFilter === "all" || record.status === statusFilter)
      .filter((record) => priorityFilter === "all" || record.priority === priorityFilter)
      .filter((record) => departmentFilter === "all" || record.department === departmentFilter)
      .filter((record) => {
        if (!query) return true;
        return [
          record.issue_id,
          record.issue_type,
          record.source,
          record.person_name,
          record.department,
          record.priority,
          record.root_cause,
          record.status,
          record.owner,
          record.resolution || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const priorityWeight = { Critical: 0, High: 1, Medium: 2, Low: 3 } satisfies Record<Priority, number>;
        if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
          return priorityWeight[a.priority] - priorityWeight[b.priority];
        }
        return new Date(a.due_date || "2999-12-31").getTime() - new Date(b.due_date || "2999-12-31").getTime();
      });
  }, [records, selectedMonth, activeTab, statusFilter, priorityFilter, departmentFilter, searchQuery]);

  const insights = useMemo(() => {
    const output = [];

    if (monthRecords.length === 0) {
      output.push("No records are available for this month. Add objections, escalations, quality risks or department follow-ups to activate shift risk tracking.");
    }

    if (escalatedObjections > 0) {
      output.push(`${escalatedObjections} objection(s) were escalated. Review whether these could be resolved earlier at shift level next month.`);
    }

    if (repeatObjections > 0) {
      output.push(`${repeatObjections} repeat objection(s) have the same root cause. Treat these as system/process problems, not one-time complaints.`);
    }

    if (qualityRiskFlags > 0 && preventiveActionsTaken < qualityRiskFlags) {
      output.push(`${qualityRiskFlags - preventiveActionsTaken} quality risk flag(s) still need preventive action. Prioritise churn and dissatisfaction signals.`);
    }

    if (pendingDepartmentActions > 0) {
      output.push(`${pendingDepartmentActions} cross-department action(s) are still pending. Follow up with owner departments before the due date.`);
    }

    if (overdueCount > 0) {
      output.push(`${overdueCount} issue(s) are overdue. These should be reviewed first in the records table.`);
    }

    if (riskPressureScore < 70 && monthRecords.length > 0) {
      output.push("Shift risk pressure is high. Focus on critical/high priority items, pending department actions and unresolved escalations.");
    }

    if (!output.length) {
      output.push("Objections, escalations and quality risks are under control for this month. Continue tracking repeat root causes and department follow-ups.");
    }

    return output;
  }, [
    monthRecords.length,
    escalatedObjections,
    repeatObjections,
    qualityRiskFlags,
    preventiveActionsTaken,
    pendingDepartmentActions,
    overdueCount,
    riskPressureScore,
  ]);

  function setFormValue<K extends keyof EscalationQualityForm>(key: K, value: EscalationQualityForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm({ ...emptyForm(), record_month: selectedMonth });
    setIsModalOpen(true);
    setMessage(null);
  }

  function openEditModal(record: EscalationQualityRecord) {
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

  function buildPayload() {
    return {
      issue_id: form.issue_id.trim() || generateIssueId(),
      record_month: form.record_month,
      issue_type: form.issue_type,
      source: form.source,
      person_name: form.person_name.trim(),
      department: form.department,
      priority: form.priority,
      root_cause: form.root_cause.trim(),
      status: form.status,
      owner: form.owner.trim(),
      due_date: form.due_date || null,
      resolution: form.resolution.trim() || null,
      preventive_action_taken: form.preventive_action_taken === "yes",
    };
  }

  function validateForm() {
    if (!form.issue_id.trim()) return "Please enter issue ID.";
    if (!form.record_month) return "Please select record month.";
    if (!form.person_name.trim()) return "Please enter student / parent / tutor / person name.";
    if (!form.root_cause.trim()) return "Please enter root cause.";
    if (!form.owner.trim()) return "Please enter owner.";
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
        ? await supabase.from("shift_escalations_quality_records").update(payload).eq("id", editingId).select().single()
        : await supabase.from("shift_escalations_quality_records").insert(payload).select().single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId ? "Issue record updated successfully." : "Issue record added successfully.",
      });
      closeModal();
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save this issue record.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(record: EscalationQualityRecord, status: IssueStatus) {
    try {
      setMessage(null);
      const response = await supabase.from("shift_escalations_quality_records").update({ status }).eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: `${record.issue_id} marked as ${status}.` });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not update issue status.") });
    }
  }

  async function handleDelete(record: EscalationQualityRecord) {
    const confirmed = window.confirm(`Delete ${record.issue_id}?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const response = await supabase.from("shift_escalations_quality_records").delete().eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: "Issue record deleted." });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not delete this issue record.") });
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading objections, escalations and quality risks…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Objections, Escalations & Quality Risks</h1>
          <p className="text-muted-foreground">
            Combined shift page for objection handling, escalation control, quality stability oversight and cross-department follow-ups.
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
            Add Issue
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

      <SectionTitle icon={Gauge} title="Shift Risk Control Snapshot" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <MetricCard title="Objections Received" value={formatNumber(objectionsReceived)} icon={MessageSquareWarning} subtitle="Total objections logged" color="indigo" />
        <MetricCard title="Resolved at Shift Level" value={formatNumber(resolvedAtShiftLevel)} icon={CheckCircle2} subtitle="Solved without unnecessary escalation" color="emerald" />
        <MetricCard title="Escalated Objections" value={formatNumber(escalatedObjections)} icon={Send} subtitle="Objections moved above shift level" color={escalatedObjections > 0 ? "red" : "emerald"} />
        <MetricCard title="Repeat Objections" value={formatNumber(repeatObjections)} icon={RefreshCw} subtitle="Same root cause repeated" color={repeatObjections > 0 ? "amber" : "emerald"} />
        <MetricCard title="Risk Pressure Score" value={`${riskPressureScore}%`} icon={Gauge} subtitle="Based on open, high and escalated items" color={riskPressureScore >= 80 ? "emerald" : riskPressureScore >= 60 ? "amber" : "red"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Quality Risk Flags" value={formatNumber(qualityRiskFlags)} icon={ShieldAlert} subtitle="Early quality/churn signals" color={qualityRiskFlags > 0 ? "violet" : "emerald"} />
        <MetricCard title="Preventive Actions Taken" value={formatNumber(preventiveActionsTaken)} icon={ShieldCheck} subtitle="Actions taken before issue grows" color="emerald" />
        <MetricCard title="Risks Resolved" value={formatNumber(risksResolved)} icon={CheckCircle2} subtitle="Quality risks closed" color="emerald" />
        <MetricCard title="Risks Escalated" value={formatNumber(risksEscalated)} icon={AlertTriangle} subtitle="Quality risks moved upward" color={risksEscalated > 0 ? "red" : "emerald"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Issues Escalated by Department" value={formatNumber(issuesEscalatedByDepartment)} icon={Network} subtitle="HR, T&D, Admin, Finance, Marketing" color="sky" />
        <MetricCard title="Issues Resolved" value={formatNumber(issuesResolved)} icon={ClipboardCheck} subtitle="Closed across all issue types" color="emerald" />
        <MetricCard title="Pending Department Actions" value={formatNumber(pendingDepartmentActions)} icon={Clock} subtitle="Open cross-department actions" color={pendingDepartmentActions > 0 ? "amber" : "emerald"} />
        <MetricCard title="Overdue / Due Soon" value={`${overdueCount} / ${dueSoonCount}`} icon={AlertCircle} subtitle="Overdue and next 3 days" color={overdueCount > 0 ? "red" : dueSoonCount > 0 ? "amber" : "emerald"} />
      </div>

      <SectionTitle icon={BarChart3} title="Charts & Risk Analytics" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Issue Type Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">Objections, escalations, quality risks and department follow-ups.</p>
          </CardHeader>
          <CardContent className="h-80">
            {issueTypeData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={issueTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {issueTypeData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Issues"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No issue data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Department Follow-up Load</CardTitle>
            <p className="text-sm text-muted-foreground">Escalations and follow-ups by owner department.</p>
          </CardHeader>
          <CardContent className="h-80">
            {departmentData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Issues"]} />
                  <Bar dataKey="value" name="Issues" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No department data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Priority Split</CardTitle>
            <p className="text-sm text-muted-foreground">Low, medium, high and critical items for the selected month.</p>
          </CardHeader>
          <CardContent className="h-80">
            {priorityData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Issues"]} />
                  <Bar dataKey="value" name="Issues" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No priority data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Status Split</CardTitle>
            <p className="text-sm text-muted-foreground">Open, in progress, resolved, escalated and pending department items.</p>
          </CardHeader>
          <CardContent className="h-80">
            {statusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {statusData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Issues"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No status data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="text-base">6-Month Issue Trend</CardTitle>
          <p className="text-sm text-muted-foreground">Track objections, escalations, quality risks and pending actions over time.</p>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
              <Legend />
              <Line type="monotone" dataKey="objections" name="Objections" stroke="#4f46e5" strokeWidth={2.5} />
              <Line type="monotone" dataKey="escalations" name="Escalations" stroke="#ef4444" strokeWidth={2.5} />
              <Line type="monotone" dataKey="qualityRisks" name="Quality Risks" stroke="#8b5cf6" strokeWidth={2.5} />
              <Line type="monotone" dataKey="pendingActions" name="Pending Actions" stroke="#f59e0b" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle icon={ShieldAlert} title="Automated Shift Control Insights" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Smart Risk Notes</CardTitle>
            <p className="text-sm text-muted-foreground">Automatic alerts for repeat objections, escalated risks, overdue items and department follow-ups.</p>
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
            <CardTitle className="text-base">Page Includes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Objections tab",
              "Escalations tab",
              "Quality risks tab",
              "Department follow-ups tab",
              "Repeat root-cause tracking",
              "Preventive action tracking",
              "Pending department action tracking",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Filter} title="Objections, Escalations & Quality Risk Records" />
      <Card className="bg-white dark:bg-card">
        <CardHeader className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    active
                      ? "border-indigo-300 bg-indigo-50 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/30"
                      : "border-border bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${active ? "text-indigo-600" : "text-muted-foreground"}`} />
                    <span className="font-semibold">{tab.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{tab.description}</p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter and manage issue records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleRecords.length)} of {formatNumber(monthRecords.length)} records for {getMonthLabel(selectedMonth)}.
              </p>
            </div>
            <Button onClick={openAddModal} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Issue
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <FieldLabel>Status</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Priority</FieldLabel>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Department</FieldLabel>
              <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value as DepartmentFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {DEPARTMENTS.map((department) => (
                    <SelectItem key={department} value={department}>{department}</SelectItem>
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
                  placeholder="Search issue, person, root cause..."
                  className={inputClassName("pl-9")}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1700px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Issue ID</th>
                  <th className="px-4 py-3 font-semibold">Issue Type</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Student / Parent / Tutor</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Root Cause</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold">Resolution</th>
                  <th className="px-4 py-3 font-semibold">Preventive Action</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => {
                    const overdue = isOverdue(record);
                    const dueSoon = isDueSoon(record.due_date);
                    return (
                      <tr key={record.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3 font-semibold">{record.issue_id}</td>
                        <td className="px-4 py-3"><TypeBadge type={record.issue_type} /></td>
                        <td className="px-4 py-3">{record.source}</td>
                        <td className="px-4 py-3 font-medium">{record.person_name}</td>
                        <td className="px-4 py-3">{record.department}</td>
                        <td className="px-4 py-3"><PriorityBadge priority={record.priority} /></td>
                        <td className="px-4 py-3 max-w-[260px] truncate" title={record.root_cause}>{record.root_cause}</td>
                        <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                        <td className="px-4 py-3">{record.owner}</td>
                        <td className={overdue ? "px-4 py-3 font-semibold text-red-600" : dueSoon ? "px-4 py-3 font-semibold text-amber-600" : "px-4 py-3"}>
                          {record.due_date || "—"}
                        </td>
                        <td className="px-4 py-3 max-w-[320px] truncate" title={record.resolution || ""}>{record.resolution || "—"}</td>
                        <td className="px-4 py-3"><YesNoBadge value={record.preventive_action_taken} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(record)}>
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {record.status !== "Resolved" && record.status !== "Closed" && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(record, "Resolved")}>
                                Resolve
                              </Button>
                            )}
                            {record.status !== "Escalated" && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(record, "Escalated")}>
                                Escalate
                              </Button>
                            )}
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
                    <td colSpan={13} className="px-4 py-10 text-center text-muted-foreground">
                      No records found for this tab and selected month.
                    </td>
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
                    {editingId ? "Edit Issue Record" : "Add Issue Record"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-white/80">
                    Add objections, escalations, quality risks and department follow-ups in one place.
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
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Issue Details</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Issue ID *</FieldLabel>
                        <input value={form.issue_id} onChange={(event) => setFormValue("issue_id", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Record month *</FieldLabel>
                        <input type="month" value={form.record_month} onChange={(event) => setFormValue("record_month", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Issue Type</FieldLabel>
                        <Select value={form.issue_type} onValueChange={(value) => setFormValue("issue_type", value as IssueType)}>
                          <SelectTrigger><SelectValue placeholder="Issue type" /></SelectTrigger>
                          <SelectContent>{ISSUE_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Source</FieldLabel>
                        <Select value={form.source} onValueChange={(value) => setFormValue("source", value as IssueSource)}>
                          <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                          <SelectContent>{SOURCES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Student / Parent / Tutor *</FieldLabel>
                        <input value={form.person_name} onChange={(event) => setFormValue("person_name", event.target.value)} placeholder="Name or reference" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Department</FieldLabel>
                        <Select value={form.department} onValueChange={(value) => setFormValue("department", value as Department)}>
                          <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                          <SelectContent>{DEPARTMENTS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Risk, Ownership & Status</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Priority</FieldLabel>
                        <Select value={form.priority} onValueChange={(value) => setFormValue("priority", value as Priority)}>
                          <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                          <SelectContent>{PRIORITIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Status</FieldLabel>
                        <Select value={form.status} onValueChange={(value) => setFormValue("status", value as IssueStatus)}>
                          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Owner *</FieldLabel>
                        <input value={form.owner} onChange={(event) => setFormValue("owner", event.target.value)} placeholder="Responsible person" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Due Date</FieldLabel>
                        <input type="date" value={form.due_date} onChange={(event) => setFormValue("due_date", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Preventive Action Taken</FieldLabel>
                        <Select value={form.preventive_action_taken} onValueChange={(value) => setFormValue("preventive_action_taken", value as "yes" | "no")}>
                          <SelectTrigger><SelectValue placeholder="Preventive action" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="grid gap-4">
                      <div>
                        <FieldLabel>Root Cause *</FieldLabel>
                        <textarea value={form.root_cause} onChange={(event) => setFormValue("root_cause", event.target.value)} placeholder="What is the actual repeated/system reason behind this issue?" className={textareaClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Resolution</FieldLabel>
                        <textarea value={form.resolution} onChange={(event) => setFormValue("resolution", event.target.value)} placeholder="What was done, what is pending, and what should management know?" className={textareaClassName()} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                        Record Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                        <p className="text-xs text-muted-foreground">Issue</p>
                        <p className="font-semibold">{form.issue_id || "New issue"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="font-semibold">{form.issue_type}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Priority</p>
                          <p className="font-semibold">{form.priority}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Department</p>
                          <p className="font-semibold">{form.department}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="font-semibold">{form.status}</p>
                        </div>
                      </div>
                      {(form.priority === "Critical" || form.status === "Escalated" || form.status === "Pending Department") && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                          This issue needs close follow-up because it is critical, escalated or pending with a department.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-card">
                    <CardHeader>
                      <CardTitle className="text-base">This Page Tracks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-2"><MessageSquareWarning className="mt-0.5 h-4 w-4 text-indigo-600" />Objections received, resolved, escalated and repeated.</div>
                      <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-600" />Quality risk flags, preventive actions, resolved and escalated risks.</div>
                      <div className="flex gap-2"><Network className="mt-0.5 h-4 w-4 text-indigo-600" />HR, T&D, Admin, Finance and Marketing follow-ups.</div>
                      <div className="flex gap-2"><GitBranch className="mt-0.5 h-4 w-4 text-indigo-600" />Root-cause repetition for business-level improvements.</div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
