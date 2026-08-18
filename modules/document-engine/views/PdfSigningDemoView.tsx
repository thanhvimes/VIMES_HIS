import React, { useState } from 'react';
import PdfSignaturePlacement, { PdfSignatureRect, SignaturePlaceholder } from '../components/PdfSignaturePlacement';
import { SignatureActionModal } from '../components/SignatureActionModal';
import { documentSignatureService } from '../../../services/documentSignatureService';
import { templateStudioService } from '../../../services/templateStudioService';
import { toast } from 'sonner';

const demoPlaceholders: SignaturePlaceholder[] = [
  { id: 1, code: 'SIG_PATIENT', pageIndex: 0, x1Pt: 65, y1Pt: 367, x2Pt: 265, y2Pt: 432, pageWidthPt: 595, pageHeightPt: 842, signerRole: 'PATIENT', status: 'AVAILABLE' },
  { id: 2, code: 'SIG_DOCTOR', pageIndex: 0, x1Pt: 330, y1Pt: 367, x2Pt: 530, y2Pt: 432, pageWidthPt: 595, pageHeightPt: 842, signerRole: 'DOCTOR', status: 'AVAILABLE' }
];

const PdfSigningDemoView: React.FC = () => {
  const [file, setFile] = useState<string | Uint8Array>('');
  const [mode, setMode] = useState<'select' | 'placeholder'>('placeholder');
  const [rect, setRect] = useState<PdfSignatureRect | null>(null);
  const [selectedPlaceholderId, setSelectedPlaceholderId] = useState<number | null>(null);
  const [message, setMessage] = useState('Chọn PDF hoặc bấm Nạp mẫu nhanh để bắt đầu.');
  const [documentId, setDocumentId] = useState('SURGERY_DOC_2026');
  const [sha256, setSha256] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [sessionId, setSessionId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [providerTx, setProviderTx] = useState('');
  const [artifactKey, setArtifactKey] = useState('');
  const [artifactHash, setArtifactHash] = useState('');
  const [audit, setAudit] = useState<any[]>([]);
  const [versionId, setVersionId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [placeholderCode, setPlaceholderCode] = useState('SIG_DOCTOR');
  const [placeholderRole, setPlaceholderRole] = useState('DOCTOR');
  const [placeholders, setPlaceholders] = useState<SignaturePlaceholder[]>(demoPlaceholders);

  // Signature selection interactive modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModalPlaceholder, setActiveModalPlaceholder] = useState<SignaturePlaceholder | null>(null);

  const handlePlaceholderClick = (ph: SignaturePlaceholder) => {
    if (ph.status === 'SIGNED') {
      toast.info(`Vị trí ${ph.code} đã được ký bởi ${ph.signerName || ph.signerRole}.`);
      return;
    }
    setActiveModalPlaceholder(ph);
    setModalOpen(true);
  };

  const handleModalConfirmSign = async (data: {
    placeholderId: number;
    signerRole: string;
    signerName: string;
    signMethod: 'USB_TOKEN' | 'SMART_CA' | 'ELECTRONIC_DRAW' | 'SERVER_HSM';
    certificateSerial: string;
    signatureImage?: string;
    pinOrOtp: string;
  }) => {
    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await documentSignatureService.createSession(
          documentId || 'SURGERY_DOC_2026',
          1,
          sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          `documents/${documentId || 'SURGERY_DOC_2026'}.pdf`
        );
        currentSessionId = session.id;
        setSessionId(session.id);
      }

      const ph = placeholders.find(p => p.id === data.placeholderId) || activeModalPlaceholder;
      if (!ph) throw new Error('Không tìm thấy thông tin vùng ký');

      // 1. Create signature request
      const req = await documentSignatureService.createRequest(currentSessionId, {
        pageIndex: ph.pageIndex,
        x1Pt: ph.x1Pt,
        y1Pt: ph.y1Pt,
        x2Pt: ph.x2Pt,
        y2Pt: ph.y2Pt,
        pageWidthPt: ph.pageWidthPt,
        pageHeightPt: ph.pageHeightPt,
        pageRotation: 0,
        placementType: 'PLACEHOLDER',
        placeholderId: ph.id,
        signerRole: data.signerRole
      });

      setRequestId(req.id);
      setRequestStatus(req.status || 'PENDING');

      // 2. Prepare signature
      const prep = await documentSignatureService.prepare(req.id);
      const txId = prep.transactionId || prep.transaction_id || `TX_${Date.now()}`;
      setProviderTx(txId);

      // 3. Complete signature
      const signedKey = `signed/${documentId || 'DOC'}_${ph.code}.pdf`;
      const signedHash = sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const completeRes = await documentSignatureService.complete(req.id);

      // 4. Update placeholder state with visual signature stamp
      const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
      setPlaceholders(prev => prev.map(item => item.id === ph.id ? {
        ...item,
        status: 'SIGNED',
        signerName: data.signerName,
        signedAt: nowStr
      } : item));

      setRequestStatus(completeRes.status || 'SIGNED');
      setMessage(`✅ Đã hoàn tất ký số cho ${data.signerName} (${data.signerRole}) bằng phương thức ${data.signMethod}.`);
      toast.success(`Đã ký số thành công cho ${data.signerName}!`);

      // Refresh audit
      try {
        const auditData = await documentSignatureService.getAudit(currentSessionId);
        setAudit(auditData);
      } catch {}

    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Ký số thất bại';
      toast.error(msg);
      throw err;
    }
  };

  const submitPlacement = async (value: PdfSignatureRect, placeholderId?: number) => {
    setRect(value);
    setSelectedPlaceholderId(placeholderId || null);
    if (!sessionId) {
      setMessage('Đã chọn vùng. Nhấp vào ô chữ ký để mở bảng chọn chứng thư và ký số.');
      return;
    }
    try {
      const ph = placeholders.find(p => p.id === placeholderId);
      const role = ph?.signerRole || placeholderRole || 'DOCTOR';
      const request = await documentSignatureService.createRequest(sessionId, {
        ...value,
        placementType: placeholderId ? 'PLACEHOLDER' : 'FREESTYLE',
        placeholderId,
        signerRole: role
      });
      setRequestId(request.id);
      setRequestStatus(request.status || 'PENDING');
      setMessage(`Đã tạo signature request ${request.id || ''} cho vai trò ${role}.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không tạo được signature request.');
    }
  };

  const createSession = async () => {
    try {
      const session = await documentSignatureService.createSession(documentId, 1, sha256, `documents/${documentId}.pdf`);
      setSessionId(session.id);
      setMessage(`Đã tạo signing session ${session.id}. Nhấp vào ô chữ ký để ký số!`);
      toast.success(`Đã tạo Signing Session: ${session.id}`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không tạo được signing session.');
    }
  };

  const refreshSession = async () => {
    if (!sessionId) return;
    try {
      const data = await documentSignatureService.getSession(sessionId);
      const current = data.requests?.find((item: any) => item.id === requestId);
      if (current) setRequestStatus(current.status);
      setMessage(`Session ${data.session?.status || 'OPEN'} đã được cập nhật.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không tải được trạng thái session.');
    }
  };

  const prepare = async () => {
    try {
      const result = await documentSignatureService.prepare(requestId);
      setProviderTx(result.transactionId || result.transaction_id || '');
      setRequestStatus('PREPARED');
      setMessage('Đã prepare. Chuyển transaction tới USB Token/HSM/Remote CA để ký.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Prepare thất bại.');
    }
  };

  const complete = async () => {
    try {
      const result = await documentSignatureService.complete(requestId);
      setRequestStatus(result.status || 'SIGNED');
      setMessage(`Đã hoàn tất ký: ${result.status || 'SIGNED'}.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Complete thất bại.');
    }
  };

  const cancel = async () => {
    if (!window.confirm('Hủy signature request hiện tại?')) return;
    try {
      const result = await documentSignatureService.cancel(requestId);
      setRequestStatus(result.status || 'CANCELLED');
      setMessage('Đã hủy signature request.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không thể hủy request.');
    }
  };

  const cancelSession = async () => {
    if (!window.confirm('Hủy toàn bộ signing session và các request đang mở?')) return;
    try {
      await documentSignatureService.cancelSession(sessionId);
      setRequestStatus('CANCELLED');
      setMessage('Đã hủy toàn bộ signing session.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không thể hủy signing session.');
    }
  };

  const loadAudit = async () => {
    try {
      setAudit(await documentSignatureService.getAudit(sessionId));
      setMessage('Đã tải audit ký số.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không tải được audit.');
    }
  };

  const loadPlaceholders = async () => {
    try {
      const data = await documentSignatureService.listPlaceholders(Number(versionId));
      setPlaceholders(data);
      setMessage(`Đã tải ${data.length} placeholder từ template version.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không tải được placeholder.');
    }
  };

  const checkSigningHealth = async () => {
    try {
      const health = await documentSignatureService.health();
      setMessage(`Signing Service sẵn sàng: provider=${health.provider || 'unknown'}.`);
      toast.success('Dịch vụ ký số hoạt động bình thường');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Signing Service chưa sẵn sàng.');
    }
  };

  const showProviderInfo = async () => {
    try {
      const info = await documentSignatureService.providerInfo();
      const certificate = info.certificate || info.data?.certificate;
      setMessage(certificate ? `Chứng thư: ${certificate.subject || 'unknown'} | Serial: ${certificate.serial || 'unknown'}` : (info.warning || 'Chưa có chứng thư production.'));
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không đọc được metadata chứng thư.');
    }
  };

  const retireSelectedPlaceholder = async () => {
    const selected = placeholders.find(item => item.id === 1);
    if (!selected) return;
    try {
      await documentSignatureService.retirePlaceholder(selected.id);
      setPlaceholders(placeholders.filter(item => item.id !== selected.id));
      setMessage(`Đã retire placeholder ${selected.code}.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không retire được placeholder.');
    }
  };

  const createPlaceholder = async () => {
    if (!versionId || !templateId || !rect) {
      setMessage('Cần template ID, version ID và vùng PDF đã chọn.');
      return;
    }
    try {
      const created = await documentSignatureService.createPlaceholder(Number(versionId), {
        templateId: Number(templateId),
        code: placeholderCode,
        signerRole: placeholderRole,
        ...rect
      });
      setPlaceholders([...placeholders, created]);
      setMessage(`Đã tạo placeholder ${created.code || placeholderCode}.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không tạo được placeholder.');
    }
  };

  const updatePlaceholder = async () => {
    if (!selectedPlaceholderId || !rect) {
      setMessage('Chọn một placeholder rồi chọn vùng mới để cập nhật.');
      return;
    }
    try {
      const updated = await documentSignatureService.updatePlaceholder(selectedPlaceholderId, rect);
      setPlaceholders(placeholders.map(item => item.id === selectedPlaceholderId ? { ...item, ...updated } : item));
      setMessage('Đã cập nhật placeholder trên bản DRAFT.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Không cập nhật được placeholder.');
    }
  };

  const loadSurgeryConsentSample = async () => {
    try {
      setMessage('Đang nạp file PDF và cấu hình mẫu SURGERY_CONSENT...');
      const templates = await templateStudioService.list();
      const consent = templates.find(t => t.code === 'SURGERY_CONSENT');
      if (consent?.latestVersion) {
        setVersionId(String(consent.latestVersion.id));
        setTemplateId(String(consent.id));
        const blob = await templateStudioService.preview(consent.latestVersion.id, 'pdf');
        const url = URL.createObjectURL(blob);
        setFile(url);
      }
      setDocumentId('SURGERY_DOC_2026');
      setSha256('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      setPlaceholders(demoPlaceholders);
      setMode('placeholder');
      setMessage('✅ Đã nạp thành công PDF và 2 vị trí chữ ký số chuẩn xác: Bệnh nhân (Trái) và Bác sĩ (Phải). Hãy nhấp chuột trực tiếp vào từng ô chữ ký để chọn chứng thư & ký số!');
      toast.success('Đã nạp mẫu SURGERY_CONSENT với vị trí chữ ký chuẩn xác!');
    } catch (error: any) {
      setMessage('Lỗi khi nạp mẫu SURGERY_CONSENT: ' + (error?.response?.data?.message || error?.message || 'Lỗi không xác định'));
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🖋️</span> Thử nghiệm & Xác thực Ký số PDF
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quy trình Ký số Y tế Điện tử tương tác: Nhấp trực tiếp vào ô chữ ký để chọn chứng thư số và thực hiện ký.
          </p>
        </div>
        <label className="text-sm cursor-pointer rounded-xl border border-slate-300 px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium shadow-sm transition-all">
          📁 Tải file PDF khác từ máy
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={event => {
              const selected = event.target.files?.[0];
              if (selected) {
                setFile(URL.createObjectURL(selected));
                setMessage('Đã tải PDF. Chọn vùng hoặc nhấp vào placeholder.');
              }
            }}
          />
        </label>
      </div>

      {/* Quick Load Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-4 border border-blue-200 dark:border-blue-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">Mẫu kiểm thử nhanh:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadSurgeryConsentSample}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <span>🏥</span> Nạp mẫu SURGERY_CONSENT (2 chữ ký: Bác sĩ & Bệnh nhân)
          </button>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex flex-wrap gap-2">
        <input className="rounded-lg border px-3 py-1.5 text-sm" placeholder="Document ID" value={documentId} onChange={event => setDocumentId(event.target.value)} />
        <input className="w-72 rounded-lg border px-3 py-1.5 text-sm font-mono text-xs" placeholder="SHA-256 tài liệu" value={sha256} onChange={event => setSha256(event.target.value)} />
        <button className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm" onClick={createSession} disabled={!documentId || sha256.length !== 64}>
          Tạo signing session
        </button>
        <button className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${mode === 'placeholder' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`} onClick={() => setMode('placeholder')}>
          🎯 Vùng định sẵn (Nhấp để ký)
        </button>
        <button className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${mode === 'select' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`} onClick={() => setMode('select')}>
          📐 Ký tự do (Kéo chuột)
        </button>
      </div>

      {/* Notification Banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-3 text-sm flex items-center justify-between">
        <span className="text-slate-700 dark:text-slate-300">{message}</span>
        {rect && <span className="font-mono text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded">x1:{Math.round(rect.x1Pt)} y1:{Math.round(rect.y1Pt)} x2:{Math.round(rect.x2Pt)} y2:{Math.round(rect.y2Pt)}</span>}
      </div>

      {/* PDF View Container */}
      <div className="flex justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 p-6 overflow-x-auto shadow-inner">
        {file ? (
          <PdfSignaturePlacement
            file={file}
            pageWidth={760}
            mode={mode}
            placeholders={placeholders}
            onFreestyleSelect={value => submitPlacement(value)}
            onPlaceholderClick={ph => handlePlaceholderClick(ph)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center text-slate-500">
            <span className="text-4xl mb-3">📄</span>
            <p className="font-medium">Chưa có tài liệu PDF nào được tải.</p>
            <p className="text-xs text-slate-400 mt-1">Bấm "Nạp mẫu SURGERY_CONSENT" ở trên hoặc chọn file PDF từ máy để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* Interactive Signature Selection Modal */}
      <SignatureActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        placeholder={activeModalPlaceholder}
        documentId={documentId}
        documentHash={sha256}
        onConfirmSign={handleModalConfirmSign}
      />

      {/* Audit Trail Panel */}
      {sessionId && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>📋</span> Lịch sử Vết Ký số & Kiểm toán (Audit Trail)
            </h3>
            <button className="rounded-lg border px-3 py-1 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800" onClick={loadAudit}>
              Tải lại Audit
            </button>
          </div>
          {audit.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="p-2">Thời gian</th>
                    <th className="p-2">Người ký / Actor</th>
                    <th className="p-2">Hành động</th>
                    <th className="p-2">Kết quả</th>
                    <th className="p-2">Mã băm SHA-256 sau ký</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-slate-50 dark:border-slate-800/50">
                      <td className="p-2 font-mono text-[11px]">{String(item.created_at || '')}</td>
                      <td className="p-2 font-semibold">{item.actor_id}</td>
                      <td className="p-2"><span className="rounded bg-blue-50 text-blue-700 px-1.5 py-0.5 font-mono text-[10px]">{item.action}</span></td>
                      <td className="p-2"><span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 font-bold text-[10px]">{item.result}</span></td>
                      <td className="p-2 font-mono text-[10px] text-slate-500">{item.document_sha256_after || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Chưa có bản ghi kiểm toán nào cho session này.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfSigningDemoView;
