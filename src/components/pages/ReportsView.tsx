import React, { useState } from 'react';
import { CalendarRange, Download, RotateCcw, TrendingUp, Users, Package, ReceiptText } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { ExpenseCategory } from '../../types';
import { formatCurrency } from '../../utils/currency';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

interface ReportBucket {
  key: string;
  sales: number;
  expenses: number;
  profit: number;
}

const toLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const offsetDate = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const countDays = (start: string, end: string) => {
  const startTime = new Date(`${start}T00:00:00`).getTime();
  const endTime = new Date(`${end}T00:00:00`).getTime();
  return Math.floor((endTime - startTime) / 86400000) + 1;
};

const displayBucket = (key: string, monthly: boolean) => {
  const date = new Date(`${monthly ? `${key}-01` : key}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, monthly
    ? { month: 'short', year: 'numeric' }
    : { month: 'short', day: 'numeric' }
  ).format(date);
};

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export const ReportsView: React.FC = () => {
  const { profile, sales, products, customers, expenses } = useBusiness();
  const currencySymbol = profile.currencySymbol || '$';
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const today = toLocalDateString(new Date());
  const [customStart, setCustomStart] = useState(`${today.slice(0, 7)}-01`);
  const [customEnd, setCustomEnd] = useState(today);

  const range = (() => {
    if (period === 'daily') return { start: today, end: today };
    if (period === 'weekly') return { start: toLocalDateString(offsetDate(new Date(`${today}T00:00:00`), -6)), end: today };
    if (period === 'monthly') return { start: `${today.slice(0, 7)}-01`, end: today };
    return { start: customStart, end: customEnd };
  })();
  const invalidRange = !range.start || !range.end || range.start > range.end;
  const periodSales = invalidRange ? [] : sales.filter((sale) => sale.date >= range.start && sale.date <= range.end);
  const periodExpenses = invalidRange ? [] : expenses.filter((expense) => expense.date >= range.start && expense.date <= range.end);

  const totalSales = periodSales.reduce((total, sale) => total + (Number.isFinite(sale.total) ? sale.total : 0), 0);
  const totalExpenses = periodExpenses.reduce((total, expense) => total + (Number.isFinite(expense.amount) ? expense.amount : 0), 0);
  const netProfit = totalSales - totalExpenses;
  const orderCount = periodSales.length;
  const averageOrderValue = orderCount ? totalSales / orderCount : 0;

  const productTotals = new Map<string, { name: string; category: string; quantity: number; sales: number }>();
  periodSales.forEach((sale) => sale.items.forEach((item) => {
    if (item.type !== 'product') return;
    const product = products.find((record) => record.id === item.itemId);
    const current = productTotals.get(item.itemId) || {
      name: product?.name || item.itemName || 'Unknown product',
      category: product?.category || 'Uncategorized',
      quantity: 0,
      sales: 0,
    };
    current.quantity += Number.isFinite(item.quantity) ? item.quantity : 0;
    current.sales += Number.isFinite(item.total) ? item.total : 0;
    productTotals.set(item.itemId, current);
  }));
  const productReport = Array.from(productTotals.values()).sort((first, second) => second.sales - first.sales || second.quantity - first.quantity);

  const customerTotals = new Map<string, { name: string; customerType: string; orders: number; sales: number }>();
  periodSales.forEach((sale) => {
    const customer = customers.find((record) => record.id === sale.customerId)
      || customers.find((record) => record.name === sale.customerName);
    const customerKey = customer?.id || `unlinked:${sale.customerName}`;
    const name = customer?.name || sale.customerName || 'Unlinked sale';
    const current = customerTotals.get(customerKey) || {
      name,
      customerType: customer?.customerType || (customer?.company ? 'Business' : customer ? 'Individual' : 'Unlinked'),
      orders: 0,
      sales: 0,
    };
    current.orders += 1;
    current.sales += Number.isFinite(sale.total) ? sale.total : 0;
    customerTotals.set(customerKey, current);
  });
  const customerReport = Array.from(customerTotals, ([key, customer]) => ({ key, ...customer }))
    .sort((first, second) => second.sales - first.sales);

  const categoryTotals = new Map<ExpenseCategory, number>();
  periodExpenses.forEach((expense) => {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) || 0) + expense.amount);
  });
  const expenseReport = Array.from(categoryTotals.entries()).sort((first, second) => second[1] - first[1]);

  const periodDays = !invalidRange ? countDays(range.start, range.end) : 0;
  const groupByMonth = periodDays > 31;
  const buckets = new Map<string, ReportBucket>();
  const getBucket = (date: string) => {
    const key = groupByMonth ? date.slice(0, 7) : date;
    if (!buckets.has(key)) buckets.set(key, { key, sales: 0, expenses: 0, profit: 0 });
    return buckets.get(key)!;
  };
  periodSales.forEach((sale) => { getBucket(sale.date).sales += sale.total; });
  periodExpenses.forEach((expense) => { getBucket(expense.date).expenses += expense.amount; });
  const trendReport = Array.from(buckets.values()).sort((first, second) => first.key.localeCompare(second.key));
  trendReport.forEach((bucket) => { bucket.profit = bucket.sales - bucket.expenses; });
  const trendScale = Math.max(1, ...trendReport.flatMap((bucket) => [bucket.sales, bucket.expenses, Math.abs(bucket.profit)]));
  const formatAmount = (amount: number) => formatCurrency(amount, profile.currency, currencySymbol);

  const exportCSV = () => {
    const rows: Array<Array<string | number>> = [
      ['Report', 'Period', 'Name', 'Category', 'Count', 'Sales', 'Expenses', 'Profit'],
      ['Summary', `${range.start} to ${range.end}`, 'Total sales', '', orderCount, totalSales, '', ''],
      ['Summary', `${range.start} to ${range.end}`, 'Total expenses', '', periodExpenses.length, '', totalExpenses, ''],
      ['Summary', `${range.start} to ${range.end}`, 'Net profit', '', orderCount, '', '', netProfit],
      ['Summary', `${range.start} to ${range.end}`, 'Average order value', '', orderCount, averageOrderValue, '', ''],
      ...trendReport.map((bucket) => ['Trend', bucket.key, 'Sales / expenses / profit', '', '', bucket.sales, bucket.expenses, bucket.profit]),
      ...productReport.map((product) => ['Product', `${range.start} to ${range.end}`, product.name, product.category, product.quantity, product.sales, '', '']),
      ...customerReport.map((customer) => ['Customer', `${range.start} to ${range.end}`, customer.name, customer.customerType, customer.orders, customer.sales, '', '']),
      ...expenseReport.map(([category, amount]) => ['Expense category', `${range.start} to ${range.end}`, category, category, '', '', amount, '']),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `businessbuddy_report_${range.start}_${range.end}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-emerald-700" />
              <h1 className="text-base font-bold text-slate-900">Reports & Analytics</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">One record per saved sale; expenses are summed from saved expense entries.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg" role="group" aria-label="Report date period">
              {(['daily', 'weekly', 'monthly', 'custom'] as ReportPeriod[]).map((option) => (
                <button key={option} type="button" onClick={() => setPeriod(option)} className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${period === option ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                  {option}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} disabled={invalidRange} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <label className="text-xs font-medium text-slate-600">From
              <input type="date" value={customStart} max={customEnd || undefined} onChange={(event) => setCustomStart(event.target.value)} className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </label>
            <label className="text-xs font-medium text-slate-600">To
              <input type="date" value={customEnd} min={customStart || undefined} onChange={(event) => setCustomEnd(event.target.value)} className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">Period: {invalidRange ? 'Invalid date range' : `${range.start} to ${range.end}`}</span>
          <button type="button" onClick={() => { setPeriod('monthly'); setCustomStart(`${today.slice(0, 7)}-01`); setCustomEnd(today); }} className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900">
            <RotateCcw className="w-3 h-3" /> Reset to month
          </button>
        </div>
        {invalidRange && <p role="alert" className="text-xs font-medium text-rose-700">Choose a valid start and end date, with the start on or before the end.</p>}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Total Sales', value: formatAmount(totalSales), sub: 'Saved sale totals' },
          { label: 'Total Expenses', value: formatAmount(totalExpenses), sub: `${periodExpenses.length} expense entries` },
          { label: 'Net Profit', value: formatAmount(netProfit), sub: 'Sales minus expenses', color: netProfit < 0 ? 'text-rose-700' : 'text-emerald-800' },
          { label: 'Orders', value: String(orderCount), sub: 'Saved sales in range' },
          { label: 'Average Order Value', value: formatAmount(averageOrderValue), sub: 'Sales divided by orders' },
        ].map((metric) => (
          <div key={metric.label} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs min-w-0">
            <span className="text-xs text-slate-500 font-medium">{metric.label}</span>
            <div className={`mt-1 text-lg font-bold font-mono tabular-nums truncate ${metric.color || 'text-slate-900'}`}>{metric.value}</div>
            <span className="text-[11px] text-slate-500 mt-1 block truncate">{metric.sub}</span>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Sales & Profit Trends</h2>
            <p className="text-xs text-slate-500 mt-0.5">Buckets are daily for ranges up to 31 days, monthly for longer ranges.</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5"><i aria-hidden="true" className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />Sales</span>
            <span className="flex items-center gap-1.5"><i aria-hidden="true" className="w-2.5 h-2.5 rounded-sm bg-amber-500" />Expenses</span>
            <span className="flex items-center gap-1.5"><i aria-hidden="true" className="w-2.5 h-2.5 rounded-sm bg-sky-600" />Profit</span>
          </div>
        </div>
        {invalidRange ? (
          <div className="py-8 text-center text-xs text-rose-700 border border-dashed border-rose-200 rounded-lg">Trend unavailable until the date range is corrected.</div>
        ) : trendReport.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">No saved sales or expenses fall within this period.</div>
        ) : (
          <div className="space-y-3">
            {trendReport.map((bucket) => {
              const series = [
                { label: 'Sales', amount: bucket.sales, color: 'bg-emerald-600' },
                { label: 'Expenses', amount: bucket.expenses, color: 'bg-amber-500' },
                { label: 'Profit', amount: bucket.profit, color: bucket.profit < 0 ? 'bg-rose-600' : 'bg-sky-600' },
              ];
              return (
                <div key={bucket.key} className="grid grid-cols-1 sm:grid-cols-[6rem_1fr] gap-3 sm:gap-5 items-center">
                  <span className="text-xs font-semibold text-slate-700">{displayBucket(bucket.key, groupByMonth)}</span>
                  <div className="space-y-1.5">
                    {series.map((item) => (
                      <div key={item.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)_8rem] gap-2 items-center text-[11px]">
                        <span className="text-slate-500">{item.label}</span>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max(item.amount ? 2 : 0, Math.abs(item.amount) / trendScale * 100)}%` }} /></div>
                        <span className={`text-right font-mono tabular-nums ${item.amount < 0 ? 'text-rose-700' : 'text-slate-700'}`}>{item.amount < 0 ? '-' : ''}{formatAmount(Math.abs(item.amount))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2"><Package className="w-4 h-4 text-emerald-700" /><h2 className="text-sm font-semibold text-slate-900">Top-selling Products</h2></div>
          {productReport.length === 0 ? <p className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">No product sales are recorded in this period.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-100"><tr><th className="py-2 pr-3">Product</th><th className="py-2 px-2 text-right">Units</th><th className="py-2 px-2 text-right">Sales</th><th className="py-2 pl-2 text-right">Share</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{productReport.map((product) => <tr key={product.name}><td className="py-2.5 pr-3"><div className="font-medium text-slate-800">{product.name}</div><div className="text-[10px] text-slate-500">{product.category}</div></td><td className="py-2.5 px-2 text-right font-mono">{product.quantity}</td><td className="py-2.5 px-2 text-right font-mono">{formatAmount(product.sales)}</td><td className="py-2.5 pl-2 text-right font-mono">{totalSales ? `${(product.sales / totalSales * 100).toFixed(1)}%` : '0.0%'}</td></tr>)}</tbody>
            </table></div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-emerald-700" /><h2 className="text-sm font-semibold text-slate-900">Customer-wise Sales</h2></div>
          {customerReport.length === 0 ? <p className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">No sales are recorded in this period.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-100"><tr><th className="py-2 pr-3">Customer</th><th className="py-2 px-2 text-right">Orders</th><th className="py-2 pl-2 text-right">Sales</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{customerReport.map((customer) => <tr key={customer.key}><td className="py-2.5 pr-3"><div className="font-medium text-slate-800">{customer.name}</div><div className="text-[10px] text-slate-500">{customer.customerType}</div></td><td className="py-2.5 px-2 text-right font-mono">{customer.orders}</td><td className="py-2.5 pl-2 text-right font-mono">{formatAmount(customer.sales)}</td></tr>)}</tbody>
            </table></div>
          )}
        </section>
      </div>

      <section className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2"><ReceiptText className="w-4 h-4 text-emerald-700" /><h2 className="text-sm font-semibold text-slate-900">Expenses by Category</h2></div>
        {expenseReport.length === 0 ? <p className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">No expenses are recorded in this period.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">{expenseReport.map(([category, amount]) => {
            const share = totalExpenses > 0 ? amount / totalExpenses * 100 : 0;
            return <div key={category} className="space-y-1"><div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-700">{category}</span><span className="font-mono tabular-nums text-slate-700">{formatAmount(amount)} ({share.toFixed(1)}%)</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${share}%` }} /></div></div>;
          })}</div>
        )}
      </section>
    </div>
  );
};