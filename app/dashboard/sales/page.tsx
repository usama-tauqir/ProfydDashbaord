// "use client"

// import { useEffect, useMemo, useState } from "react"
// import Link from "next/link"
// import {
//   BarChart3,
//   Users,
//   UserCheck,
//   TrendingUp,
//   TrendingDown,
//   Minus,
//   Wallet,
//   Target,
//   Timer,
//   AlertTriangle,
//   ArrowRight,
//   MessageCircle,
//   Globe,
//   RefreshCw,
//   BadgeDollarSign,
//   ChevronRight,
// } from "lucide-react"
// import {
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   FunnelChart,
//   Funnel,
//   LabelList,
//   PieChart,
//   Pie,
//   Cell,
//   LineChart,
//   Line,
// } from "recharts"

// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Progress } from "@/components/ui/progress"
// import { Separator } from "@/components/ui/separator"
// import { supabase } from "@/lib/supabase/client"

// type Trend = "up" | "down" | "flat"

// type ExecutiveSummary = {
//   totalNewStudentsSigned: number
//   netActiveStudents: number
//   totalRevenueCollected: number
//   revenueCurrency: string
//   performanceVsLastMonth: Trend
//   keyWin: string
//   keyConcern: string
// }

// type FunnelStats = {
//   totalLeadsReceived: number
//   qualifiedParentLeads: number
//   trialsBooked: number
//   trialsConducted: number
//   paidSignUps: number
// }

// type SourceRow = {
//   source: string
//   market: string
//   leads: number
//   trials: number
//   conducted: number
//   paidSignUps: number
// }

// type RevenueQuality = {
//   arpu: number
//   packageMix: {
//     one: number
//     two: number
//     three: number
//     four: number
//   }
//   prepaidPercent: number
//   partialPercent: number
//   planUpgrades: number
//   expectedMrrNextMonth: number
//   areaWise: { area: string; students: number; revenue: number }[]
// }

// type Efficiency = {
//   avgFirstResponseMinutes: number
//   avgLeadToTrialDays: number
//   avgTrialToPaymentDays: number
//   followUpsPerConvertedLead: number
// }

// type DropOffRow = {
//   reason: string
//   approxPercent: number
// }

// type SupportNeeds = {
//   salesNeedsFromCEO: string
//   salesNeedsFromMarketing: string
//   salesWillChangeNextMonth: string
// }

// type DashboardData = {
//   owner: string
//   frequency: string
//   monthLabel: string
//   executive: ExecutiveSummary
//   funnel: FunnelStats
//   sources: SourceRow[]
//   revenueQuality: RevenueQuality
//   efficiency: Efficiency
//   dropOffs: DropOffRow[]
//   support: SupportNeeds
// }

// const SOURCE_COLORS = ["#5747EA", "#7A6CFF", "#4FA0FF", "#36D1C4", "#A78BFA"]

// const defaultData: DashboardData = {
//   owner: "Sales Manager",
//   frequency: "Monthly",
//   monthLabel: "This Month",
//   executive: {
//     totalNewStudentsSigned: 86,
//     netActiveStudents: 71,
//     totalRevenueCollected: 48250,
//     revenueCurrency: "AUD",
//     performanceVsLastMonth: "up",
//     keyWin: "AU WhatsApp ads improved paid conversion after faster follow-up flow.",
//     keyConcern: "NZ trial-to-paid conversion is lagging and needs offer refinement.",
//   },
//   funnel: {
//     totalLeadsReceived: 412,
//     qualifiedParentLeads: 284,
//     trialsBooked: 162,
//     trialsConducted: 131,
//     paidSignUps: 86,
//   },
//   sources: [
//     { source: "WhatsApp Ads", market: "AU", leads: 144, trials: 62, conducted: 51, paidSignUps: 36 },
//     { source: "WhatsApp Ads", market: "NZ", leads: 76, trials: 23, conducted: 18, paidSignUps: 9 },
//     { source: "Website", market: "Global", leads: 102, trials: 44, conducted: 35, paidSignUps: 24 },
//     { source: "Referrals", market: "Global", leads: 61, trials: 25, conducted: 21, paidSignUps: 15 },
//     { source: "Other", market: "Global", leads: 29, trials: 8, conducted: 6, paidSignUps: 2 },
//   ],
//   revenueQuality: {
//     arpu: 561,
//     packageMix: { one: 24, two: 38, three: 23, four: 15 },
//     prepaidPercent: 68,
//     partialPercent: 32,
//     planUpgrades: 11,
//     expectedMrrNextMonth: 12900,
//     areaWise: [
//       { area: "Sydney", students: 22, revenue: 12100 },
//       { area: "Melbourne", students: 19, revenue: 10850 },
//       { area: "Auckland", students: 12, revenue: 6530 },
//       { area: "Perth", students: 9, revenue: 4720 },
//     ],
//   },
//   efficiency: {
//     avgFirstResponseMinutes: 8,
//     avgLeadToTrialDays: 2.4,
//     avgTrialToPaymentDays: 3.2,
//     followUpsPerConvertedLead: 4.1,
//   },
//   dropOffs: [
//     { reason: "Price", approxPercent: 28 },
//     { reason: "Timing / holidays", approxPercent: 21 },
//     { reason: "No response", approxPercent: 19 },
//     { reason: "Comparison shopping", approxPercent: 14 },
//     { reason: "Academic mismatch", approxPercent: 10 },
//     { reason: "Other", approxPercent: 8 },
//   ],
//   support: {
//     salesNeedsFromCEO: "Approval for market-specific intro offers and faster fee exception approvals.",
//     salesNeedsFromMarketing: "Higher quality AU/NZ parent lead targeting and better landing page copy.",
//     salesWillChangeNextMonth: "Tighter 15-minute first-response SLA and segmented follow-up scripts by market.",
//   },
// }

