"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";
import { ALL_KEYS, LABEL_MAP } from "@/lib/data";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Filter,
  History,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PortalUser = {
  id: string;
  displayName: string;
};

type Teacher = {
  portal_user?: string;
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  // Teacher visibility is timeline-based now.
  // A teacher appears from effective_from_month and disappears from effective_to_month onward.
  effective_from_month?: string | null;
  effective_to_month?: string | null;
};

type DailyRecord = {
  id?: string;
  portal_user: string;
  date_iso: string;
  date_label: string;
  month_key: string;
  sort_order: number;
  completed: Record<string, number>;
  cancelled: Record<string, number>;
  notes: string;
};

type EditLog = {
  id: string;
  date_label: string;
  teacher_name: string;
  section: "completed" | "cancelled" | "notes" | "teachers" | "save";
  detail: string;
  time: string;
};

const PORTAL_USERS: PortalUser[] = [
  { id: "zainab", displayName: "Zainab" },
  { id: "aniqa", displayName: "Aniqa" },
  { id: "bilal", displayName: "Bilal" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Teacher names are stored with a month timeline.
// Add in a month = visible from that month and all future months.
// Remove in a month = hidden from that month and future months, while previous saved months stay safe.
const YEAR_SELECT_START = 2020;
const YEARS_AHEAD_IN_FILTER = 10;
const DEFAULT_EFFECTIVE_FROM_MONTH = "0000-01";

const DEFAULT_TEACHERS: Teacher[] = ALL_KEYS.map((id, index) => ({
  id,
  name: LABEL_MAP[id] || id,
  sort_order: index,
  is_active: true,
  effective_from_month: DEFAULT_EFFECTIVE_FROM_MONTH,
  effective_to_month: null,
}));

function defaultTeachersForUser(userId: string): Teacher[] {
  return DEFAULT_TEACHERS.map((teacher, index) => ({
    ...teacher,
    portal_user: userId,
    sort_order: index,
    is_active: teacher.is_active !== false,
    effective_from_month: teacher.effective_from_month || DEFAULT_EFFECTIVE_FROM_MONTH,
    effective_to_month: teacher.effective_to_month || null,
  }));
}

function makeUniqueTeachers(list: Teacher[], userId: string): Teacher[] {
  const used = new Set<string>();

  return list.map((teacher, index) => {
    const baseId = String(teacher.id || slugify(teacher.name) || `teacher_${index + 1}`);
    let finalId = baseId;
    let counter = 2;

    while (used.has(finalId)) {
      finalId = `${baseId}_${counter}`;
      counter += 1;
    }

    used.add(finalId);

    return {
      ...teacher,
      portal_user: userId,
      id: finalId,
      name: teacher.name || `Teacher ${index + 1}`,
      sort_order: index,
      is_active: teacher.is_active !== false,
      effective_from_month: teacher.effective_from_month || DEFAULT_EFFECTIVE_FROM_MONTH,
      effective_to_month: teacher.effective_to_month || null,
    };
  });
}

function isTeacherVisibleInMonth(teacher: Teacher, monthKey: string) {
  if (teacher.is_active === false) return false;

  const fromMonth = teacher.effective_from_month || DEFAULT_EFFECTIVE_FROM_MONTH;
  const toMonth = teacher.effective_to_month;

  return fromMonth <= monthKey && (!toMonth || monthKey < toMonth);
}

function teachersForMonth(list: Teacher[], monthKey: string) {
  return list.filter((teacher) => isTeacherVisibleInMonth(teacher, monthKey));
}

function getTeacherTimelineStatus(teacher: Teacher, monthKey: string) {
  if (isTeacherVisibleInMonth(teacher, monthKey)) return "Visible this month";

  const fromMonth = teacher.effective_from_month || DEFAULT_EFFECTIVE_FROM_MONTH;
  const toMonth = teacher.effective_to_month;

  if (monthKey < fromMonth) return `Starts from ${getMonthLabel(fromMonth)}`;
  if (toMonth && monthKey >= toMonth) return `Removed from ${getMonthLabel(toMonth)}`;

  return "Not visible this month";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateLabel(d: Date) {
  return `${pad(d.getDate())}-${MONTH_SHORT[d.getMonth()]}-${d.getFullYear()}`;
}

function addDays(d: Date, days: number) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getCycleKeyFromDate(d: Date) {
  let y = d.getFullYear();
  let m = d.getMonth();

  if (d.getDate() < 25) {
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
  }

  return `${y}-${pad(m + 1)}`;
}

function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

function getMonthLabel(monthKey: string) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

function getMonthRange(monthKey: string) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const start = new Date(year, monthIndex, 25);
  const end = new Date(year, monthIndex + 1, 24);
  return `${dateLabel(start)} → ${dateLabel(end)}`;
}

function monthKeyFromParts(year: number, monthIndex: number) {
  return `${year}-${pad(monthIndex + 1)}`;
}

function addMonthsToMonthKey(monthKey: string, amount: number) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const d = new Date(year, monthIndex + amount, 1);
  return monthKeyFromParts(d.getFullYear(), d.getMonth());
}

function makeYearOptions(selectedYear: number) {
  const currentYear = new Date().getFullYear();
  const start = Math.min(YEAR_SELECT_START, selectedYear - 2);
  const end = Math.max(currentYear + YEARS_AHEAD_IN_FILTER, selectedYear + 2);
  const years: number[] = [];

  for (let year = end; year >= start; year -= 1) {
    years.push(year);
  }

  return years;
}

function datesForMonth(monthKey: string) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const start = new Date(year, monthIndex, 25);
  const end = new Date(year, monthIndex + 1, 24);
  const dates: Date[] = [];

  for (let d = start; d <= end; d = addDays(d, 1)) {
    dates.push(d);
  }

  return dates;
}

