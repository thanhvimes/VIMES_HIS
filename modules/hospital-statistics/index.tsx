// ==================== HOSPITAL STATISTICS MODULE ROOT ====================
// File: modules/hospital-statistics/index.tsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardOverview } from './views/DashboardOverview';
import { HospitalActivityView } from './views/HospitalActivityView';
import { ClinicStatisticsView } from './views/ClinicStatisticsView';
import { InpatientStatisticsView } from './views/InpatientStatisticsView';
import { ParaclinicalStatisticsView } from './views/ParaclinicalStatisticsView';
import { SurgeryStatisticsView } from './views/SurgeryStatisticsView';
import { DepartmentCostView } from './views/DepartmentCostView';
import { BedOccupancyView } from './views/BedOccupancyView';
import { MorningBriefingView } from './views/MorningBriefingView';
import { FinancialRiskView } from './views/FinancialRiskView';

const HospitalStatisticsModule: React.FC = () => {
    return (
        <div className="w-full min-h-full px-3 sm:px-4 py-2 sm:py-2.5 space-y-3 sm:space-y-3.5">
            {/* Routes with absolute fallbacks */}
            <Routes>
                <Route path="/" element={<Navigate to="/hospital-statistics/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardOverview />} />
                <Route path="morning-briefing" element={<MorningBriefingView />} />
                <Route path="hospital-activity" element={<HospitalActivityView />} />
                <Route path="clinics" element={<ClinicStatisticsView />} />
                <Route path="inpatient" element={<InpatientStatisticsView />} />
                <Route path="paraclinical" element={<ParaclinicalStatisticsView />} />
                <Route path="surgery" element={<SurgeryStatisticsView />} />
                <Route path="department-costs" element={<DepartmentCostView />} />
                <Route path="bed-occupancy" element={<BedOccupancyView />} />
                <Route path="financial-risk" element={<FinancialRiskView />} />
                <Route path="*" element={<Navigate to="/hospital-statistics/dashboard" replace />} />
            </Routes>
        </div>
    );
};


export default HospitalStatisticsModule;
