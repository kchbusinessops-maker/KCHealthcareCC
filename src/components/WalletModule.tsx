import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { WalletTransaction } from '../types';
import { 
  Wallet, IndianRupee, ArrowDownRight, ArrowUpRight, AlertCircle, 
  Plus, CheckCircle2, Filter, RefreshCw, ShieldCheck, Download, Printer 
} from 'lucide-react';

interface WalletModuleProps {
  onOpenRechargeModal: () => void;
}

export const WalletModule: React.FC<WalletModuleProps> = ({ onOpenRechargeModal }) => {
  const { currentCentre, showNotification } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'deduction' | 'recharge'>('all');

  const loadTransactions = async () => {
    if (!currentCentre) return;
    setLoading(true);
    try {
      const data = await api.getWalletTransactions(currentCentre.id);
      setTransactions(data);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load wallet ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [currentCentre?.id]);

  if (!currentCentre) return null;

  const isLowBalance = currentCentre.walletBalance <= currentCentre.walletLowBalanceThreshold;

  const filteredTransactions = transactions.filter(t => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'deduction') return t.type === 'debit_b2b_order';
    if (typeFilter === 'recharge') return t.type === 'credit_recharge';
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Active Balance */}
        <div className={`p-6 rounded-2xl border shadow-xs relative overflow-hidden ${
          isLowBalance ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLowBalance ? 'text-amber-800' : 'text-slate-300'}`}>
              Centre Wallet Balance
            </span>
            <div className={`p-2 rounded-xl ${isLowBalance ? 'bg-amber-200/60 text-amber-800' : 'bg-white/10 text-emerald-400'}`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className={`text-3xl font-extrabold tracking-tight ${isLowBalance ? 'text-amber-900' : 'text-white'}`}>
              ₹{currentCentre.walletBalance.toLocaleString()}
            </div>
            <div className={`text-xs mt-1 font-medium ${isLowBalance ? 'text-amber-700' : 'text-slate-400'}`}>
              Automated deduction for Parent Lab franchise fee ({Math.round(currentCentre.franchiseCommercialRate * 100)}%)
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-700/50">
            <button
              onClick={onOpenRechargeModal}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm ${
                isLowBalance ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Recharge Wallet</span>
            </button>

            {isLowBalance && (
              <span className="text-xs font-bold text-amber-700 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Low Buffer</span>
              </span>
            )}
          </div>
        </div>

        {/* Credit Limit & Safety Buffer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Franchise Credit Limit
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                ₹{currentCentre.walletCreditLimit.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Emergency operational credit granted by Parent Laboratory
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Low Balance Threshold:</span>
            <span className="font-mono font-bold text-slate-900">₹{currentCentre.walletLowBalanceThreshold.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Deductions Today */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Security & Protection
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Idempotency-protected deductions</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                <span>Zero double-billing guarantees</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                <span>Real-time B2B ledger synchronization</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Every transaction is cryptographically tied to its Order ID & Centre UUID.
          </div>
        </div>

      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Wallet Transactions & Settlement Ledger</h3>
            <p className="text-xs text-slate-500">Immutable ledger of B2B deductions and top-up recharges</p>
          </div>

          {/* Filter & Refresh */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                onClick={() => setTypeFilter('deduction')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'deduction' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Deductions
              </button>
              <button
                onClick={() => setTypeFilter('recharge')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'recharge' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Recharges
              </button>
            </div>

            <button
              onClick={loadTransactions}
              disabled={loading}
              className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Ledger Items */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No transactions found in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Transaction ID / Ref</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Order Ref</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isDeduction = tx.type === 'debit_b2b_order';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString([], { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 font-semibold">
                        {tx.id.slice(0, 14)}...
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                          {isDeduction ? (
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span>{tx.description}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-blue-600">
                        {tx.orderId || '—'}
                      </td>
                      <td className={`py-3 px-3 font-bold text-right ${isDeduction ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isDeduction ? '-' : '+'}₹{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-900 font-semibold text-right">
                        ₹{tx.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
