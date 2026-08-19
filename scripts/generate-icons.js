/**
 * HyperClick Pro 2026 - Icon & Visual Asset Generator
 * Generates:
 *  - public/icon.svg (Vector High-Tech 2026 Gaming & Automation Logo)
 *  - public/icon.png (512x512 Ultra-Crisp Master PNG)
 *  - public/icon-256.png (256x256 PNG)
 *  - public/icon-128.png (128x128 PNG)
 *  - public/icon-64.png  (64x64 PNG)
 *  - public/icon-32.png  (32x32 PNG)
 *  - public/icon-16.png  (16x16 PNG)
 *  - public/icon.ico     (Multi-Resolution Windows Icon: 16, 32, 48, 64, 128, 256)
 *  - installer/icon.ico  (NSIS Installer icon)
 *  - installer/installerHeaderIcon.ico
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directories exist
const publicDir = path.resolve(__dirname, '../public');
const installerDir = path.resolve(__dirname, '../installer');

[publicDir, installerDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/* ==========================================================================
   1. GENERATE SVG ICON (High-Tech 2026 Cyberpunk Lightning Cursor)
   ========================================================================== */
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#141E30" />
      <stop offset="60%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#050811" />
    </radialGradient>

    <!-- Neon Rim Gradient -->
    <linearGradient id="neonRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="35%" stop-color="#4FACFE" />
      <stop offset="70%" stop-color="#7F00FF" />
      <stop offset="100%" stop-color="#FF007F" />
    </linearGradient>

    <!-- Inner Shield Gradient -->
    <linearGradient id="shieldGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <!-- Lightning Bolt Gradient -->
    <linearGradient id="lightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="25%" stop-color="#00FFFF" />
      <stop offset="60%" stop-color="#00D2FF" />
      <stop offset="100%" stop-color="#3A7BD5" />
    </linearGradient>

    <!-- Cursor Pointer Gradient -->
    <linearGradient id="cursorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="30%" stop-color="#7000FF" />
      <stop offset="85%" stop-color="#D946EF" />
      <stop offset="100%" stop-color="#EC4899" />
    </linearGradient>

    <!-- Laser Gold Energy Accent -->
    <linearGradient id="energyGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE000" />
      <stop offset="100%" stop-color="#799F0C" />
    </linearGradient>

    <!-- Drop Glow Filter -->
    <filter id="hyperGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur1" />
      <feGaussianBlur stdDeviation="24" result="blur2" />
      <feMerge>
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="boltGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComponentTransfer in="blur" result="glow">
        <feFuncA type="linear" slope="1.5" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Base Dark Canvas with Rounded Squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGlow)" />

  <!-- Outer Cyber Hexagon / Shield Base -->
  <path d="M 256,36 L 444,116 L 444,352 L 256,476 L 68,352 L 68,116 Z"
        fill="url(#shieldGrad)"
        stroke="url(#neonRim)"
        stroke-width="7"
        stroke-linejoin="round"
        filter="url(#hyperGlow)" />

  <!-- Inner HUD Grid Lines & Reticle Arcs -->
  <circle cx="256" cy="256" r="148" fill="none" stroke="#00F2FE" stroke-width="1.5" stroke-dasharray="14 10" opacity="0.35" />
  <circle cx="256" cy="256" r="182" fill="none" stroke="#7F00FF" stroke-width="1" stroke-dasharray="6 8" opacity="0.25" />
  
  <!-- Crosshairs -->
  <line x1="256" y1="64" x2="256" y2="100" stroke="#00F2FE" stroke-width="3" opacity="0.8" />
  <line x1="256" y1="412" x2="256" y2="448" stroke="#00F2FE" stroke-width="3" opacity="0.8" />
  <line x1="96" y1="256" x2="132" y2="256" stroke="#7F00FF" stroke-width="3" opacity="0.8" />
  <line x1="380" y1="256" x2="416" y2="256" stroke="#7F00FF" stroke-width="3" opacity="0.8" />

  <!-- Corner Tech Accents -->
  <circle cx="256" cy="36" r="5" fill="#00FFFF" />
  <circle cx="444" cy="116" r="5" fill="#00F2FE" />
  <circle cx="444" cy="352" r="5" fill="#7F00FF" />
  <circle cx="256" cy="476" r="5" fill="#FF007F" />
  <circle cx="68" cy="352" r="5" fill="#7F00FF" />
  <circle cx="68" cy="116" r="5" fill="#00F2FE" />

  <!-- 2026 Stealth Cursor (Upper-Left Wing) -->
  <path d="M 168,140 L 320,270 L 250,285 L 295,376 L 252,396 L 208,306 L 168,348 Z"
        fill="url(#cursorGrad)"
        stroke="#FFFFFF"
        stroke-width="4"
        stroke-linejoin="round"
        opacity="0.95"
        filter="url(#hyperGlow)" />

  <!-- Central Supercharged Lightning Bolt (Cutting through speed) -->
  <path d="M 284,92 L 180,248 L 246,248 L 204,420 L 344,228 L 274,228 Z"
        fill="url(#lightningGrad)"
        stroke="#FFFFFF"
        stroke-width="3.5"
        stroke-linejoin="miter"
        filter="url(#boltGlow)" />

  <!-- High-Energy Impact Spark / Core Burst -->
  <circle cx="256" cy="244" r="16" fill="#FFFFFF" opacity="0.9" filter="url(#boltGlow)" />
  <circle cx="256" cy="244" r="7" fill="#00FFFF" />

  <!-- Speed Shockwave Wings -->
  <path d="M 330,170 Q 370,200 388,256 Q 370,312 330,342"
        fill="none"
        stroke="#00FFFF"
        stroke-width="4"
        stroke-linecap="round"
        opacity="0.8" />
  <path d="M 360,195 Q 395,225 408,256 Q 395,287 360,317"
        fill="none"
        stroke="#FF007F"
        stroke-width="3"
        stroke-linecap="round"
        opacity="0.6" />

  <!-- Futuristic "PRO" Monogram Badge at Bottom Center -->
  <rect x="206" y="420" width="100" height="26" rx="6" fill="#090d16" stroke="#00F2FE" stroke-width="1.5" />
  <text x="256" y="438" font-family="'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" font-weight="900" font-size="14" fill="#00FFFF" text-anchor="middle" letter-spacing="4">2026 PRO</text>
