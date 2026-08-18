import { apiClient } from './apiClient';

export type TemplateStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'RETIRED';

export interface TemplateValidation {
  valid: boolean;
  errors: Array<{ code: string; message: string; location?: string }>;
  warnings: Array<{ code: string; message: string; location?: string }>;
  tags: string[];
  checkedAt: string;
  sha256: string;
  size: number;
}

export interface StudioVersion {
  id: number;
  templateId: number;
  version: number;
  status: TemplateStatus;
  artifactKey?: string;
  artifactSize?: number;
  sampleData: Record<string, unknown>;
  validationResult?: TemplateValidation;
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
  createdBy?: string;
  createdAt?: string;
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
  status: TemplateStatus;
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

export interface OperationsDashboardMetrics {
  templates: {
    total: number;
    totalActive: number;
    totalArchived: number;
    byStatus: Record<string, number>;
  };
  testRuns: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    avgDurationMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  };
  storage: {
    totalArtifacts: number;
    totalBytes: number;
    avgBytes: number;
    maxBytes: number;
  };
  health: {
    database: string;
    storage: string;
    carbone: string;
    queue: string;
  };
  recentActivity: Array<{
    id: number;
    actorId: string;
    action: string;
    entityType: string;
    detail: any;
    createdAt: string;
  }>;
  generatedAt: string;
}

export interface OrphanArtifact {
  key: string;
  size: number;
  modifiedAt: string;
}

export interface StudioTemplate {
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
  latestVersion?: StudioVersion;
}
export interface CreateTemplateInput { code: string; name: string; documentType: string; moduleCode?: string; description?: string; category?: string; tags?: string[]; scope?: { facilities?: string[]; departments?: string[]; rooms?: string[] }; sampleData?: Record<string, unknown> }

export interface ContractField {
  path: string;
  label: string;
  type: string;
  required: boolean;
  example?: unknown;
  carboneTag?: string;
  children?: ContractField[];
}
export interface JsonSchema { type: string; properties?: Record<string, JsonSchema>; items?: JsonSchema; required?: string[]; additionalProperties?: boolean; examples?: unknown[] }

export interface ContractBreakingChange { code: string; path: string; message: string }

export function findContractBreakingChanges(previous: JsonSchema, next: JsonSchema, path = '$'): ContractBreakingChange[] {
  const changes: ContractBreakingChange[] = [];
  if (previous.type !== next.type) changes.push({ code: 'TYPE_CHANGED', path, message: `Kiểu dữ liệu đổi từ ${previous.type} sang ${next.type}` });
  const previousRequired = new Set(previous.required || []);
  const nextProperties = next.properties || {};
  for (const field of previousRequired) if (!(field in nextProperties)) changes.push({ code: 'REQUIRED_REMOVED', path: `${path}.${field}`, message: 'Field bắt buộc đã bị xóa' });
  for (const [key, oldChild] of Object.entries(previous.properties || {})) {
    if (nextProperties[key]) changes.push(...findContractBreakingChanges(oldChild, nextProperties[key], `${path}.${key}`));
  }
  return changes;
}

export interface StudioAudit { id: number; actorId: string; action: string; entityId: number; detail: Record<string, unknown>; createdAt: string }
export interface StudioTestCase { id: number; name: string; testType: string; inputData: Record<string, unknown>; isRequired: boolean }
export interface StudioTestRun { id: number; templateVersionId: number; testCaseId?: number; status: 'RUNNING' | 'PASSED' | 'FAILED'; validationErrors: Array<{ code: string; message: string }>; validationWarnings: Array<{ code: string; message: string }>; docxSha256?: string; pdfSha256?: string; durationMs?: number; engineVersion?: string; createdAt: string; completedAt?: string }

const unwrap = <T>(response: { success: boolean; data: T }) => response.data;

