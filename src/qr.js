/**
 * QRVerse CDN SDK — wrapper source (pre-bundle).
 *
 * This file is concatenated AFTER the bundled jsQR UMD (dist/jsQR.js) and the
 * qr-code-styling UMD (lib/qr-code-styling.js) by build-cdn.js, so the globals
 * `jsQR` (decoder) and `QRCodeStyling` (generator) are already available on the
 * root object. It exposes a friendly Promise-based API under the `QrVerse`
 * namespace with both `scan` and `generate` support.
 *
 * Browser usage:
 *   <script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.js"></script>
 *   const result = await QrVerse.scan(myImage);              // scan a QR image
 *   const qr = await QrVerse.generate('https://example.com'); // generate a PNG QR
 */

(function IIFE(root) {
  'use strict';

  if (!root) return;

  var VERSION = '__QRVERSE_VERSION__';

  function QrVerseError(message, code) {
    var err = new Error(message);
    err.name = 'QrVerseError';
    err.code = code || 'SCAN_ERROR';
    return err;
  }

  function isObject(v) { return v !== null && typeof v === 'object'; }

  // Resolve any supported input to a drawable source (img/canvas).
  function resolveSource(input) {
    return new Promise(function (resolve, reject) {
      if (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement) {
        resolve(input); return;
      }
      // Canvas duck-typing (offscreen / detached canvases).
      if (isObject(input) && typeof input.getContext === 'function' && typeof input.width === 'number') {
        resolve(input); return;
      }

      if (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) {
        // Already fully loaded and decodable.
        if (input.complete && input.naturalWidth) {
          resolve(input);
          return;
        }
        // Finished loading but produced no pixels (broken/blank image).
        if (input.complete) {
          reject(QrVerseError('The provided <img> could not be decoded (no image data).', 'SOURCE_ERROR'));
          return;
        }
        // Mid-load (typical for img.src = URL.createObjectURL(file)): resolve once
        // the image finishes. Use decode() when available, with onload as fallback.
        var settled = false;
        function finish() {
          if (settled) return;
          settled = true;
          input.onload = input.onerror = null;
          resolve(input);
        }
        function fail() {
          if (settled) return;
          settled = true;
          input.onload = input.onerror = null;
          reject(QrVerseError('Could not load the provided <img> element.', 'SOURCE_ERROR'));
        }
        input.onload = finish;
        input.onerror = fail;
        if (typeof input.decode === 'function') {
          input.decode().then(finish).catch(function () { /* onerror handles failures */ });
        }
        return;
      }

      if (typeof Blob !== 'undefined' && input instanceof Blob) {
        var objUrl = URL.createObjectURL(input);
        var img = new Image();
        img.onload = function () { URL.revokeObjectURL(objUrl); resolve(img); };
        img.onerror = function () { URL.revokeObjectURL(objUrl); reject(QrVerseError('Image blob could not be decoded.', 'SOURCE_ERROR')); };
        img.src = objUrl;
        return;
      }

      if (typeof input === 'string') {
        if (/^data:image\//i.test(input) || /^(https?:)?\/\//i.test(input)) {
          var sImg = new Image();
          sImg.onload = function () { resolve(sImg); };
          sImg.onerror = function () { reject(QrVerseError('Could not load the image URL or data URL.', 'SOURCE_ERROR')); };
          sImg.src = input;
          return;
        }
        reject(QrVerseError('Invalid image source string. Pass a data URL, a URL, a File/Blob, an <img> or a <canvas>.', 'SOURCE_ERROR'));
        return;
      }

      reject(QrVerseError('Unsupported image input type.', 'SOURCE_ERROR'));
    });
  }

  // Draw source onto an offscreen canvas clamped to maxDimension and return ImageData.
  function rasterize(src, maxDimension) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });

    var w0 = (typeof src.naturalWidth === 'number' && src.naturalWidth) || src.videoWidth || 0;
    var h0 = (typeof src.naturalHeight === 'number' && src.naturalHeight) || src.videoHeight || 0;
    if (!w0 && typeof src.width === 'number') { w0 = src.width; }
    if (!h0 && typeof src.height === 'number') { h0 = src.height; }
    if (!w0 || !h0) { throw QrVerseError('Source has no drawable dimensions.', 'SOURCE_ERROR'); }

    var scale = 1;
    if (maxDimension && (w0 > maxDimension || h0 > maxDimension)) {
      scale = maxDimension / Math.max(w0, h0);
    }
    canvas.width = Math.max(1, Math.round(w0 * scale));
    canvas.height = Math.max(1, Math.round(h0 * scale));
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  function normalize(decoded) {
    if (!decoded || !decoded.data) return null;
    return {
      success: true,
      data: decoded.data,
      binaryData: decoded.binaryData || null,
      version: decoded.version || null,
      location: decoded.location || null,
      alignmentPattern: decoded.alignmentPattern || null
    };
  }

  function getDecoder() {
    var d = root.jsQR;
    if (typeof d === 'function') return d;
    return null;
  }

  function getGenerator() {
    var g = root.QRCodeStyling;
    if (typeof g === 'function') return g;
    return null;
  }

  function blobToDataURL(blob) {
    return new Promise(function (resolve, reject) {
      if (typeof FileReader === 'undefined') {
        reject(QrVerseError('FileReader is not available in this environment.', 'GENERATE_ERROR'));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(QrVerseError('Could not read the generated QR data.', 'GENERATE_ERROR')); };
      reader.readAsDataURL(blob);
    });
  }

  // Convert any supported image input (File/Blob/URL/img/canvas) to a data URL
  // so it can be embedded as a center logo by the generator.
  function sourceToDataURL(input) {
    return resolveSource(input).then(function (src) {
      if (typeof document === 'undefined') {
        throw QrVerseError('Canvas is required to embed a logo image.', 'GENERATE_ERROR');
      }
      var w0 = (typeof src.naturalWidth === 'number' && src.naturalWidth) || src.videoWidth || src.width || 0;
      var h0 = (typeof src.naturalHeight === 'number' && src.naturalHeight) || src.videoHeight || src.height || 0;
      if (!w0 || !h0) { throw QrVerseError('Logo image has no drawable dimensions.', 'SOURCE_ERROR'); }
      var maxDim = 400;
      var scale = Math.min(1, maxDim / Math.max(w0, h0));
      var canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w0 * scale));
      canvas.height = Math.max(1, Math.round(h0 * scale));
      canvas.getContext('2d').drawImage(src, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    });
  }

  var QrVerse = {
    version: VERSION,

    /**
     * Scan an image for a QR code.
     * @param {string|File|Blob|HTMLImageElement|HTMLCanvasElement} input
     * @param {Object} [options]  { maxDimension, inversionAttempts }
     * @returns {Promise<Object>} { success, data, binaryData, version, location, alignmentPattern }
     */
    scan: function (input, options) {
      options = options || {};
      var decoder = getDecoder();
      return new Promise(function (resolve, reject) {
        if (!decoder) { reject(QrVerseError('QR decoder is not available.', 'DECODER_UNAVAILABLE')); return; }
        resolveSource(input).then(function (src) {
          try {
            var imageData = rasterize(src, options.maxDimension || 800);
            var decoded = decoder(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: options.inversionAttempts || 'attemptBoth'
            });
            var result = normalize(decoded);
            if (!result) { reject(QrVerseError('No QR code found in the image.', 'NOT_FOUND')); return; }
            resolve(result);
          } catch (e) {
            reject(e instanceof QrVerseError ? e : QrVerseError('Failed to scan image.', 'SCAN_ERROR'));
          }
        }, reject);
      });
    },

    /** Scan raw RGBA pixel data (Uint8ClampedArray) plus width/height. */
    scanImageData: function (data, width, height, options) {
      options = options || {};
      var decoder = getDecoder();
      return new Promise(function (resolve, reject) {
        if (!decoder) { reject(QrVerseError('Decoder is not available.', 'DECODER_UNAVAILABLE')); return; }
        if (!data || typeof data.length !== 'number' || !width || !height) {
          reject(QrVerseError('Expected RGBA data, width and height.', 'SOURCE_ERROR')); return;
        }
        var decoded = decoder(data, width, height, {
          inversionAttempts: options.inversionAttempts || 'attemptBoth'
        });
        var result = normalize(decoded);
        if (!result) { reject(QrVerseError('No QR code found.', 'NOT_FOUND')); return; }
        resolve(result);
      });
    },

    /** Convenience: scan a File / Blob. */
    scanFile: function (file, options) { return QrVerse.scan(file, options); },
    /** Convenience: scan by URL or data URL. */
    scanUrl: function (url, options) { return QrVerse.scan(url, options); },

    /**
     * Generate a QR code as a PNG/SVG data URL, mirroring the QRVerse app
     * customization options. Optionally embeds a center logo image.
     * @param {string} text  Data to encode
     * @param {Object} [options]
     *   { width, margin, format ('png'|'svg'), color, background, transparent,
     *     dots ('square'|'rounded'|'circle'), eye ('square'|'circle'|'rounded'),
     *     eyeColor, errorCorrectionLevel ('L'|'M'|'Q'|'H'),
     *     gradient: { type:'linear'|'radial', rotation, color1, color2, color3,
     *                 colorStops:[{offset,color}], applyToEyes },
     *     logo: (File|Blob|URL|img|canvas), logoSize (0-100) }
     * @returns {Promise<Object>} { success, data (data URL), type, width }
     */
    generate: function (text, options) {
      options = options || {};
      var generator = getGenerator();
      return new Promise(function (resolve, reject) {
        if (!generator) { reject(QrVerseError('QR generator is not available.', 'GENERATOR_UNAVAILABLE')); return; }
        if (typeof text !== 'string' || !text.trim()) {
          reject(QrVerseError('QR data (text) is required.', 'SOURCE_ERROR')); return;
        }

        var width = parseInt(options.width, 10) || 300;
        var margin = options.margin === undefined ? 4 : (parseInt(options.margin, 10) || 0);
        var format = (options.format || 'png').toLowerCase();
        if (format !== 'png' && format !== 'svg') format = 'png';

        var color = options.color || '#000000';
        var background = options.transparent ? 'transparent' : (options.background || '#ffffff');
        var eyeColor = options.eyeColor || color;

        var dotStyleMap = { square: 'square', rounded: 'rounded', circle: 'extra-rounded' };
        var eyeStyleMap = { square: 'square', circle: 'dot', rounded: 'extra-rounded' };
        var dotType = dotStyleMap[options.dots] || options.dots || 'square';
        var eyeType = eyeStyleMap[options.eye] || options.eye || 'square';

        var config = {
          width: width,
          height: width,
          margin: margin,
          type: 'canvas',
          data: text,
          dotsOptions: { color: color, type: dotType },
          backgroundOptions: { color: background },
          cornersSquareOptions: { color: eyeColor, type: eyeType },
          cornersDotOptions: { color: eyeColor, type: eyeType },
          qrOptions: { errorCorrectionLevel: options.errorCorrectionLevel || 'M' }
        };

        if (options.gradient) {
          var g = options.gradient;
          var gradient = {
            type: g.type === 'radial' ? 'radial' : 'linear',
            colorStops: (g.colorStops && g.colorStops.length) ? g.colorStops : [
              { offset: 0, color: g.color1 || color },
              { offset: 0.5, color: g.color2 || color },
              { offset: 1, color: g.color3 || g.color2 || color }
            ]
          };
          if (gradient.type === 'linear' && typeof g.rotation === 'number') {
            gradient.rotation = g.rotation * Math.PI / 180;
          }
          config.dotsOptions.gradient = gradient;
          if (g.applyToEyes !== false) {
            config.cornersSquareOptions.gradient = gradient;
            config.cornersDotOptions.gradient = gradient;
          }
        }

        var logoPromise;
        if (options.logo) {
          var imageOptions = {
            crossOrigin: 'anonymous',
            margin: 4,
            hideBackgroundDots: true,
            imageSize: (parseInt(options.logoSize, 10) || 20) / 100
          };
          logoPromise = sourceToDataURL(options.logo).then(function (dataUrl) {
            config.image = dataUrl;
            config.imageOptions = imageOptions;
          });
        } else {
          logoPromise = Promise.resolve();
        }

        logoPromise.then(function () {
          try {
            var qr = new generator(config);
            qr.getRawData(format).then(function (blob) {
              blobToDataURL(blob).then(function (dataUrl) {
                resolve({ success: true, data: dataUrl, type: format, width: width });
              }, reject);
            }, function (e) {
              reject(e instanceof QrVerseError ? e : QrVerseError('Failed to generate QR code.', 'GENERATE_ERROR'));
            });
          } catch (e) {
            reject(e instanceof QrVerseError ? e : QrVerseError('Failed to generate QR code.', 'GENERATE_ERROR'));
          }
        }, reject);
      });
    }
  };

  root.QrVerse = QrVerse;
  root.QrVerseDecoder = getDecoder();
  root.QrVerseStyling = getGenerator();
  root.QrVerseError = QrVerseError;
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis));