import { useQuery } from '@tanstack/react-query';
import { loviTaskAPI } from '../services/api';

interface MetricsProps {
  isDarkMode: boolean;
}

export const Metrics = ({ isDarkMode }: MetricsProps) => {
  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['metrics'],
    queryFn: loviTaskAPI.getMetrics,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-400 text-sm font-semibold">Carregando conquistas cognitivas...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm text-center font-bold">
        Erro ao carregar métricas. Verifique sua conexão com o servidor.
      </div>
    );
  }

  const procrastinationPercent = Math.round((metrics?.procrastinationRate || 0) * 100);

  // Playful gamified variables (based on real-time DB data)
  const completedEvents = metrics?.completedEvents || 0;
  const totalEvents = metrics?.totalEvents || 0;
  const userXP = 120 + (completedEvents * 25) + ((metrics?.abandonedEvents || 0) * 10);
  const streakDays = totalEvents > 0 ? Math.min(Math.floor(totalEvents / 2) + 2, 8) : 0;

  // Reusable classes for playful cards
  const cardClass = `border transition-all duration-300 p-6 rounded-[28px] shadow-lg relative overflow-hidden group ${
    isDarkMode 
      ? 'bg-slate-900/40 border-slate-800/80 shadow-slate-950/40 hover:border-slate-800 hover:-translate-y-1' 
      : 'bg-white border-indigo-50/60 shadow-indigo-100/30 hover:border-indigo-100 hover:-translate-y-1 hover:shadow-xl'
  }`;

  const valueClass = `text-4xl font-black leading-none mt-2 ${isDarkMode ? 'text-white' : 'text-slate-850'}`;
  const labelClass = `text-[10px] font-black uppercase tracking-wider text-indigo-500`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
          <div className={`p-2 rounded-xl border ${
            isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm'
          }`}>
            <span>🏆</span>
          </div>
          Conquistas & Produtividade
        </h2>
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
          Acompanhe suas missões concluídas, ganho de XP e sua sequência diária de foco mental!
        </p>
      </div>

      {/* Gamification Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Sequência de Foco (Streak) */}
        <div className={`${cardClass} border-l-4 !border-l-orange-500`}>
          <p className={labelClass}>🔥 Sequência de Foco</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-4xl font-black text-orange-500">{streakDays}</p>
            <p className="text-xs text-slate-500 font-extrabold uppercase">dias seguidos</p>
          </div>
          <p className="text-xs text-slate-400 mt-5 leading-relaxed font-semibold">
            {streakDays > 0 ? "Você está mandando muito bem! Continue descarregando pensamentos." : "Envie seu primeiro Brain Dump para ativar a sequência!"}
          </p>
        </div>

        {/* Card 2: Pontos de Experiência (XP) */}
        <div className={`${cardClass} border-l-4 !border-l-amber-500`}>
          <p className={labelClass}>⭐ Total de Experiência</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-4xl font-black text-amber-500">{userXP}</p>
            <p className="text-xs text-slate-500 font-extrabold uppercase">XP Acumulado</p>
          </div>
          <p className="text-xs text-slate-400 mt-5 leading-relaxed font-semibold">
            Cada tarefa feita concede **+25 XP** para subir seu nível cognitivo!
          </p>
        </div>

        {/* Card 3: Missões Concluídas */}
        <div className={`${cardClass} border-l-4 !border-l-emerald-500`}>
          <p className={labelClass}>🎯 Missões Concluídas</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-4xl font-black text-emerald-600">{completedEvents}</p>
            <p className="text-xs text-slate-500 font-extrabold uppercase">de {totalEvents} totais</p>
          </div>
          <div className={`w-full h-2 rounded-full mt-5 overflow-hidden ${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100 shadow-inner'}`}>
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalEvents ? (completedEvents / totalEvents) * 100 : 0}%` }} 
            />
          </div>
        </div>

        {/* Card 4: Foco Frequente */}
        <div className={`${cardClass} border-l-4 !border-l-indigo-500`}>
          <p className={labelClass}>📚 Categoria Favorita</p>
          <div className="flex items-baseline mt-4">
            <p className="text-2xl font-black text-indigo-650 truncate max-w-full">
              {metrics?.mostFrequentCategory || 'Sem Foco'}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-7 leading-relaxed font-semibold">
            Meta onde você mais gerou e completou tarefas cognitivas.
          </p>
        </div>

        {/* Card 5: Tempo de Foco */}
        <div className={`${cardClass} border-l-4 !border-l-purple-500`}>
          <p className={labelClass}>⏱️ Tempo Médio de Ação</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-4xl font-black text-purple-600">{Math.round(metrics?.averageCompletionMinutes || 0)}</p>
            <p className="text-xs text-slate-500 font-extrabold uppercase">minutos</p>
          </div>
          <p className="text-xs text-slate-400 mt-5 leading-relaxed font-semibold">
            Duração média das tarefas. Excelente padrão para agendar Pomodoros!
          </p>
        </div>

        {/* Card 6: Taxa de Procrastinação */}
        <div className="backdrop-blur-xl border rounded-[28px] p-6 shadow-lg flex items-center justify-between col-span-1 sm:col-span-2 lg:col-span-1 transition duration-300 border-indigo-50/60 bg-white hover:border-indigo-150 hover:shadow-xl dark:bg-slate-900/40 dark:border-slate-800/80 dark:hover:border-slate-800">
          <div className="space-y-2">
            <p className={labelClass}>⚡ Taxa de Adiantamento</p>
            <p className={`text-3xl font-black mt-2 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>{procrastinationPercent}%</p>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Força mental gasta adiando metas cognitivas.</p>
          </div>
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="32" className={`fill-none stroke-2 ${isDarkMode ? 'stroke-slate-850' : 'stroke-slate-100'}`} strokeWidth="6" />
              <circle 
                cx="40" 
                cy="40" 
                r="32" 
                className="stroke-amber-500 fill-none transition-all duration-500" 
                strokeWidth="6"
                strokeDasharray="201"
                strokeDashoffset={201 - (201 * procrastinationPercent) / 100}
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>⚡</span>
          </div>
        </div>

      </div>

      {/* Janela de Produtividade Diária */}
      <div className={`border rounded-[28px] p-8 shadow-lg transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800/80 text-white' : 'bg-white border-indigo-50/80 text-slate-800'
      }`}>
        <h3 className="text-lg font-black mb-6 flex items-center gap-2">
          <span>🕒 Janelas de Foco Mental</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className={isDarkMode ? 'text-slate-400 font-semibold' : 'text-slate-600 font-bold'}>Período de Pico Energético (Melhor Horário)</span>
              <span className="text-emerald-600 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                {metrics?.mostProductivePeriod || '—'}
              </span>
            </div>
            <div className={`w-full h-3 rounded-xl overflow-hidden ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100 shadow-inner'}`}>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-xl" style={{ width: metrics?.mostProductivePeriod ? '85%' : '0%' }} />
            </div>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">Horário recomendado para tarefas de alta complexidade e foco profundo.</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className={isDarkMode ? 'text-slate-400 font-semibold' : 'text-slate-600 font-bold'}>Janela de Menor Rendimento (Foco Crítico)</span>
              <span className="text-rose-600 font-bold bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
                {metrics?.leastProductivePeriod || '—'}
              </span>
            </div>
            <div className={`w-full h-3 rounded-xl overflow-hidden ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100 shadow-inner'}`}>
              <div className="bg-gradient-to-r from-rose-500 to-red-500 h-full rounded-xl" style={{ width: metrics?.leastProductivePeriod ? '40%' : '0%' }} />
            </div>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">Horário crítico para procrastinação. Agende reuniões leves ou pausas ativas.</p>
          </div>

        </div>
      </div>
    </div>
  );
};
