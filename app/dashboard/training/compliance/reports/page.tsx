"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  FileText,
  Download,
  Calendar,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Printer,
  Mail,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import {
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ComplianceRecord {
  id: string
  month: string
  teacher_name: string
  policy_violations_identified: number
  violation_type: string
  written_warning_issued: boolean
  compliance_confirmation_signed: boolean
}

export default function ComplianceReportsPage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [reportType, setReportType] = useState("quarterly")

  const COLORS = {
    violations: '#F44336',
    warnings: '#FFC107',
    compliant: '#4CAF50',
    pending: '#9C27B0'
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_compliance')
        .select('*')
        .order('month', { ascending: true })

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('Error fetching compliance data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter records by date range
  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.month + '-01')
    const fromDate = new Date(dateRange.from)
    const toDate = new Date(dateRange.to)
    return recordDate >= fromDate && recordDate <= toDate
  })

  // Calculate statistics
  const totalAudits = filteredRecords.length
  const totalViolations = filteredRecords.reduce((acc, r) => acc + (r.policy_violations_identified || 0), 0)
  const warningsIssued = filteredRecords.filter(r => r.written_warning_issued).length
  const complianceSigned = filteredRecords.filter(r => r.compliance_confirmation_signed).length
  const complianceRate = totalAudits ? (complianceSigned / totalAudits) * 100 : 0

  // Monthly trend data
  const monthlyData = filteredRecords.reduce((acc: any, record) => {
    const month = record.month
    if (!acc[month]) {
      acc[month] = { month, audits: 0, violations: 0, warnings: 0, compliance: 0 }
    }
    acc[month].audits++
    acc[month].violations += record.policy_violations_identified || 0
    if (record.written_warning_issued) acc[month].warnings++
    if (record.compliance_confirmation_signed) acc[month].compliance++
    return acc
  }, {})

  const monthlyChartData = Object.values(monthlyData)

  // Violation types distribution
  const violationTypes = filteredRecords.reduce((acc: any, record) => {
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

  // Teacher performance
  const teacherStats = filteredRecords.reduce((acc: any, record) => {
    if (!acc[record.teacher_name]) {
      acc[record.teacher_name] = {
        name: record.teacher_name,
        audits: 0,
        violations: 0,
        warnings: 0,
        compliant: 0
      }
    }
    acc[record.teacher_name].audits++
    acc[record.teacher_name].violations += record.policy_violations_identified || 0
    if (record.written_warning_issued) acc[record.teacher_name].warnings++
    if (record.compliance_confirmation_signed) acc[record.teacher_name].compliant++
    return acc
  }, {})

  const teacherChartData = Object.values(teacherStats)
    .sort((a: any, b: any) => b.violations - a.violations)
    .slice(0, 5)

  const handleExportPDF = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const headers = ['Month', 'Teacher', 'Violations', 'Violation Type', 'Warning Issued', 'Compliance Signed']
    const csvData = filteredRecords.map(r => [
      r.month,
      r.teacher_name,
      r.policy_violations_identified,
      r.violation_type,
      r.written_warning_issued ? 'Yes' : 'No',
      r.compliance_confirmation_signed ? 'Yes' : 'No'
    ])
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compliance_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Training & Development", href: "/dashboard/training" },
    { label: "Compliance", href: "/dashboard/training/compliance" },
    { label: "Reports" }
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
              <h1 className="text-3xl font-bold tracking-tight">Compliance Reports</h1>
              <p className="text-muted-foreground">
                Generate and analyze compliance reports
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Email Report
            </Button>
          </div>
        </div>

        {/* Report Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Report Parameters</CardTitle>
            <CardDescription>
              Customize your report by selecting date range and report type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="quarterly">Quarterly Report</SelectItem>
                    <SelectItem value="yearly">Annual Report</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAudits}</div>
            </CardContent>
          </Card>
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
              <CardTitle className="text-sm font-medium">Warnings Issued</CardTitle>
              <FileText className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{warningsIssued}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{complianceRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="teachers">Teacher Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Monthly Compliance Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Compliance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="audits" stroke="#8884d8" name="Audits" />
                        <Line type="monotone" dataKey="violations" stroke="#F44336" name="Violations" />
                        <Line type="monotone" dataKey="warnings" stroke="#FFC107" name="Warnings" />
                      </ReLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Violation Types Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Violations by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
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
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Metrics Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="violations" fill="#F44336" name="Violations" />
                      <Bar yAxisId="right" dataKey="compliance" fill="#4CAF50" name="Compliance" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Teachers by Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={teacherChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="violations" fill="#F44336" name="Violations" />
                      <Bar dataKey="warnings" fill="#FFC107" name="Warnings" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Compliance Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Month</th>
                    <th className="text-left p-4">Total Audits</th>
                    <th className="text-left p-4">Violations</th>
                    <th className="text-left p-4">Warnings</th>
                    <th className="text-left p-4">Compliance Rate</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyChartData.map((data: any, index) => {
                    const rate = (data.compliance / data.audits) * 100
                    return (
                      <tr key={index} className="border-b">
                        <td className="p-4 font-medium">
                          {new Date(data.month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="p-4">{data.audits}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-red-50">
                            {data.violations}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-yellow-50">
                            {data.warnings}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className={rate >= 80 ? 'text-green-600 font-bold' : 'text-yellow-600'}>
                            {rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-4">
                          {rate >= 80 ? (
                            <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                          ) : rate >= 60 ? (
                            <Badge className="bg-yellow-100 text-yellow-800">At Risk</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Critical</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Report Footer */}
        <div className="text-sm text-muted-foreground text-center">
          <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          <p>Period: {new Date(dateRange.from).toLocaleDateString()} to {new Date(dateRange.to).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}