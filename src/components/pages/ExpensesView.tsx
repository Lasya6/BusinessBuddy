import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Download,
  Receipt,
  TrendingDown,
  PieChart,
  Trash2,
  Calendar,
  CheckCircle,
  Edit2,
  RotateCcw,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Expense, ExpenseCategory } from '../../types';
import { formatCurrency } from '../../utils/currency';

const expenseCategories: ExpenseCategory[] = ['Rent', 'Salaries', 'Marketing', 'Utilities', 'Transport', 'Other'];

interface ExpensesViewProps {
  onOpenExpenseModal: (expense?: Expense) => void;
  searchQuery: string;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onOpenExpenseModal,
  searchQuery,
}) => {
  const { profile, expenses, sales, products, deleteExpense } = useBusiness();
  const cs = profile.currencySymbol || '$';
  const [selectedCategory, setSelectedCategory] = useState<'all' | ExpenseCategory>('all');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const effectiveSearch = (searchQuery || localSearch).toLowerCase().trim();
  const dateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);
  const isInDateRange = (date: string) =>
    !dateRangeInvalid && (!startDate || date >= startDate) && (!endDate || date <= endDate);

  const reportSales = sales.filter((sale) => isInDateRange(sale.date));
  const reportExpenses = expenses.filter((expense) =>
    isInDateRange(expense.date) && (selectedCategory === 'all' || expense.category === selectedCategory)
  );
  const reportRevenue = reportSales.reduce((sum, sale) => sum + sale.total, 0);
  const reportTotalExpenses = reportExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const reportNetProfit = reportRevenue - reportTotalExpenses;
  const reportProfitMargin = reportRevenue > 0 ? (reportNetProfit / reportRevenue) * 100 : 0;

  // Estimate COGS from sold products
  const estimatedCOGS = reportSales.reduce((cogsSum, s) => {
    return (
      cogsSum +
      s.items.reduce((itemCogs, item) => {
        if (item.type === 'product') {
          const matchedProd = products.find((p) => p.id === item.itemId);
          const unitCost = matchedProd ? matchedProd.costPrice : item.unitPrice * 0.4;
          return itemCogs + unitCost * item.quantity;
        }
        return itemCogs;
      }, 0)
    );
  }, 0);

  const grossProfit = reportRevenue - estimatedCOGS;
  const grossMarginPercent = reportRevenue > 0 ? (grossProfit / reportRevenue) * 100 : 0;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  reportExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const categoryList = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const taxDeductibleTotal = reportExpenses.filter((e) => e.isTaxDeductible).reduce((sum, e) => sum + e.amount, 0);

  // Filtered expenses
  const filteredExpenses = reportExpenses.filter((e) => {
    if (effectiveSearch) {
      const matchTitle = e.title.toLowerCase().includes(effectiveSearch);
      const matchPayee = e.payee.toLowerCase().includes(effectiveSearch);
      const matchCat = e.category.toLowerCase().includes(effectiveSearch);
      if (!matchTitle && !matchPayee && !matchCat) return false;
    }
    return true;
  });

  const monthlyTotals = new Map<string, { month: string; revenue: number; expenses: number }>();
  const getMonthlyTotal = (date: string) => {
    const month = date.slice(0, 7);
    if (!monthlyTotals.has(month)) {
      monthlyTotals.set(month, { month, revenue: 0, expenses: 0 });
    }
    return monthlyTotals.get(month)!;
  };
  reportSales.forEach((sale) => {
    getMonthlyTotal(sale.date).revenue += sale.total;
  });
  reportExpenses.forEach((expense) => {
    getMonthlyTotal(expense.date).expenses += expense.amount;
  });
  const monthlySummaries = Array.from(monthlyTotals.values())
    .sort((first, second) => first.month.localeCompare(second.month))
    .slice(-6)
    .map((month) => ({ ...month, profit: month.revenue - month.expenses }));
  const monthlyChartScale = Math.max(1, ...monthlySummaries.flatMap((month) => [
    month.revenue,
    month.expenses,
    Math.abs(month.profit),
  ]));

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Payee', 'Date', 'Amount', 'Payment Method', 'Tax Deductible', 'Notes'];
    const rows = filteredExpenses.map((e) => [
      e.id,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${e.payee.replace(/"/g, '""')}"`,
      e.date,
      e.amount.toFixed(2),
      e.paymentMethod,
      e.isTaxDeductible ? 'Yes' : 'No',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `businessbuddy_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Financial Statement & P&L Summary Cards */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Profit & Loss Summary (P&L)
            </h2>
            <p className="text-xs text-slate-500">
              Revenue and operating expenses from recorded transactions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export P&L</span>
            </button>
            <button
              onClick={() => onOpenExpenseModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <label className="text-xs font-medium text-slate-600">
            From
            <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            To
            <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Expense Category
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value as 'all' | ExpenseCategory)} className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              <option value="all">All Categories</option>
              {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => { setStartDate(''); setEndDate(''); setSelectedCategory('all'); }} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        </div>
        {dateRangeInvalid && <p role="alert" className="mb-4 text-xs font-medium text-rose-700">The start date must be on or before the end date.</p>}

        {/* 5-Step Waterfall Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Gross Revenue */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              1. Gross Revenue
            </span>
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(reportRevenue, profile.currency, cs)}
            </div>
            <span className="text-[11px] text-slate-500 block">Sales in the selected date range</span>
          </div>

          {/* 2. COGS */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              2. Cost of Goods (COGS)
            </span>
            <div className="text-lg font-bold text-slate-700 font-mono tabular-nums">
              -{formatCurrency(estimatedCOGS, profile.currency, cs)}
            </div>
            <span className="text-[11px] text-slate-500 block">Product wholesale costs</span>
          </div>

          {/* 3. Gross Profit */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              3. Gross Profit
            </span>
            <div className="text-lg font-bold text-emerald-900 font-mono tabular-nums">
              {formatCurrency(grossProfit, profile.currency, cs)}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium block">
              {grossMarginPercent.toFixed(1)}% Gross Margin
            </span>
          </div>

          {/* 4. Operating Expenses */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              4. Operating Costs (OPEX)
            </span>
            <div className="text-lg font-bold text-slate-700 font-mono tabular-nums">
              -{formatCurrency(reportTotalExpenses, profile.currency, cs)}
            </div>
            <span className="text-[11px] text-slate-500 block">Rent, payroll, utilities, ads</span>
          </div>

          {/* 5. Net Profit */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider">
              5. Net Profit (Revenue - Expenses)
            </span>
            <div className={`text-lg font-bold font-mono tabular-nums ${reportNetProfit >= 0 ? 'text-emerald-950' : 'text-rose-700'}`}>
              {formatCurrency(reportNetProfit, profile.currency, cs)}
            </div>
            <span className="text-[11px] text-emerald-800 font-semibold block">
              {reportProfitMargin.toFixed(1)}% Net Margin
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Monthly Revenue, Expenses & Profit</h3>
            <p className="text-xs text-slate-500 mt-0.5">Based on saved sales and expenses in the selected range</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />Revenue</span>
            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-amber-500" />Expenses</span>
            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-sky-600" />Profit</span>
          </div>
        </div>

        {monthlySummaries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
            {dateRangeInvalid ? 'Choose a valid date range to view monthly results.' : 'No sales or expenses recorded in this date range yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            {monthlySummaries.map((month) => {
              const label = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(`${month.month}-01T00:00:00`));
              const bars = [
                { label: 'Revenue', amount: month.revenue, color: 'bg-emerald-600' },
                { label: 'Expenses', amount: month.expenses, color: 'bg-amber-500' },
                { label: 'Profit', amount: month.profit, color: month.profit < 0 ? 'bg-rose-600' : 'bg-sky-600' },
              ];
              return (
                <div key={month.month} className="grid grid-cols-1 sm:grid-cols-[6rem_1fr] gap-3 sm:gap-5 items-center">
                  <span className="text-xs font-semibold text-slate-700">{label}</span>
                  <div className="space-y-1.5">
                    {bars.map((bar) => (
                      <div key={bar.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)_7.5rem] gap-2 items-center text-[11px]">
                        <span className="text-slate-500">{bar.label}</span>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${Math.max(bar.amount ? 2 : 0, Math.abs(bar.amount) / monthlyChartScale * 100)}%` }} />
                        </div>
                        <span className={`text-right font-mono tabular-nums ${bar.amount < 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                          {bar.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(bar.amount), profile.currency, cs)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Breakdown & Tax Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Category Distribution (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Expenses by Operating Category
            </h3>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              Total: {formatCurrency(reportTotalExpenses, profile.currency, cs)}
            </span>
          </div>

          <div className="space-y-3">
            {categoryList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                No expenses to break down for these filters.
              </div>
            ) : categoryList.map(([cat, amount]) => {
              const pct = reportTotalExpenses > 0 ? (amount / reportTotalExpenses) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{cat}</span>
                    <span className="font-mono tabular-nums text-slate-700">
                      {formatCurrency(amount, profile.currency, cs)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tax Deductibility & Insights (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Tax Deductible Tracking
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Categorized qualifying business write-offs for Schedule C and tax preparation
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <div>
                <span className="text-xs text-slate-500 font-medium">Eligible Business Deductions</span>
                <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                  {formatCurrency(taxDeductibleTotal, profile.currency, cs)}
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200/70">
                <div className="flex items-center justify-between">
                  <span>Deductible Share:</span>
                  <span className="font-semibold font-mono tabular-nums text-emerald-800">
                    {reportTotalExpenses > 0 ? ((taxDeductibleTotal / reportTotalExpenses) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tracked Receipts:</span>
                  <span className="font-mono tabular-nums">{reportExpenses.length} entries</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic">
            Tip: Keep all digital and physical receipts saved for a minimum of 3 years for tax audits.
          </div>
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Expense Ledger
            </h2>
            <p className="text-xs text-slate-500">
              {filteredExpenses.length} expense entries in the selected range
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-6 font-medium">Expense Item</th>
                <th className="py-3 px-6 font-medium">Category</th>
                <th className="py-3 px-6 font-medium">Payee</th>
                <th className="py-3 px-6 font-medium">Date</th>
                <th className="py-3 px-6 font-medium">Payment Method</th>
                <th className="py-3 px-6 font-medium text-center">Tax Deductible</th>
                <th className="py-3 px-6 font-medium text-right">Amount</th>
                <th className="py-3 px-6 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    {dateRangeInvalid ? 'Choose a valid date range.' : 'No expense entries match these filters.'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-6">
                      <div className="font-semibold text-slate-900">{exp.title}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {exp.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {exp.category}
                    </td>
                    <td className="py-3 px-6 text-slate-700 font-medium">
                      {exp.payee}
                    </td>
                    <td className="py-3 px-6 text-slate-500 font-mono">
                      {exp.date}
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span
                        className={`text-[11px] font-semibold ${
                          exp.isTaxDeductible ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {exp.isTaxDeductible ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(exp.amount, profile.currency, cs)}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenExpenseModal(exp)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete expense "${exp.title}"?`)) deleteExpense(exp.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete expense"
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
