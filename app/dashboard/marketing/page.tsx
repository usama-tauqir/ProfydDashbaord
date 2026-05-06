// // app/dashboard/marketing/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { MetricCard } from "@/components/dashboard/metric-card";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   DollarSign,
//   TrendingUp,
//   Users,
//   Target,
//   RefreshCw,
// } from "lucide-react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Legend,
//   LineChart,
//   Line,
// } from "recharts";

// // ----------------------------------------------------------------------
// // Types
// // ----------------------------------------------------------------------
// type Period = "all" | "today" | "weekly" | "monthly" | "yearly";
// type Market = "AU" | "UK" | "US" | "CA" | "NZ" | "EU" | "PK";

// interface MarketData {
//   market: Market;
//   currency: string;
//   platform: string;
//   totalSpend: number;
//   campaignSpend: { campaign: string; spend: number }[];
//   leads: number;
//   leadsBySource: {
//     metaAds: number;
//     googleAds: number;
//     websiteOrganic: number;
//     referrals: number;
//     other: number;
//   };
//   trialsBooked: number;
//   trialsAttended: number;
//   paidConversions: number;
//   offerUsed: string;
//   discountedDeals: number;
//   avgDiscountPercent: number;
//   discountReasons: { reason: string; count: number }[];
// }

// interface MonthData {
//   month: string;
//   totalSpend: number;
//   totalPaid: number;
// }

// // ----------------------------------------------------------------------
// // Mock data
// // ----------------------------------------------------------------------
// const markets: MarketData[] = [
//   {
//     market: "AU",
//     currency: "AUD",
//     platform: "Meta + Google",
//     totalSpend: 12400,
//     campaignSpend: [
//       { campaign: "Back to School", spend: 7000 },
//       { campaign: "Retargeting", spend: 5400 },
//     ],
//     leads: 120,
//     leadsBySource: { metaAds: 50, googleAds: 35, websiteOrganic: 20, referrals: 10, other: 5 },
//     trialsBooked: 45,
//     trialsAttended: 38,
//     paidConversions: 32,
//     offerUsed: "10% off first month",
//     discountedDeals: 12,
//     avgDiscountPercent: 10,
//     discountReasons: [
//       { reason: "Promo", count: 6 },
//       { reason: "Retention", count: 3 },
//       { reason: "Competitive", count: 2 },
//       { reason: "Sales override", count: 1 },
//     ],
//   },
//   {
//     market: "UK",
//     currency: "GBP",
//     platform: "Meta",
//     totalSpend: 8900,
//     campaignSpend: [
//       { campaign: "Tutor Launch", spend: 5000 },
//       { campaign: "Evergreen", spend: 3900 },
//     ],
//     leads: 90,
//     leadsBySource: { metaAds: 45, googleAds: 20, websiteOrganic: 15, referrals: 8, other: 2 },
//     trialsBooked: 30,
//     trialsAttended: 25,
//     paidConversions: 20,
//     offerUsed: "Free trial week",
//     discountedDeals: 8,
//     avgDiscountPercent: 12,
//     discountReasons: [
//       { reason: "Promo", count: 4 },
//       { reason: "Retention", count: 2 },
//       { reason: "Competitive", count: 1 },
//       { reason: "Sales override", count: 1 },
//     ],
//   },
//   {
//     market: "US",
//     currency: "USD",
//     platform: "Google (Search + Display)",
//     totalSpend: 15200,
//     campaignSpend: [
//       { campaign: "Summer Intensive", spend: 8200 },
//       { campaign: "SAT Prep", spend: 7000 },
//     ],
//     leads: 145,
//     leadsBySource: { metaAds: 20, googleAds: 80, websiteOrganic: 30, referrals: 10, other: 5 },
//     trialsBooked: 55,
//     trialsAttended: 48,
//     paidConversions: 40,
//     offerUsed: "15% sibling discount",
//     discountedDeals: 15,
//     avgDiscountPercent: 15,
//     discountReasons: [
//       { reason: "Promo", count: 7 },
//       { reason: "Retention", count: 4 },
//       { reason: "Competitive", count: 3 },
//       { reason: "Sales override", count: 1 },
//     ],
//   },
//   {
//     market: "CA",
//     currency: "CAD",
//     platform: "Meta",
//     totalSpend: 7200,
//     campaignSpend: [
//       { campaign: "French Immersion", spend: 4000 },
//       { campaign: "Generic", spend: 3200 },
//     ],
//     leads: 65,
//     leadsBySource: { metaAds: 35, googleAds: 12, websiteOrganic: 10, referrals: 5, other: 3 },
//     trialsBooked: 22,
//     trialsAttended: 18,
//     paidConversions: 14,
//     offerUsed: "None",
//     discountedDeals: 3,
//     avgDiscountPercent: 5,
//     discountReasons: [
//       { reason: "Promo", count: 1 },
//       { reason: "Retention", count: 1 },
//       { reason: "Competitive", count: 0 },
//       { reason: "Sales override", count: 1 },
//     ],
//   },
//   {
//     market: "NZ",
//     currency: "NZD",
//     platform: "Meta + Website",
//     totalSpend: 4800,
//     campaignSpend: [
//       { campaign: "Local Tutor", spend: 2800 },
//       { campaign: "Retargeting", spend: 2000 },
//     ],
//     leads: 40,
//     leadsBySource: { metaAds: 20, googleAds: 5, websiteOrganic: 10, referrals: 4, other: 1 },
//     trialsBooked: 15,
//     trialsAttended: 12,
//     paidConversions: 9,
//     offerUsed: "Free trial session",
//     discountedDeals: 4,
//     avgDiscountPercent: 8,
//     discountReasons: [
//       { reason: "Promo", count: 2 },
//       { reason: "Retention", count: 1 },
//       { reason: "Competitive", count: 1 },
//       { reason: "Sales override", count: 0 },
//     ],
//   },
//   {
//     market: "EU",
//     currency: "EUR",
//     platform: "Google Ads",
//     totalSpend: 6500,
//     campaignSpend: [
//       { campaign: "English Tutoring", spend: 4000 },
//       { campaign: "Bilingual", spend: 2500 },
//     ],
//     leads: 55,
//     leadsBySource: { metaAds: 10, googleAds: 30, websiteOrganic: 10, referrals: 3, other: 2 },
//     trialsBooked: 20,
//     trialsAttended: 16,
//     paidConversions: 12,
//     offerUsed: "Early bird 20%",
//     discountedDeals: 5,
//     avgDiscountPercent: 20,
//     discountReasons: [
//       { reason: "Promo", count: 3 },
//       { reason: "Retention", count: 1 },
//       { reason: "Competitive", count: 1 },
//       { reason: "Sales override", count: 0 },
//     ],
//   },
//   {
//     market: "PK",
//     currency: "PKR",
//     platform: "Meta",
//     totalSpend: 1800,
//     campaignSpend: [
//       { campaign: "Ramadan Campaign", spend: 1200 },
//       { campaign: "General", spend: 600 },
//     ],
//     leads: 25,
//     leadsBySource: { metaAds: 15, googleAds: 3, websiteOrganic: 5, referrals: 2, other: 0 },
//     trialsBooked: 8,
//     trialsAttended: 6,
//     paidConversions: 4,
//     offerUsed: "Ramadan 25% off",
//     discountedDeals: 4,
//     avgDiscountPercent: 25,
//     discountReasons: [
//       { reason: "Promo", count: 2 },
//       { reason: "Retention", count: 1 },
//       { reason: "Competitive", count: 1 },
//       { reason: "Sales override", count: 0 },
//     ],
//   },
// ];

