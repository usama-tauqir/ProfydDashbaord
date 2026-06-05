"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  MoreHorizontal,
  Search,
  TrendingUp,
  Calendar,
  Download,
  Upload,
  UserMinus,
  Clock,
  Pencil,
  Trash2,
  Activity,
  Users,
  Loader2,
  GraduationCap,
  BookOpen,
  AlertCircle,
  PauseCircle,
  Repeat,
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
import { supabase } from "@/lib/supabase/client"
import { format } from "date-fns"
import ReactSelect from "react-select"
import { Country, State } from "country-state-city"

type StudentStatus = "active" | "on_break" | "reactivated" | "left_out"

interface CurrentStudent {
  id: string
  student_id: string
  student_name: string
  parent_name: string
  country: string | null
  state: string | null
  grade_year: string | null
  learning_plan: string | null
  classes_per_week: number | null
  start_date: string | null
  sales_person: string | null
  telecaller: string | null
  refer_by: string | null
  status: StudentStatus | null
  break_start_date: string | null
  break_end_date: string | null
  reactivated_at: string | null
  notes: string | null
  created_at: string
  deleted_at: string | null
}

interface LeftOut {
  id: string
  student_id: string
  student_name: string
  parent_name: string | null
  starting_date: string | null
  leaving_date: string | null
  reason_for_leaving: string | null
  time_period: string | null
  state: string | null
  learning_plan: string | null
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
  leaving_date: string | null
  tutor_name: string | null
  reason_for_status: string | null
  created_at: string
  deleted_at: string | null
}

const COLORS_CURRENT = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]
const COLORS_LEFTOUT = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"]
const COLORS_FOLLOWUP = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"]

type SelectOption = {
  value: string
  label: string
}

const LEARNING_PLAN_OPTIONS = ["1x/week", "2x/week", "3x/week", "4x/week"]
const CLASSES_PER_WEEK_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1)

function getCountryOptions(): SelectOption[] {
  return Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    label: country.name,
  }))
}

function getCountryIsoCode(countryValue?: string | null) {
  if (!countryValue) return ""

  const countries = Country.getAllCountries()
  const foundCountry = countries.find(
    (country) =>
      country.isoCode.toLowerCase() === countryValue.toLowerCase() ||
      country.name.toLowerCase() === countryValue.toLowerCase()
  )

  return foundCountry?.isoCode || ""
}

function getCountryLabel(countryValue?: string | null) {
  if (!countryValue) return ""

  const countries = Country.getAllCountries()
  const foundCountry = countries.find(
    (country) =>
      country.isoCode.toLowerCase() === countryValue.toLowerCase() ||
      country.name.toLowerCase() === countryValue.toLowerCase()
  )

  return foundCountry?.name || countryValue
}

function getStateOptions(countryValue?: string | null): SelectOption[] {
  const countryIsoCode = getCountryIsoCode(countryValue)
  if (!countryIsoCode) return []

  return State.getStatesOfCountry(countryIsoCode).map((state) => ({
    value: state.name,
    label: state.name,
  }))
}

const reactSelectClassNames = {
  control: () =>
    "min-h-10 rounded-md border border-[#303a3a] bg-[#060909] px-3 text-sm text-white shadow-sm transition hover:border-[#5b6470] focus-within:border-violet-500",
  input: () => "text-sm text-white",
  placeholder: () => "text-slate-500",
  singleValue: () => "text-white",
  menu: () => "z-[80] mt-2 overflow-hidden rounded-lg border border-[#303a3a] bg-[#0d1218] text-white shadow-2xl",
  option: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) =>
    `cursor-pointer px-3 py-2 text-sm ${
      isSelected || isFocused ? "bg-violet-600 text-white" : "bg-[#0d1218] text-slate-200"
    }`,
}


function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function csvEscape(value: unknown) {
  const text = String(value ?? "")
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function parseCSVLine(line: string) {
  const result: string[] = []
  let current = ""
  let quoted = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        current += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ",") {
      result.push(current)
      current = ""
    } else {
      current += ch
    }
  }

  result.push(current)
  return result.map((v) => v.trim())
}

