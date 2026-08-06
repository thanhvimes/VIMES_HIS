import fs from 'node:fs/promises';
import path from 'node:path';
import { DocumentTemplateManifest } from './types';

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/;

export class TemplateRegistry {
    constructor(private readonly rootDir: string) {}

    async list(): Promise<DocumentTemplateManifest[]> {
        const entries = await fs.readdir(this.rootDir, { withFileTypes: true }).catch(error => {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
            throw error;
        });
        const manifests = await Promise.all(entries
            .filter(entry => entry.isDirectory())
            .map(entry => this.readManifests(path.join(this.rootDir, entry.name))));
        return manifests.flat().sort((a, b) => a.code.localeCompare(b.code) || b.version - a.version);
    }

    async resolve(code: string, version?: number): Promise<DocumentTemplateManifest> {
        if (!CODE_PATTERN.test(code)) throw Object.assign(new Error('Invalid template code'), { status: 400 });
        const candidates = (await this.list()).filter(item => item.code === code && (version === undefined || item.version === version));
        candidates.sort((a, b) => b.version - a.version);
        if (!candidates[0]) throw Object.assign(new Error('Published document template not found'), { status: 404 });
        return candidates[0];
    }

    templatePath(template: DocumentTemplateManifest): string {
        const resolved = path.resolve(this.rootDir, template.code, `v${template.version}`, template.file);
        const root = path.resolve(this.rootDir) + path.sep;
        if (!resolved.startsWith(root)) throw Object.assign(new Error('Unsafe template path'), { status: 500 });
        return resolved;
    }

    private async readManifests(templateDir: string): Promise<DocumentTemplateManifest[]> {
        const versions = await fs.readdir(templateDir, { withFileTypes: true });
        const manifests: DocumentTemplateManifest[] = [];
        const expectedCode = path.basename(templateDir);
        for (const versionDir of versions.filter(entry => entry.isDirectory() && /^v\d+$/.test(entry.name))) {
            const manifestPath = path.join(templateDir, versionDir.name, 'manifest.json');
            try {
                const parsed = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as DocumentTemplateManifest;
                const expectedVersion = Number(versionDir.name.slice(1));
                if (parsed.status === 'published' && parsed.code === expectedCode && parsed.version === expectedVersion &&
                    CODE_PATTERN.test(parsed.code) && Number.isInteger(parsed.version) && parsed.version > 0 &&
                    path.basename(parsed.file) === parsed.file && parsed.file.toLowerCase().endsWith('.docx')) {
                    manifests.push(parsed);
                }
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
            }
        }
        return manifests;
    }
}
