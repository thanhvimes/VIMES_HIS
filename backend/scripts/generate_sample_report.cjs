const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Read ksk_mau_data.xlsx
const srcPath = 'D:/AI/VIMES_HIS/modules/health-check-sync/docs/ksk_mau_data.xlsx';
const wbSrc = xlsx.readFile(srcPath);
const sheet = wbSrc.Sheets[wbSrc.SheetNames[0]];
const rawRows = xlsx.utils.sheet_to_json(sheet);

console.log('Read ' + rawRows.length + ' rows from ksk_mau_data.xlsx');

// Import helper functions or define them here for node execution
function readVietnameseCurrency(num) {
  if (!num || isNaN(num) || num === 0) return 'Không đồng ./.';
  num = Math.round(Math.abs(num));
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readBlock(n, showZeroHundred) {
    let h = Math.floor(n / 100);
    let t = Math.floor((n % 100) / 10);
    let u = n % 10;
    let res = '';
    if (h > 0 || showZeroHundred) {
      res += digits[h] + ' trăm ';
    }
    if (t > 1) {
      res += digits[t] + ' mươi ';
      if (u === 1) res += 'mốt ';
      else if (u === 5) res += 'lăm ';
      else if (u > 0) res += digits[u] + ' ';
    } else if (t === 1) {
      res += 'mười ';
      if (u === 5) res += 'lăm ';
      else if (u > 0) res += digits[u] + ' ';
    } else if (t === 0 && (h > 0 || showZeroHundred)) {
      if (u > 0) res += 'linh ' + digits[u] + ' ';
    } else if (u > 0) {
      res += digits[u] + ' ';
    }
    return res.trim();
  }

  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  let strNum = String(num);
  const blocks = [];
  while (strNum.length > 0) {
    blocks.unshift(parseInt(strNum.slice(-3), 10));
    strNum = strNum.slice(0, -3);
  }

  const words = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b > 0) {
      const bStr = readBlock(b, i > 0);
      const scale = scales[blocks.length - 1 - i];
      words.push(bStr + (scale ? ' ' + scale : ''));
    }
  }

  let result = words.join(' ').trim();
  result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng ./.';
  return result.replace(/\s+/g, ' ');
}

