// app/dashboard/support/retention/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Calendar,
  PauseCircle,
  RefreshCw,
  Repeat,
  Search,
  ShieldAlert,
  UserMinus,
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

type StudentStatus = "active" | "on_break" | "reactivated" | "left_out"

interface CurrentStudent {
  id: string
  student_id: string
  student_name: string
  parent_name: string | null
  state: string | null
  learning_plan: string | null
  status: StudentStatus | null
  break_start_date: string | null
  break_end_date: string | null
  reactivated_at: string | null
  notes: string | null
  created_at: string
  deleted_at: string | null
}

interface FollowUp {
  id: string
  student_id: string
  student_name: string
  parent_name: string | null
  follow_up_date: string | null
  state: string | null
  learning_plan: string | null
  tutor_name: string | null
  reason_for_status: string | null
  created_at: string
}

interface LeftOut {
  id: string
  student_id: string
  student_name: string
  parent_name: string | null
  leaving_date: string | null
  reason_for_leaving: string | null
  state: string | null
  learning_plan: string | null
  created_at: string
}

interface RetentionRow {
  id: string
  student_id: string
  student_name: string
  parent_name: string | null
  state: string | null
  learning_plan: string | null
  source: "followup" | "on_break" | "left_out" | "reactivated"
  status: "due_today" | "upcoming" | "overdue" | "on_break" | "left_out" | "reactivated" | "no_date"
  date: string | null
  reason: string | null
}

const COLORS = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function monthKey(dateValue?: string | null) {
  if (!dateValue) return "Unknown"
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return "Unknown"
  return format(d, "MMM yyyy")
}

