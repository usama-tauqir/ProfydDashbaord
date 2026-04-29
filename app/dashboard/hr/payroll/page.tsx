"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { DollarSign, TrendingUp, Users, Calendar } from "@/components/icons"
import { MetricCard } from "@/components/dashboard/metric-card"
import { DataEntryForm } from "@/components/dashboard/data-form"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const payrollTrend = [
  { month: "Jan", amount: 465000 },
  { month: "Feb", amount: 472000 },
  { month: "Mar", amount: 478000 },
  { month: "Apr", amount: 481000 },
  { month: "May", amount: 483000 },
  { month: "Jun", amount: 485000 },
]

const payrollBreakdown = [
  { category: "Base Salary", value: 380000, color: "var(--chart-1)" },
  { category: "Bonuses", value: 45000, color: "var(--chart-2)" },
  { category: "Benefits", value: 35000, color: "var(--chart-3)" },
  { category: "Overtime", value: 25000, color: "var(--chart-4)" },
]

const chartConfig = {
  amount: { label: "Amount", color: "var(--chart-1)" },
  value: { label: "Value" },
}

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payroll Management</h1>
        <p className="text-muted-foreground">Track and manage employee payroll</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monthly Payroll"
          value="$485,000"
          change={3.2}
          icon={DollarSign}
        />
        <MetricCard
          title="Avg. Salary"
          value="$3,464"
          change={2.8}
          icon={TrendingUp}
        />
        <MetricCard
          title="Employees Paid"
          value="140"
          change={5.3}
          icon={Users}
        />
        <MetricCard
          title="Next Payroll"
          value="Mar 28"
          change={0}
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Payroll Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payrollTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="amount" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Payroll Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payrollBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name }: any) => name}
                  >
                    {payrollBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <DataEntryForm
        title="Process Payroll Adjustment"
        fields={[
          { name: "employee_id", label: "Employee ID", type: "text", required: true },
          { name: "type", label: "Adjustment Type", type: "select", required: true, options: [
            { value: "bonus", label: "Bonus" },
            { value: "deduction", label: "Deduction" },
            { value: "overtime", label: "Overtime" },
            { value: "allowance", label: "Allowance" },
          ]},
          { name: "amount", label: "Amount", type: "number", required: true },
          { name: "effective_date", label: "Effective Date", type: "date", required: true },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
        onSubmit={(data) => console.log("Payroll adjustment:", data)}
      />
    </div>
  )
}
