import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { manualTradeAnalytics } from './tradeCalculationService.js';
import { assertTradingAllowed, reconcilePhase, reconcileRealAccount } from './lifecycleService.js';
import { normalizeSymbol } from './symbolNormalizationService.js';
import { ensureStrategy, normalizeStrategyKey, normalizeTimeframe } from './tradingLibraryService.js';

const allowedSortFields = new Set(['tradeNumber', 'tradeDate', 'strategyName', 'market', 'direction', 'result', 'profitLoss', 'createdAt']);
const decimalFields = ['entryPrice', 'stopLoss', 'takeProfit', 'lotSize', 'plannedRR', 'plannedRROverride', 'resultR', 'realizedRMultiple', 'exitPrice', 'riskAmount', 'riskPercentage', 'riskPercentageOverride', 'balanceBeforeTrade', 'balanceAfterTrade', 'contractSizeUsed', 'tickSizeUsed', 'tickValueUsed', 'pipSizeUsed', 'conversionRateUsed', 'profitLoss'];

export function normalizeTrade(data) {
  const normalizedMarket = normalizeSymbol(data.market);
  const normalized = {
    strategyName: data.strategyName?.trim() || null,
    market: normalizedMarket,
    tradeDate: new Date(`${String(data.tradeDate).slice(0, 10)}T00:00:00.000Z`),
    session: data.session?.trim() || null,
    openTimeUtc: data.openTimeUtc ? new Date(data.openTimeUtc) : null,
    closeTimeUtc: data.closeTimeUtc ? new Date(data.closeTimeUtc) : null,
    sessionTimezone: data.sessionTimezone?.trim() || null,
    sessionDetection: data.sessionDetection?.trim() || (data.session ? 'MANUAL' : null),
    timeframe: normalizeTimeframe(data.timeframe),
    direction: data.direction?.toUpperCase(),
    result: data.result?.toUpperCase().replace(/[\s-]+/g, '_'),
    resultSource: data.resultSource?.toUpperCase() || 'AUTO',
    emotion: data.emotion?.trim() || null,
    importSource: data.importSource?.trim() || 'MANUAL',
    sourceTradeId: data.sourceTradeId?.trim() || null,
    originalMarket: data.originalMarket?.trim() || (String(data.market ?? '').trim() !== normalizedMarket ? String(data.market).trim() : null),
    calculationStatus: data.calculationStatus || 'UNAVAILABLE',
    calculationWarnings: Array.isArray(data.calculationWarnings) ? data.calculationWarnings : [],
    instrumentSpecificationId: data.instrumentSpecificationId == null ? null : Number(data.instrumentSpecificationId),
    riskCalculationMode: data.riskCalculationMode || null,
    riskCalculationSource: data.riskCalculationSource?.trim() || null,
    riskCalculationStatus: data.riskCalculationStatus || 'UNAVAILABLE',
    riskCalculationError: data.riskCalculationError || null
  };
  for (const field of decimalFields) normalized[field] = data[field] === '' || data[field] == null ? null : String(data[field]);
  if (normalized.profitLoss == null) normalized.profitLoss = '0';
  return normalized;
}

export function serializeTrade(trade) {
  if (!trade) return trade;
  const output = { ...trade };
  if(output.strategy)output.strategyName=output.strategy.name;
  for (const field of decimalFields) if (output[field] != null) output[field] = Number(output[field]);
  output.plannedRR = null;
  output.realizedRMultiple = null;
  output.riskPercentage = null;
  if (output.riskCalculationStatus !== 'MANUAL') output.riskAmount = null;
  output.calculationWarnings = [];
  output.riskCalculationError = null;
  if (output.balanceAfterTrade == null) output.balanceAfterTrade = output.balanceBeforeTrade == null ? null : Number((output.balanceBeforeTrade + output.profitLoss).toFixed(2));
  return output;
}

export async function nextTradeNumber(accountId, db = prisma) {
  const last = await db.trade.aggregate({ where: { accountId }, _max: { tradeNumber: true } });
  return (last._max.tradeNumber || 0) + 1;
}

