import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ROLE_DEFINITIONS } from '../../utils/rbac';
import { Eye, ShieldAlert, X, Sparkles, Check } from 'lucide-react';

export const RoleSimulatorBar: React.FC = () => {
  const { currentUser, simulatedRole, setSimulatedRole, rolePermissions } = useAuth();

  if (currentUser.role !== 'centre_admin') return null;

  const roles: UserRole[] = ['receptionist', 'phlebotomist', 'dispatch_officer', 'lab_coordinator'];

  return (
    <div className="mb-6 rounded-2xl overflow-hidden border border-purple-200 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-lg">
      <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0">
            {simulatedRole ? (
              <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : (
              <Eye className="w-5 h-5 text-purple-300" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Admin Role-Based Authentication Testing Sandbox
              </span>
              {simulatedRole && (
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30">
                  SIMULATION ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {simulatedRole ? (
                <>
                  You are currently testing the app as <strong className="text-white">{ROLE_DEFINITIONS[simulatedRole].title}</strong>. All collection centre interface restrictions, button locks, and supervisor prompts are live!
                </>
              ) : (
                'As Centre Admin, you possess all rights. Select a role below to simulate and verify their restricted UI permissions live.'
              )}
            </p>
          </div>
        </div>

        {/* Role Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {roles.map((r) => {
            const def = ROLE_DEFINITIONS[r];
            const isSimulated = simulatedRole === r;
            return (
              <button
                key={r}
                onClick={() => setSimulatedRole(isSimulated ? null : r)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isSimulated
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300 font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                }`}
              >
                <span>{def.badgeLabel}</span>
                {isSimulated && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}

          {simulatedRole && (
            <button
              onClick={() => setSimulatedRole(null)}
              className="text-xs px-3 py-1.5 rounded-lg font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1 transition-all cursor-pointer ml-1"
              title="Exit simulation and restore full admin authority"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* When simulation is active, show quick active permission breakdown */}
      {simulatedRole && (
        <div className="bg-slate-950/60 px-5 py-2.5 border-t border-purple-800/40 text-[11px] flex flex-wrap items-center justify-between gap-2 text-slate-300">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulated Scope: {ROLE_DEFINITIONS[simulatedRole].description}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400 font-mono">
            <span>Orders: {rolePermissions[simulatedRole].canCreateOrders ? '✅ Yes' : '🔒 No'}</span>
            <span>•</span>
            <span>Phlebotomy: {rolePermissions[simulatedRole].canCollectSamples ? '✅ Yes' : '🔒 No'}</span>
            <span>•</span>
            <span>Dispatch: {rolePermissions[simulatedRole].canDispatchBatches ? '✅ Yes' : '🔒 No'}</span>
            <span>•</span>
            <span>Central Lab Data: {rolePermissions[simulatedRole].canExtractCentralLabData ? '✅ Yes' : '🔒 No'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
