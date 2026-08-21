import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  REGISTER_SCHEMA,
  hashPassword,
  randomToken,
  hashToken,
  memberIdForYear,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError, clientIp, guardMutatingRequest, requestOrigin } from "@/lib/api";
import { saveFile, createDocument, PHOTO_TYPES, DOC_TYPES } from "@/lib/storage";
import { registrationEmail, verificationEmail, isDemoEmailMode } from "@/lib/email";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const ip = clientIp(req);
  const rl = rateLimit(`register:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return jsonError("Too many registration attempts. Please try again in a minute.", 429);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("Invalid form submission.");
  }

  const parsed = REGISTER_SCHEMA.safeParse({
    name: form.get("name"),
    dateOfBirth: form.get("dateOfBirth"),
    gender: form.get("gender"),
    email: form.get("email"),
    phone: form.get("phone"),
    state: form.get("state"),
    district: form.get("district"),
    constituency: form.get("constituency"),
    address: form.get("address"),
    education: form.get("education"),
    profession: form.get("profession"),
    skills: form.get("skills"),
    previousExperience: form.get("previousExperience") || undefined,
    password: form.get("password"),
    confirmPassword: form.get("confirmPassword"),
    consent: form.get("consent") === "true",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const existing = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.email, data.email))
    .limit(1);
  if (existing.length > 0) {
    return jsonError(
      "An account with this email address already exists. Please sign in.",
      409
    );
  }

  // Secure document uploads
  let photoDocumentId: number | null = null;
  let idDocumentId: number | null = null;

  const photo = form.get("photo") as File | null;
  const idDoc = form.get("idDocument") as File | null;

  if (!photo || !(photo instanceof File) || photo.size === 0) {
    return jsonError("Profile photo is required.");
  }
  if (!idDoc || !(idDoc instanceof File) || idDoc.size === 0) {
    return jsonError("Government/identity verification document is required.");
  }

  const passwordHash = await hashPassword(data.password);
  const verificationToken = randomToken(32);

  const inserted = await db
    .insert(members)
    .values({
      memberId: "PENDING",
      name: data.name,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      state: data.state,
      district: data.district,
      constituency: data.constituency,
      address: data.address,
      education: data.education,
      profession: data.profession,
      skills: data.skills,
      previousExperience: data.previousExperience || null,
      passwordHash,
      role: "member",
      emailVerified: false,
      emailVerificationToken: hashToken(verificationToken),
      verificationStatus: "pending",
      membershipStatus: "active",
    })
    .returning({ id: members.id });

  const memberRow = inserted[0]!;
  const memberId = memberIdForYear(memberRow.id);

  try {
    const savedPhoto = await saveFile(photo, PHOTO_TYPES, 5 * 1024 * 1024);
    photoDocumentId = await createDocument({
      ownerId: memberRow.id,
      kind: "profile_photo",
      originalName: photo.name,
      storedName: savedPhoto.storedName,
      mime: savedPhoto.mime,
      size: savedPhoto.size,
    });

    const savedDoc = await saveFile(idDoc, DOC_TYPES, 10 * 1024 * 1024);
    idDocumentId = await createDocument({
      ownerId: memberRow.id,
      kind: "id_proof",
      originalName: idDoc.name,
      storedName: savedDoc.storedName,
      mime: savedDoc.mime,
      size: savedDoc.size,
    });
  } catch (err) {
    await db.delete(members).where(eq(members.id, memberRow.id));
    return jsonError(err instanceof Error ? err.message : "Document upload failed.");
  }

  await db
    .update(members)
    .set({ memberId, photoDocumentId, idDocumentId })
    .where(eq(members.id, memberRow.id));

  const origin = requestOrigin(req);
  const verifyUrl = `${origin}/verify-email?token=${verificationToken}`;

  await notify({
    memberId: memberRow.id,
    memberEmail: data.email,
    memberName: data.name,
    type: "registration",
    subject: "CPP Membership Registration Received",
    message: `Welcome to the CPP. Your Member ID is ${memberId}. Verify your email to activate your profile.`,
    html: registrationEmail(data.name, memberId),
    relatedType: "member",
    relatedId: memberRow.id,
  });

  await notify({
    memberId: memberRow.id,
    memberEmail: data.email,
    memberName: data.name,
    type: "email_verified",
    subject: "Verify your CPP email address",
    message: "Please verify your email address to activate your CPP member profile.",
    html: verificationEmail(data.name, memberId, verifyUrl),
    relatedType: "member",
    relatedId: memberRow.id,
  });

  await logAudit({
    adminName: data.name,
    action: "member_registered",
    targetType: "member",
    targetId: memberId,
    details: { email: data.email, state: data.state },
  });

  return NextResponse.json({
    ok: true,
    memberId,
    email: data.email,
    demoVerifyLink: isDemoEmailMode() ? verifyUrl : null,
    demoOtp: null,
  });
}