// function trendMeta(trend: Trend) {
//   if (trend === "up") return { label: "Up", icon: TrendingUp, className: "text-emerald-500" }
//   if (trend === "down") return { label: "Down", icon: TrendingDown, className: "text-rose-500" }
//   return { label: "Flat", icon: Minus, className: "text-amber-500" }
// }

// function calcPercent(numerator: number, denominator: number) {
//   if (!denominator) return 0
//   return Number(((numerator / denominator) * 100).toFixed(1))
// }

// function StatCard({
//   title,
//   value,
//   subtitle,
//   icon: Icon,
// }: {
//   title: string
//   value: string | number
//   subtitle: string
//   icon: React.ComponentType<{ className?: string }>
// }) {
//   return (
//     <Card className="border-border/60 shadow-sm">
//       <CardContent className="p-5">
//         <div className="flex items-start justify-between gap-4">
//           <div>
//             <p className="text-sm text-muted-foreground">{title}</p>
//             <h3 className="mt-2 text-2xl font-semibold tracking-tight">{value}</h3>
//             <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
//           </div>
//           <div className="rounded-2xl border bg-muted/60 p-3">
//             <Icon className="h-5 w-5" />
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// export default function SalesDashboardPage() {
//   const [data, setData] = useState<DashboardData>(defaultData)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       try {
//         // Replace these queries with your actual Supabase schema.
//         // This starter is safe because it falls back to mock data.
//         const currentMonth = new Date().toISOString().slice(0, 7)

//         const { data: salesRows } = await supabase
//           .from("sales_monthly_report")
//           .select("*")
//           .eq("report_month", currentMonth)
//           .maybeSingle()

//         const { data: sourceRows } = await supabase
//           .from("sales_source_performance")
//           .select("*")
//           .eq("report_month", currentMonth)

//         const { data: areaRows } = await supabase
//           .from("sales_area_breakdown")
//           .select("*")
//           .eq("report_month", currentMonth)

//         const { data: dropRows } = await supabase
//           .from("sales_dropoff_reasons")
//           .select("*")
//           .eq("report_month", currentMonth)

//         if (salesRows) {
//           setData({
//             owner: salesRows.owner ?? defaultData.owner,
//             frequency: salesRows.frequency ?? defaultData.frequency,
//             monthLabel: salesRows.month_label ?? defaultData.monthLabel,
//             executive: {
//               totalNewStudentsSigned: salesRows.total_new_students_signed ?? defaultData.executive.totalNewStudentsSigned,
//               netActiveStudents: salesRows.net_active_students ?? defaultData.executive.netActiveStudents,
//               totalRevenueCollected: salesRows.total_revenue_collected ?? defaultData.executive.totalRevenueCollected,
//               revenueCurrency: salesRows.revenue_currency ?? defaultData.executive.revenueCurrency,
//               performanceVsLastMonth: salesRows.performance_vs_last_month ?? defaultData.executive.performanceVsLastMonth,
//               keyWin: salesRows.key_win ?? defaultData.executive.keyWin,
//               keyConcern: salesRows.key_concern ?? defaultData.executive.keyConcern,
//             },
//             funnel: {
//               totalLeadsReceived: salesRows.total_leads_received ?? defaultData.funnel.totalLeadsReceived,
//               qualifiedParentLeads: salesRows.qualified_parent_leads ?? defaultData.funnel.qualifiedParentLeads,
//               trialsBooked: salesRows.trials_booked ?? defaultData.funnel.trialsBooked,
//               trialsConducted: salesRows.trials_conducted ?? defaultData.funnel.trialsConducted,
//               paidSignUps: salesRows.paid_sign_ups ?? defaultData.funnel.paidSignUps,
//             },
//             sources:
//               sourceRows?.map((row: any) => ({
//                 source: row.source,
//                 market: row.market,
//                 leads: row.leads,
//                 trials: row.trials,
//                 conducted: row.conducted,
//                 paidSignUps: row.paid_sign_ups,
//               })) ?? defaultData.sources,
//             revenueQuality: {
//               arpu: salesRows.arpu ?? defaultData.revenueQuality.arpu,
//               packageMix: {
//                 one: salesRows.package_1x_percent ?? defaultData.revenueQuality.packageMix.one,
//                 two: salesRows.package_2x_percent ?? defaultData.revenueQuality.packageMix.two,
//                 three: salesRows.package_3x_percent ?? defaultData.revenueQuality.packageMix.three,
//                 four: salesRows.package_4x_percent ?? defaultData.revenueQuality.packageMix.four,
//               },
//               prepaidPercent: salesRows.prepaid_percent ?? defaultData.revenueQuality.prepaidPercent,
//               partialPercent: salesRows.partial_percent ?? defaultData.revenueQuality.partialPercent,
//               planUpgrades: salesRows.plan_upgrades ?? defaultData.revenueQuality.planUpgrades,
//               expectedMrrNextMonth: salesRows.expected_mrr_next_month ?? defaultData.revenueQuality.expectedMrrNextMonth,
//               areaWise:
//                 areaRows?.map((row: any) => ({
//                   area: row.area,
//                   students: row.students,
//                   revenue: row.revenue,
//                 })) ?? defaultData.revenueQuality.areaWise,
//             },
//             efficiency: {
//               avgFirstResponseMinutes: salesRows.avg_first_response_minutes ?? defaultData.efficiency.avgFirstResponseMinutes,
//               avgLeadToTrialDays: salesRows.avg_lead_to_trial_days ?? defaultData.efficiency.avgLeadToTrialDays,
//               avgTrialToPaymentDays: salesRows.avg_trial_to_payment_days ?? defaultData.efficiency.avgTrialToPaymentDays,
//               followUpsPerConvertedLead: salesRows.followups_per_converted_lead ?? defaultData.efficiency.followUpsPerConvertedLead,
//             },
//             dropOffs:
//               dropRows?.map((row: any) => ({
//                 reason: row.reason,
//                 approxPercent: row.approx_percent,
//               })) ?? defaultData.dropOffs,
//             support: {
//               salesNeedsFromCEO: salesRows.sales_needs_from_ceo ?? defaultData.support.salesNeedsFromCEO,
//               salesNeedsFromMarketing: salesRows.sales_needs_from_marketing ?? defaultData.support.salesNeedsFromMarketing,
//               salesWillChangeNextMonth: salesRows.sales_will_change_next_month ?? defaultData.support.salesWillChangeNextMonth,
//             },
//           })
//         }
//       } catch (error) {
//         console.error("Failed to load sales dashboard:", error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchDashboardData()
//   }, [])

