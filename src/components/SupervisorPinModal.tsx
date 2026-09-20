import React, { useState } from 'react';
import { ShieldAlert, KeyRound, CheckCircle2, XCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SupervisorPinModalProps {
  title?: string;
  description?: string;
  requiredActionName?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const SupervisorPinModal: React.FC<SupervisorPinModalProps> = ({
  title = 'Supervisor Authorization Required',
  description = 'This elevated action is restricted by Collection Centre Security Policy and requires Supervisor Master PIN verification.',
  requiredActionName = 'Elevated Action',
  onSuccess,
  onClose
}) => {
  const { verifySupervisorPin, authPolicy } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter the 4-digit Supervisor PIN');
      return;
    }
    setIsVerifying(true);
    setError('');
    try {
      const isValid = await verifySupervisorPin(pin);
      if (isValid) {
        onSuccess();
        onClose();
      } else {
        setError('Incorrect PIN. Authorization denied. This failed attempt is recorded in the security audit log.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{requiredActionName}</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
          {description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Enter 4-Digit Supervisor PIN:</span>
              <span className="text-[11px] font-normal text-slate-400">Default Lab PIN: {authPolicy.supervisorMasterPin}</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                autoFocus
                placeholder="••••"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center space-x-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !pin.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center justify-center space-x-1"
            >
              {isVerifying ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize Action</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
