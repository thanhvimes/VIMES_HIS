import fs from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9/_\-.]{0,500}$/;

export interface StorageFileEntry {
    key: string;
    size: number;
    modifiedAt: string;
}

export interface TemplateArtifactStorage {
    put(key: string, content: Buffer): Promise<void>;
    get(key: string): Promise<Buffer>;
    exists(key: string): Promise<boolean>;
    delete?(key: string): Promise<void>;
    signedUrl?(key: string, expiresInSeconds?: number): Promise<string>;
    capacity?(): Promise<Record<string, unknown>>;
    listKeys?(): Promise<StorageFileEntry[]>;
}

export class LocalTemplateArtifactStorage implements TemplateArtifactStorage {
    private readonly root: string;

    constructor(rootDir: string) {
        this.root = path.resolve(rootDir);
    }

    async put(key: string, content: Buffer): Promise<void> {
        const destination = this.resolveKey(key);
        if (await this.exists(key)) return;
        await fs.mkdir(path.dirname(destination), { recursive: true });
        const temporary = `${destination}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
        try {
            await fs.writeFile(temporary, content, { flag: 'wx' });
            try { await fs.rename(temporary, destination); }
            catch (error) {
                if (await this.exists(key)) return;
                throw error;
            }
        } catch (error) {
            await fs.rm(temporary, { force: true }).catch(() => undefined);
            throw error;
        }
    }

    get(key: string): Promise<Buffer> {
        return fs.readFile(this.resolveKey(key));
    }

    async exists(key: string): Promise<boolean> {
        try { await fs.access(this.resolveKey(key)); return true; }
        catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
            throw error;
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await fs.unlink(this.resolveKey(key));
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
    }

    async listKeys(): Promise<StorageFileEntry[]> {
        const results: StorageFileEntry[] = [];
        const walk = async (dir: string) => {
            const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
            for (const entry of entries) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await walk(full);
                } else if (entry.isFile() && !entry.name.endsWith('.tmp')) {
                    const stat = await fs.stat(full);
                    const rel = path.relative(this.root, full).replace(/\\/g, '/');
                    results.push({
                        key: rel,
                        size: stat.size,
                        modifiedAt: stat.mtime.toISOString()
                    });
                }
            }
        };
        await walk(this.root);
        return results;
    }

    async capacity(): Promise<{ root: string; objects: number; bytes: number }> {
        const keys = await this.listKeys();
        return {
            root: this.root,
            objects: keys.length,
            bytes: keys.reduce((acc, k) => acc + k.size, 0)
        };
    }

    private resolveKey(key: string): string {
        if (!SAFE_KEY.test(key) || key.includes('..') || key.includes('\\')) {
            throw Object.assign(new Error('Unsafe template artifact key'), { status: 400 });
        }
        const resolved = path.resolve(this.root, key);
        if (resolved !== this.root && !resolved.startsWith(this.root + path.sep)) {
            throw Object.assign(new Error('Template artifact path escapes storage root'), { status: 400 });
        }
        return resolved;
    }
}

export class S3TemplateArtifactStorage implements TemplateArtifactStorage {
    private readonly client: S3Client;
    constructor(private readonly bucket: string, endpoint?: string) {
        this.client = new S3Client({
            region: process.env.S3_REGION || 'us-east-1',
            endpoint: endpoint || process.env.S3_ENDPOINT,
            forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE || 'true') === 'true',
            credentials: { accessKeyId: String(process.env.S3_ACCESS_KEY), secretAccessKey: String(process.env.S3_SECRET_KEY) }
        });
    }
    async put(key: string, content: Buffer): Promise<void> {
        await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: this.safeKey(key), Body: content }));
    }
    async get(key: string): Promise<Buffer> {
        const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: this.safeKey(key) }));
        if (!result.Body) throw Object.assign(new Error('Artifact body is empty'), { status: 404 });
        return Buffer.from(await result.Body.transformToByteArray());
    }
    async exists(key: string): Promise<boolean> {
        try { await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: this.safeKey(key) })); return true; }
        catch (error: any) { if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') return false; throw error; }
    }
    async delete(key: string): Promise<void> {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.safeKey(key) }));
    }
    signedUrl(key: string, expiresInSeconds = 300): Promise<string> {
        return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: this.safeKey(key) }), { expiresIn: Math.min(Math.max(expiresInSeconds, 30), 900) });
    }
    async listKeys(): Promise<StorageFileEntry[]> {
        const results: StorageFileEntry[] = [];
        let continuationToken: string | undefined;
        do {
            const page = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, ContinuationToken: continuationToken }));
            for (const item of page.Contents || []) {
                if (item.Key) {
                    results.push({
                        key: item.Key,
                        size: Number(item.Size || 0),
                        modifiedAt: item.LastModified ? item.LastModified.toISOString() : new Date().toISOString()
                    });
                }
            }
            continuationToken = page.NextContinuationToken;
        } while (continuationToken);
        return results;
    }
    async capacity() {
        let continuationToken: string | undefined; let objects = 0; let bytes = 0;
        do { const page = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, ContinuationToken: continuationToken })); for (const item of page.Contents || []) { objects += 1; bytes += Number(item.Size || 0); } continuationToken = page.NextContinuationToken; } while (continuationToken);
        return { bucket: this.bucket, objects, bytes };
    }
    private safeKey(key: string): string {
        if (!SAFE_KEY.test(key) || key.includes('..') || key.includes('\\')) throw Object.assign(new Error('Unsafe template artifact key'), { status: 400 });
        return key;
    }
}
