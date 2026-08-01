import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { classifyTradeResult, reconstructRealizedBalances } from './tradeCalculationService.js';

export async function recalculateJournalHistory(accountId, phaseId = null, db = prisma, options = {}) {
  const account = await db.account.findUnique({
    where: { id: Number(accountId) },
    select: { id: true, accountType: true, initialCapital: true, breakEvenThresholdPercent: true }
  });
  if (!account) throw new ApiError(404, 'Account not found');

  let phase = null;
  if (phaseId != null) {
    phase = await db.accountPhase.findFirst({
      where: { id: Number(phaseId), accountId: account.id },
      select: { id: true, initialBalance: true, breakEvenThresholdPercent: true }
    });
    if (!phase) throw new ApiError(422, 'Phase must belong to the selected account');
  } else if (account.accountType === 'FUNDED') {
    throw new ApiError(422, 'phaseId is required for funded account history');
  }

  const trades = await db.trade.findMany({ where: { accountId: account.id, phaseId: phase?.id ?? null } });
  const initialCapital = Number(phase?.initialBalance ?? account.initialCapital);
  const thresholdPercent = Number(phase?.breakEvenThresholdPercent ?? account.breakEvenThresholdPercent);
  const history = reconstructRealizedBalances(trades, initialCapital);

  for (const item of history) {
    const manualResult = item.trade.resultSource === 'MANUAL';
    const manualRisk = item.trade.riskCalculationStatus === 'MANUAL' ? item.trade.riskAmount : null;
    const result = manualResult
      ? item.trade.result
      : classifyTradeResult(item.netProfitLoss, initialCapital, thresholdPercent);
    item.analytics = { result, riskCalculationStatus: manualRisk == null ? 'UNAVAILABLE' : 'MANUAL' };
    if (!options.dryRun) await db.trade.update({
      where: { id: item.trade.id },
      data: {
        balanceBeforeTrade: String(item.balanceBeforeTrade),
        balanceAfterTrade: String(item.balanceAfterTrade),
        plannedRR: null,
        realizedRMultiple: null,
        riskAmount: manualRisk,
        riskPercentage: null,
        result,
        calculationStatus: manualRisk == null && item.trade.plannedRROverride == null && item.trade.riskPercentageOverride == null ? 'UNAVAILABLE' : 'MANUAL',
        calculationWarnings: [],
        instrumentSpecificationId: null,
        riskCalculationMode: null,
        contractSizeUsed: null,
        tickSizeUsed: null,
        tickValueUsed: null,
        pipSizeUsed: null,
        conversionRateUsed: null,
        riskCalculationSource: manualRisk == null ? null : 'Manual risk amount',
        riskCalculationStatus: manualRisk == null ? 'UNAVAILABLE' : 'MANUAL',
        riskCalculationError: null
      }
    });
  }

  if (phase && !options.dryRun) {
    await db.accountPhase.update({
      where: { id: phase.id },
      data: { currentBalance: String(history.at(-1)?.balanceAfterTrade ?? initialCapital) }
    });
  }
  return history;
}
