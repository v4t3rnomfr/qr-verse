/**
 * CDN bundle smoke test (pure Node, no browser needed).
 *
 * Loads cdn/qrverse.min.js inside a vm sandbox, renders a real QR matrix
 * (from the `qrcode` package) into raw RGBA pixels, then decodes it through
 * the public QrVerse.scanImageData API to confirm the bundled decoder works.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const QRCode = require('qrcode');

const bundle = fs.readFileSync(path.join(__dirname, '..', 'cdn', 'qrverse.min.js'), 'utf8');
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(bundle, sandbox, { filename: 'qrverse.min.js' });

if (!sandbox.QrVerse) {
  console.error('FAIL: global QrVerse not defined');
  process.exit(1);
}
console.log('QrVerse loaded. version =', sandbox.QrVerse.version);
console.log('API surface:', Object.keys(sandbox.QrVerse).join(', '));

// --- Build a real QR image as RGBA pixels ---
function qrToRgba(text, scale) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = modules.size;
  scale = scale || 8;
  const w = size * scale;
  const h = size * scale;
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const on = modules.get(r, c);
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = ((r * scale + dy) * w + (c * scale + dx)) * 4;
          rgba[px] = rgba[px + 1] = rgba[px + 2] = on ? 0 : 255;
          rgba[px + 3] = 255;
        }
      }
    }
  }
  return { rgba, w, h };
}

async function main() {
  const text = 'https://qrverse.dev/hello?from=cdn';
  const { rgba, w, h } = qrToRgba(text, 8);

  const result = await sandbox.QrVerse.scanImageData(rgba, w, h);
  console.log('Decoded:', JSON.stringify(result.data));
  console.log('version:', result.version, '| success:', result.success);

  if (result.data !== text) {
    console.error('FAIL: decoded text mismatch');
    process.exit(1);
  }

  // NOT_FOUND path
  const blank = new Uint8ClampedArray(w * h * 4).fill(255);
  try {
    await sandbox.QrVerse.scanImageData(blank, w, h);
    console.error('FAIL: expected NOT_FOUND error');
    process.exit(1);
  } catch (e) {
    console.log('Blank image rejected as expected:', e.code, '-', e.message);
  }

  console.log('SMOKE TEST PASSED');
}

main().catch((e) => {
  console.error('SMOKE TEST FAILED:', e);
  process.exit(1);
});