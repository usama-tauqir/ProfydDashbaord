// app/dashboard/shift-incharge/reports/page.tsx
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
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit3,
  FileCheck2,
  FileText,
  Filter,
  Gauge,
  Lightbulb,
  Loader2,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  UserRoundCheck,
  Workflow,
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

type PageTab =
  | "monthly_summary"
  | "key_risks"
  | "trends"
  | "target_performance"
  | "capacity_forecast"
  | "compliance_status"
  | "process_improvements"
  | "decisions_required";

type ShiftType = "Morning" | "Night";
type ReportStatus = "Draft" | "Submitted" | "Reviewed" | "Needs Revision" | "Closed";
type ShiftFilter = "all" | ShiftType;
type StatusFilter = "all" | ReportStatus;
type OnTimeFilter = "all" | "on_time" | "late";

type ShiftBusinessReportRecord = {
  id: string;
  record_month: string;
  shift_type: ShiftType;
  accountable_incharge: string;
  report_status: ReportStatus;
  report_submitted_on_time: boolean | null;
  submission_date: string | null;
  closing_date: string | null;
  deadline_date: string | null;

  monthly_shift_summary: string;
  key_risks_summary: string;
  key_risks_highlighted: number | string | null;
  trends_summary: string;
  target_performance: string;
  capacity_forecast: string;
  compliance_status: string;
  process_improvements: string;
  decisions_required_summary: string;
  decisions_required_count: number | string | null;
  pending_actions_count: number | string | null;

  no_narratives_confirmed: boolean | null;
  no_assumptions_confirmed: boolean | null;
  one_incharge_accountable: boolean | null;
  morning_night_separate: boolean | null;

  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type ShiftBusinessReportForm = {
  record_month: string;
  shift_type: ShiftType;
  accountable_incharge: string;
  report_status: ReportStatus;
  report_submitted_on_time: "yes" | "no";
  submission_date: string;
  closing_date: string;
  deadline_date: string;

  monthly_shift_summary: string;
  key_risks_summary: string;
  key_risks_highlighted: string;
  trends_summary: string;
  target_performance: string;
  capacity_forecast: string;
  compliance_status: string;
  process_improvements: string;
  decisions_required_summary: string;
  decisions_required_count: string;
  pending_actions_count: string;

  no_narratives_confirmed: "yes" | "no";
  no_assumptions_confirmed: "yes" | "no";
  one_incharge_accountable: "yes" | "no";
  morning_night_separate: "yes" | "no";

  notes: string;
};

const SHIFT_TYPES: ShiftType[] = ["Morning", "Night"];
const REPORT_STATUSES: ReportStatus[] = ["Draft", "Submitted", "Reviewed", "Needs Revision", "Closed"];
const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"];

const TAB_CONFIG: Array<{ key: PageTab; label: string; description: string; icon: ElementType }> = [
  {
    key: "monthly_summary",
    label: "Monthly Shift Summary",
    description: "Executive summary of the month, not operational daily logs.",
    icon: FileText,
  },
  {
    key: "key_risks",
    label: "Key Risks",
    description: "Risks highlighted for management visibility.",
    icon: AlertTriangle,
  },
  {
    key: "trends",
    label: "Trends",
    description: "Shift-level patterns, stability movement and repeated signals.",
    icon: TrendingUp,
  },
  {
    key: "target_performance",
    label: "Target Performance",
    description: "Target achievement, misses and accuracy view.",
    icon: Target,
  },
  {
    key: "capacity_forecast",
    label: "Capacity Forecast",
    description: "Student load, tutor needs and shortage forecast.",
    icon: Gauge,
  },
  {
    key: "compliance_status",
    label: "Compliance Status",
    description: "Compliance rate, breaches and unresolved risks.",
    icon: ShieldCheck,
  },
  {
    key: "process_improvements",
    label: "Process Improvements",
    description: "Workflow improvements suggested, approved and implemented.",
    icon: Lightbulb,
  },
  {
    key: "decisions_required",
    label: "Decisions Required",
    description: "Management decisions required with pending actions.",
    icon: ClipboardCheck,
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

function getDefaultClosingDate(month: string) {
  return `${month}-25`;
}

function getThirdWorkingDay(month: string) {
  const start = getMonthStart(month);
  let workingDays = 0;
  const date = new Date(start);

  while (workingDays < 3) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) workingDays += 1;
    if (workingDays < 3) date.setDate(date.getDate() + 1);
  }

  return date.toISOString().slice(0, 10);
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const numberValue = Number(value ?? fallback);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function emptyForm(): ShiftBusinessReportForm {
  const month = getCurrentMonth();
  return {
    record_month: month,
    shift_type: "Morning",
    accountable_incharge: "",
    report_status: "Draft",
    report_submitted_on_time: "no",
    submission_date: "",
    closing_date: getDefaultClosingDate(month),
    deadline_date: getThirdWorkingDay(month),

    monthly_shift_summary: "",
    key_risks_summary: "",
    key_risks_highlighted: "0",
    trends_summary: "",
    target_performance: "",
    capacity_forecast: "",
    compliance_status: "",
    process_improvements: "",
    decisions_required_summary: "",
    decisions_required_count: "0",
    pending_actions_count: "0",

    no_narratives_confirmed: "yes",
    no_assumptions_confirmed: "yes",
    one_incharge_accountable: "yes",
    morning_night_separate: "yes",

    notes: "",
  };
}

function recordToForm(record: ShiftBusinessReportRecord): ShiftBusinessReportForm {
  return {
    record_month: record.record_month || getCurrentMonth(),
    shift_type: record.shift_type || "Morning",
    accountable_incharge: record.accountable_incharge || "",
    report_status: record.report_status || "Draft",
    report_submitted_on_time: record.report_submitted_on_time ? "yes" : "no",
    submission_date: record.submission_date || "",
    closing_date: record.closing_date || getDefaultClosingDate(record.record_month || getCurrentMonth()),
    deadline_date: record.deadline_date || getThirdWorkingDay(record.record_month || getCurrentMonth()),

    monthly_shift_summary: record.monthly_shift_summary || "",
    key_risks_summary: record.key_risks_summary || "",
    key_risks_highlighted: String(toNumber(record.key_risks_highlighted, 0)),
    trends_summary: record.trends_summary || "",
    target_performance: record.target_performance || "",
    capacity_forecast: record.capacity_forecast || "",
    compliance_status: record.compliance_status || "",
    process_improvements: record.process_improvements || "",
    decisions_required_summary: record.decisions_required_summary || "",
    decisions_required_count: String(toNumber(record.decisions_required_count, 0)),
    pending_actions_count: String(toNumber(record.pending_actions_count, 0)),

    no_narratives_confirmed: record.no_narratives_confirmed ? "yes" : "no",
    no_assumptions_confirmed: record.no_assumptions_confirmed ? "yes" : "no",
    one_incharge_accountable: record.one_incharge_accountable ? "yes" : "no",
    morning_night_separate: record.morning_night_separate ? "yes" : "no",

    notes: record.notes || "",
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

function YesNoBadge({ value, yesText = "Yes", noText = "No" }: { value: boolean | null | undefined; yesText?: string; noText?: string }) {
  const active = value === true;
  return (
    <span
      className={`rounded-md px-2 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
      }`}
    >
      {active ? yesText : noText}
    </span>
  );
}

function ShiftBadge({ shift }: { shift: ShiftType }) {
  const config = {
    Morning: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    Night: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  } satisfies Record<ShiftType, string>;

  const Icon = shift === "Morning" ? Sun : Moon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${config[shift]}`}>
      <Icon className="h-3.5 w-3.5" />
      {shift}
    </span>
  );
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const config = {
    Draft: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
    Submitted: "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
    Reviewed: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
    "Needs Revision": "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    Closed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  } satisfies Record<ReportStatus, string>;

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

function getSectionValue(record: ShiftBusinessReportRecord, activeTab: PageTab) {
  if (activeTab === "monthly_summary") return record.monthly_shift_summary;
  if (activeTab === "key_risks") return record.key_risks_summary;
  if (activeTab === "trends") return record.trends_summary;
  if (activeTab === "target_performance") return record.target_performance;
  if (activeTab === "capacity_forecast") return record.capacity_forecast;
  if (activeTab === "compliance_status") return record.compliance_status;
  if (activeTab === "process_improvements") return record.process_improvements;
  return record.decisions_required_summary;
}

function getGovernanceScore(records: ShiftBusinessReportRecord[]) {
  if (!records.length) return 0;

  const totalChecks = records.length * 4;
  const passedChecks = records.reduce((sum, record) => {
    return (
      sum +
      (record.no_narratives_confirmed ? 1 : 0) +
      (record.no_assumptions_confirmed ? 1 : 0) +
      (record.one_incharge_accountable ? 1 : 0) +
      (record.morning_night_separate ? 1 : 0)
    );
  }, 0);

  return Math.round((passedChecks / totalChecks) * 100);
}

export default function ShiftInchargeReportsPage() {
  const [records, setRecords] = useState<ShiftBusinessReportRecord[]>([]);
  const [form, setForm] = useState<ShiftBusinessReportForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState<PageTab>("monthly_summary");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [onTimeFilter, setOnTimeFilter] = useState<OnTimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("shift_business_reports")
        .select("*")
        .order("record_month", { ascending: false })
        .order("created_at", { ascending: false });

      if (response.error) throw new Error(response.error.message);

      setRecords((response.data || []) as ShiftBusinessReportRecord[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Could not load shift business reports. Please check the shift_business_reports Supabase table."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel("shift-business-reports-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_business_reports" },
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

  const reportsSubmittedOnTime = monthRecords.filter((record) => record.report_submitted_on_time === true).length;
  const reportsLate = monthRecords.filter((record) => record.report_submitted_on_time === false && record.report_status !== "Draft").length;
  const keyRisksHighlighted = monthRecords.reduce((sum, record) => sum + toNumber(record.key_risks_highlighted, 0), 0);
  const decisionsRequired = monthRecords.reduce((sum, record) => sum + toNumber(record.decisions_required_count, 0), 0);
  const pendingActions = monthRecords.reduce((sum, record) => sum + toNumber(record.pending_actions_count, 0), 0);
  const submittedReports = monthRecords.filter((record) => ["Submitted", "Reviewed", "Closed"].includes(record.report_status)).length;
  const draftReports = monthRecords.filter((record) => record.report_status === "Draft").length;
  const needsRevisionReports = monthRecords.filter((record) => record.report_status === "Needs Revision").length;
  const governanceScore = getGovernanceScore(monthRecords);

  const expectedReports = 2;
  const submissionCompletionRate = Math.min(100, Math.round((submittedReports / expectedReports) * 100));

  const shiftData = SHIFT_TYPES.map((shift) => ({
    name: shift,
    value: monthRecords.filter((record) => record.shift_type === shift).length,
  })).filter((item) => item.value > 0);

  const statusData = REPORT_STATUSES.map((status) => ({
    name: status,
    value: monthRecords.filter((record) => record.report_status === status).length,
  })).filter((item) => item.value > 0);

  const executiveKpiData = [
    { name: "On Time", value: reportsSubmittedOnTime },
    { name: "Key Risks", value: keyRisksHighlighted },
    { name: "Decisions", value: decisionsRequired },
    { name: "Pending Actions", value: pendingActions },
  ];

  const sectionCompletionData = TAB_CONFIG.map((tab) => ({
    name: tab.label,
    value: monthRecords.filter((record) => getSectionValue(record, tab.key)?.trim()).length,
  }));

  const monthlyTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const monthData = records.filter((record) => record.record_month === month);
      return {
        month: getMonthLabel(month),
        submitted: monthData.filter((record) => ["Submitted", "Reviewed", "Closed"].includes(record.report_status)).length,
        onTime: monthData.filter((record) => record.report_submitted_on_time === true).length,
        keyRisks: monthData.reduce((sum, record) => sum + toNumber(record.key_risks_highlighted, 0), 0),
        decisions: monthData.reduce((sum, record) => sum + toNumber(record.decisions_required_count, 0), 0),
        pending: monthData.reduce((sum, record) => sum + toNumber(record.pending_actions_count, 0), 0),
      };
    });
  }, [records, selectedMonth]);

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records
      .filter((record) => record.record_month === selectedMonth)
      .filter((record) => shiftFilter === "all" || record.shift_type === shiftFilter)
      .filter((record) => statusFilter === "all" || record.report_status === statusFilter)
      .filter((record) => {
        if (onTimeFilter === "all") return true;
        if (onTimeFilter === "on_time") return record.report_submitted_on_time === true;
        return record.report_submitted_on_time === false;
      })
      .filter((record) => {
        if (!query) return true;
        return [
          record.shift_type,
          record.accountable_incharge,
          record.report_status,
          record.monthly_shift_summary,
          record.key_risks_summary,
          record.trends_summary,
          record.target_performance,
          record.capacity_forecast,
          record.compliance_status,
          record.process_improvements,
          record.decisions_required_summary,
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        if (a.report_status === "Needs Revision" && b.report_status !== "Needs Revision") return -1;
        if (b.report_status === "Needs Revision" && a.report_status !== "Needs Revision") return 1;
        return toNumber(b.decisions_required_count, 0) + toNumber(b.pending_actions_count, 0) - (toNumber(a.decisions_required_count, 0) + toNumber(a.pending_actions_count, 0));
      });
  }, [records, selectedMonth, shiftFilter, statusFilter, onTimeFilter, searchQuery]);

  const insights = useMemo(() => {
    const output = [];

    if (monthRecords.length === 0) {
      output.push("No shift business reports are available for this month. Morning and Night shift reports should be submitted separately.");
    }

    if (submittedReports < expectedReports) {
      output.push(`${expectedReports - submittedReports} shift business report(s) are still not submitted. Monthly governance expects Morning and Night reports separately.`);
    }

    if (reportsLate > 0) {
      output.push(`${reportsLate} report(s) were submitted late. Deadline is the 3rd working day of the month.`);
    }

    if (keyRisksHighlighted === 0 && monthRecords.length > 0) {
      output.push("No key risks are highlighted. This report should focus on risks, trends and improvements, not daily logs.");
    }

    if (decisionsRequired > 0) {
      output.push(`${decisionsRequired} management decision(s) are required. These should be visible in the executive review section.`);
    }

    if (pendingActions > 0) {
      output.push(`${pendingActions} pending action(s) remain open. Follow-up ownership should be clear before month close.`);
    }

    if (needsRevisionReports > 0) {
      output.push(`${needsRevisionReports} report(s) need revision. Check governance rules: no narratives, no assumptions and one accountable incharge per shift.`);
    }

    if (governanceScore < 80 && monthRecords.length > 0) {
      output.push("Governance score is weak. Confirm no narratives, no assumptions, separate shift reporting and single accountability.");
    }

    if (!output.length) {
      output.push("Shift business reporting looks controlled this month. Continue focusing on risks, trends, capacity, compliance and decisions required.");
    }

    return output;
  }, [
    monthRecords.length,
    submittedReports,
    reportsLate,
    keyRisksHighlighted,
    decisionsRequired,
    pendingActions,
    needsRevisionReports,
    governanceScore,
  ]);

  function setFormValue<K extends keyof ShiftBusinessReportForm>(key: K, value: ShiftBusinessReportForm[K]) {
    setForm((previous) => {
      const next = { ...previous, [key]: value };

      if (key === "record_month") {
        next.closing_date = getDefaultClosingDate(String(value));
        next.deadline_date = getThirdWorkingDay(String(value));
      }

      if (key === "submission_date") {
        const submitted = String(value);
        const deadline = next.deadline_date;
        if (submitted && deadline) {
          next.report_submitted_on_time = submitted <= deadline ? "yes" : "no";
        }
      }

      if (key === "report_status" && value === "Submitted" && !next.submission_date) {
        next.submission_date = new Date().toISOString().slice(0, 10);
        next.report_submitted_on_time = next.submission_date <= next.deadline_date ? "yes" : "no";
      }

      return next;
    });
  }

  function openAddModal() {
    setEditingId(null);
    const base = emptyForm();
    setForm({ ...base, record_month: selectedMonth, closing_date: getDefaultClosingDate(selectedMonth), deadline_date: getThirdWorkingDay(selectedMonth) });
    setIsModalOpen(true);
    setMessage(null);
  }

  function openEditModal(record: ShiftBusinessReportRecord) {
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
      record_month: form.record_month,
      shift_type: form.shift_type,
      accountable_incharge: form.accountable_incharge.trim(),
      report_status: form.report_status,
      report_submitted_on_time: form.report_submitted_on_time === "yes",
      submission_date: form.submission_date || null,
      closing_date: form.closing_date || null,
      deadline_date: form.deadline_date || null,

      monthly_shift_summary: form.monthly_shift_summary.trim(),
      key_risks_summary: form.key_risks_summary.trim(),
      key_risks_highlighted: Number(form.key_risks_highlighted || 0),
      trends_summary: form.trends_summary.trim(),
      target_performance: form.target_performance.trim(),
      capacity_forecast: form.capacity_forecast.trim(),
      compliance_status: form.compliance_status.trim(),
      process_improvements: form.process_improvements.trim(),
      decisions_required_summary: form.decisions_required_summary.trim(),
      decisions_required_count: Number(form.decisions_required_count || 0),
      pending_actions_count: Number(form.pending_actions_count || 0),

      no_narratives_confirmed: form.no_narratives_confirmed === "yes",
      no_assumptions_confirmed: form.no_assumptions_confirmed === "yes",
      one_incharge_accountable: form.one_incharge_accountable === "yes",
      morning_night_separate: form.morning_night_separate === "yes",

      notes: form.notes.trim() || null,
    };
  }

  function validateForm() {
    if (!form.record_month) return "Please select record month.";
    if (!form.accountable_incharge.trim()) return "Please enter accountable Shift Incharge.";
    if (!form.monthly_shift_summary.trim()) return "Please enter monthly shift summary.";
    if (!form.key_risks_summary.trim()) return "Please enter key risks summary.";
    if (!form.trends_summary.trim()) return "Please enter trends summary.";
    if (!form.target_performance.trim()) return "Please enter target performance.";
    if (!form.capacity_forecast.trim()) return "Please enter capacity forecast.";
    if (!form.compliance_status.trim()) return "Please enter compliance status.";
    if (!form.process_improvements.trim()) return "Please enter process improvements.";
    if (!form.decisions_required_summary.trim()) return "Please enter decisions required summary.";

    const numericFields: Array<keyof ShiftBusinessReportForm> = [
      "key_risks_highlighted",
      "decisions_required_count",
      "pending_actions_count",
    ];

    for (const field of numericFields) {
      const value = Number(form[field] || 0);
      if (!Number.isFinite(value) || value < 0) return "Count fields must be zero or greater.";
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
        ? await supabase.from("shift_business_reports").update(payload).eq("id", editingId).select().single()
        : await supabase.from("shift_business_reports").insert(payload).select().single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId ? "Shift business report updated successfully." : "Shift business report added successfully.",
      });
      closeModal();
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save this shift business report.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(record: ShiftBusinessReportRecord, reportStatus: ReportStatus) {
    try {
      setMessage(null);
      const payload: Partial<ShiftBusinessReportRecord> = { report_status: reportStatus };
      if (reportStatus === "Submitted" && !record.submission_date) {
        const today = new Date().toISOString().slice(0, 10);
        payload.submission_date = today;
        payload.report_submitted_on_time = record.deadline_date ? today <= record.deadline_date : false;
      }
      const response = await supabase.from("shift_business_reports").update(payload).eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: `${record.shift_type} shift report marked as ${reportStatus}.` });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not update report status.") });
    }
  }

  async function handleDelete(record: ShiftBusinessReportRecord) {
    const confirmed = window.confirm(`Delete ${record.shift_type} shift report for ${getMonthLabel(record.record_month)}?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const response = await supabase.from("shift_business_reports").delete().eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: "Shift business report deleted." });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not delete this report.") });
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading shift business reports…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Business Reports</h1>
          <p className="text-muted-foreground">
            Executive monthly shift reports focused on risks, trends, improvements and decisions required — not daily logs.
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
            Add Report
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
            <p className={message.type === "success" ? "text-sm text-emerald-700 dark:text-emerald-300" : "text-sm text-red-700 dark:text-red-300"}>
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      <SectionTitle icon={BriefcaseBusiness} title="Executive Report Snapshot" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Report Submitted On Time" value={`${reportsSubmittedOnTime}/${expectedReports}`} icon={CalendarCheck} subtitle="Morning & Night submitted separately" color={reportsSubmittedOnTime >= expectedReports ? "emerald" : "amber"} />
        <MetricCard title="Key Risks Highlighted" value={formatNumber(keyRisksHighlighted)} icon={AlertTriangle} subtitle="Risks requiring visibility" color={keyRisksHighlighted > 0 ? "amber" : "slate"} />
        <MetricCard title="Decisions Required" value={formatNumber(decisionsRequired)} icon={ClipboardCheck} subtitle="Management decisions needed" color={decisionsRequired > 0 ? "red" : "emerald"} />
        <MetricCard title="Pending Actions" value={formatNumber(pendingActions)} icon={Clock} subtitle="Open follow-up actions" color={pendingActions > 0 ? "amber" : "emerald"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Submission Completion" value={`${submissionCompletionRate}%`} icon={FileCheck2} subtitle="Expected monthly report completion" color={submissionCompletionRate >= 100 ? "emerald" : submissionCompletionRate >= 50 ? "amber" : "red"} />
        <MetricCard title="Draft Reports" value={formatNumber(draftReports)} icon={FileText} subtitle="Reports not yet submitted" color={draftReports > 0 ? "amber" : "emerald"} />
        <MetricCard title="Needs Revision" value={formatNumber(needsRevisionReports)} icon={AlertCircle} subtitle="Reports requiring correction" color={needsRevisionReports > 0 ? "red" : "emerald"} />
        <MetricCard title="Governance Score" value={`${governanceScore}%`} icon={Gauge} subtitle="No assumptions, no narratives, accountability" color={governanceScore >= 90 ? "emerald" : governanceScore >= 70 ? "amber" : "red"} />
      </div>

      <SectionTitle icon={ShieldCheck} title="Governance Rules" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Frequency", value: "Monthly", icon: CalendarCheck },
          { title: "Deadline", value: "3rd working day", icon: Clock },
          { title: "Closing Date", value: "25th of each month", icon: FileCheck2 },
          { title: "Shift Separation", value: "Morning & Night separately", icon: UserRoundCheck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="bg-white dark:bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-indigo-50 p-3 dark:bg-indigo-950/30">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.title}</p>
                  <p className="font-semibold">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardHeader>
            <CardTitle className="text-base">What Shift Incharge Owns</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-emerald-800 dark:text-emerald-200 sm:grid-cols-2">
            {["Thinking", "Control", "Improvement", "Early risk detection", "Shift stability", "Scalability"].map((item) => (
              <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{item}</div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-base">What Shift Incharge Does Not Do</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-red-800 dark:text-red-200 sm:grid-cols-2">
            {["Payroll calculations", "Attendance marking", "HR admin", "QA audits", "Petty cash", "Marketing execution", "Daily reporting", "Clerical logs"].map((item) => (
              <div key={item} className="flex items-center gap-2"><X className="h-4 w-4" />{item}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={BarChart3} title="Charts & Executive Analytics" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader><CardTitle className="text-base">Executive KPI Summary</CardTitle><p className="text-sm text-muted-foreground">On-time reports, risks, decisions and pending actions.</p></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={executiveKpiData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Count"]} />
                <Bar dataKey="value" name="Count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader><CardTitle className="text-base">Report Section Completion</CardTitle><p className="text-sm text-muted-foreground">How many reports have completed each executive section.</p></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionCompletionData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={90} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Reports"]} />
                <Bar dataKey="value" name="Reports" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader><CardTitle className="text-base">Shift Report Split</CardTitle><p className="text-sm text-muted-foreground">Morning vs Night report submission coverage.</p></CardHeader>
          <CardContent className="h-80">
            {shiftData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={shiftData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {shiftData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Reports"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No shift report data yet.</div>}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader><CardTitle className="text-base">Report Status Split</CardTitle><p className="text-sm text-muted-foreground">Draft, submitted, reviewed, revision and closed reports.</p></CardHeader>
          <CardContent className="h-80">
            {statusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {statusData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Reports"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No report status data yet.</div>}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader><CardTitle className="text-base">6-Month Business Report Trend</CardTitle><p className="text-sm text-muted-foreground">Submitted reports, on-time reports, key risks, decisions and pending actions.</p></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
              <Legend />
              <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#4f46e5" strokeWidth={2.5} />
              <Line type="monotone" dataKey="onTime" name="On Time" stroke="#10b981" strokeWidth={2.5} />
              <Line type="monotone" dataKey="keyRisks" name="Key Risks" stroke="#f59e0b" strokeWidth={2.5} />
              <Line type="monotone" dataKey="decisions" name="Decisions" stroke="#ef4444" strokeWidth={2.5} />
              <Line type="monotone" dataKey="pending" name="Pending" stroke="#8b5cf6" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle icon={AlertTriangle} title="Automated Executive Report Insights" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Smart Report Notes</CardTitle><p className="text-sm text-muted-foreground">Automatic alerts for missing reports, late reports, missing risks and pending decisions.</p></CardHeader>
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
          <CardHeader><CardTitle className="text-base">Internal Role Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-medium text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
              “The Shift Incharge runs the shift like a business, ensures flow, removes friction, and prepares the shift to scale.”
            </div>
            <div className="space-y-3">
              {["Shift stability", "Early risk detection", "Forecast accuracy", "Compliance rate", "Improvement adoption", "Reduced firefighting"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm">{item}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Filter} title="Shift Business Report Records" />
      <Card className="bg-white dark:bg-card">
        <CardHeader className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-xl border p-4 text-left transition-all ${active ? "border-indigo-300 bg-indigo-50 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/30" : "border-border bg-muted/20 hover:bg-muted/40"}`}
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
              <CardTitle className="text-base">Search, filter and manage shift business reports</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleRecords.length)} of {formatNumber(monthRecords.length)} records for {getMonthLabel(selectedMonth)}.
              </p>
            </div>
            <Button onClick={openAddModal} size="sm"><Plus className="mr-2 h-4 w-4" />Add Report</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <FieldLabel>Shift</FieldLabel>
              <Select value={shiftFilter} onValueChange={(value) => setShiftFilter(value as ShiftFilter)}>
                <SelectTrigger><SelectValue placeholder="Shift" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All shifts</SelectItem>
                  {SHIFT_TYPES.map((shift) => <SelectItem key={shift} value={shift}>{shift}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Report Status</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {REPORT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Submission</FieldLabel>
              <Select value={onTimeFilter} onValueChange={(value) => setOnTimeFilter(value as OnTimeFilter)}>
                <SelectTrigger><SelectValue placeholder="Submission" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reports</SelectItem>
                  <SelectItem value="on_time">On time</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search report, incharge, risks..." className={inputClassName("pl-9")} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1700px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Shift</th>
                  <th className="px-4 py-3 font-semibold">Accountable Incharge</th>
                  <th className="px-4 py-3 font-semibold">Report Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted On Time</th>
                  <th className="px-4 py-3 font-semibold">Key Risks</th>
                  <th className="px-4 py-3 font-semibold">Decisions Required</th>
                  <th className="px-4 py-3 font-semibold">Pending Actions</th>
                  <th className="px-4 py-3 font-semibold">Selected Section</th>
                  <th className="px-4 py-3 font-semibold">Deadline</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />Loading reports…</td></tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3 font-semibold">{getMonthLabel(record.record_month)}</td>
                      <td className="px-4 py-3"><ShiftBadge shift={record.shift_type} /></td>
                      <td className="px-4 py-3 font-medium">{record.accountable_incharge}</td>
                      <td className="px-4 py-3"><ReportStatusBadge status={record.report_status} /></td>
                      <td className="px-4 py-3"><YesNoBadge value={record.report_submitted_on_time} yesText="On Time" noText="Late / No" /></td>
                      <td className="px-4 py-3">{formatNumber(toNumber(record.key_risks_highlighted, 0))}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">{formatNumber(toNumber(record.decisions_required_count, 0))}</td>
                      <td className="px-4 py-3 font-semibold text-amber-600">{formatNumber(toNumber(record.pending_actions_count, 0))}</td>
                      <td className="px-4 py-3 max-w-[360px] truncate" title={getSectionValue(record, activeTab)}>{getSectionValue(record, activeTab) || "—"}</td>
                      <td className="px-4 py-3">{record.deadline_date || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(record)}><Edit3 className="mr-1 h-3.5 w-3.5" />Edit</Button>
                          {record.report_status !== "Submitted" && (
                            <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(record, "Submitted")}>Submit</Button>
                          )}
                          {record.report_status !== "Reviewed" && (
                            <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(record, "Reviewed")}>Review</Button>
                          )}
                          <Button type="button" variant="outline" size="icon" onClick={() => handleDelete(record)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">No shift business reports found for this month.</td></tr>
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
                  <CardTitle className="flex items-center gap-2 text-xl"><Plus className="h-5 w-5" />{editingId ? "Edit Shift Business Report" : "Add Shift Business Report"}</CardTitle>
                  <p className="mt-1 text-sm text-white/80">Executive monthly report for risks, trends, improvements and management decisions.</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={closeModal} disabled={saving} className="text-white hover:bg-white/20 hover:text-white"><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>

            <CardContent className="max-h-[calc(92vh-96px)] overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-8">
                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Report Governance Details</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Record month *</FieldLabel><input type="month" value={form.record_month} onChange={(event) => setFormValue("record_month", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Shift</FieldLabel><Select value={form.shift_type} onValueChange={(value) => setFormValue("shift_type", value as ShiftType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SHIFT_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                      <div><FieldLabel>Accountable Incharge *</FieldLabel><input value={form.accountable_incharge} onChange={(event) => setFormValue("accountable_incharge", event.target.value)} placeholder="Shift Incharge name" className={inputClassName()} /></div>
                      <div><FieldLabel>Report Status</FieldLabel><Select value={form.report_status} onValueChange={(value) => setFormValue("report_status", value as ReportStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REPORT_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                      <div><FieldLabel>Submission Date</FieldLabel><input type="date" value={form.submission_date} onChange={(event) => setFormValue("submission_date", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Submitted On Time</FieldLabel><Select value={form.report_submitted_on_time} onValueChange={(value) => setFormValue("report_submitted_on_time", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Closing Date</FieldLabel><input type="date" value={form.closing_date} onChange={(event) => setFormValue("closing_date", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Deadline Date</FieldLabel><input type="date" value={form.deadline_date} onChange={(event) => setFormValue("deadline_date", event.target.value)} className={inputClassName()} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Executive Report Sections</h3></div>
                    <div className="grid gap-4">
                      <div><FieldLabel>Monthly Shift Summary *</FieldLabel><textarea value={form.monthly_shift_summary} onChange={(event) => setFormValue("monthly_shift_summary", event.target.value)} placeholder="Executive monthly summary. Do not write daily operational logs." className={textareaClassName()} /></div>
                      <div><FieldLabel>Key Risks *</FieldLabel><textarea value={form.key_risks_summary} onChange={(event) => setFormValue("key_risks_summary", event.target.value)} placeholder="Key risks highlighted for management." className={textareaClassName()} /></div>
                      <div><FieldLabel>Trends *</FieldLabel><textarea value={form.trends_summary} onChange={(event) => setFormValue("trends_summary", event.target.value)} placeholder="Trends in escalation, compliance, capacity, target accuracy or stability." className={textareaClassName()} /></div>
                      <div><FieldLabel>Target Performance *</FieldLabel><textarea value={form.target_performance} onChange={(event) => setFormValue("target_performance", event.target.value)} placeholder="Target achievement, missed targets and forecast vs actual performance." className={textareaClassName()} /></div>
                      <div><FieldLabel>Capacity Forecast *</FieldLabel><textarea value={form.capacity_forecast} onChange={(event) => setFormValue("capacity_forecast", event.target.value)} placeholder="Student load, tutor capacity, capacity gaps and advance hiring needs." className={textareaClassName()} /></div>
                      <div><FieldLabel>Compliance Status *</FieldLabel><textarea value={form.compliance_status} onChange={(event) => setFormValue("compliance_status", event.target.value)} placeholder="Compliance checks, breaches, corrected risks and unresolved risks." className={textareaClassName()} /></div>
                      <div><FieldLabel>Process Improvements *</FieldLabel><textarea value={form.process_improvements} onChange={(event) => setFormValue("process_improvements", event.target.value)} placeholder="Improvement suggestions, approvals, implementations and adoption status." className={textareaClassName()} /></div>
                      <div><FieldLabel>Decisions Required *</FieldLabel><textarea value={form.decisions_required_summary} onChange={(event) => setFormValue("decisions_required_summary", event.target.value)} placeholder="Clear decisions required from management. Keep this count-based and actionable." className={textareaClassName()} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><Gauge className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Executive Counts</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Key Risks Highlighted</FieldLabel><input type="number" min="0" value={form.key_risks_highlighted} onChange={(event) => setFormValue("key_risks_highlighted", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Decisions Required Count</FieldLabel><input type="number" min="0" value={form.decisions_required_count} onChange={(event) => setFormValue("decisions_required_count", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Pending Actions Count</FieldLabel><input type="number" min="0" value={form.pending_actions_count} onChange={(event) => setFormValue("pending_actions_count", event.target.value)} className={inputClassName()} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Governance Confirmations</h3></div>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div><FieldLabel>No Narratives</FieldLabel><Select value={form.no_narratives_confirmed} onValueChange={(value) => setFormValue("no_narratives_confirmed", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>No Assumptions</FieldLabel><Select value={form.no_assumptions_confirmed} onValueChange={(value) => setFormValue("no_assumptions_confirmed", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>One Accountable</FieldLabel><Select value={form.one_incharge_accountable} onValueChange={(value) => setFormValue("one_incharge_accountable", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Shift Separate</FieldLabel><Select value={form.morning_night_separate} onValueChange={(value) => setFormValue("morning_night_separate", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4"><FieldLabel>Notes</FieldLabel><textarea value={form.notes} onChange={(event) => setFormValue("notes", event.target.value)} placeholder="Optional executive notes only. Avoid daily logs." className={textareaClassName()} /></div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-5 w-5 text-indigo-600" />Report Preview</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Report</p><p className="font-semibold">{form.shift_type} Shift — {getMonthLabel(form.record_month)}</p></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold">{form.report_status}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">On Time</p><p className="font-semibold">{form.report_submitted_on_time === "yes" ? "Yes" : "No"}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Risks</p><p className="font-semibold">{form.key_risks_highlighted}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Decisions</p><p className="font-semibold">{form.decisions_required_count}</p></div>
                      </div>
                      {(form.no_narratives_confirmed === "no" || form.no_assumptions_confirmed === "no" || form.one_incharge_accountable === "no") && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">This report needs correction because it does not meet governance rules.</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-card">
                    <CardHeader><CardTitle className="text-base">This Page Tracks</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-2"><FileText className="mt-0.5 h-4 w-4 text-indigo-600" />Monthly shift summary and executive view.</div>
                      <div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-indigo-600" />Key risks and trends.</div>
                      <div className="flex gap-2"><Target className="mt-0.5 h-4 w-4 text-indigo-600" />Target performance and capacity forecast.</div>
                      <div className="flex gap-2"><ClipboardCheck className="mt-0.5 h-4 w-4 text-indigo-600" />Decisions required from management.</div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? "Update Report" : "Save Report"}</Button>
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
