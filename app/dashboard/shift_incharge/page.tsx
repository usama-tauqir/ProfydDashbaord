// app/dashboard/shift-incharge/page.tsx
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
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GitPullRequest,
  Lightbulb,
  Network,
  RefreshCw,
  Send,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
type YesNo = "Yes" | "No";

interface ObjectionHandling {
  objectionsReceived: number;
  resolvedAtShiftLevel: number;
  escalated: number;
  repeatObjections: number;
}

interface TeamGuidance {
  guidanceSessions: number;
  performanceCorrections: number;
  repeatPerformanceIssues: number;
  teamsRequiringIntervention: number;
}

interface TargetReview {
  shiftTargetsSet: number;
  targetsAchieved: number;
  targetsMissed: number;
  rootCausesIdentified: number;
}

interface CapacityPlanning {
  expectedStudentGrowth: number;
  expectedTutorRequirement: number;
  capacityGapsIdentified: number;
  advanceHiringRequests: number;
}

interface ComplianceEnforcement {
  complianceChecks: number;
  breachesIdentified: number;
  breachesCorrected: number;
  unresolvedComplianceRisks: number;
}

interface FlowOptimization {
  processIssuesIdentified: number;
  improvementsSuggested: number;
  improvementsApproved: number;
  improvementsImplemented: number;
}

interface QualityStability {
  qualityRiskFlags: number;
  preventiveActionsTaken: number;
  risksResolved: number;
  risksEscalated: number;
}

interface CrossDepartment {
  hrEscalations: number;
  tdEscalations: number;
  adminEscalations: number;
  financeEscalations: number;
  marketingEscalations: number;
  issuesResolved: number;
  pendingActions: number;
}

interface ChangeAdvisory {
  newFlowsTested: number;
  feedbackSubmitted: number;
  adjustmentsRecommended: number;
  finalFlowsApproved: number;
}

interface ReportingDiscipline {
  reportSubmittedOnTime: YesNo;
  keyRisksHighlighted: number;
  decisionsRequired: number;
}

// ----------------------------------------------------------------------
// Mock data generator
// ----------------------------------------------------------------------
const getMockData = (period: Period) => {
  const factor =
    period === "all"
      ? 12
      : period === "yearly"
      ? 12
      : period === "monthly"
      ? 1
      : period === "weekly"
      ? 0.25
      : 0.05;

  const scale = (val: number) => Math.max(0, Math.round(val * factor));

  const objections: ObjectionHandling = {
    objectionsReceived: scale(42),
    resolvedAtShiftLevel: scale(31),
    escalated: scale(8),
    repeatObjections: scale(3),
  };

  const team: TeamGuidance = {
    guidanceSessions: scale(18),
    performanceCorrections: scale(7),
    repeatPerformanceIssues: scale(3),
    teamsRequiringIntervention: scale(2),
  };

  const targets: TargetReview = {
    shiftTargetsSet: scale(12),
    targetsAchieved: scale(9),
    targetsMissed: scale(3),
    rootCausesIdentified: scale(3),
  };

  const capacity: CapacityPlanning = {
    expectedStudentGrowth: scale(55),
    expectedTutorRequirement: scale(14),
    capacityGapsIdentified: scale(4),
    advanceHiringRequests: scale(3),
  };

  const compliance: ComplianceEnforcement = {
    complianceChecks: scale(28),
    breachesIdentified: scale(6),
    breachesCorrected: scale(5),
    unresolvedComplianceRisks: scale(1),
  };

  const flow: FlowOptimization = {
    processIssuesIdentified: scale(9),
    improvementsSuggested: scale(6),
    improvementsApproved: scale(4),
    improvementsImplemented: scale(3),
  };

  const quality: QualityStability = {
    qualityRiskFlags: scale(11),
    preventiveActionsTaken: scale(8),
    risksResolved: scale(7),
    risksEscalated: scale(4),
  };

  const departments: CrossDepartment = {
    hrEscalations: scale(4),
    tdEscalations: scale(5),
    adminEscalations: scale(3),
    financeEscalations: scale(2),
    marketingEscalations: scale(1),
    issuesResolved: scale(10),
    pendingActions: scale(5),
  };

  const change: ChangeAdvisory = {
    newFlowsTested: scale(3),
    feedbackSubmitted: scale(3),
    adjustmentsRecommended: scale(5),
    finalFlowsApproved: scale(2),
  };

  const reporting: ReportingDiscipline = {
    reportSubmittedOnTime: "Yes",
    keyRisksHighlighted: scale(6),
    decisionsRequired: scale(4),
  };

  return {
    objections,
    team,
    targets,
    capacity,
    compliance,
    flow,
    quality,
    departments,
    change,
    reporting,
  };
};

