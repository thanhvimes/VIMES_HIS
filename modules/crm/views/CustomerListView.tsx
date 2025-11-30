
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCrmCustomers, CrmCustomer } from '../data';
import { SearchIcon, UserGroupIcon, FilterIcon, ChevronRightIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

const CustomerListView: React.FC = () => {
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [segmentFilter, setSegmentFilter] = useState<string>('All');

    const filteredCustomers = useMemo(() => {
        return mockCrmCustomers.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  c.phone.includes(searchTerm);
            const matchesSegment = segmentFilter === 'All' || c.segment === segmentFilter;
            return matchesSearch && matchesSegment;
        });
    }, [searchTerm, segmentFilter]);

    const getSegmentBadge = (segment: string) => {
        switch (segment) {
            case 'VIP': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">VIP</span>;
            case 'Loyal': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Thân thiết</span>;
            case 'Potential': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Tiềm năng</span>;
            case 'AtRisk': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Nguy cơ rời bỏ</span>;
            default: return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">Mới</span>;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserGroupIcon className="w-8 h-8 text-teal-600"/> Danh sách Khách hàng
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Quản lý và phân loại khách hàng theo hành vi.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên, SĐT..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 ${fontSettings.controls}`}
                        />
                    </div>
                    <div className="relative">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <select 
                            value={segmentFilter}
                            onChange={e => setSegmentFilter(e.target.value)}
                            className={`pl-9 pr-8 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 cursor-pointer ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả phân khúc</option>
                            <option value="VIP">VIP (Chi tiêu cao)</option>
                            <option value="Loyal">Thân thiết</option>
                            <option value="Potential">Tiềm năng</option>
                            <option value="AtRisk">Nguy cơ rời bỏ</option>
                            <option value="New">Khách mới</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4 text-center">Phân khúc</th>
                                <th className="p-4">Tags (Sở thích/Bệnh lý)</th>
                                <th className="p-4 text-right">Tổng chi tiêu</th>
                                <th className="p-4 text-right">Lần cuối đến</th>
                                <th className="p-4 text-center w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredCustomers.map(customer => (
                                <tr 
                                    key={customer.id} 
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                                    onClick={() => navigate(`/crm/customers/${customer.id}`)}
                                >
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{customer.name}</div>
                                        <div className="text-xs text-slate-500">{customer.phone} • {customer.gender}, {customer.age}T</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {getSegmentBadge(customer.segment)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {customer.tags.map((tag, idx) => (
                                                <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-200">
                                        {customer.lifetimeValue.toLocaleString()} đ
                                    </td>
                                    <td className="p-4 text-right text-slate-500">
                                        {new Date(customer.lastVisitDate).toLocaleDateString('vi-VN')}
                                        <div className="text-[10px] text-slate-400">
                                            {Math.floor((new Date().getTime() - new Date(customer.lastVisitDate).getTime()) / (1000 * 3600 * 24))} ngày trước
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition">
                                            <ChevronRightIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerListView;
