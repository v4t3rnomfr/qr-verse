# QrVerse CDN SDK

A **self-contained, 100% client-side** QR SDK served from jsDelivr. Add one `<script>` tag to **scan** QR codes from images *and* **generate** fully styled QR codes (colors, gradients, dot/eye shapes, center logo). No backend, no API keys, no build step.

## Quick start

```html
<script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>
<script>
  // Generate a styled QR code (PNG data URL)
  const qr = await QrVerse.generate('https://example.com', { color: '#6366f1' });
  console.log(qr.data); // data:image/png;base64,...

  // Scan a QR code image
  QrVerse.scan(someImage).then((res) => {
    console.log(res.data); // decoded text
  });
</script>
```

## How to use

### 1. Add the CDN script to your page

Put the `<script>` tag inside `<head>` or right before `</body>` — before any code that uses `QrVerse`.

```html
<script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>
```

After loading, the global `QrVerse` object is available with `generate` and `scan` functions (plus the `QrVerseDecoder` / `QrVerseStyling` underlying libraries).

### 2. Generate a QR code

Call `QrVerse.generate(text, options?)`. It returns a `Promise` resolving to a PNG (or SVG) data URL you can drop into an `<img src>`:

```html
<script>
  const qr = await QrVerse.generate('https://example.com', {
    width: 300,
    color: '#6366f1',
    background: '#ffffff',
    dots: 'rounded',          // 'square' | 'rounded' | 'circle'
    eye: 'circle',            // 'square' | 'circle' | 'rounded'
    errorCorrectionLevel: 'H',
  });
  document.getElementById('qr-img').src = qr.data;
</script>
```

Add a **center logo** by passing a `File`, a URL/data URL, an `<img>`, or a `<canvas>` as `logo` (with `logoSize` as a percentage):

```js
const qr = await QrVerse.generate('https://example.com', {
  logo: fileInput.files[0],  // File, Blob, URL, <img>, or <canvas>
  logoSize: 20,              // % of QR width (default 20)
  errorCorrectionLevel: 'H'  // use H so the logo doesn't break scanning
});
```

Apply a **gradient** with up to three color stops:

```js
const qr = await QrVerse.generate('https://example.com', {
  gradient: {
    type: 'linear',              // 'linear' | 'radial'
    rotation: 45,                // degrees (linear only)
    color1: '#6366f1',           // start
    color2: '#a855f7',           // middle
    color3: '#ec4899',           // end
    applyToEyes: true
  }
});
```

### 3. Scan a QR code from an image

Give the user a file picker. The file itself is <em>never uploaded</em> — scanning happens in their browser.

```html
<input type="file" id="qr-file" accept="image/*">
```

```html
<script>
  document.getElementById('qr-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await QrVerse.scan(file);
      alert('Scanned: ' + result.data);   // the decoded text
    } catch (err) {
      alert('Could not scan: ' + err.message);   // e.g. "No QR code found"
    }
  });
</script>
```

### 4. Done 🎉

That's the whole integration — one script tag plus calls to `QrVerse.generate()` / `QrVerse.scan()`.

---

