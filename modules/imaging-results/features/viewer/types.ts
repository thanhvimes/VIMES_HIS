export type ActiveTool = 'wl' | 'pan' | 'zoom' | 'ruler' | 'roi';

export interface Measurement {
  id: string;
  type?: 'ruler' | 'roi';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distance?: number;
  areaCm2?: number;
  perimeterMm?: number;
  meanHu?: number;
  minHu?: number;
  maxHu?: number;
  sliceIndex: number;
  sopInstanceUid?: string;
  pixelSpacing?: [number, number];
}

export interface RealInstance {
  instanceId: string;
  sopInstanceUid: string;
  instanceNumber: number;
  imageUrl: string;
  renderedUrl?: string;
  pixelSpacing?: [number, number];
  windowCenter?: number;
  windowWidth?: number;
  sliceThickness?: number;
  sliceLocation?: number;
}

export interface ReportData {
  findings: string;
  impression: string;
  recommendation: string;
  readingDoctor: string;
  status: string;
  signedAt?: string;
}

export interface CineState {
  isPlaying: boolean;
  fps: number;
}

export const WL_PRESETS = [
  { label: 'Chuẩn', b: 100, c: 100 },
  { label: 'Phổi (Lung)', b: 110, c: 90 },
  { label: 'Mô Mềm', b: 120, c: 135 },
  { label: 'Xương (Bone)', b: 140, c: 160 },
  { label: 'Sọ Não (Brain)', b: 110, c: 120 },
];

export interface FindingPreset {
  id: string;
  title: string;
  modality: 'US' | 'XR' | 'CT' | 'MR';
  findings: string;
  impression: string;
  recommendation: string;
}

export const NORMAL_FINDING_PRESETS: FindingPreset[] = [
  {
    id: 'us_abdomen_normal',
    title: 'Siêu Âm Ổ Bụng Tổng Quát (Bình Thường)',
    modality: 'US',
    findings: `• GAN: Kích thước trong giới hạn bình thường, bờ đều, nhu mô đồng nhất, không thấy nốt khu trú hay vôi hóa. Tĩnh mạch cửa và tĩnh mạch trên gan không giãn.\n• TÚI MẬT & ĐƯỜNG MẬT: Túi mật căng vừa, thành mỏng nhẵn, lòng không thấy sỏi hay polyp. Đường mật trong và ngoài gan không giãn.\n• TỤY & LÁCH: Kích thước và hồi âm bình thường, ống tụy không giãn. Lách cấu trúc đồng nhất.\n• HAI THẬN: Vị trí và kích thước bình thường, ranh giới vỏ tủy rõ, đài bể thận không giãn, không có sỏi.\n• BÀNG QUANG: Nước tiểu trong, thành mỏng nhẵn, không thấy sỏi hay khối u sùi.\n• DỊCH TỰ DO: Không thấy dịch trong khoang màng bụng.`,
    impression: 'Hiện tại chưa thấy hình ảnh bất thường bệnh lý trên siêu âm ổ bụng tổng quát.',
    recommendation: 'Khám và theo dõi định kỳ 6 tháng/lần.'
  },
  {
    id: 'us_thyroid_normal',
    title: 'Siêu Âm Tuyến Giáp (Bình Thường)',
    modality: 'US',
    findings: `• Hai thùy và eo tuyến giáp kích thước trong giới hạn bình thường.\n• Nhu mô hai thùy tuyến giáp đồng nhất, không thấy tổn thương khu trú dạng nang hay đặc (TIRADS 1).\n• Vận tốc dòng chảy mạch máu trong tuyến giáp trong giới hạn bình thường trên siêu âm Doppler.\n• Hạch cổ hai bên: Không thấy hạch phì đại bất thường.`,
    impression: 'Tuyến giáp bình thường (TIRADS 1).',
    recommendation: 'Kiểm tra sức khỏe định kỳ.'
  },
  {
    id: 'xr_chest_normal',
    title: 'X-Quang Ngực Thẳng (Bình Thường)',
    modality: 'XR',
    findings: `• Hai phế trường thông thoáng tốt, không thấy tổn thương đông đặc, nốt mờ hay thâm nhiễm phế nang bất thường.\n• Cung tim và bóng tim kích thước trong giới hạn sinh lý bình thường (Chỉ số tim/lồng ngực < 0.5).\n• Rốn phổi hai bên bình thường, không phì đại hạch.\n• Các góc tâm hoành và sườn hoành hai bên sáng nhọn, không có dịch màng phổi.\n• Khung xương lồng ngực và mô mềm thành ngực không thấy tổn thương bất thường.`,
    impression: 'Hình ảnh tim phổi trong giới hạn bình thường.',
    recommendation: 'Theo dõi lâm sàng.'
  },
  {
    id: 'ct_brain_normal',
    title: 'CT Sọ Não Không Tiêm Thuốc (Bình Thường)',
    modality: 'CT',
    findings: `• Nhu mô não hai bán cầu đại não và tiểu não có cấu trúc tỷ trọng bình thường, ranh giới chất xám - chất trắng rõ ràng.\n• Không thấy hình ảnh ổ giảm tỷ trọng nhồi máu não hay tăng tỷ trọng xuất huyết cấp tính nội sọ.\n• Hệ thống não thất và các rãnh cuộn não cân đối hai bên, không giãn, không đè ép lệch đường giữa.\n• Không thấy tụ máu ngoài màng cứng hoặc dưới màng cứng.\n• Cửa sổ xương sọ vòm và nền sọ không thấy đường nứt vỡ xương bất thường.`,
    impression: 'Chưa thấy hình ảnh tổn thương cấp tính trên phim chụp CT sọ não.',
    recommendation: 'Kết hợp theo dõi các triệu chứng thần kinh lâm sàng.'
  }
];
