/**
 * Genera assets/icon.ico para el instalador de DeployTime
 * Sin dependencias externas - usa formato BMP nativo de ICO
 */
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

/**
 * Crea datos BMP de 32bpp para incluir en el ICO.
 * Dibuja un ícono simple con fondo azul y un círculo blanco.
 */
function createBmpData(size) {
  const pixelDataSize = size * size * 4; // BGRA
  const andMaskRowBytes = Math.ceil(Math.ceil(size / 8) / 4) * 4;
  const andMaskSize = andMaskRowBytes * size;
  const bmpSize = 40 + pixelDataSize + andMaskSize;

  const bmp = Buffer.alloc(bmpSize, 0);
  let off = 0;

  // BITMAPINFOHEADER
  bmp.writeUInt32LE(40, off); off += 4;       // biSize
  bmp.writeInt32LE(size, off); off += 4;       // biWidth
  bmp.writeInt32LE(size * 2, off); off += 4;   // biHeight (x2 para ICO)
  bmp.writeUInt16LE(1, off); off += 2;          // biPlanes
  bmp.writeUInt16LE(32, off); off += 2;         // biBitCount
  bmp.writeUInt32LE(0, off); off += 4;          // biCompression (BI_RGB)
  bmp.writeUInt32LE(pixelDataSize, off); off += 4; // biSizeImage
  off += 16; // biXPelsPerMeter, biYPelsPerMeter, biClrUsed, biClrImportant = 0

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  // Píxeles: BMP almacena de abajo hacia arriba (BGRA)
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let R, G, B, A;

      if (dist <= r) {
        // Interior azul (color DeployTime)
        const shade = 1 - (dist / r) * 0.25;
        R = Math.round(30 * shade);
        G = Math.round(100 * shade);
        B = Math.round(200 * shade);
        A = 255;

        // "DT" simplificado: línea vertical y horizontal en el centro
        const inVertical = Math.abs(dx) <= size * 0.06 && Math.abs(dy) <= size * 0.28;
        const inHorizontal = Math.abs(dy) <= size * 0.06 && Math.abs(dx) <= size * 0.28;
        if (inVertical || inHorizontal) {
          R = 255; G = 255; B = 255;
        }
      } else {
        // Exterior transparente
        R = 0; G = 0; B = 0; A = 0;
      }

      bmp[off++] = B;
      bmp[off++] = G;
      bmp[off++] = R;
      bmp[off++] = A;
    }
  }

  // AND mask: 0 = opaco, 1 = transparente
  for (let y = 0; y < size; y++) {
    for (let byteX = 0; byteX < andMaskRowBytes; byteX++) {
      let maskByte = 0;
      const cx2 = size / 2;
      const cy2 = size / 2;
      const r2 = size * 0.42;
      for (let bit = 7; bit >= 0; bit--) {
        const x = byteX * 8 + (7 - bit);
        if (x < size) {
          const dx = x - cx2;
          const dy = y - cy2;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > r2) maskByte |= (1 << bit);
        } else {
          maskByte |= (1 << bit);
        }
      }
      bmp[off++] = maskByte;
    }
  }

  return bmp;
}

// Crear ICO con tamaños 16, 32, 48 y 256
const sizes = [16, 32, 48, 256];
const bitmaps = sizes.map(s => createBmpData(s));

const HEADER = 6;
const ENTRY = 16;
const totalImageBytes = bitmaps.reduce((a, b) => a + b.length, 0);
const ico = Buffer.alloc(HEADER + ENTRY * sizes.length + totalImageBytes);

let off = 0;
// ICONDIR
ico.writeUInt16LE(0, off); off += 2;
ico.writeUInt16LE(1, off); off += 2;
ico.writeUInt16LE(sizes.length, off); off += 2;

// ICONDIRENTRY
let dataOff = HEADER + ENTRY * sizes.length;
for (let i = 0; i < sizes.length; i++) {
  const sz = sizes[i];
  ico.writeUInt8(sz >= 256 ? 0 : sz, off++);
  ico.writeUInt8(sz >= 256 ? 0 : sz, off++);
  ico.writeUInt8(0, off++);
  ico.writeUInt8(0, off++);
  ico.writeUInt16LE(1, off); off += 2;
  ico.writeUInt16LE(32, off); off += 2;
  ico.writeUInt32LE(bitmaps[i].length, off); off += 4;
  ico.writeUInt32LE(dataOff, off); off += 4;
  dataOff += bitmaps[i].length;
}

// Datos de imagen
for (const bmp of bitmaps) {
  bmp.copy(ico, off);
  off += bmp.length;
}

const iconPath = path.join(assetsDir, 'icon.ico');
fs.writeFileSync(iconPath, ico);
console.log(`Icon created: ${iconPath} (${ico.length} bytes, sizes: ${sizes.join(', ')}px)`);
