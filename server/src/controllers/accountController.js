import { prisma } from '../config/prisma.js';
import { success } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { getStatistics, getBalanceHistory } from '../services/statisticsService.js';
import { getJournalFilterOptions, getMarketOptions, getMarketsAnalytics } from '../services/marketAnalyticsService.js';
import { recalculateJournalHistory } from '../services/journalBalanceService.js';
import { realizedLifecycle, reconcileFundedAccountLifecycle, reconcileRealAccount } from '../services/lifecycleService.js';
import { deleteAccountWithJournal } from '../services/accountDeletionService.js';
import { removeScreenshot } from '../utils/files.js';
import { getPerformance } from '../services/performanceService.js';

const decimalKeys = ['initialCapital', 'accountSize', 'initialBalance', 'currentBalance', 'profitTargetPercentage', 'maximumLossPercentage', 'dailyLossLimitPercentage'];
const serialize = (value) => {
  if (!value) return value;
  if (Array.isArray(value)) return value.map(serialize);
  const result = { ...value };
  for (const key of decimalKeys) if (result[key] != null) result[key] = Number(result[key]);
  if (result.initialBalance != null && result.currentBalance != null) Object.assign(result,realizedLifecycle(result.initialBalance,result.currentBalance,result.profitTargetPercentage,result.maximumLossPercentage));
  if (result.phases) result.phases = result.phases.map(serialize).map((phase,index,all)=>({...phase,canActivate:phase.status==='LOCKED'&&(index===0||all[index-1].status==='PASSED')}));
  return result;
};
const text = (value) => String(value ?? '').trim() || null;
const phaseData = (phase, orderIndex) => ({
  name: phase.name.trim(), phaseType: phase.phaseType, status: orderIndex === 0 ? 'ACTIVE' : 'LOCKED',
  orderIndex, initialBalance: String(phase.initialBalance), currentBalance: String(phase.initialBalance),
  profitTargetPercentage: phase.profitTargetPercentage === '' || phase.profitTargetPercentage == null ? null : String(phase.profitTargetPercentage),
  maximumLossPercentage: phase.maximumLossPercentage === '' || phase.maximumLossPercentage == null ? null : String(phase.maximumLossPercentage),
  dailyLossLimitPercentage: phase.dailyLossLimitPercentage === '' || phase.dailyLossLimitPercentage == null ? null : String(phase.dailyLossLimitPercentage),
  minimumTradingDays: phase.minimumTradingDays === '' || phase.minimumTradingDays == null ? null : Number(phase.minimumTradingDays),
  startDate: phase.status === 'ACTIVE' ? new Date() : null, notes: text(phase.notes)
});

