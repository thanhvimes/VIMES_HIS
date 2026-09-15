import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { PackageManifest, canonicalManifest, validatePackageManifest, verifyPackageSignature } from './package-validator';

const MAX_PACKAGE_BYTES = 50 * 1024 * 1024; // 50MB max package
const MAX_PACKAGE_ENTRIES = 500;
const MAX_UNCOMPRESSED_TOTAL = 100 * 1024 * 1024; // 100MB max uncompressed

export interface TemplatePackageMetadata {
    template: {
        code: string;
        name: string;
        documentType: string;
        moduleCode?: string;
        description?: string;
        category?: string;
        tags?: string[];
        scope?: Record<string, unknown>;
        printConfig?: Record<string, unknown>;
    };
    version: {
        version: number;
        changeNote?: string;
        sampleData: Record<string, unknown>;
    };
    contract?: {
        code: string;
        name: string;
        version: number;
        jsonSchema: Record<string, unknown>;
        sampleData?: Record<string, unknown>;
    };
    testCases: Array<{
        name: string;
        testType: string;
        inputData: Record<string, unknown>;
        isRequired: boolean;
    }>;
}

/**
 * Pure-Node ZIP packer
 */
export function packZip(files: Record<string, Buffer>): Buffer {
    const entries = Object.entries(files);
    const localHeaders: Buffer[] = [];
    const centralHeaders: Buffer[] = [];
    let offset = 0;

    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

    for (const [rawName, uncompressed] of entries) {
        const name = rawName.replace(/\\/g, '/');
        const nameBuffer = Buffer.from(name, 'utf8');
        const compressed = zlib.deflateRawSync(uncompressed);
        const crc = (zlib as any).crc32 ? Number((zlib as any).crc32(uncompressed)) : 0;

        // Local Header (30 bytes + name)
        const localHeader = Buffer.alloc(30 + nameBuffer.length);
        localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
        localHeader.writeUInt16LE(20, 4);        // Version needed (2.0)
        localHeader.writeUInt16LE(0, 6);         // General purpose flag
        localHeader.writeUInt16LE(8, 8);         // Compression method (8 = Deflate)
        localHeader.writeUInt16LE(dosTime, 10);
        localHeader.writeUInt16LE(dosDate, 12);
        localHeader.writeUInt32LE(crc >>> 0, 14);
        localHeader.writeUInt32LE(compressed.length, 18);
        localHeader.writeUInt32LE(uncompressed.length, 22);
        localHeader.writeUInt16LE(nameBuffer.length, 26);
        localHeader.writeUInt16LE(0, 28);        // Extra field length
        nameBuffer.copy(localHeader, 30);

        localHeaders.push(localHeader, compressed);

        // Central Directory Header (46 bytes + name)
        const centralHeader = Buffer.alloc(46 + nameBuffer.length);
        centralHeader.writeUInt32LE(0x02014b50, 0); // Central header signature
        centralHeader.writeUInt16LE(20, 4);         // Version made by
        centralHeader.writeUInt16LE(20, 6);         // Version needed
        centralHeader.writeUInt16LE(0, 8);          // General purpose flag
        centralHeader.writeUInt16LE(8, 10);         // Compression method
        centralHeader.writeUInt16LE(dosTime, 12);
        centralHeader.writeUInt16LE(dosDate, 14);
        centralHeader.writeUInt32LE(crc >>> 0, 16);
        centralHeader.writeUInt32LE(compressed.length, 20);
        centralHeader.writeUInt32LE(uncompressed.length, 24);
        centralHeader.writeUInt16LE(nameBuffer.length, 28);
        centralHeader.writeUInt16LE(0, 30);         // Extra field length
        centralHeader.writeUInt16LE(0, 32);         // File comment length
        centralHeader.writeUInt16LE(0, 34);         // Disk number start
        centralHeader.writeUInt16LE(0, 36);         // Internal attributes
        centralHeader.writeUInt32LE(0, 38);         // External attributes
        centralHeader.writeUInt32LE(offset, 42);    // Relative offset of local header
        nameBuffer.copy(centralHeader, 46);

        centralHeaders.push(centralHeader);
        offset += localHeader.length + compressed.length;
    }

    const centralDirectory = Buffer.concat(centralHeaders);
    const centralDirOffset = offset;
    const centralDirSize = centralDirectory.length;

    // End of Central Directory Record (22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
    eocd.writeUInt16LE(0, 4);          // Disk number
    eocd.writeUInt16LE(0, 6);          // Start disk
    eocd.writeUInt16LE(entries.length, 8);  // Entries on disk
    eocd.writeUInt16LE(entries.length, 10); // Total entries
    eocd.writeUInt32LE(centralDirSize, 12);
    eocd.writeUInt32LE(centralDirOffset, 16);
    eocd.writeUInt16LE(0, 20);         // Comment length

    return Buffer.concat([...localHeaders, centralDirectory, eocd]);
}

