
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPatients } from '../data';
import { Patient } from '../../../types';
import { SearchIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

const ITEMS_PER_PAGE = 10;

const ListView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const { fontSettings } = useTheme();

    const handleRowClick = (patientId: string) => {
        navigate(`/reception/register/${patientId}`);
    };

    const filteredPatients = useMemo(() => 
        mockPatients.filter(patient =>
            patient.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), 
        [searchTerm]
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
            {/* Filter Bar */}
            <div className="flex-shrink-0 flex flex-col md:flex-row items-stretch md:items-center gap-4 p-3 mb-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <div className="relative flex-grow">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên bệnh nhân..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                        }}
                        className={`w-full p-1.5 pl-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md ${fontSettings.controls}`}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center space-x-2">
                        <label className={`font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap ${fontSettings.controls}`}>Từ ngày</label>
                        <input type="date" className={`w-full sm:w-auto p-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md ${fontSettings.controls}`} defaultValue="2023-01-01" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className={`font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap ${fontSettings.controls}`}>Đến ngày</label>
                        <input type="date" className={`w-full sm:w-auto p-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md ${fontSettings.controls}`} defaultValue={new Date().toISOString().slice(0, 10)} />
                    </div>
                    <button className={`w-full sm:w-auto px-6 py-1.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark ${fontSettings.controls}`}>Nạp</button>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-grow overflow-auto">
                <table className={`w-full whitespace-nowrap ${fontSettings.listSecondary}`}>
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                        <tr>
                            {['Số hồ sơ', 'Tên bệnh nhân', 'Tuổi', 'Giới', 'Địa chỉ', 'Ngày khám gần nhất', 'Đối tượng'].map(h =>
                                <th key={h} className="p-3 font-semibold text-left text-slate-600 dark:text-slate-300 border-b-2 border-slate-200 dark:border-slate-700">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedPatients.map((patient: Patient) => (
                            <tr key={patient.id} onClick={() => handleRowClick(patient.id)} className="hover:bg-primary/5 dark:hover:bg-dark-primary/10 transition-colors duration-150 cursor-pointer">
                                <td className="p-3 text-primary dark:text-dark-primary font-mono">{patient.recordNumber}</td>
                                <td className="p-3 font-semibold">{patient.name}</td>
                                <td className="p-3">{patient.age}</td>
                                <td className="p-3">{patient.gender}</td>
                                <td className="p-3 truncate max-w-xs" title={patient.address}>{patient.address}</td>
                                <td className="p-3">{patient.lastVisit}</td>
                                <td className="p-3">{patient.patientType}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className={`text-slate-500 dark:text-slate-400 ${fontSettings.controls}`}>
                        Trang <strong>{currentPage}</strong> trên <strong>{totalPages}</strong>
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
