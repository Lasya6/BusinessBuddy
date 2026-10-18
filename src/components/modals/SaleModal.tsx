import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { SaleLineItem, PaymentMethod, PaymentStatus } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roundCurrency = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export const SaleModal: React.FC<SaleModalProps> = ({ isOpen, onClose }) => {
  const { products, customers, createSale, profile } = useBusiness();
  const saleableProducts = products.filter((product) => product.active && (product.type === 'service' || product.stockQuantity > 0));

  const [customerMode, setCustomerMode] = useState<'existing' | 'walkin'>(customers.length ? 'existing' : 'walkin');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [walkinName, setWalkinName] = useState<string>('Walk-in Customer');
  const [items, setItems] = useState<SaleLineItem[]>([]);

  const [taxPercent, setTaxPercent] = useState<string>(profile.taxRatePercent.toString());
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState('');
  const submissionLock = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    submissionLock.current = false;
    const firstProduct = products.find((product) => product.active && (product.type === 'service' || product.stockQuantity > 0));
    setCustomerMode(customers.length ? 'existing' : 'walkin');
    setSelectedCustomerId(customers[0]?.id || '');
    setWalkinName('Walk-in Customer');
    setItems(firstProduct ? [{
      itemId: firstProduct.id,
      itemName: firstProduct.name,
      type: firstProduct.type,
      quantity: 1,
      unitPrice: firstProduct.sellingPrice,
      total: roundCurrency(firstProduct.sellingPrice),
    }] : []);
    setTaxPercent(profile.taxRatePercent.toString());
    setDiscountAmount('0');
    setPaymentMethod('Credit Card');
    setPaymentStatus('Paid');
    setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
  }, [isOpen, customers, products, profile.taxRatePercent]);

  const cs = profile.currencySymbol || '$';
  const isServiceOnly = profile.type === 'service' || profile.type === 'freelance';

  if (!isOpen) return null;

  const getAvailableQuantity = (productId: string, excludedIndex = -1) => {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) return 0;
    if (product.type === 'service') return Number.MAX_SAFE_INTEGER;
    const reservedQuantity = items.reduce(
      (total, item, index) => index !== excludedIndex && item.itemId === productId ? total + item.quantity : total,
      0
    );
    return Math.max(0, product.stockQuantity - reservedQuantity);
  };

  // Add line item
  const handleAddItem = () => {
    const defaultProd = saleableProducts.find((product) => getAvailableQuantity(product.id) > 0);
    if (!defaultProd) return;
    setItems((prev) => [
      ...prev,
      {
        itemId: defaultProd.id,
        itemName: defaultProd.name,
        type: defaultProd.type,
        quantity: 1,
        unitPrice: defaultProd.sellingPrice,
        total: roundCurrency(defaultProd.sellingPrice),
      },
    ]);
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const prod = saleableProducts.find((p) => p.id === productId);
    if (!prod) return;
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index && getAvailableQuantity(productId, index) >= item.quantity) {
          return {
            ...item,
            itemId: prod.id,
            itemName: prod.name,
            type: prod.type,
            unitPrice: prod.sellingPrice,
            total: roundCurrency(prod.sellingPrice * item.quantity),
          };
        }
        return item;
      })
    );
  };

  const handleItemQuantityChange = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const availableQuantity = getAvailableQuantity(item.itemId, index);
          if (availableQuantity < 1) return item;
          const validQty = Math.min(availableQuantity, Math.max(1, Number.isFinite(qty) ? Math.floor(qty) : 1));
          return {
            ...item,
            quantity: validQty,
            total: roundCurrency(item.unitPrice * validQty),
          };
        }
        return item;
      })
    );
  };

  const handleItemPriceChange = (index: number, price: number) => {
    const validPrice = Math.round(Math.max(0, Number.isFinite(price) ? price : 0) * 100) / 100;
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            unitPrice: validPrice,
            total: roundCurrency(validPrice * item.quantity),
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.total, 0));
  const discount = roundCurrency(Math.min(subtotal, Math.max(0, Number(discountAmount) || 0)));
  const taxableBase = Math.max(0, subtotal - discount);
  const tax = roundCurrency((taxableBase * Math.max(0, Number(taxPercent) || 0)) / 100);
  const grandTotal = roundCurrency(taxableBase + tax);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionLock.current) return;
    if (!items.length) {
      setFormError('Add at least one active product or service.');
      return;
    }

    let custName = walkinName;
    let custId: string | undefined = undefined;

    if (customerMode === 'existing') {
      const cust = customers.find((c) => c.id === selectedCustomerId);
      if (!cust) {
        setFormError('Select a customer or choose Walk-in.');
        return;
      }
      custName = cust.name;
      custId = cust.id;
    } else if (!walkinName.trim()) {
      setFormError('Enter a customer name or choose an existing customer.');
      return;
    }

    if (items.some((item) => !item.itemId || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
      setFormError('Check each item, quantity, and price before creating the sale.');
      return;
    }

    submissionLock.current = true;
    const created = createSale({
      customerId: custId,
      customerName: custName.trim(),
      date: new Date().toISOString().split('T')[0],
      items,
      subtotal,
      tax,
      discount,
      total: grandTotal,
      paymentMethod,
      paymentStatus,
      dueDate: paymentStatus !== 'Paid' ? dueDate : undefined,
      notes: notes.trim(),
    });

    if (created) onClose();
    else {
      submissionLock.current = false;
      setFormError('One or more items no longer have enough stock. Review the items and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              New Sale / Invoice
            </h2>
            <p className="text-xs text-slate-500">
              Record walk-in store checkout or generate billable invoice
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {formError && (
            <p role="alert" className="text-xs font-medium text-rose-700">
              {formError}
            </p>
          )}

          {/* Customer Selection */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Customer Information
              </label>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('walkin')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    customerMode === 'walkin'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Walk-in
                </button>
                <button
                  type="button"
                  disabled={!customers.length}
                  onClick={() => setCustomerMode('existing')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    customerMode === 'existing'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Select Client Account
                </button>
              </div>
            </div>

            {customerMode === 'walkin' ? (
              <input
                type="text"
                value={walkinName}
                onChange={(e) => setWalkinName(e.target.value)}
                placeholder="Walk-in Customer / Retail Guest"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                      {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} - {c.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Line Items & Services
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!saleableProducts.some((product) => getAvailableQuantity(product.id) > 0)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {!items.length && (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                  No active products or services are available for sale.
                </p>
              )}
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  {/* Select product */}
                  <div className="sm:col-span-6">
                    <select
                      value={item.itemId}
                      required
                      onChange={(e) => handleItemProductChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {saleableProducts.filter((product) => product.id === item.itemId || getAvailableQuantity(product.id, idx) >= item.quantity).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.type === 'service' ? 'Service' : `${p.stockQuantity} in stock`}) — {formatCurrency(p.sellingPrice, profile.currency, cs)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      max={products.find((product) => product.id === item.itemId)?.type === 'product'
                        ? getAvailableQuantity(item.itemId, idx)
                        : undefined}
                      value={item.quantity}
                      onChange={(e) => handleItemQuantityChange(idx, parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Unit price */}
                  <div className="sm:col-span-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{cs}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={item.unitPrice}
                        onChange={(e) => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full pl-5 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Total & Delete */}
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 text-right">
                    <span className="font-mono font-bold text-xs text-slate-900 tabular-nums">
                      {formatCurrency(item.total, profile.currency, cs)}
                    </span>
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details & Taxes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Left: Payment Method & Status */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Credit Card">Credit Card / Terminal</option>
                  <option value="Cash">Cash at Register</option>
                  <option value="Bank Transfer">Bank Transfer / Wire</option>
                  <option value="Online">Online Payment Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Paid">Paid / Settled</option>
                  <option value="Pending">Pending / Net Terms</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {paymentStatus !== 'Paid' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}
            </div>

            {/* Right: Calculations Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-800">
                  {formatCurrency(subtotal, profile.currency, cs)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Discount ({cs}):</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-24 px-2 py-1 text-right text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Tax Rate (%):</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-24 px-2 py-1 text-right text-xs bg-white border border-slate-200 rounded-md font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Calculated Tax:</span>
                <span className="font-mono tabular-nums text-slate-800">
                  {formatCurrency(tax, profile.currency, cs)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between font-bold text-sm text-slate-900">
                <span>Total Due:</span>
                <span className="font-mono text-emerald-800 text-base tabular-nums">
                  {formatCurrency(grandTotal, profile.currency, cs)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Receipt / Invoice Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivered project deliverables, thank you for your business!"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Footer */}
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
              {isServiceOnly ? 'Issue Client Invoice' : 'Complete Sale & Issue Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
