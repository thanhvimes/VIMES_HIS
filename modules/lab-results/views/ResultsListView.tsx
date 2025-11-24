
import React, { useState, useMemo } from 'react';
import { LabResult } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
    BeakerIcon, 
    SearchIcon, 
    DocumentTextIcon, 
    PrinterIcon, 
    CheckIcon, 
    ClockIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    CalendarIcon,
    XIcon,
    ExclamationCircleIcon,
    SmsIcon
} from '../../../components/Icons';

// --- EXTENDED TYPE DEFINITIONS ---
interface TestDetail {
    name: string;
    result: string;
    unit: string;
    refRange: string;
    isAbnormal: boolean;
}

interface ExtendedLabResult extends LabResult {
    details: TestDetail[];
    phone?: string; // Added phone for SMS demo
}

// --- ENHANCED MOCK DATA ---
const mockLabResults: ExtendedLabResult[] = [
  { 
      id: 'LR001', 
      patientName: 'Lê Hoàng Cường', 
      testName: 'Công thức máu (CBC)', 
      date: '2023-10-26', 
      status: 'Completed', 
      resultUrl: '#',
      phone: '0905123456',
      details: [
          { name: 'RBC (Hồng cầu)', result: '4.50', unit: 'T/L', refRange: '3.8 - 5.3', isAbnormal: false },
          { name: 'HGB (Huyết sắc tố)', result: '135', unit: 'g/L', refRange: '120 - 160', isAbnormal: false },
          { name: 'WBC (Bạch cầu)', result: '12.5', unit: 'G/L', refRange: '4.0 - 10.0', isAbnormal: true }, // High
          { name: 'PLT (Tiểu cầu)', result: '250', unit: 'G/L', refRange: '150 - 450', isAbnormal: false },
      ]
  },
  { 
      id: 'LR002', 
      patientName: 'Nguyễn Văn An', 
      testName: 'Tổng phân tích nước tiểu', 
      date: '2023-10-27', 
      status: 'Pending',
      phone: '0912345678',
      details: [] // Pending
  },
  { 
      id: 'LR003', 
      patientName: 'Trần Thị Bích', 
      testName: 'Đường huyết & HbA1c', 
      date: '2023-10-27', 
      status: 'Completed', 
      resultUrl: '#',
      phone: '0987654321',
      details: [
          { name: 'Glucose (Đói)', result: '5.2', unit: 'mmol/L', refRange: '3.9 - 6.4', isAbnormal: false },
          { name: 'HbA1c', result: '6.8', unit: '%', refRange: '< 6.5', isAbnormal: true }, // High
      ]
  },
  { 
      id: 'LR004', 
      patientName: 'Phạm Thị Dung', 
      testName: 'Chức năng gan (AST, ALT)', 
      date: '2023-10-25', 
      status: 'Completed', 
      resultUrl: '#',
      phone: '0358987654',
      details: [
          { name: 'AST (GOT)', result: '25', unit: 'U/L', refRange: '< 35', isAbnormal: false },
          { name: 'ALT (GPT)', result: '42', unit: 'U/L', refRange: '< 35', isAbnormal: true }, // High
      ]
  },
  { 
      id: 'LR005', 
      patientName: 'Hoàng Văn Em', 
      testName: 'Miễn dịch (HBsAg)', 
      date: '2023-10-28', 
      status: 'Pending',
      phone: '0988776655',
      details: []
  },
  { 
      id: 'LR006', 
      patientName: 'Lê Hoàng Cường', 
      testName: 'Sinh hóa máu', 
      date: '2023-10-20', 
      status: 'Completed',
      phone: '0905123456',
      details: [
          { name: 'Ure', result: '4.5', unit: 'mmol/L', refRange: '2.5 - 7.5', isAbnormal: false },
          { name: 'Creatinin', result: '85', unit: 'µmol/L', refRange: '62 - 106', isAbnormal: false },
      ]
  },
];

type SortKey = 'id' | 'patientName' | 'date' | 'status';
type SortDirection = 'asc' | 'desc';

