import { UserRole, GranularPermissionKey, RolePermissionMatrix, AuthPolicyConfig } from '../types';

export interface RoleDefinition {
  role: UserRole;
  title: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  avatarBg: string;
  description: string;
  keyDuties: string[];
  permissions: Record<GranularPermissionKey, boolean>;
}

export interface PermissionMeta {
  key: GranularPermissionKey;
  label: string;
  category: 'Front Desk & Intake' | 'Clinical & Phlebotomy' | 'Logistics & Dispatch' | 'Laboratory & LIMS' | 'Admin & Security';
  description: string;
  riskLevel: 'standard' | 'elevated' | 'high' | 'critical';
}

export const PERMISSION_CATALOG: PermissionMeta[] = [
  // Front Desk & Intake
  {
    key: 'canViewDashboard',
    label: 'View Operational Dashboard',
    category: 'Front Desk & Intake',
    description: 'Access patient counts, today tests, sample collection stats, and operational overview.',
    riskLevel: 'standard'
  },
  {
    key: 'canManagePatients',
    label: 'Patient Demographics & Registry',
    category: 'Front Desk & Intake',
    description: 'Register new walk-in patients, update demographics, search UHID records, and check duplicate profiles.',
    riskLevel: 'standard'
  },
  {
    key: 'canCreateOrders',
    label: 'Create Test Requisitions & Billing',
    category: 'Front Desk & Intake',
    description: 'Book test profiles, collect Cash/UPI payments, print GST invoices, and queue samples for collection.',
    riskLevel: 'standard'
  },
  {
    key: 'canOverridePricing',
    label: 'Apply Commercial Discounts / Waivers',
    category: 'Front Desk & Intake',
    description: 'Apply percentage discounts, corporate concessions, or pricing waivers on diagnostic packages.',
    riskLevel: 'elevated'
  },
  {
    key: 'canCancelOrders',
    label: 'Cancel Confirmed Orders & Refund',
    category: 'Front Desk & Intake',
    description: 'Cancel billed orders and issue commercial credit reversal back to patient/centre ledger.',
    riskLevel: 'high'
  },

  // Clinical & Phlebotomy
  {
    key: 'canCollectSamples',
    label: 'Specimen Collection & Barcoding',
    category: 'Clinical & Phlebotomy',
    description: 'Perform venipuncture, verify sample types, scan tube barcodes/QRs, and mark collection time.',
    riskLevel: 'standard'
  },
  {
    key: 'canReprintTubeLabels',
    label: 'Reprint Vacutainer Barcode Labels',
    category: 'Clinical & Phlebotomy',
    description: 'Reprint duplicate barcode/QR specimen labels (sensitive action to prevent tube misattribution).',
    riskLevel: 'elevated'
  },
  {
    key: 'canBypassFasting',
    label: 'Bypass Mandatory Fasting Protocol',
    category: 'Clinical & Phlebotomy',
    description: 'Authorize non-fasting blood draws on metabolic/glucose/lipid profiles with clinical justification.',
    riskLevel: 'elevated'
  },

  // Logistics & Dispatch
  {
    key: 'canDispatchBatches',
    label: 'Cold-Chain Courier Batching',
    category: 'Logistics & Dispatch',
    description: 'Assemble specimens into temperature-controlled cooler boxes (2-8°C / Ambient / Frozen) and courier handovers.',
    riskLevel: 'standard'
  },
  {
    key: 'canReopenColdBoxes',
    label: 'Break Security Seal & Reopen Box',
    category: 'Logistics & Dispatch',
    description: 'Break tamper-evident barcode seal on an assembled dispatch box to add or remove urgent specimens.',
    riskLevel: 'high'
  },

  // Laboratory & LIMS
  {
    key: 'canExtractCentralLabData',
    label: 'Central Reference Lab Data Extract',
    category: 'Laboratory & LIMS',
    description: 'Export structured CSV and JSON accession payloads for Central Lab analyzer import and courier manifests.',
    riskLevel: 'elevated'
  },
  {
    key: 'canViewReports',
    label: 'Diagnostic Reports Access & Delivery',
    category: 'Laboratory & LIMS',
    description: 'View authenticated pathologist reports, verify normal/critical values, and print patient delivery copies.',
    riskLevel: 'standard'
  },

  // Admin & Security
  {
    key: 'canManageWallet',
    label: 'Manage B2B Franchise Deposit Wallet',
    category: 'Admin & Security',
    description: 'View real-time B2B ledger, initiate wallet recharges, track deduction logs, and monitor credit limits.',
    riskLevel: 'high'
  },
  {
    key: 'canAssignRoles',
    label: 'Staff Onboarding & Role Assignment',
    category: 'Admin & Security',
    description: 'Create staff accounts, reassign RBAC roles, modify security policies, and reset authentication credentials.',
    riskLevel: 'critical'
  },
  {
    key: 'canViewAnalytics',
    label: 'Executive Analytics & Commercial Reports',
    category: 'Admin & Security',
    description: 'Access test revenue breakdown, daily commercial sales, referring doctor analytics, and turnaround time metrics.',
    riskLevel: 'elevated'
  }
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMatrix = {
  centre_admin: {
    canViewDashboard: true,
    canManagePatients: true,
    canCreateOrders: true,
    canCollectSamples: true,
    canDispatchBatches: true,
    canExtractCentralLabData: true,
    canViewReports: true,
    canManageWallet: true,
    canAssignRoles: true,
    canViewAnalytics: true,
    canOverridePricing: true,
    canCancelOrders: true,
    canReopenColdBoxes: true,
    canReprintTubeLabels: true,
    canBypassFasting: true
  },
  receptionist: {
    canViewDashboard: true,
    canManagePatients: true,
    canCreateOrders: true,
    canCollectSamples: false,
    canDispatchBatches: false,
    canExtractCentralLabData: false,
    canViewReports: true,
    canManageWallet: false,
    canAssignRoles: false,
    canViewAnalytics: false,
    canOverridePricing: true,
    canCancelOrders: false,
    canReopenColdBoxes: false,
    canReprintTubeLabels: false,
    canBypassFasting: false
  },
  phlebotomist: {
    canViewDashboard: true,
    canManagePatients: true,
    canCreateOrders: false,
    canCollectSamples: true,
    canDispatchBatches: false,
    canExtractCentralLabData: false,
    canViewReports: true,
    canManageWallet: false,
    canAssignRoles: false,
    canViewAnalytics: false,
    canOverridePricing: false,
    canCancelOrders: false,
    canReopenColdBoxes: false,
    canReprintTubeLabels: true,
    canBypassFasting: false
  },
  dispatch_officer: {
    canViewDashboard: true,
    canManagePatients: false,
    canCreateOrders: false,
    canCollectSamples: false,
    canDispatchBatches: true,
    canExtractCentralLabData: true,
    canViewReports: false,
    canManageWallet: false,
    canAssignRoles: false,
    canViewAnalytics: false,
    canOverridePricing: false,
    canCancelOrders: false,
    canReopenColdBoxes: false,
    canReprintTubeLabels: false,
    canBypassFasting: false
  },
  lab_coordinator: {
    canViewDashboard: true,
    canManagePatients: true,
    canCreateOrders: false,
    canCollectSamples: true,
    canDispatchBatches: true,
    canExtractCentralLabData: true,
    canViewReports: true,
    canManageWallet: false,
    canAssignRoles: false,
    canViewAnalytics: false,
    canOverridePricing: false,
    canCancelOrders: false,
    canReopenColdBoxes: true,
    canReprintTubeLabels: true,
    canBypassFasting: true
  }
};

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  centre_admin: {
    role: 'centre_admin',
    title: 'Centre Admin / Lab In-Charge',
    badgeLabel: 'Admin / Manager',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    avatarBg: 'bg-purple-600',
    description: 'Executive supervisory authority over staff roles, franchise deposit wallet, commercial rates, clinical bookings, and Central Reference Lab data transfers.',
    keyDuties: [
      'Assign & manage staff roles & credentials',
      'Oversee prepaid wallet balance & recharge approval',
      'Authorize & export Central Lab test accession datasets',
      'Audit all centre transactions & pre-analytical workflows'
    ],
    permissions: DEFAULT_ROLE_PERMISSIONS.centre_admin
  },
  receptionist: {
    role: 'receptionist',
    title: 'Front Desk & Billing Executive',
    badgeLabel: 'Reception & Billing',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    avatarBg: 'bg-blue-600',
    description: 'Front-desk patient registration, test catalogue selection, payment collection (Cash/UPI), invoice printing, and delivered report distribution.',
    keyDuties: [
      'Register new walk-in patients & assign UHIDs',
      'Book diagnostic tests and packages',
      'Collect payments & generate GST invoices',
      'Deliver completed lab reports to patients'
    ],
    permissions: DEFAULT_ROLE_PERMISSIONS.receptionist
  },
  phlebotomist: {
    role: 'phlebotomist',
    title: 'Phlebotomist / Specimen Technician',
    badgeLabel: 'Phlebotomist',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    avatarBg: 'bg-emerald-600',
    description: 'Biological specimen collection, tube QR/barcode label printing, patient fasting verification, and pre-analytical sample integrity checks.',
    keyDuties: [
      'Perform sterile venipuncture & sample draws',
      'Print & verify vacutainer color-coded barcodes',
      'Verify fasting duration & clinical draw notes',
      'Handover verified tubes to the dispatch room'
    ],
    permissions: DEFAULT_ROLE_PERMISSIONS.phlebotomist
  },
  dispatch_officer: {
    role: 'dispatch_officer',
    title: 'Logistics & Courier Dispatch Officer',
    badgeLabel: 'Logistics / Courier',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    avatarBg: 'bg-amber-600',
    description: 'Sample packaging into temperature-controlled cooler boxes (2-8°C / Ambient / Frozen), tamper-proof security seals, and courier manifests.',
    keyDuties: [
      'Assemble cold chain courier dispatch batches',
      'Inspect temperature holding boxes & security seals',
      'Generate & print courier handover manifests',
      'Export specimen accession data files for courier pouch'
    ],
    permissions: DEFAULT_ROLE_PERMISSIONS.dispatch_officer
  },
  lab_coordinator: {
    role: 'lab_coordinator',
    title: 'Central Lab Coordinator',
    badgeLabel: 'Lab Liaison / QA',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    avatarBg: 'bg-indigo-600',
    description: 'Direct liaison with the Central Reference Laboratory: validates specimen compliance, reconciles test codes, and generates import-ready data extracts.',
    keyDuties: [
      'Export Central Lab Accessioning Data (CSV & JSON)',
      'Audit pre-analytical specimen compliance for testing',
      'Coordinate urgent STAT and emergency sample intake',
      'Track specimen transit and accessioning receipt status'
    ],
    permissions: DEFAULT_ROLE_PERMISSIONS.lab_coordinator
  }
};

