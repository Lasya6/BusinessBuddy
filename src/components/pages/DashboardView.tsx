import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Receipt,
  Package,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { monthlyFinancialHistory } from '../../data/mockData';
import { NavTab } from '../layout/Sidebar';
import { formatCurrency } from '../../utils/currency';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onQuickAction: (action: 'sale' | 'product' | 'expense' | 'customer' | 'ai') => void;
  onViewInvoice: (saleId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onQuickAction,
  onViewInvoice,
}) => {
  const {
    profile,
    products,
    customers,
    sales,
    expenses,
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMarginPercent,
    outstandingReceivables,
    lowStockItems,
    overdueSales,
  } = useBusiness();

  const [chartTimeframe, setChartTimeframe] = useState<'6m' | 'items'>('6m');

  // Calculate product sales distribution
  const productSalesMap: Record<string, { name: string; revenue: number; quantity: number }> = {};
  sales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSalesMap[item.itemId]) {
        productSalesMap[item.itemId] = {
          name: item.itemName,
          revenue: 0,
          quantity: 0,
        };
      }
      productSalesMap[item.itemId].revenue += item.total;
      productSalesMap[item.itemId].quantity += item.quantity;
    });
  });

  const topSellingList = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxRevenueHistory = Math.max(...monthlyFinancialHistory.map((m) => m.revenue));
  const stockUnitsOnHand = products
    .filter((product) => product.type === 'product')
    .reduce((total, product) => total + product.stockQuantity, 0);

  const isInventoryEnabled = profile.enabledModules?.inventory ?? true;
  const isServiceOnly = profile.type === 'service' || profile.type === 'freelance';
  const cs = profile.currencySymbol || '$';

  const bannerTitle = isServiceOnly
    ? 'Professional Services & Client Overview'
    : profile.type === 'retail' || profile.type === 'wholesale'
    ? 'Retail & Inventory Operations'
    : 'Financial & Operations Overview';

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Visual & Quick Stats */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-white">
        <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-slate-900">
          <img
            src="/src/assets/images/business_store_banner_1792239161317.jpg"
            alt="Business Workspace"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium tracking-wide">
                <span>{profile.name}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{profile.type} Operations</span>
                {!isInventoryEnabled && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Service Billing Mode (No Inventory Required)</span>
                  </>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                {bannerTitle}
              </h1>
            </div>

            <button
              onClick={() => onQuickAction('ai')}
              className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-50 rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ask AI Strategist</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">
              {isServiceOnly ? 'Client Revenue' : 'Total Revenue'}
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {formatCurrency(totalRevenue, profile.currency, cs)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.8% vs last month</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Operating Expenses</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {formatCurrency(totalExpenses, profile.currency, cs)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span>{expenses.length} tracked expense entries</span>
          </div>
        </div>

        {/* Net Profit & Margin */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Estimated Net Profit</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(netProfit, profile.currency, cs)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
            <span className="font-semibold text-emerald-700 font-mono tabular-nums">
              {profitMarginPercent.toFixed(1)}%
            </span>
            <span className="text-slate-500">net operating margin</span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">
              {isServiceOnly ? 'Outstanding Invoices' : 'Receivables & Invoices'}
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-900 font-mono tabular-nums">
              {formatCurrency(outstandingReceivables, profile.currency, cs)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium mt-2">
            <span>{overdueSales.length} overdue</span>
            <span aria-hidden="true">·</span>
            <span>{sales.filter((s) => s.paymentStatus === 'Pending').length} pending</span>
          </div>
        </div>
      </div>

      {/* Actionable Alerts Section: Low stock alert ONLY shown if inventory is enabled */}
      {((isInventoryEnabled && lowStockItems.length > 0) || overdueSales.length > 0) && (
        <div className={`grid grid-cols-1 ${isInventoryEnabled && lowStockItems.length > 0 && overdueSales.length > 0 ? 'md:grid-cols-2' : ''} gap-4`}>
          {/* Low Stock Alert */}
          {isInventoryEnabled && lowStockItems.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-amber-900">
                    Low Inventory Warning ({lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'})
                  </h3>
                  <p className="text-xs text-amber-800 mt-1">
                    {lowStockItems
                      .map((i) => `${i.name} (${i.stockQuantity} ${i.unit}s left)`)
                      .join(', ')}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => onNavigate('inventory')}
                  className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200/80 rounded-lg transition-colors"
                >
                  Manage Inventory
                </button>
                <button
                  onClick={() => onNavigate('suppliers')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors"
                >
                  Create Restock PO
                </button>
              </div>
            </div>
          )}

          {/* Overdue Payments Alert */}
          {overdueSales.length > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-rose-900">
                    Unpaid Receivables Alert ({overdueSales.length} overdue)
                  </h3>
                  <p className="text-xs text-rose-800 mt-1">
                    {overdueSales
                      .map((s) => `${s.customerName} (${s.invoiceNumber}: ${formatCurrency(Math.max(0, s.total - (s.paidAmount ?? 0)), profile.currency, cs)})`)
                      .join('; ')}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => onQuickAction('ai')}
                  className="px-3 py-1.5 text-xs font-medium text-rose-900 bg-rose-100 hover:bg-rose-200/80 rounded-lg transition-colors"
                >
                  Draft Follow-up Email
                </button>
                <button
                  onClick={() => onNavigate('sales')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors"
                >
                  View Invoices
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Trends Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Revenue & Profit Trajectory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly performance overview and gross cash generation
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
              <button
                onClick={() => setChartTimeframe('6m')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartTimeframe === '6m'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Past 6 Months
              </button>
              <button
                onClick={() => setChartTimeframe('items')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartTimeframe === 'items'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top Items
              </button>
            </div>
          </div>

          {chartTimeframe === '6m' ? (
            <div className="space-y-4">
              {/* Bar visualization */}
              <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
                {monthlyFinancialHistory.map((item, idx) => {
                  const revHeight = (item.revenue / maxRevenueHistory) * 100;
                  const expHeight = (item.expenses / maxRevenueHistory) * 100;
                  const isCurrentMonth = idx === monthlyFinancialHistory.length - 1;

                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] rounded-lg py-1 px-2.5 pointer-events-none whitespace-nowrap z-20 shadow-md font-mono">
                        <div>Rev: {formatCurrency(item.revenue, profile.currency, cs)}</div>
                        <div className="text-emerald-400">Net: {formatCurrency(item.profit, profile.currency, cs)}</div>
                      </div>

                      {/* Bar columns */}
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44">
                        {/* Revenue Bar */}
                        <div
                          style={{ height: `${revHeight}%` }}
                          className={`w-3 sm:w-5 rounded-t-sm transition-all duration-300 ${
                            isCurrentMonth
                              ? 'bg-emerald-600 group-hover:bg-emerald-700'
                              : 'bg-emerald-400/80 group-hover:bg-emerald-500'
                          }`}
                        />
                        {/* Expenses Bar */}
                        <div
                          style={{ height: `${expHeight}%` }}
                          className="w-3 sm:w-5 bg-slate-200 group-hover:bg-slate-300 rounded-t-sm transition-all duration-300"
                        />
                      </div>

                      <span className={`text-[11px] truncate mt-1 ${isCurrentMonth ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                        {item.month.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend & Summary */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
                    <span>Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-slate-200 inline-block" />
                    <span>Expenses</span>
                  </div>
                </div>
                <span className="font-mono tabular-nums text-slate-500">
                  Peak Month: {formatCurrency(maxRevenueHistory, profile.currency, cs)}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {topSellingList.map((item, idx) => {
                const maxVal = topSellingList[0]?.revenue || 1;
                const pct = (item.revenue / maxVal) * 100;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 truncate max-w-[240px]">
                        {idx + 1}. {item.name}
                      </span>
                      <span className="font-mono tabular-nums text-slate-900 font-semibold">
                        {formatCurrency(item.revenue, profile.currency, cs)} ({item.quantity} sold)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions & Business Mix Breakdown (1 Column) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                {isInventoryEnabled ? 'Catalog & Operations' : 'Services & Client Portfolio'}
              </h2>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {isInventoryEnabled ? `${products.length} active items` : `${products.filter(p => p.type === 'service').length} services`}
              </span>
            </div>

            {/* Distribution metrics */}
            <div className="space-y-3 mb-6">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                {isInventoryEnabled ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Physical Products</span>
                      <span className="font-semibold text-slate-900 font-mono tabular-nums">
                        {products.filter((p) => p.type === 'product').length} items
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Stock Units on Hand</span>
                      <span className="font-semibold text-slate-900 font-mono tabular-nums">
                        {stockUnitsOnHand.toLocaleString()} units
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Services & Packages</span>
                      <span className="font-semibold text-slate-900 font-mono tabular-nums">
                        {products.filter((p) => p.type === 'service').length} services
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Total Stock Value (Cost)</span>
                      <span className="font-semibold text-slate-900 font-mono tabular-nums">
                        {formatCurrency(products
                          .filter((p) => p.type === 'product')
                          .reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0), profile.currency, cs)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Active Service Offerings</span>
                      <span className="font-semibold text-slate-900 font-mono tabular-nums">
                        {products.filter((p) => p.type === 'service').length} billable packages
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Average Billable Rate</span>
                      <span className="font-semibold text-slate-900 font-mono tabular-nums">
                        {formatCurrency(products.filter(p => p.type === 'service').length > 0
                          ? products.filter(p => p.type === 'service').reduce((s, p) => s + p.sellingPrice, 0) / products.filter(p => p.type === 'service').length
                          : 0, profile.currency, cs)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Operating Model</span>
                      <span className="font-semibold text-emerald-800">
                        Zero Inventory / Services
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Customer Stats */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Total Customer Base</span>
                  <span className="font-semibold text-slate-900 font-mono tabular-nums">
                    {customers.length} clients
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Avg Revenue per Customer</span>
                  <span className="font-semibold text-slate-900 font-mono tabular-nums">
                    {formatCurrency(customers.length > 0 ? totalRevenue / customers.length : 0, profile.currency, cs)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onQuickAction('sale')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <span>{isServiceOnly ? '+ Create Client Invoice' : '+ Record New Sale or Invoice'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onQuickAction('product')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
            >
              <span>{isInventoryEnabled ? '+ Add New Product / Service' : '+ Add Service Offering'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onQuickAction('expense')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
            >
              <span>+ Log Business Expense</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Sales Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-500">
              Latest invoices, retail receipts, and service billings
            </p>
          </div>

          <button
            onClick={() => onNavigate('sales')}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>View All Sales</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-6 font-medium">Invoice #</th>
                <th className="py-3 px-6 font-medium">Customer</th>
                <th className="py-3 px-6 font-medium">Items Breakdown</th>
                <th className="py-3 px-6 font-medium">Date</th>
                <th className="py-3 px-6 font-medium">Status</th>
                <th className="py-3 px-6 font-medium text-right">Total</th>
                <th className="py-3 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 5).map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 px-6 font-mono font-medium text-slate-900">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-3 px-6 font-medium text-slate-900">
                    {sale.customerName}
                  </td>
                  <td className="py-3 px-6 text-slate-600 max-w-xs truncate">
                    {sale.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                  </td>
                  <td className="py-3 px-6 text-slate-500 font-mono">
                    {sale.date}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`inline-flex items-center text-[11px] font-medium ${
                        sale.paymentStatus === 'Paid'
                          ? 'text-emerald-700 font-semibold'
                          : sale.paymentStatus === 'Overdue'
                          ? 'text-rose-700 font-semibold'
                          : 'text-amber-700 font-semibold'
                      }`}
                    >
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(sale.total, profile.currency, cs)}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      onClick={() => onViewInvoice(sale.id)}
                      className="text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
                    >
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
