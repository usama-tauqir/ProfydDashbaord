"use client";

import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
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
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Edit3,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RoleCategory = "Tutor" | "Non-Teaching Staff";
type Shift = "Morning" | "Night" | "Flexible";
type EmployeeStatus = "Active" | "On Leave" | "Inactive";

type TrainingCategory =
  | "Onboarding"
  | "Teaching Skills"
  | "Compliance"
  | "Product"
  | "Sales"
  | "Leadership"
  | "Operations"
  | "Other";

type TrainingMethod = "In-Person" | "Online" | "Hybrid" | "Self-Paced";
type TrainingStatus = "Scheduled" | "In Progress" | "Completed" | "Cancelled";
type AssessmentStatus = "Not Required" | "Pending" | "Passed" | "Failed";

type EmployeeRecord = {
  id: string;
  employee_name: string;
  employee_code: string | null;
  department: string;
  role_title: string;
  role_category: RoleCategory;
  shift: Shift;
  status: EmployeeStatus;
  start_date: string;
  end_date: string | null;
  fte: number | string | null;
  created_at: string;
  updated_at: string | null;
};

type TrainingRecord = {
  id: string;
  month: string;
  employee_id: string;
  employee_name: string;
  employee_code: string | null;
  department: string;
  role_title: string | null;
  role_category: RoleCategory;
  shift: Shift;

  training_title: string;
  training_category: TrainingCategory;
  training_method: TrainingMethod;
  training_status: TrainingStatus;
  training_date: string;
  trainer_name: string | null;
  training_hours: number | string;

  new_hire_onboarding: boolean;
  employee_attended: boolean;
  assessment_status: AssessmentStatus;
  score_percent: number | string | null;
  certificate_issued: boolean;

  follow_up_required: boolean;
  follow_up_date: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string | null;
};

type TrainingForm = {
  month: string;
  employee_id: string;

  training_title: string;
  training_category: TrainingCategory;
  training_method: TrainingMethod;
  training_status: TrainingStatus;
  training_date: string;
  trainer_name: string;
  training_hours: string;

  new_hire_onboarding: string;
  employee_attended: string;
  assessment_status: AssessmentStatus;
  score_percent: string;
  certificate_issued: string;

  follow_up_required: string;
  follow_up_date: string;
  notes: string;
};

type DepartmentFilter = "all" | string;
type RoleFilter = "all" | RoleCategory;
type ShiftFilter = "all" | Shift;
type CategoryFilter = "all" | TrainingCategory;
type StatusFilter = "all" | TrainingStatus;
type MethodFilter = "all" | TrainingMethod;

const ROLE_CATEGORIES: RoleCategory[] = ["Tutor", "Non-Teaching Staff"];
const SHIFTS: Shift[] = ["Morning", "Night", "Flexible"];

const TRAINING_CATEGORIES: TrainingCategory[] = [
  "Onboarding",
  "Teaching Skills",
  "Compliance",
  "Product",
  "Sales",
  "Leadership",
  "Operations",
  "Other",
];

const TRAINING_METHODS: TrainingMethod[] = [
  "In-Person",
  "Online",
  "Hybrid",
  "Self-Paced",
];

const TRAINING_STATUSES: TrainingStatus[] = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
];

const ASSESSMENT_STATUSES: AssessmentStatus[] = [
  "Not Required",
  "Pending",
  "Passed",
  "Failed",
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return date.toISOString().slice(0, 7);
}

function getMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getLastMonths(selectedMonth: string, count = 6) {
  const [year, monthNumber] = selectedMonth.split("-").map(Number);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, monthNumber - 1 - (count - 1 - index), 1);
    return date.toISOString().slice(0, 7);
  });
}

function emptyForm(month = getCurrentMonth()): TrainingForm {
  return {
    month,
    employee_id: "",

    training_title: "",
    training_category: "Onboarding",
    training_method: "Online",
    training_status: "Completed",
    training_date: getTodayDate(),
    trainer_name: "",
    training_hours: "",

    new_hire_onboarding: "false",
    employee_attended: "true",
    assessment_status: "Not Required",
    score_percent: "",
    certificate_issued: "false",

    follow_up_required: "false",
    follow_up_date: "",
    notes: "",
  };
}

