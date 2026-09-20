export type UserRole = 
  | 'centre_admin' 
  | 'receptionist' 
  | 'phlebotomist' 
  | 'dispatch_officer' 
  | 'lab_coordinator';

export type PaymentMode = 'cash' | 'upi' | 'card' | 'wallet' | 'netbanking';
export type PaymentStatus = 'paid' | 'partial' | 'pending';

export type SampleStatus = 
  | 'pending_collection'
  | 'collected'
  | 'verified'
  | 'ready_for_dispatch'
  | 'dispatched'
  | 'submitted_to_lims'
  | 'processing'
  | 'report_ready'
  | 'completed';

export type TubeType = 
  | 'EDTA (Lavender)'
  | 'Serum Gel (Yellow/Gold)'
  | 'Plain Clot (Red)'
  | 'Sodium Fluoride (Grey)'
  | 'Sodium Citrate (Light Blue)'
  | 'Heparin (Green)'
  | 'Urine Container (Yellow Top)'
  | 'Stool Container';

export interface Centre {
  id: string;
  code: string;
  name: string;
  tenantId: string;
  parentLabName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  franchiseCommercialRate: number; // e.g., 0.70 means 70% B2B deduction from wallet for central lab processing
  walletBalance: number;
  walletCreditLimit: number;
  walletLowBalanceThreshold: number;
  active: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  centreId: string;
  tenantId: string;
  email: string;
  phone: string;
  active: boolean;
  password?: string;
  pin?: string;
  employeeId?: string;
  workstation?: string;
  lastLogin?: string;
  tempPasswordIssued?: boolean;
}

export type GranularPermissionKey = 
  | 'canViewDashboard'
  | 'canManagePatients'
  | 'canCreateOrders'
  | 'canCollectSamples'
  | 'canDispatchBatches'
  | 'canExtractCentralLabData'
  | 'canViewReports'
  | 'canManageWallet'
  | 'canAssignRoles'
  | 'canViewAnalytics'
  | 'canOverridePricing'
  | 'canCancelOrders'
  | 'canReopenColdBoxes'
  | 'canReprintTubeLabels'
  | 'canBypassFasting';

export type RolePermissionMatrix = Record<UserRole, Record<GranularPermissionKey, boolean>>;

