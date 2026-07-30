import multer from 'multer';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found', errors: [] });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : error.message, errors: [] });
  }
  if (error.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with this unique value already exists', errors: [] });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found', errors: [] });
  }
  const status = error.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : error.message,
    errors: error.errors || []
  });
}
