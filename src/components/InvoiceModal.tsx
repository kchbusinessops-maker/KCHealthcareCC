import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { generateBarcodeDataUrl } from '../utils/barcodes';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const { currentCentre } = useAuth();
  const [barcodeUrl, setBarcodeUrl] = useState('');

  useEffect(() => {
    if (!order) return;
    generateBarcodeDataUrl(order.orderNumber).then(setBarcodeUrl);
  }, [order]);

  if (!order || !currentCentre) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Diagnostic Patient Tax Invoice</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
            ✕
          </button>
        </div>

        {/* Printable Official Invoice Layout */}
        <div id="printable-invoice" className="border border-slate-300 rounded-2xl p-6 text-xs space-y-4 bg-white select-none">
          
          {/* Header & Logo */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                {currentCentre.name}
              </h1>
              <p className="text-[11px] font-semibold text-blue-700">
                Authorised Franchise Centre of {currentCentre.parentLabName}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {currentCentre.address} • Phone: {currentCentre.phone}
              </p>
              <p className="text-[10px] text-slate-400">
                GSTIN: 27AABCA1234F1Z8 • Centre Code: {currentCentre.code}
              </p>
            </div>

            <div className="text-right">
              {barcodeUrl && (
                <img src={barcodeUrl} alt="Order Barcode" className="h-9 w-40 object-contain ml-auto" />
              )}
              <div className="font-mono font-bold text-slate-800 text-xs mt-1">{order.orderNumber}</div>
              <div className="text-[10px] text-slate-400">
                Date: {new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>

          {/* Patient Details Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] block">PATIENT NAME</span>
              <span className="font-bold text-slate-900">{order.patientName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">CENTRE UHID</span>
              <span className="font-mono font-bold text-blue-600">{order.patientUhid}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">AGE / GENDER</span>
              <span className="font-semibold text-slate-800">{order.patientAge} yrs / {order.patientGender}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">REFERRING DOCTOR</span>
              <span className="font-semibold text-slate-800">{order.referringDoctor || 'Self'}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2">#</th>
                <th className="py-2">Test / Profile Description</th>
                <th className="py-2">Specimen & Tube</th>
                <th className="py-2 text-right">Rate (₹)</th>
                <th className="py-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={idx} className="py-2">
                  <td className="py-2 text-slate-400">{idx + 1}</td>
                  <td className="py-2 font-bold text-slate-900">
                    {item.testName} <span className="font-mono text-[10px] text-slate-400 font-normal">({item.testCode})</span>
                  </td>
                  <td className="py-2 text-slate-600 text-[11px]">
                    {item.sampleType} • {item.requiredTube}
                  </td>
                  <td className="py-2 text-right text-slate-700">₹{item.price.toLocaleString()}</td>
                  <td className="py-2 text-right font-semibold text-slate-900">₹{item.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Breakdown */}
          <div className="border-t border-slate-200 pt-3 flex justify-end">
            <div className="w-64 space-y-1.5 text-slate-600 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount ({order.discountPercentage}%):</span>
                  <span>-₹{order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Net Total:</span>
                <span>₹{order.netAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Amount Paid ({order.paymentMode.toUpperCase()}):</span>
                <span>₹{order.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Balance Due:</span>
                <span>₹{(order.balanceDue ?? order.balanceAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
            <div>
              <span>Generated at {currentCentre.name}. All diagnostic investigations performed at accredited Parent Lab.</span>
              <div className="mt-0.5">Payment Status: <strong className="text-emerald-700 uppercase">{order.paymentStatus}</strong></div>
            </div>
            <div className="text-right">
              <span className="border-t border-slate-400 pt-1 px-4 inline-block font-medium text-slate-600">
                Authorized Signatory
              </span>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>

      </div>
    </div>
  );
};