//   const leadToTrial = useMemo(
//     () => calcPercent(data.funnel.trialsBooked, data.funnel.totalLeadsReceived),
//     [data.funnel]
//   )
//   const leadToPaid = useMemo(
//     () => calcPercent(data.funnel.paidSignUps, data.funnel.totalLeadsReceived),
//     [data.funnel]
//   )
//   const trialToPaid = useMemo(
//     () => calcPercent(data.funnel.paidSignUps, data.funnel.trialsConducted),
//     [data.funnel]
//   )

//   const trend = trendMeta(data.executive.performanceVsLastMonth)
//   const TrendIcon = trend.icon

//   const sourceChartData = data.sources.map((item) => ({
//     name: `${item.source} ${item.market}`,
//     Leads: item.leads,
//     Trials: item.trials,
//     Paid: item.paidSignUps,
//   }))

//   const funnelData = [
//     { value: data.funnel.totalLeadsReceived, name: "Leads" },
//     { value: data.funnel.qualifiedParentLeads, name: "Qualified" },
//     { value: data.funnel.trialsBooked, name: "Trials Booked" },
//     { value: data.funnel.trialsConducted, name: "Trials Done" },
//     { value: data.funnel.paidSignUps, name: "Paid" },
//   ]

//   const packageMixData = [
//     { name: "1x/week", value: data.revenueQuality.packageMix.one },
//     { name: "2x/week", value: data.revenueQuality.packageMix.two },
//     { name: "3x/week", value: data.revenueQuality.packageMix.three },
//     { name: "4x/week", value: data.revenueQuality.packageMix.four },
//   ]

//   if (loading) {
//     return (
//       <div className="flex h-[60vh] items-center justify-center">
//         <div className="flex items-center gap-3 rounded-2xl border bg-background px-5 py-3 shadow-sm">
//           <RefreshCw className="h-4 w-4 animate-spin" />
//           <span className="text-sm text-muted-foreground">Loading sales dashboard...</span>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6 p-1">
//       <div className="rounded-[28px] border bg-background/80 p-6 shadow-sm backdrop-blur-sm">
//         <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
//           <div className="space-y-2">
//             <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
//               <Badge variant="secondary" className="rounded-full px-3 py-1">Sales</Badge>
//               <span>{data.frequency}</span>
//               <span>•</span>
//               <span>{data.monthLabel}</span>
//             </div>
//             <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Sales Performance Dashboard</h1>
//             <p className="max-w-3xl text-sm text-muted-foreground">
//               A Nexus-inspired executive dashboard for monitoring lead flow, sign-ups, revenue quality, efficiency,
//               and support actions across markets.
//             </p>
//           </div>

