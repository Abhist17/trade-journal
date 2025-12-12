import { BookOpen, TrendingUp, Brain, Plus } from "lucide-react";

function App() {
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
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-3 hover:scale-105 transition transform">
              <Plus className="w-6 h-6" />
              Log New Trade
            </button>
          </div>
          <p className="mt-6 text-xl text-blue-100 max-w-3xl">
            Log your trades • Tag strategies • Rate execution • Review performance • Get AI-powered insights
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-8">
            Transform Your Trading Performance
          </h2>
          <div className="grid md:grid-cols-3 gap-10 mt-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Log Your Trade</h3>
              <p className="text-gray-600">
                Quickly record entry, exit, size, notes, screenshots, and emotions.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Tag & Rate</h3>
              <p className="text-gray-600">
                Categorize by strategy, instrument, and rate your execution quality.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Review & Improve</h3>
              <p className="text-gray-600">
                Get AI insights, charts, and metrics to spot patterns and grow.
              </p>
            </div>
          </div>

          <div className="mt-20 text-gray-500">
            <p className="text-lg">No trades logged yet. Click "Log New Trade" to begin.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>Trade Journal • Built by you, powered by discipline</p>
        </div>
      </footer>
    </div>
  );
}

export default App;