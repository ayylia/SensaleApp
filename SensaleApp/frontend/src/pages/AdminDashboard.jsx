import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../App";
import { Shield, Trash2, Users, AlertTriangle } from "lucide-react";

const C = {
  berry:    '#D91656',
  bg:       '#FAFAFB',
  text:     '#0F172A',
  muted:    '#64748B',
  border:   '#F1F5F9',
  white:    '#ffffff',
};

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsersAndReports = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, reportsRes] = await Promise.all([
        apiClient.get('/api/admin/users'),
        apiClient.get('/api/admin/reports')
      ]);
      setUsers(usersRes.data);
      setReports(reportsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsersAndReports(); }, [fetchUsersAndReports]);

  const deleteUser = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete ${email}? This will wipe all their data forever.`)) return;
    try {
      await apiClient.delete(`/api/admin/users/${id}`);
      fetchUsersAndReports();
    } catch (err) {
      console.error("Failed to delete user");
    }
  };

  const resolveReport = async (id) => {
    try {
      await apiClient.delete(`/api/admin/reports/${id}`);
      fetchUsersAndReports();
    } catch (err) {
      console.error("Failed to resolve report");
    }
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px 100px' }} className="animate-fade-in-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield style={{ width: '22px', height: '22px', color: '#fff' }} />
        </div>
        <div>
          <h2 className="title-font" style={{ fontSize: '28px', fontWeight: 800, color: C.text, margin: 0 }}>System Admin</h2>
          <p style={{ fontSize: '14px', color: C.muted, margin: 0, fontWeight: 500 }}>Multi-Tenant Platform Management</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: `1px solid ${C.border}`, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Registered Sellers</p>
            <Users style={{ color: '#3B82F6', width: '20px', height: '20px' }} />
          </div>
          <p style={{ fontSize: '36px', fontWeight: 800, color: C.text, margin: 0 }}>{users.length}</p>
        </div>
        
        <div style={{ background: 'linear-gradient(135deg, #EF4444, #B91C1C)', padding: '24px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#FEE2E2', textTransform: 'uppercase', letterSpacing: '1px' }}>System Status</p>
            <AlertTriangle style={{ color: '#fff', width: '20px', height: '20px' }} />
          </div>
          <p style={{ fontSize: '36px', fontWeight: 800, color: '#fff', margin: 0 }}>Operational</p>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff', margin: '4px 0 0', opacity: 0.8 }}>All APIs Online</p>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', border: `1px solid ${C.border}`, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: '24px' }}>User Management Directory</h3>
        {loading ? (
          <p>Loading platform data...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: 'left' }}>
                <th style={{ padding: '12px 0', fontSize: '12px', color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>ID</th>
                <th style={{ padding: '12px 0', fontSize: '12px', color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>Username</th>
                <th style={{ padding: '12px 0', fontSize: '12px', color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>Email</th>
                <th style={{ padding: '12px 0', fontSize: '12px', color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>Role</th>
                <th style={{ padding: '12px 0', width: '40px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 700, color: C.muted }}>#{u.id}</td>
                  <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 600, color: C.text }}>{u.username}</td>
                  <td style={{ padding: '16px 0', fontSize: '14px', color: C.text }}>{u.email}</td>
                  <td style={{ padding: '16px 0', fontSize: '12px', fontWeight: 800 }}>
                    {u.is_admin ? (
                      <span style={{ background: '#F1F5F9', color: '#0F172A', padding: '4px 8px', borderRadius: '4px' }}>ADMIN</span>
                    ) : (
                      <span style={{ background: 'rgba(217, 22, 86, 0.1)', color: C.berry, padding: '4px 8px', borderRadius: '4px' }}>SELLER</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right' }}>
                    <button onClick={() => deleteUser(u.id, u.email)} disabled={u.is_admin} style={{ background: 'none', border: 'none', color: u.is_admin ? '#cbd5e1' : '#EF4444', cursor: u.is_admin ? 'not-allowed' : 'pointer', padding: '8px', borderRadius: '8px' }}>
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ SYSTEM REPORTS SECTION ══ */}
      <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', border: `1px solid ${C.border}`, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)', marginTop: '40px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: '24px' }}>Vendor System Reports</h3>
        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: '16px' }}>
            <Shield style={{ width: '40px', height: '40px', color: '#94A3B8', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: C.muted, margin: 0 }}>No active reports.</p>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>All systems are running smoothly.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reports.map(report => (
              <div key={report.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', borderRadius: '16px', background: '#F8FAFC', border: `1px solid ${C.border}` }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 8px' }}>{report.subject}</h4>
                  <p style={{ fontSize: '14px', color: C.muted, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{report.message}</p>
                </div>
                <div style={{ marginLeft: '24px', flexShrink: 0 }}>
                  <button onClick={() => resolveReport(report.id)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield style={{ width: '12px', height: '12px' }} />
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
