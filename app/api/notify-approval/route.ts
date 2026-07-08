import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createAdminClient } from "@/lib/supabase/admin"

const APPROVER_ROLE: Record<string, string> = {
  staff: "team_lead",
  team_lead: "manager",
  manager: "ceo",   // CEO dept users
  teacher: "manager",
}

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

const baseStyle = `font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;`
const btnStyle = `display: inline-block; padding: 12px 28px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;`

function approvedEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <h2 style="color:#16a34a;">Your Account Has Been Approved!</h2>
      <p>Hi ${name},</p>
      <p>Great news! Your account has been <strong>approved</strong>. You can now log in and access your dashboard.</p>
      <p style="margin: 24px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/sign-in" style="${btnStyle}">Log In Now</a>
      </p>
      <p style="color:#6b7280; font-size:13px;">If you have any issues, please contact your department manager.</p>
    </div>`
}

function rejectedEmail(name: string, reason: string | null): string {
  const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/sign-up`
  return `
    <div style="${baseStyle}">
      <h2 style="color:#dc2626;">Account Request Rejected</h2>
      <p>Hi ${name},</p>
      <p>Unfortunately, your account request has been <strong>rejected</strong>.</p>
      ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:16px 0;"><p style="margin:0;font-size:14px;color:#991b1b;"><strong>Reason:</strong> ${reason}</p></div>` : ""}
      <p>If you believe this is a mistake or want to try again, you can create a new account using the link below:</p>
      <p style="margin: 24px 0;">
        <a href="${signupUrl}" style="${btnStyle}">Sign Up Again</a>
      </p>
      <p style="color:#6b7280; font-size:13px;">If you need further assistance, please contact your department manager.</p>
    </div>`
}

function newRequestEmail(approverName: string, applicantName: string, applicantEmail: string, department: string, role: string): string {
  const approvalsUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/approvals`
  return `
    <div style="${baseStyle}">
      <h2 style="color:#4f46e5;">New Account Request Awaiting Your Approval</h2>
      <p>Hi ${approverName},</p>
      <p>A new account request has been submitted and requires your approval:</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Name:</strong> ${applicantName}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${applicantEmail}</p>
        <p style="margin:4px 0;"><strong>Department:</strong> ${department}</p>
        <p style="margin:4px 0;"><strong>Role Requested:</strong> ${role}</p>
      </div>
      <p style="margin: 24px 0;">
        <a href="${approvalsUrl}" style="${btnStyle}">Review Request</a>
      </p>
      <p style="color:#6b7280; font-size:13px;">Log in to your dashboard to approve or reject this request.</p>
    </div>`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type } = body

    const supabase = createAdminClient()
    const transporter = createTransporter()
    await transporter.verify()

    // ── APPROVED ──────────────────────────────────────────────────────────────
    if (type === "approved") {
      const { applicantEmail, applicantName } = body
      await transporter.sendMail({
        from: `"Profyd Dashboard" <${process.env.EMAIL_USER}>`,
        to: applicantEmail,
        subject: "Your Account Has Been Approved!",
        html: approvedEmail(applicantName),
      })
      return NextResponse.json({ success: true })
    }

    // ── REJECTED ──────────────────────────────────────────────────────────────
    if (type === "rejected") {
      const { applicantEmail, applicantName, reason } = body
      await transporter.sendMail({
        from: `"Profyd Dashboard" <${process.env.EMAIL_USER}>`,
        to: applicantEmail,
        subject: "Update on Your Account Request",
        html: rejectedEmail(applicantName, reason ?? null),
      })
      return NextResponse.json({ success: true })
    }

    // ── NEW REQUEST — notify approvers ────────────────────────────────────────
    if (type === "new_request") {
      const { applicantName, applicantEmail, department, role, companyName } = body

      const approverRole = APPROVER_ROLE[role]
      if (!approverRole) return NextResponse.json({ success: true })

      // Find approvers: same company + same dept + correct role (or CEO dept for managers)
      let query = supabase
        .from("users")
        .select("email, first_name, last_name")
        .eq("status", "active")
        .eq("role", approverRole)
        .eq("company_name", companyName ?? "")

      if (role === "manager") {
        // CEO dept approves managers
        query = query.eq("department", "ceo")
      } else {
        query = query.eq("department", department)
      }

      const { data: approvers } = await query

      if (!approvers || approvers.length === 0) {
        return NextResponse.json({ success: true, note: "No approvers found" })
      }

      await Promise.all(
        approvers.map((approver) =>
          transporter.sendMail({
            from: `"Profyd Dashboard" <${process.env.EMAIL_USER}>`,
            to: approver.email,
            subject: `New Account Request: ${applicantName}`,
            html: newRequestEmail(
              `${approver.first_name ?? ""} ${approver.last_name ?? ""}`.trim() || "there",
              applicantName,
              applicantEmail,
              department,
              role,
            ),
          })
        )
      )

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown notification type" }, { status: 400 })
  } catch (error: any) {
    console.error("notify-approval error:", error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