function currentMonthKey() {
  return getCycleKeyFromDate(new Date());
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || `teacher_${Date.now()}`
  );
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  result.push(current);
  return result.map((v) => v.trim());
}

function buildBlankRecord(
  userId: string,
  d: Date,
  sortOrder: number,
  teachers: Teacher[],
): DailyRecord {
  const completed: Record<string, number> = {};
  const cancelled: Record<string, number> = {};

  teachers.forEach((teacher) => {
    completed[teacher.id] = 0;
    cancelled[teacher.id] = 0;
  });

  return {
    portal_user: userId,
    date_iso: dateISO(d),
    date_label: dateLabel(d),
    month_key: getCycleKeyFromDate(d),
    sort_order: sortOrder,
    completed,
    cancelled,
    notes: "",
  };
}

function normalizeRecord(row: DailyRecord, teachers: Teacher[]): DailyRecord {
  const completed: Record<string, number> = { ...row.completed };
  const cancelled: Record<string, number> = { ...row.cancelled };

  teachers.forEach((teacher) => {
    if (completed[teacher.id] === undefined) completed[teacher.id] = 0;
    if (cancelled[teacher.id] === undefined) cancelled[teacher.id] = 0;
  });

  return {
    ...row,
    completed,
    cancelled,
    notes: row.notes || "",
  };
}

