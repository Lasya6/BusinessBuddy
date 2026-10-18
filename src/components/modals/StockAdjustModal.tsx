import React, { useState } from 'react';
import { X, Sliders, Plus, Minus } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { ProductItem } from '../../types';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { adjustStock } = useBusiness();
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState<string>('Restock / Shipment');
  const [note, setNote] = useState<string>('');

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity;
  const newStock = Math.max(0, currentStock + adjustment);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustment === 0) {
      onClose();
      return;
    }
    const fullNote = `${reason}${note ? `: ${note}` : ''}`;
    adjustStock(product.id, adjustment, fullNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Adjust Inventory Stock
            </h2>
            <p className="text-xs text-slate-500">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current vs New Stock Display */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Current Stock</span>
              <div className="text-2xl font-bold font-mono text-slate-700 mt-1">
                {currentStock}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium">New Stock</span>
              <div className={`text-2xl font-bold font-mono mt-1 ${newStock <= product.minThreshold ? 'text-amber-700' : 'text-emerald-700'}`}>
                {newStock}
              </div>
            </div>
          </div>

          {/* Stepper adjustment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Adjustment Units
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAdjustment((prev) => prev - 1)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(parseInt(e.target.value, 10) || 0)}
                className="flex-1 text-center py-2 text-base font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => setAdjustment((prev) => prev + 1)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Pill presets */}
            <div className="flex items-center gap-2 mt-2">
              {[5, 10, 20, -1, -5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAdjustment(val)}
                  className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Adjustment
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="Restock / Shipment">Restock / Received Shipment</option>
              <option value="Customer Return">Customer Return</option>
              <option value="Physical Inventory Audit">Physical Inventory Audit / Count</option>
              <option value="Damaged / Breakage">Damaged / Expired / Breakage</option>
              <option value="Internal Use / Sample">Internal Use / Showroom Sample</option>
            </select>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Box 3 inspected by warehouse"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
              Confirm Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
