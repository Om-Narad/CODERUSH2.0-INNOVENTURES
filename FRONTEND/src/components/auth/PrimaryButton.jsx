import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Primary Button component with loading spinner, hover, focus, and disabled states.
 */
export default function PrimaryButton({
  children,
  type = 'submit',
  loading = false,
  disabled = false,
  onClick,
  icon: Icon,
  variant = 'primary', // 'primary' | 'secondary' | 'outline'
  className = '',
  ...props
}) {
  const baseStyles = "w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed select-none";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 focus:ring-blue-600 border border-transparent disabled:bg-blue-400 disabled:shadow-none",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus:ring-blue-500 hover:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400",
    outline: "bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-600 focus:ring-blue-500 disabled:border-blue-300 disabled:text-blue-300",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Please wait...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
