import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardMetrics, SampleTube, Order } from '../types';
import { 
  Users, ShoppingBag, FlaskConical, IndianRupee, Wallet, Clock, 
  CheckCircle, Truck, Send, FileCheck, FileClock, Plus, QrCode, 
  AlertCircle, ArrowRight, RefreshCw, Sparkles, Filter, ExternalLink,
  FileSpreadsheet, Download, Shield, UserCheck
} from 'lucide-react';
import { getRoleBadge, hasPermission } from '../utils/rbac';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenQuickScan: () => void;
  onOpenWalletRecharge: () => void;
  onOpenUniversalSearch: () => void;
  onOpenCentralLabExtract: () => void;
  onSelectOrderToView: (orderId: string) => void;
  onSelectTubeToVerify: (tube: SampleTube) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onOpenQuickScan,
  onOpenWalletRecharge,
  onOpenUniversalSearch,
  onOpenCentralLabExtract,
  onSelectOrderToView,
  onSelectTubeToVerify
}) => {
  const { currentCentre, currentUser, effectiveRole, simulatedRole, setSimulatedRole, canDo, showNotification } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pendingTubes, setPendingTubes] = useState<SampleTube[]>([]);
  const [collectedTubes, setCollectedTubes] = useState<SampleTube[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!currentCentre) return;
    setLoading(true);
    try {
      const [m, tubes, collected, orders, batchList] = await Promise.all([
        api.getDashboard(currentCentre.id),
        api.getTubes(currentCentre.id, 'pending_collection'),
        api.getTubes(currentCentre.id, 'collected'),
        api.getOrders(currentCentre.id),
        api.getDispatches(currentCentre.id)
      ]);
      setMetrics(m);
      setPendingTubes(tubes.slice(0, 8));
      setCollectedTubes(collected.slice(0, 8));
      setRecentOrders(orders.slice(0, 8));
      setDispatches(batchList.slice(0, 8));
    } catch (err: any) {
      showNotification(err.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentCentre?.id]);

  if (!currentCentre) return null;

  // Role-specific operational configuration
  const roleContextConfig = {
    centre_admin: {
      title: 'Executive Collection Centre Command',
      subtitle: '360° Supervisory view of financial revenue, franchise deposit wallet, staff governance, and end-to-end sample chain of custody.',
      themeBadge: 'bg-purple-600 text-white',
      badgeBorder: 'border-purple-500/30'
    },
    receptionist: {
      title: 'Front Desk Reception & Patient Intake Desk',
      subtitle: 'Focused on walk-in patient registrations, diagnostic billing, payment collections, and sample handoffs to phlebotomy.',
      themeBadge: 'bg-blue-600 text-white',
      badgeBorder: 'border-blue-500/30'
    },
    phlebotomist: {
      title: 'Phlebotomy Station & Clinical Specimen Bay',
      subtitle: 'Focused on patient venipuncture, BD Vacutainer cap color verification, fasting protocol validation, and barcode scanning.',
      themeBadge: 'bg-amber-600 text-white',
      badgeBorder: 'border-amber-500/30'
    },
    dispatch_officer: {
      title: 'Specimen Logistics & Cold-Chain Dispatch Hub',
      subtitle: 'Focused on cooler box packing (2-8°C / Frozen / Ambient), batch consolidation, tamper-evident security seals, and courier manifests.',
      themeBadge: 'bg-cyan-600 text-white',
      badgeBorder: 'border-cyan-500/30'
    },
    lab_coordinator: {
      title: 'Central Reference Laboratory Liaison Desk',
      subtitle: 'Focused on Central Lab accessioning extraction, STAT specimen tracking, diagnostic report verification, and critical lab values.',
      themeBadge: 'bg-indigo-600 text-white',
      badgeBorder: 'border-indigo-500/30'
    }
  }[effectiveRole] || {
    title: 'Diagnostic Operations Hub',
    subtitle: 'Manage collection centre operations as per assigned role privileges.',
    themeBadge: 'bg-slate-700 text-white',
    badgeBorder: 'border-slate-500/30'
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Centre Context */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white border border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-500/30">
              {currentCentre.code} Active Operations
            </span>
            <span className="text-xs text-slate-400">Diagnostic Franchise Station</span>
          </div>
          <h1 className="text-2xl font-bold mt-1 text-white tracking-tight">
            {currentCentre.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Parent Laboratory: <strong className="text-white">{currentCentre.parentLabName}</strong>. 
            All specimen logistics, barcoded tube tracking, and report handoffs are isolated to this collection centre.
          </p>
        </div>

        {/* Quick Refresh & LIMS Status button */}
        <div className="flex items-center space-x-2 self-stretch sm:self-auto">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-700 cursor-pointer transition-all"
            title="Refresh Centre KPIs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenCentralLabExtract}
            className="flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-all"
            title="Extract accession data of collection centre for Central Reference Laboratory"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-200" />
            <span>Extract Central Lab Data</span>
          </button>
        </div>
      </div>

      {/* Low Wallet Balance Warning Banner */}
      {metrics?.walletLowBalance && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 bg-amber-50">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-amber-800">Franchise Wallet Balance Low (₹{metrics.walletBalance.toLocaleString()})</div>
              <div className="text-xs text-amber-700">
                Minimum operational buffer is ₹{currentCentre.walletLowBalanceThreshold.toLocaleString()}. Central Lab B2B franchise fee deductions may fail for upcoming orders if balance is exhausted.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenWalletRecharge}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm"
          >
            Recharge Wallet Now
          </button>
        </div>
      )}

      {/* Role-Based Access & Station Context Hub */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className={`p-3 rounded-xl ${roleContextConfig.themeBadge} shadow-sm shrink-0`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Staff Member:</span>
                <span className="text-sm font-bold text-slate-900">{currentUser.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(effectiveRole).badgeBg} ${getRoleBadge(effectiveRole).badgeText} ${getRoleBadge(effectiveRole).badgeBorder}`}>
                  {getRoleBadge(effectiveRole).title}
                </span>
                {simulatedRole && (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                    Simulating: {simulatedRole.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-800 mt-0.5">
                {roleContextConfig.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                {roleContextConfig.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {simulatedRole && (
              <button
                onClick={() => setSimulatedRole(null)}
                className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Exit Simulation
              </button>
            )}

            {canDo('canAssignRoles') && (
              <button
                onClick={() => setActiveTab('staff_roles')}
                className="py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Staff & RBAC Matrix</span>
              </button>
            )}

            {canDo('canExtractCentralLabData') && (
              <button
                onClick={onOpenCentralLabExtract}
                className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5 text-indigo-200" />
                <span>Central Lab Extract</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS - Filtered by Assigned Role */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Station Quick Actions ({getRoleBadge(effectiveRole).title})
          </h2>
          <span className="text-[11px] text-slate-400">
            Filtered by active role privileges
          </span>
        </div>

        {/* Action button sets per role */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {effectiveRole === 'receptionist' && (
            <>
              <button
                id="qa-new-order"
                onClick={() => setActiveTab('new_order')}
                className="flex flex-col items-center justify-center p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">New Order / Walk-in</span>
                <span className="text-[11px] text-blue-100 mt-0.5">Register & Bill Tests</span>
              </button>

              <button
                onClick={() => setActiveTab('patients')}
                className="flex flex-col items-center justify-center p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Patient Registry</span>
                <span className="text-[11px] text-emerald-100 mt-0.5">Lookup & Register</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className="flex flex-col items-center justify-center p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Orders & Invoices</span>
                <span className="text-[11px] text-indigo-100 mt-0.5">Print Bills & Receipts</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className="flex flex-col items-center justify-center p-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Diagnostic Reports</span>
                <span className="text-[11px] text-purple-100 mt-0.5">Check Ready Reports</span>
              </button>

              <button
                onClick={onOpenUniversalSearch}
                className="flex flex-col items-center justify-center p-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center border border-slate-700"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mb-2 group-hover:bg-slate-600">
                  <QrCode className="w-5 h-5 text-blue-400" />
                </div>
                <span className="font-bold text-sm">Lookup Tube ID</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Universal Barcode Find</span>
              </button>
            </>
          )}

          {effectiveRole === 'phlebotomist' && (
            <>
              <button
                onClick={() => setActiveTab('phlebotomy')}
                className="flex flex-col items-center justify-center p-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <FlaskConical className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Phlebotomy Bay</span>
                <span className="text-[11px] text-amber-100 mt-0.5">Collect Samples</span>
              </button>

              <button
                onClick={onOpenQuickScan}
                className="flex flex-col items-center justify-center p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Scan QR / Barcode</span>
                <span className="text-[11px] text-emerald-100 mt-0.5">3-Way Verification</span>
              </button>

              <button
                onClick={onOpenUniversalSearch}
                className="flex flex-col items-center justify-center p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Lookup Tube ID</span>
                <span className="text-[11px] text-blue-100 mt-0.5">Specimen Search</span>
              </button>

              <button
                onClick={() => setActiveTab('patients')}
                className="flex flex-col items-center justify-center p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Patient Clinical History</span>
                <span className="text-[11px] text-indigo-100 mt-0.5">Fasting & Prior Tests</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className="flex flex-col items-center justify-center p-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center border border-slate-700"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mb-2 group-hover:bg-slate-600">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                </div>
                <span className="font-bold text-sm">Orders Status</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Sample Progress</span>
              </button>
            </>
          )}

          {effectiveRole === 'dispatch_officer' && (
            <>
              <button
                onClick={() => setActiveTab('dispatch')}
                className="flex flex-col items-center justify-center p-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Create Dispatch</span>
                <span className="text-[11px] text-cyan-100 mt-0.5">Batch to Central Lab</span>
              </button>

              <button
                onClick={onOpenQuickScan}
                className="flex flex-col items-center justify-center p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Scan to Cooler Box</span>
                <span className="text-[11px] text-emerald-100 mt-0.5">Cold Chain Packaging</span>
              </button>

              <button
                onClick={onOpenCentralLabExtract}
                className="flex flex-col items-center justify-center p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Extract Lab Data</span>
                <span className="text-[11px] text-indigo-100 mt-0.5">CSV/JSON Courier File</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className="flex flex-col items-center justify-center p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Order Logistics</span>
                <span className="text-[11px] text-blue-100 mt-0.5">Batch Transit Status</span>
              </button>

              <button
                onClick={onOpenUniversalSearch}
                className="flex flex-col items-center justify-center p-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center border border-slate-700"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mb-2 group-hover:bg-slate-600">
                  <QrCode className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="font-bold text-sm">Lookup Tube ID</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Track Specimen</span>
              </button>
            </>
          )}

          {effectiveRole === 'lab_coordinator' && (
            <>
              <button
                onClick={onOpenCentralLabExtract}
                className="flex flex-col items-center justify-center p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Central Lab Extract</span>
                <span className="text-[11px] text-indigo-100 mt-0.5">Export Accession CSV</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className="flex flex-col items-center justify-center p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Diagnostic Reports</span>
                <span className="text-[11px] text-emerald-100 mt-0.5">Verify & Release</span>
              </button>

              <button
                onClick={() => setActiveTab('dispatch')}
                className="flex flex-col items-center justify-center p-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Dispatched Batches</span>
                <span className="text-[11px] text-cyan-100 mt-0.5">Track In-Transit Samples</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className="flex flex-col items-center justify-center p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Orders & Tests</span>
                <span className="text-[11px] text-blue-100 mt-0.5">Specimen Lifecycle</span>
              </button>

              <button
                onClick={onOpenUniversalSearch}
                className="flex flex-col items-center justify-center p-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center border border-slate-700"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mb-2 group-hover:bg-slate-600">
                  <QrCode className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="font-bold text-sm">Lookup Tube / Order</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Accession Search</span>
              </button>
            </>
          )}

          {effectiveRole === 'centre_admin' && (
            <>
              <button
                id="qa-new-order"
                onClick={() => setActiveTab('new_order')}
                className="flex flex-col items-center justify-center p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">New Order</span>
                <span className="text-[11px] text-blue-100 mt-0.5">Register & Select Tests</span>
              </button>

              <button
                id="qa-collect-sample"
                onClick={() => setActiveTab('phlebotomy')}
                className="flex flex-col items-center justify-center p-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <FlaskConical className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Collect Sample</span>
                <span className="text-[11px] text-purple-100 mt-0.5">Phlebotomy Desk</span>
              </button>

              <button
                id="qa-scan-qr"
                onClick={onOpenQuickScan}
                className="flex flex-col items-center justify-center p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Scan QR / Tube</span>
                <span className="text-[11px] text-emerald-100 mt-0.5">Instant Verification</span>
              </button>

              <button
                id="qa-create-dispatch"
                onClick={() => setActiveTab('dispatch')}
                className="flex flex-col items-center justify-center p-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Create Dispatch</span>
                <span className="text-[11px] text-amber-100 mt-0.5">Batch to Central Lab</span>
              </button>

              <button
                id="qa-recharge-wallet"
                onClick={onOpenWalletRecharge}
                className="flex flex-col items-center justify-center p-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer group text-center border border-slate-700"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mb-2 group-hover:bg-slate-600">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="font-bold text-sm">Recharge Wallet</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Franchise Top-up</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ROLE-FILTERED OPERATIONAL METRICS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Operational Metrics ({getRoleBadge(effectiveRole).title} View)
          </h2>
          <span className="text-xs text-slate-400">
            Real-time data scoped to assigned role
          </span>
        </div>

        {/* METRICS GRID: Tailored to Role */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          
          {/* PHLEBOTOMIST METRICS (Zero Financial Metrics) */}
          {effectiveRole === 'phlebotomist' && (
            <>
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-300 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 animate-bounce">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-800">Samples Pending Draw</div>
                  <div className="text-2xl font-black text-amber-900">{metrics?.samplesPending ?? 0}</div>
                  <div className="text-[11px] text-amber-700 font-medium">Urgent Phlebotomy Queue</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Samples Collected Today</div>
                  <div className="text-xl font-bold text-cyan-700">{metrics?.samplesCollected ?? 0}</div>
                  <div className="text-[11px] text-slate-400">Drawn & Barcoded</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Ready for Cooler Box</div>
                  <div className="text-xl font-bold text-indigo-600">{metrics?.samplesReadyForDispatch ?? 0}</div>
                  <div className="text-[11px] text-slate-400">Awaiting Batching</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                  <FileClock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Reports In-Process</div>
                  <div className="text-xl font-bold text-rose-600">{metrics?.reportsPending ?? 0}</div>
                  <div className="text-[11px] text-slate-400">At Central Analyzers</div>
                </div>
              </div>
            </>
          )}

          {/* DISPATCH OFFICER METRICS (Logistics Focus) */}
          {effectiveRole === 'dispatch_officer' && (
            <>
              <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-900">Ready for Cooler Box</div>
                  <div className="text-2xl font-black text-indigo-700">{metrics?.samplesReadyForDispatch ?? 0}</div>
                  <div className="text-[11px] text-indigo-600">Pack into Cold Chain</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Samples Dispatched</div>
                  <div className="text-xl font-bold text-blue-600">{metrics?.samplesDispatched ?? 0}</div>
                  <div className="text-[11px] text-slate-400">En Route to Central Lab</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Total Drawn Today</div>
                  <div className="text-xl font-bold text-cyan-700">{metrics?.samplesCollected ?? 0}</div>
                  <div className="text-[11px] text-slate-400">In Fridge Storage</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Active Batches</div>
                  <div className="text-xl font-bold text-emerald-600">{dispatches.length}</div>
                  <div className="text-[11px] text-slate-400">Courier Transits</div>
                </div>
              </div>
            </>
          )}

          {/* LAB COORDINATOR METRICS (Accessioning & Report Delivery) */}
          {effectiveRole === 'lab_coordinator' && (
            <>
              <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-300 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">Reports Ready for Release</div>
                  <div className="text-2xl font-black text-emerald-700">{metrics?.reportsReady ?? 0}</div>
                  <div className="text-[11px] text-emerald-600">Doctor/Patient Delivery</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                  <FileClock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Reports In-Process</div>
                  <div className="text-xl font-bold text-rose-600">{metrics?.reportsPending ?? 0}</div>
                  <div className="text-[11px] text-slate-400">At Central Analyzers</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Specimens In Transit</div>
                  <div className="text-xl font-bold text-blue-600">{metrics?.samplesDispatched ?? 0}</div>
                  <div className="text-[11px] text-slate-400">En Route to Ref Lab</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Today's Tests Accessioned</div>
                  <div className="text-xl font-bold text-purple-600">{metrics?.todayTests ?? 0}</div>
                  <div className="text-[11px] text-slate-400">Total Clinical Tests</div>
                </div>
              </div>
            </>
          )}

          {/* RECEPTIONIST METRICS (Front Desk, Patients & Billing) */}
          {effectiveRole === 'receptionist' && (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Today's Patients</div>
                  <div className="text-xl font-bold text-slate-900">{metrics?.todayPatients ?? 0}</div>
                  <div className="text-[11px] text-slate-400">Walk-in Registrations</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Today's Orders</div>
                  <div className="text-xl font-bold text-slate-900">{metrics?.todayOrders ?? 0}</div>
                  <div className="text-[11px] text-slate-400">Booked & Invoiced</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Tests Booked</div>
                  <div className="text-xl font-bold text-slate-900">{metrics?.todayTests ?? 0}</div>
                  <div className="text-[11px] text-slate-400">Prescribed Tests</div>
                </div>
              </div>

              <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800">Today's Collection</div>
                  <div className="text-xl font-bold text-emerald-700">₹{(metrics?.todayCollection ?? 0).toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Cash & UPI Inflow</div>
                </div>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-800">Pending Phlebotomy</div>
                  <div className="text-xl font-bold text-amber-700">{metrics?.samplesPending ?? 0}</div>
                  <div className="text-[11px] text-amber-600 font-medium">Awaiting Specimen Draw</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Reports Ready</div>
                  <div className="text-xl font-bold text-teal-700">{metrics?.reportsReady ?? 0}</div>
                  <div className="text-[11px] text-slate-400">Ready for Patient Delivery</div>
                </div>
              </div>
            </>
          )}

          {/* CENTRE ADMIN METRICS: All 11 Metrics + Franchise Deposit Wallet */}
          {effectiveRole === 'centre_admin' && (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Today's Patients</div>
                  <div className="text-xl font-bold text-slate-900">{metrics?.todayPatients ?? 0}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Today's Orders</div>
                  <div className="text-xl font-bold text-slate-900">{metrics?.todayOrders ?? 0}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Tests Booked</div>
                  <div className="text-xl font-bold text-slate-900">{metrics?.todayTests ?? 0}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Today's Collection</div>
                  <div className="text-xl font-bold text-emerald-700">₹{(metrics?.todayCollection ?? 0).toLocaleString()}</div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border shadow-xs flex items-center space-x-3.5 ${
                metrics?.walletLowBalance ? 'bg-amber-50/50 border-amber-300' : 'bg-white border-slate-200'
              }`}>
                <div className={`p-2.5 rounded-lg shrink-0 ${metrics?.walletLowBalance ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-800'}`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Wallet Balance</div>
                  <div className="text-xl font-bold text-slate-900">₹{(metrics?.walletBalance ?? 0).toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">Credit Limit: ₹{(metrics?.walletCreditLimit ?? 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Samples Pending</div>
                  <div className="text-xl font-bold text-amber-600">{metrics?.samplesPending ?? 0}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Samples Collected</div>
                  <div className="text-xl font-bold text-cyan-700">{metrics?.samplesCollected ?? 0}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Ready for Dispatch</div>
                  <div className="text-xl font-bold text-indigo-600">{metrics?.samplesReadyForDispatch ?? 0}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Samples Dispatched</div>
                  <div className="text-xl font-bold text-blue-600">{metrics?.samplesDispatched ?? 0}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Reports Ready</div>
                  <div className="text-xl font-bold text-emerald-600">{metrics?.reportsReady ?? 0}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                  <FileClock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Reports In-Process</div>
                  <div className="text-xl font-bold text-rose-600">{metrics?.reportsPending ?? 0}</div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* OPERATIONAL PIPELINE VISUALIZER (Highlights Step for Active Role) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Collection Centre Standard Operating Procedure
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            Active Responsibility: <strong className="text-slate-800">{getRoleBadge(effectiveRole).title}</strong>
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          
          <div className={`p-2.5 rounded-xl border transition-all ${
            effectiveRole === 'receptionist' || effectiveRole === 'centre_admin' 
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold mx-auto flex items-center justify-center text-xs mb-1">1</div>
            <div className="font-semibold text-slate-800">Register Patient</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Check duplicates</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            effectiveRole === 'receptionist' || effectiveRole === 'centre_admin' 
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold mx-auto flex items-center justify-center text-xs mb-1">2</div>
            <div className="font-semibold text-slate-800">Select Tests</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Centre price</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            effectiveRole === 'receptionist' || effectiveRole === 'centre_admin' 
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold mx-auto flex items-center justify-center text-xs mb-1">3</div>
            <div className="font-semibold text-slate-800">Bill & Wallet</div>
            <div className="text-[10px] text-slate-500 mt-0.5">B2B deduction</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            effectiveRole === 'receptionist' || effectiveRole === 'phlebotomist' || effectiveRole === 'centre_admin' 
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold mx-auto flex items-center justify-center text-xs mb-1">4</div>
            <div className="font-semibold text-slate-800">Print Labels</div>
            <div className="text-[10px] text-slate-500 mt-0.5">QR & Barcode</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            effectiveRole === 'phlebotomist' || effectiveRole === 'centre_admin' 
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold mx-auto flex items-center justify-center text-xs mb-1">5</div>
            <div className="font-semibold text-slate-800">Scan & Collect</div>
            <div className="text-[10px] text-slate-500 mt-0.5">3-way match</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            effectiveRole === 'dispatch_officer' || effectiveRole === 'centre_admin' 
              ? 'bg-cyan-50/80 border-cyan-300 ring-2 ring-cyan-500/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 font-bold mx-auto flex items-center justify-center text-xs mb-1">6</div>
            <div className="font-semibold text-slate-800">Dispatch Batch</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Seal & cooler box</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            effectiveRole === 'lab_coordinator' || effectiveRole === 'centre_admin' 
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold mx-auto flex items-center justify-center text-xs mb-1">7</div>
            <div className="font-semibold text-indigo-900">Accession Sync</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Analyzer import</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            effectiveRole === 'lab_coordinator' || effectiveRole === 'receptionist' || effectiveRole === 'centre_admin' 
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold mx-auto flex items-center justify-center text-xs mb-1">8</div>
            <div className="font-semibold text-emerald-900">Report Ready</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Release & notify</div>
          </div>

        </div>
      </div>

      {/* TWO COLUMN OPERATIONAL QUEUES SECTION: Custom Tailored to Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ROLE CASE 1: Phlebotomist (Pending Collection Bay + Drawn Tubes Today) */}
        {effectiveRole === 'phlebotomist' && (
          <>
            {/* PENDING SAMPLE COLLECTION BAY */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Pending Phlebotomy Bay ({pendingTubes.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('phlebotomy')}
                    className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Phlebotomy Desk</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {pendingTubes.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No samples pending collection at this time. All caught up!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingTubes.map((tube) => (
                      <div
                        key={tube.id}
                        className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3.5 h-10 rounded-sm shadow-xs shrink-0" 
                            style={{ backgroundColor: tube.tubeColorCode }}
                            title={tube.tubeType}
                          />
                          <div>
                            <div className="font-semibold text-xs text-slate-900 flex items-center space-x-2">
                              <span>{tube.patientName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({tube.patientUhid})</span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {tube.tubeType} • <span className="font-medium text-slate-700">{tube.sampleType}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {tube.tubeNumber} {tube.fastingRequired ? '• Fasting 10-12h' : '• Random'}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectTubeToVerify(tube)}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-xs shrink-0"
                        >
                          Collect Sample
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Color strips represent required BD Vacutainer tube caps.</span>
                <button 
                  onClick={onOpenQuickScan}
                  className="text-amber-600 hover:text-amber-800 font-semibold"
                >
                  Scan Barcode / QR
                </button>
              </div>
            </div>

            {/* SPECIMENS DRAWN TODAY */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-cyan-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Specimens Drawn & Labeled Today ({collectedTubes.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Ready for Courier Box</span>
                </div>

                {collectedTubes.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No samples drawn yet today.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {collectedTubes.map((tube) => (
                      <div
                        key={tube.id}
                        className="p-3 rounded-xl border border-slate-200 bg-cyan-50/30 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3.5 h-10 rounded-sm shadow-xs shrink-0" 
                            style={{ backgroundColor: tube.tubeColorCode }}
                            title={tube.tubeType}
                          />
                          <div>
                            <div className="font-semibold text-xs text-slate-900 flex items-center space-x-2">
                              <span>{tube.patientName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({tube.patientUhid})</span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {tube.tubeType} • <span className="font-medium text-slate-700">{tube.sampleType}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {tube.tubeNumber} • Phleb: {tube.collectedBy || 'Staff'}
                            </div>
                          </div>
                        </div>

                        <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-200">
                          DRAWN & VERIFIED
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Specimens are preserved in collection centre temperature fridge.</span>
                <button
                  onClick={() => setActiveTab('dispatch')}
                  className="text-cyan-600 hover:text-cyan-800 font-semibold"
                >
                  View Cold Chain Batches →
                </button>
              </div>
            </div>
          </>
        )}

        {/* ROLE CASE 2: Dispatch Officer (Tubes Ready for Cooler Box + Active Batches) */}
        {effectiveRole === 'dispatch_officer' && (
          <>
            {/* TUBES READY FOR COOLER BOX */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-cyan-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Tubes Awaiting Cold-Chain Packaging ({collectedTubes.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('dispatch')}
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Create Batch</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {collectedTubes.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No collected tubes awaiting cold box packaging.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {collectedTubes.map((tube) => (
                      <div
                        key={tube.id}
                        className="p-3 rounded-xl border border-slate-200 hover:border-cyan-400 bg-slate-50/50 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3.5 h-10 rounded-sm shadow-xs shrink-0" 
                            style={{ backgroundColor: tube.tubeColorCode }}
                            title={tube.tubeType}
                          />
                          <div>
                            <div className="font-semibold text-xs text-slate-900 flex items-center space-x-2">
                              <span>{tube.patientName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({tube.patientUhid})</span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {tube.tubeType} • Temp: <span className="font-bold text-cyan-700">2-8°C (Cold Pack)</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Barcode: {tube.tubeNumber}
                            </div>
                          </div>
                        </div>

                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                          AWAITING BOX
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Ensure temperature logger is placed inside before box seal.</span>
                <button
                  onClick={() => setActiveTab('dispatch')}
                  className="text-cyan-600 hover:text-cyan-800 font-semibold"
                >
                  + Pack New Batch
                </button>
              </div>
            </div>

            {/* ACTIVE DISPATCH BATCHES */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-900">
                    Active Cold-Chain Batches ({dispatches.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('dispatch')}
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>All Batches</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {dispatches.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No dispatch batches created today yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dispatches.map((b: any) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-xs text-slate-900 flex items-center space-x-2">
                            <span className="font-mono text-cyan-700 font-bold">{b.batchNumber}</span>
                            <span className="text-[10px] text-slate-500 font-medium">({b.temperatureCategory || '2-8°C'})</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Courier: {b.transporterName || 'Express Runner'} • Trk: {b.trackingNumber || 'Pending'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Seal: {b.sealNumber || 'TAMPER-PROOF'} • {b.tubeCount || 0} Tube(s)
                          </div>
                        </div>

                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                          {b.status ? b.status.toUpperCase() : 'EN ROUTE'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Hand over printed Courier Manifest to the logistics runner.</span>
                <button
                  onClick={onOpenCentralLabExtract}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Export CSV Manifest →
                </button>
              </div>
            </div>
          </>
        )}

        {/* ROLE CASE 3 & DEFAULT: Centre Admin, Receptionist, Lab Coordinator */}
        {(effectiveRole === 'centre_admin' || effectiveRole === 'receptionist' || effectiveRole === 'lab_coordinator') && (
          <>
            {/* PENDING SAMPLE COLLECTION QUEUE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Samples Pending Phlebotomy ({pendingTubes.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('phlebotomy')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Phlebotomy Desk</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {pendingTubes.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No samples pending collection at this time.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingTubes.map((tube) => (
                      <div
                        key={tube.id}
                        className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3.5 h-10 rounded-sm shadow-xs shrink-0" 
                            style={{ backgroundColor: tube.tubeColorCode }}
                            title={tube.tubeType}
                          />
                          <div>
                            <div className="font-semibold text-xs text-slate-900 flex items-center space-x-2">
                              <span>{tube.patientName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({tube.patientUhid})</span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {tube.tubeType} • <span className="font-medium text-slate-700">{tube.sampleType}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {tube.tubeNumber}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectTubeToVerify(tube)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-xs shrink-0"
                        >
                          Collect
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Color strips represent required BD Vacutainer tube caps.</span>
                <button 
                  onClick={onOpenQuickScan}
                  className="text-purple-600 hover:text-purple-800 font-semibold"
                >
                  Scan Barcode / QR
                </button>
              </div>
            </div>

            {/* RECENT ORDERS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-900">
                    Recent Orders & Invoices ({recentOrders.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>All Orders</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No orders created yet today.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => onSelectOrderToView(order.id)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold text-xs text-slate-900 flex items-center space-x-2">
                            <span>{order.patientName}</span>
                            <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              {order.orderNumber}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {order.items.length} Test(s) • Dr: {order.referringDoctor || 'Self'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Mode: {order.paymentMode.toUpperCase()}
                          </div>
                        </div>

                        <div className="text-right">
                          {canDo('canCreateOrders') || canDo('canOverridePricing') || effectiveRole === 'centre_admin' || effectiveRole === 'receptionist' ? (
                            <div className="font-bold text-xs text-slate-900">
                              ₹{order.netAmount.toLocaleString()}
                            </div>
                          ) : (
                            <div className="text-[11px] font-medium text-slate-500">
                              {order.items.length} Test Item(s)
                            </div>
                          )}
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                            order.sampleStatus === 'report_ready' ? 'bg-emerald-100 text-emerald-700' :
                            order.sampleStatus === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                            order.sampleStatus === 'collected' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {order.sampleStatus.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Click any order to view breakdown, invoices, or sample labels.</span>
                {canDo('canCreateOrders') && (
                  <button
                    onClick={() => setActiveTab('new_order')}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    + Create Order
                  </button>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