export const DEFAULT_AUTH_POLICY: AuthPolicyConfig = {
  requirePinForPhlebotomy: true,
  requireSupervisorPinForDiscount: true,
  requireSupervisorPinForCancel: true,
  requireSupervisorPinForReopenBox: true,
  requireSupervisorPinForLabelReprint: true,
  requireSupervisorPinForCentralExtract: false,
  requireFastingConfirmation: true,
  sessionTimeoutMinutes: 30,
  enforcementMode: 'strict',
  activePreset: 'standard',
  supervisorMasterPin: '8899',
  allowedWorkstations: ['Front Desk 1', 'Billing Desk 2', 'Phlebotomy Bay A', 'Dispatch Bay', 'Manager Cabin'],
  emergencyLockdown: false,
  emergencyLockdownReason: ''
};

export const PRESET_POLICIES: Record<string, {
  name: string;
  description: string;
  policy: Partial<AuthPolicyConfig>;
  permissions: Partial<RolePermissionMatrix>;
}> = {
  standard: {
    name: 'Standard Diagnostic Franchise',
    description: 'Recommended baseline balancing operational speed with mandatory verification checkpoints.',
    policy: {
      requirePinForPhlebotomy: true,
      requireSupervisorPinForDiscount: true,
      requireSupervisorPinForCancel: true,
      requireSupervisorPinForReopenBox: true,
      requireSupervisorPinForLabelReprint: true,
      requireSupervisorPinForCentralExtract: false,
      sessionTimeoutMinutes: 30,
      enforcementMode: 'strict'
    },
    permissions: DEFAULT_ROLE_PERMISSIONS
  },
  iso_15189: {
    name: 'ISO 15189 / NABL Accreditation',
    description: 'High compliance medical laboratory mode with dual-signoff on all pre-analytical modifications.',
    policy: {
      requirePinForPhlebotomy: true,
      requireSupervisorPinForDiscount: true,
      requireSupervisorPinForCancel: true,
      requireSupervisorPinForReopenBox: true,
      requireSupervisorPinForLabelReprint: true,
      requireSupervisorPinForCentralExtract: true,
      sessionTimeoutMinutes: 15,
      enforcementMode: 'strict'
    },
    permissions: {
      ...DEFAULT_ROLE_PERMISSIONS,
      receptionist: {
        ...DEFAULT_ROLE_PERMISSIONS.receptionist,
        canOverridePricing: false,
        canCancelOrders: false
      },
      phlebotomist: {
        ...DEFAULT_ROLE_PERMISSIONS.phlebotomist,
        canReprintTubeLabels: false,
        canBypassFasting: false
      }
    }
  },
  high_throughput: {
    name: 'High-Throughput Metro Rush',
    description: 'Optimized for high footfall peak hours; delegates rapid reprint and discount privileges directly to counter staff.',
    policy: {
      requirePinForPhlebotomy: false,
      requireSupervisorPinForDiscount: false,
      requireSupervisorPinForCancel: true,
      requireSupervisorPinForReopenBox: false,
      requireSupervisorPinForLabelReprint: false,
      requireSupervisorPinForCentralExtract: false,
      sessionTimeoutMinutes: 60,
      enforcementMode: 'supervised'
    },
    permissions: {
      ...DEFAULT_ROLE_PERMISSIONS,
      receptionist: {
        ...DEFAULT_ROLE_PERMISSIONS.receptionist,
        canOverridePricing: true
      },
      phlebotomist: {
        ...DEFAULT_ROLE_PERMISSIONS.phlebotomist,
        canReprintTubeLabels: true,
        canBypassFasting: true
      }
    }
  }
};

export function hasPermission(
  role: UserRole | undefined,
  permission: GranularPermissionKey,
  customMatrix?: RolePermissionMatrix
): boolean {
  if (!role) return false;
  // Admin always has all rights for collection centres
  if (role === 'centre_admin') return true;

  if (customMatrix && customMatrix[role] && customMatrix[role][permission] !== undefined) {
    return !!customMatrix[role][permission];
  }

  const def = ROLE_DEFINITIONS[role];
  if (!def) return false;
  return !!def.permissions[permission];
}

export function getRoleBadge(role: UserRole) {
  const def = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS['receptionist'];
  return {
    label: def.badgeLabel,
    title: def.title,
    badgeBg: def.badgeBg,
    badgeText: def.badgeText,
    badgeBorder: def.badgeBorder,
    avatarBg: def.avatarBg
  };
}
