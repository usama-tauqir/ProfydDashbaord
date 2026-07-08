"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, RefreshCw, Mail, Phone, AlertCircle, Building2, UserCheck } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type SignupRequest = {
  id: string
  user_id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  company_name: string | null
  department: string
  requested_role: string
  request_status: string
  phone: string | null
  notes: string | null
  created_at: string
}

function getInitials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
}

export default function CeoApprovalsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [requests, setRequests] = useState<SignupRequest[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<SignupRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject">("approve")
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) return
    // Only CEO department users can approve manager accounts
    setAuthorized(user.department === "ceo")
  }, [user])

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await supabase
        .from("signup_requests")
        .select("*")
        .eq("requested_role", "manager")
        .eq("request_status", "pending_ceo")
        .neq("department", "ceo")   // CEO dept accounts are activated manually, never here
        .order("created_at", { ascending: true })
      if (error) throw error
      setRequests(data ?? [])
    } catch (err: any) {
      setError(err.message ?? "Failed to load requests.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authorized) fetchRequests()
    else if (authorized === false) setLoading(false)
  }, [authorized, fetchRequests])

  const sendEmail = async (type: "approved" | "rejected", req: SignupRequest, reason?: string) => {
    await fetch("/api/notify-approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, applicantEmail: req.email, applicantName: req.full_name, reason }),
    }).catch(() => {})
  }

  const handleAction = async (req: SignupRequest, approve: boolean) => {
    setProcessingId(req.id)
    try {
      if (approve) {
        await supabase.from("users").upsert({
          id: req.user_id, email: req.email, first_name: req.first_name,
          last_name: req.last_name, company_name: req.company_name,
          department: req.department, role: "manager", phone: req.phone, status: "active",
        }, { onConflict: "id" })
        await supabase.from("signup_requests").update({ request_status: "approved" }).eq("id", req.id)
        await sendEmail("approved", req)
      } else {
        await supabase.from("users").update({ status: "rejected" }).eq("id", req.user_id)
        await supabase.from("signup_requests").update({
          request_status: "rejected",
          notes: rejectReason || req.notes,
        }).eq("id", req.id)
        await sendEmail("rejected", req, rejectReason || undefined)
      }
      setRequests((prev) => prev.filter((r) => r.id !== req.id))
      setDialogOpen(false)
      setRejectReason("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  if (authorized === false) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">Only CEO department users can approve Manager account requests.</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Approve or reject pending Manager account requests from all departments.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">No pending approvals</h3>
            <p className="text-sm text-muted-foreground">All Manager requests have been reviewed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">{getInitials(req.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{req.full_name || "Unnamed"}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">Applied: {formatDate(req.created_at)}</Badge>
                          <Badge variant="secondary" className="text-xs">Manager · {req.department}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{req.email}</span></div>
                      {req.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{req.phone}</span></div>}
                      <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span>Department: {req.department}</span></div>
                      <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span>Company: {req.company_name ?? "—"}</span></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setSelected(req); setActionType("approve"); setDialogOpen(true) }} disabled={processingId === req.id}>
                      <CheckCircle className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setSelected(req); setActionType("reject"); setDialogOpen(true) }} disabled={processingId === req.id}>
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Approve Manager Account" : "Reject Manager Account"}</DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `This will activate ${selected?.full_name}'s manager account. They will receive an approval email.`
                : `This will reject ${selected?.full_name}'s request. They will receive a rejection email with a signup link.`}
            </DialogDescription>
          </DialogHeader>
          {actionType === "reject" && (
            <div className="space-y-2">
              <Label>Reason for rejection (optional)</Label>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Enter reason..." />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={() => handleAction(selected!, actionType === "approve")}
              disabled={processingId === selected?.id}
            >
              {actionType === "approve" ? "Yes, Approve" : "Yes, Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
