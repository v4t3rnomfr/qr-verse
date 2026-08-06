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

## Local demo

Run `npm start` and open `http://localhost:3000/cdn-demo.html`.

## Building

The bundle combines the [jsQR](https://www.npmjs.com/package/jsqr) decoder with the small `src/qr.js` wrapper:

```bash
npm run build:cdn     # regenerates cdn/qrverse.js + cdn/qrverse.min.js
node test/cdn-smoke.js  # headless functional test
```

**Commit the built files** in `cdn/` — jsDelivr serves them straight from the GitHub repo. Rebuild and commit after any change to `src/qr.js` or a `jsqr` upgrade.

## License

MIT — same as QRVerse.
