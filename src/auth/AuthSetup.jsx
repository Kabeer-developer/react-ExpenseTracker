import React, { useState } from "react";
import { SECURITY_QUESTIONS, hashString, saveAuth, inputStyle, btnPrimary } from "./AuthUtils";

export default function AuthSetup({ onSetupComplete }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selections, setSelections] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" }
  ]);
  const [error, setError] = useState("");

  const handleSelectChange = (index, value) => {
    const newSels = [...selections];
    newSels[index].question = value;
    setSelections(newSels);
  };

  const handleAnswerChange = (index, value) => {
    const newSels = [...selections];
    newSels[index].answer = value;
    setSelections(newSels);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please provide a username or email.");
      return;
    }
    if (password.length < 6 || password.length > 8) {
      setError("Password must be between 6 and 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check unique questions
    const qSet = new Set(selections.map(s => s.question));
    if (qSet.has("") || qSet.size !== 3) {
      setError("Please select 3 distinct security questions.");
      return;
    }

    if (selections.some(s => s.answer.trim() === "")) {
      setError("Please provide answers for all selected questions.");
      return;
    }

    // Hash password
    const passwordHash = await hashString(password);
    
    // Store questions and their case-insensitive hash
    const questionsAndAnswers = selections.map(s => ({
      question: s.question,
      answerHash: s.answer.trim().toLowerCase() 
    }));

    for (let qa of questionsAndAnswers) {
      qa.answerHash = await hashString(qa.answerHash);
    }

    const authData = {
      identifier: identifier.trim().toLowerCase(),
      passwordHash,
      questions: questionsAndAnswers
    };

    saveAuth(authData);
    onSetupComplete();
  };

  return (
    <div className="anim" style={{ maxWidth: 480, margin: "60px auto", padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r2)" }}>
      <h2 className="serif" style={{ fontSize: 32, marginBottom: 8 }}>Welcome to Expense Tracker</h2>
      <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 14 }}>It looks like it's your first time here. Please set up a password to secure your data.</p>
      
      {error && <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e", padding: "10px 14px", borderRadius: 10, fontSize: 14, marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Username or Email</label>
          <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required style={inputStyle} placeholder="Enter username or email" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Password (6-8 chars)</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} minLength={6} maxLength={8} placeholder="Enter password" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={inputStyle} minLength={6} maxLength={8} placeholder="Confirm password" />
        </div>

        <div style={{ marginTop: 8, marginBottom: 8, height: 1, background: "var(--border)" }} />
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Security Questions (Choose 3)</h3>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: -12 }}>Used to recover your password if forgotten. Answers are case-insensitive.</p>

        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--surface2)", padding: 16, borderRadius: 12, border: "1px solid var(--border2)" }}>
            <select value={selections[i].question} onChange={e => handleSelectChange(i, e.target.value)} required style={{ ...inputStyle, background: "var(--surface)" }}>
              <option value="">Select a question...</option>
              {SECURITY_QUESTIONS.map(q => (
                <option key={q} value={q} disabled={selections.some((s, idx) => s.question === q && idx !== i)}>{q}</option>
              ))}
            </select>
            <input type="text" value={selections[i].answer} onChange={e => handleAnswerChange(i, e.target.value)} required style={{ ...inputStyle, background: "var(--surface)" }} placeholder="Your answer" />
          </div>
        ))}

        <button type="submit" style={{ ...btnPrimary, marginTop: 8 }}>Complete Setup</button>
      </form>
    </div>
  );
}
