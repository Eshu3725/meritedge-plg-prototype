import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { loadMailConfig } from "@/lib/mail-config";

export async function POST(request: Request) {
  let body: { to?: string | string[]; subject?: string; html?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const subject = String(body.subject || "GST Invoice").trim();
  const html = String(body.html || "");
  const tos = Array.isArray(body.to) ? body.to : body.to ? [body.to] : [];
  if (!tos.length) {
    return NextResponse.json({ ok: false, error: "missing to" }, { status: 400 });
  }
  if (html.length > 400_000) {
    return NextResponse.json({ ok: false, error: "payload too large" }, { status: 413 });
  }

  const cfg = loadMailConfig();
  if (!cfg.user || !cfg.password) {
    return NextResponse.json(
      { ok: false, error: "Gmail credentials missing. Add them to gst_smtp.env." },
      { status: 500 }
    );
  }

  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.password },
  });

  const sent: string[] = [];
  try {
    for (const raw of tos) {
      const addr = String(raw || "").trim();
      if (!addr) continue;
      await transport.sendMail({
        from: `${cfg.fromName} <${cfg.fromEmail || cfg.user}>`,
        to: addr,
        replyTo: cfg.fromEmail || cfg.user,
        subject,
        html,
      });
      sent.push(addr);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP failed";
    return NextResponse.json({ ok: false, error: message, sent }, { status: 500 });
  }

  return NextResponse.json({ ok: true, to: sent });
}
