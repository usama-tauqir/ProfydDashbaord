// app/dashboard/recruitment/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Briefcase,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  UserX,
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
  LineChart,
  Line,
} from "recharts";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
type Period = "all" | "today" | "weekly" | "monthly" | "yearly";

interface HiringDemand {
  openPositionsTotal: number;
  openTutorPositions: number;
  openNonTeachingPositions: number;
  morningShiftVacancies: number;
  nightShiftVacancies: number;
}

interface CandidateFunnel {
  applicationsReceived: number;
  candidatesScreened: number;
  candidatesInterviewed: number;
  candidatesShortlisted: number;
  offersMade: number;
  offersAccepted: number;
}

interface ConversionMetrics {
  appToInterviewPercent: number;
  interviewToOfferPercent: number;
  offerToAcceptPercent: number;
}

interface HiringSpeed {
  avgTimeToHireDays: number;
  fastestHireDays: number;
  slowestHireDays: number;
}

interface HiringOutcome {
  newHiresJoined: number;
  noShows: number;
  stillActiveAfter30Days: number;
  earlyDropouts: number;
}

interface RecruitmentCost {
  costPerHire: number;
  totalRecruitmentCost: number;
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

  const demand: HiringDemand = {
    openPositionsTotal: 15,
    openTutorPositions: 10,
    openNonTeachingPositions: 5,
    morningShiftVacancies: 7,
    nightShiftVacancies: 3,
  };

  const funnel: CandidateFunnel = {
    applicationsReceived: scale(120),
    candidatesScreened: scale(95),
    candidatesInterviewed: scale(50),
    candidatesShortlisted: scale(20),
    offersMade: scale(15),
    offersAccepted: scale(12),
  };

  const conversions: ConversionMetrics = {
    appToInterviewPercent: +(funnel.candidatesInterviewed / funnel.applicationsReceived * 100).toFixed(1),
    interviewToOfferPercent: +(funnel.offersMade / funnel.candidatesInterviewed * 100).toFixed(1),
    offerToAcceptPercent: +(funnel.offersAccepted / funnel.offersMade * 100).toFixed(1),
  };

  const speed: HiringSpeed = {
    avgTimeToHireDays: 18,
    fastestHireDays: 5,
    slowestHireDays: 35,
  };

  const outcome: HiringOutcome = {
    newHiresJoined: scale(12),
    noShows: scale(1),
    stillActiveAfter30Days: scale(10),
    earlyDropouts: scale(2),
  };

  const cost: RecruitmentCost = {
    costPerHire: 420, // PKR or default currency
    totalRecruitmentCost: scale(5000),
  };

  return { demand, funnel, conversions, speed, outcome, cost };
};

