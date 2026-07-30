// Add new broker header spellings here. The importer resolves these aliases
// before format detection or row validation.
export const CSV_HEADER_ALIASES = {
  ticket: ['ticket', 'ticket id', 'order', 'order id', 'position', 'position id', 'deal', 'deal id'],
  opening_time_utc: ['opening time utc', 'opening time', 'open time', 'open date', 'entry time', 'trade date', 'tradedate', 'time', 'date'],
  closing_time_utc: ['closing time utc', 'closing time', 'close time', 'close date', 'exit time'],
  type: ['type', 'direction', 'side', 'trade type'],
  lots: ['lots', 'lot', 'lot size', 'volume', 'size', 'quantity'],
  symbol: ['symbol', 'instrument', 'market', 'asset', 'item'],
  profit: ['profit', 'p/l', 'p & l', 'pnl', 'net profit', 'profit loss', 'profitloss'],
  commission: ['commission', 'commissions', 'fee', 'fees'],
  swap: ['swap', 'swaps', 'financing'],
  open_price: ['opening price', 'open price', 'entry price', 'entryprice'],
  close_price: ['closing price', 'close price', 'exit price', 'exitprice'],
  stop_loss: ['sl', 's/l', 'stop loss', 'stoploss'],
  take_profit: ['tp', 't/p', 'take profit', 'takeprofit'],
  comment: ['comment', 'comments', 'note', 'notes', 'emotion', 'emotions'],
  strategy: ['strategy', 'strategy name', 'strategyname'],
  session: ['session'],
  timeframe: ['timeframe', 'time frame'],
  planned_rr: ['planned rr', 'plannedrr', 'planned r'],
  result_r: ['result r', 'resultr'],
  risk_percentage: ['risk percentage', 'riskpercentage', 'risk percent', 'risk %'],
  risk_amount: ['risk amount', 'riskamount'],
  balance_before_trade: ['balance before trade', 'balancebeforetrade', 'starting balance'],
  result: ['result', 'outcome']
};

export function normalizeHeaderToken(header) {
  return String(header || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const aliasLookup = new Map();
for (const [canonical, aliases] of Object.entries(CSV_HEADER_ALIASES)) {
  for (const alias of [canonical, ...aliases]) {
    aliasLookup.set(normalizeHeaderToken(alias), canonical);
  }
}

export function resolveHeader(header) {
  return aliasLookup.get(normalizeHeaderToken(header)) || null;
}

export function resolveHeaders(headers) {
  const counts = new Map();
  return headers.map((rawHeader) => {
    const token = normalizeHeaderToken(rawHeader);
    let canonical = resolveHeader(rawHeader);

    // Standard MetaTrader reports commonly repeat "Time" and "Price":
    // first occurrence is opening, second occurrence is closing.
    if (token === 'time') canonical = (counts.get('time') || 0) === 0 ? 'opening_time_utc' : 'closing_time_utc';
    if (token === 'price') canonical = (counts.get('price') || 0) === 0 ? 'open_price' : 'close_price';

    counts.set(token, (counts.get(token) || 0) + 1);
    return canonical;
  });
}

export const BROKER_REQUIRED_FIELDS = ['opening_time_utc', 'type', 'symbol'];
