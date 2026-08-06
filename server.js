/**
 * QRVerse - Express Server
 * Serves the QR generator application and API routes.
 *
 * Vercel-compatible: exports the Express app for serverless
 * deployment. When run directly (`node server.js`), it starts
 * a local listener on PORT (default 3000).
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const qrRoutes = require('./routes/qr');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists (used by Image → Link QR type on local dev).
// On Vercel the filesystem is read-only, so this is best-effort only.
const uploadsDir = path.join(__dirname, 'public', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  // Read-only filesystem (Vercel serverless) — uploads use Blob Store instead.
  console.log('Uploads dir unavailable (read-only FS):', err.code);
}

// Middleware — allow larger payloads for image-based QR data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/qr', qrRoutes);

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Export app for Vercel / external hosters
module.exports = app;

// Start local server only when run directly (not imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 QRVerse is running!`);
    console.log(`   ➜  Local:   http://localhost:${PORT}`);
    console.log(`   ➜  API:     http://localhost:${PORT}/api/qr\n`);
  });
}