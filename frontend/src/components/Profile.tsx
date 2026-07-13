import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { loviTaskAPI } from '../services/api';

interface ProfileProps {
  isDarkMode: boolean;
}

export const Profile = ({ isDarkMode }: ProfileProps) => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: loviTaskAPI.getProfile,
    refetchInterval: 15000,
  });

  const recalculateMutation = useMutation({
    mutationFn: loviTaskAPI.recalculateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-400 text-sm font-bold">Mapeando seus padrões cognitivos...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-[24px] bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm text-center font-black">
        Erro ao carregar o perfil cognitivo. Verifique a conexão com o servidor.
      </div>
    );
  }

  const cardClass = `border transition-all duration-300 p-7 rounded-[32px] shadow-sm relative overflow-hidden group ${
    isDarkMode 
      ? 'bg-brand-cardDark/40 border-slate-800/60 shadow-slate-950/20 hover:border-slate-800' 
      : 'bg-white border-indigo-50/60 shadow-indigo-100/20 hover:border-indigo-100/80 hover:shadow-md'
  }`;

  const recItemClass = `border rounded-[24px] p-5 transition-all duration-300 flex items-start gap-4 ${
    isDarkMode 
      ? 'bg-slate-950/40 border-slate-900 hover:border-slate-800' 
      : 'bg-slate-50/60 border-slate-200/60 hover:bg-slate-100/40 hover:border-slate-300 shadow-sm'
  }`;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  // Classificação do nível de sobrecarga
  const getCognitiveLoadLabel = (load: number) => {
    if (load <= 20) return { label: 'Muito baixa', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    if (load <= 40) return { label: 'Baixa', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' };
    if (load <= 60) return { label: 'Moderada', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    if (load <= 80) return { label: 'Alta', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
    return { label: 'Crítica', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse' };
  };

  const loadInfo = getCognitiveLoadLabel(profile?.cognitiveLoad || 0);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Title Header with Recalculate Button */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
              isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200/80 shadow-sm'
            }`}>
              <span className="text-xl">🧠</span>
            </div>
            Perfil Cognitivo Adaptativo
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
            Indicadores de produtividade e sobrecarga calculados continuamente com base no seu comportamento real.
          </p>
        </div>

        <button
          onClick={() => recalculateMutation.mutate()}
          disabled={recalculateMutation.isPending}
          className={`self-start sm:self-center px-4 py-2.5 rounded-2xl font-black text-xs transition-all duration-200 border flex items-center gap-2 ${
            recalculateMutation.isPending
              ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 border-transparent cursor-not-allowed'
              : 'bg-indigo-650 hover:bg-indigo-700 text-white border-transparent shadow-md shadow-indigo-500/10 active:scale-95'
          }`}
        >
          <span>🔄</span>
          <span>{recalculateMutation.isPending ? 'Recalculando...' : 'Recalcular Perfil'}</span>
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Diagnóstico do Lovi e Sobrecarga */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Resumo de Análise */}
          <motion.div variants={itemVariants} className={cardClass}>
            {isDarkMode && <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />}
            <h3 className={`text-sm font-black mb-4 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span className="text-lg select-none">🤖</span>
              <span>Análise do Assistente</span>
            </h3>
            <p className={`text-xs leading-relaxed font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-655'}`}>
              {profile?.summary}
            </p>
          </motion.div>

          {/* Card Sobrecarga Cognitiva */}
          <motion.div variants={itemVariants} className={cardClass}>
            {isDarkMode && <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />}
            <div className="flex justify-between items-center mb-5">
              <h3 className={`text-sm font-black flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <span className="text-lg select-none">🧠</span>
                <span>Sobrecarga Cognitiva</span>
              </h3>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${loadInfo.color}`}>
                {loadInfo.label}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs font-semibold">Índice atual:</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {Math.round(profile?.cognitiveLoad || 0)}%
                </span>
              </div>
              
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100 shadow-inner'}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    (profile?.cognitiveLoad || 0) <= 40
                      ? 'bg-emerald-500'
                      : (profile?.cognitiveLoad || 0) <= 65
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.round(profile?.cognitiveLoad || 0)}%` }} 
                />
              </div>

              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed pt-2 border-t border-slate-150/40 dark:border-slate-800/40">
                Pondera o volume de tarefas abertas, atrasos recentes e sua resposta de energia para evitar burnout.
              </p>
            </div>
          </motion.div>

        </div>

        {/* Coluna Central/Direita: Métricas Comportamentais & Recomendações */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Grid de Indicadores */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Card Ritmos de Trabalho */}
            <div className={cardClass}>
              <h3 className={`text-xs font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-4`}>
                🕒 Janelas de Foco
              </h3>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs font-semibold border-b border-slate-150/20 dark:border-slate-800/25 pb-2">
                  <span className="text-slate-400">Melhor Horário:</span>
                  <span className="text-emerald-500 font-black">
                    ☀ {profile?.bestProductivityHour || 'Sem dados'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400">Pior Horário:</span>
                  <span className="text-rose-500 font-black">
                    💤 {profile?.worstProductivityHour || 'Sem dados'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Foco & Duração */}
            <div className={cardClass}>
              <h3 className={`text-xs font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-4`}>
                ⏱️ Tempo Médio
              </h3>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs font-semibold border-b border-slate-150/20 dark:border-slate-800/25 pb-2">
                  <span className="text-slate-400">Duração por Tarefa:</span>
                  <span className="text-slate-800 dark:text-white font-black">
                    {profile?.averageTaskDuration || 0} min
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400">Sessão de Foco Ideal:</span>
                  <span className="text-slate-800 dark:text-white font-black">
                    {profile?.averageFocusTime || 0} min
                  </span>
                </div>
              </div>
            </div>

            {/* Card Conclusão & Adiamento */}
            <div className={cardClass}>
              <h3 className={`text-xs font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-4`}>
                🎯 Desempenho
              </h3>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs font-semibold border-b border-slate-150/20 dark:border-slate-800/25 pb-2">
                  <span className="text-slate-400">Taxa de Conclusão:</span>
                  <span className="text-emerald-500 font-black">
                    {Math.round((profile?.completionRate || 0) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400">Taxa de Adiamento (Delays):</span>
                  <span className="text-amber-500 font-black">
                    {Math.round((profile?.delayRate || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Card Consistência & Procrastinação */}
            <div className={cardClass}>
              <h3 className={`text-xs font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-4`}>
                ⚡ Comportamento
              </h3>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs font-semibold border-b border-slate-150/20 dark:border-slate-800/25 pb-2">
                  <span className="text-slate-400">Índice de Procrastinação:</span>
                  <span className="text-rose-500 font-black">
                    {Math.round(profile?.procrastinationIndex || 0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400">Score de Consistência (7d):</span>
                  <span className="text-indigo-500 font-black">
                    {Math.round(profile?.consistencyScore || 0)}%
                  </span>
                </div>
              </div>
            </div>

          </motion.div>

          {/* Card de Recomendações Integrado */}
          <motion.div 
            variants={itemVariants}
            className={`border rounded-[32px] p-7 shadow-sm ${
              isDarkMode ? 'bg-brand-cardDark/40 border-slate-800/60 text-white' : 'bg-white border-indigo-50/85'
            }`}
          >
            <h3 className={`text-sm font-black mb-5 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span className="text-lg">💡</span>
              <span>Recomendações Práticas</span>
            </h3>

            {profile?.recommendations && profile.recommendations.length > 0 ? (
              <div className="space-y-4">
                {profile.recommendations.map((rec, index) => (
                  <div key={index} className={recItemClass}>
                    <div className={`p-3 rounded-2xl shrink-0 flex items-center justify-center text-lg ${
                      rec.category === 'Energia' 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                        : rec.category === 'Foco' 
                          ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {rec.category === 'Energia' ? '⚡' : rec.category === 'Foco' ? '🎯' : '📅'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className={`font-black text-xs ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{rec.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-wider ${
                          rec.category === 'Energia' 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                            : rec.category === 'Foco' 
                              ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20' 
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {rec.category}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
                        {rec.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                Nenhuma recomendação adaptativa pendente. Continue registrando atividades!
              </div>
            )}
          </motion.div>

        </div>

      </div>
    </motion.div>
  );
};
