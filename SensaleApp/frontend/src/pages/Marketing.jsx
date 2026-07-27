import { useState } from "react";
import { Megaphone, Search, Sparkles, Copy, CheckCheck, TrendingUp, Crown, Loader } from "lucide-react";
import { apiClient } from "../App";

function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const TONE_CONFIG = {
  scarcity: { label: "🔥 Scarcity", color: "rose",   bg: "bg-rose-50",   border: "border-rose-200",   badge: "bg-rose-500"   },
  popular:  { label: "⭐ Popular",  color: "amber",  bg: "bg-amber-50",  border: "border-amber-200",  badge: "bg-amber-500"  },
  premium:  { label: "👑 Premium",  color: "indigo", bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-500" },
  value:    { label: "💚 Value",    color: "emerald",bg: "bg-emerald-50",border: "border-emerald-200",badge: "bg-emerald-500"},
};

function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.81a8.2 8.2 0 004.79 1.53V6.88a4.85 4.85 0 01-1.02-.19z" />
    </svg>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
    >
      {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CopyCard({ platform, icon: Icon, iconColor, content, bgClass, borderClass }) {
  return (
    <div className={`rounded-[2rem] border-2 p-6 ${bgClass} ${borderClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <p className="text-sm font-black text-slate-700 uppercase tracking-widest">{platform}</p>
        </div>
        <CopyButton text={content} />
      </div>
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  );
}

export default function Marketing() {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = async (q) => {
    setSearch(q);
    setSelected("");
    setResult(null);
    if (q.length > 0) {
      try {
        const res = await apiClient.get(`/api/products/search?q=${q}`);
        setSuggestions(res.data);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectProduct = (name) => {
    setSelected(name);
    setSearch(name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const generateCopy = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.get(`/api/marketing/generate/${encodeURIComponent(selected)}`);
      setResult(res.data);
    } catch {
      setError("Failed to generate copy. Make sure the backend is running and the product exists.");
    } finally {
      setLoading(false);
    }
  };

  const tone = result ? TONE_CONFIG[result.tone] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-20 w-full animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center mb-2">
          <Megaphone className="w-8 h-8 mr-4 text-emerald-500" /> Marketing Auto-Gen
        </h2>
        <p className="text-md text-slate-500 font-medium tracking-wide">
          Search a product and instantly generate TikTok & Instagram ad copy tailored to its performance.
        </p>
      </div>

      {/* Search + Generate */}
      <div className="glass-card rounded-[2rem] p-8 mb-8">
        <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">Step 1 — Pick a Product</p>
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search your products (e.g. Yoga Mat, Hijab...)"
            className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
              {suggestions.map((name, i) => (
                <button
                  key={i}
                  onClick={() => selectProduct(name)}
                  className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-3"
                >
                  <Search className="w-4 h-4 opacity-40" /> {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">Step 2 — Generate</p>
        <button
          onClick={generateCopy}
          disabled={!selected || loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3"
        >
          {loading ? (
            <><Loader className="w-5 h-5 animate-spin" /> Generating Copy...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Generate Ad Copy for "{selected || "..."}"</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 text-rose-700 font-bold text-sm">
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {result && tone && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Product Stats Banner */}
          <div className={`rounded-[2rem] border-2 p-6 ${tone.bg} ${tone.border}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black text-slate-800">{result.product_name}</h3>
              <div className="flex items-center gap-2">
                {result.is_top_seller && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs font-black rounded-full shadow-md">
                    <Crown className="w-3.5 h-3.5" /> Top Seller
                  </span>
                )}
                <span className={`px-3 py-1.5 text-white text-xs font-black rounded-full shadow-md ${tone.badge}`}>
                  {tone.label} Tone
                </span>
                {result.is_ai && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-black rounded-full shadow-sm animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" /> Powered by Gemini AI
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Units Sold</p>
                <p className="text-2xl font-black text-slate-800">{result.total_volume.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Price</p>
                <p className="text-2xl font-black text-slate-800">RM {result.avg_price}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                <p className="text-2xl font-black text-slate-800">RM {result.total_revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* TikTok Copy */}
          <CopyCard
            platform="TikTok Caption"
            icon={TikTokIcon}
            iconColor="text-slate-800"
            content={result.tiktok}
            bgClass="bg-slate-50"
            borderClass="border-slate-200"
          />

          {/* Instagram Copy */}
          <CopyCard
            platform="Instagram Caption"
            icon={InstagramIcon}
            iconColor="text-pink-500"
            content={result.instagram}
            bgClass="bg-pink-50"
            borderClass="border-pink-200"
          />

          {/* Regenerate hint */}
          <div className="text-center pb-6">
            <button
              onClick={generateCopy}
              className="text-sm font-bold text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-2 mx-auto"
            >
              <TrendingUp className="w-4 h-4" /> Not happy? Click Generate again for a fresh variation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
