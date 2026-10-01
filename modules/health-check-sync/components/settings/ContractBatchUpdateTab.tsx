// ============================================================================
// File: modules/health-check-sync/components/settings/ContractBatchUpdateTab.tsx
// Purpose: Công cụ giao diện cho Quản trị viên (Admin) hiệu chỉnh hàng loạt gói khám:
//          - Cập nhật Ngày khám (Hợp đồng, Nhân viên, Phiếu tiếp nhận, Khám lâm sàng, XML)
//          - Cập nhật Buồng/Phòng khám (Hợp đồng def_roomid, Khám he_roomid, he_deptid)
//          - Cập nhật Địa chỉ & Mã tỉnh/xã BHYT
//          Tái sử dụng Combobox chuẩn, hỗ trợ Dry-Run mô phỏng an toàn trước khi lưu.
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '../../../../contexts/SessionContext';
import { healthCheckService } from '../../../../services/healthCheckService';
import Combobox, { ComboboxColumn } from '../../../../components/ui/Combobox';
import { 
    AdjustmentsHorizontalIcon, 
    CalendarIcon, 
    BuildingOfficeIcon, 
    RefreshIcon, 
    CheckIcon, 
    PlayIcon, 
    XIcon, 
    SearchIcon
} from '../../../../components/Icons';
import { toast } from 'sonner';

const ShieldExclamationIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002A11.96 11.96 0 0112 2.714zm0 13.036h.008v.008H12v-.008z" />
    </svg>
);

interface ContractItem {
    id: number;
    hec_contract_id?: number;
    code: string;
    hec_no?: string;
    name: string;
    hec_desc?: string;
    hec_description?: string;
    company_name?: string;
    contract_date?: string;
    hec_date?: string;
    hec_examdate?: string;
    hec_def_roomid?: number;
    total_employees?: number;
}

interface RoomItem {
    id: number;
    hrl_id?: number;
    name: string;
    hrl_name?: string;
    hrl_roomname?: string;
    dept_id: string;
    hrl_deptid?: string;
    dept_name?: string;
    sd_name?: string;
    active?: string;
}

