import { useQuery } from '@tanstack/react-query';
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
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-400 text-sm font-semibold">Gerando perfil cognitivo...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm text-center font-bold">
        Erro ao carregar o perfil cognitivo.
      </div>
    );
  }

  // Reusable classes for playful cards
  const cardClass = `border transition-all duration-300 p-6 rounded-[28px] shadow-lg relative overflow-hidden group ${
    isDarkMode 
      ? 'bg-slate-900/40 border-slate-800/80 shadow-slate-950/40 hover:border-slate-800' 
      : 'bg-white border-indigo-50/60 shadow-indigo-100/30 hover:border-indigo-100'
  }`;

  const recItemClass = `border rounded-2xl p-5 transition duration-300 flex items-start gap-4 ${
    isDarkMode 
      ? 'bg-slate-950/40 border-slate-900 hover:border-slate-800' 
      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/50 hover:border-slate-350 shadow-sm'
  }`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
          <div className={`p-2 rounded-xl border ${
            isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm'
          }`}>
            <span>🌱</span>
          </div>
          Seu Perfil Cognitivo
        </h2>
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
          Análise comportamental gerada com auxílio de aprendizado heurístico para otimização mental de tarefas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Resumo AI e Janela de Produtividade */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Resumo */}
          <div className={cardClass}>
            {isDarkMode && <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-br-3xl border-r border-b border-indigo-500/20" />}
            <h3 className={`text-base font-black mb-4 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span className="text-xl">🤖</span> Resumo de Análise
            </h3>
            <p className={`text-xs leading-relaxed font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {profile?.summary || "Carregando análises heurísticas baseadas no seu fluxo de atividade diária..."}
            </p>
          </div>

          {/* Card Janela de Produtividade */}
          {profile?.productivityWindow && (
            <div className={cardClass}>
              {isDarkMode && <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />}
              <h3 className={`text-base font-black mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <span>⚡ Janela de Maior Foco</span>
              </h3>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mb-4">
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">Período Ideal</p>
                <p className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{profile.productivityWindow.period}</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Confiança Heurística</span>
                  <span className="text-indigo-600 font-extrabold">{Math.round((profile.productivityWindow.confidence || 0) * 100)}%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-200 shadow-inner'}`}>
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.round((profile.productivityWindow.confidence || 0) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Coluna Direita: Recomendações Personalizadas */}
        <div className="lg:col-span-2">
          <div className={`border rounded-[28px] p-6 shadow-lg h-full ${
            isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-indigo-50/80'
          }`}>
            <h3 className={`text-lg font-black mb-6 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span>💡 Recomendações de Ação Rápida</span>
            </h3>

            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className={recItemClass}
                  >
                    {/* Icon based on category */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      rec.category === 'Energia' 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                        : rec.category === 'Foco' 
                          ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' 
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    }`}>
                      {rec.category === 'Energia' ? '⚡' : rec.category === 'Foco' ? '🎯' : '📅'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-slate-850'}`}>{rec.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                          rec.category === 'Energia' 
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                            : rec.category === 'Foco' 
                              ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' 
                              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        }`}>
                          {rec.category}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                        {rec.description}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 text-xs border border-dashed rounded-[24px] ${
                isDarkMode ? 'border-slate-800 bg-slate-950/20 text-slate-500' : 'border-slate-350 bg-slate-50 text-slate-400 font-semibold'
              }`}>
                Nenhuma recomendação disponível. Envie um Brain Dump para que o assistente analise seus padrões cognitivos.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
