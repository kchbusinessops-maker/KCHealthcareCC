import express, { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { UserRole } from '../src/types.js';

const router = express.Router();

// Middleware: Authenticate & Enforce Centre Isolation
function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'apex-parent-lab';
  const centreId = req.headers['x-centre-id'] as string;
  const userRole = (req.headers['x-user-role'] as UserRole) || 'receptionist';
  const userId = (req.headers['x-user-id'] as string) || 'usr-rec-01';
  const userName = (req.headers['x-user-name'] as string) || 'Staff';

  (req as any).auth = { tenantId, centreId, userRole, userId, userName };

  // If the request route specifies a :centreId parameter, verify strict match!
  const routeCentreId = req.params.centreId;
  if (routeCentreId && centreId && routeCentreId !== centreId) {
    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'SECURITY_CROSS_CENTRE_VIOLATION_BLOCKED',
      resource: req.originalUrl,
      details: `Forbidden attempt by Centre ${centreId} to access data belonging to Centre ${routeCentreId}`
    });
    return res.status(403).json({
      error: 'Cross-centre data access is strictly forbidden by Parent Laboratory security policy.',
      code: 'CENTRE_ISOLATION_VIOLATION'
    });
  }

  next();
}

// Authentication: Centre-specific Staff Login
router.post('/auth/login', (req, res) => {
  const { centreId, username, password } = req.body;
  if (!centreId || !username) {
    return res.status(400).json({ error: 'Collection centre selection and username are required.' });
  }

  try {
    const result = db.authenticateUser(centreId, username, password);
    
    // Log audit
    db.logAudit({
      centreId,
      tenantId: result.centre.tenantId,
      userId: result.user.id,
      userName: result.user.name,
      userRole: result.user.role,
      action: 'USER_LOGIN_SUCCESS',
      resource: `Session:${result.user.username}`,
      details: `Authorized login for ${result.user.name} (${result.user.role}) at ${result.centre.name}`
    });

    res.json({
      success: true,
      user: result.user,
      centre: result.centre,
      token: 'jwt-auth-' + Date.now()
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// GET all Collection Centres
router.get('/centres', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'apex-parent-lab';
  try {
    const centres = db.getCentres(tenantId);
    res.json(centres);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET staff users for a specific Collection Centre
router.get('/centres/:centreId/users', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'apex-parent-lab';
  const centreId = req.params.centreId;
  try {
    const users = db.getUsers(tenantId, centreId);
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create / Onboard a new Staff Member at Collection Centre
router.post('/centres/:centreId/users', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userName, userRole } = (req as any).auth;
  const { name, username, role, email, phone, password } = req.body;

  if (!name || !username || !role) {
    return res.status(400).json({ error: 'Staff Full Name, Username, and Assigned Role are required.' });
  }

  try {
    const newUser = db.createStaffUser({
      tenantId,
      centreId,
      name,
      username,
      role,
      email,
      phone,
      password,
      performedByName: userName
    });

    res.status(201).json({
      success: true,
      user: newUser,
      message: `Staff member ${newUser.name} registered and assigned role "${newUser.role}".`
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT: Reassign Role / Update Staff Details
router.put('/centres/:centreId/users/:userId', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userName, userRole } = (req as any).auth;
  const { userId } = req.params;
  const { role, name, email, phone, active } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Assigned role is required.' });
  }

  try {
    const updatedUser = db.updateStaffUserRole({
      tenantId,
      centreId,
      userId,
      role,
      name,
      email,
      phone,
      active,
      performedByName: userName
    });

    res.json({
      success: true,
      user: updatedUser,
      message: `Role "${updatedUser.role}" successfully assigned to ${updatedUser.name}.`
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH: Toggle Staff User Active Status
router.patch('/centres/:centreId/users/:userId/toggle-status', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userName } = (req as any).auth;
  const { userId } = req.params;

  try {
    const updatedUser = db.toggleStaffUserStatus({
      tenantId,
      centreId,
      userId,
      performedByName: userName
    });

    res.json({
      success: true,
      user: updatedUser,
      message: `Staff member ${updatedUser.name} status updated to ${updatedUser.active ? 'Active' : 'Inactive'}.`
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST: Reset Staff Credentials / Temporary Password & PIN (Admin Only)
router.post('/centres/:centreId/users/:userId/reset-credentials', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userName, userRole } = (req as any).auth;
  const { userId } = req.params;

  try {
    const creds = db.resetStaffCredentials({
      tenantId,
      centreId,
      userId,
      performedByName: userName,
      performedByRole: userRole
    });

    res.json({
      success: true,
      message: `Temporary credentials generated for ${creds.user.name}`,
      tempPassword: creds.tempPassword,
      tempPin: creds.tempPin,
      user: creds.user
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET: RBAC Policies and Role Permissions Matrix
router.get('/centres/:centreId/rbac-policy', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'apex-parent-lab';
  const { centreId } = req.params;

  try {
    const policy = db.getAuthPolicy(centreId);
    const rolePermissions = db.getRolePermissions(centreId);
    const centres = db.getCentres(tenantId);

    res.json({
      policy,
      rolePermissions,
      centres
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update RBAC Policy and Permission Matrix (Admin with all rights)
router.put('/centres/:centreId/rbac-policy', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userName, userRole } = (req as any).auth;
  const { policy, rolePermissions } = req.body;

  try {
    const result = db.updateRbacPolicy({
      tenantId,
      centreId,
      policy,
      rolePermissions,
      performedByName: userName,
      performedByRole: userRole
    });

    res.json({
      success: true,
      message: 'Collection centre authentication policy and permission matrix updated successfully.',
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST: Verify Supervisor Master PIN
router.post('/centres/:centreId/verify-supervisor-pin', (req, res) => {
  const { centreId } = req.params;
  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  try {
    const isValid = db.verifySupervisorPin(centreId, pin);
    res.json({ valid: isValid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Emergency Lockdown / Unlock Centre
router.post('/centres/:centreId/emergency-lockdown', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userName, userRole } = (req as any).auth;
  const { locked, reason } = req.body;

  try {
    const policy = db.setEmergencyLockdown({
      tenantId,
      centreId,
      locked: !!locked,
      reason,
      performedByName: userName,
      performedByRole: userRole
    });

    res.json({
      success: true,
      message: locked ? 'Emergency lockdown engaged for this centre.' : 'Emergency lockdown lifted.',
      policy
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST: Create / Onboard a new Collection Centre
router.post('/centres', (req, res) => {
  const { 
    name, code, parentLabName, address, city, phone, email, 
    franchiseCommercialRate, walletBalance, walletCreditLimit, walletLowBalanceThreshold,
    adminUser, staffUsers 
  } = req.body;

  if (!name || !code || !city || !address) {
    return res.status(400).json({ error: 'Centre Name, Centre Code, City, and Address are required.' });
  }

  try {
    const result = db.createCentre({
      tenantId: 'apex-parent-lab',
      name,
      code,
      parentLabName,
      address,
      city,
      phone: phone || '+91 98000 00000',
      email: email || `${code.toLowerCase()}@apexdiagnostics.com`,
      franchiseCommercialRate: Number(franchiseCommercialRate) || 0.65,
      walletBalance: Number(walletBalance) || 0,
      walletCreditLimit: Number(walletCreditLimit) || 10000,
      walletLowBalanceThreshold: Number(walletLowBalanceThreshold) || 5000,
      adminUser,
      staffUsers
    });

    res.status(201).json({
      success: true,
      message: `Collection Centre "${result.centre.name}" (${result.centre.code}) successfully created with full operational modules.`,
      centre: result.centre,
      users: result.users
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Global context & switch-centre for demo / operation testing
router.get('/auth/context', (req, res) => {
  const tenantId = 'apex-parent-lab';
  const centres = db.getCentres(tenantId);
  const allUsers: any[] = [];
  centres.forEach(c => {
    const centreUsers = db.getUsers(tenantId, c.id);
    centreUsers.forEach(u => {
      allUsers.push({
        id: u.id,
        name: u.name,
        role: u.role,
        centreId: u.centreId,
        title: u.role === 'centre_admin' ? 'Centre Admin' : u.role === 'receptionist' ? 'Receptionist' : 'Phlebotomist',
        username: u.username
      });
    });
  });

  res.json({
    tenantId,
    centres,
    activeCentre: centres[0],
    defaultUsers: allUsers
  });
});

// DASHBOARD
router.get('/centres/:centreId/dashboard', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  try {
    const metrics = db.getDashboardMetrics(tenantId, centreId);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATIENT MANAGEMENT
router.get('/centres/:centreId/patients', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  const search = req.query.search as string;
  try {
    const list = db.getPatients(tenantId, centreId, search);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/centres/:centreId/patients/check-duplicate', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  const { mobile, name } = req.body;
  if (!mobile || !name) {
    return res.status(400).json({ error: 'Mobile and Name are required for duplicate check' });
  }
  const duplicate = db.checkDuplicatePatient(tenantId, centreId, mobile, name);
  res.json({ isDuplicate: !!duplicate, duplicatePatient: duplicate || null });
});

router.post('/centres/:centreId/patients', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userId, userName, userRole } = (req as any).auth;
  try {
    const newPatient = db.createPatient({
      ...req.body,
      tenantId,
      centreId
    });

    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'PATIENT_REGISTERED',
      resource: `Patient:${newPatient.id}`,
      details: `Registered new patient: ${newPatient.name} (UHID: ${newPatient.uhid})`
    });

    res.status(201).json(newPatient);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/centres/:centreId/patients/:id', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userId, userName, userRole } = (req as any).auth;
  try {
    const updated = db.updatePatient(tenantId, centreId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Patient not found' });

    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'PATIENT_UPDATED',
      resource: `Patient:${updated.id}`,
      details: `Updated demographic details for ${updated.name}`
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// TESTS CATALOG
router.get('/centres/:centreId/tests', securityMiddleware, (req, res) => {
  const { centreId } = (req as any).auth;
  try {
    const tests = db.getTests(centreId);
    res.json(tests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ORDERS & BILLING & SAMPLE CREATION
router.get('/centres/:centreId/orders', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  const search = req.query.search as string;
  try {
    const orders = db.getOrders(tenantId, centreId, search);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/centres/:centreId/orders/:id', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  try {
    const order = db.getOrder(tenantId, centreId, req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const relatedTubes = db.getTubes(tenantId, centreId).filter(t => t.orderId === order.id);
    res.json({ order, tubes: relatedTubes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/centres/:centreId/orders', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userId, userName, userRole } = (req as any).auth;
  const { patientId, items, discountPercentage, paymentMode, amountPaid, idempotencyKey } = req.body;

  if (!patientId || !items || !items.length) {
    return res.status(400).json({ error: 'Patient and at least one test item are required' });
  }

  // Security check: Receptionist cannot exceed 20% discount without admin authorization
  if (userRole === 'receptionist' && Number(discountPercentage) > 20) {
    return res.status(403).json({ error: 'Discounts above 20% require Centre Admin authorization code.' });
  }

  try {
    const result = db.createOrder({
      tenantId,
      centreId,
      patientId,
      items,
      discountPercentage: Number(discountPercentage) || 0,
      paymentMode: paymentMode || 'cash',
      amountPaid: Number(amountPaid) || 0,
      createdByName: userName,
      idempotencyKey
    });

    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'ORDER_CREATED',
      resource: `Order:${result.order.orderNumber}`,
      details: `Created order for ₹${result.order.netAmount} (${result.tubes.length} tubes generated, B2B franchise fee ₹${result.order.b2bFranchiseFee} deducted)`
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// SAMPLES & QR / BARCODE TUBES
router.get('/centres/:centreId/tubes', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  const status = req.query.status as string;
  try {
    const tubes = db.getTubes(tenantId, centreId, status);
    res.json(tubes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Scan / Lookup tube by QR or barcode string
router.post('/centres/:centreId/tubes/lookup', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'QR / Barcode string is required' });

  const tube = db.getTubeByPayload(tenantId, centreId, code);
  if (!tube) {
    return res.status(404).json({ error: `No tube record found matching scan: "${code}". Ensure the sample belongs to ${centreId}.` });
  }

  res.json(tube);
});

// Confirm Sample Collection (Phlebotomy action)
router.post('/centres/:centreId/tubes/collect', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userId, userName, userRole } = (req as any).auth;
  const { tubeId, notes } = req.body;

  if (!tubeId) return res.status(400).json({ error: 'Tube ID is required' });

  try {
    const tube = db.verifyAndCollectSample({
      tenantId,
      centreId,
      tubeId,
      collectedBy: userName,
      notes
    });

    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'SAMPLE_COLLECTED',
      resource: `Tube:${tube.tubeNumber}`,
      details: `Confirmed collection of ${tube.tubeType} for Patient ${tube.patientName} (${tube.patientUhid})`
    });

    res.json(tube);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Mark Tube ready for dispatch
router.post('/centres/:centreId/tubes/mark-ready', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userId, userName, userRole } = (req as any).auth;
  const { tubeId } = req.body;
  try {
    const tube = db.markTubeReadyForDispatch(tenantId, centreId, tubeId);
    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'TUBE_READY_DISPATCH',
      resource: `Tube:${tube.tubeNumber}`,
      details: `Tube marked ready for dispatch batch packing`
    });
    res.json(tube);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DISPATCH BATCHES
router.get('/centres/:centreId/dispatches', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  try {
    const batches = db.getDispatches(tenantId, centreId);
    res.json(batches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/centres/:centreId/dispatches', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userId, userName, userRole } = (req as any).auth;
  const { transporterName, courierContact, trackingNumber, temperatureCategory, sealNumber, notes } = req.body;

  try {
    const batch = db.createDispatchBatch({
      tenantId,
      centreId,
      transporterName: transporterName || 'Courier / Runner',
      courierContact: courierContact || '',
      trackingNumber: trackingNumber || `TRK-${Date.now()}`,
      temperatureCategory: temperatureCategory || '2-8°C (Cold Pack)',
      sealNumber: sealNumber || `SEAL-${Math.floor(1000 + Math.random() * 9000)}`,
      notes
    });

    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'DISPATCH_BATCH_CREATED',
      resource: `DispatchBatch:${batch.batchNumber}`,
      details: `Created new dispatch manifest with Transporter: ${batch.transporterName}`
    });

    res.status(201).json(batch);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/centres/:centreId/dispatches/:id/add-tube', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  const { tubePayload } = req.body;

  try {
    const result = db.addTubeToDispatch(tenantId, centreId, req.params.id, tubePayload);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/centres/:centreId/dispatches/:id/send', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userId, userName, userRole } = (req as any).auth;
  try {
    const batch = db.closeAndSendDispatch(tenantId, centreId, req.params.id);
    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'DISPATCH_SENT_TO_LIMS',
      resource: `DispatchBatch:${batch.batchNumber}`,
      details: `Dispatched batch containing ${batch.totalTubes} tubes to Central LIMS via transporter ${batch.transporterName}`
    });
    res.json(batch);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// CENTRAL LABORATORY ACCESSION & DATA EXTRACTION
router.get('/centres/:centreId/central-lab-extract', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userId, userName, userRole } = (req as any).auth;
  const batchId = req.query.batchId as string;
  const statusFilter = req.query.status as string;
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  try {
    const extract = db.getCentralLabExtract(tenantId, centreId, { batchId, statusFilter, dateFrom, dateTo });
    
    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'CENTRAL_LAB_DATA_EXTRACTED',
      resource: 'CentralLabExtract',
      details: `Generated Central Lab accession extract: ${extract.summary.totalTubes} tubes, ${extract.summary.totalPatients} patients, ${extract.summary.totalTestsRequested} test requests`
    });

    res.json(extract);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mock LIMS Compatibility
router.post('/centres/:centreId/lims/sync', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userId, userName, userRole } = (req as any).auth;
  const { batchId } = req.body;
  try {
    const syncResult = db.triggerLimsSync(tenantId, centreId, batchId);
    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'LIMS_ADAPTER_SYNC',
      resource: 'LIMS_Adapter',
      details: `LIMS sync: ${syncResult.synced} specimens status-advanced, ${syncResult.reportsCreated} diagnostic reports generated`
    });
    res.json({
      success: true,
      message: 'LIMS synchronized with Central Laboratory system.',
      ...syncResult
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REPORTS
router.get('/centres/:centreId/reports', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  const search = req.query.search as string;
  try {
    const reports = db.getReports(tenantId, centreId, search);
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/centres/:centreId/reports/:id', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  try {
    const report = db.getReport(tenantId, centreId, req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found or not belonging to your collection centre' });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// WALLET & TRANSACTIONS
router.get('/centres/:centreId/wallet', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  try {
    const details = db.getWalletDetails(tenantId, centreId);
    res.json(details);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/centres/:centreId/wallet/recharge', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userId, userName, userRole } = (req as any).auth;
  const { amount, paymentReference, paymentMode } = req.body;

  try {
    const result = db.rechargeWallet({
      tenantId,
      centreId,
      amount: Number(amount) || 0,
      paymentReference: paymentReference || `REF-${Date.now()}`,
      paymentMode: paymentMode || 'UPI',
      performedByName: userName
    });

    db.logAudit({
      centreId,
      tenantId,
      userId,
      userName,
      userRole,
      action: 'WALLET_RECHARGE',
      resource: 'Wallet',
      details: `Recharged ₹${amount} via ${paymentMode}. New balance: ₹${result.centre.walletBalance}`
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// FAST UNIVERSAL SEARCH
router.get('/centres/:centreId/search', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  const query = (req.query.q as string) || '';
  try {
    const results = db.universalSearch(tenantId, centreId, query);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ANALYTICS & OPERATIONAL REPORTS
router.get('/centres/:centreId/analytics', securityMiddleware, (req, res) => {
  const { tenantId, centreId, userRole } = (req as any).auth;
  // Centre Admin or authorized roles
  try {
    const data = db.getAnalyticsReports(tenantId, centreId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AUDIT LOGS
router.get('/centres/:centreId/audit-logs', securityMiddleware, (req, res) => {
  const { tenantId, centreId } = (req as any).auth;
  try {
    const logs = db.getAuditLogs(tenantId, centreId);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
