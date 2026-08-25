import { NextResponse } from "next/server";
import { requireAdmin } from "../../lib/auth";
import {
  extensionFromMime,
  saveBinaryFile,
  saveImageAsWebp,
  saveMenuImage,
} from "../../lib/image-upload";
import { prisma } from "../../lib/prisma";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const scope = String(formData.get("scope") ?? "asset");
    const categorySlug = String(formData.get("categorySlug") ?? "").trim();
    const itemSlug = String(formData.get("itemSlug") ?? "").trim();
    const folder = String(formData.get("folder") ?? "").trim();
    const fileName = String(formData.get("fileName") ?? "").trim();
    const convertWebp = formData.get("convertWebp") !== "false";

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Yalnızca görsel veya video dosyaları yüklenebilir." },
        { status: 400 }
      );
    }

    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      const limitLabel = isVideo ? "40MB" : "8MB";
      return NextResponse.json(
        {
          error: `Dosya çok büyük. ${isVideo ? "Video" : "Görsel"} üst sınırı ${limitLabel}.`,
        },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > maxBytes) {
      const limitLabel = isVideo ? "40MB" : "8MB";
      return NextResponse.json(
        {
          error: `Dosya çok büyük. ${isVideo ? "Video" : "Görsel"} üst sınırı ${limitLabel}.`,
        },
        { status: 413 }
      );
    }

    let url: string;

    if (scope === "menu") {
      if (!isImage) {
        return NextResponse.json(
          { error: "Menü görselleri yalnızca resim olabilir." },
          { status: 400 }
        );
      }

      if (!categorySlug || !itemSlug) {
        return NextResponse.json(
          { error: "Menü görseli için kategori ve ürün slug gerekli." },
          { status: 400 }
        );
      }

      url = await saveMenuImage(buffer, categorySlug, itemSlug);
    } else {
      if (!folder || !fileName) {
        return NextResponse.json(
          { error: "Klasör ve dosya adı gerekli." },
          { status: 400 }
        );
      }

      if (isImage && convertWebp) {
        url = await saveImageAsWebp(buffer, folder, fileName);
      } else {
        const extension = extensionFromMime(file.type, file.name);
        url = await saveBinaryFile(buffer, folder, fileName, extension);
      }
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        filename: file.name,
        url,
        mimeType: file.type || "application/octet-stream",
        size: buffer.length,
      },
    });

    return NextResponse.json({ success: true, url, asset });
  } catch {
    return NextResponse.json({ error: "Dosya yüklenemedi." }, { status: 500 });
  }
}
