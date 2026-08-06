export type TemplateVersionStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'RETIRED';

export interface TemplateStudioTemplate {
    id: number;
    code: string;
    name: string;
    documentType: string;
    moduleCode?: string;
    description?: string;
    activeVersionId?: number;
    isActive: boolean;
    latestVersion?: TemplateStudioVersion;
}

export interface TemplateStudioVersion {
    id: number;
    templateId: number;
    version: number;
    status: TemplateVersionStatus;
    artifactKey?: string;
    artifactSha256?: string;
    artifactSize?: number;
    sampleData: Record<string, unknown>;
    changeNote?: string;
    validationResult?: TemplateValidationResult;
    createdBy: string;
    createdAt: string;
}

export interface ValidationIssue {
    code: string;
    message: string;
    location?: string;
}

export interface TemplateValidationResult {
    valid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    tags: string[];
    checkedAt: string;
    sha256: string;
    size: number;
}

export interface ContractField {
    path: string;
    label: string;
    type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    required: boolean;
    example?: unknown;
    carboneTag?: string;
    children?: ContractField[];
}

