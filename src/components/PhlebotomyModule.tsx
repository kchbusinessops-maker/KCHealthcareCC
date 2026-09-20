import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SampleTube, SampleStatus } from '../types';
import { 
  FlaskConical, QrCode, Search, CheckCircle2, AlertTriangle, ShieldCheck, 
  Camera, CameraOff, Clock, User, FileText, CheckSquare, ArrowRight, Printer 
} from 'lucide-react';
import { generateQrDataUrl } from '../utils/barcodes';

interface PhlebotomyModuleProps {
  initialSelectedTube?: SampleTube | null;
  onPrintTubeLabel: (tube: SampleTube) => void;
}

export const PhlebotomyModule: React.FC<PhlebotomyModuleProps> = ({ 
  initialSelectedTube, 
  onPrintTubeLabel 
}) => {
  const { currentCentre, currentUser, effectiveRole, canDo, showNotification } = useAuth();

  const canCollect = canDo('canCollectSamples') || effectiveRole === 'centre_admin' || effectiveRole === 'phlebotomist';
  const canMarkReady = canDo('canCollectSamples') || canDo('canDispatchBatches') || effectiveRole === 'centre_admin' || effectiveRole === 'phlebotomist' || effectiveRole === 'dispatch_officer';
  const canPrintLabels = canDo('canReprintTubeLabels') || canDo('canCollectSamples') || effectiveRole === 'centre_admin' || effectiveRole === 'phlebotomist' || effectiveRole === 'receptionist';

  const [tubes, setTubes] = useState<SampleTube[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending_collection');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Active Verification Modal State
  const [verifiedTube, setVerifiedTube] = useState<SampleTube | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [phlebNotes, setPhlebNotes] = useState('');

  // 3-way verification checklist state
  const [checkPatientId, setCheckPatientId] = useState(false);
  const [checkSpecimenPrep, setCheckSpecimenPrep] = useState(false);
  const [checkTubeBarcodeMatch, setCheckTubeBarcodeMatch] = useState(false);

  // QR / Barcode Scan Input
  const [scanInputCode, setScanInputCode] = useState('');
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadTubes = async () => {
    if (!currentCentre) return;
    setLoading(true);
    try {
      const data = await api.getTubes(currentCentre.id, statusFilter);
      setTubes(data);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load sample tubes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTubes();
  }, [currentCentre?.id, statusFilter]);

  useEffect(() => {
    if (initialSelectedTube) {
      openVerificationModal(initialSelectedTube);
    }
  }, [initialSelectedTube]);

  // Open verification modal for a tube
  const openVerificationModal = async (tube: SampleTube) => {
    setVerifiedTube(tube);
    setPhlebNotes('');
    setCheckPatientId(false);
    setCheckSpecimenPrep(false);
    setCheckTubeBarcodeMatch(false);

    // Generate QR code preview
    const url = await generateQrDataUrl(tube.qrPayload);
    setQrDataUrl(url);
  };

  // Handle QR / Barcode Scan Lookup
  const handleLookupScan = async (codeToLookup?: string) => {
    const code = codeToLookup || scanInputCode;
    if (!code || !currentCentre) {
      showNotification('Please enter or scan a barcode/QR string', 'warning');
      return;
    }

    try {
      const tube = await api.lookupTube(currentCentre.id, code.trim());
      openVerificationModal(tube);
      setScanInputCode('');
      stopCamera();
      showNotification(`Sample Tube ${tube.tubeNumber} successfully verified!`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'No matching tube found for this centre', 'error');
    }
  };

  // Camera video stream control
  const startCamera = async () => {
    setIsScanningCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access unavailable or denied:', err);
      showNotification('Camera access unavailable in preview iframe. You can use hardware scanner guns or quick simulation buttons.', 'info');
      setIsScanningCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanningCamera(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Confirm Sample Collection
  const handleConfirmCollection = async () => {
    if (!verifiedTube || !currentCentre) return;

    if (!checkPatientId || !checkSpecimenPrep || !checkTubeBarcodeMatch) {
      showNotification('Mandatory safety protocol: Please complete all 3 verification checks before drawing sample.', 'warning');
      return;
    }

    try {
      const updated = await api.collectSample(currentCentre.id, verifiedTube.id, phlebNotes);
      showNotification(`Sample ${updated.tubeNumber} confirmed as COLLECTED by ${currentUser.name}!`, 'success');
      setVerifiedTube(null);
      loadTubes();
    } catch (err: any) {
      showNotification(err.message || 'Failed to collect sample', 'error');
    }
  };

  // Mark Ready for Dispatch
  const handleMarkReadyForDispatch = async (tubeId: string) => {
    if (!currentCentre) return;
    try {
      await api.markTubeReady(currentCentre.id, tubeId);
      showNotification('Tube marked as READY FOR DISPATCH to Central Lab cooler box.', 'success');
      if (verifiedTube?.id === tubeId) {
        setVerifiedTube(null);
      }
      loadTubes();
    } catch (err: any) {
      showNotification(err.message || 'Failed to mark ready', 'error');
    }
  };

  // Filtered tubes list
  const filteredTubes = tubes.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.patientName.toLowerCase().includes(q) ||
      t.patientUhid.toLowerCase().includes(q) ||
      t.tubeNumber.toLowerCase().includes(q) ||
      t.barcodePayload.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* Phlebotomy Top Operational Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Phlebotomy & QR Specimen Station
            </span>
            <span className="text-xs text-slate-500 font-mono">{currentCentre?.code}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Sample Collection & 3-Way Verification</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict QR/barcode mapping: <strong className="text-slate-700">Patient → Order → Test → Sample → Tube → Centre</strong>.
          </p>
        </div>

        {/* Rapid Scanner Input & Camera Toggle */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <QrCode className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={scanInputCode}
              onChange={(e) => setScanInputCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookupScan();
              }}
              placeholder="Scan Barcode / QR / Tube #..."
              className="w-full pl-9 pr-16 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-mono"
            />
            <button
              onClick={() => handleLookupScan()}
              className="absolute right-1 top-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
            >
              Verify
            </button>
          </div>

          <button
            onClick={isScanningCamera ? stopCamera : startCamera}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all ${
              isScanningCamera ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Web Camera QR Reader"
          >
            {isScanningCamera ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            <span className="hidden sm:inline">{isScanningCamera ? 'Stop Cam' : 'Camera'}</span>
          </button>
        </div>
      </div>

      {/* Role Notice if not authorized for physical collection */}
      {!canCollect && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Supervisory / Read-Only View:</strong> Current active role is{' '}
              <span className="font-semibold uppercase">{effectiveRole.replace(/_/g, ' ')}</span>. Sample drawing and phlebotomy verification require certified Phlebotomist or Admin authorization.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded">
            Read-Only Mode
          </span>
        </div>
      )}

      {/* Interactive Camera Viewfinder (if open) */}
      {isScanningCamera && (
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 text-white text-center space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Live Camera Scanner Viewfinder</span>
          </div>

          <div className="relative max-w-sm mx-auto aspect-video bg-black rounded-xl overflow-hidden border border-slate-700">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-emerald-400/80 rounded-xl pointer-events-none flex items-center justify-center">
              <div className="w-48 h-32 border border-dashed border-emerald-300/60 rounded-lg"></div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Hold tube barcode or QR sticker steady in front of the lens.
          </div>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'pending_collection', label: 'Pending Collection' },
            { id: 'collected', label: 'Collected' },
            { id: 'ready_for_dispatch', label: 'Ready for Dispatch' },
            { id: 'all', label: 'All Tubes' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter patient, UHID, tube #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Sample Tubes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTubes.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No sample tubes found for the selected status.
          </div>
        ) : (
          filteredTubes.map((tube) => (
            <div
              key={tube.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-xs transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                {/* Header: Tube Color Bar & Number */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div 
                      className="w-3.5 h-10 rounded-sm shadow-xs" 
                      style={{ backgroundColor: tube.tubeColorCode }}
                      title={tube.tubeType}
                    />
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-900">{tube.tubeNumber}</div>
                      <div className="text-[11px] font-semibold text-slate-600">{tube.tubeType}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tube.status === 'collected' ? 'bg-cyan-100 text-cyan-800' :
                    tube.status === 'ready_for_dispatch' ? 'bg-indigo-100 text-indigo-800' :
                    tube.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                    tube.status === 'report_ready' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {tube.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>

                {/* Patient details */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{tube.patientName}</span>
                    <span className="font-mono text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {tube.patientUhid}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {tube.patientGender} • {tube.patientAge} yrs • Order: <span className="font-mono">{tube.orderNumber}</span>
                  </div>
                </div>

                {/* Tests linked to this tube */}
                <div className="mt-2 text-xs">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Assigned Tests:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tube.tests.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {canPrintLabels && (
                  <button
                    onClick={() => onPrintTubeLabel(tube)}
                    className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs flex items-center space-x-1 cursor-pointer"
                    title="Print Sample Label Sticker"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Print</span>
                  </button>
                )}

                {tube.status === 'pending_collection' && (
                  canCollect ? (
                    <button
                      onClick={() => openVerificationModal(tube)}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Verify & Collect</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openVerificationModal(tube)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>View Tube Info</span>
                    </button>
                  )
                )}

                {tube.status === 'collected' && (
                  canMarkReady ? (
                    <button
                      onClick={() => handleMarkReadyForDispatch(tube.id)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Mark Ready for Dispatch</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-cyan-700 font-semibold px-2.5 py-1.5 bg-cyan-50 rounded-lg">
                      Collected (Awaiting dispatch prep)
                    </span>
                  )
                )}

                {tube.status === 'ready_for_dispatch' && (
                  <span className="text-[11px] text-slate-500 font-medium italic">
                    Ready for courier batch
                  </span>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* MANDATORY 3-WAY VERIFICATION & COLLECTION MODAL */}
      {verifiedTube && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Phlebotomy Safety Protocol
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Specimen Identity & Tube Verification
                </h3>
              </div>
              <button
                onClick={() => setVerifiedTube(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* QR Code & Barcode Display */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="Sample QR Code" 
                  className="w-24 h-24 rounded-lg border border-slate-300 bg-white p-1"
                />
              )}
              <div className="text-xs space-y-1 text-center sm:text-left flex-1">
                <div className="font-mono font-bold text-sm text-slate-900">{verifiedTube.tubeNumber}</div>
                <div className="text-slate-600 font-medium">Sample ID: <span className="font-mono">{verifiedTube.sampleId}</span></div>
                <div className="text-slate-500">Order Ref: <span className="font-mono">{verifiedTube.orderNumber}</span></div>
                <div className="text-slate-500">Collection Centre: <span className="font-semibold text-slate-800">{currentCentre?.name}</span></div>
              </div>
            </div>

            {/* Verified Patient Demographics & Tests */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] block">PATIENT NAME</span>
                <span className="font-bold text-slate-900 text-sm">{verifiedTube.patientName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">CENTRE UHID</span>
                <span className="font-mono font-bold text-blue-600">{verifiedTube.patientUhid}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">AGE / GENDER</span>
                <span className="font-semibold text-slate-800">{verifiedTube.patientAge} yrs • {verifiedTube.patientGender}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">VACUTAINER TUBE</span>
                <span className="font-bold text-slate-800">{verifiedTube.tubeType}</span>
              </div>
            </div>

            {/* MANDATORY CHECKLIST */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Mandatory Phlebotomist 3-Way Safety Checklist:
              </label>

              <label className="flex items-start space-x-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={checkPatientId}
                  onChange={(e) => setCheckPatientId(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-slate-800 font-medium">
                  <strong>1. Verified Patient Identity:</strong> Confirmed patient full name and date of birth/age verbally with patient.
                </span>
              </label>

              <label className="flex items-start space-x-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={checkSpecimenPrep}
                  onChange={(e) => setCheckSpecimenPrep(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-slate-800 font-medium">
                  <strong>2. Specimen Preparation:</strong> Verified fasting requirement, water hydration, and patient clinical readiness.
                </span>
              </label>

              <label className="flex items-start space-x-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={checkTubeBarcodeMatch}
                  onChange={(e) => setCheckTubeBarcodeMatch(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-slate-800 font-medium">
                  <strong>3. Barcode / QR Label Match:</strong> Affixed printed label to correct vacutainer tube cap ({verifiedTube.tubeType}).
                </span>
              </label>
            </div>

            {/* Phlebotomist Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phlebotomy Notes (e.g. Draw Site, Vein Quality, Volume Drawn):
              </label>
              <input
                type="text"
                value={phlebNotes}
                onChange={(e) => setPhlebNotes(e.target.value)}
                placeholder="e.g. Left arm antecubital fossa, 4ml drawn, smooth puncture"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setVerifiedTube(null)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>

              {canCollect ? (
                <button
                  disabled={!checkPatientId || !checkSpecimenPrep || !checkTubeBarcodeMatch}
                  onClick={handleConfirmCollection}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 cursor-pointer shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Collection & Log Phlebotomy</span>
                </button>
              ) : (
                <div className="flex-1 text-center py-2.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-xl border border-slate-200">
                  Sample collection confirmation requires Phlebotomist role
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
