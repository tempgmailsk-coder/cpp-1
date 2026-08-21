import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { documents } from "@/db/schema";

const UPLOAD_DIR = path.join(process.cwd(), "private-uploads");

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const DOC_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

export async function saveFile(
  file: File,
  allowedMimes: string[],
  maxBytes: number
): Promise<{ storedName: string; mime: string; size: number }> {
  if (!allowedMimes.includes(file.type)) {
    throw new Error(
      `File type not allowed. Accepted: ${allowedMimes.join(", ")}`
    );
  }
  if (file.size > maxBytes) {
    throw new Error(
      `File too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB.`
    );
  }
  if (file.size === 0) throw new Error("File is empty.");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.type === "application/pdf" ? ".pdf" : path.extname(file.name) || ".bin";
  const storedName = `${Date.now()}-${randomBytes(8).toString("hex")}${ext.toLowerCase()}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  return { storedName, mime: file.type, size: file.size };
}

export function uploadPath(storedName: string): string {
  return path.join(UPLOAD_DIR, storedName);
}

export async function createDocument(input: {
  ownerId: number;
  kind: string;
  originalName: string;
  storedName: string;
  mime: string;
  size: number;
}): Promise<number> {
  const rows = await db
    .insert(documents)
    .values({
      ownerId: input.ownerId,
      kind: input.kind,
      originalName: input.originalName,
      storedName: input.storedName,
      mime: input.mime,
      size: input.size,
    })
    .returning({ id: documents.id });
  return rows[0]!.id;
}
