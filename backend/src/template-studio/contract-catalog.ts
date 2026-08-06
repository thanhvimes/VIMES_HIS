import fs from 'node:fs/promises';
import path from 'node:path';
import { ContractField } from './types';

export interface JsonSchema {
    type: string;
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema;
    required?: string[];
    additionalProperties?: boolean;
    examples?: unknown[];
}

function valueType(value: unknown): ContractField['type'] {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
}

function buildFields(value: Record<string, unknown>, prefix = ''): ContractField[] {
    return Object.entries(value).map(([key, child]) => {
        const current = prefix ? `${prefix}.${key}` : key;
        const type = valueType(child);
        const field: ContractField = {
            path: current,
            label: key,
            type,
            required: true,
            example: type === 'object' || type === 'array' ? undefined : child,
            carboneTag: type === 'object' || type === 'array' ? undefined : `{d.${current}}`
        };
        if (type === 'object') field.children = buildFields(child as Record<string, unknown>, current);
        if (type === 'array') {
            const first = (child as unknown[])[0];
            if (first && typeof first === 'object' && !Array.isArray(first)) field.children = buildFields(first as Record<string, unknown>, `${current}[]`);
        }
        return field;
    });
}

function flatten(fields: ContractField[]): string[] {
    return fields.flatMap(field => [field.path, ...(field.children ? flatten(field.children) : [])]);
}

export function buildJsonSchema(value: unknown): JsonSchema {
    if (Array.isArray(value)) {
        return { type: 'array', items: buildJsonSchema(value[0] ?? null), examples: [value] };
    }
    if (value !== null && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>);
        return {
            type: 'object',
            properties: Object.fromEntries(entries.map(([key, child]) => [key, buildJsonSchema(child)])),
            required: entries.map(([key]) => key),
            additionalProperties: false
        };
    }
    return { type: value === null ? 'null' : typeof value, examples: [value] };
}

export class ContractCatalog {
    constructor(private readonly templateRoot: string) {}

    async get(code: string): Promise<{ code: string; fields: ContractField[]; allowedFields: Set<string>; sampleData: Record<string, unknown>; jsonSchema: JsonSchema }> {
        if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(code)) throw Object.assign(new Error('Invalid contract code'), { status: 400 });
        const samplePath = path.resolve(this.templateRoot, code, 'v1', 'sample-data.json');
        const expectedRoot = path.resolve(this.templateRoot) + path.sep;
        if (!samplePath.startsWith(expectedRoot)) throw Object.assign(new Error('Unsafe contract path'), { status: 400 });
        let sampleData: Record<string, unknown>;
        try { sampleData = JSON.parse(await fs.readFile(samplePath, 'utf8')) as Record<string, unknown>; }
        catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw Object.assign(new Error('Data contract not found'), { status: 404 });
            throw error;
        }
        const fields = buildFields(sampleData);
        return { code, fields, allowedFields: new Set(flatten(fields)), sampleData, jsonSchema: buildJsonSchema(sampleData) };
    }
}
