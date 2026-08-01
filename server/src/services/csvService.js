import Papa from 'papaparse';
import { prisma } from '../config/prisma.js';
import { BROKER_REQUIRED_FIELDS, normalizeHeaderToken, resolveHeaders } from '../config/csvHeaderConfig.js';
import { ApiError } from '../utils/ApiError.js';
import { nextTradeNumber, normalizeTrade, serializeTrade } from './tradeService.js';
import { autoSessionFields } from './sessionService.js';
import { recalculateJournalHistory } from './journalBalanceService.js';
import { manualTradeAnalytics, reconstructRealizedBalances } from './tradeCalculationService.js';
import { normalizeMarketSymbol } from './marketAnalyticsService.js';
import { ensureStrategy } from './tradingLibraryService.js';

export const csvColumns = ['strategy', 'market', 'date', 'session', 'timeframe', 'direction', 'entryPrice', 'stopLoss', 'takeProfit', 'lotSize', 'riskAmount', 'balanceBeforeTrade', 'exitPrice', 'result', 'profitLoss', 'emotion'];

const decimalFields = ['entryPrice', 'stopLoss', 'takeProfit', 'lotSize', 'riskAmount', 'balanceBeforeTrade', 'plannedRROverride', 'riskPercentageOverride', 'exitPrice', 'profitLoss'];

function parseNumber(value) {
  if (value == null || String(value).trim() === '') return null;
  let normalized = String(value)
    .trim()
    .replace(/[−–—]/g, '-')
    .replace(/\u00a0/g, '')
    .replace(/\s/g, '');
  const negativeParentheses = /^\(.*\)$/.test(normalized);
  normalized = normalized.replace(/[^\d.,+\-]/g, '');
  if (negativeParentheses) normalized = `-${normalized}`;

  const comma = normalized.lastIndexOf(',');
  const dot = normalized.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    const decimalSeparator = comma > dot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = normalized.replaceAll(thousandsSeparator, '').replace(decimalSeparator, '.');
  } else if (comma >= 0) {
    normalized = normalized.replaceAll(',', normalized.indexOf(',') === comma ? '.' : '');
  } else if ((normalized.match(/\./g) || []).length > 1) {
    const last = normalized.lastIndexOf('.');
    normalized = `${normalized.slice(0, last).replaceAll('.', '')}.${normalized.slice(last + 1)}`;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? String(number) : null;
}

export function parseExnessProfit(value) {
  return parseNumber(value) ?? '0';
}

function parseTradeDate(value) {
  const input = String(value || '').trim();
  if (!input) return null;
  const yearFirst = input.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (yearFirst) return `${yearFirst[1]}-${yearFirst[2].padStart(2, '0')}-${yearFirst[3].padStart(2, '0')}`;
  const dayFirst = input.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dayFirst) return `${dayFirst[3]}-${dayFirst[2].padStart(2, '0')}-${dayFirst[1].padStart(2, '0')}`;
  const timestamp = Date.parse(input);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString().slice(0, 10);
}

function resultFromProfit(profitLoss) {
  const amount = Number(profitLoss);
  if (amount > 0) return 'WIN';
  if (amount < 0) return 'LOSS';
  return 'BREAK_EVEN';
}

export function normalizeExnessMarket(value) {
  const original = String(value || '').trim();
  if (!original) return { market: 'UNKNOWN', originalMarket: null };
  return { market: normalizeMarketSymbol(original) || 'UNKNOWN', originalMarket: original };
}

function mapTemplateRow(row) {
  return {
    strategyName: row.strategy,
    market: row.symbol,
    tradeDate: row.opening_time_utc,
    session: row.session,
    timeframe: row.timeframe,
    direction: row.type,
    entryPrice: row.open_price,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    lotSize: row.lots,
    riskAmount: row.risk_amount,
    balanceBeforeTrade: row.balance_before_trade,
    plannedRROverride: row.planned_rr,
    riskPercentageOverride: row.risk_percentage,
    exitPrice: row.close_price,
    importSource: 'GENERIC_CSV',
    resultSource:'AUTO',
    result: row.result,
    profitLoss: row.profit,
    emotion: row.comment
  };
}

