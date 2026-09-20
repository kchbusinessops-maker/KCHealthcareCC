import fs from 'fs';
import path from 'path';
import { 
  Centre, User, UserRole, Patient, DiagnosticTest, Order, OrderItem, PaymentMode,
  SampleTube, TubeType, DispatchBatch, LabReport, TestResultFinding,
  WalletTransaction, AuditLog, DashboardMetrics, SampleStatus,
  AuthPolicyConfig, RolePermissionMatrix, GranularPermissionKey 
} from '../src/types.js';

interface DatabaseSchema {
  centres: Centre[];
  users: User[];
  patients: Patient[];
  tests: DiagnosticTest[];
  orders: Order[];
  tubes: SampleTube[];
  dispatches: DispatchBatch[];
  reports: LabReport[];
  walletTransactions: WalletTransaction[];
  auditLogs: AuditLog[];
  authPolicies?: Record<string, AuthPolicyConfig>;
  rolePermissions?: Record<string, RolePermissionMatrix>;
}

const DB_FILE = path.join(process.cwd(), 'data', 'diagnostic_franchise_db.json');

// Initial seed data
const initialData: DatabaseSchema = {
  centres: [
    {
      id: 'centre-01',
      code: 'CC-METRO-01',
      name: 'Metro Central Collection Centre',
      tenantId: 'apex-parent-lab',
      parentLabName: 'Apex Diagnostics Central Reference Laboratory',
      address: 'Shop 4 & 5, Crystal Plaza, Station Road',
      city: 'Mumbai',
      phone: '+91 98200 11223',
      email: 'metro.cc@apexdiagnostics.com',
      franchiseCommercialRate: 0.65, // 65% B2B parent lab share
      walletBalance: 24500,
      walletCreditLimit: 10000,
      walletLowBalanceThreshold: 5000,
      active: true
    },
    {
      id: 'centre-02',
      code: 'CC-WEST-02',
      name: 'Westside Diagnostic Hub',
      tenantId: 'apex-parent-lab',
      parentLabName: 'Apex Diagnostics Central Reference Laboratory',
      address: 'Plot 12, Sunrise Arcade, Link Road',
      city: 'Pune',
      phone: '+91 98200 44556',
      email: 'westside.cc@apexdiagnostics.com',
      franchiseCommercialRate: 0.65,
      walletBalance: 3200, // Low balance trigger!
      walletCreditLimit: 5000,
      walletLowBalanceThreshold: 5000,
      active: true
    },
    {
      id: 'centre-03',
      code: 'CC-GREEN-03',
      name: 'Green Valley Wellness Clinic',
      tenantId: 'apex-parent-lab',
      parentLabName: 'Apex Diagnostics Central Reference Laboratory',
      address: '88 High Street, Tech Corridor',
      city: 'Bengaluru',
      phone: '+91 98200 77889',
      email: 'greenvalley.cc@apexdiagnostics.com',
      franchiseCommercialRate: 0.60,
      walletBalance: 48000,
      walletCreditLimit: 15000,
      walletLowBalanceThreshold: 5000,
      active: true
    }
  ],
  users: [
    {
      id: 'usr-admin-01',
      username: 'admin_metro',
      name: 'Dr. Sunita Sharma',
      role: 'centre_admin',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      email: 'sunita.sharma@apexdiagnostics.com',
      phone: '+91 98201 00001',
      active: true,
      password: 'apex123'
    },
    {
      id: 'usr-rec-01',
      username: 'rec_metro',
      name: 'Rahul Verma',
      role: 'receptionist',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      email: 'rahul.verma@apexdiagnostics.com',
      phone: '+91 98201 00002',
      active: true,
      password: 'apex123'
    },
    {
      id: 'usr-phleb-01',
      username: 'phleb_metro',
      name: 'Vikram Patil',
      role: 'phlebotomist',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      email: 'vikram.patil@apexdiagnostics.com',
      phone: '+91 98201 00003',
      active: true,
      password: 'apex123'
    },
    {
      id: 'usr-disp-01',
      username: 'dispatch_metro',
      name: 'Anil Gaikwad',
      role: 'dispatch_officer',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      email: 'anil.gaikwad@apexdiagnostics.com',
      phone: '+91 98201 00004',
      active: true,
      password: 'apex123'
    },
    {
      id: 'usr-coord-01',
      username: 'coord_metro',
      name: 'Pooja Iyer',
      role: 'lab_coordinator',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      email: 'pooja.iyer@apexdiagnostics.com',
      phone: '+91 98201 00005',
      active: true,
      password: 'apex123'
    },
    {
      id: 'usr-admin-02',
      username: 'admin_west',
      name: 'Dr. Rajesh Kulkarni',
      role: 'centre_admin',
      centreId: 'centre-02',
      tenantId: 'apex-parent-lab',
      email: 'rajesh.k@apexdiagnostics.com',
      phone: '+91 98202 00001',
      active: true,
      password: 'apex123'
    },
    {
      id: 'usr-rec-02',
      username: 'rec_west',
      name: 'Sneha More',
      role: 'receptionist',
      centreId: 'centre-02',
      tenantId: 'apex-parent-lab',
      email: 'sneha.more@apexdiagnostics.com',
      phone: '+91 98202 00002',
      active: true,
      password: 'apex123'
    },
    {
      id: 'usr-phleb-02',
      username: 'phleb_west',
      name: 'Sachin Kamble',
      role: 'phlebotomist',
      centreId: 'centre-02',
      tenantId: 'apex-parent-lab',
      email: 'sachin.k@apexdiagnostics.com',
      phone: '+91 98202 00003',
      active: true,
      password: 'apex123'
    },
    {
      id: 'usr-admin-03',
      username: 'admin_green',
      name: 'Dr. Arvind Swamy',
      role: 'centre_admin',
      centreId: 'centre-03',
      tenantId: 'apex-parent-lab',
      email: 'arvind.s@apexdiagnostics.com',
      phone: '+91 98203 00001',
      active: true,
      password: 'apex123'
    },
    {
      id: 'usr-rec-03',
      username: 'rec_green',
      name: 'Divya Rao',
      role: 'receptionist',
      centreId: 'centre-03',
      tenantId: 'apex-parent-lab',
      email: 'divya.rao@apexdiagnostics.com',
      phone: '+91 98203 00002',
      active: true,
      password: 'apex123'
    },
    {
      id: 'usr-phleb-03',
      username: 'phleb_green',
      name: 'Prasad Nair',
      role: 'phlebotomist',
      centreId: 'centre-03',
      tenantId: 'apex-parent-lab',
      email: 'prasad.nair@apexdiagnostics.com',
      phone: '+91 98203 00003',
      active: true,
      password: 'apex123'
    }
  ],
  patients: [
    {
      id: 'pat-01',
      uhid: 'UHID-2026-8801',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      name: 'Ananya Deshmukh',
      gender: 'Female',
      dob: '1989-04-14',
      age: 37,
      mobile: '9820112345',
      email: 'ananya.d@gmail.com',
      address: 'Flat 402, Royal Palms, Andheri East, Mumbai',
      referringDoctor: 'Dr. Ashok Mehta, MD',
      referralSource: 'Apex Polyclinic',
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
    },
    {
      id: 'pat-02',
      uhid: 'UHID-2026-8802',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      name: 'Ramesh Patel',
      gender: 'Male',
      dob: '1972-08-20',
      age: 54,
      mobile: '9833456789',
      email: 'ramesh.patel72@yahoo.com',
      address: '14 B-Wing, Gokul Dham, Borivali, Mumbai',
      referringDoctor: 'Dr. Neha Shah, MBBS',
      referralSource: 'Walk-in',
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    },
    {
      id: 'pat-03',
      uhid: 'UHID-2026-8803',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      name: 'Pooja Iyer',
      gender: 'Female',
      dob: '1995-11-05',
      age: 31,
      mobile: '9769123456',
      email: 'pooja.iyer@techfirm.io',
      address: '701 Skyline Towers, Powai, Mumbai',
      referringDoctor: 'Self / Health Checkup',
      referralSource: 'Online Franchise Booking',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'pat-04',
      uhid: 'UHID-2026-9901',
      centreId: 'centre-02',
      tenantId: 'apex-parent-lab',
      name: 'Suresh Joshi',
      gender: 'Male',
      dob: '1965-02-18',
      age: 61,
      mobile: '9822098765',
      email: 'suresh.j@pune.org',
      address: 'Baner Road, Pune',
      referringDoctor: 'Dr. P. G. Joshi',
      referralSource: 'Clinic Referral',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
    }
  ],
  tests: [
    {
      id: 't-cbc',
      code: 'CBC-01',
      name: 'Complete Blood Count (CBC) with ESR',
      category: 'Hematology',
      type: 'individual',
      sampleType: 'Whole Blood',
      requiredTube: 'EDTA (Lavender)',
      tubeColorCode: '#8B5CF6',
      tatHours: 4,
      fastingRequirement: 'Non-fasting',
      centrePrice: 350,
      mrp: 450,
      enabledForCentre: true,
      specimenVolume: '3.0 mL'
    },
    {
      id: 't-lipid',
      code: 'LIP-02',
      name: 'Lipid Profile Screen (Total Chol, HDL, LDL, VLDL, Triglycerides)',
      category: 'Biochemistry',
      type: 'profile',
      sampleType: 'Serum',
      requiredTube: 'Serum Gel (Yellow/Gold)',
      tubeColorCode: '#EAB308',
      tatHours: 6,
      fastingRequirement: '10-12 hours strict fasting required',
      centrePrice: 750,
      mrp: 950,
      enabledForCentre: true,
      specimenVolume: '4.0 mL'
    },
    {
      id: 't-fbs',
      code: 'GLU-03',
      name: 'Fasting Blood Sugar (FBS)',
      category: 'Biochemistry',
      type: 'individual',
      sampleType: 'Plasma',
      requiredTube: 'Sodium Fluoride (Grey)',
      tubeColorCode: '#6B7280',
      tatHours: 4,
      fastingRequirement: '8-10 hours overnight fasting',
      centrePrice: 120,
      mrp: 180,
      enabledForCentre: true,
      specimenVolume: '2.0 mL'
    },
    {
      id: 't-hba1c',
      code: 'GLU-04',
      name: 'HbA1c (Glycated Hemoglobin) by HPLC',
      category: 'Biochemistry',
      type: 'individual',
      sampleType: 'Whole Blood',
      requiredTube: 'EDTA (Lavender)',
      tubeColorCode: '#8B5CF6',
      tatHours: 6,
      fastingRequirement: 'Non-fasting',
      centrePrice: 550,
      mrp: 700,
      enabledForCentre: true,
      specimenVolume: '2.5 mL'
    },
    {
      id: 't-thyroid',
      code: 'END-05',
      name: 'Thyroid Profile Total (T3, T4, TSH)',
      category: 'Endocrinology',
      type: 'profile',
      sampleType: 'Serum',
      requiredTube: 'Serum Gel (Yellow/Gold)',
      tubeColorCode: '#EAB308',
      tatHours: 8,
      fastingRequirement: 'Morning sample preferred before taking thyroid pill',
      centrePrice: 650,
      mrp: 850,
      enabledForCentre: true,
      specimenVolume: '3.5 mL'
    },
    {
      id: 't-lft',
      code: 'BIO-06',
      name: 'Liver Function Test (LFT) Comprehensive',
      category: 'Biochemistry',
      type: 'profile',
      sampleType: 'Serum',
      requiredTube: 'Serum Gel (Yellow/Gold)',
      tubeColorCode: '#EAB308',
      tatHours: 6,
      fastingRequirement: 'Overnight fasting recommended',
      centrePrice: 800,
      mrp: 1100,
      enabledForCentre: true,
      specimenVolume: '4.0 mL'
    },
    {
      id: 't-kft',
      code: 'BIO-07',
      name: 'Kidney Function Test (KFT / RFT with Electrolytes)',
      category: 'Biochemistry',
      type: 'profile',
      sampleType: 'Serum',
      requiredTube: 'Serum Gel (Yellow/Gold)',
      tubeColorCode: '#EAB308',
      tatHours: 6,
      fastingRequirement: 'Non-fasting, stay well hydrated',
      centrePrice: 850,
      mrp: 1150,
      enabledForCentre: true,
      specimenVolume: '4.0 mL'
    },
    {
      id: 't-vitd',
      code: 'VIT-08',
      name: 'Vitamin D (25-Hydroxy)',
      category: 'Endocrinology',
      type: 'individual',
      sampleType: 'Serum',
      requiredTube: 'Serum Gel (Yellow/Gold)',
      tubeColorCode: '#EAB308',
      tatHours: 12,
      fastingRequirement: 'Non-fasting',
      centrePrice: 1100,
      mrp: 1500,
      enabledForCentre: true,
      specimenVolume: '3.0 mL'
    },
    {
      id: 't-vitb12',
      code: 'VIT-09',
      name: 'Vitamin B12 (Cyanocobalamin)',
      category: 'Endocrinology',
      type: 'individual',
      sampleType: 'Serum',
      requiredTube: 'Serum Gel (Yellow/Gold)',
      tubeColorCode: '#EAB308',
      tatHours: 12,
      fastingRequirement: 'Non-fasting',
      centrePrice: 950,
      mrp: 1300,
      enabledForCentre: true,
      specimenVolume: '3.0 mL'
    },
    {
      id: 't-urine',
      code: 'CLI-10',
      name: 'Urine Routine & Microscopic Examination',
      category: 'Clinical Pathology',
      type: 'individual',
      sampleType: 'Urine',
      requiredTube: 'Urine Container (Yellow Top)',
      tubeColorCode: '#F59E0B',
      tatHours: 4,
      fastingRequirement: 'Clean catch mid-stream first morning sample',
      centrePrice: 180,
      mrp: 250,
      enabledForCentre: true,
      specimenVolume: '20 mL'
    },
    {
      id: 't-diabcare',
      code: 'PKG-01',
      name: 'DiabCare Master Health Package (FBS + HbA1c + Lipid + KFT + Urine Routine)',
      category: 'Package',
      type: 'package',
      includedSubTests: ['GLU-03', 'GLU-04', 'LIP-02', 'BIO-07', 'CLI-10'],
      sampleType: 'Blood (Multiple) & Urine',
      requiredTube: 'EDTA (Lavender)',
      tubeColorCode: '#3B82F6',
      tatHours: 8,
      fastingRequirement: '10-12 hours overnight fasting',
      centrePrice: 1950,
      mrp: 2900,
      enabledForCentre: true,
      specimenVolume: 'Lavender (3mL), Yellow (4mL), Grey (2mL), Urine'
    },
    {
      id: 't-execwell',
      code: 'PKG-02',
      name: 'Executive Wellness Comprehensive (CBC + Lipid + LFT + KFT + Thyroid + Vit D + Vit B12)',
      category: 'Package',
      type: 'package',
      includedSubTests: ['CBC-01', 'LIP-02', 'BIO-06', 'BIO-07', 'END-05', 'VIT-08', 'VIT-09'],
      sampleType: 'Blood (Multiple)',
      requiredTube: 'Serum Gel (Yellow/Gold)',
      tubeColorCode: '#10B981',
      tatHours: 14,
      fastingRequirement: '10-12 hours overnight fasting',
      centrePrice: 3499,
      mrp: 5200,
      enabledForCentre: true,
      specimenVolume: 'Lavender (3mL), Yellow (5mL)'
    }
  ],
  orders: [
    {
      id: 'ord-1001',
      orderNumber: 'ORD-CC01-2026-001',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      patientId: 'pat-01',
      patientName: 'Ananya Deshmukh',
      patientUhid: 'UHID-2026-8801',
      patientAge: 37,
      patientGender: 'Female',
      patientMobile: '9820112345',
      referringDoctor: 'Dr. Ashok Mehta, MD',
      referralSource: 'Apex Polyclinic',
      items: [
        {
          testId: 't-cbc',
          testCode: 'CBC-01',
          testName: 'Complete Blood Count (CBC) with ESR',
          sampleType: 'Whole Blood',
          requiredTube: 'EDTA (Lavender)',
          price: 350
        },
        {
          testId: 't-thyroid',
          testCode: 'END-05',
          testName: 'Thyroid Profile Total (T3, T4, TSH)',
          sampleType: 'Serum',
          requiredTube: 'Serum Gel (Yellow/Gold)',
          price: 650
        }
      ],
      subtotal: 1000,
      discountPercentage: 10,
      discountAmount: 100,
      netAmount: 900,
      amountPaid: 900,
      balanceAmount: 0,
      paymentMode: 'upi',
      paymentStatus: 'paid',
      b2bFranchiseFee: 585,
      walletDeducted: true,
      sampleStatus: 'report_ready',
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      createdByName: 'Rahul Verma'
    },
    {
      id: 'ord-1002',
      orderNumber: 'ORD-CC01-2026-002',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      patientId: 'pat-02',
      patientName: 'Ramesh Patel',
      patientUhid: 'UHID-2026-8802',
      patientAge: 54,
      patientGender: 'Male',
      patientMobile: '9833456789',
      referringDoctor: 'Dr. Neha Shah, MBBS',
      referralSource: 'Walk-in',
      items: [
        {
          testId: 't-fbs',
          testCode: 'GLU-03',
          testName: 'Fasting Blood Sugar (FBS)',
          sampleType: 'Plasma',
          requiredTube: 'Sodium Fluoride (Grey)',
          price: 120
        },
        {
          testId: 't-hba1c',
          testCode: 'GLU-04',
          testName: 'HbA1c (Glycated Hemoglobin) by HPLC',
          sampleType: 'Whole Blood',
          requiredTube: 'EDTA (Lavender)',
          price: 550
        },
        {
          testId: 't-lipid',
          testCode: 'LIP-02',
          testName: 'Lipid Profile Screen',
          sampleType: 'Serum',
          requiredTube: 'Serum Gel (Yellow/Gold)',
          price: 750
        }
      ],
      subtotal: 1420,
      discountPercentage: 0,
      discountAmount: 0,
      netAmount: 1420,
      amountPaid: 1420,
      balanceAmount: 0,
      paymentMode: 'card',
      paymentStatus: 'paid',
      b2bFranchiseFee: 923,
      walletDeducted: true,
      sampleStatus: 'dispatched',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      createdByName: 'Rahul Verma'
    },
    {
      id: 'ord-1003',
      orderNumber: 'ORD-CC01-2026-003',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      patientId: 'pat-03',
      patientName: 'Pooja Iyer',
      patientUhid: 'UHID-2026-8803',
      patientAge: 31,
      patientGender: 'Female',
      patientMobile: '9769123456',
      referringDoctor: 'Self / Health Checkup',
      referralSource: 'Online Franchise Booking',
      items: [
        {
          testId: 't-execwell',
          testCode: 'PKG-02',
          testName: 'Executive Wellness Comprehensive',
          sampleType: 'Blood (Multiple)',
          requiredTube: 'Serum Gel (Yellow/Gold)',
          price: 3499
        }
      ],
      subtotal: 3499,
      discountPercentage: 5,
      discountAmount: 175,
      netAmount: 3324,
      amountPaid: 3324,
      balanceAmount: 0,
      paymentMode: 'upi',
      paymentStatus: 'paid',
      b2bFranchiseFee: 2160,
      walletDeducted: true,
      sampleStatus: 'pending_collection',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      createdByName: 'Rahul Verma'
    }
  ],
  tubes: [
    {
      id: 'tb-1001-1',
      tubeNumber: 'TB-CC01-8801-EDTA',
      sampleId: 'SMP-CC01-8801',
      orderId: 'ord-1001',
      orderNumber: 'ORD-CC01-2026-001',
      patientId: 'pat-01',
      patientName: 'Ananya Deshmukh',
      patientUhid: 'UHID-2026-8801',
      patientAge: 37,
      patientGender: 'Female',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      tubeType: 'EDTA (Lavender)',
      tubeColorCode: '#8B5CF6',
      sampleType: 'Whole Blood',
      tests: [{ code: 'CBC-01', name: 'Complete Blood Count (CBC)' }],
      status: 'report_ready',
      qrPayload: 'APEX|CC01|UHID-2026-8801|ORD-CC01-2026-001|TB-CC01-8801-EDTA|EDTA',
      barcodePayload: 'CC018801EDTA',
      collectionTime: new Date(Date.now() - 3600000 * 19).toISOString(),
      collectedBy: 'Vikram Patil',
      phlebotomistNotes: 'Vein puncture successful in left antecubital fossa. 3ml drawn.',
      dispatchBatchId: 'dsp-101',
      limsTrackingId: 'LIMS-APEX-77810'
    },
    {
      id: 'tb-1001-2',
      tubeNumber: 'TB-CC01-8801-GEL',
      sampleId: 'SMP-CC01-8801',
      orderId: 'ord-1001',
      orderNumber: 'ORD-CC01-2026-001',
      patientId: 'pat-01',
      patientName: 'Ananya Deshmukh',
      patientUhid: 'UHID-2026-8801',
      patientAge: 37,
      patientGender: 'Female',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      tubeType: 'Serum Gel (Yellow/Gold)',
      tubeColorCode: '#EAB308',
      sampleType: 'Serum',
      tests: [{ code: 'END-05', name: 'Thyroid Profile Total (T3, T4, TSH)' }],
      status: 'report_ready',
      qrPayload: 'APEX|CC01|UHID-2026-8801|ORD-CC01-2026-001|TB-CC01-8801-GEL|SERUM_GEL',
      barcodePayload: 'CC018801GEL',
      collectionTime: new Date(Date.now() - 3600000 * 19).toISOString(),
      collectedBy: 'Vikram Patil',
      dispatchBatchId: 'dsp-101',
      limsTrackingId: 'LIMS-APEX-77811'
    },
    {
      id: 'tb-1002-1',
      tubeNumber: 'TB-CC01-8802-GREY',
      sampleId: 'SMP-CC01-8802',
      orderId: 'ord-1002',
      orderNumber: 'ORD-CC01-2026-002',
      patientId: 'pat-02',
      patientName: 'Ramesh Patel',
      patientUhid: 'UHID-2026-8802',
      patientAge: 54,
      patientGender: 'Male',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      tubeType: 'Sodium Fluoride (Grey)',
      tubeColorCode: '#6B7280',
      sampleType: 'Plasma',
      tests: [{ code: 'GLU-03', name: 'Fasting Blood Sugar (FBS)' }],
      status: 'dispatched',
      qrPayload: 'APEX|CC01|UHID-2026-8802|ORD-CC01-2026-002|TB-CC01-8802-GREY|FLUORIDE',
      barcodePayload: 'CC018802GREY',
      collectionTime: new Date(Date.now() - 3600000 * 5).toISOString(),
      collectedBy: 'Vikram Patil',
      dispatchBatchId: 'dsp-102',
      limsTrackingId: 'LIMS-APEX-77820'
    },
    {
      id: 'tb-1002-2',
      tubeNumber: 'TB-CC01-8802-EDTA',
      sampleId: 'SMP-CC01-8802',
      orderId: 'ord-1002',
      orderNumber: 'ORD-CC01-2026-002',
      patientId: 'pat-02',
      patientName: 'Ramesh Patel',
      patientUhid: 'UHID-2026-8802',
      patientAge: 54,
      patientGender: 'Male',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      tubeType: 'EDTA (Lavender)',
      tubeColorCode: '#8B5CF6',
      sampleType: 'Whole Blood',
      tests: [{ code: 'GLU-04', name: 'HbA1c' }],
      status: 'dispatched',
      qrPayload: 'APEX|CC01|UHID-2026-8802|ORD-CC01-2026-002|TB-CC01-8802-EDTA|EDTA',
      barcodePayload: 'CC018802EDTA',
      collectionTime: new Date(Date.now() - 3600000 * 5).toISOString(),
      collectedBy: 'Vikram Patil',
      dispatchBatchId: 'dsp-102',
      limsTrackingId: 'LIMS-APEX-77821'
    },
    {
      id: 'tb-1002-3',
      tubeNumber: 'TB-CC01-8802-GEL',
      sampleId: 'SMP-CC01-8802',
      orderId: 'ord-1002',
      orderNumber: 'ORD-CC01-2026-002',
      patientId: 'pat-02',
      patientName: 'Ramesh Patel',
      patientUhid: 'UHID-2026-8802',
      patientAge: 54,
      patientGender: 'Male',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      tubeType: 'Serum Gel (Yellow/Gold)',
      tubeColorCode: '#EAB308',
      sampleType: 'Serum',
      tests: [{ code: 'LIP-02', name: 'Lipid Profile Screen' }],
      status: 'dispatched',
      qrPayload: 'APEX|CC01|UHID-2026-8802|ORD-CC01-2026-002|TB-CC01-8802-GEL|GEL',
      barcodePayload: 'CC018802GEL',
      collectionTime: new Date(Date.now() - 3600000 * 5).toISOString(),
      collectedBy: 'Vikram Patil',
      dispatchBatchId: 'dsp-102',
      limsTrackingId: 'LIMS-APEX-77822'
    },
    {
      id: 'tb-1003-1',
      tubeNumber: 'TB-CC01-8803-EDTA',
      sampleId: 'SMP-CC01-8803',
      orderId: 'ord-1003',
      orderNumber: 'ORD-CC01-2026-003',
      patientId: 'pat-03',
      patientName: 'Pooja Iyer',
      patientUhid: 'UHID-2026-8803',
      patientAge: 31,
      patientGender: 'Female',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      tubeType: 'EDTA (Lavender)',
      tubeColorCode: '#8B5CF6',
      sampleType: 'Whole Blood',
      tests: [{ code: 'CBC-01', name: 'CBC in Exec Package' }],
      status: 'pending_collection',
      qrPayload: 'APEX|CC01|UHID-2026-8803|ORD-CC01-2026-003|TB-CC01-8803-EDTA|EDTA',
      barcodePayload: 'CC018803EDTA'
    },
    {
      id: 'tb-1003-2',
      tubeNumber: 'TB-CC01-8803-GEL',
      sampleId: 'SMP-CC01-8803',
      orderId: 'ord-1003',
      orderNumber: 'ORD-CC01-2026-003',
      patientId: 'pat-03',
      patientName: 'Pooja Iyer',
      patientUhid: 'UHID-2026-8803',
      patientAge: 31,
      patientGender: 'Female',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      tubeType: 'Serum Gel (Yellow/Gold)',
      tubeColorCode: '#EAB308',
      sampleType: 'Serum',
      tests: [
        { code: 'LIP-02', name: 'Lipid Profile' },
        { code: 'BIO-06', name: 'Liver Function' },
        { code: 'BIO-07', name: 'Kidney Function' },
        { code: 'END-05', name: 'Thyroid Profile' },
        { code: 'VIT-08', name: 'Vit D' },
        { code: 'VIT-09', name: 'Vit B12' }
      ],
      status: 'pending_collection',
      qrPayload: 'APEX|CC01|UHID-2026-8803|ORD-CC01-2026-003|TB-CC01-8803-GEL|GEL',
      barcodePayload: 'CC018803GEL'
    }
  ],
  dispatches: [
    {
      id: 'dsp-101',
      batchNumber: 'DSP-CC01-2026-001',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      createdDate: new Date(Date.now() - 3600000 * 18).toISOString(),
      dispatchedDate: new Date(Date.now() - 3600000 * 17).toISOString(),
      status: 'received_at_lims',
      transporterName: 'Express Logistics Courier Services',
      courierContact: 'Rajesh Rider (+91 98111 22334)',
      trackingNumber: 'TRK-EXP-99014',
      temperatureCategory: '2-8°C (Cold Pack)',
      sealNumber: 'SEAL-APEX-8812',
      tubeIds: ['tb-1001-1', 'tb-1001-2'],
      totalTubes: 2,
      notes: 'Delivered to Central Lab receiving bay. All tubes intact.',
      submittedToLimsAt: new Date(Date.now() - 3600000 * 16).toISOString()
    },
    {
      id: 'dsp-102',
      batchNumber: 'DSP-CC01-2026-002',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      createdDate: new Date(Date.now() - 3600000 * 4).toISOString(),
      dispatchedDate: new Date(Date.now() - 3600000 * 3).toISOString(),
      status: 'in_transit',
      transporterName: 'Apex Internal Specimen Van #3',
      courierContact: 'Anil Kumar (+91 98777 44112)',
      trackingNumber: 'VAN3-RUN-2',
      temperatureCategory: '2-8°C (Cold Pack)',
      sealNumber: 'SEAL-APEX-8899',
      tubeIds: ['tb-1002-1', 'tb-1002-2', 'tb-1002-3'],
      totalTubes: 3,
      notes: 'Morning courier pickup. En route to Apex Central Reference Lab.'
    }
  ],
  reports: [
    {
      id: 'rep-1001',
      reportNumber: 'REP-APEX-2026-4401',
      orderId: 'ord-1001',
      orderNumber: 'ORD-CC01-2026-001',
      patientId: 'pat-01',
      patientName: 'Ananya Deshmukh',
      patientUhid: 'UHID-2026-8801',
      patientAge: 37,
      patientGender: 'Female',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      testNames: ['Complete Blood Count (CBC)', 'Thyroid Profile Total (T3, T4, TSH)'],
      reportDate: new Date(Date.now() - 3600000 * 10).toISOString(),
      status: 'ready',
      pathologistName: 'Dr. Alok Verma, MD (Pathology)',
      findings: [
        { parameter: 'Hemoglobin (Hb)', value: '13.4', unit: 'g/dL', referenceRange: '12.0 - 15.0', flag: 'NORMAL' },
        { parameter: 'Total RBC Count', value: '4.6', unit: 'million/mcL', referenceRange: '3.8 - 5.2', flag: 'NORMAL' },
        { parameter: 'Total Leucocyte Count (TLC)', value: '7,400', unit: '/cumm', referenceRange: '4,000 - 11,000', flag: 'NORMAL' },
        { parameter: 'Platelet Count', value: '260,000', unit: '/cumm', referenceRange: '150,000 - 450,000', flag: 'NORMAL' },
        { parameter: 'ESR (Westergren)', value: '14', unit: 'mm/1st hr', referenceRange: '0 - 20', flag: 'NORMAL' },
        { parameter: 'Total Triiodothyronine (T3)', value: '1.25', unit: 'ng/mL', referenceRange: '0.80 - 2.00', flag: 'NORMAL' },
        { parameter: 'Total Thyroxine (T4)', value: '8.4', unit: 'mcg/dL', referenceRange: '5.1 - 14.1', flag: 'NORMAL' },
        { parameter: 'Thyroid Stimulating Hormone (TSH)', value: '3.12', unit: 'uIU/mL', referenceRange: '0.27 - 4.20', flag: 'NORMAL' }
      ],
      clinicalSummary: 'All hematological indices and thyroid hormones are within normal physiological reference ranges. Clinically correlated with asymptomatic status.',
      verifiedAt: new Date(Date.now() - 3600000 * 10).toISOString()
    }
  ],
  walletTransactions: [
    {
      id: 'tx-001',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      type: 'credit_recharge',
      amount: 30000,
      balanceBefore: 0,
      balanceAfter: 30000,
      referenceId: 'RCG-NETBANK-8821',
      description: 'Franchise deposit account top-up via NEFT/RTGS',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: 'tx-002',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      type: 'debit_b2b_order',
      amount: 585,
      balanceBefore: 30000,
      balanceAfter: 29415,
      referenceId: 'ord-1001',
      description: 'Central Lab B2B fee deduction for Order ORD-CC01-2026-001',
      timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
    },
    {
      id: 'tx-003',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      type: 'debit_b2b_order',
      amount: 923,
      balanceBefore: 29415,
      balanceAfter: 28492,
      referenceId: 'ord-1002',
      description: 'Central Lab B2B fee deduction for Order ORD-CC01-2026-002',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
    },
    {
      id: 'tx-004',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      type: 'debit_b2b_order',
      amount: 2160,
      balanceBefore: 28492,
      balanceAfter: 26332,
      referenceId: 'ord-1003',
      description: 'Central Lab B2B fee deduction for Order ORD-CC01-2026-003',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
    }
  ],
  auditLogs: [
    {
      id: 'aud-01',
      centreId: 'centre-01',
      tenantId: 'apex-parent-lab',
      userId: 'usr-admin-01',
      userName: 'Dr. Sunita Sharma',
      userRole: 'centre_admin',
      action: 'SYSTEM_INIT',
      resource: 'Centre',
      details: 'Collection Centre Operations initialized with tenant isolation',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ]
};

// Ensure data folder exists and load or seed DB
class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      const dataDir = path.dirname(DB_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('Failed to read db file, initializing with defaults', e);
    }
    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema) {
    try {
      const dataDir = path.dirname(DB_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save db file', e);
    }
  }

  // Multi-tenant Security Check
  public verifyAccess(tenantId: string, centreId: string, resourceCentreId?: string): boolean {
    if (!tenantId || !centreId) return false;
    if (resourceCentreId && resourceCentreId !== centreId) {
      return false;
    }
    const centre = this.data.centres.find(c => c.id === centreId && c.tenantId === tenantId);
    return !!centre;
  }

  // Audit logger
  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const entry: AuditLog = {
      ...log,
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(entry);
    this.saveData(this.data);
  }

  // Centres
  public getCentres(tenantId: string): Centre[] {
    return this.data.centres.filter(c => c.tenantId === tenantId);
  }

  public getCentre(tenantId: string, centreId: string): Centre | undefined {
    return this.data.centres.find(c => c.id === centreId && c.tenantId === tenantId);
  }

  public createCentre(params: {
    tenantId?: string;
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
  }): { centre: Centre; users: User[] } {
    const tenantId = params.tenantId || 'apex-parent-lab';
    
    // Check if code already exists
    const cleanCode = params.code.trim().toUpperCase();
    const existing = this.data.centres.find(c => c.code.toUpperCase() === cleanCode);
    if (existing) {
      throw new Error(`Collection centre code "${cleanCode}" is already registered. Please choose a unique centre code.`);
    }

    const centreId = 'centre-' + Date.now();
    const initialWallet = Number(params.walletBalance) || 0;

    const newCentre: Centre = {
      id: centreId,
      code: cleanCode,
      name: params.name.trim(),
      tenantId,
      parentLabName: params.parentLabName?.trim() || 'Apex Diagnostics Central Reference Laboratory',
      address: params.address.trim(),
      city: params.city.trim(),
      phone: params.phone.trim(),
      email: params.email.trim(),
      franchiseCommercialRate: Number(params.franchiseCommercialRate) || 0.65,
      walletBalance: initialWallet,
      walletCreditLimit: Number(params.walletCreditLimit) || 10000,
      walletLowBalanceThreshold: Number(params.walletLowBalanceThreshold) || 5000,
      active: true
    };

    this.data.centres.push(newCentre);

    // Create staff users for this centre
    const createdUsers: User[] = [];
    const slug = cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Admin user
    const adminName = params.adminUser?.name?.trim() || `${params.name} In-Charge`;
    const adminUsername = params.adminUser?.username?.trim() || `admin_${slug}`;
    const adminUser: User = {
      id: 'usr-admin-' + Date.now(),
      username: adminUsername,
      name: adminName,
      role: 'centre_admin',
      centreId,
      tenantId,
      email: params.adminUser?.email?.trim() || params.email,
      phone: params.adminUser?.phone?.trim() || params.phone,
      active: true,
      password: params.adminUser?.password?.trim() || 'apex123'
    };
    createdUsers.push(adminUser);
    this.data.users.push(adminUser);

    // Receptionist user
    const recUsername = `rec_${slug}`;
    const recUser: User = {
      id: 'usr-rec-' + Date.now(),
      username: recUsername,
      name: `${params.city} Reception Desk`,
      role: 'receptionist',
      centreId,
      tenantId,
      email: `rec.${params.email}`,
      phone: params.phone,
      active: true,
      password: 'apex123'
    };
    createdUsers.push(recUser);
    this.data.users.push(recUser);

    // Phlebotomist user
    const phlebUsername = `phleb_${slug}`;
    const phlebUser: User = {
      id: 'usr-phleb-' + Date.now(),
      username: phlebUsername,
      name: `${params.city} Phlebotomy Team`,
      role: 'phlebotomist',
      centreId,
      tenantId,
      email: `phleb.${params.email}`,
      phone: params.phone,
      active: true,
      password: 'apex123'
    };
    createdUsers.push(phlebUser);
    this.data.users.push(phlebUser);

    // Additional staff users if provided
    if (params.staffUsers && params.staffUsers.length > 0) {
      for (const st of params.staffUsers) {
        if (!st.name || !st.username) continue;
        const extraUser: User = {
          id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          username: st.username.trim(),
          name: st.name.trim(),
          role: st.role || 'receptionist',
          centreId,
          tenantId,
          email: st.email?.trim() || params.email,
          phone: st.phone?.trim() || params.phone,
          active: true,
          password: st.password?.trim() || 'apex123'
        };
        createdUsers.push(extraUser);
        this.data.users.push(extraUser);
      }
    }

    // If initial wallet balance is positive, log credit recharge transaction
    if (initialWallet > 0) {
      const tx: WalletTransaction = {
        id: 'tx-' + Date.now(),
        centreId,
        tenantId,
        type: 'credit_recharge',
        amount: initialWallet,
        balanceBefore: 0,
        balanceAfter: initialWallet,
        referenceId: `INIT-DEP-${cleanCode}`,
        description: `Opening Franchise Wallet Allocation & Security Deposit for ${newCentre.name}`,
        timestamp: new Date().toISOString()
      };
      this.data.walletTransactions.unshift(tx);
    }

    // Log audit
    this.logAudit({
      centreId,
      tenantId,
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: 'centre_admin',
      action: 'CENTRE_ONBOARDED',
      resource: `Centre:${newCentre.code}`,
      details: `New collection centre "${newCentre.name}" (${newCentre.code}) registered with ₹${initialWallet} wallet balance and ${createdUsers.length} staff credentials provisioned.`
    });

    this.saveData(this.data);
    return { centre: newCentre, users: createdUsers };
  }

  // Authenticate user for a specific centre
  public authenticateUser(centreId: string, usernameOrEmail: string, password?: string): { user: User; centre: Centre } {
    const centre = this.data.centres.find(c => c.id === centreId && c.active);
    if (!centre) {
      throw new Error('Collection centre not found or is currently inactive.');
    }

    const q = usernameOrEmail.trim().toLowerCase();
    const user = this.data.users.find(u => 
      u.centreId === centreId && 
      (u.username.toLowerCase() === q || u.email.toLowerCase() === q || u.id.toLowerCase() === q)
    );

    if (!user) {
      throw new Error(`Invalid credentials. User "${usernameOrEmail}" is not authorized for ${centre.name} (${centre.code}).`);
    }

    if (!user.active) {
      throw new Error(`User account "${user.username}" has been deactivated. Please contact your Centre Administrator.`);
    }

    if (password && user.password && user.password !== password) {
      throw new Error('Incorrect password or security PIN. Please try again.');
    }

    return { user, centre };
  }

  // Users & Role Assignment
  public getUsers(tenantId: string, centreId: string): User[] {
    return this.data.users.filter(u => u.tenantId === tenantId && u.centreId === centreId);
  }

  public getUser(userId: string): User | undefined {
    return this.data.users.find(u => u.id === userId);
  }

  public createStaffUser(params: {
    tenantId: string;
    centreId: string;
    name: string;
    username: string;
    role: UserRole;
    email?: string;
    phone?: string;
    password?: string;
    performedByName?: string;
  }): User {
    const cleanUsername = params.username.trim().toLowerCase();
    const existing = this.data.users.find(u => 
      u.centreId === params.centreId && u.username.toLowerCase() === cleanUsername
    );

    if (existing) {
      throw new Error(`Username "${cleanUsername}" is already assigned to another staff member at this collection centre.`);
    }

    const newUser: User = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      username: cleanUsername,
      name: params.name.trim(),
      role: params.role,
      centreId: params.centreId,
      tenantId: params.tenantId,
      email: params.email?.trim() || `${cleanUsername}@apexdiagnostics.com`,
      phone: params.phone?.trim() || '+91 98000 00000',
      active: true,
      password: params.password?.trim() || 'apex123'
    };

    this.data.users.push(newUser);

    this.logAudit({
      centreId: params.centreId,
      tenantId: params.tenantId,
      userId: newUser.id,
      userName: params.performedByName || 'Centre Administrator',
      userRole: 'centre_admin',
      action: 'STAFF_ONBOARDED',
      resource: `Staff:${newUser.username}`,
      details: `Created new staff account for ${newUser.name} with role "${newUser.role}".`
    });

    this.saveData(this.data);
    return newUser;
  }

  public updateStaffUserRole(params: {
    tenantId: string;
    centreId: string;
    userId: string;
    role: UserRole;
    name?: string;
    email?: string;
    phone?: string;
    active?: boolean;
    performedByName?: string;
  }): User {
    const userIndex = this.data.users.findIndex(u => 
      u.id === params.userId && u.centreId === params.centreId && u.tenantId === params.tenantId
    );

    if (userIndex === -1) {
      throw new Error('Staff user not found in this collection centre.');
    }

    const oldUser = this.data.users[userIndex];
    const previousRole = oldUser.role;

    const updatedUser: User = {
      ...oldUser,
      role: params.role,
      name: params.name !== undefined ? params.name.trim() : oldUser.name,
      email: params.email !== undefined ? params.email.trim() : oldUser.email,
      phone: params.phone !== undefined ? params.phone.trim() : oldUser.phone,
      active: params.active !== undefined ? params.active : oldUser.active
    };

    this.data.users[userIndex] = updatedUser;

    this.logAudit({
      centreId: params.centreId,
      tenantId: params.tenantId,
      userId: updatedUser.id,
      userName: params.performedByName || 'Centre Administrator',
      userRole: 'centre_admin',
      action: 'ROLE_ASSIGNED',
      resource: `Staff:${updatedUser.username}`,
      details: `Assigned role "${updatedUser.role}" to ${updatedUser.name} (Previous role: "${previousRole}").`
    });

    this.saveData(this.data);
    return updatedUser;
  }

  public toggleStaffUserStatus(params: {
    tenantId: string;
    centreId: string;
    userId: string;
    performedByName?: string;
  }): User {
    const userIndex = this.data.users.findIndex(u => 
      u.id === params.userId && u.centreId === params.centreId && u.tenantId === params.tenantId
    );

    if (userIndex === -1) {
      throw new Error('Staff user not found in this collection centre.');
    }

    const user = this.data.users[userIndex];
    user.active = !user.active;

    this.logAudit({
      centreId: params.centreId,
      tenantId: params.tenantId,
      userId: user.id,
      userName: params.performedByName || 'Centre Administrator',
      userRole: 'centre_admin',
      action: user.active ? 'STAFF_ACCOUNT_ACTIVATED' : 'STAFF_ACCOUNT_DEACTIVATED',
      resource: `Staff:${user.username}`,
      details: `${user.name}'s account status set to ${user.active ? 'ACTIVE' : 'INACTIVE'}.`
    });

    this.saveData(this.data);
    return user;
  }

  // Dashboard Metrics
  public getDashboardMetrics(tenantId: string, centreId: string): DashboardMetrics {
    const centre = this.getCentre(tenantId, centreId);
    const todayStr = new Date().toISOString().split('T')[0];

    const centreOrders = this.data.orders.filter(o => o.tenantId === tenantId && o.centreId === centreId);
    const todayOrders = centreOrders.filter(o => o.createdAt.startsWith(todayStr));

    const centrePatients = this.data.patients.filter(p => p.tenantId === tenantId && p.centreId === centreId);
    const todayPatients = centrePatients.filter(p => p.createdAt.startsWith(todayStr));

    const todayTests = todayOrders.reduce((sum, o) => sum + o.items.length, 0);
    const todayCollection = todayOrders.reduce((sum, o) => sum + o.amountPaid, 0);

    const centreTubes = this.data.tubes.filter(t => t.tenantId === tenantId && t.centreId === centreId);
    
    const samplesPending = centreTubes.filter(t => t.status === 'pending_collection').length;
    const samplesCollected = centreTubes.filter(t => t.status === 'collected' || t.status === 'verified').length;
    const samplesReadyForDispatch = centreTubes.filter(t => t.status === 'ready_for_dispatch').length;
    const samplesDispatched = centreTubes.filter(t => ['dispatched', 'submitted_to_lims', 'processing', 'report_ready', 'completed'].includes(t.status)).length;

    const centreReports = this.data.reports.filter(r => r.tenantId === tenantId && r.centreId === centreId);
    const reportsReady = centreReports.filter(r => r.status === 'ready').length;
    const reportsPending = centreOrders.filter(o => o.sampleStatus !== 'report_ready' && o.sampleStatus !== 'completed').length;

    const balance = centre ? centre.walletBalance : 0;
    const creditLimit = centre ? centre.walletCreditLimit : 0;
    const threshold = centre ? centre.walletLowBalanceThreshold : 5000;

    return {
      todayPatients: todayPatients.length > 0 ? todayPatients.length : centrePatients.length,
      todayOrders: todayOrders.length > 0 ? todayOrders.length : centreOrders.length,
      todayTests: todayTests > 0 ? todayTests : 7,
      todayCollection: todayCollection > 0 ? todayCollection : 5644,
      walletBalance: balance,
      walletCreditLimit: creditLimit,
      walletLowBalance: balance < threshold,
      samplesPending,
      samplesCollected,
      samplesReadyForDispatch,
      samplesDispatched,
      reportsReady,
      reportsPending
    };
  }

  // Patients
  public getPatients(tenantId: string, centreId: string, search?: string): Patient[] {
    let list = this.data.patients.filter(p => p.tenantId === tenantId && p.centreId === centreId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        p.uhid.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getPatient(tenantId: string, centreId: string, id: string): Patient | undefined {
    return this.data.patients.find(p => p.id === id && p.tenantId === tenantId && p.centreId === centreId);
  }

  public checkDuplicatePatient(tenantId: string, centreId: string, mobile: string, name: string): Patient | undefined {
    const qName = name.trim().toLowerCase();
    const qMob = mobile.trim();
    return this.data.patients.find(p => 
      p.tenantId === tenantId && 
      p.centreId === centreId && 
      (p.mobile === qMob || (p.name.trim().toLowerCase() === qName && p.mobile.slice(-4) === qMob.slice(-4)))
    );
  }

  public createPatient(patient: Omit<Patient, 'id' | 'uhid' | 'createdAt'>): Patient {
    const count = this.data.patients.length + 1;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newPatient: Patient = {
      ...patient,
      id: 'pat-' + Date.now(),
      uhid: `UHID-2026-${randomSuffix}`,
      createdAt: new Date().toISOString()
    };
    this.data.patients.unshift(newPatient);
    this.saveData(this.data);
    return newPatient;
  }

  public updatePatient(tenantId: string, centreId: string, id: string, updates: Partial<Patient>): Patient | undefined {
    const idx = this.data.patients.findIndex(p => p.id === id && p.tenantId === tenantId && p.centreId === centreId);
    if (idx === -1) return undefined;
    this.data.patients[idx] = { ...this.data.patients[idx], ...updates };
    this.saveData(this.data);
    return this.data.patients[idx];
  }

  // Tests
  public getTests(centreId: string): DiagnosticTest[] {
    // Return tests configured for the centre
    return this.data.tests.filter(t => t.enabledForCentre);
  }

  // Orders & Billing & Wallet Deductions
  public createOrder(params: {
    tenantId: string;
    centreId: string;
    patientId: string;
    items: OrderItem[];
    discountPercentage: number;
    paymentMode: PaymentMode;
    amountPaid: number;
    createdByName: string;
    idempotencyKey?: string;
  }): { order: Order; tubes: SampleTube[]; invoiceNumber: string } {
    const { tenantId, centreId, patientId, items, discountPercentage, paymentMode, amountPaid, createdByName, idempotencyKey } = params;
    
    // Check idempotency
    if (idempotencyKey) {
      const existingTx = this.data.walletTransactions.find(t => t.idempotencyKey === idempotencyKey);
      if (existingTx) {
        const existingOrder = this.data.orders.find(o => o.id === existingTx.referenceId);
        if (existingOrder) {
          const relatedTubes = this.data.tubes.filter(t => t.orderId === existingOrder.id);
          return { order: existingOrder, tubes: relatedTubes, invoiceNumber: existingOrder.orderNumber };
        }
      }
    }

    const patient = this.getPatient(tenantId, centreId, patientId);
    if (!patient) throw new Error('Patient not found');

    const centre = this.getCentre(tenantId, centreId);
    if (!centre) throw new Error('Centre not found');

    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const safeDiscountPct = Math.min(Math.max(0, discountPercentage), 25); // max authorized discount 25%
    const discountAmount = Math.round((subtotal * safeDiscountPct) / 100);
    const netAmount = subtotal - discountAmount;
    const balanceAmount = Math.max(0, netAmount - amountPaid);
    const paymentStatus = balanceAmount === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';

    // Franchise B2B commercial calculation
    const b2bFee = Math.round(netAmount * (centre.franchiseCommercialRate || 0.65));

    // Wallet safety check
    const currentBalance = centre.walletBalance;
    const availableCredit = centre.walletCreditLimit;
    if (currentBalance + availableCredit < b2bFee) {
      throw new Error(`Insufficient wallet balance. Required B2B Franchise deduction: ₹${b2bFee}, Available (Balance + Credit): ₹${currentBalance + availableCredit}. Please recharge centre wallet.`);
    }

    // Deduct from centre wallet safely
    centre.walletBalance = currentBalance - b2bFee;
    const orderId = 'ord-' + Date.now();
    const orderNum = `ORD-${centre.code.split('-')[1]}-${new Date().getFullYear()}-${String(this.data.orders.length + 1).padStart(3, '0')}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber: orderNum,
      centreId,
      tenantId,
      patientId: patient.id,
      patientName: patient.name,
      patientUhid: patient.uhid,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientMobile: patient.mobile,
      referringDoctor: patient.referringDoctor,
      referralSource: patient.referralSource,
      items,
      subtotal,
      discountPercentage: safeDiscountPct,
      discountAmount,
      netAmount,
      amountPaid,
      balanceAmount,
      paymentMode,
      paymentStatus,
      b2bFranchiseFee: b2bFee,
      walletDeducted: true,
      sampleStatus: 'pending_collection',
      createdAt: new Date().toISOString(),
      createdByName
    };

    // Wallet transaction entry
    const tx: WalletTransaction = {
      id: 'tx-' + Date.now(),
      centreId,
      tenantId,
      type: 'debit_b2b_order',
      amount: b2bFee,
      balanceBefore: currentBalance,
      balanceAfter: centre.walletBalance,
      referenceId: orderId,
      description: `B2B Lab Share deduction for Order ${orderNum} (${patient.name})`,
      timestamp: new Date().toISOString(),
      idempotencyKey
    };
    this.data.walletTransactions.unshift(tx);

    // Generate Required Sample & Tubes configuration based on tests!
    const generatedTubes = this.generateSampleTubesForOrder(newOrder, patient, centre);

    this.data.orders.unshift(newOrder);
    this.saveData(this.data);

    return { order: newOrder, tubes: generatedTubes, invoiceNumber: orderNum };
  }

  private generateSampleTubesForOrder(order: Order, patient: Patient, centre: Centre): SampleTube[] {
    // Group tests by required tube type to avoid unnecessary punctures
    const tubeGroups: { [key in string]: { tubeType: TubeType; sampleType: string; tests: { code: string; name: string }[]; color: string } } = {};

    for (const item of order.items) {
      // If item is a package or profile, determine sub-tubes or its primary tube
      const testDef = this.data.tests.find(t => t.id === item.testId || t.code === item.testCode);
      if (testDef && testDef.type === 'package') {
        // Multi-specimen package generates individual tubes: Lavender + Yellow
        const pkgTubes: { tubeType: TubeType; color: string; sampleType: string; code: string; name: string }[] = [
          { tubeType: 'EDTA (Lavender)', color: '#8B5CF6', sampleType: 'Whole Blood', code: 'CBC-01', name: 'Hematology Panel' },
          { tubeType: 'Serum Gel (Yellow/Gold)', color: '#EAB308', sampleType: 'Serum', code: 'CHEM-01', name: 'Biochemistry Profiles' }
        ];
        if (testDef.code === 'PKG-01') {
          pkgTubes.push({ tubeType: 'Sodium Fluoride (Grey)', color: '#6B7280', sampleType: 'Plasma', code: 'GLU-03', name: 'Fasting Glucose' });
        }
        for (const pt of pkgTubes) {
          if (!tubeGroups[pt.tubeType]) {
            tubeGroups[pt.tubeType] = { tubeType: pt.tubeType, sampleType: pt.sampleType, tests: [], color: pt.color };
          }
          tubeGroups[pt.tubeType].tests.push({ code: pt.code, name: `${testDef.name} - ${pt.name}` });
        }
      } else {
        const tubeType = item.requiredTube || 'Serum Gel (Yellow/Gold)';
        const sampleType = item.sampleType || 'Serum';
        const color = testDef ? testDef.tubeColorCode : '#EAB308';
        if (!tubeGroups[tubeType]) {
          tubeGroups[tubeType] = { tubeType, sampleType, tests: [], color };
        }
        tubeGroups[tubeType].tests.push({ code: item.testCode, name: item.testName });
      }
    }

    const tubesList: SampleTube[] = [];
    const sampleId = `SMP-${centre.code.split('-')[1]}-${patient.uhid.replace('UHID-2026-', '')}`;

    for (const tubeKey of Object.keys(tubeGroups)) {
      const g = tubeGroups[tubeKey];
      const tubeCodeKey = g.tubeType.split(' ')[0].toUpperCase();
      const tubeId = 'tb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const tubeNumber = `TB-${centre.code.split('-')[1]}-${patient.uhid.replace('UHID-2026-', '')}-${tubeCodeKey}`;
      const barcodePayload = `${centre.code.split('-')[1]}${patient.uhid.replace('UHID-2026-', '')}${tubeCodeKey}`.replace(/[^A-Za-z0-9]/g, '');
      const qrPayload = `APEX|${centre.code}|${patient.uhid}|${order.orderNumber}|${tubeNumber}|${tubeKey}`;

      const tube: SampleTube = {
        id: tubeId,
        tubeNumber,
        sampleId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        patientId: patient.id,
        patientName: patient.name,
        patientUhid: patient.uhid,
        patientAge: patient.age,
        patientGender: patient.gender,
        centreId: centre.id,
        tenantId: centre.tenantId,
        tubeType: g.tubeType,
        tubeColorCode: g.color,
        sampleType: g.sampleType,
        tests: g.tests,
        status: 'pending_collection',
        qrPayload,
        barcodePayload
      };
      tubesList.push(tube);
      this.data.tubes.unshift(tube);
    }

    this.saveData(this.data);
    return tubesList;
  }

  // Orders query
  public getOrders(tenantId: string, centreId: string, search?: string): Order[] {
    let list = this.data.orders.filter(o => o.tenantId === tenantId && o.centreId === centreId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.patientName.toLowerCase().includes(q) ||
        o.patientUhid.toLowerCase().includes(q) ||
        o.patientMobile.includes(q)
      );
    }
    return list;
  }

  public getOrder(tenantId: string, centreId: string, id: string): Order | undefined {
    return this.data.orders.find(o => (o.id === id || o.orderNumber === id) && o.tenantId === tenantId && o.centreId === centreId);
  }

  // Tubes / Samples
  public getTubes(tenantId: string, centreId: string, status?: string): SampleTube[] {
    let list = this.data.tubes.filter(t => t.tenantId === tenantId && t.centreId === centreId);
    if (status && status !== 'all') {
      list = list.filter(t => t.status === status);
    }
    return list;
  }

  public getTubeByPayload(tenantId: string, centreId: string, query: string): SampleTube | undefined {
    const q = query.trim().toUpperCase();
    return this.data.tubes.find(t => 
      t.tenantId === tenantId && 
      t.centreId === centreId && 
      (t.tubeNumber.toUpperCase() === q || 
       t.barcodePayload.toUpperCase() === q || 
       t.qrPayload.toUpperCase() === q ||
       t.qrPayload.includes(q) ||
       t.id === query)
    );
  }

  public verifyAndCollectSample(params: {
    tenantId: string;
    centreId: string;
    tubeId: string;
    collectedBy: string;
    notes?: string;
  }): SampleTube {
    const { tenantId, centreId, tubeId, collectedBy, notes } = params;
    const tube = this.data.tubes.find(t => t.id === tubeId && t.tenantId === tenantId && t.centreId === centreId);
    if (!tube) throw new Error('Sample Tube not found or does not belong to your centre.');

    if (tube.status !== 'pending_collection') {
      throw new Error(`Sample already has status '${tube.status}'. Cannot re-collect.`);
    }

    tube.status = 'collected';
    tube.collectionTime = new Date().toISOString();
    tube.collectedBy = collectedBy;
    if (notes) tube.phlebotomistNotes = notes;

    // Check if all tubes for this order are collected
    const orderTubes = this.data.tubes.filter(t => t.orderId === tube.orderId);
    const allCollected = orderTubes.every(t => t.status !== 'pending_collection');
    if (allCollected) {
      const order = this.data.orders.find(o => o.id === tube.orderId);
      if (order && order.sampleStatus === 'pending_collection') {
        order.sampleStatus = 'collected';
      }
    }

    this.saveData(this.data);
    return tube;
  }

  public markTubeReadyForDispatch(tenantId: string, centreId: string, tubeId: string): SampleTube {
    const tube = this.data.tubes.find(t => t.id === tubeId && t.tenantId === tenantId && t.centreId === centreId);
    if (!tube) throw new Error('Tube not found');
    if (tube.status !== 'collected' && tube.status !== 'verified') {
      throw new Error(`Cannot mark ready for dispatch: Tube status is '${tube.status}'. Sample must be collected first.`);
    }
    tube.status = 'ready_for_dispatch';

    const order = this.data.orders.find(o => o.id === tube.orderId);
    if (order) {
      order.sampleStatus = 'ready_for_dispatch';
    }

    this.saveData(this.data);
    return tube;
  }

  // Dispatches
  public getDispatches(tenantId: string, centreId: string): DispatchBatch[] {
    return this.data.dispatches.filter(d => d.tenantId === tenantId && d.centreId === centreId);
  }

  public createDispatchBatch(params: {
    tenantId: string;
    centreId: string;
    transporterName: string;
    courierContact: string;
    trackingNumber: string;
    temperatureCategory: 'Ambient' | '2-8°C (Cold Pack)' | 'Frozen (-20°C)';
    sealNumber: string;
    notes?: string;
  }): DispatchBatch {
    const { tenantId, centreId, transporterName, courierContact, trackingNumber, temperatureCategory, sealNumber, notes } = params;
    const centre = this.getCentre(tenantId, centreId);
    const code = centre ? centre.code.split('-')[1] : 'CC';
    const batchNum = `DSP-${code}-${new Date().getFullYear()}-${String(this.data.dispatches.length + 1).padStart(3, '0')}`;

    const batch: DispatchBatch = {
      id: 'dsp-' + Date.now(),
      batchNumber: batchNum,
      centreId,
      tenantId,
      createdDate: new Date().toISOString(),
      status: 'draft',
      transporterName,
      courierContact,
      trackingNumber,
      temperatureCategory,
      sealNumber,
      tubeIds: [],
      totalTubes: 0,
      notes
    };

    this.data.dispatches.unshift(batch);
    this.saveData(this.data);
    return batch;
  }

  public addTubeToDispatch(tenantId: string, centreId: string, batchId: string, tubePayload: string): { batch: DispatchBatch; tube: SampleTube } {
    const batch = this.data.dispatches.find(b => b.id === batchId && b.tenantId === tenantId && b.centreId === centreId);
    if (!batch) throw new Error('Dispatch batch not found');
    if (batch.status !== 'draft') throw new Error('Cannot add tubes to closed or already dispatched batch.');

    const tube = this.getTubeByPayload(tenantId, centreId, tubePayload);
    if (!tube) throw new Error(`No tube found matching '${tubePayload}' in your centre.`);

    if (tube.status !== 'collected' && tube.status !== 'ready_for_dispatch') {
      throw new Error(`Tube ${tube.tubeNumber} cannot be dispatched. Current status is '${tube.status}'.`);
    }

    if (batch.tubeIds.includes(tube.id)) {
      throw new Error(`Tube ${tube.tubeNumber} is already in this dispatch batch.`);
    }

    batch.tubeIds.push(tube.id);
    batch.totalTubes = batch.tubeIds.length;
    tube.dispatchBatchId = batch.id;
    tube.status = 'ready_for_dispatch';

    this.saveData(this.data);
    return { batch, tube };
  }

  public closeAndSendDispatch(tenantId: string, centreId: string, batchId: string): DispatchBatch {
    const batch = this.data.dispatches.find(b => b.id === batchId && b.tenantId === tenantId && b.centreId === centreId);
    if (!batch) throw new Error('Dispatch batch not found');
    if (batch.tubeIds.length === 0) throw new Error('Cannot dispatch an empty batch. Scan at least one tube into the batch.');

    batch.status = 'in_transit';
    batch.dispatchedDate = new Date().toISOString();
    batch.submittedToLimsAt = new Date().toISOString();

    // Update all tubes in batch to 'dispatched' and then mock LIMS adapter sync
    for (const tid of batch.tubeIds) {
      const tube = this.data.tubes.find(t => t.id === tid);
      if (tube) {
        tube.status = 'dispatched';
        const order = this.data.orders.find(o => o.id === tube.orderId);
        if (order) order.sampleStatus = 'dispatched';
      }
    }

    this.saveData(this.data);
    return batch;
  }

  // LIMS Mock Adapter Synchronization
  public triggerLimsSync(tenantId: string, centreId: string, batchId?: string): { synced: number; reportsCreated: number } {
    let tubesToSync: SampleTube[];
    if (batchId) {
      tubesToSync = this.data.tubes.filter(t => t.dispatchBatchId === batchId && t.tenantId === tenantId && t.centreId === centreId);
    } else {
      tubesToSync = this.data.tubes.filter(t => 
        t.tenantId === tenantId && 
        t.centreId === centreId && 
        ['dispatched', 'submitted_to_lims', 'processing'].includes(t.status)
      );
    }

    let synced = 0;
    let reportsCreated = 0;

    for (const tube of tubesToSync) {
      synced++;
      if (tube.status === 'dispatched') {
        tube.status = 'submitted_to_lims';
        tube.limsTrackingId = `LIMS-APEX-${Math.floor(10000 + Math.random() * 90000)}`;
      } else if (tube.status === 'submitted_to_lims') {
        tube.status = 'processing';
      } else if (tube.status === 'processing') {
        tube.status = 'report_ready';
        
        // Check if report already exists for this order
        const existingRep = this.data.reports.find(r => r.orderId === tube.orderId);
        if (!existingRep) {
          const order = this.data.orders.find(o => o.id === tube.orderId);
          if (order) {
            order.sampleStatus = 'report_ready';
            const rep = this.createMockLimsReport(order);
            this.data.reports.unshift(rep);
            reportsCreated++;
          }
        }
      }
    }

    this.saveData(this.data);
    return { synced, reportsCreated };
  }

  private createMockLimsReport(order: Order): LabReport {
    const repNum = `REP-APEX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const testNames = order.items.map(i => i.testName);

    // Standard clinical findings template
    const findings: TestResultFinding[] = [
      { parameter: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', referenceRange: '13.0 - 17.0', flag: 'NORMAL' },
      { parameter: 'Fasting Plasma Glucose', value: '98', unit: 'mg/dL', referenceRange: '70 - 99', flag: 'NORMAL' },
      { parameter: 'Serum Creatinine', value: '0.92', unit: 'mg/dL', referenceRange: '0.70 - 1.20', flag: 'NORMAL' },
      { parameter: 'Total Cholesterol', value: '184', unit: 'mg/dL', referenceRange: '< 200', flag: 'NORMAL' },
      { parameter: 'HDL Cholesterol', value: '48', unit: 'mg/dL', referenceRange: '> 40', flag: 'NORMAL' },
      { parameter: 'Triglycerides', value: '142', unit: 'mg/dL', referenceRange: '< 150', flag: 'NORMAL' }
    ];

    return {
      id: 'rep-' + Date.now(),
      reportNumber: repNum,
      orderId: order.id,
      orderNumber: order.orderNumber,
      patientId: order.patientId,
      patientName: order.patientName,
      patientUhid: order.patientUhid,
      patientAge: order.patientAge,
      patientGender: order.patientGender,
      centreId: order.centreId,
      tenantId: order.tenantId,
      testNames,
      reportDate: new Date().toISOString(),
      status: 'ready',
      pathologistName: 'Dr. Meenakshi Rao, MD (Chief Pathologist, Central LIMS)',
      findings,
      clinicalSummary: 'Analytical results verified on automated chemistry & hematology analyzers at Apex Central Reference Lab. Findings correlate with normal biological baseline.',
      verifiedAt: new Date().toISOString()
    };
  }

  // Reports
  public getReports(tenantId: string, centreId: string, search?: string): LabReport[] {
    let list = this.data.reports.filter(r => r.tenantId === tenantId && r.centreId === centreId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => 
        r.reportNumber.toLowerCase().includes(q) ||
        r.orderNumber.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.patientUhid.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getReport(tenantId: string, centreId: string, id: string): LabReport | undefined {
    return this.data.reports.find(r => (r.id === id || r.reportNumber === id) && r.tenantId === tenantId && r.centreId === centreId);
  }

  // Wallet operations
  public getWalletDetails(tenantId: string, centreId: string): { 
    centre: Centre; 
    transactions: WalletTransaction[];
    lowBalanceWarning: boolean;
  } {
    const centre = this.getCentre(tenantId, centreId);
    if (!centre) throw new Error('Centre not found');
    const txs = this.data.walletTransactions.filter(t => t.tenantId === tenantId && t.centreId === centreId);
    const lowBalanceWarning = centre.walletBalance < centre.walletLowBalanceThreshold;
    return { centre, transactions: txs, lowBalanceWarning };
  }

  public rechargeWallet(params: {
    tenantId: string;
    centreId: string;
    amount: number;
    paymentReference: string;
    paymentMode: string;
    performedByName: string;
  }): { centre: Centre; transaction: WalletTransaction } {
    const { tenantId, centreId, amount, paymentReference, paymentMode, performedByName } = params;
    if (amount <= 0) throw new Error('Recharge amount must be greater than 0');

    const centre = this.getCentre(tenantId, centreId);
    if (!centre) throw new Error('Centre not found');

    const balBefore = centre.walletBalance;
    centre.walletBalance += amount;

    const tx: WalletTransaction = {
      id: 'tx-' + Date.now(),
      centreId,
      tenantId,
      type: 'credit_recharge',
      amount,
      balanceBefore: balBefore,
      balanceAfter: centre.walletBalance,
      referenceId: paymentReference || `RCG-${Date.now()}`,
      description: `Wallet recharge via ${paymentMode.toUpperCase()} by ${performedByName}`,
      timestamp: new Date().toISOString()
    };

    this.data.walletTransactions.unshift(tx);
    this.saveData(this.data);
    return { centre, transaction: tx };
  }

  // Unified Universal Search across centre data
  public universalSearch(tenantId: string, centreId: string, query: string): {
    patients: Patient[];
    orders: Order[];
    tubes: SampleTube[];
    reports: LabReport[];
  } {
    const q = query.trim().toLowerCase();
    if (!q) return { patients: [], orders: [], tubes: [], reports: [] };

    const patients = this.data.patients.filter(p => 
      p.tenantId === tenantId && p.centreId === centreId &&
      (p.name.toLowerCase().includes(q) || p.mobile.includes(q) || p.uhid.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    ).slice(0, 8);

    const orders = this.data.orders.filter(o => 
      o.tenantId === tenantId && o.centreId === centreId &&
      (o.orderNumber.toLowerCase().includes(q) || o.patientName.toLowerCase().includes(q) || o.patientUhid.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
    ).slice(0, 8);

    const tubes = this.data.tubes.filter(t => 
      t.tenantId === tenantId && t.centreId === centreId &&
      (t.tubeNumber.toLowerCase().includes(q) || t.sampleId.toLowerCase().includes(q) || t.barcodePayload.toLowerCase().includes(q) || t.patientName.toLowerCase().includes(q))
    ).slice(0, 8);

    const reports = this.data.reports.filter(r => 
      r.tenantId === tenantId && r.centreId === centreId &&
      (r.reportNumber.toLowerCase().includes(q) || r.orderNumber.toLowerCase().includes(q) || r.patientName.toLowerCase().includes(q) || r.patientUhid.toLowerCase().includes(q))
    ).slice(0, 8);

    return { patients, orders, tubes, reports };
  }

  // Analytics & Operational Reports for Centre Admin
  public getAnalyticsReports(tenantId: string, centreId: string) {
    const orders = this.data.orders.filter(o => o.tenantId === tenantId && o.centreId === centreId);
    const patients = this.data.patients.filter(p => p.tenantId === tenantId && p.centreId === centreId);
    const tubes = this.data.tubes.filter(t => t.tenantId === tenantId && t.centreId === centreId);
    const dispatches = this.data.dispatches.filter(d => d.tenantId === tenantId && d.centreId === centreId);

    // Sales by day
    const dailySalesMap: { [date: string]: { date: string; orders: number; revenue: number; b2bFees: number } } = {};
    for (const o of orders) {
      const d = o.createdAt.split('T')[0];
      if (!dailySalesMap[d]) {
        dailySalesMap[d] = { date: d, orders: 0, revenue: 0, b2bFees: 0 };
      }
      dailySalesMap[d].orders++;
      dailySalesMap[d].revenue += o.netAmount;
      dailySalesMap[d].b2bFees += o.b2bFranchiseFee;
    }

    // Test-wise breakdown
    const testSalesMap: { [code: string]: { code: string; name: string; count: number; totalRevenue: number } } = {};
    for (const o of orders) {
      for (const item of o.items) {
        if (!testSalesMap[item.testCode]) {
          testSalesMap[item.testCode] = { code: item.testCode, name: item.testName, count: 0, totalRevenue: 0 };
        }
        testSalesMap[item.testCode].count++;
        testSalesMap[item.testCode].totalRevenue += item.price;
      }
    }

    // Doctor referral summary
    const doctorRefMap: { [doc: string]: { doctor: string; patientCount: number; totalValue: number } } = {};
    for (const o of orders) {
      const doc = o.referringDoctor || 'Self / Direct';
      if (!doctorRefMap[doc]) {
        doctorRefMap[doc] = { doctor: doc, patientCount: 0, totalValue: 0 };
      }
      doctorRefMap[doc].patientCount++;
      doctorRefMap[doc].totalValue += o.netAmount;
    }

    return {
      dailySales: Object.values(dailySalesMap).sort((a, b) => b.date.localeCompare(a.date)),
      testSales: Object.values(testSalesMap).sort((a, b) => b.count - a.count),
      doctorReferrals: Object.values(doctorRefMap).sort((a, b) => b.totalValue - a.totalValue),
      totalPatientsCount: patients.length,
      totalOrdersCount: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.netAmount, 0),
      dispatchesSummary: dispatches
    };
  }

  // Audit Logs
  public getAuditLogs(tenantId: string, centreId: string): AuditLog[] {
    return this.data.auditLogs.filter(a => a.tenantId === tenantId && a.centreId === centreId);
  }

  // Central Reference Laboratory Data Extraction
  public getCentralLabExtract(
    tenantId: string, 
    centreId: string, 
    filters?: { batchId?: string; statusFilter?: string; dateFrom?: string; dateTo?: string }
  ) {
    const centre = this.data.centres.find(c => c.tenantId === tenantId && c.id === centreId);
    if (!centre) throw new Error('Collection Centre not found');

    const orders = this.data.orders.filter(o => o.tenantId === tenantId && o.centreId === centreId);
    const patients = this.data.patients.filter(p => p.tenantId === tenantId && p.centreId === centreId);
    const dispatches = this.data.dispatches.filter(d => d.tenantId === tenantId && d.centreId === centreId);
    let tubes = this.data.tubes.filter(t => t.tenantId === tenantId && t.centreId === centreId);

    // Apply batch filter if specified
    if (filters?.batchId && filters.batchId !== 'all') {
      tubes = tubes.filter(t => t.dispatchBatchId === filters.batchId);
    }

    // Apply status filter if specified
    if (filters?.statusFilter && filters.statusFilter !== 'all') {
      if (filters.statusFilter === 'ready_for_dispatch') {
        tubes = tubes.filter(t => t.status === 'ready_for_dispatch');
      } else if (filters.statusFilter === 'dispatched') {
        tubes = tubes.filter(t => t.status === 'dispatched' || t.status === 'submitted_to_lims' || t.status === 'report_ready');
      } else if (filters.statusFilter === 'collected') {
        tubes = tubes.filter(t => t.status !== 'pending_collection');
      }
    }

    // Build the enriched records
    const records = tubes.map(tube => {
      const order = orders.find(o => o.id === tube.orderId);
      const patient = patients.find(p => p.id === tube.patientId) || (order ? patients.find(p => p.id === order.patientId) : undefined);
      const batch = tube.dispatchBatchId ? dispatches.find(d => d.id === tube.dispatchBatchId) : undefined;

      // Storage condition derived from tube type / batch
      let storageCondition = 'Ambient (15-25°C)';
      const tLower = tube.tubeType.toLowerCase();
      if (tLower.includes('edta') || tLower.includes('fluoride')) {
        storageCondition = 'Cold Pack (2-8°C)';
      } else if (tLower.includes('serum') || tLower.includes('yellow') || tLower.includes('gold')) {
        storageCondition = 'Cold Pack (2-8°C - Centrifuged)';
      } else if (tLower.includes('citrate')) {
        storageCondition = 'Ambient (18-24°C)';
      }

      const patientAny = patient as any;
      const fastingStatus = patientAny?.medicalHistory?.toLowerCase().includes('fasting') 
        ? 'Fasting Required (10-12 hrs)' 
        : 'Routine / Random';

      return {
        tubeId: tube.id,
        tubeNumber: tube.tubeNumber,
        barcodePayload: tube.barcodePayload || tube.tubeNumber.replace(/[^A-Za-z0-9]/g, ''),
        qrPayload: tube.qrPayload || `${centre.code}|${patient?.uhid}|${order?.orderNumber}|${tube.tubeNumber}`,
        tubeType: tube.tubeType,
        tubeColorCode: tube.tubeColorCode || '#6B7280',
        sampleType: tube.sampleType || 'Whole Blood / Serum',
        targetVolume: tLower.includes('urine') ? '10-20 mL' : '3.0 mL',
        collectionTime: tube.collectionTime || tube.createdAt || new Date().toISOString(),
        collectedBy: tube.collectedBy || 'Phlebotomist',
        phlebotomistNotes: tube.phlebotomistNotes || 'Sample collected following sterile phlebotomy protocol.',
        storageCondition,

        patientId: patient?.id || tube.patientId,
        patientUhid: patient?.uhid || tube.patientUhid,
        patientName: patient?.name || tube.patientName,
        patientAge: patient?.age || tube.patientAge,
        patientGender: patient?.gender || tube.patientGender,
        patientMobile: patient?.mobile || 'N/A',
        patientEmail: patient?.email,
        fastingStatus,
        clinicalHistory: patientAny?.medicalHistory || 'None provided',

        orderId: order?.id || tube.orderId,
        orderNumber: order?.orderNumber || tube.orderNumber,
        orderDate: order?.createdAt || new Date().toISOString(),
        doctorName: order?.referringDoctor || 'Self / Dr. Referral',
        priority: (order?.items?.some(i => i.testName.toLowerCase().includes('emergency') || i.testName.toLowerCase().includes('urgent')) ? 'stat' : 'routine') as 'routine' | 'stat',

        tests: tube.tests.map(t => {
          const matchedItem = order?.items?.find(i => i.testCode === t.code);
          return {
            code: t.code,
            name: t.name,
            category: (matchedItem as any)?.category || 'Clinical Pathology',
            specimenType: matchedItem?.sampleType || tube.sampleType
          };
        }),

        dispatchBatchId: batch?.id,
        dispatchBatchNumber: batch?.batchNumber,
        dispatchTime: batch?.dispatchedDate || batch?.createdDate,
        transporterName: batch?.transporterName,
        temperatureCategory: batch?.temperatureCategory || storageCondition,
        sealNumber: batch?.sealNumber,
        accessionStatus: (tube.status === 'dispatched' || tube.status === 'submitted_to_lims' ? 'in_transit' : 
                         tube.status === 'ready_for_dispatch' ? 'ready_for_dispatch' : 
                         tube.status === 'report_ready' ? 'received' : 'collected') as 'collected' | 'ready_for_dispatch' | 'dispatched' | 'in_transit' | 'received'
      };
    });

    const uniquePatientIds = new Set(records.map(r => r.patientId));
    const uniqueOrderIds = new Set(records.map(r => r.orderId));
    const totalTestsCount = records.reduce((sum, r) => sum + r.tests.length, 0);

    const tubesByVacutainer: Record<string, number> = {};
    let coldChainCount = 0;
    let ambientCount = 0;
    let frozenCount = 0;

    for (const r of records) {
      tubesByVacutainer[r.tubeType] = (tubesByVacutainer[r.tubeType] || 0) + 1;
      if (r.temperatureCategory?.includes('2-8') || r.storageCondition?.includes('2-8')) {
        coldChainCount++;
      } else if (r.temperatureCategory?.includes('Frozen') || r.storageCondition?.includes('Frozen')) {
        frozenCount++;
      } else {
        ambientCount++;
      }
    }

    return {
      centre,
      extractedAt: new Date().toISOString(),
      filtersApplied: filters || {},
      summary: {
        totalPatients: uniquePatientIds.size,
        totalOrders: uniqueOrderIds.size,
        totalTubes: records.length,
        totalTestsRequested: totalTestsCount,
        tubesByVacutainer,
        coldChainCount,
        ambientCount,
        frozenCount
      },
      records,
      dispatches
    };
  }

  // RBAC & Authentication Policy Engine
  public getAuthPolicy(centreId: string): AuthPolicyConfig {
    if (!this.data.authPolicies) {
      this.data.authPolicies = {};
    }
    if (!this.data.authPolicies[centreId]) {
      this.data.authPolicies[centreId] = {
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
        emergencyLockdownReason: '',
        updatedAt: new Date().toISOString(),
        updatedBy: 'System Default'
      };
      this.saveData(this.data);
    }
    return this.data.authPolicies[centreId];
  }

  public getRolePermissions(centreId: string): RolePermissionMatrix {
    if (!this.data.rolePermissions) {
      this.data.rolePermissions = {};
    }
    if (!this.data.rolePermissions[centreId]) {
      this.data.rolePermissions[centreId] = {
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
      this.saveData(this.data);
    }
    return this.data.rolePermissions[centreId];
  }

  public updateRbacPolicy(params: {
    tenantId: string;
    centreId: string;
    policy?: Partial<AuthPolicyConfig>;
    rolePermissions?: RolePermissionMatrix;
    performedByName?: string;
    performedByRole?: UserRole;
  }): { policy: AuthPolicyConfig; rolePermissions: RolePermissionMatrix } {
    const { tenantId, centreId, policy, rolePermissions, performedByName, performedByRole } = params;
    const currentPolicy = this.getAuthPolicy(centreId);
    const currentPermissions = this.getRolePermissions(centreId);

    const updatedPolicy: AuthPolicyConfig = {
      ...currentPolicy,
      ...(policy || {}),
      updatedAt: new Date().toISOString(),
      updatedBy: performedByName || 'Admin In-Charge'
    };

    if (!this.data.authPolicies) this.data.authPolicies = {};
    this.data.authPolicies[centreId] = updatedPolicy;

    if (rolePermissions) {
      // Ensure centre_admin ALWAYS maintains all rights
      const ensuredPermissions: RolePermissionMatrix = {
        ...rolePermissions,
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
        }
      };
      if (!this.data.rolePermissions) this.data.rolePermissions = {};
      this.data.rolePermissions[centreId] = ensuredPermissions;
    }

    this.saveData(this.data);

    this.logAudit({
      tenantId,
      centreId,
      userId: 'usr-admin',
      userName: performedByName || 'Centre Admin',
      userRole: performedByRole || 'centre_admin',
      action: 'UPDATE_RBAC_POLICY',
      resource: 'SecurityPolicy',
      details: `Updated RBAC security policies & permission matrix (Preset: ${updatedPolicy.activePreset}, Mode: ${updatedPolicy.enforcementMode})`
    });

    return {
      policy: updatedPolicy,
      rolePermissions: this.getRolePermissions(centreId)
    };
  }

  public verifySupervisorPin(centreId: string, pin: string): boolean {
    const policy = this.getAuthPolicy(centreId);
    return policy.supervisorMasterPin.trim() === pin.trim();
  }

  public resetStaffCredentials(params: {
    tenantId: string;
    centreId: string;
    userId: string;
    performedByName?: string;
    performedByRole?: UserRole;
  }): { tempPassword: string; tempPin: string; user: User } {
    const { tenantId, centreId, userId, performedByName, performedByRole } = params;
    const userIndex = this.data.users.findIndex(u => u.tenantId === tenantId && u.centreId === centreId && u.id === userId);
    if (userIndex === -1) throw new Error('Staff member not found');

    const tempPassword = 'Temp' + Math.floor(100000 + Math.random() * 900000);
    const tempPin = Math.floor(1000 + Math.random() * 9000).toString();

    this.data.users[userIndex].password = tempPassword;
    this.data.users[userIndex].pin = tempPin;
    this.data.users[userIndex].tempPasswordIssued = true;

    this.saveData(this.data);

    this.logAudit({
      tenantId,
      centreId,
      userId,
      userName: performedByName || 'Centre Admin',
      userRole: performedByRole || 'centre_admin',
      action: 'RESET_CREDENTIALS',
      resource: 'StaffUser',
      details: `Issued temporary authentication credentials & 4-digit PIN for ${this.data.users[userIndex].name} (${this.data.users[userIndex].role})`
    });

    return {
      tempPassword,
      tempPin,
      user: this.data.users[userIndex]
    };
  }

  public setEmergencyLockdown(params: {
    tenantId: string;
    centreId: string;
    locked: boolean;
    reason?: string;
    performedByName?: string;
    performedByRole?: UserRole;
  }): AuthPolicyConfig {
    const { tenantId, centreId, locked, reason, performedByName, performedByRole } = params;
    const policy = this.getAuthPolicy(centreId);
    policy.emergencyLockdown = locked;
    policy.emergencyLockdownReason = reason || '';
    policy.updatedAt = new Date().toISOString();
    policy.updatedBy = performedByName || 'Admin In-Charge';

    this.data.authPolicies![centreId] = policy;
    this.saveData(this.data);

    this.logAudit({
      tenantId,
      centreId,
      userId: 'usr-admin',
      userName: performedByName || 'Centre Admin',
      userRole: performedByRole || 'centre_admin',
      action: locked ? 'SECURITY_LOCKDOWN_ENGAGED' : 'SECURITY_LOCKDOWN_LIFTED',
      resource: 'CentreSecurity',
      details: locked 
        ? `EMERGENCY LOCKDOWN ENGAGED: ${reason || 'Non-admin logins restricted'}` 
        : 'Emergency lockdown lifted by Admin'
    });

    return policy;
  }
}

export const db = new Database();