// const monthOverMonth: MonthData[] = [
//   { month: "Jan", totalSpend: 48000, totalPaid: 110 },
//   { month: "Feb", totalSpend: 52000, totalPaid: 125 },
//   { month: "Mar", totalSpend: 56000, totalPaid: 138 },
//   { month: "Apr", totalSpend: 61000, totalPaid: 155 },
//   { month: "May", totalSpend: 58000, totalPaid: 142 },
//   { month: "Jun", totalSpend: 54200, totalPaid: 151 },
// ];

// const CHART_COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

// // ----------------------------------------------------------------------
// // Main Component
// // ----------------------------------------------------------------------
// export default function MarketingDashboardPage() {
//   const [period, setPeriod] = useState<Period>("monthly");
//   const [loading, setLoading] = useState(false);

//   // In a real app, fetch data based on period; here we just use mock
//   useEffect(() => {
//     setLoading(true);
//     // Simulate fetch
//     setTimeout(() => setLoading(false), 300);
//   }, [period]);

//   if (loading) {
//     return (
//       <div className="flex h-96 items-center justify-center">
//         <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
//       </div>
//     );
//   }

//   // Total aggregate calculations
//   const totalSpend = markets.reduce((sum, m) => sum + m.totalSpend, 0);
//   const totalLeads = markets.reduce((sum, m) => sum + m.leads, 0);
//   const totalPaid = markets.reduce((sum, m) => sum + m.paidConversions, 0);
//   const overallCAC = totalPaid > 0 ? (totalSpend / totalPaid).toFixed(0) : "0";

//   // Data for charts
//   const spendByMarket = markets.map((m) => ({ market: m.market, spend: m.totalSpend }));
//   const leadsVsPaid = markets.map((m) => ({
//     market: m.market,
//     leads: m.leads,
//     paid: m.paidConversions,
//   }));
//   const cacByMarket = markets.map((m) => ({
//     market: m.market,
//     cac: +(m.totalSpend / (m.paidConversions || 1)).toFixed(0),
//   }));

//   // Best / worst market (by paid conversions for simplicity)
//   const bestMarket = markets.reduce((prev, curr) =>
//     (prev.paidConversions > curr.paidConversions ? prev : curr)
//   );
//   const worstMarket = markets.reduce((prev, curr) =>
//     (prev.paidConversions < curr.paidConversions ? prev : curr)
//   );

//   return (
//     <div className="space-y-8 p-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h1>
//           <p className="text-muted-foreground">
//             Market‑wise spend, lead generation, funnel metrics &amp; CAC analysis.
//           </p>
//         </div>
//         <div className="flex items-center gap-3">
//           <Select value={period} onValueChange={(val) => setPeriod(val as Period)}>
//             <SelectTrigger className="w-[140px]">
//               <SelectValue placeholder="Period" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Time</SelectItem>
//               <SelectItem value="today">Today</SelectItem>
//               <SelectItem value="weekly">This Week</SelectItem>
//               <SelectItem value="monthly">This Month</SelectItem>
//               <SelectItem value="yearly">This Year</SelectItem>
//             </SelectContent>
//           </Select>
//           <Button variant="outline" size="sm" onClick={() => {}}>
//             <RefreshCw className="mr-2 h-4 w-4" />
//             Refresh
//           </Button>
//         </div>
//       </div>

//       {/* Top Summary Cards */}
//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         <MetricCard
//           title="Total Ad Spend"
//           value={`$${totalSpend.toLocaleString()}`}
//           icon={DollarSign}
//           trend={{ value: 5.2, isPositive: true }}
//         />
//         <MetricCard
//           title="Total Leads Generated"
//           value={totalLeads}
//           icon={Users}
//           trend={{ value: 8.4, isPositive: true }}
//         />
//         <MetricCard
//           title="Total Paid Students"
//           value={totalPaid}
//           icon={TrendingUp}
//           trend={{ value: 12.3, isPositive: true }}
//         />
//         <MetricCard
//           title="Overall CAC"
//           value={`$${overallCAC}`}
//           icon={Target}
//           description="per paid student"
//         />
//       </div>

