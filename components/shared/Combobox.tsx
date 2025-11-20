
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronRightIcon, SearchIcon, XIcon } from '../Icons';

// Generic interface để Combobox có thể làm việc với cả string[] hoặc Object[]
interface ComboboxProps<T> {
    label?: string;
    value?: string; // Giá trị hiển thị trong ô input
    onChange: (value: string, item?: T) => void; // Trả về string cho input và cả object gốc (nếu cần)
    options: T[];
    placeholder?: string;
    className?: string;
    required?: boolean;
    name?: string;
    
    // Các props tùy chỉnh nâng cao
    displayValue?: (item: T) => string; // Hàm lấy giá trị hiển thị từ object (VD: item => item.name)
    filterFunction?: (item: T, query: string) => boolean; // Hàm lọc tùy chỉnh
    renderItem?: (item: T, isSelected: boolean) => React.ReactNode; // Hàm render giao diện từng dòng (hiển thị nhiều cột)
    keyExtractor?: (item: T) => string | number; // Hàm lấy key unique
}

function Combobox<T extends string | Record<string, any>>({ 
    label, 
    value = '', 
    onChange, 
    options = [], 
    placeholder = 'Chọn hoặc nhập...', 
    className = '',
    required = false,
    name,
    displayValue,
    filterFunction,
    renderItem,
    keyExtractor
}: ComboboxProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value);
    const [activeIndex, setActiveIndex] = useState(-1); // Index của mục đang được highlight
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Đồng bộ state khi prop value thay đổi từ bên ngoài
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    // Xử lý logic mặc định nếu không truyền props tùy chỉnh
    const getDisplayValue = (item: T): string => {
        if (displayValue) return displayValue(item);
        if (typeof item === 'string') return item;
        return (item as any).label || (item as any).name || JSON.stringify(item);
    };

    const getKey = (item: T, index: number): string | number => {
        if (keyExtractor) return keyExtractor(item);
        if (typeof item === 'string') return item;
        return (item as any).id || (item as any).code || index;
    };

    const defaultFilter = (item: T, query: string) => {
        const text = getDisplayValue(item).toLowerCase();
        return text.includes(query.toLowerCase());
    };

    // Filter options
    const filteredOptions = useMemo(() => {
        const filterFn = filterFunction || defaultFilter;
        // Nếu ô input trống, hiển thị tất cả (hoặc giới hạn 20 mục đầu tiên để đỡ lag)
        if (!searchTerm && isOpen) return options; 
        return options.filter(opt => filterFn(opt, searchTerm));
    }, [searchTerm, options, filterFunction, isOpen]);

    // Reset active index khi danh sách lọc thay đổi
    useEffect(() => {
        setActiveIndex(filteredOptions.length > 0 ? 0 : -1);
    }, [filteredOptions.length]);

    // Click outside để đóng
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Khi click ra ngoài, nếu text hiện tại khớp chính xác với 1 option thì giữ nguyên
                // Nếu không khớp, vẫn giữ text (cho phép free-text)
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll mục active vào vùng nhìn thấy
    useEffect(() => {
        if (isOpen && listRef.current && activeIndex >= 0) {
            const listNode = listRef.current;
            const activeNode = listNode.children[activeIndex] as HTMLElement;
            if (activeNode) {
                const listTop = listNode.scrollTop;
                const listBottom = listTop + listNode.clientHeight;
                const nodeTop = activeNode.offsetTop;
                const nodeBottom = nodeTop + activeNode.clientHeight;

                if (nodeTop < listTop) {
                    listNode.scrollTop = nodeTop;
                } else if (nodeBottom > listBottom) {
                    listNode.scrollTop = nodeBottom - listNode.clientHeight;
                }
            }
        }
    }, [activeIndex, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onChange(newValue, undefined); // Báo ra ngoài là text đã đổi, chưa có object cụ thể
        setIsOpen(true);
    };

    const handleSelect = (item: T) => {
        const display = getDisplayValue(item);
        setSearchTerm(display);
        onChange(display, item); // Báo ra ngoài cả text và object đầy đủ
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSearchTerm('');
        onChange('', undefined);
        inputRef.current?.focus();
    };

    // Xử lý bàn phím "Thần thánh"
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[activeIndex]);
                } else if (filteredOptions.length === 1) {
                    // Nếu chỉ có 1 kết quả duy nhất thì chọn luôn dù chưa highlight
                    handleSelect(filteredOptions[0]);
                } else {
                     // Enter khi không chọn gì -> đóng dropdown
                     setIsOpen(false);
                }
                break;
            case 'Tab':
                // Tab hoạt động giống Enter nếu đang có item active
                if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[activeIndex]);
                    // Không preventDefault để Tab vẫn chuyển focus sang input kế tiếp
                } else {
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between">
                    <span>{label} {required && <span className="text-red-500">*</span>}</span>
                    {/* Hiển thị hint nhỏ nếu đang focus */}
                    {isOpen && filteredOptions.length > 0 && (
                        <span className="text-[10px] font-normal text-slate-400 animate-pulse">
                            Dùng phím mũi tên ⇵ và Enter để chọn
                        </span>
                    )}
                </label>
            )}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
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
                    autoComplete="off"
                    className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-slate-400"
                />
                {searchTerm && (
                    <div 
                        className="absolute inset-y-0 right-6 flex items-center px-1 cursor-pointer text-slate-400 hover:text-red-500"
                        onClick={handleClear}
                        title="Xóa nội dung"
                    >
                        <XIcon className="w-4 h-4" />
                    </div>
                )}
                <div 
                    className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => {
                        if (!isOpen) inputRef.current?.focus();
                        setIsOpen(!isOpen);
                    }}
                >
                    <ChevronRightIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                </div>
            </div>
            
            {/* Dropdown List */}
            {isOpen && (
                <ul 
                    ref={listRef}
                    className="absolute z-[100] w-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl max-h-72 overflow-auto focus:outline-none animate-fade-in custom-scrollbar ring-1 ring-black/5"
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => {
                            const isActive = index === activeIndex;
                            return (
                                <li
                                    key={getKey(option, index)}
                                    className={`px-3 py-2.5 text-sm cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors duration-75
                                        ${isActive 
                                            ? 'bg-blue-50 dark:bg-blue-900/40 text-primary dark:text-primary-light' 
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }
                                    `}
                                    onClick={() => handleSelect(option)}
                                    onMouseEnter={() => setActiveIndex(index)} // Mouse hover updates active index for hybrid usage
                                >
                                    {renderItem ? (
                                        renderItem(option, isActive)
                                    ) : (
                                        // Default render: highlight matched text if simple string
                                        <span className="block truncate">{getDisplayValue(option)}</span>
                                    )}
                                </li>
                            );
                        })
                    ) : (
                        <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 italic text-center">
                            {searchTerm ? 'Không tìm thấy kết quả nào.' : 'Bắt đầu nhập để tìm kiếm...'}
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}

export default Combobox;
