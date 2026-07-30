export const success = (res, data, message = 'Request completed successfully', status = 200) =>
  res.status(status).json({ success: true, data, message });
