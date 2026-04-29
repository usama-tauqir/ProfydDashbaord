// app/dashboard/admin-ops/page.tsx
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
  Building,
  Calendar,
  Users,
  AlertTriangle,
  DollarSign,
  FileText,
  ShoppingCart,
  Wrench,
  ClipboardCheck,
  CalendarCheck,
  Package,
  Truck,
  Clock,
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
} from "recharts";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
type Period = "all" | "today" | "weekly" | "monthly" | "yearly";
type YesNo = "Yes" | "No";

interface OfficeOps {
  locationsActive: number;
  workingDays: number;
  staffHeadcount: number;
  attendanceIssues: number;
}

interface PettyCash {
  openingBalance: number;
  received: number;
  spent: number;
  closingBalance: number;
  voucherCount: number;
  unapprovedEntries: number;
}

interface Utilities {
  electricity: number;
  gas: number;
  water: number;
  internet: number;
  generatorUPS: number;
  mobilePhone: number;
  billsPending: number;
}

interface Supplies {
  stationery: number;
  officeSupplies: number;
  kitchenRefreshments: number;
  cleaning: number;
  stockShortageCount: number;
}

interface RentFacilities {
  rentPaid: number;
  rentPending: YesNo;
  maintenanceExpense: number;
  repairsCount: number;
  facilityIssuesLogged: number;
}

interface StaffManagement {
  officeBoysActive: number;
  officeBoysAbsences: number;
  overtimeHours: number;
  disciplinaryActions: number;
}

interface Events {
  eventsConducted: number;
  eventExpense: number;
  entertainmentExpense: number;
  eventsPending: number;
  overBudgetEvents: number;
}

interface AssetInventory {
  assetsPurchased: number;
  assetsDisposed: number;
  assetsIssued: number;
  missingDamaged: number;
  inventoryUpdated: YesNo;
}

interface VendorService {
  activeVendors: number;
  paymentsMade: number;
  paymentsPending: number;
  newVendors: number;
  contractsExpiring60Days: number;
}

interface ComplianceApprovals {
  approved: number;
  rejected: number;
  pendingApprovals: number;
  policyViolations: number;
}

interface Documentation {
  billsFiled: YesNo;
  receiptsAttached: YesNo;
  reconciliationDone: YesNo;
  missingDocuments: number;
}

// ----------------------------------------------------------------------
// Mock data generator
// ----------------------------------------------------------------------
const getMockData = (period: Period) => {
  const factor =
    period === "all" ? 1 :
    period === "yearly" ? 1 :
    period === "monthly" ? 1 / 12 :
    period === "weekly" ? 1 / 52 :
    1 / 365;

  const scale = (val: number) => Math.round(val * factor);
  const scaleMoney = (val: number) => +(val * factor).toFixed(0);

  const office: OfficeOps = {
    locationsActive: 3,
    workingDays: period === "monthly" ? 22 : period === "weekly" ? 5 : 260,
    staffHeadcount: 12,
    attendanceIssues: scale(4),
  };

  const petty: PettyCash = {
    openingBalance: scaleMoney(50000),
    received: scaleMoney(120000),
    spent: scaleMoney(95000),
    closingBalance: scaleMoney(75000),
    voucherCount: scale(45),
    unapprovedEntries: scale(2),
  };

  const utilities: Utilities = {
    electricity: scaleMoney(45000),
    gas: scaleMoney(8000),
    water: scaleMoney(5000),
    internet: scaleMoney(12000),
    generatorUPS: scaleMoney(6000),
    mobilePhone: scaleMoney(4000),
    billsPending: scale(3),
  };

  const supplies: Supplies = {
    stationery: scaleMoney(8000),
    officeSupplies: scaleMoney(12000),
    kitchenRefreshments: scaleMoney(15000),
    cleaning: scaleMoney(5000),
    stockShortageCount: scale(1),
  };

  const rent: RentFacilities = {
    rentPaid: scaleMoney(150000),
    rentPending: "No",
    maintenanceExpense: scaleMoney(25000),
    repairsCount: scale(5),
    facilityIssuesLogged: scale(3),
  };

  const staffMgmt: StaffManagement = {
    officeBoysActive: 8,
    officeBoysAbsences: scale(2),
    overtimeHours: scale(30),
    disciplinaryActions: scale(1),
  };

  const events: Events = {
    eventsConducted: scale(3),
    eventExpense: scaleMoney(25000),
    entertainmentExpense: scaleMoney(8000),
    eventsPending: scale(1),
    overBudgetEvents: scale(1),
  };

  const asset: AssetInventory = {
    assetsPurchased: scale(10),
    assetsDisposed: scale(2),
    assetsIssued: scale(5),
    missingDamaged: scale(1),
    inventoryUpdated: "Yes",
  };

  const vendor: VendorService = {
    activeVendors: 15,
    paymentsMade: scaleMoney(60000),
    paymentsPending: scaleMoney(12000),
    newVendors: scale(2),
    contractsExpiring60Days: 4,
  };

  const compliance: ComplianceApprovals = {
    approved: scale(25),
    rejected: scale(3),
    pendingApprovals: scale(5),
    policyViolations: scale(1),
  };

  const docs: Documentation = {
    billsFiled: "Yes",
    receiptsAttached: "Yes",
    reconciliationDone: "Yes",
    missingDocuments: scale(2),
  };

  return {
    office, petty, utilities, supplies, rent, staffMgmt, events, asset, vendor, compliance, docs,
  };
};

