import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../lib/supabase';
import { ArrowDownRight, IndianRupee, Wallet, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalBalance, setTotalBalance] = useState(10000);
  const [balanceId, setBalanceId] = useState<string | null>(null);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(totalBalance.toString());

  const handleSaveBalance = async () => {
    const newBal = Number(balanceInput);
    if (!isNaN(newBal)) {
      setTotalBalance(newBal);
      if (balanceId) {
        await supabase.from('wallet').update({ balance: newBal }).eq('id', balanceId);
      } else {
        await supabase.from('wallet').insert({ balance: newBal });
      }
    }
    setIsEditingBalance(false);
  };

  const handleDelete = async (id: string, amount: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete from database! Check console.");
        return;
      }
      
      // Remove from UI only after true success
      setTransactions(prev => prev.filter(t => t.id !== id));
      setTotalExpense(prev => prev - amount);
      // Re-fetch balance to reflect the trigger change
      fetchBalance();
    }
  };

  useEffect(() => {
    fetchData();
    fetchBalance();
    
    // Add rapid event listener for modals syncing without waiting for Supabase Realtime packet
    const handleRefresh = () => {
      fetchData();
      fetchBalance();
    };
    window.addEventListener('dashboardRefresh', handleRefresh);
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        setTransactions((prev) => [payload.new as Transaction, ...prev]);
        setTotalExpense((prev) => prev + Number((payload.new as Transaction).amount));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallet' }, (payload) => {
        setTotalBalance(Number(payload.new.balance));
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('dashboardRefresh', handleRefresh);
    };
  }, []);

  const fetchBalance = async () => {
    const { data } = await supabase.from('wallet').select('*').limit(1);
    if (data && data.length > 0) {
      setTotalBalance(Number(data[0].balance));
      setBalanceId(data[0].id);
      setBalanceInput(String(data[0].balance));
    }
  };

  const fetchData = async () => {
    const { data: txs, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching transactions", error);
      return;
    }
    
    if (txs) {
      setTransactions(txs as Transaction[]);
      const expense = txs.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalExpense(expense);
    }
  };

  const getModeColor = (mode?: string) => {
    if (!mode) return 'bg-gray-100 text-gray-700';
    switch (mode.toLowerCase()) {
      case 'upi': return 'bg-purple-100 text-purple-700';
      case 'cash': return 'bg-green-100 text-green-700';
      case 'card': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-5 flex flex-col gap-6">
      {/* Top Cards */}
      <div className="flex gap-4">
        {/* Balance Card */}
        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Wallet size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Balance</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 flex items-center">
            <IndianRupee size={20} className="mr-0.5" />
            {isEditingBalance ? (
               <input 
                 type="number"
                 className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-lg outline-none"
                 value={balanceInput}
                 onChange={(e) => setBalanceInput(e.target.value)}
                 onBlur={handleSaveBalance}
                 onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBalance(); }}
                 autoFocus
               />
            ) : (
               <span 
                 onClick={() => { setIsEditingBalance(true); setBalanceInput(totalBalance.toString()); }}
                 className="cursor-pointer hover:text-indigo-600 transition"
               >
                 {totalBalance.toLocaleString('en-IN')}
               </span>
            )}
          </div>
        </div>

        {/* Expense Card */}
        <div className="flex-1 bg-gradient-to-br from-rose-500 to-rose-600 p-4 rounded-2xl shadow-sm text-white">
          <div className="flex items-center gap-2 text-rose-100 mb-2">
            <ArrowDownRight size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Expense</span>
          </div>
          <div className="text-2xl font-bold flex items-center">
            <IndianRupee size={20} className="mr-0.5" />
            {totalExpense.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="mt-2">
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Recent Transactions</h2>
        <div className="flex flex-col gap-3">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No transactions yet. Add one!
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id || Math.random()} className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${getModeColor(tx.payment_mode)}`}>
                    {tx.payment_mode ? tx.payment_mode.substring(0, 3).toUpperCase() : '---'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-base capitalize">{tx.category || 'Unknown'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tx.created_at ? format(new Date(tx.created_at), 'dd MMM yyyy, hh:mm a') : 'Unknown Date'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-bold text-rose-600 flex items-center border-[1.5px] border-rose-100 bg-rose-50 px-2.5 py-1 rounded-lg">
                    -<IndianRupee size={14} className="mx-0.5" />{Number(tx.amount || 0).toLocaleString('en-IN')}
                  </div>
                  <button 
                    onClick={() => handleDelete(tx.id, Number(tx.amount || 0))}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
