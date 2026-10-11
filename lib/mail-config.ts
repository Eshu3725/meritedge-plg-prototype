import fs from "fs";
import path from "path";

export type MailConfig = {
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
  host: string;
  port: number;
};

export function loadMailConfig(): MailConfig {
  const data: Record<string, string> = {};
  for (const key of [
    "GMAIL_USER",
    "GMAIL_APP_PASSWORD",
    "FROM_NAME",
    "FROM_EMAIL",
    "SMTP_HOST",
    "SMTP_PORT",
  ]) {
    if (process.env[key]) data[key] = process.env[key]!.trim();
  }
  const envPath = path.join(process.cwd(), "gst_smtp.env");
  if (fs.existsSync(envPath)) {
    for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const idx = line.indexOf("=");
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(k in data)) data[k] = v;
    }
  }
  return {
    user: data.GMAIL_USER || "",
    password: (data.GMAIL_APP_PASSWORD || "").replace(/ /g, ""),
    fromName: data.FROM_NAME || "TalentEdge",
    fromEmail: data.FROM_EMAIL || data.GMAIL_USER || "",
    host: data.SMTP_HOST || "smtp.gmail.com",
    port: Number(data.SMTP_PORT || 587),
  };
}
