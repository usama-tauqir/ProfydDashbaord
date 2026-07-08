"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Clock, XCircle, CheckCircle, LogOut, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

const STATUS_LABELS: Record<string, string> = {
  pending_teamlead: "Team Lead",
  pending_manager: "Manager",
  pending_ceo: "CEO",
  pending_teacher_approval: "Training Manager",
  pending_manual: "System Administrator",
}

export default function PendingApprovalPage() {
  const { supabaseUser, signOut } = useAuth()
  const router = useRouter()
  const [requestStatus, setRequestStatus] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    const userId = supabaseUser?.id
    if (!userId) {
      router.replace("/sign-in")
      return
    }

    const { data } = await supabase
      .from("signup_requests")
      .select("request_status, notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      setRequestStatus(data.request_status)
      setRejectReason(data.notes)

      // If approved, go to dashboard
      if (data.request_status === "approved") {
        router.replace("/dashboard")
        return
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
  }, [supabaseUser?.id])

  const handleSignOut = async () => {
    await signOut()
    router.replace("/sign-in")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  const isRejected = requestStatus === "rejected"
  const approverLabel = requestStatus ? STATUS_LABELS[requestStatus] ?? "your approver" : "your approver"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                isRejected
                  ? "bg-red-100 dark:bg-red-950"
                  : "bg-amber-100 dark:bg-amber-950"
              }`}
            >
              {isRejected
                ? <XCircle className="h-10 w-10 text-red-500" />
                : <Clock className="h-10 w-10 text-amber-500" />
              }
            </motion.div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isRejected ? "Account Rejected" : "Approval Pending"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {isRejected
                  ? "Your account request was not approved. Please sign up again or contact your department manager."
                  : requestStatus === "pending_manual"
                    ? "Your CEO account requires manual activation by the system administrator. Please contact the admin directly."
                    : `Your account is waiting for approval from your ${approverLabel}. You will receive an email once a decision is made.`
                }
              </p>
            </div>

            {/* Rejection reason */}
            {isRejected && rejectReason && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-4 text-left">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
                  Reason
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">{rejectReason}</p>
              </div>
            )}

            {/* Steps for pending */}
            {!isRejected && requestStatus === "pending_manual" && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  What happens next?
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
                  <li>Your account must be activated manually in the database</li>
                  <li>Once activated, log in to access your dashboard</li>
                  <li>Contact the system administrator if you need help</li>
                </ul>
              </div>
            )}

            {!isRejected && requestStatus !== "pending_manual" && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  What happens next?
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
                  <li>Your {approverLabel} has been notified by email</li>
                  <li>They will approve or reject your request</li>
                  <li>You will receive an email with the decision</li>
                  <li>Once approved, log in to access the dashboard</li>
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {isRejected && (
                <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11">
                  <Link href="/sign-up">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create a New Account
                  </Link>
                </Button>
              )}

              {!isRejected && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-11"
                  onClick={fetchStatus}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Status
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full rounded-xl h-11 text-gray-500 hover:text-gray-700"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>

          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          Need help?{" "}
          <a href="mailto:support@profyd.com" className="text-indigo-500 hover:underline">
            Contact Support
          </a>
        </p>
      </motion.div>
    </div>
  )
}
