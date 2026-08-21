import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const EMAIL_SCHEMA = z.string().trim().toLowerCase().email("Enter a valid email address");

export const PASSWORD_SCHEMA = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const REGISTER_SCHEMA = z
  .object({
    name: z.string().trim().min(3, "Full name must be at least 3 characters").max(120),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select your date of birth"),
    gender: z.enum(["male", "female", "other"], {
      message: "Select your gender",
    }),
    email: EMAIL_SCHEMA,
    phone: z
      .string()
      .trim()
      .min(10, "Enter a valid mobile number")
      .max(15)
      .regex(/^[+]?[0-9][0-9\s-]{8,14}$/, "Enter a valid mobile number"),
    state: z.string().trim().min(2, "State is required"),
    district: z.string().trim().min(2, "District is required"),
    constituency: z.string().trim().min(2, "Constituency is required"),
    address: z.string().trim().min(5, "Address is required"),
    education: z.string().trim().min(2, "Educational qualification is required"),
    profession: z.string().trim().min(2, "Profession is required"),
    skills: z.string().trim().min(2, "List your relevant skills"),
    previousExperience: z.string().trim().optional(),
    password: PASSWORD_SCHEMA,
    confirmPassword: z.string(),
    consent: z.literal(true, {
      message:
        "You must confirm that your information is accurate and that you agree to follow the CPP Constitution",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const LOGIN_SCHEMA = z.object({
  identifier: z.string().trim().min(3, "Enter your email address or member ID"),
  password: z.string().min(1, "Enter your password"),
});

export const OTP_SCHEMA = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const FORGOT_SCHEMA = z.object({
  email: EMAIL_SCHEMA,
});

export const RESET_SCHEMA = z
  .object({
    password: PASSWORD_SCHEMA,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const PROFILE_SCHEMA = z.object({
  phone: z.string().trim().min(10).max(15).regex(/^[+]?[0-9][0-9\s-]{8,14}$/, "Enter a valid mobile number"),
  state: z.string().trim().min(2, "State is required"),
  district: z.string().trim().min(2, "District is required"),
  constituency: z.string().trim().min(2, "Constituency is required"),
  address: z.string().trim().min(5, "Address is required"),
  education: z.string().trim().min(2, "Educational qualification is required"),
  profession: z.string().trim().min(2, "Profession is required"),
  skills: z.string().trim().min(2, "List your relevant skills"),
  previousExperience: z.string().trim().optional(),
  otpEnabled: z.boolean().optional(),
});

export const CHANGE_PASSWORD_SCHEMA = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: PASSWORD_SCHEMA,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const APPLICATION_SCHEMA = z.object({
  positionId: z.coerce.number().int().positive(),
  state: z.string().trim().min(2, "State is required"),
  district: z.string().trim().min(2, "District is required"),
  education: z.string().trim().min(2, "Educational qualification is required"),
  professionalExperience: z.string().trim().min(2, "Describe your professional experience"),
  organizationalExperience: z.string().trim().min(2, "Describe your previous organizational experience"),
  relevantSkills: z.string().trim().min(2, "List your relevant skills"),
  leadershipExperience: z.string().trim().min(2, "Describe your leadership experience"),
  motivation: z.string().trim().min(20, "Explain why you want this position (at least 20 characters)"),
    declaration: z.literal(true, {
      message: "You must accept the declaration before submitting",
    }),
});

export function memberIdForYear(id: number, year = new Date().getFullYear()): string {
  return `CPP-${year}-${String(id).padStart(5, "0")}`;
}

export function applicationRefForYear(id: number, year = new Date().getFullYear()): string {
  return `CPP-${year}-${String(id).padStart(6, "0")}`;
}

export function appointmentRefForYear(id: number, year = new Date().getFullYear()): string {
  return `CPP-APPT-${year}-${String(id).padStart(4, "0")}`;
}

export function computeAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}
