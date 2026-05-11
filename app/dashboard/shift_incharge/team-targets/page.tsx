// app/dashboard/shift-incharge/team-targets/page.tsx
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
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Edit3,
  FileText,
  Filter,
  Gauge,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  TrendingUp,
  UserCheck,
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

type PageTab = "team_guidance" | "performance_issues" | "shift_targets" | "target_review";
type IssueType = "Team Guidance" | "Performance Issue" | "Shift Target" | "Target Review";
type StaffRole = "Tutor" | "Support Staff" | "Coordinator" | "Team Lead" | "Other";
type TargetStatus = "Not Started" | "In Progress" | "Achieved" | "Missed" | "Adjusted" | "Reviewed";
type IssueTypeFilter = "all" | IssueType;
type TargetStatusFilter = "all" | TargetStatus;
type RoleFilter = "all" | StaffRole;

type TeamTargetRecord = {
  id: string;
  record_month: string;
  team_staff: string;
  staff_role: StaffRole;
  issue_type: IssueType;
  guidance_given: string;
  correction_issued: boolean | null;
  target_assigned: string | null;
  target_status: TargetStatus;
  repeat_issue: boolean | null;
  intervention_required: boolean | null;
  root_cause_identified: boolean | null;
  root_cause: string | null;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type TeamTargetForm = {
  record_month: string;
  team_staff: string;
  staff_role: StaffRole;
  issue_type: IssueType;
  guidance_given: string;
  correction_issued: "yes" | "no";
  target_assigned: string;
  target_status: TargetStatus;
  repeat_issue: "yes" | "no";
  intervention_required: "yes" | "no";
  root_cause_identified: "yes" | "no";
  root_cause: string;
  review_date: string;
  notes: string;
};

const ISSUE_TYPES: IssueType[] = ["Team Guidance", "Performance Issue", "Shift Target", "Target Review"];
const STAFF_ROLES: StaffRole[] = ["Tutor", "Support Staff", "Coordinator", "Team Lead", "Other"];
const TARGET_STATUSES: TargetStatus[] = ["Not Started", "In Progress", "Achieved", "Missed", "Adjusted", "Reviewed"];
const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"];

const TAB_CONFIG: Array<{ key: PageTab; label: string; description: string; icon: ElementType }> = [
  {
    key: "team_guidance",
    label: "Team Guidance",
    description: "Guidance sessions for tutors, support staff and coordinators.",
    icon: UserCheck,
  },
  {
    key: "performance_issues",
    label: "Performance Issues",
    description: "Corrections, repeat issues and teams that need intervention.",
    icon: AlertTriangle,
  },
  {
    key: "shift_targets",
    label: "Shift Targets",
    description: "Short-term shift targets aligned with company goals.",
    icon: Target,
  },
  {
    key: "target_review",
    label: "Target Review",
    description: "Achieved, missed, adjusted and reviewed targets with root causes.",
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

function emptyForm(): TeamTargetForm {
  return {
    record_month: getCurrentMonth(),
    team_staff: "",
    staff_role: "Tutor",
    issue_type: "Team Guidance",
    guidance_given: "",
    correction_issued: "no",
    target_assigned: "",
    target_status: "Not Started",
    repeat_issue: "no",
    intervention_required: "no",
    root_cause_identified: "no",
    root_cause: "",
    review_date: "",
    notes: "",
  };
}

function recordToForm(record: TeamTargetRecord): TeamTargetForm {
  return {
    record_month: record.record_month || getCurrentMonth(),
    team_staff: record.team_staff || "",
    staff_role: record.staff_role || "Tutor",
    issue_type: record.issue_type || "Team Guidance",
    guidance_given: record.guidance_given || "",
    correction_issued: record.correction_issued ? "yes" : "no",
    target_assigned: record.target_assigned || "",
    target_status: record.target_status || "Not Started",
    repeat_issue: record.repeat_issue ? "yes" : "no",
    intervention_required: record.intervention_required ? "yes" : "no",
    root_cause_identified: record.root_cause_identified ? "yes" : "no",
    root_cause: record.root_cause || "",
    review_date: record.review_date || "",
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
          : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
      }`}
    >
      {active ? yesText : noText}
    </span>
  );
}

function IssueTypeBadge({ type }: { type: IssueType }) {
  const config = {
    "Team Guidance": "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
    "Performance Issue": "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    "Shift Target": "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
    "Target Review": "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  } satisfies Record<IssueType, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[type]}`}>{type}</span>;
}

function TargetStatusBadge({ status }: { status: TargetStatus }) {
  const config = {
    "Not Started": "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
    "In Progress": "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
    Achieved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Missed: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    Adjusted: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    Reviewed: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  } satisfies Record<TargetStatus, string>;

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

function getTabMatch(record: TeamTargetRecord, activeTab: PageTab) {
  if (activeTab === "team_guidance") return record.issue_type === "Team Guidance";
  if (activeTab === "performance_issues") {
    return record.issue_type === "Performance Issue" || record.correction_issued === true || record.repeat_issue === true || record.intervention_required === true;
  }
  if (activeTab === "shift_targets") return record.issue_type === "Shift Target" || Boolean(record.target_assigned);
  return record.issue_type === "Target Review" || ["Achieved", "Missed", "Adjusted", "Reviewed"].includes(record.target_status) || record.root_cause_identified === true;
}

function getPerformanceHealthScore(records: TeamTargetRecord[]) {
  if (!records.length) return 100;

  const corrections = records.filter((record) => record.correction_issued).length;
  const repeats = records.filter((record) => record.repeat_issue).length;
  const interventions = records.filter((record) => record.intervention_required).length;
  const missed = records.filter((record) => record.target_status === "Missed").length;
  const achieved = records.filter((record) => record.target_status === "Achieved").length;

  const penalty = corrections * 4 + repeats * 8 + interventions * 10 + missed * 6;
  const bonus = achieved * 3;
  return Math.max(0, Math.min(100, Math.round(100 - penalty + bonus)));
}

export default function ShiftInchargeTeamTargetsPage() {
  const [records, setRecords] = useState<TeamTargetRecord[]>([]);
  const [form, setForm] = useState<TeamTargetForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState<PageTab>("team_guidance");
  const [issueTypeFilter, setIssueTypeFilter] = useState<IssueTypeFilter>("all");
  const [targetStatusFilter, setTargetStatusFilter] = useState<TargetStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("shift_team_targets_records")
        .select("*")
        .order("record_month", { ascending: false })
        .order("created_at", { ascending: false });

      if (response.error) throw new Error(response.error.message);

      setRecords((response.data || []) as TeamTargetRecord[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(
          error,
          "Could not load team performance and target records. Please check the shift_team_targets_records Supabase table."
        ),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel("shift-team-targets-records-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_team_targets_records" },
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

  const guidanceSessionsConducted = monthRecords.filter((record) => record.issue_type === "Team Guidance" || record.guidance_given.trim()).length;
  const performanceCorrectionsIssued = monthRecords.filter((record) => record.correction_issued === true).length;
  const repeatPerformanceIssues = monthRecords.filter((record) => record.repeat_issue === true).length;
  const teamsRequiringIntervention = monthRecords.filter((record) => record.intervention_required === true).length;

  const shiftTargetsSet = monthRecords.filter((record) => Boolean(record.target_assigned && record.target_assigned.trim())).length;
  const targetsAchieved = monthRecords.filter((record) => record.target_status === "Achieved").length;
  const targetsMissed = monthRecords.filter((record) => record.target_status === "Missed").length;
  const rootCausesIdentified = monthRecords.filter((record) => record.root_cause_identified === true || Boolean(record.root_cause && record.root_cause.trim())).length;

  const targetAchievementRate = shiftTargetsSet > 0 ? Math.round((targetsAchieved / shiftTargetsSet) * 100) : 0;
  const performanceHealthScore = getPerformanceHealthScore(monthRecords);

  const roleData = STAFF_ROLES.map((role) => ({
    name: role,
    value: monthRecords.filter((record) => record.staff_role === role).length,
  })).filter((item) => item.value > 0);

  const issueTypeData = ISSUE_TYPES.map((type) => ({
    name: type,
    value: monthRecords.filter((record) => record.issue_type === type).length,
  })).filter((item) => item.value > 0);

  const targetStatusData = TARGET_STATUSES.map((status) => ({
    name: status,
    value: monthRecords.filter((record) => record.target_status === status).length,
  })).filter((item) => item.value > 0);

  const guidanceVsCorrectionData = [
    { name: "Guidance", value: guidanceSessionsConducted },
    { name: "Corrections", value: performanceCorrectionsIssued },
    { name: "Repeat Issues", value: repeatPerformanceIssues },
    { name: "Interventions", value: teamsRequiringIntervention },
  ];

  const targetReviewData = [
    { name: "Targets Set", value: shiftTargetsSet },
    { name: "Achieved", value: targetsAchieved },
    { name: "Missed", value: targetsMissed },
    { name: "Root Causes", value: rootCausesIdentified },
  ];

  const monthlyTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const monthData = records.filter((record) => record.record_month === month);
      return {
        month: getMonthLabel(month),
        guidance: monthData.filter((record) => record.issue_type === "Team Guidance" || record.guidance_given.trim()).length,
        corrections: monthData.filter((record) => record.correction_issued === true).length,
        targetsSet: monthData.filter((record) => Boolean(record.target_assigned && record.target_assigned.trim())).length,
        achieved: monthData.filter((record) => record.target_status === "Achieved").length,
        missed: monthData.filter((record) => record.target_status === "Missed").length,
      };
    });
  }, [records, selectedMonth]);

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records
      .filter((record) => record.record_month === selectedMonth)
      .filter((record) => getTabMatch(record, activeTab))
      .filter((record) => issueTypeFilter === "all" || record.issue_type === issueTypeFilter)
      .filter((record) => targetStatusFilter === "all" || record.target_status === targetStatusFilter)
      .filter((record) => roleFilter === "all" || record.staff_role === roleFilter)
      .filter((record) => {
        if (!query) return true;
        return [
          record.team_staff,
          record.staff_role,
          record.issue_type,
          record.guidance_given,
          record.target_assigned || "",
          record.target_status,
          record.root_cause || "",
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        if (a.intervention_required !== b.intervention_required) return a.intervention_required ? -1 : 1;
        if (a.repeat_issue !== b.repeat_issue) return a.repeat_issue ? -1 : 1;
        return new Date(a.review_date || "2999-12-31").getTime() - new Date(b.review_date || "2999-12-31").getTime();
      });
  }, [records, selectedMonth, activeTab, issueTypeFilter, targetStatusFilter, roleFilter, searchQuery]);

  const insights = useMemo(() => {
    const output = [];

    if (monthRecords.length === 0) {
      output.push("No team performance or target records are available for this month. Add guidance, performance issue or target records to activate shift review tracking.");
    }

    if (repeatPerformanceIssues > 0) {
      output.push(`${repeatPerformanceIssues} repeat performance issue(s) are recorded. Treat these as coaching/system gaps rather than one-time mistakes.`);
    }

    if (teamsRequiringIntervention > 0) {
      output.push(`${teamsRequiringIntervention} team/staff record(s) require intervention. Review them first in the records table.`);
    }

    if (targetsMissed > 0) {
      output.push(`${targetsMissed} target(s) were missed. Make sure root causes are identified before setting the next target cycle.`);
    }

    if (shiftTargetsSet > 0 && targetAchievementRate < 70) {
      output.push(`Target achievement is ${targetAchievementRate}%. Review whether targets are realistic, clearly assigned and supported by guidance.`);
    }

    if (rootCausesIdentified < targetsMissed && targetsMissed > 0) {
      output.push("Some missed targets do not have root causes identified. Add root-cause notes for better management reporting.");
    }

    if (performanceHealthScore < 70 && monthRecords.length > 0) {
      output.push("Team performance health is low. Focus on repeated issues, intervention cases and missed targets.");
    }

    if (!output.length) {
      output.push("Team guidance, performance correction and target review look stable this month. Continue monitoring repeat issues and target achievement.");
    }

    return output;
  }, [
    monthRecords.length,
    repeatPerformanceIssues,
    teamsRequiringIntervention,
    targetsMissed,
    shiftTargetsSet,
    targetAchievementRate,
    rootCausesIdentified,
    performanceHealthScore,
  ]);

  function setFormValue<K extends keyof TeamTargetForm>(key: K, value: TeamTargetForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm({ ...emptyForm(), record_month: selectedMonth });
    setIsModalOpen(true);
    setMessage(null);
  }

  function openEditModal(record: TeamTargetRecord) {
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
      team_staff: form.team_staff.trim(),
      staff_role: form.staff_role,
      issue_type: form.issue_type,
      guidance_given: form.guidance_given.trim(),
      correction_issued: form.correction_issued === "yes",
      target_assigned: form.target_assigned.trim() || null,
      target_status: form.target_status,
      repeat_issue: form.repeat_issue === "yes",
      intervention_required: form.intervention_required === "yes",
      root_cause_identified: form.root_cause_identified === "yes",
      root_cause: form.root_cause.trim() || null,
      review_date: form.review_date || null,
      notes: form.notes.trim() || null,
    };
  }

  function validateForm() {
    if (!form.record_month) return "Please select record month.";
    if (!form.team_staff.trim()) return "Please enter team / staff name.";
    if (!form.guidance_given.trim()) return "Please enter guidance given.";
    if (form.root_cause_identified === "yes" && !form.root_cause.trim()) return "Please enter root cause details.";
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
        ? await supabase.from("shift_team_targets_records").update(payload).eq("id", editingId).select().single()
        : await supabase.from("shift_team_targets_records").insert(payload).select().single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId ? "Team performance and target record updated successfully." : "Team performance and target record added successfully.",
      });
      closeModal();
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save this team performance and target record.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleTargetStatusChange(record: TeamTargetRecord, targetStatus: TargetStatus) {
    try {
      setMessage(null);
      const response = await supabase.from("shift_team_targets_records").update({ target_status: targetStatus }).eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: `${record.team_staff} marked as ${targetStatus}.` });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not update target status.") });
    }
  }

  async function handleDelete(record: TeamTargetRecord) {
    const confirmed = window.confirm(`Delete record for ${record.team_staff}?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const response = await supabase.from("shift_team_targets_records").delete().eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: "Team performance and target record deleted." });
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
          <p className="text-sm text-muted-foreground">Loading team performance and target records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Performance & Target Review</h1>
          <p className="text-muted-foreground">
            Combined shift page for team guidance, performance correction, short-term target setting and target review.
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

      <SectionTitle icon={Gauge} title="Team & Target Performance Snapshot" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Guidance Sessions Conducted" value={formatNumber(guidanceSessionsConducted)} icon={UserCheck} subtitle="Guidance given to tutors/support/coordinators" color="indigo" />
        <MetricCard title="Performance Corrections Issued" value={formatNumber(performanceCorrectionsIssued)} icon={ClipboardCheck} subtitle="Corrections issued for performance gaps" color={performanceCorrectionsIssued > 0 ? "amber" : "emerald"} />
        <MetricCard title="Repeat Performance Issues" value={formatNumber(repeatPerformanceIssues)} icon={RefreshCw} subtitle="Recurring behavior or output issues" color={repeatPerformanceIssues > 0 ? "red" : "emerald"} />
        <MetricCard title="Teams Requiring Intervention" value={formatNumber(teamsRequiringIntervention)} icon={AlertTriangle} subtitle="Need shift-level active intervention" color={teamsRequiringIntervention > 0 ? "red" : "emerald"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Shift Targets Set" value={formatNumber(shiftTargetsSet)} icon={Target} subtitle="Short-term shift targets assigned" color="sky" />
        <MetricCard title="Targets Achieved" value={formatNumber(targetsAchieved)} icon={CheckCircle2} subtitle="Targets completed successfully" color="emerald" />
        <MetricCard title="Targets Missed" value={formatNumber(targetsMissed)} icon={AlertCircle} subtitle="Targets not achieved" color={targetsMissed > 0 ? "red" : "emerald"} />
        <MetricCard title="Root Causes Identified" value={formatNumber(rootCausesIdentified)} icon={FileText} subtitle="Count-based root cause tracking" color="violet" />
        <MetricCard title="Achievement Rate" value={`${targetAchievementRate}%`} icon={TrendingUp} subtitle="Achieved targets / targets set" color={targetAchievementRate >= 80 ? "emerald" : targetAchievementRate >= 60 ? "amber" : "red"} />
      </div>

      <MetricCard title="Performance Health Score" value={`${performanceHealthScore}%`} icon={Gauge} subtitle="Based on corrections, repeats, interventions and missed targets" color={performanceHealthScore >= 80 ? "emerald" : performanceHealthScore >= 60 ? "amber" : "red"} />

      <SectionTitle icon={BarChart3} title="Charts & Performance Analytics" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Guidance vs Performance Corrections</CardTitle>
            <p className="text-sm text-muted-foreground">Guidance sessions, corrections, repeat issues and interventions.</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={guidanceVsCorrectionData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
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
          <CardHeader>
            <CardTitle className="text-base">Target Review Summary</CardTitle>
            <p className="text-sm text-muted-foreground">Targets set, achieved, missed and root causes identified.</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={targetReviewData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Count"]} />
                <Bar dataKey="value" name="Count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Issue Type Split</CardTitle>
            <p className="text-sm text-muted-foreground">Team guidance, performance issues, shift targets and target reviews.</p>
          </CardHeader>
          <CardContent className="h-80">
            {issueTypeData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={issueTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {issueTypeData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Records"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No issue type data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Target Status Split</CardTitle>
            <p className="text-sm text-muted-foreground">Target progress and review status.</p>
          </CardHeader>
          <CardContent className="h-80">
            {targetStatusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={targetStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {targetStatusData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Records"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No target status data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Team Role Load</CardTitle>
            <p className="text-sm text-muted-foreground">Records by tutor, support staff, coordinator and team lead.</p>
          </CardHeader>
          <CardContent className="h-80">
            {roleData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Records"]} />
                  <Bar dataKey="value" name="Records" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No role data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">6-Month Performance & Target Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Guidance, corrections, targets set, achieved and missed.</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Line type="monotone" dataKey="guidance" name="Guidance" stroke="#4f46e5" strokeWidth={2.5} />
                <Line type="monotone" dataKey="corrections" name="Corrections" stroke="#ef4444" strokeWidth={2.5} />
                <Line type="monotone" dataKey="targetsSet" name="Targets Set" stroke="#06b6d4" strokeWidth={2.5} />
                <Line type="monotone" dataKey="achieved" name="Achieved" stroke="#10b981" strokeWidth={2.5} />
                <Line type="monotone" dataKey="missed" name="Missed" stroke="#f59e0b" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={AlertTriangle} title="Automated Team & Target Insights" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Smart Performance Notes</CardTitle>
            <p className="text-sm text-muted-foreground">Automatic alerts for repeat issues, interventions, missed targets and missing root causes.</p>
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
              "Team guidance tab",
              "Performance issues tab",
              "Shift targets tab",
              "Target review tab",
              "Correction tracking",
              "Repeat issue tracking",
              "Root-cause count tracking",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Filter} title="Team Performance & Target Records" />
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
              <CardTitle className="text-base">Search, filter and manage team/target records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleRecords.length)} of {formatNumber(monthRecords.length)} records for {getMonthLabel(selectedMonth)}.
              </p>
            </div>
            <Button onClick={openAddModal} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <FieldLabel>Issue Type</FieldLabel>
              <Select value={issueTypeFilter} onValueChange={(value) => setIssueTypeFilter(value as IssueTypeFilter)}>
                <SelectTrigger><SelectValue placeholder="Issue type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All issue types</SelectItem>
                  {ISSUE_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Target Status</FieldLabel>
              <Select value={targetStatusFilter} onValueChange={(value) => setTargetStatusFilter(value as TargetStatusFilter)}>
                <SelectTrigger><SelectValue placeholder="Target status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {TARGET_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Role</FieldLabel>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {STAFF_ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search staff, guidance, target..." className={inputClassName("pl-9")} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Team / Staff</th>
                  <th className="px-4 py-3 font-semibold">Issue Type</th>
                  <th className="px-4 py-3 font-semibold">Guidance Given</th>
                  <th className="px-4 py-3 font-semibold">Correction Issued</th>
                  <th className="px-4 py-3 font-semibold">Target Assigned</th>
                  <th className="px-4 py-3 font-semibold">Target Status</th>
                  <th className="px-4 py-3 font-semibold">Repeat Issue</th>
                  <th className="px-4 py-3 font-semibold">Intervention Required</th>
                  <th className="px-4 py-3 font-semibold">Review Date</th>
                  <th className="px-4 py-3 font-semibold">Root Cause</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{record.team_staff}</div>
                        <div className="text-xs text-muted-foreground">{record.staff_role}</div>
                      </td>
                      <td className="px-4 py-3"><IssueTypeBadge type={record.issue_type} /></td>
                      <td className="px-4 py-3 max-w-[300px] truncate" title={record.guidance_given}>{record.guidance_given}</td>
                      <td className="px-4 py-3"><YesNoBadge value={record.correction_issued} yesText="Issued" noText="No" /></td>
                      <td className="px-4 py-3 max-w-[260px] truncate" title={record.target_assigned || ""}>{record.target_assigned || "—"}</td>
                      <td className="px-4 py-3"><TargetStatusBadge status={record.target_status} /></td>
                      <td className="px-4 py-3"><YesNoBadge value={record.repeat_issue} yesText="Yes" noText="No" /></td>
                      <td className="px-4 py-3"><YesNoBadge value={record.intervention_required} yesText="Required" noText="No" /></td>
                      <td className="px-4 py-3">{record.review_date || "—"}</td>
                      <td className="px-4 py-3 max-w-[260px] truncate" title={record.root_cause || ""}>{record.root_cause || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(record)}>
                            <Edit3 className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          {record.target_status !== "Achieved" && (
                            <Button type="button" variant="outline" size="sm" onClick={() => handleTargetStatusChange(record, "Achieved")}>Achieve</Button>
                          )}
                          {record.target_status !== "Missed" && (
                            <Button type="button" variant="outline" size="sm" onClick={() => handleTargetStatusChange(record, "Missed")}>Miss</Button>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
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
                    {editingId ? "Edit Team Performance & Target Record" : "Add Team Performance & Target Record"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-white/80">
                    Add guidance, performance corrections, shift targets and target review in one place.
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
                      <Users className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Team / Staff Details</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Record month *</FieldLabel>
                        <input type="month" value={form.record_month} onChange={(event) => setFormValue("record_month", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Team / Staff *</FieldLabel>
                        <input value={form.team_staff} onChange={(event) => setFormValue("team_staff", event.target.value)} placeholder="Tutor A / Support Team / Coordinator" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Role</FieldLabel>
                        <Select value={form.staff_role} onValueChange={(value) => setFormValue("staff_role", value as StaffRole)}>
                          <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                          <SelectContent>{STAFF_ROLES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Issue Type</FieldLabel>
                        <Select value={form.issue_type} onValueChange={(value) => setFormValue("issue_type", value as IssueType)}>
                          <SelectTrigger><SelectValue placeholder="Issue type" /></SelectTrigger>
                          <SelectContent>{ISSUE_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Guidance & Performance Correction</h3>
                    </div>
                    <div className="grid gap-4">
                      <div>
                        <FieldLabel>Guidance Given *</FieldLabel>
                        <textarea value={form.guidance_given} onChange={(event) => setFormValue("guidance_given", event.target.value)} placeholder="What guidance was given to the tutor/support staff/coordinator?" className={textareaClassName()} />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <FieldLabel>Correction Issued</FieldLabel>
                          <Select value={form.correction_issued} onValueChange={(value) => setFormValue("correction_issued", value as "yes" | "no")}>
                            <SelectTrigger><SelectValue placeholder="Correction" /></SelectTrigger>
                            <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div>
                          <FieldLabel>Repeat Issue</FieldLabel>
                          <Select value={form.repeat_issue} onValueChange={(value) => setFormValue("repeat_issue", value as "yes" | "no")}>
                            <SelectTrigger><SelectValue placeholder="Repeat issue" /></SelectTrigger>
                            <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div>
                          <FieldLabel>Intervention Required</FieldLabel>
                          <Select value={form.intervention_required} onValueChange={(value) => setFormValue("intervention_required", value as "yes" | "no")}>
                            <SelectTrigger><SelectValue placeholder="Intervention" /></SelectTrigger>
                            <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Target Setting & Review</h3>
                    </div>
                    <div className="grid gap-4">
                      <div>
                        <FieldLabel>Target Assigned</FieldLabel>
                        <textarea value={form.target_assigned} onChange={(event) => setFormValue("target_assigned", event.target.value)} placeholder="What target was assigned to this staff/team?" className={textareaClassName()} />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <FieldLabel>Target Status</FieldLabel>
                          <Select value={form.target_status} onValueChange={(value) => setFormValue("target_status", value as TargetStatus)}>
                            <SelectTrigger><SelectValue placeholder="Target status" /></SelectTrigger>
                            <SelectContent>{TARGET_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <FieldLabel>Review Date</FieldLabel>
                          <input type="date" value={form.review_date} onChange={(event) => setFormValue("review_date", event.target.value)} className={inputClassName()} />
                        </div>
                        <div>
                          <FieldLabel>Root Cause Identified</FieldLabel>
                          <Select value={form.root_cause_identified} onValueChange={(value) => setFormValue("root_cause_identified", value as "yes" | "no")}>
                            <SelectTrigger><SelectValue placeholder="Root cause" /></SelectTrigger>
                            <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Root Cause</FieldLabel>
                        <textarea value={form.root_cause} onChange={(event) => setFormValue("root_cause", event.target.value)} placeholder="If target was missed or performance issue repeated, write the root cause." className={textareaClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <FieldLabel>Notes</FieldLabel>
                    <textarea value={form.notes} onChange={(event) => setFormValue("notes", event.target.value)} placeholder="Add additional shift review notes, next action, coaching requirement or management recommendation..." className={textareaClassName()} />
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ClipboardList className="h-5 w-5 text-indigo-600" />
                        Record Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                        <p className="text-xs text-muted-foreground">Team / Staff</p>
                        <p className="font-semibold">{form.team_staff || "New team record"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Role</p>
                          <p className="font-semibold">{form.staff_role}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Issue Type</p>
                          <p className="font-semibold">{form.issue_type}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Target Status</p>
                          <p className="font-semibold">{form.target_status}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Review Date</p>
                          <p className="font-semibold">{form.review_date || "Not set"}</p>
                        </div>
                      </div>
                      {(form.repeat_issue === "yes" || form.intervention_required === "yes" || form.target_status === "Missed") && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                          This record needs close review because it has a repeat issue, intervention requirement or missed target.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-card">
                    <CardHeader>
                      <CardTitle className="text-base">This Page Tracks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-2"><UserCheck className="mt-0.5 h-4 w-4 text-indigo-600" />Guidance sessions for tutors, support staff and coordinators.</div>
                      <div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-indigo-600" />Performance corrections, repeat issues and intervention cases.</div>
                      <div className="flex gap-2"><Target className="mt-0.5 h-4 w-4 text-indigo-600" />Shift targets set, achieved and missed.</div>
                      <div className="flex gap-2"><FileText className="mt-0.5 h-4 w-4 text-indigo-600" />Root causes identified for missed targets and repeated issues.</div>
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
