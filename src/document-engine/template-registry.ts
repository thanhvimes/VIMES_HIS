import fs from 'node:fs/promises';
import path from 'node:path';
import { DocumentTemplateManifest, RenderScopeOptions } from './types';
import { query } from '../config/database';

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/;
type ActiveTemplateResolver = (code: string, version?: number) => Promise<DocumentTemplateManifest | undefined>;

export class TemplateRegistry {
    private cache = new Map<string, { data: DocumentTemplateManifest[]; timestamp: number }>();
    private readonly CACHE_TTL_MS = 60_000;

    constructor(private readonly rootDir: string, private readonly activeResolver?: ActiveTemplateResolver) {}

    invalidate(code?: string): void {
        if (code) {
            this.cache.delete(code);
            this.cache.delete('*');
        } else {
            this.cache.clear();
        }
    }

    async list(): Promise<DocumentTemplateManifest[]> {
        const cached = this.cache.get('*');
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            return cached.data;
        }
        const entries = await fs.readdir(this.rootDir, { withFileTypes: true }).catch(error => {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
            throw error;
        });
        const manifests = await Promise.all(entries
            .filter(entry => entry.isDirectory())
            .map(entry => this.readManifests(path.join(this.rootDir, entry.name))));
        const result = manifests.flat().sort((a, b) => a.code.localeCompare(b.code) || b.version - a.version);
        this.cache.set('*', { data: result, timestamp: Date.now() });
        return result;
    }

    async resolve(code: string, version?: number): Promise<DocumentTemplateManifest> {
        if (!CODE_PATTERN.test(code)) throw Object.assign(new Error('Invalid template code'), { status: 400 });
        const candidates = (await this.list()).filter(item => item.code === code && (version === undefined || item.version === version));
        candidates.sort((a, b) => b.version - a.version);
        if (!candidates[0]) throw Object.assign(new Error('Published document template not found'), { status: 404 });
        return candidates[0];
    }

    async resolveActive(code: string, requestedVersion?: number, options?: RenderScopeOptions): Promise<DocumentTemplateManifest> {
        if (!CODE_PATTERN.test(code)) throw Object.assign(new Error('Invalid template code'), { status: 400 });
        if (this.activeResolver) {
            const resolved = await this.activeResolver(code, requestedVersion);
            if (!resolved) throw Object.assign(new Error('Published active document template artifact not found'), { status: 404 });
            return resolved;
        }
        const asOf = options?.asOfDate ? new Date(options.asOfDate) : new Date();
        const result = await query(`
            SELECT t.code, t.name, t.document_type, v.version, v.status, v.artifact_key, v.artifact_sha256 AS sha256,
                   v.effective_from, v.effective_to
            FROM hms_document_template t
            JOIN hms_document_template_version v ON v.template_id = t.id
            WHERE t.code=$1 AND t.is_active=true AND v.status='PUBLISHED'
              AND (
                ($2::bigint IS NOT NULL AND v.id = $2::bigint)
                OR ($2::bigint IS NULL AND (
                    v.id = t.active_version_id
                    OR (
                        (v.effective_from IS NULL OR v.effective_from <= $3::timestamptz)
                        AND (v.effective_to IS NULL OR v.effective_to >= $3::timestamptz)
                    )
                ))
              )
            ORDER BY CASE WHEN v.id = t.active_version_id THEN 0 ELSE 1 END, v.version DESC
            LIMIT 1
        `, [code, requestedVersion ?? null, asOf]);
        const row = result.rows[0];
        if (!row || !row.artifact_key) throw Object.assign(new Error('Published active document template artifact not found'), { status: 404 });
        return { code: row.code, name: row.name, version: Number(row.version), file: path.basename(row.artifact_key), documentType: row.document_type, status: 'published', artifactKey: row.artifact_key, sha256: row.sha256 || undefined };
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
