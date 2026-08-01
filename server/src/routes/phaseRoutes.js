import { Router } from 'express';
import * as controller from '../controllers/phaseController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/accountValidators.js';
import { phaseRules } from '../validators/phaseValidators.js';

const router = Router();
router.get('/:phaseId', idParam('phaseId'), validate, asyncHandler(controller.get));
router.patch('/:phaseId', idParam('phaseId'), phaseRules.map((rule) => rule.optional()), validate, asyncHandler(controller.update));
router.delete('/:phaseId', idParam('phaseId'), validate, asyncHandler(controller.remove));
router.post('/:phaseId/archive', idParam('phaseId'), validate, asyncHandler(controller.archive));
export default router;