//           <div className="grid gap-3 sm:grid-cols-2">
//             <div className="rounded-3xl border bg-muted/40 px-4 py-3">
//               <p className="text-xs text-muted-foreground">Owner</p>
//               <p className="mt-1 font-medium">{data.owner}</p>
//             </div>
//             <div className="rounded-3xl border bg-muted/40 px-4 py-3">
//               <p className="text-xs text-muted-foreground">Performance</p>
//               <div className={`mt-1 flex items-center gap-2 font-medium ${trend.className}`}>
//                 <TrendIcon className="h-4 w-4" />
//                 {trend.label} vs last month
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//         <StatCard
//           title="New Students Signed"
//           value={data.executive.totalNewStudentsSigned}
//           subtitle="Total signed this month"
//           icon={UserCheck}
//         />
//         <StatCard
//           title="Net Active Students"
//           value={data.executive.netActiveStudents}
//           subtitle="After drop-offs"
//           icon={Users}
//         />
//         <StatCard
//           title="Revenue Collected"
//           value={`${data.executive.revenueCurrency} ${data.executive.totalRevenueCollected.toLocaleString()}`}
//           subtitle="Collected this month"
//           icon={Wallet}
//         />
//         <StatCard
//           title="Expected Next MRR"
//           value={`${data.executive.revenueCurrency} ${data.revenueQuality.expectedMrrNextMonth.toLocaleString()}`}
//           subtitle="From next-month joiners"
//           icon={BadgeDollarSign}
//         />
//       </div>

//       <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
//         <Card className="rounded-[28px] border-border/60 shadow-sm">
//           <CardHeader className="pb-2">
//             <CardTitle>Executive Summary</CardTitle>
//             <CardDescription>Keep this block to five lines max in production.</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="grid gap-3 md:grid-cols-2">
//               <div className="rounded-2xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">One key win</p>
//                 <p className="mt-2 text-sm font-medium leading-6">{data.executive.keyWin}</p>
//               </div>
//               <div className="rounded-2xl border bg-muted/30 p-4">
//                 <p className="text-sm text-muted-foreground">One key concern</p>
//                 <p className="mt-2 text-sm font-medium leading-6">{data.executive.keyConcern}</p>
//               </div>
//             </div>

//             <div className="grid gap-3 sm:grid-cols-3">
//               <div className="rounded-2xl border p-4">
//                 <p className="text-xs text-muted-foreground">Lead → Trial</p>
//                 <p className="mt-2 text-xl font-semibold">{leadToTrial}%</p>
//               </div>
//               <div className="rounded-2xl border p-4">
//                 <p className="text-xs text-muted-foreground">Lead → Paid</p>
//                 <p className="mt-2 text-xl font-semibold">{leadToPaid}%</p>
//               </div>
//               <div className="rounded-2xl border p-4">
//                 <p className="text-xs text-muted-foreground">Trial → Paid</p>
//                 <p className="mt-2 text-xl font-semibold">{trialToPaid}%</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="rounded-[28px] border-border/60 shadow-sm">
//           <CardHeader>
//             <CardTitle>Lead Funnel Overview</CardTitle>
//             <CardDescription>Progress from inbound lead to paid sign-up.</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="h-[320px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <FunnelChart>
//                   <Tooltip />
//                   <Funnel dataKey="value" data={funnelData} isAnimationActive>
//                     <LabelList position="right" fill="currentColor" stroke="none" dataKey="name" />
//                   </Funnel>
//                 </FunnelChart>
//               </ResponsiveContainer>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <Tabs defaultValue="sources" className="space-y-6">
//         <TabsList className="h-auto flex-wrap rounded-2xl border bg-background p-2">
//           <TabsTrigger value="sources">Source-wise Performance</TabsTrigger>
//           <TabsTrigger value="revenue">Revenue Quality</TabsTrigger>
//           <TabsTrigger value="efficiency">Sales Efficiency</TabsTrigger>
//           <TabsTrigger value="dropoffs">Drop-offs</TabsTrigger>
//           <TabsTrigger value="actions">Action Items</TabsTrigger>
//         </TabsList>

