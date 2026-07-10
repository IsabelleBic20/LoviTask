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
      // Salva automaticamente cada microtarefa sugerida no banco como pendente (completed: undefined/null)
      if (data && data.length > 0) {
        for (const task of data) {
          try {
            await loviTaskAPI.trackEvent({
              userId: 'default-user',
              eventType: 'task',
              timestamp: new Date().toISOString(),
              description: task.title,
              category: goal || 'Trabalho',
              completed: undefined, // Fica nulo/pendente no banco de dados
            });
          } catch (err) {
            console.error('Erro ao salvar microtarefa sugerida:', err);
          }
        }
        // Invalida a query de eventos para atualizar a lista com os novos itens pendentes
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
      // Invalidate all related queries to update UI instantly
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna 1 & 2: Brain Dump e Sugestões */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition duration-300 hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Brain Dump Inteligente</h2>
          </div>
          
          <p className="text-slate-500 mb-6 text-sm">
            Escreva tudo o que está na sua mente. A inteligência do assistente vai identificar as microtarefas e **salvar automaticamente cada uma delas** no seu histórico como pendentes.
          </p>

          <form onSubmit={handleBrainDumpSubmit} className="space-y-4">
            <textarea
              value={brainDumpText}
              onChange={(e) => setBrainDumpText(e.target.value)}
              placeholder="Descarregue seus pensamentos aqui, ex: 'Preciso terminar o relatório de vendas hoje à tarde, mas estou muito cansado. Também preciso comprar ração para o cachorro amanhã...'"
              className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-700 bg-slate-50/50"
              rows={5}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Meta Associada (opcional)</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ex: Trabalho, Estudos, Casa"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-700 bg-slate-50/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Prazo Final (opcional)</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-700 bg-slate-50/50 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={analyzeMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-2"
            >
              {analyzeMutation.isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Analisando e salvando tarefas...</span>
                </>
              ) : (
                'Analisar e Criar Microtarefas'
              )}
            </button>
          </form>

          {analyzeMutation.isError && (
            <div className="mt-4 bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-sm">
              Erro ao analisar Brain Dump. Por favor, verifique se a API está online e tente novamente.
            </div>
          )}
        </div>

        {/* Lista de Microtarefas Geradas no Brain Dump Recente */}
        {analyzeMutation.data && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-800">💡 Microtarefas Recomendadas</h3>
            <p className="text-xs text-slate-400">
              Estas são as microtarefas identificadas no último envio. Elas já foram adicionadas como **Pendentes** no histórico de atividades ao lado para que você não as perca!
            </p>
            <div className="space-y-3">
              {analyzeMutation.data.map((task: MicrotaskSuggestion, index: number) => (
                <div key={index} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          task.priority === 'Alta'
                            ? 'bg-rose-100 text-rose-800'
                            : task.priority === 'Média'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <h4 className="font-bold text-slate-800">{task.title}</h4>
                    </div>
                    <p className="text-slate-500 text-sm">{task.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl self-start md:self-auto">
                    Salva no histórico
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition duration-300 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">
              {editingEventId ? '✍️ Atualizar Atividade' : '📋 Registrar Atividade'}
            </h3>
            {!showLogForm && (
              <button
                onClick={() => {
                  setEditingEventId(null);
                  setShowLogForm(true);
                }}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition"
              >
                + Formulário
              </button>
            )}
          </div>

          {showLogForm ? (
            <form onSubmit={handleLogEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição da Atividade</label>
                <input
                  type="text"
                  required
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="Ex: Ler capítulo de livro, Correr"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-700 bg-slate-50/50 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
                  <select
                    value={logCategory}
                    onChange={(e) => setLogCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-700 bg-slate-50/50 text-sm"
                  >
                    <option value="Trabalho">Trabalho</option>
                    <option value="Estudo">Estudo</option>
                    <option value="Rotina">Rotina</option>
                    <option value="Saúde">Saúde</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tempo (minutos)</label>
                  <input
                    type="number"
                    min={1}
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-700 bg-slate-50/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nível de Energia: {logEnergy}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={logEnergy}
                  onChange={(e) => setLogEnergy(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-100 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Baixa (1)</span>
                  <span>Média (5)</span>
                  <span>Alta (10)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Humor</label>
                  <select
                    value={logMood}
                    onChange={(e) => setLogMood(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-700 bg-slate-50/50 text-sm"
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
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Resultado</label>
                  <select
                    value={logCompleted ? 'true' : 'false'}
                    onChange={(e) => setLogCompleted(e.target.value === 'true')}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-700 bg-slate-50/50 text-sm font-semibold"
                  >
                    <option value="true" className="text-emerald-600">Concluída</option>
                    <option value="false" className="text-rose-600">Abandonada</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={trackMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium py-2 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition active:scale-[0.98] text-sm disabled:opacity-50"
                >
                  {trackMutation.isPending ? 'Salvando...' : editingEventId ? 'Atualizar' : 'Salvar Atividade'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogForm(false);
                    setEditingEventId(null);
                  }}
                  className="border border-slate-200 hover:bg-slate-50 font-medium py-2 px-4 rounded-xl transition text-slate-500 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-slate-400 text-xs mb-3">Nenhuma atividade selecionada para registro.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingEventId(null);
                  setShowLogForm(true);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-4 py-2 rounded-xl transition text-xs active:scale-[0.98]"
              >
                Registrar Atividade Manual
              </button>
            </div>
          )}
        </div>

        {/* Histórico Completo de Eventos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">📜 Histórico de Microtarefas</h3>
          {loadingEvents ? (
            <div className="text-center text-xs text-slate-400 py-6">Carregando histórico...</div>
          ) : events && events.length > 0 ? (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {[...events].reverse().map((ev: UserActivityEvent) => (
                <div key={ev.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/30 flex flex-col gap-2 transition duration-200 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-700 leading-tight text-xs">{ev.description}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">
                          {ev.category}
                        </span>
                        {ev.estimatedMinutes && ev.completed !== null && (
                          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">
                            {ev.estimatedMinutes}m
                          </span>
                        )}
                        {ev.energyLevel && ev.completed !== null && (
                          <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded text-[10px]">
                            ⚡ {ev.energyLevel}/10
                          </span>
                        )}
                        {ev.mood && ev.completed !== null && (
                          <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[10px]">
                            {ev.mood}
                          </span>
                        )}
                      </div>
                    </div>
                    {ev.completed === true ? (
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-emerald-100 text-emerald-800 shrink-0">
                        Concluída
                      </span>
                    ) : ev.completed === false ? (
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-rose-100 text-rose-800 shrink-0">
                        Abandonada
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-sky-100 text-sky-800 shrink-0">
                        Pendente
                      </span>
                    )}
                  </div>

                  {/* Se a tarefa for pendente, exibe botões rápidos para registrar a conclusão/abandono */}
                  {ev.completed === null && (
                    <div className="flex gap-2 border-t border-slate-100 pt-2 mt-1">
                      <button
                        onClick={() => handleStartUpdateEvent(ev, true)}
                        className="flex-1 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-[10px] transition text-center flex items-center justify-center gap-1"
                      >
                        ✔️ Concluir
                      </button>
                      <button
                        onClick={() => handleStartUpdateEvent(ev, false)}
                        className="flex-1 py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-[10px] transition text-center flex items-center justify-center gap-1"
                      >
                        ❌ Abandonar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
              Nenhuma atividade registrada no banco de dados ainda. Envie um Brain Dump para começar!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
