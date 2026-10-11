"use client";

import { useEffect } from "react";
import { appData } from "../data";

declare global {
  interface Window {
    __APP_DATA__?: typeof appData;
    __ME_BOOTED__?: boolean;
  }
}

export function PrototypeApp({ html }: { html: string }) {
  useEffect(() => {
    if (window.__ME_BOOTED__) return;
    window.__ME_BOOTED__ = true;
    window.__APP_DATA__ = structuredClone(appData);
    const script = document.createElement("script");
    script.src = "/engine.js";
    script.async = false;
    document.body.appendChild(script);
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
