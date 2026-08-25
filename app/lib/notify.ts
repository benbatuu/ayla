import { prisma } from "./prisma";

export type NotificationChannel = "email" | "sms" | "console";

type ReservationNotifyInput = {
  reservationId: string;
  name: string;
  phone: string;
  email: string;
  dateKey: string;
  time: string;
  guests: number;
  phoneDisplay: string;
};

function demoMode() {
  return (
    process.env.NOTIFY_DEMO_MODE === "1" ||
    (!process.env.RESEND_API_KEY && !process.env.TWILIO_ACCOUNT_SID)
  );
}

async function logNotification(input: {
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  meta?: object;
  status: "sent" | "demo" | "failed";
  error?: string;
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        channel: input.channel,
        recipient: input.recipient,
        subject: input.subject,
        body: input.body,
        meta: input.meta ?? undefined,
        status: input.status,
        error: input.error ?? null,
      },
    });
  } catch {
    // Logging must never break booking flow
  }
}

function buildGuestEmail(input: ReservationNotifyInput) {
  const subject = `Ay'la · Rezervasyon talebiniz alındı (${input.dateKey} ${input.time})`;
  const body = [
    `Merhaba ${input.name},`,
    ``,
    `Ay'la Food & More | Bazı Şeyler Asla Değişmez`,
    ``,
    `Rezervasyon talebiniz bize ulaştı. Ekibimiz en kısa sürede onaylayacak.`,
    ``,
    `Tarih: ${input.dateKey}`,
    `Saat: ${input.time}`,
    `Misafir: ${input.guests}`,
    `Referans: ${input.reservationId.slice(0, 8).toUpperCase()}`,
    ``,
    `Değişiklik veya iptal için lütfen bizi arayın: ${input.phoneDisplay}`,
    `Online iptal yoktur — masanızı sizin için tutmak isteriz.`,
    ``,
    `Sevgiler,`,
    `Ay'la`,
  ].join("\n");
  return { subject, body };
}

function buildGuestSms(input: ReservationNotifyInput) {
  return `Ay'la: Rezervasyon talebiniz alındı (${input.dateKey} ${input.time}, ${input.guests} kişi). Onay için sizi arayabiliriz. Degisiklik/iptal: ${input.phoneDisplay}`;
}

async function sendEmail(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL || "Ay'la <reservation@aylaalanya.com>";

  if (!apiKey || demoMode()) {
    console.info("[notify:email:demo]", { to, subject, body });
    await logNotification({
      channel: "email",
      recipient: to,
      subject,
      body,
      status: "demo",
    });
    return { ok: true, demo: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      await logNotification({
        channel: "email",
        recipient: to,
        subject,
        body,
        status: "failed",
        error: errText.slice(0, 500),
      });
      return { ok: false };
    }
    await logNotification({
      channel: "email",
      recipient: to,
      subject,
      body,
      status: "sent",
    });
    return { ok: true };
  } catch (e) {
    await logNotification({
      channel: "email",
      recipient: to,
      subject,
      body,
      status: "failed",
      error: e instanceof Error ? e.message : "unknown",
    });
    return { ok: false };
  }
}

async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from || demoMode()) {
    console.info("[notify:sms:demo]", { to, body });
    await logNotification({
      channel: "sms",
      recipient: to,
      subject: "SMS",
      body,
      status: "demo",
    });
    return { ok: true, demo: true };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({
      To: to,
      From: from,
      Body: body,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      await logNotification({
        channel: "sms",
        recipient: to,
        subject: "SMS",
        body,
        status: "failed",
        error: errText.slice(0, 500),
      });
      return { ok: false };
    }
    await logNotification({
      channel: "sms",
      recipient: to,
      subject: "SMS",
      body,
      status: "sent",
    });
    return { ok: true };
  } catch (e) {
    await logNotification({
      channel: "sms",
      recipient: to,
      subject: "SMS",
      body,
      status: "failed",
      error: e instanceof Error ? e.message : "unknown",
    });
    return { ok: false };
  }
}

function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`;
  if (phone.trim().startsWith("+")) return `+${digits}`;
  return `+90${digits}`;
}

export async function notifyReservationCreated(
  input: ReservationNotifyInput
): Promise<void> {
  const email = buildGuestEmail(input);
  const smsBody = buildGuestSms(input);
  await Promise.allSettled([
    sendEmail(input.email, email.subject, email.body),
    sendSms(normalizePhoneE164(input.phone), smsBody),
  ]);
}
