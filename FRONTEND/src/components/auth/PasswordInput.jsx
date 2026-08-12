import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 * Reusable accessible PasswordInput component with Show/Hide toggle icon.
 */
export default function PasswordInput({
  id,
  name,
  label = 'Password',
  value,
  onChange,
  placeholder = '••••••••',
  error,
  helperText,
  required = false,
  autoComplete = 'current-password',
  disabled = false,
  className = '',
  rightElement,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700 tracking-wide">
            {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
          </label>
          {rightElement}
        </div>
      )}
      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Lock className="h-4 w-4" />
        </div>
        <input
          id={id}
          name={name || id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={`block w-full text-sm rounded-lg transition-colors py-2.5 pl-9 pr-10 ${
            error
              ? 'border-rose-500 text-rose-900 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30'
              : 'border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-slate-400'
          } ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus:text-blue-600 cursor-pointer disabled:cursor-not-allowed"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-rose-600 font-medium flex items-center space-x-1 mt-1 animate-fadeIn">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
