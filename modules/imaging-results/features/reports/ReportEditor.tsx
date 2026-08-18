import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { DiagnosticReport } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { FileText, CheckCircle2, Sparkles, Mic, MicOff, Eraser, RotateCcw, AlertTriangle, X } from 'lucide-react';

// Subcomponents
import { ReportHeaderBar } from './components/ReportHeaderBar';
import { MiniPacsViewport } from './components/MiniPacsViewport';
import { ClinicalSidebar } from './components/ClinicalSidebar';
import { PriorStudyModal } from './components/PriorStudyModal';
import { PrintReportModal } from './components/PrintReportModal';
import { ShareReportModal } from './components/ShareReportModal';
import { HotkeysHelpModal } from './components/HotkeysHelpModal';
import { MediaCaptureModal, StudyMediaItem } from './components/MediaCaptureModal';

// Types & Data
import { PriorStudyReport, ReportEditorProps, MedicalTemplate } from './types';
import { QUICK_TEMPLATES, COMMON_PHRASES, DOT_PHRASES } from './data/medicalTemplates';
import { DEFAULT_DEVICES, formatDisplayDate } from './data/equipmentData';

export { type PriorStudyReport, type ReportEditorProps } from './types';

export const ReportEditor: React.FC<ReportEditorProps> = ({
  studyInstanceUid,
  patientId,
  patientName,
  modality,
  studyDate,
  description = 'Chẩn đoán hình ảnh',
  accessionNumber = 'N/A',
  referringPhysician = 'BS. Lê Hoàng Cường',
  gender = 'Nam',
  orderId,
  orderLineId,
  itemId,
  docNo,
  birthDate,
  age,
  icd10,
  clinicalDiagnosis,
  performDate,
  admitDate,
  healthInsuranceCard,
  orderingDept,
  onClose,
  onNextStudy,
  onPrevStudy,
  currentIndex = 1,
  totalStudies = 1
}) => {
  const upperPatientName = (patientName || '').toUpperCase();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendation, setRecommendation] = useState('');

  // UI Panels & Layout toggles
  const [isMiniPacsOpen, setIsMiniPacsOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'templates' | 'phrases' | 'info' | 'execution'>('templates');
  const [isPriorModalOpen, setIsPriorModalOpen] = useState(false);
  const [selectedPriorStudy, setSelectedPriorStudy] = useState<PriorStudyReport | null>(null);

  // List of prior diagnostic studies for current patient
  const priorStudies: PriorStudyReport[] = useMemo(() => {
    return [
      {
        id: 'PRIOR-001',
        studyDate: '15/01/2026',
        modality: 'CT',
        serviceName: 'Chụp Cắt Lớp Vi Tính Lồng Ngực 64 Dãy (Có tiêm cản quang)',
        icd10: 'R05',
        clinicalDiagnosis: 'Ho kéo dài, đau tức ngực phải / Theo dõi nốt mờ phổi',
        orderingDept: 'Khoa Nội Hô Hấp',
        referringDoctor: 'BS. Lê Hoàng Cường',
        readingDoctor: 'BS. CKI. Lê Hoàng Cường',
        approvingDoctor: 'BS. CKII. Nguyễn Văn An',
        technologist: 'KTV. Đỗ Hoàng Long',
        device: 'Máy CT Scanner Siemens SOMATOM go.Top 64 Lát',
        procedureRoom: 'Phòng CT-Scanner 01',
        findings:
          '- Nhu mô phổi hai bên: Thùy trên phổi phải (phân thùy S1) có nốt mờ kích thước ~3.2mm, bờ tròn đều, không vôi hóa, không tạo hang xung quanh.\n- Không thấy vùng đông đặc hay thâm nhiễm phế nang mới.\n- Khí phế quản chính và các nhánh phế quản gốc hai bên thông thoáng.\n- Trung thất: Không thấy hạch phì đại trung thất, không thấy u trung thất trước - giữa - sau.\n- Màng phổi: Không thấy tràn dịch hay tràn khí màng phổi hai bên.\n- Tim và các mạch máu lớn: Chỉ số tim ngực trong giới hạn bình thường, không phình động mạch chủ ngực.\n- Khung xương lồng ngực: Cấu trúc xương sườn và cột sống ngực nguyên vẹn.',
        impression:
          'Hình ảnh theo dõi nốt mờ nhỏ đơn độc thùy trên phổi phải (~3.2mm), đặc điểm hình ảnh hướng nhiều đến tổn thương lành tính. Không thấy bất thường trung thất hay màng phổi.',
        recommendation:
          'Đề nghị chụp CT Scanner ngực liều thấp (Low-dose CT) kiểm tra lại sau 6 - 12 tháng để đánh giá tiến triển kích thước nốt.',
        studyInstanceUid: '1.2.840.113619.2.55.3.604688319.878.1510123456.101'
      },
      {
        id: 'PRIOR-002',
        studyDate: '10/08/2025',
        modality: 'CR',
        serviceName: 'Chụp X-quang Ngực Thẳng Kỹ Thuật Số (DR)',
        icd10: 'Z00.0',
        clinicalDiagnosis: 'Khám sức khỏe định kỳ hàng năm',
        orderingDept: 'Khoa Khám Bệnh',
        referringDoctor: 'BS. Phạm Thị Mai',
        readingDoctor: 'BS. CKII. Nguyễn Văn An',
        approvingDoctor: 'BS. CKII. Nguyễn Văn An',
        technologist: 'KTV. Vũ Thị Lan',
        device: 'Hệ Thống X-Quang Kỹ Thuật Số Carestream DRX-Evolution',
        procedureRoom: 'Phòng X-Quang K02',
        findings:
          '- Hai phế trường sáng đều, thông khí tốt.\n- Rốn phổi hai bên đậm nhẹ dạng mạch máu.\n- Không thấy hình ảnh thâm nhiễm, đám mờ hay nốt tổn thương khu trú rõ rệt.\n- Vòm hoành hai bên mềm mại, góc tâm hoành và sườn hoành hai bên nhọn.\n- Bóng tim không lớn, chỉ số tim lồng ngực < 0.5.\n- Khung xương lồng ngực không thấy hình ảnh gãy xương hay tổn thương tiêu xương.',
        impression: 'Hiện tại chưa phát hiện hình ảnh bất thường tim phổi trên phim X-quang ngực thẳng.',
        recommendation: 'Khám sức khỏe định kỳ theo quy định.',
        studyInstanceUid: '1.2.840.113619.2.55.3.604688319.878.1510123456.102'
      },
      {
        id: 'PRIOR-003',
        studyDate: '02/03/2025',
        modality: 'US',
        serviceName: 'Siêu Âm Ổ Bụng Tổng Quát (Màu Doppler)',
        icd10: 'K76.0',
        clinicalDiagnosis: 'Đầy bụng khó tiêu, đau âm ỉ hạ sườn phải',
        orderingDept: 'Khoa Nội Tiêu Hóa',
        referringDoctor: 'BS. CKI. Trần Hữu Dũng',
        readingDoctor: 'BS. CKI. Phạm Thanh Tùng',
        approvingDoctor: 'BS. CKI. Phạm Thanh Tùng',
        technologist: 'KTV. Lê Minh Quân',
        device: 'Máy Siêu Âm Màu 4D GE Healthcare Voluson E8 Expert',
        procedureRoom: 'Phòng Siêu Âm 01',
        findings:
          '- Gan: Kích thước bình thường, bờ đều, hồi âm dày nhẹ rải rác, giảm âm nhẹ vùng sâu, tĩnh mạch cửa và tĩnh mạch trên gan không giãn.\n- Túi mật: Kích thước bình thường, thành mỏng ~2mm, lòng dịch trong, không thấy sỏi hay polyp.\n- Đường mật trong và ngoài gan không giãn, ống mật chủ d = 4mm.\n- Tụy & Lách: Cấu trúc đồng nhất, không thấy khối khu trú bất thường.\n- Thận phải: Kích thước bình thường, phân biệt tủy vỏ rõ, không ứ nước, không sỏi.\n- Thận trái: Kích thước bình thường, đài dưới có nốt tăng âm kích thước ~3mm kèm bóng cản nhẹ, không ứ nước.\n- Bàng quang & Tiền liệt tuyến: Bàng quang nước tiểu trong, thành mỏng.\n- Dịch tự do ổ bụng: Không có dịch khoang màng bụng.',
        impression:
          'Hình ảnh Siêu âm Gan nhiễm mỡ nhẹ (Độ 1) · Theo dõi cặn sỏi nhỏ đài dưới thận trái (~3mm). Chưa thấy bất thường các tạng khác trong ổ bụng.',
        recommendation:
          'Uống nhiều nước (2 - 2.5 lít/ngày). Chế độ ăn hạn chế mỡ động vật, rượu bia. Tái khám siêu âm kiểm tra sau 6 tháng.',
        studyInstanceUid: '1.2.840.113619.2.55.3.604688319.878.1510123456.103'
      }
    ];
  }, []);

  useEffect(() => {
    if (priorStudies.length > 0 && !selectedPriorStudy) {
      setSelectedPriorStudy(priorStudies[0]);
    }
  }, [priorStudies, selectedPriorStudy]);

  const [readingTime, setReadingTime] = useState<string>(
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
      ' ' +
      new Date().toLocaleDateString('vi-VN')
  );
  const [approvalTime, setApprovalTime] = useState<string>(
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
      ' ' +
      new Date().toLocaleDateString('vi-VN')
  );
  const [executionTime, setExecutionTime] = useState<string>(
    performDate
      ? formatDisplayDate(performDate) + ' 08:30'
      : studyDate
      ? studyDate + ' 08:30'
      : '15/08/2026 08:30'
  );
  const [equipment, setEquipment] = useState<string>(
    (DEFAULT_DEVICES[modality.toUpperCase()] || DEFAULT_DEVICES['US'])[0]
  );
  const [procedureRoom, setProcedureRoom] = useState<string>(
    modality === 'US'
      ? 'Phòng Siêu Âm 01 (Tầng 1)'
      : modality === 'CT'
      ? 'Phòng CT-Scanner 64 Lát'
      : modality === 'MR'
      ? 'Phòng MRI 1.5T'
      : 'Phòng X-Quang K02'
  );
  const [technologist, setTechnologist] = useState<string>('KTV. Đỗ Hoàng Long');
  const [protocol, setProtocol] = useState<string>(
    modality === 'CT'
      ? 'Cắt lát mỏng 1.25mm - Tiêm cản quang tĩnh mạch'
      : modality === 'US'
      ? 'Khảo sát 2D/3D - Doppler màu xung'
      : 'Chụp tiêu chuẩn protocol Bộ Y Tế'
  );
  const [templateSearch, setTemplateSearch] = useState('');
  const [isCriticalAlert, setIsCriticalAlert] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechField, setActiveSpeechField] = useState<'findings' | 'impression' | 'recommendation'>('findings');

  // Doctors
  const [readingDoctor, setReadingDoctor] = useState<string>(user?.fullName || 'BS. CKI. Phạm Thanh Tùng');
  const [approvingDoctor, setApprovingDoctor] = useState<string>('BS. CKII. Nguyễn Văn An');

  // Modals & Feedback
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHotkeyModalOpen, setIsHotkeyModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [studyMedia, setStudyMedia] = useState<StudyMediaItem[]>([]);

  const isSigned = report?.status === 'SIGNED';

  const fetchStudyMedia = async () => {
    try {
      const res = await api.get(`/studies/${studyInstanceUid}/media`);
      if (res.data?.success && res.data.media) {
        setStudyMedia(res.data.media);
      }
    } catch (err) {
      console.warn('Cannot fetch study media:', err);
    }
  };

  // Load existing report and media
  useEffect(() => {
    fetchReport();
    fetchStudyMedia();
  }, [studyInstanceUid]);

  const fetchReport = async () => {
    try {
      const effectiveLineId = orderLineId || (accessionNumber !== 'N/A' ? accessionNumber : undefined);
      const hisRes = await api.get('/his/reports', {
        params: {
          orderId: orderId || undefined,
          orderLineId: effectiveLineId,
          accessionNumber,
          studyInstanceUid,
          itemId
        }
      });

      if (hisRes.data?.success && hisRes.data.data && (hisRes.data.data.findings || hisRes.data.data.impression)) {
        const d = hisRes.data.data;
        setFindings(d.findings || '');
        setImpression(d.impression || '');
        setRecommendation(d.recommendation || '');
        if (d.readingDoctor) setReadingDoctor(d.readingDoctor);
        if (d.approvingDoctor) setApprovingDoctor(d.approvingDoctor);
        setReport({
          id: String(d.orderId || 'HIS'),
          studyInstanceUid,
          patientId,
          patientName,
          modality,
          studyDate,
          findings: d.findings || '',
          impression: d.impression || '',
          recommendation: d.recommendation || '',
          status: d.status === 'T' ? 'SIGNED' : 'DRAFT',
          createdBy: d.readingDoctor || 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setAutoSaveStatus(d.status === 'T' ? 'Đã tải kết quả đã ký từ ViMES HIS' : 'Đã tải kết quả lưu nháp từ ViMES HIS');
        return;
      }

      const res = await api.get('/reports/study/' + studyInstanceUid);
      if (res.data && (res.data.findings || res.data.impression)) {
        setReport(res.data);
        setFindings(res.data.findings || '');
        setImpression(res.data.impression || '');
        setRecommendation(res.data.recommendation || '');
        if (res.data.status === 'SIGNED') {
          setIsCriticalAlert(res.data.isCritical || false);
        }
        return;
      }

      applyNormalTemplate();
    } catch {
      applyNormalTemplate();
    }
  };

  const applyNormalTemplate = () => {
    const modKey = modality.toUpperCase();
    const list = QUICK_TEMPLATES[modKey] || QUICK_TEMPLATES['US'];
    const normalTpl = list.find((t) => t.tag === 'BÌNH THƯỜNG') || list[0];
    if (normalTpl) {
      setFindings(normalTpl.findings);
      setImpression(normalTpl.impression);
      setRecommendation(normalTpl.recommendation);
      setAutoSaveStatus('Đã nạp mẫu Chuẩn Bình Thường');
    }
  };

  const appendPhraseToFindings = (phrase: string) => {
    setFindings((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return '• ' + phrase;
      return trimmed + '\n• ' + phrase;
    });
    setAutoSaveStatus('Đã chèn cụm từ');
  };

  const handleClearForm = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ nội dung mô tả và kết luận?')) {
      setFindings('');
      setImpression('');
      setRecommendation('');
      setAutoSaveStatus('Đã xóa trắng form');
    }
  };

  const handleFindingsChange = (val: string) => {
    let replaced = val;
    Object.entries(DOT_PHRASES).forEach(([dot, expanded]) => {
      if (replaced.includes(dot)) {
        replaced = replaced.split(dot).join(expanded);
      }
    });
    setFindings(replaced);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        studyInstanceUid,
        patientId,
        patientName: upperPatientName,
        modality,
        studyDate,
        findings,
        impression,
        recommendation,
        readingDoctor,
        approvingDoctor,
        status: 'DRAFT'
      };
      await Promise.allSettled([
        api.post('/imaging/save-draft', {
          orderId: orderId || (accessionNumber !== 'N/A' && !isNaN(Number(accessionNumber)) ? Number(accessionNumber) : 1001),
          lineId: orderLineId || accessionNumber,
          docNo: patientId,
          patientId,
          patientName: upperPatientName,
          modality,
          technique: protocol,
          findings,
          conclusion: impression,
          doctorId: user?.id || user?.username || 'BS_CDHA',
          doctorName: readingDoctor || user?.fullName || 'Bác Sĩ CĐHA',
          studyInstanceUid
        }),
        api.post('/reports/draft', payload),
        api.post('/his/reports/save-draft', {
          orderId: orderId || (accessionNumber !== 'N/A' && !isNaN(Number(accessionNumber)) ? Number(accessionNumber) : 1001),
          orderLineId: orderLineId || accessionNumber,
          accessionNumber,
          itemId: itemId || 'B2100064',
          findings,
          impression,
          recommendation,
          readingDoctor,
          approvingDoctor,
          studyInstanceUid
        })
      ]);
      setReport((prev) => ({ ...prev, status: 'DRAFT' } as any));
      setAutoSaveStatus(`Đã Lưu Nháp lúc ${new Date().toLocaleTimeString('vi-VN')}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSignReport = async (autoAdvance = false) => {
    setSigning(true);
    try {
      const payload = {
        studyInstanceUid,
        patientId,
        patientName: upperPatientName,
        modality,
        studyDate,
        findings,
        impression,
        recommendation,
        readingDoctor,
        approvingDoctor,
        status: 'SIGNED',
        isCritical: isCriticalAlert,
        signedAt: new Date().toISOString()
      };
      await Promise.allSettled([
        api.post('/imaging/sign-approve', {
          orderId: orderId || (accessionNumber !== 'N/A' && !isNaN(Number(accessionNumber)) ? Number(accessionNumber) : 1001),
          lineId: orderLineId || accessionNumber,
          docNo: patientId,
          patientId,
          patientName: upperPatientName,
          modality,
          technique: protocol,
          findings,
          conclusion: impression,
          doctorId: user?.id || user?.username || 'BS_CDHA',
          approverName: approvingDoctor || readingDoctor || 'Bác Sĩ CĐHA',
          studyInstanceUid
        }),
        api.post('/reports/sign', payload),
        api.post('/his/reports/sign-approve', {
          orderId: orderId || (accessionNumber !== 'N/A' && !isNaN(Number(accessionNumber)) ? Number(accessionNumber) : 1001),
          orderLineId: orderLineId || accessionNumber,
          accessionNumber,
          itemId: itemId || 'B2100064',
          findings,
          impression,
          recommendation,
          readingDoctor,
          approvingDoctor,
          studyInstanceUid
        })
      ]);
      setReport((prev) => ({ ...prev, status: 'SIGNED' } as any));
      setAutoSaveStatus(`Đã Ký Số & Phê Duyệt lúc ${new Date().toLocaleTimeString('vi-VN')}`);

      if (autoAdvance && onNextStudy) {
        setTimeout(() => {
          onNextStudy();
        }, 300);
      }
    } finally {
      setSigning(false);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn chưa hỗ trợ Web Speech API. Vui lòng sử dụng Chrome/Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        if (activeSpeechField === 'findings') {
          setFindings((prev) => prev + ' ' + finalTranscript);
        } else if (activeSpeechField === 'impression') {
          setImpression((prev) => prev + ' ' + finalTranscript);
        } else {
          setRecommendation((prev) => prev + ' ' + finalTranscript);
        }
      }
    };

    recognition.start();
  };

  // Global Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsHotkeyModalOpen((prev) => !prev);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        toggleSpeechRecognition();
      }
      if (e.key === 'F3') {
        e.preventDefault();
        setIsMediaModalOpen((prev) => !prev);
      }
      if (e.key === 'F4') {
        e.preventDefault();
        applyNormalTemplate();
      }
      if (e.key === 'F6') {
        e.preventDefault();
        setIsMiniPacsOpen((prev) => !prev);
      }
      if (e.key === 'F7') {
        e.preventDefault();
        if (onPrevStudy) onPrevStudy();
      }
      if (e.key === 'F8') {
        e.preventDefault();
        if (onNextStudy) onNextStudy();
      }
      if (e.key === 'F9') {
        e.preventDefault();
        handleSignReport(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintModalOpen(true);
      }
      if (e.key === 'Escape' && !isPrintModalOpen && !isShareModalOpen && !isHotkeyModalOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findings, impression, recommendation, isListening, onNextStudy, onPrevStudy, isPrintModalOpen, isShareModalOpen, isHotkeyModalOpen]);

  // Filtered Templates
  const modTemplates = QUICK_TEMPLATES[modality.toUpperCase()] || QUICK_TEMPLATES['US'];
  const filteredTemplates = modTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.tag.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const phrasesList = COMMON_PHRASES[modality.toUpperCase()] || COMMON_PHRASES['US'];

  const genderDisplay =
    gender === 'Nữ' || gender === 'F' || gender === '2' || gender?.toLowerCase() === 'female' ? 'Nữ' : 'Nam';
  const computedAge = age
    ? String(age)
    : (() => {
        if (!birthDate) return null;
        try {
          const dob = new Date(birthDate);
          const y = new Date().getFullYear() - dob.getFullYear();
          return y > 0 && y < 150 ? String(y) : null;
        } catch {
          return null;
        }
      })();

  const handleRevokeSignature = async () => {
    if (!revokeReason.trim()) {
      alert('Vui lòng nhập lý do hủy chữ ký số để lưu vết kiểm toán (Audit Trail).');
      return;
    }
    setRevoking(true);
    try {
      const orderIdVal = orderId || (accessionNumber !== 'N/A' && !isNaN(Number(accessionNumber)) ? Number(accessionNumber) : 1001);
      const res = await api.post('/imaging/revoke-signature', {
        orderId: orderIdVal,
        lineId: orderLineId || accessionNumber,
        docNo: patientId,
        patientId,
        patientName: upperPatientName,
        modality,
        doctorId: user?.id || user?.username || 'BS_CDHA',
        doctorName: readingDoctor || user?.fullName || 'Bác Sĩ CĐHA',
        reason: revokeReason.trim(),
        studyInstanceUid
      });

      if (res.data?.success) {
        setReport((prev) => ({ ...prev, status: 'DRAFT' } as any));
        setAutoSaveStatus(`Đã hủy ký số lúc ${new Date().toLocaleTimeString('vi-VN')} · Mở khóa bản nháp`);
        setIsRevokeModalOpen(false);
        setRevokeReason('');
        alert('Đã hủy chữ ký số thành công. Kết quả đã được mở khóa để Bác sĩ chỉnh sửa lại.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi hủy chữ ký số');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="h-full w-full max-w-full flex-1 flex flex-col bg-slate-100 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 font-sans select-none overflow-hidden transition-colors duration-200">
      {/* Header Bar */}
      <ReportHeaderBar
        onClose={onClose}
        onPrevStudy={onPrevStudy}
        onNextStudy={onNextStudy}
        currentIndex={currentIndex}
        totalStudies={totalStudies}
        modality={modality}
        patientName={upperPatientName}
        patientId={patientId}
        healthInsuranceCard={healthInsuranceCard}
        genderDisplay={genderDisplay}
        computedAge={computedAge}
        birthDate={birthDate}
        description={description}
        onOpenHotkeyModal={() => setIsHotkeyModalOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        onApplyNormalTemplate={applyNormalTemplate}
        isMiniPacsOpen={isMiniPacsOpen}
        onToggleMiniPacs={() => setIsMiniPacsOpen((prev) => !prev)}
        isSigned={isSigned}
        saving={saving}
        signing={signing}
        onSaveDraft={handleSaveDraft}
        onSignReport={handleSignReport}
        onRevokeSignature={() => setIsRevokeModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenMediaCapture={() => setIsMediaModalOpen(true)}
        mediaCount={studyMedia.length}
        keyImagesCount={studyMedia.filter((m) => m.is_key_image).length}
        icd10={icd10}
        clinicalDiagnosis={clinicalDiagnosis}
        orderingDept={orderingDept}
        referringPhysician={referringPhysician}
        performDate={performDate}
        admitDate={admitDate}
        studyDate={studyDate}
        priorStudiesCount={priorStudies.length}
        onOpenPriorModal={() => {
          if (priorStudies.length > 0) setSelectedPriorStudy(priorStudies[0]);
          setIsPriorModalOpen(true);
        }}
        activeSidebarTab={activeSidebarTab}
        onOpenExecutionTab={() => setActiveSidebarTab('execution')}
        autoSaveStatus={autoSaveStatus}
        isCriticalAlert={isCriticalAlert}
        onToggleCriticalAlert={() => setIsCriticalAlert((prev) => !prev)}
      />

      {/* Main Workspace (3-Pane Layout) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Pane 1: Clinical Sidebar */}
        <ClinicalSidebar
          isMiniPacsOpen={isMiniPacsOpen}
          activeSidebarTab={activeSidebarTab}
          setActiveSidebarTab={setActiveSidebarTab}
          templateSearch={templateSearch}
          setTemplateSearch={setTemplateSearch}
          filteredTemplates={filteredTemplates}
          onApplyTemplate={(tpl: MedicalTemplate) => {
            setFindings(tpl.findings);
            setImpression(tpl.impression);
            setRecommendation(tpl.recommendation);
            setAutoSaveStatus(`Đã áp dụng mẫu: ${tpl.name}`);
          }}
          phrasesList={phrasesList}
          onAppendPhrase={appendPhraseToFindings}
          icd10={icd10}
          clinicalDiagnosis={clinicalDiagnosis}
          description={description}
          orderingDept={orderingDept}
          referringPhysician={referringPhysician}
          docNo={docNo}
          patientId={patientId}
          accessionNumber={accessionNumber}
          healthInsuranceCard={healthInsuranceCard}
          isSigned={isSigned}
          readingDoctor={readingDoctor}
          setReadingDoctor={setReadingDoctor}
          readingTime={readingTime}
          setReadingTime={setReadingTime}
          approvingDoctor={approvingDoctor}
          setApprovingDoctor={setApprovingDoctor}
          approvalTime={approvalTime}
          setApprovalTime={setApprovalTime}
          modality={modality}
          equipment={equipment}
          setEquipment={setEquipment}
          procedureRoom={procedureRoom}
          setProcedureRoom={setProcedureRoom}
          executionTime={executionTime}
          setExecutionTime={setExecutionTime}
          technologist={technologist}
          setTechnologist={setTechnologist}
          protocol={protocol}
          setProtocol={setProtocol}
          onSaveExecutionConfig={() => {
            setAutoSaveStatus(`Đã lưu thông tin thực hiện lúc ${new Date().toLocaleTimeString('vi-VN')}`);
          }}
        />

        {/* Pane 2: Mini PACS Viewport */}
        <MiniPacsViewport
          isOpen={isMiniPacsOpen}
          studyInstanceUid={studyInstanceUid}
          patientName={upperPatientName}
          modality={modality}
          studyMedia={studyMedia}
          onOpenMediaCapture={() => setIsMediaModalOpen(true)}
        />

        {/* Pane 3: Clinical Text Editor */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-100 dark:bg-[#081020] overflow-hidden p-2 sm:p-3 space-y-2 transition-colors">
          {/* Block 1: Findings */}
          <div className="flex-1 min-h-0 flex flex-col rounded-xl bg-white dark:bg-[#09162e] border border-slate-200 dark:border-[#1b3762] overflow-hidden shadow-sm transition-colors">
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-[#0c1e3d] border-b border-slate-200 dark:border-[#1b3762] flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white uppercase tracking-wide text-[11px]">
                <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>1. Mô Tả Hình Ảnh (Findings)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleSpeechRecognition}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse shadow-md'
                      : 'bg-sky-50 dark:bg-[#153460] hover:bg-sky-100 dark:hover:bg-[#1c4580] text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-[#23569a]'
                  }`}
                  title="Bật/Tắt Đọc Kết Quả Bằng Giọng Nói (F2)"
                >
                  {isListening ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 text-slate-400" />}
                  <span>{isListening ? 'Đang Nghe... (F2)' : '🎙️ F2 Giọng Nói'}</span>
                </button>

                <button
                  onClick={handleClearForm}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                  title="Xóa trắng form"
                >
                  <Eraser className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-2.5 min-h-0">
              <textarea
                value={findings}
                onFocus={() => setActiveSpeechField('findings')}
                onChange={(e) => handleFindingsChange(e.target.value)}
                placeholder="Nhập mô tả tổn thương hoặc dùng phím gõ tắt (.bt, .soi, .ruotthua)..."
                className="w-full h-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm font-sans leading-relaxed focus:outline-none resize-none custom-scrollbar"
              />
            </div>
          </div>

          {/* Bottom Row: Impression & Recommendation */}
          <div className="h-36 sm:h-40 grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
            {/* Block 2: Impression */}
            <div className="flex flex-col rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50/50 dark:from-[#07242c] dark:via-[#091b2c] dark:to-[#071320] border-2 border-teal-400 dark:border-teal-500/50 overflow-hidden shadow-sm transition-colors">
              <div className="px-3 py-1 bg-teal-100/70 dark:bg-[#062028] border-b border-teal-200 dark:border-teal-500/40 flex items-center justify-between text-[11px] font-extrabold text-teal-900 dark:text-teal-300 uppercase tracking-wide">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  2. Kết Luận Chẩn Đoán (Impression)
                </span>
                <span className="text-[9px] text-teal-700 dark:text-teal-400/80 font-mono">Chính xác</span>
              </div>
              <div className="flex-1 p-2 min-h-0">
                <textarea
                  value={impression}
                  onFocus={() => setActiveSpeechField('impression')}
                  onChange={(e) => setImpression(e.target.value)}
                  placeholder="Nhập kết luận chẩn đoán chính..."
                  className="w-full h-full bg-transparent text-teal-950 dark:text-teal-200 font-bold placeholder-teal-600/60 text-xs sm:text-sm leading-relaxed focus:outline-none resize-none custom-scrollbar"
                />
              </div>
            </div>

            {/* Block 3: Recommendation */}
            <div className="flex flex-col rounded-xl bg-white dark:bg-[#09162e] border border-slate-200 dark:border-[#1b3762] overflow-hidden shadow-sm transition-colors">
              <div className="px-3 py-1 bg-amber-50/70 dark:bg-[#0c1e3d] border-b border-amber-200 dark:border-[#1b3762] flex items-center justify-between text-[11px] font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-300" />
                  3. Lời Khuyên &amp; Đề Nghị (Recommendation)
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">Tùy chọn</span>
              </div>
              <div className="flex-1 p-2 min-h-0">
                <textarea
                  value={recommendation}
                  onFocus={() => setActiveSpeechField('recommendation')}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="Khám định kỳ, xét nghiệm bổ sung, chế độ sinh hoạt..."
                  className="w-full h-full bg-transparent text-slate-800 dark:text-amber-200/90 placeholder-slate-400 dark:placeholder-slate-500 text-xs leading-relaxed focus:outline-none resize-none custom-scrollbar"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <HotkeysHelpModal
        isOpen={isHotkeyModalOpen}
        onClose={() => setIsHotkeyModalOpen(false)}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        studyInstanceUid={studyInstanceUid}
        patientId={patientId}
        patientName={upperPatientName}
        modality={modality}
        studyDate={studyDate}
        findings={findings}
        impression={impression}
        recommendation={recommendation}
        readingDoctor={readingDoctor}
        keyImages={studyMedia
          .filter((m) => m.is_key_image)
          .map((m) => ({ url: m.url, title: m.original_name, orderIndex: m.order_index }))}
      />

      <ShareReportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        studyInstanceUid={studyInstanceUid}
        patientId={patientId}
        patientName={upperPatientName}
      />

      <PriorStudyModal
        isOpen={isPriorModalOpen}
        onClose={() => setIsPriorModalOpen(false)}
        priorStudies={priorStudies}
        selectedStudy={selectedPriorStudy}
        onSelectStudy={(s) => setSelectedPriorStudy(s)}
        patientName={upperPatientName}
      />

      <MediaCaptureModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        studyInstanceUid={studyInstanceUid}
        patientName={upperPatientName}
        modality={modality}
        studyMedia={studyMedia}
        onMediaUpdated={fetchStudyMedia}
      />

      {/* Revoke Signature Confirmation Modal */}
      {isRevokeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c182c] rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-extrabold text-sm">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-300">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <span>Hủy Chữ Ký Số & Mở Khóa Kết Quả</span>
              </div>
              <button
                onClick={() => setIsRevokeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Hành động này sẽ <b>thu hồi chữ ký số y tế</b>, chuyển trạng thái ca chụp về <b>Bản Nháp (DRAFT)</b> và ghi nhận sự kiện vào <b>Nhật ký kiểm toán (Audit Trail)</b> để tra cứu trách nhiệm khi có sự cố.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400">Bệnh nhân:</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 uppercase">{upperPatientName}</p>
                </div>
                <div>
                  <span className="text-slate-400">Mã ca / Chỉ định:</span>
                  <p className="font-mono font-bold text-teal-600 dark:text-teal-400">{patientId} · {modality}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Lý do hủy ký số / Mở khóa chỉnh sửa <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Ví dụ: Bổ sung mô tả quai động mạch chủ, đính chính phân loại theo hội chẩn với khoa Lâm sàng..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRevokeModalOpen(false)}
                disabled={revoking}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleRevokeSignature}
                disabled={revoking || !revokeReason.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${revoking ? 'animate-spin' : ''}`} />
                <span>{revoking ? 'Đang xử lý...' : 'Xác Nhận Hủy Ký Số'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportEditor;
