import { prisma } from '../config/prisma.js';
import { success } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';

const decimals = ['initialBalance', 'currentBalance', 'profitTargetPercentage', 'maximumLossPercentage', 'dailyLossLimitPercentage'];
const serialize = (phase) => {
  const output = { ...phase };
  decimals.forEach((key) => { if (output[key] != null) output[key] = Number(output[key]); });
  return output;
};
const find = async (id) => {
  const phase = await prisma.accountPhase.findUnique({ where: { id }, include: { _count: { select: { trades: true } }, account: { select: { accountType: true } } } });
  if (!phase) throw new ApiError(404, 'Phase not found');
  return phase;
};
const dataFrom = (body) => {
  const data = {};
  for (const key of ['name', 'phaseType', 'status', 'minimumTradingDays', 'notes']) if (key in body) data[key] = body[key] === '' ? null : body[key];
  for (const key of ['initialBalance', 'profitTargetPercentage', 'maximumLossPercentage', 'dailyLossLimitPercentage']) if (key in body) data[key] = body[key] === '' || body[key] == null ? null : String(body[key]);
  for (const key of ['startDate', 'endDate']) if (key in body) data[key] = body[key] ? new Date(`${String(body[key]).slice(0, 10)}T00:00:00.000Z`) : null;
  return data;
};
async function ensureSingleActive(tx, accountId, exceptId = null) {
  await tx.accountPhase.updateMany({ where: { accountId, status: 'ACTIVE', ...(exceptId ? { id: { not: exceptId } } : {}) }, data: { status: 'PENDING' } });
}

export async function list(req, res) {
  const phases = await prisma.accountPhase.findMany({ where: { accountId: Number(req.params.accountId) }, orderBy: { orderIndex: 'asc' }, include: { _count: { select: { trades: true } } } });
  success(res, phases.map(serialize), 'Phases retrieved successfully');
}
export async function get(req, res) { success(res, serialize(await find(Number(req.params.phaseId))), 'Phase retrieved successfully'); }
export async function create(req, res) {
  const accountId = Number(req.params.accountId);
  const account = await prisma.account.findUnique({ where: { id: accountId }, select: { accountType: true } });
  if (!account) throw new ApiError(404, 'Account not found');
  if (account.accountType !== 'FUNDED') throw new ApiError(422, 'Phases can only be added to funded accounts');
  const phase = await prisma.$transaction(async (tx) => {
    const aggregate = await tx.accountPhase.aggregate({ where: { accountId }, _max: { orderIndex: true } });
    if (req.body.status === 'ACTIVE') await ensureSingleActive(tx, accountId);
    return tx.accountPhase.create({ data: { ...dataFrom(req.body), accountId, orderIndex: (aggregate._max.orderIndex ?? -1) + 1, currentBalance: String(req.body.initialBalance), status: req.body.status || 'PENDING' } });
  });
  success(res, serialize(phase), 'Phase created successfully', 201);
}
export async function update(req, res) {
  const phase = await find(Number(req.params.phaseId));
  const updated = await prisma.$transaction(async (tx) => {
    if (req.body.status === 'ACTIVE') await ensureSingleActive(tx, phase.accountId, phase.id);
    const data = dataFrom(req.body);
    if (data.initialBalance != null) {
      const pnl = await tx.trade.aggregate({ where: { phaseId: phase.id }, _sum: { profitLoss: true } });
      data.currentBalance = String(Number(data.initialBalance) + Number(pnl._sum.profitLoss || 0));
    }
    return tx.accountPhase.update({ where: { id: phase.id }, data });
  });
  success(res, serialize(updated), 'Phase updated successfully');
}
export async function remove(req, res) {
  const phase = await find(Number(req.params.phaseId));
  await prisma.accountPhase.delete({ where: { id: phase.id } });
  success(res, { deletedTrades: phase._count.trades }, `Phase and ${phase._count.trades} related trades deleted successfully`);
}
async function transition(req, res, status) {
  const phase = await find(Number(req.params.phaseId));
  const now = new Date();
  const data = { status, passedAt: status === 'PASSED' ? now : null, failedAt: status === 'FAILED' ? now : null, endDate: status === 'PASSED' || status === 'FAILED' ? now : phase.endDate };
  const updated = await prisma.accountPhase.update({ where: { id: phase.id }, data });
  success(res, serialize(updated), `Phase marked ${status.toLowerCase()}`);
}
export const pass = (req, res) => transition(req, res, 'PASSED');
export const fail = (req, res) => transition(req, res, 'FAILED');
export async function activate(req, res) {
  const phase = await find(Number(req.params.phaseId));
  const updated = await prisma.$transaction(async (tx) => {
    await ensureSingleActive(tx, phase.accountId, phase.id);
    return tx.accountPhase.update({ where: { id: phase.id }, data: { status: 'ACTIVE', startDate: phase.startDate || new Date(), passedAt: null, failedAt: null } });
  });
  success(res, serialize(updated), 'Phase activated successfully');
}
