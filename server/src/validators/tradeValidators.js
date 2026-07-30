import { body } from 'express-validator';

const optionalDecimal = (field) => body(field).optional({ nullable: true, checkFalsy: true }).isDecimal().withMessage(`${field} must be numeric`);

export const tradeRules = [
  body('strategyName').optional({ nullable: true }).trim().isLength({ max: 120 }),
  body('strategyId').optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  body('market').trim().notEmpty().isLength({ max: 50 }).customSanitizer((value) => value.toUpperCase()),
  body('tradeDate').isISO8601({ strict: true }).withMessage('tradeDate must be a valid date'),
  body('direction').isIn(['BUY', 'SELL']),
  body('result').isIn(['WIN', 'LOSS', 'BREAK_EVEN']),
  body('resultSource').optional().isIn(['AUTO','MANUAL']),
  body('profitLoss').isDecimal({ decimal_digits: '0,2' }).withMessage('profitLoss must be a valid amount'),
  body('session').optional({ nullable: true }).trim().isLength({ max: 50 }),
  body('openTimeUtc').optional({ nullable: true }).isISO8601().withMessage('openTimeUtc must be a valid UTC datetime'),
  body('closeTimeUtc').optional({ nullable: true }).isISO8601().withMessage('closeTimeUtc must be a valid UTC datetime'),
  body('sessionTimezone').optional({ nullable: true }).isIn(['UTC']),
  body('sessionDetection').optional({ nullable: true }).isIn(['AUTO', 'MANUAL']),
  body('phaseId').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).toInt(),
  body('timeframe').optional({ nullable: true }).trim().isLength({ max: 30 }),
  body('emotion').optional({ nullable: true }).trim().isLength({ max: 5000 }),
  optionalDecimal('entryPrice'), optionalDecimal('stopLoss'), optionalDecimal('takeProfit'),
  optionalDecimal('lotSize'), optionalDecimal('plannedRR'), optionalDecimal('resultR'),
  optionalDecimal('exitPrice'), optionalDecimal('riskAmount'), optionalDecimal('balanceBeforeTrade'),
  optionalDecimal('plannedRROverride'), optionalDecimal('riskPercentageOverride'), optionalDecimal('riskPercentage')
];

export const bulkDeleteRules = [
  body('tradeIds').isArray({ min: 1 }).withMessage('tradeIds must be a non-empty array'),
  body('tradeIds.*').customSanitizer((value) => Number(value)).isInt({ min: 1 }).withMessage('each trade ID must be a positive integer')
];
