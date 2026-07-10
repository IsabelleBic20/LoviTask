import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { loviTaskAPI } from '../services/api';

interface ProfileProps {
  isDarkMode: boolean;
}

export const Profile = ({ isDarkMode }: ProfileProps) => {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: loviTaskAPI.getProfile,
    refetchInterval: 10000,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations'],
    queryFn: loviTaskAPI.getRecommendations,
    refetchInterval: 10000,
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
            <span className="text-xl">🧠</span>
          </div>
          Seu Perfil Cognitivo
        </h2>
        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
          Entenda como sua mente trabalha. Padrões comportamentais e análise adaptativa de foco.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Padrões Cognitivos e Análise AI */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Resumo de Análise */}
          <motion.div variants={itemVariants} className={cardClass}>
            {isDarkMode && <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />}
            <h3 className={`text-base font-black mb-4 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span className="text-lg select-none">🤖</span>
              <span>Análise do Lovi</span>
            </h3>
            <p className={`text-xs leading-relaxed font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-655'}`}>
              {profile?.summary || "Falta de histórico de eventos. Envie um Brain Dump para que o assistente analise seus padrões cognitivos."}
            </p>
          </motion.div>

          {/* Card Ritmo Mental Ideal */}
          <motion.div variants={itemVariants} className={cardClass}>
            {isDarkMode && <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />}
            <h3 className={`text-base font-black mb-5 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span className="text-lg select-none">⚡</span>
              <span>Padrões de Trabalho</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Você trabalha melhor:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-black">
                  ☀ {profile?.productivityWindow?.period || 'Manhã'}
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100 shadow-inner'}`}>
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round((profile?.productivityWindow?.confidence || 0.8) * 100)}%` }} 
                />
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between text-xs border-t border-slate-100/50 dark:border-slate-800/50 pt-3">
                  <span className="text-slate-400 font-semibold">Sessões ideais</span>
                  <span className="font-extrabold text-slate-800 dark:text-white">35 minutos</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Maior distração</span>
                  <span className="font-extrabold text-rose-500 uppercase text-[10px] bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                    Troca de contexto
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Melhor tipo de tarefa</span>
                  <span className="font-extrabold text-emerald-500 uppercase text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Criativas e Foco Único
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Coluna Direita: Recomendações Personalizadas */}
        <div className="lg:col-span-2">
          <motion.div 
            variants={itemVariants}
            className={`border rounded-[32px] p-8 shadow-sm h-full ${
              isDarkMode ? 'bg-brand-cardDark/40 border-slate-800/60' : 'bg-white border-indigo-50/85'
            }`}
          >
            <h3 className={`text-base font-black mb-6 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span className="text-lg">💡</span>
              <span>Recomendações Práticas</span>
            </h3>

            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className={recItemClass}
                  >
                    {/* Icon based on category */}
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
                        <h4 className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{rec.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                          rec.category === 'Energia' 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                            : rec.category === 'Foco' 
                              ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20' 
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {rec.category}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
                        {rec.description}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-16 text-xs border border-dashed rounded-[28px] ${
                isDarkMode ? 'border-slate-800 bg-slate-950/20 text-slate-500' : 'border-slate-300 bg-slate-50/50 text-slate-400 font-semibold'
              }`}>
                Nenhuma recomendação disponível para o seu contexto no momento. Envie um Brain Dump para que o assistente analise seus padrões cognitivos.
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
};
