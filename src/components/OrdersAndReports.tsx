import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order, LabReport, SampleTube } from '../types';
import { 
  ShoppingBag, FileCheck, Search, Filter, Printer, Download, 
  ExternalLink, Eye, CheckCircle2, Clock, Truck, FlaskConical, 
  IndianRupee, ChevronRight, AlertCircle, RefreshCw, Send
} from 'lucide-react';

interface OrdersAndReportsProps {
  initialTab?: 'orders' | 'reports';
  selectedOrderIdToView?: string | null;
  onPrintInvoice: (order: Order) => void;
  onPrintTubeLabel: (tube: SampleTube) => void;
}

export const OrdersAndReports: React.FC<OrdersAndReportsProps> = ({
  initialTab = 'orders',
  selectedOrderIdToView,
  onPrintInvoice,
  onPrintTubeLabel
}) => {
  const { currentCentre, currentUser, effectiveRole, canDo, showNotification } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'orders' | 'reports'>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const hasFinancialAccess = canDo('canManageWallet') || effectiveRole === 'centre_admin' || effectiveRole === 'receptionist';
  const hasInvoicePrintAccess = canDo('canManageWallet') || canDo('canCreateOrders') || effectiveRole === 'centre_admin' || effectiveRole === 'receptionist';
  const hasReportDeliveryAccess = canDo('canViewReports') || effectiveRole === 'centre_admin' || effectiveRole === 'receptionist' || effectiveRole === 'lab_coordinator';

  // Selected Order details modal
  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);
  const [orderTubes, setOrderTubes] = useState<SampleTube[]>([]);

  // Selected Report view modal
  const [activeReportModal, setActiveReportModal] = useState<LabReport | null>(null);

  const loadData = async () => {
    if (!currentCentre) return;
    setLoading(true);
    try {
      const [ordList, repList] = await Promise.all([
        api.getOrders(currentCentre.id),
        api.getReports(currentCentre.id)
      ]);
      setOrders(ordList);
      setReports(repList);

      if (selectedOrderIdToView) {
        const found = ordList.find(o => o.id === selectedOrderIdToView);
        if (found) {
          openOrderDetails(found);
        }
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to load records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCentre?.id]);

  useEffect(() => {
    if (selectedOrderIdToView && orders.length > 0) {
      const found = orders.find(o => o.id === selectedOrderIdToView);
      if (found) openOrderDetails(found);
    }
  }, [selectedOrderIdToView, orders]);

  const openOrderDetails = async (order: Order) => {
    setActiveOrderModal(order);
    if (!currentCentre) return;
    try {
      const allTubes = await api.getTubes(currentCentre.id);
      const matched = allTubes.filter(t => t.orderId === order.id);
      setOrderTubes(matched);
    } catch {
      // silent
    }
  };

  const handleMarkReportDelivered = async (reportId: string) => {
    if (!currentCentre) return;
    try {
      const updated = await api.markReportDelivered(currentCentre.id, reportId);
      showNotification(`Report marked as delivered to patient ${updated.patientName}!`, 'success');
      loadData();
      if (activeReportModal?.id === reportId) {
        setActiveReportModal(updated);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to update delivery status', 'error');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.sampleStatus === statusFilter;
    const matchesSearch = !searchQuery || 
      o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patientUhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered reports
  const filteredReports = reports.filter(r => {
    const matchesSearch = !searchQuery ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientUhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.testName || r.testNames?.[0] || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Toggle between Orders & Reports */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'orders' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders & Invoices ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'reports' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Diagnostic Reports ({reports.length})</span>
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, UHID, Ref #..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* ORDERS TAB VIEW */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Status Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs bg-white p-2.5 rounded-xl border border-slate-200">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending_collection', label: 'Pending Collection' },
              { id: 'collected', label: 'Collected' },
              { id: 'dispatched', label: 'Dispatched' },
              { id: 'processing', label: 'In Lab Process' },
              { id: 'report_ready', label: 'Report Ready' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st.id ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No orders match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Patient Demographics</th>
                      <th className="py-3 px-4">Tests Booked</th>
                      <th className="py-3 px-4">Date & Payment</th>
                      <th className="py-3 px-4">{hasFinancialAccess ? 'Amount' : 'Test Items'}</th>
                      <th className="py-3 px-4">Sample Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-blue-600">
                            {order.orderNumber}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            Dr: {order.referringDoctor || 'Self'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{order.patientName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                            <span className="font-mono">{order.patientUhid}</span>
                            <span>•</span>
                            <span>{order.patientMobile}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {order.items.length} Test(s)
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {order.items.map(i => i.testName).join(', ')}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-600">
                            {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                          <span className="inline-block text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {order.paymentMode} • {order.paymentStatus}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900">
                          {hasFinancialAccess ? `₹${order.netAmount.toLocaleString()}` : `${order.items.length} Items`}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.sampleStatus === 'report_ready' ? 'bg-emerald-100 text-emerald-800' :
                            order.sampleStatus === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                            order.sampleStatus === 'collected' ? 'bg-cyan-100 text-cyan-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {order.sampleStatus.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="View Order Details & Tubes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasInvoicePrintAccess && (
                            <button
                              onClick={() => onPrintInvoice(order)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Print Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORTS TAB VIEW */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredReports.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No reports generated yet for this centre.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-3 px-4">Report Ref #</th>
                      <th className="py-3 px-4">Patient & UHID</th>
                      <th className="py-3 px-4">Test Profile</th>
                      <th className="py-3 px-4">Verified By (Central Lab)</th>
                      <th className="py-3 px-4">Delivery Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900">
                            {rep.reportNumber}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            Approved: {new Date(rep.approvedDate || rep.reportDate || Date.now()).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{rep.patientName}</div>
                          <div className="font-mono text-[11px] text-blue-600">{rep.patientUhid}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{rep.testName || rep.testNames?.join(', ')}</div>
                          <div className="text-[10px] text-slate-500">
                            {(rep.results || rep.findings || []).length} Analyte Parameters
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-700">{rep.pathologistName}</div>
                          <div className="text-[10px] text-slate-400">MD Pathologist (Parent Lab)</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            (rep.deliveryStatus || 'ready') === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            (rep.deliveryStatus || 'ready') === 'ready' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {(rep.deliveryStatus || 'ready').toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setActiveReportModal(rep)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="View Complete Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {rep.deliveryStatus !== 'delivered' && hasReportDeliveryAccess && (
                            <button
                              onClick={() => handleMarkReportDelivered(rep.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                              title="Handover / WhatsApp report to patient"
                            >
                              Deliver
                            </button>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {activeOrderModal.orderNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Order Details & Sample Tubes</h3>
              </div>
              <button
                onClick={() => setActiveOrderModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Patient & Financial Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">PATIENT</span>
                <span className="font-bold text-slate-900">{activeOrderModal.patientName}</span>
                <span className="font-mono text-[10px] text-slate-500 block">{activeOrderModal.patientUhid}</span>
              </div>
              {hasFinancialAccess ? (
                <>
                  <div>
                    <span className="text-slate-400 text-[10px] block">NET AMOUNT</span>
                    <span className="font-bold text-slate-900">₹{activeOrderModal.netAmount}</span>
                    <span className="text-[10px] text-emerald-600 font-medium block">Paid: ₹{activeOrderModal.amountPaid}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">PARENT LAB B2B SHARE</span>
                    <span className="font-bold text-indigo-700">₹{activeOrderModal.b2bFranchiseFee}</span>
                    <span className="text-[10px] text-slate-400 block">Deducted from Wallet</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-slate-400 text-[10px] block">TEST COUNT</span>
                    <span className="font-bold text-slate-900">{activeOrderModal.items.length} Tests</span>
                    <span className="text-[10px] text-slate-500 font-medium block">Clinical Request</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">FINANCIAL INFO</span>
                    <span className="font-bold text-slate-500">Restricted</span>
                    <span className="text-[10px] text-slate-400 block">Billing staff only</span>
                  </div>
                </>
              )}
              <div>
                <span className="text-slate-400 text-[10px] block">CURRENT STATUS</span>
                <span className="font-bold text-slate-900 uppercase">{activeOrderModal.sampleStatus.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {/* Ordered Tests List */}
            <div>
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">Tests Booked ({activeOrderModal.items.length})</h4>
              <div className="space-y-1.5 text-xs">
                {activeOrderModal.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{it.testName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{it.testCode} • {it.requiredTube}</div>
                    </div>
                    {hasFinancialAccess && (
                      <span className="font-bold text-slate-900">₹{it.price}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Associated Sample Tubes */}
            <div>
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">Sample Tubes ({orderTubes.length})</h4>
              <div className="space-y-2 text-xs">
                {orderTubes.map((tube) => (
                  <div key={tube.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: tube.tubeColorCode }} />
                      <div>
                        <div className="font-mono font-bold text-slate-900">{tube.tubeNumber}</div>
                        <div className="text-[10px] text-slate-500">{tube.tubeType} • {tube.status.replace(/_/g, ' ')}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onPrintTubeLabel(tube)}
                      className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center space-x-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Print Label</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              {hasInvoicePrintAccess && (
                <button
                  onClick={() => onPrintInvoice(activeOrderModal)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Invoice</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* REPORT VIEWER MODAL */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  CENTRAL LAB VERIFIED REPORT
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{activeReportModal.testName}</h3>
              </div>
              <button
                onClick={() => setActiveReportModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Diagnostic Report Layout */}
            <div className="border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{currentCentre?.parentLabName}</h2>
                  <p className="text-slate-500 text-[11px]">Department of Laboratory Medicine & Molecular Diagnostics</p>
                  <p className="text-slate-400 text-[10px]">Collection Centre: {currentCentre?.name} ({currentCentre?.code})</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-800">{activeReportModal.reportNumber}</div>
                  <div className="text-slate-400 text-[10px]">
                    Approved: {new Date(activeReportModal.approvedDate || activeReportModal.reportDate || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] block">PATIENT NAME</span>
                  <span className="font-bold text-slate-900">{activeReportModal.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">CENTRE UHID</span>
                  <span className="font-mono font-bold text-blue-600">{activeReportModal.patientUhid}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">ORDER ID</span>
                  <span className="font-mono text-slate-700">{activeReportModal.orderId}</span>
                </div>
              </div>

              {/* Analyte Results Table */}
              <table className="w-full text-left border-collapse mt-3">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2">Test Parameter / Analyte</th>
                    <th className="py-2">Observed Value</th>
                    <th className="py-2">Biological Reference Interval</th>
                    <th className="py-2">Unit</th>
                    <th className="py-2">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(activeReportModal.results || activeReportModal.findings || []).map((res: any, i: number) => (
                    <tr key={i} className="py-2">
                      <td className="py-2 font-semibold text-slate-900">{res.parameter}</td>
                      <td className={`py-2 font-bold ${res.flag !== 'NORMAL' ? 'text-rose-600' : 'text-slate-900'}`}>
                        {res.value}
                      </td>
                      <td className="py-2 text-slate-600">{res.referenceInterval || res.referenceRange}</td>
                      <td className="py-2 text-slate-500">{res.unit}</td>
                      <td className="py-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          res.flag === 'NORMAL' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {res.flag}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pathologist Signature */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  QR verified electronic signature generated by Central Lab LIMS gateway.
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800 text-xs">{activeReportModal.pathologistName}</div>
                  <div className="text-[10px] text-slate-500">Consultant Pathologist, MD</div>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Delivery Status: <strong className="text-slate-800 capitalize">{activeReportModal.deliveryStatus}</strong>
              </span>

              <div className="flex items-center space-x-2">
                {activeReportModal.deliveryStatus !== 'delivered' && (
                  <button
                    onClick={() => handleMarkReportDelivered(activeReportModal.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Mark Handed Over to Patient
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
