import React, { useState, useEffect } from 'react';
import { EMRRecord, EMRDocumentItem } from '../types';
import { emrService } from '../services/emrService';
import {
  PenTool,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  KeyRound,
  Filter,
  Search,
  FileText,
  Building2,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface PendingSignItem {
  recordId: string;
  recordNumber: string;
  patientName: string;
  patientId: string;
  departmentName: string;
  document: EMRDocumentItem;
}

export const EMRDigitalSignatureView: React.FC = () => {
  const [pendingItems, setPendingItems] = useState<PendingSignItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedCA, setSelectedCA] = useState<string>('VNPT-CA Cloud HSM Sub-CA');
  const [loading, setLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    loadPendingDocuments();
  }, []);

  const loadPendingDocuments = async () => {
    setLoading(true);
    try {
      const records = await emrService.getRecords();
      const items: PendingSignItem[] = [];

      records.forEach(r => {
        r.documents.forEach(doc => {
          if (doc.status !== 'signed') {
            items.push({
              recordId: r.id,
              recordNumber: r.recordNumber,
              patientName: r.patient.fullName,
              patientId: r.patient.patientId,
              departmentName: r.departmentName,
              document: doc,
            });
          }
        });
      });

      setPendingItems(items);
      setSelectedKeys([]);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách văn bản chờ ký số');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (key: string) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    if (selectedKeys.length === pendingItems.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(pendingItems.map(item => `${item.recordId}_${item.document.id}`));
    }
  };

  const handleSignSingle = async (item: PendingSignItem) => {
    setIsSigning(true);
    try {
      await emrService.signDocument(item.recordId, item.document.id, {
        signerId: 'BS-001',
        signerName: 'BSCKII. Nguyễn Văn An',
        signerTitle: 'Bác sĩ điều trị',
        signerRole: 'doctor',
        certificateIssuer: selectedCA,
      });
      toast.success(`Đã ký số thành công: ${item.document.name} (${item.patientName})`);
      loadPendingDocuments();
    } catch (err) {
      toast.error('Ký số thất bại');
    } finally {
      setIsSigning(false);
    }
  };

  const handleBatchSign = async () => {
    if (selectedKeys.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một văn bản để ký số');
      return;
    }

    setIsSigning(true);
    try {
      const itemsToSign = selectedKeys.map(k => {
        const [recordId, docId] = k.split('_');
        return { recordId, documentId: docId };
      });

      const count = await emrService.batchSignDocuments(itemsToSign, {
        signerId: 'BS-001',
        signerName: 'BSCKII. Nguyễn Văn An',
        signerTitle: 'Bác sĩ điều trị',
        signerRole: 'doctor',
        certificateIssuer: selectedCA,
      });

      toast.success(`Đã ký số thành công ${count} văn bản y khoa`);
      loadPendingDocuments();
    } catch (err) {
      toast.error('Lỗi trong quá trình ký số hàng loạt');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Trung tâm Ký số Y khoa & Phê duyệt Bệnh án
            </h1>
            <p className="text-xs text-slate-500">
              Ký số điện tử bằng chứng thư số bảo mật HSM / SmartCA / USB Token theo Luật Giao dịch Điện tử.
            </p>
          </div>
        </div>

        {/* Certificate Provider Selector */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-right hidden sm:block">
            <span className="text-slate-400 block text-[10px]">CHỨNG THƯ SỐ ĐANG KẾT NỐI</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">● Sẵn sàng ký số</strong>
          </div>
          <select
            value={selectedCA}
            onChange={e => setSelectedCA(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="VNPT-CA Cloud HSM Sub-CA">VNPT-CA (Cloud HSM)</option>
            <option value="Viettel-CA SmartCA">Viettel-CA (SmartCA)</option>
            <option value="FPT-CA eSign Enterprise">FPT-CA (eSign Enterprise)</option>
            <option value="Ban Co Yeu Chinh Phu - Root CA">Ban Cơ yếu Chính phủ</option>
          </select>
        </div>
      </div>

      {/* Main Signing Workspace */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Action Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors"
            >
              {selectedKeys.length === pendingItems.length && pendingItems.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-sky-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Chọn tất cả ({pendingItems.length} văn bản)</span>
            </button>

            {selectedKeys.length > 0 && (
              <span className="text-xs text-sky-700 dark:text-sky-300 font-bold px-2 py-0.5 bg-sky-100 dark:bg-sky-950 rounded-md">
                Đã chọn {selectedKeys.length} văn bản
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={selectedKeys.length === 0 || isSigning}
            onClick={handleBatchSign}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            {isSigning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang thực hiện ký số...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Ký số đồng loạt ({selectedKeys.length})</span>
              </>
            )}
          </button>
        </div>

        {/* Table of pending items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3">Tên mẫu văn bản y tế</th>
                <th className="p-3">Bệnh nhân & Số HSBA</th>
                <th className="p-3">Khoa phòng điều trị</th>
                <th className="p-3">Người lập biểu</th>
                <th className="p-3">Thời gian tạo</th>
                <th className="p-3 text-right">Ký đơn lẻ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <div className="animate-spin inline-block w-6 h-6 border-b-2 border-sky-600 rounded-full mb-2"></div>
                    <p>Đang kiểm tra các văn bản y khoa...</p>
                  </td>
                </tr>
              ) : pendingItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      Tất cả văn bản y tế đã được ký số đầy đủ!
                    </p>
                    <p className="text-xs">Không có văn bản nào tồn đọng chờ ký số.</p>
                  </td>
                </tr>
              ) : (
                pendingItems.map(item => {
                  const key = `${item.recordId}_${item.document.id}`;
                  const isSelected = selectedKeys.includes(key);

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => toggleSelect(key)}
                          className="text-slate-400 hover:text-sky-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Tên văn bản */}
                      <td className="p-3 align-middle">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                          <div>
                            <strong className="text-slate-900 dark:text-slate-100 font-bold block">
                              {item.document.name}
                            </strong>
                            <span className="font-mono text-[10px] text-slate-400">
                              Mã: {item.document.code} • v{item.document.version}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Bệnh nhân */}
                      <td className="p-3 align-middle">
                        <strong className="text-slate-900 dark:text-slate-100 block">
                          {item.patientName}
                        </strong>
                        <span className="font-mono text-sky-700 dark:text-sky-400 text-[11px]">
                          {item.recordNumber} ({item.patientId})
                        </span>
                      </td>

                      {/* Khoa phòng */}
                      <td className="p-3 align-middle text-slate-700 dark:text-slate-300">
                        {item.departmentName}
                      </td>

                      {/* Người lập */}
                      <td className="p-3 align-middle text-slate-600 dark:text-slate-400">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.document.createdByName}</p>
                        <p className="text-[10px] text-slate-400">{item.document.createdByTitle}</p>
                      </td>

                      {/* Thời gian */}
                      <td className="p-3 align-middle text-slate-500 font-mono text-[11px]">
                        {item.document.createdAt}
                      </td>

                      {/* Ký đơn lẻ */}
                      <td className="p-3 align-middle text-right">
                        <button
                          type="button"
                          disabled={isSigning}
                          onClick={() => handleSignSingle(item)}
                          className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-600 hover:text-white text-sky-700 dark:text-sky-300 font-semibold rounded-lg transition-all border border-sky-200 dark:border-sky-800"
                        >
                          Ký ngay
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
