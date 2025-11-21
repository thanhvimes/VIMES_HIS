
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon, ClockIcon, UserGroupIcon, ActivityIcon } from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';

interface HistoryRecord {
    id: string;
    date: string;
    doctor: string;
    diagnosis: string;
    specialty: string;
    status: 'completed' | 'cancelled' | 'in-progress';
}

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
}

// Mock Data Generator
const generateMockHistory = (start: number, count: number): HistoryRecord[] => {
    return Array.from({ length: count }, (_, i) => {
        const index = start + i;
        const date = new Date();
        date.setDate(date.getDate() - (index * 14)); // Every 2 weeks roughly
        return {
            id: `HIST_${index}`,
            date: date.toLocaleDateString('vi-VN'),
            doctor: index % 3 === 0 ? 'BS. Nguyễn Văn A' : (index % 3 === 1 ? 'BS. Trần Thị B' : 'BS. Lê Văn C'),
            diagnosis: index % 2 === 0 ? 'Tái khám định kỳ tiểu đường' : 'Viêm đường hô hấp trên cấp tính',
            specialty: index % 2 === 0 ? 'Nội tiết' : 'Tai Mũi Họng',
            status: 'completed'
        };
    });
};

const TOTAL_RECORDS = 50;
const PAGE_SIZE = 10;

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, patientId }) => {
    const { fontSettings } = useTheme();
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Reset when opened
    useEffect(() => {
        if (isOpen && records.length === 0) {
            loadMoreRecords();
        }
    }, [isOpen]);

    const loadMoreRecords = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        
        // Simulate API delay
        setTimeout(() => {
            const newRecords = generateMockHistory(page * PAGE_SIZE, PAGE_SIZE);
            
            if ((page + 1) * PAGE_SIZE >= TOTAL_RECORDS) {
                setHasMore(false);
            }

            setRecords(prev => [...prev, ...newRecords]);
            setPage(prev => prev + 1);
            setLoading(false);
        }, 1000);
    }, [page, loading, hasMore]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Check if scrolled to bottom (with 20px threshold)
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            loadMoreRecords();
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div 
                className={`fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-[70] flex flex-col ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-blue-600"/>
                            Lịch sử khám bệnh
                        </h2>
                        <p className="text-xs text-slate-500">BN: {patientId} - Tổng số: {TOTAL_RECORDS} lượt</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* List Container */}
                <div 
                    ref={listRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                    onScroll={handleScroll}
                >
                    {records.map((record) => (
                        <div 
                            key={record.id} 
                            className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                                    {record.date}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{record.id}</span>
                            </div>
                            
                            <div className="mb-2">
                                <h4 className={`font-semibold text-slate-800 dark:text-slate-200 ${fontSettings.listPrimary}`}>
                                    {record.diagnosis}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    <ActivityIcon className="w-4 h-4"/>
                                    <span>{record.specialty}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-600">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <UserGroupIcon className="w-3.5 h-3.5"/>
                                    {record.doctor}
                                </div>
                                <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                                    Hoàn thành
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="flex justify-center p-4">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* End of List */}
                    {!hasMore && records.length > 0 && (
                        <div className="text-center py-4 text-sm text-slate-400 dark:text-slate-500 italic">
                            Đã hiển thị toàn bộ lịch sử.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default HistorySidebar;
