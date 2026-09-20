import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Patient, Order, LabReport } from '../types';
import { 
  Users, Search, UserPlus, Phone, Mail, MapPin, Calendar, 
  ShoppingBag, FileCheck, ArrowRight, Eye, AlertCircle, CheckCircle2 
} from 'lucide-react';

interface PatientRegistryProps {
  onStartNewOrderForPatient: (patient: Patient) => void;
  onViewOrder: (orderId: string) => void;
}

export const PatientRegistry: React.FC<PatientRegistryProps> = ({
  onStartNewOrderForPatient,
  onViewOrder
}) => {
  const { currentCentre, showNotification } = useAuth();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientOrders, setPatientOrders] = useState<Order[]>([]);
  const [patientReports, setPatientReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(false);

  // New Patient Modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    age: 35,
    dob: '1991-01-01',
    mobile: '',
    email: '',
    address: '',
    referringDoctor: 'Dr. Self / Direct',
    referralSource: 'Walk-in'
  });

  const loadPatients = async () => {
    if (!currentCentre) return;
    setLoading(true);
    try {
      const list = await api.getPatients(currentCentre.id, searchQuery);
      setPatients(list);
      if (list.length > 0 && !selectedPatient) {
        selectPatient(list[0]);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [currentCentre?.id]);

  const selectPatient = async (p: Patient) => {
    setSelectedPatient(p);
    if (!currentCentre) return;
    try {
      const [allOrders, allReports] = await Promise.all([
        api.getOrders(currentCentre.id),
        api.getReports(currentCentre.id)
      ]);
      setPatientOrders(allOrders.filter(o => o.patientId === p.id));
      setPatientReports(allReports.filter(r => r.patientId === p.id));
    } catch {
      // silent
    }
  };

  const handleRegister = async () => {
    if (!currentCentre || !newForm.name || !newForm.mobile) {
      showNotification('Name and mobile are required', 'error');
      return;
    }

    try {
      const created = await api.createPatient(currentCentre.id, newForm);
      showNotification(`Registered patient ${created.name} (${created.uhid})`, 'success');
      setShowRegModal(false);
      await loadPatients();
      selectPatient(created);
    } catch (err: any) {
      showNotification(err.message || 'Failed to register patient', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Franchise Patient Records
            </span>
            <span className="text-xs text-slate-500 font-mono">{currentCentre?.code}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Patient Registry & Longitudinal History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strictly isolated to {currentCentre?.name}. Search by Name, Mobile, or Centre UHID.
          </p>
        </div>

        <button
          onClick={() => setShowRegModal(true)}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Main Grid: Patients List (1 col) and Longitudinal Medical History (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Patient Directory */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                api.getPatients(currentCentre!.id, e.target.value).then(setPatients);
              }}
              placeholder="Search Name, Mobile, UHID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {patients.map((p) => (
              <div
                key={p.id}
                onClick={() => selectPatient(p)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedPatient?.id === p.id
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{p.name}</span>
                  <span className="font-mono text-[10px] text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                    {p.uhid}
                  </span>
                </div>

                <div className="text-slate-500 text-[11px] mt-1 flex items-center justify-between">
                  <span>{p.gender} • {p.age} yrs</span>
                  <span className="font-medium text-slate-700">{p.mobile}</span>
                </div>

                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  Dr: {p.referringDoctor || 'Self'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Detailed Profile & History */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {selectedPatient ? (
            <div className="space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-slate-900">{selectedPatient.name}</h3>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedPatient.uhid}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Registered: {new Date(selectedPatient.registrationDate || selectedPatient.createdAt || Date.now()).toLocaleDateString([], { dateStyle: 'medium' })}
                  </p>
                </div>

                <button
                  onClick={() => onStartNewOrderForPatient(selectedPatient)}
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Book New Test Order</span>
                </button>
              </div>

              {/* Demographics Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">AGE & GENDER</span>
                  <span className="font-bold text-slate-800">{selectedPatient.age} Years • {selectedPatient.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">MOBILE</span>
                  <span className="font-bold text-slate-800">{selectedPatient.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">REFERRING DOCTOR</span>
                  <span className="font-bold text-slate-800">{selectedPatient.referringDoctor || 'Self'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">REFERRAL SOURCE</span>
                  <span className="font-bold text-slate-800">{selectedPatient.referralSource || 'Direct'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 text-[10px] block">RESIDENTIAL ADDRESS</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.address || 'Not provided'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 text-[10px] block">EMAIL</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.email || 'None'}</span>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Diagnostic Orders History ({patientOrders.length})</span>
                </h4>

                {patientOrders.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                    No orders recorded yet for this patient.
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {patientOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => onViewOrder(ord.id)}
                        className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-mono font-bold text-blue-600">{ord.orderNumber}</div>
                          <div className="text-slate-600 mt-0.5">
                            {ord.items.map(i => i.testName).join(', ')}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(ord.createdAt).toLocaleString()} • {ord.paymentMode.toUpperCase()}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900">₹{ord.netAmount}</div>
                          <span className="text-[10px] uppercase font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {ord.sampleStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reports History */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Diagnostic Reports ({patientReports.length})</span>
                </h4>

                {patientReports.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                    No lab reports ready yet for this patient.
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {patientReports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{rep.testName || rep.testNames?.join(', ')}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Ref: {rep.reportNumber} • Pathologist: {rep.pathologistName}
                          </div>
                          <div className="text-[10px] text-emerald-700 mt-0.5">
                            Approved: {new Date(rep.approvedDate || rep.reportDate || Date.now()).toLocaleDateString()}
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase">
                          {rep.deliveryStatus || 'ready'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">
              Select a patient from the list to view demographics and medical order history.
            </div>
          )}
        </div>

      </div>

      {/* REGISTER PATIENT MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register New Franchise Patient</h3>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Full Patient Name *</label>
                <input
                  type="text"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra Verma"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  value={newForm.mobile}
                  onChange={(e) => setNewForm({ ...newForm, mobile: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                <select
                  value={newForm.gender}
                  onChange={(e) => setNewForm({ ...newForm, gender: e.target.value as any })}
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
                  value={newForm.age}
                  onChange={(e) => setNewForm({ ...newForm, age: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Referring Doctor</label>
                <input
                  type="text"
                  value={newForm.referringDoctor}
                  onChange={(e) => setNewForm({ ...newForm, referringDoctor: e.target.value })}
                  placeholder="Dr. Self / Direct"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newForm.address}
                  onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                  placeholder="Area, Street, City"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => setShowRegModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
              >
                Save Patient
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
