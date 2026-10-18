export const formatCurrency = (
  amount: number,
  currency: string,
  symbol: string
): string => {
  const locale = currency.toUpperCase() === 'INR' ? 'en-IN' : undefined;
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

  return `${symbol || '$'}${formattedAmount}`;
};