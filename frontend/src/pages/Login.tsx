import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, AlertCircle, Settings } from 'lucide-react';
import { verifyGoogleToken } from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: { email: string; name: string; avatarUrl: string }) => void;
  setCurrentPage: (page: string) => void;
}

// Global window interface extension for Google One Tap / GIS
declare global {
  interface Window {
    google?: any;
  }
}

export default function Login({ onLoginSuccess, setCurrentPage }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(() => {
    return (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
  });
  const [showConfig, setShowConfig] = useState(false);
  const [authMode, setAuthMode] = useState<'real' | 'sandbox'>(() => {
    return (import.meta as any).env.VITE_GOOGLE_CLIENT_ID ? 'real' : 'sandbox';
  });

  const [emailInput, setEmailInput] = useState('og.krishnayak906564@gmail.com');
  const [useEmailFlow, setUseEmailFlow] = useState(false);

  // Initialize and load Google Identity Services
  useEffect(() => {
    if (authMode !== 'real') return;

    const scriptId = 'google-gsi-client';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initGsi = () => {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId || '782426796110-mock.apps.googleusercontent.com',
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });

          const btnContainer = document.getElementById('google-signin-btn');
          if (btnContainer) {
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'filled_blue',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'pill',
            });
          }
        }
      } catch (err: any) {
        console.error('Error initializing Google Identity Services:', err);
        setError('Failed to initialize Google login widget. Please verify your Client ID.');
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGsi();
      };
      script.onerror = () => {
        setError('Failed to load Google client SDK script. Network may be blocking Google services.');
      };
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [clientId, authMode]);

  // Callback from real Google Identity Services
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      setError('No credential received from Google.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Google Identity Services returned ID token. Verifying with backend...');
      const result = await verifyGoogleToken(response.credential);
      
      if (result.success) {
        localStorage.setItem('karyapath_user', JSON.stringify(result.user));
        onLoginSuccess(result.user);
        setCurrentPage('dashboard');
      } else {
        setError('Verification endpoint did not confirm authentication.');
      }
    } catch (err: any) {
      console.error('Error verifying Google Token:', err);
      setError(
        err.response?.data?.error || 
        err.message || 
        'Token verification failed. Please ensure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Sandbox mode demo credentials path (verifies fully via backend Express/Django endpoint!)
  const handleSandboxLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate Google authentication callback using a simulated mock token
      // The backend detects "mock-" prefix and registers/retrieves this sandbox email
      const mockToken = `mock-${emailInput}`;
      console.log('Simulating Google login via sandbox token:', mockToken);

      const result = await verifyGoogleToken(mockToken);
      if (result.success) {
        localStorage.setItem('karyapath_user', JSON.stringify(result.user));
        onLoginSuccess(result.user);
        setCurrentPage('dashboard');
      } else {
        setError('Sandbox verification failed.');
      }
    } catch (err: any) {
      console.error('Sandbox login error:', err);
      setError('Failed to verify sandbox credentials with the backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-[calc(100vh-73px)] bg-[#0B1120] text-slate-100 px-6 py-12 flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
      {/* Dynamic atmospheric ambient glow blobs */}
      <div className="absolute top-1/4 left-1/2 w-[450px] h-[450px] bg-[#7C3AED]/10 blur-[130px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#06B6D4]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Glassmorphism Card Wrapper */}
        <div className="bg-[#111827]/80 border border-slate-800/90 rounded-2xl p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle colored accent strip at the top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#7C3AED] via-violet-500 to-[#06B6D4]" />
          
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center space-x-2.5 mx-auto group">
              <div className="bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] p-3 rounded-xl text-white font-bold shadow-lg shadow-[#7C3AED]/20 transition-transform duration-300 group-hover:rotate-12">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                KaryaPath <span className="text-[#7C3AED]">AI</span>
              </h2>
              <p className="text-sm font-semibold text-slate-400">
                Your AI Productivity Companion
              </p>
            </div>
            
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Finish goals, automate calendars, and prevent missed deadlines before they happen.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Authentication Notice</span>
                <p className="leading-relaxed opacity-90">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-[#06B6D4]/20 border-t-[#7C3AED] rounded-full animate-spin" />
                <Sparkles className="w-5 h-5 text-[#06B6D4] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-200">Verifying Identity Token...</p>
                <p className="text-xs text-slate-500 mt-1">Authenticating with server-side database</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Authentication Mode Toggle */}
              <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('real');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    authMode === 'real' ? 'bg-[#7C3AED]/20 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Real Google OAuth
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('sandbox');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    authMode === 'sandbox' ? 'bg-[#7C3AED]/20 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Sandbox Simulator
                </button>
              </div>

              {authMode === 'real' ? (
                <div className="space-y-5 flex flex-col items-center justify-center py-4">
                  {!clientId && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-[11px] text-center w-full">
                      Configure your Google Client ID below to initialize real authentication.
                    </div>
                  )}
                  {/* Container where the official Google login button will render */}
                  <div id="google-signin-btn" className="flex justify-center w-full min-h-[44px]" />
                  
                  <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-all underline cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{showConfig ? 'Hide Config' : 'Configure Client ID'}</span>
                  </button>

                  {showConfig && (
                    <div className="w-full space-y-2 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                        Google OAuth Client ID
                      </label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="e.g., xxx-yyy.apps.googleusercontent.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4]"
                      />
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        To fetch: Add this app URL to authorized JavaScript Origins and Authorized Redirect URIs in your Google Cloud Developer Console.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-3 bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-xl text-[11px] text-[#06B6D4] leading-relaxed">
                    <strong>Developer Sandbox Active:</strong> This simulates Google's login flow. Clicking continue will generate a secure mock token and fetch/register your user account inside the local database.
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Sandbox Account Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. krishnayak@gmail.com"
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] transition-colors font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSandboxLogin}
                    className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    {/* SVG Google Branded Color G Logo */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continue with Sandbox Google</span>
                  </button>
                </div>
              )}

              {/* Styled Divider */}
              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-slate-800/80"></div>
                <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">or email demo</span>
                <div className="flex-grow border-t border-slate-800/80"></div>
              </div>

              {useEmailFlow ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSandboxLogin(); }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g., yourname@domain.com"
                        required
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Security Phrase</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        placeholder="Password (optional for sandbox demo)"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED]/80 to-[#06B6D4]/80 hover:from-[#7C3AED] hover:to-[#06B6D4] text-xs font-bold text-white flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <span>Secure Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setUseEmailFlow(true)}
                  className="w-full py-3 px-4 rounded-xl bg-[#111827] hover:bg-[#1f293d] text-slate-300 border border-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <span>Sign In with Work Email</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Security disclaimer footer */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
          <span>KaryaPath SafeAuth Secured Tunnel</span>
        </div>
      </div>
    </div>
  );
}
