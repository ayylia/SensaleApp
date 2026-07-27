import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../App";
import { ArrowLeft, TrendingUp, AlertCircle, Loader } from "lucide-react";
import { XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export default function ProductDeepDive() {
  const { productName } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/api/product/${encodeURIComponent(productName)}/analysis`);
        setData(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch product analysis. Ensure the product exists.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [productName]);

  if (loading) {
     return (
        <div className="flex-1 flex flex-col items-center justify-center h-full">
           <Loader className="w-16 h-16 text-rose-500 animate-spin drop-shadow-md mb-6" />
           <p className="text-sm font-black tracking-widest text-slate-500 uppercase">Analyzing Deep Dive Data...</p>
        </div>
     );
  }

  if (error || !data) {
     return (
        <div className="flex-1 flex flex-col items-center justify-center p-10">
           <AlertCircle className="w-16 h-16 text-rose-500 mb-6 drop-shadow-md" />
           <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Analysis Error</h2>
           <p className="text-slate-500 font-bold mb-8">{error}</p>
           <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-white text-rose-600 font-black tracking-widest uppercase rounded-2xl shadow-sm border border-slate-200 hover:border-rose-300 transition-all">Go Back</button>
        </div>
     );
  }

  // Formatting chart data mapping
  const chartData = data.demand_forecast?.map(f => ({
      name: f.forecast_date.split('-').slice(1).join('/'),
      demand: f.predicted_demand
  })) || [];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-10 relative z-20 w-full animate-fade-in-up">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="mb-8">
        <h2 className="text-3xl md:text-5xl title-font tracking-tight font-extrabold text-slate-900 mb-2">
          {productName}
        </h2>
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 rounded-full bg-rose-500"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
            Deep Dive Analytics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
         {/* KPI Cards */}
         <div className="bg-white rounded-3xl p-6 md:p-8 relative overflow-hidden group border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-10px_rgba(14,165,233,0.1)] transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-200 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-700 blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100">
                <span className="text-sky-500 font-black">RM</span>
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
            </div>
            <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight title-font">
              {data.total_revenue.toLocaleString()}
            </p>
         </div>
         <div className="bg-white rounded-3xl p-6 md:p-8 relative overflow-hidden group border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.1)] transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-200 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-700 blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <span className="text-emerald-500 font-black text-xl">📦</span>
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Units Sold</p>
            </div>
            <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight title-font">
              {data.total_volume.toLocaleString()}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
         {/* Specific Pricing Rec */}
         <div className="lg:col-span-5 flex flex-col">
            <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full opacity-40 blur-3xl -mr-10 -mt-10"></div>
               <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center tracking-tight title-font relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center mr-3 shadow-lg shadow-orange-200">💡</div>
                  Optimal Pricing
               </h3>

               {data.price_recommendation ? (
                  <div className="flex-1 flex flex-col justify-center relative z-10">
                     {data.price_recommendation.recommended_price ? (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative">
                           <div className="absolute -left-[1px] top-4 bottom-4 w-[3px] rounded-r-md bg-gradient-to-b from-amber-400 to-orange-500"></div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-2">AI Target</p>
                           <p className="text-4xl font-black text-slate-800 mb-4 ml-2 title-font tracking-tight">RM {data.price_recommendation.recommended_price}</p>
                           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100/50">
                             <p className="text-xs font-bold text-slate-500 leading-relaxed">
                               {data.price_recommendation.message}
                             </p>
                           </div>
                        </div>
                     ) : (
                        <div className="text-center py-4">
                           <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                           <p className="text-slate-500 font-bold text-sm">{data.price_recommendation.message}</p>
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="text-center p-6 bg-white/50 rounded-2xl border border-slate-100 border-dashed">
                     <p className="text-slate-400 font-bold text-sm">No pricing data computed for this product.</p>
                  </div>
               )}
            </div>
         </div>

         {/* Specific Demand Horizon */}
         <div className="lg:col-span-7 flex flex-col">
            <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full opacity-40 blur-3xl -mr-10 -mt-10"></div>
               <div className="flex justify-between items-center mb-8 flex-wrap gap-4 relative z-10">
                  <h3 className="text-lg font-black text-slate-800 flex items-center tracking-tight title-font">
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center mr-3 shadow-lg shadow-indigo-200">📈</div>
                     Demand Horizon
                  </h3>
                  <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-lg border border-indigo-100 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" /> Next 7 Days
                  </span>
               </div>

               {chartData.length > 0 ? (
                  <div className="h-48 w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorDemandSpecific" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5}/>
                                 <stop offset="100%" stopColor="#818cf8" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 700}} dy={10} />
                           <Tooltip
                              contentStyle={{borderRadius: '12px', border: 'none', background: '#ffffff', padding: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)'}}
                              labelStyle={{color: '#64748b', fontWeight: '900', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em'}}
                              itemStyle={{color: '#4f46e5', fontWeight: '900', fontSize: '16px'}}
                              cursor={{ stroke: '#c7d2fe', strokeWidth: 2, strokeDasharray: '4 4' }}
                           />
                           <Area type="monotone" dataKey="demand" name="Predicted Units" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDemandSpecific)" activeDot={{ r: 6, fill: '#fff', stroke: '#6366f1', strokeWidth: 3 }} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               ) : (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                     <p className="text-slate-400 font-bold text-sm">Insufficient data for Holt-Winters model.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
