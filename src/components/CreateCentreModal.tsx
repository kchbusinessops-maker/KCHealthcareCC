import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, X, ShieldCheck, CheckCircle2, Wallet, UserCheck, 
  MapPin, Phone, Mail, FileText, Sparkles, ArrowRight, AlertCircle 
} from 'lucide-react';

interface CreateCentreModalProps {
  onClose: () => void;
  onCentreCreated?: (centre: any) => void;
}

export const CreateCentreModal: React.FC<CreateCentreModalProps> = ({ onClose, onCentreCreated }) => {
  const { createCentre, login, centres } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('Thane');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+91 98205 ');
  const [email, setEmail] = useState('');
  const [parentLabName, setParentLabName] = useState('Apex Diagnostics Central Reference Laboratory');
  const [commercialRate, setCommercialRate] = useState('65'); // 65%
  const [walletBalance, setWalletBalance] = useState('25000'); // ₹25,000
  const [creditLimit, setCreditLimit] = useState('10000');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('5000');

  // Staff Credentials
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('apex123');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ centre: any; users: any[] } | null>(null);

  // Auto-generate code when city or name changes
  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    if (!code || code.startsWith('CC-')) {
      const cityPrefix = newCity.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'CENTRE';
      const existingCount = centres.filter(c => c.city.toLowerCase() === newCity.toLowerCase()).length + 1;
      const numStr = existingCount < 10 ? `0${existingCount}` : `${existingCount}`;
      const generatedCode = `CC-${cityPrefix}-${numStr}`;
      setCode(generatedCode);
      if (!adminUsername || adminUsername.startsWith('admin_')) {
        setAdminUsername(`admin_${cityPrefix.toLowerCase()}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a Collection Centre Name.');
      return;
    }
    if (!code.trim()) {
      setError('Please provide a unique Centre Code.');
      return;
    }
    if (!address.trim()) {
      setError('Physical centre address is required for specimen dispatch and patient records.');
      return;
    }

    // Check duplicate code locally
    const cleanCode = code.trim().toUpperCase();
    if (centres.some(c => c.code.toUpperCase() === cleanCode)) {
      setError(`Centre Code "${cleanCode}" already exists. Please choose a unique code.`);
      return;
    }

    setLoading(true);

    try {
      const result = await createCentre({
        name: name.trim(),
        code: cleanCode,
        parentLabName: parentLabName.trim(),
        address: address.trim(),
        city: city.trim(),
        phone: phone.trim(),
        email: email.trim() || `${cleanCode.toLowerCase()}@apexdiagnostics.com`,
        franchiseCommercialRate: Number(commercialRate) / 100,
        walletBalance: Number(walletBalance) || 0,
        walletCreditLimit: Number(creditLimit) || 10000,
        walletLowBalanceThreshold: Number(lowBalanceThreshold) || 5000,
        adminUser: {
          name: adminName.trim() || `${name.trim()} Administrator`,
          username: adminUsername.trim() || `admin_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          password: adminPassword || 'apex123',
          email: adminEmail.trim() || email.trim(),
          phone: adminPhone.trim() || phone.trim()
        }
      });

      setCreatedResult(result);
      if (onCentreCreated) {
        onCentreCreated(result.centre);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to onboard collection centre.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginImmediately = async () => {
    if (!createdResult) return;
    const adminUser = createdResult.users.find(u => u.role === 'centre_admin') || createdResult.users[0];
    try {
      await login(createdResult.centre.id, adminUser.username, adminPassword);
      onClose();
    } catch (err) {
      console.error('Auto-login failed', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Onboard New Collection Centre
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Franchise SaaS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Provision a fully-featured, isolated collection centre workspace with prepaid wallet and staff accounts
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {createdResult ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Collection Centre Successfully Created!
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              <strong className="text-slate-900">{createdResult.centre.name}</strong> ({createdResult.centre.code}) is now active with full operational capabilities.
            </p>

            {/* Created Centre Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left max-w-lg mx-auto mb-6 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Centre Code</span>
                <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                  {createdResult.centre.code}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Opening Wallet Balance</span>
                <span className="font-bold text-emerald-700">₹{createdResult.centre.walletBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Commercial Parent Lab Share</span>
                <span className="font-medium text-slate-800">{Math.round(createdResult.centre.franchiseCommercialRate * 100)}%</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Authorized Staff Credentials</div>
                <div className="space-y-1.5">
                  {createdResult.users.map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          u.role === 'centre_admin' ? 'bg-purple-500' :
                          u.role === 'receptionist' ? 'bg-blue-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-medium text-slate-900">{u.name}</span>
                        <span className="text-slate-400 capitalize">({u.role.replace('_', ' ')})</span>
                      </div>
                      <div className="font-mono text-slate-600">
                        Username: <strong className="text-indigo-600">{u.username}</strong> | Pass: <span className="text-slate-500">{u.password || adminPassword}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Operational features notice */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 max-w-lg mx-auto mb-6 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>All modules (Patient Registry, Vacutainer Billing, Phlebotomy QR, Dispatch Batches, LIMS Sync) are initialized for this centre.</span>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Close & Return
              </button>
              <button
                onClick={handleLoginImmediately}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer"
              >
                <span>Log into {createdResult.centre.name} Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Create Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Centre Identity */}
            <div>
              <div className="flex items-center space-x-2 mb-3 pb-1 border-b border-slate-200">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Collection Centre Details & Location
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Centre Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Apex Collection Centre - Thane West"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Centre Code (Unique Identifier) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g., CC-THANE-04"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm font-mono uppercase font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCityChange(city)}
                      className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-300 whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Thane, Mumbai, Pune, Bengaluru"
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98200 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address & Premises <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Shop 12, Ground Floor, Sunrise Arcade, Station Road"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Centre Operations Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g., thane.cc@apexdiagnostics.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Commercial & Wallet Terms */}
            <div>
              <div className="flex items-center space-x-2 mb-3 pb-1 border-b border-slate-200">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Parent Lab Franchise Commercials & Wallet Allocation
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    B2B Parent Lab Share (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={commercialRate}
                      onChange={(e) => setCommercialRate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Parent lab deduction from wallet per order</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Prepaid Wallet (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={walletBalance}
                      onChange={(e) => setWalletBalance(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400"></span>
                  </div>
                  <span className="text-[10px] text-slate-500">Pre-allocated security deposit & balance</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                  <span className="text-[10px] text-slate-500">Buffer to prevent booking disruptions</span>
                </div>
              </div>
            </div>

            {/* Step 3: Staff & Login Credentials Setup */}
            <div>
              <div className="flex items-center space-x-2 mb-3 pb-1 border-b border-slate-200">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Primary Centre Admin & Authorized Login Credentials
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dr. Priya Nair, MBBS"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., admin_thane"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Password / PIN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500">Default: apex123 (can be changed anytime)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Auto-Provisioned Staff Accounts
                  </label>
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <div>• Receptionist: <code className="text-indigo-600">rec_{code ? code.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'centre'}</code></div>
                    <div>• Phlebotomist: <code className="text-indigo-600">phleb_{code ? code.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'centre'}</code></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Full Feature Parity Guarantee */}
            <div className="bg-slate-900 text-slate-200 rounded-xl p-4 text-xs">
              <div className="font-bold text-white mb-2 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Standard Diagnostic Franchise Feature Parity Guarantee</span>
              </div>
              <p className="text-slate-400 mb-3">
                Any newly created collection centre is provisioned with all features available across the franchise:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="flex items-center space-x-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Patient Registry & Dedupe</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Full Test Catalog & MRP</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Smart Tube Calculation</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Thermal Barcode / QR Print</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phlebotomy 3-Way Check</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cold-Chain Dispatch</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>LIMS Adapter & Reports</span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Wallet Ledger & Top-up</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Provisioning Collection Centre...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Create Collection Centre</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
