// app/dashboard/hr/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserCheck,
  UserX,
  Briefcase,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  FileText,
  RefreshCw,
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
  Legend,
} from "recharts";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
type Period = "all" | "today" | "weekly" | "monthly" | "yearly";

interface HeadcountData {
  totalActiveEmployees: number;
  totalActiveTutors: number;
  totalNonTeachingStaff: number;
  morningShift: number;
  nightShift: number;
}

interface PayrollData {
  totalPayroll: number;
  tutorPayroll: number;
  nonTeachingPayroll: number;
  morningShiftPayroll: number;
  nightShiftPayroll: number;
  overtimeExtra: number;
  bonusesIncentives: number;
}

interface PayrollRatios {
  avgPerEmployee: number;
  avgPerTutor: number;
  payrollPercentOfRevenue: number;
}

interface AttendanceData {
  totalWorkingDays: number;
  approvedLeaves: number;
  unplannedAbsences: number;
  lateArrivals: number;
}

interface AttritionData {
  totalExits: number;
  tutorExits: number;
  nonTeachingExits: number;
  attritionRate: number;
  earlyAttritionCount: number;
}

interface ContractComplianceData {
  onProbation: number;
  confirmed: number;
  contractExpiries60Days: number;
  disciplinaryActions: number;
}

interface TrainingData {
  newHiresOnboarded: number;
  trainingSessions: number;
  employeesTrained: number;
  trainingHoursDelivered: number;
}

// ----------------------------------------------------------------------
// Mock data generator (scales with period)
// ----------------------------------------------------------------------
const getMockData = (period: Period) => {
  const factor =
    period === "all" ? 1 :
    period === "yearly" ? 1 :
    period === "monthly" ? 1 / 12 :
    period === "weekly" ? 1 / 52 :
    1 / 365;

  const scale = (val: number) => Math.round(val * factor);

  const headcount: HeadcountData = {
    totalActiveEmployees: 68,
    totalActiveTutors: 45,
    totalNonTeachingStaff: 23,
    morningShift: 35,
    nightShift: 10,
  };

  const payroll: PayrollData = {
    totalPayroll: scale(4200000),
    tutorPayroll: scale(2800000),
    nonTeachingPayroll: scale(1400000),
    morningShiftPayroll: scale(2400000),
    nightShiftPayroll: scale(800000),
    overtimeExtra: scale(180000),
    bonusesIncentives: scale(220000),
  };

  const ratios: PayrollRatios = {
    avgPerEmployee: +(payroll.totalPayroll / headcount.totalActiveEmployees).toFixed(0),
    avgPerTutor: +(payroll.tutorPayroll / headcount.totalActiveTutors).toFixed(0),
    payrollPercentOfRevenue: 31.5, // normally from Finance
  };

  const attendance: AttendanceData = {
    totalWorkingDays: period === "monthly" ? 22 : period === "weekly" ? 5 : 260,
    approvedLeaves: scale(28),
    unplannedAbsences: scale(8),
    lateArrivals: scale(14),
  };

  const attrition: AttritionData = {
    totalExits: scale(3),
    tutorExits: scale(2),
    nonTeachingExits: scale(1),
    attritionRate: +(5.2 * (period === "all" ? 1 : factor * 12)).toFixed(1),
    earlyAttritionCount: scale(1),
  };

  const compliance: ContractComplianceData = {
    onProbation: 12,
    confirmed: 56,
    contractExpiries60Days: 4,
    disciplinaryActions: 2,
  };

  const training: TrainingData = {
    newHiresOnboarded: scale(5),
    trainingSessions: scale(12),
    employeesTrained: scale(30),
    trainingHoursDelivered: scale(48),
  };

  return { headcount, payroll, ratios, attendance, attrition, compliance, training };
};

