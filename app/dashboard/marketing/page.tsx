// app/dashboard/marketing/page.tsx
"use client";

import { useEffect, useState } from "react";
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
  DollarSign,
  TrendingUp,
  Users,
  Target,
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
type Market = "AU" | "UK" | "US" | "CA" | "NZ" | "EU" | "PK";

interface MarketData {
  market: Market;
  currency: string;
  platform: string;
  totalSpend: number;
  campaignSpend: { campaign: string; spend: number }[];
  leads: number;
  leadsBySource: {
    metaAds: number;
    googleAds: number;
    websiteOrganic: number;
    referrals: number;
    other: number;
  };
  trialsBooked: number;
  trialsAttended: number;
  paidConversions: number;
  offerUsed: string;
  discountedDeals: number;
  avgDiscountPercent: number;
  discountReasons: { reason: string; count: number }[];
}

interface MonthData {
  month: string;
  totalSpend: number;
  totalPaid: number;
}

// ----------------------------------------------------------------------
// Mock data
// ----------------------------------------------------------------------
const markets: MarketData[] = [
  {
    market: "AU",
    currency: "AUD",
    platform: "Meta + Google",
    totalSpend: 12400,
    campaignSpend: [
      { campaign: "Back to School", spend: 7000 },
      { campaign: "Retargeting", spend: 5400 },
    ],
    leads: 120,
    leadsBySource: { metaAds: 50, googleAds: 35, websiteOrganic: 20, referrals: 10, other: 5 },
    trialsBooked: 45,
    trialsAttended: 38,
    paidConversions: 32,
    offerUsed: "10% off first month",
    discountedDeals: 12,
    avgDiscountPercent: 10,
    discountReasons: [
      { reason: "Promo", count: 6 },
      { reason: "Retention", count: 3 },
      { reason: "Competitive", count: 2 },
      { reason: "Sales override", count: 1 },
    ],
  },
  {
    market: "UK",
    currency: "GBP",
    platform: "Meta",
    totalSpend: 8900,
    campaignSpend: [
      { campaign: "Tutor Launch", spend: 5000 },
      { campaign: "Evergreen", spend: 3900 },
    ],
    leads: 90,
    leadsBySource: { metaAds: 45, googleAds: 20, websiteOrganic: 15, referrals: 8, other: 2 },
    trialsBooked: 30,
    trialsAttended: 25,
    paidConversions: 20,
    offerUsed: "Free trial week",
    discountedDeals: 8,
    avgDiscountPercent: 12,
    discountReasons: [
      { reason: "Promo", count: 4 },
      { reason: "Retention", count: 2 },
      { reason: "Competitive", count: 1 },
      { reason: "Sales override", count: 1 },
    ],
  },
  {
    market: "US",
    currency: "USD",
    platform: "Google (Search + Display)",
    totalSpend: 15200,
    campaignSpend: [
      { campaign: "Summer Intensive", spend: 8200 },
      { campaign: "SAT Prep", spend: 7000 },
    ],
    leads: 145,
    leadsBySource: { metaAds: 20, googleAds: 80, websiteOrganic: 30, referrals: 10, other: 5 },
    trialsBooked: 55,
    trialsAttended: 48,
    paidConversions: 40,
    offerUsed: "15% sibling discount",
    discountedDeals: 15,
    avgDiscountPercent: 15,
    discountReasons: [
      { reason: "Promo", count: 7 },
      { reason: "Retention", count: 4 },
      { reason: "Competitive", count: 3 },
      { reason: "Sales override", count: 1 },
    ],
  },
  {
    market: "CA",
    currency: "CAD",
    platform: "Meta",
    totalSpend: 7200,
    campaignSpend: [
      { campaign: "French Immersion", spend: 4000 },
      { campaign: "Generic", spend: 3200 },
    ],
    leads: 65,
    leadsBySource: { metaAds: 35, googleAds: 12, websiteOrganic: 10, referrals: 5, other: 3 },
    trialsBooked: 22,
    trialsAttended: 18,
    paidConversions: 14,
    offerUsed: "None",
    discountedDeals: 3,
    avgDiscountPercent: 5,
    discountReasons: [
      { reason: "Promo", count: 1 },
      { reason: "Retention", count: 1 },
      { reason: "Competitive", count: 0 },
      { reason: "Sales override", count: 1 },
    ],
  },
  {
    market: "NZ",
    currency: "NZD",
    platform: "Meta + Website",
    totalSpend: 4800,
    campaignSpend: [
      { campaign: "Local Tutor", spend: 2800 },
      { campaign: "Retargeting", spend: 2000 },
    ],
    leads: 40,
    leadsBySource: { metaAds: 20, googleAds: 5, websiteOrganic: 10, referrals: 4, other: 1 },
    trialsBooked: 15,
    trialsAttended: 12,
    paidConversions: 9,
    offerUsed: "Free trial session",
    discountedDeals: 4,
    avgDiscountPercent: 8,
    discountReasons: [
      { reason: "Promo", count: 2 },
      { reason: "Retention", count: 1 },
      { reason: "Competitive", count: 1 },
      { reason: "Sales override", count: 0 },
    ],
  },
  {
    market: "EU",
    currency: "EUR",
    platform: "Google Ads",
    totalSpend: 6500,
    campaignSpend: [
      { campaign: "English Tutoring", spend: 4000 },
      { campaign: "Bilingual", spend: 2500 },
    ],
    leads: 55,
    leadsBySource: { metaAds: 10, googleAds: 30, websiteOrganic: 10, referrals: 3, other: 2 },
    trialsBooked: 20,
    trialsAttended: 16,
    paidConversions: 12,
    offerUsed: "Early bird 20%",
    discountedDeals: 5,
    avgDiscountPercent: 20,
    discountReasons: [
      { reason: "Promo", count: 3 },
      { reason: "Retention", count: 1 },
      { reason: "Competitive", count: 1 },
      { reason: "Sales override", count: 0 },
    ],
  },
  {
    market: "PK",
    currency: "PKR",
    platform: "Meta",
    totalSpend: 1800,
    campaignSpend: [
      { campaign: "Ramadan Campaign", spend: 1200 },
      { campaign: "General", spend: 600 },
    ],
    leads: 25,
    leadsBySource: { metaAds: 15, googleAds: 3, websiteOrganic: 5, referrals: 2, other: 0 },
    trialsBooked: 8,
    trialsAttended: 6,
    paidConversions: 4,
    offerUsed: "Ramadan 25% off",
    discountedDeals: 4,
    avgDiscountPercent: 25,
    discountReasons: [
      { reason: "Promo", count: 2 },
      { reason: "Retention", count: 1 },
      { reason: "Competitive", count: 1 },
      { reason: "Sales override", count: 0 },
    ],
  },
];

