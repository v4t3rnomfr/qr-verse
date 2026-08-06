/**
 * build:cdn — Produces the self-contained CDN bundle(s) in /cdn.
 *
 * Strategy: bundle jsQR's UMD (which registers the global `jsQR` decoder)
 * together with the small QrVerse wrapper. Resulting file needs no network
 * or build-time dependencies at runtime — just drop it in a <script> tag.
 *
 * Output:
 *   cdn/qrverse.js        (readable bundle)
 *   cdn/qrverse.min.js    (minified)
 *
 * Commit the built files so jsDelivr can serve them from GitHub:
 *   https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js
 */

const fs = require('fs');
const path = require('path');
const terser = require('terser');
const pkg = require('./package.json');

const ROOT = __dirname;

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

async function build() {
  const version = pkg.version;

  const jsQR = read('node_modules/jsqr/dist/jsQR.js');
  let wrapper = read('src/qr.js');
  wrapper = wrapper.split('__QRVERSE_VERSION__').join(version);

  const header =
    '/*! QrVerse CDN Scanner v' + version + ' (MIT) | https://github.com/v4t3rnomfr/qr-verse */\n';

  const full = header + jsQR + '\n' + wrapper + '\n';

  const outDir = path.join(ROOT, 'cdn');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, 'qrverse.js'), full, 'utf8');

  const minified = await terser.minify(full, {
    compress: { passes: 2 },
    mangle: true,
    format: { beautify: false, comments: /QrVerse CDN Scanner/ }
  });

  if (minified.error) {
    console.error('Minify failed:', minified.error);
    process.exit(1);
  }

  fs.writeFileSync(path.join(outDir, 'qrverse.min.js'), minified.code + '\n', 'utf8');

  console.log('Built cdn/qrverse.js       ' + (full.length / 1024).toFixed(1) + ' KB');
  console.log('Built cdn/qrverse.min.js   ' + (minified.code.length / 1024).toFixed(1) + ' KB');
  console.log('CDN: https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.js');
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});