// 10 mock clinical records corresponding to 10 employees/students in ksk_mau_data
const mockClinicalData = [
  {
    height: 165, weight: 52, bp: '115/75', pulse: 76,
    mat: 'Bình thường', tmh: 'Bình thường', rhm: 'Cao răng độ 1', noi: 'Bình thường', ngoai: 'Bình thường', dalieu: 'Bình thường', phukhoa: '',
    blood_group: '"O"', rbc: '4.82', hgb: '142.0', wbc: '5.6', plt: '235.0',
    hdl: '1.25', ure: '4.2', chol: '4.65', uric: '340.0', alt: '18.0', trig: '1.35', ast: '21.0', ldl: '2.65', glu: '5.1', ggt: '19.0',
    urine_glu: 'norm', urine_pro: 'neg', urine_ery: 'neg', urine_leu: 'neg',
    ft4: '1.42', psa: '0.65', tsh: '2.15', ft3: '4.85',
    us_thyroid: 'Hình ảnh siêu âm tuyến giáp bình thường',
    us_abdomen: 'Hình ảnh siêu âm ổ bụng bình thường',
    us_breast: '',
    xray: 'Hiện chưa thấy bất thường trên phim chụp X-quang ngực thẳng',
    cytology: '',
    phanloai: 'II',
    conclusion: 'Cao răng độ 1. Hiện tại sức khỏe loại II.'
  },
  {
    height: 158, weight: 48, bp: '110/70', pulse: 78,
    mat: '2 Mắt cận thị nhẹ', tmh: 'Bình thường', rhm: 'Bình thường', noi: 'Bình thường', ngoai: 'Bình thường', dalieu: 'Bình thường', phukhoa: 'Bình thường',
    blood_group: '"A"', rbc: '4.55', hgb: '132.0', wbc: '5.8', plt: '248.0',
    hdl: '1.30', ure: '3.9', chol: '4.45', uric: '280.0', alt: '16.0', trig: '1.15', ast: '19.0', ldl: '2.45', glu: '4.9', ggt: '15.0',
    urine_glu: 'norm', urine_pro: 'neg', urine_ery: 'neg', urine_leu: 'neg',
    ft4: '1.38', psa: '', tsh: '2.30', ft3: '4.70',
    us_thyroid: 'Hình ảnh siêu âm tuyến giáp bình thường',
    us_abdomen: 'Hình ảnh siêu âm ổ bụng bình thường',
    us_breast: 'Hình ảnh siêu âm tuyến vú bình thường',
    xray: 'Hiện chưa thấy bất thường trên phim chụp X-quang ngực thẳng',
    cytology: 'Âm tính',
    phanloai: 'II',
    conclusion: 'Tật khúc xạ (Cận thị 2 mắt). Sức khỏe loại II.'
  },
  {
    height: 125, weight: 26, bp: '95/60', pulse: 84,
    mat: 'Bình thường', tmh: 'Viêm mũi dị ứng', rhm: 'Sâu răng R54', noi: 'Bình thường', ngoai: 'Bình thường', dalieu: 'Bình thường', phukhoa: '',
    blood_group: '"B"', rbc: '4.68', hgb: '135.0', wbc: '6.2', plt: '260.0',
    hdl: '1.35', ure: '3.6', chol: '4.10', uric: '240.0', alt: '15.0', trig: '0.95', ast: '18.0', ldl: '2.20', glu: '4.8', ggt: '14.0',
    urine_glu: 'norm', urine_pro: 'neg', urine_ery: 'neg', urine_leu: 'neg',
    ft4: '1.45', psa: '0.40', tsh: '2.05', ft3: '5.10',
    us_thyroid: 'Hình ảnh siêu âm tuyến giáp bình thường',
    us_abdomen: 'Hình ảnh siêu âm ổ bụng bình thường',
    us_breast: '',
    xray: 'Hiện chưa thấy bất thường trên phim chụp X-quang ngực thẳng',
    cytology: '',
    phanloai: 'III',
    conclusion: 'Sâu răng, Viêm mũi dị ứng. Sức khỏe loại III.'
  },
  {
    height: 162, weight: 50, bp: '115/75', pulse: 75,
    mat: '2 Mắt tật khúc xạ', tmh: 'Bình thường', rhm: 'Bình thường', noi: 'Bình thường', ngoai: 'Bình thường', dalieu: 'Trứng cá vùng mặt', phukhoa: 'Bình thường',
    blood_group: '"AB"', rbc: '4.40', hgb: '128.0', wbc: '5.4', plt: '230.0',
    hdl: '1.40', ure: '4.1', chol: '4.70', uric: '260.0', alt: '17.0', trig: '1.20', ast: '20.0', ldl: '2.50', glu: '5.0', ggt: '16.0',
    urine_glu: 'norm', urine_pro: 'neg', urine_ery: 'neg', urine_leu: 'neg',
    ft4: '1.50', psa: '', tsh: '1.95', ft3: '4.95',
    us_thyroid: 'Hình ảnh siêu âm tuyến giáp bình thường',
    us_abdomen: 'Hình ảnh siêu âm ổ bụng bình thường',
    us_breast: 'Hình ảnh siêu âm tuyến vú bình thường',
    xray: 'Hiện chưa thấy bất thường trên phim chụp X-quang ngực thẳng',
    cytology: 'Âm tính',
    phanloai: 'II',
    conclusion: 'Tật khúc xạ 2 mắt, Trứng cá thông thường. Sức khỏe loại II.'
  },
  {
    height: 172, weight: 64, bp: '120/80', pulse: 72,
    mat: 'Bình thường', tmh: 'Bình thường', rhm: 'Bình thường', noi: 'Bình thường', ngoai: 'Bình thường', dalieu: 'Bình thường', phukhoa: '',
    blood_group: '"O"', rbc: '5.10', hgb: '150.0', wbc: '5.9', plt: '245.0',
    hdl: '1.30', ure: '4.5', chol: '4.80', uric: '360.0', alt: '20.0', trig: '1.40', ast: '22.0', ldl: '2.70', glu: '5.2', ggt: '21.0',
    urine_glu: 'norm', urine_pro: 'neg', urine_ery: 'neg', urine_leu: 'neg',
    ft4: '1.40', psa: '0.75', tsh: '2.20', ft3: '5.00',
    us_thyroid: 'Hình ảnh siêu âm tuyến giáp bình thường',
    us_abdomen: 'Hình ảnh siêu âm ổ bụng bình thường',
    us_breast: '',
    xray: 'Hiện chưa thấy bất thường trên phim chụp X-quang ngực thẳng',
    cytology: '',
    phanloai: 'I',
    conclusion: 'Hiện tại các chỉ số bình thường. Sức khỏe loại I.'
  },
  {
    height: 145, weight: 38, bp: '105/65', pulse: 80,
    mat: 'Bình thường', tmh: 'Viêm VA mạn', rhm: 'Cao răng', noi: 'Bình thường', ngoai: 'Bình thường', dalieu: 'Bình thường', phukhoa: '',
    blood_group: '"A"', rbc: '4.75', hgb: '138.0', wbc: '6.5', plt: '255.0',
    hdl: '1.28', ure: '3.8', chol: '4.30', uric: '290.0', alt: '16.0', trig: '1.10', ast: '19.0', ldl: '2.35', glu: '4.9', ggt: '17.0',
    urine_glu: 'norm', urine_pro: 'neg', urine_ery: 'neg', urine_leu: 'neg',
    ft4: '1.42', psa: '0.50', tsh: '2.10', ft3: '4.80',
    us_thyroid: 'Hình ảnh siêu âm tuyến giáp bình thường',
    us_abdomen: 'Hình ảnh siêu âm ổ bụng bình thường',
    us_breast: '',
    xray: 'Hiện chưa thấy bất thường trên phim chụp X-quang ngực thẳng',
    cytology: '',
    phanloai: 'II',
    conclusion: 'Viêm VA mạn, Cao răng. Sức khỏe loại II.'
  },
  {
    height: 154, weight: 44, bp: '110/70', pulse: 76,
    mat: '2 Mắt loạn thị', tmh: 'Bình thường', rhm: 'Bình thường', noi: 'Bình thường', ngoai: 'Bình thường', dalieu: 'Bình thường', phukhoa: 'Bình thường',
    blood_group: '"B"', rbc: '4.45', hgb: '130.0', wbc: '5.2', plt: '238.0',
    hdl: '1.35', ure: '4.0', chol: '4.50', uric: '270.0', alt: '15.0', trig: '1.05', ast: '18.0', ldl: '2.40', glu: '4.8', ggt: '15.0',
    urine_glu: 'norm', urine_pro: 'neg', urine_ery: 'neg', urine_leu: 'neg',
    ft4: '1.36', psa: '', tsh: '2.40', ft3: '4.65',
    us_thyroid: 'Hình ảnh siêu âm tuyến giáp bình thường',
    us_abdomen: 'Hình ảnh siêu âm ổ bụng bình thường',
    us_breast: 'Hình ảnh siêu âm tuyến vú bình thường',
    xray: 'Hiện chưa thấy bất thường trên phim chụp X-quang ngực thẳng',
    cytology: 'Âm tính',
    phanloai: 'II',
    conclusion: 'Loạn thị 2 mắt. Sức khỏe loại II.'
  },
  {
    height: 168, weight: 58, bp: '118/76', pulse: 74,
    mat: 'Bình thường', tmh: 'Bình thường', rhm: 'Bình thường', noi: 'Bình thường', ngoai: 'Bình thường', dalieu: 'Bình thường', phukhoa: '',
    blood_group: '"O"', rbc: '4.95', hgb: '146.0', wbc: '5.7', plt: '242.0',
    hdl: '1.32', ure: '4.3', chol: '4.75', uric: '350.0', alt: '19.0', trig: '1.30', ast: '21.0', ldl: '2.60', glu: '5.1', ggt: '20.0',
    urine_glu: 'norm', urine_pro: 'neg', urine_ery: 'neg', urine_leu: 'neg',
    ft4: '1.44', psa: '0.70', tsh: '2.18', ft3: '4.92',
    us_thyroid: 'Hình ảnh siêu âm tuyến giáp bình thường',
    us_abdomen: 'Hình ảnh siêu âm ổ bụng bình thường',
    us_breast: '',
    xray: 'Hiện chưa thấy bất thường trên phim chụp X-quang ngực thẳng',
    cytology: '',
    phanloai: 'I',
    conclusion: 'Hiện tại các chỉ số bình thường. Sức khỏe loại I.'
  },
  {
    height: 160, weight: 54, bp: '115/75', pulse: 76,
    mat: '2 Mắt cận thị', tmh: 'Viêm họng mạn', rhm: 'Cao răng', noi: 'Bình thường', ngoai: 'Bình thường', dalieu: 'Bình thường', phukhoa: 'Bình thường',
    blood_group: '"A"', rbc: '4.50', hgb: '134.0', wbc: '5.5', plt: '235.0',
    hdl: '1.25', ure: '4.2', chol: '4.90', uric: '300.0', alt: '18.0', trig: '1.45', ast: '20.0', ldl: '2.80', glu: '5.0', ggt: '18.0',
    urine_glu: 'norm', urine_pro: 'neg', urine_ery: 'neg', urine_leu: 'neg',
    ft4: '1.40', psa: '', tsh: '2.25', ft3: '4.80',
    us_thyroid: 'Hình ảnh siêu âm tuyến giáp bình thường',
    us_abdomen: 'Hình ảnh siêu âm ổ bụng bình thường',
    us_breast: 'Hình ảnh siêu âm tuyến vú bình thường',
    xray: 'Hiện chưa thấy bất thường trên phim chụp X-quang ngực thẳng',
    cytology: 'Âm tính',
    phanloai: 'II',
    conclusion: 'Cận thị 2 mắt, Viêm họng mạn, Cao răng. Sức khỏe loại II.'
  },
  {
    height: 166, weight: 68, bp: '138/86', pulse: 78,
    mat: 'Đục TTT giai đoạn đầu', tmh: 'Bình thường', rhm: 'Mất R36, Cao răng', noi: 'Tiền tăng huyết áp', ngoai: 'Mổ cũ thoát vị bẹn', dalieu: 'Bình thường', phukhoa: '',
    blood_group: '"O"', rbc: '4.85', hgb: '144.0', wbc: '5.8', plt: '230.0',
    hdl: '1.05', ure: '5.2', chol: '5.40', uric: '420.0', alt: '26.0', trig: '2.10', ast: '25.0', ldl: '3.20', glu: '5.8', ggt: '32.0',
    urine_glu: 'norm', urine_pro: 'neg', urine_ery: 'neg', urine_leu: 'neg',
    ft4: '1.46', psa: '1.45', tsh: '2.35', ft3: '4.85',
    us_thyroid: 'Nang nhỏ thùy phải tuyến giáp TIRADS 2',
    us_abdomen: 'Gan nhiễm mỡ độ 1 nhẹ',
    us_breast: '',
    xray: 'Hiện chưa thấy bất thường trên phim chụp X-quang ngực thẳng',
    cytology: '',
    phanloai: 'III',
    conclusion: 'Tiền tăng huyết áp, Đục TTT, Mất R36, Rối loạn lipid máu, Gan nhiễm mỡ độ 1. Sức khỏe loại III.'
  }
];