//       {/* Market-wise Spend Chart */}
//             <div>
//         <h2 className="text-lg font-semibold mb-4">Market‑wise Overview</h2>
//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {markets.map((m) => {
//             const mCAC = m.paidConversions > 0 ? (m.totalSpend / m.paidConversions).toFixed(0) : "0";
//             return (
//               <Card key={m.market} className="border border-border">
//                 <CardContent className="p-4 space-y-2">
//                   <div className="flex items-center justify-between">
//                     <p className="font-semibold">{m.market}</p>
//                     <span className="text-xs text-muted-foreground">{m.currency}</span>
//                   </div>
//                   <div className="grid grid-cols-2 gap-y-1 text-sm">
//                     <span className="text-muted-foreground">Spend:</span>
//                     <span className="text-right font-medium">${m.totalSpend.toLocaleString()}</span>
//                     <span className="text-muted-foreground">Leads:</span>
//                     <span className="text-right">{m.leads}</span>
//                     <span className="text-muted-foreground">Paid:</span>
//                     <span className="text-right">{m.paidConversions}</span>
//                     <span className="text-muted-foreground">CAC:</span>
//                     <span className="text-right font-bold text-indigo-600">${mCAC}</span>
//                   </div>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       </div>

//       {/* Leads & Paid by Market */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Leads vs Paid Conversions by Market</CardTitle>
//           <CardDescription>Funnel top to bottom per market</CardDescription>
//         </CardHeader>
//         <CardContent className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={leadsVsPaid}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} />
//               <XAxis dataKey="market" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="leads" name="Leads" fill="#4f46e5" radius={[4, 4, 0, 0]} />
//               <Bar dataKey="paid" name="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>

//       {/* CAC by Market */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Cost per Acquired Student (CAC) by Market</CardTitle>
//           <CardDescription>Total spend ÷ paid conversions</CardDescription>
//         </CardHeader>
//         <CardContent className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={cacByMarket}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} />
//               <XAxis dataKey="market" />
//               <YAxis tickFormatter={(v) => `$${v}`} />
//               <Tooltip formatter={(value: any) => `$${value}`} />
//               <Bar dataKey="cac" radius={[4, 4, 0, 0]} fill="#f59e0b">
//                 {cacByMarket.map((_, idx) => (
//                   <Cell key={`cac-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
//                 ))}
//               </Bar>
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>

//       {/* Market-wise Detailed Tables */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Market‑wise Breakdown</CardTitle>
//           <CardDescription>Spend, platform, leads, funnel &amp; conversion metrics</CardDescription>
//         </CardHeader>
//         <CardContent className="overflow-x-auto">
//           <div className="min-w-[900px]">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b text-left text-xs font-medium text-muted-foreground">
//                   <th className="py-2 pr-4">Market</th>
//                   <th className="py-2 pr-4">Currency</th>
//                   <th className="py-2 pr-4">Platform</th>
//                   <th className="py-2 pr-4">Spend</th>
//                   <th className="py-2 pr-4">Leads</th>
//                   <th className="py-2 pr-4">Trials Booked</th>
//                   <th className="py-2 pr-4">Trials Att.</th>
//                   <th className="py-2 pr-4">Paid Conv.</th>
//                   <th className="py-2 pr-4">Lead→Trial %</th>
//                   <th className="py-2 pr-4">Trial→Paid %</th>
//                   <th className="py-2 pr-4">CPL</th>
//                   <th className="py-2 pr-4">Cost/Trial</th>
//                   <th className="py-2 pr-4">CAC</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {markets.map((m) => {
//                   const leadToTrial = m.leads > 0 ? ((m.trialsBooked / m.leads) * 100).toFixed(1) : 0;
//                   const trialToPaid = m.trialsBooked > 0 ? ((m.paidConversions / m.trialsBooked) * 100).toFixed(1) : 0;
//                   const cpl = m.leads > 0 ? (m.totalSpend / m.leads).toFixed(0) : "0";
//                   const costPerTrial = m.trialsBooked > 0 ? (m.totalSpend / m.trialsBooked).toFixed(0) : "0";
//                   const cac = m.paidConversions > 0 ? (m.totalSpend / m.paidConversions).toFixed(0) : "0";
//                   return (
//                     <tr key={m.market} className="border-b last:border-0">
//                       <td className="py-2 font-medium">{m.market}</td>
//                       <td className="py-2">{m.currency}</td>
//                       <td className="py-2">{m.platform}</td>
//                       <td className="py-2">${m.totalSpend.toLocaleString()}</td>
//                       <td className="py-2">{m.leads}</td>
//                       <td className="py-2">{m.trialsBooked}</td>
//                       <td className="py-2">{m.trialsAttended}</td>
//                       <td className="py-2">{m.paidConversions}</td>
//                       <td className="py-2">{leadToTrial}%</td>
//                       <td className="py-2">{trialToPaid}%</td>
//                       <td className="py-2">${cpl}</td>
//                       <td className="py-2">${costPerTrial}</td>
//                       <td className="py-2 font-semibold">${cac}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Offers & Discounts per market */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Offers & Discounts</CardTitle>
//           <CardDescription>Discount usage and reasons by market</CardDescription>
//         </CardHeader>
//         <CardContent className="overflow-x-auto">
//           <div className="min-w-[800px]">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b text-left text-xs font-medium text-muted-foreground">
//                   <th className="py-2 pr-4">Market</th>
//                   <th className="py-2 pr-4">Offer Used</th>
//                   <th className="py-2 pr-4"># Discounted Deals</th>
//                   <th className="py-2 pr-4">Avg Discount %</th>
//                   <th className="py-2 pr-4">Promo</th>
//                   <th className="py-2 pr-4">Retention</th>
//                   <th className="py-2 pr-4">Competitive</th>
//                   <th className="py-2 pr-4">Sales Override</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {markets.map((m) => {
//                   const reasons = m.discountReasons.reduce((acc, r) => {
//                     acc[r.reason] = r.count;
//                     return acc;
//                   }, {} as Record<string, number>);
//                   return (
//                     <tr key={m.market} className="border-b last:border-0">
//                       <td className="py-2 font-medium">{m.market}</td>
//                       <td className="py-2">{m.offerUsed}</td>
//                       <td className="py-2">{m.discountedDeals}</td>
//                       <td className="py-2">{m.avgDiscountPercent}%</td>
//                       <td className="py-2">{reasons["Promo"] ?? 0}</td>
//                       <td className="py-2">{reasons["Retention"] ?? 0}</td>
//                       <td className="py-2">{reasons["Competitive"] ?? 0}</td>
//                       <td className="py-2">{reasons["Sales override"] ?? 0}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Month-over-Month Comparison */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Month-over-Month Comparison</CardTitle>
//           <CardDescription>Total spend & paid students over last 6 months</CardDescription>
//         </CardHeader>
//         <CardContent className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={monthOverMonth}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} />
//               <XAxis dataKey="month" />
//               <YAxis yAxisId="left" tickFormatter={(v) => `$${v / 1000}k`} />
//               <YAxis yAxisId="right" orientation="right" />
//               <Tooltip />
//               <Legend />
//               <Bar yAxisId="left" dataKey="totalSpend" name="Total Spend" fill="#4f46e5" radius={[4, 4, 0, 0]} />
//               <Bar yAxisId="right" dataKey="totalPaid" name="Paid Students" fill="#10b981" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>

