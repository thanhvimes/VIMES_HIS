import React, { useState } from 'react';
import { MOH_SPECIALTY_TEMPLATES, EMR_DOCUMENT_CATEGORIES } from '../constants';
import {
  Settings,
  Layers,
  FileText,
  Lock,
  ShieldCheck,
  Save,
  CheckCircle2,
  Sliders,
  Database,
  KeyRound,
  FileCode
} from 'lucide-react';
import { toast } from 'sonner';

export const EMRSettingsCatalogView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'rules' | 'security'>('templates');

  // Business Rules State
  const [rules, setRules] = useState({
    autoLockHoursAfterDischarge: '24',
    requireAllSignaturesBeforeArchive: true,
    allowEmergencyUnlockingByDirector: true,
    maxAccessDurationHours: '72',
    defaultInteroperabilityStandard: 'HL7_CDA',
    enableTimestampAuthorityTSA: true,
    auditLoggingRetentionDays: '3650', // 10 years as per law
  });

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Đã lưu cấu hình quy tắc nghiệp vụ EMR thành công!');
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Danh mục Biểu mẫu & Cấu hình Quy tắc EMR
            </h1>
            <p className="text-xs text-slate-500">
              Thiết lập danh mục mẫu bệnh án chuẩn Bộ Y Tế và cấu hình quy tắc đóng/khóa bệnh án điện tử.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('templates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'templates'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Danh mục Mẫu biểu Bệnh án BYT ({MOH_SPECIALTY_TEMPLATES.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'rules'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Quy tắc Nghiệp vụ & Vòng đời Bệnh án
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'security'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Bảo mật & Chứng thực Số (CA/HSM)
        </button>
      </div>

      {/* Subtab 1: Form Templates */}
      {activeSubTab === 'templates' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Danh mục Mẫu văn bản Y tế điện tử theo Thông tư 54/2017 & 46/2018
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Mã hệ thống</th>
                  <th className="p-3">Mã biểu Bộ Y Tế</th>
                  <th className="p-3">Tên mẫu biểu bệnh án / Phiếu</th>
                  <th className="p-3">Nhóm tài liệu EMR</th>
                  <th className="p-3 text-center">Bắt buộc ký số</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {MOH_SPECIALTY_TEMPLATES.map((tmpl, idx) => (
                  <tr key={tmpl.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400">
                      {tmpl.code}
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-600 dark:text-slate-400">
                      {tmpl.mohCode}
                    </td>
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                      {tmpl.name}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {EMR_DOCUMENT_CATEGORIES.find(c => c.id === tmpl.category)?.name || tmpl.category}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Bắt buộc (CA)
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        Đang áp dụng
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Business Rules */}
      {activeSubTab === 'rules' && (
        <form onSubmit={handleSaveRules} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 max-w-3xl">
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Thiết lập Quy tắc Đóng & Khóa Bệnh án</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thời hạn tự động khóa hồ sơ sau khi xuất viện:
                </label>
                <select
                  value={rules.autoLockHoursAfterDischarge}
                  onChange={e => setRules({ ...rules, autoLockHoursAfterDischarge: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="24">24 Giờ (Theo khuyến cáo Thông tư 46)</option>
                  <option value="48">48 Giờ</option>
                  <option value="72">72 Giờ (Bệnh nhân có thủ thuật phức tạp)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chuẩn liên thông dữ liệu mặc định:
                </label>
                <select
                  value={rules.defaultInteroperabilityStandard}
                  onChange={e => setRules({ ...rules, defaultInteroperabilityStandard: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="HL7_CDA">HL7 CDA R2 (Quốc tế & BYT)</option>
                  <option value="XML_130">XML QĐ 130/QĐ-BYT</option>
                  <option value="XML_4210">XML QĐ 4210/QĐ-BYT</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.requireAllSignaturesBeforeArchive}
                  onChange={e => setRules({ ...rules, requireAllSignaturesBeforeArchive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Bắt buộc hoàn tất chữ ký số của Bác sĩ và Trưởng khoa trước khi chuyển hồ sơ vào Kho EMR
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.enableTimestampAuthorityTSA}
                  onChange={e => setRules({ ...rules, enableTimestampAuthorityTSA: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Kích hoạt dịch vụ cấp dấu thời gian điện tử (TSA Timestamping) cho mọi văn bản ký số
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.allowEmergencyUnlockingByDirector}
                  onChange={e => setRules({ ...rules, allowEmergencyUnlockingByDirector: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Cho phép Ban Giám đốc mở khóa khẩn cấp bệnh án đã đóng khi có yêu cầu bổ sung chuyên môn
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Lưu cấu hình quy tắc</span>
            </button>
          </div>
        </form>
      )}

      {/* Subtab 3: Security */}
      {activeSubTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs max-w-3xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cấu hình Hạ tầng Ký số & An ninh Thông tin</span>
          </h3>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Chuẩn mã hóa thuật toán:</p>
            <p className="text-slate-500 font-mono">RSA-2048 / ECDSA P-256 + Băm SHA-256 (Theo quy định Bộ Thông tin & Truyền thông)</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
            <p className="font-semibold text-slate-800 dark:text-slate-200">Thời hạn lưu trữ nhật ký truy vết (Audit Logs):</p>
            <p className="text-slate-500">Tối thiểu 10 năm theo Điều 141 - 146 Thông tư 54/2017/TT-BYT.</p>
          </div>
        </div>
      )}
    </div>
  );
};