const ResultsListView: React.FC = () => {
  const { fontSettings } = useTheme();
  const [results] = useState<ExtendedLabResult[]>(mockLabResults);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });

  // Modal State
  const [selectedResult, setSelectedResult] = useState<ExtendedLabResult | null>(null);

  // --- LOGIC ---

  const handleSort = (key: SortKey) => {
      let direction: SortDirection = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const filteredAndSortedResults = useMemo(() => {
      // 1. Filter
      let filtered = results.filter(res => 
        res.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        res.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.testName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (startDate) {
          filtered = filtered.filter(res => res.date >= startDate);
      }
      if (endDate) {
          filtered = filtered.filter(res => res.date <= endDate);
      }

      // 2. Sort
      return filtered.sort((a, b) => {
          if (a[sortConfig.key] < b[sortConfig.key]) {
              return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
              return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
      });
  }, [results, searchTerm, startDate, endDate, sortConfig]);

  const handleViewDetail = (result: ExtendedLabResult) => {
      setSelectedResult(result);
  };

  const handleSendSms = (result: ExtendedLabResult) => {
      if (!result.phone) {
          alert("Không tìm thấy số điện thoại của bệnh nhân.");
          return;
      }
      if(window.confirm(`Gửi tin nhắn thông báo kết quả cho ${result.patientName} (${result.phone})?`)) {
          // Simulate API call
          setTimeout(() => {
              alert(`Đã gửi tin nhắn đến ${result.phone}.\nNội dung: "Chao ban ${result.patientName}, ket qua xet nghiem ${result.testName} cua ban da co. Vui long dang nhap cong thong tin hoac den benh vien de nhan ket qua."`);
          }, 500);
      }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
      if (sortConfig.key !== column) return <div className="w-4 h-4 opacity-0 group-hover:opacity-30"><ChevronDownIcon className="w-4 h-4"/></div>;
      return sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4 text-blue-600"/> : <ChevronDownIcon className="w-4 h-4 text-blue-600"/>;
  };

  return (
    <div className="h-full flex flex-col space-y-4">
       {/* Header & Toolbar */}
       <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Danh sách Kết quả Xét nghiệm</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý và tra cứu kết quả từ phòng Lab.</p>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                    <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Tìm bệnh nhân, mã xét nghiệm, tên chỉ định..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                    />
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <CalendarIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                            title="Từ ngày"
                        />
                    </div>
                    <span className="text-slate-400">-</span>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <CalendarIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                            title="Đến ngày"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button 
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                            title="Xóa lọc ngày"
                        >
                            <XIcon className="w-4 h-4"/>
                        </button>
                    )}
                </div>
            </div>
       </div>
      
      {/* Results Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 shadow-sm z-10">
              <tr>
                <th 
                    className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none"
                    onClick={() => handleSort('id')}
                >
                    <div className="flex items-center gap-1">Mã XN <SortIcon column="id"/></div>
                </th>
                <th 
                    className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none"
                    onClick={() => handleSort('patientName')}
                >
                    <div className="flex items-center gap-1">Bệnh nhân <SortIcon column="patientName"/></div>
                </th>
                <th className="p-4">Chỉ định</th>
                <th 
                    className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none"
                    onClick={() => handleSort('date')}
                >
                    <div className="flex items-center gap-1">Thời gian <SortIcon column="date"/></div>
                </th>
                <th 
                    className="p-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group select-none"
                    onClick={() => handleSort('status')}
                >
                    <div className="flex items-center justify-center gap-1">Trạng thái <SortIcon column="status"/></div>
                </th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredAndSortedResults.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">
                          Không tìm thấy kết quả phù hợp.
                      </td>
                  </tr>
              ) : (
                  filteredAndSortedResults.map(res => (
                    <tr key={res.id} className="hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => handleViewDetail(res)}>
                      <td className="p-4 font-mono text-blue-600 dark:text-blue-400 font-medium">{res.id}</td>
                      <td className="p-4 font-bold text-slate-800 dark:text-white">{res.patientName}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{res.testName}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                          <div className="flex items-center gap-2">
                              <ClockIcon className="w-4 h-4"/>
                              {new Date(res.date).toLocaleDateString('vi-VN')}
                          </div>
                      </td>
                      <td className="p-4 text-center">
                         {res.status === 'Completed' ? (
                             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                 <CheckIcon className="w-3 h-3"/> Hoàn thành
                             </span>
                         ) : (
                             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                 <BeakerIcon className="w-3 h-3"/> Đang thực hiện
                             </span>
                         )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {res.status === 'Completed' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleSendSms(res); }}
                                    className="p-2 bg-white border border-slate-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-slate-300 rounded shadow-sm transition"
                                    title="Gửi tin nhắn thông báo"
                                >
                                    <SmsIcon className="w-4 h-4"/>
                                </button>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleViewDetail(res); }}
                                className="p-2 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-slate-300 rounded shadow-sm transition"
                                title="Xem chi tiết"
                            >
                                <DocumentTextIcon className="w-4 h-4"/>
                            </button>
                            <button 
                                disabled={res.status !== 'Completed'} 
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-slate-300 rounded shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="In kết quả"
                            >
                                <PrinterIcon className="w-4 h-4"/>
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 flex justify-between">
            <span>Hiển thị {filteredAndSortedResults.length} kết quả</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedResult && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up max-h-[90vh]">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <div>
                          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                              <BeakerIcon className="w-5 h-5 text-blue-600"/>
                              Chi tiết Kết quả
                          </h2>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {selectedResult.testName} - {selectedResult.patientName}
                          </p>
                      </div>
                      <button onClick={() => setSelectedResult(null)} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                          <XIcon className="w-6 h-6"/>
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      {selectedResult.status === 'Pending' ? (
                          <div className="text-center py-10 text-slate-500 italic">
                              Kết quả đang được xử lý, chưa có dữ liệu chi tiết.
                          </div>
                      ) : (
                          <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs uppercase font-bold">
                                  <tr>
                                      <th className="p-3 rounded-tl-lg">Tên xét nghiệm</th>
                                      <th className="p-3 text-right">Kết quả</th>
                                      <th className="p-3">Đơn vị</th>
                                      <th className="p-3 rounded-tr-lg">CS Bình thường</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                                  {selectedResult.details.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                          <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                                              {item.name}
                                          </td>
                                          <td className="p-3 text-right">
                                              <span className={`font-bold ${item.isAbnormal ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                                                  {item.result}
                                              </span>
                                              {item.isAbnormal && (
                                                  <span className="ml-2 inline-block">
                                                      <ExclamationCircleIcon className="w-4 h-4 text-red-500 inline"/>
                                                  </span>
                                              )}
                                          </td>
                                          <td className="p-3 text-slate-500">{item.unit}</td>
                                          <td className="p-3 text-slate-500">{item.refRange}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      )}
                  </div>

                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
                      <button onClick={() => setSelectedResult(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded font-medium text-sm">Đóng</button>
                      {selectedResult.status === 'Completed' && (
                          <button 
                            onClick={() => handleSendSms(selectedResult)}
                            className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow text-sm flex items-center gap-2"
                          >
                              <SmsIcon className="w-4 h-4"/> Gửi SMS
                          </button>
                      )}
                      <button className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow text-sm flex items-center gap-2">
                          <PrinterIcon className="w-4 h-4"/> In Phiếu
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ResultsListView;
