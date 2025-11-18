import React from 'react';

const ListView: React.FC = () => {
    // Mock data based on image
    const mockListData = [
        {soHoSo: '21024061', tenBenhNhan: 'Nguyễn Thị Ngọ', tuoi: 78, gioi: 'Nữ', diaChi: '', ngayKham: '17/11/2021 07:16', trangThai: 'T', doiTuong: 'Bảo hiểm', nguoiTa: 'dtthao'},
        {soHoSo: '21024062', tenBenhNhan: 'Nguyễn Huỳnh Th...', tuoi: 3, gioi: 'Nam', diaChi: '', ngayKham: '17/11/2021 07:08', trangThai: 'O', doiTuong: 'Dịch vụ', nguoiTa: 'dtthao'},
    ];

    const handleLoadData = () => console.log('API Call: Loading data based on filters.');

    return (
        <div className="flex flex-col h-full bg-surface dark:bg-dark-surface p-4 rounded-lg shadow border border-slate-200/50 dark:border-slate-700">
            {/* Filter Bar */}
            <div className="flex-shrink-0 flex flex-wrap items-center gap-4 p-3 mb-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                 <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Từ ngày</label>
                    <input type="date" className="p-1.5 text-sm bg-inherit border border-slate-300 dark:border-slate-600 rounded-md" defaultValue="2021-11-17"/>
                 </div>
                 <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Đến ngày</label>
                    <input type="date" className="p-1.5 text-sm bg-inherit border border-slate-300 dark:border-slate-600 rounded-md" defaultValue="2021-11-17"/>
                 </div>
                 <select className="p-1.5 text-sm bg-inherit border border-slate-300 dark:border-slate-600 rounded-md"><option>Phòng khám</option></select>
                 <input type="text" placeholder="Tên bệnh nhân" className="p-1.5 text-sm bg-inherit border border-slate-300 dark:border-slate-600 rounded-md flex-grow min-w-[200px]"/>
                 <button onClick={handleLoadData} className="px-6 py-1.5 text-sm bg-primary text-white font-semibold rounded-md hover:bg-primary-dark">Nạp</button>
            </div>

            {/* Data Table */}
            <div className="flex-grow overflow-auto">
                 <table className="w-full text-sm whitespace-nowrap">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                        <tr>
                            {['Số hồ sơ', 'Tên bệnh nhân', 'Tuổi', 'Giới', 'Địa chỉ', 'Ngày khám', 'Trạng thái', 'Đối tượng', 'Người tạo'].map(h => 
                                <th key={h} className="p-3 font-semibold text-left text-slate-600 dark:text-slate-300 border-b-2 border-slate-200 dark:border-slate-700">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {mockListData.concat(mockListData).concat(mockListData).concat(mockListData).map((row, index) => (
                            <tr key={index} className="hover:bg-primary/5 dark:hover:bg-dark-primary/10 transition-colors duration-150">
                                <td className="p-3">{row.soHoSo}</td>
                                <td className="p-3">{row.tenBenhNhan}</td>
                                <td className="p-3">{row.tuoi}</td>
                                <td className="p-3">{row.gioi}</td>
                                <td className="p-3">{row.diaChi}</td>
                                <td className="p-3">{row.ngayKham}</td>
                                <td className="p-3">{row.trangThai}</td>
                                <td className="p-3">{row.doiTuong}</td>
                                <td className="p-3">{row.nguoiTa}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
        </div>
    );
};

export default ListView;