// Merge rawRows with mockClinicalData
const employees = rawRows.map((r, i) => {
  const c = mockClinicalData[i] || mockClinicalData[0];
  const h = c.height;
  const w = c.weight;
  const bmi = Math.round((w / Math.pow(h / 100, 2)) * 100) / 100;
  return {
    stt: i + 1,
    code: r.MA_KH || `KH010000${i+1}`,
    name: r.HO_TEN,
    dob: r.NGAY_SINH,
    gender: r.GIOI_TINH,
    dept: r.BOPHAN,
    pos: r.CHUCVU,
    height: h,
    weight: w,
    bmi: bmi,
    blood_pressure: c.bp,
    pulse: c.pulse,
    noi: c.noi,
    ngoai: c.ngoai,
    dalieu: c.dalieu,
    mat: c.mat,
    tmh: c.tmh,
    rhm: c.rhm,
    phukhoa: c.phukhoa,
    blood_group: c.blood_group,
    rbc: c.rbc,
    hgb: c.hgb,
    wbc: c.wbc,
    plt: c.plt,
    hdl: c.hdl,
    ure: c.ure,
    cholesterol: c.chol,
    uric_acid: c.uric,
    alt: c.alt,
    triglyceride: c.trig,
    ast: c.ast,
    ldl: c.ldl,
    glucose: c.glu,
    ggt: c.ggt,
    urine_glu: c.urine_glu,
    urine_pro: c.urine_pro,
    urine_ery: c.urine_ery,
    urine_leu: c.urine_leu,
    ft4: c.ft4,
    psa: c.psa,
    tsh: c.tsh,
    ft3: c.ft3,
    us_thyroid: c.us_thyroid,
    us_abdomen: c.us_abdomen,
    us_breast: c.us_breast,
    xray_chest: c.xray,
    cytology: c.cytology,
    phanloai: c.phanloai,
    conclusion: c.conclusion
  };
});

