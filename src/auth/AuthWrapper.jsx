import React, { useState, useEffect, useRef } from "react";
import AuthSetup from "./AuthSetup";
import AuthLogin from "./AuthLogin";
import { loadAuth, loadConfig, authCss, btnPrimary } from "./AuthUtils";

export default function AuthWrapper({ children }) {
  const [authState, setAuthState] = useState("loading"); // "loading" | "choose" | "setup" | "login" | "authenticated"
  const [dark, setDark] = useState(true);
  /** If false, user came from the welcome screen (no profile yet) — allow back to it from Sign in. */
  const hadAuthOnLoadRef = useRef(false);

  useEffect(() => {
    const config = loadConfig();
    setDark(config.dark !== false); // default true

    const authData = loadAuth();
    hadAuthOnLoadRef.current = !!authData;
    if (!authData) {
      setAuthState("choose");
    } else {
      setAuthState("login");
    }
  }, []);

  const handleSetupComplete = () => {
    // If they just completed setup, they are authenticated.
    setAuthState("authenticated");
  };

  const handleLoginSuccess = () => {
    setAuthState("authenticated");
  };

  if (authState === "loading") return null;

  if (authState === "authenticated") {
    // Render the main app children
    return <>{children}</>;
  }

  return (
    <div className={dark ? "" : "light"} style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'DM Sans', sans-serif", color: "var(--text)", padding: "1px" }}>
      <style>{authCss}</style>

      {authState === "choose" && (
        <div className="anim" style={{ maxWidth: 440, margin: "80px auto", padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r2)" }}>
          <h1 className="serif" style={{ fontSize: 34, marginBottom: 8, letterSpacing: "-0.02em" }}>
            Expense <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Tracker</em>
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: 28, fontSize: 14, lineHeight: 1.55 }}>
            Your data stays in this browser. Create a new profile, or sign in if you already set one up on this device.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button type="button" onClick={() => setAuthState("login")} style={btnPrimary}>
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuthState("setup")}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 12,
                border: "1px solid var(--border2)",
                background: "transparent",
                color: "var(--text)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Create account
            </button>
          </div>
        </div>
      )}

      {authState === "setup" && (
        <AuthSetup
          onSetupComplete={handleSetupComplete}
          onBack={() => setAuthState("choose")}
        />
      )}
      {authState === "login" && (
        <AuthLogin
          onLogin={handleLoginSuccess}
          onGoToSetup={() => setAuthState("setup")}
          onBackToChoose={hadAuthOnLoadRef.current ? undefined : () => setAuthState("choose")}
        />
      )}
    </div>
  );
}