const monthOverMonth: MonthData[] = [
  { month: "Jan", totalSpend: 48000, totalPaid: 110 },
  { month: "Feb", totalSpend: 52000, totalPaid: 125 },
  { month: "Mar", totalSpend: 56000, totalPaid: 138 },
  { month: "Apr", totalSpend: 61000, totalPaid: 155 },
  { month: "May", totalSpend: 58000, totalPaid: 142 },
  { month: "Jun", totalSpend: 54200, totalPaid: 151 },
];

const CHART_COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function MarketingDashboardPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState(false);

  // In a real app, fetch data based on period; here we just use mock
  useEffect(() => {
    setLoading(true);
    // Simulate fetch
    setTimeout(() => setLoading(false), 300);
  }, [period]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Total aggregate calculations
  const totalSpend = markets.reduce((sum, m) => sum + m.totalSpend, 0);
  const totalLeads = markets.reduce((sum, m) => sum + m.leads, 0);
  const totalPaid = markets.reduce((sum, m) => sum + m.paidConversions, 0);
  const overallCAC = totalPaid > 0 ? (totalSpend / totalPaid).toFixed(0) : "0";

  // Data for charts
  const spendByMarket = markets.map((m) => ({ market: m.market, spend: m.totalSpend }));
  const leadsVsPaid = markets.map((m) => ({
    market: m.market,
    leads: m.leads,
    paid: m.paidConversions,
  }));
  const cacByMarket = markets.map((m) => ({
    market: m.market,
    cac: +(m.totalSpend / (m.paidConversions || 1)).toFixed(0),
  }));

  // Best / worst market (by paid conversions for simplicity)
  const bestMarket = markets.reduce((prev, curr) =>
    (prev.paidConversions > curr.paidConversions ? prev : curr)
  );
  const worstMarket = markets.reduce((prev, curr) =>
    (prev.paidConversions < curr.paidConversions ? prev : curr)
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h1>
          <p className="text-muted-foreground">
            Market‑wise spend, lead generation, funnel metrics &amp; CAC analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(val) => setPeriod(val as Period)}>
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
          <Button variant="outline" size="sm" onClick={() => {}}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Ad Spend"
          value={`$${totalSpend.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 5.2, isPositive: true }}
        />
        <MetricCard
          title="Total Leads Generated"
          value={totalLeads}
          icon={Users}
          trend={{ value: 8.4, isPositive: true }}
        />
        <MetricCard
          title="Total Paid Students"
          value={totalPaid}
          icon={TrendingUp}
          trend={{ value: 12.3, isPositive: true }}
        />
        <MetricCard
          title="Overall CAC"
          value={`$${overallCAC}`}
          icon={Target}
          description="per paid student"
        />
      </div>

      {/* Market-wise Spend Chart */}
            <div>
        <h2 className="text-lg font-semibold mb-4">Market‑wise Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markets.map((m) => {
            const mCAC = m.paidConversions > 0 ? (m.totalSpend / m.paidConversions).toFixed(0) : "0";
            return (
              <Card key={m.market} className="border border-border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{m.market}</p>
                    <span className="text-xs text-muted-foreground">{m.currency}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Spend:</span>
                    <span className="text-right font-medium">${m.totalSpend.toLocaleString()}</span>
                    <span className="text-muted-foreground">Leads:</span>
                    <span className="text-right">{m.leads}</span>
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="text-right">{m.paidConversions}</span>
                    <span className="text-muted-foreground">CAC:</span>
                    <span className="text-right font-bold text-indigo-600">${mCAC}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Leads & Paid by Market */}
      <Card>
        <CardHeader>
          <CardTitle>Leads vs Paid Conversions by Market</CardTitle>
          <CardDescription>Funnel top to bottom per market</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadsVsPaid}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="market" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" name="Leads" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* CAC by Market */}
      <Card>
        <CardHeader>
          <CardTitle>Cost per Acquired Student (CAC) by Market</CardTitle>
          <CardDescription>Total spend ÷ paid conversions</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cacByMarket}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="market" />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value: any) => `$${value}`} />
              <Bar dataKey="cac" radius={[4, 4, 0, 0]} fill="#f59e0b">
                {cacByMarket.map((_, idx) => (
                  <Cell key={`cac-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Market-wise Detailed Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Market‑wise Breakdown</CardTitle>
          <CardDescription>Spend, platform, leads, funnel &amp; conversion metrics</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[900px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="py-2 pr-4">Market</th>
                  <th className="py-2 pr-4">Currency</th>
                  <th className="py-2 pr-4">Platform</th>
                  <th className="py-2 pr-4">Spend</th>
                  <th className="py-2 pr-4">Leads</th>
                  <th className="py-2 pr-4">Trials Booked</th>
                  <th className="py-2 pr-4">Trials Att.</th>
                  <th className="py-2 pr-4">Paid Conv.</th>
                  <th className="py-2 pr-4">Lead→Trial %</th>
                  <th className="py-2 pr-4">Trial→Paid %</th>
                  <th className="py-2 pr-4">CPL</th>
                  <th className="py-2 pr-4">Cost/Trial</th>
                  <th className="py-2 pr-4">CAC</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((m) => {
                  const leadToTrial = m.leads > 0 ? ((m.trialsBooked / m.leads) * 100).toFixed(1) : 0;
                  const trialToPaid = m.trialsBooked > 0 ? ((m.paidConversions / m.trialsBooked) * 100).toFixed(1) : 0;
                  const cpl = m.leads > 0 ? (m.totalSpend / m.leads).toFixed(0) : "0";
                  const costPerTrial = m.trialsBooked > 0 ? (m.totalSpend / m.trialsBooked).toFixed(0) : "0";
                  const cac = m.paidConversions > 0 ? (m.totalSpend / m.paidConversions).toFixed(0) : "0";
                  return (
                    <tr key={m.market} className="border-b last:border-0">
                      <td className="py-2 font-medium">{m.market}</td>
                      <td className="py-2">{m.currency}</td>
                      <td className="py-2">{m.platform}</td>
                      <td className="py-2">${m.totalSpend.toLocaleString()}</td>
                      <td className="py-2">{m.leads}</td>
                      <td className="py-2">{m.trialsBooked}</td>
                      <td className="py-2">{m.trialsAttended}</td>
                      <td className="py-2">{m.paidConversions}</td>
                      <td className="py-2">{leadToTrial}%</td>
                      <td className="py-2">{trialToPaid}%</td>
                      <td className="py-2">${cpl}</td>
                      <td className="py-2">${costPerTrial}</td>
                      <td className="py-2 font-semibold">${cac}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Offers & Discounts per market */}
      <Card>
        <CardHeader>
          <CardTitle>Offers & Discounts</CardTitle>
          <CardDescription>Discount usage and reasons by market</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="py-2 pr-4">Market</th>
                  <th className="py-2 pr-4">Offer Used</th>
                  <th className="py-2 pr-4"># Discounted Deals</th>
                  <th className="py-2 pr-4">Avg Discount %</th>
                  <th className="py-2 pr-4">Promo</th>
                  <th className="py-2 pr-4">Retention</th>
                  <th className="py-2 pr-4">Competitive</th>
                  <th className="py-2 pr-4">Sales Override</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((m) => {
                  const reasons = m.discountReasons.reduce((acc, r) => {
                    acc[r.reason] = r.count;
                    return acc;
                  }, {} as Record<string, number>);
                  return (
                    <tr key={m.market} className="border-b last:border-0">
                      <td className="py-2 font-medium">{m.market}</td>
                      <td className="py-2">{m.offerUsed}</td>
                      <td className="py-2">{m.discountedDeals}</td>
                      <td className="py-2">{m.avgDiscountPercent}%</td>
                      <td className="py-2">{reasons["Promo"] ?? 0}</td>
                      <td className="py-2">{reasons["Retention"] ?? 0}</td>
                      <td className="py-2">{reasons["Competitive"] ?? 0}</td>
                      <td className="py-2">{reasons["Sales override"] ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Month-over-Month Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Month-over-Month Comparison</CardTitle>
          <CardDescription>Total spend & paid students over last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthOverMonth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" tickFormatter={(v) => `$${v / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="totalSpend" name="Total Spend" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="totalPaid" name="Paid Students" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Best / worst markets & improvement plans</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4">
            <p className="font-medium text-green-800 dark:text-green-200">
              🏆 Best Performing Market: {bestMarket.market}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              {bestMarket.market === "US"
                ? "Strong Google Ads performance and high conversion rate. Summer Intensive campaign drove volume."
                : `${bestMarket.market} leads with high trial-to-paid conversion and efficient spend.`}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4">
            <p className="font-medium text-red-800 dark:text-red-200">
              ⚠️ Worst Performing Market: {worstMarket.market}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              {worstMarket.market === "PK"
                ? "Low volume and high relative CAC due to limited spend scale. Ramp up budget or test new creative."
                : `${worstMarket.market} shows high CPL and low conversion. Review targeting and offer.`}
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Improvements planned for next month:</p>
            {markets.map((m) => (
              <div key={m.market} className="flex justify-between border-b pb-1 text-sm">
                <span className="font-medium">{m.market}</span>
                <span className="text-muted-foreground">
                  {m.market === "AU"
                    ? "Launch Instagram Reels ads"
                    : m.market === "US"
                    ? "Add scholarship landing page"
                    : m.market === "UK"
                    ? "Test TikTok ads"
                    : m.market === "CA"
                    ? "French keyword expansion"
                    : m.market === "EU"
                    ? "Hire local language tutor"
                    : m.market === "NZ"
                    ? "Partner with schools"
                    : "Increase budget with Urdu creatives"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Required Output */}
      <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total ad spend</p>
              <p className="text-2xl font-bold">${totalSpend.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total paid students acquired</p>
              <p className="text-2xl font-bold">{totalPaid}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CAC by market (range)</p>
              <p className="text-2xl font-bold">
                ${Math.min(...cacByMarket.map((x) => x.cac))} – ${Math.max(...cacByMarket.map((x) => x.cac))}
              </p>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            ● Market-wise rows ● One Google Sheet tab required
          </div>
        </CardContent>
      </Card>
    </div>
  );
}