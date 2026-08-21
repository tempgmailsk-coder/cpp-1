import { readFile, stat } from "fs/promises";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { isAdminRole } from "@/lib/session";
import { uploadPath } from "@/lib/storage";

/**
 * Secure document endpoint. Documents are stored outside `public/` and are
 * only served to authenticated users who own them, or to administrators.
 * Sensitive identity documents are never publicly accessible.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const docId = Number(id);
  if (!Number.isInteger(docId)) {
    return NextResponse.json({ error: "Invalid document." }, { status: 400 });
  }

  const rows = await db.select().from(documents).where(eq(documents.id, docId)).limit(1);
  const doc = rows[0];
  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const isOwner = doc.ownerId === session.sub;
  if (!isOwner && !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  try {
    const path = uploadPath(doc.storedName);
    const info = await stat(path);
    const file = await readFile(path);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": doc.mime,
        "Content-Length": String(info.size),
        "Content-Disposition": `inline; filename="${sanitize(doc.originalName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File is unavailable." }, { status: 404 });
  }
}

function sanitize(name: string): string {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
}
