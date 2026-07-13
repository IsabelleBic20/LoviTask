import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { loviTaskAPI } from '../services/api';

interface MetricsProps {
  isDarkMode: boolean;
}

export const Metrics = ({ isDarkMode }: MetricsProps) => {
  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['metrics'],
    queryFn: loviTaskAPI.getMetrics,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-400 text-sm font-bold">Analisando suas conquistas cognitivas...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-[24px] bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm text-center font-black">
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
  const clarezaMental = totalEvents > 0 ? Math.round(((completedEvents + (totalEvents - completedEvents - (metrics?.abandonedEvents || 0)) * 0.5) / totalEvents) * 100) : 100;

  // Reusable classes for playful cards
  const cardClass = `border transition-all duration-300 p-7 rounded-[32px] shadow-sm relative overflow-hidden group ${
    isDarkMode 
      ? 'bg-brand-cardDark/40 border-slate-800/60 shadow-slate-950/20 hover:border-slate-800' 
      : 'bg-white border-indigo-50/60 shadow-indigo-100/20 hover:border-indigo-100/80 hover:shadow-md'
  }`;

  const labelClass = `text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400`;

  // Framer Motion container and item variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Title */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
          <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
            isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200/80 shadow-sm'
          }`}>
            <span className="text-xl">🏆</span>
          </div>
          Conquistas & Evolução
        </h2>
        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
          Seu cérebro em evolução. Acompanhe o progresso de suas metas cognitivas e ganho de experiência.
        </p>
      </motion.div>

      {/* Gamification Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Sequência de Foco (Streak) */}
        <motion.div variants={itemVariants} className={`${cardClass} border-l-4 !border-l-orange-500`}>
          {isDarkMode && <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />}
          <p className={labelClass}>🔥 Sequência de Foco</p>
          <div className="flex items-baseline gap-2 mt-5">
            <p className="text-5xl font-black text-orange-500 tracking-tight">{streakDays}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase">dias seguidos</p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-5 leading-relaxed font-semibold">
            {streakDays > 0 ? "Você está mantendo um excelente ritmo mental! Continue assim." : "Use o Brain Dump hoje para ativar sua sequência de foco!"}
          </p>
        </motion.div>

        {/* Card 2: Clareza Mental */}
        <motion.div variants={itemVariants} className={`${cardClass} border-l-4 !border-l-indigo-500`}>
          {isDarkMode && <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />}
          <p className={labelClass}>🧠 Clareza Mental</p>
          <div className="flex items-baseline gap-2 mt-5">
            <p className="text-5xl font-black text-indigo-500 dark:text-indigo-400 tracking-tight">{clarezaMental}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase">Foco Ativo</p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-5 leading-relaxed font-semibold">
            Seu índice de organização cognitiva baseado nas metas descarregadas e organizadas.
          </p>
        </motion.div>

        {/* Card 3: Pontos de Experiência (XP) */}
        <motion.div variants={itemVariants} className={`${cardClass} border-l-4 !border-l-amber-500`}>
          {isDarkMode && <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />}
          <p className={labelClass}>⭐ Total de Experiência</p>
          <div className="flex items-baseline gap-2 mt-5">
            <p className="text-5xl font-black text-amber-500 tracking-tight">{userXP}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase">XP Acumulado</p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-5 leading-relaxed font-semibold">
            Conclua tarefas recomendadas para subir seu nível cognitivo! (+25 XP por tarefa feita).
          </p>
        </motion.div>

        {/* Card 4: Missões Concluídas */}
        <motion.div variants={itemVariants} className={`${cardClass} border-l-4 !border-l-emerald-500`}>
          {isDarkMode && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />}
          <p className={labelClass}>🎯 Missões Concluídas</p>
          <div className="flex items-baseline gap-2 mt-5">
            <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{completedEvents}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase">de {totalEvents} totais</p>
          </div>
          <div className={`w-full h-2 rounded-full mt-5 overflow-hidden ${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100 shadow-inner'}`}>
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalEvents ? (completedEvents / totalEvents) * 100 : 0}%` }} 
            />
          </div>
        </motion.div>

        {/* Card 5: Tempo Médio de Ação */}
        <motion.div variants={itemVariants} className={`${cardClass} border-l-4 !border-l-purple-500`}>
          {isDarkMode && <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />}
          <p className={labelClass}>⏱️ Sessões de Foco Ideal</p>
          <div className="flex items-baseline gap-2 mt-5">
            <p className="text-5xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{Math.round(metrics?.averageCompletionMinutes || 35)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase">minutos</p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-5 leading-relaxed font-semibold">
            Seu tempo médio para completar tarefas. Excelente parâmetro para seu ciclo pomodoro.
          </p>
        </motion.div>

        {/* Card 6: Taxa de Procrastinação */}
        <motion.div variants={itemVariants} className={cardClass}>
          {isDarkMode && <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />}
          <p className={labelClass}>⚡ Categoria Favorita</p>
          <div className="flex items-baseline gap-2 mt-5">
            <p className="text-2xl font-black text-indigo-650 dark:text-indigo-400 truncate max-w-full">
              {metrics?.mostFrequentCategory || 'Nenhuma'}
            </p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-7 leading-relaxed font-semibold">
            Meta onde você mais gerou e completou tarefas cognitivas.
          </p>
        </motion.div>

      </div>

      {/* Janela de Produtividade Diária */}
      <motion.div 
        variants={itemVariants}
        className={`border rounded-[32px] p-8 shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-brand-cardDark/40 border-slate-800/60 text-white' : 'bg-white border-indigo-50/80 text-slate-800'
        }`}
      >
        <h3 className="text-base font-black mb-6 flex items-center gap-2.5">
          <span className="text-lg">🕒</span>
          <span>Ritmos e Janelas de Energia</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className={isDarkMode ? 'text-slate-400 font-bold' : 'text-slate-600 font-bold'}>Período de Pico Energético (Melhor Horário)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                {metrics?.mostProductivePeriod || 'Tarde'}
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-850' : 'bg-slate-100 shadow-inner'}`}>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: metrics?.mostProductivePeriod ? '85%' : '80%' }} />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
              Período recomendado para tarefas de alta complexidade analítica e foco profundo.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className={isDarkMode ? 'text-slate-400 font-bold' : 'text-slate-600 font-bold'}>Janela de Menor Rendimento (Foco Crítico)</span>
              <span className="text-rose-600 dark:text-rose-400 font-extrabold text-[10px] bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 uppercase tracking-wider">
                {metrics?.leastProductivePeriod || 'Manhã'}
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-850' : 'bg-slate-100 shadow-inner'}`}>
              <div className="bg-gradient-to-r from-rose-500 to-red-400 h-full rounded-full" style={{ width: metrics?.leastProductivePeriod ? '40%' : '35%' }} />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
              Período com maior propensão à procrastinação. Ideal para tarefas administrativas leves ou pausas ativas.
            </p>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
};
