import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.account.create({
    data: {
      name: 'Personal Trading Account',
      initialCapital: '10000.00',
      currency: 'USD',
      trades: {
        create: [
          {
            tradeNumber: 1, strategyName: 'London Breakout', market: 'XAUUSD',
            tradeDate: new Date('2026-01-03'), session: 'London', timeframe: '15m',
            direction: 'BUY', entryPrice: '2642.50', stopLoss: '2637.50',
            takeProfit: '2652.50', lotSize: '0.10', plannedRR: '2',
            resultR: '2', exitPrice: '2652.50', riskPercentage: '1',
            result: 'WIN', profitLoss: '100', emotion: 'Patient and focused.'
          },
          {
            tradeNumber: 2, strategyName: 'NY Reversal', market: 'EURUSD',
            tradeDate: new Date('2026-01-06'), session: 'New York', timeframe: '5m',
            direction: 'SELL', entryPrice: '1.04250', stopLoss: '1.04450',
            takeProfit: '1.03850', lotSize: '0.50', plannedRR: '2',
            resultR: '-1', exitPrice: '1.04450', riskPercentage: '1',
            result: 'LOSS', profitLoss: '-50', emotion: 'Entered slightly early.'
          },
          {
            tradeNumber: 3, strategyName: 'Trend Pullback', market: 'GBPUSD',
            tradeDate: new Date('2026-01-09'), session: 'London', timeframe: '1h',
            direction: 'BUY', entryPrice: '1.22100', stopLoss: '1.21700',
            takeProfit: '1.22900', lotSize: '0.25', plannedRR: '2',
            resultR: '0', exitPrice: '1.22100', riskPercentage: '0.5',
            result: 'BREAK_EVEN', profitLoss: '0', emotion: 'Protected capital.'
          }
        ]
      }
    }
  });
  console.log(`Seeded account ${account.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
