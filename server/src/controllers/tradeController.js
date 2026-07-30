import { prisma } from '../config/prisma.js';
import { success } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { createTrade, listTradeIds, listTrades, nextTradeNumber, normalizeTrade, serializeTrade } from '../services/tradeService.js';
import { removeScreenshot } from '../utils/files.js';
import { syncPhaseBalance } from '../services/statisticsService.js';
import { calculateTradeAnalytics } from '../services/tradeCalculationService.js';
import { ensureStrategy } from '../services/tradingLibraryService.js';

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
  const trade = await createTrade(Number(req.params.accountId), req.body);
  await syncPhaseBalance(trade.phaseId);
  success(res, trade, 'Trade created successfully', 201);
}
export async function update(req, res) {
  const existing = await findTrade(Number(req.params.id));
  const phaseId = req.body.phaseId == null || req.body.phaseId === '' ? existing.phaseId : Number(req.body.phaseId);
  if (phaseId) {
    const phase = await prisma.accountPhase.findFirst({ where: { id: phaseId, accountId: existing.accountId } });
    if (!phase) throw new ApiError(422, 'Trade phase must belong to the selected account');
  }
  const normalized = normalizeTrade({ ...existing, ...req.body });
  const strategy=req.body.strategyId?await prisma.strategy.findUnique({where:{id:Number(req.body.strategyId)}}):req.body.strategyId===null?null:await ensureStrategy(prisma,normalized.strategyName);
  if(req.body.strategyId&&!strategy)throw new ApiError(422,'Selected strategy does not exist');
  normalized.strategyId=strategy?.id||null;
  normalized.strategyName=null;
  Object.assign(normalized, calculateTradeAnalytics(normalized, { balanceBeforeTrade: normalized.balanceBeforeTrade }));
  const trade = await prisma.trade.update({ where: { id: existing.id }, data: { ...normalized, phaseId },include:{strategy:{select:{id:true,name:true,isArchived:true}}} });
  await Promise.all([syncPhaseBalance(existing.phaseId), syncPhaseBalance(phaseId)]);
  success(res, serializeTrade(trade), 'Trade updated successfully');
}
export async function remove(req, res) {
  const trade = await findTrade(Number(req.params.id));
  await prisma.trade.delete({ where: { id: trade.id } });
  await syncPhaseBalance(trade.phaseId);
  await removeScreenshot(trade.screenshotPath);
  success(res, null, 'Trade deleted successfully');
}
export async function bulkRemove(req, res) {
  const tradeIds = [...new Set(req.body.tradeIds.map(Number))];
  const result = await prisma.$transaction(async (tx) => {
    const trades = await tx.trade.findMany({ where: { id: { in: tradeIds } }, select: { id: true, phaseId: true, screenshotPath: true } });
    const deleted = await tx.trade.deleteMany({ where: { id: { in: trades.map(({ id }) => id) } } });
    return { count: deleted.count, phaseIds: [...new Set(trades.map(({ phaseId }) => phaseId).filter(Boolean))], screenshots: trades.map(({ screenshotPath }) => screenshotPath).filter(Boolean) };
  });
  await Promise.all(result.screenshots.map(removeScreenshot));
  await Promise.all(result.phaseIds.map((phaseId) => syncPhaseBalance(phaseId)));
  success(res, { deletedCount: result.count }, `${result.count} trades deleted successfully`);
}
export async function duplicate(req, res) {
  const source = await findTrade(Number(req.params.id));
  const copy = await prisma.$transaction(async (tx) => {
    const tradeNumber = await nextTradeNumber(source.accountId, tx);
    const { id, createdAt, updatedAt, screenshotPath, ...data } = source;
    return tx.trade.create({ data: { ...data, tradeNumber, screenshotPath: null } });
  }, { isolationLevel: 'Serializable' });
  await syncPhaseBalance(copy.phaseId);
  success(res, serializeTrade(copy), 'Trade duplicated successfully', 201);
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
