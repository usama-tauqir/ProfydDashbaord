"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, Users, ArrowUp, ArrowDown } from "lucide-react";

export default function RevenuePage() {
  const [stats, setStats] = useState({
    totalCollected: 0,
    arpu: 0,
    performance: 0,
    previousCollected: 0
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string; collected: number; arpu: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStats({
      totalCollected: 45678,
      arpu: 125,
      performance: 8.2,
      previousCollected: 42200
    });
    setMonthlyData([
      { month: 'Jan', collected: 41200, arpu: 118 },
      { month: 'Feb', collected: 42800, arpu: 122 },
      { month: 'Mar', collected: 45678, arpu: 125 },
    ]);
    setLoading(false);
  }, []);

  const performanceIcon = stats.performance >= 0 ? <ArrowUp className="h-4 w-4 text-green-600" /> : <ArrowDown className="h-4 w-4 text-red-600" />;

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Revenue Analytics</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total Collected (MTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCollected.toLocaleString()}</div>
            <p className="text-xs text-green-600">+{stats.performance}% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">ARPU (Avg Revenue per User)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.arpu}</div>
            <p className="text-xs text-muted-foreground">Per student</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Overall Performance</CardTitle>
            {performanceIcon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.abs(stats.performance)}%</div>
            <p className="text-xs text-muted-foreground">vs previous month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="collected" stroke="#8884d8" name="Revenue (AUD)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>ARPU Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="arpu" fill="#82ca9d" name="ARPU (AUD)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}