//       {/* Performance Summary */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Performance Summary</CardTitle>
//           <CardDescription>Best / worst markets & improvement plans</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4">
//             <p className="font-medium text-green-800 dark:text-green-200">
//               🏆 Best Performing Market: {bestMarket.market}
//             </p>
//             <p className="text-sm text-green-700 dark:text-green-300">
//               {bestMarket.market === "US"
//                 ? "Strong Google Ads performance and high conversion rate. Summer Intensive campaign drove volume."
//                 : `${bestMarket.market} leads with high trial-to-paid conversion and efficient spend.`}
//             </p>
//           </div>
//           <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4">
//             <p className="font-medium text-red-800 dark:text-red-200">
//               ⚠️ Worst Performing Market: {worstMarket.market}
//             </p>
//             <p className="text-sm text-red-700 dark:text-red-300">
//               {worstMarket.market === "PK"
//                 ? "Low volume and high relative CAC due to limited spend scale. Ramp up budget or test new creative."
//                 : `${worstMarket.market} shows high CPL and low conversion. Review targeting and offer.`}
//             </p>
//           </div>
//           <div className="space-y-2">
//             <p className="font-medium">Improvements planned for next month:</p>
//             {markets.map((m) => (
//               <div key={m.market} className="flex justify-between border-b pb-1 text-sm">
//                 <span className="font-medium">{m.market}</span>
//                 <span className="text-muted-foreground">
//                   {m.market === "AU"
//                     ? "Launch Instagram Reels ads"
//                     : m.market === "US"
//                     ? "Add scholarship landing page"
//                     : m.market === "UK"
//                     ? "Test TikTok ads"
//                     : m.market === "CA"
//                     ? "French keyword expansion"
//                     : m.market === "EU"
//                     ? "Hire local language tutor"
//                     : m.market === "NZ"
//                     ? "Partner with schools"
//                     : "Increase budget with Urdu creatives"}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Required Output */}
//       <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20">
//         <CardContent className="p-6">
//           <div className="grid gap-4 md:grid-cols-3">
//             <div>
//               <p className="text-sm font-medium text-muted-foreground">Total ad spend</p>
//               <p className="text-2xl font-bold">${totalSpend.toLocaleString()}</p>
//             </div>
//             <div>
//               <p className="text-sm font-medium text-muted-foreground">Total paid students acquired</p>
//               <p className="text-2xl font-bold">{totalPaid}</p>
//             </div>
//             <div>
//               <p className="text-sm font-medium text-muted-foreground">CAC by market (range)</p>
//               <p className="text-2xl font-bold">
//                 ${Math.min(...cacByMarket.map((x) => x.cac))} – ${Math.max(...cacByMarket.map((x) => x.cac))}
//               </p>
//             </div>
//           </div>
//           <div className="mt-4 text-xs text-muted-foreground">
//             ● Market-wise rows ● One Google Sheet tab required
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  BarChart3,
  CircleDollarSign,
  Megaphone,
  Minus,
  PieChart as PieChartIcon,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

type MarketCode = "AU" | "UK" | "US" | "CA" | "NZ" | "EU" | "PK";
type CurrencyCode = "AUD" | "GBP" | "USD" | "CAD" | "NZD" | "EUR" | "PKR";

type SourceBreakdown = {
  metaAds: number;
  googleAds: number;
  websiteOrganic: number;
  referrals: number;
  other: number;
  otherLabel: string;
};

type CampaignSpend = {
  name: string;
  platform: string;
  spend: number;
};

type MarketData = {
  market: MarketCode;
  currency: CurrencyCode;
  currentSpend: number;
  previousSpend: number;
  previousPaidStudents: number;
  campaigns: CampaignSpend[];
  sources: SourceBreakdown;
  leads: number;
  trialsBooked: number;
  trialsAttended: number;
  paidConversions: number;
  offerUsed: string;
  discountedDeals: number;
  averageDiscount: number;
  discountReasons: string[];
  improvementPlan: string;
};

type MarketMetrics = MarketData & {
  leadToTrial: number;
  trialToPaid: number;
  cpl: number;
  costPerTrial: number;
  cac: number;
  momSpendChange: number;
  momPaidChange: number;
};

