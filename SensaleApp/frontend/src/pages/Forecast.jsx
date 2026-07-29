import { useState, useEffect, useCallback, useMemo } from "react";
import { apiClient } from "../App";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, AlertCircle, RefreshCw, Calendar, Plus, Trash2, Tag, Percent } from "lucide-react";

export default function Forecast() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Spikes State
  const [spikes, setSpikes] = useState([]);
  const [showSpikeForm, setShowSpikeForm] = useState(false);
  const [newSpike, setNewSpike] = useState({
    event_name: '',
    start_date: '',
    end_date: '',
    impact_factor: 1.5,
    product_name: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, spikeRes] = await Promise.all([
        apiClient.get('/api/dashboard-data'),
        apiClient.get('/api/demand-spikes')
      ]);
      setData(dashRes.data);
      setSpikes(spikeRes.data);
    } catch (err) {
      console.error("Error fetching forecast data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddSpike = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/demand-spikes', {
        ...newSpike,
        product_name: newSpike.product_name || null
      });
      setShowSpikeForm(false);
      setNewSpike({ event_name: '', start_date: '', end_date: '', impact_factor: 1.5, product_name: '' });
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error("Error adding spike", err);
    }
  };

  const handleDeleteSpike = async (id) => {
    try {
      await apiClient.delete(`/api/demand-spikes/${id}`);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error("Error deleting spike", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const groupedForecasts = useMemo(() => {
    if (!data?.demand_forecasts) return {};
    return data.demand_forecasts.reduce((acc, curr) => {
      if (!acc[curr.product_name]) acc[curr.product_name] = [];
      acc[curr.product_name].push({
        name: curr.forecast_date.split('-').slice(1).join('/'),
        demand: curr.predicted_demand,
      });
      return acc;
    }, {});
  }, [data?.demand_forecasts]);

  const productCount = Object.keys(groupedForecasts).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-20 w-full animate-fade-in-up pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center mb-2">
            <TrendingUp className="w-8 h-8 mr-4 text-sky-500" /> Demand Horizon
          </h2>
          <p className="text-md text-slate-500 font-medium tracking-wide">
            7-day predicted demand for each of your active products.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:border-sky-300 hover:text-sky-600 transition-all shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary pill */}
      {!loading && productCount > 0 && (
        <div className="mb-8 flex items-center gap-3 animate-fade-in-up">
          <span className="px-4 py-2 bg-sky-50 border border-sky-200 rounded-full text-sm font-black text-sky-600 uppercase tracking-widest">
            {productCount} Product{productCount !== 1 ? 's' : ''} Tracked
          </span>
          <span className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-black text-slate-500 uppercase tracking-widest">
            7-Day Window
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-24 flex flex-col items-center justify-center space-y-6 animate-pulse">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-sky-400 animate-spin"></div>
          </div>
          <p className="text-sm text-slate-400 font-bold tracking-widest uppercase">Forecasting Demand...</p>
        </div>
      )}

      {/* Charts Grid */}
      {!loading && productCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up delay-100">
          {Object.entries(groupedForecasts).map(([product, chartData]) => {
            const maxDemand = Math.max(...chartData.map(d => d.demand));
            const trend = chartData[chartData.length - 1]?.demand >= chartData[0]?.demand ? 'up' : 'down';

            return (
              <div
                key={product}
                className="glass-card rounded-[2rem] p-6 border border-slate-100 hover:shadow-xl hover:shadow-sky-500/5 hover:border-sky-200 transition-all duration-500 group"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <p className="font-black text-slate-800 text-lg pr-4 leading-tight truncate">{product}</p>
                  <span className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg border uppercase whitespace-nowrap flex-shrink-0 ${
                    trend === 'up'
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                      : 'text-rose-500 bg-rose-50 border-rose-100'
                  }`}>
                    {trend === 'up' ? '↑ Rising' : '↓ Falling'}
                  </span>
                </div>

                {/* Stock recommendation */}
                <div className="mb-5 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                  <p className="text-sm font-bold text-slate-600 leading-relaxed">
                    📦 Prepare at least{" "}
                    <span className="text-sky-600 font-black">{Math.round(maxDemand)} units</span>{" "}
                    this week.{" "}
                    {trend === 'up'
                      ? <span className="text-emerald-600 font-black">Stock up now! 🚀</span>
                      : <span className="text-rose-500 font-black">Don't over-order. 📉</span>
                    }
                  </p>
                </div>

                {/* Chart */}
                <div className="h-44 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`colorDemand-${product.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        interval={0}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                        dx={-10}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', background: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#0284c7', fontWeight: '900', fontSize: '16px' }}
                        cursor={{ stroke: '#bae6fd', strokeWidth: 2, strokeDasharray: '4 4' }}
                        formatter={(value) => [`${Math.round(value)} units`, 'Predicted Sales']}
                      />
                      <Area
                        type="monotone"
                        dataKey="demand"
                        stroke="#38bdf8"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill={`url(#colorDemand-${product.replace(/\s+/g, '')})`}
                        activeDot={{ r: 8, fill: '#fff', stroke: '#38bdf8', strokeWidth: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && productCount === 0 && (
        <div className="mt-20 glass-card rounded-[3rem] p-12 text-center animate-fade-in-up border-sky-100 mx-auto max-w-lg bg-white shadow-xl shadow-sky-500/5">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-sky-50 text-sky-400 mb-8 border-4 border-white shadow-inner">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-4">No Forecast Data</h3>
          <p className="text-slate-500 font-bold leading-relaxed">
            Upload your sales data from the Overview page to generate demand forecasts.
          </p>
        </div>
      )}

      {/* Seasonal Influence Section */}
      <div className="mt-16 animate-fade-in-up delay-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-pink-500" /> Seasonal Influence
            </h3>
            <p className="text-sm text-slate-500 font-bold mt-1">
              Add upcoming festive seasons or sale events to adjust forecasts.
            </p>
          </div>
          <button
            onClick={() => setShowSpikeForm(!showSpikeForm)}
            className="flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-2xl font-black text-sm hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {showSpikeForm ? 'Cancel' : 'Add Event Spike'}
          </button>
        </div>

        {showSpikeForm && (
          <div className="glass-card rounded-[2rem] p-8 mb-8 border-pink-100 bg-white shadow-xl">
            <form onSubmit={handleAddSpike} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Event Name</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Hari Raya, 11.11 Sale"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400/20 transition-all"
                    value={newSpike.event_name}
                    onChange={e => setNewSpike({...newSpike, event_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                <input
                  required
                  type="date"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400/20 transition-all"
                  value={newSpike.start_date}
                  onChange={e => setNewSpike({...newSpike, start_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                <input
                  required
                  type="date"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400/20 transition-all"
                  value={newSpike.end_date}
                  onChange={e => setNewSpike({...newSpike, end_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Demand Multiplier</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400/20 transition-all appearance-none"
                    value={newSpike.impact_factor}
                    onChange={e => setNewSpike({...newSpike, impact_factor: parseFloat(e.target.value)})}
                  >
                    <option value="1.2">1.2x (20% Increase)</option>
                    <option value="1.5">1.5x (50% Increase)</option>
                    <option value="2.0">2.0x (Double Demand)</option>
                    <option value="3.0">3.0x (Triple Demand)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Product Scope</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400/20 transition-all appearance-none"
                    value={newSpike.product_name}
                    onChange={e => setNewSpike({...newSpike, product_name: e.target.value})}
                  >
                    <option value="">All Products</option>
                    {Object.keys(groupedForecasts).map(prod => (
                      <option key={prod} value={prod}>{prod}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-sm hover:bg-slate-900 transition-all shadow-lg"
                >
                  Save Influence Factor
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spikes.map(spike => (
            <div key={spike.id} className="glass-card rounded-2xl p-5 border-slate-100 bg-white flex justify-between items-center group">
              <div>
                <p className="font-black text-slate-800">{spike.event_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {new Date(spike.start_date).toLocaleDateString()} - {new Date(spike.end_date).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black">
                    {spike.impact_factor}x
                  </span>
                </div>
                {spike.product_name && (
                  <p className="text-[10px] font-bold text-pink-500 mt-1 uppercase">Applied to: {spike.product_name}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteSpike(spike.id)}
                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {spikes.length === 0 && !showSpikeForm && (
            <div className="col-span-full py-10 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-400">
              <Calendar className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">No Active Seasonal Factors</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
