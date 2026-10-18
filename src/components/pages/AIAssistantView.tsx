import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  DollarSign,
  Receipt,
  AlertCircle,
  Briefcase,
  Users,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency } from '../../utils/currency';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
}

interface RuleInsight {
  id: string;
  category: 'inventory' | 'sales' | 'customers' | 'expenses' | 'profit';
  title: string;
  detail: string;
  action: string;
  priority: 'High' | 'Medium' | 'Info';
}

const formatMonth = (month: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(`${month}-01T00:00:00`));

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const ProductSales = (sales: ReturnType<typeof useBusiness>['sales']) => {
  const totals = new Map<string, { itemId: string; name: string; quantity: number; revenue: number }>();
  sales.forEach((sale) => sale.items.forEach((item) => {
    if (item.type !== 'product') return;
    const current = totals.get(item.itemId) || { itemId: item.itemId, name: item.itemName, quantity: 0, revenue: 0 };
    current.quantity += item.quantity;
    current.revenue += item.total;
    totals.set(item.itemId, current);
  }));
  return Array.from(totals.values()).sort((first, second) => second.quantity - first.quantity || second.revenue - first.revenue);
};

export const AIAssistantView: React.FC = () => {
  const {
    profile,
    products,
    customers,
    sales,
    expenses,
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMarginPercent,
    outstandingReceivables,
    lowStockItems,
    overdueSales,
  } = useBusiness();

  const isInventoryEnabled = profile.enabledModules?.inventory ?? true;
  const formatAmount = (amount: number) => formatCurrency(amount, profile.currency, profile.currencySymbol);

  const productSales = ProductSales(sales);
  const topProducts = productSales.slice(0, 5);
  const customerTotals = new Map<string, { customerId: string; name: string; revenue: number; invoices: number }>();
  sales.forEach((sale) => {
    const customer = customers.find((record) => record.id === sale.customerId)
      || customers.find((record) => record.name === sale.customerName);
    if (!customer) return;
    const customerId = customer.id;
    const current = customerTotals.get(customerId) || { customerId, name: customer.name, revenue: 0, invoices: 0 };
    current.revenue += sale.total;
    current.invoices += 1;
    customerTotals.set(customerId, current);
  });
  const topCustomers = Array.from(customerTotals.values()).sort((first, second) => second.revenue - first.revenue).slice(0, 5);

  const monthlyMap = new Map<string, { month: string; revenue: number; expenses: number }>();
  const ensureMonth = (date: string) => {
    const month = date.slice(0, 7);
    if (!monthlyMap.has(month)) monthlyMap.set(month, { month, revenue: 0, expenses: 0 });
    return monthlyMap.get(month)!;
  };
  sales.forEach((sale) => { ensureMonth(sale.date).revenue += sale.total; });
  expenses.forEach((expense) => { ensureMonth(expense.date).expenses += expense.amount; });
  const monthlyMetrics = Array.from(monthlyMap.values())
    .sort((first, second) => first.month.localeCompare(second.month))
    .slice(-6)
    .map((month) => ({ ...month, profit: month.revenue - month.expenses }));
  const trendScale = Math.max(1, ...monthlyMetrics.flatMap((month) => [month.revenue, month.expenses, Math.abs(month.profit)]));

  const salesMonths = Array.from(new Set(sales.map((sale) => sale.date.slice(0, 7)))).sort();
  const priorSalesMonth = salesMonths.length > 1 ? salesMonths[salesMonths.length - 2] : null;
  const latestSalesMonth = salesMonths.length > 1 ? salesMonths[salesMonths.length - 1] : null;
  const productMonthTotals = new Map<string, { name: string; prior: number; latest: number }>();
  if (priorSalesMonth && latestSalesMonth) {
    sales.forEach((sale) => {
      const month = sale.date.slice(0, 7);
      if (month !== priorSalesMonth && month !== latestSalesMonth) return;
      sale.items.filter((item) => item.type === 'product').forEach((item) => {
        const current = productMonthTotals.get(item.itemId) || { name: item.itemName, prior: 0, latest: 0 };
        if (month === priorSalesMonth) current.prior += item.quantity;
        if (month === latestSalesMonth) current.latest += item.quantity;
        productMonthTotals.set(item.itemId, current);
      });
    });
  }
  const decliningProducts = Array.from(productMonthTotals.values())
    .filter((product) => product.prior > 0 && product.latest < product.prior)
    .sort((first, second) => (second.prior - second.latest) - (first.prior - first.latest));

  const expenseMedian = median(expenses.map((expense) => expense.amount));
  const expenseOutliers = expenseMedian > 0
    ? expenses.filter((expense) => expense.amount > expenseMedian * 2).sort((first, second) => second.amount - first.amount)
    : [];

  const ruleInsights: RuleInsight[] = [
    ...lowStockItems.map((product) => ({
      id: `stock-${product.id}`,
      category: 'inventory' as const,
      title: `Low stock: ${product.name}`,
      detail: `${product.stockQuantity} ${product.unit} on hand; configured minimum is ${product.minThreshold}.`,
      action: 'Review replenishment before the next sale.',
      priority: product.stockQuantity === 0 ? 'High' as const : 'Medium' as const,
    })),
    ...decliningProducts.map((product) => ({
      id: `decline-${product.name}`,
      category: 'sales' as const,
      title: `Lower unit sales: ${product.name}`,
      detail: `${product.prior} units in ${formatMonth(priorSalesMonth!)} versus ${product.latest} in ${formatMonth(latestSalesMonth!)}.`,
      action: 'Review availability, pricing, or recent promotion activity.',
      priority: 'Medium' as const,
    })),
    ...expenseOutliers.map((expense) => ({
      id: `expense-${expense.id}`,
      category: 'expenses' as const,
      title: `Expense outlier: ${expense.title}`,
      detail: `${formatAmount(expense.amount)} is above 2x the median recorded expense (${formatAmount(expenseMedian)}). This cross-category comparison is a review flag, not an anomaly verdict.`,
      action: 'Check the receipt and confirm the category and amount.',
      priority: 'Medium' as const,
    })),
    ...(overdueSales.length ? [{
      id: 'overdue-invoices',
      category: 'customers' as const,
      title: `${overdueSales.length} overdue ${overdueSales.length === 1 ? 'invoice' : 'invoices'}`,
      detail: `${formatAmount(overdueSales.reduce((sum, sale) => sum + Math.max(0, sale.total - (sale.paidAmount ?? 0)), 0))} in recorded overdue balances.`,
      action: 'Review the invoices and contact the listed customers.',
      priority: 'High' as const,
    }] : []),
    ...(sales.length && netProfit < 0 ? [{
      id: 'negative-net-profit',
      category: 'profit' as const,
      title: 'Recorded expenses exceed revenue',
      detail: `Net profit is ${formatAmount(netProfit)} from the saved sales and expense records.`,
      action: 'Review the expense breakdown and confirm upcoming cash commitments.',
      priority: 'High' as const,
    }] : []),
  ];
  const hasSavedData = products.length > 0 || customers.length > 0 || sales.length > 0 || expenses.length > 0;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${profile.ownerName.split(' ')[0]}! I'm your **BusinessBuddy Strategist**.

    The Insights dashboard above is calculated from your saved sales, products, customers, and expenses. It reports recorded activity, not forecasts.

    You can ask a question below. When an AI API is unavailable, replies are clearly marked as rule-based and use the same saved data.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'Live business data',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'unavailable' | 'error'>('checking');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check backend health / gemini status
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      })
      .then((data) => setApiStatus(data.hasGeminiKey ? 'connected' : 'unavailable'))
      .catch(() => setApiStatus('error'));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const executeStrategyAction = async (prompt: string, mode: string = 'chat') => {
    if (loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const contextTopProducts = topProducts.map((product) => {
        const catalogProduct = products.find((record) => record.id === product.itemId);
        return {
          ...product,
          category: catalogProduct?.category,
          costPrice: catalogProduct?.costPrice,
          sellingPrice: catalogProduct?.sellingPrice,
        };
      });
      const expenseTotalsByCategory = expenses.reduce<Record<string, number>>((totals, expense) => {
        totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
        return totals;
      }, {});

      const context = {
        businessName: profile.name,
        businessType: profile.type,
        currency: profile.currency,
        currencySymbol: profile.currencySymbol,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? Number(profitMarginPercent.toFixed(1)) : null,
        outstandingReceivables,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((i) => ({
          name: i.name,
          quantity: i.stockQuantity,
          minThreshold: i.minThreshold,
        })),
        overdueCustomers: overdueSales.map((s) => ({
          name: s.customerName,
          balance: Math.max(0, s.total - (s.paidAmount ?? 0)),
        })),
        topProducts: contextTopProducts,
        topCustomers,
        monthlyTrends: monthlyMetrics,
        expenseTotalsByCategory,
        expenseOutliers: expenseOutliers.map((expense) => ({
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          date: expense.date,
        })),
        ruleBasedInsights: ruleInsights,
      };

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context, mode }),
      });

      if (!res.ok) throw new Error(`Assistant request failed (${res.status})`);
      const data = await res.json();

      const aiMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.reply || 'No recommendation received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || (apiStatus === 'connected' ? 'Configured AI' : 'Rule-based (saved data)'),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: 'Unable to reach the insights service. Your saved-data dashboard above is still available; try again when the service is reachable.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const strategicShortcuts = [
    {
      title: 'Recorded Business Summary',
      desc: 'Summarize saved sales, expenses, profit, and receivables',
      prompt: 'Summarize only the supplied saved business metrics and point out any arithmetic or data limitations. Do not provide forecasts or industry benchmarks.',
      mode: 'audit',
      icon: TrendingUp,
    },
    isInventoryEnabled
      ? {
          title: 'Low-stock Review',
          desc: 'Review products against their configured minimum quantities',
          prompt: 'List only the supplied low-stock products, current quantities, and saved minimum thresholds. Do not invent reorder amounts or supplier lead times.',
          mode: 'restock',
          icon: Package,
        }
      : {
          title: 'Recorded Service Pricing',
          desc: 'Compare saved offering prices and sales where available',
          prompt: 'Review only the supplied service prices, saved costs, and recorded sales. Identify missing fields and do not infer market benchmarks.',
          mode: 'pricing',
          icon: Briefcase,
        },
    {
      title: 'Overdue Invoice Review',
      desc: 'Use actual overdue customer and invoice records',
      prompt: 'Use only the supplied overdue invoices and customer data. If there are none, say so. Do not invent names, invoice numbers, amounts, or payment terms.',
      mode: 'email',
      icon: Clock,
    },
    {
      title: 'Price & Cost Review',
      desc: 'Compare recorded selling prices with saved costs and sales',
      prompt: 'Compare supplied product selling prices, costs, and recorded sales only. Call out missing data and do not make unsupported market or demand claims.',
      mode: 'pricing',
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                AI Insights & Business Strategist
              </h2>
              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                Saved data
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Metrics, trends, and rules are calculated from your recorded business activity
            </p>
          </div>
        </div>

        <div className="text-right text-xs" role="status" aria-live="polite">
          <span className="text-slate-400">AI service: </span>
          <span className={`font-medium ${apiStatus === 'connected' ? 'text-emerald-700' : apiStatus === 'error' ? 'text-rose-700' : 'text-slate-600'}`}>
            {apiStatus === 'checking' ? 'Checking availability...' : apiStatus === 'connected' ? 'Configured' : apiStatus === 'unavailable' ? 'Not configured; rule-based mode' : 'Unavailable; saved-data insights remain active'}
          </span>
        </div>
      </div>

      {!hasSavedData && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>No saved business activity is available yet. Add products, sales, customers, or expenses to populate these insights.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Recorded Sales</span>
          <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900">{formatAmount(totalRevenue)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">{sales.length} saved transactions</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Recorded Expenses</span>
          <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900">{formatAmount(totalExpenses)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">{expenses.length} saved expense entries</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Net Profit</span>
          <div className={`mt-1 text-xl font-bold font-mono tabular-nums ${netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>{formatAmount(netProfit)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Recorded sales less recorded expenses</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Low-stock Products</span>
          <div className={`mt-1 text-xl font-bold font-mono tabular-nums ${lowStockItems.length ? 'text-amber-700' : 'text-slate-900'}`}>{lowStockItems.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">At or below configured stock minimum</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Sales & Profit Trends</h3>
          <p className="text-xs text-slate-500 mt-0.5">Monthly totals from saved sale and expense dates; profit = sales − expenses</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5"><i aria-hidden="true" className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />Sales</span>
          <span className="flex items-center gap-1.5"><i aria-hidden="true" className="w-2.5 h-2.5 rounded-sm bg-amber-500" />Expenses</span>
          <span className="flex items-center gap-1.5"><i aria-hidden="true" className="w-2.5 h-2.5 rounded-sm bg-sky-600" />Profit</span>
        </div>
        {monthlyMetrics.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">Monthly trends will appear when sales or expenses are recorded.</div>
        ) : (
          <div className="space-y-4">
            {monthlyMetrics.map((month) => {
              const bars = [
                { name: 'Sales', amount: month.revenue, color: 'bg-emerald-600' },
                { name: 'Expenses', amount: month.expenses, color: 'bg-amber-500' },
                { name: 'Profit', amount: month.profit, color: month.profit < 0 ? 'bg-rose-600' : 'bg-sky-600' },
              ];
              return (
                <div key={month.month} className="grid grid-cols-1 sm:grid-cols-[6rem_1fr] gap-3 sm:gap-5 items-center">
                  <span className="text-xs font-semibold text-slate-700">{formatMonth(month.month)}</span>
                  <div className="space-y-1.5">
                    {bars.map((bar) => (
                      <div key={bar.name} className="grid grid-cols-[4.5rem_minmax(0,1fr)_8rem] gap-2 items-center text-[11px]">
                        <span className="text-slate-500">{bar.name}</span>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${bar.color}`} style={{ width: `${Math.max(bar.amount ? 2 : 0, Math.abs(bar.amount) / trendScale * 100)}%` }} /></div>
                        <span className={`text-right font-mono tabular-nums ${bar.amount < 0 ? 'text-rose-700' : 'text-slate-700'}`}>{bar.amount < 0 ? '-' : ''}{formatAmount(Math.abs(bar.amount))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Best-selling Products</h3>
          {topProducts.length === 0 ? (
            <p className="py-5 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">No product sales are recorded yet.</p>
          ) : topProducts.map((product, index) => (
            <div key={product.itemId} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-2 items-center text-xs">
              <span className="text-slate-400 font-mono">{index + 1}</span>
              <div className="min-w-0">
                <div className="font-medium text-slate-800 truncate">{product.name}</div>
                <div className="text-[11px] text-slate-500">{product.quantity} units recorded</div>
              </div>
              <span className="font-mono tabular-nums text-slate-700">{formatAmount(product.revenue)}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Top Customers by Recorded Sales</h3>
          {topCustomers.length === 0 ? (
            <p className="py-5 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">Customer rankings appear when sales are linked to customer accounts.</p>
          ) : topCustomers.map((customer, index) => (
            <div key={customer.customerId} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-2 items-center text-xs">
              <span className="text-slate-400 font-mono">{index + 1}</span>
              <div className="min-w-0">
                <div className="font-medium text-slate-800 truncate">{customer.name}</div>
                <div className="text-[11px] text-slate-500">{customer.invoices} saved {customer.invoices === 1 ? 'sale' : 'sales'}</div>
              </div>
              <span className="font-mono tabular-nums text-slate-700">{formatAmount(customer.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Rule-based Insights & Actions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Derived from saved records. Expense outliers use a 2× overall median review flag, not a cross-category anomaly claim.</p>
          </div>
        </div>
        {ruleInsights.length === 0 ? (
          <div className="py-5 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
            {hasSavedData ? 'No configured rules were triggered by the current records. This is not a forecast.' : 'Add saved business activity to generate data-based recommendations.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {ruleInsights.map((insight) => {
              const Icon = insight.category === 'inventory' ? Package : insight.category === 'sales' ? TrendingDown : insight.category === 'customers' ? Users : insight.category === 'expenses' ? Receipt : TrendingUp;
              return (
                <div key={insight.id} className="border border-slate-200 rounded-lg p-3.5 flex gap-3">
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${insight.priority === 'High' ? 'text-rose-600' : 'text-amber-600'}`} />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-900">{insight.title}</h4>
                      <span className={`text-[10px] font-semibold ${insight.priority === 'High' ? 'text-rose-700' : 'text-amber-700'}`}>{insight.priority}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{insight.detail}</p>
                    <p className="text-[11px] text-emerald-800"><span className="font-semibold">Action:</span> {insight.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Strategic Shortcuts Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {strategicShortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.title}
              onClick={() => executeStrategyAction(s.prompt, s.mode)}
              disabled={loading}
              className="text-left p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-emerald-700 mb-1.5">
                  <span className="p-1 rounded-md bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                    <Icon className="w-4 h-4" />
                  </span>
                  <Sparkles className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  {s.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {s.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col h-[520px]">
        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-slate-50 border border-slate-200/70 text-slate-800 rounded-tl-xs space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {/* Render content cleanly */}
                    {m.content}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 text-[10px] text-slate-400 border-t border-slate-200/40">
                    <div className="flex items-center gap-1.5">
                      <span>{m.timestamp}</span>
                      {m.source && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-emerald-700 font-semibold">{m.source}</span>
                        </>
                      )}
                    </div>

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-semibold text-xs">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Gemini is synthesizing business data & generating strategic advice...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputPrompt.trim() && !loading) {
                executeStrategyAction(inputPrompt.trim());
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything (e.g. 'How can I improve my 37% margin?', 'Should I bundle photography with design?')..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
