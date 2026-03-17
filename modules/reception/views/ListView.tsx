
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPatients } from '../data';
import { Patient } from '../../../types/patient';
import { SearchIcon, RefreshIcon, TrashIcon, MegaphoneIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { receptionService } from '../../../services/receptionService';
import { catalogService } from '../../../services/catalogService';
import { FormDateInput } from '../../../components/shared/forms';
import Combobox from '../../../components/shared/Combobox';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import { formatDate, calculateAge } from '../../../utils/formatters';
import { useSession } from '../../../contexts/SessionContext';
import { useCatalogs } from '../../../contexts/CatalogContext';
import { useNotification } from '../../../contexts/NotificationContext';

const ITEMS_PER_PAGE = 10;

const ListView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
    
    const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());
    const [roomId, setRoomId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    
    const { getRoomsByDept, getReceptionists } = useCatalogs();
    const [receptionists, setReceptionists] = useState<any[]>([]);

    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    const { userInfo, hasPermission } = useSession();
    const { addNotification } = useNotification();
    const [isCalling, setIsCalling] = useState<string | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const commonColumns = [
        { key: 'id', label: 'Mã', width: '25%' },
        { key: 'name', label: 'Tên', width: '75%' }
    ];

    const rooms = useMemo(() => getRoomsByDept(userInfo?.deptId), [getRoomsByDept, userInfo?.deptId]);

    useEffect(() => {
        const loadReceptionists = async () => {
            if (userInfo?.deptId) {
                try {
                    const data = await getReceptionists(userInfo.deptId);
                    setReceptionists(data);
                } catch (err) {
                    console.error("Failed to load receptionists", err);
                }
            }
        };
        loadReceptionists();
    }, [userInfo?.deptId, getReceptionists]);

    const fetchPatients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const filters = {
                startDate,
                endDate,
                roomId: roomId || undefined,
                userId: selectedUserId || undefined,
                patientName: searchTerm.length > 2 ? searchTerm : undefined,
                docNo: /^\d+$/.test(searchTerm) ? searchTerm : undefined
            };
            const data = await receptionService.getPatientList(filters);
            setPatients(data);
        } catch (err: any) {
            console.error("Failed to fetch patients", err);
            setError(err.message || "Không thể kết nối đến hệ thống.");
            setPatients([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleRowClick = (recordNumber: string) => {
        navigate(`/reception/register/${recordNumber}`);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setPatientToDelete(id);
    };

    const handleCallPatient = (e: React.MouseEvent, patient: Patient) => {
        e.stopPropagation();
        const msg = `Mời bệnh nhân ${patient.name} vào phục vụ.`;
        
        setIsCalling(patient.recordNumber);
        addNotification("Đang gọi số", msg, "info", undefined, true);

        // Text-to-Speech synthesis
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(msg);
            
            // Force find a Vietnamese voice
            const vnVoice = voices.find(v => v.lang.includes('vi') || v.name.toLowerCase().includes('vietnamese'));
            if (vnVoice) {
                utterance.voice = vnVoice;
                utterance.lang = vnVoice.lang;
            } else {
                utterance.lang = 'vi-VN';
            }

            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }

        setTimeout(() => setIsCalling(null), 3000);
    };

    const confirmDelete = async () => {
        if (patientToDelete) {
            try {
                await receptionService.deletePatient(patientToDelete);
                setPatients(prev => prev.filter(p => p.recordNumber !== patientToDelete));
                setPatientToDelete(null);
            } catch (err) {
                console.error("Lỗi xóa hồ sơ:", err);
                setError("Có lỗi xảy ra khi xóa hồ sơ.");
            }
        }
    };

    const filteredPatients = useMemo(() => patients, [patients]);

    const stats = useMemo(() => {
        return {
            total: patients.length,
            waiting: patients.filter(p => !p.examinationStatus || p.examinationStatus === 'waiting').length,
            processing: patients.filter(p => p.examinationStatus === 'processing').length,
            completed: patients.filter(p => p.examinationStatus === 'completed').length,
        };
    }, [patients]);

    const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
    const paginatedPatients = useMemo(() =>
        filteredPatients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [filteredPatients, currentPage]
    );

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all duration-500">
            {/* Header Summary Section */}
            <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            Danh Sách Tiếp Đón
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold animate-pulse">
                                Live
                            </span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Quản lý và theo dõi lượt tiếp đón bệnh nhân trong ngày
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Tổng số hồ sơ</span>
                            <span className="text-3xl font-black text-primary leading-none tracking-tighter tabular-nums">
                                {stats.total.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold" title="Chờ khám">W</div>
                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold" title="Đang khám">P</div>
                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-green-500 flex items-center justify-center text-[10px] text-white font-bold" title="Hoàn thành">C</div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500">
                                {stats.waiting} Chờ / {stats.processing} Khám / {stats.completed} Xong
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Filter Bar */}
            <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                    {/* Search Component */}
                    <div className="lg:col-span-3">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1">Tìm kiếm</label>
                        <div className="relative group h-11">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                autoComplete="off"
                                placeholder="Tên BN hoặc Số hồ sơ..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className={`w-full h-full pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm ${fontSettings.controls}`}
                            />
                        </div>
                    </div>
                    
                    {/* Date Selector */}
                    <div className="lg:col-span-3">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1">Khoảng thời gian</label>
                        <div className="flex items-center h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1 divide-x divide-slate-200 dark:divide-slate-700 shadow-sm overflow-hidden">
                            <FormDateInput
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                containerClassName="h-full flex-grow"
                                className={`!h-full !py-0 !bg-transparent !border-none !focus:ring-0 w-full text-center text-sm ${fontSettings.controls}`}
                            />
                            <div className="px-2 text-slate-300 flex-shrink-0">
                                <SearchIcon className="w-3 h-3 rotate-90" />
                            </div>
                            <FormDateInput
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                containerClassName="h-full flex-grow"
                                className={`!h-full !py-0 !bg-transparent !border-none !focus:ring-0 w-full text-center text-sm ${fontSettings.controls}`}
                            />
                        </div>
                    </div>

                    {/* Room Combobox */}
                    <div className="lg:col-span-2 relative z-30">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1">Phòng khám</label>
                        <div className="h-11">
                            <Combobox
                                value={roomId}
                                onChange={(val, item) => setRoomId(item?.id || val)}
                                options={rooms}
                                columns={commonColumns}
                                placeholder="Tất cả phòng"
                                className="h-full rounded-xl text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                                displayValue={item => String(item.name || '')}
                            />
                        </div>
                    </div>

                    {/* Receptionist Combobox */}
                    <div className="lg:col-span-2 relative z-30">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1">Tiếp đón</label>
                        <div className="h-11">
                            <Combobox
                                value={selectedUserId}
                                onChange={(val, item) => setSelectedUserId(item?.id || val)}
                                options={receptionists}
                                columns={commonColumns}
                                placeholder="Mọi nhân viên"
                                className="h-full rounded-xl text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                                displayValue={item => String(item.name || '')}
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="lg:col-span-2">
                        <label className="block text-[10px] font-black uppercase text-transparent mb-1.5 ml-1 select-none">Align</label>
                        <button
                            onClick={fetchPatients}
                            className={`w-full h-11 bg-primary hover:bg-primary-dark text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all group ${fontSettings.controls}`}
                            disabled={isLoading}
                        >
                            <RefreshIcon className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Đang tải...' : 'LỌC KẾT QUẢ'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-3 animate-shake">
                    <span className="text-lg">⚠️</span> {error}
                </div>
            )}

            {/* Table Section */}
            <div className="flex-grow overflow-auto p-6 pt-2 relative">
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                    <table className={`w-full whitespace-nowrap ${fontSettings.listSecondary} border-collapse`}>
                        <thead className="bg-[#fcfdfe] dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="p-4 py-5 font-black text-[10px] uppercase text-slate-400 w-12 text-center tracking-widest">STT</th>
                                {[
                                    { label: 'Số hồ sơ', width: 'w-32' },
                                    { label: 'Tên bệnh nhân', width: '' },
                                    { label: 'Tuổi/NS', width: 'w-32' },
                                    { label: 'Giới', width: 'w-20' },
                                    { label: 'Địa chỉ', width: '' },
                                    { label: 'Phòng khám', width: 'w-40' },
                                    { label: 'Tiếp đón', width: 'w-32' },
                                    { label: 'Trạng thái', width: 'w-32' },
                                    { label: 'Đối tượng', width: 'w-32' },
                                    { label: 'Hành động', width: 'w-24' }
                                ].map(h =>
                                    <th key={h.label} className={`p-4 py-5 font-black text-[10px] uppercase text-slate-400 text-left tracking-widest ${h.width} ${h.label === 'Hành động' ? 'text-center' : ''}`}>
                                        {h.label}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {paginatedPatients.length > 0 ? (
                                paginatedPatients.map((patient: Patient, index: number) => (
                                    <tr 
                                        key={patient.id} 
                                        onClick={() => handleRowClick(patient.recordNumber)} 
                                        className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors cursor-pointer group animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        <td className="p-4 text-center text-slate-400 text-[10px] font-mono">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-6 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                                                <span className="font-mono font-black text-primary dark:text-dark-primary tracking-tighter text-lg">{patient.recordNumber}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800 dark:text-slate-100 uppercase text-sm tracking-tight group-hover:text-primary transition-colors">{patient.name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold opacity-60">BN-{patient.id}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-black text-slate-700 dark:text-slate-300 text-sm">{patient.age}T</span>
                                                <span className="text-[10px] text-slate-400 tracking-tighter">({formatDate(patient.dob)})</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${patient.gender === 'Nam' || patient.gender === 'M' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-pink-50 text-pink-600 border border-pink-100'}`}>
                                                {patient.gender === 'M' || patient.gender === 'Nam' ? 'Nam' : 'Nữ'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="max-w-[200px] truncate text-[11px] font-bold text-slate-500 dark:text-slate-400 italic" title={patient.address}>
                                                {patient.address || "---"}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{patient.roomName || "---"}</span>
                                                <span className="text-[10px] text-primary font-bold">Số: {patient.receptNo || "0"}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{patient.receptionist || "---"}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${
                                                patient.examinationStatus === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                patient.examinationStatus === 'processing' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                'bg-amber-50 text-amber-700 ring-amber-600/20'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${patient.examinationStatus === 'completed' ? 'bg-green-500' : patient.examinationStatus === 'processing' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                                                {patient.examinationStatus === 'completed' ? 'Đã khám' : patient.examinationStatus === 'processing' ? 'Đang khám' : 'Chờ khám'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${patient.patientType === 'BHYT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-sky-50 text-sky-700 border-sky-100'}`}>
                                                {patient.patientType}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                                <button
                                                    onClick={(e) => handleCallPatient(e, patient)}
                                                    className={`p-2 rounded-xl transition-all shadow-sm active:scale-95 ${isCalling === patient.recordNumber ? 'bg-orange-500 text-white animate-pulse' : 'text-orange-500 hover:bg-orange-500 hover:text-white'}`}
                                                    title="Gọi bệnh nhân"
                                                >
                                                    <MegaphoneIcon className={`w-4 h-4 ${isCalling === patient.recordNumber ? 'animate-bounce' : ''}`} />
                                                </button>
                                                {hasPermission('01.02') && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/reception/register/${patient.recordNumber}`); }}
                                                        className="p-2 text-primary hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="Sửa"
                                                    >
                                                        <RefreshIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {hasPermission('01.03') && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(e, patient.recordNumber)} }
                                                        className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="Xóa"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                !isLoading && (
                                    <tr>
                                        <td colSpan={9} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-4xl">
                                                    🔍
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 font-bold italic">
                                                    Không tìm thấy hồ sơ nào phù hợp với bộ lọc hiện tại.
                                                </p>
                                                <button onClick={() => {setSearchTerm(''); fetchPatients();}} className="text-primary text-xs font-black uppercase tracking-widest border-b-2 border-primary/20 hover:border-primary transition-all">Xóa bộ lọc</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Tidied up) */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 px-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            Trang {currentPage} / {totalPages} (Tổng {filteredPatients.length} hồ sơ)
                        </p>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                            >
                                Trước
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                            >
                                Tiếp
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!patientToDelete}
                onClose={() => setPatientToDelete(null)}
                onConfirm={confirmDelete}
                title="Xác nhận xóa hồ sơ"
                message="Dữ liệu hồ sơ bệnh nhân sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?"
            />
        </div>
    );
};

export default ListView;
