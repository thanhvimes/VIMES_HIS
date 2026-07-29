import React, { useMemo } from 'react';
import { SlipPatient } from '../SampleTracking';

interface SampleStatusBadgeProps {
    patient: SlipPatient;
    isReceived: boolean;
}

export const SampleStatusBadge: React.FC<SampleStatusBadgeProps> = ({ patient, isReceived }) => {
    
    // Check if sample has been waiting for more than 30 mins
    const tatWarning = useMemo(() => {
        if (isReceived) return false; // TAT met
        if (!patient.limsoe_sample_date || patient.limsoe_sample_date === '---') return false;
        
        try {
            // Very naive date parsing for demo. Format: YYYY-MM-DD HH:mm:ss or similar
            const sampleTime = new Date(patient.limsoe_sample_date).getTime();
            if (isNaN(sampleTime)) return false;
            
            const diffMins = (Date.now() - sampleTime) / (1000 * 60);
            return diffMins > 30; // 30 mins SLA
        } catch (e) {
            return false;
        }
    }, [patient.limsoe_sample_date, isReceived]);

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {/* Cờ STAT (Cấp cứu) */}
            {patient.isStat && (
                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded text-[9px] font-black uppercase tracking-wider animate-pulse shadow-sm">
                    🚨 Cấp cứu
                </span>
            )}
            
            {/* Cảnh báo TAT */}
            {tatWarning && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded text-[9px] font-bold uppercase tracking-wider shadow-sm">
                    ⏱️ Quá hạn 30p
                </span>
            )}
            
            {/* Nhãn Aliquoting */}
            {patient.needsAliquot && (
                <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800 rounded text-[9px] font-bold uppercase tracking-wider shadow-sm">
                    🖨️ In {patient.needsAliquot ? 2 : 1} tem
                </span>
            )}
        </div>
    );
};
