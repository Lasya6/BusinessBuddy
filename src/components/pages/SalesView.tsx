import React, { useState } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Eye,
  Trash2,
  Filter,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { SaleTransaction } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface SalesViewProps {
  onOpenSaleModal: () => void;
  onViewInvoice: (saleId: string) => void;
  searchQuery: string;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onOpenSaleModal,
  onViewInvoice,
  searchQuery,
}) => {
  const { profile, sales, updateSaleStatus, deleteSale } = useBusiness();
  const cs = profile.currencySymbol || '$';
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending' | 'Overdue'>('all');
  const [localSearch, setLocalSearch] = useState<string>('');

  const effectiveSearch = (searchQuery || localSearch).toLowerCase().trim();

  // Metrics
  const totalVolume = sales.reduce((sum, s) => sum + s.total, 0);
  const collectedCash = sales.reduce((sum, sale) => sum + Math.max(0, Math.min(sale.total, sale.paidAmount ?? (sale.paymentStatus === 'Paid' ? sale.total : 0))), 0);
  const unpaidVolume = sales
    .filter((sale) => sale.paymentStatus !== 'Paid')
    .reduce((sum, sale) => sum + Math.max(0, sale.total - (sale.paidAmount ?? 0)), 0);
  const avgOrderValue = sales.length > 0 ? totalVolume / sales.length : 0;

  // Filtered sales
  const filteredSales = sales.filter((s) => {
    if (statusFilter !== 'all' && s.paymentStatus !== statusFilter) return false;
    if (effectiveSearch) {
      const matchInv = s.invoiceNumber.toLowerCase().includes(effectiveSearch);
      const matchCust = s.customerName.toLowerCase().includes(effectiveSearch);
      const matchItem = s.items.some((i) => i.itemName.toLowerCase().includes(effectiveSearch));
      if (!matchInv && !matchCust && !matchItem) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Invoice #', 'Customer', 'Date', 'Payment Method', 'Status', 'Subtotal', 'Tax', 'Discount', 'Total'];
    const rows = sales.map((s) => [
      s.invoiceNumber,
      `"${s.customerName.replace(/"/g, '""')}"`,
      s.date,
      s.paymentMethod,
      s.paymentStatus,
      s.subtotal.toFixed(2),
      s.tax.toFixed(2),
      s.discount.toFixed(2),
      s.total.toFixed(2),
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `businessbuddy_sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Gross Sales Volume</span>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatCurrency(totalVolume, profile.currency, cs)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {sales.length} transactions
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Cash Collected</span>
          <div className="text-xl font-bold text-emerald-800 font-mono tabular-nums mt-1">
            {formatCurrency(collectedCash, profile.currency, cs)}
          </div>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">
            Includes partial invoice payments
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Unsettled Receivables</span>
          <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${unpaidVolume > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {formatCurrency(unpaidVolume, profile.currency, cs)}
          </div>
          <span className="text-xs text-amber-700 font-medium mt-1 block">
            Pending client payment
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Average Order Value (AOV)</span>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatCurrency(avgOrderValue, profile.currency, cs)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Per customer checkout
          </span>
        </div>
      </div>

      {/* Control Bar: Filter Tabs, Search & Action */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Transactions ({sales.length})
            </button>
            <button
              onClick={() => setStatusFilter('Paid')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'Paid'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid ({sales.filter((s) => s.paymentStatus === 'Paid').length})
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'Pending'
                  ? 'bg-white text-amber-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({sales.filter((s) => s.paymentStatus === 'Pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('Overdue')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'Overdue'
                  ? 'bg-white text-rose-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overdue ({sales.filter((s) => s.paymentStatus === 'Overdue').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenSaleModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Sale / Invoice</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative pt-2 border-t border-slate-100">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 mt-1 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, or item description..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-6 font-medium">Invoice #</th>
                <th className="py-3 px-6 font-medium">Customer</th>
                <th className="py-3 px-6 font-medium">Date / Due</th>
                <th className="py-3 px-6 font-medium">Items Breakdown</th>
                <th className="py-3 px-6 font-medium">Payment Method</th>
                <th className="py-3 px-6 font-medium">Status</th>
                <th className="py-3 px-6 font-medium text-right">Total</th>
                <th className="py-3 px-6 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No transactions match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Invoice */}
                    <td className="py-3.5 px-6 font-mono font-semibold text-slate-900">
                      {sale.invoiceNumber}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-6 font-medium text-slate-900">
                      {sale.customerName}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-6 text-slate-600 font-mono">
                      <div>{sale.date}</div>
                      {sale.dueDate && sale.paymentStatus !== 'Paid' && (
                        <div className="text-[10px] text-amber-700">
                          Due: {sale.dueDate}
                        </div>
                      )}
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-6 text-slate-700 max-w-xs truncate">
                      {sale.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-6 text-slate-600">
                      {sale.paymentMethod}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6">
                      <select
                        value={sale.paymentStatus}
                        onChange={(e) =>
                          updateSaleStatus(
                            sale.id,
                            e.target.value as 'Paid' | 'Pending' | 'Overdue'
                          )
                        }
                        className={`text-[11px] font-semibold rounded-md px-2 py-0.5 border focus:outline-none ${
                          sale.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : sale.paymentStatus === 'Overdue'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(sale.total, profile.currency, cs)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewInvoice(sale.id)}
                          title="View & Print Receipt/Invoice"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete transaction ${sale.invoiceNumber}?`)) {
                              deleteSale(sale.id);
                            }
                          }}
                          title="Delete Sale"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
