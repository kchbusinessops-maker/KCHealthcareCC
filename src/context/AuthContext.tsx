import React, { createContext, useContext, useState, useEffect } from 'react';
import { Centre, User, UserRole, AuthPolicyConfig, RolePermissionMatrix, GranularPermissionKey } from '../types';
import { api, setSecurityContext } from '../services/api';
import { hasPermission, DEFAULT_ROLE_PERMISSIONS, DEFAULT_AUTH_POLICY } from '../utils/rbac';

interface AuthContextType {
  isAuthenticated: boolean;
  centres: Centre[];
  currentCentre: Centre | null;
  currentUser: { id: string; name: string; role: UserRole; centreId: string; title: string; username?: string };
  tenantId: string;
  login: (centreId: string, username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  createCentre: (data: any) => Promise<{ centre: Centre; users: User[] }>;
  selectCentre: (centreId: string) => void;
  selectRole: (role: UserRole) => void;
  selectUser: (user: User) => void;
  staffUsers: User[];
  refreshStaffUsers: () => Promise<User[]>;
  updateStaffRole: (userId: string, role: UserRole, details?: { name?: string; email?: string; phone?: string; active?: boolean }) => Promise<void>;
  createStaffUser: (data: { name: string; username: string; role: UserRole; email?: string; phone?: string; password?: string; pin?: string; employeeId?: string; workstation?: string }) => Promise<User>;
  toggleStaffStatus: (userId: string) => Promise<void>;
  resetStaffCredentials: (userId: string) => Promise<{ tempPassword: string; tempPin: string; user: User }>;
  reloadCentreData: () => Promise<void>;
  refreshCentres: () => Promise<Centre[]>;
  notification: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  clearNotification: () => void;
  isCreateCentreModalOpen: boolean;
  openCreateCentreModal: () => void;
  closeCreateCentreModal: () => void;

  // RBAC & Authentication Policy Engine
  authPolicy: AuthPolicyConfig;
  rolePermissions: RolePermissionMatrix;
  simulatedRole: UserRole | null;
  setSimulatedRole: (role: UserRole | null) => void;
  effectiveRole: UserRole;
  canDo: (permission: GranularPermissionKey) => boolean;
  updateAuthPolicy: (policy?: Partial<AuthPolicyConfig>, permissions?: RolePermissionMatrix) => Promise<void>;
  verifySupervisorPin: (pin: string) => Promise<boolean>;
  setEmergencyLockdown: (locked: boolean, reason?: string) => Promise<void>;
  refreshRbacPolicy: () => Promise<void>;
}

const defaultUser = {
  id: 'usr-rec-01',
  name: 'Rahul Verma',
  role: 'receptionist' as UserRole,
  centreId: 'centre-01',
  title: 'Receptionist',
  username: 'rec_metro'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [currentCentre, setCurrentCentre] = useState<Centre | null>(null);
  const [currentUser, setCurrentUser] = useState(defaultUser);
  const [tenantId, setTenantId] = useState('apex-parent-lab');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [isCreateCentreModalOpen, setIsCreateCentreModalOpen] = useState<boolean>(false);

  // RBAC & Authentication Policy Engine State
  const [authPolicy, setAuthPolicy] = useState<AuthPolicyConfig>(DEFAULT_AUTH_POLICY);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMatrix>(DEFAULT_ROLE_PERMISSIONS);
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);

  const effectiveRole = simulatedRole || currentUser.role;

  const canDo = (permission: GranularPermissionKey): boolean => {
    // Admin in real mode has unrestricted rights for collection centres
    if (effectiveRole === 'centre_admin' && !simulatedRole) return true;
    return hasPermission(effectiveRole, permission, rolePermissions);
  };

  const refreshRbacPolicy = async () => {
    if (!currentCentre) return;
    try {
      const data = await api.getRbacPolicy(currentCentre.id);
      if (data.policy) setAuthPolicy(data.policy);
      if (data.rolePermissions) setRolePermissions(data.rolePermissions);
    } catch (err) {
      console.error('Failed to load RBAC policy:', err);
    }
  };

