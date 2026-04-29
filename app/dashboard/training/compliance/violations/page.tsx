"use client"

import { useEffect, useState } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle,
  Search,
  ArrowLeft,
  Download,
  Filter,
  TrendingUp,
  Users,
  Clock
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface ComplianceRecord {
  id: string
  month: string
  teacher_name: string
  policy_violations_identified: number
  violation_type: string
  written_warning_issued: boolean
  remarks: string
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<ComplianceRecord[]>([])
  const [filteredViolations, setFilteredViolations] = useState<ComplianceRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const COLORS = ['#F44336', '#FFC107', '#FF9800', '#E91E63', '#9C27B0']

  useEffect(() => {
    fetchViolations()
  }, [])

  useEffect(() => {
    filterViolations()
  }, [searchTerm, severityFilter, violations])

  const fetchViolations = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_compliance')
        .select('*')
        .gt('policy_violations_identified', 0)
        .order('month', { ascending: false })

      if (error) throw error
      setViolations(data || [])
    } catch (error) {
      console.error('Error fetching violations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterViolations = () => {
    let filtered = violations

    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.violation_type?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (severityFilter !== 'all') {
      if (severityFilter === 'critical') {
        filtered = filtered.filter(v => v.policy_violations_identified > 2)
      } else if (severityFilter === 'minor') {
        filtered = filtered.filter(v => v.policy_violations_identified <= 2)
      }
    }

    setFilteredViolations(filtered)
  }

  const getSeverityBadge = (count: number) => {
    if (count > 2) {
      return <Badge className="bg-red-100 text-red-800">Critical</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Minor</Badge>
  }

  // Statistics
  const totalViolations = violations.reduce((acc, v) => acc + v.policy_violations_identified, 0)
  const criticalViolations = violations.filter(v => v.policy_violations_identified > 2).length
  const teachersWithViolations = new Set(violations.map(v => v.teacher_name)).size

  // Chart data
  const violationsByTeacher = violations.reduce((acc: any, v) => {
    if (!acc[v.teacher_name]) {
      acc[v.teacher_name] = { name: v.teacher_name, count: 0 }
    }
    acc[v.teacher_name].count += v.policy_violations_identified
    return acc
  }, {})

  const teacherChartData = Object.values(violationsByTeacher)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5)

  const violationsByType = violations.reduce((acc: any, v) => {
    if (v.violation_type) {
      acc[v.violation_type] = (acc[v.violation_type] || 0) + 1
    }
    return acc
  }, {})

  const typeChartData = Object.entries(violationsByType).map(([type, count]) => ({
    type,
    count
  }))

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Training & Development", href: "/dashboard/training" },
    { label: "Compliance", href: "/dashboard/training/compliance" },
    { label: "Violations" }
  ]

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/training/compliance">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Policy Violations</h1>
              <p className="text-muted-foreground">
                Track and manage all policy violations
              </p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalViolations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalViolations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers Involved</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachersWithViolations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Violators */}
          {teacherChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Teachers by Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teacherChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#F44336" name="Violations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Violations by Type */}
          {typeChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Violations by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent ? (percent * 100).toFixed(0) : 0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                      >
                        {typeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by teacher or violation type..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Violations</SelectItem>
              <SelectItem value="critical">Critical (3+ violations)</SelectItem>
              <SelectItem value="minor">Minor (1-2 violations)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Violations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Teacher Name</TableHead>
                  <TableHead>Violations</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Violation Type</TableHead>
                  <TableHead>Warning Issued</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredViolations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No violations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredViolations.map((violation) => (
                    <TableRow key={violation.id}>
                      <TableCell>
                        {new Date(violation.month + '-01').toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="font-medium">{violation.teacher_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-red-50">
                          {violation.policy_violations_identified}
                        </Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(violation.policy_violations_identified)}</TableCell>
                      <TableCell>{violation.violation_type || '-'}</TableCell>
                      <TableCell>
                        {violation.written_warning_issued ? 'Yes' : 'No'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {violation.remarks || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}