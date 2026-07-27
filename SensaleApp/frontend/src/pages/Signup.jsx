import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../App";
import { Sparkles } from "lucide-react";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      await apiClient.post("/api/users/sync", {
        firebase_uid: userCredential.user.uid,
        email: email,
        username: username
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to create an account. " + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA', position: 'relative', overflow: 'hidden' }}>
      
      {/* Decorative Background */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(176, 0, 88, 0.08), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(176, 0, 88, 0.05), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '440px', padding: '48px', background: '#ffffff', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.05)', position: 'relative', zIndex: 10, border: '1px solid #E5E7EB' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#B00058', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(176, 0, 88, 0.3)' }}>
              <Sparkles style={{ color: '#fff', width: '24px', height: '24px' }} />
            </div>
            <h1 className="title-font" style={{ fontSize: '28px', color: '#1F2937', margin: 0 }}>Sensale</h1>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1F2937', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Create Account</h2>
          <p style={{ fontSize: '15px', color: '#6B7280', margin: 0, fontWeight: 500 }}>Join Sensale to get AI sales insights</p>
        </div>

        {error && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', gap: '12px', color: '#EF4444' }}>
            <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Username
            </label>
            <input
              type="text" required placeholder="Your username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid #E5E7EB',
                background: '#F9FAFB', fontSize: '15px', color: '#1F2937', transition: 'all 0.2s ease',
                outline: 'none', fontFamily: 'inherit'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#B00058'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(176, 0, 88, 0.05)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Email Address
            </label>
            <input
              type="email" required placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid #E5E7EB',
                background: '#F9FAFB', fontSize: '15px', color: '#1F2937', transition: 'all 0.2s ease',
                outline: 'none', fontFamily: 'inherit'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#B00058'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(176, 0, 88, 0.05)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Password
            </label>
            <input
              type="password" required placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid #E5E7EB',
                background: '#F9FAFB', fontSize: '15px', color: '#1F2937', transition: 'all 0.2s ease',
                outline: 'none', fontFamily: 'inherit'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#B00058'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(176, 0, 88, 0.05)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Confirm Password
            </label>
            <input
              type="password" required placeholder="••••••••"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '16px', border: '1px solid #E5E7EB',
                background: '#F9FAFB', fontSize: '15px', color: '#1F2937', transition: 'all 0.2s ease',
                outline: 'none', fontFamily: 'inherit'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#B00058'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(176, 0, 88, 0.05)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '16px', fontSize: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'center' }}
          >
            {loading ? (
                <svg style={{ animation: 'spin 1s linear infinite', height: '20px', width: '20px', color: '#fff' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '15px', color: '#6B7280', fontWeight: 500 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: '#B00058', fontWeight: 700, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
