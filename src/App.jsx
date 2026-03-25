"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  PlusCircle,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  DollarSign,
  Calendar,
  Users,
  Zap,
  Star,
  Award,
  Download,
  Upload,
  Settings,
  X,
  ChevronDown,
  Check,
  ArrowUpDown,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ProfessionalExpenseTracker() {
  // ---------------- EXTENDED STATE ----------------
  const defaultCategories = [
    { id: "food", name: "🍔 Food & Dining", color: "#ef4444", gradient: "from-red-500 to-rose-600" },
    { id: "transport", name: "🚗 Transport", color: "#3b82f6", gradient: "from-blue-500 to-cyan-600" },
    { id: "shopping", name: "🛍️ Shopping", color: "#a855f7", gradient: "from-purple-500 to-violet-600" },
    { id: "bills", name: "💡 Bills & Utilities", color: "#f59e0b", gradient: "from-amber-500 to-orange-600" },
    { id: "health", name: "🏥 Health & Medical", color: "#ec4899", gradient: "from-pink-500 to-rose-600" },
    { id: "entertainment", name: "🎬 Entertainment", color: "#6366f1", gradient: "from-indigo-500 to-purple-600" },
    { id: "education", name: "📚 Education", color: "#14b8a6", gradient: "from-teal-500 to-emerald-600" },
    { id: "salary", name: "💼 Salary", color: "#10b981", gradient: "from-emerald-500 to-green-600" },
    { id: "freelance", name: "💻 Freelance", color: "#059669", gradient: "from-green-500 to-emerald-600" },
    { id: "investment", name: "📈 Investments", color: "#84cc16", gradient: "from-lime-500 to-green-600" },
    { id: "gifts", name: "🎁 Gifts", color: "#f97316", gradient: "from-orange-500 to-amber-600" },
    { id: "travel", name: "✈️ Travel", color: "#0ea5e9", gradient: "from-sky-500 to-blue-600" },
    { id: "rent", name: "🏠 Rent", color: "#64748b", gradient: "from-slate-500 to-gray-600" },
    { id: "insurance", name: "🛡️ Insurance", color: "#d946ef", gradient: "from-fuchsia-500 to-purple-600" },
  ];

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [darkMode, setDarkMode] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showCharts, setShowCharts] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  
  // Dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [timeRangeDropdownOpen, setTimeRangeDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    tags: "",
  });

  const categoryDropdownRef = useRef(null);
  const timeRangeDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
      if (timeRangeDropdownRef.current && !timeRangeDropdownRef.current.contains(event.target)) {
        setTimeRangeDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---------------- PERSISTENT STORAGE ----------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem("professionalExpenseTracker");
      if (stored) {
        const data = JSON.parse(stored);
        setTransactions(data.transactions || []);
        setCategories(data.categories || defaultCategories);
        setDarkMode(data.darkMode ?? true);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "professionalExpenseTracker",
        JSON.stringify({ transactions, categories, darkMode })
      );
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }, [transactions, categories, darkMode]);

  // ---------------- ADVANCED STATS ----------------
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    const balance = income - expense;

    const expenseCategoryStats = {};
    const incomeCategoryStats = {};
    
    transactions.forEach(t => {
      const cat = categories.find(c => c.id === t.category);
      const catName = cat?.name || 'Other';
      const catColor = cat?.color || '#6b7280';
      
      if (t.type === "expense") {
        expenseCategoryStats[catName] = {
          amount: (expenseCategoryStats[catName]?.amount || 0) + t.amount,
          color: catColor
        };
      } else {
        incomeCategoryStats[catName] = {
          amount: (incomeCategoryStats[catName]?.amount || 0) + t.amount,
          color: catColor
        };
      }
    });

    return { income, expense, balance, expenseCategoryStats, incomeCategoryStats };
  }, [transactions, categories]);

  // ---------------- CHART DATA ----------------
  const expenseChartData = useMemo(() => {
    const labels = Object.keys(stats.expenseCategoryStats);
    const data = Object.values(stats.expenseCategoryStats).map(stat => stat.amount);
    const colors = Object.values(stats.expenseCategoryStats).map(stat => stat.color);

    return {
      labels,
      datasets: [{
        label: 'Expenses by Category',
        data,
        backgroundColor: colors.map(color => `${color}dd`),
        borderColor: colors.map(color => `${color}`),
        borderWidth: 3,
        hoverOffset: 20,
      }]
    };
  }, [stats.expenseCategoryStats]);

  const incomeChartData = useMemo(() => {
    const labels = Object.keys(stats.incomeCategoryStats);
    const data = Object.values(stats.incomeCategoryStats).map(stat => stat.amount);
    const colors = Object.values(stats.incomeCategoryStats).map(stat => stat.color);

    return {
      labels,
      datasets: [{
        label: 'Income by Category',
        data,
        backgroundColor: colors.map(color => `${color}dd`),
        borderColor: colors.map(color => `${color}`),
        borderWidth: 3,
        hoverOffset: 20,
      }]
    };
  }, [stats.incomeCategoryStats]);

  // ---------------- FORM HANDLERS ----------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.category) return;

    let category = form.category;
    
    if (customCategory && !categories.find(c => c.id === form.category)) {
      const colors = ['#ef4444', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#10b981'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newCat = {
        id: `custom_${Date.now()}`,
        name: customCategory,
        color: randomColor,
        gradient: `from-purple-500 to-pink-600`,
      };
      setCategories(prev => [...prev, newCat]);
      category = newCat.id;
    }

    const tx = {
      id: editing?.id || Date.now().toString(),
      ...form,
      category,
      amount: parseFloat(form.amount),
      tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };

    if (editing) {
      setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
    } else {
      setTransactions(prev => [...prev, tx]);
    }

    resetForm();
  };

  const resetForm = () => {
    setShowModal(false);
    setEditing(null);
    setForm({
      type: "expense",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      tags: "",
    });
    setCustomCategory("");
    setCategoryDropdownOpen(false);
  };

  const deleteTx = (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const editTx = (tx) => {
    setEditing(tx);
    setForm({
      ...tx,
      tags: tx.tags?.join(', ') || '',
    });
    setShowModal(true);
  };

  const format = (amt) => privacyMode ? "****" : `₹${amt.toLocaleString("en-IN")}`;

  // ---------------- FILTER & SORT ----------------
  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesFilter = filter === "all" || t.type === filter;
        const now = new Date();
        const txDate = new Date(t.date);
        
        let matchesTime = true;
        if (timeRange === "thisMonth") {
          matchesTime = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        } else if (timeRange === "lastMonth") {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          matchesTime = txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
        } else if (timeRange === "thisYear") {
          matchesTime = txDate.getFullYear() === now.getFullYear();
        }
        
        const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
        return matchesFilter && matchesTime && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "date") return new Date(b.date) - new Date(a.date);
        if (sortBy === "amount") return b.amount - a.amount;
        if (sortBy === "description") return a.description.localeCompare(b.description);
        return 0;
      });
  }, [transactions, filter, timeRange, search, sortBy]);

  const selectedCategory = categories.find(c => c.id === form.category);

  const timeRangeOptions = [
    { value: "all", label: "All Time", icon: "🌍" },
    { value: "thisMonth", label: "This Month", icon: "📆" },
    { value: "lastMonth", label: "Last Month", icon: "⏮️" },
    { value: "thisYear", label: "This Year", icon: "📅" },
  ];

  const sortOptions = [
    { value: "date", label: "Date", icon: "📅" },
    { value: "amount", label: "Amount", icon: "💰" },
    { value: "description", label: "Description", icon: "📝" },
  ];

  // ---------------- UI ----------------
  return (
    <div className={`${darkMode ? 'dark bg-gradient-to-br from-gray-950 via-gray-900 to-black' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} min-h-screen transition-all duration-500`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2`}>
              Expense Tracker
            </h1>
            <p className={`text-base sm:text-lg lg:text-xl font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Professional Financial Management
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} transition-all shadow-lg hover:scale-105`}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
            <button 
              onClick={() => setPrivacyMode(!privacyMode)} 
              className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} transition-all shadow-lg hover:scale-105`}
            >
              {privacyMode ? <EyeOff className="w-5 h-5 text-purple-400" /> : <Eye className="w-5 h-5 text-blue-400" />}
            </button>
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-xl shadow-xl hover:shadow-emerald-500/25 hover:scale-105 transition-all"
            >
              <PlusCircle className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 mb-6 lg:mb-8">
          <div className="lg:col-span-6">
            <div className={`flex items-center gap-3 ${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl p-3 sm:p-4 rounded-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} shadow-lg`}>
              <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                placeholder="Search transactions..."
                className={`bg-transparent outline-none w-full text-sm sm:text-base ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="lg:col-span-3" ref={timeRangeDropdownRef}>
            <button
              onClick={() => setTimeRangeDropdownOpen(!timeRangeDropdownOpen)}
              className={`w-full flex items-center justify-between ${darkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-white hover:bg-gray-50'} backdrop-blur-xl p-3 sm:p-4 rounded-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} transition-all shadow-lg`}
            >
              <span className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {timeRangeOptions.find(opt => opt.value === timeRange)?.icon} {timeRangeOptions.find(opt => opt.value === timeRange)?.label}
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform ${timeRangeDropdownOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
            
            {timeRangeDropdownOpen && (
              <div className={`absolute z-50 w-full sm:w-64 mt-2 ${darkMode ? 'bg-gray-900/98' : 'bg-white'} backdrop-blur-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} rounded-2xl shadow-2xl overflow-hidden`}>
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTimeRange(option.value);
                      setTimeRangeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                      timeRange === option.value 
                        ? `${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'} border-l-4 border-blue-500` 
                        : `${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{option.icon}</span>
                      <span className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{option.label}</span>
                    </span>
                    {timeRange === option.value && <Check className="w-5 h-5 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-3" ref={sortDropdownRef}>
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className={`w-full flex items-center justify-between ${darkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-white hover:bg-gray-50'} backdrop-blur-xl p-3 sm:p-4 rounded-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} transition-all shadow-lg`}
            >
              <span className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <ArrowUpDown className="w-4 h-4 inline mr-2" />
                {sortOptions.find(opt => opt.value === sortBy)?.label}
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
            
            {sortDropdownOpen && (
              <div className={`absolute z-50 w-full sm:w-64 mt-2 ${darkMode ? 'bg-gray-900/98' : 'bg-white'} backdrop-blur-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} rounded-2xl shadow-2xl overflow-hidden`}>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                      sortBy === option.value 
                        ? `${darkMode ? 'bg-purple-500/20' : 'bg-purple-50'} border-l-4 border-purple-500` 
                        : `${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{option.icon}</span>
                      <span className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{option.label}</span>
                    </span>
                    {sortBy === option.value && <Check className="w-5 h-5 text-purple-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
          <StatsCard 
            title="Total Income" 
            value={format(stats.income)} 
            icon={<TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />}
            color="from-emerald-500 to-teal-500"
            darkMode={darkMode}
          />
          <StatsCard 
            title="Total Expense" 
            value={format(stats.expense)} 
            icon={<TrendingDown className="w-6 h-6 sm:w-8 sm:h-8" />}
            color="from-red-500 to-pink-500"
            darkMode={darkMode}
          />
          <StatsCard 
            title="Net Balance" 
            value={format(stats.balance)} 
            icon={<DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />}
            color="from-blue-500 to-purple-500"
            darkMode={darkMode}
          />
          <StatsCard 
            title="Transactions" 
            value={transactions.length.toLocaleString()} 
            icon={<PieChart className="w-6 h-6 sm:w-8 sm:h-8" />}
            color="from-indigo-500 to-violet-500"
            darkMode={darkMode}
          />
        </div>

        {/* FILTER BUTTONS */}
        <div className={`flex flex-wrap gap-2 sm:gap-3 mb-6 lg:mb-8 ${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl p-3 sm:p-4 rounded-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} shadow-lg`}>
          {["all", "income", "expense"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                filter === f 
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 scale-105" 
                  : `${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} hover:scale-105`
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* TRANSACTIONS LIST */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className={`text-xl sm:text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Transactions
              </h2>
              <button 
                onClick={() => setShowCharts(!showCharts)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:scale-105 transition-all shadow-lg text-white text-sm sm:text-base`}
              >
                {showCharts ? <BarChart3 className="w-4 h-4" /> : <PieChart className="w-4 h-4" />}
                <span className="hidden sm:inline">Charts</span>
              </button>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {filtered.length === 0 ? (
                <div className={`text-center py-20 ${darkMode ? 'opacity-50' : 'opacity-40'}`}>
                  <PieChart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg sm:text-xl">No transactions found</p>
                </div>
              ) : (
                filtered.map((t) => {
                  const cat = categories.find((c) => c.id === t.category);
                  return (
                    <TransactionCard
                      key={t.id}
                      transaction={t}
                      category={cat}
                      privacyMode={privacyMode}
                      darkMode={darkMode}
                      onEdit={() => editTx(t)}
                      onDelete={() => deleteTx(t.id)}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* CHARTS */}
          {showCharts && (
            <div className="space-y-6">
              {Object.keys(stats.expenseCategoryStats).length > 0 && (
                <div className={`${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl p-6 sm:p-8 rounded-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} shadow-xl`}>
                  <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                    Expense Breakdown
                  </h3>
                  <div className="h-64 sm:h-80">
                    <Doughnut data={expenseChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 11, weight: '600' },
                            color: darkMode ? '#ffffff' : '#1f2937',
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0,0,0,0.9)',
                          padding: 12,
                          cornerRadius: 8,
                          callbacks: {
                            label: (context) => {
                              const value = context.parsed || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${context.label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      cutout: '65%',
                    }} />
                  </div>
                </div>
              )}

              {Object.keys(stats.incomeCategoryStats).length > 0 && (
                <div className={`${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl p-6 sm:p-8 rounded-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} shadow-xl`}>
                  <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                    Income Breakdown
                  </h3>
                  <div className="h-64 sm:h-80">
                    <Doughnut data={incomeChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 11, weight: '600' },
                            color: darkMode ? '#ffffff' : '#1f2937',
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0,0,0,0.9)',
                          padding: 12,
                          cornerRadius: 8,
                          callbacks: {
                            label: (context) => {
                              const value = context.parsed || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${context.label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      cutout: '65%',
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
            <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border shadow-2xl rounded-3xl w-full max-w-2xl my-8`}>
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {editing ? "Edit" : "Add"} Transaction
                  </h2>
                  <button onClick={resetForm} className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-xl transition-all`}>
                    <X className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Transaction Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border-2 ${
                        form.type === "expense" 
                          ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500 shadow-lg' 
                          : `${darkMode ? 'border-white/20 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`
                      }`}>
                        <input
                          type="radio"
                          value="expense"
                          checked={form.type === "expense"}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                          className="sr-only"
                        />
                        <TrendingDown className={`w-6 h-6 sm:w-7 sm:h-7 mr-3 ${form.type === "expense" ? 'text-red-400' : darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <div>
                          <div className={`font-bold text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Expense</div>
                          <div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Money out</div>
                        </div>
                      </label>
                      <label className={`flex items-center p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border-2 ${
                        form.type === "income" 
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500 shadow-lg' 
                          : `${darkMode ? 'border-white/20 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`
                      }`}>
                        <input
                          type="radio"
                          value="income"
                          checked={form.type === "income"}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                          className="sr-only"
                        />
                        <TrendingUp className={`w-6 h-6 sm:w-7 sm:h-7 mr-3 ${form.type === "income" ? 'text-emerald-400' : darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <div>
                          <div className={`font-bold text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Income</div>
                          <div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Money in</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amount</label>
                    <div className="relative">
                      <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className={`w-full pl-12 pr-4 py-4 ${darkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} backdrop-blur-xl border rounded-2xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all`}
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                    <div className="space-y-3" ref={categoryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                        className={`w-full flex items-center justify-between p-4 ${darkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'} backdrop-blur-xl border rounded-2xl hover:border-blue-400 transition-all`}
                      >
                        <span className="flex items-center gap-3">
                          {selectedCategory ? (
                            <>
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${selectedCategory.gradient} flex items-center justify-center shadow-lg`}>
                                <span className="text-lg">{selectedCategory.name.split(' ')[0]}</span>
                              </div>
                              <span className={`font-semibold text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCategory.name}</span>
                            </>
                          ) : (
                            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} font-semibold`}>Select a category</span>
                          )}
                        </span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </button>
                      
                      {categoryDropdownOpen && (
                        <div className={`absolute z-50 w-full max-w-xl ${darkMode ? 'bg-gray-900/98' : 'bg-white'} backdrop-blur-2xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} rounded-2xl shadow-2xl max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700`}>
                          <div className="p-2">
                            {categories.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, category: cat.id });
                                  setCategoryDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-4 p-3 sm:p-4 rounded-xl transition-all mb-1 ${
                                  form.category === cat.id 
                                    ? `${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'} border-l-4 border-blue-500` 
                                    : `${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`
                                }`}
                              >
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r ${cat.gradient} flex items-center justify-center shadow-lg`}>
                                  <span className="text-lg sm:text-xl">{cat.name.split(' ')[0]}</span>
                                </div>
                                <div className="flex-1 text-left">
                                  <div className={`font-bold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{cat.name}</div>
                                </div>
                                {form.category === cat.id && <Check className="w-5 h-5 text-blue-500" />}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const name = window.prompt("Enter custom category name:");
                                if (name) {
                                  setCustomCategory(name);
                                  setForm({ ...form, category: name });
                                  setCategoryDropdownOpen(false);
                                }
                              }}
                              className={`w-full flex items-center gap-4 p-3 sm:p-4 rounded-xl transition-all ${darkMode ? 'hover:bg-purple-500/20 border-2 border-dashed border-purple-500/50' : 'hover:bg-purple-50 border-2 border-dashed border-purple-300'}`}
                            >
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                <span className="text-lg sm:text-xl">✨</span>
                              </div>
                              <div className="flex-1 text-left">
                                <div className={`font-bold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add Custom Category</div>
                              </div>
                              <PlusCircle className="w-5 h-5 text-purple-500" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                      <input
                        placeholder="What was this for?"
                        className={`w-full p-4 ${darkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} backdrop-blur-xl border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all`}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tags</label>
                      <input
                        placeholder="e.g. work, food, urgent"
                        className={`w-full p-4 ${darkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} backdrop-blur-xl border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all`}
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date</label>
                    <div className="relative">
                      <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <input
                        type="date"
                        className={`w-full pl-12 pr-4 py-4 ${darkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} backdrop-blur-xl border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 transition-all`}
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                    <button 
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 p-4 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-white"
                    >
                      <Zap className="w-5 h-5" />
                      {editing ? "Update" : "Add"} Transaction
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} p-4 rounded-2xl font-bold text-base sm:text-lg transition-all ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const StatsCard = ({ title, value, icon, color, darkMode }) => (
  <div className={`p-6 sm:p-8 rounded-2xl ${darkMode ? 'bg-white/10' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} hover:scale-105 transition-all shadow-xl cursor-pointer`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-r ${color} shadow-lg`}>{icon}</div>
    </div>
    <h3 className={`text-2xl sm:text-3xl font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
    <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
  </div>
);

const TransactionCard = ({ transaction, category, privacyMode, darkMode, onEdit, onDelete }) => {
  const format = (amt) => privacyMode ? "****" : `₹${amt.toLocaleString("en-IN")}`;
  
  return (
    <div className={`group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 rounded-2xl ${darkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-white hover:bg-gray-50'} backdrop-blur-xl border ${darkMode ? 'border-white/20' : 'border-gray-200'} hover:shadow-xl transition-all`}>
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
        <div 
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-r ${category?.gradient || 'from-gray-500 to-gray-600'} flex-shrink-0`}
        >
          <span className="font-bold text-lg sm:text-xl">{category?.name.split(' ')[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base sm:text-xl truncate ${darkMode ? 'text-white group-hover:text-blue-300' : 'text-gray-900 group-hover:text-blue-600'}`}>
            {transaction.description}
          </p>
          {transaction.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {transaction.tags.slice(0, 2).map((tag, i) => (
                <span key={i} className={`px-2 py-0.5 ${darkMode ? 'bg-purple-500/20 border-purple-500/30' : 'bg-purple-100 border-purple-200'} rounded-full text-xs font-semibold border`}>
                  #{tag}
                </span>
              ))}
              {transaction.tags.length > 2 && (
                <span className={`px-2 py-0.5 ${darkMode ? 'bg-gray-500/20' : 'bg-gray-100'} rounded-full text-xs font-semibold`}>
                  +{transaction.tags.length - 2}
                </span>
              )}
            </div>
          )}
          <p className={`text-xs sm:text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {new Date(transaction.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
        <div className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-base sm:text-lg shadow-lg ${
          transaction.type === "income"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
        }`}>
          {format(transaction.amount)}
        </div>
        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
          <button 
            onClick={onEdit} 
            className={`p-2 ${darkMode ? 'hover:bg-blue-500/20' : 'hover:bg-blue-100'} rounded-lg transition-all`}
          >
            <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </button>
          <button 
            onClick={onDelete} 
            className={`p-2 ${darkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-100'} rounded-lg transition-all`}
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};