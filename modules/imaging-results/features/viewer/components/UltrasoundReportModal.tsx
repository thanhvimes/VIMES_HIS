import React from 'react';
import { X, Printer, FileText, CheckCircle, Download, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { RealInstance, ReportData } from '../types';

export interface UltrasoundReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  modality: string;
  accessionNumber: string;
  studyDate: string;
  reportData: ReportData;
  instances: RealInstance[];
  studyId?: string;
}

export const UltrasoundReportModal: React.FC<UltrasoundReportModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientId,
  modality,
  accessionNumber,
  studyDate,
  reportData,
  instances,
  studyId,
}) => {
  if (!isOpen) return null;

  // Xây dựng link tra cứu trực tiếp theo Host hiện tại của Bệnh viện
  const studyUid = studyId || accessionNumber || '1.3.6.1.4.1.5962.1.2.1.20040119072730.12322';
  const portalUrl = `${window.location.protocol}//${window.location.host}/portal/study/${encodeURIComponent(studyUid)}`;

  // Lấy 4 ảnh đầu tiên hoặc 4 ảnh đại diện
  const fourImages = [
    {
      img: instances[0]?.imageUrl || '/api/pacs/instances/sample/preview',
      label: 'Hình 1: Mặt cắt Nhu mô Gan & Tĩnh mạch cửa',
    },
    {
      img: instances[1]?.imageUrl || instances[0]?.imageUrl || '/api/pacs/instances/sample/preview',
      label: 'Hình 2: Mặt cắt Túi Mật & Đường mật',
    },
    {
      img: instances[2]?.imageUrl || instances[0]?.imageUrl || '/api/pacs/instances/sample/preview',
      label: 'Hình 3: Mặt cắt Thận Phải (Trục dọc)',
    },
    {
      img: instances[3]?.imageUrl || instances[1]?.imageUrl || instances[0]?.imageUrl || '/api/pacs/instances/sample/preview',
      label: 'Hình 4: Mặt cắt Thận Trái & Bàng quang',
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full flex flex-col max-h-[95vh] shadow-2xl overflow-hidden animate-fade-in text-slate-200">
        {/* Top Dialog Toolbar */}
        <div className="px-5 py-3 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-white">
              Xem Trước Phiếu Kết Quả Siêu Âm 4 Ảnh (Khổ A4 Chuẩn VIMES HIS)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper (Simulating A4) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center custom-scrollbar">
          <div
            id="printable-ultrasound-report"
            className="w-full max-w-[210mm] bg-white text-slate-900 p-6 sm:p-8 shadow-2xl rounded-sm font-serif text-[13px] leading-snug border border-slate-200"
            style={{ minHeight: '297mm' }}
          >
            {/* Header: Hospital & National Motto + QR Portal */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-3 mb-3">
              <div>
                <h4 className="font-bold text-blue-900 text-xs sm:text-sm uppercase tracking-wide">
                  BỆNH VIỆN ĐA KHOA VIMES
                </h4>
                <p className="font-bold text-xs text-slate-800">
                  KHOA CHẨN ĐOÁN HÌNH ẢNH & THĂM DÒ CHỨC NĂNG
                </p>
                <p className="text-[11px] text-slate-600">
                  Số 188 Đường Giải Phóng, Q. Thanh Xuân, Hà Nội • Hotline: 1900 8888
                </p>
              </div>

              {/* QR Code Patient Portal Header Box */}
              <div className="flex items-center gap-3 text-right text-[11.5px] font-sans">
                <div>
                  <p>
                    Số phiếu: <strong className="text-rose-700 font-mono">SA-{accessionNumber || '2026-0889'}</strong>
                  </p>
                  <p>
                    Mã BN (PID): <strong className="font-mono">{patientId}</strong>
                  </p>
                  <p className="text-slate-500 text-[11px]">Ngày: {studyDate || '16/08/2026'}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded">
                  <QRCodeSVG value={portalUrl} size={48} level="M" />
                  <span className="text-[7.5px] font-bold text-slate-600 uppercase mt-0.5 tracking-tighter">
                    QUÉT XEM PHIM
                  </span>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-3">
              <h2 className="text-base sm:text-lg font-bold text-blue-900 uppercase tracking-wide">
                PHIẾU KẾT QUẢ SIÊU ÂM
              </h2>
              <p className="italic text-slate-600 text-xs mt-0.5">
                {modality} (Thiết bị: GE Healthcare Voluson E10 Expert HD)
              </p>
            </div>

            {/* Patient Administrative Info Box */}
            <div className="bg-slate-50 border border-slate-300 rounded p-2.5 mb-4 text-xs font-sans">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500">Họ và tên: </span>
                  <strong className="text-blue-900 uppercase">{patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Năm sinh: </span>
                  <strong>1980 (46 tuổi)</strong>
                </div>
                <div>
                  <span className="text-slate-500">Giới tính: </span>
                  <strong>Nam</strong>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                <div className="col-span-2">
                  <span className="text-slate-500">Địa chỉ: </span>
                  <span>Hai Bà Trưng, Hà Nội</span>
                </div>
                <div>
                  <span className="text-slate-500">BHYT: </span>
                  <strong className="font-mono">DN 4 01 01 23456789</strong>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                <div className="col-span-2">
                  <span className="text-slate-500">Chỉ định: </span>
                  <span className="font-bold text-slate-800">Siêu âm ổ bụng tổng quát (Gan, Mật, Tụy, Lách, Thận, Bàng quang)</span>
                </div>
                <div>
                  <span className="text-slate-500">Bác sĩ chỉ định: </span>
                  <span>BS. Trần Văn Hùng</span>
                </div>
              </div>
            </div>

            {/* 🌟 2x2 Grid of 4 Ultrasound Images */}
            <div className="mb-4">
              <div className="text-[12px] font-bold text-blue-900 uppercase border-b border-slate-300 pb-1 mb-2 font-sans flex items-center justify-between">
                <span>HÌNH ẢNH SIÊU ÂM KHẢO SÁT CHUYÊN KHOA (4 MẶT CẮT TIÊU BIỂU)</span>
                <span className="text-[10px] text-slate-500 font-normal">Độ phân giải: DICOM Native Matrix</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {fourImages.map((imgItem, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-700 bg-black rounded overflow-hidden flex flex-col items-center justify-between shadow-sm"
                  >
                    <div className="w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
                      <img
                        src={imgItem.img}
                        alt={`Ảnh siêu âm ${idx + 1}`}
                        className="w-full h-full object-contain"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="w-full bg-slate-900 text-white text-[10px] font-sans px-2 py-1 text-center font-bold tracking-tight border-t border-slate-800 truncate">
                      {imgItem.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Findings Description Section */}
            <div className="mb-3 space-y-1">
              <h5 className="text-[12px] font-bold text-blue-900 uppercase font-sans border-b border-slate-200 pb-0.5">
                MÔ TẢ TỔN THƯƠNG (FINDINGS)
              </h5>
              <p className="text-[12px] text-slate-800 leading-relaxed whitespace-pre-line text-justify font-sans">
                {reportData.findings ||
                  '• Gan: Kích thước trong giới hạn bình thường, bờ đều, nhu mô đồng nhất.\n• Túi mật & Đường mật: Túi mật co bóp tốt, thành mỏng nhẵn, không thấy sỏi.\n• Tụy & Lách: Nhu mô đồng nhất, không thấy nốt khu trú.\n• Hai thận: Kích thước bình thường, đài bể thận không giãn, không có sỏi.\n• Bàng quang: Nước tiểu trong, thành mỏng nhẵn.'}
              </p>
            </div>

            {/* Conclusion / Impression Box */}
            <div className="mb-4 p-2.5 bg-blue-50/60 border border-blue-200 rounded">
              <div className="flex items-center gap-1.5 font-bold text-blue-950 uppercase text-[12px] font-sans">
                <span>KẾT LUẬN (IMPRESSION):</span>
              </div>
              <p className="text-[13px] font-bold text-blue-950 mt-1 font-sans">
                {reportData.impression ||
                  'Hình ảnh siêu âm ổ bụng tổng quát hiện tại chưa phát hiện tổn thương bệnh lý bất thường.'}
              </p>
              {reportData.recommendation && (
                <p className="text-[11.5px] italic text-slate-700 mt-1 font-sans">
                  <strong>Đề nghị: </strong>
                  {reportData.recommendation}
                </p>
              )}
            </div>

            {/* Digital Signature & Footer Section */}
            <div className="pt-2 border-t border-slate-300 flex justify-between items-end text-xs font-sans">
              <div className="text-[11px] text-slate-500">
                <p>• Phiếu kết quả có giá trị pháp lý theo Thông tư 54/2017 & 46/2018/TT-BYT.</p>
                <p>• Tra cứu hồ sơ điện tử tại: <span className="font-mono text-blue-800 underline">{portalUrl}</span></p>
              </div>

              <div className="text-center min-w-[200px]">
                <p className="italic text-slate-600 text-[11px]">
                  Hà Nội, {studyDate || new Date().toLocaleDateString('vi-VN')}
                </p>
                <p className="font-bold uppercase text-slate-800 text-[12px] mt-0.5">
                  BÁC SĨ CHẨN ĐOÁN HÌNH ẢNH
                </p>

                {/* Digital Signature Stamp Mockup */}
                <div className="my-2 py-1 px-3 border border-emerald-500/50 bg-emerald-50 rounded text-emerald-800 text-[10px] inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>KÝ SỐ BỞI: {reportData.readingDoctor || 'BS. CKII NGUYỄN VĂN AN'}</span>
                </div>

                <p className="font-bold text-blue-900 text-xs mt-1">
                  {reportData.readingDoctor || 'BS. CKII Nguyễn Văn An'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
