import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { parseExpenseInput, askAssistant } from '../lib/ai';
import { startListening, speak } from '../lib/voice';
import { Bot, Mic, X, Loader2 } from 'lucide-react';

interface VoiceModalProps {
  onClose: () => void;
  mode: 'add' | 'ask';
}

const VoiceModal: React.FC<VoiceModalProps> = ({ onClose, mode }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiStatus, setAiStatus] = useState<string>('Tap the mic to start');
  const [aiResponseText, setAiResponseText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Optionally auto-start
    handleToggleListen();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleToggleListen = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setAiResponseText('');
      setAiStatus('Listening...');
      setIsListening(true);
      
      recognitionRef.current = startListening(
        (text) => {
          setTranscript(text);
          processInput(text);
        },
        (err) => {
          console.error(err);
          setAiStatus('Could not hear clearly. Try again.');
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const processInput = async (text: string) => {
    setIsProcessing(true);
    if (mode === 'add') {
      setAiStatus('Analyzing your expense...');
      const parsed = await parseExpenseInput(text);
      if (parsed && parsed.amount && parsed.category && parsed.payment_mode) {
        setAiStatus('Saving to database...');
        
        const { error } = await supabase.from('transactions').insert({
          amount: parsed.amount,
          category: parsed.category,
          payment_mode: parsed.payment_mode,
          type: 'expense'
        });

        if (error) {
          console.error(error);
          setAiStatus('Saved failed! Database error.');
          speak('Sorry, there was an error saving your expense.');
        } else {
          setAiStatus(`Saved: ₹${parsed.amount} for ${parsed.category}`);
          speak(`Saved ${parsed.amount} rupees for ${parsed.category} via ${parsed.payment_mode}`);
          window.dispatchEvent(new Event('dashboardRefresh'));
          setTimeout(onClose, 2500);
        }
      } else {
        setAiStatus('Could not extract details. Try again.');
        speak('Could not extract amount and category. Please try again.');
      }
    } else {
      // mode === 'ask'
      setAiStatus('Thinking...');
      const answer = await askAssistant(text);
      setAiResponseText(answer);
      setAiStatus('Answered');
      speak(answer);
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center bg-black/60 backdrop-blur-md transition-opacity">
      <div className="bg-white w-full sm:w-[400px] rounded-t-[2.5rem] sm:rounded-3xl p-8 flex flex-col items-center relative animate-in slide-in-from-bottom-20 duration-500 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 bg-gray-100 text-gray-500 rounded-full p-2 hover:bg-gray-200 transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-8 mt-2">
          {mode === 'ask' ? <Bot size={28} className="text-indigo-600"/> : <Mic size={28} className="text-rose-500"/>}
          <h2 className="text-xl font-bold text-gray-800">
            {mode === 'add' ? 'Voice Add Expense' : 'AI Assistant'}
          </h2>
        </div>

        {/* Status Text */}
        <div className="min-h-[60px] text-center w-full mb-6">
          <p className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wider">{aiStatus}</p>
          {(transcript || aiResponseText) ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2 text-left shadow-inner">
               {transcript && <p className="text-gray-900 font-medium italic mb-2">"{transcript}"</p>}
               {aiResponseText && <p className="text-indigo-700 font-semibold">{aiResponseText}</p>}
            </div>
          ) : (
             <div className="h-16 flex items-center justify-center text-gray-400 italic text-sm">
               {mode === 'add' ? 'e.g. "500 food cash"' : 'e.g. "Aaj kitna expense hua?"'}
             </div>
          )}
        </div>

        {/* Mic Button */}
        <button 
          onClick={handleToggleListen}
          disabled={isProcessing}
          className={`relative flex items-center justify-center w-24 h-24 rounded-full shadow-xl transition-all duration-300 ${
            isListening 
            ? 'bg-rose-500 scale-110 shadow-rose-200 animate-pulse' 
            : isProcessing
              ? 'bg-indigo-400'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-indigo-200'
          }`}
        >
          {isProcessing ? (
            <Loader2 size={40} className="text-white animate-spin" />
          ) : isListening ? (
             <div className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-20"></div>
          ) : null}
          {!isProcessing && <Mic size={40} className="text-white relative z-10" />}
        </button>
        
        <p className="mt-6 text-xs text-gray-400 font-medium tracking-wide">
           {isListening ? 'Listening now...' : 'Tap to speak'}
        </p>
      </div>
    </div>
  );
};

export default VoiceModal;