export const templateStudioService = {
  async list(filters?: { includeArchived?: boolean; category?: string; tag?: string; q?: string; moduleCode?: string; createdBy?: string; updatedFrom?: string; updatedTo?: string; facility?: string; department?: string; room?: string; limit?: number; offset?: number }): Promise<StudioTemplate[]> {
    return unwrap(await apiClient.get<{ success: boolean; data: StudioTemplate[] }>('/template-studio/templates', filters));
  },
  async mappings(filters?: { moduleCode?: string; contractCode?: string; status?: string }): Promise<Array<{ id: number; code: string; module_code: string; contract_code: string; version: number; status: string; mappings: unknown[] }>> {
    return unwrap(await apiClient.get('/template-studio/mappings', filters));
  },
  createMapping(payload: { code: string; moduleCode: string; contractCode: string; mappings: unknown[] }): Promise<unknown> {
    return apiClient.post<{ success: boolean; data: unknown }>('/template-studio/mappings', payload).then(response => response.data);
  },
  createMappingVersion(code: string, mappings: unknown[]): Promise<unknown> {
    return apiClient.post<{ success: boolean; data: unknown }>(`/template-studio/mappings/${encodeURIComponent(code)}/versions`, { mappings }).then(response => response.data);
  },
  publishMapping(code: string): Promise<unknown> { return apiClient.post<{ success: boolean; data: unknown }>(`/template-studio/mappings/${encodeURIComponent(code)}/publish`, {}).then(response => response.data); },
  retireMapping(code: string): Promise<unknown> { return apiClient.post<{ success: boolean; data: unknown }>(`/template-studio/mappings/${encodeURIComponent(code)}/retire`, {}).then(response => response.data); },
  previewMapping(payload: { mappings: unknown[]; sourceData: Record<string, unknown> }): Promise<Record<string, unknown>> {
    return apiClient.post<{ success: boolean; data: Record<string, unknown> }>('/template-studio/mappings/preview', payload).then(response => response.data);
  },
  exportCatalog(includeArchived = false): Promise<Blob> {
    return apiClient.get<Blob>('/template-studio/templates/export', { includeArchived }, { responseType: 'blob' });
  },
  async fields(code: string): Promise<{ fields: ContractField[]; sampleData: Record<string, unknown>; jsonSchema: JsonSchema }> {
    return unwrap(await apiClient.get<{ success: boolean; data: { fields: ContractField[]; sampleData: Record<string, unknown>; jsonSchema: JsonSchema } }>(`/template-studio/contracts/${code}/fields`));
  },
  async contractCodes(): Promise<Array<{ id: number; code: string; version: number; name: string; status: string; jsonSchema: JsonSchema }>> {
    return unwrap(await apiClient.get<{ success: boolean; data: Array<{ id: number; code: string; version: number; name: string; status: string; jsonSchema: JsonSchema }> }>('/template-studio/contracts'));
  },
  previewContract(sampleData: Record<string, unknown>): Promise<{ sampleData: Record<string, unknown>; jsonSchema: JsonSchema }> {
    return apiClient.post('/template-studio/contracts/preview', { sampleData });
  },
  createContract(code: string, name: string, version: number, sampleData: Record<string, unknown>): Promise<{ id: number; code: string; version: number }> {
    return apiClient.post('/template-studio/contracts', { code, name, version, sampleData });
  },
  createContractVersion(contractId: number): Promise<{ id: number; code: string; version: number }> {
    return apiClient.post(`/template-studio/contracts/${contractId}/versions`, {});
  },
  updateContract(contractId: number, name: string, jsonSchema: JsonSchema, sampleData?: Record<string, unknown>): Promise<void> {
    return apiClient.put(`/template-studio/contracts/${contractId}`, { name, jsonSchema, sampleData });
  },
  publishContract(contractId: number): Promise<void> { return apiClient.post(`/template-studio/contracts/${contractId}/publish`, {}); },
  retireContract(contractId: number): Promise<void> { return apiClient.post(`/template-studio/contracts/${contractId}/retire`, {}); },
  async cloneVersion(templateId: number, changeNote: string): Promise<number> {
    const response = await apiClient.post<{ success: boolean; data: { versionId: number } }>(`/template-studio/templates/${templateId}/versions`, { changeNote });
    return response.data.versionId;
  },
  async createTemplate(input: CreateTemplateInput): Promise<{ templateId: number; versionId: number }> {
    const response = await apiClient.post<{ success: boolean; data: { templateId?: number; versionId: number } }>('/template-studio/templates', input);
    return {
      templateId: response.data.templateId ?? response.data.versionId,
      versionId: response.data.versionId
    };
  },
  updateTemplate(templateId: number, input: Omit<CreateTemplateInput, 'code' | 'sampleData'>): Promise<void> {
    return apiClient.put(`/template-studio/templates/${templateId}`, input);
  },
  async cloneTemplate(templateId: number, code: string, name: string): Promise<number> {
    const response = await apiClient.post<{ success: boolean; data: { versionId: number } }>(`/template-studio/templates/${templateId}/clone`, { code, name });
    return response.data.versionId;
  },
  archiveTemplate(templateId: number): Promise<void> { return apiClient.post(`/template-studio/templates/${templateId}/archive`, {}); },
  activateTemplate(templateId: number): Promise<void> { return apiClient.post(`/template-studio/templates/${templateId}/activate`, {}); },
  async versions(templateId: number): Promise<StudioVersion[]> {
    return unwrap(await apiClient.get<{ success: boolean; data: StudioVersion[] }>(`/template-studio/templates/${templateId}/versions`));
  },
  async audit(templateId: number): Promise<StudioAudit[]> {
    return unwrap(await apiClient.get<{ success: boolean; data: StudioAudit[] }>(`/template-studio/templates/${templateId}/audit`));
  },
  async testCases(versionId: number): Promise<StudioTestCase[]> {
    return unwrap(await apiClient.get<{ success: boolean; data: StudioTestCase[] }>(`/template-studio/versions/${versionId}/test-cases`));
  },
  async testRuns(versionId: number): Promise<StudioTestRun[]> {
    return unwrap(await apiClient.get<{ success: boolean; data: StudioTestRun[] }>(`/template-studio/versions/${versionId}/test-runs`));
  },
  async runTest(versionId: number, testCaseId: number | undefined, data: Record<string, unknown>): Promise<StudioTestRun> {
    const response = await apiClient.post<{ success: boolean; data: StudioTestRun }>(`/template-studio/versions/${versionId}/test-runs`, { testCaseId, data });
    return response.data;
  },
  async runAllTests(versionId: number): Promise<{ total: number; passed: number; failed: number }> {
    const response = await apiClient.post<{ success: boolean; data: { total: number; passed: number; failed: number } }>(`/template-studio/versions/${versionId}/test-runs/all`, {});
    return response.data;
  },
  updateSampleData(versionId: number, data: Record<string, unknown>): Promise<unknown> {
    return apiClient.put(`/template-studio/versions/${versionId}/sample-data`, data);
  },
  saveTestCase(versionId: number, input: Omit<StudioTestCase, 'id'> & { id?: number }): Promise<unknown> {
    return apiClient.post(`/template-studio/versions/${versionId}/test-cases`, input);
  },
  async upload(versionId: number, file: File, onProgress?: (percent: number) => void, signal?: AbortSignal): Promise<TemplateValidation> {
    const response = onProgress
      ? await apiClient.putBinaryWithProgress<{ success: boolean; data: TemplateValidation }>(`/template-studio/versions/${versionId}/artifact`, file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', onProgress, signal)
      : await apiClient.putBinary<{ success: boolean; data: TemplateValidation }>(`/template-studio/versions/${versionId}/artifact`, file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    return response.data;
  },
  download(versionId: number): Promise<Blob> {
    return apiClient.get<Blob>(`/template-studio/versions/${versionId}/artifact`, undefined, { responseType: 'blob' });
  },
  preview(versionId: number, format: 'docx' | 'pdf', data?: Record<string, unknown>): Promise<Blob> {
    return apiClient.post<Blob>(`/template-studio/versions/${versionId}/preview`, { format, data }, { responseType: 'blob' });
  },
  enqueuePreview(versionId: number, format: 'docx' | 'pdf', data?: Record<string, unknown>): Promise<{ jobId: string }> {
    return apiClient.post(`/template-studio/versions/${versionId}/preview/jobs`, { format, data });
  },
  previewJob(jobId: string): Promise<{ state: string; progress: number; result?: unknown; failedReason?: string | null }> {
    return apiClient.get(`/template-studio/preview/jobs/${jobId}`);
  },
  previewJobArtifact(jobId: string): Promise<Blob> {
    return apiClient.get<Blob>(`/template-studio/preview/jobs/${jobId}/artifact`, undefined, { responseType: 'blob' });
  },
  queueMetrics(): Promise<{ queue: string; counts: Record<string, number>; deadLetter: { queue: string; counts: Record<string, number> }; collectedAt: string }> {
    return apiClient.get('/template-studio/preview/metrics');
  },
  notifications(role?: string): Promise<Array<{ id: number; eventType: string; targetRole?: string; message: string; isRead: boolean; createdAt: string }>> {
    return apiClient.get('/template-studio/notifications', role ? { role } : undefined);
  },
  compareVersions(templateId: number, left: number, right: number): Promise<unknown> {
    return apiClient.get(`/template-studio/templates/${templateId}/versions/compare`, { left, right });
  },
  transition(versionId: number, action: 'submit' | 'approve' | 'reject' | 'publish' | 'retire', body: Record<string, unknown> = {}): Promise<unknown> {
    return apiClient.post(`/template-studio/versions/${versionId}/${action}`, body);
  },
  rollback(versionId: number, reason: string): Promise<unknown> {
    return apiClient.post(`/template-studio/versions/${versionId}/rollback`, { reason });
  },
  deleteVersion(versionId: number): Promise<void> {
    return apiClient.delete(`/template-studio/versions/${versionId}`);
  },
  metricsSummary(): Promise<any> {
    return apiClient.get('/template-studio/metrics/summary');
  },
  usageSummary(limit = 100): Promise<Array<{ template_code: string; template_name: string; is_active: boolean; test_runs: number; passed_runs: number; failed_runs: number; last_run_at?: string; avg_duration_ms?: number }>> {
    return apiClient.get('/template-studio/metrics/usage', { limit });
  },
  exportPackage(versionId: number): Promise<Blob> {
    return apiClient.get<Blob>(`/template-studio/versions/${versionId}/package`, undefined, { responseType: 'blob' });
  },
  async previewPackage(file: File): Promise<{
    valid: boolean;
    manifest?: any;
    metadata?: any;
    conflict: boolean;
    existingTemplateId?: number;
    testCasesCount: number;
    hasDocx: boolean;
    errors: string[];
  }> {
    const response = await apiClient.postBinary<{ success: boolean; data: any }>('/template-studio/packages/preview', file, 'application/zip');
    return response.data;
  },
  async importPackage(file: File): Promise<{
    templateId: number;
    versionId: number;
    versionNumber: number;
    templateCode: string;
  }> {
    const response = await apiClient.postBinary<{ success: boolean; data: any }>('/template-studio/packages/import', file, 'application/zip');
    return response.data;
  },
  downloadStarterPack(code?: string): Promise<Blob> {
    return apiClient.get<Blob>('/template-studio/starter-pack', code ? { code } : undefined, { responseType: 'blob' });
  },
  downloadTestRunArtifact(testRunId: number, format: 'docx' | 'pdf'): Promise<Blob> {
    return apiClient.get<Blob>(`/template-studio/test-runs/${testRunId}/artifact`, { format }, { responseType: 'blob' });
  },
  deleteTestCase(testCaseId: number): Promise<void> {
    return apiClient.delete(`/template-studio/test-cases/${testCaseId}`);
  },
  async cloneTestCase(testCaseId: number): Promise<{ id: number }> {
    const response = await apiClient.post<{ success: boolean; data: { id: number } }>(`/template-studio/test-cases/${testCaseId}/clone`, {});
    return response.data;
  },
  async getInbox(filters?: { facilityId?: string; departmentId?: string }): Promise<TemplateInbox> {
    const response = await apiClient.get<{ success: boolean; data: TemplateInbox }>('/template-studio/inbox', filters);
    return response.data;
  },
  async updateAssignments(versionId: number, payload: {
    assignedDesigner?: string;
    assignedTester?: string;
    assignedReviewer?: string;
    assignedPublisher?: string;
    dueDate?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    scheduledPublishAt?: string;
  }): Promise<void> {
    await apiClient.post(`/template-studio/versions/${versionId}/assignments`, payload);
  },
  async getComments(versionId: number): Promise<TemplateComment[]> {
    const response = await apiClient.get<{ success: boolean; data: TemplateComment[] }>(`/template-studio/versions/${versionId}/comments`);
    return response.data;
  },
  async addComment(versionId: number, payload: { content: string; category?: string; authorName?: string }): Promise<TemplateComment> {
    const response = await apiClient.post<{ success: boolean; data: TemplateComment }>(`/template-studio/versions/${versionId}/comments`, payload);
    return response.data;
  },
  async updateReviewChecklist(versionId: number, checklist: Record<string, unknown>): Promise<void> {
    await apiClient.post(`/template-studio/versions/${versionId}/checklist`, checklist);
  },
  async listUserPermissions(userId?: string): Promise<TemplateUserPermission[]> {
    const response = await apiClient.get<{ success: boolean; data: TemplateUserPermission[] }>('/template-studio/permissions/users', userId ? { userId } : undefined);
    return response.data;
  },
  async grantUserPermission(payload: { userId: string; userName?: string; roleCode: string; facilityId?: string; departmentId?: string }): Promise<TemplateUserPermission> {
    const response = await apiClient.post<{ success: boolean; data: TemplateUserPermission }>('/template-studio/permissions/users', payload);
    return response.data;
  },
  async revokeUserPermission(id: number): Promise<void> {
    await apiClient.delete(`/template-studio/permissions/users/${id}`);
  },
  async getNotifications(limit = 50): Promise<TemplateNotification[]> {
    const response = await apiClient.get<{ success: boolean; data: TemplateNotification[] }>('/template-studio/notifications', { limit });
    return response.data;
  },
  async markNotificationRead(id: number): Promise<void> {
    await apiClient.post(`/template-studio/notifications/${id}/read`, {});
  },
  async processScheduledPublishes(): Promise<{ publishedCount: number }> {
    const response = await apiClient.post<{ success: boolean; data: { publishedCount: number } }>('/template-studio/scheduled-publishes/process', {});
    return response.data;
  },
  async getOperationsMetrics(): Promise<OperationsDashboardMetrics> {
    const response = await apiClient.get<{ success: boolean; data: OperationsDashboardMetrics }>('/template-studio/metrics/operations');
    return response.data;
  },
  async listOrphanArtifacts(): Promise<OrphanArtifact[]> {
    const response = await apiClient.get<{ success: boolean; data: OrphanArtifact[] }>('/template-studio/artifacts/orphans');
    return response.data;
  },
  async cleanupOrphanArtifacts(keys?: string[]): Promise<{ cleanedCount: number }> {
    const response = await apiClient.post<{ success: boolean; data: { cleanedCount: number } }>('/template-studio/artifacts/orphans/cleanup', { keys });
    return response.data;
  },
  async getSignedArtifactUrl(versionId: number, expiresIn = 300): Promise<{ signedUrl: string; expiresInSeconds: number }> {
    const response = await apiClient.get<{ success: boolean; data: { signedUrl: string; expiresInSeconds: number } }>(`/template-studio/versions/${versionId}/artifact/signed-url`, { expiresIn });
    return response.data;
  }
};
