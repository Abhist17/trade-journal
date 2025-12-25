import { useState, useEffect } from "react";
import {
  Plus, X, ArrowRight, Sparkles, Trash2, Sun, Moon, Upload,
  TrendingUp, TrendingDown, LayoutDashboard, List, Bell, Eye, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

// ───────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ───────────────────────────────────────────────────────────────

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  entryDate: string;
  exitDate?: string;
  status: string;
  strategy?: string;
  notes?: string;
  tags?: string;
  executionRate?: number;
  pnl?: number;
  screenshot?: string;
  stopLoss?: number;
  takeProfit?: number;
}

interface MarketMover {
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
}

interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
}

const STRATEGY_OPTIONS = [
  "Scalping", "Breakout", "Trend Following", "Mean Reversion",
  "News Trading", "Swing Trading", "Pullback", "Range Trading", "Other"
];

const TAG_OPTIONS = [
  "Fomo", "Revenge", "Confident Entry", "Hesitant", "Overtrade",
  "Good Setup", "High Volatility", "Low Volume", "News Event",
  "Breakdown", "Fakeout", "Perfect Execution", "Slipped"
];

function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "live-trades" | "finished-trades" | "alerts">("dashboard");

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [currentTrade, setCurrentTrade] = useState<Trade | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [gainers, setGainers] = useState<MarketMover[]>([]);
  const [losers, setLosers] = useState<MarketMover[]>([]);
  const [moversLoading, setMoversLoading] = useState(true);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertForm, setAlertForm] = useState({ symbol: "", targetPrice: "" });

  const [logForm, setLogForm] = useState({
    symbol: "", direction: "long", entryPrice: "", quantity: "",
    entryDate: new Date().toISOString().slice(0, 16), strategy: "",
    selectedTags: [] as string[], executionRate: "5", notes: "",
    stopLoss: "", takeProfit: ""
  });

  const [closeForm, setCloseForm] = useState({
    exitPrice: "", exitDate: new Date().toISOString().slice(0, 16)
  });

  // ───────────────────────────────────────────────────────────────
  // EFFECTS & DATA FETCHING
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchTrades();
    fetchMarketMovers();
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/trades");
      if (!res.ok) throw new Error("Failed to fetch trades");
      const data = await res.json();
      setTrades(data.sort((a: Trade, b: Trade) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()));
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Can't connect to backend. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketMovers = async () => {
    setMoversLoading(true);
    try {
      const gainRes = await fetch("https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_gainers&count=5&region=IN");
      if (gainRes.ok) {
        const gainData = await gainRes.json();
        const quotes = gainData?.finance?.result?.[0]?.quotes || [];
        setGainers(quotes.map((q: any) => ({
          symbol: q.symbol?.replace(".NS", "") || "UNKNOWN",
          price: q.regularMarketPrice || 0,
          change: q.regularMarketChange || 0,
          percentChange: q.regularMarketChangePercent || 0,
        })));
      }

      const loseRes = await fetch("https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_losers&count=5&region=IN");
      if (loseRes.ok) {
        const loseData = await loseRes.json();
        const quotes = loseData?.finance?.result?.[0]?.quotes || [];
        setLosers(quotes.map((q: any) => ({
          symbol: q.symbol?.replace(".NS", "") || "UNKNOWN",
          price: q.regularMarketPrice || 0,
          change: q.regularMarketChange || 0,
          percentChange: q.regularMarketChangePercent || 0,
        })));
      }
    } catch (err) {
      console.error("Market movers fetch failed - using fallback", err);
      setGainers([
        { symbol: "RELIANCE", price: 2985.40, change: 62.10, percentChange: 2.12 },
        { symbol: "TCS", price: 4250.75, change: 85.60, percentChange: 2.05 },
        { symbol: "HDFCBANK", price: 1682.90, change: 38.20, percentChange: 2.32 },
        { symbol: "INFY", price: 1895.10, change: 45.90, percentChange: 2.48 },
        { symbol: "ICICIBANK", price: 1235.60, change: 28.40, percentChange: 2.35 }
      ]);
      setLosers([
        { symbol: "ADANIENT", price: 2750.20, change: -112.80, percentChange: -3.94 },
        { symbol: "SBIN", price: 765.30, change: -22.10, percentChange: -2.81 },
        { symbol: "AXISBANK", price: 1085.40, change: -29.60, percentChange: -2.65 },
        { symbol: "BAJFINANCE", price: 7120.00, change: -165.50, percentChange: -2.27 },
        { symbol: "KOTAKBANK", price: 1775.90, change: -39.30, percentChange: -2.16 }
      ]);
    } finally {
      setMoversLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────
  // CALCULATIONS
  // ───────────────────────────────────────────────────────────────
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winRate = trades.length === 0 ? 0 : Math.round((trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100);

  const cumulativePnLData = trades.reduce((acc: any[], trade) => {
    const prev = acc[acc.length - 1]?.cumulative || 0;
    acc.push({
      date: new Date(trade.entryDate).toLocaleDateString(),
      pnl: trade.pnl || 0,
      cumulative: prev + (trade.pnl || 0),
    });
    return acc;
  }, []);

  const strategyData = trades.reduce((acc: any, trade) => {
    const strat = trade.strategy || "None";
    if (!acc[strat]) acc[strat] = { name: strat, value: 0 };
    acc[strat].value++;
    return acc;
  }, {});

  const pieData = Object.values(strategyData);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  const entryPrice = parseFloat(logForm.entryPrice) || currentPrice || 0;
  const quantity = parseFloat(logForm.quantity) || 0;
  const stopLoss = parseFloat(logForm.stopLoss) || 0;
  const takeProfit = parseFloat(logForm.takeProfit) || 0;

  const riskDistance = logForm.direction === "long" ? entryPrice - stopLoss : stopLoss - entryPrice;
  const rewardDistance = logForm.direction === "long" ? takeProfit - entryPrice : entryPrice - takeProfit;
  const riskAmount = Math.abs(riskDistance) * quantity;
  const rewardAmount = Math.abs(rewardDistance) * quantity;
  const riskPercent = entryPrice > 0 ? ((Math.abs(riskDistance) / entryPrice) * 100).toFixed(2) : "0.00";
  const rrRatio = riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(2) : "0.00";

  // ───────────────────────────────────────────────────────────────
  // HANDLERS
  // ───────────────────────────────────────────────────────────────
  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!logForm.symbol.trim()) return alert("Symbol is required");
    if (!logForm.entryPrice || parseFloat(logForm.entryPrice) <= 0) return alert("Valid Entry Price required");
    if (!logForm.quantity || parseFloat(logForm.quantity) <= 0) return alert("Valid Quantity required");

    setSaving(true);

    let screenshotUrl = null;
    if (screenshotFile) {
      try {
        const formData = new FormData();
        formData.append("file", screenshotFile);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "");

        const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          screenshotUrl = data.secure_url;
        }
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
      }
    }

    const tradeData = {
      symbol: logForm.symbol.toUpperCase().trim(),
      direction: logForm.direction,
      entryPrice: parseFloat(logForm.entryPrice),
      quantity: parseFloat(logForm.quantity),
      entryDate: new Date(logForm.entryDate).toISOString(),
      strategy: logForm.strategy || null,
      notes: logForm.notes || null,
      tags: logForm.selectedTags.join(", ") || null,
      executionRate: parseInt(logForm.executionRate),
      status: "open",
      pnl: 0,
      screenshot: screenshotUrl,
      stopLoss: logForm.stopLoss ? parseFloat(logForm.stopLoss) : null,
      takeProfit: logForm.takeProfit ? parseFloat(logForm.takeProfit) : null,
    };

    try {
      const res = await fetch("http://localhost:5000/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeData),
      });

      if (!res.ok) throw new Error(await res.text());

      alert("Trade saved successfully!");
      resetLogForm();
      setScreenshotFile(null);
      setIsLogModalOpen(false);
      await fetchTrades();
    } catch (err: any) {
      console.error("Save error:", err);
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetLogForm = () => {
    setLogForm({
      symbol: "",
      direction: "long",
      entryPrice: "",
      quantity: "",
      entryDate: new Date().toISOString().slice(0, 16),
      strategy: "",
      selectedTags: [],
      executionRate: "5",
      notes: "",
      stopLoss: "",
      takeProfit: "",
    });
    setScreenshotFile(null);
    setCurrentPrice(null);
  };

  const openCloseModal = (trade: Trade) => {
    setCurrentTrade(trade);
    setCloseForm({
      exitPrice: "",
      exitDate: new Date().toISOString().slice(0, 16),
    });
    setIsCloseModalOpen(true);
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrade) return;

    setSaving(true);

    const exitPriceNum = parseFloat(closeForm.exitPrice);
    const pnl = currentTrade.direction === "long"
      ? (exitPriceNum - currentTrade.entryPrice) * currentTrade.quantity
      : (currentTrade.entryPrice - exitPriceNum) * currentTrade.quantity;

    try {
      const res = await fetch(`http://localhost:5000/trades/${currentTrade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exitPrice: exitPriceNum,
          exitDate: new Date(closeForm.exitDate).toISOString(),
          pnl,
          status: "closed",
        }),
      });

      if (!res.ok) throw new Error("Close failed");

      setTrades(prev =>
        prev.map(t =>
          t.id === currentTrade.id
            ? { ...t, exitPrice: exitPriceNum, exitDate: new Date(closeForm.exitDate).toISOString(), pnl, status: "closed" }
            : t
        )
      );

      setIsCloseModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to close trade");
    } finally {
      setSaving(false);
    }
  };

  const generateAIInsights = async () => {
    if (trades.length === 0) {
      setAiInsights("Log some trades first, bro.");
      return;
    }

    setAiLoading(true);
    setAiInsights("");

    const prompt = `You are a savage trading coach. Give me the truth about my trading.\n\n` +
      trades.map(t => `${t.symbol} ${t.direction.toUpperCase()}\nEntry: ₹${t.entryPrice} → Exit: ${t.exitPrice ? "₹"+t.exitPrice : "open"}\nPnL: ${t.pnl?.toFixed(2) || "open"}\nStrategy: ${t.strategy || "none"}\nTags: ${t.tags || "none"}\nExecution: ${t.executionRate}/10\nNotes: "${t.notes || "none"}"\n`).join("\n") +
      `\nTell me:\n- My biggest weakness\n- My strongest edge\n- Psychological patterns\n- Strategy win rates\n- Execution impact\n- 3 brutal actions to fix my trading\nBe direct. No sugarcoating.`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 800,
        }),
      });

      const data = await res.json();
      setAiInsights(data.choices?.[0]?.message?.content || "AI failed - check console");
    } catch (err) {
      setAiInsights("AI request failed - check your OpenAI key in .env");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trade permanently?")) return;

    setDeletingId(id);

    try {
      const res = await fetch(`http://localhost:5000/trades/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setTrades(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete trade");
      await fetchTrades();
    } finally {
      setDeletingId(null);
    }
  };

  const toggleTag = (tag: string) => {
    setLogForm(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertForm.symbol.trim() || !alertForm.targetPrice) return alert("Fill both fields");

    const newAlert: Alert = {
      id: Date.now().toString(),
      symbol: alertForm.symbol.trim().toUpperCase(),
      targetPrice: parseFloat(alertForm.targetPrice)
    };

    setAlerts(prev => [...prev, newAlert]);
    setAlertForm({ symbol: "", targetPrice: "" });
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // ───────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? "bg-black text-white" : "bg-gray-100 text-gray-900"} flex`}>
      {/* ──────────────── SIDEBAR ──────────────── */}
      <aside className={`w-72 border-r ${darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"} p-6 flex flex-col`}>
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Tradiary</h1>
        </div>

        <nav className="flex-1 space-y-1.5">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "dashboard" ? "bg-gray-800 text-white shadow-md" : "text-gray-400 hover:bg-gray-800/60 hover:text-white"}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab("live-trades")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "live-trades" ? "bg-gray-800 text-white shadow-md" : "text-gray-400 hover:bg-gray-800/60 hover:text-white"}`}
          >
            <Eye className="w-5 h-5" /> Live Trades
          </button>
          <button
            onClick={() => setActiveTab("finished-trades")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "finished-trades" ? "bg-gray-800 text-white shadow-md" : "text-gray-400 hover:bg-gray-800/60 hover:text-white"}`}
          >
            <List className="w-5 h-5" /> Finished Trades
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "alerts" ? "bg-gray-800 text-white shadow-md" : "text-gray-400 hover:bg-gray-800/60 hover:text-white"}`}
          >
            <Bell className="w-5 h-5" /> Alerts
          </button>
        </nav>
      </aside>

      {/* ──────────────── MAIN CONTENT ──────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Header with Log New Trade button */}
            <header className={`border-b ${darkMode ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"}`}>
              <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <h1 className="text-5xl md:text-6xl font-extrabold">Tradiary</h1>
                  
                  <div className="flex items-center gap-5 flex-wrap">
                    <button
                      onClick={() => setIsLogModalOpen(true)}
                      className="flex items-center gap-3 px-7 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-medium shadow-lg transition"
                    >
                      <Plus className="w-6 h-6" />
                      LOG NEW TRADE
                    </button>

                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`p-4 rounded-xl transition ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"}`}
                    >
                      {darkMode ? <Sun className="w-7 h-7" /> : <Moon className="w-7 h-7" />}
                    </button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={generateAIInsights}
                      disabled={aiLoading}
                      className={`px-8 py-4 rounded-xl text-lg font-bold flex items-center gap-3 shadow-lg transition ${
                        darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-800 hover:bg-gray-900 text-white"
                      }`}
                    >
                      <Sparkles className="w-6 h-6" />
                      {aiLoading ? "Thinking..." : "AI Insights"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </header>

            {/* Market Movers */}
            <section className="max-w-7xl mx-auto px-6 py-12">
              <h2 className={`text-4xl font-bold mb-10 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Today's Top Movers</h2>
              {moversLoading ? (
                <p className="text-center text-2xl">Loading market data...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`rounded-3xl p-8 shadow-lg border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-green-400">
                      <TrendingUp className="w-8 h-8" /> Top Gainers
                    </h3>
                    <div className="space-y-4">
                      {gainers.map((stock, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-xl font-bold">{stock.symbol}</span>
                          <div className="text-right">
                            <p className="text-lg">₹{stock.price.toFixed(2)}</p>
                            <p className="text-green-400 font-medium">+{stock.percentChange.toFixed(2)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-3xl p-8 shadow-lg border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-red-400">
                      <TrendingDown className="w-8 h-8" /> Top Losers
                    </h3>
                    <div className="space-y-4">
                      {losers.map((stock, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-xl font-bold">{stock.symbol}</span>
                          <div className="text-right">
                            <p className="text-lg">₹{stock.price.toFixed(2)}</p>
                            <p className="text-red-400 font-medium">{stock.percentChange.toFixed(2)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* AI Insights */}
            <AnimatePresence>
              {aiInsights && (
                <motion.section
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-7xl mx-auto px-6 py-12"
                >
                  <div className={`rounded-3xl p-10 shadow-2xl border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
                    <h2 className={`text-4xl font-bold mb-8 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>AI Trading Coach</h2>
                    <pre className={`whitespace-pre-wrap text-xl leading-relaxed ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{aiInsights}</pre>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Charts */}
            <section className="max-w-7xl mx-auto px-6 py-12">
              <h2 className={`text-4xl font-bold mb-10 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Performance Charts</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`rounded-3xl p-8 shadow-lg border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
                  <h3 className={`text-2xl font-bold mb-6 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Cumulative PnL</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={cumulativePnLData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#333" : "#e0e0e0"} />
                      <XAxis dataKey="date" stroke={darkMode ? "#888" : "#666"} />
                      <YAxis stroke={darkMode ? "#888" : "#666"} />
                      <Tooltip contentStyle={{ backgroundColor: darkMode ? "#111" : "#fff", border: "none", color: darkMode ? "#fff" : "#000" }} />
                      <Line type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={4} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className={`rounded-3xl p-8 shadow-lg border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
                  <h3 className={`text-2xl font-bold mb-6 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Strategy Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: darkMode ? "#111" : "#fff", border: "none", color: darkMode ? "#fff" : "#000" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="max-w-7xl mx-auto px-6 py-8">
              <h2 className={`text-4xl font-bold mb-10 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Performance Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className={`rounded-2xl p-8 text-center shadow-lg border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
                  <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total Trades</p>
                  <p className="text-5xl font-extrabold mt-4">{trades.length}</p>
                </div>
                <div className={`rounded-2xl p-8 text-center shadow-lg border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
                  <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Win Rate</p>
                  <p className="text-5xl font-extrabold mt-4 text-green-400">{winRate}%</p>
                </div>
                <div className={`rounded-2xl p-8 text-center shadow-lg border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
                  <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total PnL</p>
                  <p className="text-5xl font-extrabold mt-4" style={{ color: totalPnL >= 0 ? "#10b981" : "#ef4444" }}>
                    {totalPnL.toFixed(2)}
                  </p>
                </div>
                <div className={`rounded-2xl p-8 text-center shadow-lg border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
                  <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Avg Execution</p>
                  <p className="text-5xl font-extrabold mt-4">
                    {trades.length === 0 ? "N/A" : (trades.reduce((sum, t) => sum + (t.executionRate || 0), 0) / trades.length).toFixed(1)}
                  </p>
                </div>
              </div>
            </section>

            {/* All Trades (Dashboard view) */}
            <main className="max-w-7xl mx-auto px-6 pb-20">
              <h2 className={`text-4xl font-bold mb-10 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Your Trades</h2>
              {loading ? (
                <p className={`text-center text-2xl py-20 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>Loading...</p>
              ) : trades.length === 0 ? (
                <div className={`text-center py-32 rounded-3xl border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
                  <p className={`text-4xl font-bold mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>No trades logged</p>
                  <p className={`text-2xl ${darkMode ? "text-gray-500" : "text-gray-600"}`}>Start building your edge</p>
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {trades.map((trade) => (
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      key={trade.id}
                      className={`rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-3xl font-bold">{trade.symbol}</h3>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-5 py-2 rounded-full text-lg font-bold ${
                              trade.direction === "long" 
                                ? (darkMode ? "bg-green-900/50 text-green-400" : "bg-green-100 text-green-800") 
                                : (darkMode ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-800")
                            }`}
                          >
                            {trade.direction.toUpperCase()}
                          </span>
                          <button
                            onClick={() => handleDelete(trade.id)}
                            disabled={deletingId === trade.id}
                            className={`p-3 rounded-xl transition disabled:opacity-50 ${darkMode ? "bg-red-900/50 hover:bg-red-900/70" : "bg-red-100 hover:bg-red-200"}`}
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xl">Entry: <span className="font-bold">₹{trade.entryPrice}</span></p>
                        {trade.exitPrice != null && <p className="text-xl">Exit: <span className="font-bold">₹{trade.exitPrice}</span></p>}
                        <p className="text-xl">Qty: <span className="font-bold">{trade.quantity}</span></p>
                        {trade.stopLoss && (
                          <p className="text-lg">Stop Loss: <span className="font-bold text-red-400">₹{trade.stopLoss}</span></p>
                        )}
                        {trade.takeProfit && (
                          <p className="text-lg">Take Profit: <span className="font-bold text-green-400">₹{trade.takeProfit}</span></p>
                        )}
                        {trade.pnl != null && (
                          <p className={`text-2xl font-extrabold mt-6 ${trade.pnl > 0 ? "text-green-400" : trade.pnl < 0 ? "text-red-400" : "text-gray-500"}`}>
                            PnL: {trade.pnl > 0 ? "+" : ""}₹{Math.abs(trade.pnl).toFixed(2)}
                          </p>
                        )}
                        <p className={`text-sm mt-4 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>{new Date(trade.entryDate).toLocaleString()}</p>
                        {trade.strategy && <p className={`text-lg mt-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>Strategy: {trade.strategy}</p>}
                        {trade.tags && <p className={`text-lg mt-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>Tags: {trade.tags}</p>}
                        {trade.screenshot && (
                          <div className="mt-6">
                            <img src={trade.screenshot} alt="Trade chart" className="w-full rounded-xl border border-gray-700 shadow-lg" />
                          </div>
                        )}
                      </div>
                      <div className="mt-8">
                        <span
                          className={`px-6 py-3 rounded-full text-lg font-bold ${
                            trade.status === "open" 
                              ? (darkMode ? "bg-yellow-900/50 text-yellow-400" : "bg-yellow-100 text-yellow-800")
                              : (darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-700")
                          }`}
                        >
                          {trade.status.toUpperCase()}
                        </span>
                      </div>
                      {trade.status === "open" && (
                        <button
                          onClick={() => openCloseModal(trade)}
                          className={`mt-6 w-full py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-3 transition ${
                            darkMode 
                              ? "bg-gray-100 text-black hover:bg-gray-300" 
                              : "bg-gray-900 text-white hover:bg-gray-800"
                          }`}
                        >
                          Close Trade
                          <ArrowRight className="w-7 h-7" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </main>
          </>
        )}

        {/* Live Trades Tab */}
        {activeTab === "live-trades" && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h2 className="text-4xl font-bold mb-10">Live Trades</h2>
            {loading ? (
              <p className="text-center text-2xl py-20 text-gray-500">Loading...</p>
            ) : trades.filter(t => t.status === "open").length === 0 ? (
              <div className="text-center py-32 text-2xl text-gray-500">
                No active trades yet — log one!
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {trades
                  .filter(t => t.status === "open")
                  .map(trade => (
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      key={trade.id}
                      className={`rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-3xl font-bold">{trade.symbol}</h3>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-5 py-2 rounded-full text-lg font-bold ${
                              trade.direction === "long" 
                                ? (darkMode ? "bg-green-900/50 text-green-400" : "bg-green-100 text-green-800") 
                                : (darkMode ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-800")
                            }`}
                          >
                            {trade.direction.toUpperCase()}
                          </span>
                          <button
                            onClick={() => handleDelete(trade.id)}
                            disabled={deletingId === trade.id}
                            className={`p-3 rounded-xl transition disabled:opacity-50 ${darkMode ? "bg-red-900/50 hover:bg-red-900/70" : "bg-red-100 hover:bg-red-200"}`}
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xl">Entry: <span className="font-bold">₹{trade.entryPrice}</span></p>
                        {trade.exitPrice != null && <p className="text-xl">Exit: <span className="font-bold">₹{trade.exitPrice}</span></p>}
                        <p className="text-xl">Qty: <span className="font-bold">{trade.quantity}</span></p>
                        {trade.stopLoss && (
                          <p className="text-lg">Stop Loss: <span className="font-bold text-red-400">₹{trade.stopLoss}</span></p>
                        )}
                        {trade.takeProfit && (
                          <p className="text-lg">Take Profit: <span className="font-bold text-green-400">₹{trade.takeProfit}</span></p>
                        )}
                        {trade.pnl != null && (
                          <p className={`text-2xl font-extrabold mt-6 ${trade.pnl > 0 ? "text-green-400" : trade.pnl < 0 ? "text-red-400" : "text-gray-500"}`}>
                            PnL: {trade.pnl > 0 ? "+" : ""}₹{Math.abs(trade.pnl).toFixed(2)}
                          </p>
                        )}
                        <p className={`text-sm mt-4 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>{new Date(trade.entryDate).toLocaleString()}</p>
                        {trade.strategy && <p className={`text-lg mt-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>Strategy: {trade.strategy}</p>}
                        {trade.tags && <p className={`text-lg mt-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>Tags: {trade.tags}</p>}
                        {trade.screenshot && (
                          <div className="mt-6">
                            <img src={trade.screenshot} alt="Trade chart" className="w-full rounded-xl border border-gray-700 shadow-lg" />
                          </div>
                        )}
                      </div>
                      <div className="mt-8">
                        <span
                          className={`px-6 py-3 rounded-full text-lg font-bold ${
                            trade.status === "open" 
                              ? (darkMode ? "bg-yellow-900/50 text-yellow-400" : "bg-yellow-100 text-yellow-800")
                              : (darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-700")
                          }`}
                        >
                          {trade.status.toUpperCase()}
                        </span>
                      </div>
                      {trade.status === "open" && (
                        <button
                          onClick={() => openCloseModal(trade)}
                          className={`mt-6 w-full py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-3 transition ${
                            darkMode 
                              ? "bg-gray-100 text-black hover:bg-gray-300" 
                              : "bg-gray-900 text-white hover:bg-gray-800"
                          }`}
                        >
                          Close Trade
                          <ArrowRight className="w-7 h-7" />
                        </button>
                      )}
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Finished Trades Tab */}
        {activeTab === "finished-trades" && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h2 className="text-4xl font-bold mb-10">Finished Trades</h2>
            {loading ? (
              <p className="text-center text-2xl py-20 text-gray-500">Loading...</p>
            ) : trades.filter(t => t.status === "closed").length === 0 ? (
              <p className="text-center text-2xl text-gray-500 py-20">No finished trades yet</p>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {trades
                  .filter(t => t.status === "closed")
                  .map(trade => (
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      key={trade.id}
                      className={`rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-3xl font-bold">{trade.symbol}</h3>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-5 py-2 rounded-full text-lg font-bold ${
                              trade.direction === "long" 
                                ? (darkMode ? "bg-green-900/50 text-green-400" : "bg-green-100 text-green-800") 
                                : (darkMode ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-800")
                            }`}
                          >
                            {trade.direction.toUpperCase()}
                          </span>
                          <button
                            onClick={() => handleDelete(trade.id)}
                            disabled={deletingId === trade.id}
                            className={`p-3 rounded-xl transition disabled:opacity-50 ${darkMode ? "bg-red-900/50 hover:bg-red-900/70" : "bg-red-100 hover:bg-red-200"}`}
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xl">Entry: <span className="font-bold">₹{trade.entryPrice}</span></p>
                        {trade.exitPrice != null && <p className="text-xl">Exit: <span className="font-bold">₹{trade.exitPrice}</span></p>}
                        <p className="text-xl">Qty: <span className="font-bold">{trade.quantity}</span></p>
                        {trade.stopLoss && (
                          <p className="text-lg">Stop Loss: <span className="font-bold text-red-400">₹{trade.stopLoss}</span></p>
                        )}
                        {trade.takeProfit && (
                          <p className="text-lg">Take Profit: <span className="font-bold text-green-400">₹{trade.takeProfit}</span></p>
                        )}
                        {trade.pnl != null && (
                          <p className={`text-2xl font-extrabold mt-6 ${trade.pnl > 0 ? "text-green-400" : trade.pnl < 0 ? "text-red-400" : "text-gray-500"}`}>
                            PnL: {trade.pnl > 0 ? "+" : ""}₹{Math.abs(trade.pnl).toFixed(2)}
                          </p>
                        )}
                        <p className={`text-sm mt-4 ${darkMode ? "text-gray-500" : "text-gray-600"}`}>{new Date(trade.entryDate).toLocaleString()}</p>
                        {trade.strategy && <p className={`text-lg mt-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>Strategy: {trade.strategy}</p>}
                        {trade.tags && <p className={`text-lg mt-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>Tags: {trade.tags}</p>}
                        {trade.screenshot && (
                          <div className="mt-6">
                            <img src={trade.screenshot} alt="Trade chart" className="w-full rounded-xl border border-gray-700 shadow-lg" />
                          </div>
                        )}
                      </div>
                      <div className="mt-8">
                        <span
                          className={`px-6 py-3 rounded-full text-lg font-bold ${
                            trade.status === "open" 
                              ? (darkMode ? "bg-yellow-900/50 text-yellow-400" : "bg-yellow-100 text-yellow-800")
                              : (darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-700")
                          }`}
                        >
                          {trade.status.toUpperCase()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h2 className="text-4xl font-bold mb-10">Price Alerts</h2>

            {/* Add new alert form */}
            <div className={`rounded-3xl p-8 shadow-lg border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"} mb-12`}>
              <h3 className="text-2xl font-bold mb-6">Set New Price Alert</h3>
              <form onSubmit={handleAddAlert} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-lg font-medium mb-2">Symbol</label>
                  <input
                    type="text"
                    value={alertForm.symbol}
                    onChange={(e) => setAlertForm({...alertForm, symbol: e.target.value.toUpperCase()})}
                    placeholder="AAPL"
                    required
                    className={`w-full px-6 py-4 rounded-xl text-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-2">Target Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={alertForm.targetPrice}
                    onChange={(e) => setAlertForm({...alertForm, targetPrice: e.target.value})}
                    placeholder="3000"
                    required
                    className={`w-full px-6 py-4 rounded-xl text-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="px-10 py-5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold transition w-full md:w-auto"
                  >
                    Add Alert
                  </button>
                </div>
              </form>
            </div>

            {/* List of alerts */}
            <h3 className="text-2xl font-bold mb-6">Active Alerts</h3>
            {alerts.length === 0 ? (
              <p className="text-xl text-gray-500">No alerts set yet. Add one above!</p>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-6 rounded-2xl border flex justify-between items-center ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}
                  >
                    <div>
                      <span className="text-xl font-bold">{alert.symbol}</span>
                      <span className="ml-4 text-lg text-gray-500">Target: ₹{alert.targetPrice.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────
          LOG NEW TRADE MODAL
      ─────────────────────────────────────────────────────────────── */}
      {isLogModalOpen && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${darkMode ? "bg-black/90" : "bg-gray-900/90"}`}>
          <div className={`rounded-3xl shadow-2xl p-10 max-w-2xl w-full max-h-screen overflow-y-auto border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-extrabold">LOG NEW TRADE</h2>
              <button onClick={() => setIsLogModalOpen(false)} className={`${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>
                <X className="w-10 h-10" />
              </button>
            </div>
            <form onSubmit={handleLogSubmit} className="space-y-6">
              <div>
                <label className={`block text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Symbol</label>
                <input
                  type="text"
                  required
                  value={logForm.symbol}
                  onChange={(e) => setLogForm({ ...logForm, symbol: e.target.value.toUpperCase() })}
                  className={`w-full px-6 py-4 rounded-xl text-xl focus:outline-none focus:border-gray-500 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                  placeholder="AAPL, TSLA, NVDA, RELIANCE"
                />
                {priceLoading && <p className="text-sm mt-2 opacity-70">Fetching live price...</p>}
                {currentPrice !== null && !priceLoading && (
                  <div className="mt-4 p-4 rounded-xl bg-green-900/30 border border-green-800">
                    <p className="text-lg font-medium">Current Price: <span className="font-bold text-green-400">₹{currentPrice.toFixed(2)}</span></p>
                    <button
                      type="button"
                      onClick={() => setLogForm({ ...logForm, entryPrice: currentPrice.toString() })}
                      className="mt-3 px-6 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-sm font-semibold transition"
                    >
                      Use This Price
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Direction</label>
                <select
                  value={logForm.direction}
                  onChange={(e) => setLogForm({ ...logForm, direction: e.target.value })}
                  className={`w-full px-6 py-4 rounded-xl text-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                >
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={`block text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={logForm.entryPrice}
                    onChange={(e) => setLogForm({ ...logForm, entryPrice: e.target.value })}
                    className={`w-full px-6 py-4 rounded-xl text-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                  />
                </div>
                <div>
                  <label className={`block text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Quantity</label>
                  <input
                    type="number"
                    required
                    value={logForm.quantity}
                    onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })}
                    className={`w-full px-6 py-4 rounded-xl text-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Entry Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={logForm.entryDate}
                  onChange={(e) => setLogForm({ ...logForm, entryDate: e.target.value })}
                  className={`w-full px-6 py-4 rounded-xl text-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                />
              </div>

              <div>
                <label className={`block text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Strategy</label>
                <select
                  value={logForm.strategy}
                  onChange={(e) => setLogForm({ ...logForm, strategy: e.target.value })}
                  className={`w-full px-6 py-4 rounded-xl text-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                >
                  <option value="">Select or leave blank</option>
                  {STRATEGY_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-lg font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Tags (multiple)</label>
                <div className="grid grid-cols-2 gap-4">
                  {TAG_OPTIONS.map((tag) => (
                    <label key={tag} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={logForm.selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="w-6 h-6 rounded text-gray-500"
                      />
                      <span className="text-lg">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Execution Rate</label>
                <select
                  value={logForm.executionRate}
                  onChange={(e) => setLogForm({ ...logForm, executionRate: e.target.value })}
                  className={`w-full px-6 py-4 rounded-xl text-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} / 10</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Notes</label>
                <textarea
                  rows={5}
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  className={`w-full px-6 py-4 rounded-xl text-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                  placeholder="What went well? What to improve?"
                />
              </div>

              {/* Screenshot */}
              <div>
                <label className={`block text-lg font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Chart Screenshot (optional)</label>
                <div className="flex items-center gap-4">
                  <label className={`px-8 py-4 rounded-xl cursor-pointer flex items-center gap-3 transition ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"}`}>
                    <Upload className="w-6 h-6" />
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {screenshotFile && <span className="text-green-400 font-medium">{screenshotFile.name}</span>}
                </div>
              </div>

              {/* Risk Calculator */}
              <div className={`p-6 rounded-2xl border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-200/50 border-gray-400"}`}>
                <h3 className="text-2xl font-bold mb-6">Risk Management</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Stop Loss</label>
                    <input
                      type="number"
                      step="any"
                      value={logForm.stopLoss}
                      onChange={(e) => setLogForm({ ...logForm, stopLoss: e.target.value })}
                      className={`w-full px-6 py-4 rounded-xl text-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                      placeholder="e.g. 140"
                    />
                  </div>
                  <div>
                    <label className={`block text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Take Profit</label>
                    <input
                      type="number"
                      step="any"
                      value={logForm.takeProfit}
                      onChange={(e) => setLogForm({ ...logForm, takeProfit: e.target.value })}
                      className={`w-full px-6 py-4 rounded-xl text-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                      placeholder="e.g. 170"
                    />
                  </div>
                </div>

                {(stopLoss > 0 || takeProfit > 0) && entryPrice > 0 && quantity > 0 && (
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl text-center ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
                      <p className="text-sm opacity-80">Risk Amount</p>
                      <p className="text-2xl font-bold text-red-400">₹{riskAmount.toFixed(2)}</p>
                    </div>
                    <div className={`p-4 rounded-xl text-center ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}>
                      <p className="text-sm opacity-80">Risk %</p>
                      <p className="text-2xl font-bold">{riskPercent}%</p>
                    </div>
                    <div className={`p-4 rounded-xl text-center ${darkMode ? "bg-green-900/30" : "bg-green-100"}`}>
                      <p className="text-sm opacity-80">R:R Ratio</p>
                      <p className="text-2xl font-bold text-green-400">1:{rrRatio}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-6 pt-6">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className={`px-10 py-5 rounded-xl text-xl font-bold transition ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-10 py-5 rounded-xl text-xl font-bold transition disabled:opacity-70 ${darkMode ? "bg-gray-100 text-black hover:bg-gray-300" : "bg-gray-900 text-white hover:bg-gray-800"}`}
                >
                  {saving ? "Saving..." : "Save Trade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────
          CLOSE TRADE MODAL
      ─────────────────────────────────────────────────────────────── */}
      {isCloseModalOpen && currentTrade && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${darkMode ? "bg-black/90" : "bg-gray-900/90"}`}>
          <div className={`rounded-3xl shadow-2xl p-10 max-w-lg w-full border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300"}`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-extrabold">Close Trade</h2>
              <button onClick={() => setIsCloseModalOpen(false)} className={`${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition`}>
                <X className="w-10 h-10" />
              </button>
            </div>

            <div className={`mb-8 p-6 rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-200 border-gray-400"}`}>
              <p className="text-2xl font-bold">{currentTrade.symbol} {currentTrade.direction.toUpperCase()}</p>
              <p className={`text-xl mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Entry: ₹{currentTrade.entryPrice} × {currentTrade.quantity}
              </p>
            </div>

            <form onSubmit={handleCloseSubmit} className="space-y-6">
              <div>
                <label className={`block text-lg font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Exit Price</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={closeForm.exitPrice}
                  onChange={(e) => setCloseForm({ ...closeForm, exitPrice: e.target.value })}
                  className={`w-full px-6 py-5 rounded-xl text-2xl focus:outline-none focus:border-gray-500 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                />
              </div>

              <div>
                <label className={`block text-lg font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Exit Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={closeForm.exitDate}
                  onChange={(e) => setCloseForm({ ...closeForm, exitDate: e.target.value })}
                  className={`w-full px-6 py-5 rounded-xl text-xl focus:outline-none focus:border-gray-500 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                />
              </div>

              <div className="flex justify-end gap-6 pt-8">
                <button type="button" onClick={() => setIsCloseModalOpen(false)} className={`px-10 py-5 rounded-xl text-xl font-bold transition ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"}`}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={`px-10 py-5 rounded-xl text-xl font-bold transition disabled:opacity-70 ${darkMode ? "bg-gray-100 text-black hover:bg-gray-300" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
                  {saving ? "Closing..." : "Close & Calculate PnL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;