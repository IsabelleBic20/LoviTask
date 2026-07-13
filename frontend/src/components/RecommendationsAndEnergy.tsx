import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { loviTaskAPI } from '../services/api';

interface RecommendationsAndEnergyProps {
  isDarkMode: boolean;
}

export const RecommendationsAndEnergy = ({ isDarkMode }: RecommendationsAndEnergyProps) => {
  const queryClient = useQueryClient();
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);

  // Queries
  const { data: load, isLoading: loadingLoad } = useQuery({
    queryKey: ['cognitive-load'],
    queryFn: loviTaskAPI.getCognitiveLoad,
    refetchInterval: 10000,
  });

  const { data: recommendations, isLoading: loadingRecs } = useQuery({
    queryKey: ['recommendations'],
    queryFn: loviTaskAPI.getRecommendations,
    refetchInterval: 10000,
  });

  // Mutation para registrar energia
  const registerEnergyMutation = useMutation({
    mutationFn: (level: number) => loviTaskAPI.registerEnergy(level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cognitive-load'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSelectedEnergy(null);
    },
  });

  const handleRegisterEnergy = (level: number) => {
    registerEnergyMutation.mutate(level);
  };

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

  const getEnergyEmoji = (level: number) => {
    if (level <= 3) return '😴';
    if (level <= 6) return '🙂';
    if (level <= 8) return '⚡';
    return '🔥';
  };

  const getEnergyLabel = (level: number) => {
    if (level <= 3) return 'Baixa';
    if (level <= 6) return 'Moderada';
    if (level <= 8) return 'Alta';
    return 'Excepcional';
  };

  // Helper para sobrecarga
  const getLoadBadgeColor = (score: number) => {
    if (score <= 20) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score <= 40) return 'text-teal-500 bg-teal-500/10 border-teal-500/20';
    if (score <= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    if (score <= 80) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse';
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
          <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
            isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200/80 shadow-sm'
          }`}>
            <span className="text-xl">💡</span>
          </div>
          Recomendações & Energia
        </h2>
        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
          Ajuste dinâmico de tarefas com base na sua energia física e nível de sobrecarga cognitiva acumulada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna 1: Registrar Energia e Diagnóstico de Sobrecarga */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Card Energia Diária */}
          <div className={cardClass}>
            <h3 className={`text-sm font-black mb-4 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span className="text-lg">🔋</span>
              <span>Como está sua energia hoje?</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { val: 2, label: 'Baixa', emoji: '😴' },
                { val: 5, label: 'Média', emoji: '🙂' },
                { val: 7, label: 'Alta', emoji: '⚡' },
                { val: 9, label: 'Focada', emoji: '🔥' }
              ].map(item => (
                <button
                  key={item.val}
                  onClick={() => handleRegisterEnergy(item.val)}
                  disabled={registerEnergyMutation.isPending}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-1.5 font-bold text-xs ${
                    load?.userEnergyLevel === item.val
                      ? 'bg-indigo-650 border-indigo-650 text-white scale-[1.03] shadow-md shadow-indigo-500/10'
                      : isDarkMode
                        ? 'bg-slate-950/60 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-655 hover:text-slate-800'
                  }`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {load?.userEnergyLevel && (
              <p className="text-[10px] text-slate-400 font-semibold mt-5 text-center leading-relaxed">
                Energia registrada: <strong className="text-indigo-550 dark:text-indigo-400">{getEnergyEmoji(load.userEnergyLevel)} {getEnergyLabel(load.userEnergyLevel)}</strong>. O planejamento foi adaptado.
              </p>
            )}
          </div>

          {/* Card Status da Sobrecarga */}
          <div className={cardClass}>
            <div className="flex justify-between items-center mb-5">
              <h3 className={`text-sm font-black flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <span className="text-lg">🧠</span>
                <span>Carga de Trabalho</span>
              </h3>
              {load && (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider ${getLoadBadgeColor(load.score)}`}>
                  {load.classification}
                </span>
              )}
            </div>

            {loadingLoad ? (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold">Analisando fadiga mental...</div>
            ) : load ? (
              <div className="space-y-4">
                <div className="flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-slate-400">Sobrecarga Cognitiva:</span>
                  <span className="text-2xl font-black text-indigo-550 dark:text-indigo-400">{load.score}%</span>
                </div>
                <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100 shadow-inner'}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      load.score <= 40 ? 'bg-emerald-500' : load.score <= 65 ? 'bg-amber-500' : 'bg-rose-500'
                    }`} 
                    style={{ width: `${load.score}%` }} 
                  />
                </div>

                <div className={`p-4 rounded-2xl border text-xs leading-relaxed font-semibold mt-4 ${
                  isDarkMode ? 'bg-slate-950/30 border-slate-900 text-slate-350' : 'bg-indigo-50/15 border-indigo-100/40 text-slate-750'
                }`}>
                  {load.mitigationAdvice}
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-slate-150/30 dark:border-slate-850/35 pt-4 text-[9px] font-black uppercase text-slate-400 text-center">
                  <div>
                    <span className="block text-slate-800 dark:text-white text-xs">{load.activeTasksCount}</span>
                    Tarefas
                  </div>
                  <div>
                    <span className="block text-slate-800 dark:text-white text-xs">{load.delayedTasksCount}</span>
                    Atrasos
                  </div>
                  <div>
                    <span className="block text-slate-800 dark:text-white text-xs">{load.recentInterruptionCount}</span>
                    Pausas
                  </div>
                </div>
              </div>
            ) : null}
          </div>

        </div>

        {/* Coluna 2 & 3: Recomendações Práticas baseadas em Energia */}
        <div className="lg:col-span-2">
          
          <div className={`border rounded-[32px] p-8 shadow-sm h-full ${
            isDarkMode ? 'bg-brand-cardDark/40 border-slate-800/60' : 'bg-white border-indigo-50/85'
          }`}>
            <h3 className={`text-sm font-black mb-6 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span className="text-lg">💡</span>
              <span>Recomendações da Inteligência Adaptativa</span>
            </h3>

            {loadingRecs ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <svg className="animate-spin h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-slate-400 text-xs font-semibold">Buscando conselhos de produtividade...</span>
              </div>
            ) : recommendations && recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className={recItemClass}>
                    
                    {/* Ícone por categoria */}
                    <div className={`p-3 rounded-2xl shrink-0 flex items-center justify-center text-lg ${
                      rec.category === 'Energia' 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                        : rec.category === 'Foco' 
                          ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {rec.category === 'Energia' ? '🔋' : rec.category === 'Foco' ? '🎯' : '📅'}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{rec.title}</h4>
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
                      
                      <p className={`text-xs leading-relaxed mt-1.5 ${isDarkMode ? 'text-slate-350' : 'text-slate-655 font-semibold'}`}>
                        {rec.description}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                Nenhuma recomendação disponível para o seu contexto no momento. Tente registrar sua energia diária!
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
export default RecommendationsAndEnergy;
