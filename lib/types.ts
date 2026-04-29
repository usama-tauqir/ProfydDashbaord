// Department types
export type Department =
  | "ceo"
  | "support"
  | "sales"
  | "finance"
  | "marketing"
  | "hr"
  | "recruitment"
  | "training"
  | "admin"
  | "teachers"

export type Role = "staff" | "team_lead" | "teacher"

// User type
export interface User {
  id: string
  email: string
  companyName: string
  firstName: string
  middleName?: string
  lastName: string
  department: Department
  role: Role
  createdAt: Date
}

// Department configuration
export interface DepartmentConfig {
  id: Department
  name: string
  description: string
  icon: string
  color: string
  pages: DepartmentPage[]
}

export interface DepartmentPage {
  id: string
  name: string
  path: string
  icon: string
  description?: string
}

// Chart data types
export interface ChartData {
  name: string
  value: number
  fill?: string
}

export interface TimeSeriesData {
  date: string
  [key: string]: string | number
}

// Form field types
export interface FormField {
  id?: string
  name?: string
  label: string
  type: "text" | "number" | "select" | "date" | "textarea" | "percentage" | "email"
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
}

// Department data entry types
export interface DataEntry {
  id: string
  departmentId: Department
  pageId: string
  data: Record<string, unknown>
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Permission types
export interface PagePermission {
  userId: string
  pageId: string
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface ClassRecord {
  id?: string;
  date: string;
  sort_order: number;
  month_key?: string;
  completed: {
    soha: number; zainab: number; fatima: number; sam: number; alveena: number;
    missRahat: number; sirUzair: number; sirAdnan: number; imaan: number; tazeen: number; anna: number;
    dailyTotal: number;
  };
  cancelled: {
    anna: number; imaan: number; soha: number; zainab: number; fatima: number; sam: number;
    alveena: number; missRahat: number; sirUzair: number; sirAdnan: number; tazeen: number;
    dailyTotal: number;
  };
}