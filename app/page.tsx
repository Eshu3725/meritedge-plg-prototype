import fs from "fs";
import path from "path";
import { PrototypeApp } from "./prototype";

export default function Page() {
  const html = fs.readFileSync(path.join(process.cwd(), "content", "shell.html"), "utf8");
  return <PrototypeApp html={html} />;
}
