import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import TextInput from './TextInput';
import PasswordInput from './PasswordInput';
import PrimaryButton from './PrimaryButton';
import { useSentinel } from '../../context/SentinelContext';

/**
 * LoginForm component for SentinelPlan Nagpur disaster response officers.
 * Includes inline validation, show/hide password, SSO, and demo auto-fill.
 */
export default function LoginForm({ onSwitchToSignup, onSuccess }) {
  const { login } = useSentinel();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Official Email or Username is required';
    } else if (email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    if (!validateForm()) return;

    setLoading(true);

    // Simulate authentication API request
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Authentication successful! Directing to Nagpur Command Center...');
      const userData = {
        name: 'Commander Rajesh Sharma',
        email: email || 'officer.nagpur@sentinelplan.gov.in',
        role: 'Nagpur Disaster Response Officer',
        org: 'Nagpur Municipal Corporation (NMC)',
      };
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(userData);
        } else {
          login(userData);
        }
      }, 1000);
    }, 1200);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/90 p-6 sm:p-8 backdrop-blur-xs relative overflow-hidden">
      
      {/* Top Card Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-600" />

      {/* Headline & Subtext */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Sign in to Nagpur Flood Command Center
        </p>
      </div>



      {/* Success Notification */}
      {successMsg && (
        <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        
        {/* Email or Username */}
        <TextInput
          id="login-email"
          name="username"
          type="email"
          label="Official Email / Username"
          placeholder="officer.nagpur@sentinelplan.gov.in"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
          error={errors.email}
          icon={Mail}
          required
          autoComplete="username"
          inputMode="email"
        />

        {/* Password field */}
        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
          }}
          error={errors.password}
          required
          autoComplete="current-password"
          rightElement={
            <a
              href="#forgot-password"
              onClick={(e) => {
                e.preventDefault();
                alert('Password reset link dispatched to your registered Nagpur NMC official address.');
              }}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 transition-colors cursor-pointer"
            >
              Forgot password?
            </a>
          }
        />

        {/* Remember me Checkbox */}
        <div className="flex items-center justify-between pt-1">
          <label htmlFor="remember-me" className="flex items-center space-x-2 cursor-pointer group">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">
              Remember me on this workstation
            </span>
          </label>
        </div>

        {/* Primary Sign In Button */}
        <div className="pt-2">
          <PrimaryButton
            type="submit"
            loading={loading}
            icon={ArrowRight}
            className="w-full"
          >
            Sign In to Nagpur Command Center
          </PrimaryButton>
        </div>

      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-white px-3 text-slate-400 font-medium">
            or continue with SSO
          </span>
        </div>
      </div>

      {/* Institutional SSO Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => alert('Redirecting to Government Workspace Portal...')}
          className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c-.6-1.6-1-3.5-1-5.4z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.1C3.7 19.8 7.5 23 12 23z"/>
          </svg>
          <span>Google Work</span>
        </button>

        <button
          type="button"
          onClick={() => alert('Redirecting to Gov Cloud ID...')}
          className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z"/>
            <path fill="#81bc06" d="M12 1h10v10H12z"/>
            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
            <path fill="#ffba08" d="M12 12h10v10H12z"/>
          </svg>
          <span>Microsoft ID</span>
        </button>
      </div>

      {/* Footer link to Signup */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          Don't have an officer account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-bold text-cyan-600 hover:text-cyan-800 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Sign up for access
          </button>
        </p>
      </div>

    </div>
  );
}