/**
 * Pure-Node ZIP unpacker with security hardening (Zip Slip & Zip Bomb defense)
 */
export function unpackZip(buffer: Buffer): Record<string, Buffer> {
    if (buffer.length > MAX_PACKAGE_BYTES) {
        throw new Error(`Package size exceeds limit (${Math.round(buffer.length / 1024 / 1024)}MB > ${MAX_PACKAGE_BYTES / 1024 / 1024}MB)`);
    }

    const min = Math.max(0, buffer.length - 65_557);
    let eocd = -1;
    for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
        if (buffer.readUInt32LE(offset) === 0x06054b50) {
            eocd = offset;
            break;
        }
    }
    if (eocd < 0) throw new Error('Invalid ZIP package: End of Central Directory record not found');

    const count = buffer.readUInt16LE(eocd + 10);
    const centralOffset = buffer.readUInt32LE(eocd + 16);
    if (count > MAX_PACKAGE_ENTRIES) {
        throw new Error(`Package contains too many entries (${count} > ${MAX_PACKAGE_ENTRIES})`);
    }

    const result: Record<string, Buffer> = {};
    let cursor = centralOffset;
    let totalUncompressed = 0;

    for (let i = 0; i < count; i++) {
        if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) {
            throw new Error('Corrupt ZIP central directory');
        }

        const method = buffer.readUInt16LE(cursor + 10);
        const compressedSize = buffer.readUInt32LE(cursor + 20);
        const uncompressedSize = buffer.readUInt32LE(cursor + 24);
        const nameLength = buffer.readUInt16LE(cursor + 28);
        const extraLength = buffer.readUInt16LE(cursor + 30);
        const commentLength = buffer.readUInt16LE(cursor + 32);
        const localOffset = buffer.readUInt32LE(cursor + 42);

        const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8').replace(/\\/g, '/');

        // Security check: Path traversal & absolute paths
        if (!name || name.startsWith('/') || name.split('/').includes('..')) {
            throw new Error(`Package contains unsafe entry path: ${name}`);
        }

        totalUncompressed += uncompressedSize;
        if (totalUncompressed > MAX_UNCOMPRESSED_TOTAL) {
            throw new Error(`Package uncompressed size exceeds limit (${MAX_UNCOMPRESSED_TOTAL / 1024 / 1024}MB)`);
        }

        // Read from local header
        if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) {
            throw new Error(`Corrupt local header for entry: ${name}`);
        }
        const localNameLength = buffer.readUInt16LE(localOffset + 26);
        const localExtraLength = buffer.readUInt16LE(localOffset + 28);
        const dataOffset = localOffset + 30 + localNameLength + localExtraLength;

        if (dataOffset + compressedSize > buffer.length) {
            throw new Error(`Unexpected end of data for entry: ${name}`);
        }

        const rawData = buffer.subarray(dataOffset, dataOffset + compressedSize);
        let decompressed: Buffer;

        if (method === 0) {
            // Stored
            decompressed = Buffer.from(rawData);
        } else if (method === 8) {
            // Deflate
            decompressed = zlib.inflateRawSync(rawData);
        } else {
            throw new Error(`Unsupported compression method ${method} for entry: ${name}`);
        }

        result[name] = decompressed;
        cursor += 46 + nameLength + extraLength + commentLength;
    }

    return result;
}

/**
 * Build a standard VIMES Template Package ZIP
 */
