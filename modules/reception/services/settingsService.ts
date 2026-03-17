
import axios from 'axios';

const API_URL = '/api/v1/reception/settings';

export interface PrinterConfig {
    enabled: boolean;
    type: 'DRIVER' | 'LAN' | 'USB' | 'FILE';
    printerName: string;
    printMode: 'TEXT' | 'IMAGE';
    encodingMode: 'UTF8' | 'CODEPAGE' | 'NO_ACCENTS';
    language: 'ESC' | 'TSPL';
    width: string;
    ipAddress?: string;
    port?: number;
    printerId?: string;
    webProxyUrl?: string;
    printTemplate?: string;
    codePage?: number;
    removeAccents?: boolean;
    scannerMode?: 'CAMERA' | 'QR_DEVICE' | 'CHIP_READER';
}

export interface RoomSetting {
    id: string;
    name: string;
    roomName: string;
    deptId: string;
    maxPerDay: number;
    receptionEnabled: boolean;
    active: string;
}

class ReceptionSettingsService {
    async getPrinterConfig(): Promise<PrinterConfig> {
        const res = await axios.get(`${API_URL}/printer`);
        return res.data;
    }

    async updatePrinterConfig(config: PrinterConfig): Promise<void> {
        await axios.put(`${API_URL}/printer`, config);
    }

    async getRoomsSettings(deptId?: string): Promise<RoomSetting[]> {
        const res = await axios.get(`${API_URL}/rooms`, { params: { deptId } });
        return res.data;
    }

    async updateRoomSettings(id: string, data: Partial<RoomSetting>): Promise<void> {
        await axios.put(`${API_URL}/rooms/${id}`, data);
    }
}

export const settingsService = new ReceptionSettingsService();
