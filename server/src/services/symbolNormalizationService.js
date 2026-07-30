const aliases = new Map(Object.entries({
  GOLD: 'XAUUSD',
  XAUUSD: 'XAUUSD',
  SILVER: 'XAGUSD',
  XAGUSD: 'XAGUSD',
  USTEC: 'NAS100',
  US100: 'NAS100',
  NASDAQ: 'NAS100',
  NASDAQ100: 'NAS100',
  NAS100: 'NAS100',
  US500: 'SPX500',
  SP500: 'SPX500',
  'S&P500': 'SPX500',
  SPX500: 'SPX500',
  DJ30: 'US30',
  DJIA: 'US30',
  WALLSTREET30: 'US30',
  US30: 'US30',
  DE40: 'GER40',
  DAX40: 'GER40',
  GER40: 'GER40',
  WTI: 'USOIL',
  XTIUSD: 'USOIL',
  BRENT: 'UKOIL',
  XBRUSD: 'UKOIL'
}));

const knownSuffixes = ['.PRO', '.RAW', '.ECN', '.STD', '.MINI', '_PRO', '_RAW', '-PRO'];

export function normalizeSymbol(value) {
  const original = String(value ?? '').trim();
  if (!original) return null;
  let symbol = original.toUpperCase().replace(/\s+/g, '');
  if (['UNKNOWN', 'N/A', 'NULL', '-'].includes(symbol)) return null;
  if (aliases.has(symbol)) return aliases.get(symbol);

  for (const suffix of knownSuffixes) {
    if (symbol.endsWith(suffix)) {
      symbol = symbol.slice(0, -suffix.length);
      break;
    }
  }
  const separatedM = symbol.match(/^(.+)[._-]M$/);
  if (separatedM && (/^[A-Z]{6}$/.test(separatedM[1]) || aliases.has(separatedM[1]))) symbol = separatedM[1];
  symbol = symbol.replace('/', '');
  if (aliases.has(symbol)) return aliases.get(symbol);

  // A terminal broker "m" suffix is removed only from a recognizable market token.
  if (/^[A-Z0-9]{4,12}M$/.test(symbol)) {
    const withoutSuffix = symbol.slice(0, -1);
    if (/^[A-Z]{6}$/.test(withoutSuffix) || aliases.has(withoutSuffix) || /^(US100|NAS100|BTCUSD|XAUUSD)$/.test(withoutSuffix)) {
      symbol = withoutSuffix;
    }
  }
  return aliases.get(symbol) || symbol;
}

export function supportedSymbolAliases() {
  return Object.fromEntries(aliases);
}
