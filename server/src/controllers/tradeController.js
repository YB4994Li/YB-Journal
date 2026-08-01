import { prisma } from '../config/prisma.js';
import { success } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { createTrade, listTradeIds, listTrades, nextTradeNumber, normalizeTrade, serializeTrade } from '../services/tradeService.js';
import { removeScreenshot } from '../utils/files.js';
import { recalculateJournalHistory } from '../services/journalBalanceService.js';
import { manualTradeAnalytics } from '../services/tradeCalculationService.js';
import { ensureStrategy } from '../services/tradingLibraryService.js';
import { assertTradingAllowed } from '../services/lifecycleService.js';

async function findTrade(id) {
  const trade = await prisma.trade.findUnique({ where: { id },include:{strategy:{select:{id:true,name:true,isArchived:true}}} });
  if (!trade) throw new ApiError(404, 'Trade not found');
  return trade;
}
export async function list(req, res) {
  success(res, await listTrades(Number(req.params.accountId), req.query), 'Trades retrieved successfully');
}
export async function ids(req, res) {
  success(res, await listTradeIds(Number(req.params.accountId), req.query), 'Filtered trade IDs retrieved successfully');
}
export async function get(req, res) {
  success(res, serializeTrade(await findTrade(Number(req.params.id))), 'Trade retrieved successfully');
}
export async function create(req, res) {
  let trade = await createTrade(Number(req.params.accountId), req.body);
  await recalculateJournalHistory(trade.accountId, trade.phaseId);
  trade = serializeTrade(await findTrade(trade.id));
  success(res, trade, 'Trade created successfully', 201);
}
export async function update(req, res) {
  const existing = await findTrade(Number(req.params.id));
  const phaseId = req.body.phaseId == null || req.body.phaseId === '' ? existing.phaseId : Number(req.body.phaseId);
  if(phaseId!==existing.phaseId)await assertTradingAllowed(prisma,{accountId:existing.accountId,phaseId});
  if (phaseId) {
    const phase = await prisma.accountPhase.findFirst({ where: { id: phaseId, accountId: existing.accountId } });
    if (!phase) throw new ApiError(422, 'Trade phase must belong to the selected account');
  }
  const normalized = normalizeTrade({ ...existing, ...req.body });
  const strategy=req.body.strategyId?await prisma.strategy.findUnique({where:{id:Number(req.body.strategyId)}}):req.body.strategyId===null?null:await ensureStrategy(prisma,normalized.strategyName);
  if(req.body.strategyId&&!strategy)throw new ApiError(422,'Selected strategy does not exist');
  normalized.strategyId=strategy?.id||null;
  normalized.strategyName=null;
  Object.assign(normalized, manualTradeAnalytics({ ...normalized, manualRiskProvided: Object.hasOwn(req.body, 'riskAmount') && req.body.riskAmount !== '' && req.body.riskAmount != null }));
  const trade = await prisma.trade.update({ where: { id: existing.id }, data: { ...normalized, phaseId },include:{strategy:{select:{id:true,name:true,isArchived:true}}} });
  await recalculateJournalHistory(existing.accountId, phaseId);
  if (existing.phaseId !== phaseId) await recalculateJournalHistory(existing.accountId, existing.phaseId);
  success(res, serializeTrade(await findTrade(trade.id)), 'Trade updated successfully');
}
export async function remove(req, res) {
  const trade = await findTrade(Number(req.params.id));
  await prisma.trade.delete({ where: { id: trade.id } });
  await recalculateJournalHistory(trade.accountId, trade.phaseId);
  await removeScreenshot(trade.screenshotPath);
  success(res, null, 'Trade deleted successfully');
}
export async function bulkRemove(req, res) {
  const tradeIds = [...new Set(req.body.tradeIds.map(Number))];
  const result = await prisma.$transaction(async (tx) => {
    const trades = await tx.trade.findMany({ where: { id: { in: tradeIds } }, select: { id: true, accountId: true, phaseId: true, screenshotPath: true } });
    const deleted = await tx.trade.deleteMany({ where: { id: { in: trades.map(({ id }) => id) } } });
    return { count: deleted.count, journals: [...new Map(trades.map((trade) => [`${trade.accountId}:${trade.phaseId ?? 'real'}`, { accountId: trade.accountId, phaseId: trade.phaseId }])).values()], screenshots: trades.map(({ screenshotPath }) => screenshotPath).filter(Boolean) };
  });
  await Promise.all(result.screenshots.map(removeScreenshot));
  for (const journal of result.journals) await recalculateJournalHistory(journal.accountId, journal.phaseId);
  success(res, { deletedCount: result.count }, `${result.count} trades deleted successfully`);
}
export async function duplicate(req, res) {
  const source = await findTrade(Number(req.params.id));
  await assertTradingAllowed(prisma,{accountId:source.accountId,phaseId:source.phaseId});
  const copy = await prisma.$transaction(async (tx) => {
    const tradeNumber = await nextTradeNumber(source.accountId, tx);
    const { id, createdAt, updatedAt, screenshotPath, ...data } = source;
    return tx.trade.create({ data: { ...data, tradeNumber, screenshotPath: null } });
  }, { isolationLevel: 'Serializable' });
  await recalculateJournalHistory(copy.accountId, copy.phaseId);
  success(res, serializeTrade(await findTrade(copy.id)), 'Trade duplicated successfully', 201);
}
export async function uploadScreenshot(req, res) {
  if (!req.file) throw new ApiError(400, 'Screenshot file is required');
  const trade = await findTrade(Number(req.params.id));
  try {
    const updated = await prisma.trade.update({ where: { id: trade.id }, data: { screenshotPath: req.file.filename } });
    await removeScreenshot(trade.screenshotPath);
    success(res, serializeTrade(updated), 'Screenshot uploaded successfully');
  } catch (error) {
    await removeScreenshot(req.file.filename);
    throw error;
  }
}
export async function deleteScreenshot(req, res) {
  const trade = await findTrade(Number(req.params.id));
  await prisma.trade.update({ where: { id: trade.id }, data: { screenshotPath: null } });
  await removeScreenshot(trade.screenshotPath);
  success(res, null, 'Screenshot deleted successfully');
}
