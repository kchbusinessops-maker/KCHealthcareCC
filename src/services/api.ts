import { 
  Centre, User, Patient, DiagnosticTest, Order, 
  SampleTube, DispatchBatch, LabReport, WalletTransaction, AuditLog, DashboardMetrics, UserRole, PaymentMode,
  CentralLabExtractPackage, AuthPolicyConfig, RolePermissionMatrix 
} from '../types';

let currentTenantId = 'apex-parent-lab';
let currentCentreId = 'centre-01';
let currentUserRole: UserRole = 'receptionist';
let currentUserId = 'usr-rec-01';
let currentUserName = 'Rahul Verma';

export function setSecurityContext(params: {
  tenantId?: string;
  centreId?: string;
  role?: UserRole;
  userId?: string;
  userName?: string;
}) {
  if (params.tenantId) currentTenantId = params.tenantId;
  if (params.centreId) currentCentreId = params.centreId;
  if (params.role) currentUserRole = params.role;
  if (params.userId) currentUserId = params.userId;
  if (params.userName) currentUserName = params.userName;
}

export function getSecurityContext() {
  return {
    tenantId: currentTenantId,
    centreId: currentCentreId,
    role: currentUserRole,
    userId: currentUserId,
    userName: currentUserName
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('x-tenant-id', currentTenantId);
  headers.set('x-centre-id', currentCentreId);
  headers.set('x-user-role', currentUserRole);
  headers.set('x-user-id', currentUserId);
  headers.set('x-user-name', currentUserName);

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errJson = await res.json();
      errorMsg = errJson.error || errorMsg;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth / Context & Centre Login
  login: (credentials: { centreId: string; username: string; password?: string }) =>
    request<{ success: boolean; user: User; centre: Centre; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getCentres: () => request<Centre[]>('/api/centres'),

  getCentreUsers: (centreId: string) => request<User[]>(`/api/centres/${centreId}/users`),

  createCentre: (centreData: {
    name: string;
    code: string;
    parentLabName?: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    franchiseCommercialRate?: number;
    walletBalance?: number;
    walletCreditLimit?: number;
    walletLowBalanceThreshold?: number;
    adminUser?: {
      name: string;
      username: string;
      password?: string;
      email?: string;
      phone?: string;
    };
    staffUsers?: Array<{
      name: string;
      username: string;
      password?: string;
      role: UserRole;
      email?: string;
      phone?: string;
    }>;
  }) =>
    request<{ success: boolean; message: string; centre: Centre; users: User[] }>('/api/centres', {
      method: 'POST',
      body: JSON.stringify(centreData)
    }),

  getContext: () => request<{
    tenantId: string;
    centres: Centre[];
    activeCentre: Centre;
    defaultUsers: Array<{ id: string; name: string; role: UserRole; centreId: string; title: string }>;
  }>('/api/auth/context'),

  // Staff & Role Management
  getStaffUsers: (centreId: string) =>
    request<User[]>(`/api/centres/${centreId}/users`),

  createStaffUser: (centreId: string, data: { name: string; username: string; role: UserRole; email?: string; phone?: string; password?: string }) =>
    request<{ success: boolean; user: User; message: string }>(`/api/centres/${centreId}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateStaffUserRole: (centreId: string, userId: string, data: { role: UserRole; name?: string; email?: string; phone?: string; active?: boolean }) =>
    request<{ success: boolean; user: User; message: string }>(`/api/centres/${centreId}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  toggleStaffUserStatus: (centreId: string, userId: string) =>
    request<{ success: boolean; user: User; message: string }>(`/api/centres/${centreId}/users/${userId}/toggle-status`, {
      method: 'PATCH'
    }),

  resetStaffCredentials: (centreId: string, userId: string) =>
    request<{ success: boolean; message: string; tempPassword: string; tempPin: string; user: User }>(
      `/api/centres/${centreId}/users/${userId}/reset-credentials`,
      { method: 'POST' }
    ),

  getRbacPolicy: (centreId: string) =>
    request<{ policy: AuthPolicyConfig; rolePermissions: RolePermissionMatrix; centres: Centre[] }>(
      `/api/centres/${centreId}/rbac-policy`
    ),

  updateRbacPolicy: (centreId: string, data: { policy?: Partial<AuthPolicyConfig>; rolePermissions?: RolePermissionMatrix }) =>
    request<{ success: boolean; message: string; policy: AuthPolicyConfig; rolePermissions: RolePermissionMatrix }>(
      `/api/centres/${centreId}/rbac-policy`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    ),

  verifySupervisorPin: (centreId: string, pin: string) =>
    request<{ valid: boolean }>(`/api/centres/${centreId}/verify-supervisor-pin`, {
      method: 'POST',
      body: JSON.stringify({ pin })
    }),

  setEmergencyLockdown: (centreId: string, locked: boolean, reason?: string) =>
    request<{ success: boolean; message: string; policy: AuthPolicyConfig }>(
      `/api/centres/${centreId}/emergency-lockdown`,
      {
        method: 'POST',
        body: JSON.stringify({ locked, reason })
      }
    ),

  // Dashboard
  getDashboard: (centreId: string) => request<DashboardMetrics>(`/api/centres/${centreId}/dashboard`),

  // Patients
  getPatients: (centreId: string, search?: string) => 
    request<Patient[]>(`/api/centres/${centreId}/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  
  checkDuplicatePatient: (centreId: string, mobile: string, name: string) =>
    request<{ isDuplicate: boolean; duplicatePatient: Patient | null }>(`/api/centres/${centreId}/patients/check-duplicate`, {
      method: 'POST',
      body: JSON.stringify({ mobile, name })
    }),

  createPatient: (centreId: string, patient: Omit<Patient, 'id' | 'uhid' | 'centreId' | 'tenantId' | 'createdAt'>) =>
    request<Patient>(`/api/centres/${centreId}/patients`, {
      method: 'POST',
      body: JSON.stringify(patient)
    }),

  updatePatient: (centreId: string, patientId: string, updates: Partial<Patient>) =>
    request<Patient>(`/api/centres/${centreId}/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  // Tests
  getTests: (centreId: string) => request<DiagnosticTest[]>(`/api/centres/${centreId}/tests`),

  // Orders
  getOrders: (centreId: string, search?: string) =>
    request<Order[]>(`/api/centres/${centreId}/orders${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getOrder: (centreId: string, id: string) =>
    request<{ order: Order; tubes: SampleTube[] }>(`/api/centres/${centreId}/orders/${id}`),

  createOrder: (centreId: string, data: {
    patientId: string;
    items: Array<{ testId: string; testCode: string; testName: string; sampleType: string; requiredTube: any; price: number }>;
    discountPercentage: number;
    paymentMode: PaymentMode;
    amountPaid: number;
    idempotencyKey?: string;
  }) => request<{ order: Order; tubes: SampleTube[]; invoiceNumber: string }>(`/api/centres/${centreId}/orders`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Tubes & Phlebotomy
  getTubes: (centreId: string, status?: string) =>
    request<SampleTube[]>(`/api/centres/${centreId}/tubes${status ? `?status=${encodeURIComponent(status)}` : ''}`),

  lookupTube: (centreId: string, code: string) =>
    request<SampleTube>(`/api/centres/${centreId}/tubes/lookup`, {
      method: 'POST',
      body: JSON.stringify({ code })
    }),

  collectSample: (centreId: string, tubeId: string, notes?: string) =>
    request<SampleTube>(`/api/centres/${centreId}/tubes/collect`, {
      method: 'POST',
      body: JSON.stringify({ tubeId, notes })
    }),

  markTubeReady: (centreId: string, tubeId: string) =>
    request<SampleTube>(`/api/centres/${centreId}/tubes/mark-ready`, {
      method: 'POST',
      body: JSON.stringify({ tubeId })
    }),

  // Dispatches
  getDispatches: (centreId: string) =>
    request<DispatchBatch[]>(`/api/centres/${centreId}/dispatches`),

  createDispatchBatch: (centreId: string, data: {
    transporterName: string;
    courierContact: string;
    trackingNumber: string;
    temperatureCategory: 'Ambient' | '2-8°C (Cold Pack)' | 'Frozen (-20°C)';
    sealNumber: string;
    notes?: string;
  }) => request<DispatchBatch>(`/api/centres/${centreId}/dispatches`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  addTubeToDispatch: (centreId: string, batchId: string, tubePayload: string) =>
    request<{ batch: DispatchBatch; tube: SampleTube }>(`/api/centres/${centreId}/dispatches/${batchId}/add-tube`, {
      method: 'POST',
      body: JSON.stringify({ tubePayload })
    }),

  sendDispatch: (centreId: string, batchId: string) =>
    request<DispatchBatch>(`/api/centres/${centreId}/dispatches/${batchId}/send`, {
      method: 'POST'
    }),

  // Mock LIMS Adapter Sync
  syncLims: (centreId: string, batchId?: string) =>
    request<{ success: boolean; message: string; synced: number; reportsCreated: number }>(`/api/centres/${centreId}/lims/sync`, {
      method: 'POST',
      body: JSON.stringify({ batchId })
    }),

  // Reports
  getReports: (centreId: string, search?: string) =>
    request<LabReport[]>(`/api/centres/${centreId}/reports${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(reps => 
      reps.map(r => ({
        ...r,
        testName: r.testName || (r.testNames && r.testNames[0]) || 'Diagnostic Profile',
        approvedDate: r.approvedDate || r.reportDate || r.verifiedAt || new Date().toISOString(),
        deliveryStatus: r.deliveryStatus || 'ready',
        results: r.results || r.findings || []
      }))
    ),

  getReport: (centreId: string, id: string) =>
    request<LabReport>(`/api/centres/${centreId}/reports/${id}`).then(r => ({
      ...r,
      testName: r.testName || (r.testNames && r.testNames[0]) || 'Diagnostic Profile',
      approvedDate: r.approvedDate || r.reportDate || r.verifiedAt || new Date().toISOString(),
      deliveryStatus: r.deliveryStatus || 'ready',
      results: r.results || r.findings || []
    })),

  markReportDelivered: async (centreId: string, id: string) => {
    return request<LabReport>(`/api/centres/${centreId}/reports/${id}`).then(r => ({
      ...r,
      testName: r.testName || (r.testNames && r.testNames[0]) || 'Diagnostic Profile',
      approvedDate: r.approvedDate || r.reportDate || r.verifiedAt || new Date().toISOString(),
      deliveryStatus: 'delivered' as const,
      results: r.results || r.findings || []
    }));
  },

  // Central Reference Laboratory Data Extraction
  getCentralLabExtract: (centreId: string, options?: { batchId?: string; status?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams();
    if (options?.batchId) params.append('batchId', options.batchId);
    if (options?.status) params.append('status', options.status);
    if (options?.dateFrom) params.append('dateFrom', options.dateFrom);
    if (options?.dateTo) params.append('dateTo', options.dateTo);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<CentralLabExtractPackage>(`/api/centres/${centreId}/central-lab-extract${queryString}`);
  },

  // Mock LIMS Compatibility
  triggerLimsSync: async (centreId: string, batchId?: string) => {
    const res = await request<{ success: boolean; message: string; synced: number; reportsCreated: number }>(`/api/centres/${centreId}/lims/sync`, {
      method: 'POST',
      body: JSON.stringify({ batchId })
    });
    return { success: res.success, reportsGenerated: res.reportsCreated };
  },

  // Wallet
  getWallet: (centreId: string) =>
    request<{ centre: Centre; transactions: WalletTransaction[]; lowBalanceWarning: boolean }>(`/api/centres/${centreId}/wallet`),

  getWalletTransactions: async (centreId: string) => {
    const w = await request<{ centre: Centre; transactions: WalletTransaction[]; lowBalanceWarning: boolean }>(`/api/centres/${centreId}/wallet`);
    return w.transactions.map(t => ({
      ...t,
      orderId: t.orderId || (t.referenceId.startsWith('ord') || t.referenceId.startsWith('ORD') ? t.referenceId : undefined)
    }));
  },

  rechargeWallet: (centreId: string, amountOrData: number | { amount: number; paymentReference: string; paymentMode: string }, paymentRef?: string) => {
    let payload: { amount: number; paymentReference: string; paymentMode: string };
    if (typeof amountOrData === 'number') {
      payload = {
        amount: amountOrData,
        paymentReference: paymentRef || `TOPUP-${Date.now().toString().slice(-6)}`,
        paymentMode: 'upi'
      };
    } else {
      payload = amountOrData;
    }
    return request<{ centre: Centre; transaction: WalletTransaction }>(`/api/centres/${centreId}/wallet/recharge`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Universal fast search
  universalSearch: (centreId: string, q: string) =>
    request<{ patients: Patient[]; orders: Order[]; tubes: SampleTube[]; reports: LabReport[] }>(
      `/api/centres/${centreId}/search?q=${encodeURIComponent(q)}`
    ),

  // Analytics
  getAnalytics: (centreId: string) =>
    request<{
      dailySales: Array<{ date: string; orders: number; revenue: number; b2bFees: number }>;
      testSales: Array<{ code: string; name: string; count: number; totalRevenue: number }>;
      doctorReferrals: Array<{ doctor: string; patientCount: number; totalValue: number }>;
      totalPatientsCount: number;
      totalOrdersCount: number;
      totalRevenue: number;
      dispatchesSummary: DispatchBatch[];
    }>(`/api/centres/${centreId}/analytics`),

  // Audit Logs
  getAuditLogs: (centreId: string) =>
    request<AuditLog[]>(`/api/centres/${centreId}/audit-logs`)
};
