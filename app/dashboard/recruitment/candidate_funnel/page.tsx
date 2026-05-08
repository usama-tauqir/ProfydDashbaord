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
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FileText,
  Filter,
  ClipboardList,
  Handshake,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  UserCheck,
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

type Department = "Tutoring" | "Finance" | "Sales" | "T&D" | "R&D";
type CandidateStage =
  | "Applied"
  | "Screened"
  | "Interviewed"
  | "Shortlisted"
  | "Offer Made"
  | "Offer Accepted"
  | "Rejected"
  | "Withdrawn";
type Priority = "Low" | "Medium" | "High" | "Urgent";
type Source = "LinkedIn" | "Indeed" | "Referral" | "Website" | "Facebook" | "Walk-in" | "Agency" | "Other";
type Availability = "Immediate" | "15 Days" | "30 Days" | "60 Days" | "Not Confirmed";

type CandidateRecord = {
  id: string;
  candidate_name: string;
  email: string | null;
  phone: string | null;
  role_title: string;
  department: Department;
  source: Source;
  stage: CandidateStage;
  priority: Priority;
  recruiter: string | null;
  interviewer: string | null;
  rating: number | string | null;
  expected_salary: number | string | null;
  current_salary: number | string | null;
  availability: Availability;
  next_action_date: string | null;
  notes: string | null;
  applied_at: string;
  screened_at: string | null;
  interviewed_at: string | null;
  shortlisted_at: string | null;
  offer_made_at: string | null;
  offer_accepted_at: string | null;
  rejected_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string | null;
};

type CandidateForm = {
  candidate_name: string;
  email: string;
  phone: string;
  role_title: string;
  department: Department;
  source: Source;
  stage: CandidateStage;
  priority: Priority;
  recruiter: string;
  interviewer: string;
  rating: string;
  expected_salary: string;
  current_salary: string;
  availability: Availability;
  next_action_date: string;
  notes: string;
};

type StageFilter = "all" | CandidateStage;
type DepartmentFilter = "all" | Department;
type PriorityFilter = "all" | Priority;
type SourceFilter = "all" | Source;

const DEPARTMENTS: Department[] = ["Tutoring", "Finance", "Sales", "T&D", "R&D"];
const STAGES: CandidateStage[] = [
  "Applied",
  "Screened",
  "Interviewed",
  "Shortlisted",
  "Offer Made",
  "Offer Accepted",
  "Rejected",
  "Withdrawn",
];
const ACTIVE_STAGES: CandidateStage[] = ["Applied", "Screened", "Interviewed", "Shortlisted", "Offer Made"];
const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];
const SOURCES: Source[] = ["LinkedIn", "Indeed", "Referral", "Website", "Facebook", "Walk-in", "Agency", "Other"];
const AVAILABILITIES: Availability[] = ["Immediate", "15 Days", "30 Days", "60 Days", "Not Confirmed"];

const STAGE_RANK: Record<CandidateStage, number> = {
  Applied: 1,
  Screened: 2,
  Interviewed: 3,
  Shortlisted: 4,
  "Offer Made": 5,
  "Offer Accepted": 6,
  Rejected: 0,
  Withdrawn: 0,
};

