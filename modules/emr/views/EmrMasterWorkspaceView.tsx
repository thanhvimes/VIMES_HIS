import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Activity,
  FileText,
  BookOpen,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Printer,
  Smartphone,
  FileEdit,
  Lock,
  RotateCcw,
  QrCode,
  AlertTriangle,
  FolderArchive,
  RefreshCw,
  User,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  TrendingUp,
  Heart,
  Thermometer,
  Gauge,
  Wind,
  Plus
} from 'lucide-react';
import { PatientTabletSignModal } from '../../document-engine/components/PatientTabletSignModal';
import { AmendDocumentModal } from '../../document-engine/components/AmendDocumentModal';

export const EmrMasterWorkspaceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'RECORD' | 'VITALS' | 'SUMMARY' | 'SPECIALTIES' | 'LENDING'>('RECORD');
  const [documents, setDocuments] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [lendingRequests, setLendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Selected
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroupFilter, setActiveGroupFilter] = useState('ALL');

  // Modals
  const [isTabletModalOpen, setIsTabletModalOpen] = useState(false);
  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false);
  const [signingBatch, setSigningBatch] = useState(false);
  const [closingBundle, setClosingBundle] = useState(false);

  // New Vital Sign form state
  const [newVital, setNewVital] = useState({
    pulse: 76,
    temperature: 36.8,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    respiratoryRate: 18,
    spo2: 98,
    weightKg: 65,
    heightCm: 168,
    notes: 'Bệnh nhân ổn định, tiếp xúc tốt'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, specRes, vitalsRes, sumRes, lendRes] = await Promise.all([
        fetch('/api/v1/emr/documents'),
        fetch('/api/v1/emr/catalogs/specialties'),
        fetch('/api/v1/emr/vital-signs/260817001'),
        fetch('/api/v1/emr/clinical-summary/260817001'),
        fetch('/api/v1/emr/lending')
      ]);

      const [docsData, specData, vitalsData, sumData, lendData] = await Promise.all([
        docsRes.json(),
        specRes.json(),
        vitalsRes.json(),
        sumRes.json(),
        lendRes.json()
      ]);

      if (docsData.success) {
        setDocuments(docsData.data || []);
        if (docsData.data && docsData.data.length > 0 && !selectedDoc) {
          setSelectedDoc(docsData.data[0]);
        }
      }
      if (specData.success) setSpecialties(specData.data || []);
      if (vitalsData.success) setVitals(vitalsData.data || []);
      if (sumData.success) setSummary(sumData.data || null);
      if (lendData.success) setLendingRequests(lendData.data || []);
    } catch (err) {
      console.error('Error fetching Enterprise EMR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordVital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/emr/vital-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docNo: selectedDoc?.docNo || '260817001',
          patientId: selectedDoc?.patientId || 'BN88291',
          ...newVital,
          recordedBy: 'dd_hoa',
          nurseName: 'ĐD. Lê Thị Hoa'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Ghi nhận sinh hiệu thành công!');
        fetchData();
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleBatchSign = async () => {
    if (selectedDocIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 tờ tài liệu cần ký số.');
      return;
    }

    setSigningBatch(true);
    try {
      const res = await fetch('/api/v1/emr/documents/batch-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: selectedDocIds,
          signerId: 'bs_an',
          signerName: 'BS. CKII. Nguyễn Văn An',
          signerRole: 'BÁC SĨ ĐIỀU TRỊ CHÍNH',
          signatureMethod: 'SMART_CA',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Ký số thành công ${data.data.totalSigned} văn bản y tế chỉ với 1 lần xác thực SmartCA.`);
        setSelectedDocIds([]);
        fetchData();
      } else {
        alert(data.error || 'Lỗi khi ký số hàng loạt.');
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSigningBatch(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> ĐÃ KÝ SỐ
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <Lock className="w-3 h-3" /> ĐÃ KHÓA WORM
          </span>
        );
      case 'AMENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <RotateCcw className="w-3 h-3" /> ĐÃ THAY THẾ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
            <Clock className="w-3 h-3 text-amber-500" /> CHỜ KÝ SỐ
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-[#070e1c] text-slate-800 dark:text-slate-100 select-none overflow-hidden font-sans">
      {/* ── Top Master Header ── */}
      <header className="px-5 py-3 bg-white dark:bg-[#0b162c] border-b border-slate-200 dark:border-[#193258] flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Hệ Thống Bệnh Án Điện Tử (Enterprise EMR)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                Thông tư 46 &amp; 54 (Mức 6 &amp; 7)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              5 Phần Hồ sơ BYT · 42 Mẫu Chuyên khoa · Ký số SmartCA/Tablet · Biểu đồ Sinh hiệu · Khóa WORM 20 Năm
            </p>
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
          {[
            { key: 'RECORD', label: 'Hồ Sơ 5 Phần', icon: FolderTree },
            { key: 'VITALS', label: 'Biểu Đồ Sinh Hiệu', icon: Activity },
            { key: 'SUMMARY', label: 'Tổng Kết Ra Viện', icon: FileText },
            { key: 'SPECIALTIES', label: '42 Mẫu Chuyên Khoa', icon: BookOpen },
            { key: 'LENDING', label: 'Mượn Đọc & Trích Sao', icon: Share2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Main Tab Body ── */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'RECORD' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Document Tree (380px) */}
            <div className="w-96 border-r border-slate-200 dark:border-[#193258] bg-white dark:bg-[#0a1428] flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-200 dark:border-[#193258] space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên tờ, mã BN, mã EMR..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {/* Document List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      selectedDoc?.id === doc.id
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                        : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        {doc.clinicalDate ? new Date(doc.clinicalDate).toLocaleDateString('vi-VN') : ''}
                      </span>
                      {renderStatusBadge(doc.status)}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {doc.documentName}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                      {doc.formTypeCode && (
                        <span className="px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {doc.formTypeCode}
                        </span>
                      )}
                      <span>·</span>
                      <span className="font-semibold uppercase">{doc.patientName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Document Inspector */}
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
              {selectedDoc && (
                <>
                  <div className="p-5 bg-white dark:bg-[#0d1829] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-slate-900 dark:text-white">{selectedDoc.documentName}</h2>
                        {renderStatusBadge(selectedDoc.status)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Bệnh nhân: <b>{selectedDoc.patientName}</b> ({selectedDoc.patientId}) · Mã đợt: <b>{selectedDoc.docNo}</b> · Mã EMR: <b>{selectedDoc.formTypeCode}</b>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsTabletModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-300 text-xs font-bold cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5 inline mr-1" /> Ký Tablet (Bệnh nhân)
                      </button>
                      <button
                        onClick={() => setIsAmendModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 text-xs font-bold cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5 inline mr-1" /> Đính Chính (v2)
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 inline mr-1" /> In Bản Sao Y
                      </button>
                    </div>
                  </div>

                  {/* JSON Snapshot */}
                  <div className="p-5 bg-white dark:bg-[#0d1829] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Dữ Liệu Đóng Băng (Data Snapshot JSON):</h3>
                    <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-60">
                      {JSON.stringify(selectedDoc.snapshotData || {}, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Vital Signs & Charts */}
        {activeTab === 'VITALS' && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Theo Dõi Chức Năng Sống &amp; Sinh Hiệu</h2>
                <p className="text-xs text-slate-500">Biểu đồ Mạch, Nhiệt độ, Huyết áp theo thời gian thực (Điều dưỡng nhập liệu)</p>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-3">
                <Heart className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                <div>
                  <span className="text-[10px] text-rose-500 font-bold uppercase">Mạch (Pulse)</span>
                  <p className="text-xl font-black text-rose-950 dark:text-rose-200">{vitals[0]?.pulse || 78} <span className="text-xs font-normal">lần/p</span></p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center gap-3">
                <Thermometer className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="text-[10px] text-amber-500 font-bold uppercase">Nhiệt độ (Temp)</span>
                  <p className="text-xl font-black text-amber-950 dark:text-amber-200">{vitals[0]?.temperature || 36.8} <span className="text-xs font-normal">°C</span></p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center gap-3">
                <Gauge className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase">Huyết áp (BP)</span>
                  <p className="text-xl font-black text-indigo-950 dark:text-indigo-200">{vitals[0]?.bloodPressureSystolic || 130}/{vitals[0]?.bloodPressureDiastolic || 85} <span className="text-xs font-normal">mmHg</span></p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 flex items-center gap-3">
                <Wind className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                <div>
                  <span className="text-[10px] text-teal-500 font-bold uppercase">SpO2 &amp; Nhịp thở</span>
                  <p className="text-xl font-black text-teal-950 dark:text-teal-200">{vitals[0]?.spo2 || 98}% <span className="text-xs font-normal">/ {vitals[0]?.respiratoryRate || 18}l/p</span></p>
                </div>
              </div>
            </div>

            {/* Vital Signs Table */}
            <div className="p-5 bg-white dark:bg-[#0d1829] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lịch Sử Đo Sinh Hiệu Lâm Sàng:</h3>
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-900/80 uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Thời gian đo</th>
                    <th className="p-3">Mạch (l/p)</th>
                    <th className="p-3">Nhiệt độ</th>
                    <th className="p-3">Huyết áp</th>
                    <th className="p-3">SpO2</th>
                    <th className="p-3">BMI</th>
                    <th className="p-3">Điều dưỡng</th>
                    <th className="p-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {vitals.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{new Date(v.recordedAt).toLocaleString('vi-VN')}</td>
                      <td className="p-3 font-bold text-rose-600">{v.pulse}</td>
                      <td className="p-3 font-bold text-amber-600">{v.temperature}°C</td>
                      <td className="p-3 font-bold">{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</td>
                      <td className="p-3 font-bold text-teal-600">{v.spo2}%</td>
                      <td className="p-3 font-bold">{v.bmi}</td>
                      <td className="p-3">{v.nurseName}</td>
                      <td className="p-3 text-slate-500 italic">{v.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Summary */}
        {activeTab === 'SUMMARY' && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-5">
            <div className="p-5 bg-white dark:bg-[#0d1829] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Tổng Kết Hồ Sơ Bệnh Án Ra Viện</h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Kết quả điều trị:</label>
                  <span className="px-3 py-1 rounded-lg font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    KHỎI BỆNH (Ra viện theo chỉ định)
                  </span>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Mã bệnh chính ICD-10:</label>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">I10 - Tăng huyết áp vô căn</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-500">Tóm tắt diễn biến lâm sàng:</label>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  Bệnh nhân vào viện do đau đầu, chóng mặt, huyết áp 160/95 mmHg. Được điều trị hạ áp bằng Amlodipin 5mg phối hợp Losartan 50mg. Sau 3 ngày điều trị, huyết áp ổn định 120/80 mmHg, hết đau đầu, ăn ngủ tốt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: 42 Specialties Catalog */}
        {activeTab === 'SPECIALTIES' && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">42 Mẫu Bệnh Án Chuyên Khoa Chuẩn Bộ Y Tế (QĐ 4069)</h2>
              <p className="text-xs text-slate-500">Danh mục biểu mẫu bệnh án nội trú &amp; ngoại trú tích hợp sẵn cấu trúc trường chuyên khoa</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {specialties.map((spec) => (
                <div key={spec.code} className="p-4 rounded-2xl bg-white dark:bg-[#0d1829] border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {spec.formNumber}
                    </span>
                    <span className="text-[10px] font-bold text-teal-600">{spec.isInpatient ? 'Nội trú' : 'Ngoại trú'}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{spec.name}</h4>
                  <p className="text-[10px] font-mono text-slate-400">Mã: {spec.code}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Lending & Research */}
        {activeTab === 'LENDING' && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Khai Thác, Mượn Đọc &amp; Trích Sao Bệnh Án</h2>
              <p className="text-xs text-slate-500">Quản lý cấp quyền xem hồ sơ bệnh án phục vụ Nghiên cứu khoa học, Giám định pháp y, Thanh tra BHYT (Điều 11 - TT 46)</p>
            </div>

            <div className="p-5 bg-white dark:bg-[#0d1829] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Danh Sách Yêu Cầu Mượn Đọc Đã Phê Duyệt:</h3>
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có yêu cầu mượn đọc nào đang chờ duyệt
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Patient Tablet Modal */}
      {selectedDoc && (
        <PatientTabletSignModal
          isOpen={isTabletModalOpen}
          onClose={() => setIsTabletModalOpen(false)}
          documentId={selectedDoc.id}
          documentName={selectedDoc.documentName}
          patientName={selectedDoc.patientName}
          patientId={selectedDoc.patientId}
          onSignedSuccess={() => fetchData()}
        />
      )}

      {/* Amend Document Modal */}
      {selectedDoc && (
        <AmendDocumentModal
          isOpen={isAmendModalOpen}
          onClose={() => setIsAmendModalOpen(false)}
          document={selectedDoc}
          onAmendSuccess={() => fetchData()}
        />
      )}
    </div>
  );
};

export default EmrMasterWorkspaceView;
