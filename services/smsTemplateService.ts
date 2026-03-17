// SMS Template Service for Frontend
import axios from 'axios';

const API_BASE_URL = '/api/v1/sms-templates';

export interface SMSTemplate {
    template_id: number;
    template_type: string;
    dept_code: string | null;
    patient_type: string | null;
    template_content: string;
    description: string | null;
    is_active: boolean;
    created_by?: string;
    created_at?: string;
    updated_by?: string;
    updated_at?: string;
}

export interface TemplateFilters {
    templateType?: string;
    deptCode?: string | null;
    patientType?: string | null;
    isActive?: boolean;
}

class SMSTemplateService {
    async getAllTemplates(filters?: TemplateFilters & { effective?: boolean }): Promise<SMSTemplate[]> {
        const params = new URLSearchParams();
        if (filters?.templateType) params.append('templateType', filters.templateType);
        if (filters?.deptCode !== undefined) params.append('deptCode', filters.deptCode || 'null');
        if (filters?.patientType !== undefined) params.append('patientType', filters.patientType || 'null');
        if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
        if (filters?.effective !== undefined) params.append('effective', String(filters.effective));

        const response = await axios.get(`${API_BASE_URL}?${params.toString()}`);
        return response.data.data;
    }

    async getTemplate(type: string, deptCode: string | null, patientType: string | null): Promise<SMSTemplate> {
        const response = await axios.get(`${API_BASE_URL}/${type}/${deptCode || 'null'}/${patientType || 'null'}`);
        return response.data.data;
    }

    async createTemplate(template: Partial<SMSTemplate>): Promise<SMSTemplate> {
        const response = await axios.post(API_BASE_URL, template);
        return response.data.data;
    }

    async updateTemplate(id: number, updates: Partial<SMSTemplate>): Promise<SMSTemplate> {
        const response = await axios.put(`${API_BASE_URL}/${id}`, updates);
        return response.data.data;
    }

    async deleteTemplate(id: number): Promise<void> {
        await axios.delete(`${API_BASE_URL}/${id}`);
    }

    async getTemplateTypes(): Promise<string[]> {
        const response = await axios.get(`${API_BASE_URL}/meta/types`);
        return response.data.data;
    }

    async getPatientTypes(): Promise<Array<{ code: string; name: string }>> {
        const response = await axios.get(`${API_BASE_URL}/meta/patient-types`);
        return response.data.data;
    }
}

export const smsTemplateService = new SMSTemplateService();
