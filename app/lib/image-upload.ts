import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { slugify } from "./slugify";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

export function extensionFromMime(mimeType: string, fileName: string): string {
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (
    fromName &&
    ["mp4", "webm", "mov", "jpg", "jpeg", "png", "webp", "gif"].includes(fromName)
  ) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  const map: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return map[mimeType] ?? "bin";
}

export async function saveImageAsWebp(
  buffer: Buffer,
  folder: string,
  fileName: string
): Promise<string> {
  const safeFolder = slugify(folder, "genel");
  const safeFileName = slugify(fileName, "gorsel");
  const dir = path.join(UPLOADS_ROOT, safeFolder);

  await mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${safeFileName}.webp`);
  const webpBuffer = await sharp(buffer).rotate().webp({ quality: 84 }).toBuffer();

  await writeFile(filePath, webpBuffer);

  return `/uploads/${safeFolder}/${safeFileName}.webp`;
}

export async function saveBinaryFile(
  buffer: Buffer,
  folder: string,
  fileName: string,
  extension: string
): Promise<string> {
  const safeFolder = slugify(folder, "genel");
  const safeFileName = slugify(fileName, "dosya");
  const safeExt = extension.replace(/^\./, "").toLowerCase() || "bin";
  const dir = path.join(UPLOADS_ROOT, safeFolder);

  await mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${safeFileName}.${safeExt}`);

  await writeFile(filePath, buffer);

  return `/uploads/${safeFolder}/${safeFileName}.${safeExt}`;
}

export async function saveMenuImage(
  buffer: Buffer,
  categorySlug: string,
  itemSlug: string
): Promise<string> {
  return saveImageAsWebp(buffer, categorySlug, itemSlug);
}
