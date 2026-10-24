export function notFound(req, res) { res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }); }
export function errorHandler(err, req, res, next) {
  console.error(err.name, err.message);
  if (err.code === 11000) return res.status(409).json({ success: false, message: `Duplicate value for ${Object.keys(err.keyPattern || {})[0] || 'field'}` });
  if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(', ') });
  res.status(err.status || 500).json({ success: false, message: err.status ? err.message : 'Server error' });
}

