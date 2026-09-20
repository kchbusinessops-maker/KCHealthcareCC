import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Wallet, IndianRupee, Check, AlertCircle, Sparkles } from 'lucide-react';

interface WalletRechargeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const WalletRechargeModal: React.FC<WalletRechargeModalProps> = ({ onClose, onSuccess }) => {
  const { currentCentre, showNotification, reloadCentreData } = useAuth();
  const [amount, setAmount] = useState<number>(10000);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'neft' | 'card'>('upi');
  const [submitting, setSubmitting] = useState(false);

  if (!currentCentre) return null;

  const quickAmounts = [5000, 10000, 25000, 50000];

  const handleRecharge = async () => {
    if (amount <= 0) {
      showNotification('Enter a valid recharge amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const ref = `TOPUP-${Date.now().toString().slice(-6)}`;
      await api.rechargeWallet(currentCentre.id, amount, `${paymentMethod.toUpperCase()} Settlement Ref #${ref}`);
      await reloadCentreData();
      showNotification(`Wallet successfully credited with ₹${amount.toLocaleString()}!`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showNotification(err.message || 'Failed to process recharge', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Franchise Wallet Top-Up</h3>
              <p className="text-xs text-slate-500">{currentCentre.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
        </div>

        {/* Current Balance */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">CURRENT WALLET BALANCE</span>
            <div className="text-xl font-extrabold text-slate-900">₹{currentCentre.walletBalance.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 font-medium">CREDIT BUFFER</span>
            <div className="text-sm font-bold text-slate-700">₹{currentCentre.walletCreditLimit.toLocaleString()}</div>
          </div>
        </div>

        {/* Quick Amount Selectors */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Top-up Amount (₹)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(q)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  amount === q ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                ₹{q.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Amount</label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="number"
              min="1000"
              step="500"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Payment mode */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Payment Settlement Channel
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'upi', label: 'Instant UPI' },
              { id: 'neft', label: 'NEFT / RTGS' },
              { id: 'card', label: 'Corporate Card' }
            ].map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id as any)}
                className={`py-2 px-2 text-center rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  paymentMethod === pm.id ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={submitting}
            onClick={handleRecharge}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? 'Crediting...' : `Pay ₹${amount.toLocaleString()} & Recharge`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