// ----------------------------------------------------------------------
// Color constants
// ----------------------------------------------------------------------
const HEADCOUNT_COLORS = ["#4f46e5", "#f59e0b", "#10b981"];
const PAYROLL_COLORS = ["#4f46e5", "#10b981"];
const SHIFT_COLORS = ["#f59e0b", "#8b5cf6"];
const ATTRITION_COLORS = ["#ef4444", "#f59e0b"];
const COMPLIANCE_COLORS = ["#f59e0b", "#10b981"];
const TRAINING_COLORS = ["#4f46e5", "#10b981", "#f59e0b"];

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function HRDashboardPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(() => getMockData("monthly"));

  const fetchData = (selectedPeriod: Period) => {
    setLoading(true);
    setData(getMockData(selectedPeriod));
    setTimeout(() => setLoading(false), 300);
  };

  const handlePeriodChange = (val: string) => {
    const newPeriod = val as Period;
    setPeriod(newPeriod);
    fetchData(newPeriod);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const { headcount, payroll, ratios, attendance, attrition, compliance, training } = data;

  // Chart data
  const headcountPie = [
    { name: "Tutors", value: headcount.totalActiveTutors },
    { name: "Non-teaching", value: headcount.totalNonTeachingStaff },
  ];
  const headcountShift = [
    { name: "Morning", value: headcount.morningShift },
    { name: "Night", value: headcount.nightShift },
  ];

  const payrollPie = [
    { name: "Tutors", value: payroll.tutorPayroll },
    { name: "Non-teaching", value: payroll.nonTeachingPayroll },
  ];
  const payrollShift = [
    { name: "Morning", value: payroll.morningShiftPayroll },
    { name: "Night", value: payroll.nightShiftPayroll },
  ];

  const ratiosBar = [
    { name: "Avg per Employee", value: ratios.avgPerEmployee },
    { name: "Avg per Tutor", value: ratios.avgPerTutor },
  ];

  const attendanceBar = [
    { name: "Approved Leaves", value: attendance.approvedLeaves },
    { name: "Unplanned Absences", value: attendance.unplannedAbsences },
    { name: "Late Arrivals", value: attendance.lateArrivals },
  ];

  const attritionPie = [
    { name: "Tutor exits", value: attrition.tutorExits },
    { name: "Non-teaching exits", value: attrition.nonTeachingExits },
  ];

  const compliancePie = [
    { name: "On Probation", value: compliance.onProbation },
    { name: "Confirmed", value: compliance.confirmed },
  ];

  const trainingBar = [
    { name: "Sessions", value: training.trainingSessions },
    { name: "Employees Trained", value: training.employeesTrained },
    { name: "Hours Delivered", value: training.trainingHoursDelivered },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground">
            Headcount, payroll, attendance, attrition &amp; training metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="yearly">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => fetchData(period)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* A. Headcount */}
      <SectionTitle icon={Users} title="A. Headcount" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Total active employees" value={headcount.totalActiveEmployees} icon={Users} />
        <MetricCard title="Total active tutors" value={headcount.totalActiveTutors} icon={UserCheck} />
        <MetricCard title="Total non-teaching staff" value={headcount.totalNonTeachingStaff} icon={Briefcase} />
        <MetricCard title="Morning shift headcount" value={headcount.morningShift} icon={Clock} />
        <MetricCard title="Night shift headcount" value={headcount.nightShift} icon={Clock} />
      </div>
      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Staff Composition</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={headcountPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {headcountPie.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={HEADCOUNT_COLORS[idx % HEADCOUNT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Shift Distribution</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={headcountShift}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[4,4,0,0]}>
                  {headcountShift.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={SHIFT_COLORS[idx % SHIFT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* B. Payroll (PKR) */}
      <SectionTitle icon={DollarSign} title="B. Payroll (PKR)" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total payroll paid" value={`PKR ${payroll.totalPayroll.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Tutor payroll" value={`PKR ${payroll.tutorPayroll.toLocaleString()}`} icon={UserCheck} />
        <MetricCard title="Non-teaching payroll" value={`PKR ${payroll.nonTeachingPayroll.toLocaleString()}`} icon={Briefcase} />
        <MetricCard title="Morning shift payroll" value={`PKR ${payroll.morningShiftPayroll.toLocaleString()}`} icon={Clock} />
        <MetricCard title="Night shift payroll" value={`PKR ${payroll.nightShiftPayroll.toLocaleString()}`} icon={Clock} />
        <MetricCard title="Overtime / extra payouts" value={`PKR ${payroll.overtimeExtra.toLocaleString()}`} icon={AlertTriangle} />
        <MetricCard title="Bonuses / incentives" value={`PKR ${payroll.bonusesIncentives.toLocaleString()}`} icon={DollarSign} />
      </div>
      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Payroll Split</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={payrollPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {payrollPie.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={PAYROLL_COLORS[idx % PAYROLL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `PKR ${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Shift-wise Payroll</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollShift}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `PKR ${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => `PKR ${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]}>
                  {payrollShift.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={SHIFT_COLORS[idx % SHIFT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* C. Payroll Ratios */}
      <SectionTitle icon={Percent} title="C. Payroll Ratios" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Average payroll per employee" value={`PKR ${ratios.avgPerEmployee.toLocaleString()}`} icon={Users} />
        <MetricCard title="Average payroll per tutor" value={`PKR ${ratios.avgPerTutor.toLocaleString()}`} icon={UserCheck} />
        <MetricCard title="Payroll as % of revenue" value={`${ratios.payrollPercentOfRevenue}%`} icon={Percent} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Average Payroll Comparison</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratiosBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `PKR ${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => `PKR ${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* D. Attendance & Leaves */}
      <SectionTitle icon={Calendar} title="D. Attendance & Leaves" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total working days" value={attendance.totalWorkingDays} icon={Calendar} />
        <MetricCard title="Approved leaves" value={attendance.approvedLeaves} icon={FileText} />
        <MetricCard title="Unplanned absences" value={attendance.unplannedAbsences} icon={AlertTriangle} />
        <MetricCard title="Late arrivals" value={attendance.lateArrivals} icon={Clock} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Attendance Breakdown</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* E. Attrition & Retention */}
      <SectionTitle icon={UserX} title="E. Attrition & Retention" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Total exits" value={attrition.totalExits} icon={UserX} />
        <MetricCard title="Tutor exits" value={attrition.tutorExits} icon={UserCheck} />
        <MetricCard title="Non-teaching exits" value={attrition.nonTeachingExits} icon={Briefcase} />
        <MetricCard title="Attrition rate" value={`${attrition.attritionRate}%`} icon={Percent} />
        <MetricCard title="Early attrition (<90 days)" value={attrition.earlyAttritionCount} icon={AlertTriangle} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Exit Reasons (Tutor vs Non-Teaching)</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={attritionPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {attritionPie.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={ATTRITION_COLORS[idx % ATTRITION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* F. Contract & Compliance */}
      <SectionTitle icon={FileText} title="F. Contract & Compliance" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Employees on probation" value={compliance.onProbation} icon={Clock} />
        <MetricCard title="Confirmed employees" value={compliance.confirmed} icon={UserCheck} />
        <MetricCard title="Contract expiries (next 60 days)" value={compliance.contractExpiries60Days} icon={AlertTriangle} />
        <MetricCard title="Disciplinary actions issued" value={compliance.disciplinaryActions} icon={FileText} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Employment Status</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={compliancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {compliancePie.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COMPLIANCE_COLORS[idx % COMPLIANCE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* G. Training & Development */}
      <SectionTitle icon={GraduationCap} title="G. Training & Development" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="New hires onboarded" value={training.newHiresOnboarded} icon={Users} />
        <MetricCard title="Training sessions conducted" value={training.trainingSessions} icon={BookOpen} />
        <MetricCard title="Employees trained" value={training.employeesTrained} icon={UserCheck} />
        <MetricCard title="Training hours delivered" value={training.trainingHoursDelivered} icon={Clock} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Training Activity</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trainingBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {trainingBar.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={TRAINING_COLORS[idx % TRAINING_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// SectionTitle component
function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
      <Icon className="h-5 w-5 text-indigo-600" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}