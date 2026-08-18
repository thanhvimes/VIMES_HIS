export type TemplateVersionStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'RETIRED';

export interface TemplateStudioTemplate {
    id: number;
    code: string;
    name: string;
    documentType: string;
    moduleCode?: string;
    description?: string;
    category?: string;
    tags?: string[];
    scope?: { facilities?: string[]; departments?: string[]; rooms?: string[] };
    printConfig?: { paper?: string; orientation?: string; margins?: { top?: number; right?: number; bottom?: number; left?: number }; language?: string; formats?: string[] };
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
    assignedDesigner?: string;
    assignedTester?: string;
    assignedReviewer?: string;
    assignedPublisher?: string;
    dueDate?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    scheduledPublishAt?: string;
    reviewChecklist?: Record<string, unknown>;
    submittedBy?: string;
    submittedAt?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    publishedBy?: string;
    publishedAt?: string;
    createdBy: string;
    createdAt: string;
}

export interface TemplateComment {
    id: number;
    templateVersionId: number;
    authorId: string;
    authorName?: string;
    content: string;
    category: 'GENERAL' | 'DEFECT' | 'SUGGESTION' | 'APPROVAL_NOTE';
    createdAt: string;
}

export interface TemplateUserPermission {
    id: number;
    userId: string;
    userName?: string;
    roleCode: string;
    facilityId?: string;
    departmentId?: string;
    grantedBy: string;
    createdAt: string;
}

export interface TemplateNotification {
    id: number;
    recipientId: string;
    templateId: number;
    templateVersionId?: number;
    title: string;
    message: string;
    type: 'ASSIGNED' | 'REVIEW_REQUESTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'DUE_SOON';
    isRead: boolean;
    createdAt: string;
    templateCode?: string;
    templateName?: string;
    versionNumber?: number;
}

export interface TemplateInboxItem {
    templateId: number;
    versionId: number;
    code: string;
    name: string;
    documentType: string;
    moduleCode?: string;
    version: number;
    status: TemplateVersionStatus;
    assignedDesigner?: string;
    assignedTester?: string;
    assignedReviewer?: string;
    assignedPublisher?: string;
    dueDate?: string;
    isOverdue: boolean;
    createdBy: string;
    createdAt: string;
    submittedAt?: string;
    reviewedAt?: string;
    changeNote?: string;
}

export interface TemplateInboxStats {
    totalDrafts: number;
    totalPendingReview: number;
    totalPendingPublish: number;
    totalOverdue: number;
    totalRejected: number;
}

export interface TemplateInbox {
    myDrafts: TemplateInboxItem[];
    pendingReview: TemplateInboxItem[];
    pendingPublish: TemplateInboxItem[];
    rejected: TemplateInboxItem[];
    overdue: TemplateInboxItem[];
    stats: TemplateInboxStats;
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

export type TemplateTestRunStatus = 'QUEUED' | 'RUNNING' | 'PASSED' | 'FAILED';

export interface TemplateTestRun {
    id: number;
    templateVersionId: number;
    testCaseId?: number;
    status: TemplateTestRunStatus;
    validationErrors: ValidationIssue[];
    validationWarnings: ValidationIssue[];
    docxKey?: string;
    pdfKey?: string;
    docxSha256?: string;
    pdfSha256?: string;
    pageCount?: number;
    durationMs?: number;
    engineVersion?: string;
    createdBy: string;
    createdAt: string;
    completedAt?: string;
    docxSize?: number;
    pdfSize?: number;
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
