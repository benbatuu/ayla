import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

const ALLOWED = new Set(["necessary-only", "accept-all"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      choice?: string;
      sessionId?: string;
    };

    const choice = String(body.choice ?? "").trim();
    if (!ALLOWED.has(choice)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;

    await prisma.cookieConsent.create({
      data: {
        choice,
        sessionId: body.sessionId?.slice(0, 64),
        userAgent: userAgent?.slice(0, 512),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
