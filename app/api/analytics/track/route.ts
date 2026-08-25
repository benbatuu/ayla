import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      path?: string;
      locale?: string;
      isMenu?: boolean;
      sessionId?: string;
      referrer?: string;
      utmSource?: string | null;
      utmMedium?: string | null;
      utmCampaign?: string | null;
      utmContent?: string | null;
      tableId?: string;
    };

    const path = String(body.path ?? "").slice(0, 512);
    if (!path || path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;

    await prisma.pageView.create({
      data: {
        path,
        locale: body.locale?.slice(0, 8),
        isMenu: Boolean(body.isMenu),
        sessionId: body.sessionId?.slice(0, 64),
        referrer: body.referrer?.slice(0, 512),
        utmSource: body.utmSource?.slice(0, 128) ?? undefined,
        utmMedium: body.utmMedium?.slice(0, 128) ?? undefined,
        utmCampaign: body.utmCampaign?.slice(0, 128) ?? undefined,
        utmContent: body.utmContent?.slice(0, 128) ?? undefined,
        userAgent: userAgent?.slice(0, 512),
        tableId: body.tableId?.slice(0, 64),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
