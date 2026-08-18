import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  Award,
  Calendar,
  Building2,
  User,
  QrCode,
  FileCheck2,
  Clock,
  Printer,
  CheckCircle2
} from 'lucide-react';

export const PublicDocVerificationView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id');
  const [docData, setDocData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) {
      setError('Mã tra cứu tài liệu không tồn tại trên đường dẫn.');
      setLoading(false);
      return;
    }

    const fetchVerification = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/emr/public/verify/${docId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setDocData(data.data);
        } else {
          setError(data.error || 'Không tìm thấy hồ sơ hoặc tài liệu chưa được ký số hợp pháp.');
        }
      } catch (err: any) {
        setError('Lỗi kết nối máy chủ xác thực: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [docId]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-teal-500 selection:text-white font-sans">
      <div className="w-full max-w-xl bg-[#0c182c] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto flex items-center justify-center mb-3 shadow-inner backdrop-blur-xs">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-lg font-black tracking-tight uppercase">
            Cổng Tra Cứu &amp; Kiểm Thực Bệnh Án Điện Tử
          </h1>
          <p className="text-xs text-teal-100 mt-1">
            Bộ Y Tế · Hệ Thống Thông Tin Bệnh Viện VIMES HIS &amp; EMR
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto text-teal-400 animate-spin mb-3" />
              <p className="font-bold">Đang kiểm tra tính toàn vẹn chữ ký số trên cổng quốc gia...</p>
            </div>
          ) : error ? (
            <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 mx-auto text-rose-400 mb-1" />
              <p className="font-extrabold text-sm">Xác Thực Không Thành Công</p>
              <p className="text-xs text-rose-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Authenticity Certificate Box */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 flex items-center gap-3.5 text-emerald-300 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-200">VĂN BẢN ĐÃ ĐƯỢC KÝ SỐ HỢP PHÁP</h3>
                  <p className="text-[11px] text-emerald-400">
                    Toàn vẹn 100% · Có giá trị pháp lý theo Thông tư 46/2018/TT-BYT
                  </p>
                </div>
              </div>

              {/* Document Master Details */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Tên văn bản:</span>
                  <span className="font-extrabold text-white text-right">{docData.documentName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Bệnh nhân:</span>
                  <span className="font-extrabold text-teal-300 uppercase">{docData.patientName} ({docData.patientId})</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Mã đợt khám / Bệnh án:</span>
                  <span className="font-mono font-bold text-white">{docData.docNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ngày lập hồ sơ:</span>
                  <span className="font-bold text-white">{new Date(docData.clinicalDate).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              {/* Verified Signatures List */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Danh Sách Chứng Thư Số Đã Xác Thực:
                </h4>
                {(docData.signatures || []).map((sig: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-white">{sig.signerName}</p>
                        <p className="text-[11px] text-slate-400">{sig.signerRole} · Nhà cấp: <b>{sig.certificateIssuer}</b></p>
                        <p className="text-[10px] text-slate-500 font-mono">Thời gian ký TSA: {new Date(sig.signedAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      CHỨNG THỰC
                    </span>
                  </div>
                ))}
              </div>

              {/* SHA-256 Hash Integrity Fingerprint */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Mã Vân Tay SHA-256 (Tính Toàn Vẹn):</span>
                <p className="font-mono text-[10px] text-slate-400 break-all select-all">{docData.pdfSha256}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span>Hệ thống Bệnh án Điện tử VIMES EMR</span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white font-bold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> In kết quả xác thực
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicDocVerificationView;
