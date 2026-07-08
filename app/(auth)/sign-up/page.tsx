"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Mail,
  Lock,
  User,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowRight,
  Users,
  Sparkles,
  Phone,
  GraduationCap,
  Clock3
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { departments } from "@/lib/departments"
import { companies } from "@/lib/companies"
import { supabase } from "@/lib/supabase/client"

type AllowedRole = "staff" | "manager" | "team_lead" | "teacher"

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    companyName: "",
    department: "",
    role: "",
    phone: "",
    qualification: "",
    experienceYears: "",
    timezone: "Asia/Karachi",
    canTakeTrials: "yes",
    canTakeWeekendClasses: "yes",
  })

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  })

  const isTeacherDepartment = formData.department === "teachers"

  const roleOptions = useMemo(() => {
    if (isTeacherDepartment) {
      return [{ label: "Teacher", value: "teacher" as AllowedRole }]
    }

    return [
      { label: "Staff", value: "staff" as AllowedRole },
      { label: "Manager", value: "manager" as AllowedRole },
      { label: "Team Lead", value: "team_lead" as AllowedRole },
    ]
  }, [isTeacherDepartment])

  const validatePassword = (password: string) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      if (field === "department") {
        if (value === "teachers") {
          updated.role = "teacher"
        } else if (updated.role === "teacher") {
          updated.role = ""
        }
      }

      return updated
    })

    if (field === "password") {
      validatePassword(value)
    }
  }

  const getPasswordStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length
  }

  const getPasswordStrengthColor = () => {
    const score = getPasswordStrengthScore()
    if (score <= 2) return "bg-red-500"
    if (score <= 4) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getRequestStatus = (role: string): string => {
    // CEO department accounts can only be activated manually via Supabase — no in-app approver
    if (formData.department === "ceo") return "pending_manual"
    if (isTeacherDepartment) return "pending_teacher_approval"
    if (role === "staff") return "pending_teamlead"
    if (role === "team_lead") return "pending_manager"
    if (role === "manager") return "pending_ceo"
    return "pending"
  }

  const getRequestNotes = (role: string): string => {
    if (formData.department === "ceo") return "CEO department account submitted. Requires manual activation by the system administrator."
    if (isTeacherDepartment) return "Teacher account submitted. Waiting for manager/admin approval."
    if (role === "staff") return "Staff account submitted. Waiting for Team Lead approval."
    if (role === "team_lead") return "Team Lead account submitted. Waiting for Manager approval."
    if (role === "manager") return "Manager account submitted. Waiting for CEO approval."
    return "Account submitted."
  }

  const createSignupRequest = async (userId: string) => {
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
    const role = formData.department === "teachers" ? "teacher" : formData.role

    const { error } = await supabase.from("signup_requests").insert({
      user_id: userId,
      email: formData.email.trim().toLowerCase(),
      full_name: fullName,
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      company_name: formData.companyName || null,
      department: formData.department,
      requested_role: role,
      request_status: getRequestStatus(role),
      phone: formData.phone.trim() || null,
      qualification: isTeacherDepartment ? formData.qualification.trim() || null : null,
      experience_years: isTeacherDepartment && formData.experienceYears
        ? Number(formData.experienceYears)
        : null,
      timezone: isTeacherDepartment ? formData.timezone : null,
      can_take_trials: isTeacherDepartment ? formData.canTakeTrials === "yes" : null,
      can_take_weekend_classes: isTeacherDepartment ? formData.canTakeWeekendClasses === "yes" : null,
      notes: getRequestNotes(role),
    })

    if (error) {
      throw error
    }
  }
  const finalRole = formData.department === "teachers" ? "teacher" : formData.role
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    if (!formData.password) {
      setError("Password is required")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (getPasswordStrengthScore() < 3) {
      setError("Please choose a stronger password")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!formData.companyName) {
      setError("Please select a company")
      return
    }

    if (!formData.firstName.trim()) {
      setError("First name is required")
      return
    }

    if (!formData.lastName.trim()) {
      setError("Last name is required")
      return
    }

    if (!formData.department) {
      setError("Department is required")
      return
    }

    if (formData.department !== "teachers" && !formData.role) {
  setError("Role is required")
  return
}

    if (isTeacherDepartment) {
      if (!formData.phone.trim()) {
        setError("Phone is required for teachers")
        return
      }
      if (!formData.qualification.trim()) {
        setError("Qualification is required for teachers")
        return
      }
    }

    setLoading(true)

    try {
      const signUpResult = await signUp({
  email: formData.email.trim(),
  password: formData.password,
  firstName: formData.firstName.trim(),
  lastName: formData.lastName.trim(),
  companyName: formData.companyName.trim(),
  department: formData.department as any,
  role: finalRole as any,
  phone: formData.phone.trim(),
})

const newUserId = signUpResult.user?.id

if (newUserId) {
  await createSignupRequest(newUserId)
  // CEO dept has no in-app approver — skip email notification
  // Notify approvers by email (fire-and-forget)
  if (formData.department !== "ceo") fetch("/api/notify-approval", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "new_request",
      applicantName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      applicantEmail: formData.email.trim(),
      department: formData.department,
      role: formData.department === "teachers" ? "teacher" : formData.role,
      companyName: formData.companyName,
    }),
  }).catch(() => {/* email errors are non-fatal */})
}

      setSuccess(true)
      setTimeout(() => {
        router.push("/sign-in?registered=true")
      }, 2000)
    } catch (error: any) {
      console.error("Sign up error:", error)

      if (error.message?.includes("User already registered")) {
        setError("An account with this email already exists")
      } else {
        setError(error.message || "Failed to sign up. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm mb-8"
            >
              <Users className="h-12 w-12" />
            </motion.div>

            <h1 className="text-5xl font-bold mb-4">Join Us Today</h1>
            <p className="text-xl text-white/90 mb-8 max-w-md">
              Create your account and start managing your business operations efficiently
            </p>

            <div className="grid grid-cols-2 gap-4 mt-12">
              {[
                "Teacher approval flow",
                "Department-based signup",
                "Secure role mapping",
                "Scalable enterprise setup"
              ].map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Join our platform today</p>
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white hidden lg:block">
                Create Account
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400 hidden lg:block">
                Fill in your details to get started
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert className="bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200 text-green-600 dark:bg-green-950/30">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Account created! Redirecting to sign in...
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        className="pl-10 h-11 rounded-xl"
                        placeholder="John"
                        disabled={loading || success}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="Doe"
                      disabled={loading || success}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company</Label>
                  <Select
                    value={formData.companyName}
                    onValueChange={(value) => handleChange("companyName", value)}
                    disabled={loading || success}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <SelectValue placeholder="Select your company" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleChange("department", value)}
                    disabled={loading || success}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                      {/* <SelectItem value="teachers">Teachers</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>

                {formData.department !== "teachers" ? (
  <div className="space-y-2">
    <Label htmlFor="role">Role</Label>
    <Select
      value={formData.role}
      onValueChange={(value) => handleChange("role", value)}
      disabled={loading || success}
    >
      <SelectTrigger className="h-11 rounded-xl">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {roleOptions.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
) : (
  <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
    Teachers department ke liye role automatically <strong>Teacher</strong> set hoga.
  </div>
)}

                {isTeacherDepartment && (
                  <div className="space-y-4 rounded-2xl border p-4 bg-muted/30">
                    <div>
                      <h3 className="font-semibold">Teacher Information</h3>
                      <p className="text-sm text-muted-foreground">
                        Yeh fields teacher approval aur profile creation ke liye required hain.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          className="pl-10 h-11 rounded-xl"
                          placeholder="+92xxxxxxxxxx"
                          disabled={loading || success}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qualification">Qualification</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="qualification"
                          value={formData.qualification}
                          onChange={(e) => handleChange("qualification", e.target.value)}
                          className="pl-10 h-11 rounded-xl"
                          placeholder="BS Mathematics"
                          disabled={loading || success}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experienceYears">Experience Years</Label>
                      <div className="relative">
                        <Clock3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="experienceYears"
                          type="number"
                          min="0"
                          value={formData.experienceYears}
                          onChange={(e) => handleChange("experienceYears", e.target.value)}
                          className="pl-10 h-11 rounded-xl"
                          placeholder="2"
                          disabled={loading || success}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={formData.timezone}
                        onChange={(e) => handleChange("timezone", e.target.value)}
                        className="h-11 rounded-xl"
                        placeholder="Asia/Karachi"
                        disabled={loading || success}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Can Take Trials</Label>
                        <Select
                          value={formData.canTakeTrials}
                          onValueChange={(value) => handleChange("canTakeTrials", value)}
                          disabled={loading || success}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Weekend Classes</Label>
                        <Select
                          value={formData.canTakeWeekendClasses}
                          onValueChange={(value) => handleChange("canTakeWeekendClasses", value)}
                          disabled={loading || success}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                      placeholder="name@company.com"
                      disabled={loading || success}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className="pl-10 pr-10 h-11 rounded-xl"
                      placeholder="Create a strong password"
                      disabled={loading || success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {formData.password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1 h-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-full flex-1 rounded-full ${
                              i < getPasswordStrengthScore() ? getPasswordStrengthColor() : "bg-gray-200 dark:bg-gray-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      className="pl-10 pr-10 h-11 rounded-xl"
                      placeholder="Confirm your password"
                      disabled={loading || success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl"
                  disabled={loading || success}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="px-0 pt-6">
              <div className="text-sm text-center text-gray-500 dark:text-gray-400 w-full">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}