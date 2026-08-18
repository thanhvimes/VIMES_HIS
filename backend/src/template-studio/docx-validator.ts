import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { FieldMetadata } from './contract-catalog';
import { TemplateValidationResult, ValidationIssue } from './types';

const MAX_DOCX_BYTES = 20 * 1024 * 1024;
const MAX_ENTRIES = 2_000;
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024;
const MAX_XML_ENTRY_BYTES = 10 * 1024 * 1024;
const TAG_PATTERN = /\{d\.([^{}]+)\}/g;

const STANDARD_FONTS = new Set([
    'noto sans', 'noto serif', 'noto sans display', 'noto serif display',
    'liberation sans', 'liberation serif', 'liberation mono',
    'times new roman', 'arial', 'roboto', 'calibri', 'courier new',
    'dejavu sans', 'dejavu serif', 'dejavu sans mono',
    'segoe ui', 'tahoma', 'verdana', 'cambria', 'georgia',
    'symbol', 'wingdings', 'ms mincho', 'trebuchet ms', 'helvetica'
]);

function isStandardFont(name: string): boolean {
    const lower = name.trim().toLowerCase();
    if (STANDARD_FONTS.has(lower)) return true;
    for (const std of STANDARD_FONTS) {
        if (lower.startsWith(std) || lower.includes(std)) return true;
    }
    return false;
}

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

