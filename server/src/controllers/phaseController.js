import { prisma } from '../config/prisma.js';
import { success } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { recalculateJournalHistory } from '../services/journalBalanceService.js';
import { realizedLifecycle, reconcileFundedAccountLifecycle } from '../services/lifecycleService.js';

const decimals = ['initialBalance', 'currentBalance', 'profitTargetPercentage', 'maximumLossPercentage', 'dailyLossLimitPercentage'];
const serialize = (phase) => {
  const output = { ...phase };
  decimals.forEach((key) => { if (output[key] != null) output[key] = Number(output[key]); });
  if(output.initialBalance!=null&&output.currentBalance!=null)Object.assign(output,realizedLifecycle(output.initialBalance,output.currentBalance,output.profitTargetPercentage,output.maximumLossPercentage));
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

export async function list(req, res) {
  await prisma.$transaction((tx)=>reconcileFundedAccountLifecycle(tx,Number(req.params.accountId)));
  const phases = await prisma.accountPhase.findMany({ where: { accountId: Number(req.params.accountId) }, orderBy: { orderIndex: 'asc' }, include: { _count: { select: { trades: true } } } });
  success(res, phases.map(serialize), 'Phases retrieved successfully');
}
export async function get(req, res) { const phase=await find(Number(req.params.phaseId));await prisma.$transaction((tx)=>reconcileFundedAccountLifecycle(tx,phase.accountId));success(res,serialize(await find(phase.id)),'Phase retrieved successfully'); }
export async function create(req, res) {
  const accountId = Number(req.params.accountId);
  const account = await prisma.account.findUnique({ where: { id: accountId }, select: { accountType: true } });
  if (!account) throw new ApiError(404, 'Account not found');
  if (account.accountType !== 'FUNDED') throw new ApiError(422, 'Phases can only be added to funded accounts');
  const phase = await prisma.$transaction(async (tx) => {
    const aggregate = await tx.accountPhase.aggregate({ where: { accountId }, _max: { orderIndex: true } });
    return tx.accountPhase.create({ data: { ...dataFrom(req.body), accountId, orderIndex: (aggregate._max.orderIndex ?? -1) + 1, currentBalance: String(req.body.initialBalance), status: 'LOCKED' } });
  });
  success(res, serialize(phase), 'Phase created successfully', 201);
}
export async function update(req, res) {
  const phase = await find(Number(req.params.phaseId));
  const lifecycleFields=['initialBalance','profitTargetPercentage','maximumLossPercentage'];
  if(['PASSED','FAILED'].includes(phase.status)&&lifecycleFields.some((key)=>key in req.body)&&req.body.confirmLifecycleReevaluation!==true)throw new ApiError(409,`${phase.name} is ${phase.status.toLowerCase()}. Confirm lifecycle re-evaluation because this may change this phase and all later phases.`);
  const updated = await prisma.$transaction(async (tx) => {
    const data = dataFrom(req.body);
    delete data.status;
    if (data.initialBalance != null) {
      const pnl = await tx.trade.aggregate({ where: { phaseId: phase.id }, _sum: { profitLoss: true } });
      data.currentBalance = String(Number(data.initialBalance) + Number(pnl._sum.profitLoss || 0));
    }
    await tx.accountPhase.update({ where: { id: phase.id }, data });
    await reconcileFundedAccountLifecycle(tx,phase.accountId);
    return tx.accountPhase.findUnique({where:{id:phase.id}});
  });
  if(req.body.initialBalance!=null)await recalculateJournalHistory(phase.accountId,phase.id);
  success(res,serialize(await find(phase.id)),'Phase updated successfully');
}
export async function remove(req, res) {
  const phase = await find(Number(req.params.phaseId));
  await prisma.$transaction(async(tx)=>{await tx.accountPhase.delete({where:{id:phase.id}});await reconcileFundedAccountLifecycle(tx,phase.accountId);});
  success(res, { deletedTrades: phase._count.trades }, `Phase and ${phase._count.trades} related trades deleted successfully`);
}
export async function archive(req,res){const phase=await find(Number(req.params.phaseId));const updated=await prisma.$transaction(async(tx)=>{await tx.accountPhase.update({where:{id:phase.id},data:{status:'ARCHIVED'}});await reconcileFundedAccountLifecycle(tx,phase.accountId);return tx.accountPhase.findUnique({where:{id:phase.id}});});success(res,serialize(updated),'Phase archived');}
