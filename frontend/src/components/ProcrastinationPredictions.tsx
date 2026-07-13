import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { loviTaskAPI } from '../services/api';

interface ProcrastinationPredictionsProps {
  isDarkMode: boolean;
}

export const ProcrastinationPredictions = ({ isDarkMode }: ProcrastinationPredictionsProps) => {
  const queryClient = useQueryClient();

  // Queries
  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: loviTaskAPI.getPredictions,
    refetchInterval: 10000,
  });

  // Mutations
  const optimizeMutation = useMutation({
    mutationFn: (id: number) => loviTaskAPI.optimizeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['cognitive-load'] });
    },
  });

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (risk < 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const getBarColor = (risk: number) => {
    if (risk < 30) return 'bg-emerald-500';
    if (risk < 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const cardClass = `border transition-all duration-300 p-6 rounded-[28px] shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 ${
    isDarkMode 
      ? 'bg-brand-cardDark/40 border-slate-800/60 shadow-slate-950/20 hover:border-slate-800' 
      : 'bg-white border-indigo-50/60 shadow-indigo-100/20 hover:shadow-md hover:border-indigo-100'
  }`;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
          <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
            isDarkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200/80 shadow-sm'
          }`}>
            <span className="text-xl">🔮</span>
          </div>
          Previsão de Procrastinação
        </h2>
        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-550 font-semibold'}`}>
          Analiso sua energia física e mental, a complexidade das tarefas e seus picos históricos de adiamento para indicar riscos antes que aconteçam.
        </p>
      </div>

      {loadingPredictions ? (
        <div className="text-center py-20 text-xs text-slate-400 font-semibold">Analisando riscos com IA...</div>
      ) : predictions && predictions.length > 0 ? (
        <div className="space-y-4">
          {predictions.map((pred) => (
            <motion.div
              key={pred.taskId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cardClass}
            >
              <div className="space-y-3.5 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className={`font-black text-xs ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{pred.taskTitle}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${getRiskColor(pred.riskPercentage)}`}>
                    Risco: {pred.riskPercentage}%
                  </span>
                </div>

                {/* Risk Bar */}
                <div className={`h-2 w-full rounded-full overflow-hidden max-w-md ${isDarkMode ? 'bg-slate-900' : 'bg-indigo-50/50'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pred.riskPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${getBarColor(pred.riskPercentage)}`}
                  />
                </div>

                {/* Explanation text */}
                <p className={`text-[11px] font-semibold leading-relaxed max-w-2xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {pred.explanation}
                </p>
              </div>

              {/* Action Button: Optimize Schedule */}
              {pred.riskPercentage >= 30 && (
                <div className="shrink-0 self-end md:self-center">
                  <button
                    onClick={() => optimizeMutation.mutate(pred.taskId)}
                    disabled={optimizeMutation.isPending}
                    className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-200 border flex items-center gap-1.5 active:scale-95 ${
                      isDarkMode 
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                        : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-sm'
                    }`}
                  >
                    <span>💡</span>
                    <span>{optimizeMutation.isPending ? 'Otimizando...' : 'Otimizar Horário'}</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400 text-xs border border-dashed rounded-[32px] border-slate-200 dark:border-slate-855 font-semibold">
          Nenhuma tarefa ativa pendente para analisar procrastinação. Crie uma tarefa na aba Planejamento!
        </div>
      )}
    </div>
  );
};
export default ProcrastinationPredictions;
