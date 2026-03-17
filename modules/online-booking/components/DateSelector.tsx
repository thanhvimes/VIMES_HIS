
import React from 'react';

interface DateItem {
    key: string;
    date: Date;
    isToday: boolean;
}

interface DateSelectorProps {
    selectedDate: string;
    onSelect: (dateStr: string) => void;
    daysCount?: number; // Lấy từ cấu hình
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelect, daysCount = 14 }) => {
    const dates = React.useMemo(() => {
        const result: DateItem[] = [];
        const now = new Date();
        for (let i = 0; i < daysCount; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
            // Use local date format YYYY-MM-DD instead of toISOString() to avoid UTC conversion
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const localDateStr = `${year}-${month}-${day}`;

            result.push({
                key: localDateStr,
                date: d,
                isToday: i === 0
            });
        }
        return result;
    }, [daysCount]);

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    return (
        <section>
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-[0.15em] ml-1">Chọn ngày khám</h4>
            {/* Chuyển sang Grid 4 cột để tự động xuống dòng */}
            <div className="grid grid-cols-4 gap-2">
                {dates.map((item) => {
                    const isSelected = selectedDate === item.key;
                    const dayOfWeek = item.date.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onSelect(item.key)}
                            className={`flex flex-col items-center justify-center h-14 rounded-xl border-2 transition-all duration-200 relative ${isSelected
                                    ? 'border-teal-500 bg-teal-600 text-white shadow-lg z-10 scale-105'
                                    : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-teal-200 shadow-sm'
                                }`}
                        >
                            <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-teal-100' : isWeekend ? 'text-red-400' : 'text-slate-400'
                                }`}>
                                {dayNames[dayOfWeek]}
                            </span>
                            <span className="text-lg font-black leading-none mt-0.5">{item.date.getDate()}</span>

                            {item.isToday && !isSelected && (
                                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default DateSelector;
