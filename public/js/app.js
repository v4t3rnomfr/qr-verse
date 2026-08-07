/* ============================================
   QRVerse - Application Logic
   ============================================ */

// ===== State Management =====
const state = {
  currentType: 'text',
  qrData: '',
  generated: false,
  generating: false,
  currentHistoryItem: null,
  logoImage: null,
  debounceTimer: null,
  imgLinkUrl: null,
};

// ===== Form Definitions =====
const formDefinitions = {
  text: {
    title: 'Text',
    fields: () => `
      <div class="form-group">
        <label for="textContent">Text Content *</label>
        <textarea id="textContent" placeholder="Enter your text here..." required></textarea>
      </div>
    `,
    getData: () => document.getElementById('textContent')?.value.trim(),
    validate: (value) => value && value.length > 0,
    error: 'Please enter some text',
    placeholder: 'Text'
  },
  url: {
    title: 'URL',
    fields: () => `
      <div class="form-group">
        <label for="urlInput">Website URL *</label>
        <input type="url" id="urlInput" placeholder="https://example.com" required>
        <small class="field-hint">Include https:// for best results</small>
      </div>
    `,
    getData: () => document.getElementById('urlInput')?.value.trim(),
    validate: (value) => {
      try {
        const url = new URL(value);
        return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
      } catch {
        return false;
      }
    },
    error: 'Please enter a valid URL (e.g., https://example.com)',
    placeholder: 'URL'
  },
  wifi: {
    title: 'WiFi',
    fields: () => `
      <div class="form-group">
        <label for="wifiSsid">Network Name (SSID) *</label>
        <input type="text" id="wifiSsid" placeholder="MyWiFiNetwork" required>
      </div>
      <div class="form-group">
        <label for="wifiPassword">Password</label>
        <input type="text" id="wifiPassword" placeholder="Network password">
      </div>
      <div class="form-group">
        <label for="wifiEncryption">Encryption</label>
        <select id="wifiEncryption">
          <option value="WPA">WPA/WPA2</option>
          <option value="WEP">WEP</option>
          <option value="nopass">No Password</option>
        </select>
      </div>
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="wifiHidden">
          <span class="checkbox-custom"></span>
          Hidden Network
        </label>
      </div>
    `,
    getData: () => {
      const ssid = document.getElementById('wifiSsid')?.value.trim();
      if (!ssid) return null;
      const password = document.getElementById('wifiPassword')?.value || '';
      const encryption = document.getElementById('wifiEncryption')?.value || 'WPA';
      const hidden = document.getElementById('wifiHidden')?.checked ? 'true' : 'false';
      return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;
    },
    validate: (ssid) => Boolean(ssid),
    error: 'Please enter a network name',
    placeholder: 'WiFi'
  },
  email: {
    title: 'Email',
    fields: () => `
      <div class="form-group">
        <label for="emailTo">Recipient Email *</label>
        <input type="email" id="emailTo" placeholder="recipient@example.com" required>
      </div>
      <div class="form-group">
        <label for="emailSubject">Subject</label>
        <input type="text" id="emailSubject" placeholder="Email subject">
      </div>
      <div class="form-group">
        <label for="emailBody">Message</label>
        <textarea id="emailBody" placeholder="Write your message here..."></textarea>
      </div>
    `,
    getData: () => {
      const to = document.getElementById('emailTo')?.value.trim();
      if (!to) return null;
      const subject = document.getElementById('emailSubject')?.value || '';
      const body = document.getElementById('emailBody')?.value || '';
      return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    },
    validate: (to) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to),
    error: 'Please enter a valid email address',
    placeholder: 'Email'
  },
  phone: {
    title: 'Phone',
    fields: () => `
      <div class="form-group">
        <label for="phoneCountry">Country Code</label>
        <select id="phoneCountry">
          ${getCountryCodeOptions()}
        </select>
      </div>
      <div class="form-group">
        <label for="phoneNumber">Phone Number *</label>
        <input type="tel" id="phoneNumber" placeholder="5551234567" required autocomplete="tel-national">
        <small class="field-hint">Your country code is added automatically</small>
      </div>
    `,
    getData: () => {
      const full = getFullPhone('phoneNumber', 'phoneCountry');
      return full ? `tel:${full}` : null;
    },
    validate: (phone) => phone && phone.replace(/[^\d]/g, '').length >= 6,
    error: 'Please enter a valid phone number (at least 6 digits)',
    placeholder: 'Phone'
  },
  whatsapp: {
    title: 'WhatsApp',
    fields: () => `
      <div class="form-group">
        <label for="waCountry">Country Code</label>
        <select id="waCountry">
          ${getCountryCodeOptions()}
        </select>
      </div>
      <div class="form-group">
        <label for="waNumber">Phone Number *</label>
        <input type="tel" id="waNumber" placeholder="5551234567" required autocomplete="tel-national">
        <small class="field-hint">Country code added automatically — no need to type +</small>
      </div>
      <div class="form-group">
        <label for="waMessage">Pre-filled Message</label>
        <textarea id="waMessage" placeholder="Optional default message..."></textarea>
      </div>
    `,
    getData: () => {
      const full = getFullPhone('waNumber', 'waCountry');
      if (!full) return null;
      const digits = full.replace(/\D/g, ''); // digits only for wa.me
      const message = document.getElementById('waMessage')?.value || '';
      const messageParam = message ? `?text=${encodeURIComponent(message)}` : '';
      return `https://wa.me/${digits}${messageParam}`;
    },
    validate: (number) => number && number.replace(/[^\d]/g, '').length >= 8,
    error: 'Please enter a valid WhatsApp number (at least 8 digits)',
    placeholder: 'WhatsApp'
  },
  sms: {
    title: 'SMS',
    fields: () => `
      <div class="form-group">
        <label for="smsCountry">Country Code</label>
        <select id="smsCountry">
          ${getCountryCodeOptions()}
        </select>
      </div>
      <div class="form-group">
        <label for="smsNumber">Phone Number *</label>
        <input type="tel" id="smsNumber" placeholder="5551234567" required autocomplete="tel-national">
        <small class="field-hint">Your country code is added automatically</small>
      </div>
      <div class="form-group">
        <label for="smsMessage">Message</label>
        <textarea id="smsMessage" placeholder="Optional SMS message..."></textarea>
      </div>
    `,
    getData: () => {
      const full = getFullPhone('smsNumber', 'smsCountry');
      if (!full) return null;
      const message = document.getElementById('smsMessage')?.value || '';
      return `SMSTO:${full}:${message}`;
    },
    validate: (number) => number && number.replace(/[^\d]/g, '').length >= 6,
    error: 'Please enter a valid phone number (at least 6 digits)',
    placeholder: 'SMS'
  },
  maps: {
    title: 'Google Maps',
    fields: () => `
      <div class="form-group">
        <label for="mapsLocation">Location *</label>
        <input type="text" id="mapsLocation" placeholder="Address, place name, or coordinates" required>
      </div>
    `,
    getData: () => {
      const location = document.getElementById('mapsLocation')?.value.trim();
      return location ? `https://maps.google.com/?q=${encodeURIComponent(location)}` : null;
    },
    validate: (value) => value && value.length > 0,
    error: 'Please enter a location',
    placeholder: 'Maps'
  },
  vcard: {
    title: 'Contact (vCard)',
    fields: () => `
      <div class="form-group">
        <label for="vcName">Full Name *</label>
        <input type="text" id="vcName" placeholder="John Doe" required>
      </div>
      <div class="form-group">
        <label for="vcPhone">Phone</label>
        <input type="tel" id="vcPhone" placeholder="+1234567890">
      </div>
      <div class="form-group">
        <label for="vcEmail">Email</label>
        <input type="email" id="vcEmail" placeholder="john@example.com">
      </div>
      <div class="form-group">
        <label for="vcOrg">Organization</label>
        <input type="text" id="vcOrg" placeholder="Company Inc.">
      </div>
      <div class="form-group">
        <label for="vcTitle">Job Title</label>
        <input type="text" id="vcTitle" placeholder="Software Engineer">
      </div>
      <div class="form-group">
        <label for="vcWebsite">Website</label>
        <input type="url" id="vcWebsite" placeholder="https://example.com">
      </div>
      <div class="form-group">
        <label for="vcAddress">Address</label>
        <input type="text" id="vcAddress" placeholder="123 Main St, City">
      </div>
      <div class="form-group">
        <label for="vcNotes">Notes</label>
        <textarea id="vcNotes" placeholder="Additional notes..."></textarea>
      </div>
    `,
    getData: () => {
      const name = document.getElementById('vcName')?.value.trim();
      if (!name) return null;
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
      vcard += `FN:${name}\n`;
      vcard += `N:${lastName};${firstName};;;\n`;
      const phone = document.getElementById('vcPhone')?.value.trim();
      if (phone) vcard += `TEL;TYPE=CELL:${phone}\n`;
      const email = document.getElementById('vcEmail')?.value.trim();
      if (email) vcard += `EMAIL:${email}\n`;
      const org = document.getElementById('vcOrg')?.value.trim();
      if (org) vcard += `ORG:${org}\n`;
      const title = document.getElementById('vcTitle')?.value.trim();
      if (title) vcard += `TITLE:${title}\n`;
      const website = document.getElementById('vcWebsite')?.value.trim();
      if (website) vcard += `URL:${website}\n`;
      const address = document.getElementById('vcAddress')?.value.trim();
      if (address) vcard += `ADR:;;${address};;;\n`;
      const notes = document.getElementById('vcNotes')?.value.trim();
      if (notes) vcard += `NOTE:${notes}\n`;
      vcard += 'END:VCARD';
      return vcard;
    },
    validate: (name) => Boolean(name),
    error: 'Please enter a name',
    placeholder: 'vCard'
  },
  event: {
    title: 'Event',
    fields: () => `
      <div class="form-group">
        <label for="eventTitle">Event Title *</label>
        <input type="text" id="eventTitle" placeholder="Team Meeting" required>
      </div>
      <div class="form-group">
        <label for="eventDescription">Description</label>
        <textarea id="eventDescription" placeholder="Event description..."></textarea>
      </div>
      <div class="form-group">
        <label for="eventLocation">Location</label>
        <input type="text" id="eventLocation" placeholder="Conference Room 1">
      </div>
      <div class="form-group">
        <label for="eventStartDate">Start Date *</label>
        <input type="datetime-local" id="eventStartDate" required>
      </div>
      <div class="form-group">
        <label for="eventEndDate">End Date</label>
        <input type="datetime-local" id="eventEndDate">
      </div>
    `,
    getData: () => {
      const title = document.getElementById('eventTitle')?.value.trim();
      const startDate = document.getElementById('eventStartDate')?.value;
      if (!title || !startDate) return null;

      const formatICSDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      };

      let event = 'BEGIN:VEVENT\n';
      event += `SUMMARY:${title}\n`;
      const desc = document.getElementById('eventDescription')?.value.trim();
      if (desc) event += `DESCRIPTION:${desc}\n`;
      const location = document.getElementById('eventLocation')?.value.trim();
      if (location) event += `LOCATION:${location}\n`;
      event += `DTSTART:${formatICSDate(startDate)}\n`;
      const endDate = document.getElementById('eventEndDate')?.value;
      if (endDate) event += `DTEND:${formatICSDate(endDate)}\n`;
      event += 'END:VEVENT';
      return event;
    },
    validate: (title) => Boolean(title),
    error: 'Please enter an event title',
    placeholder: 'Event'
  },
  imagelink: {
    title: 'Image Link',
    fields: () => `
      <div class="form-group">
        <label for="imgLinkUpload">Upload Image *</label>
        <div class="upload-zone" id="imgLinkZone">
          <input type="file" id="imgLinkUpload" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
          <p>Click to upload an image</p>
          <span class="upload-hint">PNG, JPG, WEBP — The image is uploaded and a QR link to it is generated.</span>
        </div>
        <div id="imgLinkPreview" class="img-link-preview hidden">
          <img id="imgLinkThumb" alt="Uploaded image preview">
          <button type="button" class="btn btn-outline btn-sm" id="imgLinkRemove">Remove Image</button>
        </div>
        <small id="imgLinkStatus" class="field-hint"></small>
      </div>
    `,
    getData: () => state.imgLinkUrl || null,
    validate: (value) => Boolean(value),
    error: 'Please upload an image first',
    placeholder: 'Image Link'
  },
  custom: {
    title: 'Custom Data',
    fields: () => `
      <div class="form-group">
        <label for="customData">Custom Data *</label>
        <textarea id="customData" placeholder="Enter any data to encode in the QR code..." required></textarea>
      </div>
    `,
    getData: () => document.getElementById('customData')?.value.trim(),
    validate: (value) => value && value.length > 0,
    error: 'Please enter custom data',
    placeholder: 'Custom'
  }
};