const CHART_COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
const SOFT_COLORS = ["#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5"];

const MARKET_DATA: MarketData[] = [
  {
    market: "AU",
    currency: "AUD",
    currentSpend: 18450,
    previousSpend: 16900,
    previousPaidStudents: 42,
    campaigns: [
      { name: "Meta Trial Leads", platform: "Meta", spend: 8200 },
      { name: "Google Search High Intent", platform: "Google", spend: 7250 },
      { name: "Retargeting Always-on", platform: "Meta", spend: 3000 },
    ],
    sources: {
      metaAds: 420,
      googleAds: 310,
      websiteOrganic: 135,
      referrals: 42,
      other: 18,
      otherLabel: "WhatsApp",
    },
    leads: 925,
    trialsBooked: 238,
    trialsAttended: 183,
    paidConversions: 55,
    offerUsed: "Back-to-school 12% off",
    discountedDeals: 31,
    averageDiscount: 12,
    discountReasons: ["Promo", "Competitive"],
    improvementPlan: "Scale Google exact-match campaigns and reduce low-intent Meta ad sets.",
  },
  {
    market: "UK",
    currency: "GBP",
    currentSpend: 14200,
    previousSpend: 15350,
    previousPaidStudents: 39,
    campaigns: [
      { name: "GCSE Search", platform: "Google", spend: 6400 },
      { name: "Parent Lookalike", platform: "Meta", spend: 5100 },
      { name: "Remarketing Trial Push", platform: "Meta", spend: 2700 },
    ],
    sources: {
      metaAds: 318,
      googleAds: 284,
      websiteOrganic: 112,
      referrals: 35,
      other: 21,
      otherLabel: "Partner webinar",
    },
    leads: 770,
    trialsBooked: 204,
    trialsAttended: 148,
    paidConversions: 43,
    offerUsed: "Free first assessment",
    discountedDeals: 24,
    averageDiscount: 10,
    discountReasons: ["Promo", "Sales override"],
    improvementPlan: "Improve trial attendance with SMS reminders and tighter sales follow-up SLAs.",
  },
  {
    market: "US",
    currency: "USD",
    currentSpend: 22700,
    previousSpend: 20100,
    previousPaidStudents: 48,
    campaigns: [
      { name: "SAT Prep Search", platform: "Google", spend: 9600 },
      { name: "Meta Parent Interest", platform: "Meta", spend: 7600 },
      { name: "YouTube Trial Intent", platform: "Google", spend: 5500 },
    ],
    sources: {
      metaAds: 505,
      googleAds: 442,
      websiteOrganic: 160,
      referrals: 58,
      other: 35,
      otherLabel: "TikTok",
    },
    leads: 1200,
    trialsBooked: 305,
    trialsAttended: 229,
    paidConversions: 64,
    offerUsed: "Limited 15% enrollment offer",
    discountedDeals: 46,
    averageDiscount: 15,
    discountReasons: ["Promo", "Competitive", "Sales override"],
    improvementPlan: "Shift more budget into SAT keyword clusters with lower CAC and stronger trial quality.",
  },
  {
    market: "CA",
    currency: "CAD",
    currentSpend: 9600,
    previousSpend: 10450,
    previousPaidStudents: 27,
    campaigns: [
      { name: "Ontario Search", platform: "Google", spend: 4300 },
      { name: "Meta Parent Leads", platform: "Meta", spend: 3800 },
      { name: "Brand Retargeting", platform: "Google", spend: 1500 },
    ],
    sources: {
      metaAds: 221,
      googleAds: 196,
      websiteOrganic: 84,
      referrals: 24,
      other: 10,
      otherLabel: "Email list",
    },
    leads: 535,
    trialsBooked: 126,
    trialsAttended: 98,
    paidConversions: 29,
    offerUsed: "Sibling discount",
    discountedDeals: 18,
    averageDiscount: 8,
    discountReasons: ["Retention", "Promo"],
    improvementPlan: "Add province-specific landing pages to improve lead-to-trial conversion.",
  },
  {
    market: "NZ",
    currency: "NZD",
    currentSpend: 5200,
    previousSpend: 4800,
    previousPaidStudents: 15,
    campaigns: [
      { name: "Auckland Parent Leads", platform: "Meta", spend: 2300 },
      { name: "Math Tuition Search", platform: "Google", spend: 2100 },
      { name: "Referral Booster", platform: "Other", spend: 800 },
    ],
    sources: {
      metaAds: 132,
      googleAds: 96,
      websiteOrganic: 48,
      referrals: 34,
      other: 9,
      otherLabel: "Community groups",
    },
    leads: 319,
    trialsBooked: 83,
    trialsAttended: 66,
    paidConversions: 19,
    offerUsed: "Referral credit",
    discountedDeals: 12,
    averageDiscount: 7,
    discountReasons: ["Referral", "Retention"],
    improvementPlan: "Increase referral incentive visibility and test Meta creatives by city.",
  },
  {
    market: "EU",
    currency: "EUR",
    currentSpend: 12800,
    previousSpend: 11950,
    previousPaidStudents: 33,
    campaigns: [
      { name: "EU Search Core", platform: "Google", spend: 5800 },
      { name: "Meta Multilingual Leads", platform: "Meta", spend: 4700 },
      { name: "Retargeting Bundle", platform: "Meta", spend: 2300 },
    ],
    sources: {
      metaAds: 284,
      googleAds: 240,
      websiteOrganic: 118,
      referrals: 30,
      other: 18,
      otherLabel: "LinkedIn",
    },
    leads: 690,
    trialsBooked: 172,
    trialsAttended: 124,
    paidConversions: 36,
    offerUsed: "Localized landing-page promo",
    discountedDeals: 21,
    averageDiscount: 9,
    discountReasons: ["Promo", "Competitive"],
    improvementPlan: "Localize ad copy for top countries and separate German/French campaigns.",
  },
  {
    market: "PK",
    currency: "PKR",
    currentSpend: 1620000,
    previousSpend: 1410000,
    previousPaidStudents: 72,
    campaigns: [
      { name: "Meta Parent Lead Forms", platform: "Meta", spend: 760000 },
      { name: "Google Search Tuition", platform: "Google", spend: 510000 },
      { name: "Influencer Trial Push", platform: "Other", spend: 350000 },
    ],
    sources: {
      metaAds: 980,
      googleAds: 640,
      websiteOrganic: 260,
      referrals: 150,
      other: 90,
      otherLabel: "Influencer",
    },
    leads: 2120,
    trialsBooked: 568,
    trialsAttended: 431,
    paidConversions: 88,
    offerUsed: "Ramadan bundle + installment plan",
    discountedDeals: 64,
    averageDiscount: 18,
    discountReasons: ["Promo", "Sales override", "Retention"],
    improvementPlan: "Improve paid conversion through affordability messaging and installment-plan retargeting.",
  },
];

