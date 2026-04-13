import React, { useState, useEffect } from "react";
import { hashString, loadAuth, saveAuth, inputStyle, btnPrimary } from "./AuthUtils";

export default function AuthLogin({ onLogin, onGoToSetup, onBackToChoose }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "migrate" | "forgot_identifier" | "forgot_question" | "reset"

  const [authData, setAuthData] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Forgot password state
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const data = loadAuth();
    setAuthData(data);
    if (data && !data.identifier) {
      setMode("migrate");
    }
    setHydrated(true);
  }, []);

  const handleMigrate = (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please provide an identifier.");
      return;
    }
    const updatedUser = { ...authData, identifier: identifier.trim().toLowerCase() };
    saveAuth(updatedUser);
    setAuthData(updatedUser);
    setMode("login");
    setIdentifier("");
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const freshAuth = loadAuth(); // Force fresh read from storage
    if (!freshAuth) return;
    setAuthData(freshAuth); // Sync runtime state

    if (identifier.trim().toLowerCase() !== freshAuth.identifier) {
      setError("User not found.");
      return;
    }

    const inputHash = await hashString(password);
    if (inputHash === freshAuth.passwordHash) {
      onLogin();
    } else {
      setError("Incorrect password.");
    }
  };

  const handleForgotIdentifier = (e) => {
    e.preventDefault();
    const freshAuth = loadAuth(); // ensure latest
    setAuthData(freshAuth);
    if (identifier.trim().toLowerCase() !== freshAuth.identifier) {
      setError("User not found.");
      return;
    }
    setMode("forgot_question");
    setError("");
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedQuestion || !answer.trim()) {
      setError("Please select a question and provide an answer.");
      return;
    }

    const questionObj = authData.questions.find(q => q.question === selectedQuestion);
    if (!questionObj) {
      setError("Invalid question selected.");
      return;
    }

    const answerHash = await hashString(answer.trim().toLowerCase());
    if (answerHash === questionObj.answerHash) {
      setMode("reset");
      setError("");
    } else {
      setError("Incorrect answer. Please try again.");
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6 || newPassword.length > 8) {
      setError("Password must be between 6 and 8 characters.");
      return;
    }

    // After successful validation
    const newHash = await hashString(newPassword);
    const newAuthData = {
      ...authData,
      passwordHash: newHash
    };
    saveAuth(newAuthData); // Update stored password immediately
    setAuthData(newAuthData); // Sync state immediately
    
    setMode("login");
    setPassword("");
    setNewPassword("");
    setIdentifier("");
    setAnswer("");
    setError("");
    alert("Password successfully reset. You can now log in.");
  };

  if (!hydrated) return null;

  if (!authData) {
    return (
      <div className="anim" style={{ maxWidth: 440, margin: "80px auto", padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r2)" }}>
        <h2 className="serif" style={{ fontSize: 32, marginBottom: 8 }}>Sign in</h2>
        <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 14, lineHeight: 1.55 }}>
          No saved profile was found in this browser. Sign in is only available here if you already created an account on this same device and browser.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {typeof onGoToSetup === "function" && (
            <button type="button" onClick={onGoToSetup} style={btnPrimary}>
              Create account
            </button>
          )}
          {typeof onBackToChoose === "function" && (
            <button
              type="button"
              onClick={onBackToChoose}
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
              Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="anim" style={{ maxWidth: 440, margin: "80px auto", padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r2)" }}>
      {typeof onBackToChoose === "function" && mode === "login" && (
        <button
          type="button"
          onClick={onBackToChoose}
          style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", marginBottom: 16, padding: 0, display: "block" }}
        >
          ← Back
        </button>
      )}
      <h2 className="serif" style={{ fontSize: 32, marginBottom: 8 }}>
        {mode === "login" ? "Welcome Back" : mode === "migrate" ? "Update Required" : mode === "reset" ? "Reset Password" : "Account Recovery"}
      </h2>
      <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 14 }}>
        {mode === "login" ? "Enter your credentials to access your expenses." : mode === "migrate" ? "Please associate an email or username to continue." : mode.startsWith("forgot") ? "Follow the steps to recover your account." : "Enter your new password below."}
      </p>

      {error && <div className="anim" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e", padding: "10px 14px", borderRadius: 10, fontSize: 14, marginBottom: 16 }}>{error}</div>}

      {mode === "migrate" && (
        <form onSubmit={handleMigrate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Username or Email</label>
            <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required style={inputStyle} placeholder="Enter a username or email" autoFocus />
          </div>
          <button type="submit" style={btnPrimary}>Update Profile</button>
        </form>
      )}

      {mode === "login" && (
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Username or Email</label>
            <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required style={inputStyle} placeholder="Enter your identifier" autoFocus />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} placeholder="Enter your password" />
          </div>
          <button type="submit" style={btnPrimary}>Sign In</button>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button type="button" onClick={() => { setMode("forgot_identifier"); setError(""); setIdentifier(""); }} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer" }}>
              Forgot Password?
            </button>
          </div>
        </form>
      )}

      {mode === "forgot_identifier" && (
        <form onSubmit={handleForgotIdentifier} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Enter your Username or Email</label>
            <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required style={inputStyle} placeholder="Your identifier" autoFocus />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" style={{ ...btnPrimary, flex: 1 }}>Next</button>
            <button type="button" onClick={() => { setMode("login"); setError(""); setIdentifier(""); }} style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid var(--border2)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "forgot_question" && (
        <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--surface2)", padding: 16, borderRadius: 12, border: "1px solid var(--border2)" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500 }}>Select a Security Question</label>
            <select value={selectedQuestion} onChange={e => setSelectedQuestion(e.target.value)} required style={{ ...inputStyle, background: "var(--surface)" }}>
              <option value="">Choose a question...</option>
              {authData.questions.map(q => (
                <option key={q.question} value={q.question}>{q.question}</option>
              ))}
            </select>
            <input type="text" value={answer} onChange={e => setAnswer(e.target.value)} required style={{ ...inputStyle, background: "var(--surface)" }} placeholder="Your answer" />
          </div>
          
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" style={{ ...btnPrimary, flex: 1 }}>Verify Answer</button>
            <button type="button" onClick={() => { setMode("login"); setError(""); setAnswer(""); setSelectedQuestion(""); }} style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid var(--border2)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "reset" && (
        <form onSubmit={handleResetSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>New Password (6-8 chars)</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={inputStyle} minLength={6} maxLength={8} placeholder="Enter new password" autoFocus />
          </div>
          <button type="submit" style={btnPrimary}>Set New Password</button>
        </form>
      )}
    </div>
  );
}
