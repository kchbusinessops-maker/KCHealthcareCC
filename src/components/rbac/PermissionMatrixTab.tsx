import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, RolePermissionMatrix, GranularPermissionKey } from '../../types';
import { PERMISSION_CATALOG, PRESET_POLICIES, ROLE_DEFINITIONS } from '../../utils/rbac';
import { 
  Shield, Check, Lock, Sparkles, RotateCcw, Save, Search,
  Sliders, FileCheck, CheckCircle2, ShieldAlert, Info
} from 'lucide-react';

export const PermissionMatrixTab: React.FC = () => {
  const { currentCentre, rolePermissions, updateAuthPolicy, authPolicy, showNotification } = useAuth();
  
  // Local state for interactive editing before saving
  const [matrix, setMatrix] = useState<RolePermissionMatrix>(rolePermissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [activePresetKey, setActivePresetKey] = useState<string>(authPolicy.activePreset || 'standard');

  const roles: UserRole[] = [
    'centre_admin',
    'receptionist',
    'phlebotomist',
    'dispatch_officer',
    'lab_coordinator'
  ];

  const categories = [
    { id: 'all', label: 'All Permissions (15)' },
    { id: 'Intake & Billing', label: 'Intake & Billing (5)' },
    { id: 'Clinical & Phlebotomy', label: 'Clinical & Phlebotomy (3)' },
    { id: 'Logistics & Dispatch', label: 'Logistics & Dispatch (2)' },
    { id: 'Central Lab & LIMS', label: 'Central Lab & LIMS (2)' },
    { id: 'Admin & Finance', label: 'Admin & Governance (3)' },
  ];

  const filteredPermissions = PERMISSION_CATALOG.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggle = (role: UserRole, key: GranularPermissionKey) => {
    if (role === 'centre_admin') {
      showNotification('Administrator retains all rights permanently by franchise policy.', 'info');
      return;
    }
    setMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key]
      }
    }));
  };

  const handleApplyPreset = (presetKey: 'standard' | 'iso_15189' | 'high_throughput') => {
    const preset = PRESET_POLICIES[presetKey];
    if (!preset) return;
    setMatrix(preset.permissions as RolePermissionMatrix);
    setActivePresetKey(presetKey);
    showNotification(`Applied preset "${preset.name}". Click "Deploy to Centre" to persist.`, 'info');
  };

  const handleSaveMatrix = async () => {
    setIsSaving(true);
    try {
      await updateAuthPolicy({ activePreset: activePresetKey as any }, matrix);
      showNotification('Permission matrix successfully updated and deployed to all centre terminals!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to deploy matrix', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Explanation & Presets Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Granular Role-Based Access Control Matrix
                </h2>
                <p className="text-xs text-slate-500">
                  Manage functional capabilities for {currentCentre?.name}. The Collection Centre Administrator maintains permanent executive rights.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Industry Presets:</span>
            </span>

            <button
              onClick={() => handleApplyPreset('standard')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer border ${
                activePresetKey === 'standard'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              Standard Franchise
            </button>

            <button
              onClick={() => handleApplyPreset('iso_15189')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer border ${
                activePresetKey === 'iso_15189'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              ISO 15189 Strict
            </button>

            <button
              onClick={() => handleApplyPreset('high_throughput')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer border ${
                activePresetKey === 'high_throughput'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              High-Throughput Metro
            </button>

            <button
              onClick={handleSaveMatrix}
              disabled={isSaving}
              className="ml-2 text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Deploying...' : 'Deploy to Centre'}</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs border-b border-slate-800">
                <th className="py-3.5 px-4 font-bold w-2/5">Permission / Operational Capability</th>
                {roles.map((role) => {
                  const def = ROLE_DEFINITIONS[role];
                  return (
                    <th key={role} className="py-3.5 px-3 text-center font-bold">
                      <div className="flex flex-col items-center">
                        <span className="text-xs">{def.title}</span>
                        {role === 'centre_admin' ? (
                          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center space-x-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>ALL RIGHTS</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {def.badgeLabel}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPermissions.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-start space-x-2.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase mt-0.5 shrink-0 ${
                        perm.riskLevel === 'critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        perm.riskLevel === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        perm.riskLevel === 'elevated' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {perm.riskLevel}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                          <span>{perm.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({perm.key})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {perm.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role Checkbox Columns */}
                  {roles.map((role) => {
                    if (role === 'centre_admin') {
                      return (
                        <td key={role} className="py-3 px-3 text-center bg-emerald-50/30">
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-300" title="Admin retains full unrestricted rights">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        </td>
                      );
                    }

                    const isGranted = !!matrix[role]?.[perm.key];

                    return (
                      <td key={role} className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(role, perm.key)}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer border ${
                            isGranted
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs hover:bg-blue-700'
                              : 'bg-slate-100 text-slate-300 border-slate-200 hover:bg-slate-200 hover:text-slate-400'
                          }`}
                          title={`Toggle ${perm.label} for ${ROLE_DEFINITIONS[role].title}`}
                        >
                          {isGranted ? <Check className="w-4 h-4 stroke-[2.5]" /> : <span className="text-xs">✕</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Changes made here take effect immediately across all collection bay terminals upon clicking Deploy.</span>
          </div>

          <button
            onClick={handleSaveMatrix}
            disabled={isSaving}
            className="text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Deploying...' : 'Deploy to Centre'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
