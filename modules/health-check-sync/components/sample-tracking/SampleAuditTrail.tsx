import React from 'react';
import { SlipPatient, AuditTrailEvent } from '../SampleTracking';

interface SampleAuditTrailProps {
    patient: SlipPatient | null;
}

const formatTimeOnly = (dateString: string) => {
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return dateString;
    }
};

const formatDateOnly = (dateString: string) => {
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '';
    }
};

export const SampleAuditTrail: React.FC<SampleAuditTrailProps> = ({ patient }) => {
    if (!patient) {
        return (
            <div className="text-slate-400 text-center py-12 text-xs">
                Chọn một bệnh nhân để xem lịch sử hành trình mẫu.
            </div>
        );
    }

    // Use mocked audit trail if available, otherwise generate a logical one based on timestamps
    let events: AuditTrailEvent[] = patient.auditTrail || [];
    
    if (events.length === 0) {
        // Mock generation for existing records
        if (patient.hpc_orderdate) {
            events.push({
                timestamp: patient.hpc_orderdate,
                action: 'Tạo chỉ định xét nghiệm',
                actor: 'BS Yêu Cầu'
            });
        }
        if (patient.limsoe_sample_date && patient.limsoe_sample_date !== '---') {
            events.push({
                timestamp: patient.limsoe_sample_date,
                action: 'Lấy mẫu & In tem',
                actor: patient.limsoe_sample_by || 'Điều dưỡng'
            });
        }
        if (patient.limsoe_receive) {
            events.push({
                timestamp: patient.limsoe_receive,
                action: 'Nhận mẫu tại phòng Lab',
                actor: 'KTV Xét Nghiệm'
            });
        }
        if (patient.rejectedReason) {
            events.push({
                timestamp: new Date().toISOString(),
                action: `Từ chối mẫu (${patient.rejectedReason})`,
                actor: 'KTV Xét Nghiệm'
            });
        }
    }

    // Sort ascending by time
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return (
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 text-xs custom-scrollbar">
            <h4 className="font-extrabold uppercase text-[10px] text-slate-500 tracking-wider mb-4">Lịch sử Hành trình mẫu (Audit Trail)</h4>
            
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                {events.map((evt, idx) => {
                    const isLast = idx === events.length - 1;
                    const isError = evt.action.includes('Từ chối');
                    
                    return (
                        <div key={idx} className="relative pl-6">
                            {/* Node Dot */}
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${
                                isError ? 'bg-rose-500' : (isLast ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-500')
                            }`}></div>
                            
                            {/* Content */}
                            <div className={`p-3 rounded-xl border shadow-sm ${
                                isError ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-bold ${isError ? 'text-rose-700 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {evt.action}
                                    </span>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatTimeOnly(evt.timestamp)}</div>
                                        <div className="text-[9px] text-slate-400">{formatDateOnly(evt.timestamp)}</div>
                                    </div>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <span>👤</span> Người thực hiện: <strong className="text-slate-700 dark:text-slate-300">{evt.actor}</strong>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {events.length === 0 && (
                    <div className="text-slate-400 text-center py-4">Không có dữ liệu lịch sử.</div>
                )}
            </div>
        </div>
    );
};
