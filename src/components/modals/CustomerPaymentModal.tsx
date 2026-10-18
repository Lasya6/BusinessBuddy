import React, { useEffect, useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface CustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const { recordCustomerPayment, profile } = useBusiness();
  const cs = profile.currencySymbol || '$';
  const [amount, setAmount] = useState<string>(
    customer?.outstandingBalance ? customer.outstandingBalance.toString() : '0'
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen || !customer) return;
    setAmount(customer.outstandingBalance.toString());
    setPaymentMethod('Bank Transfer');
    setNotes('');
    setFormError('');
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > customer.outstandingBalance) {
      setFormError('Enter a payment greater than zero and no more than the outstanding balance.');
      return;
    }

    if (recordCustomerPayment(customer.id, parsedAmount, paymentMethod, notes)) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Record Customer Payment
            </h2>
            <p className="text-xs text-slate-500">{customer.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && <p role="alert" className="text-xs font-medium text-rose-700">{formError}</p>}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Outstanding Balance:</span>
            <span className="font-mono text-base font-bold text-amber-800">
              {formatCurrency(customer.outstandingBalance, profile.currency, cs)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount Received ({cs}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{cs}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={customer.outstandingBalance}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-base font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {customer.outstandingBalance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(customer.outstandingBalance.toString())}
                className="text-[11px] text-emerald-700 hover:underline mt-1 font-medium"
              >
                Set to full outstanding balance ({formatCurrency(customer.outstandingBalance, profile.currency, cs)})
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="Bank Transfer">Bank Transfer / Wire</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
              <option value="Online">Online Portal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Reference / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Wire confirmation #4928"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
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
              Confirm Settlement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
