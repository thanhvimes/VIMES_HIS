import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRightIcon, SearchIcon, XIcon, CheckIcon } from '../Icons';
import { useTheme } from '../../contexts/ThemeContext';

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
    const { fontSettings } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value);
    const [activeIndex, setActiveIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    // MUST be defined before useEffect that uses it
    const getDisplayValue = (item: T): string => {
        if (displayValue) return displayValue(item);
        return item.name || item.label || item.code || JSON.stringify(item);
    };

    // Resolve display name from options when value is an ID (e.g., "8026" → "Bình Phước")
    // Runs when value OR options change, handling the race condition where options load after value
    useEffect(() => {
        if (value && options.length > 0) {
            const strVal = String(value);
            const matched = options.find(o => {
                const oId = String(o.id ?? o.code ?? '');
                const oName = getDisplayValue(o);
                return oId === strVal || oName === strVal;
            });
            if (matched) {
                setSearchTerm(getDisplayValue(matched));
                return;
            }
        }
        setSearchTerm(value);
    }, [value, options]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm && !isOpen) return options;
        const query = searchTerm.toLowerCase();

        if (filterFunction) {
            return options.filter(opt => filterFunction(opt, query));
        }

        return options.filter(item => {
            if (displayValue && displayValue(item) === searchTerm) return true;

            if (columns) {
                return columns.some(col => {
                    const val = item[col.key as keyof T];
                    return String(val || '').toLowerCase().includes(query);
                });
            }
            return getDisplayValue(item).toLowerCase().includes(query);
        });
    }, [searchTerm, options, filterFunction, columns, isOpen]);

    useEffect(() => {
        setActiveIndex(0);
    }, [filteredOptions.length]);

    // Update Dropdown Position dynamically
    const updatePosition = () => {
        if (containerRef.current && isOpen) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownStyle({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
                // Optional: Thêm logic đảo list lên trên nếu không đủ chỗ trống phía dưới
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

    // Click outside handler
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
        inputRef.current?.blur();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);
        onChange(e.target.value, undefined);
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
            e.preventDefault();
            if (isOpen && filteredOptions.length > 0) {
                handleSelect(filteredOptions[activeIndex]);
            }
        }
        else if (e.key === 'Tab') {
            if (isOpen && filteredOptions.length > 0) {
                handleSelect(filteredOptions[activeIndex]);
            }
            setIsOpen(false);
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            setSearchTerm(value); // Revert
            setIsOpen(false);
        }
    };

    const dropdownMenu = (
        <div
            style={dropdownStyle}
            className="combobox-portal absolute z-[99999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden ring-1 ring-black/5 animate-fade-in"
        >
            {columns && filteredOptions.length > 0 && (
                <div className={`flex items-center bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-600 px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${fontSettings.listSecondary}`}>
                    {columns.map((col, idx) => (
                        <div key={idx} style={{ width: col.width || 'flex-1', flex: col.width ? 'none' : 1 }} className={`px-2 ${col.className || ''}`}>
                            {col.label}
                        </div>
                    ))}
                </div>
            )}

            <ul ref={listRef} className={`max-h-80 overflow-auto custom-scrollbar ${fontSettings.listSecondary}`}>
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <li
                                key={index}
                                className={`px-3 py-2.5 cursor-pointer border-b border-slate-50 dark:border-slate-700/30 last:border-0 transition-colors duration-75
                                    ${isActive
                                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 font-medium'
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
                    <li className="px-4 py-6 italic text-center text-slate-500 dark:text-slate-400">
                        {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Nhập từ khóa để tìm kiếm...'}
                    </li>
                )}
            </ul>
        </div>
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className={`block font-bold text-slate-700 dark:text-slate-300 mb-1.5 ${fontSettings.controls}`}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative group flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <SearchIcon className={`h-5 w-5 transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    name={name}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onClick={(e) => {
                        (e.target as HTMLInputElement).select(); // Nhấn vào tự động bôi đen để gõ nhanh
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    autoComplete="off"
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all placeholder-slate-400 focus:outline-none
                        ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'}
                        ${disabled ? 'bg-slate-100 dark:bg-slate-900 cursor-not-allowed opacity-75' : ''}
                        ${fontSettings.controls}
                    `}
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
                <div
                    className={`absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10 ${disabled ? 'pointer-events-none' : ''}`}
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
                    <ChevronRightIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-90 text-blue-500' : ''}`} />
                </div>
            </div>

            {/* Render Dropdown outside of the DOM tree to prevent clipping */}
            {isOpen && !disabled && typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
        </div>
    );
}

export default Combobox;
