"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Breadcrumb {
  label: string
  href?: string
}

interface DashboardHeaderProps {
  title?: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  className?: string
}

export function DashboardHeader({
  title,
  description,
  breadcrumbs = [],
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn("space-y-2 border-b border-border pb-4", className)}>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-2">
            {crumb.href ? (
              <Link href={crumb.href} className="text-primary hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3" />}
          </span>
        ))}
      </div>
      {title && <h1 className="text-2xl font-semibold text-foreground">{title}</h1>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
