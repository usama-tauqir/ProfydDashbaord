// app/dashboard/shift-incharge/capacity-planning/page.tsx
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
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
  UserPlus,
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

type PageTab = "thirty_day" | "sixty_day" | "tutor_capacity" | "student_load" | "hiring_requests" | "risk_alerts";
type ForecastWindow = "30 Days" | "60 Days";
type RiskLevel = "Low" | "Medium" | "High" | "Critical";
type ForecastWindowFilter = "all" | ForecastWindow;
type RiskFilter = "all" | RiskLevel;
type HiringFilter = "all" | "needed" | "not_needed";

type CapacityPlanningRecord = {
  id: string;
  record_month: string;
  forecast_window: ForecastWindow;
  subject_program: string;
  current_students: number | string | null;
  expected_growth: number | string | null;
  required_tutors: number | string | null;
  available_tutors: number | string | null;
  advance_hiring_request: boolean | null;
  hiring_needed: boolean | null;
  risk_level: RiskLevel;
  action_required: string;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type CapacityPlanningForm = {
  record_month: string;
  forecast_window: ForecastWindow;
  subject_program: string;
  current_students: string;
  expected_growth: string;
  required_tutors: string;
  available_tutors: string;
  advance_hiring_request: "yes" | "no";
  hiring_needed: "yes" | "no";
  risk_level: RiskLevel;
  action_required: string;
  review_date: string;
  notes: string;
};

const FORECAST_WINDOWS: ForecastWindow[] = ["30 Days", "60 Days"];
const RISK_LEVELS: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"];

const TAB_CONFIG: Array<{ key: PageTab; label: string; description: string; icon: ElementType }> = [
  {
    key: "thirty_day",
    label: "30-Day Forecast",
    description: "Near-term student load and tutor need forecast.",
    icon: CalendarDays,
  },
  {
    key: "sixty_day",
    label: "60-Day Forecast",
    description: "Medium-term student growth and capacity risk forecast.",
    icon: Clock,
  },
  {
    key: "tutor_capacity",
    label: "Tutor Capacity",
    description: "Required tutors, available tutors and capacity gaps.",
    icon: Users,
  },
  {
    key: "student_load",
    label: "Student Load Projection",
    description: "Current students and expected growth by subject/program.",
    icon: GraduationCap,
  },
  {
    key: "hiring_requests",
    label: "Hiring Requests",
    description: "Advance hiring requests and hiring-needed subjects.",
    icon: UserPlus,
  },
  {
    key: "risk_alerts",
    label: "Risk Alerts",
    description: "High and critical shortage risks before they happen.",
    icon: ShieldAlert,
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

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const numberValue = Number(value ?? fallback);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getCapacityGap(record: Pick<CapacityPlanningRecord, "required_tutors" | "available_tutors">) {
  return Math.max(0, toNumber(record.required_tutors, 0) - toNumber(record.available_tutors, 0));
}

function emptyForm(): CapacityPlanningForm {
  return {
    record_month: getCurrentMonth(),
    forecast_window: "30 Days",
    subject_program: "",
    current_students: "0",
    expected_growth: "0",
    required_tutors: "0",
    available_tutors: "0",
    advance_hiring_request: "no",
    hiring_needed: "no",
    risk_level: "Low",
    action_required: "",
    review_date: "",
    notes: "",
  };
}

function recordToForm(record: CapacityPlanningRecord): CapacityPlanningForm {
  return {
    record_month: record.record_month || getCurrentMonth(),
    forecast_window: record.forecast_window || "30 Days",
    subject_program: record.subject_program || "",
    current_students: String(toNumber(record.current_students, 0)),
    expected_growth: String(toNumber(record.expected_growth, 0)),
    required_tutors: String(toNumber(record.required_tutors, 0)),
    available_tutors: String(toNumber(record.available_tutors, 0)),
    advance_hiring_request: record.advance_hiring_request ? "yes" : "no",
    hiring_needed: record.hiring_needed ? "yes" : "no",
    risk_level: record.risk_level || "Low",
    action_required: record.action_required || "",
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

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const config = {
    Low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    Medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    High: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300",
    Critical: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  } satisfies Record<RiskLevel, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[risk]}`}>{risk}</span>;
}

function ForecastBadge({ window }: { window: ForecastWindow }) {
  const config = {
    "30 Days": "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
    "60 Days": "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
  } satisfies Record<ForecastWindow, string>;

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${config[window]}`}>{window}</span>;
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

function getTabMatch(record: CapacityPlanningRecord, activeTab: PageTab) {
  const gap = getCapacityGap(record);

  if (activeTab === "thirty_day") return record.forecast_window === "30 Days";
  if (activeTab === "sixty_day") return record.forecast_window === "60 Days";
  if (activeTab === "tutor_capacity") return true;
  if (activeTab === "student_load") return toNumber(record.current_students, 0) > 0 || toNumber(record.expected_growth, 0) > 0;
  if (activeTab === "hiring_requests") return record.hiring_needed === true || record.advance_hiring_request === true;
  return gap > 0 || record.risk_level === "High" || record.risk_level === "Critical";
}

function getShortageScore(records: CapacityPlanningRecord[]) {
  if (!records.length) return 100;
  const totalGap = records.reduce((sum, record) => sum + getCapacityGap(record), 0);
  const highRisk = records.filter((record) => record.risk_level === "High").length;
  const criticalRisk = records.filter((record) => record.risk_level === "Critical").length;
  const hiringNeeded = records.filter((record) => record.hiring_needed === true).length;

  const penalty = totalGap * 8 + highRisk * 8 + criticalRisk * 15 + hiringNeeded * 5;
  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

function getSuggestedRiskLevel(requiredTutors: string, availableTutors: string): RiskLevel {
  const gap = Math.max(0, Number(requiredTutors || 0) - Number(availableTutors || 0));
  if (gap >= 5) return "Critical";
  if (gap >= 3) return "High";
  if (gap >= 1) return "Medium";
  return "Low";
}

export default function ShiftInchargeCapacityPlanningPage() {
  const [records, setRecords] = useState<CapacityPlanningRecord[]>([]);
  const [form, setForm] = useState<CapacityPlanningForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState<PageTab>("thirty_day");
  const [forecastWindowFilter, setForecastWindowFilter] = useState<ForecastWindowFilter>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [hiringFilter, setHiringFilter] = useState<HiringFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await supabase
        .from("shift_capacity_planning_records")
        .select("*")
        .order("record_month", { ascending: false })
        .order("created_at", { ascending: false });

      if (response.error) throw new Error(response.error.message);

      setRecords((response.data || []) as CapacityPlanningRecord[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(
          error,
          "Could not load forecasting and capacity planning records. Please check the shift_capacity_planning_records Supabase table."
        ),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel("shift-capacity-planning-records-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_capacity_planning_records" },
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

  const expectedStudentGrowth = monthRecords.reduce((sum, record) => sum + toNumber(record.expected_growth, 0), 0);
  const expectedTutorRequirement = monthRecords.reduce((sum, record) => sum + toNumber(record.required_tutors, 0), 0);
  const availableTutorCapacity = monthRecords.reduce((sum, record) => sum + toNumber(record.available_tutors, 0), 0);
  const capacityGaps = monthRecords.reduce((sum, record) => sum + getCapacityGap(record), 0);
  const advanceHiringRequests = monthRecords.filter((record) => record.advance_hiring_request === true).length;
  const hiringNeededCount = monthRecords.filter((record) => record.hiring_needed === true).length;
  const highRiskCount = monthRecords.filter((record) => record.risk_level === "High").length;
  const criticalRiskCount = monthRecords.filter((record) => record.risk_level === "Critical").length;
  const shortageRiskScore = getShortageScore(monthRecords);

  const studentProjectionData = monthRecords.map((record) => ({
    subject: record.subject_program,
    current: toNumber(record.current_students, 0),
    expectedGrowth: toNumber(record.expected_growth, 0),
    projected: toNumber(record.current_students, 0) + toNumber(record.expected_growth, 0),
  }));

  const tutorCapacityData = monthRecords.map((record) => ({
    subject: record.subject_program,
    required: toNumber(record.required_tutors, 0),
    available: toNumber(record.available_tutors, 0),
    gap: getCapacityGap(record),
  }));

  const riskData = RISK_LEVELS.map((risk) => ({
    name: risk,
    value: monthRecords.filter((record) => record.risk_level === risk).length,
  })).filter((item) => item.value > 0);

  const forecastWindowData = FORECAST_WINDOWS.map((window) => ({
    name: window,
    value: monthRecords.filter((record) => record.forecast_window === window).length,
  })).filter((item) => item.value > 0);

  const hiringData = [
    { name: "Hiring Needed", value: hiringNeededCount },
    { name: "Advance Requests", value: advanceHiringRequests },
    { name: "Capacity Gaps", value: capacityGaps },
    { name: "High/Critical Risks", value: highRiskCount + criticalRiskCount },
  ];

  const monthlyTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const monthData = records.filter((record) => record.record_month === month);
      return {
        month: getMonthLabel(month),
        expectedGrowth: monthData.reduce((sum, record) => sum + toNumber(record.expected_growth, 0), 0),
        requiredTutors: monthData.reduce((sum, record) => sum + toNumber(record.required_tutors, 0), 0),
        availableTutors: monthData.reduce((sum, record) => sum + toNumber(record.available_tutors, 0), 0),
        capacityGaps: monthData.reduce((sum, record) => sum + getCapacityGap(record), 0),
        hiringRequests: monthData.filter((record) => record.advance_hiring_request === true).length,
      };
    });
  }, [records, selectedMonth]);

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records
      .filter((record) => record.record_month === selectedMonth)
      .filter((record) => getTabMatch(record, activeTab))
      .filter((record) => forecastWindowFilter === "all" || record.forecast_window === forecastWindowFilter)
      .filter((record) => riskFilter === "all" || record.risk_level === riskFilter)
      .filter((record) => {
        if (hiringFilter === "all") return true;
        if (hiringFilter === "needed") return record.hiring_needed === true || record.advance_hiring_request === true;
        return record.hiring_needed !== true && record.advance_hiring_request !== true;
      })
      .filter((record) => {
        if (!query) return true;
        return [
          record.subject_program,
          record.forecast_window,
          record.risk_level,
          record.action_required,
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const riskWeight = { Critical: 0, High: 1, Medium: 2, Low: 3 } satisfies Record<RiskLevel, number>;
        if (riskWeight[a.risk_level] !== riskWeight[b.risk_level]) return riskWeight[a.risk_level] - riskWeight[b.risk_level];
        return getCapacityGap(b) - getCapacityGap(a);
      });
  }, [records, selectedMonth, activeTab, forecastWindowFilter, riskFilter, hiringFilter, searchQuery]);

  const insights = useMemo(() => {
    const output = [];

    if (monthRecords.length === 0) {
      output.push("No capacity planning records are available for this month. Add 30-day or 60-day forecasts to activate shortage risk tracking.");
    }

    if (capacityGaps > 0) {
      output.push(`${capacityGaps} tutor capacity gap(s) are forecasted. Review required vs available tutors before the shortage reaches operations.`);
    }

    if (advanceHiringRequests > 0) {
      output.push(`${advanceHiringRequests} advance hiring request(s) are already raised. Follow up before the next student growth cycle.`);
    }

    if (hiringNeededCount > advanceHiringRequests) {
      output.push(`${hiringNeededCount - advanceHiringRequests} subject/program area(s) need hiring but do not yet have an advance hiring request raised.`);
    }

    if (criticalRiskCount > 0) {
      output.push(`${criticalRiskCount} critical shortage risk(s) found. These should be escalated immediately to management/HR.`);
    }

    if (highRiskCount > 0) {
      output.push(`${highRiskCount} high shortage risk(s) found. Review tutor availability and hiring pipeline this week.`);
    }

    if (shortageRiskScore < 70 && monthRecords.length > 0) {
      output.push("Shortage risk score is weak. Prioritise capacity gaps, hiring requests and high-growth subjects/programs.");
    }

    if (!output.length) {
      output.push("Capacity planning looks stable for this month. Continue monitoring expected growth, tutor availability and 60-day hiring needs.");
    }

    return output;
  }, [
    monthRecords.length,
    capacityGaps,
    advanceHiringRequests,
    hiringNeededCount,
    criticalRiskCount,
    highRiskCount,
    shortageRiskScore,
  ]);

  function setFormValue<K extends keyof CapacityPlanningForm>(key: K, value: CapacityPlanningForm[K]) {
    setForm((previous) => {
      const next = { ...previous, [key]: value };

      if (key === "required_tutors" || key === "available_tutors") {
        const suggestedRisk = getSuggestedRiskLevel(
          key === "required_tutors" ? String(value) : next.required_tutors,
          key === "available_tutors" ? String(value) : next.available_tutors
        );
        const gap = Math.max(0, Number(next.required_tutors || 0) - Number(next.available_tutors || 0));
        next.risk_level = suggestedRisk;
        next.hiring_needed = gap > 0 ? "yes" : "no";
        next.advance_hiring_request = gap >= 2 ? "yes" : next.advance_hiring_request;
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

  function openEditModal(record: CapacityPlanningRecord) {
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

  function getFormCapacityGap() {
    return Math.max(0, Number(form.required_tutors || 0) - Number(form.available_tutors || 0));
  }

  function buildPayload() {
    return {
      record_month: form.record_month,
      forecast_window: form.forecast_window,
      subject_program: form.subject_program.trim(),
      current_students: Number(form.current_students || 0),
      expected_growth: Number(form.expected_growth || 0),
      required_tutors: Number(form.required_tutors || 0),
      available_tutors: Number(form.available_tutors || 0),
      advance_hiring_request: form.advance_hiring_request === "yes",
      hiring_needed: form.hiring_needed === "yes",
      risk_level: form.risk_level,
      action_required: form.action_required.trim(),
      review_date: form.review_date || null,
      notes: form.notes.trim() || null,
    };
  }

  function validateForm() {
    if (!form.record_month) return "Please select record month.";
    if (!form.subject_program.trim()) return "Please enter subject / program.";
    if (!form.action_required.trim()) return "Please enter action required.";

    const numericFields: Array<keyof CapacityPlanningForm> = [
      "current_students",
      "expected_growth",
      "required_tutors",
      "available_tutors",
    ];

    for (const field of numericFields) {
      const value = Number(form[field] || 0);
      if (!Number.isFinite(value) || value < 0) return "All numeric fields must be zero or greater.";
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
        ? await supabase.from("shift_capacity_planning_records").update(payload).eq("id", editingId).select().single()
        : await supabase.from("shift_capacity_planning_records").insert(payload).select().single();

      if (response.error) throw new Error(response.error.message);

      setMessage({
        type: "success",
        text: editingId ? "Capacity planning record updated successfully." : "Capacity planning record added successfully.",
      });
      closeModal();
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save this capacity planning record.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleRiskChange(record: CapacityPlanningRecord, riskLevel: RiskLevel) {
    try {
      setMessage(null);
      const response = await supabase.from("shift_capacity_planning_records").update({ risk_level: riskLevel }).eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: `${record.subject_program} marked as ${riskLevel} risk.` });
      await fetchRecords();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not update risk level.") });
    }
  }

  async function handleDelete(record: CapacityPlanningRecord) {
    const confirmed = window.confirm(`Delete capacity record for ${record.subject_program}?`);
    if (!confirmed) return;

    try {
      setMessage(null);
      const response = await supabase.from("shift_capacity_planning_records").delete().eq("id", record.id);
      if (response.error) throw new Error(response.error.message);
      setMessage({ type: "success", text: "Capacity planning record deleted." });
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
          <p className="text-sm text-muted-foreground">Loading forecasting and capacity planning records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 dark:bg-slate-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forecasting & Capacity Planning</h1>
          <p className="text-muted-foreground">
            Forecast student load for the next 30–60 days, plan tutor capacity, raise hiring requests and flag shortage risks early.
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
            Add Forecast
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

      <SectionTitle icon={Gauge} title="Capacity Planning Snapshot" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Expected Student Growth" value={formatNumber(expectedStudentGrowth)} icon={TrendingUp} subtitle="Projected student increase" color="indigo" />
        <MetricCard title="Expected Tutor Requirement" value={formatNumber(expectedTutorRequirement)} icon={Users} subtitle="Required tutor capacity" color="sky" />
        <MetricCard title="Available Tutor Capacity" value={formatNumber(availableTutorCapacity)} icon={UserPlus} subtitle="Available tutors/capacity" color="emerald" />
        <MetricCard title="Capacity Gaps" value={formatNumber(capacityGaps)} icon={AlertTriangle} subtitle="Required minus available" color={capacityGaps > 0 ? "red" : "emerald"} />
        <MetricCard title="Advance Hiring Requests" value={formatNumber(advanceHiringRequests)} icon={Send} subtitle="Requests raised before shortage" color={advanceHiringRequests > 0 ? "amber" : "slate"} />
        <MetricCard title="Shortage Risk" value={`${shortageRiskScore}%`} icon={Gauge} subtitle="Higher score means lower shortage pressure" color={shortageRiskScore >= 80 ? "emerald" : shortageRiskScore >= 60 ? "amber" : "red"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Hiring Needed" value={formatNumber(hiringNeededCount)} icon={UserPlus} subtitle="Subjects/programs needing hiring" color={hiringNeededCount > 0 ? "amber" : "emerald"} />
        <MetricCard title="High Risk Areas" value={formatNumber(highRiskCount)} icon={ShieldAlert} subtitle="High shortage risk" color={highRiskCount > 0 ? "red" : "emerald"} />
        <MetricCard title="Critical Risk Areas" value={formatNumber(criticalRiskCount)} icon={AlertCircle} subtitle="Immediate capacity action needed" color={criticalRiskCount > 0 ? "red" : "emerald"} />
      </div>

      <SectionTitle icon={BarChart3} title="Charts & Capacity Analytics" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Student Load Projection</CardTitle>
            <p className="text-sm text-muted-foreground">Current students, expected growth and projected load by subject/program.</p>
          </CardHeader>
          <CardContent className="h-80">
            {studentProjectionData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentProjectionData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Students"]} />
                  <Legend />
                  <Bar dataKey="current" name="Current Students" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expectedGrowth" name="Expected Growth" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="projected" name="Projected Load" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No student load data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Tutor Capacity Gap</CardTitle>
            <p className="text-sm text-muted-foreground">Required tutors, available tutors and capacity gap by subject/program.</p>
          </CardHeader>
          <CardContent className="h-80">
            {tutorCapacityData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tutorCapacityData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Tutors"]} />
                  <Legend />
                  <Bar dataKey="required" name="Required Tutors" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="available" name="Available Tutors" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gap" name="Capacity Gap" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No tutor capacity data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Forecast Window Split</CardTitle>
            <p className="text-sm text-muted-foreground">Records split between 30-day and 60-day forecasts.</p>
          </CardHeader>
          <CardContent className="h-80">
            {forecastWindowData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={forecastWindowData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {forecastWindowData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Records"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No forecast window data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Risk Level Split</CardTitle>
            <p className="text-sm text-muted-foreground">Low, medium, high and critical shortage risk areas.</p>
          </CardHeader>
          <CardContent className="h-80">
            {riskData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {riskData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Records"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No risk data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Hiring Requests & Shortage Load</CardTitle>
            <p className="text-sm text-muted-foreground">Hiring need, advance requests, capacity gaps and high-risk areas.</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hiringData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), "Count"]} />
                <Bar dataKey="value" name="Count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">6-Month Capacity Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Expected growth, tutor requirement, available capacity and hiring requests.</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Line type="monotone" dataKey="expectedGrowth" name="Expected Growth" stroke="#4f46e5" strokeWidth={2.5} />
                <Line type="monotone" dataKey="requiredTutors" name="Required Tutors" stroke="#06b6d4" strokeWidth={2.5} />
                <Line type="monotone" dataKey="availableTutors" name="Available Tutors" stroke="#10b981" strokeWidth={2.5} />
                <Line type="monotone" dataKey="capacityGaps" name="Capacity Gaps" stroke="#ef4444" strokeWidth={2.5} />
                <Line type="monotone" dataKey="hiringRequests" name="Hiring Requests" stroke="#f59e0b" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={ShieldAlert} title="Automated Capacity Risk Alerts" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white dark:bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Smart Capacity Notes</CardTitle>
            <p className="text-sm text-muted-foreground">Automatic alerts for capacity gaps, hiring needs, high-risk subjects and critical shortages.</p>
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
              "30-day forecast",
              "60-day forecast",
              "Tutor capacity",
              "Student load projection",
              "Hiring requests",
              "Risk alerts",
              "Capacity gap tracking",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Filter} title="Forecasting & Capacity Planning Records" />
      <Card className="bg-white dark:bg-card">
        <CardHeader className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
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
              <CardTitle className="text-base">Search, filter and manage capacity planning records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleRecords.length)} of {formatNumber(monthRecords.length)} records for {getMonthLabel(selectedMonth)}.
              </p>
            </div>
            <Button onClick={openAddModal} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Forecast
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <FieldLabel>Forecast Window</FieldLabel>
              <Select value={forecastWindowFilter} onValueChange={(value) => setForecastWindowFilter(value as ForecastWindowFilter)}>
                <SelectTrigger><SelectValue placeholder="Forecast window" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All windows</SelectItem>
                  {FORECAST_WINDOWS.map((window) => <SelectItem key={window} value={window}>{window}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Risk Level</FieldLabel>
              <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value as RiskFilter)}>
                <SelectTrigger><SelectValue placeholder="Risk level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risks</SelectItem>
                  {RISK_LEVELS.map((risk) => <SelectItem key={risk} value={risk}>{risk}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Hiring</FieldLabel>
              <Select value={hiringFilter} onValueChange={(value) => setHiringFilter(value as HiringFilter)}>
                <SelectTrigger><SelectValue placeholder="Hiring" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All records</SelectItem>
                  <SelectItem value="needed">Hiring needed</SelectItem>
                  <SelectItem value="not_needed">No hiring needed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Search</FieldLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search subject, program, action..." className={inputClassName("pl-9")} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1450px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Subject / Program</th>
                  <th className="px-4 py-3 font-semibold">Current Students</th>
                  <th className="px-4 py-3 font-semibold">Expected Growth</th>
                  <th className="px-4 py-3 font-semibold">Required Tutors</th>
                  <th className="px-4 py-3 font-semibold">Available Tutors</th>
                  <th className="px-4 py-3 font-semibold">Capacity Gap</th>
                  <th className="px-4 py-3 font-semibold">Hiring Needed</th>
                  <th className="px-4 py-3 font-semibold">Risk Level</th>
                  <th className="px-4 py-3 font-semibold">Action Required</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => {
                    const gap = getCapacityGap(record);
                    return (
                      <tr key={record.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{record.subject_program}</div>
                          <div className="mt-1"><ForecastBadge window={record.forecast_window} /></div>
                        </td>
                        <td className="px-4 py-3">{formatNumber(toNumber(record.current_students, 0))}</td>
                        <td className="px-4 py-3 font-medium text-indigo-600">{formatNumber(toNumber(record.expected_growth, 0))}</td>
                        <td className="px-4 py-3">{formatNumber(toNumber(record.required_tutors, 0))}</td>
                        <td className="px-4 py-3">{formatNumber(toNumber(record.available_tutors, 0))}</td>
                        <td className={gap > 0 ? "px-4 py-3 font-semibold text-red-600" : "px-4 py-3 text-emerald-600"}>{formatNumber(gap)}</td>
                        <td className="px-4 py-3"><YesNoBadge value={record.hiring_needed} yesText="Needed" noText="No" /></td>
                        <td className="px-4 py-3"><RiskBadge risk={record.risk_level} /></td>
                        <td className="px-4 py-3 max-w-[360px] truncate" title={record.action_required}>{record.action_required}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(record)}>
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {record.risk_level !== "High" && record.risk_level !== "Critical" && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleRiskChange(record, "High")}>Mark High</Button>
                            )}
                            {record.risk_level !== "Critical" && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleRiskChange(record, "Critical")}>Critical</Button>
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
                    <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                      No capacity planning records found for this tab and selected month.
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
                    {editingId ? "Edit Capacity Planning Record" : "Add Capacity Planning Record"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-white/80">
                    Add 30-day or 60-day forecast data, tutor capacity, hiring needs and shortage risks.
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
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Forecast Details</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Record month *</FieldLabel>
                        <input type="month" value={form.record_month} onChange={(event) => setFormValue("record_month", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Forecast Window</FieldLabel>
                        <Select value={form.forecast_window} onValueChange={(value) => setFormValue("forecast_window", value as ForecastWindow)}>
                          <SelectTrigger><SelectValue placeholder="Forecast window" /></SelectTrigger>
                          <SelectContent>{FORECAST_WINDOWS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Subject / Program *</FieldLabel>
                        <input value={form.subject_program} onChange={(event) => setFormValue("subject_program", event.target.value)} placeholder="Math / English / IELTS" className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Student Load Projection</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Current Students</FieldLabel>
                        <input type="number" min="0" value={form.current_students} onChange={(event) => setFormValue("current_students", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Expected Growth</FieldLabel>
                        <input type="number" min="0" value={form.expected_growth} onChange={(event) => setFormValue("expected_growth", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Projected Students</FieldLabel>
                        <input value={formatNumber(Number(form.current_students || 0) + Number(form.expected_growth || 0))} readOnly className={inputClassName("bg-muted/40 font-semibold")} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Tutor Capacity</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Required Tutors</FieldLabel>
                        <input type="number" min="0" value={form.required_tutors} onChange={(event) => setFormValue("required_tutors", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Available Tutors</FieldLabel>
                        <input type="number" min="0" value={form.available_tutors} onChange={(event) => setFormValue("available_tutors", event.target.value)} className={inputClassName()} />
                      </div>
                      <div>
                        <FieldLabel>Capacity Gap Auto</FieldLabel>
                        <input value={formatNumber(getFormCapacityGap())} readOnly className={inputClassName("bg-muted/40 font-semibold")} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold">Hiring & Risk Control</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Hiring Needed</FieldLabel>
                        <Select value={form.hiring_needed} onValueChange={(value) => setFormValue("hiring_needed", value as "yes" | "no")}>
                          <SelectTrigger><SelectValue placeholder="Hiring needed" /></SelectTrigger>
                          <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Advance Hiring Request</FieldLabel>
                        <Select value={form.advance_hiring_request} onValueChange={(value) => setFormValue("advance_hiring_request", value as "yes" | "no")}>
                          <SelectTrigger><SelectValue placeholder="Advance request" /></SelectTrigger>
                          <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Risk Level</FieldLabel>
                        <Select value={form.risk_level} onValueChange={(value) => setFormValue("risk_level", value as RiskLevel)}>
                          <SelectTrigger><SelectValue placeholder="Risk level" /></SelectTrigger>
                          <SelectContent>{RISK_LEVELS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Review Date</FieldLabel>
                        <input type="date" value={form.review_date} onChange={(event) => setFormValue("review_date", event.target.value)} className={inputClassName()} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <FieldLabel>Action Required *</FieldLabel>
                    <textarea value={form.action_required} onChange={(event) => setFormValue("action_required", event.target.value)} placeholder="What action is required to prevent shortage? Example: raise hiring request, reassign tutors, train backup tutor, review class allocation..." className={textareaClassName()} />
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <FieldLabel>Notes</FieldLabel>
                    <textarea value={form.notes} onChange={(event) => setFormValue("notes", event.target.value)} placeholder="Add forecast assumptions, subject-specific risk, hiring comments or management recommendation..." className={textareaClassName()} />
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Target className="h-5 w-5 text-indigo-600" />
                        Capacity Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                        <p className="text-xs text-muted-foreground">Subject / Program</p>
                        <p className="font-semibold">{form.subject_program || "New capacity record"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Window</p>
                          <p className="font-semibold">{form.forecast_window}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Risk</p>
                          <p className="font-semibold">{form.risk_level}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Projected Students</p>
                          <p className="font-semibold">{formatNumber(Number(form.current_students || 0) + Number(form.expected_growth || 0))}</p>
                        </div>
                        <div className="rounded-lg bg-white p-3 dark:bg-slate-950/40">
                          <p className="text-xs text-muted-foreground">Capacity Gap</p>
                          <p className="font-semibold">{formatNumber(getFormCapacityGap())}</p>
                        </div>
                      </div>
                      {(form.risk_level === "High" || form.risk_level === "Critical" || getFormCapacityGap() > 0) && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                          This forecast needs capacity action because it has a gap or high shortage risk.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-card">
                    <CardHeader>
                      <CardTitle className="text-base">This Page Tracks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 text-indigo-600" />30-day and 60-day student load forecasts.</div>
                      <div className="flex gap-2"><Users className="mt-0.5 h-4 w-4 text-indigo-600" />Required tutors, available tutors and capacity gaps.</div>
                      <div className="flex gap-2"><UserPlus className="mt-0.5 h-4 w-4 text-indigo-600" />Advance hiring requests before shortage happens.</div>
                      <div className="flex gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 text-indigo-600" />High and critical shortage risk alerts.</div>
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