// ----------------------------------------------------------------------
// Colors
// ----------------------------------------------------------------------
const COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];
const UTILITY_COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function AdminOpsDashboardPage() {
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
    office, petty, utilities, supplies, rent, staffMgmt,
    events, asset, vendor, compliance, docs,
  } = data;

  // Chart data for each section
  const pettyCashBar = [
    { name: "Opening", value: petty.openingBalance },
    { name: "Received", value: petty.received },
    { name: "Spent", value: petty.spent },
    { name: "Closing", value: petty.closingBalance },
  ];

  const utilityPie = [
    { name: "Electricity", value: utilities.electricity },
    { name: "Gas", value: utilities.gas },
    { name: "Water", value: utilities.water },
    { name: "Internet", value: utilities.internet },
    { name: "Generator/UPS", value: utilities.generatorUPS },
    { name: "Mobile/Phone", value: utilities.mobilePhone },
  ];

  const suppliesPie = [
    { name: "Stationery", value: supplies.stationery },
    { name: "Office Supplies", value: supplies.officeSupplies },
    { name: "Kitchen/Refreshments", value: supplies.kitchenRefreshments },
    { name: "Cleaning", value: supplies.cleaning },
  ];

  const rentBar = [
    { name: "Rent Paid", value: rent.rentPaid },
    { name: "Maintenance", value: rent.maintenanceExpense },
  ];

  const staffBar = [
    { name: "Absences", value: staffMgmt.officeBoysAbsences },
    { name: "Overtime (h)", value: staffMgmt.overtimeHours },
    { name: "Disciplinary", value: staffMgmt.disciplinaryActions },
  ];

  const eventBar = [
    { name: "Event Expense", value: events.eventExpense },
    { name: "Entertainment", value: events.entertainmentExpense },
  ];

  const assetPie = [
    { name: "Purchased", value: asset.assetsPurchased },
    { name: "Issued", value: asset.assetsIssued },
    { name: "Disposed", value: asset.assetsDisposed },
    { name: "Missing/Damaged", value: asset.missingDamaged },
  ];

  const vendorBar = [
    { name: "Payments Made", value: vendor.paymentsMade },
    { name: "Pending", value: vendor.paymentsPending },
  ];

  const compliancePie = [
    { name: "Approved", value: compliance.approved },
    { name: "Rejected", value: compliance.rejected },
    { name: "Pending", value: compliance.pendingApprovals },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin / Office Operations</h1>
          <p className="text-muted-foreground">
            Office ops, petty cash, utilities, supplies, rent, staff, events, assets & more.
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

      {/* 1. Office Operations */}
      <SectionTitle icon={Building} title="1. Office Operations" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Locations active" value={office.locationsActive} icon={Building} />
        <MetricCard title="Working days" value={office.workingDays} icon={Calendar} />
        <MetricCard title="Staff headcount" value={office.staffHeadcount} icon={Users} />
        <MetricCard title="Attendance issues" value={office.attendanceIssues} icon={AlertTriangle} />
      </div>

      {/* 2. Petty Cash Management */}
      <SectionTitle icon={DollarSign} title="2. Petty Cash Management (PKR)" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Opening balance" value={`PKR ${petty.openingBalance.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Received" value={`PKR ${petty.received.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Spent" value={`PKR ${petty.spent.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Closing balance" value={`PKR ${petty.closingBalance.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Vouchers" value={petty.voucherCount} icon={FileText} />
        <MetricCard title="Unapproved entries" value={petty.unapprovedEntries} icon={AlertTriangle} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Petty Cash Flow</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pettyCashBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `PKR ${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => `PKR ${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#4f46e5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. Utilities & Bills */}
      <SectionTitle icon={DollarSign} title="3. Utilities & Bills (PKR)" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard title="Electricity" value={`PKR ${utilities.electricity.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Gas" value={`PKR ${utilities.gas.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Water" value={`PKR ${utilities.water.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Internet" value={`PKR ${utilities.internet.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Generator/UPS" value={`PKR ${utilities.generatorUPS.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Mobile/Phone" value={`PKR ${utilities.mobilePhone.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Bills pending" value={utilities.billsPending} icon={AlertTriangle} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Utility Breakdown</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={utilityPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {utilityPie.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={UTILITY_COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `PKR ${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 4. Office Supplies & Consumables */}
      <SectionTitle icon={ShoppingCart} title="4. Office Supplies & Consumables" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Stationery" value={`PKR ${supplies.stationery.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Office supplies" value={`PKR ${supplies.officeSupplies.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Kitchen/refreshments" value={`PKR ${supplies.kitchenRefreshments.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Cleaning supplies" value={`PKR ${supplies.cleaning.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Stock shortage incidents" value={supplies.stockShortageCount} icon={AlertTriangle} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Supplies Distribution</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={suppliesPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {suppliesPie.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `PKR ${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 5. Office Rent & Facilities */}
      <SectionTitle icon={Wrench} title="5. Office Rent & Facilities" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Rent paid" value={`PKR ${rent.rentPaid.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Rent pending" value={rent.rentPending} icon={CalendarCheck} />
        <MetricCard title="Maintenance expense" value={`PKR ${rent.maintenanceExpense.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Repairs conducted" value={rent.repairsCount} icon={Wrench} />
        <MetricCard title="Facility issues logged" value={rent.facilityIssuesLogged} icon={AlertTriangle} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Rent vs Maintenance</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rentBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `PKR ${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => `PKR ${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 6. Office Staff Management */}
      <SectionTitle icon={Users} title="6. Office Staff Management" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Office boys active" value={staffMgmt.officeBoysActive} icon={Users} />
        <MetricCard title="Absences" value={staffMgmt.officeBoysAbsences} icon={AlertTriangle} />
        <MetricCard title="Overtime hours" value={staffMgmt.overtimeHours} icon={Clock} />
        <MetricCard title="Disciplinary actions" value={staffMgmt.disciplinaryActions} icon={AlertTriangle} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Staff Activity</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={staffBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 7. Events & Entertainment */}
      <SectionTitle icon={Building} title="7. Events & Entertainment" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Events conducted" value={events.eventsConducted} icon={Calendar} />
        <MetricCard title="Event expense (PKR)" value={`PKR ${events.eventExpense.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Entertainment expense" value={`PKR ${events.entertainmentExpense.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Events pending" value={events.eventsPending} icon={FileText} />
        <MetricCard title="Over-budget events" value={events.overBudgetEvents} icon={AlertTriangle} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Event vs Entertainment Expenses</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `PKR ${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => `PKR ${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 8. Asset & Inventory Control */}
      <SectionTitle icon={Package} title="8. Asset & Inventory Control" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Assets purchased" value={asset.assetsPurchased} icon={Package} />
        <MetricCard title="Assets disposed" value={asset.assetsDisposed} icon={Package} />
        <MetricCard title="Assets issued" value={asset.assetsIssued} icon={Package} />
        <MetricCard title="Missing/damaged" value={asset.missingDamaged} icon={AlertTriangle} />
        <MetricCard title="Inventory register updated" value={asset.inventoryUpdated} icon={FileText} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Asset Movement</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={assetPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {assetPie.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 9. Vendor & Service Providers */}
      <SectionTitle icon={Truck} title="9. Vendor & Service Providers" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Active vendors" value={vendor.activeVendors} icon={Truck} />
        <MetricCard title="Payments made" value={`PKR ${vendor.paymentsMade.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="Payments pending" value={`PKR ${vendor.paymentsPending.toLocaleString()}`} icon={DollarSign} />
        <MetricCard title="New vendors" value={vendor.newVendors} icon={Truck} />
        <MetricCard title="Contracts expiring (60d)" value={vendor.contractsExpiring60Days} icon={AlertTriangle} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Vendor Payments</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendorBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `PKR ${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => `PKR ${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 10. Compliance & Approvals */}
      <SectionTitle icon={ClipboardCheck} title="10. Compliance & Approvals" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Approved expenses" value={compliance.approved} icon={DollarSign} />
        <MetricCard title="Rejected expenses" value={compliance.rejected} icon={DollarSign} />
        <MetricCard title="Pending approvals" value={compliance.pendingApprovals} icon={FileText} />
        <MetricCard title="Policy violations" value={compliance.policyViolations} icon={AlertTriangle} />
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Approval Status</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={compliancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {compliancePie.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 11. Documentation & Records */}
      <SectionTitle icon={FileText} title="11. Documentation & Records" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Bills filed" value={docs.billsFiled} icon={FileText} />
        <MetricCard title="Receipts attached" value={docs.receiptsAttached} icon={FileText} />
        <MetricCard title="Petty cash reconciled" value={docs.reconciliationDone} icon={FileText} />
        <MetricCard title="Missing documents" value={docs.missingDocuments} icon={AlertTriangle} />
      </div>
    </div>
  );
}

// Reusable SectionTitle
function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3 mt-4">
      <Icon className="h-5 w-5 text-indigo-600" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}