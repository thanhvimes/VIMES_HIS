
import React, { useState } from 'react';
import { SearchIcon, LibraryIcon, TrashIcon, EyeIcon } from '../../../components/Icons';

const mockStoredRecords = [
    { id: '21024061', name: 'Nguyễn Văn An', dob: '1988', dept: 'Nội TH', storeDate: '20/10/2023', location: 'Kệ A - Tầng 2 - Hộp 15', status: 'Stored' },
    { id: '23011618', name: 'Phạm Thị Dung', dob: '2001', dept: 'Sản', storeDate: '15/10/2023', location: 'Kệ B - Tầng 1 - Hộp 03', status: 'Stored' },
    { id: '19005522', name: 'Lê Văn Cũ', dob: '1950', dept: 'Tim mạch', storeDate: '01/01/2013', location: 'Kho Hủy - Chờ xử lý', status: 'Expired' },
];

const StorageView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [records, setRecords] = useState(mockStoredRecords);

    const filtered = records.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.includes(searchTerm));

    const handleDelete = (id: string) => {
        if (window.confirm("Xác nhận tiêu hủy hồ sơ hết hạn này? Hành động sẽ được ghi log.")) {
            setRecords(records.filter(r => r.id !== id));
        }
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kho Lưu trữ & Tra cứu</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý vị trí lưu trữ, tra cứu và tiêu hủy hồ sơ.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Mã hồ sơ, Tên BN..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0">
                            <tr>
                                <th className="p-4">Mã Hồ Sơ</th>
                                <th className="p-4">Bệnh Nhân</th>
                                <th className="p-4">Năm sinh</th>
                                <th className="p-4">Khoa</th>
                                <th className="p-4">Ngày lưu</th>
                                <th className="p-4">Vị trí lưu trữ</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filtered.map(rec => (
                                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 font-mono font-bold">{rec.id}</td>
                                    <td className="p-4 font-semibold">{rec.name}</td>
                                    <td className="p-4 text-slate-500">{rec.dob}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{rec.dept}</td>
                                    <td className="p-4 text-slate-500">{rec.storeDate}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded border border-orange-100 dark:border-orange-900/30 w-fit">
                                            <LibraryIcon className="w-4 h-4"/> {rec.location}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {rec.status === 'Expired' ? (
                                            <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded">Hết hạn</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded">Đang lưu</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Xem chi tiết"><EyeIcon className="w-5 h-5"/></button>
                                            {rec.status === 'Expired' && (
                                                <button 
                                                    onClick={() => handleDelete(rec.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded" 
                                                    title="Tiêu hủy"
                                                >
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            )}
                                        </div>
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

export default StorageView;
