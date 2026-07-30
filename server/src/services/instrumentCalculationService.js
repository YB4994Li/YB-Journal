const METADATA = new Map([
  ['XAUUSD', { contractSize: 100, tickSize: 0.01, tickValue: 1, quoteCurrency: 'USD' }],
  ['BTCUSD', { contractSize: 1, tickSize: 0.01, tickValue: 0.01, quoteCurrency: 'USD' }]
]);

const finitePositive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

export function calculateInstrumentRisk({ market, entryPrice, stopLoss, lotSize, accountCurrency = 'USD', conversionRates = {} }) {
  const metadata = METADATA.get(String(market || '').toUpperCase());
  if (!metadata) return { riskAmount: null, warning: `No reliable instrument metadata for ${market || 'unknown market'}` };
  if (![entryPrice, stopLoss, lotSize].every(finitePositive)) return { riskAmount: null, warning: 'Entry, stop loss, and lot size are required for instrument risk' };
  let conversion = 1;
  if (metadata.quoteCurrency !== accountCurrency) {
    conversion = Number(conversionRates[`${metadata.quoteCurrency}${accountCurrency}`]);
    if (!finitePositive(conversion)) return { riskAmount: null, warning: `Missing ${metadata.quoteCurrency}/${accountCurrency} conversion rate` };
  }
  const ticks = Math.abs(Number(entryPrice) - Number(stopLoss)) / metadata.tickSize;
  return { riskAmount: Number((ticks * metadata.tickValue * Number(lotSize) * conversion).toFixed(2)), warning: null };
}
