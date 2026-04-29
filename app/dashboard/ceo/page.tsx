"use client";

import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Users,
  TrendingUp,
  DollarSign,
  Wallet,
  UserCheck,
  Target,
  Clock,
  AlertTriangle,
} from "@/components/icons";
import { Percent, CreditCard, BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock data for CEO dashboard
const revenueData = [
  { month: "Jan", revenue: 42000, target: 40000 },
  { month: "Feb", revenue: 45000, target: 42000 },
  { month: "Mar", revenue: 48000, target: 45000 },
  { month: "Apr", revenue: 52000, target: 48000 },
  { month: "May", revenue: 49000, target: 50000 },
  { month: "Jun", revenue: 55000, target: 52000 },
];

const departmentPerformance = [
  { name: "Support", value: 92, fill: "var(--support)" },
  { name: "Sales", value: 88, fill: "var(--sales)" },
  { name: "Finance", value: 95, fill: "var(--finance)" },
  { name: "Marketing", value: 78, fill: "var(--marketing)" },
  { name: "HR", value: 85, fill: "var(--hr)" },
];

const studentGrowth = [
  { month: "Jan", active: 1200, new: 150, churned: 45 },
  { month: "Feb", active: 1305, new: 180, churned: 52 },
  { month: "Mar", active: 1433, new: 195, churned: 48 },
  { month: "Apr", active: 1580, new: 210, churned: 55 },
  { month: "May", active: 1735, new: 225, churned: 60 },
  { month: "Jun", active: 1900, new: 240, churned: 58 },
];

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  target: { label: "Target", color: "var(--chart-2)" },
  active: { label: "Active Students", color: "var(--chart-1)" },
  new: { label: "New Students", color: "var(--chart-2)" },
  churned: { label: "Churned", color: "var(--chart-5)" },
};

export default function CEODashboardPage() {
  // Derived values
  const currentMonthActive = 1900;
  const previousMonthActive = 1735;
  const monthlyRevenue = 55000;
  const cashCollected = 48500;
  const churnPercent = 3.1;
  const netGrowth = 182;
  const arpu = (monthlyRevenue / currentMonthActive).toFixed(2); // ~28.95
  const grossMarginPercent = 68; // mocked
  const outstandingReceivables = 12500;
  const cac = 125;
  const paybackMonths = 4.2;
  const tutorUtilization = 87;

  return (
    <div className="flex flex-col">
      <main className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Executive Overview</h1>
          <p className="mt-1 text-muted-foreground">
            Key business metrics and performance indicators
          </p>
        </div>

        {/* Row 1 – Main KPIs (5 cards) */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Active Students (M/N)"
            value={`${currentMonthActive} / ${previousMonthActive}`}
            icon={Users}
            trend={{ value: ((currentMonthActive / previousMonthActive - 1) * 100), isPositive: true }}
            description="current vs last month"
          />
          <MetricCard
            title="Net Student Growth"
            value={`+${netGrowth}`}
            icon={TrendingUp}
            trend={{ value: 8.2, isPositive: true }}
            description="new - churned"
          />
          <MetricCard
            title="Monthly Revenue"
            value={`$${monthlyRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 15.3, isPositive: true }}
            description="vs last month"
          />
          <MetricCard
            title="Cash Collected"
            value={`$${cashCollected.toLocaleString()}`}
            icon={Wallet}
            trend={{ value: 5.8, isPositive: true }}
            description={`${((cashCollected / monthlyRevenue) * 100).toFixed(0)}% collection rate`}
          />
          <MetricCard
            title="Outstanding Receivables"
            value={`$${outstandingReceivables.toLocaleString()}`}
            icon={CreditCard}
            description="30+ days: $4,200"
          />
        </div>

        {/* Row 2 – Additional Metrics (6 cards for the rest) */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <MetricCard
            title="Churn %"
            value={`${churnPercent}%`}
            icon={AlertTriangle}
            trend={{ value: 0.5, isPositive: true }}
            description="improved from 3.6%"
          />
          <MetricCard
            title="ARPA"
            value={`$${arpu}`}
            icon={BarChart3}
            description="avg revenue per active account"
          />
          <MetricCard
            title="Gross Margin %"
            value={`${grossMarginPercent}%`}
            icon={Percent}
            trend={{ value: 2.1, isPositive: true }}
            description="vs industry avg 65%"
          />
          <MetricCard
            title="Tutor Utilization"
            value={`${tutorUtilization}%`}
            icon={UserCheck}
            trend={{ value: 4.2, isPositive: true }}
            description="85 active tutors"
          />
          <MetricCard
            title="CAC"
            value={`$${cac}`}
            icon={Target}
            trend={{ value: 8.0, isPositive: true }}
            description="down from $136"
          />
          <MetricCard
            title="Payback Period"
            value={`${paybackMonths} mo`}
            icon={Clock}
            trend={{ value: 12.5, isPositive: true }}
            description="improved efficiency"
          />
        </div>

        {/* Charts Row 1 – Revenue and Student Growth */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Target</CardTitle>
              <CardDescription>Monthly revenue performance against targets</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="var(--chart-2)"
                    fill="var(--chart-2)"
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Growth Trends</CardTitle>
              <CardDescription>Active, new, and churned students over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={studentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="new" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="churned" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 – Department Performance & Top 3 Risks */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Target achievement by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <PieChart>
                  <Pie
                    data={departmentPerformance}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {departmentPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {departmentPerformance.map((dept) => (
                  <div key={dept.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: dept.fill }}
                    />
                    <span className="text-muted-foreground">{dept.name}</span>
                    <span className="ml-auto font-medium">{dept.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top 3 Risks & Concerns</CardTitle>
              <CardDescription>Items requiring executive attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">Outstanding Receivables High</p>
                    <p className="text-sm text-muted-foreground">
                      $12,500 outstanding for 30+ days. Collection team following up.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Marketing CAC Trending Up</p>
                    <p className="text-sm text-muted-foreground">
                      WhatsApp AU campaign showing diminishing returns. Review recommended.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Tutor Capacity Constraint</p>
                    <p className="text-sm text-muted-foreground">
                      Morning shift at 95% capacity. 5 new tutors in recruitment pipeline.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}