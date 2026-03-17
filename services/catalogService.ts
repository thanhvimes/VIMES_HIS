// ==================== SHARED CATALOG SERVICE ====================
// File: services/catalogService.ts

import { apiClient } from './apiClient';

export interface CatalogItem {
    id?: string | number;
    code?: string | number;
    name: string;
    [key: string]: any;
}

// Simple in-memory cache to store promises of requests
const cache: Record<string, Promise<any>> = {};

class CatalogService {
    private getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
        if (!cache[key]) {
            cache[key] = fetchFn();
        }
        return cache[key];
    }

    // Clear cache if needed (e.g. manual refresh)
    public clearCache(key?: string) {
        if (key) {
            delete cache[key];
        } else {
            Object.keys(cache).forEach(k => delete cache[k]);
        }
    }

    /**
     * Lấy danh sách Tỉnh/Thành phố
     */
    public async getProvinces(): Promise<CatalogItem[]> {
        return this.getCached('provinces', () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/provinces')
        );
    }

    /**
     * Lấy danh sách Phường/Xã theo Tỉnh
     */
    public async getWards(provinceId: string | number): Promise<CatalogItem[]> {
        // Không cache theo provinceId vì số lượng tổ hợp có thể lớn, 
        // hoặc có thể cache theo key 'wards_' + provinceId
        const key = `wards_${provinceId}`;
        return this.getCached(key, () =>
            apiClient.get<CatalogItem[]>(`/reception/catalogs/wards/${provinceId}`)
        );
    }

    /**
     * Lấy danh sách Khoa (loại Khám bệnh)
     */
    public async getDepartments(): Promise<CatalogItem[]> {
        return this.getCached('departments', () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/departments')
        );
    }

    /**
     * Lấy danh sách Phòng khám
     */
    public async getRooms(deptId?: string | number): Promise<CatalogItem[]> {
        const key = deptId ? `rooms_${deptId}` : 'rooms_all';
        return this.getCached(key, () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/rooms', { deptId })
        );
    }

    /**
     * Lấy danh sách Dân tộc
     */
    public async getEthnicities(): Promise<CatalogItem[]> {
        return this.getCached('ethnicities', () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/ethnicities')
        );
    }

    /**
     * Lấy danh sách Nghề nghiệp
     */
    public async getOccupations(): Promise<CatalogItem[]> {
        return this.getCached('occupations', () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/occupations')
        );
    }

    /**
     * Lấy danh sách Kiểu khám (Dịch vụ/BHYT...)
     */
    public async getExamTypes(): Promise<CatalogItem[]> {
        return this.getCached('examTypes', () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/examtypes')
        );
    }

    /**
     * Lấy danh sách Đối tượng (Dịch vụ, BHYT...)
     */
    public async getObjects(): Promise<CatalogItem[]> {
        return this.getCached('objects', () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/objects')
        );
    }

    /**
     * Lấy danh sách Bệnh viện
     */
    public async getHospitals(): Promise<CatalogItem[]> {
        return this.getCached('hospitals', () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/hospitals')
        );
    }

    /**
     * Lấy danh sách Người tiếp đón theo Khoa
     */
    public async getReceptionists(deptId: string): Promise<CatalogItem[]> {
        const key = `receptionists_${deptId}`;
        return this.getCached(key, () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/receptionists', { deptId })
        );
    }

    public async getNations(): Promise<CatalogItem[]> {
        return this.getCached('nations', () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/nations')
        );
    }

    public async getRelationships(): Promise<CatalogItem[]> {
        return this.getCached('relationships', () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/relationships')
        );
    }

    public async getWorkplaces(): Promise<CatalogItem[]> {
        return this.getCached('workplaces', () =>
            apiClient.get<CatalogItem[]>('/reception/catalogs/workplaces')
        );
    }
}

export const catalogService = new CatalogService();