### Complete copy-paste HTML (generate + scan round-trip)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>QrVerse CDN SDK</title>
</head>
<body>
  <h1>Generate, then scan it back</h1>
  <input type="text" id="text" value="https://example.com" style="width:280px">
  <button id="make">Generate</button>
  <img id="qr" width="220" style="display:block;margin:12px 0;background:#fff">
  <p id="out">—</p>

  <!-- Load the library -->
  <script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>

  <script>
    document.getElementById('make').addEventListener('click', async () => {
      try {
        const qr = await QrVerse.generate(document.getElementById('text').value, {
          color: '#6366f1', dots: 'rounded', errorCorrectionLevel: 'H'
        });
        document.getElementById('qr').src = qr.data;
        // Round-trip: scan the QR we just generated
        const back = await QrVerse.scanUrl(qr.data);
        document.getElementById('out').textContent = 'Scanned back: ' + back.data;
      } catch (err) {
        document.getElementById('out').textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body>
</html>
```

## CDN URLs

| File | URL |
|------|-----|
| Minified (recommended, ~180 KB) | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js` |
| Readable | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.js` |
| Latest version tag | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@latest/cdn/qrverse.min.js` |

> Pin a specific tag (e.g. `@1.0.0`) in production for reproducible builds.

## API

### `QrVerse.generate(text, options?) -> Promise<GenerateResult>`

Generates a styled QR code. Returns:

```js
{
  success: true,
  data: "data:image/png;base64,...",   // PNG or SVG data URL — set as <img src>
  type: "png",                         // "png" | "svg"
  width: 300
}
```

Options (all optional unless noted):

| Option | Default | Description |
|--------|---------|-------------|
| `text` | — | **Required.** Data to encode |
| `width` | `300` | QR size in px (square) |
| `margin` | `4` | Quiet-zone margin in px |
| `format` | `'png'` | Output: `'png'` or `'svg'` |
| `color` | `'#000000'` | Foreground (dots + eyes) color |
| `background` | `'#ffffff'` | Background color |
| `transparent` | `false` | Transparent background |
| `dots` | `'square'` | Dot style: `'square'`, `'rounded'`, `'circle'` |
| `eye` | `'square'` | Eye style: `'square'`, `'circle'`, `'rounded'` |
| `eyeColor` | `color` | Eye color override |
| `errorCorrectionLevel` | `'M'` | `'L'`, `'M'`, `'Q'`, `'H'` (use `'H'` with a logo) |
| `gradient` | — | `{ type, rotation, color1, color2, color3, colorStops, applyToEyes }` |
| `logo` | — | Center logo: `File`/`Blob`, URL/data URL, `<img>`, or `<canvas>` |
| `logoSize` | `20` | Logo size as % of QR width |

Gradient shape: `{ type: 'linear'|'radial', rotation: 45, color1: '#..', color2: '#..', color3: '#..', colorStops: [{offset, color}], applyToEyes: true }`. Provide either `color1/2/3` or a full `colorStops` array.

Rejects with a `QrVerseError` (`.code`) on bad input, or `GENERATOR_UNAVAILABLE` / `GENERATE_ERROR` on failure.

### `QrVerse.scan(input, options?) -> Promise<Result>`

Accepts any of:

- `File` / `Blob` — from an `<input type="file">`
- `string` — a `data:image/...` URL or an `https://` image URL
- `HTMLImageElement` — an `<img>` element
- `HTMLCanvasElement` — a canvas with the image drawn on it

Options:

| Option | Default | Description |
|--------|---------|-------------|
| `maxDimension` | `800` | Downscale images larger than this (px, longest side) for speed |
| `inversionAttempts` | `'attemptBoth'` | `'attemptBoth'`, `'dontInvert'`, or `true` |

Resolves to:

```js
{
  success: true,
  data: "https://example.com",   // decoded text
  binaryData: [ ... ],           // decoded bytes (may be null)
  version: 3,                    // QR version, or null
  location: { ... },             // corner points, or null
  alignmentPattern: { ... }      // or null
}
```

Rejects with a `QrVerseError` (`.code`) on bad input or `NOT_FOUND` when no QR is detected.

### `QrVerse.scanImageData(rgba, width, height, options?) -> Promise<Result>`

Scan raw RGBA pixels (`Uint8ClampedArray`) directly — useful for webcam/video frames.

```js
const ctx = canvas.getContext('2d');
const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
const res = await QrVerse.scanImageData(data, width, height);
```

### Conveniences

- `QrVerse.scanFile(file, options?)`
- `QrVerse.scanUrl(url, options?)`

## Examples

### Example — generate with a gradient + logo

```html
<input type="file" id="logo" accept="image/*">
<input type="text" id="text" value="https://example.com">
<img id="out">
<script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>
<script>
  document.getElementById('logo').addEventListener('change', async (e) => {
    const logo = e.target.files[0];
    if (!logo) return;
    const qr = await QrVerse.generate(document.getElementById('text').value, {
      gradient: { type: 'linear', rotation: 45, color1: '#6366f1', color2: '#a855f7', color3: '#ec4899' },
      logo: logo,
      logoSize: 18,
      errorCorrectionLevel: 'H'
    });
    document.getElementById('out').src = qr.data;
  });
</script>
```

### Example — file input scan

```html
<input type="file" id="img" accept="image/*">
<script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>
<script>
  document.getElementById('img').addEventListener('change', async (e) => {
    try {
      const res = await QrVerse.scan(e.target.files[0]);
      alert('Scanned: ' + res.data);
    } catch (err) {
      alert(err.message);
    }
  });
</script>
```

### Example — image URL

```js
const res = await QrVerse.scan('https://example.com/my-qr.png');
console.log(res.data);
```

### Example — file shown in an `<img>` tag

If your UI already previews the uploaded file in an `<img>` element, pass that element
straight to `QrVerse.scan()`. The scanner waits for the image to load (even if you call
it right after setting `src`) and then decodes it.

```html
<img id="preview" alt="Uploaded preview">
<input type="file" id="file" accept="image/*">

<script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>
<script>
  document.getElementById('file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Show the upload in an <img> tag (object URL, never uploaded anywhere).
    const preview = document.getElementById('preview');
    preview.src = URL.createObjectURL(file);

    // 2. Scan that <img> tag — safe to call immediately; it waits for the load.
    try {
      const res = await QrVerse.scan(preview);
      alert('Scanned: ' + res.data);
    } catch (err) {
      alert(err.message);
    }
  });
</script>
```

Data URLs work the same way — set `img.src` to a `data:image/...` string and scan the element.

## Local demo

Open `test/cdn-test.html` directly in a browser (it loads the live CDN build and lets you **generate** a styled QR, **scan** a file, and verify the **generate → scan round-trip**), or run `npm start` and visit the app at `http://localhost:3000`.

## Building

The bundle combines the [jsQR](https://www.npmjs.com/package/jsqr) decoder and the [qr-code-styling](https://www.npmjs.com/package/qr-code-styling) generator with the small `src/qr.js` wrapper:

```bash
npm run build:cdn     # regenerates cdn/qrverse.js + cdn/qrverse.min.js
node test/cdn-smoke.js  # headless functional test
```

**Commit the built files** in `cdn/` — jsDelivr serves them straight from the GitHub repo. Rebuild and commit after any change to `src/qr.js`, a `jsqr` upgrade, or a `qr-code-styling` upgrade.

## License

MIT — same as QRVerse.
