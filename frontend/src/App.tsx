import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrainDump } from './components/BrainDump';
import { Metrics } from './components/Metrics';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import './index.css';

const queryClient = new QueryClient();

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'brain-dump' | 'metrics' | 'profile'>('brain-dump');

  useEffect(() => {
    const loggedIn = 
      localStorage.getItem('lovitask_logged_in') === 'true' || 
      sessionStorage.getItem('lovitask_logged_in') === 'true';
    
    if (loggedIn) {
      const email = localStorage.getItem('lovitask_user') || sessionStorage.getItem('lovitask_user') || 'usuario@lovitask.com';
      setIsLoggedIn(true);
      setUserEmail(email);
    }
  }, []);

  const handleLoginSuccess = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('lovitask_logged_in');
    localStorage.removeItem('lovitask_user');
    localStorage.removeItem('lovitask_jwt');
    sessionStorage.removeItem('lovitask_logged_in');
    sessionStorage.removeItem('lovitask_user');
    sessionStorage.removeItem('lovitask_jwt');
    setIsLoggedIn(false);
    setUserEmail('');
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden font-sans">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Frosted Glass Header */}
        <header className="backdrop-blur-md bg-slate-950/70 border-b border-slate-900 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Branding Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">LoviTask</h1>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">Assistente Cognitivo</p>
              </div>
            </div>

            {/* Navigation Switcher Pills */}
            <nav className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80 shadow-inner">
              <button
                onClick={() => setActiveTab('brain-dump')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'brain-dump'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Brain Dump
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'metrics'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm9-10v10m2 0a2 2 0 002-2v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2h2z" />
                </svg>
                Métricas
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Perfil Cognitivo
              </button>
            </nav>

            {/* Active User Session Glass Chip */}
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-2xl shadow-lg">
              <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden xs:block">
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider leading-none">Online</p>
                <p className="text-xs text-slate-300 font-bold truncate max-w-[120px] mt-0.5 leading-none">{userEmail}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="ml-1 p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                title="Sair da Conta"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          {activeTab === 'brain-dump' && <BrainDump />}
          {activeTab === 'metrics' && <Metrics />}
          {activeTab === 'profile' && <Profile />}
        </main>

        {/* Technical Footer */}
        <footer className="bg-slate-950 border-t border-slate-900 mt-20 relative z-10">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-slate-500 text-xs">
            <p>LoviTask © 2026 — Desenvolvido com ❤️ para otimização da produtividade cognitiva</p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