</svg>
`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon, 'utf8');
console.log('✓ Created public/icon.svg');

/* ==========================================================================
   2. PURE JAVASCRIPT RASTER GRAPHICS & PNG ENCODER (Zero External Deps)
   ========================================================================== */

// Helper: CRC32 Table
const CRC32_TABLE = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC32_TABLE[i] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = CRC32_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

/**
 * Encodes RGBA raw pixel buffer into standard compliant PNG file buffer.
 */
function encodePNG(width, height, rgbaBuffer) {
  const scanlineLength = width * 4 + 1; // 1 filter byte (0 = None) + RGBA pixels
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rawOffset = y * scanlineLength;
    rawData[rawOffset] = 0; // Filter: None
    const srcOffset = y * width * 4;
    rgbaBuffer.copy(rawData, rawOffset + 1, srcOffset, srcOffset + width * 4);
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // Color type 6: RGBA
  ihdrData[10] = 0; // Compression (deflate)
  ihdrData[11] = 0; // Filter (standard)
  ihdrData[12] = 0; // Interlace (none)
  const ihdrChunk = createPNGChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = createPNGChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createPNGChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createPNGChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

/**
 * Procedural 2026 HyperClick RGBA Canvas Renderer
 */
class RGBAImage {
  constructor(size) {
    this.size = size;
    this.buffer = Buffer.alloc(size * size * 4, 0);
  }

  setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return;
    const idx = (Math.floor(y) * this.size + Math.floor(x)) * 4;
    if (a >= 255) {
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = 255;
    } else if (a > 0) {
      const alpha = a / 255;
      const invAlpha = 1 - alpha;
      const prevR = this.buffer[idx];
      const prevG = this.buffer[idx + 1];
      const prevB = this.buffer[idx + 2];
      const prevA = this.buffer[idx + 3] / 255;

      const outA = alpha + prevA * invAlpha;
      if (outA > 0) {
        this.buffer[idx] = Math.round((r * alpha + prevR * prevA * invAlpha) / outA);
        this.buffer[idx + 1] = Math.round((g * alpha + prevG * prevA * invAlpha) / outA);
        this.buffer[idx + 2] = Math.round((b * alpha + prevB * prevA * invAlpha) / outA);
        this.buffer[idx + 3] = Math.round(outA * 255);
      }
    }
  }

  getPixel(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return [0, 0, 0, 0];
    const idx = (y * this.size + x) * 4;
    return [
      this.buffer[idx],
      this.buffer[idx + 1],
      this.buffer[idx + 2],
      this.buffer[idx + 3]
    ];
  }
}

/**
 * Draws the complete HyperClick Pro logo onto a canvas of given size.
 */
function renderLogoCanvas(size) {
  const img = new RGBAImage(size);
  const scale = size / 512;
  const center = size / 2;

  // 1. Background Rounded Squircle with Dark Metallic Radial Gradient
  const radius = 100 * scale;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Rounded rect distance
      const dx = Math.max(0, Math.abs(x - center) - (center - radius));
      const dy = Math.max(0, Math.abs(y - center) - (center - radius));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Compute radial gradient
        const dCenter = Math.hypot(x - center, y - center) / (size * 0.7);
        const t = Math.min(1, Math.max(0, dCenter));

        // Color interpolation: #141E30 (20, 30, 48) -> #070B14 (7, 11, 20)
        const r = Math.round(20 * (1 - t) + 7 * t);
        const g = Math.round(30 * (1 - t) + 11 * t);
        const b = Math.round(48 * (1 - t) + 20 * t);
        
        // Edge anti-aliasing
        const edgeAlpha = dist > (radius - 1) ? Math.max(0, 1 - (dist - (radius - 1))) : 1;
        img.setPixel(x, y, r, g, b, Math.round(edgeAlpha * 255));
      }
    }
  }

  // 2. Neon Hexagonal Frame / Shield
  const hexPoints = [
    [256, 42],
    [440, 120],
    [440, 350],
    [256, 470],
    [72, 350],
    [72, 120]
  ].map(pt => [pt[0] * scale, pt[1] * scale]);

  function pointInPolygon(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  function distToPolyline(px, py, poly) {
    let minDist = 999999;
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      const d = distToSegment(px, py, p1[0], p1[1], p2[0], p2[1]);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  // Draw Shield Fill & Glowing Neon Border
  const borderWidth = Math.max(2, 6 * scale);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inside = pointInPolygon(x, y, hexPoints);
      const dBorder = distToPolyline(x, y, hexPoints);

      if (inside && dBorder > borderWidth) {
        // Dark metallic shield interior: #0d1424 -> #030712
        const t = y / size;
        const sr = Math.round(18 * (1 - t) + 4 * t);
        const sg = Math.round(28 * (1 - t) + 8 * t);
        const sb = Math.round(45 * (1 - t) + 18 * t);
        img.setPixel(x, y, sr, sg, sb, 255);
      }

      // Neon Rim Glow
      if (dBorder <= borderWidth + (10 * scale)) {
        const glowFactor = Math.max(0, 1 - (dBorder / (borderWidth + 10 * scale)));
        // Gradient along Y: Cyan (0, 242, 254) -> Purple (127, 0, 255) -> Pink (255, 0, 128)
        const prog = y / size;
        let nr, ng, nb;
        if (prog < 0.5) {
          const u = prog * 2;
          nr = Math.round(0 * (1 - u) + 127 * u);
          ng = Math.round(242 * (1 - u) + 0 * u);
          nb = Math.round(254 * (1 - u) + 255 * u);
        } else {
          const u = (prog - 0.5) * 2;
          nr = Math.round(127 * (1 - u) + 255 * u);
          ng = Math.round(0 * (1 - u) + 0 * u);
          nb = Math.round(255 * (1 - u) + 128 * u);
        }

        const alpha = dBorder <= borderWidth ? 1 : glowFactor * 0.8;
        img.setPixel(x, y, nr, ng, nb, Math.round(alpha * 255));
      }
    }
  }

  // 3. Central Lightning Bolt Polygon & Glowing Core
  const boltPoly = [
    [284, 92],
    [180, 248],
    [246, 248],
    [204, 420],
    [344, 228],
    [274, 228]
  ].map(pt => [pt[0] * scale, pt[1] * scale]);

  // 4. Cursor Wing Poly
  const cursorPoly = [
    [168, 140],
    [320, 270],
    [250, 285],
    [295, 376],
    [252, 396],
    [208, 306],
    [168, 348]
  ].map(pt => [pt[0] * scale, pt[1] * scale]);

  // Render Cursor Polygon with Magenta/Violet Glow
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inCursor = pointInPolygon(x, y, cursorPoly);
      const dCursor = distToPolyline(x, y, cursorPoly);

      if (inCursor) {
        const u = x / size;
        const cr = Math.round(160 * (1 - u) + 236 * u);
        const cg = Math.round(40 * (1 - u) + 72 * u);
        const cb = Math.round(255 * (1 - u) + 153 * u);
        img.setPixel(x, y, cr, cg, cb, 230);
      } else if (dCursor < 8 * scale) {
        const a = (1 - (dCursor / (8 * scale))) * 0.7;
        img.setPixel(x, y, 217, 70, 239, Math.round(a * 255));
      }
    }
  }

  // Render Lightning Bolt with Electric Cyan / Pure White Core & Outer Glow
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inBolt = pointInPolygon(x, y, boltPoly);
      const dBolt = distToPolyline(x, y, boltPoly);

      if (inBolt) {
        // High voltage electric core: White / Cyan gradient
        const t = Math.min(1, dBolt / (12 * scale));
        const lr = Math.round(255 * (1 - t) + 0 * t);
        const lg = Math.round(255 * (1 - t) + 242 * t);
        const lb = Math.round(255 * (1 - t) + 254 * t);
        img.setPixel(x, y, lr, lg, lb, 255);
      } else if (dBolt < 14 * scale) {
        const glowA = Math.pow(1 - (dBolt / (14 * scale)), 2) * 0.95;
        img.setPixel(x, y, 0, 242, 254, Math.round(glowA * 255));
      }
    }
  }

  // 5. Central High-Intensity Spark Core
  const sparkX = 256 * scale;
  const sparkY = 244 * scale;
  const sparkR = 14 * scale;
  for (let y = Math.floor(sparkY - sparkR * 2); y <= Math.ceil(sparkY + sparkR * 2); y++) {
    for (let x = Math.floor(sparkX - sparkR * 2); x <= Math.ceil(sparkX + sparkR * 2); x++) {
      const d = Math.hypot(x - sparkX, y - sparkY);
      if (d <= sparkR * 2) {
        const intense = Math.max(0, 1 - (d / (sparkR * 2)));
        if (d <= sparkR * 0.5) {
          img.setPixel(x, y, 255, 255, 255, 255);
        } else {
          img.setPixel(x, y, 0, 255, 255, Math.round(intense * 240));
        }
      }
    }
  }

  return img;
}

/* ==========================================================================
   3. GENERATE PNG IMAGES (512, 256, 128, 64, 48, 32, 16)
   ========================================================================== */
const resolutions = [512, 256, 128, 64, 48, 32, 16];
const pngBuffers = {};

resolutions.forEach(res => {
  const canvas = renderLogoCanvas(res);
  const pngBuf = encodePNG(res, res, canvas.buffer);
  pngBuffers[res] = pngBuf;

  const fileName = res === 512 ? 'icon.png' : `icon-${res}.png`;
  fs.writeFileSync(path.join(publicDir, fileName), pngBuf);
  console.log(`✓ Created public/${fileName} (${res}x${res})`);
});

// Also create 256x256 copy in installer/
fs.writeFileSync(path.join(installerDir, 'icon.png'), pngBuffers[256]);

/* ==========================================================================
   4. GENERATE MULTI-RESOLUTION WINDOWS .ICO FILE
   ========================================================================== */
/**
 * Assembles an ICO container containing multi-resolution PNG images.
 * Supported by Windows Vista, 7, 8, 10, 11, 2026+.
 */
function createIcoFile(images) {
  const count = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let currentOffset = headerSize + (dirEntrySize * count);

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);      // Reserved
  header.writeUInt16LE(1, 2);      // ICO Type = 1
  header.writeUInt16LE(count, 4);  // Image Count

  const entries = [];
  const imageBuffers = [];

  images.forEach(img => {
    const entry = Buffer.alloc(dirEntrySize);
    const w = img.size >= 256 ? 0 : img.size;
    const h = img.size >= 256 ? 0 : img.size;
    const len = img.buffer.length;

    entry.writeUInt8(w, 0);              // Width
    entry.writeUInt8(h, 1);              // Height
    entry.writeUInt8(0, 2);              // Color palette (0 = none)
    entry.writeUInt8(0, 3);              // Reserved
    entry.writeUInt16LE(1, 4);           // Color planes
    entry.writeUInt16LE(32, 6);          // Bits per pixel
    entry.writeUInt32LE(len, 8);         // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Offset to image data

    entries.push(entry);
    imageBuffers.push(img.buffer);
    currentOffset += len;
  });

  return Buffer.concat([header, ...entries, ...imageBuffers]);
}

const icoResolutions = [256, 128, 64, 48, 32, 16];
const icoImages = icoResolutions.map(size => ({
  size: size,
  buffer: pngBuffers[size]
}));

const icoBuffer = createIcoFile(icoImages);

fs.writeFileSync(path.join(publicDir, 'icon.ico'), icoBuffer);
console.log('✓ Created public/icon.ico (Multi-res 16, 32, 48, 64, 128, 256)');

fs.writeFileSync(path.join(installerDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(installerDir, 'installerHeaderIcon.ico'), icoBuffer);
console.log('✓ Created installer/icon.ico & installer/installerHeaderIcon.ico');

console.log('\n✨ All HyperClick Pro 2026 icons generated successfully!\n');