// ===== DOM Helper =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ===== Country Code Data =====
const COUNTRY_CODES = [
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Turkey', code: '+90', flag: '🇹🇷' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
  { name: 'Nepal', code: '+977', flag: '🇳🇵' },
  { name: 'Afghanistan', code: '+93', flag: '🇦🇫' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Chile', code: '+56', flag: '🇨🇱' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { name: 'Poland', code: '+48', flag: '🇵🇱' },
  { name: 'Ukraine', code: '+380', flag: '🇺🇦' },
  { name: 'Sweden', code: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: '+47', flag: '🇳🇴' },
  { name: 'Denmark', code: '+45', flag: '🇩🇰' },
  { name: 'Finland', code: '+358', flag: '🇫🇮' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
  { name: 'Austria', code: '+43', flag: '🇦🇹' },
  { name: 'Belgium', code: '+32', flag: '🇧🇪' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { name: 'Greece', code: '+30', flag: '🇬🇷' },
  { name: 'Ireland', code: '+353', flag: '🇮🇪' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
  { name: 'Israel', code: '+972', flag: '🇮🇱' }
];

// Build a reusable country code dropdown option string
function getCountryCodeOptions() {
  return COUNTRY_CODES
    .map(c => `<option value="${c.code}">${c.flag} ${c.name} (${c.code})</option>`)
    .join('');
}

// Helper: read the full number from a country-code <select> + local number input
function getFullPhone(inputId, selectId = null) {
  const raw = document.getElementById(inputId)?.value.trim() || '';
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, ''); // local part only
  if (!digits) return null;
  const country = selectId
    ? (document.getElementById(selectId)?.value || '+1')
    : '';
  // If user already typed a + then use as-is; otherwise prepend selected country code
  return raw.startsWith('+') ? raw.replace(/[^\d+]/g, '') : country + digits;
}

// ===== Toast Notifications =====
function showToast(message, type = 'info', duration = 3000) {
  const container = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ'}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== Page Navigation =====
function showDashboard() {
  $('#landingPage').classList.add('hidden');
  $('#dashboard').classList.remove('hidden');
  window.scrollTo(0, 0);
}

function showLanding() {
  $('#dashboard').classList.add('hidden');
  $('#landingPage').classList.remove('hidden');
  window.scrollTo(0, 0);
}

// Make functions globally accessible
window.showDashboard = showDashboard;
window.showLanding = showLanding;

// ===== Form Management =====
function switchType(type) {
  state.currentType = type;
  state.generated = false;
  state.qrData = '';

  // Update navigation
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.type === type));
  $('#typeBadge').textContent = formDefinitions[type].title;

  // Render form
  const formBody = $('#formBody');
  formBody.innerHTML = formDefinitions[type].fields();

  // Reset preview
  resetPreview();
  enableActionButtons(false);

  // Bind input events
  formBody.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', handleInputChange);
    el.addEventListener('change', handleInputChange);
  });

  // Special init for Image Link form
  if (type === 'imagelink') {
    imageLinkUploadHandlerBound = false;
    state.imgLinkUrl = null;
    setupImageLinkForm();
  }

  // Focus first field
  const firstInput = formBody.querySelector('input, textarea, select');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function handleInputChange() {
  clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(() => {
    updateQRCode();
  }, 300);
}

function getCurrentFormData() {
  const def = formDefinitions[state.currentType];
  return def.getData();
}

function validateCurrentForm() {
  const def = formDefinitions[state.currentType];
  const data = getCurrentFormData();

  if (!data || !def.validate(data)) {
    return { valid: false, message: def.error };
  }

  return { valid: true, data };
}

// ===== Image Link (Image → QR) =====
let imageLinkUploadHandlerBound = false;

/**
 * Binds the dropzone, file input, and remove button for the
 * "Image Link" QR type. Uploads the image to the server and
 * stores the resulting absolute URL in state.imgLinkUrl.
 */
function setupImageLinkForm() {
  const zone = $('#imgLinkZone');
  const input = $('#imgLinkUpload');
  const previewEl = $('#imgLinkPreview');
  const statusEl = $('#imgLinkStatus');

  if (!zone || !input || imageLinkUploadHandlerBound) return;
  imageLinkUploadHandlerBound = true;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });
  zone.setAttribute('role', 'button');
  zone.setAttribute('tabindex', '0');
  zone.setAttribute('aria-label', 'Upload an image to convert to a QR code link');

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload a PNG, JPG, WEBP, or GIF image', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      $('#imgLinkThumb').src = ev.target.result;
      previewEl.classList.remove('hidden');
      statusEl.textContent = 'Uploading image...';

      try {
        const resp = await fetch('/api/qr/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: ev.target.result })
        });
        const result = await resp.json();
        if (!resp.ok || !result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        state.imgLinkUrl = window.location.origin + result.url;
        statusEl.textContent = 'Ready! The QR will link to this image.';
        showToast('Image uploaded successfully', 'success');
        updateQRCode();
      } catch (err) {
        console.error('Image upload error:', err);
        statusEl.textContent = 'Upload failed. Please try again.';
        showToast(err.message || 'Failed to upload image', 'error');
      }
    };
    reader.readAsDataURL(file);
  });

  const removeBtn = $('#imgLinkRemove');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      input.value = '';
      state.imgLinkUrl = null;
      previewEl.classList.add('hidden');
      statusEl.textContent = '';
      resetPreview();
      enableActionButtons(false);
      showToast('Image removed', 'info');
    });
  }
}

