import axios from 'axios';

export interface PacsServerInfo {
  success: boolean;
  serverTime: string;
  orthanc: {
    online: boolean;
    version: string;
    name: string;
    dicomAet: string;
    dicomPort: number;
    httpPort: number;
    dicomwebUrl: string;
    storageMode: string;
    statistics: {
      countPatients: number;
      countStudies: number;
      countSeries: number;
      countInstances: number;
      totalDiskSizeMB: number;
      totalUncompressedSizeMB: number;
    };
  };
  database: {
    online: boolean;
    host: string;
    port: number;
    database: string;
    userAccounts: number;
    diagnosticReports: number;
    worklistOrders: number;
  };
  modalities: Array<{
    id: string;
    name: string;
    aet: string;
    host: string;
    port: number;
    type: string;
    manufacturer: string;
    status: string;
  }>;
}

export interface DicomEchoResult {
  success: boolean;
  aet: string;
  host: string;
  port: number;
  latencyMs: number;
  message: string;
  timestamp: string;
}

const API_BASE = '/api';

export const pacsServerService = {
  async getServerInfo(): Promise<PacsServerInfo> {
    const res = await axios.get(`${API_BASE}/pacs/server-info`);
    return res.data;
  },

  async pingDicomEcho(modality: { aet: string; host: string; port: number }): Promise<DicomEchoResult> {
    const res = await axios.post(`${API_BASE}/pacs/echo`, modality);
    return res.data;
  },
};
