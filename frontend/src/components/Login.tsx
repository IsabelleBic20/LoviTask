import React, { useState, useEffect } from 'react';
import { loviTaskAPI } from '../services/api';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, theme, setTheme }) => {
  const [rememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isDarkMode = theme === 'dark';

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('lovitask_theme', newTheme);
  };

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

  const handleGoogleLoginClick = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      '/google-login.html',
      'GoogleLoginPopup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );
  };

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center transition-colors duration-300 px-4 overflow-hidden ${
      isDarkMode ? 'bg-playful-dark text-white' : 'bg-playful-light text-slate-800'
    }`}>
      
      {/* Decorative Floating Blobs */}
      <div className={`absolute top-[-100px] left-[10%] w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none transition-opacity duration-500 ${
        isDarkMode ? 'bg-indigo-900/10' : 'bg-indigo-500/5'
      }`} />
      <div className={`absolute bottom-[-100px] right-[10%] w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none transition-opacity duration-500 ${
        isDarkMode ? 'bg-purple-900/10' : 'bg-purple-500/5'
      }`} />

      {/* Floating shape items (Finch/Duolingo style background decor) */}
      <div className="absolute top-[20%] right-[15%] text-indigo-400/20 text-3xl select-none pointer-events-none font-bold animate-bounce-slow">✦</div>
      <div className="absolute bottom-[20%] left-[15%] text-purple-400/20 text-2xl select-none pointer-events-none font-bold animate-bounce-slow" style={{ animationDelay: '1s' }}>○</div>

      {/* Floating Theme Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-2xl border transition-all duration-200 ${
            isDarkMode 
              ? 'bg-slate-900/80 border-slate-800 text-amber-400 hover:bg-slate-850' 
              : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 shadow-md'
          }`}
          title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          aria-label="Alternar tema de acessibilidade"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className={`border rounded-[28px] p-8 shadow-2xl transition-all duration-300 text-center ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800/80 shadow-slate-950/60' : 'bg-white border-indigo-100 shadow-indigo-100/50'
        }`}>
          
          {/* Header & Logo */}
          <div className="mb-6 flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[20px] bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-4 animate-bounce-slow">
              <span className="text-4xl">🧠</span>
            </div>
            <h1 className={`text-3xl font-black tracking-tight leading-none ${
              isDarkMode ? 'text-white' : 'text-slate-800'
            }`}>
              LoviTask
            </h1>
            <p className={`mt-2.5 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              🌱 Companheiro Cognitivo Adaptativo
            </p>
          </div>

          {/* speech bubble mascot */}
          <div className={`p-4 rounded-[20px] text-xs font-semibold leading-relaxed border relative mb-6 text-left ${
            isDarkMode ? 'bg-slate-950 border-slate-900 text-slate-300' : 'bg-indigo-50/50 border-indigo-100/60 text-slate-700'
          }`}>
            <span className="text-lg absolute top-[12px] right-[12px] animate-pulse">✨</span>
            <p className="font-extrabold mb-1">💬 Lovi diz:</p>
            Olá! Vamos organizar sua mente hoje? Conecte-se com sua conta para começarmos nossa jornada produtiva! (•ᴗ•)
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-[20px] bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-3 text-left animate-headshake">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Large Google Login Button */}
          <button
            onClick={handleGoogleLoginClick}
            disabled={isLoading}
            className={`w-full py-4 px-6 font-black rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-75 disabled:active:scale-100 animate-breathe ${
              isDarkMode 
                ? 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
            }`}
            aria-label="Fazer login com conta do Google"
          >
            {isLoading ? (
              <svg className={`animate-spin h-5 w-5 ${isDarkMode ? 'text-indigo-600' : 'text-white'}`} fill="none" viewBox="0 0 24 24">
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
          <div className={`mt-8 text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Ao entrar, você concorda com o compartilhamento do seu perfil de e-mail para fins de personalização cognitiva no LoviTask.
          </div>
        </div>
      </div>
    </div>
  );
};
