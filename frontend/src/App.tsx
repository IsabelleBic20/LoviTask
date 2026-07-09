import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrainDump } from './components/BrainDump';
import { Metrics } from './components/Metrics';
import { Profile } from './components/Profile';
import './index.css';

const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState<'brain-dump' | 'metrics' | 'profile'>('brain-dump');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">LoviTask</h1>
            <p className="text-gray-600">Assistente Cognitivo Adaptativo</p>
          </div>
        </header>

        <nav className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex gap-0">
              <button
                onClick={() => setActiveTab('brain-dump')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'brain-dump'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Brain Dump
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'metrics'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Métricas
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Perfil Cognitivo
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {activeTab === 'brain-dump' && <BrainDump />}
          {activeTab === 'metrics' && <Metrics />}
          {activeTab === 'profile' && <Profile />}
        </main>

        <footer className="bg-white border-t mt-12">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-600">
            <p>LoviTask © 2026 — Desenvolvido com ❤️ para melhorar sua produtividade cognitiva</p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
