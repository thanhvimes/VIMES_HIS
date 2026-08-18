export interface PortalReport {
  id: string;
  studyInstanceUid: string;
  patientId: string;
  patientName: string;
  gender?: string;
  dob?: string;
  modality: string;
  studyDate: string;
  description?: string;
  findings: string;
  impression: string;
  recommendation?: string;
  technique?: string;
  status: string;
  createdBy?: string;
  createdAt?: string;
  signature?: {
    doctorName: string;
    doctorRole: string;
    licenseNumber: string;
    signedAt: string;
    signatureHash: string;
    verificationQrCodeUrl: string;
  };
}

export interface KeyImageItem {
  id: string;
  type: string;
  badge: string;
  title: string;
  url: string;
  desc: string;
  slices: string;
  kVp: string;
  thickness: string;
}

export const KEY_IMAGES_DEFAULT: KeyImageItem[] = [
  {
    id: 'img-3d',
    type: '3D Volume Rendering',
    badge: '3D TÁI TẠO ĐA CHIỀU',
    title: 'Tái tạo 3D Thể tích Xương lồng ngực & Cột sống',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=85',
    desc: 'Dựng hình giải phẫu 3D đa bình diện (MPR / 3D VR) - Khung xương lồng ngực đối xứng, không gãy xẹp',
    slices: '128 Lát cắt',
    kVp: '120 kVp · 250 mAs',
    thickness: '0.625 mm'
  },
  {
    id: 'img-axial',
    type: 'Axial CT (Cửa sổ Phổi)',
    badge: 'LÁT CẮT NGANG AXIAL',
    title: 'Lát cắt Nhu mô Phổi 2 bên (High-Resolution CT)',
    url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&auto=format&fit=crop&q=85',
    desc: 'Cửa sổ nhu mô phổi (W: 1500 / L: -600): Thông khí đều 2 phế trường, không nốt mờ khu trú',
    slices: 'Slice 42 / 128',
    kVp: '120 kVp · Standard Recon',
    thickness: '1.25 mm'
  },
  {
    id: 'img-mediastinum',
    type: 'Coronal CT (Cửa sổ Trung thất)',
    badge: 'LÁT CẮT ĐỨNG CORONAL',
    title: 'Lát cắt Cửa sổ Trung thất & Quai Động mạch',
    url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1200&auto=format&fit=crop&q=85',
    desc: 'Cửa sổ trung thất (W: 350 / L: 40): Bóng tim không to, quai động mạch chủ mềm mại',
    slices: 'Slice 68 / 128',
    kVp: '120 kVp · Contrast Enhanced',
    thickness: '1.25 mm'
  }
];
