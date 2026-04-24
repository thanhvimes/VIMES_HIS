import React from 'react';
import { XIcon, CheckCircleIcon, ClockIcon as HistoryIcon, InfoIcon, PrinterIcon } from '../../../components/Icons';

interface BHXHResultModalProps {
    visible: boolean;
    onClose: () => void;
    onAccept?: () => void;
    data: any;
}

const BHXHResultModal: React.FC<BHXHResultModalProps> = ({ visible, onClose, onAccept, data }) => {
    if (!visible || !data) return null;

    const info = data.data || {};
    const historyKCB = data.historyKCB || [];
    const historyCheckin = data.historyCheckin || [];
    const isSuccess = data.success;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                
                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex justify-between items-center">
                    <h2 className="text-blue-600 dark:text-blue-400 font-bold uppercase flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        Kết quả tra cứu thông tin thẻ BHYT
                    </h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    
                    {/* 1. THÔNG BÁO TỔNG QUÁT */}
                    <div className="text-center">
                        <h3 className={`text-xl font-black uppercase mb-2 ${isSuccess ? 'text-red-700 line-clamp-1' : 'text-slate-500 line-clamp-1'}`}>
                            {data.message || 'Thẻ còn giá trị sử dụng'}
                        </h3>
                        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 p-3 rounded text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed italic text-left">
                            {data.message}! Họ tên : <b>{info.name}</b>, Ngày sinh: <b>{info.dob}</b>, Giới tính : <b>{String(info.gender) === '1' || info.gender === 'Nam' ? 'Nam' : 'Nữ'}</b>! (ĐC: {info.address}; Nơi KCBBĐ: {info.maDKBD}; Hạn thẻ: {info.startDate} - {info.endDate}; Thời điểm đủ 5 năm liên tục: {info.fiveYearDate}).
                        </div>
                    </div>

                    {/* 2. CHI TIẾT THÔNG TIN THẺ */}
                    <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded shadow-sm">
                        <table className="w-full text-sm border-collapse">
                            <tbody>
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold w-32 text-slate-600 dark:text-slate-400">Họ và tên:</td>
                                    <td className="p-2 text-blue-700 dark:text-blue-400 font-bold text-base uppercase">{info.name}</td>
                                    <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold w-32 text-slate-600 dark:text-slate-400">Ngày sinh:</td>
                                    <td className="p-2 font-medium">{info.dob}</td>
                                    <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold w-32 text-slate-600 dark:text-slate-400">Giới tính:</td>
                                    <td className="p-2 font-medium">{String(info.gender) === '1' || info.gender === 'Nam' ? 'Nam' : 'Nữ'}</td>
                                </tr>
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold text-slate-600 dark:text-slate-400">Địa chỉ:</td>
                                    <td className="p-2" colSpan={5}>{info.address}</td>
                                </tr>
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold text-slate-600 dark:text-slate-400">Mã ĐKBD:</td>
                                    <td className="p-2 text-blue-700 dark:text-blue-400 font-bold">{info.maDKBD}</td>
                                    <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold text-slate-600 dark:text-slate-400">Mã Khu vực:</td>
                                    <td className="p-2" colSpan={3}>{info.maKV || '--'}</td>
                                </tr>
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold text-slate-600 dark:text-slate-400">Từ ngày:</td>
                                    <td className="p-2 font-medium">{info.startDate}</td>
                                    <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold text-slate-600 dark:text-slate-400">Đến ngày:</td>
                                    <td className="p-2 font-medium" colSpan={3}>{info.endDate}</td>
                                </tr>
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold text-slate-600 dark:text-slate-400">Mã Thẻ cũ:</td>
                                    <td className="p-2 text-slate-500 italic">{info.cardNo}</td>
                                    <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold text-slate-600 dark:text-slate-400">Mã Thẻ mới:</td>
                                    <td className="p-2 text-blue-700 dark:text-blue-400 font-bold uppercase" colSpan={3}>{info.newCardNo || '--'}</td>
                                </tr>
                                {info.startDateNew && (
                                    <tr>
                                        <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold text-slate-600 dark:text-slate-400">Từ ngày (Mới):</td>
                                        <td className="p-2 font-medium">{info.startDateNew}</td>
                                        <td className="bg-slate-50 dark:bg-slate-800/50 p-2 font-bold text-slate-600 dark:text-slate-400">Đến ngày (Mới):</td>
                                        <td className="p-2 font-medium" colSpan={3}>{info.endDateNew}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 3. LỊCH SỬ KHÁM CHỮA BỆNH */}
                    <div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 border border-blue-200 dark:border-blue-800 border-b-0 rounded-t font-bold text-xs uppercase flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <HistoryIcon className="w-4 h-4" /> Lịch sử khám chữa bệnh
                        </div>
                        <div className="max-h-48 overflow-y-auto border border-blue-200 dark:border-blue-800 rounded-b">
                            <table className="w-full text-[11px] border-collapse">
                                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase sticky top-0">
                                    <tr>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center w-10">STT</th>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-left w-32">Tên bệnh viện</th>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center">Ngày vào</th>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center">Ngày ra</th>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-left">Chẩn đoán</th>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-left">Kquả điều trị</th>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-left">Lý do vào viện</th>
                                        <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">Tình trạng rv</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyKCB.length > 0 ? historyKCB.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800 text-center">{idx + 1}</td>
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800 font-medium">{item.tenBenhVien}</td>
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800 text-center whitespace-nowrap">{item.ngayVao}</td>
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800 text-center whitespace-nowrap">{item.ngayRa}</td>
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800 max-w-[150px] truncate" title={item.tenBenh}>{item.tenBenh}</td>
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800">{item.ketQuaDieuTri}</td>
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800">{item.lyDoVaoVien}</td>
                                            <td className="p-2">{item.tinhTrangRv}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={8} className="p-4 text-center text-slate-400 italic">Không có dữ liệu lịch sử KCB</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 4. HISTORY CHECKINS */}
                    <div>
                        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700 border-b-0 rounded-t font-bold text-xs uppercase flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <InfoIcon className="w-4 h-4" /> History Checkins
                        </div>
                        <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-b">
                            <table className="w-full text-[11px] border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase sticky top-0">
                                    <tr>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center w-10">STT</th>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center w-20">Mã</th>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-left w-48">Tên CSKCB</th>
                                        <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center w-32">Thời gian KT</th>
                                        <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">Nội dung thông báo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyCheckin.length > 0 ? historyCheckin.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 border-b border-slate-100 dark:border-slate-800 last:border-0 font-medium">
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800 text-center font-bold px-1">{idx + 1}</td>
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800 text-center text-blue-600 font-mono tracking-tighter">{item.maCSKCB}</td>
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800">{item.tenCSKCB}</td>
                                            <td className="p-2 border-r border-slate-100 dark:border-slate-800 text-center whitespace-nowrap">{item.ngayKT}</td>
                                            <td className="p-2 text-slate-500 italic text-[10px] leading-tight">{item.ghiChu}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-slate-400 italic">Không có dữ liệu lịch sử check-in</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex justify-end gap-3">
                    <button className="flex items-center gap-2 px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-bold text-sm shadow-sm transition active:scale-95">
                        <PrinterIcon className="w-4 h-4" />
                        In
                    </button>
                    <button onClick={() => onAccept ? onAccept() : onClose()} className="px-10 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm shadow shadow-blue-500/20 transition active:scale-95">
                        Chấp nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BHXHResultModal;
