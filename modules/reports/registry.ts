
import React from 'react';
import { ReportDefinition, ReportGroup } from './types';

// Import các báo cáo cụ thể từ file riêng
import { PatientDrugReport } from './templates/reception/PatientDrugReport';
import { RevenueMultiLevelReport } from './templates/general/RevenueReport3Level';

// --- MOCK REPORTS (Giả lập các file báo cáo khác để demo danh sách) ---
const MockReport = (id: string, title: string, module: any): ReportDefinition => ({
    id, title, module,
    FilterComponent: ({ onRun }) => 
        React.createElement('div', { className: "p-4 bg-slate-50 border rounded" },
            React.createElement('p', { className: "text-sm text-slate-500 mb-2" },
                "Bộ lọc mặc định cho báo cáo: ",
                React.createElement('strong', null, title)
            ),
            React.createElement('button', { 
                onClick: () => onRun({}), 
                className: "px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold" 
            }, "Chạy báo cáo")
        ),
    ContentComponent: () => 
        React.createElement('div', { className: "p-8 text-center text-slate-400 italic" },
            `Nội dung báo cáo mẫu ${title}`
        )
});

// --- REGISTRY LIST ---
// Đây là nơi bạn đăng ký tất cả báo cáo của hệ thống
const allReports: ReportDefinition[] = [
    // Module Tiếp nhận
    MockReport('rep_recep_01', '1. Hoạt động điều trị', 'reception'),
    MockReport('rep_recep_02', '2. Danh sách phiếu hoàn trả chưa duyệt', 'reception'),
    MockReport('rep_recep_03', '3. Chi tiết theo số ca [K1]', 'reception'),
    PatientDrugReport, // Báo cáo thật đã tách file
    MockReport('rep_recep_05', '5. Báo cáo chi tiết tiền giường', 'reception'),
    MockReport('rep_recep_06', '6. Danh sách bệnh nhân theo bác sĩ', 'reception'),
    
    // Nhóm báo cáo chung
    MockReport('rep_gen_01', '1. Danh sách bệnh nhân điều trị', 'general'),
    MockReport('rep_gen_02', '2. Tình hình bệnh tật tử vong', 'general'),
    RevenueMultiLevelReport, // Báo cáo doanh thu đa cấp MỚI
    
    // Module Dược
    MockReport('rep_phar_01', '1. Báo cáo nhập xuất tồn', 'pharmacy'),
];

// Hàm helper để group báo cáo theo module phục vụ hiển thị Sidebar
export const getGroupedReports = (): ReportGroup[] => {
    const groups: Record<string, ReportDefinition[]> = {
        'reception': [],
        'general': [],
        'pharmacy': [],
        'consultation': [],
        'billing': [],
    };

    allReports.forEach(rep => {
        if (!groups[rep.module]) groups[rep.module] = [];
        groups[rep.module].push(rep);
    });

    return [
        { id: 'reception', label: 'A- Nhóm báo cáo hoạt động điều trị (Tiếp nhận)', reports: groups['reception'] },
        { id: 'general', label: 'B- Nhóm báo cáo chung (Tổng hợp)', reports: groups['general'] },
        { id: 'pharmacy', label: 'C- Nhóm báo cáo Dược', reports: groups['pharmacy'] },
        { id: 'billing', label: 'D- Nhóm báo cáo Viện phí (Tài chính)', reports: groups['billing'] },
    ].filter(g => g.reports.length > 0);
};

export const getReportById = (id: string) => allReports.find(r => r.id === id);
