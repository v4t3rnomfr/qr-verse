# QRVerse - Professional QR Code Generator

QRVerse is a premium, modern QR code generator built with Node.js, Express.js, HTML5, CSS3, and Vanilla JavaScript. Create beautiful, fully customizable QR codes with a polished SaaS-grade user experience.

> **Two products in one repo:** the interactive **[QR generator](#usage)** and the **[QR CDN SDK](#cdn-sdk-library)** that anyone can embed in their own project with a single script tag — to generate *and* scan QR codes.

## Table of Contents

- [Features](#features)
- [CDN SDK Library](#cdn-sdk-library)
- [Installation](#installation)
- [Deploy on Vercel](#deploy-on-vercel-recommended)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Browser Support](#browser-support)
- [Performance](#performance)
- [License](#license)

## Features

### 🎯 11 QR Types
- **Text** - Simple text content
- **URL** - Website links with validation
- **WiFi** - Network credentials (WPA/WEP/Open)
- **Email** - mailto links with subject & body
- **Phone** - tel: links with country codes
- **WhatsApp** - Direct chat links with pre-filled messages
- **SMS** - Text message links
- **Google Maps** - Location links
- **Contact (vCard)** - Complete contact cards
- **Event** - Calendar events (ICS format)
- **Image Link** - Upload an image, get a QR that links to it (public URL, anyone can view)
- **Custom** - Raw data encoding

### 🎨 Full Customization
- QR size control (200-600px)
- Margin adjustment
- Foreground & background colors
- Transparent background option
- Square, rounded, and circle dot styles
- Eye shape styles (square, circle, rounded)
- Eye color customization
- Linear gradient support
- Error correction levels (L/M/Q/H)
- Logo upload (PNG/JPG/SVG) with size control

### 📥 Multiple Export Formats
- PNG download
- SVG download
- JPEG download
- PDF download (A4 with metadata)
- Copy to clipboard
- Print directly
- Share via native share API

### 📡 Live Preview
- Real-time QR generation as you type
- Debounced input handling for performance
- Animated loading spinner
- QR metadata display (resolution, version, created time, file type, data length)

### ✅ Scan Verification
- Webcam QR scanning (html5-qrcode)
- QR image upload & decode
- Success/Failure indicators
- Decoded content display

### 📚 History & Favorites
- Automatic localStorage persistence
- Search history instantly
- Reuse any previous QR
- Favorite/bookmark QR codes
- Delete individual history items

### 🔔 Notifications
- Modern toast notifications for all actions
- Success, error, warning, and info types with auto-dismiss

### 🎨 Design
- Dark mode by default
- Glassmorphism effects
- Rounded corners & soft shadows
- Smooth CSS animations (no libraries)
- Fully responsive (desktop, tablet, mobile)
- Gradient buttons with ripple effects
- Professional typography (Inter font)

### ♿ Accessibility
- Keyboard navigation (Ctrl/Cmd+S generates)
- ARIA labels on all interactive elements
- Proper color contrast
- Focus visible indicators
- Reduced motion support

## CDN SDK Library

QRVerse ships a **self-contained, client-side SDK** that anyone can drop into an existing project via jsDelivr to **generate** styled QR codes (colors, gradients, dot/eye shapes, center logo) and **scan** QR codes from an image. Add one `<script>` tag, call `QrVerse.generate()` or `QrVerse.scan()`, done. No backend, no API key, no build step — and scanning is 100% in-browser (images are never uploaded).

### 📚 Documentation locations

| Guide | Where it lives |
|-------|----------------|
| **Full CDN SDK docs** (this section in detail) | [`cdn/README.md`](cdn/README.md) |
| Raw file on GitHub | <https://github.com/v4t3rnomfr/qr-verse/blob/master/cdn/README.md> |
| Live interactive demo | [`test/cdn-test.html`](test/cdn-test.html) (open it in a browser to test `QrVerse.generate` and `QrVerse.scan`) |

### Add the CDN script

Put one script tag in your page (before any code that uses `QrVerse`):

```html
<script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>
```

| Build | URL |
|-------|-----|
| Minified (recommended, ~180 KB) | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js` |
| Readable (development) | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.js` |
| Latest release tag | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@latest/cdn/qrverse.min.js` |

> **Pin a version in production** — use `@1.0.0` instead of `@master` so new releases can't break your page.

### API reference

#### `QrVerse.generate(text, options?) → Promise<GenerateResult>`

Generates a styled QR code as a PNG/SVG data URL — mirrors the app's customization options.

```js
const qr = await QrVerse.generate('https://example.com', {
  width: 300,
  color: '#6366f1',
  background: '#ffffff',
  dots: 'rounded',              // 'square' | 'rounded' | 'circle'
  eye: 'circle',                // 'square' | 'circle' | 'rounded'
  errorCorrectionLevel: 'H',
  gradient: { type: 'linear', rotation: 45, color1: '#6366f1', color2: '#a855f7', color3: '#ec4899' },
  logo: fileInput.files[0],     // File, URL, <img>, or <canvas> (optional center logo)
  logoSize: 20,                 // % of QR width
  format: 'png'                 // 'png' | 'svg'
});
document.getElementById('qr-img').src = qr.data; // data:image/png;base64,...
```

Resolves to `{ success, data (data URL), type: 'png'|'svg', width }`.

#### `QrVerse.scan(input, options?) → Promise<Result>`

Accepts a **File/Blob**, an **image URL** / **data URL**, an **`<img>`**, or a **`<canvas>`**.

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

Rejects with a `QrVerseError` (`.code`) on bad input, or `NOT_FOUND` when no QR is detected.

#### Other methods

- `QrVerse.scanImageData(rgba, w, h, options?)` — raw pixels (webcam/video frames)
- `QrVerse.scanFile(file)` / `QrVerse.scanUrl(url)` — conveniences

### Generate a styled QR (with logo)

```html
<input type="file" id="logo" accept="image/*">
<input type="text" id="text" value="https://example.com">
<img id="out">

<script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>
<script>
  document.getElementById('logo').addEventListener('change', async (e) => {
    if (!e.target.files[0]) return;
    const qr = await QrVerse.generate(document.getElementById('text').value, {
      gradient: { type: 'linear', rotation: 45, color1: '#6366f1', color2: '#a855f7', color3: '#ec4899' },
      logo: e.target.files[0],
      logoSize: 18,
      errorCorrectionLevel: 'H'
    });
    document.getElementById('out').src = qr.data;
  });
</script>
```

### Scan an image (file upload)

Give the user a file picker and call `QrVerse.scan()`:

```html
<input type="file" id="qr-file" accept="image/*">

<script>
  document.getElementById('qr-file').addEventListener('change', async (e) => {
    if (!e.target.files[0]) return;
    try {
      const res = await QrVerse.scan(e.target.files[0]);   // File, URL, <img>, or <canvas>
      console.log('Scanned:', res.data);                    // decoded text
    } catch (err) {
      console.error(err.message);                           // e.g. "No QR code found"
    }
  });
</script>
```

### Scan an image shown in an `<img>` tag

Pass the `<img>` element right after setting `src` (e.g. `URL.createObjectURL(file)`); the scanner waits for the image to load:

```html
<img id="preview">
<input type="file" id="qr-file" accept="image/*">
<script>
  document.getElementById('qr-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('preview').src = URL.createObjectURL(file);
    try {
      const res = await QrVerse.scan(document.getElementById('preview'));
      console.log('Scanned:', res.data);
    } catch (err) {
      console.error(err.message);
    }
  });
</script>
```

### Scan raw pixels (webcam)

```js
const ctx = canvas.getContext('2d');
const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
const res = await QrVerse.scanImageData(data, width, height);
```

> A complete, ready-to-paste HTML page is in [`cdn/README.md`](cdn/README.md#how-to-use).

### Building the CDN bundle

```bash
npm run build:cdn     # regenerates cdn/qrverse.js + cdn/qrverse.min.js
npm run test:cdn      # headless functional smoke test
```

Commit the built files in `cdn/` — jsDelivr serves them straight from GitHub.

## Installation

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)

### Local Development

```bash
# Clone the repository
git clone https://github.com/v4t3rnomfr/qr-verse.git
cd qr-verse

# Install dependencies
npm install

# Start the server
npm start
```

Navigate to `http://localhost:3000` in your browser.

## Deploy on Vercel (Recommended)

QRVerse is fully configured for **Vercel serverless deployment** — no other hosting setup needed.

### Option A — Deploy via Vercel Dashboard (easiest)

1. Push this repository to GitHub:
   ```bash
   git add -A
   git commit -m "Vercel deployment"
   git push origin master
   ```
2. Go to [vercel.com/new](https://vercel.com/new), import the `qr-verse` repo.
3. Vercel auto-detects the framework. Keep the default build settings (no build command, output `public`).
4. Click **Deploy**. Done! 🎉

### Option B — Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# From project root
vercel        # Preview deployment
vercel --prod # Production deployment
```

### Environment Variables (for Image → Link QR)

The **Image → Link** QR type uploads an image and generates a QR that points to the stored file. Public access is free — anyone with the resulting URL can view the image. Uploads need storage, configured like this:

| Name | Required | Purpose |
|------|----------|---------|
| `BLOB_READ_WRITE_TOKEN` | on Vercel | Vercel Blob Store credential for saving uploads |
| `CRON_SECRET` | on Vercel (optional) | Guards the auto-cleanup endpoint called by the Vercel Cron Job |

> ⚠️ **Retention: uploaded images are deleted after 14 days.** The app warns users, and a Vercel Cron Job (daily, `vercel.json` → `/api/qr/cleanup`) removes files older than 14 days from both Blob Store and local disk. QR codes linking to an image stop working once it's deleted.
>
> **Compression:** before upload, images are downscaled to 70% and re-encoded as JPEG at 0.7 quality (~30% smaller, ~30% lower quality). Transparent PNG/GIF files stay PNG so alpha is preserved.

> ⚠️ **Keep `BLOB_READ_WRITE_TOKEN` a secret.** It is a *write* credential, not a "public key." Anyone with it can upload, overwrite, or delete files in your store and consume your storage quota. **Never commit it to the repo.** It lives only in your Vercel project env vars (or a local `.env.local`), which is why the file is in `.gitignore`.

#### Local development (no Vercel needed)

The upload route falls back to local disk automatically — uploaded images are saved to `public/uploads/`. Just run `npm start`.

#### Production on Vercel — set up your own Blob Store

Anyone can fork this repo and deploy their own instance with their own storage:

1. In your Vercel project → **Storage** → **Create Blob Store**. Pick **public** access so image URLs are viewable by anyone.
2. Vercel automatically sets `BLOB_READ_WRITE_TOKEN` for the project (also runnable via `vercel blob create-store <name> --access public`).
3. (Optional, for auto-cleanup) Add a `CRON_SECRET` env var — the cron job sends it as a `Bearer` token. Set it via `vercel env add CRON_SECRET production`.
4. Redeploy. Uploads now store in Blob and return a public URL. Old files are auto-deleted after 14 days by the cron job defined in `vercel.json`.

#### Why the token stays out of the repo, but images stay public

- The Blob store is created with `access: 'public'`, so every uploaded image URL works for anyone — no auth, no key.
- `BLOB_READ_WRITE_TOKEN` is only used server-side (routes/qr.js) to *save* files. Visitors never see it.
- This keeps the project open source (whole repo is public on GitHub) **and** safe from abuse.

### How deployment works (GitHub → Vercel)

Confused about how the app runs if the token is "hidden"? Here's the full picture:

1. **GitHub stores only code.** The repo references the env var *name* (`process.env.BLOB_READ_WRITE_TOKEN` / the `@vercel/blob` `put()` call in routes/qr.js) — never its value.
2. **Vercel stores the secret.** When you create a Blob Store, the token is saved in your project's **Settings → Environment Variables** on Vercel's servers — not in GitHub.
3. **Every push auto-deploys.** Vercel watches the connected GitHub repo. On each push to `master` it clones your code, builds it, and injects the secret env vars into the running serverless function at runtime.
4. **The running app uses the token in memory** — it's never printed, logged, or served to visitors, and it never appears in the deployed output.

```
Your commit + push
      │
      ▼
GitHub repo (code only, no secrets)
      │  Vercel watches the repo
      ▼
Vercel build → injects secrets from dashboard → Production deployment
```

**Local dev** mimics this: `npm start` reads `BLOB_READ_WRITE_TOKEN` from your local `.env.local` (gitignored). Delete that file and the app still runs — uploads just fall back to local disk.

**If someone forks the repo:** they get your *code*, not your token. Their fork has no `BLOB_READ_WRITE_TOKEN`, so their deploy runs fine but Image → Link uploads fall back to disk (or fail gracefully). They'd set up their own Blob Store to enable uploads — exactly what you did. The only thing visible to them in generated URLs is the public store name, which is not a credential.

### Project on Vercel

- The Express app (with SPA fallback + API) is served through a single serverless function via `api/index.js`.
- Static assets (`public/`) are served by the same Express app through `vercel.json` rewrites.
- All client-side AJAX calls use relative `/api/qr/...` paths, so no environment URL config is needed.
- LocalStorage (history/favorites) works identically since everything runs in the browser.

## Usage

### Basic Usage
1. Click **"Launch App"** on the landing page
2. Select a QR type from the left sidebar
3. Fill in the required fields
4. Watch the live preview update instantly
5. Customize colors, styles, and logo as desired
6. Download or share your QR code

### Keyboard Shortcuts
- `Ctrl/Cmd + S` - Generate QR code
- `Esc` - Close any open modal

## Screenshots

**Landing Page**
![Landing Page](public/assets/screenshots/landing.png)

**Dashboard**
![Dashboard](public/assets/screenshots/dashboard.png)

**QR Customization**
![Customization](public/assets/screenshots/customization.png)

**History & Scan**
![History](public/assets/screenshots/history.png)

## Project Structure

```
QRVerse/
├── server.js              # Express server
├── package.json           # Dependencies & scripts
├── README.md              # This file
├── public/
│   ├── index.html         # Single-page application
│   ├── css/
│   │     style.css        # All styles (1400+ lines)
│   ├── js/
│   │     app.js           # All application logic
│   ├── assets/
│   │     logo.png         # Brand logo
│   │     icons/           # UI icons
│   └── downloads/         # Downloaded files
├── routes/
│     qr.js                # QR API routes
└── utils/                 # Utility functions
```

## Dependencies

| Package | Purpose |
|---------|---------|
| [express](https://www.npmjs.com/package/express) | Web server framework |
| [qrcode](https://www.npmjs.com/package/qrcode) | Server-side QR generation |
| [qr-code-styling](https://www.npmjs.com/package/qr-code-styling) | Client-side styled QR rendering |
| [jspdf](https://www.npmjs.com/package/jspdf) | PDF export |
| [html5-qrcode](https://www.npmjs.com/package/html5-qrcode) | Webcam & image QR scanning |

## API Endpoints

### `POST /api/qr/generate`
Generates a QR code server-side.
```json
{
  "data": "https://example.com",
  "options": {
    "errorCorrectionLevel": "M",
    "margin": 4,
    "width": 300,
    "foregroundColor": "#000000",
    "backgroundColor": "#ffffff"
  }
}
```

### `POST /api/qr/validate`
Validates QR data based on type.
```json
{
  "type": "url",
  "data": "https://example.com"
}
```

## Browser Support

- Chrome 60+ (recommended)
- Firefox 60+
- Safari 12+
- Edge 79+

## Performance

- Debounced QR generation (300ms)
- Lazy-loaded history previews
- Optimized DOM updates
- No unnecessary re-renders
- Minimal external dependencies

## License

MIT License

Copyright (c) 2026 QRVerse

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.