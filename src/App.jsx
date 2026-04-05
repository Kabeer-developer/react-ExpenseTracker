"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  PlusCircle, Sun, Moon, Eye, EyeOff, Trash2, Edit2, Search,
  TrendingUp, TrendingDown, DollarSign, Calendar, Zap, X,
  ChevronDown, Check, ArrowUpDown, Target, Bell, FileText,
  Repeat, Tag, AlertCircle, ChevronRight, Wallet, BarChart2,
  PieChart, Download, Filter, Gift, CreditCard,
} from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

// ─── PALETTE & CATEGORIES ────────────────────────────────────────────────────
const CATS = [
  { id:"food",    name:"Food & Dining",   emoji:"🍔", color:"#f43f5e", bg:"rgba(244,63,94,0.15)"  },
  { id:"transport",name:"Transport",      emoji:"🚗", color:"#3b82f6", bg:"rgba(59,130,246,0.15)" },
  { id:"shopping",name:"Shopping",        emoji:"🛍️", color:"#a855f7", bg:"rgba(168,85,247,0.15)" },
  { id:"bills",   name:"Bills & Utilities",emoji:"💡",color:"#f59e0b", bg:"rgba(245,158,11,0.15)" },
  { id:"health",  name:"Health & Medical", emoji:"🏥", color:"#ec4899", bg:"rgba(236,72,153,0.15)" },
  { id:"entertainment",name:"Entertainment",emoji:"🎬",color:"#6366f1",bg:"rgba(99,102,241,0.15)" },
  { id:"education",name:"Education",      emoji:"📚", color:"#14b8a6", bg:"rgba(20,184,166,0.15)" },
  { id:"salary",  name:"Salary",          emoji:"💼", color:"#10b981", bg:"rgba(16,185,129,0.15)" },
  { id:"freelance",name:"Freelance",      emoji:"💻", color:"#059669", bg:"rgba(5,150,105,0.15)"  },
  { id:"investment",name:"Investments",   emoji:"📈", color:"#84cc16", bg:"rgba(132,204,22,0.15)" },
  { id:"travel",  name:"Travel",          emoji:"✈️", color:"#0ea5e9", bg:"rgba(14,165,233,0.15)" },
  { id:"rent",    name:"Rent",            emoji:"🏠", color:"#64748b", bg:"rgba(100,116,139,0.15)"},
  { id:"savings", name:"Savings",         emoji:"🏦", color:"#f97316", bg:"rgba(249,115,22,0.15)" },
  { id:"gifts",   name:"Gifts",           emoji:"🎁", color:"#e879f9", bg:"rgba(232,121,249,0.15)"},
];

const [password, setPassword] = useState("");
const [input, setInput] = useState("");
const [isLoggedIn, setIsLoggedIn] = useState(false);

const fmt = (n, privacy, currency="₹") => privacy ? "••••••" : `${currency}${Number(n).toLocaleString("en-IN")}`;
const isoDate = (d=new Date()) => d.toISOString().split("T")[0];
const monthKey = (d) => `${new Date(d).getFullYear()}-${String(new Date(d).getMonth()+1).padStart(2,"0")}`;
const CURRENCIES = ["₹","$","€","£","¥"];

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
// ✅ Save
const save = async (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error("Save error:", e);
  }
};

// ✅ Load
const load = async (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error("Load error:", e);
    return fallback;
  }
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(CATS);
  const [dark, setDark] = useState(true);
  const [privacy, setPrivacy] = useState(false);
  const [currency, setCurrency] = useState("₹");
  const [modal, setModal] = useState(null); // null | "add" | "edit" | "budget" | "recurring" | "export"
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("thisMonth");
  const [sortBy, setSortBy] = useState("date");
  const [activeTab, setActiveTab] = useState("transactions"); // transactions | analytics | budgets
  const [budgets, setBudgets] = useState({});
  const [recurringRules, setRecurringRules] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const [form, setForm] = useState({
    type:"expense", amount:"", category:"", description:"", date:isoDate(), tags:"", note:""
  });
  const [budgetForm, setBudgetForm] = useState({ category:"", limit:"" });
  const [recForm, setRecForm] = useState({ type:"expense", amount:"", category:"", description:"", frequency:"monthly", startDate:isoDate() });
  const [newCatName, setNewCatName] = useState("");

  // ── Load from storage ──
  useEffect(() => {
    (async () => {
      const tx  = await load("et:transactions", []);
      const cat = await load("et:categories", CATS);
      const bud = await load("et:budgets", {});
      const rec = await load("et:recurring", []);
      const cfg = await load("et:config", { dark:true, currency:"₹" });
      setTransactions(tx); setCategories(cat); setBudgets(bud);
      setRecurringRules(rec); setDark(cfg.dark); setCurrency(cfg.currency);
      setLoaded(true);
    })();
  }, []);

  // ── Persist on change ──
  useEffect(() => { if (loaded) save("et:transactions", transactions); }, [transactions, loaded]);
  useEffect(() => { if (loaded) save("et:categories", categories); }, [categories, loaded]);
  useEffect(() => { if (loaded) save("et:budgets", budgets); }, [budgets, loaded]);
  useEffect(() => { if (loaded) save("et:recurring", recurringRules); }, [recurringRules, loaded]);
  useEffect(() => { if (loaded) save("et:config", { dark, currency }); }, [dark, currency, loaded]);
