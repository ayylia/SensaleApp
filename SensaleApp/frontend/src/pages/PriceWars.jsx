import { useState } from "react";
import { Calculator, X, TrendingDown } from "lucide-react";

const STATUS = {
  SAFE: {
    title: "Safe Margin",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-500",
    advice: (myPrice, compPrice, margin) => {
      if (compPrice > myPrice) {
        return `MAINTAIN OR RAISE PRICE. You are undercutting the competitor (RM ${compPrice.toFixed(2)}) while maintaining a highly profitable ${margin.toFixed(1)}% margin. Increase your price slightly to maximize profit while staying cheaper than the competitor.`;
      }
      return `HOLD PRICE. Your margin is a healthy ${margin.toFixed(1)}%. Do not engage in a race to the bottom. Ignore the competitor's RM ${compPrice.toFixed(2)} price and protect your profit margin.`;
    }
  },
  WARNING: {
    title: "Margin Squeeze",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-500",
    advice: (myPrice, compPrice, margin) => {
      if (compPrice > myPrice) {
        return `RAISE PRICE. Your margin of ${margin.toFixed(1)}% is shrinking. Since the competitor is priced higher at RM ${compPrice.toFixed(2)}, immediately increase your price to restore healthy profit margins.`;
      }
      return `HOLD PRICE & ADD VALUE. Your margin of ${margin.toFixed(1)}% is getting thin. Do not drop prices further to match RM ${compPrice.toFixed(2)}. Instead, bundle products or offer free shipping to justify your price.`;
    }
  },
  DANGER: {
    title: "Loss Alert",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-500",
    advice: (myPrice, compPrice, margin) => {
      if (compPrice > myPrice) {
        return `URGENT: RAISE PRICE. You are selling at a dangerously low ${margin.toFixed(1)}% margin. The competitor is priced higher at RM ${compPrice.toFixed(2)}, so you have immediate room to increase your price and prevent losses.`;
      }
      return `URGENT: CUT COSTS OR RAISE PRICE. You are operating near a loss with a ${margin.toFixed(1)}% margin. Do not chase the competitor's RM ${compPrice.toFixed(2)}. Renegotiate supplier costs or raise your price to survive.`;
    }
  },
};

