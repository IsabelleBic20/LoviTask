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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">LoviTask</h1>
              <p className="text-gray-600">Assistente Cognitivo Adaptativo</p>
            </div>
            
            {/* User Session Info & Logout */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-inner">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Usuário ativo</p>
                <p className="text-sm text-gray-700 font-bold truncate max-w-[180px]">{userEmail}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="ml-2 p-2 hover:bg-rose-50/50 rounded-lg text-gray-400 hover:text-rose-500 transition-colors"
                title="Sair da Conta"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <nav className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex gap-0">
              <button
                onClick={() => setActiveTab('brain-dump')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'brain-dump'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Brain Dump
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'metrics'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Métricas
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Perfil Cognitivo
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {activeTab === 'brain-dump' && <BrainDump />}
          {activeTab === 'metrics' && <Metrics />}
          {activeTab === 'profile' && <Profile />}
        </main>

        <footer className="bg-white border-t mt-12">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-600">
            <p>LoviTask © 2026 — Desenvolvido com ❤️ para melhorar sua produtividade</p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