function normalizeSpend(value: number, currency: CurrencyCode) {
  const rates: Record<CurrencyCode, number> = {
    AUD: 0.66,
    GBP: 1.25,
    USD: 1,
    CAD: 0.73,
    NZD: 0.61,
    EUR: 1.08,
    PKR: 0.0036,
  };

  return Math.round(value * rates[currency]);
}

function calculateMetrics(market: MarketData): MarketMetrics {
  const leadToTrial = market.leads ? (market.trialsBooked / market.leads) * 100 : 0;
  const trialToPaid = market.trialsAttended ? (market.paidConversions / market.trialsAttended) * 100 : 0;
  const cpl = market.leads ? market.currentSpend / market.leads : 0;
  const costPerTrial = market.trialsBooked ? market.currentSpend / market.trialsBooked : 0;
  const cac = market.paidConversions ? market.currentSpend / market.paidConversions : 0;
  const momSpendChange = market.previousSpend ? ((market.currentSpend - market.previousSpend) / market.previousSpend) * 100 : 0;
  const momPaidChange = market.previousPaidStudents ? ((market.paidConversions - market.previousPaidStudents) / market.previousPaidStudents) * 100 : 0;

  return {
    ...market,
    leadToTrial,
    trialToPaid,
    cpl,
    costPerTrial,
    cac,
    momSpendChange,
    momPaidChange,
  };
}

const markets = MARKET_DATA.map(calculateMetrics);

const totals = markets.reduce(
  (acc, market) => {
    acc.totalSpendUsdEquivalent += normalizeSpend(market.currentSpend, market.currency);
    acc.previousSpendUsdEquivalent += normalizeSpend(market.previousSpend, market.currency);
    acc.totalPaidStudents += market.paidConversions;
    acc.previousPaidStudents += market.previousPaidStudents;
    acc.totalLeads += market.leads;
    acc.totalTrials += market.trialsBooked;
    acc.totalAttended += market.trialsAttended;
    return acc;
  },
  {
    totalSpendUsdEquivalent: 0,
    previousSpendUsdEquivalent: 0,
    totalPaidStudents: 0,
    previousPaidStudents: 0,
    totalLeads: 0,
    totalTrials: 0,
    totalAttended: 0,
  }
);

const bestMarket = [...markets].sort((a, b) => a.cac - b.cac)[0];
const worstMarket = [...markets].sort((a, b) => b.cac - a.cac)[0];

const sourceTotals = markets.reduce(
  (acc, market) => {
    acc.metaAds += market.sources.metaAds;
    acc.googleAds += market.sources.googleAds;
    acc.websiteOrganic += market.sources.websiteOrganic;
    acc.referrals += market.sources.referrals;
    acc.other += market.sources.other;
    return acc;
  },
  {
    metaAds: 0,
    googleAds: 0,
    websiteOrganic: 0,
    referrals: 0,
    other: 0,
  }
);

const sourceChartData = [
  { name: "Meta Ads", value: sourceTotals.metaAds },
  { name: "Google Ads", value: sourceTotals.googleAds },
  { name: "Website / Organic", value: sourceTotals.websiteOrganic },
  { name: "Referrals", value: sourceTotals.referrals },
  { name: "Other", value: sourceTotals.other },
];

const spendChartData = markets.map((market) => ({
  market: market.market,
  spend: normalizeSpend(market.currentSpend, market.currency),
  previous: normalizeSpend(market.previousSpend, market.currency),
  paidStudents: market.paidConversions,
}));

const funnelChartData = markets.map((market) => ({
  market: market.market,
  leads: market.leads,
  trials: market.trialsBooked,
  attended: market.trialsAttended,
  paid: market.paidConversions,
}));

const cacChartData = markets.map((market) => ({
  market: market.market,
  cac: market.cac,
}));

function money(value: number, currency: CurrencyCode | "USD" = "USD", compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value || 0);
}

function toChartNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (Array.isArray(value)) return Number(value[0]) || 0;
  return 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function percentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function plainPercentage(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function TrendBadge({
  direction,
  label,
}: {
  direction: "up" | "down" | "neutral";
  label: string;
}) {
  const config = {
    up: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: ArrowUpRight,
    },
    down: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-700 dark:text-red-300",
      icon: ArrowDownRight,
    },
    neutral: {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-600 dark:text-gray-400",
      icon: Minus,
    },
  };

  const { bg, text, icon: Icon } = config[direction];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${bg} ${text}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
      <Icon className="h-5 w-5 text-indigo-600" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  highlight = false,
  variant = "default",
  children,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: React.ReactNode;
  highlight?: boolean;
  variant?: "default" | "outline" | "warning";
  children?: React.ReactNode;
}) {
  const variantStyles = {
    default: "bg-card border-border",
    outline: "bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700",
    warning: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
  };

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        highlight ? "ring-1 ring-indigo-200 dark:ring-indigo-800" : ""
      } ${variantStyles[variant]}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
            {trend && <div className="mt-2">{trend}</div>}
            {children}
          </div>
          <div className="ml-3 rounded-full bg-muted/60 p-2.5">
            <Icon className="h-5 w-5 text-indigo-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCards() {
  const momPaid = ((totals.totalPaidStudents - totals.previousPaidStudents) / totals.previousPaidStudents) * 100;
  const momSpend = ((totals.totalSpendUsdEquivalent - totals.previousSpendUsdEquivalent) / totals.previousSpendUsdEquivalent) * 100;
  const blendedCAC = totals.totalSpendUsdEquivalent / totals.totalPaidStudents;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <MetricCard
        title="Total ad spend"
        value={money(totals.totalSpendUsdEquivalent, "USD", true)}
        icon={WalletCards}
        subtitle="USD equivalent across all markets"
        trend={<TrendBadge direction={momSpend <= 0 ? "up" : "down"} label={`${percentage(momSpend)} MoM`} />}
        highlight
      />
      <MetricCard
        title="Total leads"
        value={formatNumber(totals.totalLeads)}
        icon={Users}
        subtitle={`${plainPercentage((totals.totalTrials / totals.totalLeads) * 100)} lead → trial`}
        trend={<TrendBadge direction="neutral" label="All sources" />}
      />
      <MetricCard
        title="Paid students"
        value={formatNumber(totals.totalPaidStudents)}
        icon={Target}
        subtitle={`${formatNumber(totals.totalAttended)} trials attended`}
        trend={<TrendBadge direction={momPaid >= 0 ? "up" : "down"} label={`${percentage(momPaid)} MoM`} />}
      />
      <MetricCard
        title="Blended CAC"
        value={money(blendedCAC, "USD")}
        icon={CircleDollarSign}
        subtitle="Total spend / paid students"
        trend={<TrendBadge direction={blendedCAC < 350 ? "up" : "down"} label="USD equivalent" />}
      />
      <MetricCard
        title="Best market"
        value={bestMarket.market}
        icon={Trophy}
        subtitle={`${money(bestMarket.cac, bestMarket.currency)} CAC`}
        trend={<TrendBadge direction="up" label="Lowest CAC" />}
        variant="outline"
      />
    </div>
  );
}

