"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  ChevronsUpDown,
  Download,
  Eye,
  FileWarning,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  BookOpen,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ---------- TYPES ----------
type ComplaintStatus = "pending" | "viewed_by_td" | "resolved";

interface Complaint {
  id: string;
  complaint_number: string;
  complaint_date: string;
  student_id: string | null;
  student_name: string;
  teacher_id: string | null;
  teacher_name: string | null;
  complaint_type: string;
  status: ComplaintStatus;
  priority: "low" | "medium" | "high" | "urgent" | null;
  description: string | null;
  support_note: string | null;
  td_viewed: boolean | null;
  td_viewed_at: string | null;
  td_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string | null;
}

interface StudentOption {
  id: string;
  studentId: string;
  name: string;
  parent: string;
  grade: string;
  learningPlan: string;
  classesPerWeek: number;
  startDate: string;
}

interface TeacherOption {
  id: string;
  name: string;
  subject: string;
  grade: string;
  email: string;
  phone: string;
}

const COMPLAINT_TYPES = [
  "Teacher Issue",
  "Timing Issue",
  "Behavior Issue",
  "Technical Issue",
  "Other",
];

const COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

const emptyForm: Partial<Complaint> = {
  complaint_number: "",
  complaint_date: new Date().toISOString().slice(0, 10),
  student_id: "",
  student_name: "",
  teacher_id: "",
  teacher_name: "",
  complaint_type: "",
  status: "pending",
  priority: "medium",
  description: "",
  support_note: "",
  td_viewed: false,
  td_note: "",
};

// ---------- Helper Functions ----------
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function statusBadge(status: ComplaintStatus) {
  if (status === "resolved") return <Badge className="bg-emerald-600">Resolved</Badge>;
  if (status === "viewed_by_td") return <Badge className="bg-blue-600">Viewed by T&D</Badge>;
  return <Badge variant="destructive">Pending</Badge>;
}

function priorityBadge(priority?: string | null) {
  if (priority === "urgent") return <Badge variant="destructive">Urgent</Badge>;
  if (priority === "high") return <Badge className="bg-orange-600">High</Badge>;
  if (priority === "medium") return <Badge variant="secondary">Medium</Badge>;
  return <Badge variant="outline">Low</Badge>;
}

