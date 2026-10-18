import React, { useState } from 'react';
import { X, Plus, Trash2, Truck } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { PurchaseOrderItem } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { suppliers, products, createPurchaseOrder, profile } = useBusiness();
  const cs = profile.currencySymbol || '$';

  const physicalProducts = products.filter((p) => p.type === 'product');

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || ''
  );
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      productId: physicalProducts[0]?.id || '',
      productName: physicalProducts[0]?.name || '',
      quantity: 10,
      unitCost: physicalProducts[0]?.costPrice || 10,
      total: (physicalProducts[0]?.costPrice || 10) * 10,
    },
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const prod = physicalProducts[0];
    if (!prod) return;
    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 10,
        unitCost: prod.costPrice,
        total: prod.costPrice * 10,
      },
    ]);
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = physicalProducts.find((p) => p.id === prodId);
    if (!prod) return;
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            productId: prod.id,
            productName: prod.name,
            unitCost: prod.costPrice,
            total: prod.costPrice * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const valid = Math.max(1, qty);
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            quantity: valid,
            total: item.unitCost * valid,
          };
        }
        return item;
      })
    );
  };

  const handleCostChange = (index: number, cost: number) => {
    const valid = Math.max(0, cost);
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            unitCost: valid,
            total: valid * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const handleRemove = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const supp = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

    createPurchaseOrder({
      supplierId: supp ? supp.id : 'supp-general',
      supplierName: supp ? supp.name : 'General Vendor',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate,
      items,
      totalAmount,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              New Purchase Order (PO)
            </h2>
            <p className="text-xs text-slate-500">
              Procure stock from suppliers; once received, stock updates automatically
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Supplier & Expected Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Supplier *
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Replenishment Items
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-6">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    >
                      {physicalProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Current: {p.stockQuantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{cs}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full pl-5 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 text-right">
                    <span className="font-mono font-bold text-xs text-slate-900 tabular-nums">
                      {formatCurrency(item.total, profile.currency, cs)}
                    </span>
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemove(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex-1">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes / instructions for supplier..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500">PO Total: </span>
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {formatCurrency(totalAmount, profile.currency, cs)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              Issue Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