function MarketWiseSpend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Marketing Spend by Market</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={spendChartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="market" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => money(Number(value), "USD", true)} />
            <Tooltip
              formatter={(value: unknown, name: unknown) => [
                money(toChartNumber(value), "USD"),
                name === "spend" ? "Current Spend" : name === "previous" ? "Previous Spend" : "Paid Students",
              ]}
            />
            <Legend />
            <Bar dataKey="previous" name="Previous Spend" fill="#c7d2fe" radius={[4, 4, 0, 0]} barSize={22} />
            <Bar dataKey="spend" name="Current Spend" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={22} />
            <Line dataKey="paidStudents" name="Paid Students" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function LeadSources() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lead Generation by Source</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sourceChartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={95}
              innerRadius={52}
              label={({ name, percent }) => `${String(name || "")}: ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {sourceChartData.map((_, index) => (
                <Cell key={`source-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: unknown) => [formatNumber(toChartNumber(value)), "Leads"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function FunnelPerformance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Funnel Performance by Market</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelChartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="market" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: unknown) => [formatNumber(toChartNumber(value)), ""]} />
            <Legend />
            <Bar dataKey="leads" name="Leads" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
            <Bar dataKey="trials" name="Trials Booked" fill="#818cf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="attended" name="Trials Attended" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="paid" name="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function CacByMarket() {
  const maxCac = Math.max(...markets.map((item) => item.cac));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">CAC by Market</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {markets.map((market) => (
            <div key={market.market} className="grid grid-cols-[42px_1fr_96px] items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground">{market.market}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${Math.max((market.cac / maxCac) * 100, 8)}%` }}
                />
              </div>
              <span className="text-right text-xs font-semibold">{money(market.cac, market.currency)}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Lowest CAC:</strong> {bestMarket.market} at {money(bestMarket.cac, bestMarket.currency)}. <strong className="text-foreground">Highest CAC:</strong> {worstMarket.market} at {money(worstMarket.cac, worstMarket.currency)}.
        </div>
      </CardContent>
    </Card>
  );
}

function ConversionMetricsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conversion Metrics — Calculated</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Market</th>
                <th className="px-4 py-3 font-semibold">Currency</th>
                <th className="px-4 py-3 font-semibold">Spend</th>
                <th className="px-4 py-3 font-semibold">Leads</th>
                <th className="px-4 py-3 font-semibold">Trials</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Lead → Trial</th>
                <th className="px-4 py-3 font-semibold">Trial → Paid</th>
                <th className="px-4 py-3 font-semibold">CPL</th>
                <th className="px-4 py-3 font-semibold">Cost / Trial</th>
                <th className="px-4 py-3 font-semibold">CAC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {markets.map((market) => (
                <tr key={market.market} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold">{market.market}</td>
                  <td className="px-4 py-3">{market.currency}</td>
                  <td className="px-4 py-3">{money(market.currentSpend, market.currency)}</td>
                  <td className="px-4 py-3">{formatNumber(market.leads)}</td>
                  <td className="px-4 py-3">{formatNumber(market.trialsBooked)}</td>
                  <td className="px-4 py-3 font-semibold">{formatNumber(market.paidConversions)}</td>
                  <td className="px-4 py-3">{plainPercentage(market.leadToTrial)}</td>
                  <td className="px-4 py-3">{plainPercentage(market.trialToPaid)}</td>
                  <td className="px-4 py-3">{money(market.cpl, market.currency)}</td>
                  <td className="px-4 py-3">{money(market.costPerTrial, market.currency)}</td>
                  <td className="px-4 py-3 font-semibold text-indigo-600">{money(market.cac, market.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignSpendCards() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Campaign-wise Spend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {markets.map((market) => (
            <div key={market.market} className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{market.market}</p>
                  <p className="text-xs text-muted-foreground">Total: {money(market.currentSpend, market.currency)}</p>
                </div>
                <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                  {market.currency}
                </span>
              </div>
              <div className="space-y-3">
                {market.campaigns.map((campaign) => {
                  const width = (campaign.spend / market.currentSpend) * 100;
                  return (
                    <div key={campaign.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-medium">{campaign.name}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {campaign.platform} · {money(campaign.spend, market.currency)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-background">
                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OffersDiscounts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Offers & Discounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {markets.map((market) => (
            <div key={market.market} className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{market.market} · {market.offerUsed}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {market.discountedDeals} discounted deals · Avg. {market.averageDiscount}% discount
                  </p>
                </div>
                <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                  {market.discountReasons.length} reasons
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {market.discountReasons.map((reason) => (
                  <span key={reason} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MarketLeadBreakdown() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lead Source Breakdown — Market-wise</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Market</th>
                <th className="px-4 py-3 font-semibold">Total Leads</th>
                <th className="px-4 py-3 font-semibold">Meta Ads</th>
                <th className="px-4 py-3 font-semibold">Google Ads</th>
                <th className="px-4 py-3 font-semibold">Website / Organic</th>
                <th className="px-4 py-3 font-semibold">Referrals</th>
                <th className="px-4 py-3 font-semibold">Other</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {markets.map((market) => (
                <tr key={market.market} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold">{market.market}</td>
                  <td className="px-4 py-3 font-semibold">{formatNumber(market.leads)}</td>
                  <td className="px-4 py-3">{formatNumber(market.sources.metaAds)}</td>
                  <td className="px-4 py-3">{formatNumber(market.sources.googleAds)}</td>
                  <td className="px-4 py-3">{formatNumber(market.sources.websiteOrganic)}</td>
                  <td className="px-4 py-3">{formatNumber(market.sources.referrals)}</td>
                  <td className="px-4 py-3">{formatNumber(market.sources.other)} · {market.sources.otherLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthOverMonth() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Month-over-Month Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {markets.map((market) => {
            const spendPositive = market.momSpendChange <= 0;
            const paidPositive = market.momPaidChange >= 0;
            return (
              <div key={market.market} className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">{market.market}</span>
                  <span className="rounded-md bg-background px-2 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border">
                    {market.currency}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-background p-3 ring-1 ring-border">
                    <p className="text-xs text-muted-foreground">Spend MoM</p>
                    <p className={spendPositive ? "mt-1 text-lg font-semibold text-emerald-600" : "mt-1 text-lg font-semibold text-red-600"}>
                      {percentage(market.momSpendChange)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background p-3 ring-1 ring-border">
                    <p className="text-xs text-muted-foreground">Paid Students MoM</p>
                    <p className={paidPositive ? "mt-1 text-lg font-semibold text-emerald-600" : "mt-1 text-lg font-semibold text-red-600"}>
                      {percentage(market.momPaidChange)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CacTrend() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">CAC Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cacChartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="cacFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="market" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: unknown) => [money(toChartNumber(value)), "CAC"]} />
            <Area type="monotone" dataKey="cac" stroke="#4f46e5" fill="url(#cacFill)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function PerformanceSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <p className="font-semibold text-emerald-950 dark:text-emerald-200">Best performing market: {bestMarket.market}</p>
          <p className="mt-1">
            Lowest CAC at {money(bestMarket.cac, bestMarket.currency)} with {plainPercentage(bestMarket.trialToPaid)} trial-to-paid conversion.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-semibold text-red-950 dark:text-red-200">Worst performing market: {worstMarket.market}</p>
          <p className="mt-1">
            Highest CAC at {money(worstMarket.cac, worstMarket.currency)} due to weaker conversion efficiency versus spend.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="mb-3 text-sm font-semibold">Next month improvement plan</p>
          <div className="grid gap-3 md:grid-cols-2">
            {markets.map((market) => (
              <div key={market.market} className="grid grid-cols-[38px_1fr] gap-3 text-sm leading-6">
                <span className="rounded-md bg-background px-2 py-0.5 text-center text-xs font-semibold text-indigo-600 ring-1 ring-border">
                  {market.market}
                </span>
                <p className="text-muted-foreground">{market.improvementPlan}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketingHeadDashboardPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Head Dashboard</h1>
        <p className="text-muted-foreground">
          Market-wise spend, lead generation, funnel performance, conversion metrics, discounts, CAC and month-over-month comparison.
        </p>
      </div>

      <SectionTitle icon={WalletCards} title="Executive Summary" />
      <SummaryCards />

      <SectionTitle icon={BarChart3} title="Spend & Lead Generation" />
      <div className="grid gap-6 lg:grid-cols-2">
        <MarketWiseSpend />
        <LeadSources />
      </div>

      <SectionTitle icon={Zap} title="Funnel & CAC Performance" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <FunnelPerformance />
        <CacByMarket />
      </div>

      <SectionTitle icon={Target} title="Conversion Metrics" />
      <ConversionMetricsTable />

      <SectionTitle icon={Megaphone} title="Campaigns, Offers & Discounts" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <CampaignSpendCards />
        <OffersDiscounts />
      </div>

      <SectionTitle icon={Users} title="Source Breakdown" />
      <MarketLeadBreakdown />

      <SectionTitle icon={TrendingUp} title="Month-over-Month Trends" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <MonthOverMonth />
        <CacTrend />
      </div>

      <SectionTitle icon={Trophy} title="Performance Summary" />
      <PerformanceSummary />
    </div>
  );
}
