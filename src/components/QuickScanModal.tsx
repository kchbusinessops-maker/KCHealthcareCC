import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SampleTube } from '../types';
import { QrCode, Search, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';

interface QuickScanModalProps {
  onClose: () => void;
  onTubeFound: (tube: SampleTube) => void;
}

export const QuickScanModal: React.FC<QuickScanModalProps> = ({ onClose, onTubeFound }) => {
  const { currentCentre, showNotification } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sampleTubes, setSampleTubes] = useState<SampleTube[]>([]);

  React.useEffect(() => {
    if (!currentCentre) return;
    api.getTubes(currentCentre.id).then(tubes => setSampleTubes(tubes.slice(0, 5)));
  }, [currentCentre?.id]);

  const handleLookup = async (codeToLookup?: string) => {
    const val = codeToLookup || code;
    if (!val || !currentCentre) return;
    setLoading(true);
    try {
      const tube = await api.lookupTube(currentCentre.id, val.trim());
      showNotification(`Found Tube ${tube.tubeNumber} (${tube.patientName})`, 'success');
      onTubeFound(tube);
      onClose();
    } catch (err: any) {
      showNotification(err.message || 'No matching tube found for this centre', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Scan QR Code or Barcode</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
        </div>

        <p className="text-xs text-slate-500">
          Point a USB/Bluetooth barcode scanner gun, or enter the printed barcode or QR string manually.
        </p>

        <div className="relative">
          <input
            type="text"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLookup();
            }}
            placeholder="Scan or enter Barcode / Tube #..."
            className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
          />
          <button
            disabled={loading || !code}
            onClick={() => handleLookup()}
            className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition-all"
          >
            <span>{loading ? 'Verifying...' : 'Verify Tube Identity'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick simulation buttons for existing tubes in this centre */}
        {sampleTubes.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Quick Scan Simulation (From Active Centre Queue):
            </span>
            <div className="space-y-1 text-xs">
              {sampleTubes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleLookup(t.tubeNumber)}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.tubeColorCode }} />
                    <span className="font-mono font-bold text-slate-800">{t.tubeNumber}</span>
                    <span className="text-slate-500 text-[11px]">({t.patientName})</span>
                  </div>
                  <span className="text-emerald-700 font-bold text-[11px]">Scan</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
