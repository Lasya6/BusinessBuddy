import React, { useState } from 'react';
import {
  Plus,
  Package,
  Layers,
  AlertTriangle,
  Search,
  Filter,
  Edit2,
  Trash2,
  Sliders,
  DollarSign,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { ProductItem } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface InventoryViewProps {
  onOpenProductModal: (product?: ProductItem) => void;
  onOpenStockAdjust: (product: ProductItem) => void;
  searchQuery: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenProductModal,
  onOpenStockAdjust,
  searchQuery,
}) => {
  const { products, deleteProduct, profile } = useBusiness();
  const isServiceBusiness = profile.type === 'service' || profile.type === 'freelance';
  const cs = profile.currencySymbol || '$';

  const [activeFilter, setActiveFilter] = useState<'all' | 'product' | 'service' | 'low-stock'>(
    isServiceBusiness ? 'service' : 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>('');

  const effectiveSearch = (searchQuery || localSearch).toLowerCase().trim();

  // Extract unique categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filtered products list
  const filteredProducts = products.filter((item) => {
    // Type filter
    if (activeFilter === 'product' && item.type !== 'product') return false;
    if (activeFilter === 'service' && item.type !== 'service') return false;
    if (activeFilter === 'low-stock' && (item.type !== 'product' || item.stockQuantity > item.minThreshold)) return false;

    // Category filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

    // Search query
    if (effectiveSearch) {
      const matchName = item.name.toLowerCase().includes(effectiveSearch);
      const matchSku = item.sku.toLowerCase().includes(effectiveSearch);
      const matchCat = item.category.toLowerCase().includes(effectiveSearch);
      if (!matchName && !matchSku && !matchCat) return false;
    }

    return true;
  });

  // Calculate metrics
  const physicalItems = products.filter((p) => p.type === 'product');
  const serviceItems = products.filter((p) => p.type === 'service');
  const totalStockUnits = physicalItems.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalInventoryCost = physicalItems.reduce((acc, p) => acc + p.costPrice * p.stockQuantity, 0);
  const totalInventoryRetail = physicalItems.reduce((acc, p) => acc + p.sellingPrice * p.stockQuantity, 0);
  const lowStockCount = physicalItems.filter((p) => p.stockQuantity <= p.minThreshold).length;
  
  const avgServiceRate =
    serviceItems.length > 0
      ? (serviceItems.reduce((sum, s) => sum + s.sellingPrice, 0) / serviceItems.length).toFixed(2)
      : '0.00';
  const highestService = [...serviceItems].sort((a, b) => b.sellingPrice - a.sellingPrice)[0];

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'SKU', 'Type', 'Category', 'Stock', 'Min Threshold', 'Cost Price', 'Selling Price', 'Margin %'];
    const rows = products.map((p) => {
      const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1) : '0';
      return [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        p.type,
        `"${p.category}"`,
        p.type === 'product' ? p.stockQuantity : 'N/A',
        p.type === 'product' ? p.minThreshold : 'N/A',
        p.costPrice.toFixed(2),
        p.sellingPrice.toFixed(2),
        margin,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `businessbuddy_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isServiceBusiness ? (
          <>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Service Offerings</span>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {serviceItems.length} billable packages
              </div>
              <span className="text-xs text-emerald-700 font-medium mt-1 block">
                100% service margin model
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Average Billable Rate</span>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {cs}{avgServiceRate}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Across active consultation tiers
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Top Tier Package</span>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1 truncate">
                {highestService ? formatCurrency(highestService.sellingPrice, profile.currency, cs) : 'None'}
              </div>
              <span className="text-xs text-slate-500 mt-1 block truncate">
                {highestService?.name || 'Create your first service'}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Inventory Tracking</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                Optional
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Zero inventory holding required
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Inventory Value (Cost)</span>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatCurrency(totalInventoryCost, profile.currency, cs)}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Retail potential: {formatCurrency(totalInventoryRetail, profile.currency, cs)}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Physical Stock on Hand</span>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {totalStockUnits.toLocaleString()} units
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Across {physicalItems.length} distinct SKUs
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Active Services & Packages</span>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {serviceItems.length} billable offerings
              </div>
              <span className="text-xs text-emerald-700 font-medium mt-1 block">
                100% gross profit baseline
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Safety Stock Alerts</span>
              <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {lowStockCount} {lowStockCount === 1 ? 'item' : 'items'}
              </div>
              <span className="text-xs text-amber-700 font-medium mt-1 block">
                {lowStockCount > 0 ? 'Requires vendor reordering' : 'All items sufficiently stocked'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Control Bar: Filter Tabs, Search & Actions */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setActiveFilter('product')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeFilter === 'product'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Products ({physicalItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('service')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeFilter === 'service'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Services ({products.filter((p) => p.type === 'service').length})
            </button>
            <button
              onClick={() => setActiveFilter('low-stock')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeFilter === 'low-stock'
                  ? 'bg-white text-amber-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => onOpenProductModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Category & Search Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or keyword..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full sm:w-44"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-6 font-medium">Item Details & SKU</th>
                <th className="py-3 px-6 font-medium">Type</th>
                <th className="py-3 px-6 font-medium">Category</th>
                <th className="py-3 px-6 font-medium text-right">Stock Level</th>
                <th className="py-3 px-6 font-medium text-right">Cost Price</th>
                <th className="py-3 px-6 font-medium text-right">Selling Price</th>
                <th className="py-3 px-6 font-medium text-right">Gross Margin</th>
                <th className="py-3 px-6 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">No items found matching your filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting search or create a new product/service</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => {
                  const isPhysical = item.type === 'product';
                  const isLowStock = isPhysical && item.stockQuantity <= item.minThreshold;
                  const marginPercent =
                    item.sellingPrice > 0
                      ? (((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100).toFixed(1)
                      : '0';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & SKU */}
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>SKU: {item.sku}</span>
                          <span aria-hidden="true">·</span>
                          <span>Unit: {item.unit}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-6">
                        <span className="text-xs text-slate-600 capitalize">
                          {item.type}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-6 text-slate-600">
                        {item.category}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-6 text-right">
                        {isPhysical ? (
                          <div className="space-y-1 inline-block text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />}
                              <span className={`font-mono font-semibold tabular-nums ${isLowStock ? 'text-amber-800' : 'text-slate-900'}`}>
                                {item.stockQuantity} {item.unit}s
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Min threshold: {item.minThreshold}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unlimited (Service)</span>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-6 text-right font-mono text-slate-600 tabular-nums">
                        {formatCurrency(item.costPrice, profile.currency, cs)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-6 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(item.sellingPrice, profile.currency, cs)}
                      </td>

                      {/* Gross Margin */}
                      <td className="py-3.5 px-6 text-right font-mono tabular-nums">
                        <span className="font-medium text-emerald-700">
                          {marginPercent}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isPhysical && (
                            <button
                              onClick={() => onOpenStockAdjust(item)}
                              title="Adjust Stock Quantity"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenProductModal(item)}
                            title="Edit Item"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
                                deleteProduct(item.id);
                              }
                            }}
                            title="Delete Item"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
