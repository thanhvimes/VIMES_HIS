import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { templateStudioService } from '../../../services/templateStudioService';
import { XIcon, DocumentTextIcon, SparklesIcon, CheckCircleIcon } from '../../../components/Icons';

export interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTemplateId?: number) => void;
}

interface TemplatePreset {
  id: string;
  name: string;
  code: string;
  documentType: string;
  moduleCode: string;
  category: string;
  description: string;
  icon: string;
  sampleData: Record<string, any>;
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'prescription',
    name: 'Đơn thuốc khám ngoại trú',
    code: 'DON_THUOC_NGOAI_TRU',
    documentType: 'PRESCRIPTION',
    moduleCode: 'clinical',
    category: 'NGOAI_TRU',
    description: 'Mẫu in đơn thuốc kèm danh sách thuốc, liều dùng, chẩn đoán ICD-10 và khung ký số Bác sĩ.',
    icon: '💊',
    sampleData: {
      patient_name: 'Nguyễn Văn An',
      patient_id: 'BN-10293',
      dob: '1985 (41 tuổi)',
      gender: 'Nam',
      address: 'Số 18 Hoàng Hoa Thám, Ba Đình, Hà Nội',
      diagnosis: 'I10 - Tăng huyết áp vô căn; E11 - Đái tháo đường typ 2',
      doctor_name: 'BS. CKII Nguyễn Văn An',
      medicines: [
        { stt: 1, name: 'Amlodipine 5mg (Hộp 30 viên)', quantity: 30, unit: 'Viên', dosage: 'Uống 1 viên vào buổi sáng sau ăn' },
        { stt: 2, name: 'Metformin 850mg (Hộp 60 viên)', quantity: 60, unit: 'Viên', dosage: 'Uống 1 viên x 2 lần/ngày (sáng, tối sau ăn)' }
      ]
    }
  },
  {
    id: 'exam_report',
    name: 'Phiếu khám bệnh chuyên khoa',
    code: 'PHIEU_KHAM_BENH',
    documentType: 'CLINICAL_FORM',
    moduleCode: 'clinical',
    category: 'KHAM_BENH',
    description: 'Phiếu khám lâm sàng tổng quát, sinh hiệu mạch/HA/nhiệt độ, tiền sử bệnh và hướng xử trí.',
    icon: '🩺',
    sampleData: {
      patient_name: 'Lê Hoàng Cường',
      patient_id: 'BN-20491',
      dob: '1978-02-10',
      age: 45,
      gender: 'Nam',
      address: '456 Đường Minh Khai, Hai Bà Trưng, Hà Nội',
      symptoms: 'Đau tức ngực trái từng cơn, khó thở nhẹ khi leo cầu thang',
      diagnosis: 'I20 - Cơn đau thắt ngực; I10 - Tăng huyết áp',
      vital_signs: { pulse: 78, bp: '135/85', temp: 36.8, weight: 68, height: 172 },
      treatment_plan: 'Nghỉ ngơi, đo điện tâm đồ ECG, siêu âm doppler tim, dùng thuốc theo đơn.',
      doctor_name: 'BS. Trần Văn Minh'
    }
  },
  {
    id: 'surgery_consent',
    name: 'Giấy cam đoan phẫu thuật, thủ thuật',
    code: 'SURGERY_CONSENT',
    documentType: 'CONSENT_FORM',
    moduleCode: 'surgery',
    category: 'PHAU_THUAT',
    description: 'Giấy cam kết phẫu thuật theo mẫu Bộ Y Tế, có chữ ký người bệnh/thân nhân và bác sĩ giải thích.',
    icon: '🔪',
    sampleData: {
      patient_name: 'Phạm Thị Hương',
      patient_id: 'BN-33910',
      relative_name: 'Phạm Văn Hùng (Quan hệ: Chồng)',
      surgery_name: 'Phẫu thuật nội soi cắt ruột thừa viêm',
      anesthesia_method: 'Gây mê nội khí quản',
      risks_explained: 'Chảy máu, nhiễm trùng sau mổ, phản ứng thuốc gây mê',
      surgeon_name: 'BS. CKII Lê Hải Đăng',
      doctor_explaining: 'BS. Nguyễn Tuấn Anh'
    }
  },
  {
    id: 'consultation_minutes',
    name: 'Biên bản hội chẩn chuyên môn',
    code: 'BIEN_BAN_HOI_CHAN',
    documentType: 'CLINICAL_FORM',
    moduleCode: 'clinical',
    category: 'HOI_CHAN',
    description: 'Biên bản hội chẩn ca bệnh khó giữa các khoa, chủ tọa, thư ký và thành viên hội chẩn.',
    icon: '📋',
    sampleData: {
      patient_name: 'Hoàng Văn Thái',
      patient_id: 'BN-44820',
      room_name: 'Phòng Cấp cứu - Hồi sức tích cực',
      chairperson: 'TS. BS. Nguyễn Đức Thắng (Phó Giám đốc BV)',
      secretary: 'BS. Đỗ Thị Thu Trang',
      members: 'BS. Phạm Văn Hưng (Khoa Tim mạch), BS. Vũ Hải Nam (Khoa Ngoại)',
      summary: 'Bệnh nhân nhồi máu cơ tim cấp giờ thứ 4, biến chứng suy tim cấp Killip III.',
      conclusion: 'Chỉ định chụp và can thiệp động mạch vành cấp cứu qua da (PCI).'
    }
  },
  {
    id: 'discharge_summary',
    name: 'Giấy ra viện (Mẫu số 01/BV)',
    code: 'DISCHARGE_SUMMARY',
    documentType: 'SUMMARY_FORM',
    moduleCode: 'inpatient',
    category: 'NOI_TRU',
    description: 'Giấy ra viện chuẩn Bộ Y Tế kèm tóm tắt quá trình điều trị nội trú và lời dặn.',
    icon: '🏥',
    sampleData: {
      patient_name: 'Đặng Ngọc Minh',
      patient_id: 'BN-55102',
      admitted_at: '2026-08-10',
      discharged_at: '2026-08-17',
      department_name: 'Khoa Nội Tim Mạch',
      admission_diagnosis: 'Cơn tăng huyết áp khẩn cấp / Đái tháo đường typ 2',
      discharge_diagnosis: 'Huyết áp kiểm soát ổn định (120/80 mmHg), đường huyết mục tiêu',
      treatment_summary: 'Điều trị nội khoa bằng thuốc hạ áp kết hợp chế độ dinh dưỡng giảm muối',
      doctor_notes: 'Tái khám sau 1 tháng mang theo sổ khám bệnh, tuân thủ đơn thuốc duy trì.',
      doctor_name: 'BS. CKII Hoàng Minh Tuấn'
    }
  },
  {
    id: 'custom',
    name: 'Tùy chỉnh biểu mẫu mới',
    code: '',
    documentType: 'CLINICAL_FORM',
    moduleCode: 'clinical',
    category: 'CHUNG',
    description: 'Tạo biểu mẫu theo nhu cầu riêng của viện (nhập mã, cấu trúc và tên tùy ý).',
    icon: '⚙️',
    sampleData: {
      patient_name: 'Nguyễn Văn A',
      patient_id: 'BN-00001',
      content: 'Nội dung văn bản'
    }
  }
];

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedPreset, setSelectedPreset] = useState<TemplatePreset>(TEMPLATE_PRESETS[0]);
  const [formData, setFormData] = useState({
    code: TEMPLATE_PRESETS[0].code,
    name: TEMPLATE_PRESETS[0].name,
    documentType: TEMPLATE_PRESETS[0].documentType,
    moduleCode: TEMPLATE_PRESETS[0].moduleCode,
    category: TEMPLATE_PRESETS[0].category,
    description: TEMPLATE_PRESETS[0].description
  });
  const [loading, setLoading] = useState(false);

  const handleSelectPreset = (preset: TemplatePreset) => {
    setSelectedPreset(preset);
    setFormData({
      code: preset.code,
      name: preset.name,
      documentType: preset.documentType,
      moduleCode: preset.moduleCode,
      category: preset.category,
      description: preset.description
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode || !/^[A-Z][A-Z0-9_]{2,63}$/.test(cleanCode)) {
      toast.error('Mã biểu mẫu không hợp lệ! (Phải viết hoa, không dấu, từ 3-64 ký tự, ví dụ: DON_THUOC_NGOAI_TRU)');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên biểu mẫu');
      return;
    }

    setLoading(true);
    try {
      const res = await templateStudioService.createTemplate({
        code: cleanCode,
        name: formData.name.trim(),
        documentType: formData.documentType,
        moduleCode: formData.moduleCode,
        category: formData.category,
        description: formData.description,
        sampleData: selectedPreset.sampleData || { patient_name: 'Nguyễn Văn A', date: new Date().toISOString().slice(0, 10) }
      });

      toast.success(`Đã tạo biểu mẫu mới [${cleanCode}] thành công!`);
      onSuccess(res.templateId);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo biểu mẫu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-zoom-in">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                ➕ Tạo Mẫu Biểu Y Tế Mới
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chọn mẫu gợi ý chuẩn Bộ Y Tế hoặc tự thiết lập biểu mẫu riêng cho bệnh viện.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* STEP 1: PRESETS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">
              1. Chọn Loại Biểu Mẫu Chuẩn Gợi Ý:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {TEMPLATE_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{preset.icon}</span>
                        {isSelected && <CheckCircleIcon className="w-4 h-4 text-blue-600" />}
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs leading-snug">
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                    <div className="mt-3 font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                      {preset.code || 'Mã tự do'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: METADATA FORM */}
          <form onSubmit={handleSubmit} id="create-template-form" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              2. Thông Tin Định Danh & Phân Loại:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã biểu mẫu (In hoa, không dấu) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  placeholder="VD: BIEN_BAN_HOI_CHAN"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-blue-600"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Mã duy nhất dùng cho hệ thống gọi API và in ấn (VD: <code>DON_THUOC_NGOAI_TRU</code>).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên biểu mẫu hiển thị *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Biên bản hội chẩn chuyên môn"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phân hệ áp dụng (Module)
                </label>
                <select
                  value={formData.moduleCode}
                  onChange={e => setFormData({ ...formData, moduleCode: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                >
                  <option value="clinical">Khám bệnh ngoại trú (Clinical)</option>
                  <option value="inpatient">Điều trị nội trú (Inpatient)</option>
                  <option value="surgery">Phẫu thuật – Thủ thuật (Surgery)</option>
                  <option value="lab">Xét nghiệm (LIS)</option>
                  <option value="imaging">CĐHA & Thăm dò chức năng (PACS)</option>
                  <option value="pharmacy">Dược & Nhà thuốc</option>
                  <option value="billing">Viện phí & Thu ngân</option>
                  <option value="emr">Bệnh án Điện tử (EMR Core)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Loại tài liệu EMR
                </label>
                <select
                  value={formData.documentType}
                  onChange={e => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                >
                  <option value="PRESCRIPTION">Đơn thuốc (Prescription)</option>
                  <option value="CLINICAL_FORM">Phiếu lâm sàng (Clinical Form)</option>
                  <option value="CONSENT_FORM">Giấy cam đoan / Cam kết (Consent Form)</option>
                  <option value="SUMMARY_FORM">Tóm tắt / Giấy ra viện (Summary Form)</option>
                  <option value="LAB_REPORT">Kết quả xét nghiệm (Lab Report)</option>
                  <option value="IMAGING_REPORT">Kết quả chẩn đoán hình ảnh (Imaging Report)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú & Hướng dẫn sử dụng mẫu biểu
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả phạm vi áp dụng, quy định ký số..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 italic">
            * Sau khi tạo, phiên bản nháp <b>v1 (DRAFT)</b> sẽ tự động được khởi tạo để tải file Word và đặt ô ký.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="create-template-form"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Đang khởi tạo…' : '🚀 Khởi Tạo Biểu Mẫu'}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CreateTemplateModal;