function escapeCSV(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function generateCSV(records: DailyRecord[], teachers: Teacher[]) {
  const activeTeachers = teachers;

  const header = [
    "Date",
    ...activeTeachers.map((t) => `Completed ${t.name}`),
    "Completed Daily Total",
    ...activeTeachers.map((t) => `Cancelled ${t.name}`),
    "Cancelled Daily Total",
    "Notes",
  ];

  const rows = records.map((record) => {
    const completedTotal = activeTeachers.reduce(
      (sum, teacher) => sum + (record.completed[teacher.id] || 0),
      0,
    );
    const cancelledTotal = activeTeachers.reduce(
      (sum, teacher) => sum + (record.cancelled[teacher.id] || 0),
      0,
    );

    return [
      record.date_label,
      ...activeTeachers.map((teacher) => record.completed[teacher.id] || 0),
      completedTotal,
      ...activeTeachers.map((teacher) => record.cancelled[teacher.id] || 0),
      cancelledTotal,
      record.notes || "",
    ]
      .map(escapeCSV)
      .join(",");
  });

  return [header.map(escapeCSV).join(","), ...rows].join("\n");
}

function MetricCard({
  title,
  value,
  desc,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string | number;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  variant?: "default" | "success" | "danger" | "warning";
}) {
  const border = {
    default: "border-l-blue-500",
    success: "border-l-emerald-500",
    danger: "border-l-red-500",
    warning: "border-l-amber-500",
  }[variant];

  return (
    <Card className={`border-l-4 ${border}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
          <div className="rounded-2xl bg-muted p-3">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditableCell({
  value,
  onSave,
}: {
  value: number;
  onSave: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value || 0));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(value || 0));
      setTimeout(() => ref.current?.select(), 0);
    }
  }, [editing, value]);

  const commit = () => {
    const next = Math.max(
      0,
      Math.min(999, Number.parseInt(draft || "0", 10) || 0),
    );
    onSave(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        type="number"
        min={0}
        max={999}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            commit();
          }

          if (e.key === "Escape") {
            setEditing(false);
          }
        }}
        className="h-8 w-14 rounded-md border-2 border-primary bg-background text-center text-sm font-semibold outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`inline-flex min-w-10 items-center justify-center rounded-md px-2 py-1 text-sm transition hover:bg-primary/10 ${value > 0 ? "font-semibold text-foreground" : "text-muted-foreground/40"
        }`}
      title="Click to edit"
    >
      {value || 0}
    </button>
  );
}

export default function AdvancedClassPortalPage() {
  const [selectedUser, setSelectedUser] = useState(PORTAL_USERS[0].id);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);
  const [rows, setRows] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [teacherForm, setTeacherForm] = useState<{
    mode: "create" | "edit";
    id: string;
    name: string;
  }>({
    mode: "create",
    id: "",
    name: "",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [changeNotice, setChangeNotice] = useState<string | null>(null);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [logs, setLogs] = useState<EditLog[]>([]);

  const logId = useRef(0);

  const currentUser =
    PORTAL_USERS.find((user) => user.id === selectedUser) || PORTAL_USERS[0];

  const selectedMonthParts = useMemo(
    () => parseMonthKey(selectedMonth),
    [selectedMonth],
  );

  const yearOptions = useMemo(
    () => makeYearOptions(selectedMonthParts.year),
    [selectedMonthParts.year],
  );

  const changeSelectedMonth = useCallback(
    (nextMonthKey: string) => {
      if (
        isDirty &&
        !confirm("You have unsaved changes. Discard them and switch month?")
      ) {
        return;
      }

      setSelectedMonth(nextMonthKey);
      setLogs([]);
    },
    [isDirty],
  );

  const allTeachers = useMemo(
    () => teachers.slice().sort((a, b) => a.sort_order - b.sort_order),
    [teachers],
  );

  const activeTeachers = useMemo(
    () => teachersForMonth(allTeachers, selectedMonth),
    [allTeachers, selectedMonth],
  );

  const visibleTeachers =
    selectedTeacher === "all"
      ? activeTeachers
      : activeTeachers.filter((teacher) => teacher.id === selectedTeacher);

  useEffect(() => {
    if (
      selectedTeacher !== "all" &&
      !activeTeachers.some((teacher) => teacher.id === selectedTeacher)
    ) {
      setSelectedTeacher("all");
    }
  }, [activeTeachers, selectedTeacher]);

  useEffect(() => {
    const userParam = new URLSearchParams(window.location.search)
      .get("user")
      ?.toLowerCase();

    const match = PORTAL_USERS.find(
      (user) =>
        user.id === userParam || user.displayName.toLowerCase() === userParam,
    );

    if (match) setSelectedUser(match.id);
  }, []);

  useEffect(() => {
    if (!changeNotice) return;

    const timer = window.setTimeout(() => {
      setChangeNotice(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [changeNotice]);

  const addLog = useCallback(
    (
      record: DailyRecord | null,
      teacher: Teacher | null,
      section: EditLog["section"],
      detail: string,
    ) => {
      logId.current += 1;

      const teacherName = teacher?.name || "System";
      const dateLabelText = record?.date_label || getMonthLabel(selectedMonth);

      const newLog: EditLog = {
        id: `${Date.now()}-${logId.current}-${Math.random().toString(36).slice(2)}`,
        date_label: dateLabelText,
        teacher_name: teacherName,
        section,
        detail,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 29)]);
    },
    [selectedMonth],
  );

  const notifyChange = useCallback((message: string) => {
    setChangeNotice(message);
  }, []);

  const logChange = useCallback(
    (
      record: DailyRecord,
      teacher: Teacher | null,
      section: EditLog["section"],
      detail: string,
    ) => {
      const teacherName = teacher?.name || "Notes";
      addLog(record, teacher, section, detail);
      notifyChange(`${teacherName} changed on ${record.date_label}: ${detail}`);
    },
    [addLog, notifyChange],
  );

  const fetchTeachers = useCallback(async () => {
    const { data, error } = await supabase
      .from("class_portal_teachers")
      .select("portal_user,id,name,sort_order,is_active,effective_from_month,effective_to_month")
      .eq("portal_user", selectedUser)
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("Teacher table read failed.", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setTeachers([]);
      setStatus(
        `Teacher table read failed: ${error.message || "Please check the Supabase teacher table."}`,
      );

      return [];
    }

    let normalized = makeUniqueTeachers((data || []) as Teacher[], selectedUser);

    // First-time setup only: seed the teacher master list once for this portal user.
    // After this, teachers live in class_portal_teachers and are reused for every month/year.
    if (normalized.length === 0 && DEFAULT_TEACHERS.length > 0) {
      const seeded = defaultTeachersForUser(selectedUser);

      const { error: seedError } = await supabase.from("class_portal_teachers").upsert(
        seeded.map((teacher, index) => ({
          portal_user: selectedUser,
          id: teacher.id,
          name: teacher.name,
          sort_order: index,
          is_active: teacher.is_active !== false,
          effective_from_month: teacher.effective_from_month || DEFAULT_EFFECTIVE_FROM_MONTH,
          effective_to_month: teacher.effective_to_month || null,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "portal_user,id" },
      );

      if (!seedError) {
        normalized = makeUniqueTeachers(seeded, selectedUser);
      } else {
        console.warn("Default teacher seed failed.", seedError);
      }
    }

    setTeachers(normalized);
    return normalized;
  }, [selectedUser]);

  const fetchMonthRecords = useCallback(
    async (userId: string, monthKey: string, teacherList: Teacher[]) => {
      setLoading(true);
      setStatus(null);

      try {
        const { data, error } = await supabase
          .from("class_portal_records")
          .select("id,portal_user,date_iso,date_label,month_key,sort_order,data")
          .eq("portal_user", userId)
          .eq("month_key", monthKey)
          .order("sort_order", { ascending: true });

        if (error) throw error;

        const existing = new Map<string, DailyRecord>();

        (data || []).forEach((raw: any) => {
          const iso = String(raw.date_iso).slice(0, 10);

          existing.set(
            iso,
            normalizeRecord(
              {
                id: raw.id,
                portal_user: raw.portal_user,
                date_iso: iso,
                date_label: raw.date_label,
                month_key: raw.month_key,
                sort_order: raw.sort_order,
                completed: raw.data?.completed || {},
                cancelled: raw.data?.cancelled || {},
                notes: raw.data?.notes || "",
              },
              teacherList,
            ),
          );
        });

        const generated = datesForMonth(monthKey).map((d, index) => {
          const iso = dateISO(d);
          return existing.get(iso) || buildBlankRecord(userId, d, index, teacherList);
        });

        setRows(generated);
        setIsDirty(false);
      } catch (error: any) {
        const errorInfo = {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        };

        console.warn("fetchMonthRecords failed:", errorInfo);

        setRows(
          datesForMonth(monthKey).map((d, index) =>
            buildBlankRecord(userId, d, index, teacherList),
          ),
        );

        setStatus(
          `Database read failed: ${error?.message ||
          error?.details ||
          error?.hint ||
          "Please run the Supabase SQL schema first and check your environment keys."
          }`,
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refreshAll = useCallback(async () => {
    const loadedTeachers = await fetchTeachers();
    await fetchMonthRecords(
      selectedUser,
      selectedMonth,
      teachersForMonth(loadedTeachers, selectedMonth),
    );
  }, [fetchMonthRecords, fetchTeachers, selectedMonth, selectedUser]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const channel = supabase
      .channel(`class-portal-live-${selectedUser}-${selectedMonth}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "class_portal_records",
          filter: `month_key=eq.${selectedMonth}`,
        },
        async (payload: any) => {
          const changedRow = payload.new || payload.old;

          if (!changedRow || changedRow.portal_user !== selectedUser) return;

          notifyChange(
            `Saved records were changed for ${currentUser.displayName} in ${getMonthLabel(
              selectedMonth,
            )}.`,
          );

          addLog(
            null,
            null,
            "save",
            `Database ${String(payload.eventType || "change").toLowerCase()} detected`,
          );

          await fetchMonthRecords(
            selectedUser,
            selectedMonth,
            teachersForMonth(teachers, selectedMonth),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "class_portal_teachers",
        },
        async (payload: any) => {
          notifyChange("Teacher settings were changed.");
          addLog(
            null,
            null,
            "teachers",
            `Teacher database ${String(payload.eventType || "change").toLowerCase()} detected`,
          );

          await refreshAll();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    addLog,
    currentUser.displayName,
    fetchMonthRecords,
    notifyChange,
    refreshAll,
    selectedMonth,
    selectedUser,
    teachers,
  ]);

  const saveAll = async () => {
    setSaving(true);
    setStatus(null);

    try {
      const payload = rows.map((record, index) => ({
        portal_user: selectedUser,
        date_iso: record.date_iso,
        date_label: record.date_label,
        month_key: record.month_key,
        sort_order: index,
        data: {
          completed: record.completed,
          cancelled: record.cancelled,
          notes: record.notes || "",
        },
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("class_portal_records").upsert(payload, {
        onConflict: "portal_user,date_iso",
      });

      if (error) throw error;

      setIsDirty(false);
      setStatus("Saved. This month’s record has been saved permanently.");
      notifyChange("This month’s record was saved successfully.");
      addLog(null, null, "save", "Month record saved");
    } catch (error: any) {
      setStatus(`Save failed: ${error?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const resetTeacherForm = () => {
    setTeacherForm({
      mode: "create",
      id: "",
      name: "",
    });
  };

  const saveTeachers = async (nextTeachers = teachers) => {
    // This saves the teacher timeline, not a monthly copy.
    // A teacher added in the selected month appears from this month onward only.
    // Previous months will not receive newly-added teachers.
    const cleaned = makeUniqueTeachers(nextTeachers, selectedUser).map((teacher, index) => ({
      portal_user: selectedUser,
      id: teacher.id,
      name: teacher.name.trim() || `Teacher ${index + 1}`,
      sort_order: index,
      is_active: teacher.is_active !== false,
      effective_from_month: teacher.effective_from_month || DEFAULT_EFFECTIVE_FROM_MONTH,
      effective_to_month: teacher.effective_to_month || null,
      updated_at: new Date().toISOString(),
    }));

    setTeachers(cleaned);

    const { error } = await supabase.from("class_portal_teachers").upsert(cleaned, {
      onConflict: "portal_user,id",
    });

    if (error) {
      setStatus(`Teacher save failed: ${error.message}`);
      return;
    }

    const monthTeachers = teachersForMonth(cleaned, selectedMonth);

    setRows((prev) => prev.map((row) => normalizeRecord(row, monthTeachers)));
    setStatus(
      "Teacher timeline updated. New teachers start from the selected month and future months only.",
    );
    notifyChange("Teacher timeline was updated.");
    addLog(null, null, "teachers", "Teacher timeline updated");
  };

  const saveTeacherForm = async () => {
    const name = teacherForm.name.trim();

    if (!name) {
      setStatus("Teacher name is required.");
      return;
    }

    if (teacherForm.mode === "edit") {
      const next = teachers.map((teacher) =>
        teacher.id === teacherForm.id
          ? {
            ...teacher,
            name,
          }
          : teacher,
      );

      await saveTeachers(next);
      resetTeacherForm();
      return;
    }

    const baseId = slugify(name);
    let id = baseId;
    let counter = 2;

    while (teachers.some((teacher) => teacher.id === id)) {
      id = `${baseId}_${counter}`;
      counter += 1;
    }

    const next = [
      ...teachers,
      {
        portal_user: selectedUser,
        id,
        name,
        sort_order: teachers.length,
        is_active: true,
        effective_from_month: selectedMonth,
        effective_to_month: null,
      },
    ];

    await saveTeachers(next);
    resetTeacherForm();
  };

  const startEditTeacher = (teacher: Teacher) => {
    setTeacherForm({
      mode: "edit",
      id: teacher.id,
      name: teacher.name,
    });
  };

  const deleteTeacher = async (teacher: Teacher) => {
    const confirmed = confirm(
      `Remove "${teacher.name}" from ${currentUser.displayName} starting ${getMonthLabel(
        selectedMonth,
      )}? Previous saved months will stay safe.`,
    );

    if (!confirmed) return;

    setDeletingTeacherId(teacher.id);
    setStatus(null);

    try {
      const { error: updateTeacherError } = await supabase
        .from("class_portal_teachers")
        .update({
          effective_to_month: selectedMonth,
          updated_at: new Date().toISOString(),
        })
        .eq("portal_user", selectedUser)
        .eq("id", teacher.id);

      if (updateTeacherError) throw updateTeacherError;

      const { data: savedRecords, error: readRecordsError } = await supabase
        .from("class_portal_records")
        .select("id,data,month_key")
        .eq("portal_user", selectedUser)
        .gte("month_key", selectedMonth);

      if (readRecordsError) throw readRecordsError;

      await Promise.all(
        (savedRecords || []).map((record: any) => {
          const data = record.data || {};
          const completed = { ...(data.completed || {}) };
          const cancelled = { ...(data.cancelled || {}) };

          delete completed[teacher.id];
          delete cancelled[teacher.id];

          return supabase
            .from("class_portal_records")
            .update({
              data: {
                ...data,
                completed,
                cancelled,
              },
              updated_at: new Date().toISOString(),
            })
            .eq("id", record.id);
        }),
      );

      const nextTeachers = teachers.map((item) =>
        item.id === teacher.id
          ? {
            ...item,
            effective_to_month: selectedMonth,
          }
          : item,
      );

      setTeachers(nextTeachers);

      setRows((prev) =>
        prev.map((row) => {
          const completed = { ...row.completed };
          const cancelled = { ...row.cancelled };

          delete completed[teacher.id];
          delete cancelled[teacher.id];

          return {
            ...row,
            completed,
            cancelled,
          };
        }),
      );

      if (selectedTeacher === teacher.id) {
        setSelectedTeacher("all");
      }

      if (teacherForm.id === teacher.id) {
        resetTeacherForm();
      }

      setStatus(
        `Teacher "${teacher.name}" was removed from ${getMonthLabel(
          selectedMonth,
        )} and all future months. Previous months remain safe.`,
      );
      notifyChange(
        `Teacher "${teacher.name}" was removed from ${getMonthLabel(
          selectedMonth,
        )} onward.`,
      );
      addLog(
        null,
        null,
        "teachers",
        `Teacher removed from ${getMonthLabel(selectedMonth)} onward: ${teacher.name}`,
      );
    } catch (error: any) {
      setStatus(`Teacher remove failed: ${error?.message || "Unknown error"}`);
    } finally {
      setDeletingTeacherId(null);
    }
  };



  const updateCell = (
    rowIndex: number,
    section: "completed" | "cancelled",
    teacher: Teacher,
    value: number,
  ) => {
    setRows((prev) => {
      const next = prev.map((row, index) => {
        if (index !== rowIndex) return row;

        const oldValue = row[section][teacher.id] || 0;

        const updated = {
          ...row,
          [section]: {
            ...row[section],
            [teacher.id]: value,
          },
        } as DailyRecord;

        if (oldValue !== value) {
          logChange(
            updated,
            teacher,
            section,
            `${section === "completed" ? "Completed" : "Cancelled"}: ${oldValue} → ${value}`,
          );
        }

        return updated;
      });

      return next;
    });

    setIsDirty(true);
  };

  const updateNotes = (rowIndex: number, value: string) => {
    setRows((prev) =>
      prev.map((row, index) => {
        if (index !== rowIndex) return row;

        const updated = {
          ...row,
          notes: value,
        };

        logChange(updated, null, "notes", "Notes updated");
        return updated;
      }),
    );

    setIsDirty(true);
  };

  const downloadCSV = () => {
    const csv = generateCSV(rows, activeTeachers);
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${currentUser.id}-${selectedMonth}-class-record.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    const XLSX: any = await import("xlsx");
    const csv = generateCSV(rows, activeTeachers);
    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.aoa_to_sheet(
      csv.split("\n").map((line) => parseCSVLine(line)),
    );

    worksheet["!cols"] = [
      { wch: 16 },
      ...Array(activeTeachers.length * 2 + 3)
        .fill(null)
        .map(() => ({ wch: 14 })),
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, getMonthLabel(selectedMonth));
    XLSX.writeFile(workbook, `${currentUser.id}-${selectedMonth}-class-record.xlsx`);
  };

  const totals = useMemo(() => {
    const perTeacher = activeTeachers.map((teacher) => {
      const completed = rows.reduce(
        (sum, row) => sum + (row.completed[teacher.id] || 0),
        0,
      );
      const cancelled = rows.reduce(
        (sum, row) => sum + (row.cancelled[teacher.id] || 0),
        0,
      );

      return {
        teacher,
        completed,
        cancelled,
        total: completed + cancelled,
      };
    });

    const completed = perTeacher.reduce((sum, item) => sum + item.completed, 0);
    const cancelled = perTeacher.reduce((sum, item) => sum + item.cancelled, 0);

    const updatedDays = rows.filter((row) => {
      const total = activeTeachers.reduce(
        (sum, teacher) =>
          sum +
          (row.completed[teacher.id] || 0) +
          (row.cancelled[teacher.id] || 0),
        0,
      );

      return total > 0 || Boolean(row.notes?.trim());
    }).length;

    const todayIso = dateISO(new Date());

    const missingPastDays = rows.filter(
      (row) =>
        row.date_iso <= todayIso &&
        !row.notes?.trim() &&
        activeTeachers.every(
          (teacher) =>
            !(row.completed[teacher.id] || row.cancelled[teacher.id]),
        ),
    ).length;

    return {
      perTeacher,
      completed,
      cancelled,
      updatedDays,
      missingPastDays,
      completionRate:
        completed + cancelled > 0
          ? ((completed / (completed + cancelled)) * 100).toFixed(1)
          : "100.0",
    };
  }, [activeTeachers, rows]);

  const chartData = useMemo(
    () =>
      totals.perTeacher.map((item) => ({
        name: item.teacher.name,
        completed: item.completed,
        cancelled: item.cancelled,
      })),
    [totals.perTeacher],
  );

  const trendData = useMemo(
    () =>
      rows.map((row) => ({
        date: row.date_label.slice(0, 6),
        completed: activeTeachers.reduce(
          (sum, teacher) => sum + (row.completed[teacher.id] || 0),
          0,
        ),
        cancelled: activeTeachers.reduce(
          (sum, teacher) => sum + (row.cancelled[teacher.id] || 0),
          0,
        ),
      })),
    [activeTeachers, rows],
  );

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Advanced Class Portal
            </h1>
            <Badge variant="secondary">25th → 24th monthly cycle</Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Zainab, Aniqa, and Bilal can update their daily class records from
            their own portal. Teacher columns now follow a month timeline: add
            from the selected month onward, and remove from the selected month onward.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={saveAll} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />{" "}
            {saving ? "Saving..." : "Save Month"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)_minmax(0,1fr)]">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                User Portal
              </span>
              <select
                value={selectedUser}
                onChange={(e) => {
                  if (
                    isDirty &&
                    !confirm(
                      "You have unsaved changes. Discard them and switch user?",
                    )
                  ) {
                    return;
                  }

                  setSelectedUser(e.target.value);
                  setLogs([]);
                }}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {PORTAL_USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Month Filter
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_minmax(0,1fr)_110px_auto]">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-3"
                  onClick={() => changeSelectedMonth(addMonthsToMonthKey(selectedMonth, -1))}
                >
                  Previous
                </Button>

                <select
                  value={String(selectedMonthParts.monthIndex)}
                  onChange={(e) =>
                    changeSelectedMonth(
                      monthKeyFromParts(selectedMonthParts.year, Number(e.target.value)),
                    )
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {MONTH_NAMES.map((monthName, index) => (
                    <option key={monthName} value={index}>
                      {monthName}
                    </option>
                  ))}
                </select>

                <select
                  value={String(selectedMonthParts.year)}
                  onChange={(e) =>
                    changeSelectedMonth(
                      monthKeyFromParts(Number(e.target.value), selectedMonthParts.monthIndex),
                    )
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-3"
                  onClick={() => changeSelectedMonth(addMonthsToMonthKey(selectedMonth, 1))}
                >
                  Next
                </Button>
              </div>
            </div>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Teacher Filter
              </span>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All Teachers</option>
                {activeTeachers.map((teacher, index) => (
                  <option
                    key={`filter-${selectedUser}-${teacher.id}-${index}`}
                    value={teacher.id}
                  >
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>{getMonthRange(selectedMonth)}</span>
            <span>•</span>
            <span>{rows.length} calendar rows</span>
            <span>•</span>
            <span>Current user: {currentUser.displayName}</span>
          </div>
        </CardContent>
      </Card>

      {status && (
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          {status}
        </div>
      )}

      {changeNotice && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          <div className="flex items-center gap-2 font-semibold">
            <Bell className="h-4 w-4" />
            New change detected
          </div>
          <p className="mt-1">{changeNotice}</p>
        </div>
      )}

      {isDirty && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            Unsaved changes
          </div>
          <p className="text-sm opacity-80">
            Click Save Now to store this month’s record permanently.
          </p>
          <Button
            className="sm:ml-auto"
            size="sm"
            onClick={saveAll}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" /> Save Now
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Completed"
          value={totals.completed}
          desc="Selected month total"
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="Cancelled"
          value={totals.cancelled}
          desc="Selected month total"
          icon={XCircle}
          variant="danger"
        />
        <MetricCard
          title="Updated Days"
          value={`${totals.updatedDays}/${rows.length}`}
          desc="Days with entry or notes"
          icon={CalendarDays}
        />
        <MetricCard
          title="Completion Rate"
          value={`${totals.completionRate}%`}
          desc="Completed / total classes"
          icon={CloudUpload}
          variant="success"
        />
        <MetricCard
          title="Missing Past Days"
          value={totals.missingPastDays}
          desc="Days that still need updates"
          icon={AlertCircle}
          variant={totals.missingPastDays ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teacher Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={95}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="completed" name="Completed" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="cancelled" name="Cancelled" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="cancelled"
                    name="Cancelled"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Dialog open={teacherOpen} onOpenChange={setTeacherOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" /> Manage Teachers
            </Button>
          </DialogTrigger>

          <DialogContent className="h-[86vh] w-[96vw] max-w-none overflow-hidden p-0 sm:max-w-[1200px]">
            <div className="flex h-full flex-col">
              <div className="border-b px-6 py-4">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    Teacher Management — {currentUser.displayName}
                  </DialogTitle>
                </DialogHeader>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a teacher from the selected month onward. Previous saved months stay unchanged, and future months will keep the teacher until you remove it from a selected month onward.
                </p>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[300px_1fr]">
                <aside className="min-h-0 overflow-auto border-r bg-muted/20 p-4">
                  <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {teacherForm.mode === "edit" ? "Edit Teacher" : "Add Teacher"}
                      </p>
                      <h3 className="mt-1 text-lg font-bold">
                        {teacherForm.mode === "edit" ? "Update teacher" : "Create new teacher"}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        This teacher will start from the currently selected month and continue into future months.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                          Teacher Name
                        </label>
                        <input
                          value={teacherForm.name}
                          onChange={(e) =>
                            setTeacherForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Example: Ayesha Khan"
                          className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      {teacherForm.mode === "edit" && (
                        <div className="rounded-xl border bg-muted/50 p-3">
                          <p className="text-xs font-semibold">Editing teacher ID</p>
                          <p className="mt-1 break-all text-xs text-muted-foreground">
                            {teacherForm.id}
                          </p>
                        </div>
                      )}

                      <Button onClick={saveTeacherForm} className="h-11 w-full">
                        <Save className="mr-2 h-4 w-4" />
                        {teacherForm.mode === "edit" ? "Save Changes" : "Add Teacher"}
                      </Button>

                      {teacherForm.mode === "edit" && (
                        <Button
                          variant="outline"
                          onClick={resetTeacherForm}
                          className="h-10 w-full"
                        >
                          Cancel Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border bg-card p-4">
                    <p className="text-sm font-semibold">Current User</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currentUser.displayName}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-muted p-3">
                        <p className="text-xs text-muted-foreground">Teachers</p>
                        <p className="mt-1 text-xl font-bold">{allTeachers.length}</p>
                      </div>
                      <div className="rounded-xl bg-muted p-3">
                        <p className="text-xs text-muted-foreground">Columns</p>
                        <p className="mt-1 text-xl font-bold">{visibleTeachers.length}</p>
                      </div>
                    </div>
                  </div>
                </aside>

                <section className="min-w-0 overflow-hidden p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Teacher CRUD Table</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage teacher names and timeline-based removal from this user's portal.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        resetTeacherForm();
                        setTimeout(() => {
                          const input = document.querySelector<HTMLInputElement>(
                            'input[placeholder="Example: Ayesha Khan"]',
                          );
                          input?.focus();
                        }, 50);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Teacher
                    </Button>
                  </div>

                  <div className="rounded-2xl border bg-card shadow-sm">
                    <div className="max-h-[52vh] overflow-auto">
                      <table className="w-full min-w-[900px] border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-muted">
                          <tr>
                            <th className="w-14 border-b px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">
                              #
                            </th>
                            <th className="border-b px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">
                              Teacher Name
                            </th>
                            <th className="border-b px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">
                              Teacher ID
                            </th>
                            <th className="border-b px-4 py-3 text-left text-xs font-bold uppercase text-muted-foreground">
                              Column Status
                            </th>
                            <th className="border-b px-4 py-3 text-right text-xs font-bold uppercase text-muted-foreground">
                              CRUD Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {allTeachers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-14 text-center">
                                <p className="font-semibold">No teachers added yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Add the first teacher from the form on the left.
                                </p>
                              </td>
                            </tr>
                          ) : (
                            allTeachers.map((teacher, index) => (
                              <tr
                                key={`teacher-crud-row-${selectedUser}-${teacher.id}-${index}`}
                                className="border-b transition hover:bg-muted/40"
                              >
                                <td className="px-4 py-3">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                    {index + 1}
                                  </span>
                                </td>

                                <td className="px-4 py-3">
                                  <p className="font-semibold">{teacher.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    User: {currentUser.displayName}
                                  </p>
                                </td>

                                <td className="px-4 py-3">
                                  <code className="rounded-md bg-muted px-2 py-1 text-xs">
                                    {teacher.id}
                                  </code>
                                </td>

                                <td className="px-4 py-3">
                                  <Badge
                                    variant={
                                      isTeacherVisibleInMonth(teacher, selectedMonth)
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {getTeacherTimelineStatus(teacher, selectedMonth)}
                                  </Badge>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditTeacher(teacher)}
                                    >
                                      <Pencil className="mr-2 h-3.5 w-3.5" />
                                      Edit
                                    </Button>


                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={deletingTeacherId === teacher.id}
                                      onClick={() => deleteTeacher(teacher)}
                                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                                      {deletingTeacherId === teacher.id ? "Removing..." : "Remove This Month Onward"}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">Add</span> starts the teacher from the currently selected month and all future months.
                      <span className="ml-1 font-semibold text-foreground">Edit</span> changes the teacher name wherever that teacher is visible.
                      <span className="ml-1 font-semibold text-foreground">Remove This Month Onward</span> removes the teacher only from the selected month and future months. Previous saved months remain safe.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={downloadCSV}>
          <Download className="mr-2 h-4 w-4" /> CSV
        </Button>

        <Button variant="outline" onClick={downloadExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
          <div>
            <p className="font-semibold">
              Daily Update Table — {currentUser.displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              Click any number to edit. Use notes for reasons, reminders, or
              daily comments.
            </p>
          </div>

          <Badge variant="secondary">{getMonthLabel(selectedMonth)}</Badge>
        </div>

        <div className="max-h-[58vh] overflow-auto">
          <table
            className="w-full border-collapse text-sm"
            style={{
              minWidth:
                selectedTeacher === "all"
                  ? Math.max(1500, 260 + visibleTeachers.length * 190)
                  : 950,
            }}
          >
            <thead className="sticky top-0 z-20 bg-card">
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 z-30 border-b border-r bg-card px-4 py-3 text-left text-xs font-bold uppercase"
                >
                  Date
                </th>

                {visibleTeachers.map((teacher, index) => (
                  <th
                    key={`teacher-head-main-${selectedUser}-${teacher.id}-${index}`}
                    colSpan={2}
                    className="border-b border-r bg-muted/70 px-3 py-2 text-center text-xs font-bold"
                  >
                    {teacher.name}
                  </th>
                ))}

                <th
                  rowSpan={2}
                  className="border-b bg-muted/70 px-4 py-3 text-left text-xs font-bold uppercase"
                >
                  Notes
                </th>
              </tr>

              <tr>
                {visibleTeachers.map((teacher, index) => (
                  <Fragment key={`teacher-head-sub-${selectedUser}-${teacher.id}-${index}`}>
                    <th className="border-b px-2 py-2 text-center text-[11px] font-semibold text-emerald-700">
                      Completed
                    </th>
                    <th className="border-b border-r px-2 py-2 text-center text-[11px] font-semibold text-red-700">
                      Cancelled
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => {
                const today = row.date_iso === dateISO(new Date());

                const rowTotal = activeTeachers.reduce(
                  (sum, teacher) =>
                    sum +
                    (row.completed[teacher.id] || 0) +
                    (row.cancelled[teacher.id] || 0),
                  0,
                );

                return (
                  <tr
                    key={row.date_iso}
                    className={`border-b hover:bg-muted/30 ${today
                      ? "bg-primary/5"
                      : rowIndex % 2
                        ? "bg-muted/10"
                        : ""
                      }`}
                  >
                    <td className="sticky left-0 z-10 whitespace-nowrap border-r bg-card px-4 py-2 text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        {row.date_label}

                        {today && <Badge className="text-[10px]">Today</Badge>}

                        {rowTotal === 0 &&
                          !row.notes &&
                          row.date_iso <= dateISO(new Date()) && (
                            <span
                              title="No update yet"
                              className="h-2 w-2 rounded-full bg-amber-500"
                            />
                          )}
                      </div>
                    </td>

                    {visibleTeachers.map((teacher, teacherIndex) => (
                      <Fragment key={`teacher-cell-${selectedUser}-${row.date_iso}-${teacher.id}-${teacherIndex}`}>
                        <td className="px-1 py-1.5 text-center">
                          <EditableCell
                            value={row.completed[teacher.id] || 0}
                            onSave={(value) =>
                              updateCell(rowIndex, "completed", teacher, value)
                            }
                          />
                        </td>

                        <td className="border-r px-1 py-1.5 text-center">
                          <EditableCell
                            value={row.cancelled[teacher.id] || 0}
                            onSave={(value) =>
                              updateCell(rowIndex, "cancelled", teacher, value)
                            }
                          />
                        </td>
                      </Fragment>
                    ))}

                    <td className="min-w-[220px] px-2 py-1.5">
                      <input
                        value={row.notes}
                        onChange={(e) => updateNotes(rowIndex, e.target.value)}
                        placeholder="Reason / notes"
                        className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="sticky bottom-0 z-20 bg-card">
              <tr className="border-t-2 bg-muted/80">
                <td className="sticky left-0 z-10 border-r bg-muted px-4 py-3 text-xs font-bold uppercase">
                  Total
                </td>

                {visibleTeachers.map((teacher, teacherIndex) => {
                  const completed = rows.reduce(
                    (sum, row) => sum + (row.completed[teacher.id] || 0),
                    0,
                  );

                  const cancelled = rows.reduce(
                    (sum, row) => sum + (row.cancelled[teacher.id] || 0),
                    0,
                  );

                  return (
                    <Fragment key={`teacher-total-${selectedUser}-${teacher.id}-${teacherIndex}`}>
                      <td className="px-2 py-3 text-center font-bold text-emerald-700">
                        {completed}
                      </td>
                      <td className="border-r px-2 py-3 text-center font-bold text-red-700">
                        {cancelled}
                      </td>
                    </Fragment>
                  );
                })}

                <td className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                  Saved by user and date
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Recent Changes
          </CardTitle>
          <Badge variant="secondary">{logs.length}</Badge>
        </CardHeader>

        <CardContent>
          {logs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Pencil className="mx-auto mb-2 h-8 w-8 opacity-30" />
              No recent changes in this session.
            </div>
          ) : (
            <div className="max-h-72 space-y-3 overflow-auto">
              {logs.map((log, index) => (
                <div
                  key={`log-${log.id}-${index}`}
                  className="flex items-start gap-3 border-b pb-3 last:border-0"
                >
                  <div className="rounded-lg bg-muted p-2">
                    {log.section === "cancelled" ? (
                      <XCircle className="h-4 w-4" />
                    ) : log.section === "notes" ? (
                      <Pencil className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {log.date_label} — {log.teacher_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.detail} · {log.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}