const fs = require('fs');
const zlib = require('zlib');

const srcPath = 'C:/Users/thanh/.gemini/antigravity-ide/brain/5452994d-8dca-4024-87f1-2913440f968d/media__1784692557946.png';
const destPath = 'd:/AI/VIMES_HIS/assets/vimes_logo_tight_transparent.png';

const buf = fs.readFileSync(srcPath);

const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

// Extract IDAT chunks
let idatBufs = [];
let offset = 8;
while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') {
        idatBufs.push(buf.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
}

const idatConcat = Buffer.concat(idatBufs);
const decompressed = zlib.inflateSync(idatConcat);

const bpp = 4;
const strokeWidth = width * bpp;
const lineLen = 1 + strokeWidth;

// Reconstruct un-filtered raw pixels
const rawPixels = Buffer.alloc(width * height * 4);

let prevLine = Buffer.alloc(strokeWidth);
for (let y = 0; y < height; y++) {
    const lineStart = y * lineLen;
    const filterType = decompressed[lineStart];
    const currentRawLine = Buffer.alloc(strokeWidth);

    for (let x = 0; x < strokeWidth; x++) {
        const rawVal = decompressed[lineStart + 1 + x];
        let reconVal = 0;
        if (filterType === 0) { // None
            reconVal = rawVal;
        } else if (filterType === 1) { // Sub
            const left = x >= bpp ? currentRawLine[x - bpp] : 0;
            reconVal = (rawVal + left) & 0xff;
        } else if (filterType === 2) { // Up
            const up = prevLine[x];
            reconVal = (rawVal + up) & 0xff;
        } else if (filterType === 3) { // Average
            const left = x >= bpp ? currentRawLine[x - bpp] : 0;
            const up = prevLine[x];
            reconVal = (rawVal + Math.floor((left + up) / 2)) & 0xff;
        } else if (filterType === 4) { // Paeth
            const a = x >= bpp ? currentRawLine[x - bpp] : 0; // left
            const b = prevLine[x]; // up
            const c = x >= bpp ? prevLine[x - bpp] : 0; // upper-left
            const p = a + b - c;
            const pa = Math.abs(p - a);
            const pb = Math.abs(p - b);
            const pc = Math.abs(p - c);
            let pr = 0;
            if (pa <= pb && pa <= pc) pr = a;
            else if (pb <= pc) pr = b;
            else pr = c;
            reconVal = (rawVal + pr) & 0xff;
        }
        currentRawLine[x] = reconVal;
    }
    currentRawLine.copy(rawPixels, y * strokeWidth);
    prevLine = currentRawLine;
}

// Find bounding box of non-white content & make background white pixels transparent
let minX = width, maxX = 0, minY = height, maxY = 0;

for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = rawPixels[idx];
        const g = rawPixels[idx + 1];
        const b = rawPixels[idx + 2];
        const a = rawPixels[idx + 3];

        // Is it background white/near white?
        const isWhite = r > 240 && g > 240 && b > 240;

        if (isWhite || a < 10) {
            // Make transparent!
            rawPixels[idx + 3] = 0;
        } else {
            // Content pixel!
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
}

// Add padding of 5px around bounding box
minX = Math.max(0, minX - 5);
minY = Math.max(0, minY - 5);
maxX = Math.min(width - 1, maxX + 5);
maxY = Math.min(height - 1, maxY + 5);

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

console.log(`Cropping from original (${width}x${height}) to tight bounds (${cropW}x${cropH})`);

// Create new cropped image payload
const croppedLineLen = 1 + cropW * 4;
const croppedData = Buffer.alloc(cropH * croppedLineLen);

for (let y = 0; y < cropH; y++) {
    const srcY = minY + y;
    const destLineStart = y * croppedLineLen;
    croppedData[destLineStart] = 0; // Filter None

    for (let x = 0; x < cropW; x++) {
        const srcX = minX + x;
        const srcIdx = (srcY * width + srcX) * 4;
        const destIdx = destLineStart + 1 + x * 4;

        croppedData[destIdx] = rawPixels[srcIdx];
        croppedData[destIdx + 1] = rawPixels[srcIdx + 1];
        croppedData[destIdx + 2] = rawPixels[srcIdx + 2];
        croppedData[destIdx + 3] = rawPixels[srcIdx + 3];
    }
}

// Encode to PNG helper
function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, body, crcBuf]);
}

function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c;
    }
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
}

const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// IHDR chunk
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(cropW, 0);
ihdr.writeUInt32BE(cropH, 4);
ihdr[8] = 8; // Bit depth
ihdr[9] = 6; // Color type RGBA
ihdr[10] = 0; // Compression
ihdr[11] = 0; // Filter
ihdr[12] = 0; // Interlace
const ihdrChunk = makeChunk('IHDR', ihdr);

// IDAT chunk
const compressedIdat = zlib.deflateSync(croppedData);
const idatChunk = makeChunk('IDAT', compressedIdat);

// IEND chunk
const iendChunk = makeChunk('IEND', Buffer.alloc(0));

const finalPng = Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
fs.writeFileSync(destPath, finalPng);
console.log('🎉 Successfully saved tight transparent logo to:', destPath);
