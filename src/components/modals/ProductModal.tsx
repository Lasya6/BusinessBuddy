import React, { useState, useEffect } from 'react';
import { X, Package, Layers, Sparkles } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { ProductItem, ItemType } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: ProductItem | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, products, profile } = useBusiness();
  const cs = profile.currencySymbol || '$';
  const isServiceBusiness = profile.type === 'service' || profile.type === 'freelance' || !profile.enabledModules?.inventory;

  const [type, setType] = useState<ItemType>('product');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [minThreshold, setMinThreshold] = useState('5');
  const [unit, setUnit] = useState('piece');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const isEditing = Boolean(productToEdit);

  // Existing categories for suggestion
  const existingCategories = Array.from(new Set(products.map((p) => p.category)));

  useEffect(() => {
    setFormError('');
    if (productToEdit) {
      setType(productToEdit.type);
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category);
      setCostPrice(productToEdit.costPrice.toString());
      setSellingPrice(productToEdit.sellingPrice.toString());
      setStockQuantity(productToEdit.stockQuantity.toString());
      setMinThreshold(productToEdit.minThreshold.toString());
      setUnit(productToEdit.unit);
      setDescription(productToEdit.description || '');
    } else {
      setType(isServiceBusiness ? 'service' : 'product');
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory(existingCategories[0] || (isServiceBusiness ? 'Professional Services' : 'General'));
      setCostPrice(isServiceBusiness ? '0.00' : '15.00');
      setSellingPrice(isServiceBusiness ? '150.00' : '35.00');
      setStockQuantity(isServiceBusiness ? '999' : '15');
      setMinThreshold(isServiceBusiness ? '0' : '5');
      setUnit(isServiceBusiness ? 'session' : 'piece');
      setDescription('');
    }
  }, [productToEdit, isOpen, isServiceBusiness]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCostPrice = Number(costPrice);
    const parsedSellingPrice = Number(sellingPrice);
    const parsedStockQuantity = Number(stockQuantity);
    const parsedMinThreshold = Number(minThreshold);

    if (!name.trim() || !category.trim()) {
      setFormError('Product name and category are required.');
      return;
    }
    if (!Number.isFinite(parsedCostPrice) || parsedCostPrice < 0 || !Number.isFinite(parsedSellingPrice) || parsedSellingPrice < 0) {
      setFormError('Enter valid non-negative cost and selling prices.');
      return;
    }
    if (type === 'product' && (
      !Number.isInteger(parsedStockQuantity) || parsedStockQuantity < 0 ||
      !Number.isInteger(parsedMinThreshold) || parsedMinThreshold < 0
    )) {
      setFormError('Stock quantity and low-stock threshold must be whole numbers of zero or more.');
      return;
    }
    setFormError('');

    const payload = {
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      type,
      category: category.trim(),
      costPrice: parsedCostPrice,
      sellingPrice: parsedSellingPrice,
      stockQuantity: type === 'product' ? parsedStockQuantity : 999,
      minThreshold: type === 'product' ? parsedMinThreshold : 0,
      unit: unit.trim() || (type === 'service' ? 'service' : 'piece'),
      description: description.trim(),
      active: true,
    };

    if (isEditing && productToEdit) {
      updateProduct(productToEdit.id, payload);
    } else {
      addProduct(payload);
    }

    onClose();
  };

  const calculatedMargin =
    parseFloat(sellingPrice) > 0
      ? (
          ((parseFloat(sellingPrice) - (parseFloat(costPrice) || 0)) /
            parseFloat(sellingPrice)) *
          100
        ).toFixed(1)
      : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Offering' : 'Add Product or Service'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Update pricing, categorization or inventory thresholds'
                : 'Configure inventory tracking, unit economics, and billable details'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <p role="alert" className="text-xs font-medium text-rose-700">
              {formError}
            </p>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Offering Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType('product');
                  if (unit === 'hour' || unit === 'session' || unit === 'package') setUnit('piece');
                }}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  type === 'product'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Physical Product</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('service');
                  if (unit === 'piece' || unit === 'bottle') setUnit('session');
                }}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  type === 'service'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Service / Consultation</span>
              </button>
            </div>
          </div>

          {/* Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'product' ? 'e.g. Stoneware Espresso Cup' : 'e.g. Brand Strategy Retainer'}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-001"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                required
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Kitchenware or Creative"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <datalist id="category-suggestions">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={type === 'product' ? 'piece, bag, kg, box' : 'hour, session, package'}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Pricing & Unit Economics */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Unit Economics & Margins</span>
              <span className="font-mono text-emerald-700 text-xs font-semibold">
                Gross Margin: {calculatedMargin}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Cost to Produce / Wholesale ({cs})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Selling Price ({cs}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Inventory Tracking (Only for Physical Products) */}
          {type === 'product' && (
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="mt-1 text-[10px] text-slate-500">Alerts trigger at or below this quantity.</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Internal notes or customer specifications..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
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
              {isEditing ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
