import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Centre, User } from '../types';
import { 
  Building2, Shield, Lock, User as UserIcon, CheckCircle2, 
  ArrowRight, AlertCircle, Plus, Eye, EyeOff, MapPin, 
  Phone, Mail, Sparkles, KeyRound, ChevronRight
} from 'lucide-react';

interface CentreLoginScreenProps {
  onOpenCreateCentre: () => void;
}

export const CentreLoginScreen: React.FC<CentreLoginScreenProps> = ({ onOpenCreateCentre }) => {
  const { centres, login, selectCentre, currentCentre } = useAuth();

  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('apex123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [centreStaff, setCentreStaff] = useState<User[]>([]);
  const [loadingStaff, setLoadingStaff] = useState<boolean>(false);

  // Set default selected centre
  useEffect(() => {
    if (centres.length > 0 && !selectedCentreId) {
      const initial = currentCentre?.id || centres[0].id;
      setSelectedCentreId(initial);
    }
  }, [centres, currentCentre]);

  // Load authorized staff for selected centre to display quick credentials
  useEffect(() => {
    if (!selectedCentreId) return;
    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const staff = await api.getCentreUsers(selectedCentreId);
        setCentreStaff(staff);
        if (staff.length > 0) {
          // Pre-fill first staff username if blank or previous was different
          setUsername(staff[0].username);
        }
      } catch (err) {
        console.error('Failed to fetch centre staff:', err);
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaff();
  }, [selectedCentreId]);

  const activeCentre = centres.find(c => c.id === selectedCentreId) || centres[0];

  const handleCentreChange = (centreId: string) => {
    setSelectedCentreId(centreId);
    setError(null);
  };

  const handleQuickStaffSelect = (user: User) => {
    setUsername(user.username);
    setPassword(user.password || 'apex123');
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentreId) {
      setError('Please select a collection centre.');
      return;
    }
    if (!username.trim()) {
      setError('Please enter your staff username or ID.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(selectedCentreId, username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Access authorization failed. Please verify credentials for this centre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Bar / Affiliation Header */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-wider">
            AD
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">
              APEX DIAGNOSTICS CENTRAL REFERENCE LABORATORY
            </div>
            <div className="text-[10px] text-slate-400">
              Franchise Operations Network • Collection Centre Workspace Gateway
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCreateCentre}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Onboard New Collection Centre</span>
        </button>
      </div>

      {/* Main Login Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Centre Selector & Branch Identity */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
                <Shield className="w-3.5 h-3.5" />
                <span>Authorized Multi-Tenant Isolation</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                Collection Centre Sign-In
              </h1>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Select your designated collection centre to access its independent patients, orders, billing wallet, thermal label printer, and courier manifest.
              </p>

              {/* Centre Selection Cards */}
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                Select Collection Centre ({centres.length} Registered)
              </label>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {centres.map((centre) => {
                  const isSelected = centre.id === selectedCentreId;
                  return (
                    <button
                      key={centre.id}
                      type="button"
                      onClick={() => handleCentreChange(centre.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/50'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                          <span className="font-bold text-xs truncate">{centre.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-indigo-300 border border-slate-700">
                            {centre.code}
                          </span>
                          <span>•</span>
                          <span>{centre.city}</span>
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* "+ Add More Collection Centre" action */}
              <button
                type="button"
                onClick={onOpenCreateCentre}
                className="mt-3 w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-400 hover:text-indigo-400 flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Onboard Additional Collection Centre</span>
              </button>
            </div>

            {/* Selected Centre Profile Footer */}
            {activeCentre && (
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span className="truncate">{activeCentre.address}, {activeCentre.city}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Phone: {activeCentre.phone}</span>
                  <span className="text-emerald-400 font-medium">Active Franchise</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Dedicated Centre Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-slate-950">
            <div>
              {/* Centre Banner on Login Form */}
              {activeCentre && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                      Target Workspace
                    </div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{activeCentre.name}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {activeCentre.code}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Commercial Rate</div>
                    <div className="text-xs font-semibold text-slate-200">
                      {Math.round(activeCentre.franchiseCommercialRate * 100)}% Lab Share
                    </div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Staff Username or Access ID <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. admin_metro, rec_metro, phleb_metro"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Security Password / PIN <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">Default: apex123</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize & Enter {activeCentre?.name || 'Workspace'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick-Access Staff Credentials Drawer */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    Authorized Staff for {activeCentre?.code} (Click to Load)
                  </span>
                  <span className="text-[10px] text-slate-500">PIN: apex123</span>
                </div>

                {loadingStaff ? (
                  <div className="py-2 text-center text-xs text-slate-500">Loading authorized staff...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {centreStaff.map((st) => {
                      const isRoleAdmin = st.role === 'centre_admin';
                      const isRoleRec = st.role === 'receptionist';
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleQuickStaffSelect(st)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            username === st.username
                              ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              isRoleAdmin ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                              isRoleRec ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                              'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}>
                              {st.role === 'centre_admin' ? 'Admin' : st.role === 'receptionist' ? 'Reception' : 'Phlebotomy'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{st.username}</span>
                          </div>
                          <div className="text-xs font-semibold text-white truncate">{st.name}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Compliance & Security Guarantee Notice */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Isolated Multi-Tenant Security & Audit Logged</span>
              </div>
              <div>Parent Lab: Apex Central Reference Lab</div>
            </div>

          </div>

        </div>
      </div>

      {/* Bottom Footer */}
      <div className="px-6 py-3 text-center text-xs text-slate-500 border-t border-slate-800/60">
        Diagnostic Franchise SaaS Platform • Independent Collection Centre Operations Module • Real-time LIMS Sync
      </div>
    </div>
  );
};
