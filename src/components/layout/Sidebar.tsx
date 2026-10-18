import React from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ReceiptText,
  PieChart,
  ChartNoAxesCombined,
  Sparkles,
  Settings,
  Store,
  ChevronRight,
  X,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

export type NavTab =
  | 'dashboard'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'sales'
  | 'expenses'
  | 'reports'
  | 'ai-assistant';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
  onOpenSetup: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  onOpenSettings,
  onOpenSetup,
}) => {
  const { profile, lowStockItems, overdueSales } = useBusiness();

  const enabled = profile.enabledModules || {
    inventory: true,
    suppliers: true,
    customers: true,
    sales: true,
    expenses: true,
    aiAssistant: true,
  };

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      visible: true,
    },
    {
      id: 'inventory' as NavTab,
      label: profile.type === 'service' || profile.type === 'freelance' ? 'Service Offerings' : 'Products & Stock',
      icon: Package,
      badge: lowStockItems.length > 0 && enabled.inventory ? lowStockItems.length : null,
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      visible: enabled.inventory,
    },
    {
      id: 'customers' as NavTab,
      label: 'Customers',
      icon: Users,
      badge: overdueSales.length > 0 ? overdueSales.length : null,
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
      visible: enabled.customers,
    },
    {
      id: 'suppliers' as NavTab,
      label: 'Suppliers & POs',
      icon: Truck,
      badge: null,
      visible: enabled.suppliers,
    },
    {
      id: 'sales' as NavTab,
      label: profile.type === 'service' || profile.type === 'freelance' ? 'Invoicing & Sales' : 'Sales & Services',
      icon: ReceiptText,
      badge: null,
      visible: enabled.sales,
    },
    {
      id: 'expenses' as NavTab,
      label: 'Expenses & Profit',
      icon: PieChart,
      badge: null,
      visible: enabled.expenses,
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports & Analytics',
      icon: ChartNoAxesCombined,
      badge: null,
      visible: true,
    },
    {
      id: 'ai-assistant' as NavTab,
      label: 'AI Strategist',
      icon: Sparkles,
      highlight: true,
      badge: 'Gemini',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      visible: enabled.aiAssistant,
    },
  ].filter((item) => item.visible);

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const businessTypeLabels: Record<string, string> = {
    retail: 'Retail Store',
    service: 'Service / Agency',
    wholesale: 'Wholesale & B2B',
    freelance: 'Freelance Studio',
    hybrid: 'Retail & Services',
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Workspace Header */}
        <div>
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                B
              </div>
              <div>
                <span className="font-semibold text-slate-900 tracking-tight text-base block leading-none">
                  BusinessBuddy
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Universal Business OS
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Business Profile Card */}
          <div className="p-4">
            <button
              onClick={onOpenSetup}
              title="Click to change business type or configure modules"
              className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors group flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {profile.name}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium truncate">
                    {businessTypeLabels[profile.type] || profile.type} · Setup
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-emerald-700'
                          : item.highlight
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono tabular-nums shrink-0 ${
                        item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: Owner Profile & Settings */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={profile.ownerAvatarUrl || '/src/assets/images/business_owner_avatar_1792239161351.jpg'}
                alt={profile.ownerName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {profile.ownerName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Owner & Operator
                </p>
              </div>
            </div>
            <Settings className="w-4 h-4 text-slate-400 hover:text-slate-600 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};
