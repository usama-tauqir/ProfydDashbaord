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
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Coins,
  DollarSign,
  Edit3,
  FileText,
  Gauge,
  Handshake,
  Loader2,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserRoundCheck,
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
type Source = "LinkedIn" | "Indeed" | "Referral" | "Website" | "Facebook" | "Walk-in" | "Agency" | "Other";
type JoiningStatus = "Pending" | "Joined" | "No Show" | "Dropped Out" | "Not Applicable";

type CandidateRecord = {
  id: string;
  candidate_name: string;
  email: string | null;
  phone: string | null;
  role_title: string;
  department: Department;
  source: Source;
  stage: CandidateStage;
  recruiter: string | null;
  interviewer: string | null;
  rating: number | string | null;
  expected_salary: number | string | null;
  current_salary: number | string | null;
  applied_at: string;
  screened_at: string | null;
  interviewed_at: string | null;
  shortlisted_at: string | null;
  offer_made_at: string | null;
  offer_accepted_at: string | null;
  joined_at: string | null;
  joining_status: JoiningStatus | null;
  active_after_30_days: boolean | null;
  dropout_at: string | null;
  recruitment_cost: number | string | null;
  cost_notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type OutcomeForm = {
  joining_status: JoiningStatus;
  joined_at: string;
  active_after_30_days: string;
  dropout_at: string;
  recruitment_cost: string;
  cost_notes: string;
};

type DepartmentFilter = "all" | Department;
type SourceFilter = "all" | Source;
type OutcomeFilter = "all" | JoiningStatus;

const DEPARTMENTS: Department[] = ["Tutoring", "Finance", "Sales", "T&D", "R&D"];
const SOURCES: Source[] = ["LinkedIn", "Indeed", "Referral", "Website", "Facebook", "Walk-in", "Agency", "Other"];
const JOINING_STATUSES: JoiningStatus[] = ["Pending", "Joined", "No Show", "Dropped Out", "Not Applicable"];

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

const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#64748b"];

function emptyOutcomeForm(): OutcomeForm {
  return {
    joining_status: "Pending",
    joined_at: "",
    active_after_30_days: "unknown",
    dropout_at: "",
    recruitment_cost: "",
    cost_notes: "",
  };
}

function outcomeToForm(candidate: CandidateRecord): OutcomeForm {
  return {
    joining_status: candidate.joining_status || "Pending",
    joined_at: candidate.joined_at ? candidate.joined_at.slice(0, 10) : "",
    active_after_30_days:
      candidate.active_after_30_days === true ? "true" : candidate.active_after_30_days === false ? "false" : "unknown",
    dropout_at: candidate.dropout_at ? candidate.dropout_at.slice(0, 10) : "",
    recruitment_cost: candidate.recruitment_cost ? String(candidate.recruitment_cost) : "",
    cost_notes: candidate.cost_notes || "",
  };
}

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

function dayDiff(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
}

function getAgeDays(value: string | null | undefined) {
  if (!value) return 0;
  const start = new Date(value);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function hasReachedStage(candidate: CandidateRecord, stage: CandidateStage) {
  if (stage === "Interviewed") return STAGE_RANK[candidate.stage] >= 3 || Boolean(candidate.interviewed_at);
  if (stage === "Offer Made") return STAGE_RANK[candidate.stage] >= 5 || Boolean(candidate.offer_made_at);
  if (stage === "Offer Accepted") return candidate.stage === "Offer Accepted" || Boolean(candidate.offer_accepted_at);
  return STAGE_RANK[candidate.stage] >= STAGE_RANK[stage];
}

function getJoiningStatus(candidate: CandidateRecord): JoiningStatus {
  if (candidate.joining_status) return candidate.joining_status;
  if (candidate.joined_at) return "Joined";
  if (candidate.stage === "Offer Accepted") return "Pending";
  return "Not Applicable";
}

function isEarlyDropout(candidate: CandidateRecord) {
  const status = getJoiningStatus(candidate);
  if (status === "Dropped Out") return true;
  const days = dayDiff(candidate.joined_at, candidate.dropout_at);
  return days !== null && days < 30;
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

function JoiningStatusBadge({ status }: { status: JoiningStatus }) {
  const config = {
    Pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    Joined: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    "No Show": "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    "Dropped Out": "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
    "Not Applicable": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  } satisfies Record<JoiningStatus, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[status]}`}>{status}</span>;
}

export default function RecruitmentPerformancePage() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [outcomeForm, setOutcomeForm] = useState<OutcomeForm>(emptyOutcomeForm());
  const [editingCandidate, setEditingCandidate] = useState<CandidateRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("candidate_funnel")
        .select("*")
        .order("offer_accepted_at", { ascending: false, nullsFirst: false })
        .order("applied_at", { ascending: false });

      if (response.error) throw new Error(response.error.message);

      setCandidates((response.data || []) as CandidateRecord[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Could not load recruitment performance records. Check the candidate_funnel table."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();

    const channel = supabase
      .channel("recruitment-performance-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidate_funnel" },
        () => fetchCandidates()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCandidates]);

  const applications = candidates.length;
  const interviews = candidates.filter((candidate) => hasReachedStage(candidate, "Interviewed")).length;
  const offers = candidates.filter((candidate) => hasReachedStage(candidate, "Offer Made")).length;
  const acceptedOffers = candidates.filter((candidate) => hasReachedStage(candidate, "Offer Accepted")).length;

  const applicationToInterviewRate = applications ? (interviews / applications) * 100 : 0;
  const interviewToOfferRate = interviews ? (offers / interviews) * 100 : 0;
  const offerAcceptanceRate = offers ? (acceptedOffers / offers) * 100 : 0;

  const hiredCandidates = candidates.filter((candidate) => candidate.applied_at && candidate.offer_accepted_at);
  const hireDurations = hiredCandidates
    .map((candidate) => dayDiff(candidate.applied_at, candidate.offer_accepted_at))
    .filter((days): days is number => days !== null);

  const averageTimeToHire = hireDurations.length
    ? Math.round(hireDurations.reduce((sum, days) => sum + days, 0) / hireDurations.length)
    : 0;
  const fastestHire = hireDurations.length ? Math.min(...hireDurations) : 0;
  const slowestHire = hireDurations.length ? Math.max(...hireDurations) : 0;

  const joinedCandidates = candidates.filter((candidate) => getJoiningStatus(candidate) === "Joined" || Boolean(candidate.joined_at));
  const noShows = candidates.filter((candidate) => getJoiningStatus(candidate) === "No Show");
  const activeAfter30Days = candidates.filter((candidate) => candidate.active_after_30_days === true);
  const earlyDropouts = candidates.filter(isEarlyDropout);
  const joiningRate = acceptedOffers ? (joinedCandidates.length / acceptedOffers) * 100 : 0;
  const noShowRate = acceptedOffers ? (noShows.length / acceptedOffers) * 100 : 0;
  const thirtyDayRetentionRate = joinedCandidates.length ? (activeAfter30Days.length / joinedCandidates.length) * 100 : 0;
  const earlyDropoutRate = joinedCandidates.length ? (earlyDropouts.length / joinedCandidates.length) * 100 : 0;

  const totalRecruitmentCost = candidates.reduce((sum, candidate) => sum + toNumber(candidate.recruitment_cost, 0), 0);
  const costPerHire = joinedCandidates.length ? totalRecruitmentCost / joinedCandidates.length : 0;
  const costPerAcceptedOffer = acceptedOffers ? totalRecruitmentCost / acceptedOffers : 0;

  const conversionData = [
    { metric: "Application → Interview", rate: Number(applicationToInterviewRate.toFixed(1)) },
    { metric: "Interview → Offer", rate: Number(interviewToOfferRate.toFixed(1)) },
    { metric: "Offer → Acceptance", rate: Number(offerAcceptanceRate.toFixed(1)) },
  ];

  const speedByDepartment = useMemo(() => {
    return DEPARTMENTS.map((department) => {
      const durations = candidates
        .filter((candidate) => candidate.department === department)
        .map((candidate) => dayDiff(candidate.applied_at, candidate.offer_accepted_at))
        .filter((days): days is number => days !== null);

      return {
        department,
        avgDays: durations.length ? Math.round(durations.reduce((sum, days) => sum + days, 0) / durations.length) : 0,
        hires: durations.length,
      };
    }).filter((item) => item.hires > 0);
  }, [candidates]);

  const outcomeData = [
    { name: "Joined", value: joinedCandidates.length },
    { name: "No Show", value: noShows.length },
    { name: "Active 30 Days", value: activeAfter30Days.length },
    { name: "Early Dropout", value: earlyDropouts.length },
  ].filter((item) => item.value > 0);

  const costBySource = useMemo(() => {
    return SOURCES.map((source) => {
      const sourceCandidates = candidates.filter((candidate) => candidate.source === source);
      const sourceCost = sourceCandidates.reduce((sum, candidate) => sum + toNumber(candidate.recruitment_cost, 0), 0);
      const sourceHires = sourceCandidates.filter((candidate) => getJoiningStatus(candidate) === "Joined" || Boolean(candidate.joined_at)).length;

      return {
        source,
        cost: sourceCost,
        hires: sourceHires,
        costPerHire: sourceHires ? Math.round(sourceCost / sourceHires) : 0,
      };
    }).filter((item) => item.cost > 0 || item.hires > 0);
  }, [candidates]);

  const monthlyPerformance = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const monthAccepted = candidates.filter((candidate) => candidate.offer_accepted_at?.slice(0, 7) === month);
      const monthJoined = candidates.filter((candidate) => candidate.joined_at?.slice(0, 7) === month);
      const monthCosts = candidates.filter((candidate) => candidate.applied_at?.slice(0, 7) === month);
      const durations = monthAccepted
        .map((candidate) => dayDiff(candidate.applied_at, candidate.offer_accepted_at))
        .filter((days): days is number => days !== null);

      return {
        month: getMonthLabel(month),
        accepted: monthAccepted.length,
        joined: monthJoined.length,
        avgTimeToHire: durations.length ? Math.round(durations.reduce((sum, days) => sum + days, 0) / durations.length) : 0,
        cost: monthCosts.reduce((sum, candidate) => sum + toNumber(candidate.recruitment_cost, 0), 0),
      };
    });
  }, [candidates, selectedMonth]);

  const visibleCandidates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return candidates
      .filter((candidate) => departmentFilter === "all" || candidate.department === departmentFilter)
      .filter((candidate) => sourceFilter === "all" || candidate.source === sourceFilter)
      .filter((candidate) => outcomeFilter === "all" || getJoiningStatus(candidate) === outcomeFilter)
      .filter((candidate) => {
        if (!query) return true;

        return [
          candidate.candidate_name,
          candidate.role_title,
          candidate.department,
          candidate.source,
          candidate.recruiter || "",
          candidate.interviewer || "",
          candidate.joining_status || "",
          candidate.cost_notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const aStatus = getJoiningStatus(a);
        const bStatus = getJoiningStatus(b);
        const statusWeight = { Pending: 0, Joined: 1, "No Show": 2, "Dropped Out": 3, "Not Applicable": 4 } satisfies Record<JoiningStatus, number>;
        if (statusWeight[aStatus] !== statusWeight[bStatus]) return statusWeight[aStatus] - statusWeight[bStatus];
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      });
  }, [candidates, departmentFilter, sourceFilter, outcomeFilter, searchQuery]);

  const performanceInsights = useMemo(() => {
    const insights = [];

    if (applicationToInterviewRate < 30 && applications > 10) {
      insights.push("Application → Interview conversion is low. Review application quality, sourcing channels or screening criteria.");
    }

    if (interviewToOfferRate < 35 && interviews > 5) {
      insights.push("Interview → Offer conversion is low. Review interview scoring, role fit or manager expectations.");
    }

    if (offerAcceptanceRate < 60 && offers > 3) {
      insights.push("Offer acceptance is below 60%. Review salary, offer timing and candidate experience.");
    }

    if (averageTimeToHire > 21) {
      insights.push("Average time to hire is above 21 days. Consider faster screening, shorter interview loops or clear decision deadlines.");
    }

    if (noShowRate > 15) {
      insights.push("No-show rate is high. Add pre-joining reminders and stronger offer confirmation steps.");
    }

    if (earlyDropoutRate > 10) {
      insights.push("Early dropout rate is high. Review onboarding, expectations, compensation and first-week support.");
    }

    if (costPerHire > 0 && joinedCandidates.length > 0) {
      insights.push(`Current cost per hire is ${formatCurrency(Math.round(costPerHire))}. Compare this by source before scaling paid channels.`);
    }

    if (!insights.length) {
      insights.push("Recruitment performance looks healthy. Continue monitoring conversion, hiring speed, joining quality and cost efficiency.");
    }

    return insights;
  }, [
    applicationToInterviewRate,
    interviewToOfferRate,
    offerAcceptanceRate,
    averageTimeToHire,
    noShowRate,
    earlyDropoutRate,
    costPerHire,
    applications,
    interviews,
    offers,
    joinedCandidates.length,
  ]);

  function setOutcomeValue<K extends keyof OutcomeForm>(key: K, value: OutcomeForm[K]) {
    setOutcomeForm((previous) => ({ ...previous, [key]: value }));
  }

  function openOutcomeModal(candidate: CandidateRecord) {
    setEditingCandidate(candidate);
    setOutcomeForm(outcomeToForm(candidate));
    setIsModalOpen(true);
    setMessage(null);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setEditingCandidate(null);
    setOutcomeForm(emptyOutcomeForm());
  }

  async function handleOutcomeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCandidate) return;

    const cost = outcomeForm.recruitment_cost ? Number(outcomeForm.recruitment_cost) : null;

    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      setMessage({ type: "error", text: "Recruitment cost cannot be negative." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        joining_status: outcomeForm.joining_status,
        joined_at: outcomeForm.joined_at || null,
        active_after_30_days:
          outcomeForm.active_after_30_days === "unknown" ? null : outcomeForm.active_after_30_days === "true",
        dropout_at: outcomeForm.dropout_at || null,
        recruitment_cost: cost,
        cost_notes: outcomeForm.cost_notes.trim() || null,
      };

      const response = await supabase
        .from("candidate_funnel")
        .update(payload)
        .eq("id", editingCandidate.id)
        .select()
        .single();

      if (response.error) throw new Error(response.error.message);

      setMessage({ type: "success", text: "Outcome and cost updated successfully." });
      closeModal();
      await fetchCandidates();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not update outcome and cost.") });
    } finally {
      setSaving(false);
    }
  }

  if (loading && candidates.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading recruitment performance…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment Performance</h1>
          <p className="text-muted-foreground">
            Measure conversion, hiring speed, joining quality and recruitment cost from one automated performance page.
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

      <SectionTitle icon={Gauge} title="C. Conversion Metrics" />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Application → Interview %" value={percentage(applicationToInterviewRate)} icon={FileText} subtitle={`${formatNumber(interviews)} interviews from ${formatNumber(applications)} applications`} color="indigo" />
        <MetricCard title="Interview → Offer %" value={percentage(interviewToOfferRate)} icon={Handshake} subtitle={`${formatNumber(offers)} offers from ${formatNumber(interviews)} interviews`} color="violet" />
        <MetricCard title="Offer → Acceptance %" value={percentage(offerAcceptanceRate)} icon={BadgeCheck} subtitle={`${formatNumber(acceptedOffers)} accepted from ${formatNumber(offers)} offers`} color="emerald" />
      </div>

      <SectionTitle icon={Timer} title="D. Hiring Speed" />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Average time to hire" value={`${averageTimeToHire}d`} icon={Clock3} subtitle="Applied date to accepted offer" color="sky" />
        <MetricCard title="Fastest hire" value={`${fastestHire}d`} icon={Sparkles} subtitle="Shortest successful hiring cycle" color="emerald" />
        <MetricCard title="Slowest hire" value={`${slowestHire}d`} icon={CalendarClock} subtitle="Longest successful hiring cycle" color="amber" />
      </div>

      <SectionTitle icon={UserRoundCheck} title="E. Hiring Outcome Quality" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="New hires joined" value={formatNumber(joinedCandidates.length)} icon={UserCheck} subtitle={`${percentage(joiningRate)} of accepted offers`} color="emerald" />
        <MetricCard title="No-shows on joining date" value={formatNumber(noShows.length)} icon={UserMinus} subtitle={`${percentage(noShowRate)} no-show rate`} color="red" />
        <MetricCard title="Active after 30 days" value={formatNumber(activeAfter30Days.length)} icon={ShieldCheck} subtitle={`${percentage(thirtyDayRetentionRate)} 30-day retention`} color="indigo" />
        <MetricCard title="Early dropouts (<30 days)" value={formatNumber(earlyDropouts.length)} icon={TrendingDown} subtitle={`${percentage(earlyDropoutRate)} early dropout rate`} color="amber" />
      </div>

      <SectionTitle icon={Coins} title="F. Recruitment Cost" />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Cost per hire" value={formatCurrency(Math.round(costPerHire))} icon={DollarSign} subtitle="Total cost divided by joined hires" color="emerald" />
        <MetricCard title="Total recruitment cost" value={formatCurrency(Math.round(totalRecruitmentCost))} icon={Coins} subtitle="All recorded candidate costs" color="indigo" />
        <MetricCard title="Cost per accepted offer" value={formatCurrency(Math.round(costPerAcceptedOffer))} icon={Target} subtitle="Useful when joining is still pending" color="violet" />
      </div>

      <SectionTitle icon={BarChart3} title="Performance Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Conversion Rate Comparison</CardTitle>
            <p className="text-sm text-muted-foreground">Shows where the recruitment funnel is losing momentum.</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(value: unknown) => [`${Number(value).toFixed(1)}%`, "Conversion"]} />
                <Bar dataKey="rate" name="Conversion" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Hiring Speed by Department</CardTitle>
            <p className="text-sm text-muted-foreground">Average days from application to accepted offer by department.</p>
          </CardHeader>
          <CardContent className="h-80">
            {speedByDepartment.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speedByDepartment} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Avg days"]} />
                  <Bar dataKey="avgDays" name="Avg days" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No accepted offers yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Hiring Outcome Quality</CardTitle>
            <p className="text-sm text-muted-foreground">Compare joined hires, no-shows, 30-day active hires and early dropouts.</p>
          </CardHeader>
          <CardContent className="h-80">
            {outcomeData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={outcomeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={(props) => {
                      const payload = (props as { payload?: { name?: string; value?: number } }).payload;
                      return `${payload?.name ?? "Outcome"}: ${payload?.value ?? 0}`;
                    }}
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Candidates"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No joining outcome data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Recruitment Cost by Source</CardTitle>
            <p className="text-sm text-muted-foreground">See which channels generate hires and how much they cost.</p>
          </CardHeader>
          <CardContent className="h-80">
            {costBySource.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBySource} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                  <Legend />
                  <Bar dataKey="cost" name="Total cost" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costPerHire" name="Cost per hire" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No recruitment cost data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="text-base">Monthly Recruitment Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Track accepted offers, joined hires, hiring speed and monthly recruitment cost.</p>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyPerformance} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
              <Legend />
              <Line type="monotone" dataKey="accepted" name="Accepted offers" stroke="#4f46e5" strokeWidth={2.5} />
              <Line type="monotone" dataKey="joined" name="Joined hires" stroke="#10b981" strokeWidth={2.5} />
              <Line type="monotone" dataKey="avgTimeToHire" name="Avg time to hire" stroke="#f59e0b" strokeWidth={2.5} />
              <Line type="monotone" dataKey="cost" name="Cost" stroke="#ef4444" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle icon={TrendingUp} title="Automated Performance Insights" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Smart Recruitment Performance Notes</CardTitle>
            <p className="text-sm text-muted-foreground">Automatic recommendations based on conversion, speed, outcomes and cost.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceInsights.map((insight, index) => (
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
              "Conversion percentages automated",
              "Time-to-hire calculated from dates",
              "Joining quality tracked",
              "30-day retention visible",
              "Cost per hire automated",
              "Source cost comparison ready",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Search} title="Outcome & Cost Records" />

      <Card className="bg-white dark:bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter and update hiring outcomes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleCandidates.length)} of {formatNumber(candidates.length)} candidate records.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
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
              <FieldLabel>Outcome</FieldLabel>
              <Select value={outcomeFilter} onValueChange={(value) => setOutcomeFilter(value as OutcomeFilter)}>
                <SelectTrigger><SelectValue placeholder="Outcome" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All outcomes</SelectItem>
                  {JOINING_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search candidate, role..." className={inputClassName("pl-9")} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1400px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Candidate</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Accepted</th>
                  <th className="px-4 py-3 font-semibold">Time to hire</th>
                  <th className="px-4 py-3 font-semibold">Joining status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Active 30d</th>
                  <th className="px-4 py-3 font-semibold">Dropout</th>
                  <th className="px-4 py-3 font-semibold">Cost</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading records…
                    </td>
                  </tr>
                ) : visibleCandidates.length ? (
                  visibleCandidates.map((candidate) => {
                    const timeToHire = dayDiff(candidate.applied_at, candidate.offer_accepted_at);
                    const status = getJoiningStatus(candidate);
                    return (
                      <tr key={candidate.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold">{candidate.candidate_name}</p>
                          <p className="text-xs text-muted-foreground">Recruiter: {candidate.recruiter || "—"}</p>
                        </td>
                        <td className="px-4 py-3">{candidate.role_title}</td>
                        <td className="px-4 py-3">{candidate.department}</td>
                        <td className="px-4 py-3">{candidate.source}</td>
                        <td className="px-4 py-3">{formatDate(candidate.offer_accepted_at)}</td>
                        <td className="px-4 py-3">{timeToHire === null ? "—" : `${timeToHire}d`}</td>
                        <td className="px-4 py-3"><JoiningStatusBadge status={status} /></td>
                        <td className="px-4 py-3">{formatDate(candidate.joined_at)}</td>
                        <td className="px-4 py-3">{candidate.active_after_30_days === true ? "Yes" : candidate.active_after_30_days === false ? "No" : "—"}</td>
                        <td className="px-4 py-3">{formatDate(candidate.dropout_at)}</td>
                        <td className="px-4 py-3">{formatCurrency(candidate.recruitment_cost)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openOutcomeModal(candidate)}>
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Update
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-muted-foreground">No outcome records found for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-4xl overflow-hidden bg-white shadow-2xl dark:bg-card">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Edit3 className="h-5 w-5" />
                    Update Outcome & Cost
                  </CardTitle>
                  <p className="mt-1 text-sm text-white/80">
                    Record joining status, 30-day activity, dropout and recruitment cost for {editingCandidate.candidate_name}.
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={closeModal} disabled={saving} className="text-white hover:bg-white/20 hover:text-white">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="max-h-[calc(92vh-96px)] overflow-y-auto p-6">
              <form onSubmit={handleOutcomeSubmit} className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-8">
                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <UserRoundCheck className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Hiring Outcome Quality</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Joining status</FieldLabel>
                        <Select value={outcomeForm.joining_status} onValueChange={(value) => setOutcomeValue("joining_status", value as JoiningStatus)}>
                          <SelectTrigger><SelectValue placeholder="Joining status" /></SelectTrigger>
                          <SelectContent>{JOINING_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Joined date</FieldLabel>
                        <input type="date" value={outcomeForm.joined_at} onChange={(event) => setOutcomeValue("joined_at", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Active after 30 days</FieldLabel>
                        <Select value={outcomeForm.active_after_30_days} onValueChange={(value) => setOutcomeValue("active_after_30_days", value)}>
                          <SelectTrigger><SelectValue placeholder="Active after 30 days" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unknown">Not checked yet</SelectItem>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Dropout date</FieldLabel>
                        <input type="date" value={outcomeForm.dropout_at} onChange={(event) => setOutcomeValue("dropout_at", event.target.value)} className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Coins className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Recruitment Cost</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Recruitment cost</FieldLabel>
                        <input type="number" min="0" value={outcomeForm.recruitment_cost} onChange={(event) => setOutcomeValue("recruitment_cost", event.target.value)} placeholder="5000" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Cost note</FieldLabel>
                        <input value={outcomeForm.cost_notes} onChange={(event) => setOutcomeValue("cost_notes", event.target.value)} placeholder="Ad spend / agency / referral bonus" className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    This update automatically changes joining rate, no-show rate, 30-day retention, early dropout rate, total cost and cost per hire.
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                        Candidate Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                        <p className="text-xs text-muted-foreground">Candidate</p>
                        <p className="font-semibold">{editingCandidate.candidate_name}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                        <p className="text-xs text-muted-foreground">Role</p>
                        <p className="font-semibold">{editingCandidate.role_title}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Source</p><p className="font-semibold">{editingCandidate.source}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Time to hire</p><p className="font-semibold">{dayDiff(editingCandidate.applied_at, editingCandidate.offer_accepted_at) ?? "—"}d</p></div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={saving} className="w-full sm:w-auto">Cancel</Button>
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Save Update
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
