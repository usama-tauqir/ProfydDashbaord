"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { departments } from "@/lib/departments"
import { cn } from "@/lib/utils"
import { Home, FileText, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

// Icon mapping
const iconMap: Record<string, any> = {
  LayoutDashboard,
  Home,
  FileText,
  Settings,
  LogOut,
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const getIcon = (iconName?: string) => {
    if (!iconName) return LayoutDashboard
    return iconMap[iconName] || LayoutDashboard
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary" />
          <span className="font-semibold">BMS</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Dashboard */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                <Link href="/dashboard">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Departments */}
        <SidebarGroup>
          <SidebarGroupLabel>Departments</SidebarGroupLabel>
          <SidebarMenu>
            {departments.map((dept) => {
              const Icon = getIcon(dept.icon)
              const isActive = pathname.startsWith(`/dashboard/${dept.id}`)
              
              return (
                <SidebarMenuItem key={dept.id}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                  >
                    <Link href={`/dashboard/${dept.id}`}>
                      <Icon className="h-4 w-4" style={{ color: dept.color }} />
                      <span>{dept.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  
                  {/* Show subpages if active */}
                  {isActive && dept.pages && dept.pages.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {dept.pages.map((page) => (
                        <SidebarMenuButton
                          key={page.id}
                          asChild
                          size="sm"
                          isActive={pathname === page.path}
                          className="pl-8"
                        >
                          <Link href={page.path}>
                            {page.name}
                          </Link>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Reports */}
        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard/reports"}>
                <Link href="/dashboard/reports">
                  <FileText className="h-4 w-4" />
                  <span>All Reports</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/dashboard/settings"}>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="h-4 w-4" />
              <span>Sign Ou</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}