// ----------------------------------------------------------------------
// Colors
// ----------------------------------------------------------------------
const COLORS = [
  "#4f46e5",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const RISK_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function ShiftInchargeDashboardPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(() => getMockData("monthly"));

  const fetchData = (selectedPeriod: Period) => {
    setLoading(true);
    setData(getMockData(selectedPeriod));
    setTimeout(() => setLoading(false), 300);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const {
    objections,
    team,
    targets,
    capacity,
    compliance,
    flow,
    quality,
    departments,
    change,
    reporting,
  } = data;

  const resolutionRate =
    objections.objectionsReceived > 0
      ? Math.round(
          (objections.resolvedAtShiftLevel / objections.objectionsReceived) * 100
        )
      : 0;

  const targetAchievementRate =
    targets.shiftTargetsSet > 0
      ? Math.round((targets.targetsAchieved / targets.shiftTargetsSet) * 100)
      : 0;

  // ----------------------------------------------------------------------
  // Chart Data
  // ----------------------------------------------------------------------
  const objectionPie = [
    { name: "Resolved at shift", value: objections.resolvedAtShiftLevel },
    { name: "Escalated", value: objections.escalated },
    { name: "Repeat objections", value: objections.repeatObjections },
  ];

  const teamBar = [
    { name: "Guidance", value: team.guidanceSessions },
    { name: "Corrections", value: team.performanceCorrections },
    { name: "Repeat Issues", value: team.repeatPerformanceIssues },
    { name: "Intervention", value: team.teamsRequiringIntervention },
  ];

  const targetPie = [
    { name: "Achieved", value: targets.targetsAchieved },
    { name: "Missed", value: targets.targetsMissed },
    { name: "Root Causes", value: targets.rootCausesIdentified },
  ];

  const capacityBar = [
    { name: "Student Growth", value: capacity.expectedStudentGrowth },
    { name: "Tutor Need", value: capacity.expectedTutorRequirement },
    { name: "Capacity Gaps", value: capacity.capacityGapsIdentified },
    { name: "Hiring Requests", value: capacity.advanceHiringRequests },
  ];

  const complianceBar = [
    { name: "Checks", value: compliance.complianceChecks },
    { name: "Breaches", value: compliance.breachesIdentified },
    { name: "Corrected", value: compliance.breachesCorrected },
    { name: "Unresolved", value: compliance.unresolvedComplianceRisks },
  ];

  const flowBar = [
    { name: "Issues", value: flow.processIssuesIdentified },
    { name: "Suggested", value: flow.improvementsSuggested },
    { name: "Approved", value: flow.improvementsApproved },
    { name: "Implemented", value: flow.improvementsImplemented },
  ];

  const qualityPie = [
    { name: "Risk Flags", value: quality.qualityRiskFlags },
    { name: "Preventive Actions", value: quality.preventiveActionsTaken },
    { name: "Resolved", value: quality.risksResolved },
    { name: "Escalated", value: quality.risksEscalated },
  ];

  const departmentBar = [
    { name: "HR", value: departments.hrEscalations },
    { name: "T&D", value: departments.tdEscalations },
    { name: "Admin", value: departments.adminEscalations },
    { name: "Finance", value: departments.financeEscalations },
    { name: "Marketing", value: departments.marketingEscalations },
  ];

  const changeBar = [
    { name: "Tested", value: change.newFlowsTested },
    { name: "Feedback", value: change.feedbackSubmitted },
    { name: "Adjustments", value: change.adjustmentsRecommended },
    { name: "Approved", value: change.finalFlowsApproved },
  ];

  const reportingBar = [
    { name: "Key Risks", value: reporting.keyRisksHighlighted },
    { name: "Decisions Required", value: reporting.decisionsRequired },
    { name: "Pending Dept Actions", value: departments.pendingActions },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Shift Incharge / Shift Business Manager
          </h1>
          <p className="text-muted-foreground">
            Shift-level business performance, objections, team direction,
            capacity planning, compliance, quality risks, and reporting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => fetchData(v as Period)}>
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

      {/* Executive Snapshot */}
      <SectionTitle icon={Activity} title="Executive Shift Snapshot" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard
          title="Resolution rate"
          value={`${resolutionRate}%`}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Target achievement"
          value={`${targetAchievementRate}%`}
          icon={Target}
        />
        <MetricCard
          title="Capacity gaps"
          value={capacity.capacityGapsIdentified}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Unresolved compliance risks"
          value={compliance.unresolvedComplianceRisks}
          icon={ShieldCheck}
        />
        <MetricCard
          title="Pending dept actions"
          value={departments.pendingActions}
          icon={Network}
        />
        <MetricCard
          title="Management decisions"
          value={reporting.decisionsRequired}
          icon={FileText}
        />
      </div>

      {/* 1. Objection Handling & Escalation Control */}
      <SectionTitle
        icon={AlertTriangle}
        title="1. Objection Handling & Escalation Control"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Objections received"
          value={objections.objectionsReceived}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Resolved at shift level"
          value={objections.resolvedAtShiftLevel}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Escalated"
          value={objections.escalated}
          icon={Send}
        />
        <MetricCard
          title="Repeat objections"
          value={objections.repeatObjections}
          icon={RefreshCw}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Objection Resolution Split</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={objectionPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {objectionPie.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Team Guidance & Performance Direction */}
      <SectionTitle
        icon={Users}
        title="2. Team Guidance & Performance Direction"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Guidance sessions"
          value={team.guidanceSessions}
          icon={UserCheck}
        />
        <MetricCard
          title="Performance corrections"
          value={team.performanceCorrections}
          icon={ClipboardCheck}
        />
        <MetricCard
          title="Repeat performance issues"
          value={team.repeatPerformanceIssues}
          icon={RefreshCw}
        />
        <MetricCard
          title="Teams requiring intervention"
          value={team.teamsRequiringIntervention}
          icon={Users}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Team Performance Direction</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. Target Setting & Review */}
      <SectionTitle icon={Target} title="3. Target Setting & Review" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Shift targets set"
          value={targets.shiftTargetsSet}
          icon={Target}
        />
        <MetricCard
          title="Targets achieved"
          value={targets.targetsAchieved}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Targets missed"
          value={targets.targetsMissed}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Root causes identified"
          value={targets.rootCausesIdentified}
          icon={BarChart3}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Target Status</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={targetPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {targetPie.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 4. Forecasting & Capacity Planning */}
      <SectionTitle
        icon={TrendingUp}
        title="4. Forecasting & Capacity Planning"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Expected student growth"
          value={capacity.expectedStudentGrowth}
          icon={Building2}
        />
        <MetricCard
          title="Expected tutor requirement"
          value={capacity.expectedTutorRequirement}
          icon={Users}
        />
        <MetricCard
          title="Capacity gaps identified"
          value={capacity.capacityGapsIdentified}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Advance hiring requests"
          value={capacity.advanceHiringRequests}
          icon={Send}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">
            Student Load vs Tutor Capacity Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={capacityBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 5. Compliance Enforcement */}
      <SectionTitle icon={ShieldCheck} title="5. Compliance Enforcement" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Compliance checks"
          value={compliance.complianceChecks}
          icon={ShieldCheck}
        />
        <MetricCard
          title="Breaches identified"
          value={compliance.breachesIdentified}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Breaches corrected"
          value={compliance.breachesCorrected}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Unresolved risks"
          value={compliance.unresolvedComplianceRisks}
          icon={AlertTriangle}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Compliance Control Status</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={complianceBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 6. Scalability & Flow Optimization */}
      <SectionTitle icon={Workflow} title="6. Scalability & Flow Optimization" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Process issues identified"
          value={flow.processIssuesIdentified}
          icon={GitPullRequest}
        />
        <MetricCard
          title="Improvements suggested"
          value={flow.improvementsSuggested}
          icon={Lightbulb}
        />
        <MetricCard
          title="Improvements approved"
          value={flow.improvementsApproved}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Improvements implemented"
          value={flow.improvementsImplemented}
          icon={Workflow}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">
            Workflow Improvement Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={flowBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 7. Quality & Stability Oversight */}
      <SectionTitle
        icon={Activity}
        title="7. Quality & Stability Oversight"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Quality risk flags"
          value={quality.qualityRiskFlags}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Preventive actions"
          value={quality.preventiveActionsTaken}
          icon={ShieldCheck}
        />
        <MetricCard
          title="Risks resolved"
          value={quality.risksResolved}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Risks escalated"
          value={quality.risksEscalated}
          icon={Send}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">
            Quality Risk & Preventive Action Split
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={qualityPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {qualityPie.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={RISK_COLORS[idx % RISK_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 8. Cross-Department Coordination */}
      <SectionTitle icon={Network} title="8. Cross-Department Coordination" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard
          title="HR escalations"
          value={departments.hrEscalations}
          icon={Users}
        />
        <MetricCard
          title="T&D escalations"
          value={departments.tdEscalations}
          icon={UserCheck}
        />
        <MetricCard
          title="Admin escalations"
          value={departments.adminEscalations}
          icon={Building2}
        />
        <MetricCard
          title="Finance escalations"
          value={departments.financeEscalations}
          icon={FileText}
        />
        <MetricCard
          title="Marketing escalations"
          value={departments.marketingEscalations}
          icon={TrendingUp}
        />
        <MetricCard
          title="Issues resolved"
          value={departments.issuesResolved}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Pending actions"
          value={departments.pendingActions}
          icon={AlertTriangle}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">
            Escalations by Department
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 9. Change Advisory Role */}
      <SectionTitle icon={Lightbulb} title="9. Change Advisory Role" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="New flows tested"
          value={change.newFlowsTested}
          icon={GitPullRequest}
        />
        <MetricCard
          title="Feedback submitted"
          value={change.feedbackSubmitted}
          icon={FileText}
        />
        <MetricCard
          title="Adjustments recommended"
          value={change.adjustmentsRecommended}
          icon={Lightbulb}
        />
        <MetricCard
          title="Final flows approved"
          value={change.finalFlowsApproved}
          icon={CheckCircle2}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Change Validation Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={changeBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 10. Reporting Discipline */}
      <SectionTitle icon={FileText} title="10. Reporting Discipline" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Report submitted on time"
          value={reporting.reportSubmittedOnTime}
          icon={FileText}
        />
        <MetricCard
          title="Key risks highlighted"
          value={reporting.keyRisksHighlighted}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Decisions required"
          value={reporting.decisionsRequired}
          icon={ClipboardCheck}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">
            Executive Reporting Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportingBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------
// Reusable SectionTitle
// ----------------------------------------------------------------------
function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="mt-4 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
      <Icon className="h-5 w-5 text-indigo-600" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}