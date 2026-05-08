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
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Edit3,
  GraduationCap,
  Loader2,
  MapPin,
  Moon,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  UsersRound,
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
type Shift = "Morning" | "Night" | "Flexible";
type OpeningStatus = "Open" | "Filled" | "On Hold" | "Cancelled";
type Priority = "Low" | "Medium" | "High" | "Urgent";
type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Freelance" | "Intern";
type WorkMode = "On-site" | "Remote" | "Hybrid";
type Seniority = "Junior" | "Mid" | "Senior" | "Lead";

type JobOpeningRecord = {
  id: string;
  title: string;
  department: Department;
  subject: string | null;
  shift: Shift;
  status: OpeningStatus;
  priority: Priority;
  employment_type: EmploymentType;
  work_mode: WorkMode;
  location: string | null;
  seniority: Seniority;
  hiring_manager: string | null;
  recruiter: string | null;
  target_start_date: string | null;
  openings_count: number | string | null;
  budget_min: number | string | null;
  budget_max: number | string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  filled_at: string | null;
};

type OpeningForm = {
  title: string;
  department: Department;
  subject: string;
  shift: Shift;
  priority: Priority;
  employment_type: EmploymentType;
  work_mode: WorkMode;
  location: string;
  seniority: Seniority;
  hiring_manager: string;
  recruiter: string;
  target_start_date: string;
  openings_count: string;
  budget_min: string;
  budget_max: string;
  notes: string;
};

type StatusFilter = "all" | OpeningStatus;
type DepartmentFilter = "all" | Department;
type ShiftFilter = "all" | Shift;
type PriorityFilter = "all" | Priority;

const DEPARTMENTS: Department[] = ["Tutoring", "Finance", "Sales", "T&D", "R&D"];
const NON_TEACHING_DEPARTMENTS: Department[] = ["Finance", "Sales", "T&D", "R&D"];
const SHIFTS: Shift[] = ["Morning", "Night", "Flexible"];
const STATUSES: OpeningStatus[] = ["Open", "Filled", "On Hold", "Cancelled"];
const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];
const EMPLOYMENT_TYPES: EmploymentType[] = ["Full-time", "Part-time", "Contract", "Freelance", "Intern"];
const WORK_MODES: WorkMode[] = ["On-site", "Remote", "Hybrid"];
const SENIORITIES: Seniority[] = ["Junior", "Mid", "Senior", "Lead"];
const SUBJECTS = ["Math", "English", "Science", "Web Dev", "Programming", "Physics", "Chemistry", "Biology", "Other"];

const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444"];

function emptyForm(): OpeningForm {
  return {
    title: "",
    department: "Tutoring",
    subject: "Math",
    shift: "Morning",
    priority: "Medium",
    employment_type: "Full-time",
    work_mode: "On-site",
    location: "",
    seniority: "Mid",
    hiring_manager: "",
    recruiter: "",
    target_start_date: "",
    openings_count: "1",
    budget_min: "",
    budget_max: "",
    notes: "",
  };
}

