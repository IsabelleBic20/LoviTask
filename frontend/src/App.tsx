import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
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

  // Theme State: Default to 'light' for high contrast and accessibility
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lovitask_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const isDarkMode = theme === 'dark';

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
  const pendingCount = events?.filter(e => e.completed === null).length || 0;
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

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-hidden font-sans pb-16 ${
      isDarkMode ? 'bg-playful-dark text-white selection:bg-indigo-500/30 selection:text-indigo-200' : 'bg-playful-light text-slate-800 selection:bg-indigo-100 selection:text-indigo-900'
    }`}>
      
      {/* Decorative Floating Blobs (Mac/Duolingo Ambient Style) */}
      <div className={`absolute top-[-100px] left-[5%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none transition-opacity duration-500 ${
        isDarkMode ? 'bg-indigo-900/10' : 'bg-indigo-500/5'
      }`} />
      <div className={`absolute bottom-[-100px] right-[5%] w-[450px] h-[450px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-500 ${
        isDarkMode ? 'bg-purple-900/10' : 'bg-purple-500/5'
      }`} />

      {/* Floating shape items (Finch/Duolingo style background decor) */}
      <div className="absolute top-[25%] right-[8%] text-indigo-400/20 text-3xl select-none pointer-events-none font-bold animate-bounce-slow">✦</div>
      <div className="absolute bottom-[35%] left-[6%] text-purple-400/20 text-2xl select-none pointer-events-none font-bold animate-bounce-slow" style={{ animationDelay: '1.5s' }}>○</div>
      <div className="absolute top-[60%] right-[4%] text-pink-400/20 text-xl select-none pointer-events-none font-bold animate-bounce-slow" style={{ animationDelay: '2.5s' }}>✦</div>

      {/* Header Panel */}
      <header className={`backdrop-blur-md sticky top-0 z-20 border-b transition-all duration-300 ${
        isDarkMode ? 'bg-slate-950/70 border-slate-900' : 'bg-white/80 border-slate-200/80 shadow-sm'
      }`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[16px] bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-breathe">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>LoviTask</h1>
              <p className={`text-[10px] font-bold tracking-wider uppercase mt-1.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>✨ Companheiro de Mente</p>
            </div>
          </div>

          {/* Navigation Pills */}
          <nav className={`flex p-1.5 rounded-[20px] border transition-colors duration-300 ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800/80 shadow-inner' : 'bg-slate-200/60 border-slate-300/40 shadow-inner'
          }`}>
            <button
              onClick={() => setActiveTab('brain-dump')}
              className={`px-5 py-2.5 rounded-[16px] font-bold text-xs transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'brain-dump'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/40' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
              }`}
            >
              💭 Brain Dump
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-5 py-2.5 rounded-[16px] font-bold text-xs transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'metrics'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/40' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
              }`}
            >
              🏆 Conquistas
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-5 py-2.5 rounded-[16px] font-bold text-xs transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/40' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
              }`}
            >
              🌱 Perfil Cognitivo
            </button>
          </nav>

          {/* Theme & Profile Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-slate-900/60 border-slate-800 text-amber-400 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-100 shadow-sm'
              }`}
              title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
              aria-label="Alternar tema de acessibilidade"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Profile Menu */}
            <div className={`flex items-center gap-3 border px-3 py-1.5 rounded-2xl transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800/85' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                {capitalizedUsername.charAt(0)}
              </div>
              <button 
                onClick={handleLogout}
                className="p-1 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                title="Sair da Conta"
              >
                🚪
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10 space-y-8">
        
        {/* Playful Gamified Banner (Finch/Duolingo style) */}
        <div className={`p-6 rounded-[28px] border transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/45 border-slate-800/80 shadow-2xl' 
            : 'bg-white/80 border-indigo-100 shadow-lg shadow-indigo-100/30'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            {/* Mascot dialog & mood selection */}
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce-slow shrink-0">(•ᴗ•)</span>
                <div>
                  <h2 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    Olá, {capitalizedUsername}! Como está sua cabeça hoje?
                  </h2>
                  <p className="text-xs text-slate-400">Clique para contar para o Lovi:</p>
                </div>
              </div>

              {/* Mood Buttons */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: 'calmo', label: '🙂 Calma' },
                  { id: 'neutro', label: '😐 Neutra' },
                  { id: 'ansioso', label: '😵 Sobrecargada' },
                  { id: 'cansado', label: '😴 Cansada' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setMood(item.id as any)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                      mood === item.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105' 
                        : isDarkMode
                          ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Speech bubble */}
              <div className={`p-4 rounded-[20px] text-xs font-semibold leading-relaxed border relative ${
                isDarkMode ? 'bg-slate-950 border-slate-900 text-slate-300' : 'bg-indigo-50/50 border-indigo-100/60 text-slate-700'
              }`}>
                <div className="absolute top-[-6px] left-[20px] w-3 h-3 rotate-45 border-t border-l transition-colors duration-300 bg-inherit border-inherit" />
                {moodDialogs[mood]}
              </div>
            </div>

            {/* Gamification progress block (Duolingo style) */}
            <div className={`w-full md:w-72 p-4 rounded-2xl border flex flex-col justify-between h-full ${
              isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200/60'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-black uppercase text-indigo-500 tracking-wider">Seu Progresso</span>
                <span className="text-xs font-extrabold text-amber-500">🏆 Nível {userLevel}</span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative shadow-inner">
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

              <div className="border-t border-slate-200/40 dark:border-slate-800/40 mt-3 pt-3 flex justify-between items-center text-xs font-extrabold text-slate-500">
                <span className="flex items-center gap-1">⭐ {totalXP} Total XP</span>
                <span className="flex items-center gap-1">🎯 {completedCount}/{totalCount} Feitas</span>
              </div>
            </div>

          </div>
        </div>

        {/* Tab views */}
        <div className="transition-all duration-350">
          {activeTab === 'brain-dump' && <BrainDump isDarkMode={isDarkMode} />}
          {activeTab === 'metrics' && <Metrics isDarkMode={isDarkMode} />}
          {activeTab === 'profile' && <Profile isDarkMode={isDarkMode} />}
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
