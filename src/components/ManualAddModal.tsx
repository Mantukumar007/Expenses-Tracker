import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, IndianRupee, Tag, CreditCard } from 'lucide-react';

interface ManualAddModalProps {
  onClose: () => void;
}

const ManualAddModal: React.FC<ManualAddModalProps> = ({ onClose }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('transactions').insert({
      amount: Number(amount),
      category: category,
      payment_mode: paymentMode,
      type: 'expense'
    });

    setIsSubmitting(false);
    if (error) {
      console.error(error);
      alert('Error adding expense');
    } else {
      window.dispatchEvent(new Event('dashboardRefresh'));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 bg-gray-100 text-gray-500 rounded-full p-1 hover:bg-gray-200 transition"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Expense</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <IndianRupee size={16}/> Amount
            </label>
            <input 
              type="number" 
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-lg p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <Tag size={16}/> Category
            </label>
            <input 
              type="text" 
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="Food, Travel, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <CreditCard size={16}/> Payment Mode
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {['UPI', 'Cash', 'Card', 'Bank'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`p-2.5 rounded-xl border text-sm font-medium transition ${
                    paymentMode === mode 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="mt-4 w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualAddModal;
