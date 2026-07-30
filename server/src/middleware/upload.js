import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

const screenshotStorage = multer.diskStorage({
  destination: path.resolve('uploads', 'screenshots'),
  filename: (req, file, callback) => {
    const extension = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }[file.mimetype];
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

export const screenshotUpload = multer({
  storage: screenshotStorage,
  limits: { fileSize: env.maxFileSize, files: 1 },
  fileFilter: (req, file, callback) => imageTypes.has(file.mimetype)
    ? callback(null, true)
    : callback(new ApiError(400, 'Only PNG, JPG, JPEG, and WEBP images are allowed'))
});

export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSize, files: 1 },
  fileFilter: (req, file, callback) => {
    const valid = file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.originalname.toLowerCase().endsWith('.csv');
    valid ? callback(null, true) : callback(new ApiError(400, 'Only CSV files are allowed'));
  }
});
