import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { loviTaskAPI } from '../services/api';
import { MicrotaskSuggestion, UserActivityEvent } from '../types';

interface BrainDumpProps {
  isDarkMode: boolean;
  crisisMode?: boolean;
}

export const BrainDump = ({ isDarkMode, crisisMode = false }: BrainDumpProps) => {
  const queryClient = useQueryClient();

  // Brain Dump States
  const [brainDumpText, setBrainDumpText] = useState('');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');

  // Date Picker Custom States
  const [showDatePickerPopover, setShowDatePickerPopover] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date().getMonth());
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear());

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

  // AI Loading Message steps
  const [aiMessage, setAiMessage] = useState('Estou entendendo seu contexto...');
  
  // Mutation for Brain Dump Analysis
  const analyzeMutation = useMutation({
    mutationFn: () =>
      loviTaskAPI.analyzeBrainDump({
        text: brainDumpText,
        goal: goal || undefined,
        deadline: deadline || undefined,
      }),
    onSuccess: async (data) => {
      const inferCategory = (title: string, defaultGoal?: string): string => {
        const t = title.toLowerCase();
        
        // Estudos
        if (
          t.includes('estudar') || 
          t.includes('estudo') || 
          t.includes('poscomp') || 
          t.includes('unicamp') || 
          t.includes('universidade') || 
          t.includes('faculdade') || 
          t.includes('aula') || 
          t.includes('prova') || 
          t.includes('curso') || 
          t.includes('ler') || 
          t.includes('leitura') || 
          t.includes('livro')
        ) {
          return 'Estudos';
        }
        
        // Casa / Rotina
        if (
          t.includes('lavar') || 
          t.includes('roupa') || 
          t.includes('limpar') || 
          t.includes('casa') || 
          t.includes('cozinha') || 
          t.includes('louça') || 
          t.includes('supermercado') || 
          t.includes('compras') || 
          t.includes('organizar') || 
          t.includes('arrumar')
        ) {
          return 'Casa';
        }
        
        // Saúde
        if (
          t.includes('academia') || 
          t.includes('treino') || 
          t.includes('correr') || 
          t.includes('exercício') || 
          t.includes('exercicio') || 
          t.includes('malhar') || 
          t.includes('médico') || 
          t.includes('medico') || 
          t.includes('consulta') || 
          t.includes('saúde') || 
          t.includes('saude') || 
          t.includes('terapia')
        ) {
          return 'Saúde';
        }
        
        // Trabalho
        if (
          t.includes('trabalho') || 
          t.includes('reunião') || 
          t.includes('reuniao') || 
          t.includes('projeto') || 
          t.includes('cliente') || 
          t.includes('relatório') || 
          t.includes('relatorio') || 
          t.includes('enviar') || 
          t.includes('orçamento') || 
          t.includes('orcamento') || 
          t.includes('proposta')
        ) {
          return 'Trabalho';
        }

        return defaultGoal || 'Trabalho';
      };

      // Salva automaticamente cada microtarefa sugerida no banco como pendente (completed: null)
      if (data && data.length > 0) {
        for (const task of data) {
          try {
            await loviTaskAPI.trackEvent({
              userId: localStorage.getItem('lovitask_user') || sessionStorage.getItem('lovitask_user') || 'usuario@lovitask.com',
              eventType: 'task',
              timestamp: new Date().toISOString(),
              description: task.title,
              category: inferCategory(task.title, goal || undefined),
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

  // Cycle through humanized loading messages when AI is working
  useEffect(() => {
    let interval: any;
    if (analyzeMutation.isPending) {
      const messages = [
        "Estou entendendo seu contexto...",
        "Encontrando padrões de rotina...",
        "Organizando prioridades mentais...",
        "Desmembrando em microtarefas...",
        "Montando um plano de ação..."
      ];
      let idx = 0;
      setAiMessage(messages[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % messages.length;
        setAiMessage(messages[idx]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [analyzeMutation.isPending]);

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

  // Datepicker click outside handler
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.datepicker-container')) {
        setShowDatePickerPopover(false);
      }
    };
    if (showDatePickerPopover) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showDatePickerPopover]);

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
      userId: localStorage.getItem('lovitask_user') || sessionStorage.getItem('lovitask_user') || 'usuario@lovitask.com',
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
    if (cat.toLowerCase().includes('casa') || cat.toLowerCase().includes('rotina')) return '🏠';
    if (cat.toLowerCase().includes('saúde') || cat.toLowerCase().includes('saude')) return '❤️';
    return '🌱';
  };

  // Helper energy level matching spec
  const getEnergyLabel = (lvl: number) => {
    if (lvl <= 3) return '😴 Baixa';
    if (lvl <= 7) return '🙂 Média';
    return '🔥 Alta';
  };

  // Custom calendar helpers
  const getHumanDeadlineLabel = (dateStr: string) => {
    if (!dateStr) return '🗓️ Sem prazo';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) {
      return '📅 Hoje';
    }
    if (isSameDay(date, tomorrow)) {
      return '📅 Amanhã';
    }

    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `📅 ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const getMonthName = (monthIdx: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthIdx];
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentCalendarYear, currentCalendarMonth, day, 18, 0, 0, 0);
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, '0');
    const d = String(selected.getDate()).padStart(2, '0');
    setDeadline(`${year}-${month}-${d}T18:00`);
    setShowDatePickerPopover(false);
  };

  const handleSelectPreset = (preset: 'today' | 'tomorrow' | 'weekend' | 'nextWeek' | 'clear') => {
    if (preset === 'clear') {
      setDeadline('');
      setShowDatePickerPopover(false);
      return;
    }
    const now = new Date();
    if (preset === 'today') {
      now.setHours(18, 0, 0, 0);
    } else if (preset === 'tomorrow') {
      now.setDate(now.getDate() + 1);
      now.setHours(18, 0, 0, 0);
    } else if (preset === 'weekend') {
      const dayOfWeek = now.getDay();
      const daysToSaturday = 6 - dayOfWeek;
      now.setDate(now.getDate() + (daysToSaturday === 0 ? 0 : daysToSaturday));
      now.setHours(18, 0, 0, 0);
    } else if (preset === 'nextWeek') {
      now.setDate(now.getDate() + 7);
      now.setHours(18, 0, 0, 0);
    }

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setDeadline(`${year}-${month}-${d}T${hours}:${minutes}`);
    setShowDatePickerPopover(false);
  };

  const cardClass = `border transition-all duration-300 p-8 rounded-[32px] shadow-sm relative overflow-hidden group ${
    isDarkMode 
      ? 'bg-brand-cardDark/40 border-slate-800/60 shadow-slate-950/20 hover:border-slate-800' 
      : 'bg-white border-indigo-50/60 shadow-indigo-100/20 hover:border-indigo-100/80 hover:shadow-md'
  }`;

  const notebookInputClass = `w-full p-6 border-0 focus:outline-none focus:ring-0 transition text-base leading-relaxed resize-none rounded-t-[24px] ${
    isDarkMode 
      ? 'bg-slate-950/60 text-slate-200 placeholder-slate-655' 
      : 'bg-indigo-50/20 text-slate-855 placeholder-slate-400'
  }`;

  const inputClass = `w-full p-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm leading-relaxed ${
    isDarkMode 
      ? 'bg-slate-950/50 border-slate-855 text-slate-200 placeholder-slate-750' 
      : 'bg-indigo-50/20 border-indigo-100/80 text-slate-855 placeholder-slate-400 focus:bg-white'
  }`;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna 1 & 2: Chat-like Brain Dump */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Playful Brain Dump Box */}
          <div className={`${cardClass} !p-0 border-indigo-50/70 !overflow-visible`}>
            {isDarkMode && <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />}
            
            {/* Header info */}
            <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-850 bg-slate-950/25' : 'border-indigo-50 bg-indigo-50/15'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl select-none">💬</span>
                <div>
                  <h2 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    Escreva sem organizar as ideias
                  </h2>
                  <p className="text-[11px] text-slate-400 font-semibold">Eu faço a estruturação mental de tudo para você.</p>
                </div>
              </div>
              <div className="hidden sm:block text-[11px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                🧠 Assistente Lovi
              </div>
            </div>

            {crisisMode && (
              <div className="p-5 m-6 rounded-[24px] bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed flex items-start gap-3">
                <span className="text-xl">🧘</span>
                <div>
                  <strong className="block text-sm font-black mb-1">Modo Crise Ativado</strong>
                  Sua sobrecarga cognitiva está crítica. Escondemos suas tarefas futuras e limitamos novas criações para poupar sua energia mental. Foque apenas nas duas tarefas essenciais abaixo e tire pausas frequentes.
                </div>
              </div>
            )}

            <form onSubmit={handleBrainDumpSubmit} className="p-6 space-y-6">
              {/* Speck bubble textarea container */}
              <div className={`border rounded-[24px] focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition relative shadow-inner ${
                isDarkMode ? 'border-slate-850 bg-slate-950/45' : 'border-indigo-100/55 bg-indigo-50/10'
              }`}>
                <textarea
                  value={brainDumpText}
                  onChange={(e) => setBrainDumpText(e.target.value)}
                  disabled={crisisMode}
                  placeholder={crisisMode ? "O planejamento de novas tarefas está desabilitado no Modo Crise. Descanse um pouco!" : "Escreva tudo o que está ocupando sua mente agora... ideias soltas, compromissos pendentes, ansiedades ou tarefas que você precisa fazer."}
                  className={`${notebookInputClass} ${crisisMode ? 'opacity-65 cursor-not-allowed' : ''}`}
                  rows={6}
                  aria-label="Área de Brain Dump"
                />
                
                {/* Meta details integrated at the bottom of the writing area */}
                <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-4 rounded-b-[23px] ${isDarkMode ? 'border-slate-850/60 bg-slate-950/80' : 'border-indigo-50/60 bg-indigo-50/20'}`}>
                  {/* Category Chips Selector */}
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-indigo-500">
                      🏷️ Meta Principal
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setGoal(goal === cat ? '' : cat)}
                          className={`px-3 py-1.5 rounded-full font-black text-[10px] transition-all duration-200 border flex items-center gap-1.5 ${
                            goal === cat 
                              ? 'bg-indigo-650 border-indigo-650 text-white shadow-sm' 
                              : isDarkMode
                                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                : 'bg-white border-slate-200/80 text-slate-655 hover:bg-slate-50'
                          }`}
                        >
                          <span>{getCategoryEmoji(cat)}</span>
                          <span>{cat}</span>
                        </button>
                      ))}
                      
                      {/* Create custom category chip */}
                      <button
                        type="button"
                        onClick={() => {
                          const newCat = prompt('Nome da nova meta/categoria:');
                          if (newCat && !categories.includes(newCat)) {
                            setCategories([...categories, newCat]);
                            setGoal(newCat);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full font-black text-[10px] transition-all duration-200 border border-dashed ${
                          isDarkMode 
                            ? 'border-slate-800 text-slate-500 hover:text-slate-400' 
                            : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        ➕ Outra
                      </button>
                    </div>
                  </div>

                  {/* Native Datepicker (Robust & Accessible) */}
                  <div className="space-y-2 min-w-[180px]">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-indigo-500">
                      📅 Quando?
                    </span>
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className={`text-xs font-black border rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 focus:outline-none transition-all w-full text-left shadow-sm ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-855 text-slate-200 hover:border-slate-800 focus:ring-2 focus:ring-indigo-500' 
                          : 'bg-white border-indigo-150 text-slate-855 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-455' : 'text-slate-500'}`}>
                    Vou categorizar e sugerir tempos de foco.
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={analyzeMutation.isPending || crisisMode}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-2xl shadow-md shadow-indigo-500/10 transition disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  {crisisMode ? (
                    <span>🔒 Planejamento Limitado</span>
                  ) : analyzeMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="animate-pulse">{aiMessage}</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Organizar Minha Mente</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>

          {/* Microtarefas Recomendadas (Cozy, custom cards) */}
          <AnimatePresence>
            {analyzeMutation.data && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">💡</span>
                  <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Microtarefas Recomendadas</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyzeMutation.data.map((task: MicrotaskSuggestion, index: number) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={index} 
                      className={`p-5 rounded-[24px] border flex flex-col justify-between gap-4 transition duration-300 hover:-translate-y-0.5 shadow-sm ${
                        task.priority === 'Alta'
                          ? 'bg-rose-50/20 border-rose-100 text-slate-800 dark:bg-rose-950/5 dark:border-rose-900/30 dark:text-white'
                          : task.priority === 'Média'
                            ? 'bg-amber-50/20 border-amber-200 text-slate-800 dark:bg-amber-950/5 dark:border-amber-900/30 dark:text-white'
                            : 'bg-emerald-50/20 border-emerald-200 text-slate-800 dark:bg-emerald-950/5 dark:border-emerald-900/30 dark:text-white'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base select-none">
                            {task.priority === 'Alta' ? '🔥' : task.priority === 'Média' ? '⭐' : '🌱'}
                          </span>
                          <h4 className="font-black text-xs leading-snug">{task.title}</h4>
                        </div>
                        <p className={`text-[11px] leading-relaxed font-semibold ${isDarkMode ? 'text-slate-455' : 'text-slate-600'}`}>
                          {task.description}
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                        <span className={`text-[9px] font-black uppercase tracking-wider ${
                          task.priority === 'Alta' ? 'text-rose-500' : task.priority === 'Média' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {task.priority} Prioridade
                        </span>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full uppercase">
                          Salva no fluxo ✓
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Coluna 3: Fluxo de Atividades (Mini-Cards) */}
        <div className="space-y-6">
          <div className={`${cardClass} border-sky-100/40 !p-6`}>
            <h3 className={`text-base font-black mb-5 flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-lg">📜</span>
                <span>Fluxo de Atividades</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Recentes</span>
            </h3>

            {loadingEvents ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                {(() => {
                  const displayedEvents = crisisMode
                    ? [...events].reverse().filter(ev => ev.completed === null || ev.completed === undefined).slice(0, 2)
                    : [...events].reverse();

                  if (displayedEvents.length === 0) {
                    return (
                      <div className={`text-center py-12 text-xs border border-dashed rounded-3xl font-semibold ${
                        isDarkMode ? 'border-slate-800 bg-slate-950/20 text-slate-500' : 'border-slate-350 bg-slate-50 text-slate-400'
                      }`}>
                        Nenhuma microtarefa pendente no momento. Excelente! Aproveite para descansar.
                      </div>
                    );
                  }

                  return displayedEvents.map((ev: UserActivityEvent, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                    key={ev.id} 
                    className={`p-5 rounded-[24px] border transition-all duration-300 flex flex-col gap-3.5 hover:shadow-sm ${
                      ev.completed === true 
                        ? 'bg-emerald-50/20 border-emerald-150/60 dark:bg-emerald-950/5 dark:border-emerald-900/20' 
                        : ev.completed === false 
                          ? 'bg-rose-50/20 border-rose-150/60 dark:bg-rose-950/5 dark:border-rose-900/20' 
                          : isDarkMode 
                            ? 'bg-slate-950/40 border-slate-900 hover:border-slate-800' 
                            : 'bg-white border-slate-200/80 hover:border-slate-355 shadow-sm'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`font-black leading-snug text-xs flex-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          {getCategoryEmoji(ev.category || 'Trabalho')} {ev.description}
                        </p>
                        
                        {/* Custom status tag */}
                        {ev.completed === true ? (
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                            Feito
                          </span>
                        ) : ev.completed === false ? (
                          <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 shrink-0">
                            Adiada
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
                          isDarkMode ? 'bg-slate-900/85 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200/80 text-slate-550'
                        }`}>
                          {ev.category || 'Trabalho'}
                        </span>
                        
                        {ev.estimatedMinutes !== null && ev.estimatedMinutes !== undefined && ev.estimatedMinutes > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-150 text-indigo-650'
                          }`}>
                            ⏱️ {ev.estimatedMinutes} min
                          </span>
                        )}
                        
                        {ev.energyLevel !== null && ev.energyLevel !== undefined && ev.energyLevel > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            isDarkMode ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-150 text-purple-650'
                          }`}>
                            ⚡ {getEnergyLabel(ev.energyLevel)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pending task inline actions */}
                    {ev.completed === null && (
                      <div className="flex gap-2.5 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                        <button
                          onClick={() => handleStartUpdateEvent(ev, true)}
                          className={`flex-1 py-2 px-3 border font-black rounded-xl text-[9px] uppercase tracking-wider transition text-center flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                            isDarkMode 
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400' 
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                          }`}
                        >
                          ✔️ Concluir
                        </button>
                        <button
                          onClick={() => handleStartUpdateEvent(ev, false)}
                          className={`flex-1 py-2 px-3 border font-black rounded-xl text-[9px] uppercase tracking-wider transition text-center flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                            isDarkMode 
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400' 
                              : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                          }`}
                        >
                          ❌ Adiar
                        </button>
                      </div>
                    )}
                  </motion.div>
                ));
              })()}
              </div>
            ) : (
              <div className={`text-center py-12 text-xs border border-dashed rounded-3xl font-semibold ${
                isDarkMode ? 'border-slate-800 bg-slate-950/20 text-slate-500' : 'border-slate-350 bg-slate-50 text-slate-400'
              }`}>
                Nenhuma atividade no fluxo. Descarregue sua mente para começarmos!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) + Modal overlay */}
      {!crisisMode && (
        <motion.button
          whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
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
        className="fixed bottom-8 right-8 z-40 bg-indigo-600 hover:bg-indigo-700 text-white font-black p-4.5 rounded-full shadow-lg flex items-center gap-2 group border border-indigo-500/20"
        aria-label="Registrar atividade manualmente"
      >
        <span className="text-xl">➕</span>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-350 ease-out text-xs font-black uppercase tracking-wider whitespace-nowrap">
          Registrar Atividade
        </span>
      </motion.button>
      )}

      {/* Modal Dialog Form */}
      <AnimatePresence>
        {showLogForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md border rounded-[32px] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto datepicker-container ${
                isDarkMode ? 'bg-brand-cardDark border-slate-800 text-white' : 'bg-white border-indigo-50 text-slate-855'
              }`}
            >
              <button 
                type="button" 
                onClick={() => {
                  setShowLogForm(false);
                  setEditingEventId(null);
                }}
                className="absolute top-4 right-4 text-slate-455 hover:text-rose-500 text-xl font-bold p-1 transition-colors"
              >
                ✕
              </button>

              <h3 className={`text-base font-black mb-5 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <span>{editingEventId ? '✍️' : '📋'}</span>
                <span>{editingEventId ? 'Atualizar Atividade' : 'Registrar Atividade'}</span>
              </h3>

              <form onSubmit={handleLogEventSubmit} className="space-y-5">
                {/* Description Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">Descrição da Atividade</label>
                  <input
                    type="text"
                    required
                    value={logDescription}
                    onChange={(e) => setLogDescription(e.target.value)}
                    placeholder="Ex: Ler capítulo de livro, Correr"
                    className={inputClass}
                  />
                </div>

                {/* Interactive Category Chips */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">Meta / Categoria</label>
                  <div className="flex flex-wrap gap-2">
                    {['Trabalho', 'Estudo', 'Rotina', 'Saúde'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setLogCategory(cat)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center gap-1.5 ${
                          logCategory === cat
                            ? 'bg-indigo-600 border-indigo-650 text-white shadow-sm scale-102'
                            : isDarkMode
                              ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-100'
                        }`}
                      >
                        <span>{getCategoryEmoji(cat)}</span>
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Badge Selectors */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">Tempo de Foco Estimado</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {[15, 30, 45, 60].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setLogMinutes(mins)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                          logMinutes === mins
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : isDarkMode
                              ? 'bg-slate-900 border-slate-880 text-slate-455 hover:text-white'
                              : 'bg-slate-50 border-slate-200/80 text-slate-655 hover:bg-slate-100'
                        }`}
                      >
                        ⏱️ {mins === 60 ? '1 hora' : `${mins}m`}
                      </button>
                    ))}
                    
                    {/* Custom input */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <input
                        type="number"
                        min={1}
                        value={logMinutes}
                        onChange={(e) => setLogMinutes(Number(e.target.value))}
                        className={`w-16 p-2 border rounded-xl text-xs font-bold text-center ${
                          isDarkMode ? 'bg-slate-950 border-slate-855 text-white' : 'bg-slate-55 border-slate-250 text-slate-800'
                        }`}
                      />
                      <span className="text-[10px] text-slate-450 font-bold uppercase">min</span>
                    </div>
                  </div>
                </div>

                {/* Energy Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                    <span>Nível de Energia Necessário</span>
                    <span className="text-indigo-655 dark:text-indigo-400 font-black text-xs">{logEnergy}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={logEnergy}
                    onChange={(e) => setLogEnergy(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 rounded-lg cursor-pointer bg-slate-200 dark:bg-slate-800"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-semibold">
                    <span><span>😴 Baixa (1)</span></span>
                    <span><span>🙂 Média (5)</span></span>
                    <span><span>🔥 Alta (10)</span></span>
                  </div>
                </div>

                {/* Interactive Mood Emojis Grid */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">Como você se sentiu? (Humor)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'Focado', label: '🎯 Focado' },
                      { id: 'Calmo', label: '🧘 Calmo' },
                      { id: 'Bem', label: '😊 Bem' },
                      { id: 'Animado', label: '🎉 Animado' },
                      { id: 'Ansioso', label: '😵 Ansioso' },
                      { id: 'Cansado', label: '😴 Cansado' },
                      { id: 'Neutro', label: '😐 Neutro' }
                    ].map(moodOption => (
                      <button
                        key={moodOption.id}
                        type="button"
                        onClick={() => setLogMood(moodOption.id)}
                        className={`p-2 rounded-xl text-[10px] font-black border transition-all duration-200 text-center ${
                          logMood === moodOption.id
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : isDarkMode
                              ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-100'
                        }`}
                      >
                        {moodOption.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Completed/Abandoned Toggle Chips */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">Resultado da Atividade</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLogCompleted(true)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        logCompleted === true
                          ? 'bg-emerald-600 border-emerald-650 text-white shadow-sm'
                          : isDarkMode
                            ? 'bg-slate-900 border-slate-800 text-slate-450 hover:text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-100'
                      }`}
                    >
                      ✔️ Concluída
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogCompleted(false)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        logCompleted === false
                          ? 'bg-rose-600 border-rose-655 text-white shadow-sm'
                          : isDarkMode
                            ? 'bg-slate-900 border-slate-800 text-slate-450 hover:text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-100'
                      }`}
                    >
                      ❌ Abandonada
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-3 border-t border-slate-100/50 dark:border-slate-800/50">
                  <button
                    type="submit"
                    disabled={trackMutation.isPending}
                    className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white font-black py-3 rounded-xl transition active:scale-[0.98] text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    {trackMutation.isPending ? 'Salvando...' : editingEventId ? 'Atualizar' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogForm(false);
                      setEditingEventId(null);
                    }}
                    className={`border font-black py-3 px-5 rounded-xl transition text-xs ${
                      isDarkMode 
                        ? 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400' 
                        : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-650'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
