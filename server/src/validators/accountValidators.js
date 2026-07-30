import { body, param } from 'express-validator';

export const idParam = (name = 'id') => param(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`).toInt();
const optionalText = (field, max = 5000) => body(field).optional({ nullable: true }).trim().isLength({ max });

export const accountRules = [
  body('name').trim().notEmpty().isLength({ max: 120 }),
  body('accountType').isIn(['REAL', 'FUNDED']),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'MAD']),
  optionalText('broker', 120), optionalText('propFirm', 120), optionalText('platform', 120), optionalText('notes'),
  body('initialCapital').if(body('accountType').equals('REAL')).isDecimal({ decimal_digits: '0,2' }).custom((value) => Number(value) >= 0).withMessage('Initial capital must be a non-negative amount'),
  body('accountSize').if(body('accountType').equals('FUNDED')).isDecimal({ decimal_digits: '0,2' }).custom((value) => Number(value) > 0).withMessage('Account size must be greater than zero'),
  body('phases').if(body('accountType').equals('FUNDED')).isArray({ min: 1 }).withMessage('Funded accounts must have at least one phase'),
  body('phases.*.name').if(body('accountType').equals('FUNDED')).trim().notEmpty().isLength({ max: 120 }),
  body('phases.*.phaseType').if(body('accountType').equals('FUNDED')).isIn(['EVALUATION', 'VERIFICATION', 'FUNDED_LIVE', 'CUSTOM']),
  body('phases.*.status').if(body('accountType').equals('FUNDED')).isIn(['PENDING', 'ACTIVE', 'PASSED', 'FAILED', 'ARCHIVED']),
  body('phases.*.initialBalance').if(body('accountType').equals('FUNDED')).isDecimal().custom((value) => Number(value) > 0),
  ...['profitTargetPercentage', 'maximumLossPercentage', 'dailyLossLimitPercentage'].map((field) =>
    body(`phases.*.${field}`).optional({ nullable: true, checkFalsy: true }).isDecimal().custom((value) => Number(value) >= 0)),
  body('phases.*.minimumTradingDays').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 })
];

export const accountUpdateRules = [
  body('name').optional().trim().notEmpty().isLength({ max: 120 }),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'MAD']),
  optionalText('broker', 120), optionalText('propFirm', 120), optionalText('platform', 120), optionalText('notes'),
  body('initialCapital').optional().isDecimal().custom((value) => Number(value) >= 0),
  body('accountSize').optional({ nullable: true }).isDecimal().custom((value) => Number(value) > 0)
];
