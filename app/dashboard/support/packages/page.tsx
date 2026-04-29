"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function PackagesPage() {
  const [packages, setPackages] = useState<{ name: string; students: number; revenue: number; percentage: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPackages([
      { name: '1x/week', students: 120, revenue: 12000, percentage: 20 },
      { name: '2x/week', students: 250, revenue: 35000, percentage: 42 },
      { name: '3x/week', students: 180, revenue: 32400, percentage: 30 },
      { name: '4x/week', students: 90, revenue: 21600, percentage: 15 },
      { name: 'Prepaid', students: 45, revenue: 18000, percentage: 8 }
    ]);
    setLoading(false);
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Package Mix</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Package Distribution (by students)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={packages} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`} outerRadius={80} dataKey="students">
                    {packages.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue by Package</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {packages.map(pkg => (
                <div key={pkg.name}>
                  <div className="flex justify-between"><span>{pkg.name}</span><span className="font-bold">${pkg.revenue.toLocaleString()}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(pkg.revenue / packages.reduce((acc, p) => acc + p.revenue, 0)) * 100}%` }}></div></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Package Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Package</TableHead><TableHead>Students</TableHead><TableHead>Revenue</TableHead><TableHead>% of Total</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {packages.map(pkg => (
                <TableRow key={pkg.name}>
                  <TableCell>{pkg.name}</TableCell>
                  <TableCell>{pkg.students}</TableCell>
                  <TableCell>${pkg.revenue.toLocaleString()}</TableCell>
                  <TableCell>{((pkg.revenue / packages.reduce((acc, p) => acc + p.revenue, 0)) * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}