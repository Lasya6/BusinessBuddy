import React, { useState } from 'react';
import {
  Store,
  Layers,
  Package,
  Sparkles,
  Check,
  ArrowRight,
  CheckCircle2,
  Users,
  ReceiptText,
  PieChart,
  Truck,
  Briefcase,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { BusinessType, EnabledModules } from '../../types';

interface BusinessSetupScreenProps {
  isOpen: boolean;
  onClose?: () => void;
  isInitial?: boolean;
}

export const BusinessSetupScreen: React.FC<BusinessSetupScreenProps> = ({
  isOpen,
  onClose,
  isInitial = false,
}) => {
  const { profile, updateProfile, products, setProducts } = useBusiness();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState(profile.name || 'BusinessBuddy');
  const [businessType, setBusinessType] = useState<BusinessType>(profile.type || 'hybrid');
  const [ownerName, setOwnerName] = useState(profile.ownerName || 'Elena Rostova');
  const [currencySymbol, setCurrencySymbol] = useState(profile.currencySymbol || '$');
  const [currencyCode, setCurrencyCode] = useState(profile.currency || 'USD');
  const [email, setEmail] = useState(profile.email || 'contact@businessbuddy.app');

  // Enabled Modules configuration
  const [modules, setModules] = useState<EnabledModules>(() => {
    return (
      profile.enabledModules || {
        inventory: true,
        suppliers: true,
        customers: true,
        sales: true,
        expenses: true,
        aiAssistant: true,
      }
    );
  });

  if (!isOpen) return null;

  const handleSelectType = (type: BusinessType) => {
    setBusinessType(type);
    if (type === 'service' || type === 'freelance') {
      // In service business, inventory is optional and defaults to OFF unless user wants it
      setModules((prev) => ({
        ...prev,
        inventory: false,
        suppliers: false,
      }));
    } else if (type === 'retail' || type === 'wholesale') {
      setModules((prev) => ({
        ...prev,
        inventory: true,
        suppliers: true,
      }));
    } else {
      // Hybrid
      setModules((prev) => ({
        ...prev,
        inventory: true,
        suppliers: true,
      }));
    }
  };

  const applyPreset = (presetName: string, type: BusinessType) => {
    setName(presetName);
    handleSelectType(type);
  };

  const handleFinish = () => {
    updateProfile({
      name: name.trim() || 'BusinessBuddy',
      type: businessType,
      ownerName: ownerName.trim() || 'Business Owner',
      currency: currencyCode,
      currencySymbol,
      email: email.trim() || 'contact@businessbuddy.app',
      isSetupCompleted: true,
      enabledModules: modules,
    });

    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Top Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                B
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Business Setup Wizard
                </h1>
                <p className="text-xs text-slate-500">
                  Universal Business Management Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stepper badge */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                    step === 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  1
                </span>
                <span className="w-4 h-0.5 bg-slate-200" />
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                    step === 2 ? 'bg-emerald-600 text-white' : step > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  2
                </span>
                <span className="w-4 h-0.5 bg-slate-200" />
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                    step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  3
                </span>
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors ml-1"
                  aria-label="Dismiss setup"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Business Identity & Currency */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Step 1: Company Profile & Currency
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your business name and primary currency for sales, expenses, and invoices.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. BusinessBuddy or Apex Creative Studio"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className="text-slate-400 font-medium">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('BusinessBuddy', 'hybrid')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-medium text-[11px] transition-colors"
                    >
                      BusinessBuddy (Hybrid)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('Apex Advisory Group', 'service')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-medium text-[11px] transition-colors"
                    >
                      Apex Advisory (Service)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('Metro Goods Co', 'retail')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-medium text-[11px] transition-colors"
                    >
                      Metro Goods (Retail)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Owner / Operator Name
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Elena Rostova"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@businessbuddy.app"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={currencyCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setCurrencyCode(code);
                        if (code === 'USD' || code === 'CAD' || code === 'AUD') setCurrencySymbol('$');
                        else if (code === 'EUR') setCurrencySymbol('€');
                        else if (code === 'GBP') setCurrencySymbol('£');
                        else if (code === 'JPY') setCurrencySymbol('¥');
                        else if (code === 'INR') setCurrencySymbol('₹');
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="CAD">CAD ($) - Canadian Dollar</option>
                      <option value="AUD">AUD ($) - Australian Dollar</option>
                      <option value="JPY">JPY (¥) - Japanese Yen</option>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline"
                >
                  Skip wizard & launch with defaults
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  <span>Continue to Business Model</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Choose Business Model */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Step 2: Choose Your Business Model
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your operating model. This automatically optimizes dashboard metrics and module recommendations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Service-Based */}
                <button
                  type="button"
                  onClick={() => handleSelectType('service')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    businessType === 'service' || businessType === 'freelance'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">
                      Service-Based
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Agencies, consultants, freelancers, creatives & salons.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-emerald-800 font-medium">
                    ✓ Inventory optional/off
                  </div>
                </button>

                {/* 2. Product-Based */}
                <button
                  type="button"
                  onClick={() => handleSelectType('retail')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    businessType === 'retail' || businessType === 'wholesale'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">
                      Product-Based
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Retail shops, e-commerce, makers, wholesalers & inventory.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-emerald-800 font-medium">
                    ✓ Full stock tracking
                  </div>
                </button>

                {/* 3. Hybrid */}
                <button
                  type="button"
                  onClick={() => handleSelectType('hybrid')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    businessType === 'hybrid'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-slate-900">
                      Hybrid Model
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Businesses selling physical items plus billable services.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-emerald-800 font-medium">
                    ✓ All modules unified
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  <span>Customize Active Modules</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Configure Modules */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Step 3: Configure Relevant Modules
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toggle the tools you need. You can always change this anytime in Settings.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* Inventory module (Explicitly optional for service businesses) */}
                <label className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  modules.inventory ? 'bg-slate-50/80 border-slate-300' : 'bg-white border-slate-200 opacity-70'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Products & Inventory
                        </span>
                        {(businessType === 'service' || businessType === 'freelance') && (
                          <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                            Optional for Service
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Stock quantity levels, safety thresholds, SKU catalog, and wholesale unit costs.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={modules.inventory}
                    onChange={(e) =>
                      setModules((prev) => ({ ...prev, inventory: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* Suppliers module */}
                <label className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  modules.suppliers ? 'bg-slate-50/80 border-slate-300' : 'bg-white border-slate-200 opacity-70'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Suppliers & Purchase Orders
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Vendor accounts, procurement orders, and automated stock receipt.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={modules.suppliers}
                    onChange={(e) =>
                      setModules((prev) => ({ ...prev, suppliers: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* Customers CRM */}
                <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-300 bg-slate-50/80 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Customer Accounts & CRM
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Client contact details, purchase history, and outstanding balances.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={modules.customers}
                    onChange={(e) =>
                      setModules((prev) => ({ ...prev, customers: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* Sales & POS */}
                <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-300 bg-slate-50/80 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                      <ReceiptText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Sales, Services & Invoicing
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Point-of-Sale checkouts, service packages, tax calculations, and printable invoices.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={modules.sales}
                    onChange={(e) =>
                      setModules((prev) => ({ ...prev, sales: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* Expenses & P&L */}
                <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-300 bg-slate-50/80 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                      <PieChart className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Expenses & P&L Reports
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Operating expense tracking, estimated net profit, and tax deduction reports.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={modules.expenses}
                    onChange={(e) =>
                      setModules((prev) => ({ ...prev, expenses: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* AI Strategist */}
                <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-300 bg-slate-50/80 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        AI Business Assistant (Gemini)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Real-time AI diagnostics, pricing advisory, restock planning, and follow-up emails.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={modules.aiAssistant}
                    onChange={(e) =>
                      setModules((prev) => ({ ...prev, aiAssistant: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Launch {name || 'BusinessBuddy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