function openingToForm(opening: JobOpeningRecord): OpeningForm {
  return {
    title: opening.title || "",
    department: opening.department || "Tutoring",
    subject: opening.department === "Tutoring" ? opening.subject || "Math" : "",
    shift: opening.shift || "Morning",
    priority: opening.priority || "Medium",
    employment_type: opening.employment_type || "Full-time",
    work_mode: opening.work_mode || "On-site",
    location: opening.location || "",
    seniority: opening.seniority || "Mid",
    hiring_manager: opening.hiring_manager || "",
    recruiter: opening.recruiter || "",
    target_start_date: opening.target_start_date ? opening.target_start_date.slice(0, 10) : "",
    openings_count: String(getOpeningsCount(opening)),
    budget_min: opening.budget_min ? String(opening.budget_min) : "",
    budget_max: opening.budget_max ? String(opening.budget_max) : "",
    notes: opening.notes || "",
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

function getMonthEnd(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0, 23, 59, 59, 999);
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

function getOpeningsCount(opening: JobOpeningRecord) {
  const count = toNumber(opening.openings_count, 1);
  return count > 0 ? count : 1;
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

function isOverdue(opening: JobOpeningRecord) {
  const days = getDaysUntil(opening.target_start_date);
  return opening.status === "Open" && days !== null && days < 0;
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

function StatusBadge({ status }: { status: OpeningStatus }) {
  const config = {
    Open: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Filled: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    "On Hold": "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    Cancelled: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  } satisfies Record<OpeningStatus, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[status]}`}>{status}</span>;
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
  color: "indigo" | "emerald" | "amber" | "violet" | "sky" | "red";
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

function isOpeningActiveAtMonthEnd(opening: JobOpeningRecord, month: string) {
  const monthEnd = getMonthEnd(month);
  const createdAt = new Date(opening.created_at);
  const filledAt = opening.filled_at ? new Date(opening.filled_at) : null;

  if (Number.isNaN(createdAt.getTime()) || createdAt > monthEnd) return false;
  if (opening.status === "Open" || opening.status === "On Hold") return true;
  if (filledAt && filledAt > monthEnd) return true;

  return false;
}

export default function RecruitmentDashboardPage() {
  const [openings, setOpenings] = useState<JobOpeningRecord[]>([]);
  const [form, setForm] = useState<OpeningForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOpenings = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("job_openings")
        .select("*")
        .order("status", { ascending: true })
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (response.error) throw new Error(response.error.message);

      setOpenings((response.data || []) as JobOpeningRecord[]);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      const text = getErrorMessage(
        error,
        "Could not load recruitment openings. Please check your job_openings Supabase table."
      );
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenings();

    const channel = supabase
      .channel("job-openings-realtime-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_openings",
        },
        () => {
          fetchOpenings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOpenings]);

  const activeDemand = useMemo(
    () => openings.filter((opening) => opening.status === "Open" || opening.status === "On Hold"),
    [openings]
  );

  const openVacancies = useMemo(() => openings.filter((opening) => opening.status === "Open"), [openings]);

  const totalOpenPositions = openVacancies.reduce((sum, opening) => sum + getOpeningsCount(opening), 0);
  const openTutorPositions = openVacancies
    .filter((opening) => opening.department === "Tutoring")
    .reduce((sum, opening) => sum + getOpeningsCount(opening), 0);
  const openNonTeachingPositions = openVacancies
    .filter((opening) => NON_TEACHING_DEPARTMENTS.includes(opening.department))
    .reduce((sum, opening) => sum + getOpeningsCount(opening), 0);
  const morningShiftVacancies = openVacancies
    .filter((opening) => opening.shift === "Morning")
    .reduce((sum, opening) => sum + getOpeningsCount(opening), 0);
  const nightShiftVacancies = openVacancies
    .filter((opening) => opening.shift === "Night")
    .reduce((sum, opening) => sum + getOpeningsCount(opening), 0);
  const urgentVacancies = openVacancies
    .filter((opening) => opening.priority === "Urgent")
    .reduce((sum, opening) => sum + getOpeningsCount(opening), 0);
  const overdueVacancies = openVacancies.filter(isOverdue).reduce((sum, opening) => sum + getOpeningsCount(opening), 0);

  const averageVacancyAge = openVacancies.length
    ? Math.round(openVacancies.reduce((sum, opening) => sum + getAgeDays(opening.created_at), 0) / openVacancies.length)
    : 0;

  const tutorPositionsBySubject = useMemo(() => {
    const subjectCounts = new Map<string, number>();

    openVacancies
      .filter((opening) => opening.department === "Tutoring")
      .forEach((opening) => {
        const subject = opening.subject || "Unassigned";
        subjectCounts.set(subject, (subjectCounts.get(subject) || 0) + getOpeningsCount(opening));
      });

    return Array.from(subjectCounts.entries())
      .map(([subject, positions]) => ({ subject, positions }))
      .sort((a, b) => b.positions - a.positions);
  }, [openVacancies]);

  const departmentDistribution = useMemo(() => {
    return DEPARTMENTS.map((department) => ({
      department,
      positions: openVacancies
        .filter((opening) => opening.department === department)
        .reduce((sum, opening) => sum + getOpeningsCount(opening), 0),
    })).filter((item) => item.positions > 0);
  }, [openVacancies]);

  const prioritySummary = useMemo(() => {
    return PRIORITIES.map((priority) => ({
      priority,
      positions: openVacancies
        .filter((opening) => opening.priority === priority)
        .reduce((sum, opening) => sum + getOpeningsCount(opening), 0),
    })).filter((item) => item.positions > 0);
  }, [openVacancies]);

  const monthlyHiringTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const created = openings
        .filter((opening) => opening.created_at?.slice(0, 7) === month)
        .reduce((sum, opening) => sum + getOpeningsCount(opening), 0);
      const filled = openings
        .filter((opening) => opening.filled_at?.slice(0, 7) === month)
        .reduce((sum, opening) => sum + getOpeningsCount(opening), 0);
      const openVolume = openings
        .filter((opening) => isOpeningActiveAtMonthEnd(opening, month))
        .reduce((sum, opening) => sum + getOpeningsCount(opening), 0);

      return {
        month: getMonthLabel(month),
        openPositions: openVolume,
        created,
        filled,
      };
    });
  }, [openings, selectedMonth]);

  const visibleOpenings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return openings
      .filter((opening) => departmentFilter === "all" || opening.department === departmentFilter)
      .filter((opening) => shiftFilter === "all" || opening.shift === shiftFilter)
      .filter((opening) => statusFilter === "all" || opening.status === statusFilter)
      .filter((opening) => priorityFilter === "all" || opening.priority === priorityFilter)
      .filter((opening) => {
        if (!query) return true;

        return [
          opening.title,
          opening.department,
          opening.subject || "",
          opening.shift,
          opening.status,
          opening.priority,
          opening.location || "",
          opening.hiring_manager || "",
          opening.recruiter || "",
          opening.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const statusWeight = { Open: 0, "On Hold": 1, Filled: 2, Cancelled: 3 } satisfies Record<OpeningStatus, number>;
        const priorityWeight = { Urgent: 0, High: 1, Medium: 2, Low: 3 } satisfies Record<Priority, number>;

        if (statusWeight[a.status] !== statusWeight[b.status]) return statusWeight[a.status] - statusWeight[b.status];
        if (priorityWeight[a.priority] !== priorityWeight[b.priority]) return priorityWeight[a.priority] - priorityWeight[b.priority];
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [openings, departmentFilter, shiftFilter, statusFilter, priorityFilter, searchQuery]);

  const hiringInsights = useMemo(() => {
    const insights = [];
    const highestSubject = tutorPositionsBySubject[0];
    const highestDepartment = departmentDistribution[0];

    if (highestSubject) {
      insights.push(`${highestSubject.subject} has the highest tutor demand with ${highestSubject.positions} open position(s).`);
    }

    if (highestDepartment) {
      insights.push(`${highestDepartment.department} has the highest departmental pressure with ${highestDepartment.positions} open position(s).`);
    }

    if (urgentVacancies > 0) {
      insights.push(`${urgentVacancies} urgent position(s) need immediate sourcing attention.`);
    }

    if (overdueVacancies > 0) {
      insights.push(`${overdueVacancies} position(s) are past their target start date. Review hiring blockers.`);
    }

    if (nightShiftVacancies > morningShiftVacancies) {
      insights.push("Night shift vacancies are higher than morning shift vacancies. Prioritise night-cover sourcing.");
    }

    if (averageVacancyAge > 30) {
      insights.push("Average vacancy age is above 30 days. Review sourcing channels and interview speed.");
    }

    if (totalOpenPositions === 0) {
      insights.push("No open positions are currently active. Keep the dashboard ready for new hiring requests.");
    }

    if (!insights.length) {
      insights.push("Recruitment demand looks balanced across departments, shifts and priorities.");
    }

    return insights;
  }, [
    tutorPositionsBySubject,
    departmentDistribution,
    urgentVacancies,
    overdueVacancies,
    nightShiftVacancies,
    morningShiftVacancies,
    averageVacancyAge,
    totalOpenPositions,
  ]);

  function setFormValue<K extends keyof OpeningForm>(key: K, value: OpeningForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
    setMessage(null);
  }

  function openEditModal(opening: JobOpeningRecord) {
    setEditingId(opening.id);
    setForm(openingToForm(opening));
    setIsModalOpen(true);
    setMessage(null);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const count = Number(form.openings_count || 1);
    const budgetMin = form.budget_min ? Number(form.budget_min) : null;
    const budgetMax = form.budget_max ? Number(form.budget_max) : null;

    if (!form.title.trim() || !form.department || !form.shift || !form.priority || !form.employment_type || !form.work_mode) {
      setMessage({ type: "error", text: "Please enter title, department, shift, priority, employment type and work mode." });
      return;
    }

    if (form.department === "Tutoring" && !form.subject.trim()) {
      setMessage({ type: "error", text: "Please select a subject for tutoring openings." });
      return;
    }

    if (!Number.isFinite(count) || count <= 0) {
      setMessage({ type: "error", text: "Openings count must be greater than zero." });
      return;
    }

    if ((budgetMin !== null && budgetMin < 0) || (budgetMax !== null && budgetMax < 0)) {
      setMessage({ type: "error", text: "Budget values cannot be negative." });
      return;
    }

    if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
      setMessage({ type: "error", text: "Minimum budget cannot be greater than maximum budget." });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        title: form.title.trim(),
        department: form.department,
        subject: form.department === "Tutoring" ? form.subject.trim() : null,
        shift: form.shift,
        priority: form.priority,
        employment_type: form.employment_type,
        work_mode: form.work_mode,
        location: form.location.trim() || null,
        seniority: form.seniority,
        hiring_manager: form.hiring_manager.trim() || null,
        recruiter: form.recruiter.trim() || null,
        target_start_date: form.target_start_date || null,
        openings_count: count,
        budget_min: budgetMin,
        budget_max: budgetMax,
        notes: form.notes.trim() || null,
      };

      const response = editingId
        ? await supabase.from("job_openings").update(payload).eq("id", editingId).select().single()
        : await supabase
            .from("job_openings")
            .insert({ ...payload, status: "Open" as OpeningStatus, filled_at: null })
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId
          ? "Position updated successfully. Dashboard metrics refreshed."
          : "New position saved successfully. Dashboard metrics updated.",
      });
      setIsModalOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      await fetchOpenings();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save job opening.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(opening: JobOpeningRecord, status: OpeningStatus) {
    try {
      setMessage(null);

      const payload = {
        status,
        filled_at: status === "Filled" ? new Date().toISOString() : null,
      };

      const response = await supabase.from("job_openings").update(payload).eq("id", opening.id);
      if (response.error) throw new Error(response.error.message);

      setMessage({ type: "success", text: `Opening marked as ${status}.` });
      await fetchOpenings();
    } catch (error) {
      const text = getErrorMessage(error, "Could not update opening status.");
      setMessage({ type: "error", text });
    }
  }

  async function handleDelete(opening: JobOpeningRecord) {
    const confirmed = window.confirm(`Delete opening: ${opening.title}?`);
    if (!confirmed) return;

    try {
      setMessage(null);

      const { error } = await supabase.from("job_openings").delete().eq("id", opening.id);
      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Opening deleted." });
      await fetchOpenings();
    } catch (error) {
      const text = getErrorMessage(error, "Could not delete this opening.");
      setMessage({ type: "error", text });
    }
  }

  if (loading && openings.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading recruitment dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment - Hiring Demand</h1>
          <p className="text-muted-foreground">
            Manage current hiring demand, priority roles, shift coverage, target start dates, budget ranges and recruiter ownership.
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
          <Button onClick={fetchOpenings} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openAddModal} size="sm" className="shadow-lg shadow-indigo-500/20">
            <Plus className="mr-2 h-4 w-4" />
            Add Position
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

      <SectionTitle icon={ClipboardList} title="A. Hiring Demand" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        <MetricCard title="Open positions" value={formatNumber(totalOpenPositions)} icon={BriefcaseBusiness} subtitle="Live count of all open roles" color="indigo" />
        <MetricCard title="Open tutor positions" value={formatNumber(openTutorPositions)} icon={GraduationCap} subtitle="Only tutoring roles" color="emerald" />
        <MetricCard title="Open non-teaching" value={formatNumber(openNonTeachingPositions)} icon={Building2} subtitle="Finance, Sales, T&D and R&D" color="amber" />
        <MetricCard title="Morning vacancies" value={formatNumber(morningShiftVacancies)} icon={Sun} subtitle="Roles needing morning cover" color="violet" />
        <MetricCard title="Night vacancies" value={formatNumber(nightShiftVacancies)} icon={Moon} subtitle="Roles needing night cover" color="sky" />
        <MetricCard title="Urgent roles" value={formatNumber(urgentVacancies)} icon={Sparkles} subtitle="Highest priority openings" color="red" />
        <MetricCard title="Avg vacancy age" value={`${averageVacancyAge}d`} icon={CalendarClock} subtitle="Average open role ageing" color="amber" />
      </div>

      <SectionTitle icon={BarChart3} title="Charts & Visual Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Open Tutor Positions by Subject</CardTitle>
            <p className="text-sm text-muted-foreground">Identify which subjects need immediate sourcing.</p>
          </CardHeader>
          <CardContent className="h-80">
            {tutorPositionsBySubject.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tutorPositionsBySubject} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Open positions"]} />
                  <Bar dataKey="positions" name="Open positions" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No open tutor positions yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Departmental Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">See where the most hiring pressure sits.</p>
          </CardHeader>
          <CardContent className="h-80">
            {departmentDistribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={departmentDistribution}
                    dataKey="positions"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={(props) => {
                      const payload = (props as { payload?: { department?: string; positions?: number } }).payload;
                      return `${payload?.department ?? "Department"}: ${payload?.positions ?? 0}`;
                    }}
                  >
                    {departmentDistribution.map((entry, index) => (
                      <Cell key={entry.department} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Open positions"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No open positions to display.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Priority Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">Focus recruiter work on urgent and high-priority demand first.</p>
          </CardHeader>
          <CardContent className="h-80">
            {prioritySummary.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prioritySummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Open positions"]} />
                  <Bar dataKey="positions" name="Open positions" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No priority data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Monthly Hiring Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Track open volume, new demand and filled roles.</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyHiringTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Line type="monotone" dataKey="openPositions" name="Open positions" stroke="#4f46e5" strokeWidth={2.5} />
                <Line type="monotone" dataKey="created" name="New openings" stroke="#10b981" strokeWidth={2.5} />
                <Line type="monotone" dataKey="filled" name="Filled roles" stroke="#f59e0b" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={TrendingUp} title="Recruitment Intelligence" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Smart Hiring Notes</CardTitle>
            <p className="text-sm text-muted-foreground">Automatic recommendations based on role demand, ageing, priority and shift pressure.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hiringInsights.map((insight, index) => (
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
            <CardTitle className="text-base">Work Efficiency Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Priority saved for each role",
              "Target start date tracking",
              "Recruiter ownership",
              "Budget range stored",
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

      <SectionTitle icon={PieChartIcon} title="Recruitment Opening Records" />

      <Card className="bg-white dark:bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter and manage positions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleOpenings.length)} of {formatNumber(openings.length)} records. Active demand: {formatNumber(activeDemand.length)} records.
              </p>
            </div>
            <Button onClick={openAddModal} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Position
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
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
              <FieldLabel>Shift</FieldLabel>
              <Select value={shiftFilter} onValueChange={(value) => setShiftFilter(value as ShiftFilter)}>
                <SelectTrigger><SelectValue placeholder="Shift" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All shifts</SelectItem>
                  {SHIFTS.map((shift) => <SelectItem key={shift} value={shift}>{shift}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

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
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search title, owner..." className={inputClassName("pl-9")} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Position</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Count</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Shift</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Mode</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">Age</th>
                  <th className="px-4 py-3 font-semibold">Budget</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading openings…
                    </td>
                  </tr>
                ) : visibleOpenings.length ? (
                  visibleOpenings.map((opening) => {
                    const overdue = isOverdue(opening);
                    return (
                      <tr key={opening.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold">{opening.title}</p>
                            <p className="text-xs text-muted-foreground">{opening.seniority} • {opening.location || "No location"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{opening.department}</td>
                        <td className="px-4 py-3">{opening.subject || "—"}</td>
                        <td className="px-4 py-3">{getOpeningsCount(opening)}</td>
                        <td className="px-4 py-3"><PriorityBadge priority={opening.priority} /></td>
                        <td className="px-4 py-3">{opening.shift}</td>
                        <td className="px-4 py-3">{opening.employment_type}</td>
                        <td className="px-4 py-3">{opening.work_mode}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p>{opening.recruiter || "—"}</p>
                            <p className="text-xs text-muted-foreground">Manager: {opening.hiring_manager || "—"}</p>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${overdue ? "font-semibold text-red-600" : ""}`}>{formatDate(opening.target_start_date)}</td>
                        <td className="px-4 py-3">{getAgeDays(opening.created_at)}d</td>
                        <td className="px-4 py-3">{formatCurrency(opening.budget_min)} - {formatCurrency(opening.budget_max)}</td>
                        <td className="px-4 py-3"><StatusBadge status={opening.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(opening)}>
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {opening.status !== "Filled" && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(opening, "Filled")}>Filled</Button>
                            )}
                            {opening.status !== "Open" && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(opening, "Open")}>Reopen</Button>
                            )}
                            {opening.status === "Open" && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(opening, "On Hold")}>Hold</Button>
                            )}
                            <Button type="button" variant="outline" size="icon" onClick={() => handleDelete(opening)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-muted-foreground">No recruitment openings found for this filter.</td>
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
                    {editingId ? "Edit Position" : "Add New Position"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-white/80">
                    {editingId
                      ? "Update this position record. All cards, charts and table values refresh after saving."
                      : "Add complete hiring details once, then let the dashboard track priority, ageing, shift demand and ownership automatically."}
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
                      <BriefcaseBusiness className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Role Details</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FieldLabel>Position title *</FieldLabel>
                        <input value={form.title} onChange={(event) => setFormValue("title", event.target.value)} placeholder="Math Tutor / Sales Executive / R&D Specialist" className={inputClassName()} />
                      </div>

                      <div>
                        <FieldLabel>Department *</FieldLabel>
                        <Select value={form.department} onValueChange={(value) => {
                          const department = value as Department;
                          setForm((previous) => ({ ...previous, department, subject: department === "Tutoring" ? previous.subject || "Math" : "" }));
                        }}>
                          <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                          <SelectContent>{DEPARTMENTS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>

                      {form.department === "Tutoring" && (
                        <div>
                          <FieldLabel>Subject *</FieldLabel>
                          <Select value={form.subject} onValueChange={(value) => setFormValue("subject", value)}>
                            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                            <SelectContent>{SUBJECTS.map((subject) => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <FieldLabel>Openings count *</FieldLabel>
                        <input type="number" min="1" step="1" value={form.openings_count} onChange={(event) => setFormValue("openings_count", event.target.value)} className={inputClassName()} />
                      </div>

                      <div>
                        <FieldLabel>Seniority</FieldLabel>
                        <Select value={form.seniority} onValueChange={(value) => setFormValue("seniority", value as Seniority)}>
                          <SelectTrigger><SelectValue placeholder="Seniority" /></SelectTrigger>
                          <SelectContent>{SENIORITIES.map((seniority) => <SelectItem key={seniority} value={seniority}>{seniority}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Hiring Planning</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Priority *</FieldLabel>
                        <Select value={form.priority} onValueChange={(value) => setFormValue("priority", value as Priority)}>
                          <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                          <SelectContent>{PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FieldLabel>Shift *</FieldLabel>
                        <Select value={form.shift} onValueChange={(value) => setFormValue("shift", value as Shift)}>
                          <SelectTrigger><SelectValue placeholder="Shift" /></SelectTrigger>
                          <SelectContent>{SHIFTS.map((shift) => <SelectItem key={shift} value={shift}>{shift}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FieldLabel>Target start date</FieldLabel>
                        <input type="date" min={getTodayDate()} value={form.target_start_date} onChange={(event) => setFormValue("target_start_date", event.target.value)} className={inputClassName()} />
                      </div>

                      <div>
                        <FieldLabel>Employment type</FieldLabel>
                        <Select value={form.employment_type} onValueChange={(value) => setFormValue("employment_type", value as EmploymentType)}>
                          <SelectTrigger><SelectValue placeholder="Employment type" /></SelectTrigger>
                          <SelectContent>{EMPLOYMENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FieldLabel>Work mode</FieldLabel>
                        <Select value={form.work_mode} onValueChange={(value) => setFormValue("work_mode", value as WorkMode)}>
                          <SelectTrigger><SelectValue placeholder="Work mode" /></SelectTrigger>
                          <SelectContent>{WORK_MODES.map((mode) => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>

                      <div>
                        <FieldLabel>Location</FieldLabel>
                        <input value={form.location} onChange={(event) => setFormValue("location", event.target.value)} placeholder="Lahore / Remote / Branch A" className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <UsersRound className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Ownership & Budget</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Hiring manager</FieldLabel>
                        <input value={form.hiring_manager} onChange={(event) => setFormValue("hiring_manager", event.target.value)} placeholder="Manager name" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Recruiter owner</FieldLabel>
                        <input value={form.recruiter} onChange={(event) => setFormValue("recruiter", event.target.value)} placeholder="Recruiter name" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Budget min</FieldLabel>
                        <input type="number" min="0" value={form.budget_min} onChange={(event) => setFormValue("budget_min", event.target.value)} placeholder="50000" className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Budget max</FieldLabel>
                        <input type="number" min="0" value={form.budget_max} onChange={(event) => setFormValue("budget_max", event.target.value)} placeholder="90000" className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Notes</h3>
                    </div>
                    <textarea value={form.notes} onChange={(event) => setFormValue("notes", event.target.value)} placeholder="Add sourcing notes, must-have skills, interview instructions, replacement reason, or urgency context..." className={textareaClassName()} />
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                        Position Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                        <p className="text-xs text-muted-foreground">Title</p>
                        <p className="font-semibold">{form.title || "New position title"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Department</p><p className="font-semibold">{form.department}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Count</p><p className="font-semibold">{form.openings_count || 1}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Priority</p><p className="font-semibold">{form.priority}</p></div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40"><p className="text-xs text-muted-foreground">Shift</p><p className="font-semibold">{form.shift}</p></div>
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
                      <div className="flex gap-2"><Target className="mt-0.5 h-4 w-4 text-indigo-600" />Priority and target date help recruiters know what to work on first.</div>
                      <div className="flex gap-2"><UserRound className="mt-0.5 h-4 w-4 text-indigo-600" />Recruiter ownership prevents confusion and duplicate work.</div>
                      <div className="flex gap-2"><DollarSign className="mt-0.5 h-4 w-4 text-indigo-600" />Budget range helps finance and management approve faster.</div>
                      <div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-indigo-600" />Location and work mode make filtering easier later.</div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={saving} className="w-full sm:w-auto">Cancel</Button>
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      {editingId ? "Update Position" : "Save Position"}
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
