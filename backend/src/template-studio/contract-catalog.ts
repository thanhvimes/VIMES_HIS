import fs from 'node:fs/promises';
import path from 'node:path';
import { ContractField, ValidationIssue } from './types';

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

function matchesSchemaType(value: unknown, type: string): boolean {
    if (type === 'null') return value === null;
    if (type === 'array') return Array.isArray(value);
    if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
    if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
    if (type === 'boolean') return typeof value === 'boolean';
    return typeof value === 'string';
}

export function validateJsonData(schema: JsonSchema, value: unknown, path = '$'): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (!matchesSchemaType(value, schema.type)) {
        issues.push({ code: 'INVALID_TYPE', message: `Kiểu dữ liệu không đúng tại ${path}; cần ${schema.type}.`, location: path });
        return issues;
    }
    if (schema.type === 'object' && schema.properties) {
        const objectValue = value as Record<string, unknown>;
        for (const required of schema.required || []) {
            if (!(required in objectValue) || objectValue[required] === undefined) issues.push({ code: 'REQUIRED_FIELD', message: `Thiếu trường bắt buộc: ${path}.${required}`, location: `${path}.${required}` });
        }
        for (const key of Object.keys(objectValue)) {
            if (!schema.properties[key]) {
                if (schema.additionalProperties === false) issues.push({ code: 'UNKNOWN_FIELD', message: `Trường không thuộc data contract: ${path}.${key}`, location: `${path}.${key}` });
                continue;
            }
            issues.push(...validateJsonData(schema.properties[key], objectValue[key], `${path}.${key}`));
        }
    }
    if (schema.type === 'array' && schema.items) {
        (value as unknown[]).forEach((item, index) => issues.push(...validateJsonData(schema.items!, item, `${path}[${index}]`)));
    }
    return issues;
}

export interface FieldMetadata {
    path: string;
    type: ContractField['type'];
    isArray: boolean;
    isObject: boolean;
}

export function buildFieldMetaMap(fields: ContractField[], map = new Map<string, FieldMetadata>()): Map<string, FieldMetadata> {
    for (const field of fields) {
        map.set(field.path, {
            path: field.path,
            type: field.type,
            isArray: field.type === 'array',
            isObject: field.type === 'object'
        });
        if (field.children) {
            buildFieldMetaMap(field.children, map);
        }
    }
    return map;
}

export class ContractCatalog {
    constructor(private readonly templateRoot: string) {}

    async listCodes(): Promise<string[]> {
        const entries = await fs.readdir(this.templateRoot, { withFileTypes: true });
        return entries.filter(entry => entry.isDirectory() && /^[A-Z][A-Z0-9_]{2,63}$/.test(entry.name)).map(entry => entry.name).sort();
    }

    async get(code: string): Promise<{
        code: string;
        fields: ContractField[];
        allowedFields: Set<string>;
        fieldMeta: Map<string, FieldMetadata>;
        sampleData: Record<string, unknown>;
        jsonSchema: JsonSchema;
    }> {
        if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(code)) throw Object.assign(new Error('Invalid contract code'), { status: 400 });
        const samplePath = path.resolve(this.templateRoot, code, 'v1', 'sample-data.json');
        const expectedRoot = path.resolve(this.templateRoot) + path.sep;
        if (!samplePath.startsWith(expectedRoot)) throw Object.assign(new Error('Unsafe contract path'), { status: 400 });
        let sampleData: Record<string, unknown> | null = null;
        try { 
            sampleData = JSON.parse(await fs.readFile(samplePath, 'utf8')) as Record<string, unknown>; 
        } catch (error) {
            try {
                const { query } = await import('../config/database');
                const dbRes = await query(`
                    SELECT v.sample_data 
                    FROM hms_document_template_version v
                    JOIN hms_document_template t ON t.id = v.template_id
                    WHERE t.code = $1
                    ORDER BY v.version DESC LIMIT 1
                `, [code]);
                if (dbRes.rows[0]?.sample_data && typeof dbRes.rows[0].sample_data === 'object') {
                    sampleData = dbRes.rows[0].sample_data as Record<string, unknown>;
                } else {
                    const contractRes = await query(`SELECT sample_data FROM hms_document_contract WHERE code = $1 LIMIT 1`, [code]);
                    if (contractRes.rows[0]?.sample_data && typeof contractRes.rows[0].sample_data === 'object') {
                        sampleData = contractRes.rows[0].sample_data as Record<string, unknown>;
                    }
                }
            } catch (_) {}
            
            if (!sampleData) {
                sampleData = { patient_name: 'Nguyễn Văn An', patient_id: 'BN-10293', date: new Date().toISOString().slice(0, 10), diagnosis: 'Khám bệnh', doctor_name: 'Bác sĩ điều trị' };
            }
        }
        const fields = buildFields(sampleData);
        const fieldMeta = buildFieldMetaMap(fields);
        return {
            code,
            fields,
            allowedFields: new Set(flatten(fields)),
            fieldMeta,
            sampleData,
            jsonSchema: buildJsonSchema(sampleData)
        };
    }
}