  const updateAuthPolicy = async (policy?: Partial<AuthPolicyConfig>, permissions?: RolePermissionMatrix) => {
    if (!currentCentre) return;
    try {
      const res = await api.updateRbacPolicy(currentCentre.id, { policy, rolePermissions: permissions });
      if (res.success) {
        setAuthPolicy(res.policy);
        setRolePermissions(res.rolePermissions);
        showNotification('Authentication security policy & permissions updated', 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to update authentication policy', 'error');
      throw err;
    }
  };

  const verifySupervisorPin = async (pin: string): Promise<boolean> => {
    if (!currentCentre) return pin === authPolicy.supervisorMasterPin;
    try {
      const res = await api.verifySupervisorPin(currentCentre.id, pin);
      return !!res.valid;
    } catch {
      return pin === authPolicy.supervisorMasterPin;
    }
  };

  const resetStaffCredentials = async (userId: string) => {
    if (!currentCentre) throw new Error('No active centre');
    try {
      const res = await api.resetStaffCredentials(currentCentre.id, userId);
      if (res.success) {
        showNotification(`Temporary credentials generated for ${res.user.name}`, 'success');
        await refreshStaffUsers();
        return res;
      }
      throw new Error('Failed to reset credentials');
    } catch (err: any) {
      showNotification(err.message || 'Failed to reset credentials', 'error');
      throw err;
    }
  };

  const setEmergencyLockdown = async (locked: boolean, reason?: string) => {
    if (!currentCentre) return;
    try {
      const res = await api.setEmergencyLockdown(currentCentre.id, locked, reason);
      if (res.success) {
        setAuthPolicy(res.policy);
        showNotification(res.message, locked ? 'warning' : 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to set emergency lockdown', 'error');
      throw err;
    }
  };

  const refreshStaffUsers = async (): Promise<User[]> => {
    if (!currentCentre) return [];
    try {
      const users = await api.getStaffUsers(currentCentre.id);
      setStaffUsers(users);
      return users;
    } catch (err) {
      console.error('Failed to load staff users:', err);
      return [];
    }
  };

  const updateStaffRole = async (
    userId: string, 
    role: UserRole, 
    details?: { name?: string; email?: string; phone?: string; active?: boolean }
  ) => {
    if (!currentCentre) return;
    try {
      const res = await api.updateStaffUserRole(currentCentre.id, userId, {
        role,
        ...details
      });
      if (res.success) {
        showNotification(res.message || `Role updated to ${role}`, 'success');
        await refreshStaffUsers();
        // If current logged-in user role was updated, reflect immediately
        if (currentUser.id === userId) {
          const newTitle = role === 'centre_admin' ? 'Centre Admin' :
                          role === 'receptionist' ? 'Receptionist' :
                          role === 'phlebotomist' ? 'Phlebotomist' :
                          role === 'dispatch_officer' ? 'Dispatch Officer' : 'Central Lab Coordinator';
          setCurrentUser(prev => ({ ...prev, role, title: newTitle }));
          setSecurityContext({ role });
        }
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to update staff role', 'error');
      throw err;
    }
  };

  const createStaffUser = async (data: {
    name: string;
    username: string;
    role: UserRole;
    email?: string;
    phone?: string;
    password?: string;
  }): Promise<User> => {
    if (!currentCentre) throw new Error('No active collection centre selected');
    try {
      const res = await api.createStaffUser(currentCentre.id, data);
      if (res.success && res.user) {
        showNotification(`Staff member ${res.user.name} onboarded with role "${res.user.role}"`, 'success');
        await refreshStaffUsers();
        return res.user;
      }
      throw new Error('Failed to create staff member');
    } catch (err: any) {
      showNotification(err.message || 'Failed to onboard staff member', 'error');
      throw err;
    }
  };

  const toggleStaffStatus = async (userId: string) => {
    if (!currentCentre) return;
    try {
      const res = await api.toggleStaffUserStatus(currentCentre.id, userId);
      if (res.success) {
        showNotification(res.message, 'info');
        await refreshStaffUsers();
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to change staff account status', 'error');
      throw err;
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const clearNotification = () => setNotification(null);

  const openCreateCentreModal = () => setIsCreateCentreModalOpen(true);
  const closeCreateCentreModal = () => setIsCreateCentreModalOpen(false);

  const refreshCentres = async (): Promise<Centre[]> => {
    try {
      const data = await api.getContext();
      setCentres(data.centres);
      setTenantId(data.tenantId);
      return data.centres;
    } catch (err) {
      console.error('Failed to refresh centres:', err);
      return [];
    }
  };

  const loadInitial = async () => {
    try {
      const data = await api.getContext();
      setCentres(data.centres);
      setTenantId(data.tenantId);

      // Check for persisted session in localStorage
      const savedSession = localStorage.getItem('diagnostic_franchise_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          const matchedCentre = data.centres.find(c => c.id === parsed.centreId);
          if (matchedCentre && parsed.user) {
            setCurrentCentre(matchedCentre);
            setCurrentUser(parsed.user);
            setIsAuthenticated(true);
            setSecurityContext({
              tenantId: data.tenantId,
              centreId: matchedCentre.id,
              role: parsed.user.role,
              userId: parsed.user.id,
              userName: parsed.user.name
            });
            return;
          }
        } catch (e) {
          localStorage.removeItem('diagnostic_franchise_session');
        }
      }

      // If no saved session, default to initial centre in demo mode
      if (data.centres.length > 0) {
        const firstCentre = data.centres[0];
        setCurrentCentre(firstCentre);
        setSecurityContext({
          tenantId: data.tenantId,
          centreId: firstCentre.id,
          role: defaultUser.role,
          userId: defaultUser.id,
          userName: defaultUser.name
        });
        // Start unauthenticated so the user experiences the separate Login Screen per request
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Failed to load context:', err);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const login = async (centreId: string, username: string, password?: string): Promise<boolean> => {
    try {
      const res = await api.login({ centreId, username, password });
      if (res.success && res.user && res.centre) {
        setCurrentCentre(res.centre);
        const title = res.user.role === 'centre_admin' ? 'Centre Admin' : 
                      res.user.role === 'receptionist' ? 'Receptionist' : 'Phlebotomist';
        const userObj = {
          id: res.user.id,
          name: res.user.name,
          role: res.user.role,
          centreId: res.centre.id,
          title,
          username: res.user.username
        };
        setCurrentUser(userObj);
        setIsAuthenticated(true);
        setSecurityContext({
          tenantId: res.centre.tenantId || tenantId,
          centreId: res.centre.id,
          role: res.user.role,
          userId: res.user.id,
          userName: res.user.name
        });
        localStorage.setItem('diagnostic_franchise_session', JSON.stringify({
          centreId: res.centre.id,
          user: userObj
        }));
        showNotification(`Authorized successfully! Welcome to ${res.centre.name} (${res.centre.code})`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      showNotification(err.message || 'Authorization failed. Check credentials.', 'error');
      throw err;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('diagnostic_franchise_session');
    showNotification('Logged out from collection centre workspace.', 'info');
  };

  const createCentre = async (data: any): Promise<{ centre: Centre; users: User[] }> => {
    try {
      const result = await api.createCentre(data);
      if (result.success) {
        await refreshCentres();
        showNotification(`Collection Centre "${result.centre.name}" (${result.centre.code}) onboarded successfully!`, 'success');
        return { centre: result.centre, users: result.users };
      }
      throw new Error(result.message || 'Failed to create centre');
    } catch (err: any) {
      showNotification(err.message || 'Error creating collection centre', 'error');
      throw err;
    }
  };

  const selectCentre = (centreId: string) => {
    const found = centres.find(c => c.id === centreId);
    if (found) {
      setCurrentCentre(found);
      const updatedUser = {
        ...currentUser,
        centreId: found.id
      };
      setCurrentUser(updatedUser);
      setSecurityContext({
        centreId: found.id,
        role: currentUser.role,
        userId: currentUser.id,
        userName: currentUser.name
      });
      localStorage.setItem('diagnostic_franchise_session', JSON.stringify({
        centreId: found.id,
        user: updatedUser
      }));
      showNotification(`Switched active workspace to ${found.name} (${found.code})`, 'info');
    }
  };

  const selectRole = (role: UserRole) => {
    let name = 'Rahul Verma';
    let id = 'usr-rec-01';
    let title = 'Front Desk Receptionist';
    let username = 'rec_metro';

    if (role === 'centre_admin') {
      name = 'Dr. Sunita Sharma';
      id = 'usr-admin-01';
      title = 'Centre Admin / Lab In-Charge';
      username = 'admin_metro';
    } else if (role === 'phlebotomist') {
      name = 'Vikram Patil';
      id = 'usr-phleb-01';
      title = 'Phlebotomist';
      username = 'phleb_metro';
    } else if (role === 'dispatch_officer') {
      name = 'Anil Gaikwad';
      id = 'usr-disp-01';
      title = 'Logistics & Dispatch Officer';
      username = 'dispatch_metro';
    } else if (role === 'lab_coordinator') {
      name = 'Pooja Iyer';
      id = 'usr-coord-01';
      title = 'Central Lab Coordinator';
      username = 'coord_metro';
    }

    const newUser = { id, name, role, centreId: currentCentre?.id || 'centre-01', title, username };
    setCurrentUser(newUser);
    setSecurityContext({
      role,
      userId: id,
      userName: name
    });
    localStorage.setItem('diagnostic_franchise_session', JSON.stringify({
      centreId: currentCentre?.id || 'centre-01',
      user: newUser
    }));
    showNotification(`Role switched to ${title}`, 'info');
  };

  const selectUser = (user: User) => {
    const title = user.role === 'centre_admin' ? 'Centre Admin / Lab In-Charge' :
                  user.role === 'receptionist' ? 'Front Desk Receptionist' :
                  user.role === 'phlebotomist' ? 'Phlebotomist' :
                  user.role === 'dispatch_officer' ? 'Logistics & Dispatch Officer' : 'Central Lab Coordinator';

    const newUser = {
      id: user.id,
      name: user.name,
      role: user.role,
      centreId: user.centreId,
      title,
      username: user.username
    };

    setCurrentUser(newUser);
    setSecurityContext({
      role: user.role,
      userId: user.id,
      userName: user.name,
      centreId: user.centreId
    });
    localStorage.setItem('diagnostic_franchise_session', JSON.stringify({
      centreId: user.centreId,
      user: newUser
    }));
    showNotification(`Switched active staff to ${user.name} (${title})`, 'info');
  };

  useEffect(() => {
    if (currentCentre?.id) {
      refreshStaffUsers();
      refreshRbacPolicy();
    }
  }, [currentCentre?.id]);

  const reloadCentreData = async () => {
    if (!currentCentre) return;
    try {
      const data = await api.getContext();
      setCentres(data.centres);
      const updated = data.centres.find(c => c.id === currentCentre.id);
      if (updated) setCurrentCentre(updated);
      await refreshStaffUsers();
      await refreshRbacPolicy();
    } catch (err) {
      console.error('Failed to reload centre data', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        centres,
        currentCentre,
        currentUser,
        tenantId,
        login,
        logout,
        createCentre,
        selectCentre,
        selectRole,
        selectUser,
        staffUsers,
        refreshStaffUsers,
        updateStaffRole,
        createStaffUser,
        toggleStaffStatus,
        resetStaffCredentials,
        reloadCentreData,
        refreshCentres,
        notification,
        showNotification,
        clearNotification,
        isCreateCentreModalOpen,
        openCreateCentreModal,
        closeCreateCentreModal,

        // RBAC & Authentication Policy Engine
        authPolicy,
        rolePermissions,
        simulatedRole,
        setSimulatedRole,
        effectiveRole,
        canDo,
        updateAuthPolicy,
        verifySupervisorPin,
        setEmergencyLockdown,
        refreshRbacPolicy
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

