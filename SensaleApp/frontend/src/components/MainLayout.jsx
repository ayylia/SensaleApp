import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Activity, Sparkles, Swords, TrendingUp, Search, BarChart2, LayoutDashboard, Shield } from "lucide-react";
import { apiClient } from "../App";

const NAV_ITEMS = [
  { name: 'Overview',   path: '/dashboard', icon: Activity,   accent: '#1F2937' },
  { name: 'Copilot',    path: '/copilot',   icon: Sparkles,   accent: '#EC4899' },
  { name: 'Price Wars', path: '/pricewars', icon: Swords,     accent: '#374151' },
  { name: 'Forecast',   path: '/forecast',  icon: TrendingUp, accent: '#1F2937' },
  { name: 'System Admin', path: '/admin',   icon: Shield,     accent: '#EF4444' },
];

/* ── Design tokens (Professional Business) ── */
const C = {
  berry:    '#B00058',
  bg:       '#F8F9FA',
  text:     '#1F2937',
  muted:    '#6B7280',
  border:   '#E5E7EB',
  white:    '#ffffff',
};

export default function MainLayout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery]               = useState("");
  const [searchResults, setSearchResults]           = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [dropdownPos, setDropdownPos]               = useState({ top: 0, left: 0, width: 0 });
  const searchRef                                   = useRef(null);
  const mobileSearchRef                             = useRef(null);

  // DEMO NOTIFICATION STATE
  const [hasAlert, setHasAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // REPORT MODAL STATE
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubject, setReportSubject] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    // 10 second timer for the demo presentation
    const timer = setTimeout(() => {
      setHasAlert(true);
      setShowToast(true);
      // Auto hide toast after 5 seconds
      setTimeout(() => setShowToast(false), 5000);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const run = async () => {
        try {
          const res = await apiClient.get(`/api/products/search?q=${searchQuery}`);
          setSearchResults(res.data);
          setShowSearchDropdown(true);
        } catch { /* silent */ }
      };
      const t = setTimeout(run, 300);
      return () => clearTimeout(t);
    } else { setSearchResults([]); setShowSearchDropdown(false); }
  }, [searchQuery]);

  useEffect(() => {
    // Check if user is an admin
    const checkAdmin = async () => {
      try {
        const res = await apiClient.get('/api/users/me');
        if (res.data.is_admin === true) {
          setIsAdmin(true);
          // Redirect Admin to admin page if they are somewhere else
          if (location.pathname !== '/admin') {
            navigate('/admin');
          }
        } else {
          setIsAdmin(false);
          // Redirect Seller away from admin page
          if (location.pathname === '/admin') {
            navigate('/dashboard');
          }
        }
      } catch (err) {
        setIsAdmin(false);
      }
    };
    if (currentUser) {
      checkAdmin();
    }
  }, [currentUser, location.pathname, navigate]);

  const handleLogout = async () => { await signOut(auth); navigate("/login"); };
  const isActive = (p) => location.pathname === p || location.pathname.startsWith(p + '/');

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportSubject || !reportMessage) return;
    setReportSubmitting(true);
    try {
      const token = await currentUser.getIdToken();
      await apiClient.post("/api/reports", {
        subject: reportSubject,
        message: reportMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowReportModal(false);
      setReportSubject("");
      setReportMessage("");
      alert("Report submitted successfully to the System Administrator.");
    } catch (err) {
      alert("Failed to submit report.");
    }
    setReportSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: C.bg }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar hidden xl:flex flex-col" style={{ width: '280px', flexShrink: 0, zIndex: 100 }}>

        <div style={{ padding: '0 24px', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <img src="/logo.png" alt="Sensale Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <h1 className="title-font" style={{ fontSize: '24px', color: C.text, margin: 0 }}>Sensale</h1>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {NAV_ITEMS.map(item => {
            // Strict Separation of Roles
            if (isAdmin && item.path !== '/admin') return null; // Admins ONLY see Admin tab
            if (!isAdmin && item.path === '/admin') return null; // Sellers ONLY see Seller tabs
            
            const active = isActive(item.path);
            return (
              <button key={item.name} onClick={() => navigate(item.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '14px 20px', borderRadius: '16px',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: active ? 700 : 500,
                  transition: 'all 0.3s ease',
                  background: active ? 'rgba(176, 0, 88, 0.06)' : 'transparent',
                  color: active ? C.berry : C.muted,
                  border: active ? `1px solid rgba(176, 0, 88, 0.1)` : '1px solid transparent',
                  letterSpacing: '1px', textTransform: 'uppercase'
                }}
              >
                <item.icon style={{ width: '18px', height: '18px', opacity: active ? 1 : 0.6 }} />
                {item.name}
              </button>
            );
          })}
        </nav>
        {/* User footer */}
        <div style={{ padding: '24px 0 0', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px', height: '40px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '14px',
              borderRadius: '10px', background: C.berry,
              boxShadow: `0 4px 10px rgba(176, 0, 88, 0.2)`
            }}>
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.email?.split('@')[0]}
              </p>
              <p style={{ fontSize: '10px', color: C.muted, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>
                {isAdmin ? 'System Administrator' : 'Vendor Account'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 30, background: C.bg }}>

        <div style={{
          position: 'fixed', bottom: '10%', right: '5%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(255,193,204,0.3), transparent 65%)',
          borderRadius: '50%', pointerEvents: 'none', zIndex: 0
        }} />

        <header className="hidden xl:flex" style={{
          height: '80px', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', position: 'sticky', top: 0, zIndex: 40,
          background: C.white,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div ref={searchRef} style={{ position: 'relative', width: '340px' }}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: C.text, pointerEvents: 'none' }} />
            <input type="text" placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => setShowSearchDropdown(false)}
              onFocus={() => {
                if (searchRef.current) {
                  const r = searchRef.current.getBoundingClientRect();
                  setDropdownPos({ top: r.bottom + 6, left: r.left, width: r.width });
                }
                if (searchResults.length > 0) setShowSearchDropdown(true);
              }}
              style={{
                width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                border: `1px solid ${C.border}`, background: '#fff',
                fontSize: '14px', fontWeight: 500, color: C.text, fontFamily: 'inherit',
                transition: 'all 0.3s ease'
              }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = C.berry; e.currentTarget.style.boxShadow = `0 0 0 4px rgba(176, 0, 88, 0.05)`; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Live badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
              borderRadius: '100px', background: C.berry, color: 'white'
            }}>
              <span style={{ position: 'relative', display: 'flex', width: '6px', height: '6px' }}>
                <span className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#fff', opacity: 0.6 }} />
                <span style={{ position: 'relative', width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'block' }} />
              </span>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Active</p>
            </div>

            {/* Support / Report Issue Button (Only for Vendors) */}
            {!isAdmin && (
              <button 
                onClick={() => setShowReportModal(true)}
                style={{ 
                  background: '#F3F4F6', border: 'none', cursor: 'pointer',
                  padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s', fontWeight: 700, fontSize: '12px', color: C.text
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; }}
              >
                <Shield style={{ width: '14px', height: '14px', color: C.berry }} />
                Support
              </button>
            )}

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => { setShowNotifDropdown(!showNotifDropdown); setHasAlert(false); }}
                style={{ 
                  background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative',
                  width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {hasAlert && (
                  <div style={{ position: 'absolute', top: '8px', right: '10px', width: '8px', height: '8px', background: C.berry, borderRadius: '50%', border: '2px solid #fff' }} />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div style={{
                  position: 'absolute', top: '50px', right: 0, width: '320px', background: '#fff',
                  borderRadius: '16px', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', border: `1px solid ${C.border}`,
                  padding: '16px', zIndex: 9999
                }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: C.text, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px' }}>System Alerts</h4>
                  <div 
                    onClick={() => { setShowNotifDropdown(false); navigate('/pricewars'); }}
                    style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', background: '#F8FAFC', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
                  >
                    <Swords style={{ width: '16px', height: '16px', color: C.berry, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Market Price Drop</p>
                      <p style={{ fontSize: '12px', color: C.muted, margin: 0, lineHeight: 1.4 }}>Competitors dropped prices on Wireless Earbuds. Review your pricing strategy to protect margins.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <header className="xl:hidden" style={{
          paddingTop: 'env(safe-area-inset-top)', position: 'sticky', top: 0, zIndex: 40,
          background: '#fff',
          borderBottom: `1px solid ${C.border}`
        }}>
          <div style={{ display: 'flex', height: '64px', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/logo.png" alt="Sensale" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              <h1 className="title-font" style={{ fontSize: '20px', fontWeight: 400, margin: 0 }}>Sensale</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {!isAdmin && (
                <button onClick={() => setShowReportModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                  <Shield style={{ width: '14px', height: '14px', color: C.berry }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: C.text }}>Support</span>
                </button>
              )}
              <button onClick={handleLogout} style={{ fontSize: '11px', color: C.muted, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', padding: 0 }}>Log out</button>
            </div>
          </div>
          <div style={{ padding: '0 20px 10px 20px' }}>
            <div ref={mobileSearchRef} style={{ position: 'relative', width: '100%' }}>
              <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: C.text, pointerEvents: 'none' }} />
              <input type="text" placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onBlur={() => setShowSearchDropdown(false)}
                onFocus={() => {
                  if (mobileSearchRef.current) {
                    const r = mobileSearchRef.current.getBoundingClientRect();
                    setDropdownPos({ top: r.bottom + 6, left: r.left, width: r.width });
                  }
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                style={{
                  width: '100%', height: '40px', padding: '0 16px 0 38px', borderRadius: '14px',
                  background: 'rgba(0,0,0,0.03)', border: 'none', fontSize: '13px', fontWeight: 600,
                  color: C.text, outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        </header>

        <div className="pb-32 xl:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="xl:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: '#fff',
        borderTop: `1px solid ${C.border}`,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        <div style={{ display: 'flex', height: '64px' }}>
          {NAV_ITEMS.map(item => {
            // Strict Separation of Roles
            if (isAdmin && item.path !== '/admin') return null;
            if (!isAdmin && item.path === '/admin') return null;
            
            const active = isActive(item.path);
            return (
              <button key={item.name} onClick={() => navigate(item.path)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  color: active ? C.berry : C.muted, position: 'relative', transition: 'color 0.2s'
                }}>
                <item.icon style={{ width: '18px', height: '18px', color: active ? C.berry : C.muted }} />
                <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══ SEARCH DROPDOWN PORTAL ══ */}
      {showSearchDropdown && searchResults.length > 0 && (
        <div
          onMouseDown={e => e.preventDefault()}
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            background: '#fff', borderRadius: '20px', zIndex: 9999,
            boxShadow: '0 15px 40px rgba(0,0,0,0.06)',
            border: `1px solid ${C.border}`, padding: '12px'
          }}
        >
          {searchResults.map((prod, i) => (
            <button key={i}
              onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); navigate(`/product/${encodeURIComponent(prod)}`); }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: '13px', fontWeight: 600,
                color: C.text, background: 'transparent', border: 'none', borderRadius: '12px',
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(176, 0, 88, 0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Search style={{ width: '12px', height: '12px', opacity: 0.4 }} /> {prod}
            </button>
          ))}
        </div>
      )}

      {/* ══ AI NOTIFICATION TOAST (DEMO) ══ */}
      <div 
        style={{
          position: 'fixed', top: '90px', right: showToast ? '32px' : '-400px',
          width: '340px', background: '#fff', borderRadius: '16px', padding: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)', border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.berry}`,
          transition: 'right 0.5s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 9999,
          cursor: 'pointer'
        }}
        onClick={() => { setShowToast(false); navigate('/pricewars'); }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(217, 22, 86, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: '18px', height: '18px', color: C.berry }} />
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 800, color: C.berry, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>AI Alert Detected</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.4 }}>Competitor dropped prices on Wireless Earbuds. Review recommended adjustment.</p>
          </div>
        </div>
      </div>

      {/* ══ REPORT ISSUE MODAL ══ */}
      {showReportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div className="animate-fade-in-up" style={{
            background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '24px',
            padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid ${C.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(176,0,88,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield style={{ width: '20px', height: '20px', color: C.berry }} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Contact Support</h3>
                <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Report an issue to the System Administrator.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.text, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject</label>
                <input required type="text" placeholder="E.g., Bug with Sales Dashboard"
                  value={reportSubject} onChange={e => setReportSubject(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}`, background: '#F9FAFB', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                  onFocus={e => { e.currentTarget.style.borderColor = C.berry; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(176,0,88,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.text, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message Details</label>
                <textarea required placeholder="Describe the issue you are facing..." rows={4}
                  value={reportMessage} onChange={e => setReportMessage(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${C.border}`, background: '#F9FAFB', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'none' }}
                  onFocus={e => { e.currentTarget.style.borderColor = C.berry; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(176,0,88,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowReportModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`, background: '#fff', color: C.text, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={reportSubmitting} className="btn-primary"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}
                >
                  {reportSubmitting ? "Submitting..." : "Send Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
