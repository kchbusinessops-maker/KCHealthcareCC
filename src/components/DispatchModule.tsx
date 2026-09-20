import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DispatchBatch, SampleTube } from '../types';
import { 
  Truck, Plus, QrCode, CheckCircle2, Send, Clock, ShieldCheck, 
  Printer, ArrowRight, PackageCheck, AlertCircle, RefreshCw, FileSpreadsheet
} from 'lucide-react';

interface DispatchModuleProps {
  onPrintDispatchManifest: (batch: DispatchBatch, tubes: SampleTube[]) => void;
  onExtractCentralLabData?: (batchId?: string) => void;
}

export const DispatchModule: React.FC<DispatchModuleProps> = ({ 
  onPrintDispatchManifest,
  onExtractCentralLabData 
}) => {
  const { currentCentre, currentUser, effectiveRole, canDo, showNotification } = useAuth();

  const canCreateBatch = canDo('canDispatchBatches') || effectiveRole === 'centre_admin' || effectiveRole === 'dispatch_officer';
  const canDispatch = canDo('canDispatchBatches') || effectiveRole === 'centre_admin' || effectiveRole === 'dispatch_officer';
  const canPrintManifest = canDo('canDispatchBatches') || canDo('canReprintTubeLabels') || effectiveRole === 'centre_admin' || effectiveRole === 'dispatch_officer';

  const [batches, setBatches] = useState<DispatchBatch[]>([]);
  const [readyTubes, setReadyTubes] = useState<SampleTube[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<DispatchBatch | null>(null);
  const [loading, setLoading] = useState(false);

  // New Batch Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBatchForm, setNewBatchForm] = useState({
    transporterName: 'Apex Diagnostic Specimen Logistics Fleet #2',
    courierContact: '+91 98205 66778',
    trackingNumber: `TRK-APEX-${Date.now().toString().slice(-5)}`,
    temperatureCategory: '2-8°C (Cold Pack)' as 'Ambient' | '2-8°C (Cold Pack)' | 'Frozen (-20°C)',
    sealNumber: `SEAL-${Math.floor(1000 + Math.random() * 9000)}`,
    notes: 'Transport in certified biohazard temperature controlled cooler box.'
  });

  // Tube scanning into batch
  const [scanTubeCode, setScanTubeCode] = useState('');

  const loadData = async () => {
    if (!currentCentre) return;
    setLoading(true);
    try {
      const [bList, tList] = await Promise.all([
        api.getDispatches(currentCentre.id),
        api.getTubes(currentCentre.id, 'ready_for_dispatch')
      ]);
      setBatches(bList);
      setReadyTubes(tList);
      if (bList.length > 0 && !selectedBatch) {
        setSelectedBatch(bList[0]);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to load dispatches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCentre?.id]);

  const handleCreateBatch = async () => {
    if (!currentCentre) return;
    try {
      const batch = await api.createDispatchBatch(currentCentre.id, newBatchForm);
      showNotification(`Dispatch Manifest ${batch.batchNumber} created!`, 'success');
      setShowCreateModal(false);
      await loadData();
      setSelectedBatch(batch);
    } catch (err: any) {
      showNotification(err.message || 'Failed to create batch', 'error');
    }
  };

  const handleAddTubeToBatch = async (codeToAdd?: string) => {
    const code = codeToAdd || scanTubeCode;
    if (!code || !selectedBatch || !currentCentre) return;

    try {
      const res = await api.addTubeToDispatch(currentCentre.id, selectedBatch.id, code.trim());
      showNotification(`Added tube ${res.tube.tubeNumber} to batch! (Total: ${res.batch.totalTubes})`, 'success');
      setScanTubeCode('');
      await loadData();
      // Update local selected batch
      setSelectedBatch(res.batch);
    } catch (err: any) {
      showNotification(err.message || 'Error adding tube to dispatch', 'error');
    }
  };

  const handleSendDispatch = async (batchId: string) => {
    if (!currentCentre) return;
    try {
      const batch = await api.sendDispatch(currentCentre.id, batchId);
      showNotification(`Batch ${batch.batchNumber} dispatched to Parent Lab LIMS!`, 'success');
      await loadData();
      setSelectedBatch(batch);
    } catch (err: any) {
      showNotification(err.message || 'Failed to dispatch batch', 'error');
    }
  };

  // Get tubes belonging to currently selected batch
  const batchTubes = selectedBatch
    ? readyTubes.filter(t => selectedBatch.tubeIds.includes(t.id))
    : [];

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Specimen Logistics & Transport
            </span>
            <span className="text-xs text-slate-500 font-mono">{currentCentre?.code}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Dispatch Batches to Central Lab</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pack verified sample tubes, seal biohazard cooler box, and dispatch via courier runner to Parent Lab LIMS.
          </p>
        </div>

        {canCreateBatch && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Dispatch Manifest</span>
            </button>
          </div>
        )}
      </div>

      {/* Role Notice if not authorized for dispatch creation/handover */}
      {!canCreateBatch && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Supervisory / Read-Only View:</strong> Current active role is{' '}
              <span className="font-semibold uppercase">{effectiveRole.replace(/_/g, ' ')}</span>. Manifest generation and courier handover are restricted to Logistics/Dispatch officers and Admins.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded">
            Read-Only Mode
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: List of Dispatch Batches */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Dispatch Manifests ({batches.length})</h3>
            <button onClick={loadData} className="text-slate-400 hover:text-slate-600 p-1">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {batches.map((batch) => (
              <div
                key={batch.id}
                onClick={() => setSelectedBatch(batch)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedBatch?.id === batch.id
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{batch.batchNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    batch.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                    batch.status === 'received_at_lims' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {batch.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>

                <div className="text-slate-600 font-medium mt-1">
                  Runner: {batch.transporterName}
                </div>

                <div className="text-slate-500 text-[11px] mt-1 flex items-center justify-between">
                  <span>Tubes: <strong className="text-slate-900">{batch.totalTubes}</strong></span>
                  <span>Temp: {batch.temperatureCategory}</span>
                </div>

                <div className="text-[10px] text-slate-400 mt-1">
                  Created: {new Date(batch.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Selected Dispatch Batch Operations */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
          {selectedBatch ? (
            <div className="space-y-4">
              
              {/* Batch Manifest Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-slate-900 font-mono">{selectedBatch.batchNumber}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      selectedBatch.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                      selectedBatch.status === 'received_at_lims' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedBatch.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Destination: <strong className="text-slate-700">{currentCentre?.parentLabName}</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {onExtractCentralLabData && (
                    <button
                      onClick={() => onExtractCentralLabData(selectedBatch.id)}
                      className="py-1.5 px-3 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                      title="Extract specimen accession data for Central Laboratory"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Extract for Central Lab</span>
                    </button>
                  )}

                  {canPrintManifest && (
                    <button
                      onClick={() => onPrintDispatchManifest(selectedBatch, batchTubes)}
                      className="py-1.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Manifest</span>
                    </button>
                  )}

                  {selectedBatch.status === 'draft' && canDispatch && (
                    <button
                      disabled={selectedBatch.totalTubes === 0}
                      onClick={() => handleSendDispatch(selectedBatch.id)}
                      className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Close & Dispatch</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Courier & Temperature Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">TRANSPORTER</span>
                  <span className="font-semibold text-slate-800">{selectedBatch.transporterName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">COURIER CONTACT</span>
                  <span className="font-semibold text-slate-800">{selectedBatch.courierContact || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">BOX TEMPERATURE</span>
                  <span className="font-semibold text-blue-700">{selectedBatch.temperatureCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">SECURITY SEAL #</span>
                  <span className="font-mono font-bold text-slate-800">{selectedBatch.sealNumber}</span>
                </div>
              </div>

              {/* SCAN TUBES INTO THIS BATCH (if draft) */}
              {selectedBatch.status === 'draft' && (
                canCreateBatch ? (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-900 flex items-center space-x-1.5">
                        <QrCode className="w-4 h-4 text-blue-600" />
                        <span>Scan Tubes into Dispatch Manifest</span>
                      </span>
                      <span className="text-[11px] text-blue-700 font-semibold">
                        Live Tube Count: {selectedBatch.totalTubes}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={scanTubeCode}
                        onChange={(e) => setScanTubeCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTubeToBatch();
                        }}
                        placeholder="Scan tube barcode sticker or enter Tube ID..."
                        className="flex-1 p-2 text-xs border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <button
                        onClick={() => handleAddTubeToBatch()}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Add Tube
                      </button>
                    </div>

                    {/* Ready to pack quick list */}
                    {readyTubes.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">
                          Quick Add Collected Tubes Ready for Dispatch:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-24 overflow-y-auto">
                          {readyTubes.filter(t => !selectedBatch.tubeIds.includes(t.id)).map((t) => (
                            <button
                              key={t.id}
                              onClick={() => handleAddTubeToBatch(t.tubeNumber)}
                              className="bg-white hover:bg-blue-100 text-slate-700 border border-slate-300 px-2 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors flex items-center space-x-1"
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.tubeColorCode }} />
                              <span>{t.tubeNumber}</span>
                              <span className="text-blue-600 font-bold">+</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                    Specimen packaging and tube assignment into manifest is restricted to Dispatch and Admin staff.
                  </div>
                )
              )}

              {/* TUBES IN THIS BATCH MANIFEST */}
              <div>
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                  Manifested Specimen Tubes ({selectedBatch.totalTubes})
                </h4>

                {selectedBatch.totalTubes === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    No sample tubes scanned into this dispatch batch yet. Use the scanner above to add collected tubes.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {selectedBatch.tubeIds.map((tid, idx) => (
                      <div key={tid} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-slate-400 text-[10px]">#{idx + 1}</span>
                          <span className="font-mono font-bold text-slate-900">{tid}</span>
                        </div>
                        <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Manifested
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">
              Select a dispatch batch from the left panel or click "New Dispatch Manifest".
            </div>
          )}

          {/* Bottom Security Note */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Transport bags must be temperature logged and barcode cross-checked.</span>
            <span className="font-mono text-slate-600">Parent Lab Ingress Gateway Active</span>
          </div>

        </div>

      </div>

      {/* CREATE DISPATCH BATCH MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Dispatch Manifest</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Transporter / Courier Name</label>
                <input
                  type="text"
                  value={newBatchForm.transporterName}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, transporterName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Courier Contact #</label>
                  <input
                    type="text"
                    value={newBatchForm.courierContact}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, courierContact: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={newBatchForm.trackingNumber}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, trackingNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Transport Temperature</label>
                  <select
                    value={newBatchForm.temperatureCategory}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, temperatureCategory: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="2-8°C (Cold Pack)">2-8°C (Cold Pack)</option>
                    <option value="Ambient">Ambient (Room Temp)</option>
                    <option value="Frozen (-20°C)">Frozen (-20°C)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Security Seal Tag #</label>
                  <input
                    type="text"
                    value={newBatchForm.sealNumber}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, sealNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Manifest Notes</label>
                <input
                  type="text"
                  value={newBatchForm.notes}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBatch}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
              >
                Create Manifest
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