export function validateDocx(
    content: Buffer,
    allowedFields?: Set<string>,
    fieldMeta?: Map<string, FieldMetadata>
): TemplateValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const tags = new Set<string>();
    const checkedFonts = new Set<string>();
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
            if (lower.startsWith('word/media/') && entry.size > 5 * 1024 * 1024) warnings.push({ code: 'IMAGE_TOO_LARGE', message: 'Ảnh trong DOCX vượt ngưỡng khuyến nghị 5 MB.', location: entry.name });
            if (lower.endsWith('vbaproject.bin') || lower.includes('/embeddings/') || lower.endsWith('.ole')) errors.push({ code: 'ACTIVE_CONTENT', message: 'DOCX chứa macro hoặc đối tượng nhúng không được phép.', location: entry.name });

            if (lower === 'word/fonttable.xml') {
                const xml = extract(content, entry).toString('utf8');
                const fontMatches = xml.matchAll(/<w:font[^>]*\bw:name="([^"]+)"/g);
                for (const match of fontMatches) {
                    const fontName = match[1].trim();
                    if (!checkedFonts.has(fontName)) {
                        checkedFonts.add(fontName);
                        if (!isStandardFont(fontName)) {
                            warnings.push({
                                code: 'NON_STANDARD_FONT',
                                message: `Font '${fontName}' có thể không hiển thị chính xác trên Linux Carbone Worker (khuyến nghị: Noto Sans, Liberation Sans, Times New Roman, Arial).`,
                                location: entry.name
                            });
                        }
                    }
                }
            }

            const isRelevantXml = lower === 'word/document.xml' || /^word\/(header|footer)\d+\.xml$/.test(lower);
            if (!isRelevantXml) continue;
            if (entry.size > MAX_XML_ENTRY_BYTES) { errors.push({ code: 'XML_TOO_LARGE', message: 'Một phần XML của DOCX quá lớn.', location: entry.name }); continue; }
            const xml = extract(content, entry).toString('utf8');
            if (lower === 'word/document.xml') {
                if (!/<w:pgSz\b/i.test(xml)) warnings.push({ code: 'PAGE_SIZE_MISSING', message: 'DOCX chưa khai báo khổ giấy trong sectPr.', location: entry.name });
                if (!/<w:pgMar\b/i.test(xml)) warnings.push({ code: 'PAGE_MARGIN_MISSING', message: 'DOCX chưa khai báo margin trong sectPr.', location: entry.name });
            }
            const normalizedXml = xml.replace(/<[^>]+>/g, '');
            for (const match of [...xml.matchAll(TAG_PATTERN), ...normalizedXml.matchAll(TAG_PATTERN)]) {
                const rawTag = match[1].trim();
                const [rawBaseExpr, ...filters] = rawTag.split(':');
                const field = rawBaseExpr.replace(/\[i(?:\+1)?\]/g, '[]').replace(/\[\d+\]/g, '[]').trim();
                tags.add(field);
                if (allowedFields && !allowedFields.has(field)) {
                    errors.push({ code: 'UNKNOWN_FIELD', message: `Trường dữ liệu không tồn tại: ${field}`, location: entry.name });
                }

                if (fieldMeta) {
                    const hasIndex = /\[i(?:\+1)?\]|\[\d+\]/.test(rawBaseExpr);
                    const baseWithoutIndex = rawBaseExpr.replace(/\[[^\]]*\]/g, '').trim();
                    const directMeta = fieldMeta.get(rawBaseExpr);
                    const normalizedMeta = fieldMeta.get(field);
                    const baseMeta = fieldMeta.get(baseWithoutIndex);

                    if (directMeta && directMeta.type === 'array' && !hasIndex && filters.length === 0) {
                        errors.push({
                            code: 'INVALID_FIELD_TYPE',
                            message: `Trường '${rawBaseExpr}' là kiểu mảng (array), cần truy cập qua chỉ số [i] (ví dụ: {d.${rawBaseExpr}[i].thuoc_tinh}).`,
                            location: entry.name
                        });
                    }

                    if (baseMeta && (baseMeta.type === 'string' || baseMeta.type === 'number' || baseMeta.type === 'boolean') && hasIndex && !field.includes('[]')) {
                        errors.push({
                            code: 'INVALID_FIELD_TYPE',
                            message: `Trường '${baseWithoutIndex}' là kiểu ${baseMeta.type} (scalar), không thể dùng chỉ số mảng [i].`,
                            location: entry.name
                        });
                    }

                    const targetMeta = normalizedMeta || baseMeta || directMeta;
                    if (targetMeta && filters.length > 0) {
                        const numericFilters = ['formatn', 'formatc', 'add', 'sub', 'mul', 'div', 'round', 'floor', 'ceil'];
                        const dateFilters = ['formatd', 'convd'];
                        for (const filter of filters) {
                            const filterName = filter.split('(')[0].trim().toLowerCase();
                            if ((targetMeta.type === 'boolean' || targetMeta.type === 'object' || targetMeta.type === 'array') && numericFilters.includes(filterName)) {
                                warnings.push({
                                    code: 'INVALID_FORMATTER',
                                    message: `Formatter số học '${filterName}' không tương thích với trường '${field}' kiểu ${targetMeta.type}.`,
                                    location: entry.name
                                });
                            }
                            if ((targetMeta.type === 'number' || targetMeta.type === 'boolean' || targetMeta.type === 'object' || targetMeta.type === 'array') && dateFilters.includes(filterName)) {
                                warnings.push({
                                    code: 'INVALID_FORMATTER',
                                    message: `Formatter ngày tháng '${filterName}' không tương thích với trường '${field}' kiểu ${targetMeta.type}.`,
                                    location: entry.name
                                });
                            }
                        }
                    }
                }
            }
            if (/\{d\.[^{}]*$/.test(normalizedXml) || /\{d\.[^{}]*\[[^\]]*$/.test(normalizedXml)) {
                errors.push({ code: 'UNCLOSED_CARBONE_TAG', message: 'Carbone tag hoặc vòng lặp chưa được đóng.', location: entry.name });
            }
            if (/TargetMode="External"/i.test(xml)) warnings.push({ code: 'EXTERNAL_LINK', message: 'DOCX có liên kết ngoài; cần reviewer xác nhận.', location: entry.name });
        }
        if (!tags.size) warnings.push({ code: 'NO_CARBONE_TAGS', message: 'Không tìm thấy trường dữ liệu Carbone trong body/header/footer.' });
    } catch (error) {
        errors.push({ code: 'INVALID_DOCX', message: error instanceof Error ? error.message : 'Không đọc được DOCX.' });
    }
    return { valid: errors.length === 0, errors, warnings, tags: [...tags].sort(), checkedAt: new Date().toISOString(), sha256, size: content.length };
}

