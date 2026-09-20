import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_DEFINITIONS } from '../utils/rbac';
import { 
  Shield, UserCheck, Sliders, ShieldCheck, Building2, 
  History, Sparkles, RefreshCw, Lock, AlertTriangle, KeyRound
} from 'lucide-react';
import { StaffRosterTab } from './rbac/StaffRosterTab';
import { PermissionMatrixTab } from './rbac/PermissionMatrixTab';
import { SecurityPolicyTab } from './rbac/SecurityPolicyTab';
import { CentreNetworkTab } from './rbac/CentreNetworkTab';
import { SecurityAuditTab } from './rbac/SecurityAuditTab';
import { RoleSimulatorBar } from './rbac/RoleSimulatorBar';

export const StaffManagementModule: React.FC = () => {
  const { 
    currentCentre, currentUser, staffUsers, authPolicy, 
    refreshStaffUsers, refreshRbacPolicy, centres 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'roster' | 'matrix' | 'policy' | 'centres' | 'audit'>('roster');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshStaffUsers(), refreshRbacPolicy()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isAdmin = currentUser.role === 'centre_admin';

  return (
    <div className="space-y-6 pb-12">
      {/* Role Simulator Sandbox for Centre Admin */}
      <RoleSimulatorBar />

      {/* Main Executive Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-sm flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-bold text-slate-900">
                  Collection Centre Governance & Role-Based Authentication
                </h1>
                <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                  ADMIN EXECUTIVE MODULE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {currentCentre?.name} ({currentCentre?.code}) • Accredited Parent Lab: <strong className="text-slate-700">{currentCentre?.parentLabName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Sync latest roster and security policies"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync Policies</span>
            </button>

            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin All-Rights Active</span>
            </div>
          </div>
        </div>

        {/* Executive KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Staff Directory</div>
            <div className="text-base font-bold text-slate-900 mt-0.5 flex items-center justify-between">
              <span>{staffUsers.length} Members</span>
              <span className="text-[11px] text-emerald-600 font-semibold">{staffUsers.filter(u => u.active).length} Active</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Enforcement Preset</div>
            <div className="text-base font-bold text-slate-900 mt-0.5 capitalize">
              {authPolicy.activePreset === 'iso_15189' ? 'ISO 15189 Strict' : 
               authPolicy.activePreset === 'high_throughput' ? 'High-Throughput' : 'Standard Franchise'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Security Mode</div>
            <div className="text-base font-bold text-slate-900 mt-0.5 uppercase tracking-wide">
              {authPolicy.enforcementMode} Mode
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Franchise Centres</div>
            <div className="text-base font-bold text-slate-900 mt-0.5 flex items-center justify-between">
              <span>{centres.length} Regional Hubs</span>
              <span className="text-[11px] text-blue-600 font-semibold">1-Click Switch</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'roster' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Staff Directory & Credentials ({staffUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'matrix' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Permissions Matrix (15 Rights)</span>
          </button>

          <button
            onClick={() => setActiveTab('policy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'policy' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Supervisor Overrides & Security Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('centres')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'centres' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Franchise Network Oversight ({centres.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'audit' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Security & Auth Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'roster' && <StaffRosterTab />}
      {activeTab === 'matrix' && <PermissionMatrixTab />}
      {activeTab === 'policy' && <SecurityPolicyTab />}
      {activeTab === 'centres' && <CentreNetworkTab />}
      {activeTab === 'audit' && <SecurityAuditTab />}
    </div>
  );
};
