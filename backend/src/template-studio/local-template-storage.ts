import fs from 'node:fs/promises';
import path from 'node:path';

const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9/_\-.]{0,500}$/;

export interface TemplateArtifactStorage {
    put(key: string, content: Buffer): Promise<void>;
    get(key: string): Promise<Buffer>;
    exists(key: string): Promise<boolean>;
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
        const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
        await fs.writeFile(temporary, content, { flag: 'wx' });
        await fs.rename(temporary, destination);
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
