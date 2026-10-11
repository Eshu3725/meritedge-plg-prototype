"use client";

import { FormEvent, useEffect, useState } from "react";
import "./login.css";

const SLIDES = [
  {
    lead: "AI-Powered",
    accent: "Screening",
    title: "Screen smarter, hire faster.",
    copy: "Intelligent automation for candidate evaluation.",
  },
  {
    lead: "Smart",
    accent: "Assessments",
    title: "Auto-configured for every role.",
    copy: "Tailored tests that match your job specs.",
  },
  {
    lead: "Team",
    accent: "Collaboration",
    title: "Review and decide together.",
    copy: "Unified platform for hiring decisions.",
  },
] as const;

const I = "https://c.animaapp.com/Yn5fn4w8COOHsuakUjTCMA/assets";

export function LoginScreen() {
  const [slide, setSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const current = SLIDES[slide];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlide((value) => (value + 1) % SLIDES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }
    setError("This screen matches the TalentEdge login design. Sign-in stays in the prototype.");
  }

  return (
    <div className="td-page">
      <div className="td-blob one" />
      <div className="td-blob two" />
      <div className="td-blob three" />
      <video className="td-bg-video" autoPlay loop muted playsInline>
        <source src="https://me.otomeyt.ai/login/dark-swirling.mp4" type="video/mp4" />
      </video>
      <div className="td-noise" />

      <div className="td-wrap">
        <header className="td-header">
          <a className="td-brand" href="https://me.otomeyt.ai/" aria-label="TalentEdge by Otomeyt AI">
            <img className="td-logo" src="https://me.otomeyt.ai/common/otomeyt-ai-logo.svg" alt="Otomeyt AI" />
            <span className="td-divider" />
            <span className="td-brand-text">
              <span className="td-brand-main">TalentEdge</span>
              <span className="td-brand-sub">by Otomeyt AI</span>
            </span>
          </a>
          <div className="td-controls">
            <button className="td-chip" type="button">
              <img src={`${I}/icon-1.svg`} alt="" />
              <span>English</span>
              <img src={`${I}/icon-2.svg`} alt="" />
            </button>
            <button className="td-icon-btn" type="button" aria-label="Toggle theme">
              <img src={`${I}/icon-3.svg`} alt="" />
            </button>
          </div>
        </header>

        <main className="td-main">
          <section className="td-card">
            <aside className="td-promo">
              <video autoPlay loop muted playsInline>
                <source src="https://me.otomeyt.ai/login/getty-images.mp4" type="video/mp4" />
              </video>
              <div className="td-promo-overlay" />
              <div className="td-promo-content">
                <h2>
                  {current.lead}
                  <br />
                  <span className="td-grad">{current.accent}</span>
                </h2>
                <p className="td-lead">{current.title}</p>
                <p className="td-sub">{current.copy}</p>
                <div className="td-dots">
                  {SLIDES.map((item, index) => (
                    <button
                      key={item.accent}
                      type="button"
                      className={index === slide ? "td-dot active" : "td-dot"}
                      aria-label={`Go to slide ${index + 1}`}
                      onClick={() => setSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </aside>

            <div className="td-form-side">
              <div className="td-title">
                <h1>
                  Welcome to <span className="td-grad">TalentEdge</span>
                </h1>
                <p>An AI-Native Assessment Suite</p>
              </div>
              <form onSubmit={onSubmit}>
                <div className="td-field">
                  <img className="td-icon" src={`${I}/icon-4.svg`} alt="" />
                  <input type="email" placeholder="Work Email" name="email" autoComplete="email" />
                </div>
                <div className="td-field td-password">
                  <img className="td-icon" src={`${I}/icon-5.svg`} alt="" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    name="password"
                    autoComplete="current-password"
                  />
                  <button
                    className="td-show"
                    type="button"
                    aria-label="Show password"
                    onClick={() => setShowPassword((shown) => !shown)}
                  >
                    <img src={`${I}/icon-6.svg`} alt="" />
                  </button>
                </div>
                <div className="td-forgot-row">
                  <button type="button">Forgot Password?</button>
                </div>
                <p className={error ? "td-error on" : "td-error"}>{error}</p>
                <button className="td-login-btn" type="submit">
                  Log In
                </button>
                <div className="td-or">or</div>
                <div className="td-social">
                  <button className="td-social-btn" type="button">
                    <img src={`${I}/icon-7.svg`} alt="" />
                    Google
                  </button>
                  <button className="td-social-btn" type="button">
                    <img src={`${I}/icon-8.svg`} alt="" />
                    Microsoft
                  </button>
                  <button className="td-social-btn" type="button">
                    <img src={`${I}/icon-9.svg`} alt="" />
                    SSO
                  </button>
                </div>
              </form>
            </div>
          </section>
        </main>

        <footer className="td-footer">
          <a href="https://me.otomeyt.ai/oauth/privacy-policy">Privacy Policy</a>
          <span>·</span>
          <a href="https://me.otomeyt.ai/oauth/terms-of-service">Terms of Service</a>
        </footer>
      </div>
    </div>
  );
}