// ===== QR Code Generation =====
function getQRConfig() {
  const size = parseInt($('#qrSize').value) || 300;
  const margin = parseInt($('#qrMargin').value) || 4;
  const fgColor = $('#fgColor').value;
  const bgColor = $('#bgColor').value;
  const dotStyle = $('#dotStyle').value;
  const eyeStyle = $('#eyeStyle').value;
  const eyeColor = $('#eyeColor').value;
  const ecLevel = $('#ecLevel').value;
  const gradientEnabled = $('#gradientEnabled').checked;
  const gradientColor1 = $('#gradientColor1').value;
  const gradientColor2 = $('#gradientColor2').value;
  const transparentBg = $('#transparentBg').checked;

  // Map UI-friendly values to qr-code-styling library values.
  // The library only accepts these DotType values:
  //   dots | rounded | classy | classy-rounded | square | extra-rounded
  const dotStyleMap = {
    square: 'square',
    rounded: 'rounded',
    circle: 'extra-rounded' // visually round dots
  };
  // The library's corner square/dot types accept:
  //   dot | square | extra-rounded (plus the DotType set)
  const eyeStyleMap = {
    square: 'square',       // classic finder rings
    circle: 'dot',          // circular finder rings + round center dot
    rounded: 'extra-rounded' // rounded-corner rings + round center dot
  };
  const mappedDotStyle = dotStyleMap[dotStyle] || dotStyle;
  const mappedEyeStyle = eyeStyleMap[eyeStyle] || eyeStyle;

  const config = {
    width: size,
    height: size,
    margin,
    type: 'canvas',
    data: state.qrData,
    image: state.logoImage || undefined,
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 4,
      hideBackgroundDots: true,
      imageSize: state.logoImage ? (parseInt($('#logoSize').value) || 20) / 100 : 0.2
    },
    dotsOptions: {
      color: fgColor,
      type: mappedDotStyle
    },
    backgroundOptions: {
      color: transparentBg ? 'transparent' : bgColor
    },
    cornersSquareOptions: {
      color: eyeColor,
      type: mappedEyeStyle
    },
    cornersDotOptions: {
      color: eyeColor,
      type: mappedEyeStyle
    },
    qrOptions: {
      errorCorrectionLevel: ecLevel
    }
  };

  if (gradientEnabled) {
    config.dotsOptions.gradient = {
      type: 'linear',
      rotation: Math.PI / 4,
      colorStops: [
        { offset: 0, color: gradientColor1 },
        { offset: 1, color: gradientColor2 }
      ]
    };
    config.cornersSquareOptions.gradient = config.dotsOptions.gradient;
    config.cornersDotOptions.gradient = config.dotsOptions.gradient;
  }

  return config;
}

