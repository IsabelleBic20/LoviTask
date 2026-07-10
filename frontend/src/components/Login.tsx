import React, { useState, useEffect } from 'react';
import { loviTaskAPI } from '../services/api';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_LOGIN_SUCCESS') {
        const googleEmail = event.data.email;
        setIsLoading(true);
        setError('');
        try {
          const data = await loviTaskAPI.googleLogin(googleEmail);
          
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('lovitask_user', data.email);
          storage.setItem('lovitask_jwt', data.token);
          storage.setItem('lovitask_logged_in', 'true');

          onLoginSuccess(data.email);
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Erro ao autenticar com o Google no backend.';
          setError(msg);
        } finally {
          setIsLoading(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [rememberMe, onLoginSuccess]);

  // Prefill mock credentials for easy testing
  const handlePrefill = () => {
    setEmail('isabelle@lovitask.com');
    setPassword('123456');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor, insira o seu e-mail.');
      return;
    }
    if (!password) {
      setError('Por favor, insira a sua senha.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await loviTaskAPI.login(email, password);
      
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('lovitask_user', data.email);
      storage.setItem('lovitask_jwt', data.token);
      storage.setItem('lovitask_logged_in', 'true');

      onLoginSuccess(data.email);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'E-mail ou senha incorretos ou erro de conexão com o servidor.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginClick = () => {
    setError('');
    const width = 480;
    const height = 580;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      '/google-login.html',
      'GoogleLoginPopup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );
  };

  const handleOAuthLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const mockEmail = `convidado_${provider.toLowerCase()}@lovitask.com`;
      const mockToken = 'mock_oauth_jwt_token_123456';
      
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('lovitask_user', mockEmail);
      storage.setItem('lovitask_jwt', mockToken);
      storage.setItem('lovitask_logged_in', 'true');
      
      onLoginSuccess(mockEmail);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-hidden px-4">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:border-slate-700/80 text-center">
          
          {/* Header & Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-6 animate-bounce-slow">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              LoviTask
            </h1>
            <p className="text-slate-400 mt-2 text-sm font-medium">
              Assistente Cognitivo Adaptativo
            </p>
          </div>

          <div className="text-slate-300 text-sm mb-8 leading-relaxed">
            Bem-vindo! Conecte-se com sua conta Google para gerenciar seus brain dumps, acessar métricas e otimizar sua produtividade de forma adaptativa.
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 text-left animate-headshake">
              <svg className="w-5 h-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Large Google Login Button */}
          <button
            onClick={handleGoogleLoginClick}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl shadow-xl hover:shadow-indigo-500/10 border border-slate-200 hover:border-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-75 disabled:active:scale-100"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.3-.177-1.862H12.24z"/>
                </svg>
                <span>Fazer login com o Google</span>
              </>
            )}
          </button>

          {/* Privacy Note */}
          <div className="mt-8 text-xs text-slate-500 leading-relaxed">
            Ao entrar, você concorda com o compartilhamento do seu perfil de e-mail para fins de personalização cognitiva no LoviTask.
          </div>
        </div>
      </div>
    </div>
  );
};
