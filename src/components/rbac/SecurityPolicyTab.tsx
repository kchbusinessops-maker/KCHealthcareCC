import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthPolicyConfig } from '../../types';
import { 
  ShieldAlert, KeyRound, Lock, Unlock, Eye, EyeOff, CheckCircle2, 
  AlertTriangle, Save, RefreshCw, ShieldCheck, Clock, Check
} from 'lucide-react';

export const SecurityPolicyTab: React.FC = () => {
  const { currentCentre, authPolicy, updateAuthPolicy, verifySupervisorPin, setEmergencyLockdown, showNotification } = useAuth();

  const [policyForm, setPolicyForm] = useState<AuthPolicyConfig>(authPolicy);
  const [showPin, setShowPin] = useState(false);
  const [testPinInput, setTestPinInput] = useState('');
  const [testPinResult, setTestPinResult] = useState<'success' | 'failed' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('');
  const [showLockdownPrompt, setShowLockdownPrompt] = useState(false);

  const handleToggleCheckpoint = (key: keyof AuthPolicyConfig) => {
    setPolicyForm((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTestPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPinInput.trim()) return;
    const isValid = await verifySupervisorPin(testPinInput.trim());
    setTestPinResult(isValid ? 'success' : 'failed');
  };

  const handleSavePolicy = async () => {
    setIsSaving(true);
    try {
      await updateAuthPolicy(policyForm);
    } catch (err) {
      // handled
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEmergencyLockdown = async () => {
    if (policyForm.emergencyLockdown) {
      // Unlock
      await setEmergencyLockdown(false);
      setPolicyForm((prev) => ({ ...prev, emergencyLockdown: false }));
      setShowLockdownPrompt(false);
    } else {
      // Lock
      if (!lockdownReason.trim()) {
        showNotification('Please enter a clinical or security reason for lockdown', 'error');
        return;
      }
      await setEmergencyLockdown(true, lockdownReason.trim());
      setPolicyForm((prev) => ({ ...prev, emergencyLockdown: true }));
      setShowLockdownPrompt(false);
      setLockdownReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Lockdown Notice Banner */}
      {policyForm.emergencyLockdown && (
        <div className="bg-rose-600 text-white p-5 rounded-2xl shadow-lg border border-rose-700 animate-pulse flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 shrink-0 text-white" />
            <div>
              <h3 className="font-bold text-base">EMERGENCY CENTRE LOCKDOWN ACTIVE</h3>
              <p className="text-xs text-rose-100">
                All staff logins are temporarily suspended. Only Centre Administrator holds access.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggleEmergencyLockdown()}
            className="px-4 py-2 bg-white text-rose-700 font-bold rounded-xl text-xs shadow-sm hover:bg-rose-50 transition-colors cursor-pointer"
          >
            Lift Emergency Lockdown
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Security & Authentication Policy Engine
              </h2>
              <p className="text-xs text-slate-500">
                Supervisor master credentials, high-risk operational checkpoints, and emergency safeguards for {currentCentre?.name}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowLockdownPrompt(true)}
            className={`text-xs px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              policyForm.emergencyLockdown
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>{policyForm.emergencyLockdown ? 'Lockdown Enabled' : 'Emergency Lockdown'}</span>
          </button>

          <button
            onClick={handleSavePolicy}
            disabled={isSaving}
            className="text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Policy Settings'}</span>
          </button>
        </div>
      </div>

      {/* Supervisor Master PIN & Testing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Supervisor Master PIN</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            This master PIN is used by Collection Centre Admins and Duty Supervisors to authorize high-risk overrides (e.g. order cancellations, discount waivers, broken tamper seals).
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Configured Master PIN:
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={policyForm.supervisorMasterPin}
                    onChange={(e) => setPolicyForm({ ...policyForm, supervisorMasterPin: e.target.value })}
                    maxLength={8}
                    className="w-full pl-3 pr-10 py-2 text-sm font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center space-x-1 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Ensure this PIN is shared only with authorized senior staff and centre supervisors.</span>
            </div>
          </div>
        </div>

        {/* Live Test Supervisor PIN */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Test Supervisor PIN Verification</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verify the live authentication challenge mechanism used across billing, logistics, and specimen collection.
          </p>

          <form onSubmit={handleTestPin} className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="password"
                placeholder="Enter PIN to test..."
                value={testPinInput}
                onChange={(e) => {
                  setTestPinInput(e.target.value);
                  setTestPinResult(null);
                }}
                maxLength={8}
                className="flex-1 px-3 py-2 text-sm font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Verify
              </button>
            </div>

            {testPinResult === 'success' && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>PIN verified successfully! Supervisor authentication granted.</span>
              </div>
            )}

            {testPinResult === 'failed' && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-1.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Verification failed. Invalid supervisor PIN.</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Security Checkpoints Configuration */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>Operational Security Checkpoints (Supervisor Dual-Authorization)</span>
          <span className="text-xs font-normal text-slate-400">Toggles enforce real-time terminal challenge popups</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Checkpoint 1: Discount override */}
          <div 
            onClick={() => handleToggleCheckpoint('requireSupervisorPinForDiscount')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-start justify-between gap-3"
          >
            <div>
              <div className="font-bold text-xs text-slate-900">
                Require Supervisor PIN for Billing Discounts &gt; 10%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Prevents unapproved revenue leaks or commercial waivers at the front desk reception.
              </div>
            </div>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
              policyForm.requireSupervisorPinForDiscount ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 border-slate-300 text-transparent'
            }`}>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Checkpoint 2: Cancellation & Refunds */}
          <div 
            onClick={() => handleToggleCheckpoint('requireSupervisorPinForCancel')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-start justify-between gap-3"
          >
            <div>
              <div className="font-bold text-xs text-slate-900">
                Require Supervisor PIN for Order Cancellations & Refunds
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Mandates senior authorization before voiding paid diagnostics or reversing wallet balance.
              </div>
            </div>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
              policyForm.requireSupervisorPinForCancel ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 border-slate-300 text-transparent'
            }`}>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Checkpoint 3: Break Cold-Chain Box Seal */}
          <div 
            onClick={() => handleToggleCheckpoint('requireSupervisorPinForReopenBox')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-start justify-between gap-3"
          >
            <div>
              <div className="font-bold text-xs text-slate-900">
                Require Supervisor PIN to Break Tamper Seal & Reopen Box
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Preserves cold-chain custody integrity once the courier cold box has been locked.
              </div>
            </div>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
              policyForm.requireSupervisorPinForReopenBox ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 border-slate-300 text-transparent'
            }`}>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Checkpoint 4: Reprint Vacutainer Label */}
          <div 
            onClick={() => handleToggleCheckpoint('requireSupervisorPinForLabelReprint')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-start justify-between gap-3"
          >
            <div>
              <div className="font-bold text-xs text-slate-900">
                Require Supervisor PIN to Reprint Specimen Barcode Labels
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ISO 15189 compliance measure to prevent mislabeled tubes and duplicate vacutainers.
              </div>
            </div>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
              policyForm.requireSupervisorPinForLabelReprint ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 border-slate-300 text-transparent'
            }`}>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Checkpoint 5: Central Lab Data Extract */}
          <div 
            onClick={() => handleToggleCheckpoint('requireSupervisorPinForCentralExtract')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-start justify-between gap-3"
          >
            <div>
              <div className="font-bold text-xs text-slate-900">
                Require Supervisor PIN for Central Lab Data Extraction
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Ensures only vetted staff can extract bulk specimen records and patient test packages.
              </div>
            </div>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
              policyForm.requireSupervisorPinForCentralExtract ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 border-slate-300 text-transparent'
            }`}>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Checkpoint 6: Phlebotomy Draw PIN */}
          <div 
            onClick={() => handleToggleCheckpoint('requirePinForPhlebotomy')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-start justify-between gap-3"
          >
            <div>
              <div className="font-bold text-xs text-slate-900">
                Require Phlebotomist Quick PIN on Specimen Draw
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Guarantees non-repudiation and exact phlebotomist ID logging on each collected tube.
              </div>
            </div>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
              policyForm.requirePinForPhlebotomy ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 border-slate-300 text-transparent'
            }`}>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Checkpoint 7: Fasting Verification */}
          <div 
            onClick={() => handleToggleCheckpoint('requireFastingConfirmation')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-start justify-between gap-3"
          >
            <div>
              <div className="font-bold text-xs text-slate-900">
                Enforce Mandatory Fasting Protocol on Metabolic Panels
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Requires explicit confirmation of 8-12 hours fasting for Lipid Profiles and Fasting Blood Sugar.
              </div>
            </div>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
              policyForm.requireFastingConfirmation ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 border-slate-300 text-transparent'
            }`}>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Session Security & Enforcement Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Terminal Idle Session Timeout</h3>
          </div>
          <p className="text-xs text-slate-500">
            Automatically lock collection bay screens after a period of workstation inactivity.
          </p>
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[15, 30, 60, 120].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setPolicyForm({ ...policyForm, sessionTimeoutMinutes: mins })}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  policyForm.sessionTimeoutMinutes === mins
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {mins} Mins
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">Policy Enforcement Mode</h3>
          </div>
          <p className="text-xs text-slate-500">
            Determine how strict the collection centre terminals enforce RBAC boundaries.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { id: 'strict', label: 'Strict Block' },
              { id: 'supervised', label: 'Supervised' },
              { id: 'audit_only', label: 'Audit Only' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPolicyForm({ ...policyForm, enforcementMode: m.id as any })}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  policyForm.enforcementMode === m.id
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Lockdown Confirmation Modal */}
      {showLockdownPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {policyForm.emergencyLockdown ? 'Lift Emergency Lockdown?' : 'Initiate Emergency Lockdown?'}
                </h3>
                <p className="text-xs text-slate-500">Centre Security Safeguard</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {policyForm.emergencyLockdown
                ? 'Lifting the lockdown will restore normal role-based access for Receptionists, Phlebotomists, and Dispatch Officers at this collection centre.'
                : 'Emergency lockdown immediately revokes access for all non-administrator staff accounts across all collection terminals. Only the Centre Admin will retain operational access.'}
            </p>

            {!policyForm.emergencyLockdown && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Emergency Lockdown:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Audit inspection, suspected breach, power maintenance"
                  value={lockdownReason}
                  onChange={(e) => setLockdownReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowLockdownPrompt(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleEmergencyLockdown}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-sm transition-colors cursor-pointer ${
                  policyForm.emergencyLockdown ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {policyForm.emergencyLockdown ? 'Confirm Lift Lockdown' : 'Confirm Lockdown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