export const ContractBatchUpdateTab: React.FC = () => {
    const { user } = useSession();
    const isAdmin = user?.role === 'admin' || user?.username === 'admin';

    // Data States
    const [contracts, setContracts] = useState<ContractItem[]>([]);
    const [rooms, setRooms] = useState<RoomItem[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Selected Contract
    const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);

    // Options Toggles & Values
    const [enableDate, setEnableDate] = useState(false);
    const [examDate, setExamDate] = useState('');
    const [examTime, setExamTime] = useState('08:00');

    const [enableRoom, setEnableRoom] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);

    const [enableAddress, setEnableAddress] = useState(false);
    const [addressText, setAddressText] = useState('');

    // Filter & Scope Settings
    const [updateMode, setUpdateMode] = useState<'ALL' | 'ONLY_MISSING'>('ALL');
    const [docNosFilter, setDocNosFilter] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [skipDoc, setSkipDoc] = useState(false);
    const [skipExam, setSkipExam] = useState(false);
    const [skipXml, setSkipXml] = useState(false);

    // Execution States
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // 1. Tải danh sách Hợp đồng & Phòng khám khi mount
    useEffect(() => {
        if (!isAdmin) return;

        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const [contractsData, roomsData] = await Promise.all([
                    healthCheckService.getContracts(),
                    healthCheckService.getReceptionRooms()
                ]);

                // Chuẩn hóa danh sách hợp đồng
                const normalizedContracts: ContractItem[] = (contractsData || []).map((c: any) => ({
                    id: c.hec_contract_id || c.id,
                    code: c.hec_no || c.code || `#${c.hec_contract_id || c.id}`,
                    name: c.hec_desc || c.hec_description || c.name || '(Chưa đặt tên gói)',
                    company_name: c.company_name || c.hec_desc || '',
                    contract_date: c.hec_date || c.contract_date || '',
                    hec_examdate: c.hec_examdate || '',
                    hec_def_roomid: c.hec_def_roomid || 0,
                    total_employees: c.total_employees || c.total_emp || 0
                }));
                setContracts(normalizedContracts);

                // Chuẩn hóa danh sách phòng khám
                const normalizedRooms: RoomItem[] = (roomsData || []).map((r: any) => ({
                    id: r.hrl_id || r.id,
                    name: r.hrl_name || r.hrl_roomname || r.name || `Phòng ${r.hrl_id || r.id}`,
                    dept_id: r.hrl_deptid || r.dept_id || 'KB',
                    dept_name: r.sd_name || r.dept_name || '',
                    active: r.hrl_active || 'Y'
                }));
                setRooms(normalizedRooms);
            } catch (err: any) {
                console.error('Lỗi tải danh mục cho công cụ sửa gói KSK:', err);
                toast.error('Không thể tải danh sách hợp đồng hoặc phòng khám!');
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, [isAdmin]);

    // 2. Cột hiển thị Combobox cho Hợp đồng KSK
    const contractColumns: ComboboxColumn<ContractItem>[] = useMemo(() => [
        {
            key: 'code',
            label: 'Mã HĐ',
            width: '120px',
            render: (c) => <span className="font-semibold text-teal-700 dark:text-teal-400">{c.code}</span>
        },
        {
            key: 'name',
            label: 'Tên gói / Đoàn KSK',
            render: (c) => (
                <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{c.name}</div>
                    {c.company_name && c.company_name !== c.name && (
                        <div className="text-xs text-slate-400">{c.company_name}</div>
                    )}
                </div>
            )
        },
        {
            key: 'total_employees',
            label: 'Số NV',
            width: '80px',
            render: (c) => <span className="text-center font-bold text-slate-600 dark:text-slate-300">{c.total_employees || '-'}</span>
        }
    ], []);

    // 3. Cột hiển thị Combobox cho Phòng khám
    const roomColumns: ComboboxColumn<RoomItem>[] = useMemo(() => [
        {
            key: 'id',
            label: 'Mã phòng',
            width: '90px',
            render: (r) => <span className="font-bold text-amber-600 dark:text-amber-400">P.{r.id}</span>
        },
        {
            key: 'name',
            label: 'Tên phòng khám',
            render: (r) => <span className="font-medium text-slate-800 dark:text-slate-200">{r.name}</span>
        },
        {
            key: 'dept_id',
            label: 'Khoa',
            width: '100px',
            render: (r) => (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {r.dept_id}
                </span>
            )
        }
    ], []);

    // 4. Xử lý Chạy Mô Phỏng (Dry-Run) hoặc Lưu Thật
    const handleRunBatchUpdate = async (isDryRun: boolean) => {
        if (!selectedContract) {
            toast.warning('Vui lòng chọn Gói khám / Hợp đồng KSK cần hiệu chỉnh!');
            return;
        }

        if (!enableDate && !enableRoom && !enableAddress) {
            toast.warning('Vui lòng chọn ít nhất một thông tin cần cập nhật (Ngày khám, Phòng khám hoặc Địa chỉ)!');
            return;
        }

        if (enableDate && !examDate) {
            toast.warning('Vui lòng nhập ngày khám mới!');
            return;
        }

        if (enableRoom && !selectedRoom) {
            toast.warning('Vui lòng chọn phòng khám mới!');
            return;
        }

        if (enableAddress && !addressText.trim()) {
            toast.warning('Vui lòng nhập địa chỉ mới!');
            return;
        }

        // Tạo chuỗi ngày giờ nếu có
        let formattedExamDate: string | undefined;
        if (enableDate && examDate) {
            formattedExamDate = examTime ? `${examDate} ${examTime}:00` : examDate;
        }

        // Tạo danh sách docNos
        const docNosList = docNosFilter.trim()
            ? docNosFilter.split(',').map(s => s.trim()).filter(Boolean)
            : undefined;

        setIsExecuting(true);
        try {
            const payload = {
                examDate: formattedExamDate,
                roomId: enableRoom && selectedRoom ? selectedRoom.id : undefined,
                deptId: enableRoom && selectedRoom ? selectedRoom.dept_id : undefined,
                roomName: enableRoom && selectedRoom ? selectedRoom.name : undefined,
                address: enableAddress && addressText.trim() ? addressText.trim() : undefined,
                dryRun: isDryRun,
                all: updateMode === 'ALL',
                onlyMissing: updateMode === 'ONLY_MISSING',
                docNos: docNosList,
                skipDoc,
                skipExam,
                skipXml
            };

            const res = await healthCheckService.batchUpdateContract(selectedContract.id, payload);
            setExecutionResult(res);

            if (res.success) {
                if (isDryRun) {
                    toast.info(`Mô phỏng thành công! Phát hiện ${res.counts.totalEmployees} nhân viên sẽ bị tác động.`);
                } else {
                    toast.success(res.message || 'Đã cập nhật dữ liệu thành công!');
                    setConfirmModalOpen(false);
                }
            } else {
                toast.error(res.message || 'Hiệu chỉnh gói khám thất bại!');
            }
        } catch (err: any) {
            console.error('Lỗi khi thực hiện hiệu chỉnh gói khám:', err);
            toast.error(err.response?.data?.message || err.message || 'Lỗi khi gọi API hiệu chỉnh gói khám!');
        } finally {
            setIsExecuting(false);
        }
    };

    // ── Quyền truy cập ────────────────────────────────────────────────────────
    if (!isAdmin) {
        return (
            <div className="p-8 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <ShieldExclamationIcon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-rose-800 dark:text-rose-300 mb-2">
                    Quyền Truy Cập Bị Giới Hạn
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Công cụ hiệu chỉnh dữ liệu hàng loạt gói khám sức khỏe chỉ dành riêng cho tài khoản Quản trị viên (Admin). Vui lòng đăng nhập bằng quyền Admin để sử dụng.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header giới thiệu */}
            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-teal-600 text-white shrink-0 mt-0.5">
                    <AdjustmentsHorizontalIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-teal-900 dark:text-teal-200">
                        Công Cụ Hiệu Chỉnh Hàng Loạt Gói Khám (Admin Toolkit)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Hỗ trợ quản trị viên cập nhật đồng bộ Ngày khám, Buồng/Phòng khám và Địa chỉ theo gói KSK trên toàn hệ thống HIS Core, phiếu tiếp nhận, phiên khám bác sĩ và dữ liệu XML cổng liên thông. Tích hợp chế độ Mô phỏng (Dry-Run) an toàn tuyệt đối.
                    </p>
                </div>
            </div>

            {/* Khối 1: Chọn Hợp Đồng / Gói Khám */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs flex items-center justify-center font-bold">1</span>
                        Chọn Gói Khám / Hợp Đồng KSK
                    </h4>
                    {selectedContract && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                            Mã HĐ #{selectedContract.id}
                        </span>
                    )}
                </div>

                <div className="max-w-2xl">
                    <Combobox
                        label="Tìm kiếm Gói khám / Hợp đồng"
                        placeholder="Nhập mã HĐ, tên công ty hoặc mô tả gói khám..."
                        value={selectedContract ? `${selectedContract.code} - ${selectedContract.name}` : ''}
                        options={contracts}
                        columns={contractColumns}
                        displayValue={(c) => `${c.code} - ${c.name}`}
                        filterFunction={(c, query) => {
                            const q = query.toLowerCase();
                            return (
                                c.code.toLowerCase().includes(q) ||
                                c.name.toLowerCase().includes(q) ||
                                (c.company_name && c.company_name.toLowerCase().includes(q))
                            );
                        }}
                        onChange={(_val, item) => {
                            setSelectedContract(item || null);
                            setExecutionResult(null);
                        }}
                        isLoading={isLoadingData}
                        required
                    />
                </div>

                {/* Badge thông tin hiện tại của hợp đồng */}
                {selectedContract && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg text-xs border border-slate-200/70 dark:border-slate-700/70">
                        <div>
                            <span className="text-slate-400 block mb-0.5">Số lượng nhân viên:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                {selectedContract.total_employees || 'Đang cập nhật'} nhân viên
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block mb-0.5">Ngày khám hiện tại:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {selectedContract.hec_examdate
                                    ? new Date(selectedContract.hec_examdate).toLocaleDateString('vi-VN')
                                    : '(Chưa đặt ngày khám)'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block mb-0.5">Phòng khám mặc định:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {selectedContract.hec_def_roomid
                                    ? `Phòng #${selectedContract.hec_def_roomid}`
                                    : '(Chưa chỉ định phòng)'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Khối 2: Tùy Chọn Cập Nhật (Ngày khám, Phòng khám, Địa chỉ) */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs flex items-center justify-center font-bold">2</span>
                        Thông Tin Cần Hiệu Chỉnh
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                        Tích chọn vào các trường muốn thay đổi (có thể chạy độc lập từng mục hoặc kết hợp cả 3).
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Mục 1: Ngày khám */}
                    <div className={`p-4 rounded-xl border transition-all ${
                        enableDate 
                            ? 'border-teal-400 bg-teal-50/20 dark:bg-teal-950/10 dark:border-teal-600' 
                            : 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/20 opacity-80'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-800 dark:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={enableDate}
                                    onChange={(e) => setEnableDate(e.target.checked)}
                                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                />
                                <CalendarIcon className="w-4 h-4 text-teal-600" />
                                1. Đổi Ngày Khám
                            </label>
                            {enableDate && (
                                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/50 px-2 py-0.5 rounded">
                                    Bật
                                </span>
                            )}
                        </div>

                        {enableDate ? (
                            <div className="space-y-3 mt-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                                        Ngày khám mới:
                                    </label>
                                    <input
                                        type="date"
                                        value={examDate}
                                        onChange={(e) => setExamDate(e.target.value)}
                                        className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                                        Giờ tiếp nhận / khám:
                                    </label>
                                    <input
                                        type="time"
                                        value={examTime}
                                        onChange={(e) => setExamTime(e.target.value)}
                                        className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div className="flex gap-1.5 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            setExamDate(today);
                                        }}
                                        className="text-[11px] px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                                    >
                                        Hôm nay
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const tomorrow = new Date();
                                            tomorrow.setDate(tomorrow.getDate() + 1);
                                            setExamDate(tomorrow.toISOString().split('T')[0]);
                                        }}
                                        className="text-[11px] px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 text-slate-700 dark:text-slate-300"
                                    >
                                        Ngày mai
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 mt-2">
                                Giữ nguyên ngày khám hiện tại của hợp đồng và nhân viên.
                            </p>
                        )}
                    </div>

                    {/* Mục 2: Buồng / Phòng khám */}
                    <div className={`p-4 rounded-xl border transition-all ${
                        enableRoom 
                            ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10 dark:border-amber-600' 
                            : 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/20 opacity-80'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-800 dark:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={enableRoom}
                                    onChange={(e) => setEnableRoom(e.target.checked)}
                                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                />
                                <BuildingOfficeIcon className="w-4 h-4 text-amber-600" />
                                2. Đổi Phòng Khám
                            </label>
                            {enableRoom && (
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded">
                                    Bật
                                </span>
                            )}
                        </div>

                        {enableRoom ? (
                            <div className="space-y-3 mt-3">
                                <Combobox
                                    label="Chọn phòng khám mới"
                                    placeholder="Tìm theo tên phòng hoặc mã ID..."
                                    value={selectedRoom ? `P.${selectedRoom.id} - ${selectedRoom.name}` : ''}
                                    options={rooms}
                                    columns={roomColumns}
                                    displayValue={(r) => `P.${r.id} - ${r.name}`}
                                    filterFunction={(r, query) => {
                                        const q = query.toLowerCase();
                                        return (
                                            String(r.id).includes(q) ||
                                            r.name.toLowerCase().includes(q) ||
                                            r.dept_id.toLowerCase().includes(q)
                                        );
                                    }}
                                    onChange={(_val, item) => setSelectedRoom(item || null)}
                                    isLoading={isLoadingData}
                                />
                                {selectedRoom && (
                                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200/60 dark:border-amber-800/60 text-xs">
                                        <div className="font-bold text-amber-900 dark:text-amber-300">
                                            Phòng #{selectedRoom.id}: {selectedRoom.name}
                                        </div>
                                        <div className="text-amber-700 dark:text-amber-400 text-[11px] mt-0.5">
                                            Khoa: {selectedRoom.dept_id} ({selectedRoom.dept_name || 'N/A'})
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 mt-2">
                                Giữ nguyên cấu hình phòng khám hiện tại.
                            </p>
                        )}
                    </div>

                    {/* Mục 3: Địa chỉ cư trú */}
                    <div className={`p-4 rounded-xl border transition-all ${
                        enableAddress 
                            ? 'border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 dark:border-indigo-600' 
                            : 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/20 opacity-80'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-800 dark:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={enableAddress}
                                    onChange={(e) => setEnableAddress(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <SearchIcon className="w-4 h-4 text-indigo-600" />
                                3. Đổi Địa Chỉ Đoàn
                            </label>
                            {enableAddress && (
                                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded">
                                    Bật
                                </span>
                            )}
                        </div>

                        {enableAddress ? (
                            <div className="space-y-3 mt-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                                        Địa chỉ chi tiết / Tên công ty:
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={addressText}
                                        onChange={(e) => setAddressText(e.target.value)}
                                        placeholder="Ví dụ: Thị trấn Nho Quan, Ninh Bình hoặc Xã Yên Mô..."
                                        className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                        💡 Hệ thống tự động nhận diện Mã Tỉnh & Mã Xã BHYT từ văn bản.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 mt-2">
                                Giữ nguyên địa chỉ hiện có của từng nhân viên.
                            </p>
                        )}
                    </div>
                </div>

                {/* Chế độ cập nhật & Tùy chọn nâng cao */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6 text-sm">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                                Phạm vi cập nhật:
                            </span>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                                <input
                                    type="radio"
                                    name="updateMode"
                                    checked={updateMode === 'ALL'}
                                    onChange={() => setUpdateMode('ALL')}
                                    className="text-teal-600 focus:ring-teal-500"
                                />
                                Toàn bộ nhân viên trong gói
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                                <input
                                    type="radio"
                                    name="updateMode"
                                    checked={updateMode === 'ONLY_MISSING'}
                                    onChange={() => setUpdateMode('ONLY_MISSING')}
                                    className="text-teal-600 focus:ring-teal-500"
                                />
                                Chỉ hồ sơ còn trống thông tin (Only Missing)
                            </label>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                            <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
                            {showAdvanced ? 'Ẩn tùy chọn nâng cao' : 'Hiện tùy chọn nâng cao'}
                        </button>
                    </div>

                    {showAdvanced && (
                        <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Lọc theo danh sách số hồ sơ cụ thể (docNos, phân cách bằng dấu phẩy):
                                </label>
                                <input
                                    type="text"
                                    value={docNosFilter}
                                    onChange={(e) => setDocNosFilter(e.target.value)}
                                    placeholder="Ví dụ: 26292454, 26292455, 26292456"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-wrap gap-4 pt-1">
                                <span className="font-semibold text-slate-600 dark:text-slate-400">Bỏ qua cập nhật:</span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={skipDoc}
                                        onChange={(e) => setSkipDoc(e.target.checked)}
                                        className="rounded text-teal-600"
                                    />
                                    Bỏ qua Tiếp nhận (hms_doc)
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={skipExam}
                                        onChange={(e) => setSkipExam(e.target.checked)}
                                        className="rounded text-teal-600"
                                    />
                                    Bỏ qua Phiên khám (hms_exam)
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={skipXml}
                                        onChange={(e) => setSkipXml(e.target.checked)}
                                        className="rounded text-teal-600"
                                    />
                                    Bỏ qua thẻ XML (health_check_masters)
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Các nút hành động */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                        type="button"
                        disabled={isExecuting || !selectedContract}
                        onClick={() => handleRunBatchUpdate(true)}
                        className="px-4 py-2.5 rounded-lg border-2 border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                        {isExecuting ? (
                            <RefreshIcon className="w-4 h-4 animate-spin text-teal-600" />
                        ) : (
                            <PlayIcon className="w-4 h-4" />
                        )}
                        🔍 Xem Trước & Mô Phỏng (Dry-Run)
                    </button>

                    <button
                        type="button"
                        disabled={isExecuting || !selectedContract}
                        onClick={() => setConfirmModalOpen(true)}
                        className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md"
                    >
                        <CheckIcon className="w-4 h-4" />
                        ⚡ Áp Dụng Thay Đổi Thật (Lưu DB)
                    </button>
                </div>
            </div>

            {/* Khối 3: Kết Quả & Bảng Xem Trước (Preview) */}
            {executionResult && (
                <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Kết Quả Thực Thi
                            </h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                executionResult.dryRun
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300/50'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/50'
                            }`}>
                                {executionResult.dryRun ? '⚠️ MÔ PHỎNG (DRY-RUN) - CHƯA LƯU DB' : '✅ ĐÃ LƯU DATABASE THÀNH CÔNG'}
                            </span>
                        </div>
                        <span className="text-xs text-slate-400">
                            Hợp đồng: #{executionResult.contractInfo?.id} ({executionResult.contractInfo?.code})
                        </span>
                    </div>

                    {/* Thẻ đếm số lượng tác động */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                            <span className="text-slate-400 block mb-1">Tổng NV tìm thấy:</span>
                            <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                                {executionResult.counts?.totalEmployees || 0}
                            </span>
                        </div>
                        <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-lg border border-teal-200/60 dark:border-teal-800/60">
                            <span className="text-teal-600 dark:text-teal-400 block mb-1">NV được đổi:</span>
                            <span className="text-base font-bold text-teal-800 dark:text-teal-200">
                                {executionResult.counts?.updatedEmployees || 0}
                            </span>
                        </div>
                        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                            <span className="text-amber-600 dark:text-amber-400 block mb-1">Phiếu tiếp nhận (Doc):</span>
                            <span className="text-base font-bold text-amber-800 dark:text-amber-200">
                                {executionResult.counts?.updatedDocs || 0}
                            </span>
                        </div>
                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                            <span className="text-indigo-600 dark:text-indigo-400 block mb-1">Buồng khám (Exam):</span>
                            <span className="text-base font-bold text-indigo-800 dark:text-indigo-200">
                                {executionResult.counts?.updatedExams || 0}
                            </span>
                        </div>
                        <div className="p-3 bg-sky-50/50 dark:bg-sky-950/20 rounded-lg border border-sky-200/60 dark:border-sky-800/60">
                            <span className="text-sky-600 dark:text-sky-400 block mb-1">Hồ sơ XML cổng:</span>
                            <span className="text-base font-bold text-sky-800 dark:text-sky-200">
                                {executionResult.counts?.updatedMasters || 0}
                            </span>
                        </div>
                    </div>

                    {/* Địa chỉ nhận diện */}
                    {executionResult.addressInfo && (
                        <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800/50 text-xs">
                            <div className="font-bold text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                                <span>🎯 Nhận diện danh mục hành chính thành công:</span>
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
                                <div>• Tỉnh/Thành phố: <strong>{executionResult.addressInfo.provName || 'N/A'}</strong> (Mã BHYT: {executionResult.addressInfo.provBh || 'N/A'})</div>
                                <div>• Xã/Phường/TT: <strong>{executionResult.addressInfo.villName || 'N/A'}</strong> (Mã BHYT: {executionResult.addressInfo.villBh || 'N/A'})</div>
                                <div>• Chuỗi địa chỉ hoàn chỉnh: <em>{executionResult.addressInfo.fullAddress}</em></div>
                            </div>
                        </div>
                    )}

                    {/* Bảng xem trước danh sách nhân viên */}
                    {executionResult.previewRows && executionResult.previewRows.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <span>Xem trước các hồ sơ mẫu ({Math.min(15, executionResult.previewRows.length)} hồ sơ đầu tiên):</span>
                                <span className="text-[11px] text-slate-400">Được trích xuất từ CSDL HIS</span>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="p-2.5">ID</th>
                                            <th className="p-2.5">Họ và tên</th>
                                            <th className="p-2.5">Số HS (DocNo)</th>
                                            <th className="p-2.5">Ngày khám (Cũ ➔ Mới)</th>
                                            <th className="p-2.5">Phòng khám (Cũ ➔ Mới)</th>
                                            <th className="p-2.5">Địa chỉ (Cũ ➔ Mới)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {executionResult.previewRows.map((row: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="p-2.5 font-mono text-slate-500">{row.empId}</td>
                                                <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">{row.name}</td>
                                                <td className="p-2.5 font-mono text-teal-600 dark:text-teal-400">{row.docNo || '(Chưa tiếp nhận)'}</td>
                                                <td className="p-2.5">
                                                    <span className="text-slate-400 line-through mr-1">{row.oldDate || 'Trống'}</span>
                                                    ➔ <span className="font-bold text-teal-700 dark:text-teal-300">{row.newDate || 'Giữ nguyên'}</span>
                                                </td>
                                                <td className="p-2.5">
                                                    <span className="text-slate-400 line-through mr-1">{row.oldRoomId ? `P.${row.oldRoomId}` : 'Chưa đặt'}</span>
                                                    ➔ <span className="font-bold text-amber-700 dark:text-amber-300">{row.newRoomId ? `P.${row.newRoomId}` : 'Giữ nguyên'}</span>
                                                </td>
                                                <td className="p-2.5 max-w-xs truncate" title={row.newAddress || row.oldAddress}>
                                                    <span className="text-slate-400 line-through mr-1 truncate inline-block max-w-[100px] align-bottom">{row.oldAddress || 'Trống'}</span>
                                                    ➔ <span className="font-medium text-indigo-700 dark:text-indigo-300">{row.newAddress || 'Giữ nguyên'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal xác nhận lưu DB thật */}
            {confirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
                                <ShieldExclamationIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                    Xác Nhận Lưu Vào CSDL
                                </h4>
                                <p className="text-xs text-slate-500">Hành động này sẽ ghi trực tiếp vào Database</p>
                            </div>
                        </div>

                        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                            <p>Bạn đang chuẩn bị cập nhật thông tin cho hợp đồng: <strong>#{selectedContract?.id} - {selectedContract?.name}</strong>.</p>
                            <p className="font-semibold text-amber-800 dark:text-amber-300">• Các bảng sẽ được ghi đè: Hợp đồng KSK, Nhân viên, Phiếu tiếp nhận, Bảng khám bệnh và XML liên thông.</p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                disabled={isExecuting}
                                onClick={() => setConfirmModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={isExecuting}
                                onClick={() => handleRunBatchUpdate(false)}
                                className="px-5 py-2 rounded-lg text-sm bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-2 shadow"
                            >
                                {isExecuting ? <RefreshIcon className="w-4 h-4 animate-spin text-white" /> : <CheckIcon className="w-4 h-4" />}
                                Đồng ý Lưu DB
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
