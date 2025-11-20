
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRightIcon } from '../Icons';

interface ComboboxProps {
    label?: string;
    value?: string;
    onChange: (value: string) => void; // Now expects string for flexibility with custom inputs
    options: string[];
    placeholder?: string;
    className?: string;
    required?: boolean;
    name?: string;
}

const Combobox: React.FC<ComboboxProps> = ({ 
    label, 
    value = '', 
    onChange, 
    options, 
    placeholder = 'Chọn hoặc nhập...', 
    className = '',
    required = false,
    name
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value);
    const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
    const containerRef = useRef<HTMLDivElement>(null);

    // Update local state when external value changes (e.g., reset form)
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    // Filter options based on input
    useEffect(() => {
        const filtered = options.filter(opt => 
            opt.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOptions(filtered);
    }, [searchTerm, options]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        
        // Propagate change to parent immediately for "free text" support
        // We simulate an event object if the parent expects standard event handler, 
        // but here we simplified prop to just `onChange(value: string)` or we can adapt.
        // To keep it compatible with common form handlers that expect event:
        // Ideally parent handles simple string update or we construct a synthetic event.
        // Given the usage in Forms, let's stick to the simple string callback defined in Props.
        onChange(newValue);
        
        setIsOpen(true);
    };

    const handleOptionClick = (option: string) => {
        setSearchTerm(option);
        onChange(option);
        setIsOpen(false);
    };

    const handleFocus = () => {
        setIsOpen(true);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type="text"
                    name={name}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    required={required}
                    autoComplete="off"
                    className="w-full p-2 pr-8 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div 
                    className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <ChevronRightIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                </div>
            </div>
            
            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none animate-fade-in">
                    {filteredOptions.map((option, index) => (
                        <li
                            key={index}
                            className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                            onClick={() => handleOptionClick(option)}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
             {isOpen && filteredOptions.length === 0 && searchTerm && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg p-2 text-sm text-slate-500 dark:text-slate-400 italic">
                    Không tìm thấy trong danh mục. Nhấn Enter hoặc click ra ngoài để dùng giá trị này.
                </div>
            )}
        </div>
    );
};

export default Combobox;
