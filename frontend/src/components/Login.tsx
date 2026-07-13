import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
    <div className={`relative min-h-screen flex flex-col items-center justify-center transition-colors duration-500 px-4 overflow-hidden ${
      isDarkMode ? 'bg-brand-dark text-white' : 'bg-brand-light text-slate-800'
    }`}>
      
      {/* Decorative Ambient Blobs */}
      <div className="absolute top-[-100px] left-[5%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-indigo-400/25 to-purple-500/5 blur-[120px] pointer-events-none ambient-glow" />
      <div className="absolute bottom-[-150px] right-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-400/20 to-pink-500/5 blur-[130px] pointer-events-none ambient-glow" />

      {/* Floating shape items (calming background decor) */}
      <motion.div 
        animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[12%] text-indigo-400/30 text-3xl select-none pointer-events-none font-bold"
      >
        ✦
      </motion.div>
      <motion.div 
        animate={{ y: [0, 8, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[22%] left-[12%] text-purple-400/25 text-2xl select-none pointer-events-none font-bold"
      >
        ○
      </motion.div>

      {/* Floating Theme Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className={`p-3 rounded-2xl border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-900/80 border-slate-800/85 text-amber-400 hover:bg-slate-850' 
              : 'bg-white border-slate-200/90 text-indigo-600 hover:bg-slate-50 shadow-sm'
          }`}
          title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          aria-label="Alternar tema de acessibilidade"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </motion.button>
      </div>

      {/* Login Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className={`border rounded-[32px] p-8 shadow-xl transition-all duration-300 text-center ${
          isDarkMode 
            ? 'bg-brand-cardDark/65 border-slate-800/60 shadow-slate-950/20 backdrop-blur-md' 
            : 'bg-white border-indigo-100/40 shadow-indigo-100/20 backdrop-blur-md'
        }`}>
          
          {/* Header & Logo */}
          <div className="mb-8 flex flex-col items-center">
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20 mb-5"
            >
              <span className="text-4xl select-none">🧠</span>
            </motion.div>
            <h1 className={`text-3xl font-black tracking-tight leading-none ${
              isDarkMode ? 'text-white' : 'text-slate-800'
            }`}>
              LoviTask
            </h1>
            <p className={`mt-2 text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              ✨ Companheiro Cognitivo Adaptativo
            </p>
          </div>

          {/* speech bubble mascot */}
          <div className={`p-4 rounded-[22px] text-xs font-semibold leading-relaxed border relative mb-8 text-left ${
            isDarkMode 
              ? 'bg-slate-950/60 border-slate-900/80 text-slate-300' 
              : 'bg-indigo-50/45 border-indigo-100/50 text-slate-700'
          }`}>
            <span className="text-lg absolute top-[12px] right-[14px]">✨</span>
            <p className="font-black text-indigo-500 dark:text-indigo-400 mb-1">🤖 Lovi diz:</p>
            Olá! Vamos organizar sua mente hoje? Conecte-se com sua conta para começarmos nossa jornada de clareza mental e evolução cognitiva! (•ᴗ•)
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 p-4 rounded-[20px] bg-rose-500/10 border border-rose-500/25 text-rose-600 text-xs flex items-center gap-3 text-left font-bold"
            >
              <span>⚠️ {error}</span>
            </motion.div>
          )}

          {/* Large Google Login Button */}
          <motion.button
            whileHover={{ scale: 1.01, translateY: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGoogleLoginClick}
            disabled={isLoading}
            className={`w-full py-4 px-6 font-extrabold rounded-2xl shadow-md transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-75 disabled:active:scale-100 ${
              isDarkMode 
                ? 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-slate-900/5' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/15'
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
          </motion.button>
 
          {/* Privacy Note */}
          <div className={`mt-8 text-[11px] leading-relaxed font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Ao entrar, você concorda com a personalização cognitiva baseada nos seus dados de atividade no LoviTask.
          </div>
        </div>
      </motion.div>
    </div>
  );
};
