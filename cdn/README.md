# QrVerse CDN Scanner

A **self-contained, 100% client-side** QR scanning library served from jsDelivr. Add one `<script>` tag, pass it an image, and get the decoded data back. No backend, no API keys, no extra dependencies.

## Quick start

```html
<script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>
<script>
  QrVerse.scan(someImage).then((res) => {
    console.log(res.data); // decoded text
  });
</script>
```

## How to use

Follow these steps to scan QR codes in any existing web project.

### 1. Add the CDN script to your page

Put the `<script>` tag inside `<head>` or right before `</body>` — before any code that calls `QrVerse`.

```html
<script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>
```

After loading, the global `QrVerse` object becomes available with a `scan` function.

### 2. Get an image from your user

Give the user a file picker. The file itself is <em>never uploaded</em> — scanning happens in their browser.

```html
<input type="file" id="qr-file" accept="image/*">
```

### 3. Call `QrVerse.scan()` with the file

```html
<script>
  document.getElementById('qr-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await QrVerse.scan(file);
      console.log('Scanned data:', result.data);   // the decoded text
      alert('Scanned: ' + result.data);
    } catch (err) {
      alert('Could not scan: ' + err.message);      // e.g. "No QR code found"
    }
  });
</script>
```

### 4. Done 🎉

That's the whole integration — one script tag plus one call to `QrVerse.scan()`.

---

### Complete copy-paste HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Scan with QrVerse CDN</title>
</head>
<body>
  <h1>Upload a QR code image</h1>
  <input type="file" id="qr-file" accept="image/*">
  <p id="out"></p>

  <!-- Load the library -->
  <script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>

  <script>
    document.getElementById('qr-file').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const result = await QrVerse.scan(file);
        document.getElementById('out').textContent = 'Scanned: ' + result.data;
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
| Minified (recommended, ~130 KB) | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js` |
| Readable | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.js` |
| Latest version tag | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@latest/cdn/qrverse.min.js` |

> Pin a specific tag (e.g. `@1.0.0`) in production for reproducible builds.

## API

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

## Example — file input

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

## Example — image URL

```js
const res = await QrVerse.scan('https://example.com/my-qr.png');
console.log(res.data);
```

## Example — file shown in an `<img>` tag

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

Open `test/cdn-test.html` directly in a browser (it loads the live CDN build), or run `npm start` and visit the app at `http://localhost:3000`.

## Building

The bundle combines the [jsQR](https://www.npmjs.com/package/jsqr) decoder with the small `src/qr.js` wrapper:

```bash
npm run build:cdn     # regenerates cdn/qrverse.js + cdn/qrverse.min.js
node test/cdn-smoke.js  # headless functional test
```

**Commit the built files** in `cdn/` — jsDelivr serves them straight from the GitHub repo. Rebuild and commit after any change to `src/qr.js` or a `jsqr` upgrade.

## License

MIT — same as QRVerse.