export function buildTradeWhere(accountId, query) {
  const where = { accountId };
  if (query.phaseId != null && query.phaseId !== '') where.phaseId = Number(query.phaseId);
  if(query.strategy)where.strategy={normalizedKey:normalizeStrategyKey(query.strategy)};
  const mapping = { market: 'market', session: 'session', timeframe: 'timeframe', direction: 'direction', result: 'result' };
  for (const [queryKey, field] of Object.entries(mapping)) {
    if (query[queryKey]) where[field] = ['direction', 'result'].includes(field)
      ? query[queryKey].toUpperCase().replace(/[\s-]+/g, '_')
      : { equals: query[queryKey], mode: 'insensitive' };
  }
  if (query.startDate || query.endDate) {
    where.tradeDate = {};
    if (query.startDate) where.tradeDate.gte = new Date(`${query.startDate}T00:00:00.000Z`);
    if (query.endDate) where.tradeDate.lte = new Date(`${query.endDate}T23:59:59.999Z`);
  }
  if (query.search?.trim()) {
    const search = query.search.trim();
    const clauses = [
      { strategy: { name: { contains: search, mode: 'insensitive' } } },
      { market: { contains: search, mode: 'insensitive' } },
      { emotion: { contains: search, mode: 'insensitive' } }
    ];
    if (/^\d+$/.test(search)) clauses.push({ tradeNumber: Number(search) });
    where.OR = clauses;
  }
  return where;
}

export async function listTrades(accountId, query) {
  const account = await prisma.account.findUnique({ where: { id: accountId }, select: { id: true } });
  if (!account) throw new ApiError(404, 'Account not found');
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const sortBy = allowedSortFields.has(query.sortBy) ? query.sortBy : 'tradeDate';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  const where = buildTradeWhere(accountId, query);
  const [items, total] = await prisma.$transaction([
    prisma.trade.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ [sortBy]: sortOrder }, { tradeNumber: 'desc' }],include:{strategy:{select:{id:true,name:true,isArchived:true}}} }),
    prisma.trade.count({ where })
  ]);
  return { items: items.map(serializeTrade), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function listTradeIds(accountId, query) {
  const where = buildTradeWhere(accountId, query);
  const items = await prisma.trade.findMany({ where, select: { id: true }, orderBy: { id: 'asc' } });
  return items.map(({ id }) => id);
}

export async function createTrade(accountId, data) {
  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({ where: { id: accountId }, select: { id: true, accountType: true, currency: true, initialCapital: true } });
    if (!account) throw new ApiError(404, 'Account not found');
    const phaseId = data.phaseId == null || data.phaseId === '' ? null : Number(data.phaseId);
    if (account.accountType === 'FUNDED' && !phaseId) throw new ApiError(422, 'phaseId is required for funded account trades');
    let phase=null;
    if (phaseId) {
      phase = await tx.accountPhase.findFirst({ where: { id: phaseId, accountId }, select: { id: true,initialBalance:true } });
      if (!phase) throw new ApiError(422, 'Trade phase must belong to the selected account');
    }
    await assertTradingAllowed(tx,{accountId,phaseId});
    const tradeNumber = await nextTradeNumber(accountId, tx);
    const normalized = normalizeTrade(data);
    const strategy=data.strategyId?await tx.strategy.findUnique({where:{id:Number(data.strategyId)}}):await ensureStrategy(tx,normalized.strategyName);
    if(data.strategyId&&!strategy)throw new ApiError(422,'Selected strategy does not exist');
    normalized.strategyId=strategy?.id||null;
    normalized.strategyName=null;
    const balanceBeforeTrade = data.balanceBeforeTrade || (phaseId
      ? (await tx.accountPhase.findUnique({ where: { id: phaseId }, select: { currentBalance: true } }))?.currentBalance
      : Number(account.initialCapital) + Number((await tx.trade.aggregate({ where: { accountId, phaseId: null }, _sum: { profitLoss: true } }))._sum.profitLoss || 0));
    Object.assign(normalized, { balanceBeforeTrade: String(balanceBeforeTrade), ...manualTradeAnalytics({ ...normalized, manualRiskProvided: data.riskAmount !== '' && data.riskAmount != null }) });
    for (const field of decimalFields) if (normalized[field] != null) normalized[field] = String(normalized[field]);
    const trade = await tx.trade.create({ data: { ...normalized, accountId, phaseId, tradeNumber },include:{strategy:{select:{id:true,name:true,isArchived:true}}} });
    phaseId ? await reconcilePhase(tx,phaseId) : await reconcileRealAccount(tx,accountId);
    return serializeTrade(trade);
  }, { isolationLevel: 'Serializable' });
}
