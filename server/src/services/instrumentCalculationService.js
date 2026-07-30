const positive = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0;
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));

function conversionRate({ specification, normalizedSymbol, accountCurrency, entryPrice, conversionRate, conversionRates = {} }) {
  const profitCurrency = specification.profitCurrency?.toUpperCase();
  const account = String(accountCurrency || '').toUpperCase();
  if (positive(conversionRate)) return Number(conversionRate);
  if (!profitCurrency || !account || profitCurrency === account) return 1;

  const direct = Number(conversionRates[`${profitCurrency}${account}`]);
  if (positive(direct)) return direct;
  const inverse = Number(conversionRates[`${account}${profitCurrency}`]);
  if (positive(inverse)) return 1 / inverse;

  if (specification.assetClass === 'FOREX' && normalizedSymbol?.length === 6 && positive(entryPrice)) {
    const base = normalizedSymbol.slice(0, 3);
    const quote = normalizedSymbol.slice(3);
    if (profitCurrency === quote && account === base) return 1 / Number(entryPrice);
  }
  return null;
}

export function calculateInstrumentRisk(input) {
  const {
    normalizedSymbol,
    entryPrice,
    stopLoss,
    lotSize,
    accountCurrency,
    instrumentSpecification: specification
  } = input;

  if (!specification || !specification.isActive || !specification.isVerified) {
    return { riskAmount: null, error: 'MISSING_INSTRUMENT_SPECIFICATION', status: 'UNAVAILABLE' };
  }
  if (!positive(entryPrice)) return { riskAmount: null, error: 'MISSING_ENTRY_PRICE', status: 'UNAVAILABLE' };
  if (!positive(stopLoss)) return { riskAmount: null, error: 'MISSING_STOP_LOSS', status: 'UNAVAILABLE' };
  if (!positive(lotSize)) return { riskAmount: null, error: 'MISSING_LOT_SIZE', status: 'UNAVAILABLE' };
  if (Number(entryPrice) === Number(stopLoss)) return { riskAmount: null, error: 'INVALID_PRICE_GEOMETRY', status: 'UNAVAILABLE' };
  if (specification.calculationMode === 'UNSUPPORTED') {
    return { riskAmount: null, error: 'UNSUPPORTED_CALCULATION_MODE', status: 'UNAVAILABLE' };
  }

  const rate = conversionRate({ ...input, specification, normalizedSymbol, accountCurrency, entryPrice });
  if (rate === null) return { riskAmount: null, error: 'MISSING_CONVERSION_RATE', status: 'UNAVAILABLE' };

  const distance = Math.abs(Number(entryPrice) - Number(stopLoss));
  const tickSize = Number(specification.tickSize);
  const tickValue = Number(specification.tickValuePerLot);
  const contractSize = Number(specification.contractSize);
  let amountInProfitCurrency;
  let mode;

  if (positive(tickSize) && positive(tickValue)) {
    amountInProfitCurrency = (distance / tickSize) * tickValue * Number(lotSize);
    mode = 'TICK_VALUE';
  } else if (positive(contractSize) && ['CONTRACT_SIZE', 'FOREX_CONVERSION'].includes(specification.calculationMode)) {
    amountInProfitCurrency = distance * contractSize * Number(lotSize);
    mode = specification.calculationMode;
  } else {
    return { riskAmount: null, error: 'UNSUPPORTED_CALCULATION_MODE', status: 'UNAVAILABLE' };
  }

  return {
    riskAmount: round(amountInProfitCurrency * rate),
    error: null,
    status: 'CALCULATED',
    snapshot: {
      instrumentSpecificationId: specification.id,
      riskCalculationMode: mode,
      contractSizeUsed: positive(specification.contractSize) ? Number(specification.contractSize) : null,
      tickSizeUsed: positive(specification.tickSize) ? Number(specification.tickSize) : null,
      tickValueUsed: positive(specification.tickValuePerLot) ? Number(specification.tickValuePerLot) : null,
      pipSizeUsed: positive(specification.pipSize) ? Number(specification.pipSize) : null,
      conversionRateUsed: rate,
      riskCalculationSource: specification.source || `Instrument specification ${specification.normalizedSymbol}`
    }
  };
}

export const RISK_ERROR_MESSAGES = {
  MISSING_INSTRUMENT_SPECIFICATION: 'Instrument specification unavailable',
  MISSING_ENTRY_PRICE: 'Missing entry price',
  MISSING_STOP_LOSS: 'Missing stop loss',
  MISSING_LOT_SIZE: 'Missing lot size or volume',
  MISSING_CONVERSION_RATE: 'Currency conversion unavailable',
  UNSUPPORTED_CALCULATION_MODE: 'Instrument calculation mode is unsupported',
  INVALID_PRICE_GEOMETRY: 'Invalid entry and stop-loss geometry'
};
