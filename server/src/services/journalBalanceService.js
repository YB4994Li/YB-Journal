import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateTradeAnalytics, reconstructRealizedBalances } from './tradeCalculationService.js';

export async function recalculateJournalHistory(accountId, phaseId = null, db = prisma, options = {}) {
  const account = await db.account.findUnique({
    where: { id: Number(accountId) },
    select: {
      id: true,
      accountType: true,
      currency: true,
      initialCapital: true,
      breakEvenThresholdPercent: true
    }
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

  const trades = await db.trade.findMany({
    where: { accountId: account.id, phaseId: phase?.id ?? null }
  });
  const specifications = await db.instrumentSpecification.findMany({ where: { isActive: true } });
  const specificationBySymbol = new Map(specifications.map((specification) => [specification.normalizedSymbol, specification]));
  const initialCapital = Number(phase?.initialBalance ?? account.initialCapital);
  const thresholdPercent = Number(phase?.breakEvenThresholdPercent ?? account.breakEvenThresholdPercent);
  const history = reconstructRealizedBalances(trades, initialCapital);

  for (const item of history) {
    const currentSpecification = specificationBySymbol.get(item.trade.market);
    const snapshotSpecification = !options.refreshSpecifications && item.trade.riskCalculationStatus === 'CALCULATED'
      ? {
          id: item.trade.instrumentSpecificationId,
          normalizedSymbol: item.trade.market,
          assetClass: currentSpecification?.assetClass,
          contractSize: item.trade.contractSizeUsed,
          tickSize: item.trade.tickSizeUsed,
          tickValuePerLot: item.trade.tickValueUsed,
          pipSize: item.trade.pipSizeUsed,
          profitCurrency: currentSpecification?.profitCurrency,
          calculationMode: item.trade.riskCalculationMode,
          isActive: true,
          isVerified: true,
          source: item.trade.riskCalculationSource
        }
      : null;
    const analytics = calculateTradeAnalytics(
      { ...item.trade, profitLoss: item.netProfitLoss, balanceBeforeTrade: item.balanceBeforeTrade },
      {
        accountCurrency: account.currency,
        initialCapital,
        breakEvenThresholdPercent: thresholdPercent,
        balanceBeforeTrade: item.balanceBeforeTrade,
        instrumentSpecification: snapshotSpecification || currentSpecification,
        conversionRate: snapshotSpecification ? item.trade.conversionRateUsed : options.conversionRate,
        conversionRates: options.conversionRates,
        preserveManualRisk: true
      }
    );
    item.analytics = analytics;
    if (!options.dryRun) await db.trade.update({
      where: { id: item.trade.id },
      data: {
        balanceBeforeTrade: String(item.balanceBeforeTrade),
        balanceAfterTrade: String(item.balanceAfterTrade),
        plannedRR: analytics.plannedRR,
        realizedRMultiple: analytics.realizedRMultiple,
        riskAmount: analytics.riskAmount,
        riskPercentage: analytics.riskPercentage,
        result: analytics.result,
        resultSource: analytics.resultSource,
        calculationStatus: analytics.calculationStatus,
        calculationWarnings: analytics.calculationWarnings
      }
    });
  }

  if (phase && !options.dryRun) {
    const finalBalance = history.at(-1)?.balanceAfterTrade ?? initialCapital;
    await db.accountPhase.update({
      where: { id: phase.id },
      data: { currentBalance: String(finalBalance) }
    });
  }
  return history;
}
