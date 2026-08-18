import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { Stethoscope, Database, Clock, UploadCloud, X, RefreshCw, Filter } from 'lucide-react';
import { ReportEditor } from '../reports/ReportEditor';
import { useAuthStore } from '../../store/useAuthStore';

// Types & Helpers
import {
  UnifiedItem,
  DEMO_STUDY_UIDS,
  removeVietnameseDiacritics,
  formatStudyDate
} from './types';

// Subcomponents
import { StudyFilterBar } from './components/StudyFilterBar';
import { StudyTable } from './components/StudyTable';
import { WorkflowSimulatorModal } from './components/WorkflowSimulatorModal';
import { UploadDicomModal } from './components/UploadDicomModal';
import { ShareStudyModal } from './components/ShareStudyModal';
import { QuickViewerDialog } from '../viewer/components/QuickViewerDialog';

export const StudyListPage: React.FC = () => {
  const { activeModality } = useAuthStore();
  const [unifiedList, setUnifiedList] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [quickViewerStudy, setQuickViewerStudy] = useState<any>(null);

  // Workstation Session Config & Dynamic Patient Filters
  const [modality, setModality] = useState(activeModality !== 'ALL' ? activeModality : '');
  const [studyDateFrom, setStudyDateFrom] = useState('');
  const [studyDateTo, setStudyDateTo] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [status, setStatus] = useState('');

  // Auto-sync modality filter whenever user switches activeModality in navbar
  useEffect(() => {
    setModality(activeModality !== 'ALL' ? activeModality : '');
  }, [activeModality]);

  // Upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Share
  const [shareStudyUid, setShareStudyUid] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // User Notification Toast
  const [toastNotice, setToastNotice] = useState<{ message: string; type: 'refresh' | 'filter' } | null>(null);

  // Closed-Loop Workflow Simulator State
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [simStep, setSimStep] = useState(1);
  const [simLoading, setSimLoading] = useState(false);
  const [simLog, setSimLog] = useState<string[]>([]);
  const [simCreatedOrder, setSimCreatedOrder] = useState<any>(null);

  // Debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data Fetching & Status Aggregation
  const fetchStudies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (patientName) params.patientName = patientName;
      if (patientId) params.patientId = patientId;
      if (modality) params.modality = modality;
      if (studyDateFrom) params.studyDateFrom = studyDateFrom.replace(/-/g, '');
      if (studyDateTo) params.studyDateTo = studyDateTo.replace(/-/g, '');

      const hisParams: any = {};
      if (patientName) hisParams.patientName = patientName;
      if (patientId) hisParams.patientId = patientId;
      if (modality) hisParams.modality = modality;
      if (status) hisParams.status = status;
      if (studyDateFrom) hisParams.fromDate = studyDateFrom;
      if (studyDateTo) hisParams.toDate = studyDateTo;

      const [studiesRes, worklistRes, reportsRes, hisRes] = await Promise.all([
        api.get('/studies/search', { params }).catch(() => ({ data: [] })),
        api.get('/worklist').catch(() => ({ data: [] })),
        api.get('/reports').catch(() => ({ data: [] })),
        api.get('/his/worklist', { params: hisParams }).catch(() => ({ data: { data: [] } })),
      ]);

      const reportMap = new Map<string, any>();
      (reportsRes.data || []).forEach((r: any) => {
        if (r.studyInstanceUid) reportMap.set(r.studyInstanceUid, r);
        if (r.patientId) reportMap.set(r.patientId, r);
      });

      const mappedStudies: UnifiedItem[] = (studiesRes.data || []).map((s: any) => {
        let studyUid = '', patientNameStr = 'N/A', patientIdStr = 'N/A';
        let modalityStr = 'DICOM', studyDateStr = 'N/A', descriptionStr = 'Chẩn đoán hình ảnh';
        let seriesCount = 1, genderStr = 'N/A', accessionStr = 'N/A', referringPhysicianStr = 'N/A';

        if (s['0020000D']) {
          studyUid = s['0020000D']?.Value?.[0] || '';
          const rawName = s['00100010']?.Value?.[0];
          patientNameStr = typeof rawName === 'object' ? rawName.Alphabetic || 'N/A' : rawName || 'N/A';
          patientIdStr = s['00100020']?.Value?.[0] || 'N/A';
          modalityStr = s['00080061']?.Value?.[0] || s['00080060']?.Value?.[0] || 'DICOM';
          studyDateStr = s['00080020']?.Value?.[0] || 'N/A';
          descriptionStr = s['00081030']?.Value?.[0] || 'Chẩn đoán hình ảnh';
          genderStr = s['00100040']?.Value?.[0] || 'N/A';
          accessionStr = s['00080050']?.Value?.[0] || 'N/A';
          referringPhysicianStr = s['00080090']?.Value?.[0] || 'N/A';
        } else {
          const tags = s.MainDicomTags || s.mainDicomTags || {};
          studyUid = tags.StudyInstanceUID || s.ID || '';
          patientNameStr = tags.PatientName || s.PatientMainDicomTags?.PatientName || 'N/A';
          patientIdStr = tags.PatientID || s.PatientMainDicomTags?.PatientID || 'N/A';
          modalityStr = tags.Modality || 'DICOM';
          studyDateStr = tags.StudyDate || 'N/A';
          descriptionStr = tags.StudyDescription || 'Chẩn đoán hình ảnh';
          seriesCount = s.Series?.length || 1;
          genderStr = tags.PatientSex || s.PatientMainDicomTags?.PatientSex || 'N/A';
          accessionStr = tags.AccessionNumber || 'N/A';
          referringPhysicianStr = tags.ReferringPhysicianName || 'N/A';
        }

        return {
          type: 'PACS',
          id: studyUid,
          patientId: patientIdStr,
          patientName: (patientNameStr || 'N/A').toUpperCase(),
          gender: genderStr,
          modality: modalityStr,
          studyDate: studyDateStr,
          description: descriptionStr,
          accessionNumber: accessionStr,
          referringPhysician: referringPhysicianStr,
          seriesCount,
          raw: s,
        };
      });

      const rawHis = hisRes.data?.data || [];
      const mappedHis: UnifiedItem[] = rawHis.map((h: any) => {
        let hisStatus = 'UNREPORTED';
        if (h.order_status === 'T' || h.item_status === 'T') hisStatus = 'REPORT_SIGNED';
        else if (h.order_status === 'S' || h.item_status === 'S') hisStatus = 'REPORT_DRAFT';

        const effectiveDate = h.perform_date || h.order_date || h.admit_date;
        const hisStudyUid =
          h.study_instance_uid ||
          `1.2.840.10008.5.1.4.1.1.7.2026.${h.patient_id || h.doc_no || '0'}.${h.order_id || h.accession_number || '1'}`;

        return {
          type: 'PACS',
          id: hisStudyUid,
          patientId: String(h.patient_id || h.doc_no),
          patientName: (h.patient_name || '').toUpperCase(),
          gender: h.gender === 'M' || h.gender === 'Nam' ? 'Nam' : 'Nữ',
          modality: h.modality,
          studyDate: effectiveDate ? formatStudyDate(effectiveDate.split('T')[0].replace(/-/g, '')) : '15/08/2026',
          description: `${h.item_name} (${h.clinical_diagnosis || 'Chỉ định HIS'})`,
          accessionNumber: String(h.accession_number || h.order_id),
          referringPhysician: h.referring_physician || 'BS. ViMES Clinic',
          seriesCount: h.modality === 'CT' || h.modality === 'MR' ? 3 : 1,
          status: hisStatus,
          raw: h,
        };
      });

      const rawWl = worklistRes.data && worklistRes.data.length > 0 ? worklistRes.data : [];
      const mappedWorklist: UnifiedItem[] = rawWl.map((w: any) => {
        const assignedStudyUid =
          w.studyInstanceUid ||
          `1.2.840.10008.5.1.4.1.1.7.2026.mwl.${w.patientId || '0'}.${w.accessionNumber || w.id || '1'}`;
        return {
          type: w.status === 'COMPLETED' ? 'PACS' : 'MWL',
          id: assignedStudyUid,
          patientId: w.patientId,
          patientName: (w.patientName || '').toUpperCase(),
          gender: w.gender || 'N/A',
          modality: w.modality,
          studyDate: `${w.scheduledDate || new Date().toISOString().split('T')[0]} ${w.scheduledTime || '08:30'}`,
          description: w.scheduledProcedureStepDescription || w.description,
          accessionNumber: w.accessionNumber || w.id,
          referringPhysician: w.referringPhysician || w.doctor || 'BS. Chẩn Đoán',
          seriesCount: 1,
          status: w.status || 'COMPLETED',
          raw: w,
        };
      });

      let combined = [...mappedStudies, ...mappedHis, ...mappedWorklist];

      const seen = new Set<string>();
      combined = combined.filter((item) => {
        const key = `${item.id}_${item.patientId}_${item.modality}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      combined = combined.map((item) => {
        if (item.status === 'SCHEDULED' || item.status === 'IN_PROGRESS') {
          return item;
        }
        const rpt = reportMap.get(item.id) || reportMap.get(item.patientId);
        if (rpt) {
          if (rpt.isSigned || rpt.status === 'SIGNED') {
            return { ...item, status: 'REPORT_SIGNED' };
          }
          return { ...item, status: 'REPORT_DRAFT' };
        }
        return { ...item, status: 'UNREPORTED' };
      });

      // Filtering Rules
      if (status) {
        if (status === 'SCHEDULED') combined = combined.filter((c) => c.status === 'SCHEDULED');
        else if (status === 'IN_PROGRESS') combined = combined.filter((c) => c.status === 'IN_PROGRESS');
        else if (status === 'UNREPORTED') combined = combined.filter((c) => c.status === 'UNREPORTED');
        else if (status === 'REPORT_DRAFT') combined = combined.filter((c) => c.status === 'REPORT_DRAFT');
        else if (status === 'REPORT_SIGNED') combined = combined.filter((c) => c.status === 'REPORT_SIGNED');
        else if (status === 'COMPLETED')
          combined = combined.filter(
            (c) => c.status === 'UNREPORTED' || c.status === 'REPORT_DRAFT' || c.status === 'REPORT_SIGNED'
          );
      }

      if (modality) {
        const targetMod = modality.toUpperCase();
        combined = combined.filter((c) => {
          const itemMod = (c.modality || '').toUpperCase();
          if (targetMod === 'MR') return itemMod.includes('MR');
          if (targetMod === 'CR') return itemMod.includes('CR') || itemMod.includes('DX');
          return itemMod.includes(targetMod);
        });
      }

      if (patientId.trim()) {
        const q = patientId.trim().toLowerCase();
        combined = combined.filter((c) => (c.patientId || '').toLowerCase().includes(q));
      }

      if (patientName.trim()) {
        const q = removeVietnameseDiacritics(patientName.trim().toLowerCase());
        combined = combined.filter((c) => {
          const normalizedName = removeVietnameseDiacritics((c.patientName || '').toLowerCase());
          return normalizedName.includes(q);
        });
      }

      if (studyDateFrom || studyDateTo) {
        const fromNum = studyDateFrom ? Number(studyDateFrom.replace(/-/g, '')) : 0;
        const toNum = studyDateTo ? Number(studyDateTo.replace(/-/g, '')) : 99999999;
        combined = combined.filter((c) => {
          const raw = c.studyDate || '';
          const digits = raw.replace(/[^0-9]/g, '');
          if (!digits || digits.length < 8) return true;
          let dateNum = Number(digits.slice(0, 8));
          if (raw.includes('/') || raw.includes('-')) {
            const parts = raw.split(/[\/-]/);
            if (parts[0].length === 4) {
              dateNum = Number(`${parts[0]}${parts[1].padStart(2, '0')}${parts[2].slice(0, 2).padStart(2, '0')}`);
            } else if (parts[2] && parts[2].length >= 4) {
              dateNum = Number(`${parts[2].slice(0, 4)}${parts[1].padStart(2, '0')}${parts[0].padStart(2, '0')}`);
            }
          }
          return dateNum >= fromNum && dateNum <= toNum;
        });
      }

      setUnifiedList(combined);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách ca chụp.');
    } finally {
      setLoading(false);
    }
  }, [patientName, patientId, modality, studyDateFrom, studyDateTo, status]);

  useEffect(() => {
    fetchStudies();
  }, []);

  const handleServerRefresh = async () => {
    await fetchStudies();
    setToastNotice({ message: '↻ Đã tải lại dữ liệu mới nhất từ PACS & MWL Server!', type: 'refresh' });
    setTimeout(() => setToastNotice(null), 3000);
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchStudies();
    setToastNotice({ message: '✓ Đã áp dụng bộ lọc tìm kiếm ca bệnh', type: 'filter' });
    setTimeout(() => setToastNotice(null), 2500);
  };

  const triggerSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchStudies(), 400);
  };

  const clearFilters = () => {
    setPatientName('');
    setPatientId('');
    setStatus('');
    setModality('');
    setStudyDateFrom('');
    setStudyDateTo('');
    setTimeout(() => fetchStudies(), 50);
  };

  const hasActiveFilters = Boolean(
    patientName || patientId || modality || status || studyDateFrom || studyDateTo
  );

  const handleUpdateMWLStatus = async (id: string, newStatus: string) => {
    try {
      await api.post('/worklist/status', { id, status: newStatus });
      fetchStudies();
    } catch (err: any) {
      alert('Cập nhật trạng thái thất bại: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFiles.length) return;
    setUploading(true);
    setUploadSuccess(null);
    try {
      const formData = new FormData();
      uploadFiles.forEach((f) => formData.append('files', f));
      await api.post('/dicom/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadSuccess(`Tải lên thành công ${uploadFiles.length} tệp DICOM!`);
      setUploadFiles([]);
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadSuccess(null);
        fetchStudies();
      }, 1500);
    } catch (err: any) {
      alert('Tải file thất bại: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  // Simulation Handlers
  const MOCK_10_CASES = [
    { id: 'mwl_9901', patientId: 'BN2026_001', patientName: 'NGUYỄN THỊ MAI ANH', gender: 'F', birthDate: '1989-04-12', modality: 'CT', description: 'CT Lồng ngực 128 lát có tiêm thuốc cản quang', doctor: 'BS. Lê Hoàng Cường', finding: 'Dày nhẹ vách liên tiểu thùy vùng đáy phổi phải, không thấy khối u hay nốt mờ bất thường.', conclusion: 'Hình ảnh viêm phế quản phổi vùng đáy phổi phải mức độ nhẹ.' },
    { id: 'mwl_9902', patientId: 'BN2026_002', patientName: 'TRẦN QUỐC CƯỜNG', gender: 'M', birthDate: '1980-09-25', modality: 'MR', description: 'MRI Sọ não và Mạch máu não 3.0 Tesla', doctor: 'BS. Phạm Thanh Tùng', finding: 'Nhu mô não tín hiệu đồng nhất, các nhánh mạch đa giác Willis thông suốt, không phình mạch.', conclusion: 'Hình ảnh MRI sọ não và mạch não trong giới hạn bình thường.' },
    { id: 'mwl_9903', patientId: 'BN2026_003', patientName: 'LÊ THỊ MỸ HẠNH', gender: 'F', birthDate: '1994-11-18', modality: 'US', description: 'Siêu âm ổ bụng tổng quát Doppler màu', doctor: 'BS. Hoàng Thị Thu', finding: 'Gan nhiễm mỡ độ 1. Túi mật có 01 sỏi tăng âm kích thước 8mm kèm bóng cản rõ.', conclusion: 'Sỏi túi mật đơn độc 8mm chưa có biến chứng; Gan nhiễm mỡ độ 1.' },
    { id: 'mwl_9904', patientId: 'BN2026_004', patientName: 'PHẠM ĐỨC MINH', gender: 'M', birthDate: '1973-03-05', modality: 'MR', description: 'MRI Cột sống thắt lưng L1-S1', doctor: 'BS. Võ Minh Triết', finding: 'Thoát vị đĩa đệm tầng L4-L5 thể sau lệch phải 4.8mm ép vào rễ L5 phải.', conclusion: 'Thoát vị đĩa đệm L4-L5 chèn ép rễ L5 bên phải; Thoái hóa cột sống thắt lưng.' },
    { id: 'mwl_9905', patientId: 'BN2026_005', patientName: 'HOÀNG HẢI ĐĂNG', gender: 'M', birthDate: '2001-08-20', modality: 'CR', description: 'X-Quang Ngực thẳng KTS & Khung sườn', doctor: 'BS. CKII. Nguyễn Văn An', finding: 'Khung sườn cân đối, phế trường 2 bên sáng đều, không tràn dịch tràn khí màng phổi.', conclusion: 'Chưa thấy tổn thương xương sườn và nhu mô phổi trên phim X-quang.' },
    { id: 'mwl_9906', patientId: 'BN2026_006', patientName: 'VŨ THỊ MAI ANH', gender: 'F', birthDate: '1986-12-03', modality: 'US', description: 'Siêu âm Tuyến giáp Doppler màu (TIRADS)', doctor: 'BS. Hoàng Thị Thu', finding: 'Thùy phải có 01 nhân giảm âm nhẹ kích thước 4.5x6.2mm, bờ đều (ACR TIRADS 3).', conclusion: 'Nhân tuyến giáp thùy phải dạng lành tính (TIRADS 3, kích thước < 10mm).' },
    { id: 'mwl_9907', patientId: 'BN2026_007', patientName: 'ĐẶNG QUỐC TUẤN', gender: 'M', birthDate: '1968-07-14', modality: 'CT', description: 'CT Scanner Hệ tiết niệu - Ổ bụng KUB 64 lát', doctor: 'BS. Võ Minh Triết', finding: 'Sỏi đoạn 1/3 dưới niệu quản trái kích thước 6x9mm gây giãn ứ nước thận trái độ II.', conclusion: 'Sỏi niệu quản trái đoạn 1/3 dưới gây ứ nước thận trái độ II.' },
    { id: 'mwl_9908', patientId: 'BN2026_008', patientName: 'BÙI NGỌC LAN', gender: 'F', birthDate: '1998-05-22', modality: 'MR', description: 'MRI Khớp gối phải 3.0 Tesla', doctor: 'BS. CKII. Nguyễn Văn An', finding: 'Đứt hoàn toàn dây chằng chéo trước (ACL), rách sừng sau sụn chêm trong độ II.', conclusion: 'Đứt hoàn toàn dây chằng chéo trước (ACL) gối phải; Rách sụn chêm trong độ II.' },
    { id: 'mwl_9909', patientId: 'BN2026_009', patientName: 'ĐỖ CAO THẮNG', gender: 'M', birthDate: '1979-10-30', modality: 'ES', description: 'Nội soi Thực quản - Dạ dày - Tá tràng NBI KTS', doctor: 'BS. Hoàng Thị Thu', finding: 'Hang vị niêm mạc phù nề xung huyết rải rác, Clo-test dương tính (+).', conclusion: 'Viêm trợt niêm mạc hang vị dạ dày xung huyết; Test vi khuẩn HP (+).' },
    { id: 'mwl_9910', patientId: 'BN2026_010', patientName: 'NGÔ THỊ DIỆU LINH', gender: 'F', birthDate: '1996-02-14', modality: 'US', description: 'Siêu âm 4D Hình thái học thai nhi (22 tuần)', doctor: 'BS. Hoàng Thị Thu', finding: '01 Thai sống ngôi đầu phát triển tương đương 22 tuần 2 ngày, hình thái học bình thường.', conclusion: 'Thai 22 tuần phát triển tốt trong tử cung; Chưa thấy bất thường hình thái học.' },
  ];

  const runAuto10CasesWorkflow = async () => {
    setSimLoading(true);
    setSimLog([`🚀 BẮT ĐẦU CHẠY TỰ ĐỘNG QUY TRÌNH KHÉP KÍN 6 BƯỚC CHO 10 CA CHỤP THỰC TẾ...`]);

    for (let i = 0; i < MOCK_10_CASES.length; i++) {
      const c = MOCK_10_CASES[i];
      const caseHeader = `\n🏥 === [CA CHỤP ${i + 1}/10]: BN ${c.patientName} (${c.patientId}) - ${c.modality} ===`;

      try {
        await api.post('/worklist', c).catch(() => {});
      } catch {}
      setSimLog((prev) => [...prev, caseHeader, `✅ [BƯỚC 1]: HIS tạo chỉ định HL7 ORM^O01 -> Ca ${c.id}: ${c.description}`]);

      try {
        await api.post('/worklist/status', { id: c.id, status: 'IN_PROGRESS' }).catch(() => {});
      } catch {}
      setSimLog((prev) => [...prev, `✅ [BƯỚC 2]: Máy ${c.modality} gửi DICOM C-FIND SCU nạp BN ${c.patientName} -> Trạng thái: ĐANG CHỤP`]);

      try {
        await api.post('/worklist/status', { id: c.id, status: 'COMPLETED' }).catch(() => {});
      } catch {}
      setSimLog((prev) => [...prev, `✅ [BƯỚC 3]: Máy ${c.modality} bắn gói phim DICOM 3D (C-STORE) về PACS Server -> Trạng thái: ĐÃ CHỤP`]);
      setSimLog((prev) => [...prev, `✅ [BƯỚC 4]: KTV duyệt chất lượng phim DICOM -> Image Quality Approved`]);
      setSimLog((prev) => [...prev, `✅ [BƯỚC 5]: ${c.doctor} đọc phim trên Workstation -> Phê duyệt & Ký số Y tế đẩy về HIS`]);
      setSimLog((prev) => [...prev, `🎉 [BƯỚC 6]: Sinh Mã QR Cổng Bệnh nhân KTS -> Link: http://localhost:8000/portal/view?studyUid=${c.id}&patientId=${c.patientId}`]);
    }

    setSimStep(6);
    setSimLoading(false);
    setSimLog((prev) => [...prev, `\n✨ HOÀN TẤT THÀNH CÔNG QUY TRÌNH KHÉP KÍN 6 BƯỚC CHO TOÀN BỘ 10 CA CHỤP THỰC TẾ!`]);
    fetchStudies();
  };

  const runSimStep1 = async () => {
    setSimLoading(true);
    const mockEntry = MOCK_10_CASES[0];
    try {
      const res = await api.post('/worklist', mockEntry);
      setSimCreatedOrder(res.data?.entry || mockEntry);
    } catch {
      setSimCreatedOrder(mockEntry);
    } finally {
      setSimLog((prev) => [...prev, `✅ [BƯỚC 1]: Bác sĩ ra y lệnh -> HIS bắn HL7 ORM^O01 tạo ca mới mwl_9901 (BN: VÕ VĂN HOÀNG - CT Lồng Ngực 128 Lát)`]);
      setSimStep(2);
      setSimLoading(false);
      fetchStudies();
    }
  };

  const runSimStep2 = async () => {
    setSimLoading(true);
    try {
      if (simCreatedOrder) {
        await api.post('/worklist/status', { id: simCreatedOrder.id, status: 'IN_PROGRESS' }).catch(() => {});
      }
    } finally {
      setSimLog((prev) => [...prev, `✅ [BƯỚC 2]: KTV tiếp nhận BN tại Phòng CT-01 -> Máy CT gửi DICOM C-FIND SCU nạp dữ liệu (Đổi trạng thái: ĐANG CHỤP)`]);
      setSimStep(3);
      setSimLoading(false);
      fetchStudies();
    }
  };

  const runSimStep3 = async () => {
    setSimLoading(true);
    try {
      if (simCreatedOrder) {
        await api.post('/worklist/status', { id: simCreatedOrder.id, status: 'COMPLETED' }).catch(() => {});
      }
    } finally {
      setSimLog((prev) => [...prev, `✅ [BƯỚC 3]: Máy CT phát tia chụp -> Đóng gói 128 phim DICOM 3D bắn C-STORE về PACS Server (Đổi trạng thái: ĐÃ CHỤP)`]);
      setSimStep(4);
      setSimLoading(false);
      fetchStudies();
    }
  };

  const runSimStep4 = () => {
    setSimLog((prev) => [...prev, `✅ [BƯỚC 4]: KTV kiểm tra chất lượng phim DICOM -> Xác nhận ảnh đạt tiêu chuẩn (Image Quality Approved)`]);
    setSimStep(5);
  };

  const runSimStep5 = () => {
    setSimLog((prev) => [...prev, `✅ [BƯỚC 5]: Bác sĩ CĐHA đọc phim trên Workstation -> Phê duyệt & Ký Số Y Tế (Tự động truyền dữ liệu về HIS)`]);
    setSimStep(6);
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pacsCount = unifiedList.filter((i) => i.type === 'PACS' || i.status === 'COMPLETED').length;
  const mwlCount = unifiedList.filter((i) => i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS').length;

  // Full-Screen Report Editor View
  if (selectedStudy) {
    const currentIdx = unifiedList.findIndex(
      (item) =>
        item.id === selectedStudy.studyInstanceUid ||
        item.id === selectedStudy.id ||
        item.patientId === selectedStudy.patientId
    );
    const prevItem = currentIdx > 0 ? unifiedList[currentIdx - 1] : null;
    const nextItem = currentIdx >= 0 && currentIdx < unifiedList.length - 1 ? unifiedList[currentIdx + 1] : null;

    const handleNext = nextItem
      ? () => {
          setSelectedStudy({
            ...nextItem,
            studyInstanceUid: nextItem.id,
          });
        }
      : undefined;

    const handlePrev = prevItem
      ? () => {
          setSelectedStudy({
            ...prevItem,
            studyInstanceUid: prevItem.id,
          });
        }
      : undefined;

    return (
      <ReportEditor
        studyInstanceUid={selectedStudy.studyInstanceUid || selectedStudy.id}
        patientId={selectedStudy.patientId}
        patientName={selectedStudy.patientName}
        modality={selectedStudy.modality}
        studyDate={formatStudyDate(selectedStudy.studyDate)}
        description={selectedStudy.description}
        accessionNumber={selectedStudy.accessionNumber}
        referringPhysician={selectedStudy.referringPhysician}
        gender={selectedStudy.gender}
        orderId={selectedStudy.raw?.order_id}
        orderLineId={selectedStudy.raw?.accession_number}
        itemId={selectedStudy.raw?.item_id}
        docNo={selectedStudy.raw?.doc_no}
        birthDate={selectedStudy.raw?.birth_date}
        age={selectedStudy.raw?.age}
        icd10={selectedStudy.raw?.icd10}
        clinicalDiagnosis={selectedStudy.raw?.clinical_diagnosis}
        performDate={selectedStudy.raw?.perform_date}
        admitDate={selectedStudy.raw?.admit_date}
        healthInsuranceCard={selectedStudy.raw?.health_insurance_card}
        orderingDept={selectedStudy.raw?.ordering_dept}
        onClose={() => setSelectedStudy(null)}
        onNextStudy={handleNext}
        onPrevStudy={handlePrev}
        currentIndex={currentIdx >= 0 ? currentIdx + 1 : 1}
        totalStudies={unifiedList.length}
      />
    );
  }

  // Normal Study List View
  return (
    <div className="w-full px-5 py-4 space-y-3 bg-slate-100 dark:bg-[#090c12] min-h-screen transition-colors duration-200">
      {/* Top Header Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Stethoscope className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight">
              Danh Sách Ca Chụp
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Quản lý ca bệnh và dữ liệu chẩn đoán hình ảnh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
            <Database className="w-3.5 h-3.5" /> {pacsCount} PACS
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" /> {mwlCount} MWL
          </span>
          <button
            onClick={() => setIsSimOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1a3461] hover:bg-[#1e3f7a] text-white text-xs font-bold border border-[#2a4a7f] shadow-sm transition-all cursor-pointer"
            title="Chạy kịch bản quy trình khép kín 6 bước (HIS ➔ KTV ➔ PACS ➔ BS ➔ Portal)"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>⚡ Quy Trình Khép Kín 6 Bước</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0c6e9e] hover:bg-[#0a5d87] text-white text-xs font-semibold border border-[#1080b0] shadow-sm transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" /> Tải Phim DICOM
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <StudyFilterBar
        modality={modality}
        setModality={setModality}
        status={status}
        setStatus={setStatus}
        studyDateFrom={studyDateFrom}
        setStudyDateFrom={setStudyDateFrom}
        studyDateTo={studyDateTo}
        setStudyDateTo={setStudyDateTo}
        patientId={patientId}
        setPatientId={setPatientId}
        patientName={patientName}
        setPatientName={setPatientName}
        hasActiveFilters={hasActiveFilters}
        loading={loading}
        onClearFilters={clearFilters}
        onRefresh={handleServerRefresh}
        onApplyFilter={handleApplyFilter}
        triggerSearch={triggerSearch}
      />

      {/* Toast Notification Banner */}
      {toastNotice && (
        <div
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm transition ${
            toastNotice.type === 'refresh'
              ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          <span className="flex items-center gap-2">
            {toastNotice.type === 'refresh' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Filter className="w-3.5 h-3.5" />
            )}
            {toastNotice.message}
          </span>
          <button
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Table Section */}
      <StudyTable
        unifiedList={unifiedList}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onSelectStudy={setSelectedStudy}
        onOpenQuickViewer={setQuickViewerStudy}
        onUpdateMWLStatus={handleUpdateMWLStatus}
      />

      {/* Quick DICOM Viewer Dialog */}
      <QuickViewerDialog
        isOpen={!!quickViewerStudy}
        onClose={() => setQuickViewerStudy(null)}
        studyId={quickViewerStudy?.id || quickViewerStudy?.studyInstanceUid}
        patientName={quickViewerStudy?.patientName}
        patientId={quickViewerStudy?.patientId}
        modality={quickViewerStudy?.modality}
        accessionNumber={quickViewerStudy?.accessionNumber}
        studyDate={quickViewerStudy?.studyDate}
      />

      {/* Modals */}
      <UploadDicomModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        uploadFiles={uploadFiles}
        setUploadFiles={setUploadFiles}
        uploading={uploading}
        uploadSuccess={uploadSuccess}
        onSubmit={handleUploadSubmit}
      />

      <WorkflowSimulatorModal
        isOpen={isSimOpen}
        onClose={() => setIsSimOpen(false)}
        simStep={simStep}
        simLoading={simLoading}
        simLog={simLog}
        onRunAuto10Cases={runAuto10CasesWorkflow}
        onRunStep1={runSimStep1}
        onRunStep2={runSimStep2}
        onRunStep3={runSimStep3}
        onRunStep4={runSimStep4}
        onRunStep5={runSimStep5}
      />

      <ShareStudyModal
        shareStudyUid={shareStudyUid}
        shareUrl={shareUrl}
        copied={copied}
        onClose={() => {
          setShareStudyUid(null);
          setShareUrl(null);
        }}
        onCopyUrl={copyShareUrl}
      />
    </div>
  );
};

export default StudyListPage;
