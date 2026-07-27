import { useState } from "react";
import { apiClient } from "../App";
import { Sparkles, Smartphone, Instagram, Video, Loader } from "lucide-react";

const C = {
  berry:    '#D91656',
  bg:       '#FAFAFB',
  text:     '#0F172A',
  muted:    '#64748B',
  border:   '#F1F5F9',
};

export default function Studio() {
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("instagram"); // 'instagram' or 'tiktok'

  const generateMarketing = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/marketing/generate/${encodeURIComponent(productName)}`);
      setResult(res.data);
    } catch (err) {
      setError("Failed to generate marketing copy. Please ensure the product exists.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px 100px' }} className="animate-fade-in-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #D91656 0%, #FF4D85 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles style={{ width: '22px', height: '22px', color: '#fff' }} />
        </div>
        <div>
          <h2 className="title-font" style={{ fontSize: '28px', fontWeight: 800, color: C.text, margin: 0 }}>Sensale Studio</h2>
          <p style={{ fontSize: '14px', color: C.muted, margin: 0, fontWeight: 500 }}>AI-Generated Social Commerce Marketing</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
        
        {/* Left Col: Controls */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: `1px solid ${C.border}`, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: '24px' }}>Campaign Generator</h3>
          
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Target Product Name
          </label>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input 
              type="text" 
              placeholder="e.g. Wireless Earbuds"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              style={{ flex: 1, padding: '14px 16px', borderRadius: '12px', border: `2px solid ${C.border}`, fontSize: '15px', outline: 'none' }}
              onFocus={e => e.currentTarget.style.borderColor = C.berry}
              onBlur={e => e.currentTarget.style.borderColor = C.border}
            />
          </div>

          <button 
            onClick={generateMarketing}
            disabled={loading || !productName}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '14px', background: C.berry, color: '#fff', 
              fontSize: '15px', fontWeight: 700, border: 'none', cursor: (loading || !productName) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              opacity: (loading || !productName) ? 0.7 : 1, transition: 'all 0.3s'
            }}
          >
            {loading ? <Loader className="animate-spin" style={{ width: '20px', height: '20px' }} /> : <Sparkles style={{ width: '20px', height: '20px' }} />}
            {loading ? "Generating Magic..." : "Generate AI Marketing"}
          </button>

          {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '16px', fontWeight: 500 }}>{error}</p>}
        </div>

        {/* Right Col: Phone Mockup */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            width: '320px', height: '640px', background: '#000', borderRadius: '48px', padding: '12px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2), inset 0 0 0 2px #444', position: 'relative'
          }}>
            {/* Notch */}
            <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '24px', background: '#000', borderRadius: '0 0 12px 12px', zIndex: 10 }} />
            
            {/* Screen */}
            <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '36px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              
              {/* App Header */}
              <div style={{ padding: '40px 16px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '16px' }}>
                <button onClick={() => setActiveTab('instagram')} style={{ flex: 1, padding: '8px', border: 'none', background: activeTab === 'instagram' ? '#F3F4F6' : 'transparent', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, color: activeTab === 'instagram' ? '#000' : '#9CA3AF' }}>
                  <Instagram style={{ width: '16px', height: '16px' }} /> IG
                </button>
                <button onClick={() => setActiveTab('tiktok')} style={{ flex: 1, padding: '8px', border: 'none', background: activeTab === 'tiktok' ? '#F3F4F6' : 'transparent', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, color: activeTab === 'tiktok' ? '#000' : '#9CA3AF' }}>
                  <Video style={{ width: '16px', height: '16px' }} /> TikTok
                </button>
              </div>

              {/* Feed Content */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#FAFAFB' }}>
                {!result ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <Smartphone style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
                    <p style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>AI Preview will appear here</p>
                  </div>
                ) : (
                  <div className="animate-fade-in-up">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF4D85, #D91656)' }} />
                      <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>your_store_name</p>
                    </div>
                    <div style={{ width: '100%', aspectRatio: '1', background: '#E5E7EB', borderRadius: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>[ Product Image ]</p>
                    </div>
                    <p style={{ fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      <span style={{ fontWeight: 700 }}>your_store_name</span> {activeTab === 'instagram' ? result.instagram : result.tiktok}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
