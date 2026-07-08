"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"
import { getDepartmentById } from "@/lib/departments"
import { DEPARTMENT_SIDEBAR_ITEMS } from "@/lib/constants/department-sidebar-config"
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Crown,
  FileText,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  User,
  UserCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface SidebarSubItem {
  title: string
  href: string
  icon?: LucideIcon
}

interface SidebarItem {
  title: string
  href: string
  icon: LucideIcon
  subItems?: readonly SidebarSubItem[]
}

interface DepartmentSidebarProps {
  departmentId: string
}

export function DepartmentSidebar({ departmentId }: DepartmentSidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [openMenus, setOpenMenus] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const rawItems =
    DEPARTMENT_SIDEBAR_ITEMS[
      departmentId as keyof typeof DEPARTMENT_SIDEBAR_ITEMS
    ] || []

  const sidebarItems = rawItems as unknown as readonly SidebarItem[]

  const userDepartment = user ? getDepartmentById(user.department) : null

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  useEffect(() => {
    const initiallyOpen = sidebarItems
      .filter((item) => item.subItems?.some((sub) => isActive(sub.href)))
      .map((item) => item.title)

    setOpenMenus((prev) => Array.from(new Set([...prev, ...initiallyOpen])))
  }, [pathname])

  const initials = useMemo(() => {
    if (!user) return "U"
    return `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`
  }, [user])

  if (!mounted) return null

  return (
    <Sidebar
      collapsible="icon"
      className="h-screen flex flex-col border-r border-sidebar-border"
    >
      <SidebarHeader className="border-b px-4 py-4 shrink-0">
        <Link href={`/dashboard/${departmentId}`} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Crown className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">BMS</span>
          </div>
        </Link>
      </SidebarHeader>


      <div className="px-4 py-3 border-b bg-primary/5 group-data-[collapsible=icon]:hidden">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-primary">
          {departmentId.charAt(0).toUpperCase() + departmentId.slice(1)} Department
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {userDepartment?.name || departmentId}
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => {
                    const Icon = item.icon || LayoutDashboard
                    const hasSubItems = Boolean(item.subItems?.length)
                    const itemActive =
                      isActive(item.href) ||
                      item.subItems?.some((sub) => isActive(sub.href))

                    if (hasSubItems) {
                      const isOpen = openMenus.includes(item.title)

                      return (
                        <Collapsible
                          key={item.href}
                          open={isOpen}
                          onOpenChange={() => toggleMenu(item.title)}
                          className="w-full"
                        >
                          <SidebarMenuItem className="mb-2">
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                isActive={itemActive}
                                tooltip={item.title}
                                className="w-full justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </div>
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    isOpen && "rotate-180"
                                  )}
                                />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="mt-1 space-y-1 pl-6">
                              {item.subItems?.map((subItem) => {
                                const SubIcon = subItem.icon || FileText
                                return (
                                  <SidebarMenuButton
                                    key={subItem.href}
                                    asChild
                                    isActive={isActive(subItem.href)}
                                    size="sm"
                                    className="pl-8"
                                  >
                                    <Link href={subItem.href}>
                                      <SubIcon className="h-3.5 w-3.5" />
                                      <span className="text-sm">{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuButton>
                                )
                              })}
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      )
                    }

                    return (
                      <SidebarMenuItem key={item.href} className="mb-2">
                        <SidebarMenuButton
                          asChild
                          isActive={itemActive}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Role-based approval links — visible to approvers only */}
            {user && (user.role === "team_lead" || user.role === "manager" || user.department === "ceo") && (
              <SidebarGroup>
                <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Approvals
                  </p>
                </div>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {user.role === "team_lead" && (
                      <SidebarMenuItem className="mb-1">
                        <SidebarMenuButton
                          asChild
                          isActive={isActive("/dashboard/approvals/staff")}
                          tooltip="Staff Approvals"
                        >
                          <Link href="/dashboard/approvals/staff">
                            <UserCheck className="h-4 w-4" />
                            <span>Staff Approvals</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {user.role === "manager" && (
                      <SidebarMenuItem className="mb-1">
                        <SidebarMenuButton
                          asChild
                          isActive={isActive("/dashboard/approvals/team-lead")}
                          tooltip="Team Lead Approvals"
                        >
                          <Link href="/dashboard/approvals/team-lead">
                            <UserCheck className="h-4 w-4" />
                            <span>Team Lead Approvals</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}

                    {user.department === "ceo" && (
                      <SidebarMenuItem className="mb-1">
                        <SidebarMenuButton
                          asChild
                          isActive={isActive("/dashboard/approvals") && !isActive("/dashboard/approvals/staff") && !isActive("/dashboard/approvals/team-lead")}
                          tooltip="Manager Approvals"
                        >
                          <Link href="/dashboard/approvals">
                            <UserCheck className="h-4 w-4" />
                            <span>Manager Approvals</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
        </ScrollArea>
      </div>

      <SidebarFooter className="border-t p-2 shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="gap-3 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">
                      {user?.firstName || "User"} {user?.lastName || ""}
                    </span>
                    <span className="truncate text-xs capitalize text-muted-foreground">
                      {user?.role?.replace("_", " ") || "User"}
                    </span>
                  </div>

                  <MoreHorizontal className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 px-2 py-2 text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                    <span className="font-medium">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-xs capitalize text-muted-foreground">
                      {user?.role?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}