import React, { useState } from 'react';
import {
  Truck,
  Plus,
  PackageCheck,
  Clock,
  CheckCircle,
  Building2,
  Mail,
  Phone,
  Edit2,
  Trash2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Supplier, PurchaseOrder } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface SuppliersViewProps {
  onOpenSupplierModal: (supplier?: Supplier) => void;
  onOpenPOModal: () => void;
  searchQuery: string;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  onOpenSupplierModal,
  onOpenPOModal,
  searchQuery,
}) => {
  const {
    profile,
    suppliers,
    purchaseOrders,
    updatePurchaseOrderStatus,
    deleteSupplier,
  } = useBusiness();
  const cs = profile.currencySymbol || '$';

  const [activeTab, setActiveTab] = useState<'pos' | 'suppliers'>('pos');
  const [localSearch, setLocalSearch] = useState<string>('');

  const effectiveSearch = (searchQuery || localSearch).toLowerCase().trim();

  // Metrics
  const activePOs = purchaseOrders.filter((po) => po.status === 'Ordered');
  const incomingStockValue = activePOs.reduce((sum, po) => sum + po.totalAmount, 0);

  const filteredPOs = purchaseOrders.filter((po) => {
    if (!effectiveSearch) return true;
    return (
      po.poNumber.toLowerCase().includes(effectiveSearch) ||
      po.supplierName.toLowerCase().includes(effectiveSearch)
    );
  });

  const filteredSuppliers = suppliers.filter((s) => {
    if (!effectiveSearch) return true;
    return (
      s.name.toLowerCase().includes(effectiveSearch) ||
      s.category.toLowerCase().includes(effectiveSearch) ||
      s.contactPerson.toLowerCase().includes(effectiveSearch)
    );
  });

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Pending Inbound Shipments</span>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {activePOs.length} active purchase orders
          </div>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">
            Awaiting warehouse/store delivery
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Incoming Stock Commitment</span>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatCurrency(incomingStockValue, profile.currency, cs)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Total replenishment investment
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Registered Supply Partners</span>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {suppliers.length} vendors
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Direct trade, kilns & packaging sources
          </span>
        </div>
      </div>

      {/* Tab Switcher & Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'pos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Purchase Orders & Stock ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vendor Directory ({suppliers.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'pos' ? (
            <button
              onClick={onOpenPOModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Purchase Order</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenSupplierModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Content depending on active tab */}
      {activeTab === 'pos' ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Purchase Orders & Incoming Shipments
              </h2>
              <p className="text-xs text-slate-500">
                Track pending deliveries and receive stock directly into product inventory
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6 font-medium">PO #</th>
                  <th className="py-3 px-6 font-medium">Supplier</th>
                  <th className="py-3 px-6 font-medium">Order Date</th>
                  <th className="py-3 px-6 font-medium">Expected Date</th>
                  <th className="py-3 px-6 font-medium">Items Breakdown</th>
                  <th className="py-3 px-6 font-medium text-right">Total</th>
                  <th className="py-3 px-6 font-medium">Status</th>
                  <th className="py-3 px-6 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => {
                    const isOrdered = po.status === 'Ordered';
                    const isReceived = po.status === 'Received';

                    return (
                      <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-semibold text-slate-900">
                          {po.poNumber}
                        </td>
                        <td className="py-3.5 px-6 font-medium text-slate-900">
                          {po.supplierName}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500 font-mono">
                          {po.orderDate}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 font-mono">
                          {po.expectedDate}
                        </td>
                        <td className="py-3.5 px-6 text-slate-700 max-w-xs truncate">
                          {po.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(po.totalAmount, profile.currency, cs)}
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`inline-flex items-center text-[11px] font-semibold ${
                              isReceived
                                ? 'text-emerald-700'
                                : isOrdered
                                ? 'text-amber-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          {isOrdered ? (
                            <button
                              onClick={() => updatePurchaseOrderStatus(po.id, 'Received')}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors whitespace-nowrap"
                            >
                              Receive Stock
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              {isReceived ? 'Stock Added' : po.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Suppliers Directory */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map((supp) => (
            <div
              key={supp.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {supp.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {supp.category} · Terms: <span className="font-mono text-slate-700">{supp.paymentTerms}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenSupplierModal(supp)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete supplier "${supp.name}"?`)) {
                          deleteSupplier(supp.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-20">Contact:</span>
                    <span className="font-medium text-slate-800">{supp.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-20">Email:</span>
                    <a href={`mailto:${supp.email}`} className="text-emerald-700 hover:underline">
                      {supp.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-20">Phone:</span>
                    <span>{supp.phone}</span>
                  </div>
                  {supp.address && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 w-20">Address:</span>
                      <span className="truncate">{supp.address}</span>
                    </div>
                  )}
                  {supp.notes && (
                    <div className="text-[11px] text-slate-500 italic pt-1">
                      Note: {supp.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={onOpenPOModal}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Create Purchase Order</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
