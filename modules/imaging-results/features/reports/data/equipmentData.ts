export const DEFAULT_DEVICES: Record<string, string[]> = {
  US: [
    'Máy Siêu Âm Màu 4D GE Voluson E8 Expert (Phòng SA01)',
    'Máy Siêu Âm Tim Mạch Philips EPIQ 7C (Phòng SA02)',
    'Máy Siêu Âm Đa Tổng Quát Samsung HS70A (Phòng SA03)',
    'Máy Siêu Âm Xách Tay Mindray M9 (Phòng Cấp Cứu)'
  ],
  CT: [
    'Máy Chụp Cắt Lớp Vi Tính Siemens SOMATOM go.Top 64 Lát (Phòng CT01)',
    'Máy CT Scanner GE Revolution ACTs 32 Lát (Phòng CT02)',
    'Hệ Thống CT 128 Lát Canon Aquilion Lightning (Phòng CT03)'
  ],
  MR: [
    'Hệ Thống Cộng Hưởng Từ Philips Achieva 1.5T dStream (Phòng MRI01)',
    'Máy MRI Siemens MAGNETOM Amira 1.5T (Phòng MRI02)',
    'Máy MRI GE Signa Explorer 1.5T (Phòng MRI03)'
  ],
  CR: [
    'Hệ Thống X-Quang Kỹ Thuật Số Carestream DRX-Evolution (Phòng XQ01)',
    'Máy X-Quang Cao Tần Shimadzu RADspeed Pro (Phòng XQ02)',
    'Máy X-Quang Di Động C-Arm GE OEC One (Phòng Mổ)'
  ],
  DX: [
    'Hệ Thống X-Quang Kỹ Thuật Số Carestream DRX-Evolution (Phòng XQ01)',
    'Máy X-Quang Cao Tần Shimadzu RADspeed Pro (Phòng XQ02)'
  ],
  ES: [
    'Hệ Thống Nội Soi Tiêu Hóa Olympus EVIS EXERA III CV-190 (Phòng NS01)',
    'Hệ Thống Nội Soi Tai Mũi Họng Karl Storz HD (Phòng NS02)'
  ]
};

export const TECHNOLOGIST_LIST = [
  'KTV. Đỗ Hoàng Long',
  'KTV. Lê Minh Quân',
  'KTV. Vũ Thị Lan',
  'KTV. Nguyễn Hải Đăng',
  'KTV. Hoàng Thu Hà',
  'KTV. Phạm Quốc Hưng'
];

export const DOCTOR_LIST = [
  'BS. CKI. Phạm Thanh Tùng',
  'BS. CKII. Nguyễn Văn An',
  'BS. CKI. Lê Hoàng Cường',
  'BS. Võ Minh Triết',
  'BS. Hoàng Thị Thu',
];

export const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch { /* ignore */ }
  return dateStr;
};