// ----------------------------------------------------------------------
// Colors
// ----------------------------------------------------------------------
const DEMAND_COLORS = ["#4f46e5", "#10b981", "#f59e0b"];
const FUNNEL_COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];
const OUTCOME_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function RecruitmentDashboardPage() {
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

  const { demand, funnel, conversions, speed, outcome, cost } = data;

  // Chart data
  const demandPie = [
    { name: "Tutor", value: demand.openTutorPositions },
    { name: "Non-teaching", value: demand.openNonTeachingPositions },
  ];

  const funnelStages = [
    { stage: "Applications", count: funnel.applicationsReceived },
    { stage: "Screened", count: funnel.candidatesScreened },
    { stage: "Interviewed", count: funnel.candidatesInterviewed },
    { stage: "Shortlisted", count: funnel.candidatesShortlisted },
    { stage: "Offers Made", count: funnel.offersMade },
    { stage: "Accepted", count: funnel.offersAccepted },
  ];

  const conversionRates = [
    { name: "App → Interview", rate: conversions.appToInterviewPercent },
    { name: "Interview → Offer", rate: conversions.interviewToOfferPercent },
    { name: "Offer → Accept", rate: conversions.offerToAcceptPercent },
  ];

  const hiringSpeedData = [
    { name: "Avg", days: speed.avgTimeToHireDays },
    { name: "Fastest", days: speed.fastestHireDays },
    { name: "Slowest", days: speed.slowestHireDays },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment Dashboard</h1>
          <p className="text-muted-foreground">
            Hiring pipeline, conversion rates, speed &amp; quality metrics.
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

      {/* A. Hiring Demand */}
      <SectionTitle icon={Briefcase} title="A. Hiring Demand" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Open positions (total)" value={demand.openPositionsTotal} icon={Briefcase} />
        <MetricCard title="Open tutor positions" value={demand.openTutorPositions} icon={UserCheck} />
        <MetricCard title="Open non-teaching positions" value={demand.openNonTeachingPositions} icon={Users} />
        <MetricCard title="Morning shift vacancies" value={demand.morningShiftVacancies} icon={Clock} />
        <MetricCard title="Night shift vacancies" value={demand.nightShiftVacancies} icon={Clock} />
      </div>
      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Open Positions by Type</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demandPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {demandPie.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={DEMAND_COLORS[idx % DEMAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Shift-wise Vacancies</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Morning", value: demand.morningShiftVacancies },
                { name: "Night", value: demand.nightShiftVacancies },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* B. Candidate Funnel */}
      <SectionTitle icon={Users} title="B. Candidate Funnel" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Applications received" value={funnel.applicationsReceived} icon={FileText} />
        <MetricCard title="Candidates screened" value={funnel.candidatesScreened} icon={UserCheck} />
        <MetricCard title="Candidates interviewed" value={funnel.candidatesInterviewed} icon={Users} />
        <MetricCard title="Candidates shortlisted" value={funnel.candidatesShortlisted} icon={UserCheck} />
        <MetricCard title="Offers made" value={funnel.offersMade} icon={Briefcase} />
        <MetricCard title="Offers accepted" value={funnel.offersAccepted} icon={TrendingUp} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Recruitment Funnel</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelStages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="stage" width={100} />
              <Tooltip />
              <Bar dataKey="count" radius={[0,4,4,0]} barSize={24}>
                {funnelStages.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* C. Conversion Metrics */}
      <SectionTitle icon={TrendingUp} title="C. Conversion Metrics" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Application → Interview %" value={`${conversions.appToInterviewPercent}%`} icon={TrendingUp} />
        <MetricCard title="Interview → Offer %" value={`${conversions.interviewToOfferPercent}%`} icon={TrendingUp} />
        <MetricCard title="Offer → Acceptance %" value={`${conversions.offerToAcceptPercent}%`} icon={TrendingUp} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Conversion Rates Comparison</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={conversionRates}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Bar dataKey="rate" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* D. Hiring Speed */}
      <SectionTitle icon={Clock} title="D. Hiring Speed" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Average time to hire (days)" value={speed.avgTimeToHireDays} icon={Clock} />
        <MetricCard title="Fastest hire (days)" value={speed.fastestHireDays} icon={Clock} />
        <MetricCard title="Slowest hire (days)" value={speed.slowestHireDays} icon={Clock} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Hiring Speed Overview</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hiringSpeedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${v} days`} />
              <Tooltip formatter={(value: any) => `${value} days`} />
              <Bar dataKey="days" fill="#8b5cf6" radius={[4,4,0,0]}>
                {hiringSpeedData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={idx === 0 ? "#4f46e5" : idx === 1 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* E. Hiring Outcome Quality */}
      <SectionTitle icon={UserX} title="E. Hiring Outcome Quality" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="New hires joined" value={outcome.newHiresJoined} icon={UserCheck} />
        <MetricCard title="No-shows on joining date" value={outcome.noShows} icon={AlertTriangle} />
        <MetricCard title="Still active after 30 days" value={outcome.stillActiveAfter30Days} icon={UserCheck} />
        <MetricCard title="Early dropouts (<30 days)" value={outcome.earlyDropouts} icon={UserX} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Outcome Distribution</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Still Active", value: outcome.stillActiveAfter30Days },
                  { name: "Early Dropouts", value: outcome.earlyDropouts },
                  { name: "No-shows", value: outcome.noShows },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {OUTCOME_COLORS.map((color, idx) => (
                  <Cell key={`cell-${idx}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* F. Recruitment Cost */}
      <SectionTitle icon={DollarSign} title="F. Recruitment Cost" />
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard title="Cost per hire" value={`$${cost.costPerHire}`} icon={DollarSign} />
        <MetricCard title="Total recruitment cost" value={`$${cost.totalRecruitmentCost.toLocaleString()}`} icon={DollarSign} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Reusable SectionTitle
// ----------------------------------------------------------------------
function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
      <Icon className="h-5 w-5 text-indigo-600" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}