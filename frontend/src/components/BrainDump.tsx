import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loviTaskAPI } from '../services/api';
import { MicrotaskSuggestion, UserActivityEvent } from '../types';

export const BrainDump = () => {
  const queryClient = useQueryClient();

  // Brain Dump States
  const [brainDumpText, setBrainDumpText] = useState('');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');

  // Event Logger States
  const [showLogForm, setShowLogForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [logDescription, setLogDescription] = useState('');
  const [logCategory, setLogCategory] = useState('Trabalho');
  const [logMinutes, setLogMinutes] = useState(30);
  const [logEnergy, setLogEnergy] = useState(5);
  const [logMood, setLogMood] = useState('Neutro');
  const [logCompleted, setLogCompleted] = useState(true);

  // Mutation for Brain Dump Analysis
  const analyzeMutation = useMutation({
    mutationFn: () =>
      loviTaskAPI.analyzeBrainDump({
        text: brainDumpText,
        goal: goal || undefined,
        deadline: deadline || undefined,
      }),
    onSuccess: async (data) => {
      // Salva automaticamente cada microtarefa sugerida no banco como pendente (completed: null)
      if (data && data.length > 0) {
        for (const task of data) {
          try {
            await loviTaskAPI.trackEvent({
              userId: 'default-user',
              eventType: 'task',
              timestamp: new Date().toISOString(),
              description: task.title,
              category: goal || 'Trabalho',
              completed: null, // Fica nulo/pendente no banco de dados
            });
          } catch (err) {
            console.error('Erro ao salvar microtarefa sugerida:', err);
          }
        }
        // Invalida as queries de eventos para atualizar a lista com os novos itens pendentes
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['metrics'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      }
    },
  });

  // Query for Registered Events
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn: loviTaskAPI.getEvents,
  });

  // Mutation for Saving/Tracking Event (Creations and Updates)
  const trackMutation = useMutation({
    mutationFn: (event: UserActivityEvent) => loviTaskAPI.trackEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      
      // Reset logging state
      setShowLogForm(false);
      setEditingEventId(null);
      setLogDescription('');
      setLogCategory('Trabalho');
      setLogMinutes(30);
      setLogEnergy(5);
      setLogMood('Neutro');
      setLogCompleted(true);
    },
  });

  const handleBrainDumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brainDumpText.trim()) {
      analyzeMutation.mutate();
    }
  };

  const handleLogEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDescription.trim()) return;

    const newEvent: UserActivityEvent = {
      id: editingEventId || undefined,
      userId: 'default-user',
      eventType: 'task',
      timestamp: new Date().toISOString(),
      description: logDescription,
      category: logCategory,
      estimatedMinutes: logMinutes,
      energyLevel: logEnergy,
      mood: logMood,
      completed: logCompleted,
    };

    trackMutation.mutate(newEvent);
  };

  const handleStartUpdateEvent = (ev: UserActivityEvent, completedStatus: boolean) => {
    setEditingEventId(ev.id || null);
    setLogDescription(ev.description || '');
    setLogCategory(ev.category || 'Trabalho');
    setLogMinutes(ev.estimatedMinutes || 30);
    setLogEnergy(ev.energyLevel || 5);
    setLogMood(ev.mood || 'Neutro');
    setLogCompleted(completedStatus);
    setShowLogForm(true);
    
    // Smooth scroll to the form
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      
      {/* Coluna 1 & 2: Brain Dump e Sugestões */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Card Brain Dump */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 transition duration-300 hover:border-slate-700/60 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Brain Dump Inteligente</h2>
          </div>
          
          <p className="text-slate-400 text-xs mb-6 leading-relaxed">
            Escreva em texto livre tudo o que está ocupando espaço mental. Nossa inteligência vai identificar as microtarefas relevantes e **salvar automaticamente cada uma delas** no seu histórico como pendentes.
          </p>

          <form onSubmit={handleBrainDumpSubmit} className="space-y-6">
            <textarea
              value={brainDumpText}
              onChange={(e) => setBrainDumpText(e.target.value)}
              placeholder="Descarregue seus pensamentos aqui, ex: 'Preciso terminar o relatório de vendas hoje à tarde, mas estou muito cansado. Também preciso comprar ração para o cachorro amanhã...'"
              className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-slate-200 placeholder-slate-600 text-sm leading-relaxed"
              rows={6}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Meta Associada (opcional)</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ex: Trabalho, Estudos, Casa"
                  className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-slate-200 placeholder-slate-600 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Prazo Final (opcional)</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-slate-200 text-xs text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={analyzeMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
            >
              {analyzeMutation.isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Analisando e gerando fluxo...</span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  Analisar e Criar Microtarefas
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {analyzeMutation.isError && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Erro ao processar o dump. Verifique se o backend está ativo e tente de novo.</span>
            </div>
          )}
        </div>

        {/* Lista de Microtarefas Geradas no Brain Dump Recente */}
        {analyzeMutation.data && (
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <h3 className="text-lg font-bold text-white">Microtarefas Recomendadas</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Identificadas automaticamente e inseridas no seu histórico ao lado em estado de **Pendente** para acompanhamento.
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              {analyzeMutation.data.map((task: MicrotaskSuggestion, index: number) => (
                <div 
                  key={index} 
                  className="bg-slate-950/40 border border-slate-900 hover:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition duration-200"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                          task.priority === 'Alta'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : task.priority === 'Média'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <h4 className="font-extrabold text-white text-sm">{task.title}</h4>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{task.description}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl self-start md:self-auto uppercase tracking-wider">
                    Registrada
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coluna 3: Registro Manual e Histórico de Eventos */}
      <div className="space-y-6">
        
        {/* Formulário de Registro/Edição de Atividade */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl transition duration-300 hover:border-slate-700/60 relative overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{editingEventId ? '✍️' : '📋'}</span>
              <span>{editingEventId ? 'Atualizar Atividade' : 'Registrar Atividade'}</span>
            </h3>
            {!showLogForm && (
              <button
                onClick={() => {
                  setEditingEventId(null);
                  setShowLogForm(true);
                }}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg"
              >
                + Registrar
              </button>
            )}
          </div>

          {showLogForm ? (
            <form onSubmit={handleLogEventSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="Ex: Ler capítulo de livro, Correr"
                  className="w-full p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-slate-200 placeholder-slate-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Categoria</label>
                  <select
                    value={logCategory}
                    onChange={(e) => setLogCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-slate-200 text-xs font-semibold"
                  >
                    <option value="Trabalho">Trabalho</option>
                    <option value="Estudo">Estudo</option>
                    <option value="Rotina">Rotina</option>
                    <option value="Saúde">Saúde</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tempo (minutos)</label>
                  <input
                    type="number"
                    min={1}
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  <span>Nível de Energia</span>
                  <span className="text-indigo-400 text-xs font-black">{logEnergy}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={logEnergy}
                  onChange={(e) => setLogEnergy(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer transition-all duration-200"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
                  <span>Baixa (1)</span>
                  <span>Média (5)</span>
                  <span>Alta (10)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Humor</label>
                  <select
                    value={logMood}
                    onChange={(e) => setLogMood(e.target.value)}
                    className="w-full p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-slate-200 text-xs font-semibold"
                  >
                    <option value="Focado">Focado</option>
                    <option value="Calmo">Calmo</option>
                    <option value="Bem">Bem</option>
                    <option value="Animado">Animado</option>
                    <option value="Ansioso">Ansioso</option>
                    <option value="Cansado">Cansado</option>
                    <option value="Neutro">Neutro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resultado</label>
                  <select
                    value={logCompleted ? 'true' : 'false'}
                    onChange={(e) => setLogCompleted(e.target.value === 'true')}
                    className="w-full p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-slate-200 text-xs font-semibold"
                  >
                    <option value="true" className="text-emerald-500 font-bold">Concluída</option>
                    <option value="false" className="text-rose-500 font-bold">Abandonada</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={trackMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2.5 rounded-xl transition active:scale-[0.98] text-xs disabled:opacity-50"
                >
                  {trackMutation.isPending ? 'Salvando...' : editingEventId ? 'Atualizar' : 'Salvar Atividade'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogForm(false);
                    setEditingEventId(null);
                  }}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 font-bold py-2.5 px-4 rounded-xl transition text-slate-400 text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
              <p className="text-slate-500 text-xs mb-4">Selecione uma tarefa abaixo ou registre manualmente:</p>
              <button
                type="button"
                onClick={() => {
                  setEditingEventId(null);
                  setShowLogForm(true);
                }}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl transition text-xs active:scale-[0.98] shadow-lg shadow-indigo-500/10"
              >
                Registrar Atividade Manual
              </button>
            </div>
          )}
        </div>

        {/* Histórico Completo de Eventos */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <span>📜</span>
            <span>Fluxo de Atividades</span>
          </h3>

          {loadingEvents ? (
            <div className="flex items-center justify-center py-12 space-y-2">
              <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {[...events].reverse().map((ev: UserActivityEvent) => (
                <div 
                  key={ev.id} 
                  className={`p-4 border rounded-2xl bg-slate-950/20 flex flex-col gap-3 transition duration-200 hover:border-slate-800 ${
                    ev.completed === true 
                      ? 'border-emerald-500/10 hover:border-emerald-500/20' 
                      : ev.completed === false 
                        ? 'border-rose-500/10 hover:border-rose-500/20' 
                        : 'border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-extrabold text-white leading-tight text-xs">{ev.description}</p>
                      
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="bg-slate-900 border border-slate-800/80 text-slate-400 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                          {ev.category}
                        </span>
                        {ev.estimatedMinutes !== null && ev.estimatedMinutes !== undefined && ev.completed !== null && (
                          <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                            🕒 {ev.estimatedMinutes}m
                          </span>
                        )}
                        {ev.energyLevel !== null && ev.energyLevel !== undefined && ev.completed !== null && (
                          <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                            ⚡ {ev.energyLevel}/10
                          </span>
                        )}
                        {ev.mood && ev.completed !== null && (
                          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                            {ev.mood}
                          </span>
                        )}
                      </div>
                    </div>

                    {ev.completed === true ? (
                      <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[8px] tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        Concluída
                      </span>
                    ) : ev.completed === false ? (
                      <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[8px] tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                        Abandonada
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[8px] tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0 animate-pulse">
                        Pendente
                      </span>
                    )}
                  </div>

                  {/* Se a tarefa for pendente, exibe botões rápidos para registrar a conclusão/abandono */}
                  {ev.completed === null && (
                    <div className="flex gap-2.5 border-t border-slate-900/80 pt-2.5 mt-1">
                      <button
                        onClick={() => handleStartUpdateEvent(ev, true)}
                        className="flex-1 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 font-bold rounded-xl text-[9px] uppercase tracking-wider transition text-center flex items-center justify-center gap-1.5 active:scale-[0.97]"
                      >
                        ✔️ Concluir
                      </button>
                      <button
                        onClick={() => handleStartUpdateEvent(ev, false)}
                        className="flex-1 py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 font-bold rounded-xl text-[9px] uppercase tracking-wider transition text-center flex items-center justify-center gap-1.5 active:scale-[0.97]"
                      >
                        ❌ Abandonar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-3xl bg-slate-950/20">
              Nenhuma atividade cadastrada. Digite um Brain Dump para gerar suas tarefas cognitivas!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
