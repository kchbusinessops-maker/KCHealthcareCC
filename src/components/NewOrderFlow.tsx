import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DiagnosticTest, Patient, OrderItem, PaymentMode, SampleTube, Order } from '../types';
import { 
  UserPlus, Search, AlertCircle, Check, CheckCircle2, ChevronRight, 
  Trash2, FileText, Printer, QrCode, ShieldAlert, ArrowLeft, Plus, Clock, Tag
} from 'lucide-react';

interface NewOrderFlowProps {
  onOrderCreated: (order: Order, tubes: SampleTube[]) => void;
  onCancel: () => void;
}

export const NewOrderFlow: React.FC<NewOrderFlowProps> = ({ onOrderCreated, onCancel }) => {
  const { currentCentre, currentUser, showNotification, reloadCentreData } = useAuth();

  // Step state (1: Patient, 2: Tests, 3: Billing & Confirmation)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Patient search & selection
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);

  // New patient form fields
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    age: 30,
    dob: '1996-01-01',
    mobile: '',
    email: '',
    address: '',
    referringDoctor: 'Dr. Self / Direct',
    referralSource: 'Walk-in'
  });

  // Duplicate patient warning state
  const [duplicateWarning, setDuplicateWarning] = useState<Patient | null>(null);

  // Tests catalog & cart
  const [availableTests, setAvailableTests] = useState<DiagnosticTest[]>([]);
  const [testCategoryFilter, setTestCategoryFilter] = useState<string>('all');
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);

  // Billing
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Processing state
  const [submitting, setSubmitting] = useState(false);

  // Load available tests and initial patients for this centre
  useEffect(() => {
    if (!currentCentre) return;
    const fetchInitial = async () => {
      try {
        const [tests, patients] = await Promise.all([
          api.getTests(currentCentre.id),
          api.getPatients(currentCentre.id)
        ]);
        setAvailableTests(tests);
        setPatientsList(patients);
      } catch (err: any) {
        showNotification(err.message || 'Error loading test catalog', 'error');
      }
    };
    fetchInitial();
  }, [currentCentre?.id]);

  // Handle live patient search
  const handleSearchPatient = async (q: string) => {
    setPatientSearchQuery(q);
    if (!currentCentre) return;
    try {
      const results = await api.getPatients(currentCentre.id, q);
      setPatientsList(results);
    } catch {
      // silent
    }
  };

  // Check for duplicate patient when typing mobile or name
  const checkDuplicate = async (mobile: string, name: string) => {
    if (!currentCentre || !mobile || mobile.length < 7 || !name || name.length < 3) {
      setDuplicateWarning(null);
      return;
    }
    try {
      const res = await api.checkDuplicatePatient(currentCentre.id, mobile, name);
      if (res.isDuplicate && res.duplicatePatient) {
        setDuplicateWarning(res.duplicatePatient);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      setDuplicateWarning(null);
    }
  };

  const handleSelectExistingPatient = (p: Patient) => {
    setSelectedPatient(p);
    setIsNewPatient(false);
    setDuplicateWarning(null);
    showNotification(`Selected patient ${p.name} (${p.uhid})`, 'info');
  };

  // Add / Remove tests
  const handleToggleTest = (test: DiagnosticTest) => {
    const exists = selectedItems.some(i => i.testId === test.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.testId !== test.id));
    } else {
      const newItem: OrderItem = {
        testId: test.id,
        testCode: test.code,
        testName: test.name,
        sampleType: test.sampleType,
        requiredTube: test.requiredTube,
        price: test.centrePrice // Master centre price, immutable by receptionist!
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  // Calculate bill
  const subtotal = selectedItems.reduce((acc, item) => acc + item.price, 0);
  const discountAmount = Math.round((subtotal * (discountPct || 0)) / 100);
  const netAmount = subtotal - discountAmount;
  const balance = Math.max(0, netAmount - (amountPaid || 0));

  // Auto-set amountPaid to netAmount initially
  useEffect(() => {
    setAmountPaid(netAmount);
  }, [netAmount]);

  // Franchise B2B share deduction preview
  const estimatedB2bFee = Math.round(netAmount * (currentCentre?.franchiseCommercialRate || 0.65));
  const walletAvailable = (currentCentre?.walletBalance || 0) + (currentCentre?.walletCreditLimit || 0);
  const isWalletInsufficient = walletAvailable < estimatedB2bFee;

  // Final submit order
  const handleCreateOrder = async () => {
    if (!currentCentre) return;

    // Validate patient
    let patientIdToUse = selectedPatient?.id;

    setSubmitting(true);
    try {
      if (isNewPatient) {
        // Register patient first
        if (!newPatientForm.name || !newPatientForm.mobile) {
          showNotification('Patient name and mobile number are required', 'error');
          setSubmitting(false);
          return;
        }
        const created = await api.createPatient(currentCentre.id, {
          name: newPatientForm.name,
          gender: newPatientForm.gender,
          age: Number(newPatientForm.age),
          dob: newPatientForm.dob,
          mobile: newPatientForm.mobile,
          email: newPatientForm.email,
          address: newPatientForm.address,
          referringDoctor: newPatientForm.referringDoctor,
          referralSource: newPatientForm.referralSource
        });
        patientIdToUse = created.id;
        setSelectedPatient(created);
      }

      if (!patientIdToUse) {
        showNotification('Please select or register a patient first', 'error');
        setSubmitting(false);
        return;
      }

      if (selectedItems.length === 0) {
        showNotification('Please select at least one diagnostic test', 'error');
        setSubmitting(false);
        return;
      }

      // Check discount permission
      if (currentUser.role === 'receptionist' && discountPct > 20) {
        showNotification('Maximum receptionist discount is 20%. Request Admin authorization.', 'error');
        setSubmitting(false);
        return;
      }

      // Submit order creation with idempotency key
      const idempotencyKey = `ord-${currentCentre.id}-${Date.now()}`;
      const result = await api.createOrder(currentCentre.id, {
        patientId: patientIdToUse,
        items: selectedItems,
        discountPercentage: discountPct,
        paymentMode,
        amountPaid: Number(amountPaid),
        idempotencyKey
      });

      await reloadCentreData();
      showNotification(`Order ${result.order.orderNumber} successfully created! ${result.tubes.length} tubes generated.`, 'success');
      onOrderCreated(result.order, result.tubes);
    } catch (err: any) {
      showNotification(err.message || 'Failed to create order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered tests
  const filteredTests = availableTests.filter(t => {
    const matchesCategory = testCategoryFilter === 'all' || 
      (testCategoryFilter === 'individual' && t.type === 'individual') ||
      (testCategoryFilter === 'profile' && t.type === 'profile') ||
      (testCategoryFilter === 'package' && t.type === 'package') ||
      t.category.toLowerCase() === testCategoryFilter.toLowerCase();

    const matchesSearch = !testSearchQuery || 
      t.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(testSearchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* Step Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">New Patient Order & Sample Generation</h2>
            <p className="text-xs text-slate-500">Collection Centre Walk-in & Booking Console</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            1. Patient
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            2. Select Tests
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            3. Billing & QR
          </span>
        </div>
      </div>

      {/* STEP 1: PATIENT REGISTRATION & DUPLICATE CHECK */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Search Existing Patient */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Search Existing Patient</h3>
              <span className="text-xs text-slate-500 font-medium">Fast Lookup</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={patientSearchQuery}
                onChange={(e) => handleSearchPatient(e.target.value)}
                placeholder="Search Name, Mobile, UHID..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {patientsList.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">No matching patients found.</div>
              ) : (
                patientsList.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectExistingPatient(p)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedPatient?.id === p.id && !isNewPatient
                        ? 'border-blue-600 bg-blue-50/70'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span>{p.name}</span>
                      <span className="font-mono text-[10px] text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                        {p.uhid}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-1 flex items-center justify-between">
                      <span>{p.age} yrs • {p.gender}</span>
                      <span className="font-medium">{p.mobile}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      Dr: {p.referringDoctor || 'Self'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setIsNewPatient(true);
                setSelectedPatient(null);
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4 text-slate-600" />
              <span>Register New Patient</span>
            </button>
          </div>

          {/* Right Column: Selected Patient / New Patient Form */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {isNewPatient ? 'Register New Patient (Duplicate Detection Active)' : 'Selected Patient Information'}
              </h3>
              {selectedPatient && !isNewPatient && (
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Existing Record</span>
                </span>
              )}
            </div>

            {/* DUPLICATE PATIENT DETECTION ALERT */}
            {duplicateWarning && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-amber-800">Duplicate Patient Detected!</div>
                  <div className="text-amber-700 mt-0.5">
                    A patient with mobile <strong>{duplicateWarning.mobile}</strong> or name <strong>{duplicateWarning.name}</strong> already exists under UHID: <strong>{duplicateWarning.uhid}</strong>.
                  </div>
                  <button
                    onClick={() => handleSelectExistingPatient(duplicateWarning)}
                    className="mt-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold px-3 py-1 rounded text-xs cursor-pointer"
                  >
                    Use Existing Patient Record
                  </button>
                </div>
              </div>
            )}

            {isNewPatient ? (
              /* Registration Form */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewPatientForm({ ...newPatientForm, name });
                      checkDuplicate(newPatientForm.mobile, name);
                    }}
                    placeholder="e.g. Meera S. Nair"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={newPatientForm.mobile}
                    onChange={(e) => {
                      const mobile = e.target.value;
                      setNewPatientForm({ ...newPatientForm, mobile });
                      checkDuplicate(mobile, newPatientForm.name);
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                  <select
                    value={newPatientForm.gender}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={newPatientForm.email}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                    placeholder="report@patient.com"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Referring Doctor</label>
                  <input
                    type="text"
                    value={newPatientForm.referringDoctor}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, referringDoctor: e.target.value })}
                    placeholder="Dr. Ashok Mehta, MD"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={newPatientForm.address}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })}
                    placeholder="House/Street, Area, City"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Referral Source</label>
                  <select
                    value={newPatientForm.referralSource}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, referralSource: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="Doctor Referral">Doctor Referral</option>
                    <option value="Hospital Tie-up">Hospital Tie-up</option>
                    <option value="Franchise Digital Booking">Franchise Digital Booking</option>
                    <option value="Corporate Health Camp">Corporate Health Camp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Collection Centre</label>
                  <input
                    type="text"
                    disabled
                    value={`${currentCentre?.name} (${currentCentre?.code})`}
                    className="w-full p-2.5 border border-slate-200 bg-slate-100 rounded-xl text-slate-600 font-medium"
                  />
                </div>
              </div>
            ) : selectedPatient ? (
              /* Selected Patient Details Card */
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-medium text-[11px]">PATIENT NAME</span>
                    <div className="text-base font-bold text-slate-900">{selectedPatient.name}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-medium text-[11px]">CENTRE UHID</span>
                    <div className="font-mono font-bold text-blue-600">{selectedPatient.uhid}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px]">GENDER / AGE</span>
                    <div className="font-semibold text-slate-800">{selectedPatient.gender} • {selectedPatient.age} yrs</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">MOBILE</span>
                    <div className="font-semibold text-slate-800">{selectedPatient.mobile}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">REFERRING DOCTOR</span>
                    <div className="font-semibold text-slate-800">{selectedPatient.referringDoctor || 'Self'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">SOURCE</span>
                    <div className="font-semibold text-slate-800">{selectedPatient.referralSource || 'Direct'}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-slate-600">
                  <span className="text-slate-400 text-[10px] block">ADDRESS</span>
                  {selectedPatient.address || 'Address not recorded'}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Search an existing patient from the left panel or click "Register New Patient" to proceed.
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                disabled={!selectedPatient && (!isNewPatient || !newPatientForm.name || !newPatientForm.mobile)}
                onClick={() => setStep(2)}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center space-x-2 cursor-pointer transition-all shadow-sm"
              >
                <span>Proceed to Select Tests</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* STEP 2: TEST SELECTION */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tests Catalog (2 cols) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Diagnostic Tests & Profiles Catalog</h3>
                <p className="text-xs text-slate-500">Only showing tests enabled for {currentCentre?.name}</p>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center space-x-1 overflow-x-auto text-xs bg-slate-100 p-1 rounded-lg">
                {['all', 'individual', 'profile', 'package'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTestCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-md capitalize font-semibold transition-colors cursor-pointer ${
                      testCategoryFilter === cat ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search test */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
                placeholder="Search test name, code (e.g. CBC, Lipid, Thyroid, DiabCare)..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Test Cards List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredTests.map((test) => {
                const isSelected = selectedItems.some(i => i.testId === test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => handleToggleTest(test)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected ? 'border-blue-600 bg-blue-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Tube Color Cap Indicator */}
                      <div 
                        className="w-3.5 h-12 rounded-sm shadow-xs mt-0.5"
                        style={{ backgroundColor: test.tubeColorCode }}
                        title={test.requiredTube}
                      />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center space-x-2">
                          <span>{test.name}</span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {test.code}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-blue-600 bg-blue-100/60 px-1.5 py-0.2 rounded">
                            {test.type}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 mt-1">
                          <span>Specimen: <strong className="text-slate-700">{test.sampleType}</strong></span>
                          <span>•</span>
                          <span>Tube: <strong className="text-slate-700">{test.requiredTube}</strong></span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>TAT: {test.tatHours} hrs</span>
                          </span>
                        </div>

                        {test.fastingRequirement && (
                          <div className="text-[11px] text-amber-700 font-medium mt-1">
                            ℹ {test.fastingRequirement}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price & Selection Checkbox */}
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          ₹{test.centrePrice.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 line-through">
                          MRP ₹{test.mrp.toLocaleString()}
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Order Cart & Tube Preview (1 col) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900">
                  Selected Tests ({selectedItems.length})
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  Patient: {selectedPatient ? selectedPatient.name : newPatientForm.name}
                </span>
              </div>

              {selectedItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  No tests selected yet. Click any test or package from the catalog to add.
                </div>
              ) : (
                <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1 text-xs">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                      <div>
                        <div className="font-semibold text-slate-800">{item.testName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.testCode} • {item.requiredTube}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">₹{item.price}</span>
                        <button
                          onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary & Next Step */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Subtotal ({selectedItems.length} tests):</span>
                <span className="font-bold text-slate-900 text-sm">₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="text-[11px] text-slate-400">
                * Note: Collection centre master test prices are regulated and immutable by reception staff.
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  disabled={selectedItems.length === 0}
                  onClick={() => setStep(3)}
                  className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-sm"
                >
                  <span>Proceed to Billing</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* STEP 3: BILLING, WALLET CHECK, ORDER CREATION & SAMPLE TUBE GENERATION */}
      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Billing & Payment */}
          <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Order Billing & Payment Collection</h3>
                <p className="text-xs text-slate-500">
                  Patient: <strong className="text-slate-800">{selectedPatient ? selectedPatient.name : newPatientForm.name}</strong> • 
                  Dr: <strong className="text-slate-800">{selectedPatient?.referringDoctor || newPatientForm.referringDoctor}</strong>
                </p>
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg font-bold border border-blue-200">
                {selectedItems.length} Tests
              </span>
            </div>

            {/* Billing breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>

              {/* Permitted Discount Input */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <span className="font-semibold text-slate-700">Permitted Discount:</span>
                  <div className="text-[10px] text-slate-400">
                    {currentUser.role === 'receptionist' ? 'Max authorized: 20%' : 'Admin full discretion'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max={currentUser.role === 'receptionist' ? 20 : 50}
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Math.min(currentUser.role === 'receptionist' ? 20 : 50, Math.max(0, Number(e.target.value))))}
                    className="w-16 p-1.5 text-center font-bold text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <span className="font-semibold">% = ₹{discountAmount}</span>
                </div>
              </div>

              {/* Net Amount */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Net Payable Amount:</span>
                <span className="text-lg text-blue-700">₹{netAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Payment Mode *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { mode: 'cash', label: 'Cash at Counter' },
                  { mode: 'upi', label: 'Instant UPI / QR' },
                  { mode: 'card', label: 'Debit / Credit Card' },
                  { mode: 'netbanking', label: 'Net Banking' }
                ].map((p) => (
                  <button
                    key={p.mode}
                    type="button"
                    onClick={() => setPaymentMode(p.mode as PaymentMode)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      paymentMode === p.mode
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Paid vs Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  max={netAmount}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Balance Due (₹)</label>
                <input
                  type="text"
                  disabled
                  value={`₹${balance}`}
                  className={`w-full p-2.5 border rounded-xl font-bold text-sm ${balance > 0 ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                />
              </div>
            </div>

          </div>

          {/* Right 1 Col: Franchise Wallet Pre-check & Automated Tube Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
                Franchise Commercials & Tubes
              </h3>

              {/* Wallet Deduction Rule Box */}
              <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isWalletInsufficient ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>Parent Lab B2B Share ({Math.round((currentCentre?.franchiseCommercialRate || 0.65) * 100)}%):</span>
                  <span className="font-mono text-sm">₹{estimatedB2bFee.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Available Centre Wallet:</span>
                  <span className="font-semibold text-slate-800">₹{(currentCentre?.walletBalance || 0).toLocaleString()}</span>
                </div>

                {isWalletInsufficient ? (
                  <div className="text-[11px] text-rose-600 font-semibold flex items-center space-x-1 pt-1 border-t border-rose-200">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Insufficient wallet balance! Please recharge centre wallet before confirming order.</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1 pt-1 border-t border-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Wallet balance verified. B2B share will be safely deducted.</span>
                  </div>
                )}
              </div>

              {/* Automated Sample / Tube Requirements Preview */}
              <div>
                <h4 className="font-bold text-xs text-slate-700 mb-2">Automated Vacutainer Tubes Required:</h4>
                <div className="space-y-1.5 text-xs">
                  {Array.from(new Set(selectedItems.map(i => i.requiredTube))).map((tubeType, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-100 border border-slate-200 flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      <span className="font-semibold text-slate-800">{tubeType}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  System will instantly generate unique Barcodes & QR codes mapped to Patient + Order + Tube for phlebotomy verification.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  disabled={submitting || isWalletInsufficient}
                  onClick={handleCreateOrder}
                  className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? 'Creating Order...' : 'Confirm & Generate QR'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
