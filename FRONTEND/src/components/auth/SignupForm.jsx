import React, { useState, useMemo } from 'react';
import { User, Building2, Mail, ShieldCheck, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import TextInput from './TextInput';
import PasswordInput from './PasswordInput';
import PrimaryButton from './PrimaryButton';

/**
 * Helper to compute password strength score (0 to 4)
 */
function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
  if (score === 2 || score === 3) return { score, label: 'Medium', color: 'bg-amber-500', text: 'text-amber-600' };
  return { score, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
}

/**
 * SignupForm component for registering new disaster response personnel.
 */
export default function SignupForm({ onSwitchToLogin, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    orgName: '',
    role: 'District Disaster Officer',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Password strength calculation
  const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!formData.orgName.trim()) {
      newErrors.orgName = 'Organization / Agency name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Official Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must accept the Terms of Service and Data Usage Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    if (!validateForm()) return;

    setLoading(true);

    // Simulate registration API call
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Account created successfully! Submitted for District Admin verification.');
      if (onSuccess) {
        setTimeout(() => onSuccess(formData), 1500);
      }
    }, 1600);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/90 p-6 sm:p-8 backdrop-blur-xs relative overflow-hidden">
      
      {/* Top Card Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700" />

      {/* Headline & Subtext */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Create your account
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Get access to the real-time disaster command console
        </p>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        
        {/* Full Name */}
        <TextInput
          id="signup-fullname"
          name="name"
          label="Full Name"
          placeholder="e.g. Commander Rajesh Kumar"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          error={errors.fullName}
          icon={User}
          required
          autoComplete="name"
        />

        {/* Organization / Agency Name */}
        <TextInput
          id="signup-org"
          name="organization"
          label="Organization / Agency Name"
          placeholder="e.g. Assam State Disaster Management Authority (ASDMA)"
          value={formData.orgName}
          onChange={(e) => handleChange('orgName', e.target.value)}
          error={errors.orgName}
          icon={Building2}
          required
          autoComplete="organization"
        />

        {/* Role Select Dropdown */}
        <div className="space-y-1.5">
          <label htmlFor="signup-role" className="block text-xs font-semibold text-slate-700 tracking-wide">
            Assigned Operational Role <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <UserCheck className="h-4 w-4" />
            </div>
            <select
              id="signup-role"
              name="role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="block w-full text-sm rounded-lg border border-slate-300 bg-white text-slate-900 py-2.5 pl-9 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-400 transition-colors"
            >
              <option value="District Disaster Officer">District Disaster Officer</option>
              <option value="NGO Responder">NGO Responder (SDRF / Red Cross)</option>
              <option value="Municipal Admin">Municipal Admin</option>
              <option value="Observer">Observer / Field Analyst</option>
            </select>
          </div>
        </div>

        {/* Official Email */}
        <TextInput
          id="signup-email"
          name="email"
          type="email"
          label="Official Work Email"
          placeholder="officer.name@disaster-dept.gov.in"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          icon={Mail}
          required
          autoComplete="email"
          inputMode="email"
        />

        {/* Password field */}
        <PasswordInput
          id="signup-password"
          name="new-password"
          label="Password"
          placeholder="Min 8 chars (letters, numbers & symbols)"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          required
          autoComplete="new-password"
        />

        {/* Password Strength Meter Bar */}
        {formData.password && (
          <div className="space-y-1 pt-1 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-slate-500">Password Strength:</span>
              <span className={strength.text}>{strength.label}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex space-x-1">
              <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`} />
              <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`} />
              <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`} />
              <div className={`h-full flex-1 transition-all duration-300 ${strength.score >= 4 ? strength.color : 'bg-slate-200'}`} />
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <PasswordInput
          id="signup-confirmpassword"
          name="confirm-password"
          label="Confirm Password"
          placeholder="Re-enter password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />

        {/* Terms of Service Checkbox */}
        <div className="pt-1">
          <label htmlFor="agree-terms" className="flex items-start space-x-2.5 cursor-pointer group">
            <input
              id="agree-terms"
              type="checkbox"
              checked={formData.agreeTerms}
              onChange={(e) => handleChange('agreeTerms', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
            />
            <span className="text-xs text-slate-600 leading-tight">
              I agree to the{' '}
              <a
                href="#terms"
                onClick={(e) => { e.preventDefault(); alert('Terms of Service: Authorized disaster response personnel only.'); }}
                className="font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="#privacy"
                onClick={(e) => { e.preventDefault(); alert('Data Usage Policy: All telemetry and flood zone spatial data is classified.'); }}
                className="font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2"
              >
                Data Usage Policy
              </a>
              .
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-xs text-rose-600 font-medium flex items-center space-x-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errors.agreeTerms}</span>
            </p>
          )}
        </div>

        {/* Primary Create Account Button */}
        <div className="pt-2">
          <PrimaryButton
            type="submit"
            loading={loading}
            className="w-full"
          >
            Create Account
          </PrimaryButton>
        </div>

      </form>

      {/* Trust & Verification Note (Government / Emergency Response) */}
      <div className="mt-5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start space-x-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-snug">
          <strong className="font-semibold text-slate-700">Responder Verification:</strong> Accounts for official responders are verified by District Command before live dashboard access is granted.
        </p>
      </div>

      {/* Footer link to Sign in */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>

    </div>
  );
}
