import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { TemplateValidationResult, ValidationIssue } from './types';

const MAX_DOCX_BYTES = 20 * 1024 * 1024;
const MAX_ENTRIES = 2_000;
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024;
const MAX_XML_ENTRY_BYTES = 10 * 1024 * 1024;
const TAG_PATTERN = /\{d\.([^{}]+)\}/g;

type ZipEntry = { name: string; method: number; compressedSize: number; size: number; localOffset: number };

function readEntries(buffer: Buffer): ZipEntry[] {
    const min = Math.max(0, buffer.length - 65_557);
    let eocd = -1;
    for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
        if (buffer.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
    }
    if (eocd < 0) throw new Error('DOCX ZIP directory was not found');
    const count = buffer.readUInt16LE(eocd + 10);
    const centralOffset = buffer.readUInt32LE(eocd + 16);
    if (count > MAX_ENTRIES) throw new Error('DOCX contains too many ZIP entries');
    const entries: ZipEntry[] = [];
    let cursor = centralOffset;
    let totalSize = 0;
    for (let index = 0; index < count; index += 1) {
        if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid DOCX ZIP directory');
        const method = buffer.readUInt16LE(cursor + 10);
        const compressedSize = buffer.readUInt32LE(cursor + 20);
        const size = buffer.readUInt32LE(cursor + 24);
        const nameLength = buffer.readUInt16LE(cursor + 28);
        const extraLength = buffer.readUInt16LE(cursor + 30);
        const commentLength = buffer.readUInt16LE(cursor + 32);
        const localOffset = buffer.readUInt32LE(cursor + 42);
        const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8').replace(/\\/g, '/');
        if (!name || name.startsWith('/') || name.split('/').includes('..')) throw new Error('DOCX contains an unsafe ZIP path');
        totalSize += size;
        if (totalSize > MAX_UNCOMPRESSED_BYTES) throw new Error('DOCX uncompressed content is too large');
        entries.push({ name, method, compressedSize, size, localOffset });
        cursor += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
}

function extract(buffer: Buffer, entry: ZipEntry): Buffer {
    const offset = entry.localOffset;
    if (offset + 30 > buffer.length || buffer.readUInt32LE(offset) !== 0x04034b50) throw new Error('Invalid DOCX ZIP entry');
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const start = offset + 30 + nameLength + extraLength;
    const compressed = buffer.subarray(start, start + entry.compressedSize);
    if (compressed.length !== entry.compressedSize) throw new Error('Truncated DOCX ZIP entry');
    if (entry.method === 0) return compressed;
    if (entry.method === 8) return zlib.inflateRawSync(compressed, { maxOutputLength: Math.min(entry.size + 1, MAX_XML_ENTRY_BYTES) });
    throw new Error(`Unsupported DOCX ZIP compression method ${entry.method}`);
}

export function validateDocx(content: Buffer, allowedFields?: Set<string>): TemplateValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const tags = new Set<string>();
    const sha256 = crypto.createHash('sha256').update(content).digest('hex');
    if (content.length < 4 || content[0] !== 0x50 || content[1] !== 0x4b) errors.push({ code: 'INVALID_SIGNATURE', message: 'File không có chữ ký ZIP/DOCX hợp lệ.' });
    if (content.length > MAX_DOCX_BYTES) errors.push({ code: 'FILE_TOO_LARGE', message: `DOCX vượt giới hạn ${MAX_DOCX_BYTES / 1024 / 1024} MB.` });
    if (errors.length) return { valid: false, errors, warnings, tags: [], checkedAt: new Date().toISOString(), sha256, size: content.length };

    try {
        const entries = readEntries(content);
        const names = new Set(entries.map(entry => entry.name.toLowerCase()));
        if (!names.has('[content_types].xml') || !names.has('word/document.xml')) errors.push({ code: 'INVALID_OPENXML', message: 'File không chứa cấu trúc Word OpenXML bắt buộc.' });
        for (const entry of entries) {
            const lower = entry.name.toLowerCase();
            if (lower.endsWith('vbaproject.bin') || lower.includes('/embeddings/') || lower.endsWith('.ole')) errors.push({ code: 'ACTIVE_CONTENT', message: 'DOCX chứa macro hoặc đối tượng nhúng không được phép.', location: entry.name });
            const isRelevantXml = lower === 'word/document.xml' || /^word\/(header|footer)\d+\.xml$/.test(lower);
            if (!isRelevantXml) continue;
            if (entry.size > MAX_XML_ENTRY_BYTES) { errors.push({ code: 'XML_TOO_LARGE', message: 'Một phần XML của DOCX quá lớn.', location: entry.name }); continue; }
            const xml = extract(content, entry).toString('utf8');
            for (const match of xml.matchAll(TAG_PATTERN)) {
                const field = match[1].replace(/\[i(?:\+1)?\]/g, '[]').split(':')[0];
                tags.add(field);
                if (allowedFields && !allowedFields.has(field)) errors.push({ code: 'UNKNOWN_FIELD', message: `Trường dữ liệu không tồn tại: ${field}`, location: entry.name });
            }
            if (/TargetMode="External"/i.test(xml)) warnings.push({ code: 'EXTERNAL_LINK', message: 'DOCX có liên kết ngoài; cần reviewer xác nhận.', location: entry.name });
        }
        if (!tags.size) warnings.push({ code: 'NO_CARBONE_TAGS', message: 'Không tìm thấy trường dữ liệu Carbone trong body/header/footer.' });
    } catch (error) {
        errors.push({ code: 'INVALID_DOCX', message: error instanceof Error ? error.message : 'Không đọc được DOCX.' });
    }
    return { valid: errors.length === 0, errors, warnings, tags: [...tags].sort(), checkedAt: new Date().toISOString(), sha256, size: content.length };
}

