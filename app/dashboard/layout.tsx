"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DepartmentSidebar } from "@/components/dashboard/department-sidebar"
import { PageHeader } from "@/components/dashboard/page-header"
import { useAuth } from "@/lib/auth-context"

const ALLOWED_DEPARTMENTS = [
  "training",
  "teachers",
  "support",
  "sales",
  "finance",
  "marketing",
  "hr",
  "recruitment",
  "admin",
  "ceo",
] as const

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, supabaseUser, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const userDepartment = useMemo(() => {
    return (
      user?.department ||
      (supabaseUser?.user_metadata?.department as string | undefined) ||
      ""
    )
  }, [user, supabaseUser])

  useEffect(() => {
    if (!isClient || isLoading) return

    // Add a small delay to allow auth state to settle
    const timeoutId = setTimeout(() => {
      if (!user && !supabaseUser) {
        router.replace("/sign-in")
        return
      }

      const segments = pathname.split("/").filter(Boolean)
      const isDashboardRoot = pathname === "/dashboard"
      const requestedDepartment = segments[1] || ""

      if (isDashboardRoot) {
        router.replace(`/dashboard/${userDepartment}`)
        return
      }

      if (
        requestedDepartment &&
        ALLOWED_DEPARTMENTS.includes(requestedDepartment as (typeof ALLOWED_DEPARTMENTS)[number]) &&
        requestedDepartment !== userDepartment
      ) {
        router.replace(`/dashboard/${userDepartment}`)
        return
      }
    }, 100) // Small delay to allow auth state to propagate

    return () => clearTimeout(timeoutId)
  }, [isClient, isLoading, pathname, router, user, supabaseUser, userDepartment])

  if (!isClient || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user && !supabaseUser) return null
  if (!userDepartment) return null

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen>
        <DepartmentSidebar departmentId={userDepartment} />
        <SidebarInset className="flex flex-col overflow-hidden bg-background">
          <PageHeader />
          <main className="flex-1 overflow-auto bg-background p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}