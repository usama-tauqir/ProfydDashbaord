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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Shield,
  Plus,
  MoreHorizontal,
  Search,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Eye,
  Edit,
  Trash,
  Users,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
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
  policy_audit_conducted: string
  policy_violations_identified: number
  violation_type: string
  written_warning_issued: boolean
  compliance_confirmation_signed: boolean
  verbal_commitments_recorded: string
  remarks: string
  reviewed_by?: string
  created_at: string
}

export default function CompliancePage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<ComplianceRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAudits: 0,
    totalViolations: 0,
    warningsIssued: 0,
    complianceRate: 0,
    criticalViolations: 0
  })
  const router = useRouter()

  const COLORS = {
    violations: '#F44336',
    warnings: '#FFC107',
    compliant: '#4CAF50',
    pending: '#FF9800'
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  useEffect(() => {
    filterRecords()
  }, [searchTerm, monthFilter, records])

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_compliance')
        .select('*')
        .order('month', { ascending: false })

      if (error) throw error
      setRecords(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error fetching compliance records:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: ComplianceRecord[]) => {
    const totalAudits = data.length
    const totalViolations = data.reduce((acc, r) => acc + (r.policy_violations_identified || 0), 0)
    const warningsIssued = data.filter(r => r.written_warning_issued).length
    const complianceSigned = data.filter(r => r.compliance_confirmation_signed).length
    const complianceRate = totalAudits ? (complianceSigned / totalAudits) * 100 : 0

    setStats({
      totalAudits,
      totalViolations,
      warningsIssued,
      complianceRate,
      criticalViolations: data.filter(r => r.policy_violations_identified > 2).length
    })
  }

  const filterRecords = () => {
    let filtered = records

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.violation_type?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (monthFilter !== 'all') {
      filtered = filtered.filter(record => record.month === monthFilter)
    }

    setFilteredRecords(filtered)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this compliance record?')) {
      try {
        const { error } = await supabase
          .from('policy_compliance')
          .delete()
          .eq('id', id)

        if (error) throw error
        fetchRecords()
      } catch (error) {
        console.error('Error deleting record:', error)
      }
    }
  }

  const getViolationBadge = (count: number) => {
    if (count === 0) return <Badge className="bg-green-100 text-green-800">None</Badge>
    if (count <= 2) return <Badge className="bg-yellow-100 text-yellow-800">{count} Minor</Badge>
    return <Badge className="bg-red-100 text-red-800">{count} Critical</Badge>
  }

  // Get unique months for filter
  const months = [...new Set(records.map(r => r.month))].sort().reverse()

  // Chart data
  const monthlyViolations = records.reduce((acc: any, record) => {
    const month = record.month
    if (!acc[month]) {
      acc[month] = { month, violations: 0, warnings: 0 }
    }
    acc[month].violations += record.policy_violations_identified || 0
    if (record.written_warning_issued) acc[month].warnings++
    return acc
  }, {})

  const monthlyChartData = Object.values(monthlyViolations).sort((a: any, b: any) => 
    a.month.localeCompare(b.month)
  )

  const violationTypes = records.reduce((acc: any, record) => {
    if (record.violation_type) {
      const types = record.violation_type.split(',').map(t => t.trim())
      types.forEach(type => {
        acc[type] = (acc[type] || 0) + 1
      })
    }
    return acc
  }, {})

  const violationTypeData = Object.entries(violationTypes).map(([type, count]) => ({
    type,
    count
  }))

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Training & Development", href: "/dashboard/training" },
    { label: "Policy Compliance" }
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Policy Compliance</h1>
            <p className="text-muted-foreground">
              Track policy audits, violations, and compliance status
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/training/compliance/violations">
                <AlertTriangle className="mr-2 h-4 w-4" />
                View Violations
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/training/compliance/warnings">
                <FileText className="mr-2 h-4 w-4" />
                View Warnings
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/training/compliance/new">
                <Plus className="mr-2 h-4 w-4" />
                New Audit
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAudits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalViolations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings Issued</CardTitle>
              <FileText className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.warningsIssued}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.complianceRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalViolations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Trend */}
          {monthlyChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Violations Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="violations" stroke="#F44336" name="Violations" />
                      <Line type="monotone" dataKey="warnings" stroke="#FFC107" name="Warnings" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Violation Types */}
          {violationTypeData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Violation Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={violationTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent ? (percent * 100).toFixed(0) : 0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="type"
                      >
                        {violationTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.violations} />
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
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {months.map(month => (
                <SelectItem key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchRecords()}>
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Compliance Records Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Teacher Name</TableHead>
                  <TableHead>Audit Date</TableHead>
                  <TableHead>Violations</TableHead>
                  <TableHead>Violation Type</TableHead>
                  <TableHead>Warning Issued</TableHead>
                  <TableHead>Compliance Signed</TableHead>
                  <TableHead>Verbal Commitments</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No compliance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.month + '-01').toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="font-medium">{record.teacher_name}</TableCell>
                      <TableCell>
                        {record.policy_audit_conducted ? 
                          new Date(record.policy_audit_conducted).toLocaleDateString() : 
                          'Not scheduled'}
                      </TableCell>
                      <TableCell>{getViolationBadge(record.policy_violations_identified || 0)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {record.violation_type || '-'}
                      </TableCell>
                      <TableCell>
                        {record.written_warning_issued ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.compliance_confirmation_signed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {record.verbal_commitments_recorded || '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/training/compliance/${record.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/training/compliance/${record.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(record.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
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
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:bg-accent" onClick={() => router.push('/dashboard/training/compliance/violations')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold">View All Violations</h3>
                  <p className="text-sm text-muted-foreground">Track and manage policy violations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent" onClick={() => router.push('/dashboard/training/compliance/warnings')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Issued Warnings</h3>
                  <p className="text-sm text-muted-foreground">Review all written warnings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent" onClick={() => router.push('/dashboard/training/compliance/reports')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Compliance Reports</h3>
                  <p className="text-sm text-muted-foreground">Generate detailed reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}