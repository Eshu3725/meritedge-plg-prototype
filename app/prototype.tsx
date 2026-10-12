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
    const appContent = document.getElementById("appContent");
    const nav = document.getElementById("teNav");
    const shellInitialized = Boolean(appContent?.children.length || nav?.children.length);

    if (window.__ME_BOOTED__ && shellInitialized) return;

    if (window.__ME_BOOTED__ && !shellInitialized) {
      document.querySelector('script[data-meritedge-engine="true"]')?.remove();
      window.__ME_BOOTED__ = false;
    }

    window.__ME_BOOTED__ = true;
    window.__APP_DATA__ = structuredClone(appData);
    const script = document.createElement("script");
    script.dataset.meritedgeEngine = "true";
    script.src = `/engine.js?boot=${Date.now()}`;
    script.async = false;
    script.onerror = () => {
      window.__ME_BOOTED__ = false;
      console.error("MeritEdge engine failed to load");
    };
    document.body.appendChild(script);
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
