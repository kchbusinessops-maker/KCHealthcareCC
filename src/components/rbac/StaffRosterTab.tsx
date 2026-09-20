import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole } from '../../types';
import { ROLE_DEFINITIONS } from '../../utils/rbac';
import { 
  UserCheck, Plus, KeyRound, Edit2, ShieldAlert, 
  Search, Check, X, Copy, CheckCircle2, UserCog, 
  Mail, Phone, Lock, Eye, Sparkles, Filter
} from 'lucide-react';

export const StaffRosterTab: React.FC = () => {
  const { 
    currentCentre, staffUsers, updateStaffRole, createStaffUser, 
    toggleStaffStatus, resetStaffCredentials, setSimulatedRole,
    refreshStaffUsers, showNotification 
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<UserRole>('receptionist');
  const [editDetails, setEditDetails] = useState({ name: '', email: '', phone: '', workstation: '', employeeId: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset credential result modal
  const [credentialResult, setCredentialResult] = useState<{
    user: User;
    tempPassword: string;
    tempPin: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    username: '',
    role: 'receptionist' as UserRole,
    email: '',
    phone: '',
    password: '',
    pin: '1234',
    employeeId: '',
    workstation: ''
  });

  const rolesList: UserRole[] = [
    'centre_admin',
    'receptionist',
    'phlebotomist',
    'dispatch_officer',
    'lab_coordinator'
  ];

  const filteredUsers = staffUsers.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.employeeId && user.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.active : !user.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setSelectedRoleForEdit(user.role);
    setEditDetails({
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      workstation: user.workstation || '',
      employeeId: user.employeeId || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      await updateStaffRole(editingUser.id, selectedRoleForEdit, {
        name: editDetails.name.trim() || editingUser.name,
        email: editDetails.email.trim(),
        phone: editDetails.phone.trim()
      });
      setEditingUser(null);
    } catch (err) {
      // Handled
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetCredentials = async (user: User) => {
    if (!window.confirm(`Generate new temporary credentials and security PIN for ${user.name}?`)) return;
    try {
      const res = await resetStaffCredentials(user.id);
      setCredentialResult({
        user,
        tempPassword: res.tempPassword,
        tempPin: res.tempPin
      });
    } catch (err: any) {
      // Handled
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.username.trim()) {
      showNotification('Please enter the staff member name and unique username', 'error');
      return;
    }
    setIsUpdating(true);
    try {
      await createStaffUser({
        name: newStaff.name.trim(),
        username: newStaff.username.trim().toLowerCase(),
        role: newStaff.role,
        email: newStaff.email.trim(),
        phone: newStaff.phone.trim(),
        password: newStaff.password.trim() || 'apex123',
        pin: newStaff.pin.trim() || '1234',
        employeeId: newStaff.employeeId.trim(),
        workstation: newStaff.workstation.trim()
      });
      setIsAddModalOpen(false);
      setNewStaff({
        name: '',
        username: '',
        role: 'receptionist',
        email: '',
        phone: '',
        password: '',
        pin: '1234',
        employeeId: '',
        workstation: ''
      });
    } catch (err) {
      // Handled
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search staff by name, username, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">All Roles ({staffUsers.length})</option>
            {rolesList.map((r) => (
              <option key={r} value={r}>{ROLE_DEFINITIONS[r].title}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Suspended Only</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Staff Member</span>
          </button>
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs border-b border-slate-800">
                <th className="py-3.5 px-4 font-bold">Staff Member & Username</th>
                <th className="py-3.5 px-4 font-bold">Role & Authority</th>
                <th className="py-3.5 px-4 font-bold">Workstation / Bay</th>
                <th className="py-3.5 px-4 font-bold">Contact Details</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No staff members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const def = ROLE_DEFINITIONS[user.role];
                  return (
                    <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors ${!user.active ? 'opacity-60 bg-slate-50/40' : ''}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200 uppercase">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                              <span>{user.name}</span>
                              {user.employeeId && (
                                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                  {user.employeeId}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-flex items-center space-x-1 ${def.badgeBg} ${def.badgeText} ${def.badgeBorder}`}>
                          <span>{def.badgeLabel}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{def.title}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-700 font-medium">
                          {user.workstation || 'General Bay'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-600">
                          {user.email || 'No email registered'}
                        </div>
                        {user.phone && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {user.phone}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          user.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {user.active ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Test Role Simulation button */}
                          <button
                            type="button"
                            onClick={() => setSimulatedRole(user.role)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title={`Test Collection Centre UI as ${user.name} (${def.title})`}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          {/* Edit Role */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Role & Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset Credentials */}
                          <button
                            type="button"
                            onClick={() => handleResetCredentials(user)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Reset Login Password & 4-Digit Quick PIN"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Suspend / Reactivate */}
                          {user.role !== 'centre_admin' && (
                            <button
                              type="button"
                              onClick={() => toggleStaffStatus(user.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                user.active 
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={user.active ? 'Suspend Staff Account' : 'Reactivate Staff Account'}
                            >
                              {user.active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Onboard New Staff */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Onboard Collection Centre Staff</h3>
                  <p className="text-xs text-slate-500">Assign role and secure authentication credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. priya_phleb"
                    value={newStaff.username}
                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Assignment *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_DEFINITIONS[r].title} — {ROLE_DEFINITIONS[r].description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee / Staff ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-1049"
                    value={newStaff.employeeId}
                    onChange={(e) => setNewStaff({ ...newStaff, employeeId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Workstation / Phlebotomy Bay</label>
                  <input
                    type="text"
                    placeholder="e.g. Bay 2 (Venipuncture)"
                    value={newStaff.workstation}
                    onChange={(e) => setNewStaff({ ...newStaff, workstation: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    placeholder="apex123"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Terminal Quick PIN (4-Digits)</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="1234"
                    value={newStaff.pin}
                    onChange={(e) => setNewStaff({ ...newStaff, pin: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="priya@diagnostic.com"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {isUpdating ? 'Creating...' : 'Onboard & Generate Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Staff Role & Bay */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Edit Staff Authority: {editingUser.name}</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role / Privilege Level</label>
                <select
                  value={selectedRoleForEdit}
                  onChange={(e) => setSelectedRoleForEdit(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_DEFINITIONS[r].title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_DEFINITIONS[selectedRoleForEdit].description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editDetails.name}
                  onChange={(e) => setEditDetails({ ...editDetails, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editDetails.email}
                    onChange={(e) => setEditDetails({ ...editDetails, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editDetails.phone}
                    onChange={(e) => setEditDetails({ ...editDetails, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Update Authority'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Temporary Credentials Generated Modal */}
      {credentialResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">New Credentials Issued</h3>
                <p className="text-xs text-slate-500">Security credentials reset for {credentialResult.user.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Share these temporary credentials with the staff member. They will be prompted to set a permanent password upon first terminal login.
            </p>

            <div className="space-y-3 mb-5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Temporary Password</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                    {credentialResult.tempPassword}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(credentialResult.tempPassword, 'pass')}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
                  title="Copy Password"
                >
                  {copiedField === 'pass' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Quick Terminal PIN</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                    {credentialResult.tempPin}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(credentialResult.tempPin, 'pin')}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
                  title="Copy PIN"
                >
                  {copiedField === 'pin' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setCredentialResult(null)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
