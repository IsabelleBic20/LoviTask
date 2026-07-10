import { useQuery } from '@tanstack/react-query';
import { loviTaskAPI } from '../services/api';

export const Metrics = () => {
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
        <span className="text-slate-400 text-sm">Carregando métricas de produtividade...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
        Erro ao carregar métricas. Verifique sua conexão com o servidor.
      </div>
    );
  }

  const procrastinationPercent = Math.round((metrics?.procrastinationRate || 0) * 100);
  const strokeDashoffset = 251.2 - (251.2 * procrastinationPercent) / 100;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm9-10v10m2 0a2 2 0 002-2v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4a2 2 0 002 2h2z" />
            </svg>
          </div>
          Métricas de Produtividade Cognitiva
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          Dados extraídos em tempo real baseados nas suas microtarefas registradas e padrões de energia.
        </p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Total de Eventos */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 transition duration-300 hover:border-slate-700/60 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Eventos</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-4xl font-black text-white">{metrics?.totalEvents || 0}</p>
            <p className="text-xs text-indigo-400 font-semibold">atividades</p>
          </div>
          <div className="w-full bg-slate-800/50 h-1.5 rounded-full mt-6 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 2: Concluídas */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 transition duration-300 hover:border-slate-700/60 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concluídas</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-4xl font-black text-emerald-400">{metrics?.completedEvents || 0}</p>
            <p className="text-xs text-emerald-400 font-semibold">sucessos</p>
          </div>
          <div className="w-full bg-slate-800/50 h-1.5 rounded-full mt-6 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${metrics?.totalEvents ? ((metrics.completedEvents || 0) / metrics.totalEvents) * 100 : 0}%` }} 
            />
          </div>
        </div>

        {/* Card 3: Abandonadas */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 transition duration-300 hover:border-slate-700/60 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Abandonadas</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-4xl font-black text-rose-400">{metrics?.abandonedEvents || 0}</p>
            <p className="text-xs text-rose-400 font-semibold">canceladas</p>
          </div>
          <div className="w-full bg-slate-800/50 h-1.5 rounded-full mt-6 overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${metrics?.totalEvents ? ((metrics.abandonedEvents || 0) / metrics.totalEvents) * 100 : 0}%` }} 
            />
          </div>
        </div>

        {/* Card 4: Taxa de Procrastinação (Com gráfico circular SVG) */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 transition duration-300 hover:border-slate-700/60 shadow-lg flex items-center justify-between col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa de Procrastinação</p>
            <p className="text-3xl font-black text-amber-400 mt-2">{procrastinationPercent}%</p>
            <p className="text-xs text-slate-400">Tempo gasto adiando metas cognitivas.</p>
          </div>
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="32" className="stroke-slate-800 fill-none" strokeWidth="6" />
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
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-400">⚡</span>
          </div>
        </div>

        {/* Card 5: Tempo Médio */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 transition duration-300 hover:border-slate-700/60 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tempo Médio de Conclusão</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-4xl font-black text-purple-400">{Math.round(metrics?.averageCompletionMinutes || 0)}</p>
            <p className="text-xs text-purple-400 font-semibold">minutos</p>
          </div>
          <p className="text-xs text-slate-400 mt-5">Ideal para estimar blocos de foco Pomodoro.</p>
        </div>

        {/* Card 6: Categoria Favorita */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 transition duration-300 hover:border-slate-700/60 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Foco de Maior Frequência</p>
          <div className="flex items-baseline mt-4">
            <p className="text-2xl font-black text-cyan-400 truncate max-w-full">
              {metrics?.mostFrequentCategory || '—'}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-7">Categoria onde você mais aloca suas energias.</p>
        </div>

      </div>

      {/* Janela de Produtividade Diária */}
      <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span>🕒 Distribuição de Produtividade Cognitiva</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-semibold">Período de Pico Energético</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                {metrics?.mostProductivePeriod || '—'}
              </span>
            </div>
            <div className="w-full bg-slate-800/50 h-3 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-xl" style={{ width: metrics?.mostProductivePeriod ? '85%' : '0%' }} />
            </div>
            <p className="text-[11px] text-slate-500">Horário recomendado para tarefas de alta complexidade e foco profundo.</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-semibold">Janela de Menor Rendimento</span>
              <span className="text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
                {metrics?.leastProductivePeriod || '—'}
              </span>
            </div>
            <div className="w-full bg-slate-800/50 h-3 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-rose-500 to-red-500 h-full rounded-xl" style={{ width: metrics?.leastProductivePeriod ? '40%' : '0%' }} />
            </div>
            <p className="text-[11px] text-slate-500">Horário crítico para procrastinação. Agende reuniões leves ou pausas ativas.</p>
          </div>

        </div>
      </div>
    </div>
  );
};
