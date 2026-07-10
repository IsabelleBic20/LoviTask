import { useQuery } from '@tanstack/react-query';
import { loviTaskAPI } from '../services/api';

export const Profile = () => {
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
        <span className="text-slate-400 text-sm">Gerando perfil cognitivo...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
        Erro ao carregar o perfil cognitivo.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          Seu Perfil Cognitivo
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          Análise comportamental gerada com auxílio de aprendizado heurístico para otimização mental de tarefas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Resumo AI e Janela de Produtividade */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Resumo */}
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-br-3xl border-r border-b border-indigo-500/20" />
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-400">🤖</span> Resumo de Análise
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              {profile?.summary || "Carregando análises heurísticas baseadas no seu fluxo de atividade diária..."}
            </p>
          </div>

          {/* Card Janela de Produtividade */}
          {profile?.productivityWindow && (
            <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span>⚡ Janela de Maior Foco</span>
              </h3>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mb-4">
                <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Período Ideal</p>
                <p className="text-2xl font-black text-white mt-1">{profile.productivityWindow.period}</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>Confiança Heurística</span>
                  <span className="text-indigo-400">{Math.round((profile.productivityWindow.confidence || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
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
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-lg h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span>💡 Recomendações de Ação Rápida</span>
            </h3>

            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className="backdrop-blur-xl bg-slate-950/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition duration-300 flex items-start gap-4"
                  >
                    {/* Icon based on category */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      rec.category === 'Energia' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : rec.category === 'Foco' 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {rec.category === 'Energia' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ) : rec.category === 'Foco' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-extrabold text-white text-sm">{rec.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          rec.category === 'Energia' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : rec.category === 'Foco' 
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {rec.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">
                        {rec.description}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-800 rounded-3xl bg-slate-950/20">
                Nenhuma recomendação disponível. Envie um Brain Dump para que o assistente analise seus padrões cognitivos.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
