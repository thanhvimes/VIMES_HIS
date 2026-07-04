import React from 'react';
import { catalogService } from '../../../services/catalogService';

const COMMON_ICD10 = [
    { code: 'A09', name: 'Tiêu chảy và viêm dạ dày ruột' },
    { code: 'A15', name: 'Lao phổi' },
    { code: 'E11', name: 'Bệnh đái tháo đường không phụ thuộc insulin' },
    { code: 'E78', name: 'Rối loạn chuyển hóa lipoprotein và tình trạng tăng lipid máu khác' },
    { code: 'G40', name: 'Bệnh động kinh' },
    { code: 'H52', name: 'Rối loạn khúc xạ' },
    { code: 'H83', name: 'Các bệnh tai trong khác (bao gồm điếc do tiếng ồn)' },
    { code: 'I10', name: 'Bệnh tăng huyết áp vô căn (nguyên phát)' },
    { code: 'I20', name: 'Cơn đau thắt ngực' },
    { code: 'I21', name: 'Nhồi máu cơ tim cấp' },
    { code: 'J00', name: 'Viêm mũi họng cấp tính (cảm thường)' },
    { code: 'J02', name: 'Viêm họng cấp' },
    { code: 'J03', name: 'Viêm amidan cấp' },
    { code: 'J20', name: 'Viêm phế quan cấp' },
    { code: 'J30', name: 'Viêm mũi dị ứng và viêm mũi vận mạch' },
    { code: 'J45', name: 'Hen phế quản' },
    { code: 'J60', name: 'Bệnh bụi phổi silic' },
    { code: 'K29', name: 'Viêm dạ dày và tá tràng' },
    { code: 'K35', name: 'Viêm ruột thừa cấp' },
    { code: 'L23', name: 'Viêm da tiếp xúc dị ứng' },
    { code: 'M17', name: 'Thoái hóa khớp gối' },
    { code: 'M54', name: 'Đau lưng' },
    { code: 'N30', name: 'Viêm bàng quang' },
    { code: 'R50', name: 'Sốt chưa rõ nguyên nhân' },
    { code: 'R51', name: 'Đau đầu' }
];

interface ICD10MultiSelectProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const ICD10MultiSelect: React.FC<ICD10MultiSelectProps> = ({
    label,
    value,
    onChange,
    placeholder = "Tìm hoặc nhập mã ICD...",
    disabled
}) => {
    const [query, setQuery] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const [options, setOptions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [selectedItemsCache, setSelectedItemsCache] = React.useState<Record<string, string>>({});
    const containerRef = React.useRef<HTMLDivElement>(null);

    const activeCodes = React.useMemo(() => {
        return value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
    }, [value]);

    React.useEffect(() => {
        if (query.trim() === '') {
            setOptions([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setIsLoading(true);
            try {
                const data = await catalogService.searchIcd10(query);
                setOptions(data || []);
            } catch (err) {
                console.error("Lỗi tìm kiếm ICD:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    React.useEffect(() => {
        const missingCodes = activeCodes.filter(code => {
            const upper = code.toUpperCase();
            const inLocal = COMMON_ICD10.some(item => item.code.toUpperCase() === upper);
            const inCache = !!selectedItemsCache[upper];
            return !inLocal && !inCache;
        });

        if (missingCodes.length > 0) {
            missingCodes.forEach(async (code) => {
                try {
                    const results = await catalogService.searchIcd10(code);
                    const match = results.find(r => r.code.toUpperCase() === code.toUpperCase());
                    if (match) {
                        setSelectedItemsCache(prev => ({
                            ...prev,
                            [code.toUpperCase()]: match.name
                        }));
                    }
                } catch (err) {
                    console.error("Lỗi tự động lấy tên bệnh ICD:", err);
                }
            });
        }
    }, [activeCodes, selectedItemsCache]);

    const filteredOptions = React.useMemo(() => {
        const listToFilter = query.trim() === '' ? COMMON_ICD10 : options;
        return listToFilter.filter(item => !activeCodes.includes(item.code));
    }, [query, options, activeCodes]);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addCode = (code: string) => {
        const cleanedCode = code.toUpperCase().trim();
        if (cleanedCode && !activeCodes.includes(cleanedCode)) {
            const newCodes = [...activeCodes, cleanedCode];
            onChange(newCodes.join(', '));

            const foundOption = options.find(o => o.code.toUpperCase() === cleanedCode) || 
                                COMMON_ICD10.find(o => o.code.toUpperCase() === cleanedCode);
            if (foundOption) {
                setSelectedItemsCache(prev => ({
                    ...prev,
                    [cleanedCode]: foundOption.name
                }));
            }
        }
        setQuery('');
        setIsOpen(false);
    };

    const removeCode = (codeToRemove: string) => {
        const newCodes = activeCodes.filter(c => c !== codeToRemove);
        onChange(newCodes.join(', '));
    };

    const getCodeName = (code: string) => {
        const upperCode = code.toUpperCase();
        const foundLocal = COMMON_ICD10.find(item => item.code.toUpperCase() === upperCode);
        if (foundLocal) return `${code} - ${foundLocal.name}`;
        
        if (selectedItemsCache[upperCode]) {
            return `${code} - ${selectedItemsCache[upperCode]}`;
        }

        const foundRemote = options.find(item => item.code.toUpperCase() === upperCode);
        if (foundRemote) return `${code} - ${foundRemote.name}`;
        
        return code;
    };

    return (
        <div ref={containerRef} className="relative space-y-1 w-full text-left">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="w-full p-2.5 pr-8 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-semibold placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    onKeyDown={e => {
                        if (e.key === 'Enter' && query.trim()) {
                            e.preventDefault();
                            addCode(query);
                        }
                    }}
                />
                <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </span>

                {isOpen && !disabled && (query.trim() !== '' || filteredOptions.length > 0 || isLoading) && (
                    <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg custom-scrollbar">
                        {isLoading ? (
                            <div className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>Đang tìm kiếm trong danh mục ICD...</span>
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => addCode(item.code)}
                                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/30 last:border-0 cursor-pointer"
                                >
                                    <span>{item.code} - {item.name}</span>
                                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded-full">+ Chọn</span>
                                </button>
                            ))
                        ) : query.trim() ? (
                            <div className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 italic">
                                Không tìm thấy kết quả phù hợp
                            </div>
                        ) : null}
                        
                        {!isLoading && query.trim() && !filteredOptions.some(item => item.code.toUpperCase() === query.trim().toUpperCase()) && (
                            <button
                                type="button"
                                onClick={() => addCode(query)}
                                className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#0f766e] dark:text-emerald-400 hover:bg-teal-50 dark:hover:bg-emerald-950/10 flex items-center gap-1.5 cursor-pointer border-t border-slate-100 dark:border-slate-700/30"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>Thêm mã tự do: "{query.toUpperCase()}"</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {activeCodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {activeCodes.map((code, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-900/30 text-[#0f766e] dark:text-emerald-400 rounded-full px-3 py-0.5 text-xs font-bold transition-all hover:bg-teal-50 dark:hover:bg-teal-950/20"
                        >
                            <span>{getCodeName(code)}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => removeCode(code)}
                                    className="hover:bg-teal-200/50 dark:hover:bg-teal-800/50 rounded-full p-0.5 text-teal-600 dark:text-teal-400 transition-colors cursor-pointer"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
