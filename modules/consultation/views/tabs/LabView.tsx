
import React, { useState } from 'react';
import { 
    PlusIcon, 
    TrashIcon, 
    PrinterIcon, 
    CheckIcon,
    SearchIcon,
    PhotographIcon
} from '../../../../components/Icons';

interface LabRequest {
    id: string;
    name: string;
    requestDate: string;
    status: 'completed' | 'pending';
    doctor: string;
    performer: string;
    executionTime?: string;
    
    // Result fields
    technique?: string;
    findings?: string;
    result?: string;
    conclusion?: string;
    note?: string;
}

const mockRequests: LabRequest[] = [
    { 
        id: '702946', 
        name: 'XQuang ngực thẳng', 
        requestDate: '2025-11-18 01:02:50', 
        status: 'completed', 
        doctor: 'nccuong', 
        performer: 'ptdung',
        executionTime: '2025-11-18 01:12:00',
        technique: 'Chụp XQuang kỹ thuật số',
        findings: 'Hình ảnh tim phổi bình thường.',
        result: 'Không phát hiện bất thường',
        conclusion: 'Tim phổi bình thường',
        note: ''
    },
    { 
        id: '702947', 
        name: 'Siêu âm ổ bụng', 
        requestDate: '2025-11-18 01:05:10', 
        status: 'pending', 
        doctor: 'nccuong', 
        performer: '',
        executionTime: '',
        technique: '',
        findings: '',
        result: '',
        conclusion: '',
        note: ''
    }
];

const LabView: React.FC = () => {
    const [requests, setRequests] = useState<LabRequest[]>(mockRequests);
    const [selectedId, setSelectedId] = useState<string>(mockRequests[0].id);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const selectedRequest = requests.find(r => r.id === selectedId);

    const handleCheck = (id: string) => {
        const newChecked = new Set(checkedIds);
        if (newChecked.has(id)) newChecked.delete(id);
        else newChecked.add(id);
        setCheckedIds(newChecked);
    };

    const handleSelect = (id: string) => {
        setSelectedId(id);
    };

    const handleInputChange = (field: keyof LabRequest, value: string) => {
        if (!selectedId) return;
        setRequests(prev => prev.map(req => 
            req.id === selectedId ? { ...req, [field]: value } : req
        ));
    };

    return (
        <div className="flex h-full gap-4 items-stretch">
            {/* LEFT COLUMN: REQUEST LIST */}
            <div className="w-1/3 flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 text-white px-4 py-3 font-bold text-sm flex justify-between items-center">
                    <span>Danh sách chỉ định xét nghiệm</span>
                    <span className="bg-blue-500 px-2 py-0.5 rounded text-xs">{requests.length}</span>
                </div>
                
                {/* Table Header */}
                <div className="flex bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <div className="w-8 text-center">-</div>
                    <div className="w-20">Số phiếu</div>
                    <div className="flex-1">Tên</div>
                    <div className="w-24">Ngày YC</div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {requests.map(req => (
                        <div 
                            key={req.id}
                            onClick={() => handleSelect(req.id)}
                            className={`flex items-center p-2 text-sm border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors ${
                                selectedId === req.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <div className="w-8 flex justify-center" onClick={(e) => { e.stopPropagation(); handleCheck(req.id); }}>
                                <input 
                                    type="checkbox" 
                                    checked={checkedIds.has(req.id)} 
                                    onChange={() => {}}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </div>
                            <div className={`w-20 font-mono ${selectedId === req.id ? 'font-bold text-blue-600' : ''}`}>{req.id}</div>
                            <div className="flex-1 truncate font-medium">{req.name}</div>
                            <div className="w-24 text-xs text-slate-500 truncate">{req.requestDate.split(' ')[0]}</div>
                        </div>
                    ))}
                </div>

                {/* Bottom Actions */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex gap-2">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1">
                        <PlusIcon className="w-3 h-3" /> Thêm mới
                    </button>
                    <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1">
                        <TrashIcon className="w-3 h-3" /> Xóa
                    </button>
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1">
                        <PrinterIcon className="w-3 h-3" /> In
                    </button>
                </div>
            </div>

            {/* RIGHT COLUMN: DETAILS & RESULTS */}
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                {selectedRequest ? (
                    <>
                        {/* Top: Request Info */}
                        <div className="bg-blue-50 dark:bg-slate-800/50 rounded-lg border border-blue-100 dark:border-slate-700 p-4 relative shadow-sm">
                            <div className="absolute top-3 right-3">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 shadow-sm">
                                    <PhotographIcon className="w-4 h-4" /> Xem ảnh
                                </button>
                            </div>
                            <h3 className="text-blue-700 dark:text-blue-400 font-bold text-base mb-3 border-b border-blue-200 dark:border-slate-600 pb-1">
                                Thông tin phiếu
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Số phiếu:</span> {selectedRequest.id}</div>
                                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Trạng thái:</span> {selectedRequest.status === 'completed' ? 'Đã có kết quả' : 'Chờ thực hiện'}</div>
                                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Ngày yêu cầu:</span> {selectedRequest.requestDate}</div>
                                
                                <div><span className="font-semibold text-slate-700 dark:text-slate-300">BS chỉ định:</span> {selectedRequest.doctor}</div>
                                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Thời gian TH:</span> {selectedRequest.executionTime || '--'}</div>
                                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Người thực hiện:</span> {selectedRequest.performer || '--'}</div>
                                
                                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Ngày kết quả:</span> {selectedRequest.executionTime?.split(' ')[0] || '--'}</div>
                                <div><span className="font-semibold text-slate-700 dark:text-slate-300">Bác sĩ đọc:</span> {selectedRequest.performer || '--'}</div>
                            </div>
                        </div>

                        {/* Bottom: Results Form */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-1 p-4 flex flex-col">
                            <h3 className="text-blue-700 dark:text-blue-400 font-bold text-base mb-4">
                                Thông tin kết quả
                            </h3>
                            <div className="space-y-4 flex-1">
                                {[
                                    { label: 'Kỹ thuật thực hiện', key: 'technique' },
                                    { label: 'Nhận xét', key: 'findings' },
                                    { label: 'Kết quả', key: 'result' },
                                    { label: 'Kết luận', key: 'conclusion' },
                                    { label: 'Ghi chú', key: 'note' },
                                ].map((field) => (
                                    <div key={field.key} className="relative group">
                                        <label className="absolute -top-2.5 left-3 bg-white dark:bg-slate-800 px-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                                            {field.label}
                                        </label>
                                        <textarea 
                                            rows={field.key === 'findings' ? 3 : 2}
                                            value={selectedRequest[field.key as keyof LabRequest] || ''}
                                            onChange={(e) => handleInputChange(field.key as keyof LabRequest, e.target.value)}
                                            className="w-full p-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent transition-all"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        Chọn một phiếu chỉ định để xem chi tiết
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabView;
