import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  serial,
  index,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Roles                                                               */
/* ------------------------------------------------------------------ */
export type Role =
  | "member"
  | "state_admin"
  | "national_admin"
  | "appointment_authority"
  | "super_admin";

export const ADMIN_ROLES: Role[] = [
  "super_admin",
  "national_admin",
  "appointment_authority",
  "state_admin",
];

/** Roles allowed to trigger the official appointment email. */
export const APPOINTMENT_ROLES: Role[] = [
  "super_admin",
  "national_admin",
  "appointment_authority",
];

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "verification"
  | "shortlisted"
  | "selected"
  | "appointed"
  | "rejected"
  | "withdrawn";

export type AppointmentMethod =
  | "election"
  | "electoral_college"
  | "appointment"
  | "joint_appointment"
  | "provisional_appointment"
  | "committee_selection";

/* ------------------------------------------------------------------ */
/* Members                                                             */
/* ------------------------------------------------------------------ */
export const members = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    memberId: text("member_id").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    dateOfBirth: text("date_of_birth"),
    gender: text("gender"),
    state: text("state"),
    district: text("district"),
    constituency: text("constituency"),
    address: text("address"),
    education: text("education"),
    profession: text("profession"),
    skills: text("skills"),
    previousExperience: text("previous_experience"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("member"),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerificationToken: text("email_verification_token"),
    resetToken: text("reset_token"),
    resetTokenExpiresAt: timestamp("reset_token_expires_at"),
    otpEnabled: boolean("otp_enabled").notNull().default(false),
    otpHash: text("otp_hash"),
    otpExpiresAt: timestamp("otp_expires_at"),
    verificationStatus: text("verification_status").notNull().default("pending"),
    membershipStatus: text("membership_status").notNull().default("active"),
    photoDocumentId: integer("photo_document_id"),
    idDocumentId: integer("id_document_id"),
    suspendedReason: text("suspended_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("members_email_idx").on(t.email),
    index("members_member_id_idx").on(t.memberId),
  ]
);

/* ------------------------------------------------------------------ */
/* Positions (constitutional offices)                                  */
/* ------------------------------------------------------------------ */
export const positions = pgTable(
  "positions",
  {
    id: serial("id").primaryKey(),
    positionName: text("position_name").notNull(),
    rank: integer("rank").notNull().default(100),
    level: text("level").notNull(), // national | state
    wing: text("wing").notNull(),
    state: text("state"), // null = template that applies in every state
    description: text("description"),
    responsibilities: jsonb("responsibilities").$type<string[]>(),
    appointmentMethod: text("appointment_method").notNull(),
    eligibility: jsonb("eligibility").$type<string[]>(),
    eligibilityRules: jsonb("eligibility_rules").$type<{
      minAgeYears?: number;
      requireVerification?: boolean;
      requireActiveMembership?: boolean;
      stateMatch?: boolean;
    }>(),
    termInfo: text("term_info"),
    vacancies: integer("vacancies").notNull().default(1),
    vacancyStatus: text("vacancy_status").notNull().default("open"),
    applicationDeadline: timestamp("application_deadline"),
    constitutionalReference: text("constitutional_reference"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("positions_level_idx").on(t.level)]
);

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */
export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    applicationId: text("application_id").notNull().unique(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    positionId: integer("position_id")
      .notNull()
      .references(() => positions.id),
    status: text("status").notNull().default("submitted"),
    answers: jsonb("answers").$type<Record<string, string>>(),
    documents: jsonb("documents").$type<
      { documentId: number; name: string; mime: string }[]
    >(),
    internalNotes: jsonb("internal_notes").$type<
      {
        adminId: number | null;
        adminName: string;
        note: string;
        createdAt: string;
      }[]
    >(),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at"),
    decisionAt: timestamp("decision_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("applications_member_idx").on(t.memberId),
    index("applications_position_idx").on(t.positionId),
    index("applications_status_idx").on(t.status),
  ]
);

/* ------------------------------------------------------------------ */
/* Appointments                                                        */
/* ------------------------------------------------------------------ */
export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    appointmentId: text("appointment_id").notNull().unique(),
    referenceNumber: text("reference_number").notNull().unique(),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    positionId: integer("position_id")
      .notNull()
      .references(() => positions.id),
    appointingAuthority: text("appointing_authority").notNull(),
    authorityRole: text("authority_role"),
    appointmentMethod: text("appointment_method").notNull(),
    appointmentDate: timestamp("appointment_date").notNull().defaultNow(),
    effectiveDate: timestamp("effective_date").notNull(),
    appointmentStatus: text("appointment_status").notNull().default("confirmed"),
    noticeDocumentId: integer("notice_document_id"),
    officialEmailId: integer("official_email_id"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("appointments_member_idx").on(t.memberId)]
);

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id),
    type: text("type").notNull(),
    subject: text("subject").notNull(),
    message: text("message"),
    emailLogId: integer("email_log_id"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notifications_member_idx").on(t.memberId)]
);

/* ------------------------------------------------------------------ */
/* Email outbox (transactional email log)                              */
/* ------------------------------------------------------------------ */
export const emailLog = pgTable("email_log", {
  id: serial("id").primaryKey(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html"),
  bodyText: text("body_text"),
  status: text("status").notNull().default("queued"), // queued | sent | logged | failed
  provider: text("provider"),
  error: text("error"),
  relatedType: text("related_type"),
  relatedId: integer("related_id"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Audit logs                                                          */
/* ------------------------------------------------------------------ */
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id"),
  adminName: text("admin_name"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Secure documents (never served publicly)                            */
/* ------------------------------------------------------------------ */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => members.id),
  kind: text("kind").notNull(), // profile_photo | id_proof | application_document | appointment_notice
  originalName: text("original_name").notNull(),
  storedName: text("stored_name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Application status history                                          */
/* ------------------------------------------------------------------ */
export const applicationEvents = pgTable(
  "application_events",
  {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    actorId: integer("actor_id"),
    actorName: text("actor_name"),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("application_events_app_idx").on(t.applicationId)]
);

/* ------------------------------------------------------------------ */
/* Constitution articles                                               */
/* ------------------------------------------------------------------ */
export const constitutionArticles = pgTable("constitution_articles", {
  id: serial("id").primaryKey(),
  chapterNo: integer("chapter_no").notNull(),
  chapterTitle: text("chapter_title").notNull(),
  articleNo: text("article_no").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});
