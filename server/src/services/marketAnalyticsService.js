import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { canonicalStrategyName, normalizeStrategyKey, normalizeTimeframe } from './tradingLibraryService.js';
import { normalizeSymbol } from './symbolNormalizationService.js';
export const normalizeMarketSymbol = normalizeSymbol;

function dateRange(query) {
  const from = query.dateFrom || query.startDate;
  const to = query.dateTo || query.endDate;
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
    ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {})
  };
}

async function scopedTrades(accountId, query, analytics = false, db = prisma) {
  const account = await db.account.findUnique({ where: { id: accountId }, select: { id: true, accountType: true } });
  if (!account) throw new ApiError(404, 'Account not found');
  const phaseId = query.phaseId == null || query.phaseId === '' ? null : Number(query.phaseId);
  if (account.accountType === 'FUNDED' && !phaseId) throw new ApiError(422, 'phaseId is required for funded account market analytics');
  if (phaseId && !await db.accountPhase.findFirst({ where: { id: phaseId, accountId }, select: { id: true } })) {
    throw new ApiError(404, 'Phase not found for this account');
  }
  const where = {
    accountId,
    ...(phaseId ? { phaseId } : { phaseId: null }),
    ...(dateRange(query) ? { tradeDate: dateRange(query) } : {})
  };
  if (analytics) {
    if (query.strategy) where.strategy = { normalizedKey: normalizeStrategyKey(query.strategy) };
    if (query.session) where.session = { equals: query.session, mode: 'insensitive' };
    if (query.result) where.result = String(query.result).toUpperCase().replace(/[\s-]+/g, '_');
  }
  return db.trade.findMany({ where, select: { market: true, profitLoss: true, result: true } });
}

function grouped(trades) {
  const groups = new Map();
  for (const trade of trades) {
    const market = normalizeMarketSymbol(trade.market);
    if (!market) continue;
    const current = groups.get(market) || { market, tradeCount: 0, totalProfitLoss: 0, wins: 0 };
    current.tradeCount += 1;
    current.totalProfitLoss += Number(trade.profitLoss || 0);
    if (trade.result === 'WIN') current.wins += 1;
    groups.set(market, current);
  }
  return [...groups.values()];
}

export function aggregateMarketAnalytics(trades) {
  const markets = grouped(trades);
  const totalTrades = markets.reduce((sum, item) => sum + item.tradeCount, 0);
  return {
    totalTrades,
    markets: markets
      .map(({ wins, ...item }) => ({
        ...item,
        percentage: totalTrades ? Number((item.tradeCount / totalTrades * 100).toFixed(2)) : 0,
        totalProfitLoss: Number(item.totalProfitLoss.toFixed(2)),
        winRate: Number((wins / item.tradeCount * 100).toFixed(2))
      }))
      .sort((a, b) => b.tradeCount - a.tradeCount || a.market.localeCompare(b.market))
  };
}

export async function getMarketOptions(accountId, query, db = prisma) {
  const markets = grouped(await scopedTrades(accountId, query, false, db))
    .map(({ market, tradeCount }) => ({ market, tradeCount }))
    .sort((a, b) => a.market.localeCompare(b.market));
  return { markets };
}

export async function getMarketsAnalytics(accountId, query, db = prisma) {
  // Intentionally ignores query.market so other categories remain comparable.
  return aggregateMarketAnalytics(await scopedTrades(accountId, query, true, db));
}

export async function getJournalFilterOptions(accountId,query,db=prisma){
  const trades=await scopedTrades(accountId,query,false,db);
  const full=await db.trade.findMany({
    where:{accountId,...(query.phaseId?{phaseId:Number(query.phaseId)}:{phaseId:null}),...(dateRange(query)?{tradeDate:dateRange(query)}:{})},
    select:{market:true,strategyName:true,timeframe:true,strategy:{select:{name:true,normalizedKey:true}}}
  });
  const collect=(selector,normalizer,display)=>{const map=new Map();for(const trade of full){const raw=selector(trade),key=normalizer(raw);if(!key)continue;const current=map.get(key)||{value:display(raw),normalizedKey:key,tradeCount:0};current.tradeCount++;map.set(key,current);}return[...map.values()].sort((a,b)=>a.value.localeCompare(b.value));};
  return{
    strategies:collect((t)=>t.strategy?.name||t.strategyName,normalizeStrategyKey,canonicalStrategyName),
    timeframes:collect((t)=>t.timeframe,(v)=>normalizeTimeframe(v)?.toLowerCase(),normalizeTimeframe).map(({normalizedKey,...item})=>item),
    markets:grouped(trades).map(({market,tradeCount})=>({value:market,tradeCount})).sort((a,b)=>a.value.localeCompare(b.value))
  };
}
