import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

/**
 * Main AuthPage container managing active view mode ('login' or 'signup').
 * Can be rendered directly as a standalone page or integrated into main router/App.
 */
export default function AuthPage({ initialMode = 'login', onLoginSuccess, onGoToDashboard }) {
  const [mode, setMode] = useState(initialMode);

  return (
    <AuthLayout
      currentMode={mode}
      onToggleMode={() => setMode((prev) => (prev === 'login' ? 'signup' : 'login'))}
      onGoToDashboard={onGoToDashboard}
    >
      {mode === 'login' ? (
        <LoginForm
          onSwitchToSignup={() => setMode('signup')}
          onSuccess={onLoginSuccess}
        />
      ) : (
        <SignupForm
          onSwitchToLogin={() => setMode('login')}
          onSuccess={onLoginSuccess}
        />
      )}
    </AuthLayout>
  );
}
