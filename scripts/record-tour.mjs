import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = path.join(root, "videos");
const mp4 = path.join(root, "talentedge-product-tour.mp4");
fs.mkdirSync(rawDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: rawDir, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
await page.addInitScript(() => {
  const start = () => {
    const root = document.documentElement;
    if (!root) return;
    const hide = () => document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    hide();
    new MutationObserver(hide).observe(root, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
});

page.setDefaultTimeout(180000);
page.on("pageerror", (err) => console.log("pageerror", err.message));
console.log("opening tour");
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => document.body.classList.contains("demo-open"));
console.log("tour started");
await page.waitForFunction(() => document.body.classList.contains("demo-ended"));
console.log("tour ended");
await page.waitForTimeout(3500);

const video = page.video();
await context.close();
await browser.close();
const webm = await video.path();
console.log("recorded", webm);

await new Promise((resolve, reject) => {
  const ff = spawn(
    "ffmpeg",
    ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4],
    { stdio: "inherit" }
  );
  ff.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg exited " + code))));
});

const publicCopy = path.join(root, "public", "talentedge-product-tour.mp4");
fs.copyFileSync(mp4, publicCopy);
const mb = (fs.statSync(mp4).size / 1024 / 1024).toFixed(1);
console.log("saved", mp4, mb + " MB");
