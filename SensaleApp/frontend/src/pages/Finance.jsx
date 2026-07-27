import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../App";
import { DollarSign, Plus, Trash2, PieChart, TrendingUp, AlertTriangle } from "lucide-react";

const C = {
  berry:    '#D91656',
  bg:       '#FAFAFB',
  text:     '#0F172A',
  muted:    '#64748B',
  border:   '#F1F5F9',
  white:    '#ffffff',
};

export default function Finance() {
  const [expenses, setExpenses] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, dashRes] = await Promise.all([
        apiClient.get('/api/expenses'),
        apiClient.get('/api/dashboard-data')
      ]);
      setExpenses(expRes.data);
      setRevenue(dashRes.data.total_revenue || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addExpense = async (e) => {
    e.preventDefault();
    if (!newDesc || !newAmount) return;
    try {
      await apiClient.post('/api/expenses', {
        description: newDesc,
        amount: parseFloat(newAmount),
        category: "General"
      });
      setNewDesc("");
      setNewAmount("");
      fetchData();
    } catch (err) {
      console.error("Failed to add expense");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await apiClient.delete(`/api/expenses/${id}`);
      fetchData();
    } catch (err) {
      console.error("Failed to delete");
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = revenue - totalExpenses;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px 100px' }} className="animate-fade-in-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign style={{ width: '22px', height: '22px', color: '#fff' }} />
        </div>
        <div>
          <h2 className="title-font" style={{ fontSize: '28px', fontWeight: 800, color: C.text, margin: 0 }}>Sensale Finance</h2>
          <p style={{ fontSize: '14px', color: C.muted, margin: 0, fontWeight: 500 }}>AI Margin & Expense Tracking</p>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: `1px solid ${C.border}`, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Revenue</p>
            <TrendingUp style={{ color: '#3B82F6', width: '20px', height: '20px' }} />
          </div>
          <p style={{ fontSize: '36px', fontWeight: 800, color: C.text, margin: 0 }}>RM {revenue.toLocaleString()}</p>
        </div>
        
        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: `1px solid ${C.border}`, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Expenses</p>
            <AlertTriangle style={{ color: '#EF4444', width: '20px', height: '20px' }} />
          </div>
          <p style={{ fontSize: '36px', fontWeight: 800, color: C.text, margin: 0 }}>RM {totalExpenses.toLocaleString()}</p>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', padding: '24px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#ECFDF5', textTransform: 'uppercase', letterSpacing: '1px' }}>True Net Profit</p>
            <PieChart style={{ color: '#fff', width: '20px', height: '20px' }} />
          </div>
          <p style={{ fontSize: '36px', fontWeight: 800, color: '#fff', margin: 0 }}>RM {netProfit.toLocaleString()}</p>
          <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '8px', display: 'inline-block' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff', margin: 0 }}>Margin: {profitMargin.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Add Expense Form */}
        <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', border: `1px solid ${C.border}`, height: 'fit-content', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: '24px' }}>Log Expense</h3>
          <form onSubmit={addExpense}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: '8px' }}>Description</label>
            <input required type="text" placeholder="e.g. Facebook Ads" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${C.border}`, marginBottom: '16px', outline: 'none' }} />
            
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: '8px' }}>Amount (RM)</label>
            <input required type="number" step="0.01" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${C.border}`, marginBottom: '24px', outline: 'none' }} />
            
            <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '14px', background: C.text, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Plus style={{ width: '20px', height: '20px' }} /> Add Expense
            </button>
          </form>
        </div>

        {/* Expense List */}
        <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', border: `1px solid ${C.border}`, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: '24px' }}>Expense Ledger</h3>
          {loading ? (
            <p>Loading...</p>
          ) : expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
              <p style={{ fontWeight: 500 }}>No expenses logged yet.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: 'left' }}>
                  <th style={{ padding: '12px 0', fontSize: '12px', color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '12px 0', fontSize: '12px', color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>Description</th>
                  <th style={{ padding: '12px 0', fontSize: '12px', color: C.muted, textTransform: 'uppercase', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 0', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 500, color: C.muted }}>{new Date(e.expense_date).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 700, color: C.text }}>{e.description}</td>
                    <td style={{ padding: '16px 0', fontSize: '15px', fontWeight: 800, color: C.text, textAlign: 'right' }}>RM {e.amount.toFixed(2)}</td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>
                      <button onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}>
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
