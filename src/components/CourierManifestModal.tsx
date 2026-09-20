import React from 'react';
import { DispatchBatch, SampleTube } from '../types';
import { useAuth } from '../context/AuthContext';
import { Printer, Truck, X } from 'lucide-react';

interface CourierManifestModalProps {
  batch: DispatchBatch | null;
  tubes: SampleTube[];
  onClose: () => void;
}

export const CourierManifestModal: React.FC<CourierManifestModalProps> = ({
  batch,
  tubes,
  onClose
}) => {
  const { currentCentre } = useAuth();
  if (!batch || !currentCentre) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">Courier Specimen Dispatch Manifest</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
        </div>

        {/* Printable Courier Manifest Sheet */}
        <div id="printable-manifest" className="border border-slate-300 rounded-2xl p-6 text-xs space-y-4 bg-white select-none">
          <div className="flex justify-between items-start border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-base font-bold text-slate-900 uppercase">{currentCentre.name}</h1>
              <p className="text-slate-600 text-[11px]">Collection Centre Specimen Transfer Document</p>
              <p className="text-slate-400 text-[10px]">Centre Code: {currentCentre.code} • Phone: {currentCentre.phone}</p>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-slate-900 text-sm">{batch.batchNumber}</div>
              <div className="text-slate-500 text-[10px]">
                Date: {new Date(batch.createdDate).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] block">DESTINATION LAB</span>
              <span className="font-bold text-slate-900">{currentCentre.parentLabName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">TRANSPORTER / RUNNER</span>
              <span className="font-bold text-slate-900">{batch.transporterName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">BOX TEMPERATURE</span>
              <span className="font-bold text-blue-700">{batch.temperatureCategory}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">SECURITY SEAL #</span>
              <span className="font-mono font-bold text-slate-900">{batch.sealNumber}</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
              Manifested Specimen Tubes ({batch.totalTubes})
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {batch.tubeIds.map((tid, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-slate-800">#{idx + 1}. {tid}</span>
                  <span className="text-slate-500">Intact • Temperature Verified</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
            <div>
              <div className="border-t border-slate-400 pt-1 text-center font-semibold text-slate-700">
                Centre Phlebotomy Dispatcher
              </div>
              <div className="text-[10px] text-slate-400 text-center mt-0.5">Date & Signature</div>
            </div>

            <div>
              <div className="border-t border-slate-400 pt-1 text-center font-semibold text-slate-700">
                Central Lab Ingress Receiver
              </div>
              <div className="text-[10px] text-slate-400 text-center mt-0.5">Seal Verified & Temperature OK</div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Manifest</span>
          </button>
        </div>

      </div>
    </div>
  );
};
