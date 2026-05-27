

import { AppSettings, MedicalRecord, ServiceItem, TicketData, Department, Province, Ward, Specialty, Bill, PatientData, Area, Room, Vitals, LabResult, ImagingResult, PrescriptionItem, MedicalImage } from '../types';
import { MOCK_RECORDS, SERVICE_CATALOG } from '../constants';

export const getBaseUrl = () => {
  // 1. Mặc định là Origin hiện tại (Tự động nhận diện IP/Domain của Server)
  let url = window.location.origin;
  
  // 2. Kiểm tra cấu hình trong localStorage
  const saved = localStorage.getItem('vimesqms_settings');
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      if (settings.serverUrl && settings.serverUrl.trim() !== '') {
        let savedUrl = settings.serverUrl.trim();
        if (!savedUrl.startsWith('http')) {
            savedUrl = 'http://' + savedUrl;
        }

        // TỐI ƯU CHO DEPLOY: 
        // Nếu đang chạy trên Server (không phải localhost) mà cấu hình cũ là localhost 
        // thì bỏ qua cấu hình cũ để dùng IP Server hiện tại.
        const isCurrentlyLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isSavedLocal = savedUrl.includes('localhost') || savedUrl.includes('127.0.0.1');
        
        if (isCurrentlyLocal || !isSavedLocal) {
            url = savedUrl;
        }
      }
    } catch (e) {}
  }

  // 3. Chế độ DEV: Nếu chạy Vite (3000/5173) và chưa có cấu hình, mặc định trỏ về port 3000
  const isDevPort = ['3000', '5173'].includes(window.location.port);
  if (isDevPort && (url === window.location.origin || url.includes('localhost'))) {
    url = `http://${window.location.hostname}:3000`;
  }

  return url.replace(/\/$/, '');
};

let adminPassword = localStorage.getItem('vimes_admin_password') || '';

// Nghe sự kiện đăng nhập thành công để cập nhật password ngay lập tức
if (typeof window !== 'undefined') {
    window.addEventListener('adminAuthSuccess', () => {
        adminPassword = localStorage.getItem('vimes_admin_password') || '';
    });
}

export const setAdminPassword = (pass: string) => {
    adminPassword = pass;
    localStorage.setItem('vimes_admin_password', pass);
};

export const getAdminPassword = () => adminPassword;



export class ApiError extends Error {
  type: 'TIMEOUT' | 'NETWORK' | 'SERVER' | 'CLIENT' | 'UNKNOWN';
  constructor(message: string, type: 'TIMEOUT' | 'NETWORK' | 'SERVER' | 'CLIENT' | 'UNKNOWN') {
    super(message);
    this.name = 'ApiError';
    this.type = type;
  }
}

async function fetchWithTimeout(resource: string, options: RequestInit = {}) {
  const { timeout = 15000 } = options as any;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const fullUrl = getBaseUrl().startsWith('http') ? `${getBaseUrl()}${resource}` : `http://${getBaseUrl()}${resource}`;

  const headers: any = {
      ...options.headers,
      'x-admin-password': adminPassword
  };

  if (options.body && (!options.headers || !Object.keys(options.headers).some(k => k.toLowerCase() === 'content-type'))) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(fullUrl, { ...options, headers, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') throw new ApiError('Kết nối máy chủ quá hạn', 'TIMEOUT');
    throw new ApiError('Lỗi kết nối mạng', 'NETWORK');
  }
}


export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const res = await fetchWithTimeout(endpoint, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData.error || 'Lỗi hệ thống', 'SERVER');
  }
  return await res.json();
};


