'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DollarSign,
  RotateCcw,
  Ban,
  AlertTriangle,
  Plus,
  TrendingUp,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
  CalendarDays,
  Shield,
  FileText,
  CheckCircle,
  Search,
  ChevronsUpDown,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

type BillingRecord = {
  id: string
  type: string
  invoice_id: string | null
  student_id: string | null
  student_name: string | null
  amount: number
  status: string | null
  date: string
  due_date: string | null
  method: string | null
  reason: string | null
  aging_days: number | null
  transaction_id: string | null
}

type StudentOption = {
  student_id: string
  student_name: string
}

const TABS = ['invoiced', 'collected', 'receivable', 'void', 'refund', 'chargeback'] as const
const tabLabels: Record<string, string> = {
  invoiced: 'Invoiced',
  collected: 'Collected',
  receivable: 'Receivables',
  void: 'Voids',
  refund: 'Refunds',
  chargeback: 'Chargebacks',
}

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
    open: 'bg-red-100 text-red-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-gray-100 text-gray-800',
  }
  return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

const methodColor = (method: string) => {
  const map: Record<string, string> = {
    'credit card': 'bg-blue-100 text-blue-800',
    'bank transfer': 'bg-purple-100 text-purple-800',
    paypal: 'bg-sky-100 text-sky-800',
    stripe: 'bg-indigo-100 text-indigo-800',
  }
  return map[method?.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

const agingColor = (days: number) => {
  if (days <= 30) return 'bg-yellow-100 text-yellow-800'
  if (days <= 60) return 'bg-orange-100 text-orange-800'
  if (days <= 90) return 'bg-red-100 text-red-800'
  return 'bg-red-200 text-red-900'
}

const agingLabel = (days: number) => {
  if (days <= 30) return '0-30 days'
  if (days <= 60) return '31-60 days'
  if (days <= 90) return '61-90 days'
  return '90+ days'
}

export default function CashBillingPage() {
  const [activeTab, setActiveTab] = useState<string>('invoiced')
  const [records, setRecords] = useState<BillingRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [agingFilter, setAgingFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<BillingRecord>>({
    type: activeTab,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  })

  const [studentSearch, setStudentSearch] = useState('')
  const [students, setStudents] = useState<StudentOption[]>([])
  const [studentSelectOpen, setStudentSelectOpen] = useState(false)

  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoices, setInvoices] = useState<{ invoice_id: string; student_name: string; amount: number }[]>([])
  const [invoiceSelectOpen, setInvoiceSelectOpen] = useState(false)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('billing_records').select('*').eq('type', activeTab)
    if (search) {
      query = query.or(
        `invoice_id.ilike.%${search}%,student_name.ilike.%${search}%,transaction_id.ilike.%${search}%`
      )
    }
    if (activeTab === 'invoiced' && statusFilter !== 'all') query = query.eq('status', statusFilter)
    if ((activeTab === 'void' || activeTab === 'refund') && reasonFilter !== 'all') query = query.eq('reason', reasonFilter)
    if (activeTab === 'collected' && methodFilter !== 'all') query = query.eq('method', methodFilter)
    if (activeTab === 'receivable' && agingFilter !== 'all') {
      const [min, max] = agingFilter.split('-').map(Number)
      if (max) query = query.gte('aging_days', min).lte('aging_days', max)
      else if (agingFilter === '90+') query = query.gte('aging_days', 90)
    }
    const { data, error } = await query.order('date', { ascending: false })
    if (!error && data) setRecords(data as BillingRecord[])
    setLoading(false)
  }, [activeTab, search, statusFilter, reasonFilter, methodFilter, agingFilter])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('current_students')
      .select('student_id, student_name')
      .order('student_name')
    if (data) setStudents(data as StudentOption[])
  }

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('billing_records')
      .select('invoice_id, student_name, amount')
      .eq('type', 'invoiced')
      .order('date', { ascending: false })
    if (data) setInvoices(data)
  }

  useEffect(() => {
    fetchStudents()
    fetchInvoices()
  }, [])

  const generateInvoiceId = async () => {
    const { data } = await supabase.rpc('generate_invoice_id')
    if (data) setFormData(prev => ({ ...prev, invoice_id: data }))
  }

  const onStudentSelect = (studentId: string, studentName: string) => {
    setFormData({
      ...formData,
      student_id: studentId,
      student_name: studentName,
    })
    setStudentSelectOpen(false)
    if (activeTab === 'invoiced' && !formData.invoice_id) {
      generateInvoiceId()
    }
  }

  const onInvoiceSelect = (inv: { invoice_id: string; student_name: string; amount: number }) => {
    setFormData({
      ...formData,
      invoice_id: inv.invoice_id,
      student_name: inv.student_name,
      amount: inv.amount,
    })
    setInvoiceSelectOpen(false)
  }

  const handleAddRecord = async () => {
    if (!formData.amount || !formData.student_name) {
      alert('Please fill in student name and amount')
      return
    }
    const { error } = await supabase.from('billing_records').insert([{
      ...formData,
      type: activeTab,
      amount: parseFloat(formData.amount.toString()),
      aging_days: formData.aging_days ? parseInt(formData.aging_days.toString()) : null,
    }])
    if (error) alert(error.message)
    else {
      setFormOpen(false)
      setFormData({ type: activeTab, amount: 0, date: new Date().toISOString().split('T')[0] })
      fetchRecords()
      fetchInvoices()
    }
  }

  const getMetrics = () => {
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
    const count = records.length
    let paid = 0, pending = 0, overdue = 0, refunded = 0
    let under30 = 0, d30to60 = 0, d60to90 = 0, over90 = 0
    if (activeTab === 'invoiced') {
      paid = records.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0)
      pending = records.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
      overdue = records.filter(r => r.status === 'overdue').reduce((s, r) => s + r.amount, 0)
      refunded = records.filter(r => r.status === 'refunded').reduce((s, r) => s + r.amount, 0)
    }
    if (activeTab === 'receivable') {
      under30 = records.filter(r => (r.aging_days || 0) <= 30).reduce((s, r) => s + r.amount, 0)
      d30to60 = records.filter(r => (r.aging_days || 0) > 30 && (r.aging_days || 0) <= 60).reduce((s, r) => s + r.amount, 0)
      d60to90 = records.filter(r => (r.aging_days || 0) > 60 && (r.aging_days || 0) <= 90).reduce((s, r) => s + r.amount, 0)
      over90 = records.filter(r => (r.aging_days || 0) > 90).reduce((s, r) => s + r.amount, 0)
    }
    return { totalAmount, count, paid, pending, overdue, refunded, under30, d30to60, d60to90, over90 }
  }
  const metrics = getMetrics()

  // ---------- METRICS RENDERER ----------
  const renderMetrics = () => {
    switch (activeTab) {
      case 'invoiced':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Invoiced" value={metrics.totalAmount} icon={FileText} />
            <MetricCard title="Paid" value={metrics.paid} icon={CheckCircle} color="text-green-600" />
            <MetricCard title="Pending" value={metrics.pending} icon={Clock} color="text-yellow-600" />
            <MetricCard title="Overdue" value={metrics.overdue} icon={AlertTriangle} color="text-red-600" />
          </div>
        )
      case 'collected':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Collected" value={metrics.totalAmount} icon={DollarSign} />
            <MetricCard title="Credit Card" value={records.filter(r => r.method === 'credit card').reduce((s, r) => s + r.amount, 0)} icon={CreditCard} color="text-blue-600" />
            <MetricCard title="Bank Transfer" value={records.filter(r => r.method === 'bank transfer').reduce((s, r) => s + r.amount, 0)} icon={Banknote} color="text-purple-600" />
            <MetricCard title="PayPal" value={records.filter(r => r.method === 'paypal').reduce((s, r) => s + r.amount, 0)} icon={Wallet} color="text-sky-600" />
          </div>
        )
      case 'receivable':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <MetricCard title="Total Outstanding" value={metrics.totalAmount} icon={AlertTriangle} />
            <MetricCard title="0-30 Days" value={metrics.under30} icon={Clock} color="text-yellow-600" />
            <MetricCard title="31-60 Days" value={metrics.d30to60} icon={Clock} color="text-orange-600" />
            <MetricCard title="61-90 Days" value={metrics.d60to90} icon={Clock} color="text-red-600" />
            <MetricCard title="90+ Days" value={metrics.over90} icon={AlertTriangle} color="text-red-800" />
          </div>
        )
      case 'void':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Voids" value={metrics.count} icon={Ban} />
            <MetricCard title="Total Amount" value={metrics.totalAmount} icon={DollarSign} />
            <MetricCard title="This Month" value={records.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length} icon={CalendarDays} color="text-blue-600" />
            <MetricCard title="Avg. Void" value={metrics.count ? (metrics.totalAmount / metrics.count) : 0} icon={TrendingUp} color="text-gray-600" />
          </div>
        )
      case 'refund':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Refunds" value={metrics.count} icon={RotateCcw} />
            <MetricCard title="Total Amount" value={metrics.totalAmount} icon={DollarSign} />
            <MetricCard title="This Month" value={records.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length} icon={CalendarDays} color="text-blue-600" />
            <MetricCard title="Avg. Refund" value={metrics.count ? (metrics.totalAmount / metrics.count) : 0} icon={TrendingUp} color="text-gray-600" />
          </div>
        )
      case 'chargeback':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <MetricCard title="Total Cases" value={metrics.count} icon={AlertTriangle} />
            <MetricCard title="Open" value={records.filter(r => r.status === 'open').reduce((s, r) => s + r.amount, 0)} icon={Shield} color="text-red-600" />
            <MetricCard title="Won" value={records.filter(r => r.status === 'won').reduce((s, r) => s + r.amount, 0)} icon={Shield} color="text-green-600" />
            <MetricCard title="Lost" value={records.filter(r => r.status === 'lost').reduce((s, r) => s + r.amount, 0)} icon={Shield} color="text-gray-600" />
            <MetricCard title="Total Amount" value={metrics.totalAmount} icon={DollarSign} />
          </div>
        )
      default:
        return null
    }
  }

  // ---------- FILTERS RENDERER ----------
  const renderFilters = () => {
    const searchInput = (
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    )
    if (activeTab === 'invoiced') {
      return (
        <div className="flex gap-4">
          {searchInput}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (activeTab === 'collected') {
      return (
        <div className="flex gap-4">
          {searchInput}
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="credit card">Credit Card</SelectItem>
              <SelectItem value="bank transfer">Bank Transfer</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (activeTab === 'receivable') {
      return (
        <div className="flex gap-4">
          {searchInput}
          <Select value={agingFilter} onValueChange={setAgingFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Aging" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="0-30">0-30 days</SelectItem>
              <SelectItem value="31-60">31-60 days</SelectItem>
              <SelectItem value="61-90">61-90 days</SelectItem>
              <SelectItem value="90+">90+ days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (activeTab === 'void' || activeTab === 'refund') {
      return (
        <div className="flex gap-4">
          {searchInput}
          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              <SelectItem value="duplicate charge">Duplicate charge</SelectItem>
              <SelectItem value="customer request">Customer request</SelectItem>
              <SelectItem value="billing error">Billing error</SelectItem>
              <SelectItem value="service cancelled">Service cancelled</SelectItem>
              <SelectItem value="cancellation">Cancellation</SelectItem>
              <SelectItem value="unsatisfactory service">Unsatisfactory service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (activeTab === 'chargeback') {
      return (
        <div className="flex gap-4">
          {searchInput}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
    return null
  }

  // ---------- TABLE RENDERER ----------
  const renderTable = () => {
    const headers = {
      invoiced: ['Invoice ID', 'Student', 'Amount', 'Status', 'Date', 'Due Date'],
      collected: ['Payment ID', 'Invoice', 'Student', 'Amount', 'Method', 'Date'],
      receivable: ['Invoice', 'Student', 'Amount', 'Due Date', 'Days Overdue', 'Aging'],
      void: ['Void ID', 'Invoice', 'Student', 'Amount', 'Reason', 'Date'],
      refund: ['Refund ID', 'Invoice', 'Student', 'Amount', 'Reason', 'Date'],
      chargeback: ['Case ID', 'Transaction', 'Student', 'Amount', 'Reason', 'Status', 'Date'],
    }[activeTab] || []

    const renderRow = (record: BillingRecord) => {
      switch (activeTab) {
        case 'invoiced':
          return (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.invoice_id}</TableCell>
              <TableCell>{record.student_name}</TableCell>
              <TableCell>${record.amount}</TableCell>
              <TableCell><Badge className={statusColor(record.status || '')}>{record.status}</Badge></TableCell>
              <TableCell>{record.date}</TableCell>
              <TableCell>{record.due_date}</TableCell>
            </TableRow>
          )
        case 'collected':
          return (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.id.slice(0, 8)}</TableCell>
              <TableCell>{record.invoice_id}</TableCell>
              <TableCell>{record.student_name}</TableCell>
              <TableCell>${record.amount}</TableCell>
              <TableCell><Badge className={methodColor(record.method || '')}>{record.method}</Badge></TableCell>
              <TableCell>{record.date}</TableCell>
            </TableRow>
          )
        case 'receivable':
          return (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.invoice_id}</TableCell>
              <TableCell>{record.student_name}</TableCell>
              <TableCell>${record.amount}</TableCell>
              <TableCell>{record.due_date}</TableCell>
              <TableCell>{record.aging_days} days</TableCell>
              <TableCell><Badge className={agingColor(record.aging_days || 0)}>{agingLabel(record.aging_days || 0)}</Badge></TableCell>
            </TableRow>
          )
        case 'void':
          return (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.id.slice(0, 8)}</TableCell>
              <TableCell>{record.invoice_id}</TableCell>
              <TableCell>{record.student_name}</TableCell>
              <TableCell>${record.amount}</TableCell>
              <TableCell>{record.reason}</TableCell>
              <TableCell>{record.date}</TableCell>
            </TableRow>
          )
        case 'refund':
          return (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.id.slice(0, 8)}</TableCell>
              <TableCell>{record.invoice_id}</TableCell>
              <TableCell>{record.student_name}</TableCell>
              <TableCell>${record.amount}</TableCell>
              <TableCell>{record.reason}</TableCell>
              <TableCell>{record.date}</TableCell>
            </TableRow>
          )
        case 'chargeback':
          return (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.id.slice(0, 8)}</TableCell>
              <TableCell>{record.transaction_id}</TableCell>
              <TableCell>{record.student_name}</TableCell>
              <TableCell>${record.amount}</TableCell>
              <TableCell>{record.reason}</TableCell>
              <TableCell><Badge className={statusColor(record.status || '')}>{record.status}</Badge></TableCell>
              <TableCell>{record.date}</TableCell>
            </TableRow>
          )
        default:
          return null
      }
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>{headers.map((h, i) => (<TableHead key={i}>{h}</TableHead>))}</TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow><TableCell colSpan={headers.length} className="text-center py-6 text-muted-foreground">No records</TableCell></TableRow>
          ) : (
            records.map(renderRow)
          )}
        </TableBody>
      </Table>
    )
  }

  // ---------- FORM FIELDS ----------
  const renderFormFields = () => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {(activeTab === 'invoiced' || activeTab === 'receivable') && (
            <div className="col-span-2">
              <Label>Student *</Label>
              <Popover open={studentSelectOpen} onOpenChange={setStudentSelectOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {formData.student_name || "Search student..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search student..." onValueChange={setStudentSearch} />
                    <CommandList>
                      <CommandEmpty>No student found.</CommandEmpty>
                      <CommandGroup>
                        {students
                          .filter(s => s.student_name.toLowerCase().includes(studentSearch.toLowerCase()))
                          .map(s => (
                            <CommandItem
                              key={s.student_id}
                              value={s.student_name}
                              onSelect={() => onStudentSelect(s.student_id, s.student_name)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", formData.student_id === s.student_id ? "opacity-100" : "opacity-0")} />
                              {s.student_name}
                            </CommandItem>
                          ))
                        }
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {(activeTab === 'collected' || activeTab === 'void' || activeTab === 'refund') && (
            <div className="col-span-2">
              <Label>Link to Invoice</Label>
              <Popover open={invoiceSelectOpen} onOpenChange={setInvoiceSelectOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {formData.invoice_id ? `${formData.invoice_id} - ${formData.student_name}` : "Select invoice..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0">
                  <Command>
                    <CommandInput placeholder="Search invoice..." onValueChange={setInvoiceSearch} />
                    <CommandList>
                      <CommandEmpty>No invoice found.</CommandEmpty>
                      <CommandGroup>
                        {invoices
                          .filter(inv => inv.invoice_id?.toLowerCase().includes(invoiceSearch.toLowerCase()) || inv.student_name.toLowerCase().includes(invoiceSearch.toLowerCase()))
                          .map(inv => (
                            <CommandItem
                              key={inv.invoice_id}
                              value={inv.invoice_id!}
                              onSelect={() => onInvoiceSelect(inv as any)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", formData.invoice_id === inv.invoice_id ? "opacity-100" : "opacity-0")} />
                              {inv.invoice_id} - {inv.student_name} (${inv.amount})
                            </CommandItem>
                          ))
                        }
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div>
            <Label>Student Name *</Label>
            <Input name="student_name" value={formData.student_name || ''} onChange={handleChange} />
          </div>
          <div>
            <Label>Amount *</Label>
            <Input name="amount" type="number" step="0.01" value={formData.amount || ''} onChange={handleChange} />
          </div>

          {activeTab === 'invoiced' && (
            <>
              <div>
                <Label>Invoice ID (auto)</Label>
                <Input name="invoice_id" value={formData.invoice_id || ''} onChange={handleChange} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status || 'pending'} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" name="date" value={formData.date || ''} onChange={handleChange} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" name="due_date" value={formData.due_date || ''} onChange={handleChange} />
              </div>
            </>
          )}
          {activeTab === 'collected' && (
            <>
              <div>
                <Label>Method</Label>
                <Select value={formData.method || 'credit card'} onValueChange={(v) => setFormData({ ...formData, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit card">Credit Card</SelectItem>
                    <SelectItem value="bank transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" name="date" value={formData.date || ''} onChange={handleChange} />
              </div>
            </>
          )}
          {activeTab === 'receivable' && (
            <>
              <div>
                <Label>Due Date</Label>
                <Input type="date" name="due_date" value={formData.due_date || ''} onChange={handleChange} />
              </div>
              <div>
                <Label>Days Overdue</Label>
                <Input type="number" name="aging_days" value={formData.aging_days || ''} onChange={handleChange} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" name="date" value={formData.date || ''} onChange={handleChange} />
              </div>
            </>
          )}
          {(activeTab === 'void' || activeTab === 'refund') && (
            <>
              <div>
                <Label>Reason</Label>
                <Input name="reason" value={formData.reason || ''} onChange={handleChange} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" name="date" value={formData.date || ''} onChange={handleChange} />
              </div>
            </>
          )}
          {activeTab === 'chargeback' && (
            <>
              <div>
                <Label>Transaction ID</Label>
                <Input name="transaction_id" value={formData.transaction_id || ''} onChange={handleChange} />
              </div>
              <div>
                <Label>Reason</Label>
                <Input name="reason" value={formData.reason || ''} onChange={handleChange} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status || 'open'} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" name="date" value={formData.date || ''} onChange={handleChange} />
              </div>
            </>
          )}
        </div>
        <Button onClick={handleAddRecord} className="w-full">Save Record</Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cash & Billing</h1>
        <p className="text-muted-foreground">Manage invoices, payments, and billing adjustments</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setStatusFilter('all'); setReasonFilter('all'); setMethodFilter('all'); setAgingFilter('all'); setSearch('') }}>
        <TabsList className="grid grid-cols-6">
          {TABS.map(tab => <TabsTrigger key={tab} value={tab} className="capitalize">{tabLabels[tab]}</TabsTrigger>)}
        </TabsList>

        {TABS.map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-6">
            {renderMetrics()}
            <div className="flex items-center justify-between">
              <div className="flex gap-4">{renderFilters()}</div>
              <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" /> Add {tabLabels[tab]}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Add New {tabLabels[tab]} Record</DialogTitle></DialogHeader>
                  {renderFormFields()}
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="pt-6">{renderTable()}</CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || ''}`}>
          {title.toLowerCase().includes('count') || title.toLowerCase().includes('cases') || title.toLowerCase().includes('voids') || title.toLowerCase().includes('refunds')
            ? value
            : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
        </div>
      </CardContent>
    </Card>
  )
}