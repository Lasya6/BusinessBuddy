import { GoogleGenAI } from '@google/genai';

type AssistantContext = Record<string, any> | undefined;

let aiClient: GoogleGenAI | null = null;
let clientInitialized = false;

const getAiClient = () => {
  if (clientInitialized) return aiClient;
  clientInitialized = true;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'businessbuddy' } },
    });
  } catch (error) {
    console.error('Failed to initialize Gemini client:', error);
  }
  return aiClient;
};

const formatAmount = (value: unknown, symbol: string) => {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${symbol}${amount.toFixed(2)}`;
};

const buildBusinessSummary = (context: AssistantContext) => {
  if (!context) return 'No business records were supplied.';
  const symbol = typeof context.currencySymbol === 'string' ? context.currencySymbol : '';
  const lines = [
    context.businessName ? `Business: ${context.businessName} (${context.businessType || 'type not set'})` : null,
    context.currency ? `Currency code: ${context.currency}` : null,
    Number.isFinite(context.totalRevenue) ? `Recorded sales: ${formatAmount(context.totalRevenue, symbol)}` : null,
    Number.isFinite(context.totalExpenses) ? `Recorded expenses: ${formatAmount(context.totalExpenses, symbol)}` : null,
    Number.isFinite(context.netProfit) ? `Recorded net profit (sales minus expenses): ${formatAmount(context.netProfit, symbol)}` : null,
    Number.isFinite(context.outstandingReceivables) ? `Recorded receivables: ${formatAmount(context.outstandingReceivables, symbol)}` : null,
    Array.isArray(context.lowStockItems)
      ? `Low-stock products: ${context.lowStockItems.map((item: any) => `${item.name} (${item.quantity} on hand; minimum ${item.minThreshold})`).join('; ') || 'None recorded'}`
      : null,
    Array.isArray(context.topProducts)
      ? `Top products by saved sale quantity: ${context.topProducts.map((item: any) => `${item.name} (${item.quantity} units; ${formatAmount(item.revenue, symbol)} recorded sales)`).join('; ') || 'No product sales recorded'}`
      : null,
    Array.isArray(context.topCustomers)
      ? `Top customers by saved sales: ${context.topCustomers.map((customer: any) => `${customer.name} (${formatAmount(customer.revenue, symbol)} across ${customer.invoices} sales)`).join('; ') || 'No customer-linked sales recorded'}`
      : null,
    context.expenseTotalsByCategory && typeof context.expenseTotalsByCategory === 'object'
      ? `Recorded expenses by category: ${Object.entries(context.expenseTotalsByCategory).map(([category, amount]) => `${category}: ${formatAmount(amount, symbol)}`).join('; ') || 'None recorded'}`
      : null,
    Array.isArray(context.ruleBasedInsights)
      ? `Calculated rule-based findings: ${context.ruleBasedInsights.map((insight: any) => `${insight.title}: ${insight.detail} Action: ${insight.action}`).join('\n') || 'No rules triggered'}`
      : null,
  ];
  return lines.filter(Boolean).join('\n');
};

const buildRuleBasedReply = (context: AssistantContext) => {
  const insights = Array.isArray(context?.ruleBasedInsights) ? context.ruleBasedInsights : [];
  const businessName = typeof context?.businessName === 'string' ? context.businessName : null;
  if (!insights.length) {
    return `Rule-based mode (no AI API configured).${businessName ? ` No rule-based findings were triggered for ${businessName}.` : ' No rule-based findings were supplied.'} These checks only report saved-data rules and do not forecast future results.`;
  }
  const findings = insights.map((insight: any) => {
    const title = typeof insight.title === 'string' ? insight.title : 'Saved-data finding';
    const detail = typeof insight.detail === 'string' ? insight.detail : 'No additional detail supplied.';
    const action = typeof insight.action === 'string' ? insight.action : 'Review the related saved records.';
    return `- ${title}: ${detail} Action: ${action}`;
  });
  return [
    `Rule-based insights from saved data${businessName ? ` for ${businessName}` : ''} (no AI API configured):`,
    ...findings,
    'These findings describe recorded activity only; they are not forecasts or industry benchmarks.',
  ].join('\n');
};

export const hasConfiguredGeminiApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
};

export const getAssistantReply = async (prompt: string, context: AssistantContext) => {
  const client = getAiClient();
  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are BusinessBuddy's business operations assistant. Answer clearly and concisely using only supplied saved business records. Never invent amounts, customers, products, benchmarks, forecasts, thresholds, payment terms, or missing facts. Distinguish measured findings from suggestions and state when data is absent.\n\nSaved business data:\n${buildBusinessSummary(context)}`,
          temperature: 0.2,
        },
      });
      if (response.text) return { reply: response.text, source: 'gemini-3.8-flash', hasApiKey: true };
    } catch (error) {
      console.warn('Gemini request failed; returning saved-data rules:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return {
    reply: buildRuleBasedReply(context),
    source: 'rule-based (saved data)',
    hasApiKey: false,
  };
};