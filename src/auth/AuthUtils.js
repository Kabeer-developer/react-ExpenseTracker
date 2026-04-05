export async function hashString(str) {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export const SECURITY_QUESTIONS = [
  "What is your favorite color?",
  "What is the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What high school did you attend?",
  "What is the name of your first school?",
  "What is your favorite movie?",
  "What is your favorite food?",
  "Who was your childhood hero?"
];

export const loadAuth = () => {
  try {
    const data = localStorage.getItem("et:auth");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const saveAuth = (val) => {
  try {
    localStorage.setItem("et:auth", JSON.stringify(val));
  } catch (e) {}
};

export const loadConfig = () => {
  try {
    const data = localStorage.getItem("et:config");
    return data ? JSON.parse(data) : { dark: true };
  } catch (e) {
    return { dark: true };
  }
};

export const authCss = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#090b13;--surface:#0f1220;--surface2:#151929;--surface3:#1c2235;
    --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);
    --text:#e8eaf0;--muted:#7880a0;--accent:#6366f1;
    --income:#10b981;--expense:#f43f5e;
    --r:14px;--r2:20px;
  }
  .light{
    --bg:#f0f2f9;--surface:#fff;--surface2:#f5f7fd;--surface3:#eef0f8;
    --border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.12);
    --text:#0f1220;--muted:#6b7280;
  }
  body,#root{min-height:100vh;background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);}
  input,select,textarea{font-family:inherit}
  .serif{font-family:'Instrument Serif',serif}
  @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .anim{animation:slideIn .25s ease both}
`;

export const inputStyle = { width:"100%", padding:"11px 14px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, fontSize:14, color:"var(--text)", outline:"none", transition:"border .15s" };
export const btnPrimary = { width: "100%", padding:"12px 20px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", transition:"opacity .15s", display:"flex", alignItems:"center", justifyContent:"center", gap:6 };
