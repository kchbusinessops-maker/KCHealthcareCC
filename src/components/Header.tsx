import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  Building2, UserCheck, Wallet, Search, RefreshCw, AlertTriangle, ShieldCheck, ChevronDown, CheckCircle2,
  Plus, LogOut, KeyRound, FileSpreadsheet, Download, Shield, FlaskConical
} from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenWallet: () => void;
  onOpenCentralLabExtract: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenSearch, 
  onOpenWallet, 
  onOpenCentralLabExtract,
  activeTab, 
  setActiveTab 
}) => {
  const { 
    centres, currentCentre, currentUser, selectCentre, selectRole, 
    notification, clearNotification, openCreateCentreModal, logout,
    simulatedRole, setSimulatedRole, effectiveRole, canDo 
  } = useAuth();
  const [centreDropdownOpen, setCentreDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Compute allowed tabs based on role and permissions
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      visible: canDo('canViewDashboard'),
      badge: null,
      icon: null
    },
    {
      id: 'new_order',
      label: '+ New Order / Walk-in',
      visible: canDo('canCreateOrders'),
      badge: null,
      icon: null
    },
    {
      id: 'phlebotomy',
      label: 'Phlebotomy & QR Scan',
      visible: canDo('canCollectSamples') || effectiveRole === 'phlebotomist',
      badge: null,
      icon: null
    },
    {
      id: 'dispatch',
      label: 'Dispatch Batches',
      visible: canDo('canDispatchBatches') || effectiveRole === 'dispatch_officer',
      badge: null,
      icon: null
    },
    {
      id: 'patients',
      label: effectiveRole === 'phlebotomist' ? 'Patients Clinical Registry' : 'Patients Registry',
      visible: canDo('canManagePatients') || effectiveRole === 'phlebotomist',
      badge: null,
      icon: null
    },
    {
      id: 'orders',
      label: effectiveRole === 'phlebotomist' ? 'Orders & Sample Tracking' : effectiveRole === 'dispatch_officer' ? 'Orders Logistics' : 'Orders & Invoices',
      visible: canDo('canCreateOrders') || canDo('canViewReports') || effectiveRole === 'phlebotomist' || effectiveRole === 'lab_coordinator' || effectiveRole === 'centre_admin',
      badge: null,
      icon: null
    },
    {
      id: 'reports',
      label: 'Diagnostic Reports',
      visible: canDo('canViewReports') || effectiveRole === 'lab_coordinator',
      badge: null,
      icon: null
    },
    {
      id: 'wallet',
      label: 'Centre Wallet',
      visible: canDo('canManageWallet') || effectiveRole === 'centre_admin',
      badge: null,
      icon: null
    },
    {
      id: 'central_lab_extract',
      label: 'Central Lab Extract',
      visible: canDo('canExtractCentralLabData') || effectiveRole === 'lab_coordinator' || effectiveRole === 'dispatch_officer',
      badge: 'CSV/JSON',
      icon: FlaskConical,
      color: 'indigo'
    },
    {
      id: 'staff_roles',
      label: 'Admin RBAC & Governance',
      visible: canDo('canAssignRoles') || (effectiveRole === 'centre_admin' && !simulatedRole),
      badge: 'All Rights',
      icon: Shield,
      color: 'purple'
    }
  ].filter(item => item.visible);

  // Auto-redirect if current active tab is restricted for this role
  React.useEffect(() => {
    const isAllowed = navItems.some(i => i.id === activeTab);
    if (!isAllowed && activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  }, [effectiveRole, navItems]);

  const isLowBalance = currentCentre ? currentCentre.walletBalance < currentCentre.walletLowBalanceThreshold : false;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner: Parent Lab & Franchise Affiliation */}
      <div className="bg-slate-950 px-4 py-1 text-xs flex flex-wrap items-center justify-between border-b border-slate-800/60 text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-300">PARENT LAB:</span>
          <span>{currentCentre?.parentLabName || 'Apex Diagnostics Central Reference Laboratory'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-medium">B2B Franchise Network</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={openCreateCentreModal}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer bg-indigo-950/60 hover:bg-indigo-900/80 px-2.5 py-0.5 rounded border border-indigo-700/50"
          >
            <Plus className="w-3 h-3" />
            <span>+ Onboard Centre</span>
          </button>
          <span className="text-slate-600">|</span>
          <button 
            onClick={onOpenCentralLabExtract}
            className="text-indigo-300 hover:text-indigo-200 flex items-center space-x-1 cursor-pointer bg-indigo-950/60 hover:bg-indigo-900/80 px-2.5 py-0.5 rounded border border-indigo-700/50"
            title="Extract specimen and test order data for Central Laboratory"
          >
            <FileSpreadsheet className="w-3 h-3 text-indigo-400" />
            <span className="font-semibold text-indigo-200">Extract Central Lab Data</span>
          </button>
          <span className="text-slate-600">|</span>
          <span>Commercial Lab Share: {Math.round((currentCentre?.franchiseCommercialRate || 0.65) * 100)}%</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Centre Branding & Switcher */}
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-2 rounded-lg text-white shadow-sm flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>

            <div className="relative">
              <button 
                onClick={() => setCentreDropdownOpen(!centreDropdownOpen)}
                className="flex items-center space-x-2 text-left hover:bg-slate-800/80 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
                title="Switch collection centre to test multi-centre security isolation"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-base text-white tracking-tight">{currentCentre?.name || 'Collection Centre'}</span>
                    <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded font-mono font-medium border border-blue-500/30">
                      {currentCentre?.code}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-1">
                    <span>{currentCentre?.city} Centre</span>
                    <span>•</span>
                    <span className="text-slate-500">Click to switch centre</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Centre Switcher Dropdown */}
              {centreDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 border-b border-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Collection Centres ({centres.length})</span>
                    <button
                      onClick={() => {
                        setCentreDropdownOpen(false);
                        openCreateCentreModal();
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 cursor-pointer lowercase first-letter:uppercase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New</span>
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {centres.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          selectCentre(c.id);
                          setCentreDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 hover:bg-slate-700/80 flex items-center justify-between text-sm ${c.id === currentCentre?.id ? 'bg-slate-700/50 text-blue-400 font-medium' : 'text-slate-200'}`}
                      >
                        <div>
                          <div className="font-medium text-white">{c.name}</div>
                          <div className="text-xs text-slate-400">{c.city} • Code: {c.code}</div>
                        </div>
                        {c.id === currentCentre?.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </button>
                    ))}
                  </div>

                  {/* Onboard New Collection Centre button inside dropdown */}
                  <div className="p-2 border-t border-slate-700 bg-slate-900/80">
                    <button
                      onClick={() => {
                        setCentreDropdownOpen(false);
                        openCreateCentreModal();
                      }}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Onboard New Collection Centre</span>
                    </button>
                  </div>

                  <div className="px-3 py-2 text-[11px] text-slate-400 bg-slate-900/60 border-t border-slate-700 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                    Strict backend isolation prevents cross-centre access.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Universal Search & Statuses */}
          <div className="flex items-center space-x-3">
            {/* Quick Search trigger */}
            <button
              id="global-search-btn"
              onClick={onOpenSearch}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/90 text-slate-300 px-3.5 py-1.5 rounded-lg border border-slate-700 text-sm transition-all cursor-pointer"
              title="Search patient, mobile, UHID, order #, tube # (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline text-xs text-slate-300">Fast Centre Search</span>
              <kbd className="hidden sm:inline bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700">⌘K</kbd>
            </button>

            {/* Central Lab Extraction Button */}
            <button
              id="header-extract-central-lab-btn"
              onClick={onOpenCentralLabExtract}
              className="hidden lg:flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border border-indigo-500/50"
              title="Extract Specimen & Order Data for Central Laboratory Accessioning"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Central Lab Data Extract</span>
            </button>

            {/* Centre Wallet Widget */}
            <div 
              onClick={onOpenWallet}
              className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                isLowBalance 
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 hover:bg-amber-900/50' 
                  : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title="View Centre Wallet & B2B Commercial Ledger"
            >
              <Wallet className={`w-4 h-4 ${isLowBalance ? 'text-amber-400 animate-bounce' : 'text-emerald-400'}`} />
              <div>
                <div className="text-[10px] text-slate-400 leading-none">Centre Wallet</div>
                <div className="font-bold text-xs sm:text-sm text-white">
                  ₹{currentCentre?.walletBalance.toLocaleString() || '0'}
                </div>
              </div>
              {isLowBalance && (
                <span className="hidden sm:inline bg-amber-500/30 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-amber-500/40">
                  LOW
                </span>
              )}
            </div>

            {/* Role Switcher & User Profile */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/90 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Change active user role"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white uppercase">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-white leading-tight">{currentUser.name}</div>
                  <div className="text-[11px] text-blue-400 capitalize font-medium">{currentUser.title}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role & Session Dropdown */}
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                    Active Staff Profile
                  </div>
                  <div className="px-3 py-2 border-b border-slate-700/80 bg-slate-900/40">
                    <div className="text-xs font-bold text-white">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-400">{currentUser.title} • {currentCentre?.code}</div>
                  </div>

                  <div className="px-3 pt-2 pb-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Switch Role (Authorized)
                  </div>
                  <button
                    onClick={() => { selectRole('centre_admin'); setRoleDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center space-x-2 ${currentUser.role === 'centre_admin' ? 'bg-slate-700/50 text-purple-400 font-semibold' : 'text-slate-200'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <div>
                      <div>Centre Admin / In-Charge</div>
                      <span className="text-[10px] text-slate-400">Staff roles, wallet & operations</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { selectRole('receptionist'); setRoleDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center space-x-2 ${currentUser.role === 'receptionist' ? 'bg-slate-700/50 text-blue-400 font-semibold' : 'text-slate-200'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <div>
                      <div>Receptionist / Billing</div>
                      <span className="text-[10px] text-slate-400">Patient intake, billing & orders</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { selectRole('phlebotomist'); setRoleDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center space-x-2 ${currentUser.role === 'phlebotomist' ? 'bg-slate-700/50 text-emerald-400 font-semibold' : 'text-slate-200'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <div>
                      <div>Phlebotomist / Tech</div>
                      <span className="text-[10px] text-slate-400">Sample draw, barcode scan & fasting check</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { selectRole('dispatch_officer'); setRoleDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center space-x-2 ${currentUser.role === 'dispatch_officer' ? 'bg-slate-700/50 text-amber-400 font-semibold' : 'text-slate-200'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <div>
                      <div>Logistics & Dispatch</div>
                      <span className="text-[10px] text-slate-400">Cold chain boxes, seals & manifest</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { selectRole('lab_coordinator'); setRoleDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center space-x-2 ${currentUser.role === 'lab_coordinator' ? 'bg-slate-700/50 text-indigo-400 font-semibold' : 'text-slate-200'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <div>
                      <div>Central Lab Coordinator</div>
                      <span className="text-[10px] text-slate-400">Test data extract & central lab ingest</span>
                    </div>
                  </button>

                  {/* Switch Centre / Logout */}
                  <div className="pt-2 mt-2 border-t border-slate-700">
                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 flex items-center space-x-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Switch Centre / Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Simulation Banner if Admin is testing role */}
      {simulatedRole && (
        <div className="bg-amber-400 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between border-t border-amber-300">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
            <span>
              ROLE SIMULATION ACTIVE: Testing interface under the restricted privileges of "{simulatedRole.replace('_', ' ').toUpperCase()}". (Real Admin retains all rights).
            </span>
            <button
              onClick={() => setSimulatedRole(null)}
              className="ml-auto bg-slate-950 hover:bg-slate-800 text-white text-[10px] px-2.5 py-0.5 rounded font-mono font-bold cursor-pointer transition-colors"
            >
              Exit Simulation & Restore Full Admin Rights
            </button>
          </div>
        </div>
      )}

      {/* Navigation Sub-bar */}
      <nav className="bg-slate-800/90 border-t border-slate-700/70 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-1 scrollbar-none gap-2">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-0.5 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
                    isActive 
                      ? item.color === 'purple' 
                        ? 'bg-purple-600 text-white shadow-sm font-bold'
                        : item.color === 'indigo'
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : 'bg-blue-600 text-white shadow-sm font-bold' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Role Data Scope Indicator */}
          <div className="hidden lg:flex items-center space-x-2 shrink-0 pl-2">
            <div className="flex items-center space-x-1.5 text-[11px] bg-slate-950/70 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/80">
              <span className={`w-1.5 h-1.5 rounded-full ${simulatedRole ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
              <span className="text-slate-400">Data View:</span>
              <span className="font-bold text-white uppercase tracking-wider text-[10px]">
                {effectiveRole.replace('_', ' ')}
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                ({navItems.length} modules allowed)
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Notification Toast */}
      {notification && (
        <div className={`px-4 py-2 text-xs flex items-center justify-between transition-all ${
          notification.type === 'error' ? 'bg-red-600 text-white' :
          notification.type === 'warning' ? 'bg-amber-500 text-slate-950 font-medium' :
          notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
        }`}>
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            {notification.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={clearNotification} className="text-white hover:opacity-80 ml-4 font-bold text-sm">×</button>
        </div>
      )}
    </header>
  );
};