//         <TabsContent value="sources" className="space-y-6">
//           <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
//             <Card className="rounded-[28px]">
//               <CardHeader>
//                 <CardTitle>Source-wise Performance</CardTitle>
//                 <CardDescription>Leads, trials, and paid sign-ups by source and market.</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="h-[340px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart data={sourceChartData}>
//                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                       <XAxis dataKey="name" tickLine={false} axisLine={false} />
//                       <YAxis tickLine={false} axisLine={false} />
//                       <Tooltip />
//                       <Bar dataKey="Leads" radius={[8, 8, 0, 0]} fill="#5747EA" />
//                       <Bar dataKey="Trials" radius={[8, 8, 0, 0]} fill="#4FA0FF" />
//                       <Bar dataKey="Paid" radius={[8, 8, 0, 0]} fill="#36D1C4" />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="rounded-[28px]">
//               <CardHeader>
//                 <CardTitle>Source Table</CardTitle>
//                 <CardDescription>Market-wise rows to match your reporting format.</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 {data.sources.map((row, index) => {
//                   const conversion = calcPercent(row.paidSignUps, row.leads)
//                   return (
//                     <div key={`${row.source}-${row.market}`} className="rounded-2xl border p-4">
//                       <div className="mb-3 flex items-center justify-between gap-4">
//                         <div>
//                           <p className="font-medium">{row.source} – {row.market}</p>
//                           <p className="text-xs text-muted-foreground">Lead to paid conversion</p>
//                         </div>
//                         <Badge variant="secondary" className="rounded-full">{conversion}%</Badge>
//                       </div>
//                       <Progress value={Math.min(conversion, 100)} className="mb-3 h-2" />
//                       <div className="grid grid-cols-4 gap-2 text-sm">
//                         <div><span className="text-muted-foreground">Leads</span><p className="font-semibold">{row.leads}</p></div>
//                         <div><span className="text-muted-foreground">Trials</span><p className="font-semibold">{row.trials}</p></div>
//                         <div><span className="text-muted-foreground">Done</span><p className="font-semibold">{row.conducted}</p></div>
//                         <div><span className="text-muted-foreground">Paid</span><p className="font-semibold">{row.paidSignUps}</p></div>
//                       </div>
//                       <div className="mt-3 h-1.5 rounded-full" style={{ background: SOURCE_COLORS[index % SOURCE_COLORS.length] }} />
//                     </div>
//                   )
//                 })}
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         <TabsContent value="revenue" className="space-y-6">
//           <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
//             <Card className="rounded-[28px]">
//               <CardHeader>
//                 <CardTitle>Revenue Quality</CardTitle>
//                 <CardDescription>ARPU, package mix, payments, and upgrades.</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="grid grid-cols-2 gap-3">
//                   <div className="rounded-2xl border p-4">
//                     <p className="text-xs text-muted-foreground">ARPU</p>
//                     <p className="mt-2 text-2xl font-semibold">{data.executive.revenueCurrency} {data.revenueQuality.arpu}</p>
//                   </div>
//                   <div className="rounded-2xl border p-4">
//                     <p className="text-xs text-muted-foreground">Plan upgrades</p>
//                     <p className="mt-2 text-2xl font-semibold">{data.revenueQuality.planUpgrades}</p>
//                   </div>
//                   <div className="rounded-2xl border p-4">
//                     <p className="text-xs text-muted-foreground">Prepaid</p>
//                     <p className="mt-2 text-2xl font-semibold">{data.revenueQuality.prepaidPercent}%</p>
//                   </div>
//                   <div className="rounded-2xl border p-4">
//                     <p className="text-xs text-muted-foreground">Partial payments</p>
//                     <p className="mt-2 text-2xl font-semibold">{data.revenueQuality.partialPercent}%</p>
//                   </div>
//                 </div>

//                 <Separator />

//                 <div>
//                   <p className="mb-3 text-sm font-medium">Area-wise categorisation</p>
//                   <div className="space-y-3">
//                     {data.revenueQuality.areaWise.map((item) => (
//                       <div key={item.area} className="rounded-2xl border p-4">
//                         <div className="mb-2 flex items-center justify-between">
//                           <span className="font-medium">{item.area}</span>
//                           <span className="text-sm text-muted-foreground">{data.executive.revenueCurrency} {item.revenue.toLocaleString()}</span>
//                         </div>
//                         <div className="flex items-center justify-between text-xs text-muted-foreground">
//                           <span>{item.students} students</span>
//                           <span>{calcPercent(item.revenue, data.executive.totalRevenueCollected)}% of revenue</span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <div className="grid gap-6">
//               <Card className="rounded-[28px]">
//                 <CardHeader>
//                   <CardTitle>Package Mix</CardTitle>
//                   <CardDescription>Weekly frequency split.</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="h-[280px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <PieChart>
//                         <Pie data={packageMixData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
//                           {packageMixData.map((entry, index) => (
//                             <Cell key={entry.name} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
//                           ))}
//                         </Pie>
//                         <Tooltip />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="rounded-[28px]">
//                 <CardHeader>
//                   <CardTitle>Revenue Trend Preview</CardTitle>
//                   <CardDescription>Optional visual if you store historical monthly revenue.</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="h-[220px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <LineChart data={[
//                         { month: "Jan", value: 32200 },
//                         { month: "Feb", value: 34800 },
//                         { month: "Mar", value: 36750 },
//                         { month: "Apr", value: 39200 },
//                         { month: "May", value: 43500 },
//                         { month: "Jun", value: data.executive.totalRevenueCollected },
//                       ]}>
//                         <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                         <XAxis dataKey="month" tickLine={false} axisLine={false} />
//                         <YAxis tickLine={false} axisLine={false} />
//                         <Tooltip />
//                         <Line type="monotone" dataKey="value" stroke="#5747EA" strokeWidth={3} dot={false} />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         </TabsContent>

//         <TabsContent value="efficiency" className="space-y-6">
//           <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//             <StatCard title="Avg first response" value={`${data.efficiency.avgFirstResponseMinutes} min`} subtitle="New lead response time" icon={Timer} />
//             <StatCard title="Lead → Trial" value={`${data.efficiency.avgLeadToTrialDays} days`} subtitle="Average speed to book" icon={Target} />
//             <StatCard title="Trial → Payment" value={`${data.efficiency.avgTrialToPaymentDays} days`} subtitle="Average payment time" icon={ArrowRight} />
//             <StatCard title="Follow-ups / converted lead" value={data.efficiency.followUpsPerConvertedLead} subtitle="Average follow-up count" icon={MessageCircle} />
//           </div>
//         </TabsContent>