function toBool(value: string | boolean | null | undefined) {
  if (typeof value === "boolean") return value;
  return value === "true";
}

function toNumber(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function plainPercentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function percentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function trendDirection(value: number): "up" | "down" | "neutral" {
  if (!Number.isFinite(value) || value === 0) return "neutral";
  return value > 0 ? "up" : "down";
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
  return `h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${extra}`;
}

function textareaClassName(extra = "") {
  return `min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${extra}`;
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

function TrendBadge({
  direction,
  label,
}: {
  direction: "up" | "down" | "neutral";
  label: string;
}) {
  const config = {
    up: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: ArrowUpRight,
    },
    down: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-700 dark:text-red-300",
      icon: ArrowDownRight,
    },
    neutral: {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-600 dark:text-gray-400",
      icon: Minus,
    },
  };

  const { bg, text, icon: Icon } = config[direction];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${bg} ${text}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  highlight = false,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: ElementType;
  subtitle?: string;
  trend?: ReactNode;
  highlight?: boolean;
  variant?: "default" | "outline" | "warning";
}) {
  const variantStyles = {
    default: "bg-card border-border",
    outline: "bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700",
    warning: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
  };

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        highlight ? "ring-1 ring-indigo-200 dark:ring-indigo-800" : ""
      } ${variantStyles[variant]}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
            {trend && <div className="mt-2">{trend}</div>}
          </div>
          <div className="ml-3 rounded-full bg-muted/60 p-2.5">
            <Icon className="h-5 w-5 text-indigo-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function uniqueCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

function getSessionKey(record: TrainingRecord) {
  return `${record.training_title}|${record.training_date}|${record.trainer_name || ""}`;
}

export default function HRTrainingDevelopmentPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState<TrainingForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const [employeesResponse, trainingResponse] = await Promise.all([
        supabase
          .from("hr_employee_records")
          .select("*")
          .order("employee_name", { ascending: true }),

        supabase
          .from("hr_training_development_records")
          .select("*")
          .order("month", { ascending: false })
          .order("training_date", { ascending: false }),
      ]);

      if (employeesResponse.error) throw new Error(employeesResponse.error.message);
      if (trainingResponse.error) throw new Error(trainingResponse.error.message);

      setEmployees((employeesResponse.data || []) as EmployeeRecord[]);
      setRecords((trainingResponse.data || []) as TrainingRecord[]);

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      const text = getErrorMessage(
        error,
        "Could not load training records. Please check hr_employee_records and hr_training_development_records."
      );
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedRecords = useMemo(
    () => records.filter((record) => record.month === selectedMonth),
    [records, selectedMonth]
  );

  const previousMonth = getPreviousMonth(selectedMonth);

  const previousRecords = useMemo(
    () => records.filter((record) => record.month === previousMonth),
    [records, previousMonth]
  );

  const departmentOptions = useMemo(() => {
    const employeeDepartments = employees.map((employee) => employee.department).filter(Boolean);
    const recordDepartments = records.map((record) => record.department).filter(Boolean);
    return Array.from(new Set([...employeeDepartments, ...recordDepartments])).sort();
  }, [employees, records]);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "Active" || employee.status === "On Leave"),
    [employees]
  );

  const visibleRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return selectedRecords
      .filter((record) => departmentFilter === "all" || record.department === departmentFilter)
      .filter((record) => roleFilter === "all" || record.role_category === roleFilter)
      .filter((record) => shiftFilter === "all" || record.shift === shiftFilter)
      .filter((record) => categoryFilter === "all" || record.training_category === categoryFilter)
      .filter((record) => statusFilter === "all" || record.training_status === statusFilter)
      .filter((record) => methodFilter === "all" || record.training_method === methodFilter)
      .filter((record) => {
        if (!query) return true;

        return [
          record.employee_name,
          record.employee_code || "",
          record.department,
          record.role_title || "",
          record.role_category,
          record.shift,
          record.training_title,
          record.training_category,
          record.training_method,
          record.training_status,
          record.trainer_name || "",
          record.notes || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => new Date(b.training_date).getTime() - new Date(a.training_date).getTime());
  }, [
    selectedRecords,
    departmentFilter,
    roleFilter,
    shiftFilter,
    categoryFilter,
    statusFilter,
    methodFilter,
    searchQuery,
  ]);

  const completedRecords = selectedRecords.filter(
    (record) => record.training_status === "Completed" && record.employee_attended
  );

  const previousCompletedRecords = previousRecords.filter(
    (record) => record.training_status === "Completed" && record.employee_attended
  );

  const newHiresOnboarded = uniqueCount(
    completedRecords
      .filter((record) => record.new_hire_onboarding)
      .map((record) => record.employee_id)
  );

  const trainingSessionsConducted = uniqueCount(
    completedRecords.map((record) => getSessionKey(record))
  );

  const employeesTrained = uniqueCount(completedRecords.map((record) => record.employee_id));

  const trainingHoursDelivered = completedRecords.reduce(
    (sum, record) => sum + toNumber(record.training_hours),
    0
  );

  const previousNewHiresOnboarded = uniqueCount(
    previousCompletedRecords
      .filter((record) => record.new_hire_onboarding)
      .map((record) => record.employee_id)
  );

  const previousSessionsConducted = uniqueCount(
    previousCompletedRecords.map((record) => getSessionKey(record))
  );

  const previousEmployeesTrained = uniqueCount(
    previousCompletedRecords.map((record) => record.employee_id)
  );

  const previousTrainingHoursDelivered = previousCompletedRecords.reduce(
    (sum, record) => sum + toNumber(record.training_hours),
    0
  );

  const newHireMoM = previousNewHiresOnboarded
    ? ((newHiresOnboarded - previousNewHiresOnboarded) / previousNewHiresOnboarded) * 100
    : newHiresOnboarded > 0
      ? 100
      : 0;

  const sessionsMoM = previousSessionsConducted
    ? ((trainingSessionsConducted - previousSessionsConducted) / previousSessionsConducted) * 100
    : trainingSessionsConducted > 0
      ? 100
      : 0;

  const employeesTrainedMoM = previousEmployeesTrained
    ? ((employeesTrained - previousEmployeesTrained) / previousEmployeesTrained) * 100
    : employeesTrained > 0
      ? 100
      : 0;

  const hoursMoM = previousTrainingHoursDelivered
    ? ((trainingHoursDelivered - previousTrainingHoursDelivered) / previousTrainingHoursDelivered) * 100
    : trainingHoursDelivered > 0
      ? 100
      : 0;

  const scheduledRecords = selectedRecords.filter((record) => record.training_status === "Scheduled").length;
  const inProgressRecords = selectedRecords.filter((record) => record.training_status === "In Progress").length;
  const cancelledRecords = selectedRecords.filter((record) => record.training_status === "Cancelled").length;
  const followUpsRequired = selectedRecords.filter((record) => record.follow_up_required).length;
  const certificatesIssued = completedRecords.filter((record) => record.certificate_issued).length;
  const assessmentsPassed = completedRecords.filter((record) => record.assessment_status === "Passed").length;
  const assessmentsFailed = completedRecords.filter((record) => record.assessment_status === "Failed").length;

  const completionRate = selectedRecords.length
    ? (completedRecords.length / selectedRecords.length) * 100
    : 0;

  const trainingCoverageRate = activeEmployees.length
    ? (employeesTrained / activeEmployees.length) * 100
    : 0;

  const averageHoursPerEmployee = employeesTrained
    ? trainingHoursDelivered / employeesTrained
    : 0;

  const averageScore = completedRecords.filter((record) => record.score_percent !== null).length
    ? completedRecords.reduce((sum, record) => sum + toNumber(record.score_percent), 0) /
      completedRecords.filter((record) => record.score_percent !== null).length
    : 0;

  const departmentSummary = useMemo(() => {
    return departmentOptions
      .map((department) => {
        const departmentRecords = selectedRecords.filter((record) => record.department === department);
        const departmentCompleted = departmentRecords.filter(
          (record) => record.training_status === "Completed" && record.employee_attended
        );

        return {
          department,
          employeesTrained: uniqueCount(departmentCompleted.map((record) => record.employee_id)),
          sessions: uniqueCount(departmentCompleted.map((record) => getSessionKey(record))),
          hours: departmentCompleted.reduce((sum, record) => sum + toNumber(record.training_hours), 0),
          onboarding: uniqueCount(
            departmentCompleted
              .filter((record) => record.new_hire_onboarding)
              .map((record) => record.employee_id)
          ),
          followUps: departmentRecords.filter((record) => record.follow_up_required).length,
        };
      })
      .filter((item) => item.employeesTrained + item.sessions + item.hours + item.onboarding + item.followUps > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [departmentOptions, selectedRecords]);

  const roleSummary = ROLE_CATEGORIES.map((role) => {
    const roleRecords = selectedRecords.filter((record) => record.role_category === role);
    const roleCompleted = roleRecords.filter(
      (record) => record.training_status === "Completed" && record.employee_attended
    );

    return {
      name: role === "Non-Teaching Staff" ? "Non-Teaching" : role,
      employeesTrained: uniqueCount(roleCompleted.map((record) => record.employee_id)),
      sessions: uniqueCount(roleCompleted.map((record) => getSessionKey(record))),
      hours: roleCompleted.reduce((sum, record) => sum + toNumber(record.training_hours), 0),
      onboarding: uniqueCount(
        roleCompleted
          .filter((record) => record.new_hire_onboarding)
          .map((record) => record.employee_id)
      ),
    };
  });

  const categorySummary = TRAINING_CATEGORIES.map((category) => {
    const categoryRecords = selectedRecords.filter((record) => record.training_category === category);
    const categoryCompleted = categoryRecords.filter(
      (record) => record.training_status === "Completed" && record.employee_attended
    );

    return {
      category,
      employeesTrained: uniqueCount(categoryCompleted.map((record) => record.employee_id)),
      sessions: uniqueCount(categoryCompleted.map((record) => getSessionKey(record))),
      hours: categoryCompleted.reduce((sum, record) => sum + toNumber(record.training_hours), 0),
    };
  }).filter((item) => item.employeesTrained + item.sessions + item.hours > 0);

  const trainingTrend = useMemo(() => {
    return getLastMonths(selectedMonth, 6).map((month) => {
      const monthRecords = records.filter((record) => record.month === month);
      const monthCompleted = monthRecords.filter(
        (record) => record.training_status === "Completed" && record.employee_attended
      );

      return {
        month: getMonthLabel(month),
        newHires: uniqueCount(
          monthCompleted
            .filter((record) => record.new_hire_onboarding)
            .map((record) => record.employee_id)
        ),
        sessions: uniqueCount(monthCompleted.map((record) => getSessionKey(record))),
        employeesTrained: uniqueCount(monthCompleted.map((record) => record.employee_id)),
        hours: monthCompleted.reduce((sum, record) => sum + toNumber(record.training_hours), 0),
        completionRate: monthRecords.length ? (monthCompleted.length / monthRecords.length) * 100 : 0,
      };
    });
  }, [records, selectedMonth]);

  const missingTrainingEmployees = activeEmployees.filter((employee) => {
    return !completedRecords.some((record) => record.employee_id === employee.id);
  });

  const topTrainingRecords = [...completedRecords]
    .sort((a, b) => toNumber(b.training_hours) - toNumber(a.training_hours))
    .slice(0, 5);

  const alerts = useMemo(() => {
    const items = [];

    if (trainingCoverageRate < 50 && activeEmployees.length > 0) {
      items.push(`Training coverage is ${plainPercentage(trainingCoverageRate)}. Consider training more active employees this month.`);
    }

    if (missingTrainingEmployees.length > 0) {
      items.push(`${missingTrainingEmployees.length} active employee(s) have no completed training record this month.`);
    }

    if (followUpsRequired > 0) {
      items.push(`${followUpsRequired} training follow-up(s) are required. Review coaching or re-training plans.`);
    }

    if (assessmentsFailed > 0) {
      items.push(`${assessmentsFailed} assessment(s) failed. Schedule re-training or manager follow-up.`);
    }

    if (scheduledRecords > 0) {
      items.push(`${scheduledRecords} training record(s) are still scheduled. Confirm attendance after session completion.`);
    }

    if (cancelledRecords > 0) {
      items.push(`${cancelledRecords} training session attendance record(s) were cancelled. Check if rescheduling is needed.`);
    }

    if (newHiresOnboarded === 0 && selectedRecords.some((record) => record.training_category === "Onboarding")) {
      items.push("Onboarding records exist, but no completed new-hire onboarding has been counted yet.");
    }

    if (!items.length) {
      items.push("Training and development status looks stable. Continue monitoring coverage, completion, assessments and follow-ups.");
    }

    return items;
  }, [
    trainingCoverageRate,
    activeEmployees.length,
    missingTrainingEmployees.length,
    followUpsRequired,
    assessmentsFailed,
    scheduledRecords,
    cancelledRecords,
    newHiresOnboarded,
    selectedRecords,
  ]);

  function setFormValue<K extends keyof TrainingForm>(key: K, value: TrainingForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(selectedMonth));
  }

  function handleEmployeeChange(employeeId: string) {
    setForm((previous) => ({
      ...previous,
      employee_id: employeeId === "none" ? "" : employeeId,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedEmployee = employees.find((employee) => employee.id === form.employee_id);
    const trainingHours = toNumber(form.training_hours);
    const score = form.score_percent === "" ? null : toNumber(form.score_percent);

    if (!form.month || !selectedEmployee || !form.training_title.trim() || !form.training_date) {
      setMessage({
        type: "error",
        text: "Please select month, employee, training title and training date.",
      });
      return;
    }

    if (trainingHours <= 0) {
      setMessage({
        type: "error",
        text: "Training hours must be greater than 0.",
      });
      return;
    }

    if (score !== null && (score < 0 || score > 100)) {
      setMessage({
        type: "error",
        text: "Score percent must be between 0 and 100.",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        month: form.month,
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.employee_name,
        employee_code: selectedEmployee.employee_code,
        department: selectedEmployee.department,
        role_title: selectedEmployee.role_title,
        role_category: selectedEmployee.role_category,
        shift: selectedEmployee.shift,

        training_title: form.training_title.trim(),
        training_category: form.training_category,
        training_method: form.training_method,
        training_status: form.training_status,
        training_date: form.training_date,
        trainer_name: form.trainer_name.trim() || null,
        training_hours: trainingHours,

        new_hire_onboarding: toBool(form.new_hire_onboarding),
        employee_attended: toBool(form.employee_attended),
        assessment_status: form.assessment_status,
        score_percent: score,
        certificate_issued: toBool(form.certificate_issued),

        follow_up_required: toBool(form.follow_up_required),
        follow_up_date: toBool(form.follow_up_required) ? form.follow_up_date || null : null,
        notes: form.notes.trim() || null,
      };

      const response = editingId
        ? await supabase
            .from("hr_training_development_records")
            .update(payload)
            .eq("id", editingId)
            .select()
            .single()
        : await supabase
            .from("hr_training_development_records")
            .insert(payload)
            .select()
            .single();

      if (response.error) throw new Error(response.error.message);

      setSelectedMonth(form.month);
      setMessage({
        type: "success",
        text: editingId ? "Training record updated." : "Training record created.",
      });

      resetForm();
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not save training record.");
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(record: TrainingRecord) {
    setEditingId(record.id);
    setForm({
      month: record.month,
      employee_id: record.employee_id,

      training_title: record.training_title,
      training_category: record.training_category,
      training_method: record.training_method,
      training_status: record.training_status,
      training_date: record.training_date,
      trainer_name: record.trainer_name || "",
      training_hours: String(record.training_hours || ""),

      new_hire_onboarding: String(record.new_hire_onboarding),
      employee_attended: String(record.employee_attended),
      assessment_status: record.assessment_status,
      score_percent: record.score_percent === null ? "" : String(record.score_percent || ""),
      certificate_issued: String(record.certificate_issued),

      follow_up_required: String(record.follow_up_required),
      follow_up_date: record.follow_up_date || "",
      notes: record.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(record: TrainingRecord) {
    const confirmed = window.confirm(`Delete training record for ${record.employee_name}?`);
    if (!confirmed) return;

    try {
      setMessage(null);

      const { error } = await supabase
        .from("hr_training_development_records")
        .delete()
        .eq("id", record.id);

      if (error) throw new Error(error.message);

      setMessage({ type: "success", text: "Training record deleted." });
      await fetchData();
    } catch (error) {
      const text = getErrorMessage(error, "Could not delete training record.");
      setMessage({ type: "error", text });
    }
  }

  if (loading && employees.length === 0 && records.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading HR training records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Department - Training & Development</h1>
          <p className="text-muted-foreground">
            Track onboarding, training sessions, trained employees and delivered training hours.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-xs text-muted-foreground">Last updated: {lastUpdated}</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              setSelectedMonth(event.target.value);
              setForm((previous) => ({ ...previous, month: event.target.value }));
            }}
            className={inputClassName("w-full sm:w-[150px]")}
          />
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
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

      <SectionTitle icon={GraduationCap} title="G. Training & Development" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="New hires onboarded"
          value={formatNumber(newHiresOnboarded)}
          icon={UserCheck}
          subtitle="Completed new-hire onboarding"
          trend={<TrendBadge direction={trendDirection(newHireMoM)} label={`${percentage(newHireMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Training sessions conducted"
          value={formatNumber(trainingSessionsConducted)}
          icon={BookOpen}
          subtitle="Unique completed sessions"
          trend={<TrendBadge direction={trendDirection(sessionsMoM)} label={`${percentage(sessionsMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Employees trained"
          value={formatNumber(employeesTrained)}
          icon={Users}
          subtitle={`${plainPercentage(trainingCoverageRate)} active employee coverage`}
          trend={<TrendBadge direction={trendDirection(employeesTrainedMoM)} label={`${percentage(employeesTrainedMoM)} MoM`} />}
          highlight
        />

        <MetricCard
          title="Training hours delivered"
          value={formatNumber(trainingHoursDelivered)}
          icon={Clock3}
          subtitle="Completed employee training hours"
          trend={<TrendBadge direction={trendDirection(hoursMoM)} label={`${percentage(hoursMoM)} MoM`} />}
          highlight
        />
      </div>

      <SectionTitle icon={LayoutDashboard} title="Training Overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Completion rate"
          value={plainPercentage(completionRate)}
          icon={Target}
          subtitle={`${formatNumber(completedRecords.length)} completed attendance records`}
          variant="outline"
        />

        <MetricCard
          title="Average hours per employee"
          value={averageHoursPerEmployee.toFixed(1)}
          icon={TrendingUp}
          subtitle="Training hours ÷ employees trained"
          variant="outline"
        />

        <MetricCard
          title="Certificates issued"
          value={formatNumber(certificatesIssued)}
          icon={Award}
          subtitle={`${formatNumber(assessmentsPassed)} passed assessment(s)`}
          variant="outline"
        />

        <MetricCard
          title="Follow-ups required"
          value={formatNumber(followUpsRequired)}
          icon={AlertCircle}
          subtitle={`${formatNumber(assessmentsFailed)} failed assessment(s)`}
          variant={followUpsRequired + assessmentsFailed > 0 ? "warning" : "outline"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Scheduled"
          value={formatNumber(scheduledRecords)}
          icon={CalendarCheck}
          subtitle="Upcoming training records"
          variant="outline"
        />

        <MetricCard
          title="In progress"
          value={formatNumber(inProgressRecords)}
          icon={Clock3}
          subtitle="Ongoing training records"
          variant="outline"
        />

        <MetricCard
          title="Cancelled"
          value={formatNumber(cancelledRecords)}
          icon={AlertCircle}
          subtitle="Cancelled training records"
          variant={cancelledRecords > 0 ? "warning" : "outline"}
        />

        <MetricCard
          title="Average score"
          value={averageScore ? `${averageScore.toFixed(1)}%` : "—"}
          icon={ShieldCheck}
          subtitle="Average score across scored records"
          variant="outline"
        />
      </div>

      <SectionTitle icon={Plus} title={editingId ? "Update Training Record" : "Add Training Record"} />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">
              {editingId ? "Edit training details" : "New training & development record"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select an employee. Department, role and shift will be copied automatically from HR headcount.
            </p>
          </div>

          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <FieldLabel>Month</FieldLabel>
              <input
                type="month"
                value={form.month}
                onChange={(event) => setFormValue("month", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-4">
              <FieldLabel>Employee</FieldLabel>
              <Select value={form.employee_id || "none"} onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select employee</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.employee_name} · {employee.role_category} · {employee.shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-4">
              <FieldLabel>Training title</FieldLabel>
              <input
                value={form.training_title}
                onChange={(event) => setFormValue("training_title", event.target.value)}
                placeholder="New Tutor Onboarding"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Training date</FieldLabel>
              <input
                type="date"
                value={form.training_date}
                onChange={(event) => setFormValue("training_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Category</FieldLabel>
              <Select
                value={form.training_category}
                onValueChange={(value) => setFormValue("training_category", value as TrainingCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Method</FieldLabel>
              <Select
                value={form.training_method}
                onValueChange={(value) => setFormValue("training_method", value as TrainingMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Status</FieldLabel>
              <Select
                value={form.training_status}
                onValueChange={(value) => setFormValue("training_status", value as TrainingStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Training hours</FieldLabel>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.training_hours}
                onChange={(event) => setFormValue("training_hours", event.target.value)}
                placeholder="2"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Trainer name</FieldLabel>
              <input
                value={form.trainer_name}
                onChange={(event) => setFormValue("trainer_name", event.target.value)}
                placeholder="Trainer / Manager"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>New hire onboarding?</FieldLabel>
              <Select
                value={form.new_hire_onboarding}
                onValueChange={(value) => setFormValue("new_hire_onboarding", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="New hire?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Employee attended?</FieldLabel>
              <Select
                value={form.employee_attended}
                onValueChange={(value) => setFormValue("employee_attended", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Attended?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Assessment status</FieldLabel>
              <Select
                value={form.assessment_status}
                onValueChange={(value) => setFormValue("assessment_status", value as AssessmentStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assessment" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Score %</FieldLabel>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.score_percent}
                onChange={(event) => setFormValue("score_percent", event.target.value)}
                placeholder="85"
                className={inputClassName()}
              />
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Certificate issued?</FieldLabel>
              <Select
                value={form.certificate_issued}
                onValueChange={(value) => setFormValue("certificate_issued", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Certificate?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Follow-up required?</FieldLabel>
              <Select
                value={form.follow_up_required}
                onValueChange={(value) => setFormValue("follow_up_required", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Follow-up?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Follow-up date</FieldLabel>
              <input
                type="date"
                value={form.follow_up_date}
                onChange={(event) => setFormValue("follow_up_date", event.target.value)}
                className={inputClassName()}
              />
            </div>

            <div className="flex items-end lg:col-span-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit3 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Update" : "Save"}
              </Button>
            </div>

            <div className="lg:col-span-12">
              <FieldLabel>Training notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => setFormValue("notes", event.target.value)}
                placeholder="Optional: training feedback, improvement area, follow-up plan, certificate notes, assessment comments, etc."
                className={textareaClassName()}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <SectionTitle icon={BarChart3} title="Training Analytics" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role-wise Training</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="employeesTrained" name="Employees Trained" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sessions" name="Sessions" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hours" name="Hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="onboarding" name="Onboarding" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category-wise Training</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="employeesTrained" name="Employees Trained" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sessions" name="Sessions" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hours" name="Hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department-wise Training</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSummary} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value) || 0), ""]} />
                <Legend />
                <Bar dataKey="employeesTrained" name="Employees Trained" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sessions" name="Sessions" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hours" name="Hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="followUps" name="Follow-ups" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6-Month Training Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trainingTrend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: unknown, name) => {
                    if (name === "Completion Rate") return [`${Number(value).toFixed(1)}%`, name];
                    return [formatNumber(Number(value) || 0), name];
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="completionRate" name="Completion Rate" stroke="#10b981" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="sessions" name="Sessions" stroke="#4f46e5" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="employeesTrained" name="Employees Trained" stroke="#f59e0b" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="hours" name="Hours" stroke="#ef4444" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={ShieldCheck} title="Training Controls & Alerts" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Training Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Automatic checks for training coverage, missing training records, failed assessments, follow-ups, scheduled sessions and cancelled sessions.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <p className="text-sm text-muted-foreground">{alert}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mandatory Training Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "New hires onboarded",
              "Training sessions conducted",
              "Employees trained",
              "Training hours delivered",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{item}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Training Hour Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTrainingRecords.length ? (
                topTrainingRecords.map((record, index) => (
                  <div key={record.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-semibold">
                        {index + 1}. {record.employee_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.training_title} · {record.training_category} · {record.training_date}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-indigo-600">
                      {toNumber(record.training_hours)} hrs
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No completed training records this month.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Active employees without training</p>
              <p className="text-2xl font-bold">{formatNumber(missingTrainingEmployees.length)}</p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Follow-ups required</p>
              <p className="text-2xl font-bold">{formatNumber(followUpsRequired)}</p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Assessment passed</p>
              <p className="text-2xl font-bold">{formatNumber(assessmentsPassed)}</p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Assessment failed</p>
              <p className="text-2xl font-bold">{formatNumber(assessmentsFailed)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Search} title="Training Records" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Search, filter, edit and delete training records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(visibleRecords.length)} of {formatNumber(selectedRecords.length)} records for {getMonthLabel(selectedMonth)}.
              </p>
            </div>

            <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-7">
            <div>
              <FieldLabel>Department</FieldLabel>
              <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departmentOptions.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Role</FieldLabel>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLE_CATEGORIES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Shift</FieldLabel>
              <Select value={shiftFilter} onValueChange={(value) => setShiftFilter(value as ShiftFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All shifts</SelectItem>
                  {SHIFTS.map((shift) => (
                    <SelectItem key={shift} value={shift}>
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Category</FieldLabel>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {TRAINING_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Status</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {TRAINING_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Method</FieldLabel>
              <Select value={methodFilter} onValueChange={(value) => setMethodFilter(value as MethodFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  {TRAINING_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
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
                  placeholder="Search training..."
                  className={inputClassName("pl-9")}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[1720px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Training</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Hours</th>
                  <th className="px-4 py-3 font-semibold">Trainer</th>
                  <th className="px-4 py-3 font-semibold">Onboarding</th>
                  <th className="px-4 py-3 font-semibold">Attended</th>
                  <th className="px-4 py-3 font-semibold">Assessment</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Certificate</th>
                  <th className="px-4 py-3 font-semibold">Follow-up</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={18} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600" />
                      Loading training records…
                    </td>
                  </tr>
                ) : visibleRecords.length ? (
                  visibleRecords.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3">{record.month}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold">{record.employee_name}</p>
                          <p className="text-xs text-muted-foreground">{record.employee_code || "No code"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{record.department}</td>
                      <td className="px-4 py-3">{record.role_category}</td>
                      <td className="px-4 py-3">{record.training_category}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold">{record.training_title}</p>
                          <p className="text-xs text-muted-foreground">{record.role_title || "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{record.training_date}</td>
                      <td className="px-4 py-3">{record.training_method}</td>
                      <td className="px-4 py-3">
                        <TrendBadge
                          direction={
                            record.training_status === "Completed"
                              ? "up"
                              : record.training_status === "Cancelled"
                                ? "down"
                                : "neutral"
                          }
                          label={record.training_status}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">{toNumber(record.training_hours)}</td>
                      <td className="px-4 py-3">{record.trainer_name || "—"}</td>
                      <td className="px-4 py-3">
                        <TrendBadge direction={record.new_hire_onboarding ? "up" : "neutral"} label={record.new_hire_onboarding ? "Yes" : "No"} />
                      </td>
                      <td className="px-4 py-3">
                        <TrendBadge direction={record.employee_attended ? "up" : "down"} label={record.employee_attended ? "Yes" : "No"} />
                      </td>
                      <td className="px-4 py-3">
                        <TrendBadge
                          direction={
                            record.assessment_status === "Passed"
                              ? "up"
                              : record.assessment_status === "Failed"
                                ? "down"
                                : "neutral"
                          }
                          label={record.assessment_status}
                        />
                      </td>
                      <td className="px-4 py-3">{record.score_percent !== null ? `${record.score_percent}%` : "—"}</td>
                      <td className="px-4 py-3">
                        <TrendBadge direction={record.certificate_issued ? "up" : "neutral"} label={record.certificate_issued ? "Yes" : "No"} />
                      </td>
                      <td className="px-4 py-3">
                        <TrendBadge direction={record.follow_up_required ? "down" : "up"} label={record.follow_up_required ? "Required" : "No"} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="icon" onClick={() => handleEdit(record)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
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
                    <td colSpan={18} className="px-4 py-10 text-center text-muted-foreground">
                      No training records found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}