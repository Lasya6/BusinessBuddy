import React from 'react';
import { X, Printer, Download, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency } from '../../utils/currency';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  saleId,
}) => {
  const { sales, customers, profile } = useBusiness();
  const cs = profile.currencySymbol || '$';

  if (!isOpen || !saleId) return null;

  const sale = sales.find((s) => s.id === saleId);
  if (!sale) return null;
  const customer = customers.find((record) => record.id === sale.customerId);
  const paidAmount = Math.min(sale.total, Math.max(0, sale.paidAmount ?? (sale.paymentStatus === 'Paid' ? sale.total : 0)));
  const balanceDue = Math.max(0, sale.total - paidAmount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-modal-root fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="invoice-document bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tax Invoice / Receipt
            </span>
            <span className="font-mono text-xs font-bold text-slate-900">
              #{sale.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-8 space-y-6 bg-white text-slate-900">
          {/* Company & Invoice Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  B
                </div>
                <h1 className="text-base font-bold text-slate-900">
                  {profile.name}
                </h1>
              </div>
              <p className="text-xs text-slate-500 max-w-xs">
                {profile.address}
              </p>
              <p className="text-xs text-slate-500">
                {profile.email} · {profile.phone}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold font-mono text-slate-900">
                INVOICE
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Ref: <span className="font-mono font-medium text-slate-800">{sale.invoiceNumber}</span>
              </div>
              <div className="text-xs text-slate-500">
                Date: <span className="font-mono">{sale.date}</span>
              </div>
              {sale.dueDate && sale.paymentStatus !== 'Paid' && (
                <div className="text-xs text-amber-700 font-semibold mt-0.5">
                  Due: <span className="font-mono">{sale.dueDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bill To & Payment Status */}
          <div className="flex justify-between items-start text-xs">
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Billed To
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {sale.customerName}
              </p>
              {customer?.company && <p className="text-xs text-slate-600 mt-0.5">{customer.company}</p>}
              {customer?.email && <p className="text-xs text-slate-500 mt-0.5">{customer.email}</p>}
              {customer?.phone && <p className="text-xs text-slate-500">{customer.phone}</p>}
              {customer?.address && <p className="text-xs text-slate-500 mt-0.5">{customer.address}</p>}
            </div>

            <div className="text-right">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Payment Status
              </span>
              <div className="mt-0.5">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                    sale.paymentStatus === 'Paid'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : sale.paymentStatus === 'Overdue'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {sale.paymentStatus} ({sale.paymentMethod})
                </span>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Description</th>
                  <th className="py-2.5 px-4 font-medium text-center">Qty</th>
                  <th className="py-2.5 px-4 font-medium text-right">Unit Price</th>
                  <th className="py-2.5 px-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {item.itemName}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(item.unitPrice, profile.currency, cs)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(item.total, profile.currency, cs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial summary calculations */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums">{formatCurrency(sale.subtotal, profile.currency, cs)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount:</span>
                  <span className="font-mono tabular-nums text-emerald-700">-{formatCurrency(sale.discount, profile.currency, cs)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax:</span>
                <span className="font-mono tabular-nums">{formatCurrency(sale.tax, profile.currency, cs)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-mono tabular-nums">{formatCurrency(paidAmount, profile.currency, cs)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Balance Due:</span>
                <span className="font-mono text-emerald-800 text-base tabular-nums">
                  {formatCurrency(balanceDue, profile.currency, cs)}
                </span>
              </div>
            </div>
          </div>

          {sale.paymentHistory && sale.paymentHistory.length > 0 && (
            <div className="text-xs space-y-2">
              <h2 className="font-semibold text-slate-800">Payment History</h2>
              {sale.paymentHistory.map((payment) => (
                <div key={payment.id} className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-2 text-slate-600">
                  <span>{payment.date} · {payment.method}{payment.reference ? ` · ${payment.reference}` : ''}</span>
                  <span className="font-mono tabular-nums">{formatCurrency(payment.amount, profile.currency, cs)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes & Footer */}
          {sale.notes && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Notes: </span>
              {sale.notes}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
            Thank you for supporting {profile.name}! For inquiries, reach us at {profile.email}.
          </div>
        </div>
      </div>
    </div>
  );
};
