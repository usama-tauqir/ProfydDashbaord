// app/dashboard/shift-incharge/compliance-process/page.tsx
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
  Edit3,
  FileText,
  Filter,
  Gauge,
  GitBranch,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
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

type PageTab = "compliance_checks" | "process_issues" | "improvements" | "change_testing";
type RecordType = "Compliance Check" | "Process Issue" | "Improvement" | "Change Testing";
type ApprovalStatus = "Not Required" | "Pending" | "Approved" | "Rejected";
type ImplementationStatus = "Not Started" | "In Progress" | "Implemented" | "Blocked" | "Tested" | "Final Approved";
type RecordTypeFilter = "all" | RecordType;
type ApprovalFilter = "all" | ApprovalStatus;
type ImplementationFilter = "all" | ImplementationStatus;

type ComplianceProcessRecord = {
  id: string;
  record_month: string;
  type: RecordType;
  area: string;
  issue_flow_name: string;
  current_problem: string;
  suggested_improvement: string;
  approval_status: ApprovalStatus;
  implementation_status: ImplementationStatus;
  owner: string;
  review_date: string | null;

  compliance_breach: boolean | null;
  breach_corrected: boolean | null;
  unresolved_compliance_risk: boolean | null;

  process_issue_identified: boolean | null;
  improvement_suggested: boolean | null;
  improvement_approved: boolean | null;
  improvement_implemented: boolean | null;

  new_flow_tested: boolean | null;
  feedback_submitted: boolean | null;
  adjustment_recommended: boolean | null;
  final_flow_approved: boolean | null;

  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type ComplianceProcessForm = {
  record_month: string;
  type: RecordType;
  area: string;
  issue_flow_name: string;
  current_problem: string;
  suggested_improvement: string;
  approval_status: ApprovalStatus;
  implementation_status: ImplementationStatus;
  owner: string;
  review_date: string;

  compliance_breach: "yes" | "no";
  breach_corrected: "yes" | "no";
  unresolved_compliance_risk: "yes" | "no";

  process_issue_identified: "yes" | "no";
  improvement_suggested: "yes" | "no";
  improvement_approved: "yes" | "no";
  improvement_implemented: "yes" | "no";

  new_flow_tested: "yes" | "no";
  feedback_submitted: "yes" | "no";
  adjustment_recommended: "yes" | "no";
  final_flow_approved: "yes" | "no";

  notes: string;
};

const RECORD_TYPES: RecordType[] = ["Compliance Check", "Process Issue", "Improvement", "Change Testing"];
const APPROVAL_STATUSES: ApprovalStatus[] = ["Not Required", "Pending", "Approved", "Rejected"];
const IMPLEMENTATION_STATUSES: ImplementationStatus[] = ["Not Started", "In Progress", "Implemented", "Blocked", "Tested", "Final Approved"];
const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"];

const TAB_CONFIG: Array<{ key: PageTab; label: string; description: string; icon: ElementType }> = [
  {
    key: "compliance_checks",
    label: "Compliance Checks",
    description: "SOP, policy and documentation checks performed by shift.",
    icon: ShieldCheck,
  },
  {
    key: "process_issues",
    label: "Process Issues",
    description: "Workflow friction, policy drift and flow breakdown points.",
    icon: AlertTriangle,
  },
  {
    key: "improvements",
    label: "Improvements",
    description: "Suggested, approved and implemented workflow improvements.",
    icon: Lightbulb,
  },
  {
    key: "change_testing",
    label: "Change Testing",
    description: "New flows tested, feedback submitted and final flows approved.",
    icon: GitBranch,
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

function emptyForm(): ComplianceProcessForm {
  return {
    record_month: getCurrentMonth(),
    type: "Compliance Check",
    area: "",
    issue_flow_name: "",
    current_problem: "",
    suggested_improvement: "",
    approval_status: "Not Required",
    implementation_status: "Not Started",
    owner: "",
    review_date: "",

    compliance_breach: "no",
    breach_corrected: "no",
    unresolved_compliance_risk: "no",

    process_issue_identified: "no",
    improvement_suggested: "no",
    improvement_approved: "no",
    improvement_implemented: "no",

    new_flow_tested: "no",
    feedback_submitted: "no",
    adjustment_recommended: "no",
    final_flow_approved: "no",

    notes: "",
  };
}

function recordToForm(record: ComplianceProcessRecord): ComplianceProcessForm {
  return {
    record_month: record.record_month || getCurrentMonth(),
    type: record.type || "Compliance Check",
    area: record.area || "",
    issue_flow_name: record.issue_flow_name || "",
    current_problem: record.current_problem || "",
    suggested_improvement: record.suggested_improvement || "",
    approval_status: record.approval_status || "Not Required",
    implementation_status: record.implementation_status || "Not Started",
    owner: record.owner || "",
    review_date: record.review_date || "",

    compliance_breach: record.compliance_breach ? "yes" : "no",
    breach_corrected: record.breach_corrected ? "yes" : "no",
    unresolved_compliance_risk: record.unresolved_compliance_risk ? "yes" : "no",

    process_issue_identified: record.process_issue_identified ? "yes" : "no",
    improvement_suggested: record.improvement_suggested ? "yes" : "no",
    improvement_approved: record.improvement_approved ? "yes" : "no",
    improvement_implemented: record.improvement_implemented ? "yes" : "no",

    new_flow_tested: record.new_flow_tested ? "yes" : "no",
    feedback_submitted: record.feedback_submitted ? "yes" : "no",
    adjustment_recommended: record.adjustment_recommended ? "yes" : "no",
    final_flow_approved: record.final_flow_approved ? "yes" : "no",

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

function TypeBadge({ type }: { type: RecordType }) {
  const config = {
    "Compliance Check": "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
    "Process Issue": "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    Improvement: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    "Change Testing": "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  } satisfies Record<RecordType, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[type]}`}>{type}</span>;
}

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const config = {
    "Not Required": "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
    Pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    Approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Rejected: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  } satisfies Record<ApprovalStatus, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[status]}`}>{status}</span>;
}

function ImplementationBadge({ status }: { status: ImplementationStatus }) {
  const config = {
    "Not Started": "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
    "In Progress": "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
    Implemented: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Blocked: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    Tested: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
    "Final Approved": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  } satisfies Record<ImplementationStatus, string>;

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

function getTabMatch(record: ComplianceProcessRecord, activeTab: PageTab) {
  if (activeTab === "compliance_checks") return record.type === "Compliance Check" || record.compliance_breach === true || record.unresolved_compliance_risk === true;
  if (activeTab === "process_issues") return record.type === "Process Issue" || record.process_issue_identified === true;
  if (activeTab === "improvements") return record.type === "Improvement" || record.improvement_suggested === true || record.improvement_approved === true || record.improvement_implemented === true;
  return record.type === "Change Testing" || record.new_flow_tested === true || record.feedback_submitted === true || record.adjustment_recommended === true || record.final_flow_approved === true;
}

function getSystemControlScore(records: ComplianceProcessRecord[]) {
  if (!records.length) return 100;

  const breaches = records.filter((record) => record.compliance_breach).length;
  const unresolved = records.filter((record) => record.unresolved_compliance_risk).length;
  const blocked = records.filter((record) => record.implementation_status === "Blocked").length;
  const rejected = records.filter((record) => record.approval_status === "Rejected").length;
  const implemented = records.filter((record) => record.improvement_implemented || record.final_flow_approved).length;

  const penalty = breaches * 6 + unresolved * 12 + blocked * 8 + rejected * 6;
  const bonus = implemented * 3;
  return Math.max(0, Math.min(100, Math.round(100 - penalty + bonus)));
}

export default function ShiftInchargeComplianceProcessPage() {
  const [records, setRecords] = useState<ComplianceProcessRecord[]>([]);
  const [form, setForm] = useState<ComplianceProcessForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState<PageTab>("compliance_checks");
  const [typeFilter, setTypeFilter] = useState<RecordTypeFilter>("all");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const [implementationFilter, setImplementationFilter] = useState<ImplementationFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("shift_compliance_process_records")
        .select("*")
        .order("record_month", { ascending: false })
        .order("created_at", { ascending: false });

      if (response.error) throw new Error(response.error.message);

      setRecords((response.data || []) as ComplianceProcessRecord[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(
          error,
          "Could not load compliance, process and change records. Please check the shift_compliance_process_records Supabase table."
        ),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel("shift-compliance-process-records-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_compliance_process_records" },
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

  const complianceChecksPerformed = monthRecords.filter((record) => record.type === "Compliance Check").length;
  const complianceBreachesIdentified = monthRecords.filter((record) => record.compliance_breach === true).length;
  const breachesCorrected = monthRecords.filter((record) => record.breach_corrected === true).length;
  const unresolvedComplianceRisks = monthRecords.filter((record) => record.unresolved_compliance_risk === true).length;

  const processIssuesIdentified = monthRecords.filter((record) => record.type === "Process Issue" || record.process_issue_identified === true).length;
  const improvementsSuggested = monthRecords.filter((record) => record.improvement_suggested === true || record.type === "Improvement").length;
  const improvementsApproved = monthRecords.filter((record) => record.improvement_approved === true || record.approval_status === "Approved").length;
  const improvementsImplemented = monthRecords.filter((record) => record.improvement_implemented === true || record.implementation_status === "Implemented").length;

  const newFlowsTested = monthRecords.filter((record) => record.new_flow_tested === true || record.type === "Change Testing" || record.implementation_status === "Tested").length;
  const feedbackSubmitted = monthRecords.filter((record) => record.feedback_submitted === true).length;
  const adjustmentsRecommended = monthRecords.filter((record) => record.adjustment_recommended === true).length;
  const finalFlowsApproved = monthRecords.filter((record) => record.final_flow_approved === true || record.implementation_status === "Final Approved").length;

  const systemControlScore = getSystemControlScore(monthRecords);

  const typeData = RECORD_TYPES.map((type) => ({
    name: type,
    value: monthRecords.filter((record) => record.type === type).length,
  })).filter((item) => item.value > 0);

  const approvalData = APPROVAL_STATUSES.map((status) => ({
    name: status,
    value: monthRecords.filter((record) => record.approval_status === status).length,
  })).filter((item) => item.value > 0);

  const implementationData = IMPLEMENTATION_STATUSES.map((status) => ({
    name: status,
    value: monthRecords.filter((record) => record.implementation_status === status).length,
  })).filter((item) => item.value > 0);

  const complianceData = [
    { name: "Checks", value: complianceChecksPerformed },
    { name: "Breaches", value: complianceBreachesIdentified },
    { name: "Corrected", value: breachesCorrected },
    { name: "Unresolved", value: unresolvedComplianceRisks },
  ];

  const improvementData = [
    { name: "Issues", value: processIssuesIdentified },
    { name: "Suggested", value: improvementsSuggested },
    { name: "Approved", value: improvementsApproved },
    { name: "Implemented", value: improvementsImplemented },
  ];

  const changeData = [
    { name: "Tested", value: newFlowsTested },
    { name: "Feedback", value: feedbackSubmitted },
    { name: "Adjustments", value: adjustmentsRecommended },
    { name: "Final Approved", value: finalFlowsApproved },
  ];

  const monthlyTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const monthData = records.filter((record) => record.record_month === month);
      return {
        month: getMonthLabel(month),
        checks: monthData.filter((record) => record.type === "Compliance Check").length,
        breaches: monthData.filter((record) => record.compliance_breach === true).length,
        processIssues: monthData.filter((record) => record.type === "Process Issue" || record.process_issue_identified === true).length,
        implemented: monthData.filter((record) => record.improvement_implemented === true || record.implementation_status === "Implemented").length,
        tested: monthData.filter((record) => record.new_flow_tested === true || record.type === "Change Testing").length,
      };
    });
  }, [records, selectedMonth]);

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records
      .filter((record) => record.record_month === selectedMonth)
      .filter((record) => getTabMatch(record, activeTab))
      .filter((record) => typeFilter === "all" || record.type === typeFilter)
      .filter((record) => approvalFilter === "all" || record.approval_status === approvalFilter)
      .filter((record) => implementationFilter === "all" || record.implementation_status === implementationFilter)
      .filter((record) => {
        if (!query) return true;
        return [
          record.type,
          record.area,
          record.issue_flow_name,
          record.current_problem,
          record.suggested_improvement,
          record.owner,
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const blockedA = a.implementation_status === "Blocked" || a.unresolved_compliance_risk === true;
        const blockedB = b.implementation_status === "Blocked" || b.unresolved_compliance_risk === true;
        if (blockedA !== blockedB) return blockedA ? -1 : 1;
        return new Date(a.review_date || "2999-12-31").getTime() - new Date(b.review_date || "2999-12-31").getTime();
      });
  }, [records, selectedMonth, activeTab, typeFilter, approvalFilter, implementationFilter, searchQuery]);

  const insights = useMemo(() => {
    const output = [];

    if (monthRecords.length === 0) {
      output.push("No compliance, process or change records are available for this month. Add compliance checks, process issues or change testing records to activate system tracking.");
    }

    if (complianceBreachesIdentified > breachesCorrected) {
      output.push(`${complianceBreachesIdentified - breachesCorrected} compliance breach(es) are not yet corrected. Prioritise these before month closing.`);
    }

    if (unresolvedComplianceRisks > 0) {
      output.push(`${unresolvedComplianceRisks} unresolved compliance risk(s) are active. These should be escalated if they cannot be resolved at shift level.`);
    }

    if (processIssuesIdentified > improvementsSuggested) {
      output.push(`${processIssuesIdentified - improvementsSuggested} process issue(s) do not yet have suggested improvements. Add improvement recommendations for scalability.`);
    }

    if (improvementsApproved > improvementsImplemented) {
      output.push(`${improvementsApproved - improvementsImplemented} approved improvement(s) are not yet implemented. Follow up with owners.`);
    }

    if (newFlowsTested > feedbackSubmitted) {
      output.push(`${newFlowsTested - feedbackSubmitted} tested flow(s) still need feedback submitted before rollout decision.`);
    }

    if (adjustmentsRecommended > finalFlowsApproved) {
      output.push(`${adjustmentsRecommended - finalFlowsApproved} adjustment recommendation(s) are pending final approval.`);
    }

    if (systemControlScore < 70 && monthRecords.length > 0) {
      output.push("System control score is weak. Focus on unresolved compliance risks, blocked implementations and uncorrected breaches.");
    }

    if (!output.length) {
      output.push("Compliance, workflow improvement and change testing look controlled this month. Continue monitoring policy drift and implementation status.");
    }

    return output;
  }, [
    monthRecords.length,
    complianceBreachesIdentified,
    breachesCorrected,
    unresolvedComplianceRisks,
    processIssuesIdentified,
    improvementsSuggested,
    improvementsApproved,
    improvementsImplemented,
    newFlowsTested,
    feedbackSubmitted,
    adjustmentsRecommended,
    finalFlowsApproved,
    systemControlScore,
  ]);

  function setFormValue<K extends keyof ComplianceProcessForm>(key: K, value: ComplianceProcessForm[K]) {
    setForm((previous) => {
      const next = { ...previous, [key]: value };

      if (key === "type") {
        if (value === "Compliance Check") {
          next.process_issue_identified = "no";
          next.new_flow_tested = "no";
        }
        if (value === "Process Issue") {
          next.process_issue_identified = "yes";
          next.improvement_suggested = next.suggested_improvement.trim() ? "yes" : next.improvement_suggested;
        }
        if (value === "Improvement") {
          next.improvement_suggested = "yes";
          next.approval_status = next.approval_status === "Not Required" ? "Pending" : next.approval_status;
        }
        if (value === "Change Testing") {
          next.new_flow_tested = "yes";
          next.implementation_status = next.implementation_status === "Not Started" ? "Tested" : next.implementation_status;
        }
      }

      if (key === "approval_status") {
        next.improvement_approved = value === "Approved" ? "yes" : next.improvement_approved;
      }

      if (key === "implementation_status") {
        next.improvement_implemented = value === "Implemented" || value === "Final Approved" ? "yes" : next.improvement_implemented;
        next.final_flow_approved = value === "Final Approved" ? "yes" : next.final_flow_approved;
        next.new_flow_tested = value === "Tested" || value === "Final Approved" ? "yes" : next.new_flow_tested;
      }

      return next;
    });
  }

  function openAddModal() {
    setEditingId(null);
    setForm({ ...emptyForm(), record_month: selectedMonth });
    setIsModalOpen(true);
    setMessage(null);
  }

  function openEditModal(record: ComplianceProcessRecord) {
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
      type: form.type,
      area: form.area.trim(),
      issue_flow_name: form.issue_flow_name.trim(),
      current_problem: form.current_problem.trim(),
      suggested_improvement: form.suggested_improvement.trim(),
      approval_status: form.approval_status,
      implementation_status: form.implementation_status,
      owner: form.owner.trim(),
      review_date: form.review_date || null,

      compliance_breach: form.compliance_breach === "yes",
      breach_corrected: form.breach_corrected === "yes",
      unresolved_compliance_risk: form.unresolved_compliance_risk === "yes",

      process_issue_identified: form.process_issue_identified === "yes",
      improvement_suggested: form.improvement_suggested === "yes",
      improvement_approved: form.improvement_approved === "yes",
      improvement_implemented: form.improvement_implemented === "yes",

      new_flow_tested: form.new_flow_tested === "yes",
      feedback_submitted: form.feedback_submitted === "yes",
      adjustment_recommended: form.adjustment_recommended === "yes",
      final_flow_approved: form.final_flow_approved === "yes",

      notes: form.notes.trim() || null,
    };
  }

  function validateForm() {
    if (!form.record_month) return "Please select record month.";
    if (!form.area.trim()) return "Please enter area.";
    if (!form.issue_flow_name.trim()) return "Please enter issue / flow name.";
    if (!form.current_problem.trim()) return "Please enter current problem.";
    if (!form.suggested_improvement.trim()) return "Please enter suggested improvement.";
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
        ? await supabase.from("shift_compliance_process_records").update(payload).eq("id", editingId).select().single()
        : await supabase.from("shift_compliance_process_records").insert(payload).select().single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId ? "Compliance/process record updated successfully." : "Compliance/process record added successfully.",
      });
      closeModal();
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save this compliance/process record.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleImplementationChange(record: ComplianceProcessRecord, implementationStatus: ImplementationStatus) {
    try {
      setMessage(null);
      const payload = {
        implementation_status: implementationStatus,
        improvement_implemented: implementationStatus === "Implemented" || implementationStatus === "Final Approved" ? true : record.improvement_implemented,
        final_flow_approved: implementationStatus === "Final Approved" ? true : record.final_flow_approved,
      };
      const response = await supabase.from("shift_compliance_process_records").update(payload).eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: `${record.issue_flow_name} marked as ${implementationStatus}.` });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not update implementation status.") });
    }
  }

  async function handleDelete(record: ComplianceProcessRecord) {
    const confirmed = window.confirm(`Delete record for ${record.issue_flow_name}?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const response = await supabase.from("shift_compliance_process_records").delete().eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: "Compliance/process record deleted." });
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
          <p className="text-sm text-muted-foreground">Loading compliance, process and change records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance, Process & Change Management</h1>
          <p className="text-muted-foreground">
            Combined shift page for SOP compliance, workflow improvement, scalability and change testing before rollout.
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
            <p className={message.type === "success" ? "text-sm text-emerald-700 dark:text-emerald-300" : "text-sm text-red-700 dark:text-red-300"}>
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      <SectionTitle icon={Gauge} title="System Control Snapshot" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Compliance Checks Performed" value={formatNumber(complianceChecksPerformed)} icon={ShieldCheck} subtitle="SOP, policy and workflow checks" color="indigo" />
        <MetricCard title="Compliance Breaches Identified" value={formatNumber(complianceBreachesIdentified)} icon={ShieldAlert} subtitle="Policy/SOP drift found" color={complianceBreachesIdentified > 0 ? "red" : "emerald"} />
        <MetricCard title="Breaches Corrected" value={formatNumber(breachesCorrected)} icon={CheckCircle2} subtitle="Breaches corrected at shift level" color="emerald" />
        <MetricCard title="Unresolved Compliance Risks" value={formatNumber(unresolvedComplianceRisks)} icon={AlertCircle} subtitle="Risks still open" color={unresolvedComplianceRisks > 0 ? "red" : "emerald"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Process Issues Identified" value={formatNumber(processIssuesIdentified)} icon={Workflow} subtitle="Friction points in current flow" color={processIssuesIdentified > 0 ? "amber" : "emerald"} />
        <MetricCard title="Improvements Suggested" value={formatNumber(improvementsSuggested)} icon={Lightbulb} subtitle="Workflow improvements proposed" color="sky" />
        <MetricCard title="Improvements Approved" value={formatNumber(improvementsApproved)} icon={ClipboardCheck} subtitle="Approved by owner/management" color="emerald" />
        <MetricCard title="Improvements Implemented" value={formatNumber(improvementsImplemented)} icon={Settings2} subtitle="Approved changes implemented" color="emerald" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="New Flows Tested" value={formatNumber(newFlowsTested)} icon={GitBranch} subtitle="Pilot/new flows validated" color="violet" />
        <MetricCard title="Feedback Submitted" value={formatNumber(feedbackSubmitted)} icon={FileText} subtitle="Shift feedback sent" color="sky" />
        <MetricCard title="Adjustments Recommended" value={formatNumber(adjustmentsRecommended)} icon={Sparkles} subtitle="Recommended flow changes" color="amber" />
        <MetricCard title="Final Flows Approved" value={formatNumber(finalFlowsApproved)} icon={CheckCircle2} subtitle="Final approved workflows" color="emerald" />
        <MetricCard title="System Control Score" value={`${systemControlScore}%`} icon={Gauge} subtitle="Higher score means stronger control" color={systemControlScore >= 80 ? "emerald" : systemControlScore >= 60 ? "amber" : "red"} />
      </div>

      <SectionTitle icon={BarChart3} title="Charts & System Analytics" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader><CardTitle className="text-base">Compliance Control Status</CardTitle><p className="text-sm text-muted-foreground">Checks, breaches, corrections and unresolved risks.</p></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
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
          <CardHeader><CardTitle className="text-base">Improvement Pipeline</CardTitle><p className="text-sm text-muted-foreground">Issues identified, suggestions, approvals and implementations.</p></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={improvementData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
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
          <CardHeader><CardTitle className="text-base">Change Testing Pipeline</CardTitle><p className="text-sm text-muted-foreground">New flows tested, feedback, adjustments and final approvals.</p></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={changeData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Count"]} />
                <Bar dataKey="value" name="Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader><CardTitle className="text-base">Record Type Split</CardTitle><p className="text-sm text-muted-foreground">Compliance checks, process issues, improvements and change testing.</p></CardHeader>
          <CardContent className="h-80">
            {typeData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {typeData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Records"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No type data yet.</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader><CardTitle className="text-base">Approval Status</CardTitle><p className="text-sm text-muted-foreground">Pending, approved, rejected and not-required approvals.</p></CardHeader>
          <CardContent className="h-80">
            {approvalData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={approvalData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {approvalData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Records"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No approval data yet.</div>}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader><CardTitle className="text-base">Implementation Status</CardTitle><p className="text-sm text-muted-foreground">Not started, in progress, implemented, blocked, tested and final approved.</p></CardHeader>
          <CardContent className="h-80">
            {implementationData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={implementationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {implementationData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Records"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No implementation data yet.</div>}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader><CardTitle className="text-base">6-Month System Control Trend</CardTitle><p className="text-sm text-muted-foreground">Compliance checks, breaches, process issues, implementations and tested flows.</p></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
              <Legend />
              <Line type="monotone" dataKey="checks" name="Checks" stroke="#4f46e5" strokeWidth={2.5} />
              <Line type="monotone" dataKey="breaches" name="Breaches" stroke="#ef4444" strokeWidth={2.5} />
              <Line type="monotone" dataKey="processIssues" name="Process Issues" stroke="#f59e0b" strokeWidth={2.5} />
              <Line type="monotone" dataKey="implemented" name="Implemented" stroke="#10b981" strokeWidth={2.5} />
              <Line type="monotone" dataKey="tested" name="Tested Flows" stroke="#8b5cf6" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle icon={ShieldAlert} title="Automated System Control Insights" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Smart System Notes</CardTitle><p className="text-sm text-muted-foreground">Automatic alerts for compliance risks, process issues, implementation gaps and change testing.</p></CardHeader>
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
          <CardHeader><CardTitle className="text-base">Page Includes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              "Compliance checks",
              "Process issues",
              "Workflow improvements",
              "Change testing",
              "Approval tracking",
              "Implementation tracking",
              "System control insights",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Filter} title="Compliance, Process & Change Records" />
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
              <CardTitle className="text-base">Search, filter and manage system records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleRecords.length)} of {formatNumber(monthRecords.length)} records for {getMonthLabel(selectedMonth)}.
              </p>
            </div>
            <Button onClick={openAddModal} size="sm"><Plus className="mr-2 h-4 w-4" />Add Record</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <FieldLabel>Type</FieldLabel>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as RecordTypeFilter)}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {RECORD_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Approval Status</FieldLabel>
              <Select value={approvalFilter} onValueChange={(value) => setApprovalFilter(value as ApprovalFilter)}>
                <SelectTrigger><SelectValue placeholder="Approval" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All approvals</SelectItem>
                  {APPROVAL_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Implementation Status</FieldLabel>
              <Select value={implementationFilter} onValueChange={(value) => setImplementationFilter(value as ImplementationFilter)}>
                <SelectTrigger><SelectValue placeholder="Implementation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {IMPLEMENTATION_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search area, flow, owner..." className={inputClassName("pl-9")} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1600px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Area</th>
                  <th className="px-4 py-3 font-semibold">Issue / Flow Name</th>
                  <th className="px-4 py-3 font-semibold">Current Problem</th>
                  <th className="px-4 py-3 font-semibold">Suggested Improvement</th>
                  <th className="px-4 py-3 font-semibold">Approval Status</th>
                  <th className="px-4 py-3 font-semibold">Implementation Status</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Review Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />Loading records…</td></tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3"><TypeBadge type={record.type} /></td>
                      <td className="px-4 py-3 font-medium">{record.area}</td>
                      <td className="px-4 py-3 font-semibold">{record.issue_flow_name}</td>
                      <td className="px-4 py-3 max-w-[300px] truncate" title={record.current_problem}>{record.current_problem}</td>
                      <td className="px-4 py-3 max-w-[320px] truncate" title={record.suggested_improvement}>{record.suggested_improvement}</td>
                      <td className="px-4 py-3"><ApprovalBadge status={record.approval_status} /></td>
                      <td className="px-4 py-3"><ImplementationBadge status={record.implementation_status} /></td>
                      <td className="px-4 py-3">{record.owner}</td>
                      <td className="px-4 py-3">{record.review_date || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(record)}><Edit3 className="mr-1 h-3.5 w-3.5" />Edit</Button>
                          {record.implementation_status !== "Implemented" && (
                            <Button type="button" variant="outline" size="sm" onClick={() => handleImplementationChange(record, "Implemented")}>Implement</Button>
                          )}
                          {record.implementation_status !== "Final Approved" && (
                            <Button type="button" variant="outline" size="sm" onClick={() => handleImplementationChange(record, "Final Approved")}>Approve Final</Button>
                          )}
                          <Button type="button" variant="outline" size="icon" onClick={() => handleDelete(record)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">No records found for this tab and selected month.</td></tr>
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
                  <CardTitle className="flex items-center gap-2 text-xl"><Plus className="h-5 w-5" />{editingId ? "Edit Compliance / Process Record" : "Add Compliance / Process Record"}</CardTitle>
                  <p className="mt-1 text-sm text-white/80">Add compliance checks, process issues, improvements and change testing records.</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={closeModal} disabled={saving} className="text-white hover:bg-white/20 hover:text-white"><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>

            <CardContent className="max-h-[calc(92vh-96px)] overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-8">
                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><Workflow className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Record Details</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Record month *</FieldLabel><input type="month" value={form.record_month} onChange={(event) => setFormValue("record_month", event.target.value)} className={inputClassName()} /></div>
                      <div><FieldLabel>Type</FieldLabel><Select value={form.type} onValueChange={(value) => setFormValue("type", value as RecordType)}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger><SelectContent>{RECORD_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                      <div><FieldLabel>Area *</FieldLabel><input value={form.area} onChange={(event) => setFormValue("area", event.target.value)} placeholder="Tutor Flow / Parent Comms / Documentation" className={inputClassName()} /></div>
                      <div><FieldLabel>Issue / Flow Name *</FieldLabel><input value={form.issue_flow_name} onChange={(event) => setFormValue("issue_flow_name", event.target.value)} placeholder="Class update documentation flow" className={inputClassName()} /></div>
                      <div><FieldLabel>Owner *</FieldLabel><input value={form.owner} onChange={(event) => setFormValue("owner", event.target.value)} placeholder="Shift Incharge / Coordinator / HR" className={inputClassName()} /></div>
                      <div><FieldLabel>Review Date</FieldLabel><input type="date" value={form.review_date} onChange={(event) => setFormValue("review_date", event.target.value)} className={inputClassName()} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="grid gap-4">
                      <div><FieldLabel>Current Problem *</FieldLabel><textarea value={form.current_problem} onChange={(event) => setFormValue("current_problem", event.target.value)} placeholder="What is the policy drift, workflow friction, compliance breach or flow problem?" className={textareaClassName()} /></div>
                      <div><FieldLabel>Suggested Improvement *</FieldLabel><textarea value={form.suggested_improvement} onChange={(event) => setFormValue("suggested_improvement", event.target.value)} placeholder="What system/process improvement is suggested?" className={textareaClassName()} /></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Compliance Control</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Compliance Breach</FieldLabel><Select value={form.compliance_breach} onValueChange={(value) => setFormValue("compliance_breach", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Breach Corrected</FieldLabel><Select value={form.breach_corrected} onValueChange={(value) => setFormValue("breach_corrected", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Unresolved Compliance Risk</FieldLabel><Select value={form.unresolved_compliance_risk} onValueChange={(value) => setFormValue("unresolved_compliance_risk", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Improvement & Implementation</h3></div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><FieldLabel>Process Issue Identified</FieldLabel><Select value={form.process_issue_identified} onValueChange={(value) => setFormValue("process_issue_identified", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Improvement Suggested</FieldLabel><Select value={form.improvement_suggested} onValueChange={(value) => setFormValue("improvement_suggested", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Improvement Approved</FieldLabel><Select value={form.improvement_approved} onValueChange={(value) => setFormValue("improvement_approved", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Improvement Implemented</FieldLabel><Select value={form.improvement_implemented} onValueChange={(value) => setFormValue("improvement_implemented", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Approval Status</FieldLabel><Select value={form.approval_status} onValueChange={(value) => setFormValue("approval_status", value as ApprovalStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{APPROVAL_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                      <div><FieldLabel>Implementation Status</FieldLabel><Select value={form.implementation_status} onValueChange={(value) => setFormValue("implementation_status", value as ImplementationStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{IMPLEMENTATION_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2"><GitBranch className="h-5 w-5 text-indigo-600" /><h3 className="font-semibold">Change Advisory / Flow Testing</h3></div>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div><FieldLabel>New Flow Tested</FieldLabel><Select value={form.new_flow_tested} onValueChange={(value) => setFormValue("new_flow_tested", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Feedback Submitted</FieldLabel><Select value={form.feedback_submitted} onValueChange={(value) => setFormValue("feedback_submitted", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Adjustment Recommended</FieldLabel><Select value={form.adjustment_recommended} onValueChange={(value) => setFormValue("adjustment_recommended", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                      <div><FieldLabel>Final Flow Approved</FieldLabel><Select value={form.final_flow_approved} onValueChange={(value) => setFormValue("final_flow_approved", value as "yes" | "no")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4"><FieldLabel>Notes</FieldLabel><textarea value={form.notes} onChange={(event) => setFormValue("notes", event.target.value)} placeholder="Add management advice, policy validation result, rollout notes or unresolved blockers..." className={textareaClassName()} /></div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-5 w-5 text-indigo-600" />Record Preview</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Issue / Flow</p><p className="font-semibold">{form.issue_flow_name || "New system record"}</p></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Type</p><p className="font-semibold">{form.type}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Area</p><p className="font-semibold">{form.area || "Not set"}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Approval</p><p className="font-semibold">{form.approval_status}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Implementation</p><p className="font-semibold">{form.implementation_status}</p></div>
                      </div>
                      {(form.unresolved_compliance_risk === "yes" || form.implementation_status === "Blocked" || form.approval_status === "Rejected") && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">This record needs management attention because it has unresolved risk, blocked implementation or rejected approval.</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-card">
                    <CardHeader><CardTitle className="text-base">This Page Tracks</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-600" />Compliance checks, breaches and unresolved risks.</div>
                      <div className="flex gap-2"><Workflow className="mt-0.5 h-4 w-4 text-indigo-600" />Process issues and workflow friction points.</div>
                      <div className="flex gap-2"><Lightbulb className="mt-0.5 h-4 w-4 text-indigo-600" />Suggested, approved and implemented improvements.</div>
                      <div className="flex gap-2"><GitBranch className="mt-0.5 h-4 w-4 text-indigo-600" />New flow testing, feedback and final approval.</div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? "Update Record" : "Save Record"}</Button>
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
