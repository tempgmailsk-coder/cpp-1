import { db } from "@/db";
import { notifications } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { NOTIFICATION_TYPES } from "@/lib/constants";

export interface NotifyInput {
  memberId: number;
  memberEmail: string;
  memberName: string;
  type: keyof typeof NOTIFICATION_TYPES | string;
  subject: string;
  message: string;
  html?: string;
  relatedType?: string;
  relatedId?: number;
}

/**
 * Create an in-app notification and send the transactional email.
 * Returns the notification row and the email log id (if any).
 */
export async function notify(input: NotifyInput): Promise<{
  notificationId: number;
  emailLogId: number | null;
}> {
  let emailLogId: number | null = null;
  if (input.html) {
    const result = await sendEmail({
      to: input.memberEmail,
      subject: input.subject,
      html: input.html,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
    });
    emailLogId = result.id;
  }

  const rows = await db
    .insert(notifications)
    .values({
      memberId: input.memberId,
      type: input.type,
      subject: input.subject,
      message: input.message,
      emailLogId,
      read: false,
    })
    .returning({ id: notifications.id });

  return { notificationId: rows[0]!.id, emailLogId };
}
