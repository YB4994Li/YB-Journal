import { Router } from 'express';
import * as controller from '../controllers/tradeController.js';
import * as csv from '../controllers/csvController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/accountValidators.js';
import { bulkDeleteRules, tradeRules } from '../validators/tradeValidators.js';
import { screenshotUpload } from '../middleware/upload.js';

const router = Router();
router.get('/csv-template', asyncHandler(csv.template));
router.delete('/bulk', bulkDeleteRules, validate, asyncHandler(controller.bulkRemove));
router.get('/:id', idParam(), validate, asyncHandler(controller.get));
router.put('/:id', idParam(), tradeRules, validate, asyncHandler(controller.update));
router.delete('/:id', idParam(), validate, asyncHandler(controller.remove));
router.post('/:id/duplicate', idParam(), validate, asyncHandler(controller.duplicate));
router.post('/:id/screenshot', idParam(), validate, screenshotUpload.single('screenshot'), asyncHandler(controller.uploadScreenshot));
router.delete('/:id/screenshot', idParam(), validate, asyncHandler(controller.deleteScreenshot));
export default router;
