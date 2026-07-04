import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRightIcon, SearchIcon, XIcon, CheckIcon } from '../Icons';
import { useTheme } from '../../contexts/ThemeContext';
import { removeVietnameseTones } from '../../utils/formatters';

// Component highlight từ khóa tìm kiếm
const HighlightedText = ({ text, highlight }: { text: any; highlight: any }) => {
    const safeText = String(text || '');
    const safeHighlight = String(highlight || '').trim();

    if (!safeHighlight) {
        return <span>{safeText}</span>;
    }
    const regex = new RegExp(`(${safeHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = safeText.split(regex);
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

    // Status
    isLoading?: boolean;

    // Async search
    onSearch?: (query: string) => void;
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
    columns,
    isLoading = false,
    onSearch
}: ComboboxProps<T>) {
    const { fontSettings } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value);
    const [activeIndex, setActiveIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const getDisplayValue = (item: T): string => {
        if (displayValue) return displayValue(item);
        return item.name || item.label || item.code || JSON.stringify(item);
    };

    const isFocused = useRef(false);

    // Resolve display label from options when value is an ID
    useEffect(() => {
        // If the user is currently typing, don't let external value sync overwrite their typing
        if (isFocused.current) return;

        if (value && options.length > 0) {
            const strVal = String(value).trim();
            const matched = options.find(o => {
                const oId = String(o.id ?? o.code ?? '').trim();
                const oName = String(getDisplayValue(o)).trim();
                const oRef = String(o.refcode ?? o.ref_code ?? '').trim();
                
                // Exact match
                if (oId === strVal || oName === strVal) return true;
                
                // Country reference code match (case-insensitive)
                if (oRef && oRef.toLowerCase() === strVal.toLowerCase()) return true;
                
                // Fallback for Vietnam: if value is "VN" or "vn", and option has code/ID 190 or name "Việt Nam"
                if (strVal.toLowerCase() === 'vn' && (oId === '190' || oName === 'Việt Nam')) return true;
                
                // Numeric normalization match (e.g. "01" vs "1")
                const normId = /^\d+$/.test(oId) ? String(parseInt(oId, 10)) : oId.toLowerCase();
                const normVal = /^\d+$/.test(strVal) ? String(parseInt(strVal, 10)) : strVal.toLowerCase();
                if (normId === normVal) return true;
                
                return false;
            });
            if (matched) {
                const disp = getDisplayValue(matched);
                setSearchTerm(disp);
                
                // Normalize parent value in parent component if there is a mismatch (e.g., "01" -> "1" or "VN" -> "190")
                const cleanCode = String(matched.id ?? matched.code ?? disp);
                if (cleanCode !== String(value) && String(value) !== disp) {
                    onChange(cleanCode, matched);
                }
                return;
            }
        }
        setSearchTerm(value);
    }, [value, options, label]);

    // Filter logic
    const filteredOptions = useMemo(() => {
        const query = removeVietnameseTones(String(searchTerm || '')).toLowerCase();
        let result: T[] = [];
        
        // Check if searchTerm matches the display value of the currently matched/selected option.
        // If it matches exactly, it means the dropdown was just opened, and the user hasn't typed anything new.
        // In this case, we bypass filters and display all options.
        const isDisplayingSelected = (() => {
            if (!value || !options.length) return false;
            const strVal = String(value).trim();
            const matched = options.find(o => {
                const oId = String(o.id ?? o.code ?? '').trim();
                const oName = String(getDisplayValue(o)).trim();
                const oRef = String(o.refcode ?? o.ref_code ?? '').trim();
                
                if (oId === strVal || oName === strVal) return true;
                if (oRef && oRef.toLowerCase() === strVal.toLowerCase()) return true;
                
                // Fallback for Vietnam: if value is "VN" or "vn", and option has code/ID 190 or name "Việt Nam"
                if (strVal.toLowerCase() === 'vn' && (oId === '190' || oName === 'Việt Nam')) return true;
                
                const normId = /^\d+$/.test(oId) ? String(parseInt(oId, 10)) : oId.toLowerCase();
                const normVal = /^\d+$/.test(strVal) ? String(parseInt(strVal, 10)) : strVal.toLowerCase();
                return normId === normVal;
            });
            if (!matched) return false;
            return getDisplayValue(matched) === searchTerm;
        })();
        
        if ((!searchTerm && !isOpen) || isDisplayingSelected) {
            result = options;
        } else {
            if (filterFunction) {
                result = options.filter(opt => filterFunction(opt, query));
            } else {
                const scoredResults = options.map(item => {
                    const currentDisplay = getDisplayValue(item);
                    if (currentDisplay && currentDisplay === searchTerm) {
                        return { item, score: 200 };
                    }

                    let maxScore = 0;
                    const scoreValue = (val: any) => {
                        if (val == null) return 0;
                        const strVal = String(val);
                        const normalizedVal = removeVietnameseTones(strVal).toLowerCase();
                        
                        if (normalizedVal === query || strVal.toLowerCase() === query) return 100;
                        if (normalizedVal.startsWith(query)) return 50;
                        
                        const words = normalizedVal.split(' ');
                        if (words.some(w => w.startsWith(query))) return 30;
                        
                        if (normalizedVal.includes(query)) return 10;
                        return 0;
                    };

                    if (columns) {
                        for (const col of columns) {
                            const score = scoreValue(item[col.key as keyof T]);
                            if (score > maxScore) maxScore = score;
                        }
                    } else {
                        maxScore = scoreValue(currentDisplay);
                    }

                    return { item, score: maxScore };
                });

                result = scoredResults
                    .filter(x => x.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .map(x => x.item);
            }
        }

        return result;
    }, [searchTerm, value, options, filterFunction, columns, isOpen]);

    useEffect(() => {
        setActiveIndex(0);
    }, [filteredOptions.length]);

    // Update Dropdown Position dynamically
    const updatePosition = () => {
        if (inputWrapperRef.current && isOpen) {
            const rect = inputWrapperRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                minWidth: rect.width,
                width: 'max-content',
                maxWidth: `min(100vw - 32px, max(${rect.width}px, 600px))`
            });
        }
    };

    useLayoutEffect(() => {
        updatePosition();
        if (isOpen) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                !(listRef.current?.closest('.combobox-portal') as HTMLElement)?.contains(event.target as Node)
            ) {
                // Khi mất focus, revert lại `value` nếu string nhập vào không hợp lệ
                if (isOpen) {
                    const matched = options.find(o => getDisplayValue(o) === searchTerm);
                    if (!matched) {
                        setSearchTerm(value);
                    } else {
                        handleSelect(matched);
                    }
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, searchTerm, options, value]);

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
        const valueToPass = String(item.id ?? item.code ?? display);
        setSearchTerm(display);
        onChange(valueToPass, item);
        setIsOpen(false);
        // inputRef.current?.blur(); // REMOVED: Let focus flow naturally
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (!isOpen) setIsOpen(true);
        
        if (onSearch) {
            onSearch(val);
        }
        
        onChange(val, undefined);
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
            // If closed, don't prevent default, allow global "Enter as Tab" to work
        }
        else if (e.key === 'Tab') {
            if (isOpen && filteredOptions.length > 0) {
                handleSelect(filteredOptions[activeIndex]);
            }
            setIsOpen(false);
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            setSearchTerm(value);
            setIsOpen(false);
        }
    };

    const dropdownMenu = (
        <div
            style={dropdownStyle}
            className="combobox-portal z-[99999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg ring-1 ring-black/5 animate-fade-in flex flex-col"
        >
            {columns && filteredOptions.length > 0 && (
                <div className="flex items-center bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-600 px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {columns.map((col, idx) => (
                        <div key={idx} style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1, minWidth: 0 }} className={`px-2 ${col.className || ''}`}>
                            {col.label}
                        </div>
                    ))}
                </div>
            )}

            <ul ref={listRef} className="max-h-72 overflow-y-auto overflow-x-hidden custom-scrollbar rounded-b-md p-1.5 text-sm">
                {filteredOptions.length > 0 ? (
                    <>
                    {filteredOptions.slice(0, 100).map((option, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <li
                                key={index}
                                className={`px-3 py-2 cursor-pointer transition-all duration-150 rounded-md mb-[2px] last:mb-0
                                    ${isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-medium'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
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
                                                style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1, minWidth: 0 }}
                                                className={`px-2 py-1 items-center flex break-words whitespace-normal ${col.className || ''}`}
                                            >
                                                {col.render ? col.render(option) : (
                                                    <HighlightedText text={String(option[col.key as keyof T] || '')} highlight={searchTerm} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="block whitespace-normal break-words pr-2 py-1">
                                        <HighlightedText text={getDisplayValue(option)} highlight={searchTerm} />
                                    </span>
                                )}
                            </li>
                        );
                    })}
                        {filteredOptions.length > 100 && (
                            <li className="px-3 py-2 text-center text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 rounded-md mt-1 italic pointer-events-none">
                                Đang hiển thị 100 / {filteredOptions.length} kết quả. Vui lòng gõ thêm để lọc...
                            </li>
                        )}
                    </>
                ) : (
                    <li className="px-4 py-5 italic text-center text-slate-400 dark:text-slate-500 text-sm">
                        {searchTerm ? 'Không tìm thấy kết quả.' : 'Nhập từ khóa để tìm kiếm...'}
                    </li>
                )}
            </ul>
        </div>
    );

    const hasHeightClass = className.includes('h-');

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="enterprise-label">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div ref={inputWrapperRef} className={`relative group flex items-center ${!hasHeightClass ? 'h-8' : 'h-full'}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <SearchIcon className={`h-4 w-4 transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    name={name}
                    value={searchTerm || ''}
                    onChange={handleInputChange}
                    onClick={(e) => {
                        (e.target as HTMLInputElement).select();
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        isFocused.current = true;
                        setIsOpen(true);
                    }}
                    onBlur={() => {
                        isFocused.current = false;
                        // Delayed to allow click on dropdown items
                        setTimeout(() => {
                            if (!isFocused.current) setIsOpen(false);
                        }, 200);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    autoComplete="off"
                    className={`enterprise-input !pl-9 !pr-14 transition-all !h-full ${isOpen ? '!border-blue-500 !ring-1 !ring-blue-500' : ''}`}
                />

                {searchTerm && !disabled && (
                    <div
                        className="absolute inset-y-0 right-7 flex items-center px-1 cursor-pointer text-slate-400 hover:text-red-500 z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSearchTerm('');
                            onChange('', undefined);
                            inputRef.current?.focus();
                            setIsOpen(true);
                        }}
                        title="Xóa"
                    >
                        <XIcon className="w-4 h-4" />
                    </div>
                )}

                {isLoading && (
                    <div className="absolute inset-y-0 right-7 flex items-center px-1 pointer-events-none z-10 text-blue-500">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                <div
                    className={`absolute inset-y-0 right-0 flex items-center px-1.5 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10 ${disabled ? 'pointer-events-none' : ''}`}
                    onClick={() => {
                        if (!disabled) {
                            if (!isOpen) {
                                inputRef.current?.focus();
                                inputRef.current?.select();
                            }
                            setIsOpen(!isOpen);
                        }
                    }}
                >
                    <ChevronRightIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90 text-blue-500' : ''}`} />
                </div>
            </div>

            {/* Render Dropdown outside of the DOM tree to prevent clipping */}
            {isOpen && !disabled && typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
        </div>
    );
}

export default Combobox;
