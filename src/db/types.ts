import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  members,
  positions,
  applications,
  appointments,
  notifications,
  emailLog,
  auditLogs,
  documents,
  applicationEvents,
  constitutionArticles,
} from "@/db/schema";

export type MemberRow = InferSelectModel<typeof members>;
export type NewMember = InferInsertModel<typeof members>;
export type PositionRow = InferSelectModel<typeof positions>;
export type NewPosition = InferInsertModel<typeof positions>;
export type ApplicationRow = InferSelectModel<typeof applications>;
export type NewApplication = InferInsertModel<typeof applications>;
export type AppointmentRow = InferSelectModel<typeof appointments>;
export type NewAppointment = InferInsertModel<typeof appointments>;
export type NotificationRow = InferSelectModel<typeof notifications>;
export type EmailLogRow = InferSelectModel<typeof emailLog>;
export type AuditLogRow = InferSelectModel<typeof auditLogs>;
export type DocumentRow = InferSelectModel<typeof documents>;
export type ApplicationEventRow = InferSelectModel<typeof applicationEvents>;
export type ConstitutionArticleRow = InferSelectModel<typeof constitutionArticles>;

export type ApplicationWithRelations = ApplicationRow & {
  member: MemberRow | null;
  position: PositionRow | null;
};
