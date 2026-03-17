
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ReportDefinition, FilterValues } from '../../reports/types';
import { 
    SearchIcon, 
    CogIcon, 
    ChevronUpIcon, 
    ChevronDownIcon, 
    FilterIcon,
    DocumentArrowDownIcon,
    DocumentTextIcon
} from '../../../components/Icons';
import { apiClient } from '../../../services/apiClient';
import { FormDateInput } from '../../../components/shared/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- 1. PHẦN BỘ LỌC (Filter) ---
const Filter: React.FC<{ onRun: (v: FilterValues) => void }> = ({ onRun }) => {
    const [filters, setFilters] = useState({
        year: new Date().getFullYear(),
        period: `Tháng ${new Date().getMonth() + 1}`,
        fromDate: new Date().toISOString().slice(0, 10),
        toDate: new Date().toISOString().slice(0, 10),
        receptionistId: '',
        roomId: '',
        patientType: 'all' // all, insurance, service
    });

    const [receptionists, setReceptionists] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const [recepData, roomData] = await Promise.all([
                    apiClient.get<any[]>('/reception/catalogs/receptionists'),
                    apiClient.get<any[]>('/reception/catalogs/rooms')
                ]);
                setReceptionists(recepData || []);
                setRooms(roomData || []);
            } catch (err) {
                console.warn('Could not load report catalogs', err);
            }
        };
        fetchCatalogs();
    }, []);

    const handleChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3 uppercase border-b border-blue-100 pb-1">
                Điều kiện báo cáo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Năm</label>
                    <input 
                        type="number" 
                        value={filters.year}
                        onChange={e => handleChange('year', e.target.value)}
                        className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Kỳ báo cáo</label>
                    <select 
                        className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                        value={filters.period}
                        onChange={e => handleChange('period', e.target.value)}
                    >
                        {Array.from({length: 12}).map((_, i) => (
                            <option key={i} value={`Tháng ${i+1}`}>Tháng {i+1}</option>
                        ))}
                        <option value="Quý I">Quý I</option>
                        <option value="Quý II">Quý II</option>
                        <option value="Quý III">Quý III</option>
                        <option value="Quý IV">Quý IV</option>
                    </select>
                </div>
                <FormDateInput
                    label="Từ ngày"
                    name="fromDate"
                    value={filters.fromDate}
                    onChange={(e: any) => handleChange('fromDate', e.target.value)}
                    labelClassName="block text-xs font-bold text-slate-500 mb-1"
                />
                <FormDateInput
                    label="Đến ngày"
                    name="toDate"
                    value={filters.toDate}
                    onChange={(e: any) => handleChange('toDate', e.target.value)}
                    labelClassName="block text-xs font-bold text-slate-500 mb-1"
                />
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Người tiếp đón</label>
                    <select 
                        className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600 font-bold"
                        value={filters.receptionistId}
                        onChange={e => handleChange('receptionistId', e.target.value)}
                    >
                        <option value="">-- Tất cả nhân viên --</option>
                        {receptionists.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Phòng khám</label>
                    <select 
                        className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600 font-bold"
                        value={filters.roomId}
                        onChange={e => handleChange('roomId', e.target.value)}
                    >
                        <option value="">-- Tất cả phòng khám --</option>
                        {rooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>

                <div className="lg:col-span-2 flex items-end gap-4">
                    <div className="flex gap-4">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="type" checked={filters.patientType === 'insurance'} onChange={() => handleChange('patientType', 'insurance')} />
                            <span className="text-sm">Bảo hiểm</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="type" checked={filters.patientType === 'service'} onChange={() => handleChange('patientType', 'service')} />
                            <span className="text-sm">Dịch vụ</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="type" checked={filters.patientType === 'all'} onChange={() => handleChange('patientType', 'all')} />
                            <span className="text-sm font-bold">Toàn viên</span>
                         </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-3">
                <button 
                    onClick={() => onRun(filters)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow flex items-center gap-2 transition-transform active:scale-95"
                >
                    <SearchIcon className="w-4 h-4"/> Xem Báo cáo
                </button>
            </div>
        </div>
    );
};

// --- ĐỊNH NGHĨA CỘT ---
const AVAILABLE_COLUMNS = [
    { key: 'stt', label: 'STT', width: 'w-10', align: 'center' },
    { key: 'SoHs', label: 'Số hồ sơ', width: 'w-24', align: 'left' },
    { key: 'SoPk', label: 'Số phiếu khám', width: 'w-24', align: 'left' },
    { key: 'examdate', label: 'Ngày khám', width: 'w-32', align: 'center' },
    { key: 'HovaTen', label: 'Họ và tên', width: 'flex-1', align: 'left', minWidth: '180px' },
    { key: 'Tuoi', label: 'Tuổi', width: 'w-12', align: 'center' },
    { key: 'Gioi', label: 'Giới', width: 'w-16', align: 'center' },
    { key: 'NgheNghiep', label: 'Nghề nghiệp', width: 'w-32', align: 'left' },
    { key: 'telephone', label: 'Số điện thoại', width: 'w-28', align: 'left' },
    { key: 'SoTheBHYT', label: 'Số thẻ BHYT', width: 'w-36', align: 'left' },
    { key: 'DiaChi', label: 'Địa chỉ', width: 'w-48', align: 'left', minWidth: '200px' },
    { key: 'doctor', label: 'Tên bác sĩ', width: 'w-40', align: 'left' },
    { key: 'kieukham', label: 'Kiểu khám', width: 'w-36', align: 'left' },
    { key: 'giatien', label: 'Giá tiền', width: 'w-24', align: 'right' },
    { key: 'status', label: 'Trạng thái', width: 'w-20', align: 'center' },
    { key: 'deptid', label: 'Mã khoa', width: 'w-20', align: 'center' },
    { key: 'KTKham', label: 'Ngày kết thúc', width: 'w-32', align: 'center' },
    { key: 'enddate', label: 'Ngày kết thúc hồ sơ', width: 'w-32', align: 'center' },
    { key: 'receptionist', label: 'Người tiếp đón', width: 'w-40', align: 'left' },
];

const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.startsWith('1752')) return ''; // HMS NULL date
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const pad = (n: number) => n.toString().padStart(2, '0');
        const day = pad(d.getDate());
        const month = pad(d.getMonth() + 1);
        const year = d.getFullYear();
        const hour = pad(d.getHours());
        const minute = pad(d.getMinutes());
        const second = pad(d.getSeconds());
        return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    } catch {
        return dateStr;
    }
};