export function mapExnessRow(row, format = 'EXNESS') {
  const brokerProfit = Number(parseExnessProfit(row.profit) || 0);
  const commission = Number(parseExnessProfit(row.commission) || 0);
  const swap = Number(parseExnessProfit(row.swap) || 0);
  const profitLoss = String(Number((brokerProfit + (row._profitIsNet ? 0 : commission + swap)).toFixed(2)));
  const { market, originalMarket } = normalizeExnessMarket(row.symbol);
  const sessionFields = autoSessionFields(row.opening_time_utc, row.closing_time_utc);
  return {
    strategyName: row.strategy?.trim() || null,
    market,
    originalMarket,
    importSource: ['EXNESS', 'MT4', 'MT5', 'FUNDEDNEXT'].includes(format) ? format : 'MT5',
    resultSource:'AUTO',
    sourceTradeId: String(row.ticket || '').trim() || null,
    tradeDate: sessionFields.openTimeUtc?.toISOString().slice(0, 10) || parseTradeDate(row.closing_time_utc) || '1970-01-01',
    ...sessionFields,
    timeframe: null,
    direction: String(row.type || '').trim().toUpperCase(),
    entryPrice: parseNumber(row.open_price),
    stopLoss: parseNumber(row.stop_loss),
    takeProfit: parseNumber(row.take_profit),
    lotSize: parseNumber(row.lots),
    exitPrice: parseNumber(row.close_price),
    result: resultFromProfit(profitLoss),
    profitLoss,
    emotion: row.comment?.trim() || null
  };
}

export function validateCsvRow(row, index, options = {}) {
  const data = { ...row };
  const errors = [];
  const isBroker = options.format !== 'TEMPLATE' || Boolean(data.importSource);
  data.strategyName = data.strategyName?.trim() || null;
  if (!data.market?.trim()) errors.push('market is required');

  data.tradeDate = parseTradeDate(data.tradeDate);
  if (!data.tradeDate || Number.isNaN(Date.parse(`${data.tradeDate}T00:00:00.000Z`))) errors.push('date must be a valid trading date');
  data.direction = data.direction?.trim().toUpperCase();
  if (!['BUY', 'SELL'].includes(data.direction)) errors.push('direction must be BUY or SELL');

  for (const field of decimalFields) {
    const original = data[field];
    data[field] = parseNumber(original);
    if (field === 'profitLoss' && data[field] == null && isBroker) data[field] = '0';
    else if (field === 'profitLoss' && data[field] == null) errors.push('profitLoss is required and must be numeric');
    else if (original != null && String(original).trim() !== '' && data[field] == null) errors.push(`${field} must be numeric`);
  }

  data.result = data.result?.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (isBroker || (!data.result && data.profitLoss != null)) data.result = resultFromProfit(data.profitLoss || '0');
  if (!['WIN', 'LOSS', 'BREAK_EVEN'].includes(data.result)) errors.push('result must be WIN, LOSS, or BREAK_EVEN');

  const normalized = normalizeTrade(data);
  const calculationContext = options.calculationContext || {};
  Object.assign(normalized, manualTradeAnalytics({ ...normalized, manualRiskProvided: data.riskAmount !== '' && data.riskAmount != null }, calculationContext));
  return { rowNumber: index + 2, valid: errors.length === 0, data: normalized, errors };
}

export function detectCsvFormat(headers = []) {
  const tokens = new Set(headers.map(normalizeHeaderToken));
  const canonical = new Set(resolveHeaders(headers).filter(Boolean));
  if (['strategy', 'plannedrr', 'resultr', 'riskpercentage', 'emotion'].some((token) => tokens.has(token))) return 'TEMPLATE';
  if (tokens.has('openingtimeutc') || tokens.has('closingtimeutc') || tokens.has('openingprice')) return 'EXNESS';
  if (BROKER_REQUIRED_FIELDS.some((field) => canonical.has(field)) || canonical.has('ticket')) return 'METATRADER';
  return 'UNKNOWN';
}

export function detectImportSource(headers = [], format = detectCsvFormat(headers)) {
  const tokens = new Set(headers.map(normalizeHeaderToken));
  if (format === 'EXNESS') return 'EXNESS';
  if (format === 'TEMPLATE') return 'GENERIC_CSV';
  if (tokens.has('ticketid') && tokens.has('netprofit') && (tokens.has('opendate') || tokens.has('instrument'))) return 'FUNDEDNEXT';
  if (tokens.has('position') || tokens.has('positionid') || tokens.has('deal') || tokens.has('dealid')) return 'MT5';
  if (headers.filter((header) => normalizeHeaderToken(header) === 'time').length > 1) return 'MT5';
  if (format === 'METATRADER') return 'MT4';
  return 'GENERIC_CSV';
}