export const apiGetDepartments = async (): Promise<Department[]> => {
  try {
    const res = await fetchWithTimeout('/api/departments');
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (error) {
    return [
      { id: 'KB', name: 'Khoa Khám Bệnh' },
      { id: 'KBYC', name: 'Khoa Cấp Cứu' }
    ];
  }
};

export const apiGetAreas = async (): Promise<Area[]> => {
  try {
    const res = await fetchWithTimeout('/api/zoning/areas');
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (error) {
    return [
      { code: 'AREA_A', name: 'Khu vực A (Sảnh chính)' },
      { code: 'AREA_B', name: 'Khu vực B (Cấp cứu)' }
    ];
  }
};

export const apiGetRooms = async (areaId: string): Promise<Room[]> => {
  try {
    const res = await fetchWithTimeout(`/api/public/areas/${areaId}/rooms`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (error) {
    return [];
  }
};



export const apiGetPatientFromHIS = async (identityNumber: string): Promise<PatientData | null> => {
  try {
    const res = await fetchWithTimeout(`/api/his/patient/${identityNumber}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const apiGetPendingOrders = async (searchId: string): Promise<{
    success: boolean,
    patient: { patientId: string, docNo: string, name: string, isPriority: boolean, age: number },
    orders: any[]
} | null> => {
    try {
        const res = await fetchWithTimeout(`/api/his/pending-orders/${searchId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        return null;
    }
};

export const apiGetPatientBills = async (searchId: string): Promise<Bill[]> => {
  try {
    const res = await fetchWithTimeout(`/api/patient/${searchId}/bills`);
    if (!res.ok) throw new Error('Không thể lấy danh sách hóa đơn');
    return await res.json();
  } catch (error) {
    console.error('[API] Get Bills Error:', error);
    return []; // Trả về rỗng thay vì mock nếu lỗi
  }
};

export const apiCheckPaymentStatus = async (billId: string, qrKey?: number): Promise<boolean> => {
  try {
    const url = qrKey ? `/api/payment/${billId}/status?qrKey=${qrKey}` : `/api/payment/${billId}/status`;
    console.log('[API] Checking status for billId:', url);
    const res = await fetchWithTimeout(url);
    if (!res.ok) return false;
    const data = await res.json();
    console.log('[API] Payment status:', data);
    return data.isPaid === true;
  } catch (e) {
    console.error('[API] Check Payment Status Error:', e);
    return false;
  }
};

export const apiGeneratePaymentQR = async (paymentData: {
  billId: string;
  patientId?: string;
  patientName?: string;
  amount: number;
  orderid?: number;
  description?: string;
  deptid?: string;
  userid?: string;
  qrApiUrl?: string; // NEW: Custom API URL
}): Promise<{ success: boolean; transactionId?: number; qrPayload?: string; qrKey?: number; message?: string }> => {
  try {
    const res = await fetchWithTimeout('/api/payment/generate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return await res.json();
  } catch (e) {
    return { success: false, message: 'Lỗi kết nối server' };
  }
};

export const apiCompletePayment = async (transactionId: number, bankTransactionId?: string): Promise<{ success: boolean }> => {
  try {
    const res = await fetchWithTimeout(`/api/payment/${transactionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankTransactionId })
    });
    return await res.json();
  } catch (e) {
    return { success: false };
  }
};

export const apiPrintReceipt = async (receiptData: any): Promise<{ success: boolean }> => {
  try {
    const res = await fetchWithTimeout('/api/print-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(receiptData)
    });
    return await res.json();
  } catch (e) {
    return { success: false };
  }
};

export const apiGetProvinces = async (): Promise<Province[]> => {
  try {
    const res = await fetchWithTimeout('/api/provinces');
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (error) {
    return [
      { code: '01', name: 'TP. Hà Nội' },
      { code: '79', name: 'TP. Hồ Chí Minh' }
    ];
  }
};

export const apiGetWards = async (provinceCode: string): Promise<Ward[]> => {
  try {
    const res = await fetchWithTimeout(`/api/provinces/${provinceCode}/wards`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (error) {
    return [
      { code: '001', name: 'Phường Bến Nghé', type: 'Phường' },
      { code: '002', name: 'Phường Đa Kao', type: 'Phường' }
    ];
  }
};

export const apiGetSpecialties = async (Specialty: string): Promise<Specialty[]> => {
  try {
    const res = await fetchWithTimeout(`/api/specialties/${Specialty}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (error) {
    return [
      { id: "1", name: "Khám Nội tổng quát", deptid: ["KB"] },
      { id: "2", name: "Khám Nhi", deptid: ["KB"] }
    ];
  }
};

export const apiGetPatientVisits = async (searchId: string): Promise<MedicalRecord[]> => {
  try {
    const res = await fetchWithTimeout(`/api/patient/${searchId}/visits`);
    if (!res.ok) throw new Error('Không thể lấy lịch sử khám');
    const data = await res.json();
    // Ánh xạ dữ liệu từ backend (date, diagnosis...) sang MedicalRecord interface
    return data.map((item: any) => ({
      id: item.id,
      visitDate: item.date,
      diagnosis: item.diagnosis,
      department: item.department,
      patientName: item.patientName || '',
      doctorName: item.doctorName || 'Đang cập nhật',
    }));
  } catch (error) {
    console.error('[API] Get Visits Error:', error);
    return [];
  }
};

export const apiGetMedicalRecord = async (recordId: string): Promise<MedicalRecord | null> => {
  try {
    // Fetch all data in parallel
    const [basicData, vitals, labResults, imagingResults, prescription, images] = await Promise.all([
      fetchWithTimeout(`/api/records/${recordId}`).then(res => res.ok ? res.json() : null),
      fetchWithTimeout(`/api/records/${recordId}/vitals`).then(res => res.ok ? res.json() : null),
      fetchWithTimeout(`/api/records/${recordId}/lab-results`).then(res => res.ok ? res.json() : []),
      fetchWithTimeout(`/api/records/${recordId}/imaging-results`).then(res => res.ok ? res.json() : []),
      fetchWithTimeout(`/api/records/${recordId}/prescription`).then(res => res.ok ? res.json() : []),
      fetchWithTimeout(`/api/records/${recordId}/images`).then(res => res.ok ? res.json() : [])
    ]);

    if (!basicData) return null;

    // Combine all data into MedicalRecord
    return {
      id: basicData.id,
      patientName: basicData.patientName,
      gender: basicData.gender || 'Nam',
      dob: basicData.dob,
      age: basicData.age || 0,
      address: basicData.address,
      insuranceCard: basicData.insuranceCard,
      identityNumber: basicData.identityNumber,
      visitDate: basicData.date,
      doctorName: basicData.doctorName || 'Đang cập nhật',
      department: basicData.department || '',
      reason: basicData.reason || '',
      diagnosis: basicData.diagnosis || '',
      icd10: basicData.icd10,
      vitals: vitals || {
        pulse: 0,
        temperature: 0,
        bloodPressure: '0/0',
        respiratoryRate: 0,
        weight: 0,
        height: 0,
        bmi: 0,
        spo2: 0
      },
      labResults: labResults || [],
      imagingResults: imagingResults || [],
      prescription: prescription || [],
      images: images || []
    };
  } catch (error) {
    console.error('[API] Get Medical Record Error:', error);
    return null;
  }
};

// Individual endpoint functions for flexible usage

export const apiGetRecordVitals = async (recordId: string): Promise<Vitals | null> => {
  try {
    const res = await fetchWithTimeout(`/api/records/${recordId}/vitals`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('[API] Get Vitals Error:', error);
    return null;
  }
};

export const apiGetRecordLabResults = async (recordId: string): Promise<LabResult[]> => {
  try {
    const res = await fetchWithTimeout(`/api/records/${recordId}/lab-results`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('[API] Get Lab Results Error:', error);
    return [];
  }
};

export const apiGetRecordImagingResults = async (recordId: string): Promise<ImagingResult[]> => {
  try {
    const res = await fetchWithTimeout(`/api/records/${recordId}/imaging-results`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('[API] Get Imaging Results Error:', error);
    return [];
  }
};

export const apiGetRecordPrescription = async (recordId: string): Promise<PrescriptionItem[]> => {
  try {
    const res = await fetchWithTimeout(`/api/records/${recordId}/prescription`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('[API] Get Prescription Error:', error);
    return [];
  }
};

export const apiGetRecordImages = async (recordId: string): Promise<MedicalImage[]> => {
  try {
    const res = await fetchWithTimeout(`/api/records/${recordId}/images`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('[API] Get Images Error:', error);
    return [];
  }
};

/**
 * Tạo phiếu đăng ký.
 * Trả về { success: boolean, data: TicketData } (dữ liệu đã được HIS xử lý)
 */
export const apiCreateTicket = async (ticket: TicketData, kioskId: string, forceOffline: boolean = false): Promise<{ success: boolean, data: TicketData }> => {
  if (forceOffline) return { success: true, data: ticket };
  try {
    // Prepare payload with both single and multiple specialty codes
    const payload = {
      ...ticket,
      kioskId,
      specialty_code: ticket.specialtyCode, // Single code for backward compatibility
      specialty_codes: ticket.specialtyCodes // Array of codes for multi-selection
    };

    const res = await fetchWithTimeout('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Lỗi máy chủ HIS', 'SERVER');
    }

    const responseData = await res.json();
    console.log('responseData', responseData);
    return {
      success: true,
      data: responseData.data || ticket // Trả về dữ liệu server hoặc fallback data cũ
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Lỗi kết nối mạng', 'NETWORK');
  }
};

export const apiGetServices = async (): Promise<ServiceItem[]> => {
  try {
    const res = await fetchWithTimeout('/api/services');
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (error) {
    return SERVICE_CATALOG;
  }
};

export const apiSubmitFeedback = async (rating: number, comment: string, categories: string[]): Promise<boolean> => {
  try {
    await fetchWithTimeout('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment, categories })
    });
    return true;
  } catch (error) {
    return true;
  }
};

/**
 * Lấy số trực tiếp nhanh (Quick Number) - không cần qua HIS đầy đủ
 */
export const apiQuickNumber = async (input: {
  kioskId: string;
  kioskDeptCode: string;
  kioskType?: string;
  isPriority: boolean;
  patientName?: string;
  patientId?: string;
  identityNumber?: string;
  selectedRooms?: string[];
  areaCode?: string;
}): Promise<{ success: boolean; data: any }> => {
  try {
    const res = await fetchWithTimeout('/api/queue/quick-number', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Lỗi cấp số', 'SERVER');
    }

    return await res.json();
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Lỗi kết nối mạng', 'NETWORK');
  }
};

