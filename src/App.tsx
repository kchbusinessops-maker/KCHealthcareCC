import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { NewOrderFlow } from './components/NewOrderFlow';
import { PhlebotomyModule } from './components/PhlebotomyModule';
import { DispatchModule } from './components/DispatchModule';
import { PatientRegistry } from './components/PatientRegistry';
import { OrdersAndReports } from './components/OrdersAndReports';
import { WalletModule } from './components/WalletModule';
import { CentreLoginScreen } from './components/CentreLoginScreen';
import { CreateCentreModal } from './components/CreateCentreModal';
import { StaffManagementModule } from './components/StaffManagementModule';
import { CentralLabExtractView } from './components/CentralLabExtractView';

// Modals
import { LabelPrintModal } from './components/LabelPrintModal';
import { InvoiceModal } from './components/InvoiceModal';
import { CourierManifestModal } from './components/CourierManifestModal';
import { WalletRechargeModal } from './components/WalletRechargeModal';
import { CentralLabDataExtractionModal } from './components/CentralLabDataExtractionModal';
import { QuickScanModal } from './components/QuickScanModal';

import { Order, SampleTube, Patient, DispatchBatch } from './types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainApp: React.FC = () => {
  const { 
    isAuthenticated, currentCentre, currentUser, notification, 
    clearNotification, reloadCentreData, isCreateCentreModalOpen, 
    openCreateCentreModal, closeCreateCentreModal 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals state
  const [tubeToPrint, setTubeToPrint] = useState<SampleTube | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [batchToPrint, setBatchToPrint] = useState<{ batch: DispatchBatch; tubes: SampleTube[] } | null>(null);
  
  const [showWalletRecharge, setShowWalletRecharge] = useState(false);
  const [showCentralLabExtract, setShowCentralLabExtract] = useState(false);
  const [extractBatchId, setExtractBatchId] = useState<string | undefined>(undefined);
  const [showQuickScan, setShowQuickScan] = useState(false);

  // Cross-tab navigation helpers
  const [selectedOrderIdToView, setSelectedOrderIdToView] = useState<string | null>(null);
  const [selectedTubeToVerify, setSelectedTubeToVerify] = useState<SampleTube | null>(null);

  // When order is created from NewOrderFlow
  const handleOrderCreated = (order: Order, tubes: SampleTube[]) => {
    // Show invoice modal & provide option to print labels
    setOrderToPrint(order);
    if (tubes.length > 0) {
      setTubeToPrint(tubes[0]);
    }
    setActiveTab('orders');
    reloadCentreData();
  };

  // Start new order for a specific patient from PatientRegistry
  const handleStartNewOrderForPatient = (patient: Patient) => {
    setActiveTab('new_order');
  };

  // If user is not yet logged in, show dedicated Centre Login Screen
  if (!isAuthenticated) {
    return (
      <>
        {/* Toast Notification Banner */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
              notification.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
              notification.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
              notification.type === 'warning' ? 'bg-amber-950 text-amber-200 border-amber-800' :
              'bg-slate-900 text-slate-200 border-slate-700'
            }`}>
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
              <span>{notification.message}</span>
              <button onClick={clearNotification} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <CentreLoginScreen onOpenCreateCentre={openCreateCentreModal} />
        {isCreateCentreModalOpen && (
          <CreateCentreModal onClose={closeCreateCentreModal} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
            notification.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
            notification.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
            notification.type === 'warning' ? 'bg-amber-950 text-amber-200 border-amber-800' :
            'bg-slate-900 text-slate-200 border-slate-700'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span>{notification.message}</span>
            <button onClick={clearNotification} className="text-slate-400 hover:text-white ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setShowQuickScan(true)}
        onOpenWallet={() => setShowWalletRecharge(true)}
        onOpenCentralLabExtract={() => {
          setExtractBatchId(undefined);
          setShowCentralLabExtract(true);
        }}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onOpenQuickScan={() => setShowQuickScan(true)}
            onOpenWalletRecharge={() => setShowWalletRecharge(true)}
            onOpenUniversalSearch={() => setShowQuickScan(true)}
            onOpenCentralLabExtract={() => {
              setExtractBatchId(undefined);
              setShowCentralLabExtract(true);
            }}
            onSelectOrderToView={(orderId) => {
              setSelectedOrderIdToView(orderId);
              setActiveTab('orders');
            }}
            onSelectTubeToVerify={(tube) => {
              setSelectedTubeToVerify(tube);
              setActiveTab('phlebotomy');
            }}
          />
        )}

        {activeTab === 'new_order' && (
          <NewOrderFlow
            onOrderCreated={handleOrderCreated}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'phlebotomy' && (
          <PhlebotomyModule
            initialSelectedTube={selectedTubeToVerify}
            onPrintTubeLabel={(tube) => setTubeToPrint(tube)}
          />
        )}

        {activeTab === 'dispatch' && (
          <DispatchModule
            onPrintDispatchManifest={(batch, tubes) => setBatchToPrint({ batch, tubes })}
            onExtractCentralLabData={(batchId) => {
              setExtractBatchId(batchId);
              setShowCentralLabExtract(true);
            }}
          />
        )}

        {activeTab === 'patients' && (
          <PatientRegistry
            onStartNewOrderForPatient={handleStartNewOrderForPatient}
            onViewOrder={(orderId) => {
              setSelectedOrderIdToView(orderId);
              setActiveTab('orders');
            }}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersAndReports
            initialTab="orders"
            selectedOrderIdToView={selectedOrderIdToView}
            onPrintInvoice={(order) => setOrderToPrint(order)}
            onPrintTubeLabel={(tube) => setTubeToPrint(tube)}
          />
        )}

        {activeTab === 'reports' && (
          <OrdersAndReports
            initialTab="reports"
            onPrintInvoice={(order) => setOrderToPrint(order)}
            onPrintTubeLabel={(tube) => setTubeToPrint(tube)}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletModule
            onOpenRechargeModal={() => setShowWalletRecharge(true)}
          />
        )}

        {activeTab === 'central_lab_extract' && (
          <CentralLabExtractView />
        )}

        {activeTab === 'staff_roles' && (
          <StaffManagementModule />
        )}
      </main>

      {/* MODALS */}
      {isCreateCentreModalOpen && (
        <CreateCentreModal
          onClose={closeCreateCentreModal}
        />
      )}

      <LabelPrintModal
        tube={tubeToPrint}
        onClose={() => setTubeToPrint(null)}
      />

      <InvoiceModal
        order={orderToPrint}
        onClose={() => setOrderToPrint(null)}
      />

      {batchToPrint && (
        <CourierManifestModal
          batch={batchToPrint.batch}
          tubes={batchToPrint.tubes}
          onClose={() => setBatchToPrint(null)}
        />
      )}

      {showWalletRecharge && (
        <WalletRechargeModal
          onClose={() => setShowWalletRecharge(false)}
          onSuccess={() => reloadCentreData()}
        />
      )}

      {showCentralLabExtract && (
        <CentralLabDataExtractionModal
          defaultBatchId={extractBatchId}
          onClose={() => {
            setShowCentralLabExtract(false);
            setExtractBatchId(undefined);
          }}
        />
      )}

      {showQuickScan && (
        <QuickScanModal
          onClose={() => setShowQuickScan(false)}
          onTubeFound={(tube) => {
            setSelectedTubeToVerify(tube);
            setActiveTab('phlebotomy');
          }}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
