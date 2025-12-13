import { useState, useEffect } from "react";
import { BookOpen, Plus, X } from "lucide-react";

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  quantity: number;
  entryDate: string;
  strategy?: string;
  notes?: string;
  tags?: string;
  executionRate?: number;
  pnl?: number;
}

function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    symbol: "",
    direction: "long",
    entryPrice: "",
    quantity: "",
    entryDate: new Date().toISOString().slice(0, 16),
    strategy: "",
    notes: "",
    tags: "",
    executionRate: 5,
  });

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const res = await fetch("http://localhost:5000/trades");
      const data = await res.json();
      setTrades(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching trades:", err);
      setLoading(false);
    }
  };

  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:5000/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: form.symbol.toUpperCase(),
          direction: form.direction,
          entryPrice: parseFloat(form.entryPrice),
          quantity: parseFloat(form.quantity),
          entryDate: new Date(form.entryDate).toISOString(),
          strategy: form.strategy || null,
          notes: form.notes || null,
          tags: form.tags || null,
          executionRate: parseInt(form.executionRate as any),
          pnl: 0, // temporary, we'll improve later
        }),
      });

      // Reset form and close modal
      setForm({
        symbol: "",
        direction: "long",
        entryPrice: "",
        quantity: "",
        entryDate: new Date().toISOString().slice(0, 16),
        strategy: "",
        notes: "",
        tags: "",
        executionRate: 5,
      });
      setIsModalOpen(false);
      fetchTrades(); // refresh list
    } catch (err) {
      console.error("Error saving trade:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen className="w-12 h-12" />
              <h1 className="text-5xl font-bold">Trade Journal</h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-3 hover:scale-105 transition transform"
            >
              <Plus className="w-6 h-6" />
              Log New Trade
            </button>
          </div>
          <p className="mt-6 text-xl text-blue-100 max-w-3xl">
            Log your trades • Tag strategies • Rate execution • Review performance • Get AI-powered insights
          </p>
        </div>
      </header>

      {/* Stats Dashboard */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Performance Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Total Trades</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{trades.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Win Rate</p>
            <p className="text-4xl font-bold text-green-600 mt-2">
              {trades.length === 0
                ? "0%"
                : Math.round((trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100) + "%"}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Total PnL</p>
            <p className="text-4xl font-bold mt-2" style={{ color: totalPnL >= 0 ? '#10b981' : '#ef4444' }}>
              {totalPnL.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">Avg Execution</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">
              {trades.length === 0
                ? "N/A"
                : (trades.reduce((sum, t) => sum + (t.executionRate || 0), 0) / trades.length).toFixed(1)}
            </p>
          </div>
        </div>
      </section>

      {/* Trades List */}
      <main className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Your Trades</h2>
        {loading ? (
          <p className="text-center text-gray-600">Loading trades...</p>
        ) : trades.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <p className="text-2xl text-gray-600 mb-4">No trades yet</p>
            <p className="text-lg text-gray-500">Log your first trade to get started!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trades.map((trade) => (
              <div key={trade.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold">{trade.symbol}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    trade.direction === "long" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {trade.direction.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-700">Entry: ${trade.entryPrice}</p>
                <p className="text-gray-700">Qty: {trade.quantity}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(trade.entryDate).toLocaleString()}
                </p>
                {trade.strategy && <p className="text-sm text-blue-600 mt-1">Strategy: {trade.strategy}</p>}
                {trade.tags && <p className="text-sm text-purple-600 mt-1">Tags: {trade.tags}</p>}
                {trade.executionRate && (
                  <p className="text-sm text-orange-600 mt-1">Execution: {trade.executionRate}/10</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Log Trade Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Log New Trade</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-8 h-8" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <input
                  type="text"
                  required
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="EURUSD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                <select
                  value={form.direction}
                  onChange={(e) => setForm({ ...form, direction: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.entryPrice}
                    onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={form.entryDate}
                  onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strategy (optional)</label>
                <input
                  type="text"
                  value={form.strategy}
                  onChange={(e) => setForm({ ...form, strategy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Breakout, Scalping, Trend Following"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="breakout, fomo, high-volatility"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Execution Rate (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.executionRate}
                  onChange={(e) => setForm({ ...form, executionRate: parseInt(e.target.value) || 5 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="What went well? What could be better?"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Save Trade
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