function updateQRCode() {
  const validation = validateCurrentForm();

  if (!validation.valid) {
    if (state.generated) {
      showToast(validation.message, 'error', 2500);
    }
    resetPreview();
    enableActionButtons(false);
    return;
  }

  state.qrData = validation.data;

  const previewPlaceholder = $('#previewPlaceholder');
  const qrContainer = $('#qrContainer');
  const generatingOverlay = $('#generatingOverlay');

  // Show generating overlay
  previewPlaceholder.classList.add('hidden');
  qrContainer.classList.add('hidden');
  generatingOverlay.classList.remove('hidden');
  state.generating = true;

  // Small delay to show spinner
  setTimeout(() => {
    try {
      const config = getQRConfig();
      const qrCode = new QRCodeStyling(config);
      qrContainer.innerHTML = '';
      qrCode.append(qrContainer);

      // Wait for canvas to render
      setTimeout(() => {
        generatingOverlay.classList.add('hidden');
        qrContainer.classList.remove('hidden');
        state.generating = false;
        state.generated = true;

        updatePreviewInfo();
        enableActionButtons(true);
        saveToHistory();
      }, 350);
    } catch (error) {
      console.error('QR generation error:', error);
      generatingOverlay.classList.add('hidden');
      showToast('Failed to generate QR code. Please try again.', 'error');
      state.generating = false;
    }
  }, 200);
}

function resetPreview() {
  $('#previewPlaceholder').classList.remove('hidden');
  $('#qrContainer').classList.add('hidden');
  $('#qrContainer').innerHTML = '';
  $('#generatingOverlay').classList.add('hidden');
  $('#previewStatus').textContent = 'Ready';
  enableActionButtons(false);
  resetPreviewInfo();
}

function enableActionButtons(enabled) {
  $$('.action-btn').forEach(btn => {
    btn.disabled = !enabled;
  });
}

function updatePreviewInfo() {
  $('#previewStatus').textContent = 'Generated';
  $('#infoResolution').textContent = `${$('#qrSize').value}×${$('#qrSize').value}px`;
  $('#infoVersion').textContent = 'Dynamic';
  $('#infoCreated').textContent = new Date().toLocaleTimeString();
  $('#infoFileType').textContent = 'PNG/SVG/JPEG/PDF';
  $('#infoDataLength').textContent = state.qrData.length + ' chars';
}

function resetPreviewInfo() {
  $('#infoResolution').textContent = '-';
  $('#infoVersion').textContent = '-';
  $('#infoCreated').textContent = '-';
  $('#infoFileType').textContent = '-';
  $('#infoDataLength').textContent = '-';
}

// ===== Logo Handling =====
function handleLogoUpload(file) {
  if (!file) return;

  const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    showToast('Please upload a PNG, JPG, or SVG image', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.logoImage = e.target.result;
      $('#uploadLogoBtn').classList.add('hidden');
      $('#removeLogoBtn').classList.remove('hidden');
      $('#logoSizeGroup').classList.remove('hidden');
      showToast('Logo uploaded successfully', 'success');
      if (state.generated) updateQRCode();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  state.logoImage = null;
  $('#logoUpload').value = '';
  $('#uploadLogoBtn').classList.remove('hidden');
  $('#removeLogoBtn').classList.add('hidden');
  $('#logoSizeGroup').classList.add('hidden');
  showToast('Logo removed', 'info');
  if (state.generated) updateQRCode();
}

// ===== Download Functions =====
function getCurrentQRCanvas() {
  const canvas = $('#qrContainer canvas');
  if (!canvas) return null;
  return canvas;
}

function downloadPNG() {
  const canvas = getCurrentQRCanvas();
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `qrverse-${state.currentType}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('PNG downloaded successfully', 'success');
}

function downloadSVG() {
  const qrContainer = $('#qrContainer');
  const canvas = getCurrentQRCanvas();
  if (!canvas) return;

  const svgString = canvasToSVG(canvas);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `qrverse-${state.currentType}-${Date.now()}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
  showToast('SVG downloaded successfully', 'success');
}

function canvasToSVG(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const svg = [];

  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);

  // Convert pixels to rects
  const pixelSize = 1;
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      const i = (y * width + x) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];

      if (a > 0) {
        const fill = a === 255
          ? `rgb(${r},${g},${b})`
          : `rgba(${r},${g},${b},${a / 255})`;
        svg.push(`<rect x="${x}" y="${y}" width="${pixelSize}" height="${pixelSize}" fill="${fill}"/>`);
      }
    }
  }

  svg.push('</svg>');
  return svg.join('');
}

function downloadJPEG() {
  const canvas = getCurrentQRCanvas();
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `qrverse-${state.currentType}-${Date.now()}.jpg`;
  link.href = canvas.toDataURL('image/jpeg', 0.95);
  link.click();
  showToast('JPEG downloaded successfully', 'success');
}

function downloadPDF() {
  const canvas = getCurrentQRCanvas();
  if (!canvas) return;

  // Use jsPDF to create PDF with QR image
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const imgData = canvas.toDataURL('image/png');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add title
  doc.setFontSize(20);
  doc.text('QRVerse QR Code', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Type: ${formDefinitions[state.currentType].title}`, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 34, { align: 'center' });

  // Add QR image centered
  const imgSize = 80; // mm
  const imgX = (pageWidth - imgSize) / 2;
  const imgY = (pageHeight - imgSize) / 2 - 10;
  doc.addImage(imgData, 'PNG', imgX, imgY, imgSize, imgSize);

  // Add footer
  doc.setFontSize(10);
  doc.setTextColor(128);
  doc.text('Generated with QRVerse', pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`qrverse-${state.currentType}-${Date.now()}.pdf`);
  showToast('PDF downloaded successfully', 'success');
}

async function copyImage() {
  try {
    const canvas = getCurrentQRCanvas();
    if (!canvas) return;

    // Try Clipboard API first
    if (navigator.clipboard && window.ClipboardItem) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } else {
      // Fallback: copy data URL
      const dataUrl = canvas.toDataURL('image/png');
      const textarea = document.createElement('textarea');
      textarea.value = dataUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    showToast('QR code copied to clipboard', 'success');
  } catch (error) {
    console.error('Copy failed:', error);
    showToast('Failed to copy QR code', 'error');
  }
}

function printQR() {
  const canvas = getCurrentQRCanvas();
  if (!canvas) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Please allow pop-ups to print', 'error');
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>QRVerse QR Code</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px;
            margin: 0;
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
          }
          p {
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
          }
          img {
            max-width: 300px;
            border: 1px solid #ddd;
            padding: 12px;
            border-radius: 8px;
          }
          .footer {
            margin-top: 40px;
            color: #999;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <h1>QRVerse QR Code</h1>
        <p>Type: ${formDefinitions[state.currentType].title} | Generated: ${new Date().toLocaleString()}</p>
        <img src="${canvas.toDataURL('image/png')}" alt="QR Code">
        <div class="footer">Generated with QRVerse</div>
        <script>window.print();</script>
      </body>
    </html>
  `);

  printWindow.document.close();
  showToast('Sending to printer...', 'info', 2000);
}

async function shareQR() {
  const canvas = getCurrentQRCanvas();
  if (!canvas) return;

  try {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], `qrverse-${state.currentType}-${Date.now()}.png`, {
      type: 'image/png'
    });

    if (navigator.share) {
      await navigator.share({
        title: 'QRVerse QR Code',
        text: `QR Code - ${formDefinitions[state.currentType].title}`,
        files: [file]
      });
      showToast('Shared successfully', 'success');
    } else {
      // Fallback: download
      downloadPNG();
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Share failed:', error);
      showToast('Failed to share QR code', 'error');
    }
  }
}

