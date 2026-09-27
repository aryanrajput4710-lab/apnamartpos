import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Loader2, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      if (!email && emailInputRef.current) emailInputRef.current.focus();
      else if (!password && passwordInputRef.current) passwordInputRef.current.focus();
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/');
      } else {
        navigate('/pos');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Server unavailable. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = (e) => {
    e.target.style.borderColor = '#2563eb';
    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
  };

  const handleInputBlur = (e) => {
    e.target.style.borderColor = error ? '#fca5a5' : '#e2e8f0';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundImage: 'url("/store-bg.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      fontFamily: '"Inter", "Plus Jakarta Sans", system-ui, sans-serif',
      padding: '20px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.35)', // Dark overlay to ensure form readability
        backdropFilter: 'blur(3px)', // Subtle blur to keep focus on the login card
        WebkitBackdropFilter: 'blur(3px)',
        zIndex: 0
      }} />

      {/* Login Card */}
      <div className="login-card" style={{ 
        position: 'relative',
        zIndex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Almost solid white for readability
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '40px 36px', 
        borderRadius: '24px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset', 
        width: '100%', 
        maxWidth: '440px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxSizing: 'border-box',
        animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Header & Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="/apna-mart-logo.jpg" 
            alt="Apna Mart Logo" 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              display: 'inline-block',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }} 
          />
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              margin: '0 0 4px 0', 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <span style={{ color: '#0f172a' }}>Apna</span>
              <span style={{ color: '#2563eb' }}>Mart</span>
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              Better Products · Better Life
            </p>
          </div>
          
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '28px', 
            fontWeight: '800', 
            color: '#0f172a', 
            letterSpacing: '-0.02em' 
          }}>
            Welcome back
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '15px', 
            color: '#64748b',
            fontWeight: '400'
          }}>
            Sign in to your Apna Mart account
          </p>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            color: '#b91c1c', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginBottom: '24px', 
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #fecaca',
            animation: 'fadeIn 0.3s ease'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: '500', lineHeight: '1.4' }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Email Field */}
          <div>
            <label 
              htmlFor="email"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}
            >
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <input 
                id="email"
                ref={emailInputRef}
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                autoComplete="email"
                style={{ 
                  width: '100%', 
                  height: '52px',
                  padding: '0 16px 0 44px', 
                  border: `1px solid ${error && !email ? '#fca5a5' : '#e2e8f0'}`, 
                  borderRadius: '12px',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <input 
                id="password"
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                autoComplete="current-password"
                style={{ 
                  width: '100%', 
                  height: '52px',
                  padding: '0 48px 0 44px', 
                  border: `1px solid ${error && !password ? '#fca5a5' : '#e2e8f0'}`, 
                  borderRadius: '12px',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="••••••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'color 0.2s, background-color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '8px',
              width: '100%', 
              height: '52px',
              backgroundColor: loading ? '#93c5fd' : '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background-color 0.2s, transform 0.1s, box-shadow 0.2s',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.25)'
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#2563eb'; }}
            onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {loading ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          fontSize: '13px',
          color: '#64748b',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          © {new Date().getFullYear()} Apna Mart. All rights reserved.
        </div>
      </div>
      
      {/* Global styles for animation & mobile responsiveness */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Mobile adjustments to prevent tiny scaling */
        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px !important;
            border-radius: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