function isSameMonth(dateValue?: string | null) {
  if (!dateValue) return false
  const d = new Date(dateValue)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function getFollowUpStatus(record: FollowUp) {
  if (!record.follow_up_date) return "no_date"

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(record.follow_up_date)
  date.setHours(0, 0, 0, 0)

  if (date.getTime() === today.getTime()) return "today"
  if (date > today) return "upcoming"
  return "overdue"
}

function followUpStatusBadge(record: FollowUp) {
  const status = getFollowUpStatus(record)

  if (status === "today") return <Badge className="bg-blue-600">Due Today</Badge>
  if (status === "upcoming") return <Badge variant="outline">Upcoming</Badge>
  if (status === "overdue") return <Badge variant="destructive">Overdue</Badge>
  return <Badge variant="secondary">No Date</Badge>
}

function currentStudentStatusBadge(status?: StudentStatus | null) {
  if (status === "on_break") return <Badge variant="secondary">On Break</Badge>
  if (status === "reactivated") return <Badge className="bg-emerald-600">Reactivated</Badge>
  if (status === "left_out") return <Badge variant="destructive">Left Out</Badge>
  return <Badge variant="outline">Active</Badge>
}

export default function StudentsHubPage() {
  const [activeTab, setActiveTab] = useState("current")

  const [students, setStudents] = useState<CurrentStudent[]>([])
  const [filteredStudents, setFilteredStudents] = useState<CurrentStudent[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [studentGradeFilter, setStudentGradeFilter] = useState<string>("all")
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>("all")
  const [showStudentAnalytics, setShowStudentAnalytics] = useState(true)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<CurrentStudent | null>(null)
  const [studentForm, setStudentForm] = useState<Partial<CurrentStudent>>({})

  const [leftOuts, setLeftOuts] = useState<LeftOut[]>([])
  const [filteredLeftOuts, setFilteredLeftOuts] = useState<LeftOut[]>([])
  const [leftOutSearch, setLeftOutSearch] = useState("")
  const [leftOutStateFilter, setLeftOutStateFilter] = useState<string>("all")
  const [showLeftOutAnalytics, setShowLeftOutAnalytics] = useState(true)
  const [isAddLeftOutOpen, setIsAddLeftOutOpen] = useState(false)
  const [isEditLeftOutOpen, setIsEditLeftOutOpen] = useState(false)
  const [editingLeftOut, setEditingLeftOut] = useState<LeftOut | null>(null)
  const [leftOutForm, setLeftOutForm] = useState<Partial<LeftOut>>({})
  const [fetchingLeftOutStudent, setFetchingLeftOutStudent] = useState(false)

  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUp[]>([])
  const [followUpSearch, setFollowUpSearch] = useState("")
  const [followUpStateFilter, setFollowUpStateFilter] = useState<string>("all")
  const [followUpStatusFilter, setFollowUpStatusFilter] = useState<string>("all")
  const [showFollowUpAnalytics, setShowFollowUpAnalytics] = useState(true)
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false)
  const [isEditFollowUpOpen, setIsEditFollowUpOpen] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)
  const [followUpForm, setFollowUpForm] = useState<Partial<FollowUp>>({})
  const [fetchingFollowUpStudent, setFetchingFollowUpStudent] = useState(false)

  const [loading, setLoading] = useState(true)
  const uploadRef = useRef<HTMLInputElement | null>(null)

  const fetchAllData = async () => {
    setLoading(true)

    const [studentsRes, leftOutsRes, followUpsRes] = await Promise.all([
      supabase
        .from("current_students")
        .select("*")
        .is("deleted_at", null)
        .order("start_date", { ascending: false }),
      supabase
        .from("leftout_tracker")
        .select("*")
        .order("leaving_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("followup_tracker")
        .select("*")
        .order("follow_up_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
    ])

    if (!studentsRes.error) {
      setStudents((studentsRes.data || []) as CurrentStudent[])
      setFilteredStudents((studentsRes.data || []) as CurrentStudent[])
    } else {
      alert(`Current students error: ${studentsRes.error.message}`)
    }

    if (!leftOutsRes.error) {
      setLeftOuts((leftOutsRes.data || []) as LeftOut[])
      setFilteredLeftOuts((leftOutsRes.data || []) as LeftOut[])
    } else {
      alert(`Left-out error: ${leftOutsRes.error.message}`)
    }

    if (!followUpsRes.error) {
      setFollowUps((followUpsRes.data || []) as FollowUp[])
      setFilteredFollowUps((followUpsRes.data || []) as FollowUp[])
    } else {
      alert(`Follow-up error: ${followUpsRes.error.message}`)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const generateStudentId = async () => {
    const { data } = await supabase
      .from("current_students")
      .select("student_id")
      .order("created_at", { ascending: false })
      .limit(1)

    let nextNumber = 1

    if (data && data.length > 0) {
      const lastId = data[0].student_id
      const match = lastId.match(/AU-(\d+)-/)
      if (match) nextNumber = parseInt(match[1]) + 1
    }

    return `AU-${nextNumber.toString().padStart(4, "0")}-AZA`
  }

  useEffect(() => {
    let filtered = students

    if (studentSearch) {
      filtered = filtered.filter(
        (s) =>
          s.student_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.student_id?.toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.parent_name?.toLowerCase().includes(studentSearch.toLowerCase())
      )
    }

    if (studentGradeFilter !== "all") {
      filtered = filtered.filter((s) => s.grade_year === studentGradeFilter)
    }

    if (studentStatusFilter !== "all") {
      filtered = filtered.filter((s) => (s.status || "active") === studentStatusFilter)
    }

    setFilteredStudents(filtered)
  }, [studentSearch, studentGradeFilter, studentStatusFilter, students])

  useEffect(() => {
    let filtered = leftOuts

    if (leftOutSearch) {
      filtered = filtered.filter(
        (r) =>
          r.student_name.toLowerCase().includes(leftOutSearch.toLowerCase()) ||
          r.student_id.toLowerCase().includes(leftOutSearch.toLowerCase()) ||
          r.parent_name?.toLowerCase().includes(leftOutSearch.toLowerCase())
      )
    }

    if (leftOutStateFilter !== "all") {
      filtered = filtered.filter((r) => r.state === leftOutStateFilter)
    }

    setFilteredLeftOuts(filtered)
  }, [leftOutSearch, leftOutStateFilter, leftOuts])

  useEffect(() => {
    let filtered = followUps

    if (followUpSearch) {
      filtered = filtered.filter(
        (r) =>
          r.student_name.toLowerCase().includes(followUpSearch.toLowerCase()) ||
          r.student_id.toLowerCase().includes(followUpSearch.toLowerCase()) ||
          r.parent_name?.toLowerCase().includes(followUpSearch.toLowerCase())
      )
    }

    if (followUpStateFilter !== "all") {
      filtered = filtered.filter((r) => r.state === followUpStateFilter)
    }

    if (followUpStatusFilter !== "all") {
      filtered = filtered.filter((r) => getFollowUpStatus(r) === followUpStatusFilter)
    }

    setFilteredFollowUps(filtered)
  }, [followUpSearch, followUpStateFilter, followUpStatusFilter, followUps])

  const activeStudents = students.filter(
    (s) => (s.status || "active") === "active" || s.status === "reactivated"
  )

  const totalStudents = activeStudents.length
  const onBreakStudents = students.filter((s) => s.status === "on_break").length
  const reactivatedThisMonth = students.filter((s) => isSameMonth(s.reactivated_at)).length

  const totalClassesPerWeek = activeStudents.reduce(
    (sum, s) => sum + Number(s.classes_per_week || 0),
    0
  )

  const newThisMonth = students.filter((s) => isSameMonth(s.start_date)).length

  const gradeData = Object.entries(
    activeStudents.reduce((acc, s) => {
      const grade = s.grade_year || "Unknown"
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const monthlyEnrollments = () => {
    const months: Record<string, number> = {}

    students.forEach((s) => {
      const month = s.start_date?.substring(0, 7)
      if (month) months[month] = (months[month] || 0) + 1
    })

    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }))
  }

  const totalLeftOut = leftOuts.length

  const leftThisMonth = leftOuts.filter((r) => isSameMonth(r.leaving_date)).length

  const avgDuration = () => {
    const durations = leftOuts
      .map((r) => {
        if (r.starting_date && r.leaving_date) {
          return (
            (new Date(r.leaving_date).getTime() - new Date(r.starting_date).getTime()) /
            (1000 * 60 * 60 * 24)
          )
        }
        return null
      })
      .filter((d): d is number => d !== null)

    return durations.length === 0
      ? 0
      : durations.reduce((a, b) => a + b, 0) / durations.length
  }

  const reasonData = Object.entries(
    leftOuts.reduce((acc, r) => {
      const reason = r.reason_for_leaving || "Not specified"
      acc[reason] = (acc[reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const monthlyLeftOuts = () => {
    const months: Record<string, number> = {}

    leftOuts.forEach((r) => {
      if (r.leaving_date) {
        const month = r.leaving_date.substring(0, 7)
        months[month] = (months[month] || 0) + 1
      }
    })

    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }))
  }

  const totalFollowUps = followUps.length
  const dueTodayFollowUps = followUps.filter((r) => getFollowUpStatus(r) === "today").length
  const upcomingFollowUps = followUps.filter((r) => getFollowUpStatus(r) === "upcoming").length
  const overdueFollowUps = followUps.filter((r) => getFollowUpStatus(r) === "overdue").length
  const uniqueTutors = new Set(followUps.map((r) => r.tutor_name).filter(Boolean)).size

  const followUpStateData = Object.entries(
    followUps.reduce((acc, r) => {
      const state = r.state || "Unknown"
      acc[state] = (acc[state] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const monthlyFollowUps = () => {
    const months: Record<string, number> = {}

    followUps.forEach((r) => {
      if (r.follow_up_date) {
        const month = r.follow_up_date.substring(0, 7)
        months[month] = (months[month] || 0) + 1
      }
    })

    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }))
  }

  const grades = [...new Set(students.map((s) => s.grade_year).filter(Boolean))].sort() as string[]
  const leftOutStates = [...new Set(leftOuts.map((r) => r.state).filter(Boolean))].sort() as string[]
  const followUpStates = [...new Set(followUps.map((r) => r.state).filter(Boolean))].sort() as string[]

  const fetchStudentForLeftOut = async (studentId: string) => {
    if (!studentId || studentId.length < 3) return

    setFetchingLeftOutStudent(true)

    const { data } = await supabase
      .from("current_students")
      .select("*")
      .eq("student_id", studentId)
      .single()

    if (data) {
      setLeftOutForm({
        student_id: data.student_id,
        student_name: data.student_name,
        parent_name: data.parent_name,
        starting_date: data.start_date,
        state: data.state,
        learning_plan: data.learning_plan,
      })
    }

    setFetchingLeftOutStudent(false)
  }

  const fetchStudentForFollowUp = async (studentId: string) => {
    if (!studentId || studentId.length < 3) return

    setFetchingFollowUpStudent(true)

    const { data } = await supabase
      .from("current_students")
      .select("*")
      .eq("student_id", studentId)
      .single()

    if (data) {
      setFollowUpForm({
        student_id: data.student_id,
        student_name: data.student_name,
        parent_name: data.parent_name,
        state: data.state,
        learning_plan: data.learning_plan,
      })
    }

    setFetchingFollowUpStudent(false)
  }

  const studentPayload = () => ({
    student_id: studentForm.student_id,
    student_name: studentForm.student_name,
    parent_name: studentForm.parent_name,
    country: studentForm.country || null,
    state: studentForm.state || null,
    grade_year: studentForm.grade_year || null,
    learning_plan: studentForm.learning_plan || null,
    classes_per_week: studentForm.classes_per_week
      ? parseInt(studentForm.classes_per_week.toString())
      : null,
    start_date: studentForm.start_date || null,
    sales_person: studentForm.sales_person || null,
    telecaller: studentForm.telecaller || null,
    refer_by: studentForm.refer_by || null,
    status: studentForm.status || "active",
    break_start_date: studentForm.break_start_date || null,
    break_end_date: studentForm.break_end_date || null,
    reactivated_at: studentForm.reactivated_at || null,
    notes: studentForm.notes || null,
  })

  const handleAddStudent = async () => {
    if (!studentForm.student_id || !studentForm.student_name || !studentForm.parent_name) {
      alert("Please fill in all required fields: Student ID, Student Name, and Parent Name")
      return
    }

    const { error } = await supabase.from("current_students").insert([studentPayload()]).select()

    if (error) {
      alert(`Error adding student: ${error.message || error.details || "Unknown error"}`)
    } else {
      setIsAddStudentOpen(false)
      setStudentForm({})
      fetchAllData()
    }
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent || !studentForm.student_name || !studentForm.parent_name) {
      alert("Please fill in all required fields")
      return
    }

    const { error } = await supabase
      .from("current_students")
      .update(studentPayload())
      .eq("id", editingStudent.id)

    if (error) {
      alert(`Error updating student: ${error.message}`)
    } else {
      setIsEditStudentOpen(false)
      setEditingStudent(null)
      setStudentForm({})
      fetchAllData()
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      const { error } = await supabase
        .from("current_students")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)

      if (!error) fetchAllData()
      else alert("Error deleting student")
    }
  }

  const markOnBreak = async (student: CurrentStudent) => {
    const { error } = await supabase
      .from("current_students")
      .update({
        status: "on_break",
        break_start_date: todayIso(),
        notes: "Marked as on break",
      })
      .eq("id", student.id)

    if (!error) fetchAllData()
    else alert("Failed to mark student on break")
  }

  const reactivateStudent = async (student: CurrentStudent) => {
    const { error } = await supabase
      .from("current_students")
      .update({
        status: "reactivated",
        break_end_date: todayIso(),
        reactivated_at: todayIso(),
        deleted_at: null,
        notes: "Reactivated directly from current students",
      })
      .eq("id", student.id)

    if (!error) fetchAllData()
    else alert("Failed to reactivate student")
  }

  const moveToFollowUp = async (student: CurrentStudent) => {
    const followUpDate =
      window.prompt("Enter follow-up date, YYYY-MM-DD", todayIso()) || todayIso()

    const { error } = await supabase.from("followup_tracker").insert([
      {
        student_id: student.student_id,
        student_name: student.student_name,
        parent_name: student.parent_name,
        state: student.state,
        learning_plan: student.learning_plan,
        follow_up_date: followUpDate,
        reason_for_status: "Student is on break. Contact parent again on follow-up date.",
      },
    ])

    if (error) {
      alert("Failed to move to Follow-Up")
      return
    }

    await supabase
      .from("current_students")
      .update({
        status: "on_break",
        break_start_date: todayIso(),
        notes: "Moved to follow-up / on break",
      })
      .eq("id", student.id)

    fetchAllData()
  }

  const moveToLeftOut = async (student: CurrentStudent) => {
    const { error } = await supabase.from("leftout_tracker").insert([
      {
        student_id: student.student_id,
        student_name: student.student_name,
        parent_name: student.parent_name,
        starting_date: student.start_date,
        leaving_date: todayIso(),
        state: student.state,
        learning_plan: student.learning_plan,
        reason_for_leaving: student.notes,
      },
    ])

    if (!error) {
      await supabase
        .from("current_students")
        .update({
          status: "left_out",
          deleted_at: new Date().toISOString(),
          notes: "Moved to left-out",
        })
        .eq("id", student.id)

      fetchAllData()
    } else {
      alert("Failed to move to Left-Out")
    }
  }

  const reactivateFromFollowUp = async (record: FollowUp) => {
    const { error } = await supabase
      .from("current_students")
      .update({
        status: "reactivated",
        break_end_date: todayIso(),
        reactivated_at: todayIso(),
        deleted_at: null,
        notes: "Reactivated from follow-up",
      })
      .eq("student_id", record.student_id)

    if (error) {
      alert("Failed to reactivate student")
      return
    }

    await supabase.from("followup_tracker").delete().eq("id", record.id)

    fetchAllData()
  }

  const moveFollowUpToLeftOut = async (record: FollowUp) => {
    const { error } = await supabase.from("leftout_tracker").insert([
      {
        student_id: record.student_id,
        student_name: record.student_name,
        parent_name: record.parent_name,
        leaving_date: todayIso(),
        state: record.state,
        learning_plan: record.learning_plan,
        reason_for_leaving: record.reason_for_status || "Moved from follow-up to left-out",
      },
    ])

    if (error) {
      alert("Failed to move student to Left-Out")
      return
    }

    await supabase
      .from("current_students")
      .update({
        status: "left_out",
        deleted_at: new Date().toISOString(),
        notes: "Moved from follow-up to left-out",
      })
      .eq("student_id", record.student_id)

    await supabase.from("followup_tracker").delete().eq("id", record.id)

    fetchAllData()
  }

  const openEditStudent = (student: CurrentStudent) => {
    setEditingStudent(student)
    setStudentForm(student)
    setIsEditStudentOpen(true)
  }

  const handleAddLeftOut = async () => {
    const { error } = await supabase.from("leftout_tracker").insert([leftOutForm])

    if (!error) {
      setIsAddLeftOutOpen(false)
      setLeftOutForm({})
      fetchAllData()
    } else {
      alert("Error adding record")
    }
  }

  const handleUpdateLeftOut = async () => {
    if (!editingLeftOut) return

    const { error } = await supabase
      .from("leftout_tracker")
      .update(leftOutForm)
      .eq("id", editingLeftOut.id)

    if (!error) {
      setIsEditLeftOutOpen(false)
      setEditingLeftOut(null)
      setLeftOutForm({})
      fetchAllData()
    } else {
      alert("Error updating record")
    }
  }

  const handleDeleteLeftOut = async (id: string) => {
    if (confirm("Are you sure you want to delete this left-out record?")) {
      const { error } = await supabase.from("leftout_tracker").delete().eq("id", id)

      if (!error) fetchAllData()
      else alert("Error deleting record")
    }
  }

  const openEditLeftOut = (record: LeftOut) => {
    setEditingLeftOut(record)
    setLeftOutForm(record)
    setIsEditLeftOutOpen(true)
  }

  const handleAddFollowUp = async () => {
    const { error } = await supabase.from("followup_tracker").insert([followUpForm])

    if (!error) {
      setIsAddFollowUpOpen(false)
      setFollowUpForm({})
      fetchAllData()
    } else {
      alert("Error adding record")
    }
  }

  const handleUpdateFollowUp = async () => {
    if (!editingFollowUp) return

    const { error } = await supabase
      .from("followup_tracker")
      .update(followUpForm)
      .eq("id", editingFollowUp.id)

    if (!error) {
      setIsEditFollowUpOpen(false)
      setEditingFollowUp(null)
      setFollowUpForm({})
      fetchAllData()
    } else {
      alert("Error updating record")
    }
  }

  const handleDeleteFollowUp = async (id: string) => {
    if (confirm("Are you sure you want to delete this follow-up record?")) {
      const { error } = await supabase.from("followup_tracker").delete().eq("id", id)

      if (!error) fetchAllData()
      else alert("Error deleting record")
    }
  }

  const openEditFollowUp = (record: FollowUp) => {
    setEditingFollowUp(record)
    setFollowUpForm(record)
    setIsEditFollowUpOpen(true)
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportStudentsCSV = () => {
    const headers = [
      "student_id",
      "student_name",
      "parent_name",
      "country",
      "state",
      "grade_year",
      "learning_plan",
      "classes_per_week",
      "start_date",
      "status",
      "break_start_date",
      "break_end_date",
      "reactivated_at",
      "sales_person",
      "telecaller",
      "refer_by",
      "notes",
    ]

    const rows = filteredStudents.map((s) =>
      headers.map((h) => csvEscape((s as any)[h])).join(",")
    )

    const csv = [headers.join(","), ...rows].join("\n")
    downloadCSV(csv, `current_students_${format(new Date(), "yyyy-MM-dd")}.csv`)
  }

  const importStudentsCSV = async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)

    if (lines.length < 2) {
      alert("CSV file is empty")
      return
    }

    const headers = parseCSVLine(lines[0])

    const rows = lines.slice(1).map((line) => {
      const values = parseCSVLine(line)
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      return {
        student_id: row.student_id,
        student_name: row.student_name,
        parent_name: row.parent_name,
        country: row.country || null,
        state: row.state || null,
        grade_year: row.grade_year || null,
        learning_plan: row.learning_plan || null,
        classes_per_week: Number(row.classes_per_week || 0),
        start_date: row.start_date || null,
        status: row.status || "active",
        break_start_date: row.break_start_date || null,
        break_end_date: row.break_end_date || null,
        reactivated_at: row.reactivated_at || null,
        sales_person: row.sales_person || null,
        telecaller: row.telecaller || null,
        refer_by: row.refer_by || null,
        notes: row.notes || null,
      }
    })

    const { error } = await supabase.from("current_students").insert(rows)

    if (error) alert(error.message)
    else {
      alert("CSV uploaded successfully")
      fetchAllData()
    }
  }

  const exportLeftOutsCSV = () => {
    const headers = ["Student ID", "Name", "Parent", "Start Date", "Left Date", "Reason", "Time Period", "State"]
    const rows = filteredLeftOuts.map((r) => [
      r.student_id,
      r.student_name,
      r.parent_name || "",
      r.starting_date || "",
      r.leaving_date || "",
      r.reason_for_leaving || "",
      r.time_period || "",
      r.state || "",
    ])

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n")
    downloadCSV(csv, `leftouts_${format(new Date(), "yyyy-MM-dd")}.csv`)
  }

  const exportFollowUpsCSV = () => {
    const headers = ["Student ID", "Name", "Parent", "Follow-up Date", "State", "Tutor", "Reason"]
    const rows = filteredFollowUps.map((r) => [
      r.student_id,
      r.student_name,
      r.parent_name || "",
      r.follow_up_date || "",
      r.state || "",
      r.tutor_name || "",
      r.reason_for_status || "",
    ])

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n")
    downloadCSV(csv, `followups_${format(new Date(), "yyyy-MM-dd")}.csv`)
  }

  const handleAddStudentDialogOpen = async (open: boolean) => {
    if (open) {
      const newId = await generateStudentId()
      setStudentForm({
        student_id: newId,
        status: "active",
        country: "Australia",
        state: "",
        learning_plan: "1x/week",
        classes_per_week: 1,
      })
    } else {
      setStudentForm({})
    }

    setIsAddStudentOpen(open)
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Students Hub</h1>
        <p className="text-muted-foreground">
          Manage current students, follow-ups, breaks, reactivation, and left-out tracking.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current" className="gap-2">
            <Users className="h-4 w-4" />
            Current Students
            <Badge variant="secondary" className="ml-1">{totalStudents}</Badge>
          </TabsTrigger>

          <TabsTrigger value="followup" className="gap-2">
            <Activity className="h-4 w-4" />
            Follow-Ups
            <Badge variant="secondary" className="ml-1">{totalFollowUps}</Badge>
          </TabsTrigger>

          <TabsTrigger value="leftout" className="gap-2">
            <UserMinus className="h-4 w-4" />
            Left-Out
            <Badge variant="secondary" className="ml-1">{totalLeftOut}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div />

            <div className="flex flex-wrap gap-2">
              <input
                ref={uploadRef}
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) importStudentsCSV(file)
                  e.currentTarget.value = ""
                }}
              />

              <Button variant="outline" size="sm" onClick={() => setShowStudentAnalytics(!showStudentAnalytics)}>
                <TrendingUp className="mr-2 h-4 w-4" />
                {showStudentAnalytics ? "Hide" : "Show"} Analytics
              </Button>

              <Button variant="outline" size="sm" onClick={() => uploadRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>

              <Button variant="outline" size="sm" onClick={exportStudentsCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>

              <Dialog open={isAddStudentOpen} onOpenChange={handleAddStudentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[calc(100vw-1rem)] !max-w-[1152px] max-h-[92vh] overflow-hidden border-0 bg-[#111717] p-0 text-white shadow-2xl sm:w-[calc(100vw-2rem)]">
                  <StudentForm
                    title="Add New Student"
                    subtitle="Add one student record. The dashboard will automatically calculate active students, class load, follow-ups and reactivation."
                    submitLabel="Save Student"
                    formData={studentForm}
                    setFormData={setStudentForm}
                    onSubmit={handleAddStudent}
                    onCancel={() => setIsAddStudentOpen(false)}
                    readonlyId
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {showStudentAnalytics && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalStudents}</div>
                    <p className="text-xs text-muted-foreground">Current active + reactivated</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Classes/Week</CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{totalClassesPerWeek}</div>
                    <p className="text-xs text-muted-foreground">Total weekly sessions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                    <Calendar className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{newThisMonth}</div>
                    <p className="text-xs text-muted-foreground">Enrolled in {format(new Date(), "MMMM")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On Break</CardTitle>
                    <PauseCircle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{onBreakStudents}</div>
                    <p className="text-xs text-muted-foreground">Moved to follow-up</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reactivated</CardTitle>
                    <Repeat className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{reactivatedThisMonth}</div>
                    <p className="text-xs text-muted-foreground">Back from follow-up</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Classes/Student</CardTitle>
                    <GraduationCap className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {(totalClassesPerWeek / (totalStudents || 1)).toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">Per week</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Students by Grade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gradeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name || "Unknown"} (${((percent || 0) * 100).toFixed(0)}%)`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {gradeData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS_CURRENT[index % COLORS_CURRENT.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Enrollments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyEnrollments()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#0088FE" name="New Students" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or parent..."
                className="pl-9"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>

            <Select value={studentGradeFilter} onValueChange={setStudentGradeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={studentStatusFilter} onValueChange={setStudentStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_break">On Break</SelectItem>
                <SelectItem value="reactivated">Reactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Learning Plan</TableHead>
                  <TableHead>Classes/Week</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">{student.student_id}</TableCell>
                      <TableCell className="font-medium">{student.student_name}</TableCell>
                      <TableCell>{student.parent_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.grade_year || "-"}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{student.learning_plan}</TableCell>
                      <TableCell>{student.classes_per_week}</TableCell>
                      <TableCell>{currentStudentStatusBadge(student.status)}</TableCell>
                      <TableCell>
                        {student.start_date ? format(new Date(student.start_date), "dd-MMM-yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => markOnBreak(student)}>
                              <PauseCircle className="mr-2 h-4 w-4" />
                              Mark On Break
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => reactivateStudent(student)}>
                              <Repeat className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => moveToFollowUp(student)}>
                              <Activity className="mr-2 h-4 w-4" />
                              Move to Follow-Up / On Break
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => moveToLeftOut(student)}>
                              <UserMinus className="mr-2 h-4 w-4" />
                              Move to Left-Out
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => openEditStudent(student)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteStudent(student.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
            <DialogContent className="w-[calc(100vw-1rem)] !max-w-[1152px] max-h-[92vh] overflow-hidden border-0 bg-[#111717] p-0 text-white shadow-2xl sm:w-[calc(100vw-2rem)]">
              <StudentForm
                title="Edit Student"
                subtitle="Update the student record. Active students, weekly class load, follow-ups and reactivation data stay connected."
                submitLabel="Update Student"
                formData={studentForm}
                setFormData={setStudentForm}
                onSubmit={handleUpdateStudent}
                onCancel={() => setIsEditStudentOpen(false)}
                readonlyId
              />
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="followup" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFollowUpAnalytics(!showFollowUpAnalytics)}>
                <TrendingUp className="mr-2 h-4 w-4" />
                {showFollowUpAnalytics ? "Hide" : "Show"} Analytics
              </Button>

              <Button variant="outline" size="sm" onClick={exportFollowUpsCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>

              <Dialog
                open={isAddFollowUpOpen}
                onOpenChange={(open) => {
                  if (!open) setFollowUpForm({})
                  setIsAddFollowUpOpen(open)
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Follow-Up
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Follow-Up Record</DialogTitle>
                  </DialogHeader>

                  <FollowUpForm
                    formData={followUpForm}
                    setFormData={setFollowUpForm}
                    onSubmit={handleAddFollowUp}
                    onFetchStudent={fetchStudentForFollowUp}
                    fetchingStudent={fetchingFollowUpStudent}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {showFollowUpAnalytics && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Follow-Ups</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalFollowUps}</div>
                    <p className="text-xs text-muted-foreground">On-break students to contact</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Due Today</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{dueTodayFollowUps}</div>
                    <p className="text-xs text-muted-foreground">Text/call parents today</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                    <Calendar className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{upcomingFollowUps}</div>
                    <p className="text-xs text-muted-foreground">Scheduled later</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{overdueFollowUps}</div>
                    <p className="text-xs text-muted-foreground">Past due date</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Follow-Ups by State</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={followUpStateData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#f59e0b"
                            dataKey="value"
                          >
                            {followUpStateData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS_FOLLOWUP[index % COLORS_FOLLOWUP.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Follow-Ups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyFollowUps()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f59e0b" name="Follow-Ups" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or parent..."
                className="pl-9"
                value={followUpSearch}
                onChange={(e) => setFollowUpSearch(e.target.value)}
              />
            </div>

            <Select value={followUpStateFilter} onValueChange={setFollowUpStateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {followUpStates.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={followUpStatusFilter} onValueChange={setFollowUpStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Follow-up status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Follow-Ups</SelectItem>
                <SelectItem value="today">Due Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="no_date">No Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Follow-Up Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredFollowUps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No follow-up records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFollowUps.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-sm">{record.student_id}</TableCell>
                      <TableCell className="font-medium">{record.student_name}</TableCell>
                      <TableCell>{record.parent_name}</TableCell>
                      <TableCell>
                        {record.follow_up_date ? (
                          <Badge variant="outline">
                            {format(new Date(record.follow_up_date), "dd-MMM-yyyy")}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>{followUpStatusBadge(record)}</TableCell>
                      <TableCell>{record.state || "-"}</TableCell>
                      <TableCell>{record.tutor_name || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{record.reason_for_status || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => reactivateFromFollowUp(record)}>
                              <Repeat className="mr-2 h-4 w-4" />
                              Reactivate to Current
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => moveFollowUpToLeftOut(record)}>
                              <UserMinus className="mr-2 h-4 w-4" />
                              Move to Left-Out
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => openEditFollowUp(record)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteFollowUp(record.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Dialog
            open={isEditFollowUpOpen}
            onOpenChange={(open) => {
              if (!open) {
                setEditingFollowUp(null)
                setFollowUpForm({})
              }
              setIsEditFollowUpOpen(open)
            }}
          >
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Follow-Up</DialogTitle>
              </DialogHeader>

              <FollowUpForm
                formData={followUpForm}
                setFormData={setFollowUpForm}
                onSubmit={handleUpdateFollowUp}
                onFetchStudent={fetchStudentForFollowUp}
                fetchingStudent={fetchingFollowUpStudent}
                isEdit
              />
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="leftout" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLeftOutAnalytics(!showLeftOutAnalytics)}>
                <TrendingUp className="mr-2 h-4 w-4" />
                {showLeftOutAnalytics ? "Hide" : "Show"} Analytics
              </Button>

              <Button variant="outline" size="sm" onClick={exportLeftOutsCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>

              <Dialog
                open={isAddLeftOutOpen}
                onOpenChange={(open) => {
                  if (!open) setLeftOutForm({})
                  setIsAddLeftOutOpen(open)
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Left-Out
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Left-Out Record</DialogTitle>
                  </DialogHeader>

                  <LeftOutForm
                    formData={leftOutForm}
                    setFormData={setLeftOutForm}
                    onSubmit={handleAddLeftOut}
                    onFetchStudent={fetchStudentForLeftOut}
                    fetchingStudent={fetchingLeftOutStudent}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {showLeftOutAnalytics && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Left-Out</CardTitle>
                    <UserMinus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalLeftOut}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Left This Month</CardTitle>
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{leftThisMonth}</div>
                    <p className="text-xs text-muted-foreground">In {format(new Date(), "MMMM")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{avgDuration().toFixed(0)} days</div>
                    <p className="text-xs text-muted-foreground">Start to leave</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique States</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{leftOutStates.length}</div>
                    <p className="text-xs text-muted-foreground">Represented</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Reasons for Leaving</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reasonData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${(name || "Unknown").substring(0, 15)} (${((percent || 0) * 100).toFixed(0)}%)`
                            }
                            outerRadius={80}
                            fill="#ef4444"
                            dataKey="value"
                          >
                            {reasonData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS_LEFTOUT[index % COLORS_LEFTOUT.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Left-Outs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyLeftOuts()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ef4444" name="Left-Outs" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or parent..."
                className="pl-9"
                value={leftOutSearch}
                onChange={(e) => setLeftOutSearch(e.target.value)}
              />
            </div>

            <Select value={leftOutStateFilter} onValueChange={setLeftOutStateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {leftOutStates.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Left Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Time Period</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredLeftOuts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No left-out records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeftOuts.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-sm">{record.student_id}</TableCell>
                      <TableCell className="font-medium">{record.student_name}</TableCell>
                      <TableCell>{record.parent_name}</TableCell>
                      <TableCell>
                        {record.starting_date ? format(new Date(record.starting_date), "dd-MMM-yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        {record.leaving_date ? (
                          <Badge variant="destructive">
                            {format(new Date(record.leaving_date), "dd-MMM-yyyy")}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{record.reason_for_leaving || "-"}</TableCell>
                      <TableCell>{record.time_period || "-"}</TableCell>
                      <TableCell>{record.state || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditLeftOut(record)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteLeftOut(record.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Dialog
            open={isEditLeftOutOpen}
            onOpenChange={(open) => {
              if (!open) {
                setEditingLeftOut(null)
                setLeftOutForm({})
              }
              setIsEditLeftOutOpen(open)
            }}
          >
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Left-Out Record</DialogTitle>
              </DialogHeader>

              <LeftOutForm
                formData={leftOutForm}
                setFormData={setLeftOutForm}
                onSubmit={handleUpdateLeftOut}
                onFetchStudent={fetchStudentForLeftOut}
                fetchingStudent={fetchingLeftOutStudent}
                isEdit
              />
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StudentForm({
  formData,
  setFormData,
  onSubmit,
  readonlyId = false,
  title = "Add New Student",
  subtitle = "Add one student record. The dashboard will automatically calculate active students, class load, follow-ups and reactivation.",
  submitLabel = "Save Student",
  onCancel,
}: {
  formData: Partial<CurrentStudent>
  setFormData: (data: Partial<CurrentStudent>) => void
  onSubmit: () => void
  readonlyId?: boolean
  title?: string
  subtitle?: string
  submitLabel?: string
  onCancel?: () => void
}) {
  const countryOptions = useMemo(() => getCountryOptions(), [])
  const stateOptions = useMemo(() => getStateOptions(formData.country), [formData.country])

  const selectedCountry = countryOptions.find(
    (country) =>
      country.value.toLowerCase() === String(formData.country || "").toLowerCase() ||
      country.label.toLowerCase() === String(formData.country || "").toLowerCase()
  )

  const selectedState = stateOptions.find((state) => state.value === formData.state)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === "number") {
      setFormData({ ...formData, [name]: value ? parseInt(value) : null })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const inputClass =
    "h-10 border-[#303a3a] bg-[#060909] text-white placeholder:text-slate-500 focus-visible:ring-violet-500/35"
  const selectTriggerClass =
    "h-10 border-[#303a3a] bg-[#060909] text-white focus:ring-violet-500/35"
  const labelClass = "mb-2 block text-xs font-medium text-slate-400"
  const panelClass = "rounded-xl border border-[#2b3434] bg-[#151b1b] p-4 shadow-sm"
  const previewCardClass = "rounded-lg bg-[#0f1222] p-3"

  const statusLabel: Record<string, string> = {
    active: "Active",
    on_break: "On Break",
    reactivated: "Reactivated",
    left_out: "Left Out",
  }

  const locationText =
    [selectedState?.label || formData.state, selectedCountry?.label || getCountryLabel(formData.country)]
      .filter(Boolean)
      .join(", ") || "—"

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="w-full min-w-0 overflow-hidden rounded-xl bg-[#111717] text-white"
    >
      <div className="bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-600 px-5 py-4 pr-12">
        <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
          <Plus className="h-5 w-5" />
          {title}
        </DialogTitle>
        <p className="mt-1 text-sm text-white/90">{subtitle}</p>
      </div>

      <div className="max-h-[calc(92vh-135px)] overflow-x-hidden overflow-y-auto p-5">
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="min-w-0 space-y-5">
            <section className={panelClass}>
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-white">Student Details</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="student_id" className={labelClass}>
                    Student ID *
                  </Label>
                  <Input
                    id="student_id"
                    name="student_id"
                    value={formData.student_id || ""}
                    onChange={handleChange}
                    placeholder="e.g., AU-0001-AZA"
                    readOnly={readonlyId}
                    className={`${inputClass} ${readonlyId ? "cursor-not-allowed opacity-75" : ""}`}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="student_name" className={labelClass}>
                    Student Name *
                  </Label>
                  <Input
                    id="student_name"
                    name="student_name"
                    value={formData.student_name || ""}
                    onChange={handleChange}
                    placeholder="Student full name"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="parent_name" className={labelClass}>
                    Parent Name *
                  </Label>
                  <Input
                    id="parent_name"
                    name="parent_name"
                    value={formData.parent_name || ""}
                    onChange={handleChange}
                    placeholder="Parent / guardian name"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="start_date" className={labelClass}>
                    Start Date
                  </Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date || ""}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label htmlFor="country" className={labelClass}>
                    Country
                  </Label>
                  <ReactSelect
                    inputId="country"
                    instanceId="country-select"
                    options={countryOptions}
                    value={selectedCountry || null}
                    placeholder="Search and select country..."
                    isSearchable
                    classNames={reactSelectClassNames}
                    unstyled
                    onChange={(selected) =>
                      setFormData({
                        ...formData,
                        country: selected?.label || "",
                        state: "",
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="state" className={labelClass}>
                    State
                  </Label>
                  <ReactSelect
                    inputId="state"
                    instanceId="state-select"
                    options={stateOptions}
                    value={selectedState || null}
                    placeholder={formData.country ? "Search and select state..." : "Select country first"}
                    isSearchable
                    isDisabled={!formData.country || stateOptions.length === 0}
                    classNames={reactSelectClassNames}
                    unstyled
                    onChange={(selected) =>
                      setFormData({
                        ...formData,
                        state: selected?.value || "",
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="grade_year" className={labelClass}>
                    Grade Year
                  </Label>
                  <Input
                    id="grade_year"
                    name="grade_year"
                    value={formData.grade_year || ""}
                    onChange={handleChange}
                    placeholder="e.g., Grade 7 / Year 8"
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label className={labelClass}>Status</Label>
                  <Select
                    value={formData.status || "active"}
                    onValueChange={(value) => setFormData({ ...formData, status: value as StudentStatus })}
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_break">On Break</SelectItem>
                      <SelectItem value="reactivated">Reactivated</SelectItem>
                      <SelectItem value="left_out">Left Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className={panelClass}>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-white">Learning Plan & Staff Assignment</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className={labelClass}>Learning Plan / Package</Label>
                  <Select
                    value={formData.learning_plan || ""}
                    onValueChange={(value) => setFormData({ ...formData, learning_plan: value })}
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select learning plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEARNING_PLAN_OPTIONS.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {plan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={labelClass}>Classes Per Week</Label>
                  <Select
                    value={formData.classes_per_week ? String(formData.classes_per_week) : ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, classes_per_week: Number(value) })
                    }
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select classes per week" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES_PER_WEEK_OPTIONS.map((count) => (
                        <SelectItem key={count} value={String(count)}>
                          {count}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sales_person" className={labelClass}>
                    Sales Person
                  </Label>
                  <Input
                    id="sales_person"
                    name="sales_person"
                    value={formData.sales_person || ""}
                    onChange={handleChange}
                    placeholder="Sales person name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label htmlFor="telecaller" className={labelClass}>
                    Telecaller
                  </Label>
                  <Input
                    id="telecaller"
                    name="telecaller"
                    value={formData.telecaller || ""}
                    onChange={handleChange}
                    placeholder="Telecaller name"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="refer_by" className={labelClass}>
                    Refer By
                  </Label>
                  <Input
                    id="refer_by"
                    name="refer_by"
                    value={formData.refer_by || ""}
                    onChange={handleChange}
                    placeholder="Referral source / person"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className={panelClass}>
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-white">Break, Reactivation & Notes</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="break_start_date" className={labelClass}>
                    Break Start Date
                  </Label>
                  <Input
                    id="break_start_date"
                    name="break_start_date"
                    type="date"
                    value={formData.break_start_date || ""}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label htmlFor="break_end_date" className={labelClass}>
                    Break End Date
                  </Label>
                  <Input
                    id="break_end_date"
                    name="break_end_date"
                    type="date"
                    value={formData.break_end_date || ""}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label htmlFor="reactivated_at" className={labelClass}>
                    Reactivated Date
                  </Label>
                  <Input
                    id="reactivated_at"
                    name="reactivated_at"
                    type="date"
                    value={formData.reactivated_at || ""}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-3">
                  <Label htmlFor="notes" className={labelClass}>
                    Notes
                  </Label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Break reason, parent request, reactivation note, leaving note, etc."
                    className="min-h-20 w-full rounded-md border border-[#303a3a] bg-[#060909] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-4">
            <section className="rounded-xl border border-[#26304a] bg-[#151827] p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-white">Student Preview</h3>
              </div>

              <div className="space-y-3">
                <div className={previewCardClass}>
                  <p className="text-xs text-slate-400">Student</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {formData.student_name || "New student"}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {formData.student_id || "—"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className={previewCardClass}>
                    <p className="text-xs text-slate-400">Parent</p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      {formData.parent_name || "—"}
                    </p>
                  </div>

                  <div className={previewCardClass}>
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {statusLabel[formData.status || "active"] || "Active"}
                    </p>
                  </div>

                  <div className={previewCardClass}>
                    <p className="text-xs text-slate-400">Grade</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formData.grade_year || "—"}
                    </p>
                  </div>

                  <div className={previewCardClass}>
                    <p className="text-xs text-slate-400">Classes</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formData.classes_per_week || 0}/week
                    </p>
                  </div>
                </div>

                <div className={previewCardClass}>
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="mt-1 text-sm font-semibold text-white">{locationText}</p>
                </div>

                <div className={previewCardClass}>
                  <p className="text-xs text-slate-400">Learning Plan</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {formData.learning_plan || "—"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#2b3434] bg-[#151b1b] p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-white">Why this helps student operations</h3>

              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <div className="flex gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                  <p>Active student count stays clear for daily operations.</p>
                </div>

                <div className="flex gap-3">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                  <p>Classes per week are calculated for workload planning.</p>
                </div>

                <div className="flex gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                  <p>Start, break and reactivation dates remain trackable.</p>
                </div>

                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                  <p>Follow-up and left-out records stay easier to manage.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#253030] bg-[#111717]/95 px-5 py-4 backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-[#3b4545] bg-[#1b2222] text-white hover:bg-[#242d2d] hover:text-white"
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-700 text-white hover:bg-blue-600">
          <Plus className="mr-2 h-4 w-4" />
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function LeftOutForm({
  formData,
  setFormData,
  onSubmit,
  onFetchStudent,
  fetchingStudent,
  isEdit = false,
}: {
  formData: Partial<LeftOut>
  setFormData: (data: Partial<LeftOut>) => void
  onSubmit: () => void
  onFetchStudent: (id: string) => void
  fetchingStudent: boolean
  isEdit?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lo_student_id">Student ID *</Label>
          <div className="relative">
            <Input
              id="lo_student_id"
              name="student_id"
              value={formData.student_id || ""}
              onChange={handleChange}
              onBlur={() => {
                if (formData.student_id && !isEdit) onFetchStudent(formData.student_id)
              }}
              required
              placeholder="Enter ID to auto-fill"
            />
            {fetchingStudent && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter Student ID to auto-fill from Current Students
          </p>
        </div>

        <div>
          <Label htmlFor="lo_student_name">Student Name *</Label>
          <Input
            id="lo_student_name"
            name="student_name"
            value={formData.student_name || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="lo_parent_name">Parent Name</Label>
          <Input
            id="lo_parent_name"
            name="parent_name"
            value={formData.parent_name || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="lo_starting_date">Starting Date</Label>
          <Input
            id="lo_starting_date"
            name="starting_date"
            type="date"
            value={formData.starting_date || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="lo_leaving_date">Leaving Date</Label>
          <Input
            id="lo_leaving_date"
            name="leaving_date"
            type="date"
            value={formData.leaving_date || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="lo_time_period">Time Period</Label>
          <Input
            id="lo_time_period"
            name="time_period"
            value={formData.time_period || ""}
            onChange={handleChange}
            placeholder="e.g., 3 months"
          />
        </div>

        <div>
          <Label htmlFor="lo_state">State</Label>
          <Input
            id="lo_state"
            name="state"
            value={formData.state || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="lo_learning_plan">Learning Plan</Label>
          <Input
            id="lo_learning_plan"
            name="learning_plan"
            value={formData.learning_plan || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="lo_reason_for_leaving">Reason for Leaving</Label>
          <textarea
            id="lo_reason_for_leaving"
            name="reason_for_leaving"
            value={formData.reason_for_leaving || ""}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSubmit}>Save</Button>
      </div>
    </div>
  )
}

function FollowUpForm({
  formData,
  setFormData,
  onSubmit,
  onFetchStudent,
  fetchingStudent,
  isEdit = false,
}: {
  formData: Partial<FollowUp>
  setFormData: (data: Partial<FollowUp>) => void
  onSubmit: () => void
  onFetchStudent: (id: string) => void
  fetchingStudent: boolean
  isEdit?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fu_student_id">Student ID *</Label>
          <div className="relative">
            <Input
              id="fu_student_id"
              name="student_id"
              value={formData.student_id || ""}
              onChange={handleChange}
              onBlur={() => {
                if (formData.student_id && !isEdit) onFetchStudent(formData.student_id)
              }}
              required
              placeholder="Enter ID to auto-fill"
            />
            {fetchingStudent && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter Student ID to auto-fill from Current Students
          </p>
        </div>

        <div>
          <Label htmlFor="fu_student_name">Student Name *</Label>
          <Input
            id="fu_student_name"
            name="student_name"
            value={formData.student_name || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="fu_parent_name">Parent Name</Label>
          <Input
            id="fu_parent_name"
            name="parent_name"
            value={formData.parent_name || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="fu_follow_up_date">Follow-Up Date</Label>
          <Input
            id="fu_follow_up_date"
            name="follow_up_date"
            type="date"
            value={formData.follow_up_date || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="fu_state">State</Label>
          <Input
            id="fu_state"
            name="state"
            value={formData.state || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="fu_tutor_name">Tutor Name</Label>
          <Input
            id="fu_tutor_name"
            name="tutor_name"
            value={formData.tutor_name || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="fu_learning_plan">Learning Plan</Label>
          <Input
            id="fu_learning_plan"
            name="learning_plan"
            value={formData.learning_plan || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="fu_reason_for_status">Reason for Status</Label>
          <textarea
            id="fu_reason_for_status"
            name="reason_for_status"
            value={formData.reason_for_status || ""}
            onChange={handleChange}
            rows={3}
            placeholder="Example: Student is on break. Contact parent again on follow-up date."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <Label htmlFor="fu_leaving_date">Leaving Date</Label>
          <Input
            id="fu_leaving_date"
            name="leaving_date"
            type="date"
            value={formData.leaving_date || ""}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSubmit}>Save</Button>
      </div>
    </div>
  )
}
