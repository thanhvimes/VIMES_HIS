
import React from 'react';
import { ReportDefinition, ReportGroup } from './types';

// Import specific report templates
import { PatientExamListReport } from '../reception/reports/PatientExamListReport';
import { PatientDrugReport } from '../reception/reports/PatientDrugReport';
import { RevenueMultiLevelReport } from '../management-reporting/reports/RevenueReport3Level';
import { InsuranceSettlementReport } from '../insurance/reports/InsuranceSettlementReport';

// --- MOCK REPORTS (Placeholders) ---
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
// Register all system reports here
const allReports: ReportDefinition[] = [
    // Reception Module
    PatientExamListReport,
    MockReport('rep_recep_01', '2. Hoạt động điều trị', 'reception'),
    MockReport('rep_recep_02', '3. Danh sách phiếu hoàn trả chưa duyệt', 'reception'),
    PatientDrugReport, // Real report template
    MockReport('rep_recep_05', '5. Báo cáo chi tiết tiền giường', 'reception'),
    MockReport('rep_recep_06', '6. Danh sách bệnh nhân theo bác sĩ', 'reception'),
    
    // General / Billing Module
    MockReport('rep_gen_01', '1. Danh sách bệnh nhân điều trị', 'general'),
    MockReport('rep_gen_02', '2. Tình hình bệnh tật tử vong', 'general'),
    RevenueMultiLevelReport, // Real report template
    
    // Insurance Module (NEW)
    InsuranceSettlementReport,
    MockReport('rep_ins_01', 'Báo cáo từ chối giám định', 'insurance'),
    
    // Pharmacy Module
    MockReport('rep_phar_01', '1. Báo cáo nhập xuất tồn', 'pharmacy'),
];

// Helper to group reports by module
export const getGroupedReports = (): ReportGroup[] => {
    const groups: Record<string, ReportDefinition[]> = {
        'reception': [],
        'general': [],
        'pharmacy': [],
        'consultation': [],
        'billing': [],
        'insurance': [],
    };

    allReports.forEach(rep => {
        if (!groups[rep.module]) groups[rep.module] = [];
        groups[rep.module].push(rep);
    });

    return [
        { id: 'reception', label: 'A- Nhóm báo cáo hoạt động điều trị', reports: groups['reception'] },
        { id: 'insurance', label: 'B- Nhóm báo cáo Bảo hiểm Y tế', reports: groups['insurance'] },
        { id: 'general', label: 'C- Nhóm báo cáo chung (Tổng hợp)', reports: groups['general'] },
        { id: 'pharmacy', label: 'D- Nhóm báo cáo Dược', reports: groups['pharmacy'] },
        { id: 'billing', label: 'E- Nhóm báo cáo Viện phí (Tài chính)', reports: groups['billing'] },
    ].filter(g => g.reports.length > 0);
};

export const getReportById = (id: string) => allReports.find(r => r.id === id);
