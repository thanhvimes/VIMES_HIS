// File: modules/health-check-sync/components/settings/ReceptionSlipTab.tsx

import React from 'react';

interface ReceptionSlipTabProps {
    receptionSlipTemplate: string;
    setReceptionSlipTemplate: (v: string) => void;
    inputClass: string;
}

export const ReceptionSlipTab: React.FC<ReceptionSlipTabProps> = ({
    receptionSlipTemplate,
    setReceptionSlipTemplate,
    inputClass
}) => {
    return (
        <section className="space-y-4 animate-in fade-in duration-200">
            <p className="text-xs text-slate-500 dark:text-slate-400">
                Chỉnh sửa thiết kế mẫu in nhiệt phiếu tiếp đón (khổ 80mm). Hỗ trợ các từ khóa thay thế:
                <code className="mx-1 px-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-pink-500">{"{{hospital}}"}</code> (Tên CSKB),
                <code className="mx-1 px-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-pink-500">{"{{docNo}}"}</code> (Số hồ sơ),
                <code className="mx-1 px-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-pink-500">{"{{name}}"}</code> (Họ tên),
                <code className="mx-1 px-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-pink-500">{"{{dob}}"}</code> (Năm sinh),
                <code className="mx-1 px-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-pink-500">{"{{gender}}"}</code> (Giới tính),
                <code className="mx-1 px-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-pink-500">{"{{cardId}}"}</code> (CCCD),
                <code className="mx-1 px-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-pink-500">{"{{address}}"}</code> (Địa chỉ),
                <code className="mx-1 px-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-pink-500">{"{{dateStr}}"}</code> (Ngày in).
            </p>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nội dung mẫu in HTML (Khổ 80mm)</label>
                <textarea
                    value={receptionSlipTemplate}
                    onChange={e => setReceptionSlipTemplate(e.target.value)}
                    rows={18}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-850 text-xs font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    placeholder="Nhập mã HTML thiết kế..."
                />
            </div>
        </section>
    );
};
