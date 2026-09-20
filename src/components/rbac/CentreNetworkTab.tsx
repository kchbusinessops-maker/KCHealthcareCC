import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Centre } from '../../types';
import { 
  Building2, Plus, Wallet, ShieldCheck, CheckCircle2, 
  ArrowRight, Users, MapPin, Phone, Mail, Award
} from 'lucide-react';

export const CentreNetworkTab: React.FC = () => {
  const { centres, currentCentre, selectCentre, openCreateCentreModal, staffUsers } = useAuth();

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Franchise Collection Centre Network Oversight
              </h2>
              <p className="text-xs text-slate-500">
                As Centre Administrator, manage security isolation, B2B deposit balances, and staff across all regional collection centres.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateCentreModal}
          className="text-xs px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Collection Centre</span>
        </button>
      </div>

      {/* Grid of Collection Centres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centres.map((centre) => {
          const isSelected = currentCentre?.id === centre.id;
          const isLowBalance = centre.walletBalance < centre.walletLowBalanceThreshold;

          return (
            <div
              key={centre.id}
              className={`rounded-2xl border transition-all p-6 bg-white shadow-sm flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-base text-slate-900">{centre.name}</h3>
                      <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                        {centre.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{centre.city}, {centre.address}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </span>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Prepaid Wallet</div>
                    <div className={`font-mono font-bold text-sm mt-0.5 ${
                      isLowBalance ? 'text-amber-600' : 'text-slate-900'
                    }`}>
                      ₹{centre.walletBalance.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Min: ₹{centre.walletLowBalanceThreshold}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Commercial Share</div>
                    <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                      {Math.round((centre.franchiseCommercialRate || 0.65) * 100)}%
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Lab Discount: {Math.round((1 - (centre.franchiseCommercialRate || 0.65)) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Parent Lab Info */}
                <div className="text-[11px] text-slate-500 space-y-1 mb-4">
                  <div className="flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Parent Lab: <strong className="text-slate-700">{centre.parentLabName}</strong></span>
                  </div>
                  {centre.phone && (
                    <div className="flex items-center space-x-1.5 text-slate-400 font-mono">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{centre.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100">
                {isSelected ? (
                  <div className="w-full py-2 px-3 text-center text-xs font-bold text-blue-600 bg-blue-50 rounded-xl border border-blue-200">
                    Currently Managing this Centre
                  </div>
                ) : (
                  <button
                    onClick={() => selectCentre(centre.id)}
                    className="w-full py-2 px-3 text-center text-xs font-bold text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-900 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Switch Governance to this Centre</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