export function buildPackage(data: {
    metadata: TemplatePackageMetadata;
    docxArtifact?: Buffer;
    privateKeyPem?: string;
}): { buffer: Buffer; manifest: PackageManifest } {
    const { metadata, docxArtifact, privateKeyPem } = data;

    const files: Record<string, Buffer> = {};
    const fileHashes: Record<string, string> = {};

    // 1. Metadata JSON
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2), 'utf8');
    files['metadata.json'] = metadataBuffer;
    fileHashes['metadata.json'] = crypto.createHash('sha256').update(metadataBuffer).digest('hex');

    // 2. DOCX Artifact (if any)
    if (docxArtifact && docxArtifact.length > 0) {
        files['template.docx'] = docxArtifact;
        fileHashes['template.docx'] = crypto.createHash('sha256').update(docxArtifact).digest('hex');
    }

    // 3. Data Contract JSON (if any)
    if (metadata.contract) {
        const contractBuffer = Buffer.from(JSON.stringify(metadata.contract, null, 2), 'utf8');
        files['contract.json'] = contractBuffer;
        fileHashes['contract.json'] = crypto.createHash('sha256').update(contractBuffer).digest('hex');
    }

    // 4. Test cases JSON
    if (metadata.testCases && metadata.testCases.length > 0) {
        const testCasesBuffer = Buffer.from(JSON.stringify(metadata.testCases, null, 2), 'utf8');
        files['test-cases.json'] = testCasesBuffer;
        fileHashes['test-cases.json'] = crypto.createHash('sha256').update(testCasesBuffer).digest('hex');
    }

    // 5. Manifest JSON
    const manifest: PackageManifest = {
        format: 'VIMES_TEMPLATE_PACKAGE_V1',
        templateCode: metadata.template.code,
        version: metadata.version.version,
        contractCode: metadata.contract?.code,
        files: fileHashes
    };

    // Optional RSA-SHA256 signature
    if (privateKeyPem) {
        try {
            const signer = crypto.createSign('RSA-SHA256');
            signer.update(canonicalManifest(manifest));
            signer.end();
            manifest.signature = signer.sign(privateKeyPem, 'base64');
        } catch (err) {
            // Ignore signature signing failure in non-signed exports
        }
    }

    const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
    files['manifest.json'] = manifestBuffer;

    const zipBuffer = packZip(files);
    return { buffer: zipBuffer, manifest };
}

/**
 * Unpack, validate manifest, verify checksums and signatures of a VIMES Template Package
 */
export function unpackAndVerifyPackage(
    packageBuffer: Buffer,
    publicKeyPem?: string
): {
    valid: boolean;
    manifest?: PackageManifest;
    metadata?: TemplatePackageMetadata;
    files: Record<string, Buffer>;
    signatureValid?: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    let files: Record<string, Buffer> = {};

    try {
        files = unpackZip(packageBuffer);
    } catch (error) {
        return { valid: false, files: {}, errors: [error instanceof Error ? error.message : 'Invalid ZIP package'] };
    }

    const manifestBuffer = files['manifest.json'];
    if (!manifestBuffer) {
        return { valid: false, files, errors: ['Package is missing manifest.json'] };
    }

    let manifest: PackageManifest;
    try {
        manifest = JSON.parse(manifestBuffer.toString('utf8'));
    } catch {
        return { valid: false, files, errors: ['manifest.json is not valid JSON'] };
    }

    const manifestValidation = validatePackageManifest(manifest, files);
    if (!manifestValidation.valid) {
        errors.push(...manifestValidation.errors);
    }

    let signatureValid: boolean | undefined;
    if (publicKeyPem && manifest.signature) {
        signatureValid = verifyPackageSignature(manifest, publicKeyPem);
        if (!signatureValid) {
            errors.push('Package signature verification failed');
        }
    }

    let metadata: TemplatePackageMetadata | undefined;
    const metadataBuffer = files['metadata.json'];
    if (metadataBuffer) {
        try {
            metadata = JSON.parse(metadataBuffer.toString('utf8'));
        } catch {
            errors.push('metadata.json is not valid JSON');
        }
    } else {
        errors.push('Package is missing metadata.json');
    }

    return {
        valid: errors.length === 0,
        manifest,
        metadata,
        files,
        signatureValid,
        errors
    };
}
