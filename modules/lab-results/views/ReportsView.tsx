
import React, { useState } from 'react';
import { 
    ChartBarIcon, 
    DocumentTextIcon, 
    PrinterIcon, 
    CalendarIcon, 
    CheckCircleIcon,
    ClockIcon
} from '../../../components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock Data for Charts
const volumeData = [
    { name: 'Huyết học', value: 120 },
    { name: 'Sinh hóa', value: 250 },
    { name: 'Miễn dịch', value: 80 },
    { name: 'Nước tiểu', value: 60 },
    { name: 'Vi sinh', value: 30 },
];

const tatData = [
    { time: '8:00', tat: 45 },
    { time: '9:00', tat: 50 },
    { time: '10:00', tat: 65 },
    { time: '11:00', tat: 40 },
    { time: '13:00', tat: 35 },
    { time: '14:00', tat: 45 },
];

const ReportsView: React.FC = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'stats' | 'templates'>('stats');

    // Mock PDF Viewer for "Template"
    const renderTemplatePreview = () => (
        <div className="bg-white text-black p-8 shadow-lg max-w-3xl mx-auto font-serif text-sm">
            <div className="flex justify-between border-b-2 border-black pb-4 mb-4">
                <div>
                    <h3 className="font-bold uppercase">Bệnh viện Đa khoa VIMES HIS</h3>
                    <p>Khoa Xét nghiệm</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase">Phiếu Kết Quả Xét Nghiệm</h2>
                    <p>Mã phiếu: 231117-001</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div><span className="font-bold">Họ tên:</span> NGUYỄN VĂN AN</div>
                <div><span className="font-bold">Năm sinh:</span> 1985 (38T) - Nam</div>
                <div><span className="font-bold">Mã BN:</span> BN001234</div>
                <div><span className="font-bold">Ngày lấy mẫu:</span> 17/11/2023 08:30</div>
                <div className="col-span-2"><span className="font-bold">Chẩn đoán:</span> Kiểm tra sức khỏe tổng quát</div>
            </div>

            <table className="w-full mb-6 border-collapse border border-black">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border border-black p-2 text-left">Tên xét nghiệm</th>
                        <th className="border border-black p-2 text-center">Kết quả</th>
                        <th className="border border-black p-2 text-center">Đơn vị</th>
                        <th className="border border-black p-2 text-center">Trị số tham chiếu</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-black p-2 font-bold" colSpan={4}>HUYẾT HỌC (Sysmex XN-1000)</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2">WBC (Bạch cầu)</td>
                        <td className="border border-black p-2 text-center">7.5</td>
                        <td className="border border-black p-2 text-center">G/L</td>
                        <td className="border border-black p-2 text-center">4.0 - 10.0</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2">RBC (Hồng cầu)</td>
                        <td className="border border-black p-2 text-center">4.8</td>
                        <td className="border border-black p-2 text-center">T/L</td>
                        <td className="border border-black p-2 text-center">3.8 - 5.8</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2">HGB (Huyết sắc tố)</td>
                        <td className="border border-black p-2 text-center">145</td>
                        <td className="border border-black p-2 text-center">g/L</td>
                        <td className="border border-black p-2 text-center">120 - 160</td>
                    </tr>
                     <tr>
                        <td className="border border-black p-2 font-bold" colSpan={4}>SINH HÓA (Cobas 6000)</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-2">Glucose</td>
                        <td className="border border-black p-2 text-center">5.2</td>
                        <td className="border border-black p-2 text-center">mmol/L</td>
                        <td className="border border-black p-2 text-center">3.9 - 6.4</td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-end mt-10 text-center">
                <div>
                    <p className="italic">Hà Nội, ngày 17 tháng 11 năm 2023</p>
                    <p className="font-bold mt-1">TRƯỞNG KHOA XÉT NGHIỆM</p>
                    <div className="h-20"></div>
                    <p className="font-bold">BS. CKI. Trần Văn Lab</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Báo cáo & Thống kê</h1>
                <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'stats' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        <ChartBarIcon className="w-4 h-4 inline mr-2"/>Hiệu suất
                    </button>
                    <button 
                        onClick={() => setActiveTab('templates')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'templates' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        <DocumentTextIcon className="w-4 h-4 inline mr-2"/>Mẫu in
                    </button>
                </div>
            </div>

            {activeTab === 'stats' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Volume Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200">Số lượng xét nghiệm trong ngày</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={volumeData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{fill: '#94a3b8'}} />
                                    <YAxis tick={{fill: '#94a3b8'}} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* TAT Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200">Thời gian trả kết quả (TAT - Phút)</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={tatData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="time" tick={{fill: '#94a3b8'}} />
                                    <YAxis tick={{fill: '#94a3b8'}} />
                                    <Tooltip cursor={{stroke: '#ef4444'}} contentStyle={{borderRadius: '8px'}} />
                                    <Line type="monotone" dataKey="tat" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="lg:col-span-2 grid grid-cols-3 gap-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-200">
                                <CheckCircleIcon className="w-6 h-6"/>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Tổng mẫu hoàn thành</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">540</p>
                            </div>
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800 flex items-center gap-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-full text-orange-600 dark:text-orange-200">
                                <ClockIcon className="w-6 h-6"/>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">TAT Trung bình</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">42 phút</p>
                            </div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full text-green-600 dark:text-green-200">
                                <CalendarIcon className="w-6 h-6"/>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Đúng hẹn (On-time)</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">98.5%</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex">
                    {/* Template Sidebar */}
                    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Danh sách Mẫu in</h3>
                        <div className="space-y-2">
                            <button className="w-full text-left px-3 py-2 bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 rounded-md font-medium text-sm border border-blue-200 dark:border-slate-600">
                                Phiếu KQXN Tổng hợp (A4)
                            </button>
                            <button className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md font-medium text-sm transition">
                                Phiếu Huyết học (A5)
                            </button>
                            <button className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md font-medium text-sm transition">
                                Phiếu Vi sinh (A4)
                            </button>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                                <PrinterIcon className="w-4 h-4"/> In Mẫu thử
                            </button>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-200 dark:bg-black/20 flex justify-center">
                        {renderTemplatePreview()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
