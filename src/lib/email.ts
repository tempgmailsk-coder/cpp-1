import { db } from "@/db";
import { emailLog } from "@/db/schema";
import { ORG_NAME, APP_BASE_URL } from "@/lib/constants";

/**
 * Transactional email service.
 *
 * If SENDGRID_API_KEY is configured, emails are delivered through SendGrid.
 * Otherwise the email is stored in the outbox (email_log) with status
 * "logged" so the flow remains fully observable. In that mode the
 * application UI exposes verification links / OTP codes (demo email mode).
 */

export function isDemoEmailMode(): boolean {
  return !process.env.SENDGRID_API_KEY;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  relatedType?: string;
  relatedId?: number;
}

export async function sendEmail(
  options: EmailOptions
): Promise<{ id: number; status: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.MAIL_FROM ?? "portal@cpp.example";

  if (!apiKey) {
    // No transactional provider configured: persist to the outbox.
    const rows = await db
      .insert(emailLog)
      .values({
        toEmail: options.to,
        subject: options.subject,
        bodyHtml: options.html,
        bodyText: options.text ?? stripHtml(options.html),
        status: "logged",
        provider: "outbox",
        relatedType: options.relatedType ?? null,
        relatedId: options.relatedId ?? null,
        sentAt: new Date(),
      })
      .returning({ id: emailLog.id });
    return { id: rows[0]!.id, status: "logged" };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: fromEmail, name: ORG_NAME },
        subject: options.subject,
        content: [
          { type: "text/plain", value: options.text ?? stripHtml(options.html) },
          { type: "text/html", value: options.html },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      const rows = await db
        .insert(emailLog)
        .values({
          toEmail: options.to,
          subject: options.subject,
          bodyHtml: options.html,
          bodyText: options.text ?? stripHtml(options.html),
          status: "failed",
          provider: "sendgrid",
          error: body.slice(0, 500),
          relatedType: options.relatedType ?? null,
          relatedId: options.relatedId ?? null,
        })
        .returning({ id: emailLog.id });
      return { id: rows[0]!.id, status: "failed" };
    }

    const rows = await db
      .insert(emailLog)
      .values({
        toEmail: options.to,
        subject: options.subject,
        bodyHtml: options.html,
        bodyText: options.text ?? stripHtml(options.html),
        status: "sent",
        provider: "sendgrid",
        relatedType: options.relatedType ?? null,
        relatedId: options.relatedId ?? null,
        sentAt: new Date(),
      })
      .returning({ id: emailLog.id });
    return { id: rows[0]!.id, status: "sent" };
  } catch (err) {
    const rows = await db
      .insert(emailLog)
      .values({
        toEmail: options.to,
        subject: options.subject,
        bodyHtml: options.html,
        bodyText: options.text ?? stripHtml(options.html),
        status: "failed",
        provider: "sendgrid",
        error: String(err).slice(0, 500),
        relatedType: options.relatedType ?? null,
        relatedId: options.relatedId ?? null,
      })
      .returning({ id: emailLog.id });
    return { id: rows[0]!.id, status: "failed" };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ------------------------- Email templates ------------------------- */

function layout(title: string, body: string): string {
  return `
  <div style="background:#f5f5f4;padding:32px 16px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:10px;overflow:hidden;">
      <div style="background:#0a0a0a;padding:20px 28px;">
        <div style="display:inline-block;background:#ffffff;color:#0a0a0a;font-weight:800;letter-spacing:0.06em;padding:3px 10px;border-radius:4px;font-size:13px;">CPP</div>
        <div style="color:#ffffff;font-size:11px;margin-top:6px;letter-spacing:0.02em;text-transform:uppercase;">${ORG_NAME}</div>
      </div>
      <div style="padding:28px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#0a0a0a;">${title}</h2>
        ${body}
        <div style="margin-top:24px;border-top:1px solid #e7e5e4;padding-top:16px;color:#78716c;font-size:12px;line-height:1.6;">
          <strong>${ORG_NAME}</strong><br/>
          Defined Responsibility • Limited Power • Continuous Public Accountability<br/>
          <a href="${APP_BASE_URL}" style="color:#0a0a0a;">${APP_BASE_URL}</a>
        </div>
      </div>
    </div>
  </div>`;
}

export function registrationEmail(name: string, memberId: string): string {
  return layout(
    "Membership Registration Received",
    `<p>Dear <strong>${name}</strong>,</p>
     <p>Your registration with the ${ORG_NAME} (CPP) has been received.</p>
     <p style="background:#f5f5f4;border-radius:6px;padding:12px 16px;font-size:14px;">
       <strong>Member ID:</strong> ${memberId}<br/>
       <strong>Status:</strong> Awaiting email verification
     </p>
     <p>Please verify your email address to activate your member profile.</p>`
  );
}

export function verificationEmail(
  name: string,
  memberId: string,
  verifyUrl: string
): string {
  return layout(
    "Verify Your Email Address",
    `<p>Dear <strong>${name}</strong>,</p>
     <p>Thank you for registering with the ${ORG_NAME}. Please confirm your email address to activate your member profile.</p>
     <p style="background:#f5f5f4;border-radius:6px;padding:12px 16px;font-size:14px;"><strong>Member ID:</strong> ${memberId}</p>
     <p style="text-align:center;margin:24px 0;">
       <a href="${verifyUrl}" style="background:#0a0a0a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;display:inline-block;">Verify Email Address</a>
     </p>
     <p style="color:#78716c;font-size:13px;">If the button does not work, open this link in your browser:<br/>${verifyUrl}</p>`
  );
}

export function resetPasswordEmail(name: string, resetUrl: string): string {
  return layout(
    "Password Reset Request",
    `<p>Dear <strong>${name}</strong>,</p>
     <p>We received a request to reset the password for your CPP membership account.</p>
     <p style="text-align:center;margin:24px 0;">
       <a href="${resetUrl}" style="background:#0a0a0a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;display:inline-block;">Reset Password</a>
     </p>
     <p style="color:#78716c;font-size:13px;">If you did not request this, you can safely ignore this email. The link expires in 60 minutes.</p>`
  );
}

export function otpEmail(name: string, otp: string): string {
  return layout(
    "Your Login Verification Code",
    `<p>Dear <strong>${name}</strong>,</p>
     <p>Use the following 6-digit code to complete your sign-in to the CPP portal:</p>
     <p style="text-align:center;font-size:28px;letter-spacing:8px;font-weight:700;background:#f5f5f4;border-radius:6px;padding:16px;margin:24px 0;">${otp}</p>
     <p style="color:#78716c;font-size:13px;">This code expires in 10 minutes. If you did not attempt to sign in, ignore this email.</p>`
  );
}

export function applicationSubmittedEmail(
  name: string,
  applicationId: string,
  positionName: string
): string {
  return layout(
    "Application Submitted Successfully",
    `<p>Dear <strong>${name}</strong>,</p>
     <p>Your application for <strong>${positionName}</strong> has been submitted.</p>
     <p style="background:#f5f5f4;border-radius:6px;padding:12px 16px;font-size:14px;">
       <strong>Application ID:</strong> ${applicationId}<br/>
       <strong>Position:</strong> ${positionName}<br/>
       <strong>Status:</strong> Submitted
     </p>
     <p>The constitutional review process will now begin. You can track your application from your dashboard.</p>
     <p style="text-align:center;margin:24px 0;"><a href="${APP_BASE_URL}/dashboard/applications" style="background:#0a0a0a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;display:inline-block;">View My Applications</a></p>`
  );
}

export function applicationStatusEmail(
  name: string,
  applicationId: string,
  positionName: string,
  newStatus: string
): string {
  return layout(
    "Application Status Update",
    `<p>Dear <strong>${name}</strong>,</p>
     <p>Your application for <strong>${positionName}</strong> has been updated.</p>
     <p style="background:#f5f5f4;border-radius:6px;padding:12px 16px;font-size:14px;">
       <strong>Application ID:</strong> ${applicationId}<br/>
       <strong>New status:</strong> ${newStatus}
     </p>
     <p>You can view the full history from your dashboard.</p>
     <p style="text-align:center;margin:24px 0;"><a href="${APP_BASE_URL}/dashboard/applications/${applicationId}" style="background:#0a0a0a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;display:inline-block;">View Application</a></p>`
  );
}

export function officialAppointmentEmail(input: {
  name: string;
  memberId: string;
  positionName: string;
  level: string;
  appointmentDate: string;
  effectiveDate: string;
  appointingAuthority: string;
  referenceNumber: string;
  applicationId: string;
  noticeUrl?: string | null;
}): string {
  const noticeBlock = input.noticeUrl
    ? `<p style="text-align:center;margin:24px 0;"><a href="${input.noticeUrl}" style="background:#ffffff;color:#0a0a0a;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;display:inline-block;border:1px solid #0a0a0a;">Download Official Notice</a></p>`
    : "";
  return layout(
    "Official Appointment Notification",
    `<p>Dear <strong>${input.name}</strong>,</p>
     <p style="font-size:15px;">We are pleased to inform you of your official appointment to the following constitutional position in the ${ORG_NAME} (CPP):</p>
     <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;" cellpadding="10">
       <tr style="background:#f5f5f4;">
         <td style="border:1px solid #e7e5e4;"><strong>Member Name</strong></td>
         <td style="border:1px solid #e7e5e4;">${input.name}</td>
       </tr>
       <tr>
         <td style="border:1px solid #e7e5e4;"><strong>Member ID</strong></td>
         <td style="border:1px solid #e7e5e4;">${input.memberId}</td>
       </tr>
       <tr style="background:#f5f5f4;">
         <td style="border:1px solid #e7e5e4;"><strong>Position</strong></td>
         <td style="border:1px solid #e7e5e4;">${input.positionName}</td>
       </tr>
       <tr>
         <td style="border:1px solid #e7e5e4;"><strong>Organizational Level</strong></td>
         <td style="border:1px solid #e7e5e4;">${input.level}</td>
       </tr>
       <tr style="background:#f5f5f4;">
         <td style="border:1px solid #e7e5e4;"><strong>Appointment Date</strong></td>
         <td style="border:1px solid #e7e5e4;">${input.appointmentDate}</td>
       </tr>
       <tr>
         <td style="border:1px solid #e7e5e4;"><strong>Effective Date</strong></td>
         <td style="border:1px solid #e7e5e4;">${input.effectiveDate}</td>
       </tr>
       <tr style="background:#f5f5f4;">
         <td style="border:1px solid #e7e5e4;"><strong>Appointing Authority</strong></td>
         <td style="border:1px solid #e7e5e4;">${input.appointingAuthority}</td>
       </tr>
       <tr>
         <td style="border:1px solid #e7e5e4;"><strong>Reference / Application No.</strong></td>
         <td style="border:1px solid #e7e5e4;">${input.referenceNumber} (${input.applicationId})</td>
       </tr>
     </table>
     <p>This appointment is recorded in the official appointment register of the CPP and is governed by the provisions of the CPP Constitution.</p>
     ${noticeBlock}
     <p style="text-align:center;margin:24px 0;"><a href="${APP_BASE_URL}/dashboard" style="background:#0a0a0a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;display:inline-block;">Open Member Dashboard</a></p>`
  );
}