function headerError(format, missingFields, detectedHeaders) {
  const recognized = format === 'METATRADER' ? 'MT4 / MT5 / FundedNext / standard MetaTrader' : format;
  const message = [
    `Recognized format: ${recognized}.`,
    `Missing required fields: ${missingFields.join(', ')}.`,
    `Detected headers: ${detectedHeaders.join(', ') || '(none)'}.`
  ].join(' ');
  return new ApiError(422, message, [
    { field: 'missingFields', msg: `Missing required fields: ${missingFields.join(', ')}` },
    { field: 'detectedHeaders', msg: `Detected headers: ${detectedHeaders.join(', ') || '(none)'}` },
    { field: 'recognizedFormat', msg: `Recognized format: ${recognized}` }
  ]);
}

function rowsToObjects(dataRows, canonicalHeaders, detectedHeaders) {
  const profitIndex = canonicalHeaders.indexOf('profit');
  const profitIsNet = profitIndex >= 0 && /net\s*profit/i.test(detectedHeaders[profitIndex]);
  return dataRows.map((values) => {
    const row = {};
    canonicalHeaders.forEach((header, index) => {
      if (header && row[header] == null) row[header] = values[index];
    });
    if (values.length > detectedHeaders.length && canonicalHeaders.at(-1) === 'profit') {
      row.profit = [row.profit, ...values.slice(detectedHeaders.length)].join(',');
    }
    row._profitIsNet = profitIsNet;
    return { row, values };
  });
}

export function parseCsv(buffer,calculationContext={}) {
  const parsed = Papa.parse(buffer.toString('utf8').replace(/^\uFEFF/, ''), { skipEmptyLines: false });
  const structuralErrors = parsed.errors.filter((error) => !['TooFewFields', 'TooManyFields', 'UndetectableDelimiter'].includes(error.code));
  if (structuralErrors.length) throw new ApiError(422, 'CSV parsing failed', structuralErrors);
  if (parsed.data.length < 2) throw new ApiError(422, 'CSV file contains no data rows');

  const detectedHeaders = parsed.data[0].map((header) => String(header || '').trim());
  const canonicalHeaders = resolveHeaders(detectedHeaders);
  const format = detectCsvFormat(detectedHeaders);
  const importSource = detectImportSource(detectedHeaders, format);
  const available = new Set(canonicalHeaders.filter(Boolean));
  const missingFields = BROKER_REQUIRED_FIELDS.filter((field) => !available.has(field));
  if (missingFields.length) throw headerError(format, missingFields, detectedHeaders);

  const rows = [];
  const skippedRows = [];
  const rowObjects = rowsToObjects(parsed.data.slice(1), canonicalHeaders, detectedHeaders);
  for (let index = 0; index < rowObjects.length; index += 1) {
    const { row, values } = rowObjects[index];
    const populated = values.some((value) => String(value ?? '').trim() !== '');
    if (!populated) {
      skippedRows.push({ rowNumber: index + 2, reason: 'Empty row' });
      continue;
    }
    const type = String(row.type || '').trim().toLowerCase();
    const looksLikeTrade = ['buy', 'sell'].includes(type) && Boolean(String(row.ticket || row.symbol || row.opening_time_utc || '').trim());
    if (!looksLikeTrade) {
      skippedRows.push({ rowNumber: index + 2, reason: `Not a closed buy/sell trade row (type: ${row.type || 'missing'})` });
      continue;
    }
    const mapped = format === 'TEMPLATE' ? mapTemplateRow(row) : mapExnessRow(row, importSource);
    rows.push(validateCsvRow(mapped, index, { format,calculationContext }));
  }

  if (Number.isFinite(Number(calculationContext.initialCapital))) {
    const validRows = rows.filter((row) => row.valid);
    const history = reconstructRealizedBalances(validRows.map((row) => ({ ...row.data, _csvRowNumber: row.rowNumber })), Number(calculationContext.initialCapital));
    const balances = new Map(history.map((item) => [item.trade._csvRowNumber, item]));
    for (const row of validRows) {
      const item = balances.get(row.rowNumber);
      Object.assign(row.data, {
        balanceBeforeTrade: String(item.balanceBeforeTrade),
        balanceAfterTrade: String(item.balanceAfterTrade),
        ...manualTradeAnalytics(
          { ...row.data, balanceBeforeTrade: item.balanceBeforeTrade, profitLoss: item.netProfitLoss },
          {
            ...calculationContext,
            balanceBeforeTrade: item.balanceBeforeTrade,
            initialCapital: calculationContext.initialCapital
          }
        )
      });
    }
  }

  return {
    format,
    importSource,
    detectedHeaders,
    rows,
    summary: {
      total: rows.length,
      totalDetected: rows.length,
      valid: rows.filter((row) => row.valid).length,
      invalid: rows.filter((row) => !row.valid).length,
      skippedEmpty: skippedRows.filter((row) => row.reason === 'Empty row').length,
      failedRows: skippedRows.filter((row) => row.reason !== 'Empty row').length
    },
    skippedRows
  };
}