// Services list
const services = [
  { key: 'kham_tong_quat', name: 'Khám sức khỏe toàn diện', unitPrice: 160000 },
  { key: 'kham_san', name: 'Khám sản', unitPrice: 45000 },
  { key: 'sa_o_bung', name: 'Siêu âm ổ bụng', unitPrice: 58600 },
  { key: 'sa_tuyen_giap', name: 'Siêu âm tuyến giáp', unitPrice: 58600 },
  { key: 'sa_vu', name: 'Siêu âm vú', unitPrice: 58600 },
  { key: 'xquang_nguc', name: 'Xquang ngực thẳng', unitPrice: 73300 },
  { key: 'huyet_hoc_tong_pt', name: 'Tổng phân tích tế bào máu ngoại vi', unitPrice: 49700 },
  { key: 'ure', name: 'Ure', unitPrice: 22400 },
  { key: 'ast', name: 'AST', unitPrice: 22400 },
  { key: 'alt', name: 'ALT', unitPrice: 22400 },
  { key: 'ggt', name: 'GGT', unitPrice: 20000 },
  { key: 'glucose', name: 'Glucose máu', unitPrice: 22400 },
  { key: 'cholesterol', name: 'Cholesterol', unitPrice: 28000 },
  { key: 'triglycerid', name: 'Triglycerid', unitPrice: 28000 },
  { key: 'hdl', name: 'HDL', unitPrice: 28000 },
  { key: 'ldl', name: 'LDL', unitPrice: 28000 },
  { key: 'acid_uric', name: 'Acid uric', unitPrice: 22400 },
  { key: 'ft3', name: 'FT3', unitPrice: 67300 },
  { key: 'ft4', name: 'FT4', unitPrice: 67300 },
  { key: 'tsh', name: 'TSH', unitPrice: 61700 },
  { key: 'tbh_nhuom', name: 'Xét nghiệm tế bào học áp nhuộm thường quy', unitPrice: 190400 },
  { key: 'psa_tp', name: 'PSA toàn phần', unitPrice: 95300 },
  { key: 'nuoc_tieu_tong_pt', name: 'Tổng phân tích nước tiểu', unitPrice: 28600 },
  { key: 'nhom_mau_abo', name: 'Nhóm máu ABO', unitPrice: 42100 }
];

const hospital = {
  name: 'BỆNH VIỆN ĐA KHOA TỈNH',
  parentOrg: 'SỞ Y TẾ NINH BÌNH',
  address: 'Đường Tuệ Tĩnh',
  phone: '02293871030',
  location: 'Ninh Bình'
};

const contract = {
  contractCode: '1551/HĐ-KSK',
  contractName: 'ĐOÀN KHÁM SỨC KHỎE THEO QUYẾT ĐỊNH 1551',
  companyName: 'ĐƠN VỊ CÔNG TÁC & HỌC TẬP MẪU',
  examDate: '21/09/2026',
  totalRegistered: 10
};

// Build Workbook
const wb = xlsx.utils.book_new();

