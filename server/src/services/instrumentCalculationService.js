const finitePositive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

export function calculateInstrumentRisk({ market, entryPrice, stopLoss, lotSize, accountCurrency = 'USD', conversionRates = {}, instrumentMetadata }) {
  const metadata = instrumentMetadata;
  if (!metadata || ![metadata.contractSize, metadata.tickSize, metadata.tickValue].every(finitePositive)) {
    return { riskAmount: null, warning: `No reliable instrument metadata for ${market || 'unknown market'}` };
  }
  if (![entryPrice, stopLoss, lotSize].every(finitePositive)) return { riskAmount: null, warning: 'Entry, stop loss, and lot size are required for instrument risk' };
  let conversion = 1;
  if (metadata.quoteCurrency !== accountCurrency) {
    conversion = Number(conversionRates[`${metadata.quoteCurrency}${accountCurrency}`]);
    if (!finitePositive(conversion)) return { riskAmount: null, warning: `Missing ${metadata.quoteCurrency}/${accountCurrency} conversion rate` };
  }
  const ticks = Math.abs(Number(entryPrice) - Number(stopLoss)) / Number(metadata.tickSize);
  return { riskAmount: Number((ticks * Number(metadata.tickValue) * Number(lotSize) * conversion).toFixed(2)), warning: null };
}
