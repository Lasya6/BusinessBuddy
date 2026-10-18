import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  Mail,
  Phone,
  Building,
  Clock,
  CheckCircle2,
  Receipt,
  Edit2,
  Trash2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Customer, CustomerType } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface CustomersViewProps {
  onOpenCustomerModal: (customer?: Customer) => void;
  onOpenPaymentModal: (customer: Customer) => void;
  onViewInvoice: (saleId: string) => void;
  searchQuery: string;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenCustomerModal,
  onOpenPaymentModal,
  onViewInvoice,
  searchQuery,
}) => {
  const { customers, sales, deleteCustomer, profile } = useBusiness();
  const cs = profile.currencySymbol || '$';
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState<string>('');
  const [filterBalance, setFilterBalance] = useState<'all' | 'unpaid' | 'settled'>('all');
  const [filterCustomerType, setFilterCustomerType] = useState<'all' | CustomerType>('all');

  const effectiveSearch = (searchQuery || localSearch).toLowerCase().trim();

  // Metrics
  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalCustomerSpend = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const customersWithDebt = customers.filter((c) => c.outstandingBalance > 0);

  // Filter list
  const filteredCustomers = customers.filter((c) => {
    if (filterBalance === 'unpaid' && c.outstandingBalance <= 0) return false;
    if (filterBalance === 'settled' && c.outstandingBalance > 0) return false;
    const customerType = c.customerType || (c.company ? 'Business' : 'Individual');
    if (filterCustomerType !== 'all' && customerType !== filterCustomerType) return false;

    if (effectiveSearch) {
      const searchableValues = [
        c.name,
        c.email,
        c.phone,
        c.company,
        c.address,
        c.notes,
        customerType,
      ];
      if (!searchableValues.some((value) => value?.toLowerCase().includes(effectiveSearch))) return false;
    }
    return true;
  });

  const activeCustomer = filteredCustomers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0];

  const activeCustomerSales = activeCustomer
    ? sales.filter((s) => s.customerId ? s.customerId === activeCustomer.id : s.customerName === activeCustomer.name)
    : [];

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Customer Accounts</span>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {customers.length} registered clients
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across B2B accounts, clients, and shoppers
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Lifetime Spend</span>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatCurrency(totalCustomerSpend, profile.currency, cs)}
          </div>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">
            Avg: {formatCurrency(totalCustomerSpend / (customers.length || 1), profile.currency, cs)} / client
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Outstanding Balances (Receivables)</span>
          <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${totalReceivables > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {formatCurrency(totalReceivables, profile.currency, cs)}
          </div>
          <span className="text-xs text-amber-700 font-medium mt-1 block">
            {customersWithDebt.length} client {customersWithDebt.length === 1 ? 'account' : 'accounts'} with pending balance
          </span>
        </div>
      </div>

      {/* Main Split Layout: Customer List on Left, Profile & History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Client Directory
              </h2>
              <button
                onClick={() => onOpenCustomerModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Customer</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, phone, email, or notes..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs shrink-0">
                <button
                  onClick={() => setFilterBalance('all')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    filterBalance === 'all' ? 'bg-white text-slate-900 shadow-xs font-medium' : 'text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterBalance('unpaid')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    filterBalance === 'unpaid' ? 'bg-white text-amber-900 shadow-xs font-medium' : 'text-slate-600'
                  }`}
                >
                  Unpaid
                </button>
                <button
                  onClick={() => setFilterBalance('settled')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    filterBalance === 'settled' ? 'bg-white text-emerald-900 shadow-xs font-medium' : 'text-slate-600'
                  }`}
                >
                  Settled
                </button>
              </div>
              <select
                aria-label="Filter customers by type"
                value={filterCustomerType}
                onChange={(e) => setFilterCustomerType(e.target.value as 'all' | CustomerType)}
                className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Customer Cards List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-500 text-xs">
                No customers found matching criteria.
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = activeCustomer?.id === cust.id;
                const hasBalance = cust.outstandingBalance > 0;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {cust.name}
                        </div>
                        {cust.company && (
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{cust.company}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                          {cust.customerType || (cust.company ? 'Business' : 'Individual')}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {cust.email}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {hasBalance ? (
                          <div className="text-xs font-semibold text-amber-800 font-mono tabular-nums">
                            Due: {formatCurrency(cust.outstandingBalance, profile.currency, cs)}
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-700 font-medium">
                            Settled
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono tabular-nums mt-0.5">
                          Spent: {formatCurrency(cust.totalSpent, profile.currency, cs)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Customer Record (7 cols) */}
        <div className="lg:col-span-7">
          {activeCustomer ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              {/* Header profile info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {activeCustomer.name}
                    </h2>
                    {activeCustomer.outstandingBalance > 0 && (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-mono">
                        {formatCurrency(activeCustomer.outstandingBalance, profile.currency, cs)} due
                      </span>
                    )}
                  </div>
                  {activeCustomer.company && (
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {activeCustomer.company}
                    </p>
                  )}
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    {activeCustomer.customerType || (activeCustomer.company ? 'Business' : 'Individual')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Client since {activeCustomer.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeCustomer.outstandingBalance > 0 && (
                    <button
                      onClick={() => onOpenPaymentModal(activeCustomer)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                    >
                      Record Payment
                    </button>
                  )}
                  <button
                    onClick={() => onOpenCustomerModal(activeCustomer)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit customer details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete customer "${activeCustomer.name}"?`)) {
                        deleteCustomer(activeCustomer.id);
                        setSelectedCustomerId(null);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact Card details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="text-slate-400 font-medium">Contact Information</span>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeCustomer.phone}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="text-slate-400 font-medium">Billing & Address</span>
                  <p className="text-slate-700">
                    {activeCustomer.address || 'No billing address on file.'}
                  </p>
                  {activeCustomer.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      Note: {activeCustomer.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Purchase & Invoice History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Purchase & Invoicing History ({activeCustomerSales.length})
                  </h3>
                </div>

                {activeCustomerSales.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No purchase records logged yet for this client.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-4 font-medium">Invoice #</th>
                          <th className="py-2.5 px-4 font-medium">Date</th>
                          <th className="py-2.5 px-4 font-medium">Status</th>
                          <th className="py-2.5 px-4 font-medium text-right">Amount</th>
                          <th className="py-2.5 px-4 font-medium text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeCustomerSales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                              {sale.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 font-mono">
                              {sale.date}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`text-[11px] font-semibold ${
                                  sale.paymentStatus === 'Paid'
                                    ? 'text-emerald-700'
                                    : sale.paymentStatus === 'Overdue'
                                    ? 'text-rose-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {sale.paymentStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                              {formatCurrency(sale.total, profile.currency, cs)}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => onViewInvoice(sale.id)}
                                className="text-slate-500 hover:text-slate-900 text-xs font-medium"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
              Select a customer from the directory to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
