import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = path.join(serverRoot, '.env');
dotenv.config({ path: envPath });

const required = ['DATABASE_URL'];
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length) {
  throw new Error(
    `Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. ` +
    `Create server/.env from server/.env.example and provide valid values.`
  );
}

function positiveInteger(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function validUrl(name, fallback) {
  const value = process.env[name] || fallback;
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
}

export const env = {
  port: positiveInteger('PORT', 5000),
  clientUrl: validUrl('CLIENT_URL', 'http://localhost:5173'),
  maxFileSize: positiveInteger('MAX_FILE_SIZE', 5 * 1024 * 1024),
  isProduction: process.env.NODE_ENV === 'production'
};
