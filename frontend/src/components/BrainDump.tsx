import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loviTaskAPI } from '../services/api';
import { MicrotaskSuggestion, UserActivityEvent } from '../types';

interface BrainDumpProps {
  isDarkMode: boolean;
}

export const BrainDump = ({ isDarkMode }: BrainDumpProps) => {
  const queryClient = useQueryClient();

  // Brain Dump States
  const [brainDumpText, setBrainDumpText] = useState('');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');

  // Interactive Categories list (prefilled with friendly icons)
  const [categories, setCategories] = useState(['Trabalho', 'Estudos', 'Casa', 'Saúde']);

  // Event Logger States (Modal based)
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
        
        // Clear text field after successful dump analysis
        setBrainDumpText('');
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
  };

  // Helper categories matching user spec
  const getCategoryEmoji = (cat: string) => {
    if (cat.toLowerCase().includes('trabalho')) return '💼';
    if (cat.toLowerCase().includes('estudo')) return '📚';
    if (cat.toLowerCase().includes('casa')) return '🏠';
    if (cat.toLowerCase().includes('saúde') || cat.toLowerCase().includes('saude')) return '❤️';
    return '🌱';
  };

  // Helper energy level matching spec
  const getEnergyLabel = (lvl: number) => {
    if (lvl <= 3) return '😴 Energia Baixa';
    if (lvl <= 7) return '🙂 Energia Média';
    return '🔥 Energia Alta';
  };

  // Reusable classes for playful cards
  const cardClass = `border transition-all duration-300 p-8 rounded-[28px] shadow-lg relative overflow-hidden group ${
    isDarkMode 
      ? 'bg-slate-900/40 border-slate-800/80 shadow-slate-950/40 hover:border-slate-800' 
      : 'bg-white border-indigo-50/60 shadow-indigo-100/30 hover:border-indigo-100'
  }`;

  const inputClass = `w-full p-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm leading-relaxed ${
    isDarkMode 
      ? 'bg-slate-950/50 border-slate-850 text-slate-200 placeholder-slate-650' 
      : 'bg-indigo-50/20 border-indigo-100/80 text-slate-800 placeholder-slate-400 focus:bg-white'
  }`;

  const selectClass = `w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-xs font-bold ${
    isDarkMode 
      ? 'bg-slate-950/50 border-slate-850 text-slate-200' 
      : 'bg-white border-slate-250 text-slate-850'
  }`;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna 1 & 2: Chat-like Brain Dump */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Playful Brain Dump Box */}
          <div className={`${cardClass} border-indigo-100/40`}>
            {isDarkMode && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />}
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl animate-pulse">💭</span>
              <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                O que está ocupando sua mente hoje?
              </h2>
            </div>

            <form onSubmit={handleBrainDumpSubmit} className="space-y-6">
              {/* Speck bubble textarea container */}
              <div className="relative">
                <textarea
                  value={brainDumpText}
                  onChange={(e) => setBrainDumpText(e.target.value)}
                  placeholder="Escreva qualquer coisa que vier na cabeça... tarefas pendentes, ideias, prazos ou sentimentos."
                  className={inputClass}
                  rows={6}
                  aria-label="Área de Brain Dump"
                />
              </div>

              {/* Category Chips Selector (Direct replacements for standard inputs) */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500">
                  🏷️ Associar à Meta Principal:
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGoal(goal === cat ? '' : cat)}
                      className={`px-4 py-2 rounded-full font-bold text-xs transition-all duration-200 border flex items-center gap-1.5 ${
                        goal === cat 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105' 
                          : isDarkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{getCategoryEmoji(cat)}</span>
                      <span>{cat}</span>
                      {goal === cat && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                  
                  {/* Create custom category chip */}
                  <button
                    type="button"
                    onClick={() => {
                      const newCat = prompt('Digite o nome da nova categoria:');
                      if (newCat && !categories.includes(newCat)) {
                        setCategories([...categories, newCat]);
                        setGoal(newCat);
                      }
                    }}
                    className={`px-4 py-2 rounded-full font-bold text-xs transition-all duration-200 border border-dashed ${
                      isDarkMode 
                        ? 'border-slate-800 text-slate-500 hover:text-slate-400' 
                        : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    ➕ Nova Categoria
                  </button>
                </div>
              </div>

              {/* Deadline (Cute styled input) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500">
                  📅 Prazo final sugerido (opcional):
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`${inputClass} !p-3 max-w-sm`}
                  aria-label="Prazo final"
                />
              </div>

              {/* Submit button */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t border-slate-100/50 dark:border-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">😊</span>
                  <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Relaxa. Eu transformo tudo isso em microtarefas claras.
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={analyzeMutation.isPending}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all duration-250 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm animate-breathe"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Organizando sua mente...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Organizar Minha Mente</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Microtarefas Recomendadas (Cozy, custom cards) */}
          {analyzeMutation.data && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💡</span>
                <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Microtarefas Geradas</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyzeMutation.data.map((task: MicrotaskSuggestion, index: number) => (
                  <div 
                    key={index} 
                    className={`p-5 rounded-[24px] border flex flex-col justify-between gap-4 transition duration-300 hover:-translate-y-1 ${
                      task.priority === 'Alta'
                        ? 'bg-rose-50/30 border-rose-200 text-slate-800 dark:bg-rose-950/10 dark:border-rose-900/40 dark:text-white'
                        : task.priority === 'Média'
                          ? 'bg-amber-50/30 border-amber-250 text-slate-800 dark:bg-amber-950/10 dark:border-amber-900/40 dark:text-white'
                          : 'bg-emerald-50/30 border-emerald-250 text-slate-800 dark:bg-emerald-950/10 dark:border-emerald-900/40 dark:text-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {task.priority === 'Alta' ? '🔥' : task.priority === 'Média' ? '⭐' : '🌱'}
                        </span>
                        <h4 className="font-extrabold text-sm leading-snug">{task.title}</h4>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {task.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        task.priority === 'Alta' ? 'text-rose-500' : task.priority === 'Média' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {task.priority} Prioridade
                      </span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                        Salva ✓
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna 3: Fluxo de Atividades (Mini-Cards) */}
        <div className="space-y-6">
          <div className={`${cardClass} border-sky-100/40`}>
            <h3 className={`text-base font-black mb-5 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span>📜</span>
              <span>Fluxo de Atividades</span>
            </h3>

            {loadingEvents ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {[...events].reverse().map((ev: UserActivityEvent) => (
                  <div 
                    key={ev.id} 
                    className={`p-5 rounded-[24px] border transition-all duration-300 flex flex-col gap-3.5 hover:shadow-md ${
                      ev.completed === true 
                        ? 'bg-emerald-50/20 border-emerald-150 dark:bg-emerald-950/5 dark:border-emerald-900/30' 
                        : ev.completed === false 
                          ? 'bg-rose-50/20 border-rose-150 dark:bg-rose-950/5 dark:border-rose-900/30' 
                          : isDarkMode 
                            ? 'bg-slate-950/40 border-slate-900 hover:border-slate-800' 
                            : 'bg-white border-slate-200/80 hover:border-slate-350 shadow-sm'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`font-black leading-snug text-xs ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          🧠 {ev.description}
                        </p>
                        
                        {/* Custom status tag */}
                        {ev.completed === true ? (
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                            Feita
                          </span>
                        ) : ev.completed === false ? (
                          <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 shrink-0">
                            Fica p/ Depois
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 shrink-0 animate-pulse">
                            Pendente
                          </span>
                        )}
                      </div>

                      {/* Info Chips (Time, Energy, Category) */}
                      <div className="flex gap-2 flex-wrap pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          {getCategoryEmoji(ev.category || 'Trabalho')} {ev.category || 'Trabalho'}
                        </span>
                        
                        {ev.estimatedMinutes !== null && ev.estimatedMinutes !== undefined && ev.completed !== null && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-150 text-indigo-650'
                          }`}>
                            ⏱️ {ev.estimatedMinutes} min
                          </span>
                        )}
                        
                        {ev.energyLevel !== null && ev.energyLevel !== undefined && ev.completed !== null && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            isDarkMode ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-150 text-purple-650'
                          }`}>
                            {getEnergyLabel(ev.energyLevel)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pending task inline actions */}
                    {ev.completed === null && (
                      <div className="flex gap-2.5 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                        <button
                          onClick={() => handleStartUpdateEvent(ev, true)}
                          className={`flex-1 py-2 px-3 border font-extrabold rounded-xl text-[9px] uppercase tracking-wider transition text-center flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                            isDarkMode 
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400' 
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                          }`}
                        >
                          ✔️ Concluir
                        </button>
                        <button
                          onClick={() => handleStartUpdateEvent(ev, false)}
                          className={`flex-1 py-2 px-3 border font-extrabold rounded-xl text-[9px] uppercase tracking-wider transition text-center flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                            isDarkMode 
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400' 
                              : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                          }`}
                        >
                          ❌ Adiar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 text-xs border border-dashed rounded-3xl ${
                isDarkMode ? 'border-slate-800 bg-slate-950/20 text-slate-500' : 'border-slate-350 bg-slate-50 text-slate-400'
              }`}>
                Nenhuma atividade no fluxo. Descarregue sua mente para começarmos!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) + Modal overlay (instead of hardcoded col form) */}
      <button
        onClick={() => {
          setEditingEventId(null);
          setLogDescription('');
          setLogCategory('Trabalho');
          setLogMinutes(30);
          setLogEnergy(5);
          setLogMood('Neutro');
          setLogCompleted(true);
          setShowLogForm(true);
        }}
        className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center gap-2 group border border-indigo-400/20"
        aria-label="Registrar atividade manualmente"
      >
        <span className="text-xl">➕</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out text-xs font-black uppercase tracking-wider whitespace-nowrap">
          Registrar Atividade
        </span>
      </button>

      {/* Modal Dialog Form */}
      {showLogForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md border rounded-[28px] p-6 shadow-2xl animate-headshake relative ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-indigo-50 text-slate-850'
          }`}>
            <button 
              type="button" 
              onClick={() => {
                setShowLogForm(false);
                setEditingEventId(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 text-xl font-bold p-1 transition-colors"
            >
              ✕
            </button>

            <h3 className={`text-lg font-black mb-5 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span>{editingEventId ? '✍️' : '📋'}</span>
              <span>{editingEventId ? 'Atualizar Atividade' : 'Registrar Atividade'}</span>
            </h3>

            <form onSubmit={handleLogEventSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Descrição da Atividade</label>
                <input
                  type="text"
                  required
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="Ex: Ler capítulo de livro, Correr"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Categoria</label>
                  <select
                    value={logCategory}
                    onChange={(e) => setLogCategory(e.target.value)}
                    className={selectClass}
                  >
                    <option value="Trabalho">💼 Trabalho</option>
                    <option value="Estudo">📚 Estudo</option>
                    <option value="Rotina">🏠 Rotina</option>
                    <option value="Saúde">❤️ Saúde</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Tempo (minutos)</label>
                  <input
                    type="number"
                    min={1}
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(Number(e.target.value))}
                    className={selectClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                  <span>Nível de Energia</span>
                  <span className="text-indigo-600 font-extrabold text-xs">{logEnergy}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={logEnergy}
                  onChange={(e) => setLogEnergy(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 rounded-lg cursor-pointer bg-slate-200"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-semibold">
                  <span>😴 Baixa (1)</span>
                  <span>🙂 Média (5)</span>
                  <span>🔥 Alta (10)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Humor</label>
                  <select
                    value={logMood}
                    onChange={(e) => setLogMood(e.target.value)}
                    className={selectClass}
                  >
                    <option value="Focado">🎯 Focado</option>
                    <option value="Calmo">🧘 Calmo</option>
                    <option value="Bem">😊 Bem</option>
                    <option value="Animado">🎉 Animado</option>
                    <option value="Ansioso">😵 Ansioso</option>
                    <option value="Cansado">😴 Cansado</option>
                    <option value="Neutro">😐 Neutro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Resultado</label>
                  <select
                    value={logCompleted ? 'true' : 'false'}
                    onChange={(e) => setLogCompleted(e.target.value === 'true')}
                    className={selectClass}
                  >
                    <option value="true" className="text-emerald-600 font-bold">✔️ Concluída</option>
                    <option value="false" className="text-rose-600 font-bold">❌ Abandonada</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100/50 dark:border-slate-900/50">
                <button
                  type="submit"
                  disabled={trackMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black py-3 rounded-2xl transition active:scale-[0.98] text-xs disabled:opacity-50"
                >
                  {trackMutation.isPending ? 'Salvando...' : editingEventId ? 'Atualizar' : 'Salvar Atividade'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogForm(false);
                    setEditingEventId(null);
                  }}
                  className={`border font-black py-3 px-5 rounded-2xl transition text-xs ${
                    isDarkMode 
                      ? 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400' 
                      : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-600'
                  }`}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
