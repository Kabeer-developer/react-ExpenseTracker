import React, { useState, useEffect } from "react";
import AuthSetup from "./AuthSetup";
import AuthLogin from "./AuthLogin";
import { loadAuth, loadConfig, authCss } from "./AuthUtils";

export default function AuthWrapper({ children }) {
  const [authState, setAuthState] = useState("loading"); // "loading" | "setup" | "login" | "authenticated"
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const config = loadConfig();
    setDark(config.dark !== false); // default true

    const authData = loadAuth();
    if (!authData) {
      setAuthState("setup");
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
      
      {authState === "setup" && <AuthSetup onSetupComplete={handleSetupComplete} />}
      {authState === "login" && <AuthLogin onLogin={handleLoginSuccess} />}
    </div>
  );
}
