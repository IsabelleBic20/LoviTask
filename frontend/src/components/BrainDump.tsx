import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { loviTaskAPI } from '../services/api';
import { MicrotaskSuggestion } from '../types';

export const BrainDump = () => {
  const [brainDumpText, setBrainDumpText] = useState('');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      loviTaskAPI.analyzeBrainDump({
        text: brainDumpText,
        goal: goal || undefined,
        deadline: deadline || undefined,
      }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brainDumpText.trim()) {
      mutation.mutate();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Brain Dump</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={brainDumpText}
          onChange={(e) => setBrainDumpText(e.target.value)}
          placeholder="Descarregue seus pensamentos aqui..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={5}
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Meta (opcional)"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="Prazo (opcional)"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {mutation.isPending ? 'Analisando...' : 'Analisar Brain Dump'}
        </button>
      </form>

      {mutation.data && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold">Microtarefas Sugeridas</h3>
          {mutation.data.map((task: MicrotaskSuggestion, index: number) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-900">{task.title}</h4>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    task.priority === 'Alta'
                      ? 'bg-red-100 text-red-800'
                      : task.priority === 'Média'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-2">{task.description}</p>
            </div>
          ))}
        </div>
      )}

      {mutation.isError && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Erro ao analisar Brain Dump. Tente novamente.
        </div>
      )}
    </div>
  );
};
