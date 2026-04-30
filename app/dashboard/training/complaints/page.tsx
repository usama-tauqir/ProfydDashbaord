// app/dashboard/td/complaints/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileWarning,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react"

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
} from "recharts"

type ComplaintStatus = "pending" | "viewed_by_td" | "resolved"

interface Complaint {
  id: string
  complaint_id: string
  complaint_date: string
  student_id: string | null
  student_name: string
  parent_name: string | null
  teacher_name: string | null
  complaint_type: string
  status: ComplaintStatus
  priority: "low" | "medium" | "high" | "urgent" | null
  description: string | null
  support_note: string | null
  td_viewed: boolean | null
  td_viewed_at: string | null
  td_note: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
  updated_at: string | null
}

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"]

function csvEscape(value: unknown) {
  const text = String(value ?? "")
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function statusBadge(status: ComplaintStatus) {
  if (status === "resolved") return <Badge className="bg-emerald-600">Resolved</Badge>
  if (status === "viewed_by_td") return <Badge className="bg-blue-600">Viewed by T&D</Badge>
  return <Badge variant="destructive">Pending</Badge>
}

function priorityBadge(priority?: string | null) {
  if (priority === "urgent") return <Badge variant="destructive">Urgent</Badge>
  if (priority === "high") return <Badge className="bg-orange-600">High</Badge>
  if (priority === "medium") return <Badge variant="secondary">Medium</Badge>
  return <Badge variant="outline">Low</Badge>
}

export default function TDComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [showAnalytics, setShowAnalytics] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [isResolveOpen, setIsResolveOpen] = useState(false)
  const [tdNote, setTdNote] = useState("")
  const [resolvedBy, setResolvedBy] = useState("T&D Department")

  const fetchComplaints = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("complaint_date", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      setComplaints([])
    } else {
      setComplaints((data || []) as Complaint[])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const pendingComplaints = complaints.filter((c) => c.status === "pending")
  const viewedComplaints = complaints.filter((c) => c.status === "viewed_by_td")
  const resolvedComplaints = complaints.filter((c) => c.status === "resolved")
  const urgentComplaints = complaints.filter((c) => c.priority === "urgent" || c.priority === "high")

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const q = search.toLowerCase()

      const matchesSearch =
        !q ||
        complaint.complaint_id.toLowerCase().includes(q) ||
        complaint.student_name.toLowerCase().includes(q) ||
        complaint.teacher_name?.toLowerCase().includes(q) ||
        complaint.complaint_type.toLowerCase().includes(q) ||
        complaint.status.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && complaint.status !== "resolved") ||
        complaint.status === statusFilter

      const matchesPriority =
        priorityFilter === "all" || complaint.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [complaints, search, statusFilter, priorityFilter])

  const statusChartData = [
    { name: "Pending", value: pendingComplaints.length },
    { name: "Viewed by T&D", value: viewedComplaints.length },
    { name: "Resolved", value: resolvedComplaints.length },
  ]

  const typeChartData = Object.entries(
    complaints.reduce((acc, c) => {
      const type = c.complaint_type || "Unknown"
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const markViewed = async (complaint: Complaint) => {
    const { error } = await supabase
      .from("complaints")
      .update({
        status: complaint.status === "resolved" ? "resolved" : "viewed_by_td",
        td_viewed: true,
        td_viewed_at: complaint.td_viewed_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", complaint.id)

    if (error) alert(error.message)
    else fetchComplaints()
  }

  const openResolve = async (complaint: Complaint) => {
    if (!complaint.td_viewed) {
      await markViewed(complaint)
    }

    setSelectedComplaint(complaint)
    setTdNote(complaint.td_note || "")
    setResolvedBy(complaint.resolved_by || "T&D Department")
    setIsResolveOpen(true)
  }

  const submitResolution = async () => {
    if (!selectedComplaint) return

    if (!tdNote.trim()) {
      alert("Please write a T&D resolution note.")
      return
    }

    const { error } = await supabase
      .from("complaints")
      .update({
        status: "resolved",
        td_viewed: true,
        td_viewed_at: selectedComplaint.td_viewed_at || new Date().toISOString(),
        td_note: tdNote,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy || "T&D Department",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedComplaint.id)

    if (error) {
      alert(error.message)
      return
    }

    setIsResolveOpen(false)
    setSelectedComplaint(null)
    setTdNote("")
    fetchComplaints()
  }

  const saveTDNoteOnly = async () => {
    if (!selectedComplaint) return

    const { error } = await supabase
      .from("complaints")
      .update({
        status: "viewed_by_td",
        td_viewed: true,
        td_viewed_at: selectedComplaint.td_viewed_at || new Date().toISOString(),
        td_note: tdNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedComplaint.id)

    if (error) {
      alert(error.message)
      return
    }

    setIsResolveOpen(false)
    setSelectedComplaint(null)
    setTdNote("")
    fetchComplaints()
  }

  const exportCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Student",
      "Teacher",
      "Type",
      "Priority",
      "Status",
      "Description",
      "Support Note",
      "T&D Note",
      "Resolved At",
      "Resolved By",
    ]

    const rows = filteredComplaints.map((c) => [
      c.complaint_id,
      c.complaint_date,
      c.student_name,
      c.teacher_name || "",
      c.complaint_type,
      c.priority || "",
      c.status,
      c.description || "",
      c.support_note || "",
      c.td_note || "",
      c.resolved_at || "",
      c.resolved_by || "",
    ])

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `td_complaints_${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">T&amp;D Complaint Desk</h1>
          <p className="text-muted-foreground">
            Review support complaints, add T&amp;D notes, and submit resolutions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>

          <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </Button>

          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>

          <Button onClick={fetchComplaints}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Pending"
          value={pendingComplaints.length}
          desc="Needs T&D review"
          icon={AlertCircle}
          variant="danger"
        />

        <MetricCard
          title="Viewed by T&D"
          value={viewedComplaints.length}
          desc="Under investigation"
          icon={Eye}
          variant="info"
        />

        <MetricCard
          title="Resolved"
          value={resolvedComplaints.length}
          desc="Submitted to support"
          icon={CheckCircle2}
          variant="success"
        />

        <MetricCard
          title="Urgent / High"
          value={urgentComplaints.length}
          desc="Priority cases"
          icon={FileWarning}
          variant="warning"
        />
      </div>

      {showAnalytics && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complaints by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {statusChartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complaints by Type</CardTitle>
            </CardHeader>
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
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by ID, student, teacher, type, status"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Cases</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="viewed_by_td">Viewed by T&D</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Support Note</TableHead>
                  <TableHead>T&amp;D Note</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                      No complaint records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-mono text-sm">
                        {complaint.complaint_id}
                      </TableCell>

                      <TableCell>
                        {complaint.complaint_date
                          ? format(new Date(complaint.complaint_date), "dd-MMM-yyyy")
                          : "-"}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">{complaint.student_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {complaint.student_id || complaint.parent_name || "-"}
                        </div>
                      </TableCell>

                      <TableCell>{complaint.teacher_name || "-"}</TableCell>

                      <TableCell>
                        <div>{complaint.complaint_type}</div>
                        {complaint.description && (
                          <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                            {complaint.description}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>{priorityBadge(complaint.priority)}</TableCell>

                      <TableCell>{statusBadge(complaint.status)}</TableCell>

                      <TableCell className="max-w-xs truncate">
                        {complaint.support_note || "-"}
                      </TableCell>

                      <TableCell className="max-w-xs truncate">
                        {complaint.td_note || "-"}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {complaint.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markViewed(complaint)}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              View
                            </Button>
                          )}

                          {complaint.status !== "resolved" && (
                            <Button
                              size="sm"
                              onClick={() => openResolve(complaint)}
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              Resolve
                            </Button>
                          )}

                          {complaint.status === "resolved" && (
                            <Badge className="bg-emerald-600">
                              <UserCheck className="mr-1 h-3.5 w-3.5" />
                              Done
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>T&amp;D Resolution</DialogTitle>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-5">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Info label="Complaint ID" value={selectedComplaint.complaint_id} />
                  <Info
                    label="Date"
                    value={
                      selectedComplaint.complaint_date
                        ? format(new Date(selectedComplaint.complaint_date), "dd-MMM-yyyy")
                        : "-"
                    }
                  />
                  <Info label="Student" value={selectedComplaint.student_name} />
                  <Info label="Teacher" value={selectedComplaint.teacher_name || "-"} />
                  <Info label="Type" value={selectedComplaint.complaint_type} />
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <div className="mt-1">{priorityBadge(selectedComplaint.priority)}</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Complaint Description</p>
                    <p className="text-sm">{selectedComplaint.description || "-"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Support Note</p>
                    <p className="text-sm">{selectedComplaint.support_note || "-"}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label>T&amp;D Investigation / Resolution Note *</Label>
                <textarea
                  value={tdNote}
                  onChange={(e) => setTdNote(e.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Write what T&D checked, what action was taken, and final resolution..."
                />
              </div>

              <div>
                <Label>Resolved By</Label>
                <Input
                  value={resolvedBy}
                  onChange={(e) => setResolvedBy(e.target.value)}
                  placeholder="T&D Department"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={saveTDNoteOnly}>
                  <Clock className="mr-2 h-4 w-4" />
                  Save Note Only
                </Button>

                <Button onClick={submitResolution}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Submit Resolution
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function MetricCard({
  title,
  value,
  desc,
  icon: Icon,
  variant = "default",
}: {
  title: string
  value: string | number
  desc: string
  icon: React.ElementType
  variant?: "default" | "success" | "danger" | "warning" | "info"
}) {
  const border = {
    default: "border-l-indigo-500",
    success: "border-l-emerald-500",
    danger: "border-l-red-500",
    warning: "border-l-orange-500",
    info: "border-l-blue-500",
  }[variant]

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
  )
}
