import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { recalculateJournalHistory } from '../src/services/journalBalanceService.js';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

async function processJournal(accountId, phaseId) {
  return prisma.$transaction(
    (tx) => recalculateJournalHistory(accountId, phaseId, tx, { dryRun, refreshSpecifications: true }),
    { timeout: 30000 }
  );
}

async function main() {
  const accounts = await prisma.account.findMany({ include: { phases: { select: { id: true } } } });
  const summary = {
    journals: 0,
    trades: 0,
    calculatedRisk: 0,
    unavailableRisk: 0,
    missingSpecifications: 0,
    missingStopLoss: 0,
    missingConversionRates: 0
  };
  for (const account of accounts) {
    const phaseIds = account.accountType === 'FUNDED' ? account.phases.map((phase) => phase.id) : [null];
    for (const phaseId of phaseIds) {
      const history = await processJournal(account.id, phaseId);
      summary.journals += 1;
      summary.trades += history.length;
      for (const item of history) {
        const status = item.analytics.riskCalculationStatus;
        const error = item.analytics.riskCalculationError;
        if (status === 'CALCULATED' || status === 'MANUAL') summary.calculatedRisk += 1;
        else summary.unavailableRisk += 1;
        if (error === 'MISSING_INSTRUMENT_SPECIFICATION') summary.missingSpecifications += 1;
        if (error === 'MISSING_STOP_LOSS') summary.missingStopLoss += 1;
        if (error === 'MISSING_CONVERSION_RATE') summary.missingConversionRates += 1;
      }
    }
  }
  console.log(JSON.stringify({ mode: dryRun ? 'DRY_RUN' : 'APPLY', ...summary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