export interface AuthPolicyConfig {
  requirePinForPhlebotomy: boolean;
  requireSupervisorPinForDiscount: boolean;
  requireSupervisorPinForCancel: boolean;
  requireSupervisorPinForReopenBox: boolean;
  requireSupervisorPinForLabelReprint: boolean;
  requireSupervisorPinForCentralExtract: boolean;
  requireFastingConfirmation: boolean;
  sessionTimeoutMinutes: number;
  enforcementMode: 'strict' | 'supervised' | 'audit_only';
  activePreset: 'custom' | 'iso_15189' | 'high_throughput' | 'standard';
  supervisorMasterPin: string;
  allowedWorkstations?: string[];
  emergencyLockdown: boolean;
  emergencyLockdownReason?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Patient {
  id: string;
  uhid: string;
  centreId: string;
  tenantId: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  age: number;
  mobile: string;
  email?: string;
  address: string;
  referringDoctor: string;
  referralSource: string;
  createdAt: string;
  registrationDate?: string;
}

export interface DiagnosticTest {
  id: string;
  code: string;
  name: string;
  category: 'Hematology' | 'Biochemistry' | 'Clinical Pathology' | 'Serology' | 'Microbiology' | 'Endocrinology' | 'Profile' | 'Package';
  type: 'individual' | 'profile' | 'package';
  includedSubTests?: string[];
  sampleType: string;
  requiredTube: TubeType;
  tubeColorCode: string;
  tatHours: number;
  fastingRequirement: string;
  centrePrice: number;
  mrp: number;
  enabledForCentre: boolean;
  specimenVolume: string;
}

export interface OrderItem {
  testId: string;
  testCode: string;
  testName: string;
  sampleType: string;
  requiredTube: TubeType;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  centreId: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientAge: number;
  patientGender: string;
  patientMobile: string;
  referringDoctor: string;
  referralSource: string;
  items: OrderItem[];
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  netAmount: number;
  amountPaid: number;
  balanceAmount: number;
  balanceDue?: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  b2bFranchiseFee: number;
  walletDeducted: boolean;
  sampleStatus: SampleStatus;
  createdAt: string;
  createdByName: string;
}

export interface SampleTube {
  id: string;
  tubeNumber: string;
  sampleId: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientAge: number;
  patientGender: string;
  centreId: string;
  tenantId: string;
  tubeType: TubeType;
  tubeColorCode: string;
  sampleType: string;
  tests: { code: string; name: string }[];
  status: SampleStatus;
  qrPayload: string;
  barcodePayload: string;
  collectionTime?: string;
  collectionDate?: string;
  createdAt?: string;
  collectedBy?: string;
  phlebotomistNotes?: string;
  fastingRequired?: boolean;
  dispatchBatchId?: string;
  limsTrackingId?: string;
}

export interface DispatchBatch {
  id: string;
  batchNumber: string;
  centreId: string;
  tenantId: string;
  createdDate: string;
  dispatchedDate?: string;
  status: 'draft' | 'closed' | 'in_transit' | 'received_at_lims';
  transporterName: string;
  courierContact: string;
  trackingNumber: string;
  temperatureCategory: 'Ambient' | '2-8°C (Cold Pack)' | 'Frozen (-20°C)';
  sealNumber: string;
  tubeIds: string[];
  totalTubes: number;
  notes?: string;
  submittedToLimsAt?: string;
}

export interface TestResultFinding {
  parameter: string;
  value: string;
  unit: string;
  referenceRange?: string;
  referenceInterval?: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
}

export interface LabReport {
  id: string;
  reportNumber: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientAge: number;
  patientGender: string;
  centreId: string;
  tenantId: string;
  testNames: string[];
  testName?: string;
  reportDate: string;
  approvedDate?: string;
  status: 'pending' | 'processing' | 'ready';
  deliveryStatus?: 'pending' | 'ready' | 'delivered';
  pathologistName: string;
  findings: TestResultFinding[];
  results?: TestResultFinding[];
  clinicalSummary: string;
  verifiedAt?: string;
  downloadUrl?: string;
}

export interface WalletTransaction {
  id: string;
  centreId: string;
  tenantId: string;
  type: 'credit_recharge' | 'debit_b2b_order' | 'reversal' | 'adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string; // e.g. orderId or recharge payment ref
  orderId?: string;
  description: string;
  timestamp: string;
  idempotencyKey?: string;
}

export interface AuditLog {
  id: string;
  centreId: string;
  tenantId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  ip?: string;
}

export interface DashboardMetrics {
  todayPatients: number;
  todayOrders: number;
  todayTests: number;
  todayCollection: number;
  walletBalance: number;
  walletCreditLimit: number;
  walletLowBalance: boolean;
  samplesPending: number;
  samplesCollected: number;
  samplesReadyForDispatch: number;
  samplesDispatched: number;
  reportsReady: number;
  reportsPending: number;
}

export interface CentralLabExtractRecord {
  tubeId: string;
  tubeNumber: string;
  barcodePayload: string;
  qrPayload: string;
  tubeType: string;
  tubeColorCode: string;
  sampleType: string;
  targetVolume: string;
  collectionTime: string;
  collectedBy: string;
  phlebotomistNotes?: string;
  storageCondition: string;
  patientId: string;
  patientUhid: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientMobile: string;
  patientEmail?: string;
  fastingStatus: string;
  clinicalHistory?: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  doctorName?: string;
  priority: 'routine' | 'stat';
  tests: Array<{
    code: string;
    name: string;
    category?: string;
    specimenType?: string;
  }>;
  dispatchBatchId?: string;
  dispatchBatchNumber?: string;
  dispatchTime?: string;
  transporterName?: string;
  temperatureCategory?: string;
  sealNumber?: string;
  accessionStatus: 'collected' | 'ready_for_dispatch' | 'dispatched' | 'in_transit' | 'received';
}

export interface CentralLabExtractPackage {
  centre: Centre;
  extractedAt: string;
  summary: {
    totalPatients: number;
    totalOrders: number;
    totalTubes: number;
    totalTestsRequested: number;
    tubesByVacutainer: Record<string, number>;
    coldChainCount: number;
    ambientCount: number;
    frozenCount: number;
  };
  filtersApplied: {
    batchId?: string;
    statusFilter?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  records: CentralLabExtractRecord[];
  dispatches?: DispatchBatch[];
}

