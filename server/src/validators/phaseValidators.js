import { body } from 'express-validator';

export const phaseRules = [
  body('name').trim().notEmpty().isLength({ max: 120 }),
  body('phaseType').isIn(['EVALUATION', 'VERIFICATION', 'FUNDED_LIVE', 'CUSTOM']),
  body('initialBalance').isDecimal().custom((value) => Number(value) > 0),
  body('status').optional().isIn(['LOCKED', 'ACTIVE', 'PASSED', 'FAILED', 'ARCHIVED']),
  ...['profitTargetPercentage', 'maximumLossPercentage', 'dailyLossLimitPercentage'].map((field) =>
    body(field).optional({ nullable: true, checkFalsy: true }).isDecimal().custom((value) => Number(value) >= 0)),
  body('minimumTradingDays').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }),
  body('startDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('endDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 5000 })
];