// -------------------------------------------------------------
// Sheet 1: Bìa sổ
// -------------------------------------------------------------
const biaRows = [
  [],
  [],
  [null, null, hospital.name],
  [null, null, null, `Địa chỉ: ${hospital.address}`],
  [null, null, null, `Số điện thoại liên hệ: ${hospital.phone}`],
  [],
  [],
  [],
  ['TỔNG HỢP KẾT QUẢ KHÁM SỨC KHỎE'],
  [contract.companyName.toUpperCase()],
  [`Theo hợp đồng số: ${contract.contractCode}`],
  [],
  [],
  [],
  [`${hospital.location}, ngày 21 tháng 09 năm 2026`]
];
const biaSheet = xlsx.utils.aoa_to_sheet(biaRows);
biaSheet['!merges'] = [
  { s: { r: 2, c: 2 }, e: { r: 2, c: 14 } },
  { s: { r: 3, c: 3 }, e: { r: 3, c: 14 } },
  { s: { r: 4, c: 3 }, e: { r: 4, c: 14 } },
  { s: { r: 8, c: 0 }, e: { r: 8, c: 14 } },
  { s: { r: 9, c: 0 }, e: { r: 9, c: 14 } },
  { s: { r: 10, c: 0 }, e: { r: 10, c: 14 } },
  { s: { r: 14, c: 0 }, e: { r: 14, c: 14 } }
];
biaSheet['!cols'] = [
  { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
  { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
  { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
];
xlsx.utils.book_append_sheet(wb, biaSheet, 'Bìa sổ');

// -------------------------------------------------------------
// Sheet 2: Bảng phần trăm
// -------------------------------------------------------------
let namCount = 0, nuCount = 0;
const plNam = { I: 0, II: 0, III: 0, IV: 0, V: 0 };
const plNu = { I: 0, II: 0, III: 0, IV: 0, V: 0 };

employees.forEach(e => {
  const isNam = e.gender === 'Nam';
  if (isNam) {
    namCount++;
    if (plNam[e.phanloai] !== undefined) plNam[e.phanloai]++;
  } else {
    nuCount++;
    if (plNu[e.phanloai] !== undefined) plNu[e.phanloai]++;
  }
});

const totalEmp = employees.length;

function isAbnormal(val) {
  if (!val) return false;
  const v = String(val).trim().toLowerCase();
  return v !== '' && v !== 'bình thường' && v !== 'bt' && v !== 'không' && v !== 'chưa phát hiện bất thường';
}

const specMap = {
  rhm: { name: 'Răng – Hàm - Mặt', count: 0, samples: [] },
  tmh: { name: 'Tai – Mũi - Họng', count: 0, samples: [] },
  mat: { name: 'Mắt', count: 0, samples: [] },
  noi: { name: 'Nội khoa', count: 0, samples: [] },
  ngoai: { name: 'Ngoại khoa', count: 0, samples: [] },
  phukhoa: { name: 'Sản khoa', count: 0, samples: [] },
  dalieu: { name: 'Da liễu', count: 0, samples: [] }
};

employees.forEach(e => {
  if (isAbnormal(e.rhm)) { specMap.rhm.count++; specMap.rhm.samples.push(e.rhm); }
  if (isAbnormal(e.tmh)) { specMap.tmh.count++; specMap.tmh.samples.push(e.tmh); }
  if (isAbnormal(e.mat)) { specMap.mat.count++; specMap.mat.samples.push(e.mat); }
  if (isAbnormal(e.noi)) { specMap.noi.count++; specMap.noi.samples.push(e.noi); }
  if (isAbnormal(e.ngoai)) { specMap.ngoai.count++; specMap.ngoai.samples.push(e.ngoai); }
  if (isAbnormal(e.phukhoa)) { specMap.phukhoa.count++; specMap.phukhoa.samples.push(e.phukhoa); }
  if (isAbnormal(e.dalieu)) { specMap.dalieu.count++; specMap.dalieu.samples.push(e.dalieu); }
});

const ptRows = [
  [hospital.parentOrg, null, null, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập – Tự do – Hạnh phúc\n-----o0o-----'],
  [hospital.name],
  [`Số:….../ KQKSK-${contract.contractCode}`],
  [],
  ['KẾT QUẢ TỔNG HỢP KHÁM SỨC KHỎE ĐỊNH KỲ'],
  [`Đơn vị: ${contract.companyName}`],
  [`Thời gian khám: ${contract.examDate}`],
  ['I. THÔNG TIN CHUNG'],
  ['Tổng số CBNV đăng ký khám:', null, null, null, null, 10, 'người'],
  ['Tổng số CBNV khám:', null, null, null, null, 10, 'người'],
  ['Tỷ lệ khám (số khám / số đăng ký):', null, null, null, null, 100, '%'],
  ['Tổng số CBNV đủ điều kiện phân loại sức khỏe:', null, null, null, null, 10, 'người'],
  ['Tỷ lệ đủ điều kiện phân loại sức khỏe (số đủ đk/ số khám):', null, null, null, null, 100, '%'],
  ['II. KẾT QUẢ KHÁM SỨC KHỎE'],
  ['2.1 Phân loại sức khoẻ CBNV'],
  ['Bảng 1. Phân loại sức khỏe của CBNV'],
  ['Giới', 'Tổng số n(%)', 'Loại I', 'Loại II', 'Loại III', 'Loại IV', 'Loại V'],
  [null, null, 'n(%)', 'n(%)', 'n(%)', 'n(%)', 'n(%)'],
  ['Nam', namCount, plNam.I, plNam.II, plNam.III, plNam.IV, plNam.V],
  [
    null,
    `${(namCount/totalEmp*100).toFixed(1)}%`,
    `${(plNam.I/namCount*100).toFixed(1)}%`,
    `${(plNam.II/namCount*100).toFixed(1)}%`,
    `${(plNam.III/namCount*100).toFixed(1)}%`,
    '0%', '0%'
  ],
  ['Nữ', nuCount, plNu.I, plNu.II, plNu.III, plNu.IV, plNu.V],
  [
    null,
    `${(nuCount/totalEmp*100).toFixed(1)}%`,
    '0%',
    `${(plNu.II/nuCount*100).toFixed(1)}%`,
    '0%',
    '0%', '0%'
  ],
  ['Tổng số', totalEmp, plNam.I + plNu.I, plNam.II + plNu.II, plNam.III + plNu.III, 0, 0],
  [
    null,
    '100%',
    `${((plNam.I + plNu.I)/totalEmp*100).toFixed(1)}%`,
    `${((plNam.II + plNu.II)/totalEmp*100).toFixed(1)}%`,
    `${((plNam.III + plNu.III)/totalEmp*100).toFixed(1)}%`,
    '0%', '0%'
  ],
  [],
  ['Ghi chú: Loại I: Rất khoẻ; Loại II: Khoẻ; Loại III: Trung bình; Loại IV: Yếu; Loại V: Rất yếu'],
  [],
  ['2.2 Tình hình sức khỏe của CBNV theo chuyên khoa'],
  ['Bảng 2: Tình hình sức khỏe của CBNV theo chuyên khoa'],
  ['TT', 'Chuyên khoa', null, 'Số người mắc (N=…)', 'Tỷ lệ %', 'Các bệnh thường gặp', null]
];

const specEntries = Object.values(specMap);
specEntries.forEach((s, idx) => {
  const pct = (s.count / totalEmp * 100).toFixed(1);
  const diseases = s.samples.length > 0 ? Array.from(new Set(s.samples)).slice(0, 3).join(', ') : 'Chưa phát hiện bất thường';
  ptRows.push([idx + 1, s.name, null, s.count, pct + '%', diseases, null]);
});

ptRows.push(
  [],
  ['2.3 Nhận xét'],
  [`Qua kết quả khám sức khỏe định kỳ cho cán bộ, người lao động ${contract.companyName} ngày ${contract.examDate} cho thấy:`],
  ['- Cán bộ, nhân viên sức khỏe loại I, II, III chiếm tỷ lệ: 100.0% / số ca đủ điều kiện phân loại'],
  ['- Cán bộ, nhân viên sức khỏe loại IV, V chiếm tỷ lệ: 0.0% / số ca đủ điều kiện phân loại'],
  ['- Các bệnh phổ biến: bệnh về Răng – Hàm - Mặt và Mắt có tỷ lệ mắc cao nhất chiếm 50.0%'],
  [],
  ['III. KẾT QUẢ KHÁM SỨC KHỎE CHI TIẾT CỦA CBNV']
);

const ptSheet = xlsx.utils.aoa_to_sheet(ptRows);
ptSheet['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
  { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
  { s: { r: 0, c: 3 }, e: { r: 1, c: 6 } },
  { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } },
  { s: { r: 5, c: 0 }, e: { r: 5, c: 6 } },
  { s: { r: 6, c: 0 }, e: { r: 6, c: 6 } },
  { s: { r: 8, c: 0 }, e: { r: 8, c: 2 } },
  { s: { r: 9, c: 0 }, e: { r: 9, c: 2 } },
  { s: { r: 10, c: 0 }, e: { r: 10, c: 2 } },
  { s: { r: 11, c: 0 }, e: { r: 11, c: 4 } },
  { s: { r: 12, c: 0 }, e: { r: 12, c: 4 } },
  { s: { r: 15, c: 0 }, e: { r: 15, c: 6 } },
  { s: { r: 16, c: 0 }, e: { r: 17, c: 0 } },
  { s: { r: 16, c: 1 }, e: { r: 17, c: 1 } },
  { s: { r: 18, c: 0 }, e: { r: 19, c: 0 } },
  { s: { r: 20, c: 0 }, e: { r: 21, c: 0 } },
  { s: { r: 22, c: 0 }, e: { r: 23, c: 0 } },
  { s: { r: 25, c: 0 }, e: { r: 25, c: 6 } },
  { s: { r: 28, c: 0 }, e: { r: 28, c: 6 } },
  { s: { r: 29, c: 1 }, e: { r: 29, c: 2 } },
  { s: { r: 29, c: 5 }, e: { r: 29, c: 6 } },
  { s: { r: 30, c: 1 }, e: { r: 30, c: 2 } },
  { s: { r: 30, c: 5 }, e: { r: 30, c: 6 } },
  { s: { r: 31, c: 1 }, e: { r: 31, c: 2 } },
  { s: { r: 31, c: 5 }, e: { r: 31, c: 6 } },
  { s: { r: 32, c: 1 }, e: { r: 32, c: 2 } },
  { s: { r: 32, c: 5 }, e: { r: 32, c: 6 } },
  { s: { r: 33, c: 1 }, e: { r: 33, c: 2 } },
  { s: { r: 33, c: 5 }, e: { r: 33, c: 6 } },
  { s: { r: 34, c: 1 }, e: { r: 34, c: 2 } },
  { s: { r: 34, c: 5 }, e: { r: 34, c: 6 } },
  { s: { r: 35, c: 1 }, e: { r: 35, c: 2 } },
  { s: { r: 35, c: 5 }, e: { r: 35, c: 6 } },
  { s: { r: 36, c: 1 }, e: { r: 36, c: 2 } },
  { s: { r: 36, c: 5 }, e: { r: 36, c: 6 } },
  { s: { r: 39, c: 0 }, e: { r: 39, c: 6 } },
  { s: { r: 40, c: 0 }, e: { r: 40, c: 6 } },
  { s: { r: 41, c: 0 }, e: { r: 41, c: 6 } },
  { s: { r: 42, c: 0 }, e: { r: 42, c: 6 } },
  { s: { r: 44, c: 0 }, e: { r: 44, c: 6 } }
];
ptSheet['!cols'] = [
  { wch: 10 }, { wch: 22 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 25 }
];
xlsx.utils.book_append_sheet(wb, ptSheet, 'Bảng phần trăm');

// -------------------------------------------------------------
// Sheet 3: Kết quả
// -------------------------------------------------------------
const kqHeader0 = [
  'STT', 'Họ và tên', 'Ngày tháng năm sinh', 'Giới tính', 'Chiều cao', 'Cân nặng', 'BMI',
  'Huyết áp (mmHg)', 'Mạch (l/p))', 'Khám nội)', 'Khám ngoại', 'Khám da liễu', 'Khám mắt',
  'Khám Tai Mũi Họng', 'Khám Răng', 'Khám phụ khoa',
  'Huyết học', null, null, null, null,
  'Hóa sinh', null, null, null, null, null, null, null, null, null,
  'Nước tiểu', null, null, null,
  'Xét nghiệm miễn dịch', null, null, null,
  'Siêu âm', null, null,
  'Chụp X-quang ngực thẳng [số hóa 1 phim]',
  'Xét nghiệm tế bào học áp nhuộm thường quy',
  'Phân loại',
  'Kết luận'
];

const kqHeader1 = [
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  'Định nhóm máu hệ ABO', 'Số lượng hồng cầu', 'Huyết sắc tố', 'Số lượng bạch cầu', ' Số lượng tiểu cầu',
  'Định lượng HDL-C ', 'Định lượng Urê máu', 'Định lượng Cholesterol toàn phần', 'Định lượng Acid Uric',
  'Đo hoạt độ ALT (GPT)', 'Định lượng Triglycerid', 'Đo hoạt độ AST (GOT)', 'Định lượng LDL-C ',
  'Định lượng Glucose', 'Đo hoạt độ GGT',
  'Glucose (GLU)', 'Protein (PRO)', 'Hồng cầu (ERY)', 'Bạch cầu (LEU)',
  'Định lượng FT4', 'Định lượng PSA toàn phần ', 'Định lượng TSH', 'Định lượng FT3 ',
  'Siêu âm tuyến giáp', 'Siêu âm ổ bụng', 'Siêu âm tuyến vú hai bên',
  null, null, null, null
];

const kqRows = [kqHeader0, kqHeader1];

employees.forEach((emp, idx) => {
  const row = [
    idx + 1,
    emp.name,
    emp.dob,
    emp.gender,
    emp.height,
    emp.weight,
    emp.bmi,
    emp.blood_pressure,
    emp.pulse,
    emp.noi,
    emp.ngoai,
    emp.dalieu,
    emp.mat,
    emp.tmh,
    emp.rhm,
    emp.phukhoa,
    emp.blood_group,
    emp.rbc,
    emp.hgb,
    emp.wbc,
    emp.plt,
    emp.hdl,
    emp.ure,
    emp.cholesterol,
    emp.uric_acid,
    emp.alt,
    emp.triglyceride,
    emp.ast,
    emp.ldl,
    emp.glucose,
    emp.ggt,
    emp.urine_glu,
    emp.urine_pro,
    emp.urine_ery,
    emp.urine_leu,
    emp.ft4,
    emp.psa,
    emp.tsh,
    emp.ft3,
    emp.us_thyroid,
    emp.us_abdomen,
    emp.us_breast,
    emp.xray_chest,
    emp.cytology,
    emp.phanloai,
    emp.conclusion
  ];
  kqRows.push(row);
});

const kqSheet = xlsx.utils.aoa_to_sheet(kqRows);
kqSheet['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
  { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
  { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
  { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
  { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },
  { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } },
  { s: { r: 0, c: 6 }, e: { r: 1, c: 6 } },
  { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } },
  { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } },
  { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } },
  { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } },
  { s: { r: 0, c: 11 }, e: { r: 1, c: 11 } },
  { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } },
  { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } },
  { s: { r: 0, c: 14 }, e: { r: 1, c: 14 } },
  { s: { r: 0, c: 15 }, e: { r: 1, c: 15 } },
  { s: { r: 0, c: 16 }, e: { r: 0, c: 20 } },
  { s: { r: 0, c: 21 }, e: { r: 0, c: 30 } },
  { s: { r: 0, c: 31 }, e: { r: 0, c: 34 } },
  { s: { r: 0, c: 35 }, e: { r: 0, c: 38 } },
  { s: { r: 0, c: 39 }, e: { r: 0, c: 41 } },
  { s: { r: 0, c: 42 }, e: { r: 1, c: 42 } },
  { s: { r: 0, c: 43 }, e: { r: 1, c: 43 } },
  { s: { r: 0, c: 44 }, e: { r: 1, c: 44 } },
  { s: { r: 0, c: 45 }, e: { r: 1, c: 45 } }
];
kqSheet['!cols'] = [
  { wch: 6 },  // STT
  { wch: 25 }, // Họ tên
  { wch: 14 }, // Ngày sinh
  { wch: 10 }, // Giới tính
  { wch: 10 }, // Chiều cao
  { wch: 10 }, // Cân nặng
  { wch: 10 }, // BMI
  { wch: 16 }, // Huyết áp
  { wch: 12 }, // Mạch
  { wch: 18 }, // Nội
  { wch: 18 }, // Ngoại
  { wch: 18 }, // Da liễu
  { wch: 22 }, // Mắt
  { wch: 22 }, // TMH
  { wch: 22 }, // RHM
  { wch: 18 }, // Phụ khoa
  { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  { wch: 30 }, { wch: 30 }, { wch: 30 },
  { wch: 35 }, { wch: 25 }, { wch: 12 }, { wch: 45 }
];
xlsx.utils.book_append_sheet(wb, kqSheet, 'Kết quả');

// -------------------------------------------------------------
// Sheet 4: Chi phí
// -------------------------------------------------------------
const cpHeader0 = [
  hospital.name, null, null, null, null, null, null, null, null, null, null, null, null,
  'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'
];
const cpHeader1 = [
  null, null, null, null, null, null, null, null, null, null, null, null, null,
  'Độc lập - Tự do - Hạnh phúc'
];

const cpRows = [
  cpHeader0,
  cpHeader1,
  ['BỆNH VIỆN'],
  [],
  [],
  ['BẢNG TỔNG HỢP KINH PHÍ KHÁM SỨC KHOẺ'],
  [`"Về việc khám sức khoẻ cho CBNV của ${contract.companyName}"`],
  [`"Theo HĐ số ${contract.contractCode} ngày ${contract.examDate}"`],
  []
];

const cpColNames = ['STT', 'HỌ VÀ TÊN', 'Giới tính', 'Năm sinh'];
services.forEach(s => cpColNames.push(s.name));
cpColNames.push('Tổng tiền');
cpRows.push(cpColNames);
cpRows.push([]);

const cpUnitPrices = [null, null, null, null];
services.forEach(s => cpUnitPrices.push(s.unitPrice));
cpUnitPrices.push(null);
cpRows.push(cpUnitPrices);

let grandTotalCost = 0;
const serviceUsageSums = new Array(services.length).fill(0);

employees.forEach((emp, idx) => {
  const isNu = emp.gender === 'Nữ';
  let birthYear = '';
  if (emp.dob) {
    const parts = emp.dob.split(/[-/]/);
    birthYear = parts.length === 3 ? parts[2] : emp.dob;
  }

  const row = [idx + 1, emp.name, isNu ? 'Nữ' : 'Nam', birthYear];
  let personTotal = 0;

  services.forEach((s, sIdx) => {
    let isUsed = false;
    if (s.key === 'kham_san' || s.key === 'sa_vu' || s.key === 'tbh_nhuom') {
      isUsed = isNu;
    } else if (s.key === 'psa_tp') {
      isUsed = !isNu;
    } else {
      isUsed = true;
    }

    if (isUsed) {
      row.push(1);
      personTotal += s.unitPrice;
      serviceUsageSums[sIdx]++;
    } else {
      row.push(null);
    }
  });

  row.push(personTotal);
  grandTotalCost += personTotal;
  cpRows.push(row);
});

const totalRow = ['Tổng', null, null, null];
serviceUsageSums.forEach(cnt => totalRow.push(cnt));
totalRow.push(grandTotalCost);
cpRows.push(totalRow);

const textTotal = readVietnameseCurrency(grandTotalCost);
cpRows.push(
  [],
  [`Tổng số tiền bằng chữ: ${textTotal}`],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, `${hospital.location}, ngày 21 tháng 09 năm 2026`],
  ['KHOA KHÁM BỆNH', null, null, null, null, 'KẾ TOÁN', null, null, null, null, null, null, null, null, null, null, null, 'LÃNH ĐẠO BỆNH VIỆN'],
  ['(Ký, ghi rõ họ tên)', null, null, null, null, '(Ký, ghi rõ họ tên)', null, null, null, null, null, null, null, null, null, null, null, '(Ký, ghi rõ họ tên)']
);

