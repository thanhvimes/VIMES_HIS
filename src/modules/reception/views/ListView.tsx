
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPatients } from '../data'; 
import { Patient } from '../../../types/patient';
import { SearchIcon, RefreshIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { receptionService } from '../../../services/receptionService';

const ITEMS_PER_PAGE = 10;

const ListView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { fontSettings } = useTheme();

    const fetchPatients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await receptionService.getPatientList();
            setPatients(data);
        } catch (err) {
            console.error("Failed to fetch patients, using mock data instead.", err);
            setError("Không thể kết nối đến API. Đang hiển thị dữ liệu mẫu.");
            setPatients(mockPatients); 
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
                        className={`w-full sm:w-auto px-4 py-1.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark flex items-center justify-center gap-2 ${fontSettings.controls}`}
                        disabled={isLoading}
                    >
                        {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <RefreshIcon className="w-4 h-4"/>}
                        Nạp lại
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            <div className="flex-grow overflow-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-slate-500">Đang tải dữ liệu...</span>
                    </div>
                ) : (
                    <table className={`w-full whitespace-nowrap ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                            <tr>
                                {['Số hồ sơ', 'Tên bệnh nhân', 'Tuổi', 'Giới', 'Địa chỉ', 'Ngày khám', 'Đối tượng'].map(h =>
                                    <th key={h} className="p-3 font-semibold text-left text-slate-600 dark:text-slate-300 border-b-2 border-slate-200 dark:border-slate-700">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {paginatedPatients.length > 0 ? (
                                paginatedPatients.map((patient: Patient) => (
                                    <tr key={patient.id} onClick={() => handleRowClick(patient.id)} className="hover:bg-primary/5 dark:hover:bg-dark-primary/10 transition-colors duration-150 cursor-pointer">
                                        <td className="p-3 text-primary dark:text-dark-primary font-mono font-bold">{patient.recordNumber}</td>
                                        <td className="p-3 font-semibold">{patient.name}</td>
                                        <td className="p-3">{patient.age}</td>
                                        <td className="p-3">{patient.gender}</td>
                                        <td className="p-3 truncate max-w-xs" title={patient.address}>{patient.address || <span className="text-slate-400 italic">Chưa có</span>}</td>
                                        <td className="p-3">{patient.lastVisit}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${patient.patientType === 'Bảo hiểm' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {patient.patientType}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        Không tìm thấy bệnh nhân nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
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
                            className={`px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 ${fontSettings.controls}`}
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 ${fontSettings.controls}`}
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListView;
