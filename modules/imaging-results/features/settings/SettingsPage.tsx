import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Server,
  Link2,
  Sliders,
  FileText,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Database,
  Radio,
  Eye,
  Layers,
  Palette,
  QrCode
} from 'lucide-react';
import { BRANDING, useCompanyInfo } from '../../config/branding';
import { useSystemStore } from '../../stores/useSystemStore';
import { useNotification } from '../../contexts/NotificationContext';
import axios from 'axios';

type TabKey = 'branding' | 'pacs' | 'his' | 'viewer' | 'templates' | 'security';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('branding');
  const [saving, setSaving] = useState(false);
  const { addNotification } = useNotification();
  const company = useCompanyInfo();
  const { hospitalName, systemName, logoUrl, setHospitalName, setSystemName, setLogoUrl } = useSystemStore();

  // Form State
  const [formData, setFormData] = useState({
    // Branding
    hospitalName: company.name || hospitalName || 'BỆNH VIỆN ĐA KHOA QUỐC TẾ VIMES',
    parentName: company.parent_name || 'SỞ Y TẾ',
    systemName: systemName || 'HỆ THỐNG CHẨN ĐOÁN HÌNH ẢNH & PACS VIEWER',
    address: company.address || 'Khu Y Tế Kỹ Thuật Cao, TP. Hồ Chí Minh',
    phone: company.phone || '1900 6868',
    email: company.email || 'contact@vimes.vn',
    logoUrl: company.logo || logoUrl || '',

    // PACS Connection
    pacsAETitle: 'ORTHANC',
    pacsHost: '127.0.0.1',
    pacsHttpPort: '8042',
    pacsDicomPort: '4242',
    dicomWebUrl: 'http://127.0.0.1:8042/dicom-web',
    autoArchive: true,

    // HIS Integration
    hisApiUrl: 'http://localhost:3000/api/his',
    syncIntervalSec: '30',
    autoMatchByAccession: true,
    groupCt: 'B2200',
    groupMr: 'B2300',
    groupCr: 'B2000,B2100',
    groupUs: 'B2400',

    // Viewer Presets
    defaultLayout: '1x1',
    defaultTool: 'W/L',
    autoApplyInvertForXRay: false,
    enableCineloopAutoSpeed: true,
    ctLungWindow: 'W:1500 / L:-600',
    ctBrainWindow: 'W:80 / L:40',
    ctBoneWindow: 'W:2000 / L:500',
    ctAbdomenWindow: 'W:350 / L:50',

    // Security & Reporting
    shareLinkExpiryDays: '7',
    requireReAuthForSign: true,
    watermarkPatientInfo: true,
    enableAuditLogExport: true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Cập nhật store cục bộ
      setHospitalName(formData.hospitalName);
      setSystemName(formData.systemName);
      if (formData.logoUrl) setLogoUrl(formData.logoUrl);

      // Giả lập lưu backend hoặc gọi API cấu hình
      await new Promise((resolve) => setTimeout(resolve, 600));

      addNotification(
        'Cập nhật Cấu hình Thành công',
        'Các tham số hệ thống & module đã được lưu trữ an toàn.',
        'success'
      );
    } catch (error: any) {
      addNotification(
        'Lỗi Lưu Cấu hình',
        error.message || 'Không thể lưu cài đặt.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'branding' as TabKey, label: 'Thông Tin Đơn Vị', icon: <Building2 className="w-4 h-4" /> },
    { key: 'pacs' as TabKey, label: 'Máy Chủ PACS', icon: <Server className="w-4 h-4" /> },
    { key: 'his' as TabKey, label: 'Tích Hợp HIS/RIS', icon: <Link2 className="w-4 h-4" /> },
    { key: 'viewer' as TabKey, label: 'Cấu Hình Viewer', icon: <Sliders className="w-4 h-4" /> },
    { key: 'templates' as TabKey, label: 'Mẫu Báo Cáo', icon: <FileText className="w-4 h-4" /> },
    { key: 'security' as TabKey, label: 'Bảo Mật & Ký Số', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Page Title & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-[#0078D4] dark:text-blue-400 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              Cấu Hình Hệ Thống
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                v2.1 Pro
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thiết lập tập trung toàn bộ tham số hoạt động cho Module PACS, HIS Worklist, DICOM Viewer & Mẫu Báo Cáo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#0062b0] text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang Lưu Cấu Hình...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Layout: Tabs on Left, Form Content on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-1 bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-fit">
          <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Danh Mục Cấu Hình
          </p>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? 'bg-[#0078D4] text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className={`${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`}>
                  {tab.icon}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {/* TAB 1: BRANDING */}
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Thông Tin Cơ Sở Khám Chữa Bệnh & Nhãn Hiệu
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Thông tin này xuất hiện trên Header hệ thống, màn hình đăng nhập và tiêu đề trang in Báo Cáo Chẩn Đoán.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên Hệ Thống Phần Mềm
                  </label>
                  <input
                    type="text"
                    value={formData.systemName}
                    onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Số Điện Thoại Hotline / Trực Cấp Cứu
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Liên Hệ Hỗ Trợ
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Địa Chỉ Đơn Vị
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PACS SERVER */}
          {activeTab === 'pacs' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-500" />
                  Cấu Hình Máy Chủ Lưu Trữ PACS (Orthanc / DICOMweb)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Quản lý cổng DICOM C-STORE tiếp nhận ảnh từ máy chụp và WADO-RS phục vụ hiển thị trên Web.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    PACS AE Title (Application Entity)
                  </label>
                  <input
                    type="text"
                    value={formData.pacsAETitle}
                    onChange={(e) => setFormData({ ...formData, pacsAETitle: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Địa Chỉ Host / IP Máy Chủ PACS
                  </label>
                  <input
                    type="text"
                    value={formData.pacsHost}
                    onChange={(e) => setFormData({ ...formData, pacsHost: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cổng DICOM C-STORE Port (Nhận ảnh từ Modality)
                  </label>
                  <input
                    type="text"
                    value={formData.pacsDicomPort}
                    onChange={(e) => setFormData({ ...formData, pacsDicomPort: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-400">Mặc định: 4242 hoặc 104</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cổng HTTP REST / DICOMweb API
                  </label>
                  <input
                    type="text"
                    value={formData.pacsHttpPort}
                    onChange={(e) => setFormData({ ...formData, pacsHttpPort: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-400">Mặc định: 8042</span>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Đường Dẫn DICOMweb Root Endpoint
                  </label>
                  <input
                    type="text"
                    value={formData.dicomWebUrl}
                    onChange={(e) => setFormData({ ...formData, dicomWebUrl: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HIS/RIS INTEGRATION */}
          {activeTab === 'his' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-teal-500" />
                  Cấu Hình Tích Hợp Đồng Bộ HIS / RIS & Worklist
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ánh xạ mã nhóm dịch vụ kỹ thuật từ HIS sang phân loại Modality DICOM (CT, MR, CR, US).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    HIS Worklist Gateway URL
                  </label>
                  <input
                    type="text"
                    value={formData.hisApiUrl}
                    onChange={(e) => setFormData({ ...formData, hisApiUrl: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mã Nhóm Cắt Lớp Vi Tính (CT-Scanner)
                  </label>
                  <input
                    type="text"
                    value={formData.groupCt}
                    onChange={(e) => setFormData({ ...formData, groupCt: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-400">Mặc định: B2200, CT</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mã Nhóm Cộng Hưởng Từ (MRI)
                  </label>
                  <input
                    type="text"
                    value={formData.groupMr}
                    onChange={(e) => setFormData({ ...formData, groupMr: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-400">Mặc định: B2300, MR, MRI</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mã Nhóm X-Quang Kỹ Thuật Số (CR/DX)
                  </label>
                  <input
                    type="text"
                    value={formData.groupCr}
                    onChange={(e) => setFormData({ ...formData, groupCr: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-400">Mặc định: B2000, B2100, CR, DX</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mã Nhóm Siêu Âm (US - Ultrasound)
                  </label>
                  <input
                    type="text"
                    value={formData.groupUs}
                    onChange={(e) => setFormData({ ...formData, groupUs: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-400">Mặc định: B2400, US</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VIEWER PRESETS */}
          {activeTab === 'viewer' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  Cấu Hình Mặc Định DICOM Viewer & Preset Cửa Sổ (Window/Level)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Thiết lập giao diện ban đầu khi Bác sĩ mở xem phim 2D/3D.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bố Cục Hiển Thị Mặc Định (Grid Layout)
                  </label>
                  <select
                    value={formData.defaultLayout}
                    onChange={(e) => setFormData({ ...formData, defaultLayout: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="1x1">1 x 1 (1 Khung hình lớn)</option>
                    <option value="1x2">1 x 2 (2 Khung hình ngang)</option>
                    <option value="2x1">2 x 1 (2 Khung hình dọc)</option>
                    <option value="2x2">2 x 2 (4 Khung hình so sánh)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Công Cụ Kích Hoạt Sẵn (Active Tool)
                  </label>
                  <select
                    value={formData.defaultTool}
                    onChange={(e) => setFormData({ ...formData, defaultTool: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="W/L">Điều chỉnh Window/Level (Sáng/Tối)</option>
                    <option value="Pan">Di chuyển khung ảnh (Pan)</option>
                    <option value="Zoom">Thu phóng phóng đại (Zoom)</option>
                    <option value="Length">Thước đo khoảng cách (Ruler mm)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Preset Cửa Sổ Nhu Mô Phổi (Lung)
                  </label>
                  <input
                    type="text"
                    value={formData.ctLungWindow}
                    onChange={(e) => setFormData({ ...formData, ctLungWindow: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Preset Cửa Sổ Nhu Mô Não (Brain)
                  </label>
                  <input
                    type="text"
                    value={formData.ctBrainWindow}
                    onChange={(e) => setFormData({ ...formData, ctBrainWindow: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Preset Cửa Sổ Xương (Bone)
                  </label>
                  <input
                    type="text"
                    value={formData.ctBoneWindow}
                    onChange={(e) => setFormData({ ...formData, ctBoneWindow: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Preset Cửa Sổ Ổ Bụng (Abdomen)
                  </label>
                  <input
                    type="text"
                    value={formData.ctAbdomenWindow}
                    onChange={(e) => setFormData({ ...formData, ctAbdomenWindow: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Mẫu Báo Cáo Kết Quả Theo Chuyên Khoa (Report Templates)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Đồng bộ danh mục mẫu từ bảng <code>hms_pacs_form</code> phục vụ Bác sĩ gõ kết quả nhanh.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'CT Sọ Não Không Tiêm Thuốc', code: 'CT_BRAIN_PLAIN', group: 'CT Cắt lớp' },
                  { name: 'X-Quang Lồng Ngực Thẳng', code: 'CR_CHEST_PA', group: 'CR X-Quang' },
                  { name: 'MRI Cột Sống Thắt Lưng', code: 'MR_LUMBAR_SPINE', group: 'MR Cộng hưởng từ' },
                  { name: 'Siêu Âm Ổ Bụng Tổng Quát', code: 'US_ABDOMEN_GENERAL', group: 'US Siêu âm' },
                ].map((tpl, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{tpl.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Mã: {tpl.code} • Nhóm: {tpl.group}</p>
                      </div>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Đang Hoạt Động
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY & DIGITAL SIGNATURE */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-500" />
                  Bảo Mật, Ký Số & Chia Sẻ Ảnh Bệnh Nhân
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Kiểm soát thời hạn truy cập Web/QR Code của bệnh nhân và cấu hình xác thực chữ ký điện tử.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Thời Hạn Hiệu Lực Của Link Chia Sẻ Bệnh Nhân (Ngày)
                  </label>
                  <input
                    type="number"
                    value={formData.shareLinkExpiryDays}
                    onChange={(e) => setFormData({ ...formData, shareLinkExpiryDays: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                  <span className="text-[11px] text-slate-400">Hết hạn, token chia sẻ sẽ tự động vô hiệu hóa.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Thuật Toán Băm Toàn Vẹn Báo Cáo Ký Số
                  </label>
                  <input
                    type="text"
                    disabled
                    value="SHA-256 (Chuẩn Quốc Tế NIST)"
                    className="w-full h-10 px-3.5 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="md:col-span-2 pt-2 space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireReAuthForSign}
                      onChange={(e) => setFormData({ ...formData, requireReAuthForSign: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        Bắt buộc xác thực lại mật khẩu (Re-Auth) khi Ký Số
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Đảm bảo đúng bác sĩ thực hiện ký duyệt kết quả chẩn đoán hình ảnh.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.watermarkPatientInfo}
                      onChange={(e) => setFormData({ ...formData, watermarkPatientInfo: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        Gắn dấu thủy minh (Watermark) thông tin ca chụp khi xem trực tuyến
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Chống sao chép trái phép hình ảnh y tế nhạy cảm của bệnh nhân.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
