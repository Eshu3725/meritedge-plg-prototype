import { NextResponse } from "next/server";
import { loadMailConfig } from "@/lib/mail-config";

export async function GET() {
  const cfg = loadMailConfig();
  return NextResponse.json({
    ok: true,
    ready: Boolean(cfg.user && cfg.password),
    from: cfg.fromEmail || cfg.user || "",
  });
}
