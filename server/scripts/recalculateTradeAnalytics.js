import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { calculateTradeAnalytics, reconstructRealizedBalances } from '../src/services/tradeCalculationService.js';

const prisma = new PrismaClient();

async function recalculateJournal(account, phase = null) {
  const phaseId = phase?.id ?? null;
  const trades = await prisma.trade.findMany({
    where: { accountId: account.id, phaseId },
    orderBy: [{ tradeDate: 'asc' }, { tradeNumber: 'asc' }]
  });
  const initialCapital = Number(phase?.initialBalance ?? account.initialCapital);
  const thresholdPercent = Number(phase?.breakEvenThresholdPercent ?? account.breakEvenThresholdPercent);
  const ordered = reconstructRealizedBalances(trades, initialCapital);

  await prisma.$transaction(ordered.map(({ trade, balanceBeforeTrade }) => {
    const calculated = calculateTradeAnalytics(
      { ...trade, balanceBeforeTrade },
      {
        accountCurrency: account.currency,
        initialCapital,
        breakEvenThresholdPercent: thresholdPercent,
        balanceBeforeTrade
      }
    );
    return prisma.trade.update({
      where: { id: trade.id },
      data: {
        balanceBeforeTrade,
        plannedRR: calculated.plannedRR,
        realizedRMultiple: calculated.realizedRMultiple,
        riskAmount: calculated.riskAmount,
        riskPercentage: calculated.riskPercentage,
        result: calculated.result,
        resultSource: calculated.resultSource,
        calculationStatus: calculated.calculationStatus,
        calculationWarnings: calculated.calculationWarnings
      }
    });
  }));

  return trades.length;
}

async function main() {
  const accounts = await prisma.account.findMany({ include: { phases: true } });
  let updated = 0;
  for (const account of accounts) {
    if (account.accountType === 'FUNDED') {
      for (const phase of account.phases) updated += await recalculateJournal(account, phase);
    } else {
      updated += await recalculateJournal(account);
    }
  }
  console.log(`Recalculated ${updated} trades without changing broker P&L or manual result overrides.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