export default function PriceWars() {
  const [form, setForm] = useState({ name: "", cost: "", price: "", compPrice: "" });
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const cost = parseFloat(form.cost);
    const price = parseFloat(form.price);
    const compPrice = parseFloat(form.compPrice);
    
    if (!cost || !price || !compPrice) {
      alert("Please enter numerical values for Cost, Price, and Competitor Price.");
      return;
    }
    
    const margin = ((price - cost) / price) * 100;
    let statusKey = "DANGER";
    if (margin >= 20) statusKey = "SAFE";
    else if (margin >= 5) statusKey = "WARNING";
    
    setResult({
      cost, price, compPrice, margin,
      status: STATUS[statusKey]
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-12 relative z-20 animate-fade-in-up">
       
       {/* Background decorative blob to remove the "kosong" feeling */}
       <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none transform translate-x-1/4 -translate-y-1/4 z-0"></div>

       {/* Simple Header */}
       <div className="mb-6 border-b border-slate-200 pb-4 max-w-2xl relative z-10">
         <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Pricing Strategy Calculator</h2>
         <p className="text-slate-500 font-medium text-sm md:text-lg">A simple tool to protect your profit margins and outsmart competitors.</p>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start relative z-10">
         
         {/* LEFT: Calculator Form */}
         <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="space-y-6">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Product Name (Optional)</label>
                  <input 
                    type="text" 
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Wireless Earbuds"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-slate-800 transition-colors" 
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">My Cost (RM)</label>
                    <input 
                      type="number" 
                      name="cost"
                      min="0" step="0.01"
                      value={form.cost}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 outline-none focus:border-slate-800 transition-colors" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">My Selling Price</label>
                    <input 
                      type="number" 
                      name="price"
                      min="0" step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 outline-none focus:border-slate-800 transition-colors" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Competitor Price</label>
                    <input 
                      type="number" 
                      name="compPrice"
                      min="0" step="0.01"
                      value={form.compPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-800 outline-none focus:border-slate-800 transition-colors" 
                    />
                 </div>
               </div>
            </div>

            <button 
              onClick={handleCalculate} 
              className="mt-8 w-full bg-slate-900 text-white rounded-xl py-4 font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
               <Calculator className="w-5 h-5"/> Calculate Strategy
            </button>
         </div>

         {/* RIGHT: Info Panel to fill the empty space */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-6 shadow-sm">
               <h3 className="font-black text-slate-800 mb-5 text-lg">Why use this calculator?</h3>
               <ul className="space-y-4">
                 <li className="flex gap-4 items-start">
                   <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                   <p className="text-sm font-medium text-slate-600 leading-relaxed"><strong className="text-slate-800 block mb-1">Prevent Losses</strong> Never accidentally price your products below your break-even point during a price war.</p>
                 </li>
                 <li className="flex gap-4 items-start">
                   <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                   <p className="text-sm font-medium text-slate-600 leading-relaxed"><strong className="text-slate-800 block mb-1">Maximize Margins</strong> Instantly see if you have room to raise your prices when a competitor prices themselves too high.</p>
                 </li>
                 <li className="flex gap-4 items-start">
                   <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                   <p className="text-sm font-medium text-slate-600 leading-relaxed"><strong className="text-slate-800 block mb-1">Actionable Tactics</strong> Get clear, firm commands on whether to Hold, Raise, or Bundle your products to survive.</p>
                 </li>
               </ul>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white">
               <h3 className="font-black mb-3 text-lg flex items-center gap-2">Pro Tip 💡</h3>
               <p className="text-slate-300 text-sm font-medium leading-relaxed">
                 A price war is a race to the bottom where everyone loses money. If your competitor drops their price dangerously low, focus on offering <strong className="text-white">better customer service, faster shipping, or product bundles</strong> instead of matching their price!
               </p>
            </div>
         </div>

       </div>

       {/* MODAL POPUP */}
       {result && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-8">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-full animate-fade-in-up">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                 <h3 className="font-black text-slate-800 text-lg">Strategy Report</h3>
                 <button 
                   onClick={() => setResult(null)} 
                   className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                 >
                   <X className="w-5 h-5"/>
                 </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto">
                 
                 {/* Financials List */}
                 <div className="mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Financial Breakdown</h4>
                    <div className="flex justify-between py-3 border-b border-slate-100">
                       <span className="text-sm font-bold text-slate-500">Profit / Unit</span>
                       <span className="text-sm font-black text-slate-800">RM {(result.price - result.cost).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100">
                       <span className="text-sm font-bold text-slate-500">Gross Margin</span>
                       <span className="text-sm font-black text-slate-800">{result.margin.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100">
                       <span className="text-sm font-bold text-slate-500">Difference from Competitor</span>
                       <span className="text-sm font-black text-slate-800">
                         {result.price - result.compPrice >= 0 ? "+" : ""}RM {(result.price - result.compPrice).toFixed(2)}
                       </span>
                    </div>
                 </div>
                 
                 {/* Action Plan Block */}
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Action Plan</h4>
                 <div className={`p-5 rounded-xl border-l-4 ${result.status.border} ${result.status.bg}`}>
                    <p className={`text-sm font-bold leading-relaxed ${result.status.text}`}>
                       {result.status.advice(result.price, result.compPrice, result.margin)}
                    </p>
                 </div>

                 {/* Floor Price */}
                 <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
                    <TrendingDown className="w-4 h-4" />
                    <p className="text-[11px] font-bold">
                      Absolute minimum selling price: <span className="text-slate-600 font-black">RM {(result.cost * 1.05).toFixed(2)}</span>
                    </p>
                 </div>

              </div>
           </div>
         </div>
       )}
    </div>
  );
}
