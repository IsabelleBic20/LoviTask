import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainDump } from './components/BrainDump';
import { Metrics } from './components/Metrics';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { loviTaskAPI } from './services/api';
import './index.css';

const queryClient = new QueryClient();

function DashboardWrapper() {
  const [activeTab, setActiveTab] = useState<'brain-dump' | 'metrics' | 'profile'>('brain-dump');
  const [userEmail, setUserEmail] = useState('');
  const [mood, setMood] = useState<'calmo' | 'neutro' | 'ansioso' | 'cansado'>('neutro');

  // Theme State: Default to 'light'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lovitask_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const email = localStorage.getItem('lovitask_user') || sessionStorage.getItem('lovitask_user') || 'usuario@lovitask.com';
    setUserEmail(email);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lovitask_logged_in');
    localStorage.removeItem('lovitask_user');
    localStorage.removeItem('lovitask_jwt');
    sessionStorage.removeItem('lovitask_logged_in');
    sessionStorage.removeItem('lovitask_user');
    sessionStorage.removeItem('lovitask_jwt');
    window.location.reload();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('lovitask_theme', newTheme);
  };

  // Query events to calculate real-time gamified XP and Levels
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: loviTaskAPI.getEvents,
  });

  const completedCount = events?.filter(e => e.completed === true).length || 0;
  const abandonedCount = events?.filter(e => e.completed === false).length || 0;
  const totalCount = events?.length || 0;

  // XP: Base 120 XP + 25 XP per completed task + 10 XP per abandoned task
  const totalXP = 120 + (completedCount * 25) + (abandonedCount * 10);
  const userLevel = Math.floor(totalXP / 100) + 1;
  const currentXP = totalXP % 100;
  const percentToNextLevel = currentXP;
  
  // Custom companion dialogs based on selected mood
  const moodDialogs = {
    calmo: 'Que maravilhoso! Um estado mental calmo é ideal para organizar ideias profundas no Brain Dump. 🧘✨',
    neutro: 'Perfeito. Que tal descarregar suas atividades pendentes e planejar o dia com tranquilidade? 🧠🚀',
    ansioso: 'Tudo bem sentir isso. Escreva livremente no Brain Dump. Eu separo tudo em microtarefas para você relaxar! 🕊️❤️',
    cansado: 'Vá com calma hoje. Vamos focar apenas em tarefas leves de curto prazo. Você merece pausas frequentes! ☕💤'
  };

  // Get name before email domain for greeting
  const username = userEmail.split('@')[0];
  const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);

  // Time of day greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Bom dia';
    if (hours < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden pb-16 ${
      isDarkMode 
        ? 'bg-brand-dark text-white selection:bg-indigo-500/30 selection:text-indigo-200' 
        : 'bg-brand-light text-slate-800 selection:bg-indigo-100 selection:text-indigo-900'
    }`}>
      
      {/* Decorative Floating Ambient Blobs */}
      <div className="absolute top-[-100px] left-[5%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-500/5 blur-[120px] pointer-events-none ambient-glow" />
      <div className="absolute bottom-[-150px] right-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-400/15 to-pink-500/5 blur-[130px] pointer-events-none ambient-glow" />

      {/* Floating shape items (Finch/Duolingo style background decor) */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[25%] right-[8%] text-indigo-400/25 text-3xl select-none pointer-events-none font-bold"
      >
        ✦
      </motion.div>
      <motion.div 
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[35%] left-[6%] text-purple-400/25 text-2xl select-none pointer-events-none font-bold"
      >
        ○
      </motion.div>

      {/* Header Panel */}
      <header className={`backdrop-blur-md sticky top-0 z-20 border-b transition-all duration-300 ${
        isDarkMode ? 'bg-[#0B0A16]/80 border-slate-900/70' : 'bg-white/85 border-slate-200/60 shadow-sm'
      }`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-indigo-500 to-purple-650 flex items-center justify-center shadow-md shadow-indigo-500/15 animate-breathe">
              <span className="text-xl select-none">🧠</span>
            </div>
            <div>
              <h1 className={`text-xl font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>LoviTask</h1>
              <p className={`text-[9px] font-black tracking-wider uppercase mt-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-650'}`}>✨ Assistente Cognitivo</p>
            </div>
          </div>

          {/* Navigation Pills */}
          <nav className={`flex p-1 rounded-2xl border transition-colors duration-300 ${
            isDarkMode ? 'bg-slate-950/60 border-slate-850/60' : 'bg-slate-200/50 border-slate-300/40'
          }`}>
            <button
              onClick={() => setActiveTab('brain-dump')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'brain-dump'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10 scale-[1.015]'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/20' 
                    : 'text-slate-655 hover:text-slate-900 hover:bg-slate-300/30'
              }`}
            >
              <span>💭</span>
              <span>Brain Dump</span>
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'metrics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10 scale-[1.015]'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/20' 
                    : 'text-slate-655 hover:text-slate-900 hover:bg-slate-300/30'
              }`}
            >
              <span>🏆</span>
              <span>Conquistas</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10 scale-[1.015]'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/20' 
                    : 'text-slate-655 hover:text-slate-900 hover:bg-slate-300/30'
              }`}
            >
              <span>🌱</span>
              <span>Perfil</span>
            </button>
          </nav>

          {/* Theme & Profile Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-slate-950/60 border-slate-850 text-amber-400 hover:bg-slate-900' 
                  : 'bg-white border-slate-200 text-indigo-650 hover:bg-slate-50 shadow-sm'
              }`}
              title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
              aria-label="Alternar tema de acessibilidade"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Profile Menu */}
            <div className={`flex items-center gap-3 border px-3 py-1.5 rounded-xl transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-950/60 border-slate-850/60' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-black shadow-inner">
                {capitalizedUsername.charAt(0)}
              </div>
              <button 
                onClick={handleLogout}
                className="px-2 py-1 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors text-xs font-black uppercase tracking-wider"
                title="Sair da Conta"
              >
                Sair
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10 space-y-8">
        
        {/* Playful Gamified Banner (Finch/Duolingo style) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`p-6 rounded-[32px] border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-brand-cardDark/55 border-slate-800/60 shadow-2xl' 
              : 'bg-white border-indigo-50/60 shadow-indigo-100/20 shadow-lg'
          }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            {/* Mascot dialog & mood selection */}
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-3.5">
                <span className="text-3xl animate-bounce-slow shrink-0 select-none">(•ᴗ•)</span>
                <div>
                  <h2 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {getGreeting()}, {capitalizedUsername}. Como está sua cabeça hoje?
                  </h2>
                  <p className="text-[10px] text-indigo-550 dark:text-indigo-400 font-black uppercase tracking-wider">Mascote Lovi</p>
                </div>
              </div>

              {/* Mood Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'calmo', label: '🙂 Calma' },
                  { id: 'neutro', label: '😐 Neutra' },
                  { id: 'ansioso', label: '😵 Sobrecargada' },
                  { id: 'cansado', label: '😴 Cansada' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setMood(item.id as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black transition-all duration-200 border ${
                      mood === item.id 
                        ? 'bg-indigo-650 border-indigo-650 text-white shadow-md shadow-indigo-500/10 scale-105' 
                        : isDarkMode
                          ? 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-200/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Speech bubble */}
              <div className={`p-4 rounded-[22px] text-xs font-semibold leading-relaxed border relative ${
                isDarkMode ? 'bg-slate-950/60 border-slate-900/80 text-slate-350' : 'bg-indigo-50/45 border-indigo-100/50 text-slate-750'
              }`}>
                <div className="absolute top-[-6px] left-[20px] w-3 h-3 rotate-45 border-t border-l bg-inherit border-inherit" />
                {moodDialogs[mood]}
              </div>
            </div>

            {/* Gamification progress block (Duolingo style) */}
            <div className={`w-full md:w-72 p-5 rounded-2xl border flex flex-col justify-between h-full ${
              isDarkMode ? 'bg-slate-950/60 border-slate-850/60' : 'bg-indigo-50/15 border-indigo-100/40 shadow-inner'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Evolução Cognitiva</span>
                <span className="text-xs font-extrabold text-amber-500">🏆 Nível {userLevel}</span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-200 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500 relative" 
                    style={{ width: `${percentToNextLevel}%` }}
                  >
                    <div className="absolute top-0 right-0 left-0 bottom-0 bg-white/20 animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>{currentXP}/100 XP</span>
                  <span>{100 - currentXP} XP para Nível {userLevel + 1}</span>
                </div>
              </div>

              <div className="border-t border-slate-200/40 dark:border-slate-800/40 mt-3 pt-3 flex justify-between items-center text-[10px] font-black text-slate-500">
                <span className="flex items-center gap-1">⭐ {totalXP} Total XP</span>
                <span className="flex items-center gap-1">🎯 {completedCount}/{totalCount} Feitas</span>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Tab views */}
        <div className="transition-all duration-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'brain-dump' && <BrainDump isDarkMode={isDarkMode} />}
              {activeTab === 'metrics' && <Metrics isDarkMode={isDarkMode} />}
              {activeTab === 'profile' && <Profile isDarkMode={isDarkMode} />}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const loggedIn = 
      localStorage.getItem('lovitask_logged_in') === 'true' || 
      sessionStorage.getItem('lovitask_logged_in') === 'true';
    
    if (loggedIn) {
      setIsLoggedIn(true);
    }

    const savedTheme = localStorage.getItem('lovitask_theme') || 'light';
    setTheme(savedTheme as any);
  }, []);

  const handleLoginSuccess = (email: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('lovitask_logged_in', 'true');
    localStorage.setItem('lovitask_user', email);
    window.location.reload();
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} setTheme={setTheme} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardWrapper />
    </QueryClientProvider>
  );
}

export default App;