// ===== History Management =====
function saveToHistory() {
  try {
    const history = getHistory();

    // Don't add duplicate consecutive generations
    if (history.length > 0 && history[0].data === state.qrData) {
      return;
    }

    const item = {
      id: Date.now(),
      type: state.currentType,
      data: state.qrData,
      title: getHistoryTitle(state.currentType),
      date: new Date().toISOString(),
      favorite: false,
      options: getQRConfig()
    };

    history.unshift(item);

    // Keep only last 50 items
    const trimmed = history.slice(0, 50);
    localStorage.setItem('qrverse_history', JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('qrverse_history')) || [];
  } catch {
    return [];
  }
}

function getHistoryTitle(type) {
  const def = formDefinitions[type];
  const data = getCurrentFormData();

  switch (type) {
    case 'text':
      return data ? data.substring(0, 30) : def.title;
    case 'url':
      return data ? data.replace('https://', '').replace('http://', '').substring(0, 30) : def.title;
    case 'wifi':
      return `WiFi: ${document.getElementById('wifiSsid')?.value || 'Network'}`;
    case 'email':
      return `Email: ${document.getElementById('emailTo')?.value || 'Recipient'}`;
    case 'phone':
      return `Phone: ${document.getElementById('phoneNumber')?.value || 'Number'}`;
    case 'whatsapp':
      return `WhatsApp: ${document.getElementById('waNumber')?.value || 'Number'}`;
    case 'sms':
      return `SMS: ${document.getElementById('smsNumber')?.value || 'Number'}`;
    case 'maps':
      return `Maps: ${document.getElementById('mapsLocation')?.value || 'Location'}`;
    case 'vcard':
      return `Contact: ${document.getElementById('vcName')?.value || 'Name'}`;
    case 'event':
      return `Event: ${document.getElementById('eventTitle')?.value || 'Title'}`;
    case 'custom':
      return data ? data.substring(0, 30) : def.title;
    default:
      return def.title;
  }
}

