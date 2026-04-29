"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CapacityPage() {
  const [capacity, setCapacity] = useState({
    activeTutors: 0,
    availableHours: 0,
    taughtHours: 0,
    utilization: 0
  });
  const [weeklyData, setWeeklyData] = useState<{ day: string; taught: number; available: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCapacity({
      activeTutors: 42,
      availableHours: 320,
      taughtHours: 250,
      utilization: 78
    });
    setWeeklyData([
      { day: 'Mon', taught: 48, available: 60 },
      { day: 'Tue', taught: 52, available: 64 },
      { day: 'Wed', taught: 46, available: 60 },
      { day: 'Thu', taught: 50, available: 64 },
      { day: 'Fri', taught: 44, available: 60 },
    ]);
    setLoading(false);
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Tutor Capacity</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Active Tutors</CardTitle><Users className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{capacity.activeTutors}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Available Hours (Week)</CardTitle><Clock className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{capacity.availableHours}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Taught Hours (Week)</CardTitle><TrendingUp className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{capacity.taughtHours}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Utilization</CardTitle><Calendar className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{capacity.utilization}%</div><Progress value={capacity.utilization} className="mt-2" /></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Weekly Capacity Utilization</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="available" fill="#8884d8" name="Available Hours" />
                <Bar dataKey="taught" fill="#82ca9d" name="Taught Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}