// ---------- Main Component ----------
export default function ComplaintManagementPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [form, setForm] = useState<Partial<Complaint>>(emptyForm);

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  // ---------- Data Fetching ----------
  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("current_students")
        .select("id, student_id, student_name, parent_name, grade_year, learning_plan, classes_per_week, start_date")
        .order("student_name", { ascending: true });
      if (error) throw error;
      const mapped: StudentOption[] = (data || []).map((s: any) => ({
        id: String(s.id),
        studentId: String(s.student_id ?? ""),
        name: String(s.student_name ?? ""),
        parent: String(s.parent_name ?? ""),
        grade: String(s.grade_year ?? ""),
        learningPlan: String(s.learning_plan ?? ""),
        classesPerWeek: Number(s.classes_per_week ?? 0),
        startDate: String(s.start_date ?? ""),
      }));
      setStudents(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, subject, grade, email, phone")
        .eq("role", "teacher")
        .eq("department", "teachers");
      if (error) throw error;
      const mapped: TeacherOption[] = (data || []).map((t: any) => ({
        id: t.id,
        name: `${t.first_name || ""} ${t.last_name || ""}`.trim() || "No Name",
        subject: t.subject || "N/A",
        grade: t.grade || "N/A",
        email: t.email || "",
        phone: t.phone || "",
      }));
      setTeachers(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("complaint_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setComplaints((data || []) as Complaint[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchComplaints();
  }, []);

  // ---------- Helpers ----------
  const filteredStudents = useMemo(() => {
    const term = studentSearchTerm.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(term));
  }, [students, studentSearchTerm]);

  const generateComplaintNumber = async () => {
    const { data } = await supabase
      .from("complaints")
      .select("complaint_number")
      .order("complaint_number", { ascending: false })
      .limit(1);
    let nextNum = 1;
    if (data && data[0]?.complaint_number) {
      const match = data[0].complaint_number.match(/CMP-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    return `CMP-${String(nextNum).padStart(4, "0")}`;
  };

  const openAdd = async () => {
    const newNumber = await generateComplaintNumber();
    setForm({
      ...emptyForm,
      complaint_number: newNumber,
      complaint_date: todayIso(),
      status: "pending",
      td_viewed: false,
    });
    setIsAddOpen(true);
  };

  const openEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setForm({ ...complaint, teacher_id: complaint.teacher_id || "" });
    setIsEditOpen(true);
  };

  const handleStudentSelect = (student: StudentOption) => {
    setForm((prev) => ({
      ...prev,
      student_id: student.id,
      student_name: student.name,
    }));
    setStudentSearchOpen(false);
    setStudentSearchTerm("");
  };

  const handleTeacherSelect = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher) {
      setForm((prev) => ({
        ...prev,
        teacher_id: teacher.id,
        teacher_name: teacher.name,
      }));
    }
  };

  const payloadFromForm = () => {
    const status = (form.status || "pending") as ComplaintStatus;
    const viewedByTd = status === "viewed_by_td" || status === "resolved" || Boolean(form.td_viewed);
    return {
      complaint_number: form.complaint_number || "",
      complaint_date: form.complaint_date || todayIso(),
      student_id: form.student_id || null,
      student_name: form.student_name || "",
      teacher_id: form.teacher_id || null,
      teacher_name: form.teacher_name || null,
      complaint_type: form.complaint_type || "",
      status,
      priority: form.priority || "medium",
      description: form.description || null,
      support_note: form.support_note || null,
      td_viewed: viewedByTd,
      td_viewed_at: viewedByTd ? form.td_viewed_at || new Date().toISOString() : null,
      td_note: form.td_note || null,
      resolved_at: status === "resolved" ? form.resolved_at || new Date().toISOString() : null,
      resolved_by: status === "resolved" ? form.resolved_by || "T&D Department" : null,
      updated_at: new Date().toISOString(),
    };
  };

  const handleAdd = async () => {
    if (!form.complaint_number || !form.student_name || !form.complaint_type) {
      alert("Complaint Number, Student Name, and Complaint Type are required.");
      return;
    }
    const { error } = await supabase.from("complaints").insert([payloadFromForm()]);
    if (error) {
      alert(error.message);
      return;
    }
    setIsAddOpen(false);
    setForm(emptyForm);
    fetchComplaints();
  };

  const handleUpdate = async () => {
    if (!editingComplaint) return;
    if (!form.student_name || !form.complaint_type) {
      alert("Student Name and Complaint Type are required.");
      return;
    }
    const { error } = await supabase
      .from("complaints")
      .update(payloadFromForm())
      .eq("id", editingComplaint.id);
    if (error) {
      alert(error.message);
      return;
    }
    setIsEditOpen(false);
    setEditingComplaint(null);
    setForm(emptyForm);
    fetchComplaints();
  };

  const handleDelete = async (complaint: Complaint) => {
    if (!confirm(`Delete complaint ${complaint.complaint_number}?`)) return;
    const { error } = await supabase.from("complaints").delete().eq("id", complaint.id);
    if (error) alert(error.message);
    else fetchComplaints();
  };

  const markViewedByTD = async (complaint: Complaint) => {
    const { error } = await supabase
      .from("complaints")
      .update({
        status: "viewed_by_td",
        td_viewed: true,
        td_viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", complaint.id);
    if (error) alert(error.message);
    else fetchComplaints();
  };

  const markResolved = async (complaint: Complaint) => {
    const tdNote =
      window.prompt("Resolution note from T&D:", complaint.td_note || "Resolved by T&D department") ||
      complaint.td_note ||
      "Resolved by T&D department";
    const { error } = await supabase
      .from("complaints")
      .update({
        status: "resolved",
        td_viewed: true,
        td_viewed_at: complaint.td_viewed_at || new Date().toISOString(),
        td_note: tdNote,
        resolved_at: new Date().toISOString(),
        resolved_by: "T&D Department",
        updated_at: new Date().toISOString(),
      })
      .eq("id", complaint.id);
    if (error) alert(error.message);
    else fetchComplaints();
  };

  // ---------- Derived Data ----------
  const types = useMemo(() => {
    return [...new Set(complaints.map((c) => c.complaint_type).filter(Boolean))] as string[];
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const q = search.toLowerCase();
    return complaints.filter((c) => {
      const matchSearch = !q ||
        c.complaint_number.toLowerCase().includes(q) ||
        c.student_name.toLowerCase().includes(q) ||
        (c.teacher_name?.toLowerCase().includes(q) ?? false) ||
        c.complaint_type.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchType = typeFilter === "all" || c.complaint_type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [complaints, search, statusFilter, typeFilter]);

  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter((c) => c.status === "pending").length;
  const viewedByTD = complaints.filter((c) => c.status === "viewed_by_td" || c.td_viewed).length;
  const resolvedComplaints = complaints.filter((c) => c.status === "resolved").length;
  const currentTotal = complaints.filter((c) => c.status !== "resolved").length;

  const typeChartData = Object.entries(
    complaints.reduce((acc, c) => {
      const type = c.complaint_type || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const statusChartData = [
    { name: "Pending", value: pendingComplaints },
    { name: "Viewed by T&D", value: complaints.filter((c) => c.status === "viewed_by_td").length },
    { name: "Resolved", value: resolvedComplaints },
  ];

  const monthlyData = Object.entries(
    complaints.reduce((acc, c) => {
      const month = c.complaint_date ? format(new Date(c.complaint_date), "MMM yyyy") : "Unknown";
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([month, count]) => ({ month, count }));

  const exportCSV = () => {
    const headers = [
      "Complaint #", "Date", "Student ID", "Student", "Teacher", "Type",
      "Priority", "Status", "T&D Viewed", "T&D Viewed At", "T&D Note",
      "Resolved At", "Resolved By", "Description", "Support Note",
    ];
    const rows = filteredComplaints.map((c) => [
      c.complaint_number,
      c.complaint_date,
      c.student_id || "",
      c.student_name,
      c.teacher_name || "",
      c.complaint_type,
      c.priority || "",
      c.status,
      c.td_viewed ? "Yes" : "No",
      c.td_viewed_at || "",
      c.td_note || "",
      c.resolved_at || "",
      c.resolved_by || "",
      c.description || "",
      c.support_note || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaints_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complaint Management</h1>
          <p className="text-muted-foreground">Full CRUD + T&amp;D tracking + Supabase sync</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
            <TrendingUp className="mr-2 h-4 w-4" />
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="flex h-[calc(100dvh-24px)] max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-none overflow-hidden p-0 sm:max-w-[1180px]">
              <ComplaintModalContent
                mode="add"
                form={form}
                setForm={setForm}
                onSubmit={handleAdd}
                onClose={() => setIsAddOpen(false)}
                students={students}
                teachers={teachers}
                onStudentSelect={handleStudentSelect}
                onTeacherSelect={handleTeacherSelect}
                studentSearchOpen={studentSearchOpen}
                setStudentSearchOpen={setStudentSearchOpen}
                studentSearchTerm={studentSearchTerm}
                setStudentSearchTerm={setStudentSearchTerm}
                filteredStudents={filteredStudents}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="All" value={totalComplaints} desc="Total complaint records" icon={FileWarning} />
        <MetricCard title="Pending" value={pendingComplaints} desc="Waiting for T&D" icon={AlertCircle} variant="danger" />
        <MetricCard title="Viewed by T&D" value={viewedByTD} desc="T&D has checked" icon={Eye} variant="info" />
        <MetricCard title="Resolved" value={resolvedComplaints} desc="Closed by T&D" icon={CheckCircle2} variant="success" />
      </div>

      {showAnalytics && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Current Total" value={currentTotal} desc="Pending + viewed by T&D" icon={Users} />
            <MetricCard title="Pending Cases" value={pendingComplaints} desc="Needs T&D response" icon={ShieldCheck} variant="warning" />
            <MetricCard title="Resolved Cases" value={resolvedComplaints} desc="Completed cases" icon={CheckCircle2} variant="success" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Complaints by Status</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                      {statusChartData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Complaints by Type</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Complaints</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by #, student, teacher, type, status" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="viewed_by_td">Viewed by T&D</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[190px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Complaint #</TableHead><TableHead>Date</TableHead><TableHead>Student</TableHead>
                  <TableHead>Teacher</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>
                  <TableHead>T&amp;D</TableHead><TableHead>T&amp;D Note</TableHead><TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No records found.</TableCell></TableRow>
                ) : (
                  filteredComplaints.map((complaint) => {
                    // find parent name from students list for display
                    const studentRecord = students.find(s => s.id === complaint.student_id);
                    return (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-mono text-sm">{complaint.complaint_number}</TableCell>
                        <TableCell>{complaint.complaint_date ? format(new Date(complaint.complaint_date), "dd-MMM-yyyy") : "-"}</TableCell>
                        <TableCell>
                          <div className="font-medium">{complaint.student_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {studentRecord?.parent ? `Parent: ${studentRecord.parent}` : complaint.student_id || "-"}
                          </div>
                        </TableCell>
                        <TableCell>{complaint.teacher_name || "-"}</TableCell>
                        <TableCell><div>{complaint.complaint_type}</div><div className="mt-1">{priorityBadge(complaint.priority)}</div></TableCell>
                        <TableCell>{statusBadge(complaint.status)}</TableCell>
                        <TableCell>{complaint.td_viewed ? <Badge className="bg-blue-600">Viewed</Badge> : <Badge variant="secondary">Not Viewed</Badge>}</TableCell>
                        <TableCell className="max-w-xs truncate">{complaint.td_note || "-"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => markViewedByTD(complaint)}><Eye className="mr-2 h-4 w-4" />Mark Viewed by T&D</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => markResolved(complaint)}><CheckCircle2 className="mr-2 h-4 w-4" />Mark Resolved</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(complaint)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(complaint)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="flex h-[calc(100dvh-24px)] max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-none overflow-hidden p-0 sm:max-w-[1180px]">
          <ComplaintModalContent
            mode="edit"
            form={form}
            setForm={setForm}
            onSubmit={handleUpdate}
            onClose={() => setIsEditOpen(false)}
            students={students}
            teachers={teachers}
            onStudentSelect={handleStudentSelect}
            onTeacherSelect={handleTeacherSelect}
            studentSearchOpen={studentSearchOpen}
            setStudentSearchOpen={setStudentSearchOpen}
            studentSearchTerm={studentSearchTerm}
            setStudentSearchTerm={setStudentSearchTerm}
            filteredStudents={filteredStudents}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Modal Content Component ----------
interface ModalContentProps {
  mode: "add" | "edit";
  form: Partial<Complaint>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Complaint>>>;
  onSubmit: () => void;
  onClose: () => void;
  students: StudentOption[];
  teachers: TeacherOption[];
  onStudentSelect: (student: StudentOption) => void;
  onTeacherSelect: (teacherId: string) => void;
  studentSearchOpen: boolean;
  setStudentSearchOpen: (open: boolean) => void;
  studentSearchTerm: string;
  setStudentSearchTerm: (term: string) => void;
  filteredStudents: StudentOption[];
}

function ComplaintModalContent({
  mode,
  form,
  setForm,
  onSubmit,
  onClose,
  students,
  teachers,
  onStudentSelect,
  onTeacherSelect,
  studentSearchOpen,
  setStudentSearchOpen,
  studentSearchTerm,
  setStudentSearchTerm,
  filteredStudents,
}: ModalContentProps) {
  const [customType, setCustomType] = useState(false);
  const [customTypeValue, setCustomTypeValue] = useState("");

  const update = (key: keyof Complaint, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleComplaintTypeChange = (value: string) => {
    if (value === "Other") {
      setCustomType(true);
      update("complaint_type", "");
    } else {
      setCustomType(false);
      update("complaint_type", value);
      setCustomTypeValue("");
    }
  };

  const handleCustomTypeChange = (value: string) => {
    setCustomTypeValue(value);
    update("complaint_type", value);
  };

  const selectedTeacher = teachers.find((t) => t.id === form.teacher_id);
  const selectedStudent = students.find((s) => s.id === form.student_id);

  return (
    <div className="flex min-h-0 w-full flex-col overflow-hidden">
      <div className="shrink-0 border-b px-5 py-3">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{mode === "add" ? "Add New Complaint" : "Edit Complaint"}</DialogTitle>
          <DialogDescription>Fill the required fields.</DialogDescription>
        </DialogHeader>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r bg-muted/20 p-3">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Complaint Summary</p>
              <h3 className="mt-1 text-lg font-bold">{mode === "add" ? "New complaint" : "Update complaint"}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Main details before saving.</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Complaint #</p>
                <p className="mt-1 font-mono text-sm">{form.complaint_number || "Auto-generated"}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Date</p>
                <p className="mt-1 font-semibold">{form.complaint_date || "Not set"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Teacher</p>
                  <p className="mt-1 truncate font-semibold">{selectedTeacher?.name || "Not selected"}</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className="mt-1 capitalize" variant="secondary">{form.status || "pending"}</Badge>
                </div>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="mt-1 font-semibold">{selectedStudent?.name || form.student_name || "Not selected"}</p>
                {selectedStudent?.parent && <p className="text-xs text-muted-foreground">Parent: {selectedStudent.parent}</p>}
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Complaint Type</p>
                <p className="mt-1 truncate font-semibold">{form.complaint_type || "Not selected"}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <div className="mb-5">
              <h3 className="text-lg font-bold">Complaint Details</h3>
              <p className="text-sm text-muted-foreground">Fill the required fields.</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /><h4 className="font-semibold">Core Information</h4></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label>Complaint #</Label><Input value={form.complaint_number || ""} onChange={(e) => update("complaint_number", e.target.value)} readOnly className="bg-muted" required /></div>
                  <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.complaint_date || ""} onChange={(e) => update("complaint_date", e.target.value)} required /></div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Student *</Label>
                    <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {form.student_name ? form.student_name : "Search student..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search student..." value={studentSearchTerm} onValueChange={setStudentSearchTerm} />
                          <CommandList>
                            <CommandEmpty>No student found.</CommandEmpty>
                            <CommandGroup>
                              {filteredStudents.map((student) => (
                                <CommandItem key={student.id} value={student.name} onSelect={() => onStudentSelect(student)}>
                                  <div><div>{student.name}</div>{student.parent && <div className="text-xs text-muted-foreground">Parent: {student.parent}</div>}</div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {form.student_name && <div className="text-xs text-muted-foreground">Student ID: {form.student_id || "N/A"}</div>}
                  </div>
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select value={form.teacher_id || ""} onValueChange={onTeacherSelect}>
                      <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                      <SelectContent>
                        {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} - {t.subject}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Complaint Type *</Label>
                    <Select value={customType ? "Other" : form.complaint_type || ""} onValueChange={handleComplaintTypeChange}>
                      <SelectTrigger><SelectValue placeholder="Select complaint type" /></SelectTrigger>
                      <SelectContent>
                        {COMPLAINT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {customType && <Input className="mt-2" placeholder="Enter custom complaint type" value={customTypeValue} onChange={(e) => handleCustomTypeChange(e.target.value)} required />}
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={form.priority || "medium"} onValueChange={(v) => update("priority", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status || "pending"} onValueChange={(v) => update("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="viewed_by_td">Viewed by T&D</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Textarea rows={3} placeholder="Write complaint details..." value={form.description || ""} onChange={(e) => update("description", e.target.value)} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Support Note (Internal)</Label>
                    <Textarea rows={2} placeholder="Internal support team note..." value={form.support_note || ""} onChange={(e) => update("support_note", e.target.value)} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>T&amp;D Note</Label>
                    <Textarea rows={3} placeholder="T&D resolution or investigation note..." value={form.td_note || ""} onChange={(e) => update("td_note", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t bg-card px-4 py-3">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={onSubmit}>{mode === "add" ? "Save Complaint" : "Update Complaint"}</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------- Metric Card ----------
function MetricCard({ title, value, desc, icon: Icon, variant = "default" }: {
  title: string; value: string | number; desc: string; icon: React.ElementType;
  variant?: "default" | "success" | "danger" | "warning" | "info";
}) {
  const border = { default: "border-l-indigo-500", success: "border-l-emerald-500", danger: "border-l-red-500", warning: "border-l-orange-500", info: "border-l-blue-500" }[variant];
  return (
    <Card className={`border-l-4 ${border}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-bold tracking-tight">{value}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
          <div className="rounded-2xl bg-muted p-3"><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}