const cpSheet = xlsx.utils.aoa_to_sheet(cpRows);
const totalRowIdx = 12 + employees.length;

cpSheet['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 1, c: 4 } },
  { s: { r: 0, c: 13 }, e: { r: 0, c: cpColNames.length - 1 } },
  { s: { r: 1, c: 13 }, e: { r: 1, c: cpColNames.length - 1 } },
  { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
  { s: { r: 5, c: 0 }, e: { r: 5, c: cpColNames.length - 1 } },
  { s: { r: 6, c: 0 }, e: { r: 6, c: cpColNames.length - 1 } },
  { s: { r: 7, c: 0 }, e: { r: 7, c: cpColNames.length - 1 } },
  { s: { r: 9, c: 0 }, e: { r: 11, c: 0 } },
  { s: { r: 9, c: 1 }, e: { r: 11, c: 1 } },
  { s: { r: 9, c: 2 }, e: { r: 11, c: 2 } },
  { s: { r: 9, c: 3 }, e: { r: 11, c: 3 } },
  { s: { r: 9, c: cpColNames.length - 1 }, e: { r: 11, c: cpColNames.length - 1 } },
  { s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 3 } },
  { s: { r: totalRowIdx + 2, c: 0 }, e: { r: totalRowIdx + 2, c: cpColNames.length - 1 } },
  { s: { r: totalRowIdx + 3, c: 17 }, e: { r: totalRowIdx + 3, c: cpColNames.length - 1 } },
  { s: { r: totalRowIdx + 4, c: 0 }, e: { r: totalRowIdx + 4, c: 4 } },
  { s: { r: totalRowIdx + 4, c: 5 }, e: { r: totalRowIdx + 4, c: 16 } },
  { s: { r: totalRowIdx + 4, c: 17 }, e: { r: totalRowIdx + 4, c: cpColNames.length - 1 } },
  { s: { r: totalRowIdx + 5, c: 0 }, e: { r: totalRowIdx + 5, c: 4 } },
  { s: { r: totalRowIdx + 5, c: 5 }, e: { r: totalRowIdx + 5, c: 16 } },
  { s: { r: totalRowIdx + 5, c: 17 }, e: { r: totalRowIdx + 5, c: cpColNames.length - 1 } }
];

const cpColWidths = [
  { wch: 6 },
  { wch: 25 },
  { wch: 10 },
  { wch: 10 }
];
services.forEach(s => cpColWidths.push({ wch: Math.max(12, Math.min(22, s.name.length)) }));
cpColWidths.push({ wch: 16 });
cpSheet['!cols'] = cpColWidths;

xlsx.utils.book_append_sheet(wb, cpSheet, 'Chi phí');

// Output file path
const outPath = 'D:/AI/VIMES_HIS/modules/health-check-sync/docs/Bao_cao_ksk_mau_data_hoan_thien.xlsx';
xlsx.writeFile(wb, outPath);
console.log('✅ Generated report file successfully:', outPath);
console.log('Total Cost:', grandTotalCost.toLocaleString('vi-VN') + ' đ');
console.log('In words:', textTotal);
