
import React, { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    required?: boolean;
    labelClassName?: string;
    containerClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = memo(({ label, required, labelClassName = '', containerClassName = '', ...props }) => {
    const { fontSettings } = useTheme();

    return (
        <div className={containerClassName}>
            {label && (
                <label className={`enterprise-label ${labelClassName}`}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                {...props}
                readOnly={props.readOnly || true}
                onFocus={(e) => {
                    const target = e.target;
                    if (!props.readOnly) {
                        setTimeout(() => {
                            target.readOnly = false;
                            target.setAttribute('autocomplete', 'one-time-code');
                        }, 50);
                    }
                    if (props.onFocus) props.onFocus(e);
                }}
                autoComplete="one-time-code"
                autoCorrect="off"
                spellCheck={false}
                className={`enterprise-input ${props.className || ''}`}
            />
        </div>
    );
});

/**
 * COMPONENT CHUẨN: Nhập ngày tháng VN (dd/mm/yyyy)
 * Ưu điểm: Tự động format, không nhảy con trỏ, dễ dàng sửa xóa ở giữa.
 */
export const FormDateInput: React.FC<FormInputProps> = memo(({ label, required, labelClassName = '', containerClassName = '', onChange, value, ...props }) => {
    const { fontSettings } = useTheme();
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Chuyển từ YYYY-MM-DD sang dd/mm/yyyy để hiển thị
    const displayValue = React.useMemo(() => {
        if (!value || typeof value !== 'string') return '';
        if (value.includes('-')) {
            const parts = value.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return value;
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Nếu nhấn Backspace khi đang đứng ngay sau dấu '/', thì xóa luôn ký tự trước dấu '/'
        if (e.key === 'Backspace' && inputRef.current) {
            const { selectionStart, selectionEnd, value: curVal } = inputRef.current;
            if (selectionStart === selectionEnd && (selectionStart === 3 || selectionStart === 6)) {
                if (curVal[selectionStart - 1] === '/') {
                    // Để mặc định Backspace xử lý xóa dấu '/', nhưng ta muốn nó xóa số trước đó
                    // Tuy nhiên để đơn giản, ta cứ để nó xóa '/', logic handleInput sẽ lo phần format lại
                }
            }
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const rawValue = input.value;
        const originalCursor = input.selectionStart || 0;

        // Đếm số lượng chữ số đứng trước vị trí con trỏ hiện tại
        const digitsBeforeCursor = rawValue.slice(0, originalCursor).replace(/\D/g, '');
        // Lấy toàn bộ chữ số (tối đa 8)
        const allDigits = rawValue.replace(/\D/g, '').slice(0, 8);

        let formatted = '';
        if (allDigits.length > 0) {
            let day = allDigits.slice(0, 2);
            let month = allDigits.slice(2, 4);
            let year = allDigits.slice(4, 8);

            // Ràng buộc giá trị hợp lệ
            if (day.length === 2 && parseInt(day) > 31) day = '31';
            if (day.length === 2 && parseInt(day) === 0) day = '01';
            if (month.length === 2 && parseInt(month) > 12) month = '12';
            if (month.length === 2 && parseInt(month) === 0) month = '01';

            formatted = day;
            if (allDigits.length > 2) formatted += '/' + month;
            if (allDigits.length > 4) formatted += '/' + year;
        }

        // Tính toán vị trí con trỏ mới dựa trên số lượng chữ số đã nhập
        // Mỗi lần vượt qua mốc 2 hoặc 4 chữ số, ta cần cộng thêm 1 hoặc 2 cho các dấu '/'
        let newCursor = digitsBeforeCursor.length;
        if (digitsBeforeCursor.length > 2) newCursor += 1; // Dấu / thứ nhất
        if (digitsBeforeCursor.length > 4) newCursor += 1; // Dấu / thứ hai

        // Đồng nhất state theo chuẩn YYYY-MM-DD nếu đủ 10 ký tự
        if (onChange) {
            let finalValue = formatted;
            if (formatted.length === 10) {
                const parts = formatted.split('/');
                finalValue = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }

            onChange({
                target: {
                    name: props.name,
                    value: finalValue
                }
            } as any);
        }

        // Khôi phục vị trí con trỏ sau khi React cập nhật DOM
        // Dùng requestAnimationFrame để đảm bảo chạy ngay sau khi browser paint
        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(newCursor, newCursor);
            }
        });
    };

    return (
        <div className={containerClassName}>
            {label && (
                <label className={`enterprise-label ${labelClassName}`}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                {...props}
                ref={inputRef}
                type="text"
                placeholder="dd/mm/yyyy"
                value={displayValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={(e) => {
                    if (!props.readOnly) e.target.select();
                }}
                autoComplete="off"
                className={`enterprise-input ${props.className || ''}`}
            />
        </div>
    );
});


interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    required?: boolean;
    labelClassName?: string;
    containerClassName?: string;
    children: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = memo(({ label, required, children, labelClassName = '', containerClassName = '', ...props }) => {
    const { fontSettings } = useTheme();

    return (
        <div className={containerClassName}>
            {label && (
                <label className={`enterprise-label ${labelClassName}`}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <select
                {...props}
                className={`enterprise-input appearance-none ${props.className || ''}`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
            >
                {children}
            </select>
        </div>
    );
});

interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    required?: boolean;
    labelClassName?: string;
    containerClassName?: string;
}

export const FormTextArea: React.FC<FormTextAreaProps> = memo(({ label, required, labelClassName = '', containerClassName = '', ...props }) => {
    return (
        <div className={containerClassName}>
            {label && (
                <label className={`enterprise-label ${labelClassName}`}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <textarea
                {...props}
                className={`enterprise-input min-h-[80px] py-2 ${props.className || ''}`}
            />
        </div>
    );
});

export const FormDateTimeInput: React.FC<FormInputProps> = memo(({ label, required, labelClassName = '', containerClassName = '', onChange, value, ...props }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Chuyển từ YYYY-MM-DDTHH:mm sang dd/mm/yyyy HH:mm
    const displayValue = React.useMemo(() => {
        if (!value || typeof value !== 'string') return '';
        if (value.includes('T')) {
            const [datePart, timePart] = value.split('T');
            const [y, m, d] = datePart.split('-');
            return `${d}/${m}/${y} ${timePart}`;
        }
        return value;
    }, [value]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const rawValue = input.value;
        const originalCursor = input.selectionStart || 0;

        const digits = rawValue.replace(/\D/g, '').slice(0, 12);
        const digitsBeforeCursor = rawValue.slice(0, originalCursor).replace(/\D/g, '');

        let formatted = '';
        if (digits.length > 0) {
            let d = digits.slice(0, 2);
            let m = digits.slice(2, 4);
            let y = digits.slice(4, 8);
            let hh = digits.slice(8, 10);
            let mm = digits.slice(10, 12);

            if (d.length === 2 && parseInt(d) > 31) d = '31';
            if (m.length === 2 && parseInt(m) > 12) m = '12';
            if (hh.length === 2 && parseInt(hh) > 23) hh = '23';
            if (mm.length === 2 && parseInt(mm) > 59) mm = '59';

            formatted = d;
            if (digits.length > 2) formatted += '/' + m;
            if (digits.length > 4) formatted += '/' + y;
            if (digits.length > 8) formatted += ' ' + hh;
            if (digits.length > 10) formatted += ':' + mm;
        }

        let newCursor = digitsBeforeCursor.length;
        if (digitsBeforeCursor.length > 2) newCursor += 1; // /
        if (digitsBeforeCursor.length > 4) newCursor += 1; // /
        if (digitsBeforeCursor.length > 8) newCursor += 1; // space
        if (digitsBeforeCursor.length > 10) newCursor += 1; // :

        if (onChange) {
            let finalValue = formatted;
            if (digits.length === 12) {
                const d = digits.slice(0, 2);
                const m = digits.slice(2, 4);
                const y = digits.slice(4, 8);
                const hh = digits.slice(8, 10);
                const mm = digits.slice(10, 12);
                finalValue = `${y}-${m}-${d}T${hh}:${mm}`;
            }
            onChange({ target: { name: props.name, value: finalValue } } as any);
        }

        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(newCursor, newCursor);
            }
        });
    };

    return (
        <div className={containerClassName}>
            {label && (
                <label className={`enterprise-label ${labelClassName}`}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                {...props}
                ref={inputRef}
                type="text"
                placeholder="dd/mm/yyyy HH:mm"
                value={displayValue}
                onChange={handleInput}
                className={`enterprise-input ${props.className || ''}`}
            />
        </div>
    );
});