function renderHistory(searchTerm = '') {
  const history = getHistory();
  const grid = $('#historyGrid');
  const emptyState = grid.querySelector('.empty-state');

  if (history.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
        </svg>
        <p>No QR codes generated yet</p>
      </div>
    `;
    return;
  }

  const filtered = searchTerm
    ? history.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.data.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : history;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <p>No results found for "${searchTerm}"</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="history-card" data-id="${item.id}">
      <div class="history-preview" data-preview="${item.id}"></div>
      <div class="history-card-title">${escapeHtml(item.title || 'QR Code')}</div>
      <div class="history-card-meta">
        ${formDefinitions[item.type]?.title || item.type} • ${new Date(item.date).toLocaleDateString()}
      </div>
      <div class="history-card-actions">
        <button class="history-btn" data-action="reuse" data-id="${item.id}" aria-label="Reuse QR">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          </svg>
          Reuse
        </button>
        <button class="history-btn favorite ${item.favorite ? 'active' : ''}" data-action="favorite" data-id="${item.id}" aria-label="Favorite QR">
          <svg viewBox="0 0 24 24" fill="${item.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button class="history-btn delete" data-action="delete" data-id="${item.id}" aria-label="Delete QR">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  // Generate previews
  filtered.forEach(item => {
    try {
      const previewEl = grid.querySelector(`[data-preview="${item.id}"]`);
      if (!previewEl || !previewEl.querySelector('canvas')) {
        const qr = new QRCodeStyling({
          width: 150,
          height: 150,
          data: item.data,
          dotsOptions: { color: '#2563eb' },
          backgroundOptions: { color: '#ffffff' }
        });
        qr.append(previewEl);
      }
    } catch (e) {
      console.error('Failed to render history preview:', e);
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function reuseHistoryItem(id) {
  const history = getHistory();
  const item = history.find(h => h.id === id);
  if (!item) return;

  switchType(item.type);
  showDashboard();

  const def = formDefinitions[item.type];
  if (def && def.fields) {
    const formBody = $('#formBody');
    formBody.innerHTML = def.fields();

    // Restore values if possible
    restoreFormValues(item);
  }

  // Close history modal
  $('#historyModal').classList.add('hidden');

  showToast('QR code loaded for reuse', 'success');
}

/**
 * Restore form values from a stored history item.
 * Each QR payload format is decoded back into its form fields
 * so users can tweak and regenerate a previous QR.
 */
function restoreFormValues(item) {
  const formBody = $('#formBody');

  // Attempt to parse and restore values based on type
  switch (item.type) {
    case 'url':
      $('#urlInput').value = item.data;
      break;

    case 'text':
      $('#textContent').value = item.data;
      break;

    case 'custom':
      $('#customData').value = item.data;
      break;

    case 'wifi': {
      // WIFI:T:WPA;S:ssid;P:pass;H:false;;
      const t = item.data.match(/T:([^;]*);/);
      const s = item.data.match(/S:([^;]*);/);
      const p = item.data.match(/P:([^;]*);/);
      const h = item.data.match(/H:([^;]*);/);
      if (t) $('#wifiEncryption').value = t[1];
      if (s) $('#wifiSsid').value = s[1];
      if (p) $('#wifiPassword').value = p[1];
      if (h) $('#wifiHidden').checked = h[1] === 'true';
      break;
    }

    case 'email': {
      // mailto:to?subject=x&body=y
      const mailto = item.data.replace('mailto:', '');
      const [to, query] = mailto.split('?');
      $('#emailTo').value = decodeURIComponent(to || '');
      const params = new URLSearchParams(query || '');
      $('#emailSubject').value = decodeURIComponent(params.get('subject') || '');
      $('#emailBody').value = decodeURIComponent(params.get('body') || '');
      break;
    }

    case 'phone': {
      // tel:+1234567890
      const raw = item.data.replace('tel:', '');
      restorePhoneFields('phoneNumber', 'phoneCountry', raw);
      break;
    }

    case 'whatsapp': {
      // https://wa.me/digits?text=msg
      const url = new URL(item.data);
      const raw = url.pathname.replace('/', '');
      restorePhoneFields('waNumber', 'waCountry', `+${raw}`);
      const text = url.searchParams.get('text');
      if (text) $('#waMessage').value = text;
      break;
    }

    case 'sms': {
      // SMSTO:+1234567890:message
      const m = item.data.replace('SMSTO:', '');
      const colonIdx = m.indexOf(':');
      const full = colonIdx > -1 ? m.substring(0, colonIdx) : m;
      const message = colonIdx > -1 ? m.substring(colonIdx + 1) : '';
      restorePhoneFields('smsNumber', 'smsCountry', full);
      if (message) $('#smsMessage').value = message;
      break;
    }

    case 'maps':
      $('#mapsLocation').value = decodeURIComponent(item.data.replace('https://maps.google.com/?q=', ''));
      break;

    case 'vcard': {
      const name = item.data.match(/FN:([^\n]+)/);
      const phone = item.data.match(/TEL;TYPE=CELL:([^\n]+)/);
      const email = item.data.match(/EMAIL:([^\n]+)/);
      const org = item.data.match(/ORG:([^\n]+)/);
      const title = item.data.match(/TITLE:([^\n]+)/);
      const website = item.data.match(/URL:([^\n]+)/);
      const address = item.data.match(/ADR:;;([^\n]+);;;/);
      const notes = item.data.match(/NOTE:([^\n]+)/);
      if (name) $('#vcName').value = name[1];
      if (phone) $('#vcPhone').value = phone[1];
      if (email) $('#vcEmail').value = email[1];
      if (org) $('#vcOrg').value = org[1];
      if (title) $('#vcTitle').value = title[1];
      if (website) $('#vcWebsite').value = website[1];
      if (address) $('#vcAddress').value = address[1];
      if (notes) $('#vcNotes').value = notes[1];
      break;
    }

    case 'event': {
      const summary = item.data.match(/SUMMARY:([^\n]+)/);
      const desc = item.data.match(/DESCRIPTION:([^\n]+)/);
      const location = item.data.match(/LOCATION:([^\n]+)/);
      const start = item.data.match(/DTSTART:([^\n]+)/);
      const end = item.data.match(/DTEND:([^\n]+)/);
      if (summary) $('#eventTitle').value = summary[1];
      if (desc) $('#eventDescription').value = desc[1];
      if (location) $('#eventLocation').value = location[1];
      if (start) $('#eventStartDate').value = formatICSBackToLocal(start[1]);
      if (end) $('#eventEndDate').value = formatICSBackToLocal(end[1]);
      break;
    }

    case 'imagelink':
      // Image file itself can't be restored from history; the user
      // must upload the image again. Show a helpful hint instead.
      showToast('Image must be re-uploaded to reuse this QR', 'info');
      break;

    default:
      break;
  }

  // Bind input events
  formBody.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', handleInputChange);
    el.addEventListener('change', handleInputChange);
  });

  updateQRCode();
}

/**
 * Split a full phone number (`+1 5551234567`) into the country-code
 * select and local number input for a given (inputId, selectId) pair.
 */
function restorePhoneFields(inputId, selectId, fullNumber) {
  const input = document.getElementById(inputId);
  const select = document.getElementById(selectId);
  if (!input) return;

  const digits = fullNumber.replace(/\D/g, '');
  const plus = fullNumber.startsWith('+');

  // If an explicit country code was stored, match it to the dropdown.
  let matched = null;
  if (plus) {
    for (const c of COUNTRY_CODES) {
      const code = c.code.replace(/\D/g, '');
      if (digits.startsWith(code) && code.length > 1) {
        matched = c.code;
        break;
      }
    }
  }

  if (matched && select && select.querySelector(`option[value="${matched}"]`)) {
    select.value = matched;
    input.value = digits.substring(matched.replace(/\D/g, '').length);
  } else {
    // No country info → keep the whole number in the local field
    input.value = digits;
  }
}

/**
 * Convert an iCalendar UTC timestamp (20260806T120000Z) back
 * to a local datetime-local input value.
 */
function formatICSBackToLocal(ics) {
  const m = ics.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!m) return '';
  const [, y, mo, d, h, mi] = m;
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

function toggleFavorite(id) {
  const history = getHistory();
  const item = history.find(h => h.id === id);
  if (!item) return;

  item.favorite = !item.favorite;
  localStorage.setItem('qrverse_history', JSON.stringify(history));
  renderHistory($('#historySearch').value);

  showToast(item.favorite ? 'Added to favorites' : 'Removed from favorites', item.favorite ? 'success' : 'info');
}

function deleteHistoryItem(id) {
  let history = getHistory();
  history = history.filter(h => h.id !== id);
  localStorage.setItem('qrverse_history', JSON.stringify(history));
  renderHistory($('#historySearch').value);
  showToast('QR code deleted from history', 'info');
}

// ===== Scan Verification =====
let html5QrCode = null;
let isScanning = false;

let scanStopPromise = Promise.resolve();

function openScanModal() {
  $('#scanModal').classList.remove('hidden');
  $('#scanResult').classList.add('hidden');
  $('#scanUpload').value = '';
  $('#fileScanArea').innerHTML = '';
}

function closeScanModal() {
  $('#scanModal').classList.add('hidden');
  stopScanner();
}

/**
 * Stops any running webcam scanner.
 * Returns a Promise so callers can safely start a new scan
 * only after the camera has been fully released.
 */
function stopScanner() {
  scanStopPromise = scanStopPromise.then(async () => {
    if (html5QrCode) {
      const instance = html5QrCode;
      html5QrCode = null;
      isScanning = false;
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
        await instance.clear();
      } catch (e) {
        // Already stopped — ignore
      }
    }
    isScanning = false;

    const startBtn = $('#startScanBtn');
    if (startBtn) {
      startBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
        </svg>
        Start Camera
      `;
      startBtn.classList.remove('btn-outline');
      startBtn.classList.add('btn-primary');
    }
  });
  return scanStopPromise;
}

