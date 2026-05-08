import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Clock,
  BookOpen,
  MessageSquare,
  Calendar,
  TrendingUp,
  FileText,
  Settings,
  UserPlus,
  Shield,
  BarChart,
  CheckSquare,
  DollarSign,
  User,
  Bell,
  AlertCircle,
  LineChart,
  BarChartBig,
} from 'lucide-react'
import { title } from 'process'

export const DEPARTMENT_SIDEBAR_ITEMS = {
  training: [
    {
      title: 'Dashboard',
      href: '/dashboard/training',
      icon: LayoutDashboard,
    },
    {
      title: 'Interviews',
      href: '/dashboard/training/interviews',
      icon: Users,
      subItems: [
        { title: 'All Interviews', href: '/dashboard/training/interviews' },
        { title: 'New Interview', href: '/dashboard/training/interviews/new' },
        { title: 'Analytics', href: '/dashboard/training/interviews/analytics' },
      ]
    },
    {
      title: 'Training Trials',
      href: '/dashboard/training/trials',
      icon: ClipboardList,
      subItems: [
        { title: 'All Trials', href: '/dashboard/training/trials' },
        { title: 'Week 1 Evaluation', href: '/dashboard/training/trials/week1-evaluation' },
        { title: 'Week 2 Evaluation', href: '/dashboard/training/trials/week2-evaluation' },
        { title: 'Final Decision', href: '/dashboard/training/trials/final-decision' },
      ]
    },
    {
      title: 'Attendance',
      href: '/dashboard/training/attendance',
      icon: Clock,
      subItems: [
        { title: 'Daily Attendance', href: '/dashboard/training/attendance/daily' },
        { title: 'Monthly Summary', href: '/dashboard/training/attendance/monthly' },
        { title: 'Tutors', href: '/dashboard/training/attendance/tutors' },
        { title: 'Reports', href: '/dashboard/training/attendance/reports' },
      ]
    },
    {
      title: 'Training Summary',
      href: '/dashboard/training/training-summary',
      icon: BookOpen,
      subItems: [
        { title: 'Workshops', href: '/dashboard/training/training-summary/workshops' },
        { title: 'Monthly Stats', href: '/dashboard/training/training-summary/monthly-stats' },
      ]
    },
    {
      title: 'Parent Feedback',
      href: '/dashboard/training/feedback',
      icon: MessageSquare,
      subItems: [
        { title: 'All Feedback', href: '/dashboard/training/feedback' },
        { title: 'Complaints', href: '/dashboard/training/feedback/complaints' },
        { title: 'Appreciation', href: '/dashboard/training/feedback/appreciation' },
        { title: 'Resolution', href: '/dashboard/training/feedback/resolution' },
        { title: 'Analytics', href: '/dashboard/training/feedback/analytics' },
      ]
    },
    {
      title: 'PTM Records',
      href: '/dashboard/training/ptm',
      icon: Calendar,
      subItems: [
        { title: 'Scheduled', href: '/dashboard/training/ptm/scheduled' },
        { title: 'Completed', href: '/dashboard/training/ptm/completed' },
        { title: 'Summary', href: '/dashboard/training/ptm/summary' },
      ]
    },
    {
      title: 'Quality Assurance',
      href: '/dashboard/training/quality-assurance',
      icon: TrendingUp,
      subItems: [
        { title: 'Observations', href: '/dashboard/training/quality-assurance' },
        { title: 'New Observation', href: '/dashboard/training/quality-assurance/new-observation' },
        { title: 'Scheduled', href: '/dashboard/training/quality-assurance/scheduled' },
        { title: 'Performance', href: '/dashboard/training/quality-assurance/performance' },
      ]
    },
    {
      title: 'Retention',
      href: '/dashboard/training/retention',
      icon: TrendingUp,
      subItems: [
        { title: 'Monthly Stats', href: '/dashboard/training/retention' },
        { title: 'Teachers', href: '/dashboard/training/retention/teachers' },
        { title: 'Resigned', href: '/dashboard/training/retention/resigned' },
        { title: 'Analytics', href: '/dashboard/training/retention/analytics' },
      ]
    },
    {
      title: 'Onboarding',
      href: '/dashboard/training/onboarding',
      icon: UserPlus,
      subItems: [
        { title: 'Overview', href: '/dashboard/training/onboarding' },
        { title: 'Batches', href: '/dashboard/training/onboarding/batches' },
        { title: 'Interviews', href: '/dashboard/training/onboarding/interviews' },
        { title: 'Statistics', href: '/dashboard/training/onboarding/statistics' },
      ]
    },
    {
      title: 'Compliance',
      href: '/dashboard/training/compliance',
      icon: Shield,
      subItems: [
        { title: 'All Records', href: '/dashboard/training/compliance' },
        { title: 'Violations', href: '/dashboard/training/compliance/violations' },
        { title: 'Warnings', href: '/dashboard/training/compliance/warnings' },
        { title: 'Reports', href: '/dashboard/training/compliance/reports' },
      ]
    },
    {
      title: 'Student Trials',
      href: '/dashboard/training/student-trials',
      icon: Users,
      subItems: [
        { title: 'All Trials', href: '/dashboard/training/student-trials' },
        { title: 'Booked', href: '/dashboard/training/student-trials/booked' },
        { title: 'Completed', href: '/dashboard/training/student-trials/completed' },
        { title: 'Joined', href: '/dashboard/training/student-trials/joined' },
        { title: 'Analytics', href: '/dashboard/training/student-trials/analytics' },
      ]
    },
    {
      title: 'Reports',
      href: '/dashboard/training/reports',
      icon: FileText,
      subItems: [
        { title: 'Daily', href: '/dashboard/training/reports/daily' },
        { title: 'Weekly', href: '/dashboard/training/reports/weekly' },
        { title: 'Monthly', href: '/dashboard/training/reports/monthly' },
        { title: 'Quarterly', href: '/dashboard/training/reports/quarterly' },
        { title: 'Yearly', href: '/dashboard/training/reports/yearly' },
      ]
    },
    {
      title: 'Settings',
      href: '/dashboard/training/settings',
      icon: Settings,
      subItems: [
        { title: 'General', href: '/dashboard/training/settings' },
        { title: 'Tutors', href: '/dashboard/training/settings/tutors' },
        { title: 'Templates', href: '/dashboard/training/settings/templates' },
      ]
    },
    {
      title: 'Approval',
      href: '/dashboard/training/approvals',
      icon: CheckSquare,
    },
    {
      title: 'Complaints',
      href: '/dashboard/training/complaints',
      icon: MessageSquare,
    },

  ],

  admin: [
    {
      title: 'Dashboard',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Approvals',
      href: '/dashboard/admin/approvals',
      icon: CheckSquare,
    },

    {
      title: 'Office Operations',
      href: '/dashboard/admin/office_operations',
      icon: Settings,
    },

    {
      title: 'Finance Facilities',
      href: '/dashboard/admin/finance_facilities',
      icon: DollarSign,
    },

    {
      title: 'staff Events & Vendors',
      href: '/dashboard/admin/staff_events_vendors',
      icon: Users,
    },

    {
      title: 'Assets & Compliance Records',
      href: '/dashboard/admin/assets_compliance_records',
      icon: Shield,
    }
  ],
  ceo: [
    {
      title: 'Dashboard',
      href: '/dashboard/ceo',
      icon: LayoutDashboard,
    },
    {
      title: 'Admin Dashboard',
      href: '/dashboard/admin',
      icon: User,
    },

    {
      title: 'Sales Dashboard',
      href: '/dashboard/sales',
      icon: TrendingUp,
    },

    {
      title: 'Support Dashboard',
      href: '/dashboard/support',
      icon: MessageSquare,
    },

    {
      title: 'Training Dashboard',
      href: '/dashboard/training',
      icon: BookOpen,
    },

    {
      title: 'Financial Dashboard',
      href: '/dashboard/finance',
      icon: DollarSign,
    },

    {
      title: 'HR Dashboard',
      href: '/dashboard/hr',
      icon: Users,
    },

    {
      title: 'Marketing Dashboard',
      href: '/dashboard/marketing',
      icon: BarChart,
    },

    {
      title: 'Recruitment Dashboard',
      href: '/dashboard/recruitment',
      icon: UserPlus,
    },



  ],
  finance: [
    {
      title: 'Dashboard',
      href: '/dashboard/finance',
      icon: LayoutDashboard,
    },
  ],
  hr: [
  {
    title: 'Dashboard',
    href: '/dashboard/hr',
    icon: LayoutDashboard,
  },
  {
    title: 'Headcount',
    href: '/dashboard/hr/headcount',
    icon: Users,
  },
  {
    title: 'Payroll',
    href: '/dashboard/hr/payroll',
    icon: DollarSign,
  },
  {
    title: 'Payroll Ratios',
    href: '/dashboard/hr/payroll-ratios',
    icon: BarChart,
  },
  {
    title: 'Attendance',
    href: '/dashboard/hr/attendance',
    icon: Calendar,
  },
  {
    title: 'Attrition & Retention',
    href: '/dashboard/hr/attrition-retention',
    icon: TrendingUp,
  },
  {
    title: 'Contract Compliance',
    href: '/dashboard/hr/contract-compliance',
    icon: Shield,
  },
  {
    title: 'Training & Development',
    href: '/dashboard/hr/training-development',
    icon: BookOpen,
  },
],
  marketing: [
    {
      title: 'Dashboard',
      href: '/dashboard/marketing',
      icon: LayoutDashboard,
    },

    {
      title: 'Offers & Discount',
      href: '/dashboard/marketing/OffersDiscout',
      icon: BarChartBig,
    },

    {
      title: 'Marketing Spend',
      href: '/dashboard/marketing/spend',
      icon: BarChart,
    },

    {
      title: 'Marketing Leads',
      href: '/dashboard/marketing/leads',
      icon: LineChart,
    },
    {
      title: 'Funnel Performance',
      href: '/dashboard/marketing/Funnel_Performance',
      icon: BarChartBig,
    },
    

  ],
  recruitment: [
    {
      title: 'Dashboard',
      href: '/dashboard/recruitment',
      icon: LayoutDashboard,
    },
    {
      title: 'Positions',
      href: '/dashboard/positions',
      icon: UserPlus,
    },

     {
      title: 'Hiring Demand',
      href: '/dashboard/recruitment/hiring_demand',
      icon: Users,
    },

    {
      title: 'Candidate Funnel',
      href: '/dashboard/recruitment/candidate_funnel',
      icon: User,
    },

    {
      title: 'Source Performance',
      href: '/dashboard/recruitment/performance',
      icon: BarChart,
    }

  ],
  sales: [
    {
      title: 'Dashboard',
      href: '/dashboard/sales',
      icon: LayoutDashboard,
    },
    {
      title: 'Drop-off Reasons',
      href: '/dashboard/sales/dropoffs',
      
      icon: AlertCircle,
    },

    {
      title: 'Lead Funnel',
      href: '/dashboard/sales/lead-funnel',
      
      icon: BarChart,
    },

    {
      title: 'Source Performance',
      href: '/dashboard/sales/source-performance',
      
      icon: TrendingUp,
    },

    {
      title: 'Agent Performance',
      href: '/dashboard/sales/agent-performance',
      
      icon: TrendingUp,
    },

  ],
  teachers: [
  {
    title: "Dashboard",
    href: "/dashboard/teachers",
    icon: LayoutDashboard,
  },
  {
    title: "My Profile",
    href: "/dashboard/teachers/profile",
    icon: User,
    
  },
  {
    title: "My Students",
    href: "/dashboard/teachers/students",
    icon: Users,
    
  },
  {
    title: "My Classes",
    href: "/dashboard/teachers/classes",
    icon: BookOpen,
    
  },
  {
    title: "My Schedule",
    href: "/dashboard/teachers/schedule",
    icon: Calendar,
  },
  {
    title: "My Trials",
    href: "/dashboard/teachers/trials",
    icon: ClipboardList,
  },
  {
    title: "My Earnings",
    href: "/dashboard/teachers/earnings",
    icon: DollarSign,
    
  },
  {
    title: "Complaints",
    href: "/dashboard/teachers/complaints",
    icon: MessageSquare,
    
  },
  {
    title: "Teaching Record",
    href: "/dashboard/teachers/teaching-record",
    icon: FileText,
    
  },
  {
    title: "Performance",
    href: "/dashboard/teachers/performance",
    icon: TrendingUp,
    
  },
  {
    title: "Leaves",
    href: "/dashboard/teachers/leaves",
    icon: Calendar,
    
  },
  {
    title: "Notifications",
    href: "/dashboard/teachers/notifications",
    icon: Bell,
    
  },
  {
    title: "Management",
    href: "/dashboard/teachers/management",
    icon: Shield,
    
  },
],
  support: [
    {
      title: 'Dashboard',
      href: '/dashboard/support',
      icon: LayoutDashboard,
    },
    {
      title: 'Current Students',
      href: '/dashboard/support/current-students',
      icon: Users,
    },
    {
      title: 'Schedule',
      href: '/dashboard/support/schedule',
      icon: Calendar,
    },
    {
      title: 'Class Tracker',
      href: '/dashboard/support/lessons',
      icon: BookOpen,
    },
    {
      title: 'Complaints',
      href: '/dashboard/support/complaints',
      icon: MessageSquare,
    },
    {
      title: 'Retention',
      href: '/dashboard/support/retention',
      icon: TrendingUp,
    },

    
  ],
} as const