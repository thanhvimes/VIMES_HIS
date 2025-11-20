
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronRightIcon, SearchIcon, XIcon, CheckIcon } from '../Icons';

// Component highlight từ khóa tìm kiếm
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight || !highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-slate-900 dark:text-white font-semibold rounded-[1px]">
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

export interface ComboboxColumn<T> {
    key: keyof T | string;
    label: string;
    width?: string;
    className?: string;
    render?: (item: T) => React.ReactNode;
}

interface ComboboxProps<T> {
    label?: string;
    value?: string; // Giá trị hiển thị trong input
    onChange: (value: string, item?: T) => void;
    options: T[];
    placeholder?: string;
    className?: string;
    required?: boolean;
    name?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    
    // Configuration
    displayValue?: (item: T) => string; // Hàm lấy giá trị hiển thị khi chọn
    filterFunction?: (item: T, query: string) => boolean;
    
    // Multi-column mode
    columns?: ComboboxColumn<T>[]; 
}

function Combobox<T extends Record<string, any>>({ 
    label, 
    value = '', 
    onChange, 
    options = [], 
    placeholder = 'Chọn...', 
    className = '',
    required = false,
    name,
    disabled = false,
    autoFocus = false,
    displayValue,
    filterFunction,
    columns
}: ComboboxProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value);
    const [activeIndex, setActiveIndex] = useState(0); // Mặc định highlight dòng đầu tiên
    
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Đồng bộ searchTerm khi value từ props thay đổi (reset form, chọn item)
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    const getDisplayValue = (item: T): string => {
        if (displayValue) return displayValue(item);
        return item.name || item.label || item.code || JSON.stringify(item);
    };

    // Filter logic
    const filteredOptions = useMemo(() => {
        if (!searchTerm && !isOpen) return options; // Khi đóng, không filter
        // Khi mở nhưng chưa nhập gì, hiện hết. Khi nhập, filter.
        
        // Custom filter hoặc default filter tìm trên tất cả các cột
        const query = searchTerm.toLowerCase();
        
        if (filterFunction) {
            return options.filter(opt => filterFunction(opt, query));
        }

        return options.filter(item => {
            // Nếu đang hiển thị text khớp hoàn toàn giá trị item, coi như đã chọn, hiển thị full list gợi ý khác
            if (displayValue && displayValue(item) === searchTerm) return true;

            if (columns) {
                return columns.some(col => {
                    const val = item[col.key as keyof T];
                    return String(val || '').toLowerCase().includes(query);
                });
            }
            // Fallback
            return getDisplayValue(item).toLowerCase().includes(query);
        });
    }, [searchTerm, options, filterFunction, columns, isOpen]);

    // Reset active index khi danh sách thay đổi
    useEffect(() => {
        setActiveIndex(0);
    }, [filteredOptions.length]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Nếu text hiện tại không khớp item nào (đang gõ dở), có thể muốn reset về value cũ hoặc giữ nguyên tùy logic.
                // Ở đây giữ nguyên text người dùng nhập (cho trường hợp free-text) hoặc reset nếu bắt buộc chọn.
                // Hiện tại giữ nguyên để linh hoạt.
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-scroll to active item
    useEffect(() => {
        if (isOpen && listRef.current && activeIndex >= 0 && listRef.current.children[activeIndex]) {
            (listRef.current.children[activeIndex] as HTMLElement).scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [activeIndex, isOpen]);

    const handleSelect = (item: T) => {
        const display = getDisplayValue(item);
        setSearchTerm(display);
        onChange(display, item);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
        onChange(e.target.value, undefined); // Báo ra ngoài là đang gõ (item = undefined)
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) setIsOpen(true);
            else setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        } 
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!isOpen) setIsOpen(true);
            else setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } 
        else if (e.key === 'Enter') {
            if (isOpen && filteredOptions.length > 0) {
                e.preventDefault();
                handleSelect(filteredOptions[activeIndex]);
            }
            // Nếu đóng mà Enter -> submit form (mặc định)
        } 
        else if (e.key === 'Tab') {
            // Tab hành xử giống Enter nếu đang mở dropdown: Chọn item đang highlight rồi chuyển focus
            if (isOpen && filteredOptions.length > 0) {
                handleSelect(filteredOptions[activeIndex]);
                // Không preventDefault để focus vẫn di chuyển sang field tiếp theo
            }
            setIsOpen(false);
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
        }
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    name={name}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    autoComplete="off"
                    className={`w-full pl-10 pr-8 py-2.5 text-base border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm transition-all placeholder-slate-400
                        ${isOpen ? 'ring-2 ring-primary border-transparent' : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent'}
                        ${disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-75' : ''}
                    `}
                />
                
                {searchTerm && !disabled && (
                    <div 
                        className="absolute inset-y-0 right-8 flex items-center px-2 cursor-pointer text-slate-400 hover:text-red-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSearchTerm('');
                            onChange('', undefined);
                            inputRef.current?.focus();
                        }}
                    >
                        <XIcon className="w-4 h-4" />
                    </div>
                )}
                <div 
                    className={`absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ${disabled ? 'pointer-events-none' : ''}`}
                    onClick={() => {
                        if (!disabled) {
                            if (!isOpen) inputRef.current?.focus();
                            setIsOpen(!isOpen);
                        }
                    }}
                >
                    <ChevronRightIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                </div>
            </div>
            
            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden ring-1 ring-black/5 animate-fade-in">
                    {/* Header Row for Columns */}
                    {columns && filteredOptions.length > 0 && (
                        <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-600 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                             {columns.map((col, idx) => (
                                <div key={idx} style={{ width: col.width || 'flex-1', flex: col.width ? 'none' : 1 }} className={`px-2 ${col.className || ''}`}>
                                    {col.label}
                                </div>
                            ))}
                        </div>
                    )}

                    <ul ref={listRef} className="max-h-80 overflow-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => {
                                const isActive = index === activeIndex;
                                return (
                                    <li
                                        key={index}
                                        className={`px-3 py-2.5 text-base cursor-pointer border-b border-slate-50 dark:border-slate-700/30 last:border-0 transition-colors duration-75
                                            ${isActive 
                                                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100' 
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }
                                        `}
                                        onClick={() => handleSelect(option)}
                                        onMouseEnter={() => setActiveIndex(index)}
                                    >
                                        {columns ? (
                                            <div className="flex items-center w-full">
                                                {columns.map((col, colIdx) => (
                                                    <div 
                                                        key={colIdx} 
                                                        style={{ width: col.width || 'flex-1', flex: col.width ? 'none' : 1 }}
                                                        className={`px-2 overflow-hidden text-ellipsis whitespace-nowrap ${col.className || ''}`}
                                                    >
                                                        {col.render ? col.render(option) : (
                                                            <HighlightedText text={String(option[col.key as keyof T] || '')} highlight={searchTerm} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="block truncate">
                                                <HighlightedText text={getDisplayValue(option)} highlight={searchTerm} />
                                            </span>
                                        )}
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400 italic text-center">
                                {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Nhập từ khóa để tìm kiếm...'}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Combobox;
