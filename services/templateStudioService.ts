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
}

export interface StudioTemplate {
  id: number;
  code: string;
  name: string;
  documentType: string;
  moduleCode?: string;
  activeVersionId?: number;
  latestVersion?: StudioVersion;
}

export interface ContractField {
  path: string;
  label: string;
  type: string;
  required: boolean;
  example?: unknown;
  carboneTag?: string;
  children?: ContractField[];
}

export interface StudioAudit { id: number; actorId: string; action: string; entityId: number; detail: Record<string, unknown>; createdAt: string }
export interface StudioTestCase { id: number; name: string; testType: string; inputData: Record<string, unknown>; isRequired: boolean }

const unwrap = <T>(response: { success: boolean; data: T }) => response.data;

export const templateStudioService = {
  async list(): Promise<StudioTemplate[]> {
    return unwrap(await apiClient.get<{ success: boolean; data: StudioTemplate[] }>('/template-studio/templates'));
  },
  async fields(code: string): Promise<{ fields: ContractField[]; sampleData: Record<string, unknown> }> {
    return unwrap(await apiClient.get<{ success: boolean; data: { fields: ContractField[]; sampleData: Record<string, unknown> } }>(`/template-studio/contracts/${code}/fields`));
  },
  async cloneVersion(templateId: number, changeNote: string): Promise<number> {
    const response = await apiClient.post<{ success: boolean; data: { versionId: number } }>(`/template-studio/templates/${templateId}/versions`, { changeNote });
    return response.data.versionId;
  },
  async versions(templateId: number): Promise<StudioVersion[]> {
    return unwrap(await apiClient.get<{ success: boolean; data: StudioVersion[] }>(`/template-studio/templates/${templateId}/versions`));
  },
  async audit(templateId: number): Promise<StudioAudit[]> {
    return unwrap(await apiClient.get<{ success: boolean; data: StudioAudit[] }>(`/template-studio/templates/${templateId}/audit`));
  },
  async testCases(versionId: number): Promise<StudioTestCase[]> {
    return unwrap(await apiClient.get<{ success: boolean; data: StudioTestCase[] }>(`/template-studio/versions/${versionId}/test-cases`));
  },
  updateSampleData(versionId: number, data: Record<string, unknown>): Promise<unknown> {
    return apiClient.put(`/template-studio/versions/${versionId}/sample-data`, data);
  },
  saveTestCase(versionId: number, input: Omit<StudioTestCase, 'id'> & { id?: number }): Promise<unknown> {
    return apiClient.post(`/template-studio/versions/${versionId}/test-cases`, input);
  },
  async upload(versionId: number, file: File): Promise<TemplateValidation> {
    const response = await apiClient.putBinary<{ success: boolean; data: TemplateValidation }>(`/template-studio/versions/${versionId}/artifact`, file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    return response.data;
  },
  download(versionId: number): Promise<Blob> {
    return apiClient.get<Blob>(`/template-studio/versions/${versionId}/artifact`, undefined, { responseType: 'blob' });
  },
  preview(versionId: number, format: 'docx' | 'pdf', data?: Record<string, unknown>): Promise<Blob> {
    return apiClient.post<Blob>(`/template-studio/versions/${versionId}/preview`, { format, data }, { responseType: 'blob' });
  },
  transition(versionId: number, action: 'submit' | 'approve' | 'reject' | 'publish' | 'retire'): Promise<unknown> {
    return apiClient.post(`/template-studio/versions/${versionId}/${action}`, {});
  }
};
