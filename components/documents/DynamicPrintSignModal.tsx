import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { apiClient } from '../../services/apiClient';
import { useSession } from '../../contexts/SessionContext';
import SignatureModal from '../ui/SignatureModal';
import { 
  PrinterIcon, 
  XIcon, 
  CheckCircleIcon, 
  DocumentTextIcon, 
  DownloadIcon, 
  ShieldCheckIcon,
  SparklesIcon,
  ArrowPathIcon
} from '../Icons';

export interface DynamicPrintSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateCode: string;
  docNo?: string;
  patientId?: string;
  patientName?: string;
  documentTitle?: string;
  data: Record<string, any>;
  onSignedSuccess?: (signedDoc: any) => void;
}

export const DynamicPrintSignModal: React.FC<DynamicPrintSignModalProps> = ({
  isOpen,
  onClose,
  templateCode,
  docNo = `DOC-${Date.now()}`,
  patientId = 'BN-001',
  patientName = 'Bệnh nhân',
  documentTitle = 'Văn bản y tế',
  data,
  onSignedSuccess
}) => {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docInstance, setDocInstance] = useState<any>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [showPatientSignPad, setShowPatientSignPad] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize or fetch document
  const initDocument = async () => {
    if (!isOpen) return;
    setLoading(true);
    setPdfUrl(null);
    setIsSigned(false);

    try {
      // 1. Tạo bản nháp trong EMR Engine
      const draftRes = await apiClient.post<any>('/emr/documents/draft', {
        docNo,
        patientId,
        patientName,
        templateCode,
        formTypeCode: templateCode,
        documentName: documentTitle,
        documentGroup: 'CLINICAL',
        clinicalDate: new Date().toISOString().split('T')[0],
        documentData: data,
        createdBy: user?.username || 'bac_si_kham'
      });

      const instance = draftRes.data || draftRes;
      setDocInstance(instance);
      setIsSigned(instance.status === 'SIGNED' || instance.status === 'LOCKED');

      // 2. Render HTML printable view or PDF preview
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <title>${documentTitle} - ${docNo}</title>
            <style>
              body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 24px; }
              .hospital-name { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #0369a1; }
              .hospital-sub { font-size: 11px; color: #64748b; }
              .doc-title { font-size: 20px; font-weight: bold; margin-top: 10px; text-transform: uppercase; color: #0f766e; letter-spacing: 0.5px; }
              .doc-no { font-size: 12px; color: #64748b; margin-top: 4px; }
              .patient-info { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
              .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; }
              .content-box { margin-bottom: 24px; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
              th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
              .signatures { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 40px; font-size: 14px; }
              .sign-box { min-height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
              .signed-stamp { border: 2px solid #059669; color: #059669; padding: 8px 16px; border-radius: 8px; font-weight: bold; margin-top: 8px; font-size: 12px; background: #ecfdf5; display: inline-block; box-shadow: 0 2px 4px rgba(5,150,105,0.1); }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="hospital-name">BỆNH VIỆN ĐA KHOA QUỐC TẾ VIMES</div>
              <div class="hospital-sub">Địa chỉ: 18 Hoàng Hoa Thám, Ba Đình, Hà Nội · Hotline: 1900 6868</div>
              <div class="doc-title">${documentTitle}</div>
              <div class="doc-no">Số phiếu: <b>${docNo}</b> · Mã biểu mẫu: <code>${templateCode}</code> · Ngày: ${new Date().toLocaleDateString('vi-VN')}</div>
            </div>
            
            <div class="patient-info">
              <div class="patient-grid">
                <div><b>Họ và tên:</b> ${patientName || data.patient_name || 'Nguyễn Văn An'}</div>
                <div><b>Mã bệnh nhân:</b> ${patientId || data.patient_id || 'BN-10293'}</div>
                <div><b>Ngày sinh / Tuổi:</b> ${data.dob || data.age || '1985 (41 tuổi)'}</div>
                <div><b>Giới tính:</b> ${data.gender || 'Nam'}</div>
                <div style="grid-column: span 2;"><b>Địa chỉ:</b> ${data.address || 'Số 18 Hoàng Hoa Thám, Ba Đình, Hà Nội'}</div>
                <div style="grid-column: span 2;"><b>Chẩn đoán:</b> ${data.diagnosis || data.icd_name || 'I10 - Tăng huyết áp vô căn; E11 - Đái tháo đường type 2'}</div>
              </div>
            </div>

            <div class="content-box">
              <div style="font-weight: bold; margin-bottom: 6px; color: #0f766e;">CHỈ ĐỊNH ĐIỀU TRỊ & THUỐC KÊ ĐƠN:</div>
              ${data.medicines && Array.isArray(data.medicines) && data.medicines.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th style="width: 40px; text-align: center;">STT</th>
                      <th>Tên thuốc / Hàm lượng / Hoạt chất</th>
                      <th style="width: 80px; text-align: center;">Số lượng</th>
                      <th style="width: 60px; text-align: center;">ĐVT</th>
                      <th>Hướng dẫn liều dùng & Cách dùng</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.medicines.map((m: any, i: number) => `
                      <tr>
                        <td style="text-align: center; font-weight: bold;">${i + 1}</td>
                        <td><b>${m.name || m.drug_name || 'Thuốc'}</b></td>
                        <td style="text-align: center; font-weight: bold; color: #0369a1;">${m.quantity || m.qty || 1}</td>
                        <td style="text-align: center;">${m.unit || 'Viên'}</td>
                        <td style="font-style: italic;">${m.instruction || m.dosage || 'Uống 1 viên sau ăn'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `
                <div style="background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px;">
                  <b>Diễn biến / Lời dặn:</b> ${data.doctor_notes || data.symptoms || 'Bệnh nhân tái khám theo hẹn, tuân thủ đơn thuốc và chế độ dinh dưỡng giảm muối.'}
                </div>
              `}
            </div>

            <div class="signatures">
              <div class="sign-box">
                <b>NGƯỜI BỆNH / THÂN NHÂN</b>
                <div style="font-size: 11px; color: #64748b;">(Ký và ghi rõ họ tên)</div>
                <div style="margin-top: 45px; font-weight: bold;">${patientName}</div>
              </div>
              <div class="sign-box">
                <b>BÁC SĨ ĐIỀU TRỊ</b>
                <div style="font-size: 11px; color: #64748b;">(Ký điện tử & đóng dấu số SmartCA)</div>
                <div style="margin-top: 15px;">
                  ${instance.status === 'SIGNED' ? `
                    <div class="signed-stamp">
                      ✓ ĐÃ KÝ SỐ PAdES CHUẨN BYT<br/>
                      <span style="font-size: 11px; font-weight: bold;">${user?.fullName || 'BS. CKII Nguyễn Văn An'}</span><br/>
                      <span style="font-size: 9px; color: #475569;">Thời gian: ${new Date().toLocaleString('vi-VN')}</span>
                    </div>
                  ` : `
                    <div style="margin-top: 45px; font-weight: bold;">${user?.fullName || 'Bác sĩ điều trị'}</div>
                  `}
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error('Error initializing document print/sign modal:', err);
      toast.error(err.message || 'Không thể khởi tạo bản xem trước');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initDocument();
    } else {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [isOpen, templateCode, docNo]);

  // Handle direct print
  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  // Handle Doctor SmartCA / USB Token Digital Signature
  const handleDoctorSign = async () => {
    if (!docInstance?.id) return;
    setSigning(true);
    try {
      const res = await apiClient.post<any>('/emr/documents/batch-sign', {
        documentIds: [docInstance.id],
        signerId: user?.username || 'bs_kham',
        signerName: user?.fullName || 'Bác sĩ Điều trị',
        signerRole: 'BAC_SI_KHAM',
        signingMethod: 'SMART_CA'
      });

      toast.success('Ký số PAdES Bác sĩ thành công! Đã cập nhật chứng thư số vào hồ sơ bệnh án.');
      setIsSigned(true);
      if (onSignedSuccess) onSignedSuccess(res.data || res);
      await initDocument();
    } catch (err: any) {
      toast.error(err.message || 'Ký số thất bại');
    } finally {
      setSigning(false);
    }
  };

  // Handle Patient Touch Tablet Sign
  const handlePatientTouchSave = async (dataUrl: string) => {
    if (!docInstance?.id) return;
    setShowPatientSignPad(false);
    setSigning(true);
    try {
      await apiClient.post<any>('/emr/documents/patient-touch-sign', {
        documentId: docInstance.id,
        patientId,
        patientName,
        signatureDataUrl: dataUrl
      });

      toast.success('Đã lưu chữ ký cảm ứng của người bệnh!');
      await initDocument();
    } catch (err: any) {
      toast.error(err.message || 'Lưu chữ ký người bệnh thất bại');
    } finally {
      setSigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                  {documentTitle}
                </h3>
                {isSigned ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                    <ShieldCheckIcon className="w-3.5 h-3.5" /> Đã Ký Số PAdES
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                    Chờ Ký Số
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Mã hồ sơ: <b>{docNo}</b> · BN: <b>{patientName}</b> ({patientId}) · Template: <code>{templateCode}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={initDocument}
              title="Làm mới xem trước"
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN VIEWER */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-950 p-4 relative overflow-hidden flex items-center justify-center">
          {loading ? (
            <div className="text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Đang biên dịch mẫu biểu Word & kết xuất bản in PDF…
              </p>
            </div>
          ) : pdfUrl ? (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              title="PDF Viewer"
              className="w-full h-full bg-white rounded-xl shadow-lg border border-slate-300 dark:border-slate-800"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            />
          ) : (
            <div className="text-center text-sm text-slate-500">
              Không thể tải bản xem trước tài liệu.
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              🔍 Tỷ lệ xem:
            </span>
            <button 
              type="button"
              onClick={() => setZoomLevel(z => Math.max(z - 10, 50))} 
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold hover:bg-slate-200"
            >
              -
            </button>
            <span className="font-mono">{zoomLevel}%</span>
            <button 
              type="button"
              onClick={() => setZoomLevel(z => Math.min(z + 10, 150))} 
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold hover:bg-slate-200"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Tablet Patient Sign */}
            <button
              type="button"
              onClick={() => setShowPatientSignPad(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-all border border-purple-200 dark:border-purple-800"
            >
              ✍️ Người Bệnh Ký Tablet
            </button>

            {/* Doctor SmartCA / USB Token Digital Signature */}
            {!isSigned && (
              <button
                type="button"
                disabled={signing || loading}
                onClick={handleDoctorSign}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                <SparklesIcon className="w-4 h-4" />
                {signing ? 'Đang Ký Số SmartCA…' : '🖋️ Ký Số Bác Sĩ (SmartCA)'}
              </button>
            )}

            {/* Direct Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              <PrinterIcon className="w-4 h-4" />
              In Bản Giấy (A4/A5)
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>

      {/* PATIENT TOUCH SIGNATURE MODAL */}
      <SignatureModal
        isOpen={showPatientSignPad}
        onClose={() => setShowPatientSignPad(false)}
        onSave={(dataUrl) => handlePatientTouchSave(dataUrl)}
      />
    </div>
  );
};

export default DynamicPrintSignModal;
