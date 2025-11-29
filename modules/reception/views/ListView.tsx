
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPatients } from '../data'; 
import { Patient } from '../../../types/patient';
import { SearchIcon, RefreshIcon, TrashIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { receptionService } from '../../../services/receptionService';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';

const ITEMS_PER_PAGE = 10;

const ListView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [patientToDelete, setPatientToDelete] = useState<string | null>(null);

    const navigate = useNavigate();
    const { fontSettings } = useTheme();

    const fetchPatients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await receptionService.getPatientList();
            setPatients(data);
        } catch (err) {
            console.error("Failed to fetch patients", err);
            setError("Không thể kết nối đến hệ thống. Đang hiển thị dữ liệu mẫu.");
            setPatients(mockPatients); // Fallback
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleRowClick = (patientId: string) => {
        navigate(`/reception/register/${patientId}`);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setPatientToDelete(id);
    };

    const confirmDelete = () => {
        if (patientToDelete) {
            setPatients(prev => prev.filter(p => p.id !== patientToDelete));
            setPatientToDelete(null);
        }
    };

    const filteredPatients = useMemo(() => 
        patients.filter(patient =>
            patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.recordNumber.includes(searchTerm)
        ), 
        [searchTerm, patients]
    );

    const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
    const paginatedPatients = useMemo(() => 
        filteredPatients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [filteredPatients, currentPage]
    );

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface dark:bg-dark-surface p-4 rounded-lg shadow border border-slate-200/50 dark:border-slate-700">
            <div className="flex-shrink-0 flex flex-col md:flex-row items-stretch md:items-center gap-4 p-3 mb-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <div className="relative flex-grow">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc mã hồ sơ..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className={`w-full p-1.5 pl-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md ${fontSettings.controls}`}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={fetchPatients}
                        className={`w-full sm:w-auto px-4 py-1.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark flex items-center justify-center gap-2 transition-colors ${fontSettings.controls}`}
                        disabled={isLoading}
                    >
                        <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}/>
                        {isLoading ? 'Đang tải...' : 'Nạp lại'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-amber-100 border border-amber-200 text-amber-800 rounded text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            <div className="flex-grow overflow-auto relative min-h-[200px]">
                {isLoading && !patients.length ? (
                    <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-slate-500 font-medium">Đang đồng bộ dữ liệu...</span>
                    </div>
                ) : null}

                <table className={`w-full whitespace-nowrap ${fontSettings.listSecondary}`}>
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 shadow-sm z-10">
                        <tr>
                            {['Số hồ sơ', 'Tên bệnh nhân', 'Tuổi', 'Giới', 'Địa chỉ', 'Ngày khám', 'Đối tượng', 'Hành động'].map(h =>
                                <th key={h} className={`p-3 font-semibold text-left text-slate-600 dark:text-slate-300 border-b-2 border-slate-200 dark:border-slate-700 ${h === 'Hành động' ? 'text-center' : ''}`}>{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedPatients.length > 0 ? (
                            paginatedPatients.map((patient: Patient) => (
                                <tr key={patient.id} onClick={() => handleRowClick(patient.id)} className="hover:bg-primary/5 dark:hover:bg-dark-primary/10 transition-colors duration-150 cursor-pointer group">
                                    <td className="p-3 text-primary dark:text-dark-primary font-mono font-bold">{patient.recordNumber}</td>
                                    <td className="p-3 font-semibold text-slate-800 dark:text-white">{patient.name}</td>
                                    <td className="p-3">{patient.age}</td>
                                    <td className="p-3">{patient.gender}</td>
                                    <td className="p-3 truncate max-w-xs" title={patient.address}>{patient.address || <span className="text-slate-400 italic">Chưa có</span>}</td>
                                    <td className="p-3">{patient.lastVisit}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${patient.patientType === 'Bảo hiểm' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {patient.patientType}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button 
                                            onClick={(e) => handleDeleteClick(e, patient.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Xóa bệnh nhân"
                                        >
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            !isLoading && (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center text-slate-500 dark:text-slate-400 italic">
                                        Không tìm thấy bệnh nhân nào phù hợp.
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className={`text-slate-500 dark:text-slate-400 ${fontSettings.controls}`}>
                        Trang <strong>{currentPage}</strong> trên <strong>{totalPages}</strong> (Tổng: {filteredPatients.length})
                    </span>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition ${fontSettings.controls}`}
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition ${fontSettings.controls}`}
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!patientToDelete}
                onClose={() => setPatientToDelete(null)}
                onConfirm={confirmDelete}
                title="Xóa hồ sơ bệnh nhân"
                message="Bạn có chắc chắn muốn xóa bệnh nhân này khỏi danh sách? Hành động này không thể hoàn tác."
            />
        </div>
    );
};

export default ListView;
