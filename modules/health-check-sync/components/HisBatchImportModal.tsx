import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { healthCheckService } from '../../../services/healthCheckService';
import { 
    CloudUploadIcon, 
    DownloadIcon, 
    RefreshIcon, 
    CheckCircleIcon, 
    AlertCircleIcon, 
    InfoIcon,
    TrashIcon
} from '../../../components/Icons';
import { toast } from 'sonner';

interface HisBatchImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ParsedDocRow {
    rawDocNo: string;
    docNo: number;
    patientName?: string;
    dob?: string;
    cccd?: string;
    roomName?: string;
    admitDate?: string;
    status: 'valid' | 'invalid' | 'duplicate';
    error?: string;
}

export const HisBatchImportModal: React.FC<HisBatchImportModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // State
    const [fileName, setFileName] = useState<string>('');
    const [parsedRows, setParsedRows] = useState<ParsedDocRow[]>([]);
    const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
    const [selectedDocNoColumn, setSelectedDocNoColumn] = useState<string>('');
    const [overwrite, setOverwrite] = useState<boolean>(true);

    // Sync execution states
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [processedCount, setProcessedCount] = useState<number>(0);
    const [totalValidCount, setTotalValidCount] = useState<number>(0);

    const [summary, setSummary] = useState<{
        total: number;
        createdCount: number;
        updatedCount: number;
        skippedCount: number;
        failedCount: number;
    }>({
        total: 0,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        failedCount: 0
    });

    const [logs, setLogs] = useState<Array<{
        time: string;
        type: 'info' | 'success' | 'warning' | 'error';
        text: string;
    }>>([]);

    if (!isOpen) return null;

    const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        setLogs(prev => {
            const next = [...prev, { time: timeStr, type, text }];
            return next;
        });
        setTimeout(() => {
            if (logContainerRef.current) {
                logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
            }
        }, 50);
    };

    // Tải file mẫu chuẩn Excel
    const handleDownloadTemplate = () => {
        try {
            const wb = XLSX.utils.book_new();

            const templateData = [
                ['STT', 'Số hồ sơ (*)', 'Họ và tên', 'Ngày sinh', 'CCCD', 'Phòng khám', 'Ngày vào khám', 'Ghi chú'],
                [1, 26036081, 'LÊ VĂN NGHỊ', '25/11/1950', '037050001432', 'Phòng Khám Sức Khỏe Số 1', '13/06/2026 06:47', 'KSK Người cao tuổi'],
                [2, 26036082, 'TỐNG THỊ THÌN', '20/10/1951', '037151000856', 'Phòng Khám Sức Khỏe Số 1', '13/06/2026 06:49', ''],
                [3, 26036086, 'ĐỖ VĂN CHẨM', '19/05/1950', '037050001951', 'Phòng Khám Sức Khỏe Số 2', '13/06/2026 06:52', ''],
                [4, 26036085, 'NGUYỄN THỊ THẮM', '20/09/1962', '037162005571', 'Phòng Khám Sức Khỏe Số 1', '13/06/2026 06:53', ''],
                [5, 26036091, 'NGUYỄN VĂN XÍCH', '28/08/1950', '037050001278', 'Phòng Khám Sức Khỏe Số 1', '13/06/2026 06:56', '']
            ];

            const ws = XLSX.utils.aoa_to_sheet(templateData);
            ws['!cols'] = [
                { wch: 6 },  // STT
                { wch: 18 }, // Số hồ sơ (*)
                { wch: 25 }, // Họ và tên
                { wch: 14 }, // Ngày sinh
                { wch: 18 }, // CCCD
                { wch: 28 }, // Phòng khám
                { wch: 20 }, // Ngày vào khám
                { wch: 25 }  // Ghi chú
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Mau_Dong_Bo_KSK_HIS');

            // Sheet hướng dẫn
            const guideData = [
                ['HƯỚNG DẪN IMPORT ĐỒNG BỘ HỒ SƠ KHÁM SỨC KHỎE TỪ HIS'],
                [''],
                ['1. Quy tắc hoạt động:', 'Hệ thống chỉ cần đọc cột "Số hồ sơ" (doc_no). Sau đó hệ thống sẽ tự động truy vấn toàn bộ dữ liệu khám từ CSDL HIS (Hành chính, Sinh hiệu, Lâm sàng, Cận lâm sàng LIMS/PACS, Kết luận) và tự động sinh XML 1551/2062.'],
                ['2. Cột bắt buộc (*):', 'Cột "Số hồ sơ" (Mã số tiếp đón đợt khám trên HIS) là bắt buộc.'],
                ['3. Các cột khác:', 'Họ tên, Ngày sinh, CCCD... là các cột phụ trợ giúp đối soát trực quan trên bảng xem trước.'],
                ['4. Khuyến nghị:', 'Mỗi file nên chứa từ 50 đến 1.000 hồ sơ để việc đồng bộ diễn ra nhanh và mượt mà nhất.']
            ];
            const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
            wsGuide['!cols'] = [{ wch: 22 }, { wch: 90 }];
            XLSX.utils.book_append_sheet(wb, wsGuide, 'Huong_Dan');

            XLSX.writeFile(wb, 'mau_import_dong_bo_ksk_his.xlsx');
            toast.success('Đã tải xuống file mẫu Excel thành công!');
        } catch (err: any) {
            toast.error('Lỗi khi tải file mẫu: ' + err.message);
        }
    };

    // Xử lý đọc file Excel
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setLogs([]);
        setIsCompleted(false);
        setIsSyncing(false);
        setProgressPercent(0);
        setProcessedCount(0);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // Đọc dạng json mảng 2 chiều để quét header
                const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                if (rawData.length === 0) {
                    toast.error('File Excel rỗng!');
                    return;
                }

                // Tìm dòng tiêu đề (header row)
                let headerRowIndex = 0;
                let foundHeaders: string[] = [];

                for (let i = 0; i < Math.min(rawData.length, 10); i++) {
                    const row = rawData[i];
                    const hasDocNoHeader = row.some(cell => 
                        /số\s*hồ\s*sơ|mã\s*hồ\s*sơ|số\s*hs|doc_no|docno|doc\s*no|số\s*tiếp\s*đón|mã\s*đợt\s*khám|hd_docno/i.test(String(cell))
                    );
                    if (hasDocNoHeader) {
                        headerRowIndex = i;
                        foundHeaders = row.map(c => String(c).trim()).filter(Boolean);
                        break;
                    }
                }

                if (foundHeaders.length === 0) {
                    // Mặc định lấy dòng 0 nếu không tìm thấy header rõ ràng
                    foundHeaders = rawData[0].map(c => String(c).trim()).filter(Boolean);
                }

                setDetectedHeaders(foundHeaders);

                // Xác định index cột "Số hồ sơ"
                const headerRow = rawData[headerRowIndex].map(c => String(c).trim().toLowerCase());
                let docNoColIdx = -1;
                let nameColIdx = -1;
                let dobColIdx = -1;
                let cccdColIdx = -1;
                let roomColIdx = -1;
                let admitColIdx = -1;

                headerRow.forEach((headerText, idx) => {
                    if (/số\s*hồ\s*sơ|mã\s*hồ\s*sơ|số\s*hs|doc_no|docno|doc\s*no|số\s*tiếp\s*đón|mã\s*đợt\s*khám|hd_docno/i.test(headerText)) {
                        docNoColIdx = idx;
                    } else if (/họ\s*và\s*tên|họ\s*tên|tên\s*bệnh\s*nhân|patient_name/i.test(headerText)) {
                        nameColIdx = idx;
                    } else if (/ngày\s*sinh|năm\s*sinh|dob|birth/i.test(headerText)) {
                        dobColIdx = idx;
                    } else if (/cccd|cmnd|định\s*danh/i.test(headerText)) {
                        cccdColIdx = idx;
                    } else if (/phòng\s*khám|phòng|room/i.test(headerText)) {
                        roomColIdx = idx;
                    } else if (/ngày\s*vào|ngày\s*khám|thời\s*gian\s*khám/i.test(headerText)) {
                        admitColIdx = idx;
                    }
                });

                // Nếu không tìm thấy cột số hồ sơ theo tên, thử đoán cột chứa số hồ sơ (> 6 chữ số)
                if (docNoColIdx === -1) {
                    for (let c = 0; c < (rawData[headerRowIndex + 1]?.length || 0); c++) {
                        const val = String(rawData[headerRowIndex + 1][c] || '').trim();
                        if (/^\d{6,12}$/.test(val)) {
                            docNoColIdx = c;
                            break;
                        }
                    }
                }

                if (docNoColIdx !== -1) {
                    setSelectedDocNoColumn(rawData[headerRowIndex][docNoColIdx] || `Cột ${docNoColIdx + 1}`);
                }

                // Trích xuất các dòng dữ liệu
                const rows: ParsedDocRow[] = [];
                const seenDocNos = new Set<number>();

                for (let r = headerRowIndex + 1; r < rawData.length; r++) {
                    const rowData = rawData[r];
                    if (!rowData || rowData.length === 0 || rowData.every(c => !String(c).trim())) {
                        continue;
                    }

                    const rawVal = docNoColIdx !== -1 ? String(rowData[docNoColIdx] || '').trim() : '';
                    const cleanNum = parseInt(rawVal, 10);

                    const pName = nameColIdx !== -1 ? String(rowData[nameColIdx] || '').trim() : '';
                    const pDob = dobColIdx !== -1 ? String(rowData[dobColIdx] || '').trim() : '';
                    const pCccd = cccdColIdx !== -1 ? String(rowData[cccdColIdx] || '').trim() : '';
                    const pRoom = roomColIdx !== -1 ? String(rowData[roomColIdx] || '').trim() : '';
                    const pAdmit = admitColIdx !== -1 ? String(rowData[admitColIdx] || '').trim() : '';

                    if (!rawVal || isNaN(cleanNum) || cleanNum <= 0) {
                        rows.push({
                            rawDocNo: rawVal,
                            docNo: 0,
                            patientName: pName,
                            dob: pDob,
                            cccd: pCccd,
                            roomName: pRoom,
                            admitDate: pAdmit,
                            status: 'invalid',
                            error: 'Số hồ sơ trống hoặc không phải số'
                        });
                    } else if (seenDocNos.has(cleanNum)) {
                        rows.push({
                            rawDocNo: rawVal,
                            docNo: cleanNum,
                            patientName: pName,
                            dob: pDob,
                            cccd: pCccd,
                            roomName: pRoom,
                            admitDate: pAdmit,
                            status: 'duplicate',
                            error: 'Trùng lặp số hồ sơ trong file'
                        });
                    } else {
                        seenDocNos.add(cleanNum);
                        rows.push({
                            rawDocNo: rawVal,
                            docNo: cleanNum,
                            patientName: pName,
                            dob: pDob,
                            cccd: pCccd,
                            roomName: pRoom,
                            admitDate: pAdmit,
                            status: 'valid'
                        });
                    }
                }

                setParsedRows(rows);
                const validCount = rows.filter(r => r.status === 'valid').length;
                setTotalValidCount(validCount);

                if (validCount > 0) {
                    toast.success(`Đã đọc được ${validCount} số hồ sơ hợp lệ từ file ${file.name}`);
                } else {
                    toast.warning('Không tìm thấy số hồ sơ hợp lệ nào trong file!');
                }
            } catch (err: any) {
                toast.error('Lỗi khi đọc file Excel: ' + err.message);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    // Bắt đầu quá trình đồng bộ theo Chunk
    const handleStartSync = async () => {
        const validDocNos = parsedRows.filter(r => r.status === 'valid').map(r => r.docNo);
        if (validDocNos.length === 0) {
            toast.error('Không có số hồ sơ hợp lệ nào để đồng bộ!');
            return;
        }

        setIsSyncing(true);
        setIsCompleted(false);
        setLogs([]);
        setProgressPercent(0);
        setProcessedCount(0);

        setSummary({
            total: validDocNos.length,
            createdCount: 0,
            updatedCount: 0,
            skippedCount: 0,
            failedCount: 0
        });

        addLog(`🚀 Bắt đầu quá trình đồng bộ ${validDocNos.length} hồ sơ từ HIS...`, 'info');

        const CHUNK_SIZE = 30; // 30 hồ sơ mỗi batch để đảm bảo tốc độ phản hồi mượt mà
        const chunks: number[][] = [];
        for (let i = 0; i < validDocNos.length; i += CHUNK_SIZE) {
            chunks.push(validDocNos.slice(i, i + CHUNK_SIZE));
        }

        let totalProcessed = 0;
        let totalCreated = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;
        let totalFailed = 0;

        for (let idx = 0; idx < chunks.length; idx++) {
            const chunk = chunks[idx];
            const batchNum = idx + 1;
            addLog(`⏳ Đang xử lý lô ${batchNum}/${chunks.length} (${chunk.length} hồ sơ)...`, 'info');

            try {
                const res = await healthCheckService.batchSyncHis(chunk, overwrite);
                if (res && res.success) {
                    totalCreated += res.createdCount || 0;
                    totalUpdated += res.updatedCount || 0;
                    totalSkipped += res.skippedCount || 0;
                    totalFailed += res.failedCount || 0;

                    // Log từng hồ sơ trong kết quả
                    if (Array.isArray(res.results)) {
                        for (const item of res.results) {
                            if (item.success) {
                                const actionText = item.action === 'created' ? 'Tạo mới' : (item.action === 'updated' ? 'Cập nhật' : 'Bỏ qua');
                                const formText = item.formType ? `[Mẫu ${item.formType}]` : '';
                                addLog(`✅ HS #${item.docNo} - ${item.patientName || 'BN'} ${formText}: ${actionText} thành công`, 'success');
                            } else {
                                addLog(`❌ HS #${item.docNo}: ${item.message || 'Lỗi đồng bộ'}`, 'error');
                            }
                        }
                    }
                } else {
                    totalFailed += chunk.length;
                    addLog(`❌ Lô ${batchNum} thất bại: ${res?.error || 'Lỗi không xác định'}`, 'error');
                }
            } catch (chunkErr: any) {
                totalFailed += chunk.length;
                addLog(`❌ Lỗi kết nối khi xử lý lô ${batchNum}: ${chunkErr.message}`, 'error');
            }

            totalProcessed += chunk.length;
            setProcessedCount(totalProcessed);
            const pct = Math.round((totalProcessed / validDocNos.length) * 100);
            setProgressPercent(pct);

            setSummary({
                total: validDocNos.length,
                createdCount: totalCreated,
                updatedCount: totalUpdated,
                skippedCount: totalSkipped,
                failedCount: totalFailed
            });
        }

        setIsSyncing(false);
        setIsCompleted(true);
        addLog(`🎉 HOÀN TẤT ĐỒNG BỘ: Tạo mới ${totalCreated}, Cập nhật ${totalUpdated}, Bỏ qua ${totalSkipped}, Lỗi ${totalFailed}`, 'info');
        toast.success(`Đã đồng bộ xong ${validDocNos.length} hồ sơ từ HIS!`);
    };

    // Đóng modal và refresh lại danh sách
    const handleClose = () => {
        if (isCompleted) {
            onSuccess();
        }
        onClose();
    };

    const validRows = parsedRows.filter(r => r.status === 'valid');
    const invalidRows = parsedRows.filter(r => r.status !== 'valid');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-teal-700 to-[#0f766e] text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <CloudUploadIcon className="w-6 h-6 text-teal-200" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold tracking-wide">IMPORT &amp; ĐỒNG BỘ HỒ SƠ TỪ HIS (EXCEL)</h3>
                            <p className="text-xs text-teal-100/90 font-medium">
                                Tự động kéo dữ liệu Hành chính, Sinh hiệu, Khám chuyên khoa, Cận lâm sàng &amp; Kết luận từ HIS theo danh sách Số hồ sơ
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSyncing}
                        className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition disabled:opacity-50"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {/* Khu vực Chọn File & Tải Mẫu */}
                    {!isSyncing && !isCompleted && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".xlsx, .xls, .csv"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2.5 bg-[#0f766e] hover:bg-[#0d645c] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                                    >
                                        <CloudUploadIcon className="w-4 h-4" />
                                        Chọn file Excel (.xlsx, .xls)
                                    </button>
                                    {fileName ? (
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                            Đã chọn: <span className="text-[#0f766e] dark:text-teal-400">{fileName}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Chưa chọn file</span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                                >
                                    <DownloadIcon className="w-3.5 h-3.5 text-[#0f766e]" />
                                    Tải file mẫu Excel
                                </button>
                            </div>

                            {/* Cấu hình tùy chọn */}
                            <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 rounded-xl text-xs">
                                <label className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={overwrite}
                                        onChange={e => setOverwrite(e.target.checked)}
                                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                                    />
                                    <span>Ghi đè &amp; Cập nhật lại nếu hồ sơ đã tồn tại trên KSK VNeID</span>
                                </label>
                                <span className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                                    (Hồ sơ đã ký số hoặc đã gửi cổng liên thông sẽ luôn được giữ nguyên an toàn)
                                </span>
                            </div>

                            {/* Bảng Xem trước dữ liệu */}
                            {parsedRows.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                            <span>Danh sách số hồ sơ đọc được:</span>
                                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full font-mono">
                                                {validRows.length} hợp lệ
                                            </span>
                                            {invalidRows.length > 0 && (
                                                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full font-mono">
                                                    {invalidRows.length} lỗi/trùng
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                                                <tr>
                                                    <th className="p-2.5 w-12 text-center">STT</th>
                                                    <th className="p-2.5 font-extrabold text-[#0f766e] dark:text-teal-400">Số hồ sơ (HIS)</th>
                                                    <th className="p-2.5">Họ và tên</th>
                                                    <th className="p-2.5">Ngày sinh</th>
                                                    <th className="p-2.5">CCCD</th>
                                                    <th className="p-2.5">Phòng khám</th>
                                                    <th className="p-2.5 text-center w-24">Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {parsedRows.slice(0, 50).map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                                                        <td className="p-2.5 font-bold font-mono text-slate-800 dark:text-slate-100">
                                                            {row.rawDocNo || <span className="text-red-500 italic">Trống</span>}
                                                        </td>
                                                        <td className="p-2.5 text-slate-700 dark:text-slate-300 uppercase">{row.patientName || '-'}</td>
                                                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{row.dob || '-'}</td>
                                                        <td className="p-2.5 text-slate-600 dark:text-slate-400 font-mono">{row.cccd || '-'}</td>
                                                        <td className="p-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{row.roomName || '-'}</td>
                                                        <td className="p-2.5 text-center">
                                                            {row.status === 'valid' ? (
                                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded text-[10px] font-bold">
                                                                    Hợp lệ
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 rounded text-[10px] font-bold" title={row.error}>
                                                                    {row.status === 'duplicate' ? 'Trùng' : 'Lỗi'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parsedRows.length > 50 && (
                                        <div className="text-[11px] text-slate-500 text-center italic">
                                            (Hiển thị trước 50 / {parsedRows.length} dòng dữ liệu từ file Excel)
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Khu vực Tiến độ Đồng bộ & Báo cáo Real-time */}
                    {(isSyncing || isCompleted) && (
                        <div className="space-y-4 animate-in fade-in">
                            {/* Thanh tiến độ */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-700 dark:text-slate-300">
                                        {isSyncing ? 'Đang tiến hành đồng bộ dữ liệu từ HIS...' : 'Đã hoàn tất quá trình đồng bộ!'}
                                    </span>
                                    <span className="text-[#0f766e] dark:text-teal-400 font-mono text-sm">
                                        {progressPercent}% ({processedCount}/{totalValidCount})
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-teal-500 to-[#0f766e] h-3 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-1"
                                        style={{ width: `${progressPercent}%` }}
                                    >
                                        {isSyncing && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                                    </div>
                                </div>
                            </div>

                            {/* Thẻ Thống kê Kết quả */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                                <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                    <div className="text-xs text-slate-500 font-medium">Tổng số</div>
                                    <div className="text-lg font-black font-mono text-slate-800 dark:text-white">{summary.total}</div>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Tạo mới</div>
                                    <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">{summary.createdCount}</div>
                                </div>
                                <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800/40">
                                    <div className="text-xs text-teal-600 dark:text-teal-400 font-bold">Cập nhật</div>
                                    <div className="text-lg font-black font-mono text-teal-700 dark:text-teal-300">{summary.updatedCount}</div>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40">
                                    <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">Bỏ qua</div>
                                    <div className="text-lg font-black font-mono text-amber-700 dark:text-amber-300">{summary.skippedCount}</div>
                                </div>
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/40">
                                    <div className="text-xs text-rose-600 dark:text-rose-400 font-bold">Thất bại</div>
                                    <div className="text-lg font-black font-mono text-rose-700 dark:text-rose-300">{summary.failedCount}</div>
                                </div>
                            </div>

                            {/* Nhật ký Console log chi tiết */}
                            <div className="space-y-1.5">
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">Nhật ký xử lý chi tiết:</div>
                                <div 
                                    ref={logContainerRef}
                                    className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] h-48 overflow-y-auto space-y-1 border border-slate-800 shadow-inner"
                                >
                                    {logs.map((log, idx) => (
                                        <div key={idx} className="flex items-start gap-2 leading-relaxed">
                                            <span className="text-slate-500">[{log.time}]</span>
                                            <span className={
                                                log.type === 'success' ? 'text-emerald-400' :
                                                log.type === 'warning' ? 'text-amber-400' :
                                                log.type === 'error' ? 'text-rose-400 font-bold' :
                                                'text-slate-200'
                                            }>
                                                {log.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        {!isSyncing && !isCompleted && validRows.length > 0 && (
                            <span>Sẵn sàng đồng bộ <strong>{validRows.length}</strong> hồ sơ từ HIS.</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {!isSyncing && !isCompleted ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="button"
                                    onClick={handleStartSync}
                                    disabled={validRows.length === 0}
                                    className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                >
                                    <CloudUploadIcon className="w-4 h-4" />
                                    Bắt đầu đồng bộ ({validRows.length})
                                </button>
                            </>
                        ) : isSyncing ? (
                            <button
                                type="button"
                                disabled
                                className="px-5 py-2.5 bg-[#0f766e] text-white rounded-xl text-xs font-bold flex items-center gap-2 opacity-80 cursor-wait"
                            >
                                <RefreshIcon className="w-4 h-4 animate-spin" />
                                Đang đồng bộ dữ liệu...
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                Đóng &amp; Tải lại danh sách
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
