# QRVerse - Professional QR Code Generator

QRVerse is a premium, modern QR code generator built with Node.js, Express.js, HTML5, CSS3, and Vanilla JavaScript. Create beautiful, fully customizable QR codes with a polished SaaS-grade user experience.

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

## CDN Scanner Library

QRVerse ships a **self-contained, client-side SDK** that anyone can drop into an existing project via jsDelivr to decode QR codes from an image. No backend or API key needed. Scanning runs entirely in the visitor's browser — images are never uploaded.

### Add the CDN script

Put one script tag in your page (before any code that uses `QrVerse`):

```html
<script src="https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js"></script>
```

| Build | URL |
|-------|-----|
| Minified (recommended) | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.min.js` |
| Readable | `https://cdn.jsdelivr.net/gh/v4t3rnomfr/qr-verse@master/cdn/qrverse.js` |

### Scan an image

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

`QrVerse.scan()` accepts a **File/Blob**, an **image URL** or **data URL**, an **`<img>`**, or a **`<canvas>`**. It resolves to `{ success, data, binaryData, version, location, alignmentPattern }`.

Scanning an `<img>` that shows a file upload also works — pass the element right after setting `src`; it waits for the image to load:

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

### Conveniences

- `QrVerse.scanFile(file)` / `QrVerse.scanUrl(url)`

Full docs, CDN URLs, and a live example: see [`cdn/README.md`](cdn/README.md) (a full copy-paste HTML example) and [`public/cdn-demo.html`](public/cdn-demo.html).

Rebuild after changing the SDK: `npm run build:cdn` (commit the files in `cdn/`). Smoke test: `npm run test:cdn`.

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

### Environment Variables (for Image → Link UL)

The uploads route uses local disk in development. In production on Vercel, connect the **Vercel Blob Store**:

1. In your Vercel project → **Storage** → **Create Blob Store**.
2. Copy the read/write token.
3. In **Settings → Environment Variables** add:

   | Name | Value |
   |------|-------|
   | `BLOB_READ_WRITE_TOKEN` | (your token) |

4. Redeploy. The upload endpoint will automatically store images in Blob instead of local disk.

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