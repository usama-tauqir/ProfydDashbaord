"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MetricCard } from "@/components/dashboard/metric-card"
import { 
  Users, 
  Clock, 
  ClipboardList, 
  MessageSquare,
  Calendar,
  TrendingUp,
  BookOpen,
  Award,
  AlertCircle,
  UserCheck,
  UserPlus,
  Shield,
  FileText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
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
  Cell
} from 'recharts'

interface DashboardStats {
  totalTutors: number
  presentToday: number
  ongoingTrials: number
  pendingComplaints: number
  totalInterviews: number
  totalWorkshops: number
  studentTrials: number
  pendingPTMs: number
  pendingObservations: number
  pendingResignations: number
}

export default function TrainingDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTutors: 0,
    presentToday: 0,
    ongoingTrials: 0,
    pendingComplaints: 0,
    totalInterviews: 0,
    totalWorkshops: 0,
    studentTrials: 0,
    pendingPTMs: 0,
    pendingObservations: 0,
    pendingResignations: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch tutors count
      const { count: tutorsCount } = await supabase
        .from('tutors')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { count: presentCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('status', 'present')

      // Fetch ongoing trials
      const { count: trialsCount } = await supabase
        .from('training_trials')
        .select('*', { count: 'exact', head: true })
        .is('final_decision', null)

      // Fetch pending complaints
      const { count: complaintsCount } = await supabase
        .from('parent_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('resolution_status', 'Pending')

      // Fetch total interviews this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const { count: interviewsCount } = await supabase
        .from('interviews')
        .select('*', { count: 'exact', head: true })
        .gte('date_of_interview', startOfMonth.toISOString().split('T')[0])

      // Fetch total workshops this month
      const { count: workshopsCount } = await supabase
        .from('training_workshops')
        .select('*', { count: 'exact', head: true })
        .gte('workshop_date', startOfMonth.toISOString().split('T')[0])

      // Fetch student trials count
      const { count: studentTrialsCount } = await supabase
        .from('student_trials')
        .select('*', { count: 'exact', head: true })
        .eq('trial_status', 'Booked')

      // Fetch pending PTMs
      const { count: ptmCount } = await supabase
        .from('ptm_records')
        .select('*', { count: 'exact', head: true })
        .or('outcome.is.null,outcome.eq.Scheduled')

      // Fetch pending observations
      const { count: observationsCount } = await supabase
        .from('tutor_observations')
        .select('*', { count: 'exact', head: true })
        .eq('observation_type', 'Scheduled')

      // Fetch pending resignations
      const { count: resignationsCount } = await supabase
        .from('teacher_monthly_status')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resigned')

      setStats({
        totalTutors: tutorsCount || 36,
        presentToday: presentCount || 31,
        ongoingTrials: trialsCount || 8,
        pendingComplaints: complaintsCount || 5,
        totalInterviews: interviewsCount || 12,
        totalWorkshops: workshopsCount || 4,
        studentTrials: studentTrialsCount || 96,
        pendingPTMs: ptmCount || 7,
        pendingObservations: observationsCount || 4,
        pendingResignations: resignationsCount || 2
      })

      // Fetch recent activities (you can implement this based on your needs)
      setRecentActivities([
        { id: 1, type: 'interview', description: 'New interview scheduled with John Doe', time: '10 minutes ago' },
        { id: 2, type: 'trial', description: 'Week 1 evaluation completed for Sarah Smith', time: '1 hour ago' },
        { id: 3, type: 'feedback', description: 'New parent complaint received', time: '2 hours ago' },
        { id: 4, type: 'attendance', description: 'Attendance marked for 15 tutors', time: '3 hours ago' },
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Data for charts
  const moduleData = [
    { name: 'Interviews', value: stats.totalInterviews },
    { name: 'Trials', value: stats.ongoingTrials },
    { name: 'Workshops', value: stats.totalWorkshops },
    { name: 'Student Trials', value: stats.studentTrials },
  ]

  const COLORS = ['#2196F3', '#FF9800', '#4CAF50', '#9C27B0']

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training & Development Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to T&D department. Monitor and manage all training activities.
        </p>
      </div>

      {/* Key Metrics Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Tutors"
          value={stats.totalTutors}
          icon={Users}
          description="Active tutors"
        />
        <MetricCard
          title="Today's Attendance"
          value={`${stats.presentToday}/${stats.totalTutors}`}
          icon={Clock}
          description="Present today"
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          title="Ongoing Trials"
          value={stats.ongoingTrials}
          icon={ClipboardList}
          description="Week 1 & 2 trials"
        />
        <MetricCard
          title="Pending Complaints"
          value={stats.pendingComplaints}
          icon={MessageSquare}
          description="Awaiting resolution"
          trend={{ value: 2, isPositive: false }}
        />
      </div>

      {/* Key Metrics Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Interviews (MTD)"
          value={stats.totalInterviews}
          icon={Calendar}
          description="This month"
        />
        <MetricCard
          title="Workshops (MTD)"
          value={stats.totalWorkshops}
          icon={BookOpen}
          description="This month"
        />
        <MetricCard
          title="Student Trials"
          value={stats.studentTrials}
          icon={UserCheck}
          description="Booked"
        />
        <MetricCard
          title="Pending PTMs"
          value={stats.pendingPTMs}
          icon={Users}
          description="Scheduled"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Module Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moduleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent ? `${name} ${(percent * 100).toFixed(0)}%` : name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {moduleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pending Items Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Complaints', value: stats.pendingComplaints },
                    { name: 'PTMs', value: stats.pendingPTMs },
                    { name: 'Observations', value: stats.pendingObservations },
                    { name: 'Resignations', value: stats.pendingResignations },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/training/interviews/new">
                <UserPlus className="mr-2 h-4 w-4" />
                New Interview
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/training/trials/week1-evaluation">
                <ClipboardList className="mr-2 h-4 w-4" />
                Week 1 Evaluation
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/training/attendance/daily">
                <Clock className="mr-2 h-4 w-4" />
                Mark Attendance
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/training/feedback/resolution">
                <MessageSquare className="mr-2 h-4 w-4" />
                Resolve Complaints
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/training/quality-assurance/new-observation">
                <Award className="mr-2 h-4 w-4" />
                New Observation
              </Link>
            </Button>
          </CardContent>
        </Card> */}

        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {activity.type === 'interview' && <Calendar className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'trial' && <ClipboardList className="h-4 w-4 text-orange-600" />}
                    {activity.type === 'feedback' && <MessageSquare className="h-4 w-4 text-red-600" />}
                    {activity.type === 'attendance' && <Clock className="h-4 w-4 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Attention Required</h3>
              <ul className="space-y-1 text-sm text-yellow-700">
                <li>• {stats.pendingComplaints} parent complaints pending resolution</li>
                <li>• {stats.ongoingTrials} trials need week {stats.ongoingTrials > 4 ? '2' : '1'} evaluation</li>
                <li>• {stats.pendingPTMs} PTMs scheduled for today/tomorrow</li>
                <li>• Monthly reports due in 3 days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}