const STAGE_COLORS = ["#4f46e5", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#22c55e", "#ef4444", "#64748b"];
const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#64748b", "#14b8a6"];

function emptyForm(): CandidateForm {
  return {
    candidate_name: "",
    email: "",
    phone: "",
    role_title: "",
    department: "Tutoring",
    source: "LinkedIn",
    stage: "Applied",
    priority: "Medium",
    recruiter: "",
    interviewer: "",
    rating: "3",
    expected_salary: "",
    current_salary: "",
    availability: "Not Confirmed",
    next_action_date: "",
    notes: "",
  };
}

function candidateToForm(candidate: CandidateRecord): CandidateForm {
  return {
    candidate_name: candidate.candidate_name || "",
    email: candidate.email || "",
    phone: candidate.phone || "",
    role_title: candidate.role_title || "",
    department: candidate.department || "Tutoring",
    source: candidate.source || "LinkedIn",
    stage: candidate.stage || "Applied",
    priority: candidate.priority || "Medium",
    recruiter: candidate.recruiter || "",
    interviewer: candidate.interviewer || "",
    rating: candidate.rating ? String(candidate.rating) : "3",
    expected_salary: candidate.expected_salary ? String(candidate.expected_salary) : "",
    current_salary: candidate.current_salary ? String(candidate.current_salary) : "",
    availability: candidate.availability || "Not Confirmed",
    next_action_date: candidate.next_action_date ? candidate.next_action_date.slice(0, 10) : "",
    notes: candidate.notes || "",
  };
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthStart(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1);
}

function getMonthLabel(month: string) {
  const date = getMonthStart(month);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getLastMonths(selectedMonth: string, count = 6) {
  const [year, monthNumber] = selectedMonth.split("-").map(Number);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, monthNumber - 1 - (count - 1 - index), 1);
    return date.toISOString().slice(0, 7);
  });
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
  if (!numberValue) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numberValue);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function percentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function getAgeDays(value: string | null | undefined) {
  if (!value) return 0;

  const start = new Date(value);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function getDaysUntil(value: string | null | undefined) {
  if (!value) return null;

  const today = new Date();
  const target = new Date(value);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isFollowUpDue(candidate: CandidateRecord) {
  const days = getDaysUntil(candidate.next_action_date);
  return ACTIVE_STAGES.includes(candidate.stage) && days !== null && days <= 0;
}

function hasReachedStage(candidate: CandidateRecord, stage: CandidateStage) {
  if (candidate.stage === "Rejected" || candidate.stage === "Withdrawn") {
    if (stage === "Screened") return Boolean(candidate.screened_at);
    if (stage === "Interviewed") return Boolean(candidate.interviewed_at);
    if (stage === "Shortlisted") return Boolean(candidate.shortlisted_at);
    if (stage === "Offer Made") return Boolean(candidate.offer_made_at);
    if (stage === "Offer Accepted") return Boolean(candidate.offer_accepted_at);
  }

  return STAGE_RANK[candidate.stage] >= STAGE_RANK[stage];
}

function buildStageDates(stage: CandidateStage, existing?: Partial<CandidateRecord>) {
  const now = new Date().toISOString();
  const shouldSet = (field: keyof CandidateRecord, reachedStage: CandidateStage) => {
    if (stage === "Rejected" || stage === "Withdrawn") return existing?.[field] || null;
    return STAGE_RANK[stage] >= STAGE_RANK[reachedStage] ? existing?.[field] || now : existing?.[field] || null;
  };

  return {
    screened_at: shouldSet("screened_at", "Screened"),
    interviewed_at: shouldSet("interviewed_at", "Interviewed"),
    shortlisted_at: shouldSet("shortlisted_at", "Shortlisted"),
    offer_made_at: shouldSet("offer_made_at", "Offer Made"),
    offer_accepted_at: shouldSet("offer_accepted_at", "Offer Accepted"),
    rejected_at: stage === "Rejected" ? existing?.rejected_at || now : null,
    withdrawn_at: stage === "Withdrawn" ? existing?.withdrawn_at || now : null,
  };
}

function getNextStage(stage: CandidateStage): CandidateStage | null {
  const flow: CandidateStage[] = ["Applied", "Screened", "Interviewed", "Shortlisted", "Offer Made", "Offer Accepted"];
  const index = flow.indexOf(stage);
  if (index < 0 || index === flow.length - 1) return null;
  return flow[index + 1];
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

function StageBadge({ stage }: { stage: CandidateStage }) {
  const config = {
    Applied: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
    Screened: "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
    Interviewed: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
    Shortlisted: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    "Offer Made": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    "Offer Accepted": "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
    Rejected: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    Withdrawn: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  } satisfies Record<CandidateStage, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[stage]}`}>{stage}</span>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const config = {
    Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    Medium: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    High: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
    Urgent: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  } satisfies Record<Priority, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[priority]}`}>{priority}</span>;
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

export default function CandidateFunnelPage() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [form, setForm] = useState<CandidateForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("candidate_funnel")
        .select("*")
        .order("stage", { ascending: true })
        .order("priority", { ascending: false })
        .order("applied_at", { ascending: false });

      if (response.error) throw new Error(response.error.message);

      setCandidates((response.data || []) as CandidateRecord[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Could not load candidate funnel records. Please check your candidate_funnel Supabase table."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();

    const channel = supabase
      .channel("candidate-funnel-realtime-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "candidate_funnel",
        },
        () => {
          fetchCandidates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCandidates]);

  const applicationsReceived = candidates.length;
  const candidatesScreened = candidates.filter((candidate) => hasReachedStage(candidate, "Screened")).length;
  const candidatesInterviewed = candidates.filter((candidate) => hasReachedStage(candidate, "Interviewed")).length;
  const candidatesShortlisted = candidates.filter((candidate) => hasReachedStage(candidate, "Shortlisted")).length;
  const offersMade = candidates.filter((candidate) => hasReachedStage(candidate, "Offer Made")).length;
  const offersAccepted = candidates.filter((candidate) => candidate.stage === "Offer Accepted" || Boolean(candidate.offer_accepted_at)).length;

  const activeCandidates = candidates.filter((candidate) => ACTIVE_STAGES.includes(candidate.stage));
  const rejectedCandidates = candidates.filter((candidate) => candidate.stage === "Rejected").length;
  const withdrawnCandidates = candidates.filter((candidate) => candidate.stage === "Withdrawn").length;
  const followUpsDue = candidates.filter(isFollowUpDue).length;
  const urgentCandidates = activeCandidates.filter((candidate) => candidate.priority === "Urgent").length;

  const screeningRate = applicationsReceived ? (candidatesScreened / applicationsReceived) * 100 : 0;
  const interviewRate = candidatesScreened ? (candidatesInterviewed / candidatesScreened) * 100 : 0;
  const shortlistRate = candidatesInterviewed ? (candidatesShortlisted / candidatesInterviewed) * 100 : 0;
  const offerAcceptanceRate = offersMade ? (offersAccepted / offersMade) * 100 : 0;
  const averageCandidateAge = activeCandidates.length
    ? Math.round(activeCandidates.reduce((sum, candidate) => sum + getAgeDays(candidate.applied_at), 0) / activeCandidates.length)
    : 0;
  const averageRating = candidates.length
    ? candidates.reduce((sum, candidate) => sum + toNumber(candidate.rating, 0), 0) / candidates.length
    : 0;

  const funnelData = [
    { stage: "Applications", count: applicationsReceived },
    { stage: "Screened", count: candidatesScreened },
    { stage: "Interviewed", count: candidatesInterviewed },
    { stage: "Shortlisted", count: candidatesShortlisted },
    { stage: "Offers Made", count: offersMade },
    { stage: "Offers Accepted", count: offersAccepted },
  ];

  const stageDistribution = useMemo(() => {
    return STAGES.map((stage) => ({
      stage,
      count: candidates.filter((candidate) => candidate.stage === stage).length,
    })).filter((item) => item.count > 0);
  }, [candidates]);

  const sourceDistribution = useMemo(() => {
    return SOURCES.map((source) => ({
      source,
      candidates: candidates.filter((candidate) => candidate.source === source).length,
      accepted: candidates.filter((candidate) => candidate.source === source && candidate.stage === "Offer Accepted").length,
    })).filter((item) => item.candidates > 0);
  }, [candidates]);

  const departmentFunnel = useMemo(() => {
    return DEPARTMENTS.map((department) => ({
      department,
      applications: candidates.filter((candidate) => candidate.department === department).length,
      shortlisted: candidates.filter((candidate) => candidate.department === department && hasReachedStage(candidate, "Shortlisted")).length,
      accepted: candidates.filter((candidate) => candidate.department === department && candidate.stage === "Offer Accepted").length,
    })).filter((item) => item.applications > 0);
  }, [candidates]);

  const monthlyTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      return {
        month: getMonthLabel(month),
        applications: candidates.filter((candidate) => candidate.applied_at?.slice(0, 7) === month).length,
        interviews: candidates.filter((candidate) => candidate.interviewed_at?.slice(0, 7) === month).length,
        offers: candidates.filter((candidate) => candidate.offer_made_at?.slice(0, 7) === month).length,
        accepted: candidates.filter((candidate) => candidate.offer_accepted_at?.slice(0, 7) === month).length,
      };
    });
  }, [candidates, selectedMonth]);

  const visibleCandidates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return candidates
      .filter((candidate) => stageFilter === "all" || candidate.stage === stageFilter)
      .filter((candidate) => departmentFilter === "all" || candidate.department === departmentFilter)
      .filter((candidate) => priorityFilter === "all" || candidate.priority === priorityFilter)
      .filter((candidate) => sourceFilter === "all" || candidate.source === sourceFilter)
      .filter((candidate) => {
        if (!query) return true;

        return [
          candidate.candidate_name,
          candidate.email || "",
          candidate.phone || "",
          candidate.role_title,
          candidate.department,
          candidate.stage,
          candidate.priority,
          candidate.source,
          candidate.recruiter || "",
          candidate.interviewer || "",
          candidate.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const activeWeight = (candidate: CandidateRecord) => (ACTIVE_STAGES.includes(candidate.stage) ? 0 : 1);
        const priorityWeight = { Urgent: 0, High: 1, Medium: 2, Low: 3 } satisfies Record<Priority, number>;

        if (activeWeight(a) !== activeWeight(b)) return activeWeight(a) - activeWeight(b);
        if (priorityWeight[a.priority] !== priorityWeight[b.priority]) return priorityWeight[a.priority] - priorityWeight[b.priority];
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      });
  }, [candidates, stageFilter, departmentFilter, priorityFilter, sourceFilter, searchQuery]);

  const funnelInsights = useMemo(() => {
    const insights = [];

    if (screeningRate < 40 && applicationsReceived > 10) {
      insights.push("Screening rate is below 40%. Review application quality, job posting clarity or screening capacity.");
    }

    if (interviewRate < 50 && candidatesScreened > 5) {
      insights.push("Less than half of screened candidates are reaching interviews. Check screening criteria or interviewer availability.");
    }

    if (offerAcceptanceRate < 60 && offersMade > 3) {
      insights.push("Offer acceptance rate is below 60%. Review salary range, role expectations and candidate experience.");
    }

    if (followUpsDue > 0) {
      insights.push(`${followUpsDue} candidate follow-up(s) are due or overdue. Recruiters should act today.`);
    }

    if (urgentCandidates > 0) {
      insights.push(`${urgentCandidates} urgent active candidate(s) need priority attention.`);
    }

    if (averageCandidateAge > 14) {
      insights.push("Average active candidate age is above 14 days. Speed up screening, interviews or decision-making.");
    }

    if (applicationsReceived === 0) {
      insights.push("No applications are recorded yet. Add candidates to activate funnel tracking.");
    }

    if (!insights.length) {
      insights.push("Candidate funnel looks healthy. Continue monitoring conversion rates, follow-ups and offer acceptance.");
    }

    return insights;
  }, [
    screeningRate,
    interviewRate,
    offerAcceptanceRate,
    applicationsReceived,
    candidatesScreened,
    offersMade,
    followUpsDue,
    urgentCandidates,
    averageCandidateAge,
  ]);

  function setFormValue<K extends keyof CandidateForm>(key: K, value: CandidateForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
    setMessage(null);
  }

  function openEditModal(candidate: CandidateRecord) {
    setEditingId(candidate.id);
    setForm(candidateToForm(candidate));
    setIsModalOpen(true);
    setMessage(null);
  }

  function closeModal() {
    if (saving) return;
    setEditingId(null);
    setIsModalOpen(false);
    setForm(emptyForm());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const rating = Number(form.rating || 0);
    const expectedSalary = form.expected_salary ? Number(form.expected_salary) : null;
    const currentSalary = form.current_salary ? Number(form.current_salary) : null;

    if (!form.candidate_name.trim() || !form.role_title.trim() || !form.department || !form.stage || !form.source) {
      setMessage({ type: "error", text: "Please enter candidate name, role title, department, stage and source." });
      return;
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      setMessage({ type: "error", text: "Rating must be between 1 and 5." });
      return;
    }

    if ((expectedSalary !== null && expectedSalary < 0) || (currentSalary !== null && currentSalary < 0)) {
      setMessage({ type: "error", text: "Salary values cannot be negative." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const existing = editingId ? candidates.find((candidate) => candidate.id === editingId) : undefined;
      const stageDates = buildStageDates(form.stage, existing);

      const payload = {
        candidate_name: form.candidate_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        role_title: form.role_title.trim(),
        department: form.department,
        source: form.source,
        stage: form.stage,
        priority: form.priority,
        recruiter: form.recruiter.trim() || null,
        interviewer: form.interviewer.trim() || null,
        rating,
        expected_salary: expectedSalary,
        current_salary: currentSalary,
        availability: form.availability,
        next_action_date: form.next_action_date || null,
        notes: form.notes.trim() || null,
        ...stageDates,
      };

      const response = editingId
        ? await supabase.from("candidate_funnel").update(payload).eq("id", editingId).select().single()
        : await supabase
            .from("candidate_funnel")
            .insert({ ...payload, applied_at: new Date().toISOString() })
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId ? "Candidate updated successfully." : "Candidate added successfully.",
      });

      closeModal();
      await fetchCandidates();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save candidate record.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleStageChange(candidate: CandidateRecord, stage: CandidateStage) {
    try {
      setMessage(null);

      const stageDates = buildStageDates(stage, candidate);
      const response = await supabase
        .from("candidate_funnel")
        .update({ stage, ...stageDates })
        .eq("id", candidate.id);

      if (response.error) throw new Error(response.error.message);

      setMessage({ type: "success", text: `Candidate moved to ${stage}.` });
      await fetchCandidates();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not update candidate stage.") });
    }
  }

  async function handleDelete(candidate: CandidateRecord) {
    const confirmed = window.confirm(`Delete candidate: ${candidate.candidate_name}?`);
    if (!confirmed) return;

    try {
      setMessage(null);

      const { error } = await supabase.from("candidate_funnel").delete().eq("id", candidate.id);
      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Candidate deleted." });
      await fetchCandidates();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not delete this candidate.") });
    }
  }

  if (loading && candidates.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading candidate funnel…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment - Candidate Funnel</h1>
          <p className="text-muted-foreground">
            Track applications, screening, interviews, shortlists, offers, acceptance, follow-ups and recruiter ownership.
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
          <Button onClick={fetchCandidates} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openAddModal} size="sm" className="shadow-lg shadow-indigo-500/20">
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
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

      <SectionTitle icon={ClipboardList} title="B. Candidate Funnel" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Applications received" value={formatNumber(applicationsReceived)} icon={FileText} subtitle="All candidate applications" color="indigo" />
        <MetricCard title="Candidates screened" value={formatNumber(candidatesScreened)} icon={ClipboardCheck} subtitle={`${percentage(screeningRate)} of applications`} color="sky" />
        <MetricCard title="Candidates interviewed" value={formatNumber(candidatesInterviewed)} icon={MessageSquare} subtitle={`${percentage(interviewRate)} of screened`} color="violet" />
        <MetricCard title="Candidates shortlisted" value={formatNumber(candidatesShortlisted)} icon={UserCheck} subtitle={`${percentage(shortlistRate)} of interviewed`} color="amber" />
        <MetricCard title="Offers made" value={formatNumber(offersMade)} icon={Send} subtitle="Candidates sent offers" color="emerald" />
        <MetricCard title="Offers accepted" value={formatNumber(offersAccepted)} icon={Handshake} subtitle={`${percentage(offerAcceptanceRate)} acceptance rate`} color="emerald" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active candidates" value={formatNumber(activeCandidates.length)} icon={Users} subtitle="Still moving in the funnel" color="indigo" />
        <MetricCard title="Follow-ups due" value={formatNumber(followUpsDue)} icon={CalendarClock} subtitle="Due or overdue today" color="red" />
        <MetricCard title="Urgent candidates" value={formatNumber(urgentCandidates)} icon={Sparkles} subtitle="Priority candidates to handle first" color="red" />
        <MetricCard title="Avg candidate age" value={`${averageCandidateAge}d`} icon={TrendingUp} subtitle={`Average rating: ${averageRating.toFixed(1)}/5`} color="amber" />
      </div>

      <SectionTitle icon={BarChart3} title="Funnel Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Candidate Funnel Conversion</CardTitle>
            <p className="text-sm text-muted-foreground">Shows drop-off from application to offer acceptance.</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Candidates"]} />
                <Bar dataKey="count" name="Candidates" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Current Stage Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">See where candidates are currently sitting in the pipeline.</p>
          </CardHeader>
          <CardContent className="h-80">
            {stageDistribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={stageDistribution}
                    dataKey="count"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={(props) => {
                      const payload = (props as { payload?: { stage?: string; count?: number } }).payload;
                      return `${payload?.stage ?? "Stage"}: ${payload?.count ?? 0}`;
                    }}
                  >
                    {stageDistribution.map((entry, index) => (
                      <Cell key={entry.stage} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Candidates"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No stage data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Source Quality</CardTitle>
            <p className="text-sm text-muted-foreground">Compare candidate volume and accepted offers by source.</p>
          </CardHeader>
          <CardContent className="h-80">
            {sourceDistribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceDistribution} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                  <Legend />
                  <Bar dataKey="candidates" name="Candidates" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accepted" name="Accepted" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No source data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Monthly Funnel Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Track applications, interviews, offers and accepted offers over time.</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Line type="monotone" dataKey="applications" name="Applications" stroke="#4f46e5" strokeWidth={2.5} />
                <Line type="monotone" dataKey="interviews" name="Interviews" stroke="#8b5cf6" strokeWidth={2.5} />
                <Line type="monotone" dataKey="offers" name="Offers" stroke="#f59e0b" strokeWidth={2.5} />
                <Line type="monotone" dataKey="accepted" name="Accepted" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="text-base">Department Funnel Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Understand which departments are converting applications into shortlists and accepted offers.</p>
        </CardHeader>
        <CardContent className="h-80">
          {departmentFunnel.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentFunnel} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="applications" name="Applications" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="shortlisted" name="Shortlisted" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="accepted" name="Accepted" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No department funnel data yet.</div>
          )}
        </CardContent>
      </Card>

      <SectionTitle icon={TrendingUp} title="Recruitment Intelligence" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Smart Funnel Notes</CardTitle>
            <p className="text-sm text-muted-foreground">Automatic recommendations based on conversion, follow-ups, ageing and offer acceptance.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelInsights.map((insight, index) => (
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
              "Stage history timestamps",
              "Next follow-up tracking",
              "Recruiter ownership",
              "Source quality analytics",
              "Offer acceptance rate",
              "Realtime dashboard refresh",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Filter} title="Candidate Records" />

      <Card className="bg-white dark:bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter and manage candidates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleCandidates.length)} of {formatNumber(candidates.length)} candidates. Rejected: {formatNumber(rejectedCandidates)} • Withdrawn: {formatNumber(withdrawnCandidates)}.
              </p>
            </div>
            <Button onClick={openAddModal} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <div>
              <FieldLabel>Stage</FieldLabel>
              <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as StageFilter)}>
                <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {STAGES.map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Department</FieldLabel>
              <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value as DepartmentFilter)}>
                <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {DEPARTMENTS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Priority</FieldLabel>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Source</FieldLabel>
              <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as SourceFilter)}>
                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {SOURCES.map((source) => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search name, role, owner..." className={inputClassName("pl-9")} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Candidate</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Stage</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                  <th className="px-4 py-3 font-semibold">Expected</th>
                  <th className="px-4 py-3 font-semibold">Availability</th>
                  <th className="px-4 py-3 font-semibold">Applied</th>
                  <th className="px-4 py-3 font-semibold">Follow-up</th>
                  <th className="px-4 py-3 font-semibold">Age</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading candidates…
                    </td>
                  </tr>
                ) : visibleCandidates.length ? (
                  visibleCandidates.map((candidate) => {
                    const nextStage = getNextStage(candidate.stage);
                    const followUpDue = isFollowUpDue(candidate);

                    return (
                      <tr key={candidate.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold">{candidate.candidate_name}</p>
                            <p className="text-xs text-muted-foreground">{candidate.email || "No email"} • {candidate.phone || "No phone"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{candidate.role_title}</td>
                        <td className="px-4 py-3">{candidate.department}</td>
                        <td className="px-4 py-3">{candidate.source}</td>
                        <td className="px-4 py-3"><StageBadge stage={candidate.stage} /></td>
                        <td className="px-4 py-3"><PriorityBadge priority={candidate.priority} /></td>
                        <td className="px-4 py-3">
                          <div>
                            <p>{candidate.recruiter || "—"}</p>
                            <p className="text-xs text-muted-foreground">Interviewer: {candidate.interviewer || "—"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{toNumber(candidate.rating, 0).toFixed(1)}/5</td>
                        <td className="px-4 py-3">{formatCurrency(candidate.expected_salary)}</td>
                        <td className="px-4 py-3">{candidate.availability}</td>
                        <td className="px-4 py-3">{formatDate(candidate.applied_at)}</td>
                        <td className={`px-4 py-3 ${followUpDue ? "font-semibold text-red-600" : ""}`}>{formatDate(candidate.next_action_date)}</td>
                        <td className="px-4 py-3">{getAgeDays(candidate.applied_at)}d</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(candidate)}>
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {nextStage && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleStageChange(candidate, nextStage)}>
                                Move
                              </Button>
                            )}
                            {ACTIVE_STAGES.includes(candidate.stage) && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleStageChange(candidate, "Rejected")}>
                                Reject
                              </Button>
                            )}
                            <Button type="button" variant="outline" size="icon" onClick={() => handleDelete(candidate)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-muted-foreground">No candidate records found for this filter.</td>
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
                    {editingId ? "Edit Candidate" : "Add New Candidate"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-white/80">
                    {editingId
                      ? "Update candidate information, stage, ownership and next action details."
                      : "Add candidate details once, then track funnel stage, follow-ups, source quality and offer conversion automatically."}
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
                      <UserRound className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Candidate Details</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Candidate name *</FieldLabel>
                        <input value={form.candidate_name} onChange={(event) => setFormValue("candidate_name", event.target.value)} placeholder="Ayesha Khan" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Role title *</FieldLabel>
                        <input value={form.role_title} onChange={(event) => setFormValue("role_title", event.target.value)} placeholder="Math Tutor / Sales Executive" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Email</FieldLabel>
                        <input type="email" value={form.email} onChange={(event) => setFormValue("email", event.target.value)} placeholder="candidate@email.com" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Phone</FieldLabel>
                        <input value={form.phone} onChange={(event) => setFormValue("phone", event.target.value)} placeholder="+92..." className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Funnel & Role Planning</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Department *</FieldLabel>
                        <Select value={form.department} onValueChange={(value) => setFormValue("department", value as Department)}>
                          <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                          <SelectContent>{DEPARTMENTS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Stage *</FieldLabel>
                        <Select value={form.stage} onValueChange={(value) => setFormValue("stage", value as CandidateStage)}>
                          <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
                          <SelectContent>{STAGES.map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Priority</FieldLabel>
                        <Select value={form.priority} onValueChange={(value) => setFormValue("priority", value as Priority)}>
                          <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                          <SelectContent>{PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Source</FieldLabel>
                        <Select value={form.source} onValueChange={(value) => setFormValue("source", value as Source)}>
                          <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                          <SelectContent>{SOURCES.map((source) => <SelectItem key={source} value={source}>{source}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Availability</FieldLabel>
                        <Select value={form.availability} onValueChange={(value) => setFormValue("availability", value as Availability)}>
                          <SelectTrigger><SelectValue placeholder="Availability" /></SelectTrigger>
                          <SelectContent>{AVAILABILITIES.map((availability) => <SelectItem key={availability} value={availability}>{availability}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Rating 1-5</FieldLabel>
                        <input type="number" min="1" max="5" step="0.5" value={form.rating} onChange={(event) => setFormValue("rating", event.target.value)} className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Ownership, Follow-up & Salary</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Recruiter owner</FieldLabel>
                        <input value={form.recruiter} onChange={(event) => setFormValue("recruiter", event.target.value)} placeholder="Recruiter name" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Interviewer</FieldLabel>
                        <input value={form.interviewer} onChange={(event) => setFormValue("interviewer", event.target.value)} placeholder="Interviewer name" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Current salary</FieldLabel>
                        <input type="number" min="0" value={form.current_salary} onChange={(event) => setFormValue("current_salary", event.target.value)} placeholder="50000" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Expected salary</FieldLabel>
                        <input type="number" min="0" value={form.expected_salary} onChange={(event) => setFormValue("expected_salary", event.target.value)} placeholder="80000" className={inputClassName()} />
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Next action date</FieldLabel>
                        <input type="date" value={form.next_action_date} onChange={(event) => setFormValue("next_action_date", event.target.value)} className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Notes</h3>
                    </div>
                    <textarea value={form.notes} onChange={(event) => setFormValue("notes", event.target.value)} placeholder="Add screening notes, interview feedback, offer details, concerns or next action context..." className={textareaClassName()} />
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                        Candidate Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                        <p className="text-xs text-muted-foreground">Candidate</p>
                        <p className="font-semibold">{form.candidate_name || "New candidate"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Stage</p><p className="font-semibold">{form.stage}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Priority</p><p className="font-semibold">{form.priority}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Source</p><p className="font-semibold">{form.source}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Rating</p><p className="font-semibold">{form.rating || 0}/5</p></div>
                      </div>
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                        <p className="text-xs text-muted-foreground">Owner</p>
                        <p className="font-semibold">{form.recruiter || "No recruiter assigned"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-card">
                    <CardHeader>
                      <CardTitle className="text-base">Why this helps later</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-2"><Target className="mt-0.5 h-4 w-4 text-indigo-600" />Stage timestamps show where hiring is slowing down.</div>
                      <div className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 text-indigo-600" />Next action date keeps recruiters from forgetting follow-ups.</div>
                      <div className="flex gap-2"><Star className="mt-0.5 h-4 w-4 text-indigo-600" />Rating helps managers compare candidate quality quickly.</div>
                      <div className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 text-indigo-600" />Contact details keep outreach work in one place.</div>
                      <div className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 text-indigo-600" />The same table can later connect with interview scheduling.</div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={saving} className="w-full sm:w-auto">Cancel</Button>
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      {editingId ? "Update Candidate" : "Save Candidate"}
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
