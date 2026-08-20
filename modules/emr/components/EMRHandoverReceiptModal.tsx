import React from 'react';
import { EMRHandoverRecord } from '../types';
import {
  Printer,
  FileCheck,
  ShieldCheck,
  Building2,
  Calendar,
  X,
  User,
  CheckCircle2
} from 'lucide-react';

interface EMRHandoverReceiptModalProps {
  handover: EMRHandoverRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const EMRHandoverReceiptModal: React.FC<EMRHandoverReceiptModalProps> = ({
  handover,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !handover) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Action Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Biên Bản Giao Nhận Hồ Sơ Bệnh Án Điện Tử (EMR)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In biên bản</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <p className="font-bold uppercase text-slate-500">SỞ Y TẾ TP HÀ NỘI</p>
              <p className="font-extrabold text-sm text-sky-700 dark:text-sky-400">BỆNH VIỆN ĐA KHOA QUỐC TẾ vClinic</p>
              <p className="text-[11px] text-slate-500">Phòng Kế hoạch Tổng hợp & Lưu trữ EMR</p>
            </div>
            <div className="text-right font-mono">
              <p className="font-bold text-slate-700 dark:text-slate-300">Mã BB: {handover.handoverReceiptNumber || 'BBGN-2026-PENDING'}</p>
              <p className="text-slate-500">Ngày lập: {handover.receivedAt || handover.submittedAt}</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900 dark:text-slate-50">
              BIÊN BẢN BÀN GIAO & TIẾP NHẬN HỒ SƠ BỆNH ÁN ĐIỆN TỬ
            </h2>
            <p className="text-[11px] text-slate-500 italic">
              (Căn cứ Thông tư 54/2017/TT-BYT & Thông tư 46/2018/TT-BYT về Hồ sơ Bệnh án điện tử)
            </p>
          </div>

          {/* Details Table */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-500">Người bệnh:</span> <strong className="uppercase">{handover.patientName}</strong></div>
              <div><span className="text-slate-500">Mã người bệnh:</span> <strong className="font-mono">{handover.patientId}</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-500">Số lưu trữ HSBA:</span> <strong className="font-mono text-sky-700 dark:text-sky-400">{handover.recordNumber}</strong></div>
              <div><span className="text-slate-500">Chuyên khoa:</span> <strong>{handover.specialty}</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-500">Khoa điều trị bàn giao:</span> {handover.departmentName}</div>
              <div><span className="text-slate-500">Bác sĩ điều trị chính:</span> {handover.primaryDoctorName}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-500">Ngày vào viện:</span> {handover.admissionDate}</div>
              <div><span className="text-slate-500">Ngày xuất viện:</span> {handover.dischargeDate}</div>
            </div>
          </div>

          {/* Handover Verified Documents */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase border-b border-slate-200 dark:border-slate-800 pb-1">
              Danh mục Tài liệu Lâm sàng Đã Tiếp nhận & Xác thực
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2">STT</th>
                    <th className="p-2">Mã biểu</th>
                    <th className="p-2">Tên văn bản y tế</th>
                    <th className="p-2 text-center">Chữ ký số</th>
                    <th className="p-2 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-mono text-[11px]">
                  {handover.validationReport?.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-bold text-sky-700 dark:text-sky-400">{item.code}</td>
                      <td className="p-2 font-sans">{item.name}</td>
                      <td className="p-2 text-center font-sans text-emerald-600">
                        {item.isSigned ? '✓ Đã ký CA' : 'Chưa ký'}
                      </td>
                      <td className="p-2 text-center font-sans">
                        <span className="text-emerald-600 font-bold">Hợp lệ</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">ĐẠI DIỆN KHOA ĐIỀU TRỊ</p>
              <p className="text-[10px] text-slate-400 italic mb-10">(Bàn giao hồ sơ)</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">{handover.submittedBy?.fullName || 'ĐD. Phạm Thị Ánh'}</p>
              <p className="text-[10px] text-slate-400">{handover.submittedBy?.title || 'Khoa Điều Trị'}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">PHÒNG KẾ HOẠCH TỔNG HỢP</p>
              <p className="text-[10px] text-slate-400 italic mb-10">(Tiếp nhận & Lưu trữ EMR)</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">{handover.receivedBy?.fullName || 'ThS.BS. Đỗ Quang Huy'}</p>
              <p className="text-[10px] text-slate-400">{handover.receivedBy?.title || 'Cán bộ tiếp nhận EMR'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
