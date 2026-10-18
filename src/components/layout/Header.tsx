import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Receipt,
  PackagePlus,
  DollarSign,
  UserPlus,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useBusiness } from '../../context/BusinessContext';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileNav: () => void;
  onQuickAction: (action: 'sale' | 'product' | 'expense' | 'customer' | 'ai') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileNav,
  onQuickAction,
  searchQuery,
  onSearchChange,
}) => {
  const { profile } = useBusiness();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const enabled = profile.enabledModules || {
    inventory: true,
    suppliers: true,
    customers: true,
    sales: true,
    expenses: true,
    aiAssistant: true,
  };

  const isServiceOnly = profile.type === 'service' || profile.type === 'freelance';

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Overview', subtitle: `${profile.name} · Real-time operational diagnostics` },
    inventory: {
      title: isServiceOnly ? 'Service Offerings' : 'Products & Inventory',
      subtitle: isServiceOnly ? 'Manage billable packages, retainers & rates' : 'Manage physical items, services & safety stock',
    },
    customers: { title: 'Customers & CRM', subtitle: 'Client relationships, purchase history & balances' },
    suppliers: { title: 'Suppliers & Purchases', subtitle: 'Vendor accounts & incoming stock replenishment' },
    sales: { title: isServiceOnly ? 'Client Invoicing' : 'Sales & Services', subtitle: 'Transactions, point-of-sale & receivables' },
    expenses: { title: 'Expenses & Reports', subtitle: 'Operational costs, gross margins & net profit' },
    reports: { title: 'Reports & Analytics', subtitle: 'Saved sales, product, customer & expense analysis' },
    'ai-assistant': { title: 'AI Business Strategist', subtitle: 'Strategic intelligence powered by Gemini' },
  };

  const handleAction = (act: 'sale' | 'product' | 'expense' | 'customer' | 'ai') => {
    setDropdownOpen(false);
    onQuickAction(act);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile trigger & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileNav}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg lg:hidden"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-900 truncate">
              {tabTitles[currentTab]?.title || 'Dashboard'}
            </span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-xs text-slate-500 hidden sm:inline truncate max-w-xs md:max-w-md">
              {tabTitles[currentTab]?.subtitle}
            </span>
          </div>
        </div>

        {/* Right Zone: Search + Quick Add Button + AI Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder={`Search ${tabTitles[currentTab]?.title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-48 lg:w-64 pl-3 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* AI Quick Button */}
          {enabled.aiAssistant && (
            <button
              onClick={() => onQuickAction('ai')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-lg transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ask AI</span>
            </button>
          )}

          {/* Quick Add Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Actions
                  </div>

                  {enabled.sales && (
                    <button
                      onClick={() => handleAction('sale')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
                    >
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      <span>{isServiceOnly ? 'New Client Invoice' : 'New Sale / Invoice'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleAction('product')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
                  >
                    <PackagePlus className="w-4 h-4 text-emerald-600" />
                    <span>{enabled.inventory ? 'Add Product or Service' : 'Add Service Offering'}</span>
                  </button>

                  {enabled.expenses && (
                    <button
                      onClick={() => handleAction('expense')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Log Business Expense</span>
                    </button>
                  )}

                  {enabled.customers && (
                    <button
                      onClick={() => handleAction('customer')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-600" />
                      <span>New Customer</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