//         <TabsContent value="dropoffs" className="space-y-6">
//           <Card className="rounded-[28px]">
//             <CardHeader>
//               <CardTitle>Drop-offs & Loss Reasons</CardTitle>
//               <CardDescription>Approximate percentages by main reason.</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {data.dropOffs.map((item, index) => (
//                 <div key={item.reason} className="rounded-2xl border p-4">
//                   <div className="mb-2 flex items-center justify-between gap-4">
//                     <div className="flex items-center gap-2">
//                       <AlertTriangle className="h-4 w-4 text-muted-foreground" />
//                       <span className="font-medium">{item.reason}</span>
//                     </div>
//                     <span className="text-sm font-semibold">{item.approxPercent}%</span>
//                   </div>
//                   <div className="h-2 rounded-full bg-muted">
//                     <div className="h-2 rounded-full" style={{ width: `${item.approxPercent}%`, background: SOURCE_COLORS[index % SOURCE_COLORS.length] }} />
//                   </div>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="actions" className="space-y-6">
//           <div className="grid gap-6 lg:grid-cols-3">
//             <Card className="rounded-[28px]">
//               <CardHeader>
//                 <CardTitle>Need from CEO</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-sm leading-6 text-muted-foreground">{data.support.salesNeedsFromCEO}</p>
//               </CardContent>
//             </Card>
//             <Card className="rounded-[28px]">
//               <CardHeader>
//                 <CardTitle>Need from Marketing</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-sm leading-6 text-muted-foreground">{data.support.salesNeedsFromMarketing}</p>
//               </CardContent>
//             </Card>
//             <Card className="rounded-[28px]">
//               <CardHeader>
//                 <CardTitle>What changes next month</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-sm leading-6 text-muted-foreground">{data.support.salesWillChangeNextMonth}</p>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>
//       </Tabs>

//       <Card className="rounded-[28px] border-border/60 shadow-sm">
//         <CardHeader>
//           <CardTitle>Recommended Routes</CardTitle>
//           <CardDescription>Create separate pages under /dashboard/sales for your detailed views.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
//             {[
//               { href: "/dashboard/sales/executive-summary", label: "Executive Summary", icon: BarChart3 },
//               { href: "/dashboard/sales/lead-funnel", label: "Lead Funnel Overview", icon: Target },
//               { href: "/dashboard/sales/source-performance", label: "Source-wise Performance", icon: Globe },
//               { href: "/dashboard/sales/revenue-quality", label: "Revenue Quality", icon: Wallet },
//               { href: "/dashboard/sales/sales-efficiency", label: "Sales Efficiency", icon: Timer },
//               { href: "/dashboard/sales/dropoffs", label: "Drop-offs & Loss Reasons", icon: TrendingDown },
//               { href: "/dashboard/sales/agent-performance", label: "Action Items / Support Needed", icon: ChevronRight },
//             ].map((item) => {
//               const Icon = item.icon
//               return (
//                 <Button key={item.href} asChild variant="outline" className="h-auto justify-start rounded-2xl p-4">
//                   <Link href={item.href}>
//                     <Icon className="mr-3 h-4 w-4" />
//                     {item.label}
//                   </Link>
//                 </Button>
//               )
//             })}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }


// app/dashboard/sales/page.tsx
// app/dashboard/sales/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  UserPlus,
  DollarSign,
  TrendingUp,
  BarChart3,
  Target,
  Phone,
  Clock,
  AlertTriangle,
  ThumbsUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Megaphone,
  Activity,
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

interface ExecutiveSummary {
  newSignUps: number;
  netActive: number;
  totalRevenue: number;
  revenueTrend: "up" | "down" | "neutral";
  volumeTrend: "up" | "down" | "neutral";
  costTrend: "up" | "down" | "neutral";
  keyWin: string;
  keyConcern: string;
}

interface FunnelStage {
  stage: string;
  count: number;
}

interface SourcePerformance {
  source: string;
  leads: number;
  trials: number;
  paidSignUps: number;
  conversion: number;
}

interface RevenueQuality {
  arpu: number;
  packageMix: { name: string; value: number }[];
  prepaidPercent: number;
  planUpgrades: number;
  expectedMRR: number;
}

interface SalesEfficiency {
  avgFirstResponseMin: number;
  avgLeadToTrialDays: number;
  avgTrialToPaymentDays: number;
  avgFollowUpsPerConversion: number;
}

interface DropOffReason {
  reason: string;
  percentage: number;
}

interface ActionItem {
  category: "ceo" | "marketing" | "sales";
  text: string;
}