export async function importRows(accountId, rows, sourceSummary = {}, requestedPhaseId = null) {
  if (!Array.isArray(rows) || !rows.length) throw new ApiError(422, 'No rows were provided for import');
  const checked = rows.map((row, index) => validateCsvRow(row, index, { format: row.importSource || 'TEMPLATE' }));
  if (checked.some((row) => !row.valid)) throw new ApiError(422, 'Confirmed rows contain validation errors', checked.filter((row) => !row.valid));

  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({ where: { id: accountId }, select: { id: true, accountType: true, initialCapital: true, currency: true,breakEvenThresholdPercent:true } });
    if (!account) throw new ApiError(404, 'Account not found');
    const phaseId = requestedPhaseId == null || requestedPhaseId === '' ? null : Number(requestedPhaseId);
    if (account.accountType === 'FUNDED' && !phaseId) throw new ApiError(422, 'Select a destination phase before importing into a funded account');
    const destinationPhase=phaseId?await tx.accountPhase.findFirst({ where: { id: phaseId, accountId }, select: { id:true,initialBalance:true,breakEvenThresholdPercent:true } }):null;
    if (phaseId && !destinationPhase) throw new ApiError(422, 'Import phase must belong to the selected account');
    const sourceIds = checked.map((row) => row.data.sourceTradeId).filter(Boolean);
    const existing = sourceIds.length ? await tx.trade.findMany({
      where: { accountId, sourceTradeId: { in: sourceIds } },
      select: { importSource: true, sourceTradeId: true }
    }) : [];
    const seen = new Set(existing.map((trade) => `${trade.importSource}:${trade.sourceTradeId}`));
    let duplicates = 0;
    let number = await nextTradeNumber(accountId, tx);
    const existingTrades = await tx.trade.findMany({ where: { accountId, phaseId }, orderBy: { tradeNumber: 'asc' } });
    const initialBalance = phaseId
      ? Number(destinationPhase.initialBalance)
      : Number(account.initialCapital);
    const balanceMap = new Map(reconstructRealizedBalances([
      ...existingTrades,
      ...checked.map((row, rowNumber) => ({ ...row.data, rowNumber, _previewKey: rowNumber }))
    ], initialBalance).map(({ trade, balanceBeforeTrade }) => [trade._previewKey ?? `existing-${trade.id}`, balanceBeforeTrade]));
    const created = [];
    for (let rowIndex = 0; rowIndex < checked.length; rowIndex += 1) {
      const row = checked[rowIndex];
      const key = row.data.sourceTradeId ? `${row.data.importSource}:${row.data.sourceTradeId}` : null;
      if (key && seen.has(key)) {
        duplicates += 1;
        continue;
      }
      if (key) seen.add(key);
      const balanceBeforeTrade = balanceMap.get(rowIndex);
      const analytics = manualTradeAnalytics({ ...row.data,resultSource:row.data.resultSource||'AUTO' }, { initialCapital:Number(destinationPhase?.initialBalance??account.initialCapital),breakEvenThresholdPercent:Number(destinationPhase?.breakEvenThresholdPercent??account.breakEvenThresholdPercent) });
      const strategy=await ensureStrategy(tx,row.data.strategyName);
      created.push(await tx.trade.create({ data: { ...row.data, ...analytics, strategyId:strategy?.id||null, strategyName:null, balanceBeforeTrade: String(balanceBeforeTrade), accountId, phaseId, tradeNumber: number++ },include:{strategy:{select:{id:true,name:true,isArchived:true}}} }));
    }
    return {
      trades: created.map(serializeTrade),
      summary: {
        totalDetected: checked.length,
        imported: created.length,
        skippedEmpty: Math.max(0, Number(sourceSummary.skippedEmpty) || 0),
        duplicates,
        failedRows: Math.max(0, Number(sourceSummary.failedRows) || 0)
      }
    };
  }, { isolationLevel: 'Serializable', timeout: 20000 });
  const history = await recalculateJournalHistory(accountId, requestedPhaseId ? Number(requestedPhaseId) : null);
  result.trades = await prisma.trade.findMany({
    where: { id: { in: result.trades.map((trade) => trade.id) } },
    include: { strategy: { select: { id: true, name: true, isArchived: true } } }
  }).then((trades) => trades.map(serializeTrade));
  result.summary.riskCalculationsDisabled = true;
  return result;
}
