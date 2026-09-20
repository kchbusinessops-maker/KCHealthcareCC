import React, { useEffect, useState } from 'react';
import { SampleTube } from '../types';
import { generateQrDataUrl, generateBarcodeDataUrl } from '../utils/barcodes';
import { Printer, X, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LabelPrintModalProps {
  tube: SampleTube | null;
  onClose: () => void;
}

export const LabelPrintModal: React.FC<LabelPrintModalProps> = ({ tube, onClose }) => {
  const { currentCentre } = useAuth();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');

  useEffect(() => {
    if (!tube) return;
    const loadCodes = async () => {
      const q = await generateQrDataUrl(tube.qrPayload);
      const b = await generateBarcodeDataUrl(tube.barcodePayload);
      setQrUrl(q);
      setBarcodeUrl(b);
    };
    loadCodes();
  }, [tube]);

  if (!tube) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">Specimen Vacutainer Tube Label</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
            ✕
          </button>
        </div>

        {/* 50mm x 25mm Thermal Label Preview */}
        <div className="bg-slate-100 p-5 rounded-2xl flex items-center justify-center">
          <div 
            id="printable-tube-label"
            className="w-[340px] bg-white border-2 border-slate-900 rounded-lg p-3 shadow-md font-sans text-slate-950 select-none"
          >
            {/* Top row: Patient Name, Age/Sex, Centre Code */}
            <div className="flex items-start justify-between border-b border-slate-900 pb-1">
              <div>
                <div className="font-extrabold text-xs tracking-tight uppercase">{tube.patientName}</div>
                <div className="text-[10px] font-bold">
                  {tube.patientUhid} • {tube.patientGender}/{tube.patientAge}y
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-[9px] font-bold bg-slate-900 text-white px-1 py-0.5 rounded">
                  {currentCentre?.code}
                </span>
                <div className="text-[9px] font-semibold text-slate-600 mt-0.5">
                  {new Date(tube.collectionDate || tube.collectionTime || Date.now()).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Middle row: QR code + Barcode stripes + Tube Type */}
            <div className="flex items-center justify-between py-1.5 gap-2">
              {qrUrl && (
                <img 
                  src={qrUrl} 
                  alt="QR" 
                  className="w-14 h-14 border border-slate-300 rounded shrink-0 p-0.5" 
                />
              )}
              
              <div className="flex-1 flex flex-col items-center">
                {barcodeUrl && (
                  <img 
                    src={barcodeUrl} 
                    alt="Barcode" 
                    className="w-full h-8 object-contain" 
                  />
                )}
                <span className="font-mono font-bold text-[10px] tracking-wider mt-0.5">
                  {tube.tubeNumber}
                </span>
              </div>
            </div>

            {/* Bottom row: Vacutainer Color indicator + Tests */}
            <div className="flex items-center justify-between border-t border-slate-900 pt-1 text-[9px]">
              <div className="flex items-center space-x-1.5 font-bold">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block border border-slate-900" 
                  style={{ backgroundColor: tube.tubeColorCode }}
                />
                <span className="uppercase">{tube.tubeType} ({tube.sampleType})</span>
              </div>
              <div className="font-bold truncate max-w-[130px]" title={tube.tests.map(t => t.name).join(', ')}>
                {tube.tests.map(t => t.code).join('/')}
              </div>
            </div>

          </div>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          Standard 50mm × 25mm barcode label formatted for Zebra, TSC, and Citizen thermal sticker printers.
        </p>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Label</span>
          </button>
        </div>

      </div>
    </div>
  );
};