// ----------------------------------------------------------------------
// Mock data generator (scales with period)
// ----------------------------------------------------------------------
const getMockData = (period: Period) => {
  const factor =
    period === "all"
      ? 1
      : period === "yearly"
      ? 1
      : period === "monthly"
      ? 1 / 12
      : period === "weekly"
      ? 1 / 52
      : 1 / 365;

  const scale = (val: number) => Math.round(val * factor);

  const exec: ExecutiveSummary = {
    newSignUps: scale(85),
    netActive: scale(1233),
    totalRevenue: scale(148500),
    revenueTrend: "up",
    volumeTrend: "neutral",
    costTrend: "down",
    keyWin: "Upsell revenue grew 8.2% this month",
    keyConcern: "Paused subscriptions increased by 2",
  };

  const funnel: FunnelStage[] = [
    { stage: "Total leads received", count: scale(320) },
    { stage: "Qualified parent leads", count: scale(245) },
    { stage: "Trials booked (new leads only)", count: scale(120) },
    { stage: "Trials conducted", count: scale(98) },
    { stage: "Paid sign-ups", count: scale(85) },
  ];

  const leadToTrial = funnel[2].count / funnel[0].count * 100;
  const leadToPaid = funnel[4].count / funnel[0].count * 100;
  const trialToPaid = funnel[4].count / funnel[2].count * 100;

  const sources: SourcePerformance[] = [
    { source: "WhatsApp Ads – AU", leads: scale(120), trials: scale(45), paidSignUps: scale(32), conversion: 26.7 },
    { source: "WhatsApp Ads – NZ", leads: scale(65), trials: scale(22), paidSignUps: scale(15), conversion: 23.1 },
    { source: "Website", leads: scale(90), trials: scale(35), paidSignUps: scale(25), conversion: 27.8 },
    { source: "Referrals", leads: scale(30), trials: scale(12), paidSignUps: scale(8), conversion: 26.7 },
    { source: "Other", leads: scale(15), trials: scale(6), paidSignUps: scale(5), conversion: 33.3 },
  ];

  const revenue: RevenueQuality = {
    arpu: +(119.28 * factor).toFixed(2),
    packageMix: [
      { name: "1x/week", value: 20 },
      { name: "2x/week", value: 35 },
      { name: "3x/week", value: 30 },
      { name: "4x/week", value: 15 },
    ],
    prepaidPercent: 75,
    planUpgrades: scale(7),
    expectedMRR: scale(12000),
  };

  const efficiency: SalesEfficiency = {
    avgFirstResponseMin: 3,
    avgLeadToTrialDays: 2.3,
    avgTrialToPaymentDays: 4.1,
    avgFollowUpsPerConversion: 2.8,
  };

  const dropOffs: DropOffReason[] = [
    { reason: "Price", percentage: 35 },
    { reason: "Timing / holidays", percentage: 22 },
    { reason: "No response", percentage: 18 },
    { reason: "Comparison shopping", percentage: 12 },
    { reason: "Academic mismatch", percentage: 8 },
    { reason: "Other", percentage: 5 },
  ];

  const actions: ActionItem[] = [
    { category: "ceo", text: "Approve discount budget for at‑risk leads (need by Friday)" },
    { category: "marketing", text: "Increase WhatsApp AU ad spend by 20% (high conversion)" },
    { category: "sales", text: "Implement follow‑up script for 'No response' leads after 3 days" },
  ];

  return { exec, funnel, leadToTrial, leadToPaid, trialToPaid, sources, revenue, efficiency, dropOffs, actions };
};