function isThisMonth(dateValue?: string | null) {
  if (!dateValue) return false
  const d = new Date(dateValue)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function getFollowUpStatus(dateValue?: string | null) {
  if (!dateValue) return "no_date"

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const d = new Date(dateValue)
  d.setHours(0, 0, 0, 0)

  if (d.getTime() === today.getTime()) return "due_today"
  if (d > today) return "upcoming"
  return "overdue"
}

function statusBadge(status: RetentionRow["status"]) {
  if (status === "due_today") return <Badge className="bg-blue-600">Due Today</Badge>
  if (status === "upcoming") return <Badge variant="outline">Upcoming</Badge>
  if (status === "overdue") return <Badge variant="destructive">Overdue</Badge>
  if (status === "on_break") return <Badge variant="secondary">On Break</Badge>
  if (status === "reactivated") return <Badge className="bg-emerald-600">Reactivated</Badge>
  if (status === "left_out") return <Badge variant="destructive">Left-Out</Badge>
  return <Badge variant="secondary">No Date</Badge>
}

export default function RetentionPage() {
  const [students, setStudents] = useState<CurrentStudent[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [leftOuts, setLeftOuts] = useState<LeftOut[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")

  const fetchRetentionData = async () => {
    setLoading(true)

    const [studentsRes, followUpsRes, leftOutsRes] = await Promise.all([
      supabase.from("current_students").select("*").order("created_at", { ascending: false }),
      supabase.from("followup_tracker").select("*").order("follow_up_date", { ascending: true, nullsFirst: false }),
      supabase.from("leftout_tracker").select("*").order("leaving_date", { ascending: false }).order("created_at", { ascending: false }),
    ])

    if (studentsRes.error) alert(studentsRes.error.message)
    else setStudents((studentsRes.data || []) as CurrentStudent[])

    if (followUpsRes.error) alert(followUpsRes.error.message)
    else setFollowUps((followUpsRes.data || []) as FollowUp[])

    if (leftOutsRes.error) alert(leftOutsRes.error.message)
    else setLeftOuts((leftOutsRes.data || []) as LeftOut[])

    setLoading(false)
  }

  useEffect(() => {
    fetchRetentionData()
  }, [])

  const activeStudents = students.filter(
    (s) => !s.deleted_at && ((s.status || "active") === "active" || s.status === "reactivated")
  )

  const onBreakStudents = students.filter((s) => (s.status || "active") === "on_break")
  const reactivatedStudents = students.filter((s) => s.status === "reactivated")
  const reactivatedThisMonth = reactivatedStudents.filter((s) => isThisMonth(s.reactivated_at))
  const leftThisMonth = leftOuts.filter((r) => isThisMonth(r.leaving_date || r.created_at))

  const overdueFollowUps = followUps.filter((f) => getFollowUpStatus(f.follow_up_date) === "overdue")
  const dueTodayFollowUps = followUps.filter((f) => getFollowUpStatus(f.follow_up_date) === "due_today")
  const upcomingFollowUps = followUps.filter((f) => getFollowUpStatus(f.follow_up_date) === "upcoming")

  const retentionRate =
    activeStudents.length + leftOuts.length > 0
      ? Number(((activeStudents.length / (activeStudents.length + leftOuts.length)) * 100).toFixed(1))
      : 0

  const reactivationRate =
    onBreakStudents.length + reactivatedStudents.length > 0
      ? Number(((reactivatedStudents.length / (onBreakStudents.length + reactivatedStudents.length)) * 100).toFixed(1))
      : 0

  const rows: RetentionRow[] = useMemo(() => {
    const followUpRows: RetentionRow[] = followUps.map((f) => ({
      id: `followup-${f.id}`,
      student_id: f.student_id,
      student_name: f.student_name,
      parent_name: f.parent_name,
      state: f.state,
      learning_plan: f.learning_plan,
      source: "followup",
      status: getFollowUpStatus(f.follow_up_date) as RetentionRow["status"],
      date: f.follow_up_date,
      reason: f.reason_for_status,
    }))

    const onBreakRows: RetentionRow[] = onBreakStudents.map((s) => ({
      id: `break-${s.id}`,
      student_id: s.student_id,
      student_name: s.student_name,
      parent_name: s.parent_name,
      state: s.state,
      learning_plan: s.learning_plan,
      source: "on_break",
      status: "on_break",
      date: s.break_start_date,
      reason: s.notes || "Student is currently on break",
    }))

    const leftRows: RetentionRow[] = leftOuts.map((l) => ({
      id: `left-${l.id}`,
      student_id: l.student_id,
      student_name: l.student_name,
      parent_name: l.parent_name,
      state: l.state,
      learning_plan: l.learning_plan,
      source: "left_out",
      status: "left_out",
      date: l.leaving_date || l.created_at,
      reason: l.reason_for_leaving,
    }))

    const reactivatedRows: RetentionRow[] = reactivatedStudents.map((s) => ({
      id: `reactivated-${s.id}`,
      student_id: s.student_id,
      student_name: s.student_name,
      parent_name: s.parent_name,
      state: s.state,
      learning_plan: s.learning_plan,
      source: "reactivated",
      status: "reactivated",
      date: s.reactivated_at,
      reason: s.notes || "Student returned from break",
    }))

    return [...followUpRows, ...onBreakRows, ...reactivatedRows, ...leftRows]
  }, [followUps, leftOuts, onBreakStudents, reactivatedStudents])

  const filteredRows = rows.filter((row) => {
    const q = search.toLowerCase()

    const matchesSearch =
      !q ||
      row.student_name.toLowerCase().includes(q) ||
      row.student_id.toLowerCase().includes(q) ||
      row.parent_name?.toLowerCase().includes(q)

    const matchesStatus = statusFilter === "all" || row.status === statusFilter
    const matchesSource = sourceFilter === "all" || row.source === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })

  const monthlyRiskData = Object.entries(
    rows.reduce((acc, row) => {
      const key = monthKey(row.date)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([month, count]) => ({ month, count }))

  const reasonData = Object.entries(
    leftOuts.reduce((acc, row) => {
      const reason = row.reason_for_leaving || "Not specified"
      acc[reason] = (acc[reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const reactivateFromFollowUp = async (row: RetentionRow) => {
    const { data: existingStudent, error: findError } = await supabase
      .from("current_students")
      .select("*")
      .eq("student_id", row.student_id)
      .maybeSingle()

    if (findError) {
      alert(findError.message)
      return
    }

    if (!existingStudent) {
      alert("Student not found in current_students table.")
      return
    }

    const { error: updateError } = await supabase
      .from("current_students")
      .update({
        status: "reactivated",
        break_end_date: todayIso(),
        reactivated_at: todayIso(),
        deleted_at: null,
        notes: "Reactivated from retention page",
      })
      .eq("id", existingStudent.id)

    if (updateError) {
      alert(updateError.message)
      return
    }

    if (row.source === "followup") {
      const id = row.id.replace("followup-", "")
      await supabase.from("followup_tracker").delete().eq("id", id)
    }

    fetchRetentionData()
  }

  const moveToLeftOut = async (row: RetentionRow) => {
    const { error: insertError } = await supabase.from("leftout_tracker").insert([
      {
        student_id: row.student_id,
        student_name: row.student_name,
        parent_name: row.parent_name,
        leaving_date: todayIso(),
        state: row.state,
        learning_plan: row.learning_plan,
        reason_for_leaving: row.reason || "Moved from retention page to left-out",
      },
    ])

    if (insertError) {
      alert(insertError.message)
      return
    }

    const { error: updateError } = await supabase
      .from("current_students")
      .update({
        status: "left_out",
        deleted_at: new Date().toISOString(),
        notes: "Moved to left-out from retention page",
      })
      .eq("student_id", row.student_id)

    if (updateError) {
      alert(updateError.message)
      return
    }

    if (row.source === "followup") {
      const id = row.id.replace("followup-", "")
      await supabase.from("followup_tracker").delete().eq("id", id)
    }

    fetchRetentionData()
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Retention Dashboard</h1>
          <p className="text-muted-foreground">
            Track students on break, follow-ups, reactivation, drop-offs, and retention risk.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/dashboard/support?tab=followup">
              <PauseCircle className="mr-2 h-4 w-4" />
              Follow-Ups
            </Link>
          </Button>

          <Button onClick={fetchRetentionData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard title="Retention Rate" value={`${retentionRate}%`} desc="Active students vs left-outs" icon={ShieldAlert} />
        <MetricCard title="On Break" value={onBreakStudents.length} desc="Paused and needs follow-up" icon={PauseCircle} variant="warning" />
        <MetricCard title="Due Today" value={dueTodayFollowUps.length} desc="Text/call parents today" icon={Calendar} variant="info" />
        <MetricCard title="Overdue" value={overdueFollowUps.length} desc="Needs urgent action" icon={AlertCircle} variant="danger" />
        <MetricCard title="Reactivated" value={reactivatedThisMonth.length} desc={`Returned in ${format(new Date(), "MMMM")}`} icon={Repeat} variant="success" />
        <MetricCard title="Left This Month" value={leftThisMonth.length} desc="Moved to left-out" icon={UserMinus} variant="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Retention Summary</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <ProgressRow label="Retention Rate" value={retentionRate} color="bg-emerald-500" />
            <ProgressRow label="Reactivation Rate" value={reactivationRate} color="bg-blue-500" />
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium">Workflow</p>
              <p className="mt-1 text-muted-foreground">
                Current → Follow-Up means student is on break. If parent continues, reactivate. If they stop, move to left-out.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Retention Activity by Month</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRiskData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Left-Out Reasons</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}>
                  {reasonData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Retention Action List</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by student, parent, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[190px]"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="due_today">Due Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="on_break">On Break</SelectItem>
                <SelectItem value="reactivated">Reactivated</SelectItem>
                <SelectItem value="left_out">Left-Out</SelectItem>
                <SelectItem value="no_date">No Date</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[190px]"><SelectValue placeholder="Filter source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="followup">Follow-Up</SelectItem>
                <SelectItem value="on_break">On Break</SelectItem>
                <SelectItem value="reactivated">Reactivated</SelectItem>
                <SelectItem value="left_out">Left-Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason / Notes</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No retention records found.</TableCell></TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell><div className="font-medium">{row.student_name}</div><div className="text-xs text-muted-foreground">{row.student_id}</div></TableCell>
                      <TableCell>{row.parent_name || "-"}</TableCell>
                      <TableCell>{row.learning_plan || "-"}</TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell>{row.date ? format(new Date(row.date), "dd-MMM-yyyy") : "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{row.reason || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {row.status !== "left_out" && row.status !== "reactivated" && (
                            <Button size="sm" variant="outline" onClick={() => reactivateFromFollowUp(row)}>
                              <Repeat className="mr-1 h-3.5 w-3.5" /> Reactivate
                            </Button>
                          )}
                          {row.status !== "left_out" && (
                            <Button size="sm" variant="destructive" onClick={() => moveToLeftOut(row)}>
                              <UserMinus className="mr-1 h-3.5 w-3.5" /> Left-Out
                            </Button>
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
    </div>
  )
}

function ProgressRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{value}%</span></div>
      <div className="h-2.5 rounded-full bg-muted"><div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} /></div>
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
  const styles = {
    default: "border-l-indigo-500",
    success: "border-l-emerald-500",
    danger: "border-l-red-500",
    warning: "border-l-orange-500",
    info: "border-l-blue-500",
  }[variant]

  return (
    <Card className={`border-l-4 ${styles}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
          <div className="rounded-2xl bg-muted p-3"><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  )
}
