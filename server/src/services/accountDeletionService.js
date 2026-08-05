import { ApiError } from '../utils/ApiError.js';

export async function deleteAccountWithJournal(db, accountId) {
  return db.$transaction(async (tx) => {
    const account = await tx.account.findUnique({ where: { id: accountId }, select: { id: true } });
    if (!account) throw new ApiError(404, 'Account not found');
    const trades = await tx.trade.findMany({ where: { accountId }, select: { screenshotPath: true } });
    await tx.trade.deleteMany({ where: { accountId } });
    await tx.accountPhase.deleteMany({ where: { accountId } });
    await tx.account.delete({ where: { id: accountId } });
    return { screenshots: trades.map(({ screenshotPath }) => screenshotPath).filter(Boolean) };
  });
}