const CHART_COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function SalesDashboardPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [data, setData] = useState(() => getMockData("all"));
  const [loading, setLoading] = useState(false);

  const fetchData = (selectedPeriod: Period) => {
    setLoading(true);
    setData(getMockData(selectedPeriod));
    setLoading(false);
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const { exec, funnel, leadToTrial, leadToPaid, trialToPaid, sources, revenue, efficiency, dropOffs, actions } = data;

  return (
    <div className="space-y-8 p-6">
      {/* Header + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
          <p className="text-muted-foreground">
            Lead funnel, source performance, revenue quality &amp; sales efficiency.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="yearly">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchData(period)} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* A. EXECUTIVE SUMMARY CARDS (already existing) */}
      {/* ================================================================ */}
      <SectionTitle icon={Target} title="Executive Summary" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Total new students signed" value={exec.newSignUps} icon={UserPlus} />
        <MetricCard title="Net active students" value={exec.netActive} icon={Users} />
        <MetricCard title="Total revenue collected (AUD)" value={`$${exec.totalRevenue.toLocaleString()}`} icon={DollarSign} />
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Overall performance vs last month</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <TrendBadge direction={exec.revenueTrend} label="Revenue" />
              <TrendBadge direction={exec.volumeTrend} label="Volume" />
              <TrendBadge direction={exec.costTrend} label="Costs" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Key win</p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-400">✅ {exec.keyWin}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Key concern</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">⚠️ {exec.keyConcern}</p>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================ */}
      {/* NEW: FUNNEL STAGES CARDS */}
      {/* ================================================================ */}
      <SectionTitle icon={BarChart3} title="Lead Funnel Stages" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {funnel.map((stage) => (
          <MetricCard key={stage.stage} title={stage.stage} value={stage.count} icon={Users} />
        ))}
      </div>

      {/* ================================================================ */}
      {/* NEW: CONVERSION RATES CARDS */}
      {/* ================================================================ */}
      <SectionTitle icon={TrendingUp} title="Conversion Rates" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Lead → Trial %" value={`${leadToTrial.toFixed(1)}%`} icon={Target} />
        <MetricCard title="Lead → Paid Conversion %" value={`${leadToPaid.toFixed(1)}%`} icon={Target} />
        <MetricCard title="Trial → Paid Conversion %" value={`${trialToPaid.toFixed(1)}%`} icon={Target} />
      </div>

      {/* ================================================================ */}
      {/* NEW: SOURCE-WISE PERFORMANCE CARDS */}
      {/* ================================================================ */}
      <SectionTitle icon={Megaphone} title="Source Performance" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {sources.map((src) => (
          <Card key={src.source}>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">{src.source}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leads:</span>
                  <span className="font-medium">{src.leads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trials:</span>
                  <span className="font-medium">{src.trials}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Sign-ups:</span>
                  <span className="font-medium">{src.paidSignUps}</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-muted-foreground">Conversion:</span>
                  <span className="font-bold text-primary">{src.conversion}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ================================================================ */}
      {/* NEW: REVENUE QUALITY CARD */}
      {/* ================================================================ */}
      <SectionTitle icon={DollarSign} title="Revenue Quality" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Average revenue per student (ARPU)" value={`$${revenue.arpu}`} icon={DollarSign} />
        <MetricCard title="Plan upgrades this month" value={revenue.planUpgrades} icon={TrendingUp} />
        <MetricCard title="Expected MRR (joining next month)" value={`$${revenue.expectedMRR.toLocaleString()}`} icon={Activity} />
      </div>

      {/* ================================================================ */}
      {/* NEW: SALES EFFICIENCY CARDS */}
      {/* ================================================================ */}
      <SectionTitle icon={Clock} title="Sales Efficiency" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Avg first response time" value={`${efficiency.avgFirstResponseMin} min`} icon={Phone} />
        <MetricCard title="Avg days from lead → trial" value={`${efficiency.avgLeadToTrialDays} days`} icon={Target} />
        <MetricCard title="Avg days from trial → payment" value={`${efficiency.avgTrialToPaymentDays} days`} icon={Target} />
        <MetricCard title="Follow-ups per converted lead (avg)" value={efficiency.avgFollowUpsPerConversion} icon={RefreshCw} />
      </div>

      {/* ================================================================ */}
      {/* NEW: DROP-OFF REASON CARDS */}
      {/* ================================================================ */}
      <SectionTitle icon={AlertTriangle} title="Drop‑off & Loss Reasons" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {dropOffs.map((item) => (
          <MetricCard key={item.reason} title={item.reason} value={`${item.percentage}%`} icon={AlertTriangle} />
        ))}
      </div>

      {/* ================================================================ */}
      {/* CHARTS & DEEPER ANALYSIS (keep existing visualisations) */}
      {/* ================================================================ */}
      <SectionTitle icon={BarChart3} title="Funnel Visualisation" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Funnel Stages (Chart)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 20, left: 140, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="stage" width={130} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Rates (Chart)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConversionRate label="Lead → Trial" value={leadToTrial} />
            <ConversionRate label="Lead → Paid" value={leadToPaid} />
            <ConversionRate label="Trial → Paid" value={trialToPaid} />
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={Megaphone} title="Source-wise Chart" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads, Trials &amp; Paid Sign‑ups by Source</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sources} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="source" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" name="Leads" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="trials" name="Trials" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="paidSignUps" name="Paid" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle icon={DollarSign} title="Revenue Quality Details" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Package Mix (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenue.packageMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {revenue.packageMix.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prepaid vs Partial</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{revenue.prepaidPercent}%</div>
              <div className="text-sm text-muted-foreground mt-2">Prepaid</div>
              <div className="text-sm text-muted-foreground">{100 - revenue.prepaidPercent}% Partial</div>
              <div className="w-full bg-muted rounded-full h-3 mt-4">
                <div className="bg-primary h-3 rounded-full" style={{ width: `${revenue.prepaidPercent}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionTitle icon={AlertTriangle} title="Loss Reason Chart" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loss Reason Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={dropOffs} dataKey="percentage" nameKey="reason" cx="50%" cy="50%" outerRadius={100} label>
                {dropOffs.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <SectionTitle icon={ThumbsUp} title="Action Items / Support Needed" />
      <Card>
        <CardContent className="p-6 space-y-4">
          {actions.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="capitalize text-xs font-semibold px-2 py-1 rounded bg-muted">
                {item.category}
              </span>
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
          <div className="text-xs text-muted-foreground mt-4">
            ● One Google Sheet tab ● Market‑wise rows
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------
// Reusable Components
// ----------------------------------------------------------------------
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
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="rounded-full bg-muted/60 p-2.5">
          <Icon className="h-5 w-5 text-indigo-500" />
        </div>
      </CardContent>
    </Card>
  );
}

function ConversionRate({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <span className="font-semibold">{value.toFixed(1)}%</span>
      <div className="w-24 bg-muted rounded-full h-2">
        <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function TrendBadge({ direction, label }: { direction: "up" | "down" | "neutral"; label: string }) {
  const icons = {
    up: <ArrowUpRight className="h-3 w-3" />,
    down: <ArrowDownRight className="h-3 w-3" />,
    neutral: <Minus className="h-3 w-3" />,
  };
  const colors = {
    up: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
    down: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300",
    neutral: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${colors[direction]}`}>
      {icons[direction]}
      {label}
    </span>
  );
}