function startScanner() {
  const readerEl = $('#qr-reader');
  readerEl.innerHTML = '';

  if (!window.Html5Qrcode) {
    showToast('QR scanner library not loaded', 'error');
    return;
  }

  // Wait for any previous camera release before acquiring a new one
  scanStopPromise = scanStopPromise.then(async () => {
    try {
      html5QrCode = new Html5Qrcode('qr-reader');
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          showScanResult(true, decodedText);
          stopScanner();
        },
        () => {} // Per-frame errors ignored — decoding continues
      );
      isScanning = true;
      const startBtn = $('#startScanBtn');
      startBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
        Stop Camera
      `;
      startBtn.classList.remove('btn-primary');
      startBtn.classList.add('btn-outline');
    } catch (err) {
      console.error('Scanner error:', err);
      showToast('Could not access camera. Check permissions and try again.', 'error');
      isScanning = false;
    }
  });
  return scanStopPromise;
}

/**
 * Decode a QR code from an uploaded image.
 * Strategy:
 *   1. Stop webcam first to free #qr-reader
 *   2. Preprocess the image (downscale + contrast boost) via canvas
 *   3. Try scanning the processed image on a DEDICATED container
 *   4. On failure, retry once with a high-contrast binarized version
 */
function scanUploadedImage(file) {
  if (!file) return;

  if (!window.Html5Qrcode) {
    showToast('QR scanner library not loaded', 'error');
    return;
  }

  const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'];
  if (!validTypes.includes(file.type)) {
    showToast('Please upload a valid image (PNG, JPG, WEBP)', 'error');
    return;
  }

  stopScanner().then(async () => {
    const fileScanArea = $('#fileScanArea');
    fileScanArea.innerHTML = '';

    // Show a loading state
    const loadingEl = document.createElement('div');
    loadingEl.className = 'scan-progress';
    loadingEl.innerHTML = '<div class="spinner"></div><p>Scanning image...</p>';
    fileScanArea.appendChild(loadingEl);

    try {
      // 1. Preprocess: downscale large images, boost contrast
      const processed = await preprocessImage(file);
      if (!processed) throw new Error('Could not process image');

      // 2. Show the image the user uploaded for visual feedback
      const thumb = document.createElement('img');
      thumb.src = processed.dataUrl;
      thumb.className = 'scan-preview-img';
      thumb.alt = 'Uploaded QR image preview';
      fileScanArea.innerHTML = '';
      fileScanArea.appendChild(thumb);

      // 3. Create a DEDICATED hidden scan surface. Preview and scan
      //    surfaces are separate so html5-qrcode never collides with
      //    the visible thumbnail above. The surface needs a real
      //    element ID because Html5Qrcode only accepts an ID string.
      const scanSurface = document.createElement('div');
      scanSurface.id = 'fileScanSurface';
      scanSurface.style.display = 'none';
      fileScanArea.appendChild(scanSurface);

      // 4. Attempt #1 — preprocessed image
      try {
        const decodedText = await scanBlobOnSurface(processed.blob, 'fileScanSurface');
        showScanResult(true, decodedText);
        return;
      } catch (e) {
        // 5. Attempt #2 — binarized high-contrast fallback
        try {
          const binarized = await binarizeImage(processed.dataUrl);
          if (!binarized) throw new Error('binarize failed');
          const decodedText = await scanBlobOnSurface(binarized, 'fileScanSurface');
          showScanResult(true, decodedText);
          return;
        } catch (e2) {
          // 6. Attempt #3 — jsQR fallback (pure JS decoder)
          try {
            const decodedText = await decodeWithJsQR(processed.dataUrl);
            if (!decodedText) throw new Error('jsQR failed');
            showScanResult(true, decodedText);
            return;
          } catch (e3) {
            throw new Error('decode failed');
          }
        }
      }
    } catch (err) {
      console.error('Scan failed:', err);
      showScanResult(false, 'Could not decode a QR code from this image. Try a clearer, well-lit photo or a screenshot.');
    } finally {
      const spinners = fileScanArea.querySelectorAll('.scan-progress');
      spinners.forEach(s => s.remove());
    }
  });
}

/**
 * Scan a single Blob using html5-qrcode's scanFile bound to the
 * element with the given ID. Cleans up the instance after each attempt.
 */
async function scanBlobOnSurface(blob, surfaceId) {
  const scanner = new Html5Qrcode(surfaceId);
  try {
    const decodedText = await scanner.scanFile(blob, false);
    return decodedText;
  } finally {
    try {
      await scanner.clear();
    } catch (clearErr) {
      // Already cleaned up
    }
  }
}

/**
 * Preprocess an uploaded image: downscale to max 800px, apply
 * slight contrast/saturation boost, and return { dataUrl, blob }.
 */
function preprocessImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const scale = MAX / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Boost contrast slightly for better decode
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const contrast = 1.15;
        const brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          data[i]     = ((data[i] - 128) * contrast + 128 + brightness);
          data[i + 1] = ((data[i + 1] - 128) * contrast + 128 + brightness);
          data[i + 2] = ((data[i + 2] - 128) * contrast + 128 + brightness);
        }
        ctx.putImageData(imageData, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');
        canvas.toBlob((blob) => {
          resolve({ dataUrl, blob });
        }, 'image/png', 0.92);
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert an image to a high-contrast grayscale binary version
 * — often the difference between "Invalid QR" and a successful decode.
 */
function binarizeImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Adaptive threshold (Otsu-like)
      let sum = 0;
      const n = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += gray;
        data[i] = data[i + 1] = data[i + 2] = gray;
      }
      const threshold = sum / n;

      for (let i = 0; i < data.length; i += 4) {
        const v = data[i] > threshold ? 255 : 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
      }
      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Decode a QR code from a data URL using the jsQR library.
 * jsQR works synchronously on raw pixel data, so we draw the
 * image to a canvas, extract ImageData, and run the decoder.
 * Falls back gracefully (returns null) if jsQR is not loaded.
 */
function decodeWithJsQR(dataUrl) {
  return new Promise((resolve) => {
    if (!window.jsQR) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });
        resolve(result ? result.data : null);
      } catch (e) {
        console.error('jsQR decode error:', e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function showScanResult(success, text) {
  const resultEl = $('#scanResult');
  const iconEl = $('#resultIcon');
  const textEl = $('#resultText');
  const contentEl = $('#resultContent');
  const decodedEl = $('#decodedContent');

  resultEl.classList.remove('hidden');
  resultEl.classList.remove('success', 'error');

  if (success) {
    resultEl.classList.add('success');
    iconEl.textContent = '✔';
    textEl.textContent = '✔ Scan Successful';
    contentEl.classList.remove('hidden');
    decodedEl.textContent = text;
  } else {
    resultEl.classList.add('error');
    iconEl.textContent = '✕';
    textEl.textContent = '❌ Invalid QR';
    contentEl.classList.add('hidden');
  }
}

// ===== Customization Events =====
function setupCustomizationEvents() {
  const inputs = [
    'qrSize', 'qrMargin', 'fgColor', 'bgColor', 'dotStyle',
    'eyeStyle', 'eyeColor', 'ecLevel', 'gradientColor1', 'gradientColor2',
    'logoSize', 'gradientEnabled', 'transparentBg'
  ];

  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        // Update value labels
        if (id === 'qrSize') $('#qrSizeValue').textContent = el.value;
        if (id === 'qrMargin') $('#qrMarginValue').textContent = el.value;
        if (id === 'logoSize') $('#logoSizeValue').textContent = el.value + '%';

        // Toggle gradient options
        if (id === 'gradientEnabled') {
          $('#gradientOptions').classList.toggle('visible', el.checked);
          $('#gradientOptions2').classList.toggle('visible', el.checked);
        }

        if (state.generated) updateQRCode();
      });
      el.addEventListener('change', () => {
        if (state.generated) updateQRCode();
      });
    }
  });

  // Logo upload
  $('#logoUpload').addEventListener('change', (e) => {
    handleLogoUpload(e.target.files[0]);
  });

  $('#uploadLogoBtn').addEventListener('click', () => {
    $('#logoUpload').click();
  });

  $('#removeLogoBtn').addEventListener('click', removeLogo);
}

// ===== Event Listeners =====
function setupEventListeners() {
  // Navigation — single loop handles type switch + mobile sidebar close
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      switchType(item.dataset.type);
      if (window.innerWidth <= 768) {
        $('#sidebar').classList.remove('open');
        $('#sidebarOverlay').classList.remove('active');
      }
    });
  });

  // Helper to toggle the sidebar + overlay together
  function toggleSidebar() {
    const isOpen = $('#sidebar').classList.toggle('open');
    $('#sidebarOverlay').classList.toggle('active', isOpen);
  }

  function closeSidebar() {
    $('#sidebar').classList.remove('open');
    $('#sidebarOverlay').classList.remove('active');
  }

  // In-sidebar toggle button (visible on desktop when sidebar is collapsible)
  $('#sidebarToggle').addEventListener('click', toggleSidebar);

  // Mobile hamburger button (always visible on mobile, outside the sidebar)
  $('#mobileMenuBtn').addEventListener('click', toggleSidebar);

  // Backdrop overlay click closes sidebar
  $('#sidebarOverlay').addEventListener('click', closeSidebar);

  // Generate button
  $('#generateBtn').addEventListener('click', () => {
    const validation = validateCurrentForm();
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }
    updateQRCode();
    showToast('QR Generated', 'success');
  });

  // Clear button
  $('#clearBtn').addEventListener('click', () => {
    clearAllFields();
  });

  // Click QR preview to open the encoded URL / perform action
  $('#qrContainer').addEventListener('click', openQRContent);

  // Action buttons
  $('#downloadPng').addEventListener('click', downloadPNG);
  $('#downloadSvg').addEventListener('click', downloadSVG);
  $('#downloadJpeg').addEventListener('click', downloadJPEG);
  $('#downloadPdf').addEventListener('click', downloadPDF);
  $('#copyImage').addEventListener('click', copyImage);
  $('#printBtn').addEventListener('click', printQR);
  $('#shareBtn').addEventListener('click', shareQR);

  // New button
  $('#newBtn').addEventListener('click', () => {
    clearAllFields();
    showToast('Ready for new QR code', 'info');
  });

  // History button
  $('#historyBtn').addEventListener('click', () => {
    $('#historyModal').classList.remove('hidden');
    renderHistory('');
  });

  // History search
  $('#historySearch').addEventListener('input', (e) => {
    renderHistory(e.target.value);
  });

  // History grid click handling
  $('#historyGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = parseInt(btn.dataset.id);
    const action = btn.dataset.action;

    switch (action) {
      case 'reuse':
        reuseHistoryItem(id);
        break;
      case 'favorite':
        toggleFavorite(id);
        break;
      case 'delete':
        deleteHistoryItem(id);
        break;
    }
  });

  // Scan button
  $('#scanBtn').addEventListener('click', openScanModal);

  // Scan modal close
  $('#closeScanModal').addEventListener('click', closeScanModal);

  // Scan tabs
  $('#webcamTab').addEventListener('click', () => {
    $('#webcamTab').classList.add('active');
    $('#uploadTab').classList.remove('active');
    $('#webcamScan').classList.remove('hidden');
    $('#uploadScan').classList.add('hidden');
    stopScanner();
  });

  $('#uploadTab').addEventListener('click', () => {
    $('#uploadTab').classList.add('active');
    $('#webcamTab').classList.remove('active');
    $('#uploadScan').classList.remove('hidden');
    $('#webcamScan').classList.add('hidden');
    stopScanner();
  });

  // Start scan button
  $('#startScanBtn').addEventListener('click', () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  });

  // Scan upload zone
  $('#scanUploadZone').addEventListener('click', () => {
    $('#scanUpload').click();
  });

  $('#scanUpload').addEventListener('change', (e) => {
    scanUploadedImage(e.target.files[0]);
  });

  // Close modals on overlay click
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
        if (overlay.id === 'scanModal') stopScanner();
      }
    });
  });

  // Close history modal
  $('#closeHistoryModal').addEventListener('click', () => {
    $('#historyModal').classList.add('hidden');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape closes modals
    if (e.key === 'Escape') {
      $$('.modal-overlay').forEach(m => {
        if (!m.classList.contains('hidden')) {
          m.classList.add('hidden');
          if (m.id === 'scanModal') stopScanner();
        }
      });
    }

    // Ctrl/Cmd + S generates
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      $('#generateBtn').click();
    }
  });

  // Click outside sidebar to close on mobile (overlay handles most cases; this is a fallback)
  document.addEventListener('click', (e) => {
    const sidebar = $('#sidebar');
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !$('#mobileMenuBtn').contains(e.target)) {
        closeSidebar();
      }
    }
  });
}

/**
 * Clicking the generated QR opens/executes its content:
 * - http(s) / wa.me links → open in new tab
 * - mailto → compose email
 * - tel / SMSTO → dial or SMS
 * - WIFI / vCard / Event / plain text → show a dialog with content
 */
function openQRContent() {
  if (!state.generated || !state.qrData) return;

  const data = state.qrData;

  if (/^https?:\/\//i.test(data) || data.startsWith('https://wa.me') || data.startsWith('http://wa.me')) {
    window.open(data, '_blank', 'noopener');
    showToast('Opening link...', 'info', 1500);
  } else if (data.startsWith('mailto:')) {
    window.location.href = data;
    showToast('Opening email client...', 'info', 1500);
  } else if (data.startsWith('tel:')) {
    window.open(data, '_blank', 'noopener');
    showToast('Dialing number...', 'info', 1500);
  } else if (data.startsWith('SMSTO:')) {
    // SMSTO:+123:Hello → sms:+123?body=Hello
    const match = data.match(/^SMSTO:([^:]+)(?::(.*))?$/);
    if (match) {
      const smsUrl = `sms:${match[1]}${match[2] ? '?body=' + encodeURIComponent(match[2]) : ''}`;
      window.location.href = smsUrl;
      showToast('Opening SMS app...', 'info', 1500);
    }
  } else {
    // WIFI / vCard / Event / plain text → show content in a popup
    showQRContentDialog(data);
  }
}

/**
 * Displays the QR content in a small modal so users can inspect
 * non-URL payloads (WiFi configs, vCards, calendar events, text).
 */
function showQRContentDialog(content) {
  const existing = $('#qrContentDialog');
  if (existing) existing.remove();

  const dialog = document.createElement('div');
  dialog.id = 'qrContentDialog';
  dialog.className = 'modal-overlay';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'QR code content');

  dialog.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>QR Content</h2>
        <button type="button" class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <pre class="qr-content-preview">${escapeHtml(content)}</pre>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" id="copyContentBtn">Copy Content</button>
        <button type="button" class="btn btn-outline" id="closeContentBtn">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);

  dialog.querySelector('.modal-close').addEventListener('click', () => dialog.remove());
  dialog.querySelector('#closeContentBtn').addEventListener('click', () => dialog.remove());
  dialog.querySelector('#copyContentBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(content);
      showToast('Content copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy content', 'error');
    }
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.remove();
  });
}

function clearAllFields() {
  const def = formDefinitions[state.currentType];
  const formBody = $('#formBody');

  // Clear all inputs
  formBody.querySelectorAll('input[type="text"], input[type="url"], input[type="email"], input[type="tel"], textarea').forEach(el => {
    el.value = '';
  });
  formBody.querySelectorAll('input[type="checkbox"]').forEach(el => {
    el.checked = false;
  });

  // Reset
  state.qrData = '';
  state.generated = false;
  resetPreview();
  enableActionButtons(false);
  removeLogo();

  // Focus first field
  const firstInput = formBody.querySelector('input, textarea, select');
  if (firstInput) firstInput.focus();
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
  // Initial state
  state.currentType = 'text';

  // Setup
  setupCustomizationEvents();
  setupEventListeners();

  // Render initial form
  switchType('text');

  // Disable action buttons initially
  enableActionButtons(false);

  // Check for URL hash for direct dashboard access
  if (window.location.hash === '#generator') {
    showDashboard();
  }

  console.log('🚀 QRVerse initialized successfully');
});