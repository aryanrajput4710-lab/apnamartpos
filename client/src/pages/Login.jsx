import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

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
      background: 'linear-gradient(135deg, #f8fafc 0%, #eef4ff 100%)',
      fontFamily: '"Inter", "Plus Jakarta Sans", system-ui, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      
      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '40px 32px', 
        borderRadius: '24px', 
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)', 
        width: '100%', 
        maxWidth: '420px',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxSizing: 'border-box'
      }}>
        
        {/* Header & Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-flex',
            padding: '4px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            marginBottom: '24px'
          }}>
            <img 
              src="/apna-mart-logo.jpg" 
              alt="Apna Mart Logo" 
              style={{ 
                width: '72px', 
                height: '72px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                display: 'block'
              }} 
            />
          </div>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '28px', 
            fontWeight: '700', 
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
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}
            >
              Email address
            </label>
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
                padding: '0 16px', 
                border: `1px solid ${error && !email ? '#fca5a5' : '#e2e8f0'}`, 
                borderRadius: '12px',
                fontSize: '15px',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="admin@example.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="password"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
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
                  padding: '0 48px 0 16px', 
                  border: `1px solid ${error && !password ? '#fca5a5' : '#e2e8f0'}`, 
                  borderRadius: '12px',
                  fontSize: '15px',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
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
              marginTop: '4px',
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
              boxShadow: loading ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.2)'
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
              'Sign in'
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '32px',
        fontSize: '13px',
        color: '#94a3b8',
        textAlign: 'center',
        fontWeight: '500'
      }}>
        © 2026 Apna Mart · All rights reserved
      </div>
      
      {/* Global styles for animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