useEffect(() => {
  const stored = localStorage.getItem("password");
  if (stored) {
    setPassword(stored);
  }
}, []);
  {!password && (
  <div>
    <h3>Set Password</h3>
    <input onChange={(e) => setInput(e.target.value)} />
    <button
      onClick={() => {
        localStorage.setItem("password", input);
        setPassword(input);
      }}
    >
      Save
    </button>
  </div>
)}
  {password && !isLoggedIn && (
  <div>
    <h3>Login</h3>
    <input onChange={(e) => setInput(e.target.value)} />
    <button
      onClick={() => {
        if (input === password) {
          setIsLoggedIn(true);
        } else {
          alert("Wrong password");
        }
      }}
    >
      Login
    </button>
  </div>
)}
  <button onClick={() => alert("Feature coming soon")}>
  Forgot Password?
</button>
  {isLoggedIn && <h2>Welcome to Expense Tracker 🎉</h2>}
  // ── Apply recurring transactions ──
  useEffect(() => {
    if (!loaded || !recurringRules.length) return;
    const today = isoDate();
    let newTx = [...transactions];
    let added = false;
    recurringRules.forEach(rule => {
      const last = rule.lastApplied || rule.startDate;
      const lastDate = new Date(last);
      const todayDate = new Date(today);
      let shouldAdd = false;
      if (rule.frequency === "daily" && last !== today) shouldAdd = true;
      if (rule.frequency === "weekly") {
        const diff = (todayDate - lastDate) / 86400000;
        if (diff >= 7) shouldAdd = true;
      }
      if (rule.frequency === "monthly") {
        if (todayDate.getMonth() !== lastDate.getMonth() || todayDate.getFullYear() !== lastDate.getFullYear()) shouldAdd = true;
      }
      if (shouldAdd) {
        newTx.push({ id: Date.now()+Math.random(), type:rule.type, amount:rule.amount, category:rule.category, description:rule.description+"(Auto)", date:today, tags:["recurring"], note:"" });
        rule.lastApplied = today;
        added = true;
      }
    });
    if (added) { setTransactions(newTx); setRecurringRules([...recurringRules]); notify("🔄 Recurring transactions applied!"); }
  }, [loaded]);

  const notify = (msg, type="success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Stats ──
  const stats = useMemo(() => {
    const income  = transactions.filter(t=>t.type==="income").reduce((a,b)=>a+Number(b.amount),0);
    const expense = transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+Number(b.amount),0);
    const byCat = {};
    transactions.filter(t=>t.type==="expense").forEach(t=>{
      byCat[t.category] = (byCat[t.category]||0)+Number(t.amount);
    });
    // Monthly trend (last 6 months)
    const trend = {};
    transactions.forEach(t=>{
      const k = monthKey(t.date);
      if (!trend[k]) trend[k] = { income:0, expense:0 };
      trend[k][t.type] += Number(t.amount);
    });
    const trendSorted = Object.entries(trend).sort().slice(-6);
    // All tags
    const allTags = [...new Set(transactions.flatMap(t=>t.tags||[]))];
    return { income, expense, balance:income-expense, byCat, trendSorted, allTags };
  }, [transactions]);

  // ── Budget alerts ──
  const budgetStatus = useMemo(() => {
    return Object.entries(budgets).map(([catId, limit]) => {
      const spent = stats.byCat[catId] || 0;
      const pct = limit ? (spent/limit)*100 : 0;
      return { catId, limit, spent, pct };
    });
  }, [budgets, stats.byCat]);

  // ── Filtered transactions ──
  const filtered = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => {
        const txDate = new Date(t.date);
        if (filter !== "all" && t.type !== filter) return false;
        if (timeRange === "thisMonth" && (txDate.getMonth()!==now.getMonth()||txDate.getFullYear()!==now.getFullYear())) return false;
        if (timeRange === "lastMonth") {
          const lm = new Date(now.getFullYear(), now.getMonth()-1);
          if (txDate.getMonth()!==lm.getMonth()||txDate.getFullYear()!==lm.getFullYear()) return false;
        }
        if (timeRange === "thisYear" && txDate.getFullYear()!==now.getFullYear()) return false;
        if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.tags?.some(tag=>tag.includes(search.toLowerCase()))) return false;
        if (selectedTags.length && !selectedTags.some(tag=>t.tags?.includes(tag))) return false;
        return true;
      })
      .sort((a,b) => {
        if (sortBy==="date") return new Date(b.date)-new Date(a.date);
        if (sortBy==="amount") return Number(b.amount)-Number(a.amount);
        if (sortBy==="description") return a.description.localeCompare(b.description);
        return 0;
      });
  }, [transactions, filter, timeRange, search, sortBy, selectedTags]);

  // ── Handlers ──
  const resetForm = () => {
    setModal(null); setEditing(null);
    setForm({ type:"expense", amount:"", category:"", description:"", date:isoDate(), tags:"", note:"" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.category) return;
    const tx = {
      id: editing?.id || Date.now().toString(),
      ...form, amount: parseFloat(form.amount),
      tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean),
    };
    if (editing) {
      setTransactions(prev => prev.map(t=>t.id===tx.id ? tx : t));
      notify("✏️ Transaction updated!");
    } else {
      setTransactions(prev => [tx, ...prev]);
      notify("✅ Transaction added!");
    }
    resetForm();
  };

  const deleteTx = (id) => {
    setTransactions(prev => prev.filter(t=>t.id!==id));
    notify("🗑️ Transaction deleted!", "warn");
  };

  const exportCSV = () => {
    const rows = [["Date","Type","Category","Description","Amount","Tags","Note"]];
    transactions.forEach(t=>{
      const cat = categories.find(c=>c.id===t.category);
      rows.push([t.date, t.type, cat?.name||t.category, t.description, t.amount, (t.tags||[]).join(";"), t.note||""]);
    });
    const csv = rows.map(r=>r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download = `expenses-${isoDate()}.csv`;
    a.click();
    notify("📤 CSV exported!");
  };

  const addBudget = (e) => {
    e.preventDefault();
    if (!budgetForm.category || !budgetForm.limit) return;
    setBudgets(prev => ({ ...prev, [budgetForm.category]: parseFloat(budgetForm.limit) }));
    setBudgetForm({ category:"", limit:"" });
    notify("🎯 Budget set!");
  };

  const addRecurring = (e) => {
    e.preventDefault();
    if (!recForm.amount || !recForm.category || !recForm.description) return;
    setRecurringRules(prev => [...prev, { ...recForm, id:Date.now(), lastApplied:null }]);
    setRecForm({ type:"expense", amount:"", category:"", description:"", frequency:"monthly", startDate:isoDate() });
    notify("🔁 Recurring rule saved!");
  };

  const addCustomCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      notify("Category already exists!", "warn");
      return;
    }
    const newCat = {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name: name,
      emoji: "🏷️",
      color: "#6366f1",
      bg: "rgba(99,102,241,0.15)"
    };
    setCategories(prev => [...prev, newCat]);
    setForm(prev => ({ ...prev, category: newCat.id }));
    setNewCatName("");
    notify("✨ New category added!");
  };

  // ── Chart data ──
  const doughnutData = useMemo(() => {
    const top = Object.entries(stats.byCat).sort((a,b)=>b[1]-a[1]).slice(0,7);
    return {
      labels: top.map(([id])=>categories.find(c=>c.id===id)?.name||id),
      datasets: [{ data: top.map(([,v])=>v),
        backgroundColor: top.map(([id])=>categories.find(c=>c.id===id)?.color+"cc"||"#888"),
        borderColor: top.map(([id])=>categories.find(c=>c.id===id)?.color||"#888"),
        borderWidth:2, hoverOffset:10 }]
    };
  }, [stats.byCat, categories]);

  const trendData = useMemo(() => ({
    labels: stats.trendSorted.map(([k])=>k),
    datasets: [
      { label:"Income", data:stats.trendSorted.map(([,v])=>v.income), borderColor:"#10b981", backgroundColor:"rgba(16,185,129,0.1)", tension:0.4, fill:true, pointRadius:4 },
      { label:"Expense", data:stats.trendSorted.map(([,v])=>v.expense), borderColor:"#f43f5e", backgroundColor:"rgba(244,63,94,0.1)", tension:0.4, fill:true, pointRadius:4 },
    ]
  }), [stats.trendSorted]);

  const chartOpts = { 
    responsive:true, 
    maintainAspectRatio:false, 
    plugins:{ 
      legend:{ display:false }, 
      tooltip:{ 
        backgroundColor: dark ? "rgba(15,15,25,0.95)" : "rgba(255,255,255,0.95)",
        textColor: dark ? "#e8eaf0" : "#0f1220",
        padding:12, 
        cornerRadius:8, 
        callbacks:{ label:(ctx)=>`${ctx.label}: ${fmt(ctx.parsed.y??ctx.parsed,false,currency)}` } 
      } 
    }, 
    scales:{ 
      x:{ 
        grid:{ color: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }, 
        ticks:{ color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)", font:{size:11} } 
      }, 
      y:{ 
        grid:{ color: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }, 
        ticks:{ color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)", font:{size:11}, callback:(v)=>fmt(v,false,currency) } 
      } 
    } 
  };

  // ── Top spending category ──
  const topCat = useMemo(() => {
    const e = Object.entries(stats.byCat);
    if (!e.length) return null;
    const [id,amt] = e.sort((a,b)=>b[1]-a[1])[0];
    return { ...(categories.find(c=>c.id===id)||{}), amount:amt };
  }, [stats.byCat, categories]);

  const savingsRate = stats.income > 0 ? Math.max(0,Math.round(((stats.income-stats.expense)/stats.income)*100)) : 0;

  // ── CSS ──
  const css = `
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
    scrollbar-width:thin;scrollbar-color:var(--surface3) transparent;
    ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--surface3);border-radius:4px}
    input,select,textarea{font-family:inherit}
    .serif{font-family:'Instrument Serif',serif}
    @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
    .anim{animation:slideIn .25s ease both}
    .pulse{animation:pulse 2s infinite}
  `;

  const D = dark; // shorthand

  return (
    <div className={dark?"":"light"} style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"'DM Sans',sans-serif", color:"var(--text)" }}>
      <style>{css}</style>

      {/* ── Notification ── */}
      {notification && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:9999, background:notification.type==="warn"?"#f43f5e22":"#10b98122", border:`1px solid ${notification.type==="warn"?"#f43f5e55":"#10b98155"}`, color:notification.type==="warn"?"#f43f5e":"#10b981", padding:"12px 20px", borderRadius:12, fontSize:14, fontWeight:500, backdropFilter:"blur(20px)", animation:"slideIn .2s ease" }}>
          {notification.msg}
        </div>
      )}

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 20px" }}>
        {/* ── HEADER ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:32 }}>
          <div>
            <h1 className="serif" style={{ fontSize:"clamp(28px,4vw,42px)", letterSpacing:"-0.5px", lineHeight:1.1 }}>
              Expense <em>Tracker</em>
            </h1>
            <p style={{ color:"var(--muted)", fontSize:14, marginTop:4 }}>
              {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
            </p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end" }}>
            {/* Currency selector */}
            <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{ background:"var(--surface2)", border:"1px solid var(--border2)", color:"var(--text)", padding:"8px 12px", borderRadius:10, fontSize:14, cursor:"pointer", outline:"none" }}>
              {CURRENCIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <IconBtn icon={privacy?<EyeOff size={16}/>:<Eye size={16}/>} onClick={()=>setPrivacy(!privacy)} title="Privacy" />
            <IconBtn icon={dark?<Sun size={16}/>:<Moon size={16}/>} onClick={()=>setDark(!dark)} title="Theme" />
            <IconBtn icon={<Download size={16}/>} onClick={exportCSV} title="Export CSV" />
            <button onClick={()=>setModal("add")} style={{ display:"flex", alignItems:"center", gap:8, background:"var(--accent)", color:"#fff", border:"none", padding:"9px 18px", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", letterSpacing:"0.01em" }}>
              <PlusCircle size={16}/> Add
            </button>
          </div>
        </div>

        {/* ── KPI ROW ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:24 }}>
          <KpiCard label="Balance" value={fmt(stats.balance,privacy,currency)} sub={stats.balance>=0?"💚 In the green":"🔴 In the red"} accent={stats.balance>=0?"#10b981":"#f43f5e"} />
          <KpiCard label="Income" value={fmt(stats.income,privacy,currency)} sub="Total earned" accent="#10b981" />
          <KpiCard label="Expenses" value={fmt(stats.expense,privacy,currency)} sub="Total spent" accent="#f43f5e" />
          <KpiCard label="Savings Rate" value={privacy?"••":savingsRate+"%"} sub="Of total income" accent="#6366f1" />
          <KpiCard label="Transactions" value={transactions.length} sub="All time" accent="#f59e0b" />
          {topCat && <KpiCard label="Top Category" value={topCat.emoji+" "+(topCat.name||"").split(" ")[0]} sub={fmt(topCat.amount,privacy,currency)+" spent"} accent={topCat.color||"#888"} />}
        </div>

        {/* ── BUDGET ALERTS ── */}
        {budgetStatus.some(b=>b.pct>=80) && (
          <div style={{ marginBottom:16, display:"flex", flexWrap:"wrap", gap:8 }}>
            {budgetStatus.filter(b=>b.pct>=80).map(b=>{
              const cat = categories.find(c=>c.id===b.catId);
              return (
                <div key={b.catId} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.3)", borderRadius:10, padding:"8px 14px", fontSize:13 }}>
                  <AlertCircle size={14} color="#f43f5e"/>
                  <span style={{ color:"#f43f5e", fontWeight:600 }}>{cat?.emoji} {cat?.name}: {Math.round(b.pct)}% of budget used</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TABS ── */}
        <div style={{ display:"flex", gap:4, background:"var(--surface2)", padding:4, borderRadius:12, marginBottom:24, width:"fit-content" }}>
          {[["transactions","Transactions"],["analytics","Analytics"],["budgets","Budgets & Rules"]].map(([id,label])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={{ padding:"8px 20px", borderRadius:9, fontSize:14, fontWeight:500, border:"none", cursor:"pointer", transition:"all .15s", background:activeTab===id?"var(--accent)":"transparent", color:activeTab===id?"#fff":"var(--muted)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ══════════ TRANSACTIONS TAB ══════════ */}
        {activeTab==="transactions" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:20 }}>
            {/* Filters row */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" }}>
              <div style={{ position:"relative", flex:"1 1 200px" }}>
                <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--muted)" }}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{ width:"100%", paddingLeft:36, padding:"10px 12px 10px 36px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, fontSize:14, color:"var(--text)", outline:"none" }}/>
              </div>
              <Pill options={[["all","All"],["income","Income"],["expense","Expense"]]} value={filter} onChange={setFilter}/>
              <Pill options={[["thisMonth","This Month"],["lastMonth","Last Month"],["thisYear","Year"],["all","All Time"]]} value={timeRange} onChange={setTimeRange}/>
              <Pill options={[["date","Date"],["amount","Amount"],["description","A-Z"]]} value={sortBy} onChange={setSortBy} prefix={<ArrowUpDown size={12}/>}/>
            </div>

            {/* Tag cloud */}
            {stats.allTags.length>0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {stats.allTags.slice(0,12).map(tag=>(
                  <button key={tag} onClick={()=>setSelectedTags(prev=>prev.includes(tag)?prev.filter(t=>t!==tag):[...prev,tag])} style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:500, cursor:"pointer", border:`1px solid ${selectedTags.includes(tag)?"var(--accent)":"var(--border)"}`, background:selectedTags.includes(tag)?"rgba(99,102,241,0.15)":"var(--surface2)", color:selectedTags.includes(tag)?"var(--accent)":"var(--muted)", transition:"all .15s" }}>
                    #{tag}
                  </button>
                ))}
                {selectedTags.length>0 && <button onClick={()=>setSelectedTags([])} style={{ padding:"4px 10px", borderRadius:20, fontSize:12, cursor:"pointer", border:"none", background:"none", color:"var(--muted)" }}>✕ clear</button>}
              </div>
            )}

            {/* Transaction list */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filtered.length===0 ? (
                <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
                  <Wallet size={32} style={{ margin:"0 auto 12px", opacity:0.3 }}/>
                  <p style={{ fontSize:15 }}>No transactions found</p>
                </div>
              ) : filtered.map(t=>{
                const cat = categories.find(c=>c.id===t.category)||{};
                return (
                  <div key={t.id} className="anim" style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r2)", transition:"all .15s", cursor:"default" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="var(--border2)"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}
                  >
                    {/* Icon */}
                    <div style={{ width:42, height:42, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, background:cat.bg||"var(--surface2)", flexShrink:0 }}>{cat.emoji||"💸"}</div>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.description}</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:3 }}>
                        <span style={{ fontSize:11, color:"var(--muted)" }}>{new Date(t.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
                        {cat.name && <span style={{ fontSize:11, color:"var(--muted)" }}>· {cat.name}</span>}
                        {(t.tags||[]).slice(0,2).map(tag=><span key={tag} style={{ fontSize:10, padding:"1px 7px", borderRadius:20, background:"rgba(99,102,241,0.12)", color:"var(--accent)" }}>#{tag}</span>)}
                      </div>
                    </div>
                    {/* Amount */}
                    <div style={{ fontWeight:700, fontSize:15, color:t.type==="income"?"var(--income)":"var(--expense)", flexShrink:0 }}>
                      {t.type==="income"?"+":"-"}{fmt(t.amount,privacy,currency)}
                    </div>
                    {/* Actions */}
                    <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                      <IconBtn icon={<Edit2 size={13}/>} onClick={()=>{setEditing(t);setForm({...t,tags:(t.tags||[]).join(", ")});setModal("add");}} small/>
                      <IconBtn icon={<Trash2 size={13}/>} onClick={()=>deleteTx(t.id)} small danger/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ ANALYTICS TAB ══════════ */}
        {activeTab==="analytics" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
            {/* Expense breakdown */}
            <Card title="Expense Breakdown">
              {Object.keys(stats.byCat).length===0 ? <Empty msg="No expenses yet"/> : (
                <>
                  <div style={{ height:220, marginBottom:16 }}>
                    <Doughnut data={doughnutData} options={{ responsive:true, maintainAspectRatio:false, cutout:"68%", plugins:{ legend:{display:false}, tooltip:{ backgroundColor:"rgba(10,10,20,0.95)", padding:10, cornerRadius:8, callbacks:{ label:(ctx)=>`${ctx.label}: ${fmt(ctx.parsed,false,currency)}` } } } }}/>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {Object.entries(stats.byCat).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,amt])=>{
                      const cat = categories.find(c=>c.id===id)||{};
                      const pct = stats.expense ? ((amt/stats.expense)*100).toFixed(1) : 0;
                      return (
                        <div key={id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:14 }}>{cat.emoji}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                              <span style={{ color:"var(--muted)" }}>{cat.name}</span>
                              <span style={{ fontWeight:600 }}>{pct}%</span>
                            </div>
                            <div style={{ height:4, background:"var(--surface3)", borderRadius:4, overflow:"hidden" }}>
                              <div style={{ width:`${pct}%`, height:"100%", background:cat.color||"var(--accent)", borderRadius:4, transition:"width .5s ease" }}/>
                            </div>
                          </div>
                          <span style={{ fontSize:12, color:"var(--muted)", minWidth:60, textAlign:"right" }}>{fmt(amt,privacy,currency)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>

            {/* Monthly trend */}
            <Card title="6-Month Trend">
              {stats.trendSorted.length===0 ? <Empty msg="Not enough data"/> : (
                <div style={{ height:260 }}>
                  <Line data={trendData} options={{ ...chartOpts, plugins:{ ...chartOpts.plugins, legend:{ display:true, labels:{ color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.7)", font:{size:11}, boxWidth:10, padding:14 } } }, scales:{ x:{ grid:{color: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}, ticks:{color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)",font:{size:11}} }, y:{ grid:{color: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}, ticks:{color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)",font:{size:11},callback:v=>fmt(v,false,currency)} } } }}/>
                </div>
              )}
            </Card>

            {/* Income vs Expense bar */}
            <Card title="Monthly Comparison">
              {stats.trendSorted.length===0 ? <Empty msg="Not enough data"/> : (
                <div style={{ height:260 }}>
                  <Bar data={{ labels:stats.trendSorted.map(([k])=>k), datasets:[
                    { label:"Income", data:stats.trendSorted.map(([,v])=>v.income), backgroundColor:"rgba(16,185,129,0.7)", borderRadius:6, borderSkipped:false },
                    { label:"Expense", data:stats.trendSorted.map(([,v])=>v.expense), backgroundColor:"rgba(244,63,94,0.7)", borderRadius:6, borderSkipped:false },
                  ]}} options={{ ...chartOpts, plugins:{ ...chartOpts.plugins, legend:{ display:true, labels:{ color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.7)", font:{size:11}, boxWidth:10, padding:14 } } }, scales:{ x:{ grid:{color: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}, ticks:{color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)",font:{size:11}} }, y:{ grid:{color: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}, ticks:{color: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)",font:{size:11},callback:(v)=>fmt(v,false,currency)} } } }}/>
                </div>
              )}
            </Card>

            {/* Quick insights */}
            <Card title="Quick Insights">
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <Insight emoji="💰" label="Avg transaction" value={fmt(transactions.length?stats.expense/Math.max(1,transactions.filter(t=>t.type==="expense").length):0,privacy,currency)}/>
                <Insight emoji="📅" label="This month's spend" value={fmt(transactions.filter(t=>{const d=new Date(t.date),n=new Date();return t.type==="expense"&&d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()}).reduce((a,b)=>a+Number(b.amount),0),privacy,currency)}/>
                <Insight emoji="🏆" label="Savings rate" value={savingsRate+"%"}/>
                <Insight emoji="📊" label="Total transactions" value={transactions.length}/>
                <Insight emoji="🔁" label="Recurring rules" value={recurringRules.length}/>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════ BUDGETS & RULES TAB ══════════ */}
        {activeTab==="budgets" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
            {/* Set Budget */}
            <Card title="🎯 Set Category Budget">
              <form onSubmit={addBudget} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <select value={budgetForm.category} onChange={e=>setBudgetForm(p=>({...p,category:e.target.value}))} required style={inputStyle}>
                  <option value="">Select category…</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
                <input type="number" placeholder={`Limit (${currency})`} value={budgetForm.limit} onChange={e=>setBudgetForm(p=>({...p,limit:e.target.value}))} required style={inputStyle}/>
                <button type="submit" style={btnPrimary}>Set Budget</button>
              </form>
              {/* Budget list */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:16 }}>
                {budgetStatus.map(b=>{
                  const cat = categories.find(c=>c.id===b.catId)||{};
                  const over = b.pct>=100;
                  return (
                    <div key={b.catId} style={{ padding:"10px 14px", background:"var(--surface2)", borderRadius:10, border:`1px solid ${over?"rgba(244,63,94,0.4)":"var(--border)"}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontSize:13, fontWeight:600 }}>{cat.emoji} {cat.name}</span>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <span style={{ fontSize:12, color:over?"#f43f5e":"var(--muted)" }}>{fmt(b.spent,privacy,currency)} / {fmt(b.limit,false,currency)}</span>
                          <button onClick={()=>setBudgets(p=>{const n={...p};delete n[b.catId];return n;})} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", padding:0, lineHeight:1 }}><X size={12}/></button>
                        </div>
                      </div>
                      <div style={{ height:5, background:"var(--surface3)", borderRadius:4, overflow:"hidden" }}>
                        <div style={{ width:`${Math.min(100,b.pct)}%`, height:"100%", background:over?"#f43f5e":b.pct>=80?"#f59e0b":"#10b981", borderRadius:4, transition:"width .5s" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recurring transactions */}
            <Card title="🔁 Recurring Transactions">
              <form onSubmit={addRecurring} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", gap:8 }}>
                  {["expense","income"].map(t=>(
                    <button key={t} type="button" onClick={()=>setRecForm(p=>({...p,type:t}))} style={{ flex:1, padding:"8px 12px", borderRadius:9, fontSize:13, fontWeight:600, border:"none", cursor:"pointer", background:recForm.type===t?(t==="expense"?"rgba(244,63,94,0.2)":"rgba(16,185,129,0.2)"):"var(--surface3)", color:recForm.type===t?(t==="expense"?"#f43f5e":"#10b981"):"var(--muted)" }}>
                      {t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>
                <input type="number" placeholder={`Amount (${currency})`} value={recForm.amount} onChange={e=>setRecForm(p=>({...p,amount:e.target.value}))} required style={inputStyle}/>
                <select value={recForm.category} onChange={e=>setRecForm(p=>({...p,category:e.target.value}))} required style={inputStyle}>
                  <option value="">Category…</option>
                  {categories.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
                <input placeholder="Description" value={recForm.description} onChange={e=>setRecForm(p=>({...p,description:e.target.value}))} required style={inputStyle}/>
                <select value={recForm.frequency} onChange={e=>setRecForm(p=>({...p,frequency:e.target.value}))} style={inputStyle}>
                  {["daily","weekly","monthly"].map(f=><option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                </select>
                <button type="submit" style={btnPrimary}>Save Rule</button>
              </form>
              {/* Recurring list */}
              <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8 }}>
                {recurringRules.map(r=>{
                  const cat = categories.find(c=>c.id===r.category)||{};
                  return (
                    <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)" }}>
                      <span style={{ fontSize:18 }}>{cat.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{r.description}</div>
                        <div style={{ fontSize:11, color:"var(--muted)" }}>{r.frequency} · {fmt(r.amount,privacy,currency)}</div>
                      </div>
                      <button onClick={()=>setRecurringRules(prev=>prev.filter(x=>x.id!==r.id))} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)" }}><X size={13}/></button>
                    </div>
                  );
                })}
                {recurringRules.length===0 && <p style={{ fontSize:13, color:"var(--muted)", textAlign:"center", padding:"16px 0" }}>No recurring rules yet</p>}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ══════════ ADD / EDIT MODAL ══════════ */}
      {modal==="add" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={e=>e.target===e.currentTarget&&resetForm()}>
          <div style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:24, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", padding:32, animation:"slideIn .2s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h2 className="serif" style={{ fontSize:24 }}>{editing?"Edit":"New"} Transaction</h2>
              <button onClick={resetForm} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", padding:4 }}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Type */}
              <div style={{ display:"flex", gap:8 }}>
                {["expense","income"].map(t=>(
                  <button key={t} type="button" onClick={()=>setForm(p=>({...p,type:t}))} style={{ flex:1, padding:"12px", borderRadius:12, fontSize:14, fontWeight:600, border:`2px solid ${form.type===t?(t==="expense"?"#f43f5e":"#10b981"):"var(--border)"}`, cursor:"pointer", background:form.type===t?(t==="expense"?"rgba(244,63,94,0.1)":"rgba(16,185,129,0.1)"):"transparent", color:form.type===t?(t==="expense"?"#f43f5e":"#10b981"):"var(--muted)", transition:"all .15s" }}>
                    {t==="expense"?<TrendingDown size={14} style={{display:"inline",marginRight:6}}/>:<TrendingUp size={14} style={{display:"inline",marginRight:6}}/>}
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
              {/* Amount */}
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--muted)", fontSize:15 }}>{currency}</span>
                <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} required style={{ ...inputStyle, paddingLeft:36, fontSize:20, fontWeight:700 }}/>
              </div>
              {/* Category */}
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} required style={inputStyle}>
                <option value="">Select category…</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
              <div style={{ display:"flex", gap:8, marginTop:-4 }}>
                <input placeholder="Or add new category..." value={newCatName} onChange={e=>setNewCatName(e.target.value)} style={{ ...inputStyle, flex:1 }} />
                <button type="button" onClick={addCustomCategory} style={{ ...btnPrimary, padding:"0 16px", height:42, whiteSpace:"nowrap" }}>
                  Add Category
                </button>
              </div>
              {/* Description */}
              <input placeholder="Description" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} required style={inputStyle}/>
              {/* Date */}
              <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} required style={inputStyle}/>
              {/* Tags */}
              <input placeholder="Tags (comma separated)" value={form.tags} onChange={e=>setForm(p=>({...p,tags:e.target.value}))} style={inputStyle}/>
              {/* Note */}
              <textarea placeholder="Note (optional)" value={form.note||""} onChange={e=>setForm(p=>({...p,note:e.target.value}))} rows={2} style={{ ...inputStyle, resize:"vertical" }}/>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button type="submit" style={{ ...btnPrimary, flex:1 }}>
                  <Zap size={14} style={{display:"inline",marginRight:6}}/>{editing?"Update":"Add"} Transaction
                </button>
                <button type="button" onClick={resetForm} style={{ padding:"12px 20px", borderRadius:12, border:"1px solid var(--border2)", background:"transparent", color:"var(--text)", cursor:"pointer", fontSize:14, fontWeight:500 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared styles ──
const inputStyle = { width:"100%", padding:"11px 14px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, fontSize:14, color:"var(--text)", outline:"none", transition:"border .15s" };
const btnPrimary = { padding:"12px 20px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", transition:"opacity .15s", display:"flex", alignItems:"center", justifyContent:"center", gap:6 };

// ── Sub-components ──
const IconBtn = ({ icon, onClick, title, small, danger }) => (
  <button onClick={onClick} title={title} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:small?8:10, padding:small?"6px":"9px", cursor:"pointer", color:danger?"#f43f5e":"var(--muted)", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}
    onMouseEnter={e=>{e.currentTarget.style.background="var(--surface3)";e.currentTarget.style.color=danger?"#f43f5e":"var(--text)";}}
    onMouseLeave={e=>{e.currentTarget.style.background="var(--surface2)";e.currentTarget.style.color=danger?"#f43f5e":"var(--muted)";}}>
    {icon}
  </button>
);

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:"16px 18px", borderTop:`3px solid ${accent}`, transition:"transform .15s" }}
    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
    onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
    <div style={{ fontSize:20, fontWeight:700, color:accent, letterSpacing:"-0.02em" }}>{value}</div>
    <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginTop:2 }}>{label}</div>
    <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{sub}</div>
  </div>
);

const Card = ({ title, children }) => (
  <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:20, padding:24 }}>
    <h3 style={{ fontSize:15, fontWeight:600, marginBottom:18, color:"var(--text)" }}>{title}</h3>
    {children}
  </div>
);

const Pill = ({ options, value, onChange, prefix }) => (
  <div style={{ display:"flex", background:"var(--surface2)", borderRadius:9, padding:3, gap:2 }}>
    {options.map(([v,l])=>(
      <button key={v} onClick={()=>onChange(v)} style={{ padding:"6px 12px", borderRadius:7, fontSize:12, fontWeight:500, border:"none", cursor:"pointer", background:value===v?"var(--accent)":"transparent", color:value===v?"#fff":"var(--muted)", transition:"all .15s", display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
        {v===options[0][0]&&prefix}{l}
      </button>
    ))}
  </div>
);

const Insight = ({ emoji, label, value }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"var(--surface2)", borderRadius:10 }}>
    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
      <span style={{ fontSize:18 }}>{emoji}</span>
      <span style={{ fontSize:13, color:"var(--muted)" }}>{label}</span>
    </div>
    <span style={{ fontSize:14, fontWeight:700 }}>{value}</span>
  </div>
);

const Empty = ({ msg }) => (
  <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)", fontSize:13 }}>{msg}</div>
);
