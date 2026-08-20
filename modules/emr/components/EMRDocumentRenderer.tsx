import React from 'react';
import { EMRDocumentItem, PatientAdministrativeInfo } from '../types';
import { EMRSignatureBadge } from './EMRSignatureBadge';
import { 
  Printer, 
  Download, 
  PenTool, 
  ShieldCheck, 
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Building2,
  Lock
} from 'lucide-react';

interface EMRDocumentRendererProps {
  document: EMRDocumentItem;
  patient: PatientAdministrativeInfo;
  recordNumber: string;
  onSignDocument?: () => void;
  onExportPdf?: () => void;
}

export const EMRDocumentRenderer: React.FC<EMRDocumentRendererProps> = ({
  document,
  patient,
  recordNumber,
  onSignDocument,
  onExportPdf,
}) => {
  const content = document.content || {};

  return (
    <div className="flex flex-col h-full bg-slate-100/70 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto">
      {/* Top Action Bar */}
      <div className="max-w-4xl w-full mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-lg text-sky-600 dark:text-sky-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {document.name}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Mã biểu: {document.code} • Phiên bản v{document.version}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {document.status === 'signed' ? (
            <EMRSignatureBadge 
              signature={document.signature} 
              signaturesCollected={document.signaturesCollected} 
            />
          ) : (
            onSignDocument && (
              <button
                type="button"
                onClick={onSignDocument}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <PenTool className="w-4 h-4" />
                <span>Ký số văn bản</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In</span>
          </button>

          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Xuất PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* A4 Paper Document Canvas (Standard Ministry of Health Form) */}
      <div className="max-w-4xl w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-6 sm:p-10 text-slate-800 dark:text-slate-100 space-y-6">
        {/* Document Header (Quốc hiệu & Tên cơ sở y tế) */}
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4 text-xs">
          <div className="text-left space-y-1">
            <p className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">BỘ Y TẾ - SỞ Y TẾ HÀ NỘI</p>
            <p className="font-extrabold text-sm text-sky-700 dark:text-sky-400">BỆNH VIỆN ĐA KHOA QUỐC TẾ vClinic</p>
            <p className="text-[11px] text-slate-500">Khoa điều trị: {document.departmentName}</p>
          </div>

          <div className="text-right space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300 uppercase">Mẫu: {document.code}</p>
            <p className="font-mono text-slate-600 dark:text-slate-400">Số HSBA: <span className="font-bold text-slate-900 dark:text-slate-100">{recordNumber}</span></p>
            <p className="font-mono text-slate-600 dark:text-slate-400">Mã BN: <span className="font-bold text-slate-900 dark:text-slate-100">{patient.patientId}</span></p>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center space-y-1 py-2">
          <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-slate-50 tracking-wide">
            {document.name}
          </h1>
          <p className="text-xs text-slate-500 italic">
            (Ban hành kèm theo quy định quản lý Hồ sơ Bệnh án điện tử)
          </p>
        </div>

        {/* Patient Administrative Box */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div><span className="text-slate-500">Họ và tên:</span> <strong className="uppercase text-slate-900 dark:text-slate-100">{patient.fullName}</strong></div>
            <div><span className="text-slate-500">Ngày sinh:</span> <strong>{patient.dob}</strong> ({patient.gender === 'male' ? 'Nam' : 'Nữ'})</div>
            <div><span className="text-slate-500">Số CCCD:</span> <strong className="font-mono">{patient.nationalId || '---'}</strong></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><span className="text-slate-500">Địa chỉ:</span> {patient.address}</div>
            <div><span className="text-slate-500">Thẻ BHYT:</span> <strong className="font-mono text-sky-700 dark:text-sky-400">{patient.insuranceCardNumber || 'KCB Thu phí'}</strong></div>
          </div>
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Cảnh báo Dị ứng: {patient.allergies.join('; ')}</span>
            </div>
          )}
        </div>

        {/* Specific Form Content Rendering based on document category */}
        {document.category === 'medical_record' && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
                I. Lý do vào viện & Bệnh sử
              </h4>
              <p className="mb-2"><strong>Lý do vào viện:</strong> {content.chiefComplaint || '---'}</p>
              <p><strong>Quá trình bệnh lý:</strong> {content.historyOfPresentIllness || '---'}</p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
                II. Tiền sử bệnh
              </h4>
              <p>{content.pastMedicalHistory || 'Bản thân chưa phát hiện bất thường, gia đình khỏe mạnh.'}</p>
            </div>

            {content.physicalExam && (
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
                  III. Khám bệnh toàn thân & Các cơ quan
                </h4>
                <div className="space-y-1.5 pl-2">
                  <p>• <strong>Toàn thân:</strong> {content.physicalExam.general}</p>
                  <p>• <strong>Tuần hoàn:</strong> {content.physicalExam.cardiovascular}</p>
                  <p>• <strong>Hô hấp:</strong> {content.physicalExam.respiratory}</p>
                  <p>• <strong>Tiêu hóa & Các cơ quan khác:</strong> {content.physicalExam.abdomen}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
                IV. Chẩn đoán & Hướng điều trị
              </h4>
              <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 rounded-md border border-sky-200 dark:border-sky-800 space-y-1">
                <p><strong>Chẩn đoán sơ bộ:</strong> {content.preliminaryDiagnosis || '---'}</p>
                <p><strong>Kế hoạch điều trị:</strong> {content.treatmentPlan || '---'}</p>
              </div>
            </div>
          </div>
        )}

        {document.category === 'treatment_sheets' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">
              Diễn biến bệnh & Y lệnh điều trị
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5 w-1/3 border-r border-slate-200 dark:border-slate-700">Ngày giờ & Diễn biến lâm sàng</th>
                    <th className="p-2.5 w-2/3">Y lệnh điều trị & Chăm sóc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {content.progressDays?.map((day: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-700 align-top">
                        <span className="font-bold font-mono text-sky-700 dark:text-sky-400 block mb-1">{day.date}</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{day.clinicalEvolution}</p>
                      </td>
                      <td className="p-2.5 align-top">
                        <ul className="space-y-1 text-slate-800 dark:text-slate-200">
                          {day.medicalOrders?.map((order: string, oIdx: number) => (
                            <li key={oIdx} className="font-mono text-[11px] leading-relaxed">{order}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-slate-400 italic">Chưa có bản ghi tờ điều trị</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {document.category === 'lab_results' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">
              Bảng kết quả Xét nghiệm Hóa sinh & Huyết học (LIS)
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Tên xét nghiệm</th>
                    <th className="p-2.5 text-center">Kết quả</th>
                    <th className="p-2.5 text-center">Đơn vị</th>
                    <th className="p-2.5 text-center">Trị số bình thường</th>
                    <th className="p-2.5 text-center">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {content.results?.map((res: any, idx: number) => (
                    <tr key={idx} className={res.status === 'high' ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}>
                      <td className="p-2.5 font-medium">{res.name}</td>
                      <td className="p-2.5 text-center font-bold font-mono text-slate-900 dark:text-slate-100">
                        {res.value}
                      </td>
                      <td className="p-2.5 text-center text-slate-500">{res.unit}</td>
                      <td className="p-2.5 text-center text-slate-500 font-mono">{res.refRange}</td>
                      <td className="p-2.5 text-center">
                        {res.status === 'high' ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 font-bold rounded text-[10px]">Cao ↑</span>
                        ) : res.status === 'low' ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-bold rounded text-[10px]">Thấp ↓</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-medium rounded text-[10px]">Bình thường</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {document.category === 'imaging_results' && (
          <div className="space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">
              Kết quả Chẩn đoán Hình ảnh & PACS
            </h4>
            <div className="space-y-3">
              <p><strong>Kỹ thuật thực hiện:</strong> {content.technique}</p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                <strong>Mô tả hình ảnh:</strong>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{content.findings}</p>
              </div>
              <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg border border-sky-200 dark:border-sky-800">
                <strong className="text-sky-900 dark:text-sky-200">KẾT LUẬN:</strong>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">{content.conclusion}</p>
              </div>
              {content.pacsStudyInstanceUID && (
                <p className="font-mono text-[10px] text-slate-400">
                  DICOM Study UID: {content.pacsStudyInstanceUID}
                </p>
              )}
            </div>
          </div>
        )}

        {document.category === 'discharge_summary' && (
          <div className="space-y-4 text-xs leading-relaxed">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">
              Tóm tắt Bệnh án & Quá trình Điều trị Xuất viện
            </h4>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <p><strong>Tóm tắt bệnh án:</strong> {content.treatmentSummary}</p>
              <p><strong>Tình trạng người bệnh khi ra viện:</strong> {content.dischargeCondition}</p>
              <p><strong>Lời dặn của thầy thuốc:</strong> {content.followUpAdvice}</p>
            </div>
          </div>
        )}

        {/* Document Footer: Chữ ký số & Xác thực pháp lý */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="font-semibold text-slate-600 dark:text-slate-400 mb-1">NGƯỜI LẬP BIỂU / ĐIỀU DƯỠNG</p>
            <p className="text-[11px] text-slate-400 italic mb-4">(Ký, ghi rõ họ tên)</p>
            <div className="h-16 flex items-center justify-center">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{document.createdByName}</span>
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-600 dark:text-slate-400 mb-1">BÁC SĨ ĐIỀU TRỊ / TRƯỞNG KHOA</p>
            <p className="text-[11px] text-slate-400 italic mb-4">(Ký số xác thực)</p>
            <div className="h-16 flex items-center justify-center">
              {document.signature ? (
                <div className="p-2 border-2 border-emerald-600/80 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-md text-emerald-800 dark:text-emerald-300 font-mono text-[10px] text-left">
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ĐÃ KÝ SỐ ĐIỆN TỬ</span>
                  </div>
                  <p>Ký bởi: {document.signature.signerName}</p>
                  <p>Thời gian: {document.signature.signedAt}</p>
                  <p className="truncate">CA: {document.signature.certificateIssuer}</p>
                </div>
              ) : (
                <span className="text-slate-400 italic">[Chưa ký số]</span>
              )}
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="text-[10px] text-slate-400 text-center italic pt-4 border-t border-slate-100 dark:border-slate-800">
          Văn bản bệnh án điện tử được khởi tạo và lưu trữ theo Thông tư số 46/2018/TT-BYT ngày 28/12/2018 của Bộ Y tế.
        </div>
      </div>
    </div>
  );
};
