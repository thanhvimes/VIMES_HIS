
import React from 'react';
import { CheckCircleIcon } from '../../../components/Icons';
import { BookingSpeciality } from '../../../services/bookingService';

interface SpecialitySelectorProps {
    specialities: BookingSpeciality[];
    selectedId: string;
    onSelect: (id: string) => void;
}

const SpecialitySelector: React.FC<SpecialitySelectorProps> = ({ specialities, selectedId, onSelect }) => {
    return (
        <section>
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-[0.15em] ml-1">Chọn chuyên khoa khám</h4>
            <div className="grid grid-cols-2 gap-2.5">
                {specialities.map((s) => {
                    const isActive = selectedId === s.id;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => onSelect(s.id)}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 h-14 ${
                                isActive 
                                ? 'border-teal-500 bg-teal-50/50 text-teal-800 dark:text-teal-300 shadow-md ring-4 ring-teal-50 dark:ring-teal-900/10' 
                                : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-teal-200'
                            }`}
                        >
                            <span className="text-sm font-black truncate uppercase tracking-tight">{s.name}</span>
                            {isActive && <CheckCircleIcon className="w-5 h-5 text-teal-600" />}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default SpecialitySelector;
