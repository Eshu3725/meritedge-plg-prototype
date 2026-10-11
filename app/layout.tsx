import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeritEdge — Phase 1 prototype",
  description: "MeritEdge and AI Interviewer in one TalentEdge workspace.",
};

const themeBoot = `(function(){try{var t=localStorage.getItem("theme")||"dark";if(t!=="light"&&t!=="dark")t="dark";document.documentElement.setAttribute("data-theme",t);document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.classList.toggle("light",t==="light");}catch(e){document.documentElement.setAttribute("data-theme","dark");document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className="dark" suppressHydrationWarning>
      <body className="in-app">
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        {children}
      </body>
    </html>
  );
}
