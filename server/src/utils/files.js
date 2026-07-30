import fs from 'node:fs/promises';
import path from 'node:path';

export async function removeScreenshot(filename) {
  if (!filename) return;
  const safeName = path.basename(filename);
  const file = path.resolve('uploads', 'screenshots', safeName);
  try {
    await fs.unlink(file);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Screenshot cleanup failed:', error.message);
  }
}
