const forex = [
  'EURUSD','GBPUSD','USDJPY','USDCHF','USDCAD','AUDUSD','NZDUSD',
  'EURGBP','EURJPY','EURCHF','EURAUD','EURCAD','EURNZD','GBPJPY','GBPCHF','GBPAUD','GBPCAD','GBPNZD',
  'AUDJPY','AUDCAD','AUDCHF','AUDNZD','NZDJPY','NZDCAD','NZDCHF','CADJPY','CADCHF','CHFJPY'
];
const indices = ['NAS100','US30','SPX500','GER40','UK100','FRA40','EU50','JP225','AUS200','HK50'];
const crypto = ['BTCUSD','ETHUSD','SOLUSD','XRPUSD','LTCUSD','ADAUSD'];
const commodities = ['USOIL','UKOIL','NATGAS'];

const forexSource = 'Baseline retail-FX standard-lot convention: 100,000 base-currency units; profit settles in quote currency. Reference: https://www.oanda.com/assets/documents/1958/Retail_Client_Product_Disclosure_Statement_080525.pdf. Broker specifications remain authoritative.';
const unsupportedSource = 'Catalog entry only. CFD contract and tick values vary by broker, so automatic risk remains disabled until a verified specification is supplied.';

export const instrumentSeedData = [
  ...forex.map((symbol) => ({
    symbol,
    normalizedSymbol: symbol,
    displayName: symbol,
    assetClass: 'FOREX',
    contractSize: '100000',
    tickSize: symbol.endsWith('JPY') ? '0.001' : '0.00001',
    tickValuePerLot: null,
    pipSize: symbol.endsWith('JPY') ? '0.01' : '0.0001',
    profitCurrency: symbol.slice(3),
    calculationMode: 'FOREX_CONVERSION',
    isActive: true,
    isVerified: true,
    source: forexSource
  })),
  {
    symbol: 'XAUUSD', normalizedSymbol: 'XAUUSD', displayName: 'Gold / US Dollar', assetClass: 'METAL',
    contractSize: '100', tickSize: '0.01', tickValuePerLot: '1', pipSize: '0.01', profitCurrency: 'USD',
    calculationMode: 'TICK_VALUE', isActive: true, isVerified: true,
    source: 'Baseline 100-troy-ounce gold CFD lot with USD 1 per 0.01 tick. Calculation fields follow MetaTrader symbol-specification semantics: https://www.metatrader5.com/en/mobile-trading/android/help/quotes. Broker specification must be checked.'
  },
  {
    symbol: 'XAGUSD', normalizedSymbol: 'XAGUSD', displayName: 'Silver / US Dollar', assetClass: 'METAL',
    contractSize: '5000', tickSize: '0.001', tickValuePerLot: '5', pipSize: '0.001', profitCurrency: 'USD',
    calculationMode: 'TICK_VALUE', isActive: true, isVerified: true,
    source: 'Baseline 5,000-troy-ounce silver CFD lot with USD 5 per 0.001 tick. Calculation fields follow MetaTrader symbol-specification semantics: https://www.metatrader5.com/en/mobile-trading/android/help/quotes. Broker specification must be checked.'
  },
  ...indices.map((symbol) => ({
    symbol, normalizedSymbol: symbol, displayName: symbol, assetClass: 'INDEX',
    contractSize: null, tickSize: null, tickValuePerLot: null, pipSize: null, profitCurrency: null,
    calculationMode: 'UNSUPPORTED', isActive: true, isVerified: false, source: unsupportedSource
  })),
  ...crypto.map((symbol) => ({
    symbol, normalizedSymbol: symbol, displayName: symbol, assetClass: 'CRYPTO',
    contractSize: null, tickSize: null, tickValuePerLot: null, pipSize: null, profitCurrency: 'USD',
    calculationMode: 'UNSUPPORTED', isActive: true, isVerified: false, source: unsupportedSource
  })),
  ...commodities.map((symbol) => ({
    symbol, normalizedSymbol: symbol, displayName: symbol, assetClass: 'COMMODITY',
    contractSize: null, tickSize: null, tickValuePerLot: null, pipSize: null, profitCurrency: 'USD',
    calculationMode: 'UNSUPPORTED', isActive: true, isVerified: false, source: unsupportedSource
  }))
];

export async function seedInstrumentSpecifications(db) {
  for (const specification of instrumentSeedData) {
    await db.instrumentSpecification.upsert({
      where: { normalizedSymbol: specification.normalizedSymbol },
      update: specification,
      create: specification
    });
  }
  return instrumentSeedData.length;
}