const formatCurrency = (val: any) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num.toLocaleString('vi-VN');
};

// --- 2. PHẦN HIỂN THỊ (View) ---
const Content: React.FC<{ filters: FilterValues | null }> = ({ filters }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [localSearch, setLocalSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(AVAILABLE_COLUMNS.map(c => c.key));
    const [isColMenuOpen, setIsColMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (filters) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const result = await apiClient.get<any[]>('/reception/reports/patient-exam-list', filters);
                    setData(result || []);
                } catch (err) {
                    console.error('Fetch report data failed', err);
                    setData([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [filters]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsColMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const processedData = useMemo(() => {
        let result = [...data];
        if (localSearch) {
            const lowerTerm = localSearch.toLowerCase();
            result = result.filter(item => 
                Object.values(item).some(val => String(val).toLowerCase().includes(lowerTerm))
            );
        }
        if (sortConfig) {
            result.sort((a, b) => {
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result.map((item, idx) => ({ ...item, stt: idx + 1 }));
    }, [data, localSearch, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleExportExcel = () => {
        if (processedData.length === 0) return alert('Không có dữ liệu để xuất.');

        // 1. Prepare Data Rows
        const headerRow = AVAILABLE_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => col.label);
        
        const dataRows = processedData.map(row => 
            AVAILABLE_COLUMNS.filter(col => visibleColumns.includes(col.key))
                .map(col => {
                    let val = row[col.key];
                    if (['examdate', 'KTKham', 'enddate'].includes(col.key)) {
                        return formatDate(val);
                    }
                    if (col.key === 'giatien') {
                        return parseFloat(val || 0);
                    }
                    if (col.key === 'status') {
                        return val === 'P' ? 'Đã khám' : (val === 'T' ? 'Đang khám' : 'Đang chờ');
                    }
                    return val || '';
                })
        );

        // 2. Build WorkSheet with Titles
        const fromDateStr = filters?.fromDate ? formatDate(filters.fromDate).split(' ')[0] : '';
        const toDateStr = filters?.toDate ? formatDate(filters.toDate).split(' ')[0] : '';

        const aoaData = [
            ['BỘ Y TẾ'],
            ['BỆNH VIỆN K (CƠ SỞ 3)'],
            [''],
            ['DANH SÁCH BỆNH NHÂN TIẾP ĐÓN'],
            [`Từ ngày ${fromDateStr} Đến ngày ${toDateStr}`],
            [''],
            headerRow,
            ...dataRows
        ];

        const ws = XLSX.utils.aoa_to_sheet(aoaData);

        // 3. Define Column Widths (wch = width in characters)
        const colWidths = AVAILABLE_COLUMNS
            .filter(col => visibleColumns.includes(col.key))
            .map(col => {
                switch(col.key) {
                    case 'stt': return { wch: 6 };
                    case 'SoHs': case 'SoPk': return { wch: 18 };
                    case 'examdate': case 'KTKham': case 'enddate': return { wch: 22 };
                    case 'HovaTen': return { wch: 30 };
                    case 'Tuoi': case 'Gioi': return { wch: 8 };
                    case 'NgheNghiep': return { wch: 20 };
                    case 'telephone': return { wch: 15 };
                    case 'SoTheBHYT': return { wch: 20 };
                    case 'DiaChi': return { wch: 45 };
                    case 'doctor': case 'receptionist': return { wch: 25 };
                    case 'kieukham': return { wch: 25 };
                    case 'giatien': return { wch: 15 };
                    case 'status': return { wch: 15 };
                    case 'deptid': return { wch: 10 };
                    default: return { wch: 15 };
                }
            });
        
        ws['!cols'] = colWidths;

        // 4. Create Workbook and Save
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        
        // Export file
        XLSX.writeFile(wb, `DanhSachTiepDon_${new Date().getTime()}.xlsx`);
    };

    if (loading) return (
        <div className="p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-slate-500 font-medium">Đang truy vấn dữ liệu báo cáo...</p>
        </div>
    );

    if (!filters) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <SearchIcon className="w-16 h-16 mb-4 opacity-20"/>
                <p>Vui lòng chọn điều kiện lọc và bấm "Xem Báo cáo"</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-900">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white uppercase text-sm md:text-base">
                        Danh sách bệnh nhân khám bệnh
                    </h3>
                    <p className="text-xs text-slate-500">Kỳ: {filters.period}/{filters.year} - Tổng số: {processedData.length} bản ghi</p>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" placeholder="Lọc nhanh..." value={localSearch}
                            onChange={e => setLocalSearch(e.target.value)}
                            className="w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsColMenuOpen(!isColMenuOpen)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm"
                        >
                            <CogIcon className="w-5 h-5"/>
                        </button>
                        {isColMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30 p-2">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-2 border-b pb-1">Hiển thị cột</div>
                                <div className="space-y-1 max-h-80 overflow-y-auto mt-1">
                                    {AVAILABLE_COLUMNS.map(col => (
                                        <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 dark:hover:bg-slate-700 rounded cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={visibleColumns.includes(col.key)}
                                                onChange={() => setVisibleColumns(prev => prev.includes(col.key) ? prev.filter(k => k !== col.key) : [...prev, col.key])}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-200">{col.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleExportExcel}
                        className="px-3 py-2 bg-green-600 text-white rounded text-xs font-bold flex items-center gap-2 hover:bg-green-700 shadow active:scale-95 transition-transform"
                    >
                        <DocumentArrowDownIcon className="w-4 h-4"/> Excel
                    </button>
                    <button 
                        onClick={() => alert('Đang tạo bản in PDF...')}
                        className="px-3 py-2 bg-red-600 text-white rounded text-xs font-bold flex items-center gap-2 hover:bg-red-700 shadow active:scale-95 transition-transform"
                    >
                        <DocumentTextIcon className="w-4 h-4"/> PDF
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-0 relative">
                <table className="w-full text-sm text-left border-collapse border-spacing-0">
                    <thead className="bg-slate-100 dark:bg-slate-700 font-bold text-slate-600 dark:text-slate-300 sticky top-0 z-10 shadow-sm">
                        <tr>
                            {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                                <th 
                                    key={col.key} 
                                    className={`p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none text-${col.align || 'left'} whitespace-nowrap border-b border-slate-200 dark:border-slate-600`}
                                    onClick={() => handleSort(col.key)}
                                    style={{ minWidth: col.minWidth || 'auto' }}
                                >
                                    <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                        {col.label}
                                        <div className="flex flex-col w-3">
                                            <ChevronUpIcon className={`w-2 h-2 ${sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-slate-400'}`}/>
                                            <ChevronDownIcon className={`w-2 h-2 ${sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-slate-400'}`}/>
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                        {processedData.length > 0 ? (
                            processedData.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                                        <td 
                                            key={col.key} 
                                            className={`p-2.5 text-${col.align || 'left'} ${['SoHs', 'SoPk', 'SoTheBHYT'].includes(col.key) ? 'font-mono text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'} whitespace-nowrap border-r border-slate-50 dark:border-slate-700 last:border-0`}
                                        >
                                            {['examdate', 'KTKham', 'enddate'].includes(col.key) ? (
                                                formatDate(row[col.key])
                                            ) : col.key === 'giatien' ? (
                                                formatCurrency(row[col.key])
                                            ) : col.key === 'status' ? (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                    row.status === 'P' ? 'bg-green-100 text-green-700' : (row.status === 'T' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')
                                                }`}>
                                                    {row.status === 'P' ? 'Đã khám' : (row.status === 'T' ? 'Đang khám' : 'Đang chờ')}
                                                </span>
                                            ) : (
                                                row[col.key]
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={visibleColumns.length} className="p-20 text-center text-slate-400 italic bg-white dark:bg-slate-800">
                                    Không có dữ liệu báo cáo trong khoảng thời gian này.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 3. EXPORT ---
export const PatientExamListReport: ReportDefinition = {
    id: 'rep_recep_03',
    title: '1. Danh sách bệnh nhân khám bệnh',
    module: 'reception',
    description: 'Báo cáo chi tiết bệnh nhân đến khám bệnh, lọc theo phòng khám và người tiếp đón',
    FilterComponent: Filter,
    ContentComponent: Content
};