export async function listAccounts(req, res) {
  const where=req.query.includeArchived==='true'?{}:{status:{not:'ARCHIVED'}};
  const funded=await prisma.account.findMany({where:{...where,accountType:'FUNDED'},select:{id:true}});
  for(const {id} of funded)await prisma.$transaction((tx)=>reconcileFundedAccountLifecycle(tx,id));
  const accounts = await prisma.account.findMany({ where,orderBy: [{ displayOrder:'asc' },{ createdAt: 'asc' }], include: {
    phases: { orderBy: { orderIndex: 'asc' }, include: { _count: { select: { trades: true } } } },
    _count: { select: { trades: true } }
  } });
  success(res, accounts.map(serialize), 'Accounts retrieved successfully');
}
export async function getAccount(req, res) {
  const id=Number(req.params.accountId??req.params.id);
  const type=await prisma.account.findUnique({where:{id},select:{accountType:true}});
  if(type?.accountType==='FUNDED')await prisma.$transaction((tx)=>reconcileFundedAccountLifecycle(tx,id));
  const account = await prisma.account.findUnique({ where: { id }, include: {
    phases: { orderBy: { orderIndex: 'asc' }, include: { _count: { select: { trades: true } } } },
    _count: { select: { trades: true } }
  } });
  if (!account) throw new ApiError(404, 'Account not found');
  success(res, serialize(account), 'Account retrieved successfully');
}
export async function createAccount(req, res) {
  const funded = req.body.accountType === 'FUNDED';
  const phases = funded ? req.body.phases : [];
  if (funded && phases.filter((phase) => phase.status === 'ACTIVE').length !== 1) throw new ApiError(422, 'A funded account must start with exactly one active phase');
  if (!funded && phases.length) throw new ApiError(422, 'REAL accounts cannot use funded phase limits');
  const account = await prisma.$transaction(async (tx) => tx.account.create({
    data: {
      name: req.body.name, accountType: req.body.accountType, currency: req.body.currency,
      initialCapital: String(funded ? req.body.accountSize : req.body.initialCapital),
      accountSize: funded ? String(req.body.accountSize) : null,
      broker: text(req.body.broker), propFirm: funded ? text(req.body.propFirm) : null,
      platform: text(req.body.platform), notes: text(req.body.notes), externalReference:text(req.body.externalReference), maximumLossPercentage:funded?null:(req.body.maximumLossPercentage==null||req.body.maximumLossPercentage===''?null:String(req.body.maximumLossPercentage)),
      phases: funded ? { create: phases.map(phaseData) } : undefined
    },
    include: { phases: { orderBy: { orderIndex: 'asc' } }, _count: { select: { trades: true } } }
  }));
  success(res, serialize(account), 'Account created successfully', 201);
}
export async function updateAccount(req, res) {
  const existing = await prisma.account.findUnique({ where: { id: Number(req.params.accountId ?? req.params.id) } });
  if (!existing) throw new ApiError(404, 'Account not found');
  const data = {};
  for (const key of ['name', 'currency']) if (req.body[key] != null) data[key] = req.body[key];
  for (const key of ['broker', 'propFirm', 'platform', 'notes','externalReference']) if (key in req.body) data[key] = text(req.body[key]);
  for (const key of ['status','displayOrder']) if (key in req.body) data[key]=key==='displayOrder'?Number(req.body[key]):req.body[key];
  if (req.body.initialCapital != null && existing.accountType === 'REAL') data.initialCapital = String(req.body.initialCapital);
  if (req.body.accountSize != null && existing.accountType === 'FUNDED') data.accountSize = String(req.body.accountSize);
  if(existing.accountType==='REAL'&&'maximumLossPercentage' in req.body)data.maximumLossPercentage=req.body.maximumLossPercentage===''||req.body.maximumLossPercentage==null?null:String(req.body.maximumLossPercentage);
  const account = await prisma.account.update({ where: { id: existing.id }, data, include: { phases: { orderBy: { orderIndex: 'asc' } }, _count: { select: { trades: true } } } });
  if (existing.accountType === 'REAL' && (req.body.initialCapital != null || 'maximumLossPercentage' in req.body)) {
    await recalculateJournalHistory(existing.id, null);
  }
  success(res, serialize(account), 'Account updated successfully');
}
export async function archiveAccount(req,res){const account=await prisma.account.update({where:{id:Number(req.params.id)},data:{status:'ARCHIVED'}});success(res,serialize(account),'Account archived');}
export async function restoreAccount(req,res){const account=await prisma.account.update({where:{id:Number(req.params.id)},data:{status:'ACTIVE'}});success(res,serialize(account),'Account restored');}
export async function reactivateAccount(req,res){
  const id=Number(req.params.id); const state=await reconcileRealAccount(prisma,id);
  if(state.accountType!=='REAL'||state.status!=='FAILED')throw new ApiError(409,'Only failed real accounts can be reactivated');
  if(state.failureBalance==null||state.currentRealizedBalance<=state.failureBalance)throw new ApiError(409,`Account cannot be reactivated. Current balance must be above ${state.failureBalance}.`);
  success(res,serialize(await prisma.account.update({where:{id},data:{status:'ACTIVE'}})),'Account reactivated');
}
export async function deleteAccount(req, res) {
  const result = await deleteAccountWithJournal(prisma, Number(req.params.accountId ?? req.params.id));
  await Promise.all(result.screenshots.map(removeScreenshot));
  success(res, null, 'Account, phases, and related trades deleted successfully');
}
export async function statistics(req, res) {
  success(res, await getStatistics(Number(req.params.id), req.query.phaseId ? Number(req.query.phaseId) : null, req.query), 'Statistics retrieved successfully');
}
export async function balanceHistory(req, res) {
  success(res, await getBalanceHistory(Number(req.params.id), req.query.phaseId ? Number(req.query.phaseId) : null, req.query), 'Balance history retrieved successfully');
}
export async function markets(req, res) {
  success(res, await getMarketOptions(Number(req.params.id), req.query), 'Markets retrieved successfully');
}
export async function marketsAnalytics(req, res) {
  success(res, await getMarketsAnalytics(Number(req.params.id), req.query), 'Market analytics retrieved successfully');
}
export async function filterOptions(req,res){
  success(res,await getJournalFilterOptions(Number(req.params.id),req.query),'Journal filter options retrieved');
}
export async function performance(req,res){
  success(res,await getPerformance(Number(req.params.id),req.query),'Performance retrieved successfully');
}
