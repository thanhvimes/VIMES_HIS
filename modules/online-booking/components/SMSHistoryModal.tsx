import React, { useState, useEffect } from 'react';
import { XIcon, RefreshIcon, CheckCircleIcon, SmsIcon, PaperAirplaneIcon } from '../../../components/Icons';
import { bookingService, OnlineBookingRecord } from '../../../services/bookingService';
import { useNotification } from '../../../contexts/NotificationContext';

interface SMSLogItem {
    log_id: number;
    booking_id: number;
    patient_name: string;
    phone: string;
    dept_code: string | null;
    patient_type: string | null;
    sms_type: string;
    message_content: string;
    provider: string;
    provider_message_id: string | null;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    error_message: string | null;
    sent_at: string;
}

interface Props {
    booking: OnlineBookingRecord;
    onClose: () => void;
}

const SMSHistoryModal: React.FC<Props> = ({ booking, onClose }) => {
    const { addNotification } = useNotification();
    const [logs, setLogs] = useState<SMSLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        loadLogs();
    }, [booking.id]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const res = await bookingService.getSMSHistory(booking.id);
            if (res.success) {
                setLogs(res.data || []);
            }
        } catch (error: any) {
            console.error('Error fetching SMS history:', error);
            addNotification('Lỗi', 'Không thể tải lịch sử tin nhắn: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            setResending(true);
            await bookingService.resendSMS(booking.id);
            addNotification('Thành công', 'Đã gửi lại tin nhắn SMS cho bệnh nhân!', 'success');
            await loadLogs();
        } catch (error: any) {
            console.error('Error resending SMS:', error);
            addNotification('Lỗi', error.message || 'Không thể gửi lại SMS', 'error');
        } finally {
            setResending(false);
        }
    };

    const getSmsTypeLabel = (type: string) => {
        const labels: Record<string, { name: string; bg: string; text: string }> = {
            'confirmation': { name: 'Xác nhận đặt lịch', bg: 'bg-blue-100', text: 'text-blue-700' },
            'approved': { name: 'Duyệt lịch khám', bg: 'bg-green-100', text: 'text-green-700' },
            'cancellation': { name: 'Hủy lịch khám', bg: 'bg-red-100', text: 'text-red-700' },
            'reminder': { name: 'Nhắc lịch khám', bg: 'bg-amber-100', text: 'text-amber-700' },
            'reschedule': { name: 'Đổi lịch khám', bg: 'bg-purple-100', text: 'text-purple-700' }
        };
        return labels[type] || { name: type, bg: 'bg-slate-100', text: 'text-slate-700' };
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '--';
        const d = new Date(isoString);
        return d.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <SmsIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Lịch Sử Tin Nhắn SMS Đã Gửi</h3>
                            <p className="text-xs text-teal-100">
                                Bệnh nhân: <strong className="text-white">{booking.patientName}</strong> ({booking.phone}) - Mã: <strong>BK{booking.id}</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Sub Header & Actions */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-xs text-slate-600 flex items-center gap-4">
                        <span>Khoa: <strong>{booking.deptId || 'Mặc định'}</strong></span>
                        <span>Đối tượng: <strong>{booking.isInsurance ? 'BHYT' : 'Dịch vụ'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadLogs}
                            disabled={loading}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                        >
                            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                        >
                            {resending ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <PaperAirplaneIcon className="w-3.5 h-3.5 -rotate-45" />}
                            Gửi lại SMS ngay
                        </button>
                    </div>
                </div>

                {/* Logs Body */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <RefreshIcon className="w-8 h-8 animate-spin text-teal-600 mb-2" />
                            <p className="text-sm">Đang tải lịch sử tin nhắn...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <SmsIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-600 font-medium">Chưa có lịch sử gửi tin nhắn SMS cho lượt khám này.</p>
                            <p className="text-xs text-slate-400 mt-1">Khi hệ thống gửi SMS tự động hoặc khi bấm gửi lại, nhật ký sẽ xuất hiện tại đây.</p>
                        </div>
                    ) : (
                        logs.map((log) => {
                            const badge = getSmsTypeLabel(log.sms_type);
                            return (
                                <div
                                    key={log.log_id}
                                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                                                {badge.name}
                                            </span>
                                            {log.dept_code && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono">
                                                    Khoa: {log.dept_code}
                                                </span>
                                            )}
                                            {log.patient_type && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                                    {log.patient_type === 'BH' || log.patient_type === 'I' ? 'BHYT' : 'Dịch vụ'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-slate-400">{formatDate(log.sent_at)}</span>
                                            {log.status === 'SUCCESS' ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                                    <CheckCircleIcon className="w-3.5 h-3.5" /> Thành công
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200" title={log.error_message || ''}>
                                                    ❌ Thất bại
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Content */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed select-all">
                                        {log.message_content}
                                    </div>

                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                                        <span>Cổng gửi: <strong className="text-slate-700 uppercase">{log.provider}</strong></span>
                                        {log.provider_message_id && (
                                            <span className="font-mono text-slate-400">ID: {log.provider_message_id}</span>
                                        )}
                                        {log.error_message && (
                                            <span className="text-red-500 font-medium truncate max-w-xs">Lỗi: {log.error_message}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                    <span>Tổng số tin nhắn: <strong>{logs.length}</strong></span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
                    >
                        Đóng
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SMSHistoryModal;
