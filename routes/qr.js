/**
 * QRVerse - QR Code API Routes
 * Server-side QR generation and validation
 */

const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const router = express.Router();

// Directory where uploaded images (Image → Link QR) are stored
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');

// Clean old uploads (older than 24h) on server start
function cleanOldUploads() {
  try {
    if (!fs.existsSync(uploadsDir)) return;
    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > DAY) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    console.error('Upload cleanup error:', err);
  }
}
cleanOldUploads();

/**
 * Validates data based on QR type
 */
function validateQRData(type, data) {
  if (!data || typeof data !== 'string' || data.trim().length === 0) {
    return { valid: false, message: 'Data is required' };
  }

  switch (type) {
    case 'url':
      try {
        const url = new URL(data);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return { valid: false, message: 'URL must use http or https protocol' };
        }
      } catch {
        return { valid: false, message: 'Invalid URL format' };
      }
      break;

    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
        return { valid: false, message: 'Invalid email format' };
      }
      break;

    case 'phone':
    case 'whatsapp':
    case 'sms':
      // Accept full numbers with country code (+XX...), or
      // standalone local numbers when the user picked a country code.
      if (!/^\+?\d[\d\s-]{5,}$/.test(data)) {
        return { valid: false, message: 'Invalid phone number format' };
      }
      break;

    case 'wifi':
      if (!data.startsWith('WIFI:T:')) {
        return { valid: false, message: 'Invalid WiFi QR data' };
      }
      break;

    default:
      break;
  }

  return { valid: true };
}

/**
 * POST /api/qr/generate
 * Generates a QR code and returns as data URL
 */
router.post('/generate', async (req, res) => {
  try {
    const { data, options = {} } = req.body;

    // Validate data
    const validation = validateQRData(options.type || 'text', data);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    // QR generation options
    const qrOptions = {
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      margin: options.margin !== undefined ? options.margin : 4,
      width: options.width || 300,
      color: {
        dark: options.foregroundColor || '#000000',
        light: options.backgroundColor || '#ffffff'
      }
    };

    // Generate QR as data URL
    const dataUrl = await QRCode.toDataURL(data, qrOptions);

    res.json({
      success: true,
      dataUrl,
      metadata: {
        size: qrOptions.width,
        type: options.type || 'text',
        dataLength: data.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

/**
 * POST /api/qr/upload
 * Saves an uploaded image (Image → Link) and returns its public URL.
 * Body: { image: <base64 data URL> }
 */
router.post('/upload', (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Accept data URLs like data:image/png;base64,...
    const match = image.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i);
    if (!match) {
      return res.status(400).json({ error: 'Invalid image format. Use PNG, JPG, or WEBP.' });
    }

    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');

    // Sanity check — reject absurdly small or large images
    if (buffer.length < 100) {
      return res.status(400).json({ error: 'Image file is too small' });
    }
    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image file is too large (max 15MB)' });
    }

    const filename = `${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/uploads/${filename}`,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * POST /api/qr/validate
 * Validates QR data for a given type
 */
router.post('/validate', (req, res) => {
  const { type = 'text', data } = req.body;
  const validation = validateQRData(type, data);
  res.json(validation);
});

/**
 * GET /api/qr/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'qrverse-api',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;