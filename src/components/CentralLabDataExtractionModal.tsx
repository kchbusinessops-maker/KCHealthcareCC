import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CentralLabExtractPackage, CentralLabExtractRecord, DispatchBatch } from '../types';
import { 
  Download, FileSpreadsheet, FileCode, Printer, Copy, Check, 
  FlaskConical, AlertCircle, CheckCircle2, Search, Filter, 
  Building2, Thermometer, QrCode, ArrowRight, ShieldCheck, X, RefreshCw
} from 'lucide-react';

interface CentralLabDataExtractionModalProps {
  onClose: () => void;
  defaultBatchId?: string;
}

export const CentralLabDataExtractionModal: React.FC<CentralLabDataExtractionModalProps> = ({ 
  onClose,
  defaultBatchId 
}) => {
  const { currentCentre, currentUser, showNotification } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [extractData, setExtractData] = useState<CentralLabExtractPackage | null>(null);
  
  // Filters
  const [selectedBatchId, setSelectedBatchId] = useState<string>(defaultBatchId || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action states
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'printable' | 'json'>('preview');

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
    fetchExtract();
  }, [currentCentre?.id, selectedBatchId, selectedStatus]);

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

  // 1. Download CSV for Central Lab
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
      'Collection Centre Code',
      'Collection Centre Name'
    ];

    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = extractData.records.map(r => [
      escapeCsv(r.barcodePayload),
      escapeCsv(r.tubeNumber),
      escapeCsv(r.tubeType),
      escapeCsv(r.sampleType),
      escapeCsv(r.targetVolume),
      escapeCsv(r.patientUhid),
      escapeCsv(r.patientName),
      escapeCsv(r.patientAge),
      escapeCsv(r.patientGender),
      escapeCsv(r.patientMobile),
      escapeCsv(r.fastingStatus),
      escapeCsv(r.clinicalHistory || 'None'),
      escapeCsv(r.orderNumber),
      escapeCsv(r.orderDate),
      escapeCsv(r.doctorName || 'Self / Direct'),
      escapeCsv(r.priority.toUpperCase()),
      escapeCsv(r.tests.map(t => t.code).join('; ')),
      escapeCsv(r.tests.map(t => t.name).join('; ')),
      escapeCsv(r.collectionTime),
      escapeCsv(r.collectedBy),
      escapeCsv(r.storageCondition),
      escapeCsv(r.dispatchBatchNumber || 'Unbatched'),
      escapeCsv(r.transporterName || 'Pending Courier'),
      escapeCsv(r.sealNumber || 'N/A'),
      escapeCsv(extractData.centre.code),
      escapeCsv(extractData.centre.name)
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Apex_CentralLab_Intake_${extractData.centre.code}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Central Lab accession CSV downloaded successfully', 'success');
  };

  // 2. Download JSON (HL7 / Automated Ingress Format)
  const handleDownloadJson = () => {
    if (!extractData) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(extractData, null, 2)
    )}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Apex_CentralLab_Extract_${extractData.centre.code}_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Central Lab JSON package downloaded', 'success');
  };

  // 3. Copy JSON payload to clipboard
  const handleCopyJson = () => {
    if (!extractData) return;
    navigator.clipboard.writeText(JSON.stringify(extractData, null, 2));
    setCopied(true);
    showNotification('Central Lab JSON payload copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // 4. Print Accessioning Dossier
  const handlePrint = () => {
    window.print();
  };

  if (!currentCentre) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-6xl w-full my-auto shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Central Laboratory Specimen & Test Data Extraction
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-md font-mono border border-emerald-500/30">
                  NABL / ISO 15189 Intake
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Extraction Package for Parent Reference Laboratory: <strong className="text-slate-200">{currentCentre.parentLabName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchExtract}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700 cursor-pointer"
              title="Refresh specimen extraction"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar & Filters */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Scope:</span>
            </div>

            {/* Batch Selector */}
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Batches & Unbatched</option>
              {extractData?.dispatches?.map((b: DispatchBatch) => (
                <option key={b.id} value={b.id}>
                  Batch {b.batchNumber} ({b.totalTubes} tubes • {b.temperatureCategory})
                </option>
              ))}
            </select>

            {/* Specimen Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Specimens (Collected & Dispatched)</option>
              <option value="ready_for_dispatch">Ready for Dispatch Only</option>
              <option value="dispatched">Dispatched / In-Transit Only</option>
              <option value="collected">All Collected (Excl. Pending Draw)</option>
            </select>

            {/* Search within preview */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search barcode, patient, test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
              />
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              disabled={loading || !extractData || extractData.records.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition"
              title="Download CSV for Central Lab Accessioning Desk"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV (Excel)</span>
            </button>

            <button
              onClick={handleDownloadJson}
              disabled={loading || !extractData || extractData.records.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition"
              title="Download structured JSON package for Central Lab analyzer import"
            >
              <FileCode className="w-4 h-4" />
              <span>Export JSON (HL7)</span>
            </button>

            <button
              onClick={handleCopyJson}
              disabled={loading || !extractData || extractData.records.length === 0}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-700 cursor-pointer transition"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={loading || !extractData || extractData.records.length === 0}
              className="bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-slate-300 cursor-pointer transition"
              title="Print Central Lab Sample Handover & Accession Manifest"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>

        {/* KPI Stats Bar */}
        {extractData && (
          <div className="bg-slate-100/80 px-6 py-2.5 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Patients</span>
              <div className="text-base font-bold text-slate-900">{extractData.summary.totalPatients}</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Orders</span>
              <div className="text-base font-bold text-slate-900">{extractData.summary.totalOrders}</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Specimen Tubes</span>
              <div className="text-base font-bold text-indigo-700">{extractData.summary.totalTubes}</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Tests Requested</span>
              <div className="text-base font-bold text-purple-700">{extractData.summary.totalTestsRequested}</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Cold Pack (2-8°C)</span>
              <div className="text-base font-bold text-cyan-700">{extractData.summary.coldChainCount} tubes</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Ambient (15-25°C)</span>
              <div className="text-base font-bold text-slate-700">{extractData.summary.ambientCount} tubes</div>
            </div>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex space-x-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-2.5 border-b-2 transition cursor-pointer ${
                activeTab === 'preview' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Accession Specimen Table ({filteredRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('printable')}
              className={`pb-2.5 border-b-2 transition cursor-pointer ${
                activeTab === 'printable' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Official Handover Dossier Preview
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`pb-2.5 border-b-2 transition cursor-pointer ${
                activeTab === 'json' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              HL7 / Machine JSON Payload
            </button>
          </div>

          <div className="text-[11px] text-slate-500 pb-2 hidden sm:block">
            Centre Code: <span className="font-mono font-bold text-slate-700">{currentCentre.code}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Compiling specimen records for Central Laboratory...</div>
              <p className="text-xs text-slate-400">Aggregating patients, orders, vacutainers, barcodes, and test mappings.</p>
            </div>
          ) : !extractData || extractData.records.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-base font-bold text-slate-800">No Specimen Records Found</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                There are currently no collected sample tubes matching the selected filter criteria. Collect specimens in the Phlebotomy module first.
              </p>
            </div>
          ) : activeTab === 'preview' ? (
            /* TAB 1: INTERACTIVE TABLE PREVIEW */
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px] uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Specimen Barcode & Tube</th>
                        <th className="py-2.5 px-3">Patient Details</th>
                        <th className="py-2.5 px-3">Order & Priority</th>
                        <th className="py-2.5 px-3">Diagnostic Tests</th>
                        <th className="py-2.5 px-3">Collection Time & Phleb</th>
                        <th className="py-2.5 px-3">Storage & Transport</th>
                        <th className="py-2.5 px-3">Batch & Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((rec) => (
                        <tr key={rec.tubeId} className="hover:bg-slate-50/80 transition">
                          {/* Tube Barcode & Cap */}
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <span 
                                className="w-3 h-3 rounded-full shrink-0 border border-slate-300" 
                                style={{ backgroundColor: rec.tubeColorCode }}
                                title={rec.tubeType}
                              />
                              <div>
                                <div className="font-mono font-bold text-slate-900">{rec.barcodePayload}</div>
                                <div className="text-[11px] text-slate-500">{rec.tubeType}</div>
                                <div className="text-[10px] text-slate-400 font-mono">Vol: {rec.targetVolume}</div>
                              </div>
                            </div>
                          </td>

                          {/* Patient */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{rec.patientName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{rec.patientUhid} • {rec.patientAge}y/{rec.patientGender.charAt(0)}</div>
                            <div className="text-[10px] text-indigo-600 font-medium">{rec.fastingStatus}</div>
                          </td>

                          {/* Order */}
                          <td className="py-3 px-3">
                            <div className="font-mono text-slate-800">{rec.orderNumber}</div>
                            <div className="text-[11px] text-slate-500">Ref: {rec.doctorName}</div>
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase mt-0.5 ${
                              rec.priority === 'stat' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {rec.priority}
                            </span>
                          </td>

                          {/* Tests */}
                          <td className="py-3 px-3">
                            <div className="space-y-1 max-w-xs">
                              {rec.tests.map((t, idx) => (
                                <div key={idx} className="flex items-center space-x-1.5">
                                  <span className="bg-purple-100 text-purple-800 px-1 py-0.2 rounded font-mono text-[10px] font-bold">
                                    {t.code}
                                  </span>
                                  <span className="text-[11px] text-slate-700 truncate" title={t.name}>
                                    {t.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Collection */}
                          <td className="py-3 px-3">
                            <div className="text-slate-800 font-medium">
                              {new Date(rec.collectionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(rec.collectionTime).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              By: {rec.collectedBy}
                            </div>
                          </td>

                          {/* Storage */}
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-1 text-slate-700 font-medium">
                              <Thermometer className="w-3.5 h-3.5 text-cyan-600" />
                              <span className="text-[11px]">{rec.storageCondition}</span>
                            </div>
                          </td>

                          {/* Batch & Status */}
                          <td className="py-3 px-3">
                            <div className="font-mono text-[11px] text-slate-700">
                              {rec.dispatchBatchNumber || 'Pending Batch'}
                            </div>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${
                              rec.accessionStatus === 'received' ? 'bg-emerald-100 text-emerald-800' :
                              rec.accessionStatus === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                              rec.accessionStatus === 'ready_for_dispatch' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {rec.accessionStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Central Lab Regulatory Compliance Banner */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-900 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">NABL Pre-Analytical Accession Standard:</span> Every specimen row matches Central Reference Laboratory specimen ingestion requirements. The CSV and JSON files carry primary tube barcodes, patient identifiers, fasting status, and transport thermal parameters to eliminate re-labeling errors.
                </div>
              </div>
            </div>
          ) : activeTab === 'printable' ? (
            /* TAB 2: OFFICIAL PRINTABLE HANDOVER DOSSIER */
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-300 max-w-4xl mx-auto text-slate-900 font-sans space-y-6">
              {/* Dossier Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    CENTRAL REFERENCE LABORATORY SPECIMEN ACCESSION DOSSIER
                  </h1>
                  <div className="text-xs text-slate-600 mt-1">
                    Parent Lab: <strong>{currentCentre.parentLabName}</strong> • Clinical Pathology & Specialized Diagnostics
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div>DOSSIER ID: <strong>EXT-{currentCentre.code}-{Date.now().toString().slice(-6)}</strong></div>
                  <div>DATE: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                </div>
              </div>

              {/* Centre & Logistics Manifest Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400 font-semibold text-[10px] uppercase">ORIGIN CENTRE</div>
                  <div className="font-bold text-slate-900">{currentCentre.name}</div>
                  <div className="text-slate-500 font-mono">Code: {currentCentre.code}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[10px] uppercase">LOGISTICS TRANPORT</div>
                  <div className="font-bold text-slate-900">Apex Cold-Chain Fleet</div>
                  <div className="text-slate-500">Contact: +91 98205 66778</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[10px] uppercase">TOTAL SPECIMENS</div>
                  <div className="font-bold text-slate-900 text-sm">{filteredRecords.length} Tubes</div>
                  <div className="text-slate-500">{extractData.summary.totalPatients} Patients / {extractData.summary.totalOrders} Orders</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[10px] uppercase">TRANSPORT TEMP</div>
                  <div className="font-bold text-cyan-700">2-8°C Insulated Cooler</div>
                  <div className="text-slate-500">Seal Intact Verified</div>
                </div>
              </div>

              {/* Specimen Accession Checklist Table */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
                  Specimens Handover List for Central Lab Ingestion
                </h3>
                <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                    <tr>
                      <th className="p-2 border-r border-slate-200">#</th>
                      <th className="p-2 border-r border-slate-200">Tube Barcode</th>
                      <th className="p-2 border-r border-slate-200">Patient & UHID</th>
                      <th className="p-2 border-r border-slate-200">Tube Type & Specimen</th>
                      <th className="p-2 border-r border-slate-200">Tests Booked</th>
                      <th className="p-2 border-r border-slate-200">Collection Date/Time</th>
                      <th className="p-2 text-center">Lab Accession Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRecords.map((r, i) => (
                      <tr key={r.tubeId} className="text-[11px]">
                        <td className="p-2 border-r border-slate-200 text-slate-500 font-mono">{i + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-bold">{r.barcodePayload}</td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="font-medium">{r.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{r.patientUhid} ({r.patientAge}y/{r.patientGender.charAt(0)})</div>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <div>{r.tubeType}</div>
                          <div className="text-[10px] text-slate-500">{r.sampleType} ({r.targetVolume})</div>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          {r.tests.map(t => t.code).join(', ')}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-mono text-[10px]">
                          {new Date(r.collectionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(r.collectionTime).toLocaleDateString()})
                        </td>
                        <td className="p-2 text-center text-slate-400">
                          <span className="inline-block w-4 h-4 border border-slate-400 rounded-xs"></span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Central Lab Receiving Officer Sign-Off Block */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 text-xs space-y-4">
                <div className="font-bold text-slate-900 uppercase text-[11px]">
                  CENTRAL LABORATORY SPECIMEN RECEPTION & QUALITY CHECK SIGN-OFF
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] text-slate-700">
                  <div>
                    <span className="font-semibold block">Box Temp at Arrival:</span>
                    <span className="text-slate-400 border-b border-slate-300 block pb-1 mt-1">______ °C</span>
                  </div>
                  <div>
                    <span className="font-semibold block">Sample Condition:</span>
                    <span className="text-slate-400 border-b border-slate-300 block pb-1 mt-1">[ ] Pass [ ] Hemolyzed</span>
                  </div>
                  <div>
                    <span className="font-semibold block">Accessioned By (Tech):</span>
                    <span className="text-slate-400 border-b border-slate-300 block pb-1 mt-1">________________</span>
                  </div>
                  <div>
                    <span className="font-semibold block">Date & Time of Receipt:</span>
                    <span className="text-slate-400 border-b border-slate-300 block pb-1 mt-1">________________</span>
                  </div>
                </div>
              </div>

              {/* Print Footer */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 border-t border-slate-200">
                <span>Extracted from Collection Centre Franchise Management System • ISO 15189 Standard</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          ) : (
            /* TAB 3: MACHINE READABLE JSON PAYLOAD */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Direct ingestion payload formatted for Central LIMS / Automated Analyzers:</span>
                <button
                  onClick={handleCopyJson}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Payload</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 border border-slate-800">
                {JSON.stringify(extractData, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Parent Reference Lab: <strong>{currentCentre.parentLabName}</strong></span>
            <span>•</span>
            <span>Accreditation Code: <strong>{currentCentre.code}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadCsv}
              disabled={loading || !extractData || extractData.records.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Central Lab Data Package</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
