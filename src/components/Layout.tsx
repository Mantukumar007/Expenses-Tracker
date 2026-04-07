import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Mic, Plus, Bot } from 'lucide-react';
import VoiceModal from './VoiceModal';
import ManualAddModal from './ManualAddModal';

const Layout = () => {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'add' | 'ask'>('add'); // 'add' for explicit add, 'ask' for query

  const openVoiceAdd = () => {
    setVoiceMode('add');
    setIsVoiceOpen(true);
  };

  const openAIQuery = () => {
    setVoiceMode('ask');
    setIsVoiceOpen(true);
  };

  return (
    <div className="relative mx-auto max-w-md bg-white min-h-screen shadow-xl rounded-none md:rounded-xl overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md z-10 flex-shrink-0">
        <h1 className="text-xl font-bold tracking-wide">Expense AI</h1>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-grow overflow-y-auto pb-24 bg-gray-50">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] px-6 py-3 flex justify-between items-center rounded-b-none md:rounded-b-xl z-20">
        <button 
          onClick={openAIQuery}
          className="flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600 transition p-2 w-16"
        >
          <Bot size={24} />
          <span className="text-[10px] mt-1 font-medium">Ask AI</span>
        </button>

        <button 
          onClick={openVoiceAdd}
          className="relative -top-6 flex items-center justify-center bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition transform hover:scale-105"
        >
          <Mic size={28} />
        </button>

        <button 
          onClick={() => setIsManualAddOpen(true)}
          className="flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600 transition p-2 w-16"
        >
          <Plus size={24} />
          <span className="text-[10px] mt-1 font-medium">Add</span>
        </button>
      </div>

      {isVoiceOpen && (
        <VoiceModal 
          mode={voiceMode}
          onClose={() => setIsVoiceOpen(false)} 
        />
      )}

      {isManualAddOpen && (
        <ManualAddModal 
          onClose={() => setIsManualAddOpen(false)} 
        />
      )}
    </div>
  );
};

export default Layout;
