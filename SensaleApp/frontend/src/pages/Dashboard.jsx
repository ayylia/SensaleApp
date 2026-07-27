import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../App";
import FileUploader from "../components/FileUploader";
import { AlertCircle, UploadCloud, Activity, Sparkles, Swords, TrendingUp, ArrowRight, Download, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/* ── Design tokens (Premium Apple-style Analytics) ── */
const C = {
  berry:    '#D91656', // Brighter, more modern magenta/berry
  berryLight: '#FFE5EC',
  bg:       '#FAFAFB',
  text:     '#0F172A', // Deeper slate for premium feel
  muted:    '#64748B',
  border:   '#F1F5F9',
  white:    '#ffffff',
  shadow:   '0 10px 40px -10px rgba(0,0,0,0.04)',
  glow:     '0 0 40px rgba(217, 22, 86, 0.15)'
};

const FEATURE_CARDS = [
  {
    name: "AI Copilot",
    desc: "Intelligent assistant for sales strategy.",
    path: "/copilot",
    icon: Sparkles,
  },
  {
    name: "Simulator",
    desc: "Price optimization and margin analysis.",
    path: "/pricewars",
    icon: Swords,
  },
  {
    name: "Forecast",
    desc: "AI-driven seasonal demand prediction.",
    path: "/forecast",
    icon: TrendingUp,
  },
];


/* shared card style (Premium) */
const card = (extra = {}) => ({
  background: '#ffffff',
  borderRadius: '24px',
  padding: '32px',
  border: `1px solid ${C.border}`,
  boxShadow: C.shadow,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  ...extra
});

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const fetchData = useCallback(async (retries = 3) => {
    setLoading(true);
    try { 
      const r = await apiClient.get('/api/dashboard-data'); 
      setData(r.data); 
    } catch (e) { 
      console.error(e); 
      if (retries > 0) {
        console.log(`Retrying backend connection... (${retries} attempts left)`);
        setTimeout(() => fetchData(retries - 1), 3000);
      } else {
        setData(null);
      }
    } finally { 
      if (retries === 0) setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const hoverOn  = (e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = C.glow; e.currentTarget.style.borderColor = '#FFE5EC'; };
  const hoverOff = (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.borderColor = C.border; };

  const exportToCSV = () => {
    if (!data || !data.recent_sales) return;
    const headers = ["Product Name", "Platform", "Sales Volume", "Unit Price", "Total Revenue"];
    const csvContent = [
      headers.join(","),
      ...data.recent_sales.map(s => `"${s.product_name}",${s.platform},${s.sales_volume},${s.unit_price},${s.sales_volume * s.unit_price}`)
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sensale_sales_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportToPDF = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px 100px', position: 'relative', zIndex: 20 }}
      className="animate-fade-in-up">

      {/* ── Page Header & Hero (Premium Mesh Gradient) ── */}
      <div className="business-card" style={{ 
        marginBottom: '48px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '40px', 
        overflow: 'hidden', 
        background: 'radial-gradient(circle at 100% 100%, #FFE5EC 0%, #ffffff 50%, #F8FAFC 100%)',
        borderRadius: '32px', border: 'none',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)'
      }}>
        <div className="flex-1 min-w-[280px] p-6 md:p-12 text-center md:text-left flex flex-col items-center md:items-start">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #D91656 0%, #FF4D85 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(217,22,86,0.3)' }}>
              <Sparkles style={{ width: '22px', height: '22px', color: '#fff' }} />
            </div>
            <p style={{ fontSize: '12px', fontWeight: 800, color: C.berry, letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
              AI Sales Assistant
            </p>
          </div>
          <h2 className="title-font tracking-tight" style={{ fontSize: 'clamp(32px, 8vw, 46px)', fontWeight: 800, color: C.text, margin: '0 0 20px', lineHeight: 1.1 }}>
            Intelligent Pricing <br/><span style={{ color: C.berry }}>& Forecasting.</span>
          </h2>
          <p style={{ fontSize: '16px', color: C.muted, margin: '0 0 32px', lineHeight: 1.6, maxWidth: '440px', fontWeight: 500 }}>
            Sensale empowers micro-online sellers with data-driven price recommendations and intelligent demand forecasting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start w-full max-w-xs sm:max-w-none mx-auto md:mx-0">
            <button className="btn-primary hover:scale-105 transition-transform" style={{ padding: '14px 28px', fontSize: '15px', borderRadius: '14px', background: C.berry, boxShadow: '0 10px 20px rgba(217,22,86,0.2)' }} onClick={() => navigate('/forecast')}>
              Demand Forecast
            </button>
            <button className="hover:scale-105 transition-all" style={{ 
              padding: '14px 28px', borderRadius: '14px', border: `2px solid ${C.border}`, 
              background: '#ffffff', color: C.text, fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
            }} onClick={() => navigate('/pricewars')}>
              Price Recommender
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-1 min-w-[300px] justify-center p-6">
          <div style={{ 
            width: '100%', height: '340px', overflow: 'hidden', borderRadius: '24px', 
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src="/logo.png" 
              alt="Sensale Logo" 
              className="hover:scale-110 transition-transform duration-700"
              style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'drop-shadow(0 30px 40px rgba(217,22,86,0.15))' }} 
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <h3 className="title-font" style={{ fontSize: '20px', fontWeight: 400, color: C.berry, margin: 0 }}>
          Business Overview
        </h3>
        <div style={{ height: '1px', flex: 1, background: C.border, marginLeft: '20px' }} />
        {data && (
          <div style={{ display: 'flex', gap: '12px' }} className="print:hidden">
            <button onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'white', color: C.text, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <Download style={{ width: '16px', height: '16px', color: C.berry }} /> Export CSV
            </button>
          </div>
        )}
      </div>

        {data?.recent_sales?.length > 0 && (
          <button
            onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              borderRadius: '100px', background: 'white',
              border: `1px solid ${C.berry}`, fontFamily: 'inherit',
              fontSize: '12px', fontWeight: 700, color: C.berry,
              cursor: 'pointer', transition: 'all 0.3s ease',
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: '24px'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(176, 0, 88, 0.08)'; e.currentTarget.style.color = C.berry; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = C.berry; }}
          >
            <UploadCloud style={{ width: '14px', height: '14px' }} /> Upload Data
          </button>
        )}

      {/* ── Loading ── */}
      {loading ? (
        <div style={{ marginTop: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: `3px solid ${C.border}`,
            borderTop: `3px solid ${C.berry}`,
          }} className="animate-spin" />
          <p style={{ fontSize: '11px', fontWeight: 800, color: C.berry, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Synchronizing with AI Backend Server...
          </p>
          <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>
            (If backend was sleeping, please allow up to 30s to boot)
          </p>
        </div>

      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {data.recent_sales?.length === 0 && (
            <div className="animate-fade-in-up">
              <FileUploader onUploadComplete={() => setRefreshKey(k => k + 1)} />
            </div>
          )}

          {/* ── KPI Row ── */}
          <div className="animate-fade-in-up delay-100"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

            {/* Total Revenue */}
            <div style={card({ background: 'white' })} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: C.berry, letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
                  Revenue
                </p>
                <Activity style={{ width: '20px', height: '20px', color: C.berry, opacity: 0.4 }} />
              </div>
              <p className="title-font" style={{ fontSize: '36px', fontWeight: 400, color: C.text, margin: 0 }}>
                RM {data.total_revenue?.toLocaleString()}
              </p>
              <div style={{ width: '30px', height: '1px', background: C.berry, marginTop: '12px', opacity: 0.3 }} />
            </div>

            {/* Inventory */}
            <div style={{ ...card({ background: 'rgba(176, 0, 88, 0.03)' }), border: 'none' }} onClick={() => navigate('/forecast')} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: C.berry, letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
                  Products
                </p>
                <TrendingUp style={{ width: '20px', height: '20px', color: C.berry, opacity: 0.4 }} />
              </div>
              <p className="title-font" style={{ fontSize: '36px', fontWeight: 400, color: C.text, margin: 0 }}>
                {data.active_products}
              </p>
              <div style={{ width: '30px', height: '1px', background: C.berry, marginTop: '12px', opacity: 0.3 }} />
            </div>

            {/* System Alerts */}
            <div style={card({ background: 'white' })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: C.berry, letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>Insights</p>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.recent_alerts?.map((alert, i) => (
                  <li key={i} style={{
                    fontSize: '13px', fontWeight: 500, color: C.text,
                    borderLeft: `2px solid ${C.berry}`, paddingLeft: '12px', lineHeight: 1.5, opacity: 0.8
                  }}>
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Product Performance Quadrant (K-Means) ── */}
          {data.product_clusters && data.product_clusters.length > 0 && (
            <div className="animate-fade-in-up delay-150">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Product Performance Matrix</h3>
                <span style={{ height: '1px', flex: 1, background: C.border }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {["High Performance", "High Volume", "High Value", "Low Performance"].map(cat => {
                  const items = data.product_clusters.filter(c => c.category === cat).sort((a,b) => b.revenue - a.revenue);
                  const colors = {
                    "High Performance": { bg: '#ECFDF5', border: '#10B981', text: '#047857', desc: 'High Vol, High Rev', advice: 'Ensure stock' },
                    "High Volume":      { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8', desc: 'High Vol, Low Rev', advice: 'Bundle to upsell' },
                    "High Value":       { bg: '#FAF5FF', border: '#A855F7', text: '#7E22CE', desc: 'Low Vol, High Rev', advice: 'Run promotions' },
                    "Low Performance":  { bg: '#F3F4F6', border: '#9CA3AF', text: '#4B5563', desc: 'Low Vol, Low Rev', advice: 'Discount / Clear' }
                  };
                  return (
                    <div key={cat} style={{ background: 'white', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                      <div style={{ background: colors[cat].bg, borderBottom: `1px solid ${colors[cat].border}30`, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 800, color: colors[cat].text, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat}</p>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: colors[cat].text, opacity: 0.7, margin: 0, textTransform: 'uppercase' }}>{colors[cat].desc}</p>
                        </div>
                        <div style={{ alignSelf: 'flex-start', background: colors[cat].text, color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Tip: {colors[cat].advice}
                        </div>
                      </div>
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto' }}>
                        {items.length > 0 ? items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} title={`Rev: RM ${item.revenue}`}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                              {item.product_name}
                            </p>
                            <p style={{ fontSize: '11px', fontWeight: 800, color: C.muted, margin: 0, background: C.bg, padding: '2px 6px', borderRadius: '4px' }}>
                              {item.volume} units
                            </p>
                          </div>
                        )) : (
                          <p style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic', margin: 0 }}>No products matched</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Feature Hub ── */}
          <div className="animate-fade-in-up delay-200">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Analytics Engine</h3>
              <span style={{ height: '1px', flex: 1, background: C.border }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {FEATURE_CARDS.map(f => (
                <button key={f.name} onClick={() => navigate(f.path)}
                  className="business-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left', cursor: 'pointer', width: '100%',
                    padding: '24px'
                  }}
                >
                  <div style={{ 
                    width: '52px', height: '52px', borderRadius: '12px', background: 'rgba(176, 0, 88, 0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <f.icon style={{ width: '22px', height: '22px', color: C.berry }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{f.name}</p>
                    <p style={{ fontSize: '13px', color: C.muted, margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
                  </div>
                  <ArrowRight style={{ width: '16px', height: '16px', color: C.muted, marginLeft: 'auto', opacity: 0.5 }} />
                </button>
              ))}
            </div>
          </div>

          {/* ── Recent Transactions ── */}
          {data.recent_sales?.length > 0 && (
            <div className="animate-fade-in-up delay-300">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0 }}>Recent Transactions</h3>
                <span style={{ height: '1px', flex: 1, background: C.border }} />
              </div>
              <div style={card({ padding: '16px' })}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
                  {data.recent_sales?.slice(0, 30).map((sale, i) => (
                      <div key={i} onClick={() => navigate(`/product/${encodeURIComponent(sale.product_name)}`)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                        padding: '16px 20px', borderRadius: '20px', cursor: 'pointer',
                        background: 'transparent', border: `1px solid transparent`,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'translateX(8px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = ''; }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: C.text, margin: '0 0 2px', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sale.product_name}</p>
                        <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '1px', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sale.platform} · {sale.sales_volume} units
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 2px' }}>
                          RM {(sale.sales_volume * sale.unit_price).toLocaleString()}
                        </p>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: C.muted, margin: 0 }}>RM {sale.unit_price}/ea</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upload section */}
          {data.recent_sales?.length > 0 && (
            <div id="upload-section" className="animate-fade-in-up delay-400">
              <FileUploader onUploadComplete={() => setRefreshKey(k => k + 1)} />
            </div>
          )}
          {/* ── Platform Support ── */}
          <div className="animate-fade-in" style={{ marginTop: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <h3 className="title-font" style={{ fontSize: '18px', fontWeight: 700, color: C.text, margin: 0 }}>Integrated Platforms</h3>
              <div style={{ height: '1px', flex: 1, background: C.border }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                { name: 'Shopee', desc: 'Marketplace Integration', stats: 'Live Sync' },
                { name: 'TikTok Shop', desc: 'Social Commerce Analytics', stats: 'Live Sync' },
                { name: 'Instagram', desc: 'Visual Marketing Performance', stats: 'Active' }
              ].map((plat, idx) => (
                <div key={plat.name} className="business-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                   <div style={{ 
                     width: '44px', height: '44px', borderRadius: '10px', 
                     background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                     fontSize: '20px'
                   }}>
                     {['🧡', '🖤', '💜'][idx]}
                   </div>
                   <div style={{ flex: 1 }}>
                     <p className="title-font" style={{ fontSize: '15px', color: C.text, margin: 0 }}>{plat.name}</p>
                     <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>{plat.desc}</p>
                   </div>
                   <div style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', padding: '4px 8px', borderRadius: '4px' }}>
                     {plat.stats}
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      ) : (
        /* Connection Error */
        <div style={{
          marginTop: '80px', background: '#fff', borderRadius: '32px',
          padding: '60px 40px', textAlign: 'center', maxWidth: '440px', margin: '80px auto 0',
          border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(176, 0, 88, 0.05)'
        }} className="animate-fade-in-up">
          <div style={{
            width: '80px', height: '80px', borderRadius: '12px', background: C.berry,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            boxShadow: `0 8px 24px rgba(176, 0, 88, 0.2)`
          }}>
            <AlertCircle style={{ width: '32px', height: '32px', color: '#fff' }} />
          </div>
          <h3 className="title-font" style={{ fontSize: '24px', fontWeight: 400, color: C.berry, margin: '0 0 16px' }}>Connection Issue</h3>
          <p style={{ fontSize: '14px', color: C.text, fontWeight: 500, lineHeight: 1.6, margin: 0, opacity: 0.7 }}>
            Failed to establish a link with the AI engine. Please ensure the FastAPI backend is running.
          </p>
        </div>
      )}
    </div>
  );
}
