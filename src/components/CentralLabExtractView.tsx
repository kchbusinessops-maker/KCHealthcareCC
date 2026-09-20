import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CentralLabExtractPackage, CentralLabExtractRecord, DispatchBatch, UserRole } from '../types';
import { hasPermission, ROLE_DEFINITIONS } from '../utils/rbac';
import { 
  Download, FileSpreadsheet, FileCode, Printer, Copy, Check, 
  FlaskConical, AlertCircle, CheckCircle2, Search, Filter, 
  Building2, Thermometer, QrCode, ArrowRight, ShieldCheck, X, RefreshCw,
  Lock, KeyRound, ShieldAlert, Sparkles, Truck, Users
} from 'lucide-react';

export const CentralLabExtractView: React.FC = () => {
  const { currentCentre, currentUser, selectRole, showNotification } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [extractData, setExtractData] = useState<CentralLabExtractPackage | null>(null);
  
  // Filters
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action states
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'printable' | 'json'>('preview');

  const canExtract = hasPermission(currentUser.role, 'canExtractCentralLabData');

  const fetchExtract = async () => {
    if (!currentCentre) return;
    setLoading(true);
    try {
      const data = await api.getCentralLabExtract(currentCentre.id, {
        batchId: selectedBatchId !== 'all' ? selectedBatchId : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      });
      setExtractData(data);
    } catch (err: any) {
      showNotification(err.message || 'Failed to extract central lab data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canExtract) {
      fetchExtract();
    }
  }, [currentCentre?.id, selectedBatchId, selectedStatus, canExtract]);

  // Filtered records for search
  const filteredRecords = useMemo(() => {
    if (!extractData) return [];
    if (!searchQuery.trim()) return extractData.records;
    const q = searchQuery.toLowerCase();
    return extractData.records.filter(r => 
      r.patientName.toLowerCase().includes(q) ||
      r.patientUhid.toLowerCase().includes(q) ||
      r.tubeNumber.toLowerCase().includes(q) ||
      r.barcodePayload.toLowerCase().includes(q) ||
      r.orderNumber.toLowerCase().includes(q) ||
      r.tests.some(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
    );
  }, [extractData, searchQuery]);

  // Download CSV for Central Lab
  const handleDownloadCsv = () => {
    if (!extractData || extractData.records.length === 0) {
      showNotification('No specimen records available to export', 'warning');
      return;
    }

    const headers = [
      'Specimen Barcode',
      'Tube Number',
      'Vacutainer Type',
      'Sample Type',
      'Target Volume',
      'Patient UHID',
      'Patient Name',
      'Age',
      'Gender',
      'Mobile',
      'Fasting Status',
      'Clinical History',
      'Order Number',
      'Order Date',
      'Referring Doctor',
      'Priority',
      'Test Codes',
      'Test Names',
      'Collection Timestamp',
      'Phlebotomist Name',
      'Storage / Transport Temp',
      'Dispatch Batch #',
      'Courier Transporter',
      'Box Seal #',
      'Air Waybill #',
      'Collection Centre Code',
      'Collection Centre Name',
      'Centre City'
    ];

    const rows = extractData.records.map(r => [
      `"${r.barcodePayload}"`,
      `"${r.tubeNumber}"`,
      `"${r.tubeType}"`,
      `"${r.sampleType}"`,
      `"${r.targetVolume}"`,
      `"${r.patientUhid}"`,
      `"${r.patientName.replace(/"/g, '""')}"`,
      r.patientAge,
      `"${r.patientGender}"`,
      `"${r.patientMobile}"`,
      `"${r.fastingStatus || 'Not Specified'}"`,
      `"${(r.clinicalHistory || 'None').replace(/"/g, '""')}"`,
      `"${r.orderNumber}"`,
      `"${r.orderDate}"`,
      `"${(r.doctorName || 'Self / Walk-in').replace(/"/g, '""')}"`,
      `"${r.priority.toUpperCase()}"`,
      `"${r.tests.map(t => t.code).join('; ')}"`,
      `"${r.tests.map(t => t.name).join('; ').replace(/"/g, '""')}"`,
      `"${r.collectionTime}"`,
      `"${r.collectedBy}"`,
      `"${r.storageCondition}"`,
      `"${r.dispatchBatchNumber || 'Pending Batch'}"`,
      `"${r.transporterName || 'Pending Transporter'}"`,
      `"${r.sealNumber || 'N/A'}"`,
      `"${r.dispatchBatchId || 'N/A'}"`,
      `"${extractData.centre.code}"`,
      `"${extractData.centre.name.replace(/"/g, '""')}"`,
      `"${extractData.centre.city}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CENTRAL_LAB_EXTRACT_${extractData.centre.code}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Central Lab accession CSV downloaded successfully!', 'success');
  };

  // Download Machine-Readable JSON
  const handleDownloadJson = () => {
    if (!extractData) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(extractData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `CENTRAL_LAB_PAYLOAD_${extractData.centre.code}_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Central Lab structured JSON payload downloaded!', 'success');
  };

  const handleCopyJson = () => {
    if (!extractData) return;
    navigator.clipboard.writeText(JSON.stringify(extractData, null, 2));
    setCopied(true);
    showNotification('JSON payload copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // IF ROLE DOES NOT HAVE ACCESS: RENDER ROLE ACCESS RESTRICTION UI
  if (!canExtract) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl mx-auto my-6 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Role-Based Access Control Notice</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Central Lab Data Extract Authorization Required
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You are currently browsing as <strong>{currentUser.name}</strong> with the assigned role of <strong>{currentUser.title}</strong>.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-700 space-y-3">
          <div className="font-bold text-slate-800 flex items-center space-x-1.5">
            <KeyRound className="w-4 h-4 text-purple-600" />
            <span>Authorized Roles for Central Lab Data Extraction:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { role: 'centre_admin' as UserRole, title: 'Centre Admin / Lab In-Charge' },
              { role: 'dispatch_officer' as UserRole, title: 'Logistics & Dispatch Officer' },
              { role: 'lab_coordinator' as UserRole, title: 'Central Lab Coordinator' }
            ].map(r => (
              <div key={r.role} className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                <div className="font-bold text-slate-800 text-[11px]">{r.title}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Access Granted</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Data extraction generates sensitive patient diagnostic requisitions and barcode manifests formatted specifically for direct Central Reference Lab analyzer ingestion.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => selectRole('lab_coordinator')}
            className="w-full sm:w-auto py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Switch to Lab Coordinator Role</span>
          </button>

          <button
            onClick={() => selectRole('centre_admin')}
            className="w-full sm:w-auto py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Switch to Centre Admin Role</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                <FlaskConical className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-slate-900">
                    Central Reference Laboratory Data Extract
                  </h1>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Import Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Export collection centre specimen accession records formatted for Central Lab LIMS & analyzer intake
                </p>
              </div>
            </div>
          </div>

          {/* Export Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadCsv}
              disabled={loading || !extractData || extractData.records.length === 0}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handleDownloadJson}
              disabled={loading || !extractData}
              className="py-2 px-3.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
              <span>Download JSON</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={loading || !extractData}
              className="py-2 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Handover Dossier</span>
            </button>

            <button
              onClick={fetchExtract}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs transition-colors cursor-pointer"
              title="Refresh Extract Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Filter by Courier Dispatch Batch:
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="all">All Batches & Pending Specimens</option>
              {extractData?.dispatches?.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch #{b.batchNumber} • {b.transporterName} ({b.tubeIds?.length || 0} tubes)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Specimen Status:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="all">All Specimens (Collected & Dispatched)</option>
              <option value="ready_for_dispatch">Ready for Dispatch (Cold Pack / Sealed)</option>
              <option value="dispatched">In Transit / Dispatched to Central Lab</option>
              <option value="collected">Collected at Phlebotomy</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Search Specimens:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search UHID, Barcode, Patient, Test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Aggregate KPI Badges */}
        {extractData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Total Specimens</span>
              <span className="text-base font-extrabold text-slate-900">{extractData.summary.totalTubes}</span>
            </div>
            <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg">
              <span className="text-[11px] text-blue-700 block">Cold Chain (2-8°C)</span>
              <span className="text-base font-extrabold text-blue-900">{extractData.summary.coldChainCount}</span>
            </div>
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
              <span className="text-[11px] text-amber-700 block">Ambient (15-25°C)</span>
              <span className="text-base font-extrabold text-amber-900">{extractData.summary.ambientCount}</span>
            </div>
            <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg">
              <span className="text-[11px] text-purple-700 block">Total Tests Mapped</span>
              <span className="text-base font-extrabold text-purple-900">{extractData.summary.totalTestsRequested}</span>
            </div>
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <span className="text-[11px] text-emerald-700 block">Unique Patients</span>
              <span className="text-base font-extrabold text-emerald-900">{extractData.summary.totalPatients}</span>
            </div>
            <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg">
              <span className="text-[11px] text-rose-700 block">STAT Emergencies</span>
              <span className="text-base font-extrabold text-rose-900">
                {extractData.records.filter(r => r.priority === 'stat').length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'preview' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Specimen Accession Grid ({filteredRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('printable')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'printable' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Central Lab Handover Manifest
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'json' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Raw JSON Schema Payload
        </button>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Generating Central Lab extract dataset...</p>
        </div>
      ) : activeTab === 'preview' ? (
        /* Specimen Grid */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Specimen Barcode / Tube</th>
                  <th className="py-3 px-4">Patient Demographics</th>
                  <th className="py-3 px-4">Tests Ordered for Central Lab</th>
                  <th className="py-3 px-4">Collection & Storage</th>
                  <th className="py-3 px-4">Dispatch / Courier Batch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No specimen records found matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.tubeId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                            {r.barcodePayload}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-700">
                            {r.tubeType}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Vol: {r.targetVolume} • Sample: {r.sampleType}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{r.patientName}</div>
                          <div className="text-[11px] text-slate-600">
                            {r.patientUhid} • {r.patientAge}y / {r.patientGender}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Fasting: <span className="font-semibold text-slate-700">{r.fastingStatus || 'Not Specified'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {r.tests.map(t => (
                              <span 
                                key={t.code} 
                                className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold px-1.5 py-0.5 rounded"
                              >
                                {t.code}
                              </span>
                            ))}
                          </div>
                          <div className="text-[11px] text-slate-600 line-clamp-1">
                            {r.tests.map(t => t.name).join(', ')}
                          </div>
                          {r.priority === 'stat' && (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-rose-200">
                              STAT Priority
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center space-x-1 text-slate-700 font-medium">
                            <Thermometer className="w-3 h-3 text-blue-500" />
                            <span>{r.storageCondition}</span>
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Drawn: {new Date(r.collectionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Tech: {r.collectedBy}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {r.dispatchBatchNumber ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-800 text-xs">
                              #{r.dispatchBatchNumber}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {r.transporterName}
                            </div>
                            {r.sealNumber && (
                              <div className="text-[10px] text-emerald-700 font-mono">
                                Seal: {r.sealNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Awaiting Dispatch Box
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'printable' ? (
        /* Printable Central Lab Manifest */
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm print:border-none print:shadow-none space-y-6">
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Central Reference Laboratory Specimen Intake Manifest
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Accession Handover & Testing Requisition
              </h2>
              <div className="text-xs text-slate-600 mt-1">
                Originating Collection Centre: <strong>{extractData?.centre.name} ({extractData?.centre.code})</strong>
              </div>
              <div className="text-xs text-slate-500">
                Accredited Parent Reference Lab: <strong>{extractData?.centre.parentLabName}</strong>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600 space-y-1">
              <div>Manifest Date: <strong>{new Date().toLocaleDateString()}</strong></div>
              <div>Generated Time: <strong>{new Date().toLocaleTimeString()}</strong></div>
              <div>Authorized By: <strong>{currentUser.name} ({currentUser.title})</strong></div>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2 border-r border-slate-200">#</th>
                <th className="p-2 border-r border-slate-200">Barcode</th>
                <th className="p-2 border-r border-slate-200">Patient & UHID</th>
                <th className="p-2 border-r border-slate-200">Vacutainer</th>
                <th className="p-2 border-r border-slate-200">Test Codes Requested</th>
                <th className="p-2 border-r border-slate-200">Temp</th>
                <th className="p-2 text-center">QC Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.map((r, i) => (
                <tr key={r.tubeId}>
                  <td className="p-2 border-r border-slate-200 text-slate-500">{i + 1}</td>
                  <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-800">{r.barcodePayload}</td>
                  <td className="p-2 border-r border-slate-200">
                    <div className="font-bold">{r.patientName}</div>
                    <div className="text-[10px] text-slate-500">{r.patientUhid} ({r.patientAge}y/{r.patientGender})</div>
                  </td>
                  <td className="p-2 border-r border-slate-200">{r.tubeType}</td>
                  <td className="p-2 border-r border-slate-200 font-semibold">{r.tests.map(t => t.code).join(', ')}</td>
                  <td className="p-2 border-r border-slate-200">{r.storageCondition}</td>
                  <td className="p-2 text-center text-slate-400 font-mono text-[10px]">
                    [ ] Acc. [ ] Rej.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-xs">
            <div className="border border-slate-200 p-4 rounded-lg space-y-4">
              <div className="font-bold text-slate-800 uppercase text-[10px]">
                Collection Centre Dispatch Verification
              </div>
              <div className="text-slate-600 text-xs">
                I hereby certify that all specimens listed above were drawn using sterile aseptic technique, color-coded barcodes verified against patient UHID, and packed in compliant temperature packaging.
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between text-slate-500 text-[11px]">
                <span>Signature: _______________________</span>
                <span>Date: ____________</span>
              </div>
            </div>

            <div className="border border-slate-200 p-4 rounded-lg space-y-4">
              <div className="font-bold text-slate-800 uppercase text-[10px]">
                Central Reference Lab Accession Intake
              </div>
              <div className="text-slate-600 text-xs">
                Specimens received at Central Reference Laboratory accessioning dock. Seal integrity inspected, temperature log verified, and tubes queued for analyzer processing.
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between text-slate-500 text-[11px]">
                <span>Receiver: _______________________</span>
                <span>Time Received: ____________</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Raw JSON tab */
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-auto max-h-[600px] relative">
          <button
            onClick={handleCopyJson}
            className="absolute top-4 right-4 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center space-x-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
          <pre>{JSON.stringify(extractData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
