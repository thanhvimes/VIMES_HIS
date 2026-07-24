
/**
 * VIETNAMESE FORMATTERS UTILITY
 * Thư viện dùng chung cho toàn bộ hệ thống VIMES HIS
 */

// --- 1. DATE & TIME (THỜI GIAN) ---

/**
 * Chuyển đổi input bất kỳ thành đối tượng Date hợp lệ
 * Hỗ trợ fix lỗi Safari với định dạng 'dd/mm/yyyy'
 */
const parseDateSafe = (input: string | Date | undefined | null): Date | null => {
    if (!input) return null;
    if (input instanceof Date) return input;

    // Fix cho Safari: Nếu chuỗi là dd/mm/yyyy, convert thủ công
    if (typeof input === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(input)) {
        const parts = input.split('/');
        // parts[0] = day, parts[1] = month, parts[2] = year
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    
    const date = new Date(input);
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Định dạng ngày: dd/mm/yyyy (Ví dụ: 25/11/2023)
 */
export const formatDate = (dateInput: string | Date | undefined | null): string => {
    const date = parseDateSafe(dateInput);
    if (!date) return '---';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};

/**
 * Định dạng ngày giờ: HH:mm dd/mm/yyyy (Ví dụ: 14:30 25/11/2023)
 */
export const formatDateTime = (dateInput: string | Date | undefined | null): string => {
    const date = parseDateSafe(dateInput);
    if (!date) return '---';

    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${time} ${day}/${month}/${year}`;
};

/**
 * Tính tuổi từ ngày sinh
 */
export const calculateAge = (dob: string | Date | undefined): number => {
    const birthDate = parseDateSafe(dob);
    if (!birthDate) return 0;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age > 0 ? age : 0;
};

/**
 * Chuẩn hóa input date cho thẻ <input type="date"> (yyyy-mm-dd)
 */
export const formatDateForInput = (dateInput: string | Date | undefined | null): string => {
    const date = parseDateSafe(dateInput);
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${year}-${month}-${day}`;
};

// --- 2. NUMBER & CURRENCY (SỐ & TIỀN TỆ) ---

/**
 * Định dạng số theo chuẩn Việt Nam: 1.000.000,50
 * - Ngàn: dấu chấm (.)
 * - Thập phân: dấu phẩy (,)
 */
export const formatNumber = (num: number | string | undefined | null, decimals: number = 0): string => {
    if (num === undefined || num === null || num === '') return '0';
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return '0';

    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

/**
 * Định dạng tiền tệ: 1.000.000 đ
 */
export const formatCurrency = (num: number | string | undefined | null): string => {
    return formatNumber(num) + ' đ';
};


// --- 3. NUMBER TO TEXT (ĐỌC SỐ THÀNH CHỮ) ---

const DOC_SO = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const DOC_HANG = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

const doc3So = (so: number) => {
    const tram = Math.floor(so / 100);
    const chuc = Math.floor((so % 100) / 10);
    const donvi = so % 10;
    let ketqua = "";

    // Hàng trăm
    if (tram === 0 && chuc === 0 && donvi === 0) return ""; // 000 bỏ qua
    ketqua += DOC_SO[tram] + " trăm";

    // Hàng chục
    if (chuc === 0 && donvi !== 0) {
        ketqua += " linh " + DOC_SO[donvi];
    } else if (chuc === 1) {
        ketqua += " mười";
        if (donvi === 1) ketqua += " một";
        else if (donvi === 5) ketqua += " lăm";
        else if (donvi !== 0) ketqua += " " + DOC_SO[donvi];
    } else if (chuc > 1) {
        ketqua += " " + DOC_SO[chuc] + " mươi";
        if (donvi === 1) ketqua += " mốt";
        else if (donvi === 4) ketqua += " tư"; // 24 -> hai mươi tư
        else if (donvi === 5) ketqua += " lăm";
        else if (donvi !== 0) ketqua += " " + DOC_SO[donvi];
    }
    
    // Xử lý riêng trường hợp số < 100 (VD: 15 -> mười lăm, ko phải không trăm mười lăm)
    // Tuy nhiên logic trên đang đọc đầy đủ cho nhóm 3 số. Hàm wrapper sẽ xử lý cắt chuỗi thừa.
    return ketqua;
};

/**
 * Đọc số tiền thành chữ tiếng Việt (Dùng cho hóa đơn)
 * VD: 105000 -> Một trăm linh năm nghìn đồng
 */
export const readMoneyToText = (number: number): string => {
    if (!number || number === 0) return "Không đồng";

    let str = Math.abs(number).toString();
    let i = 0;
    let arr = [];
    let index = str.length;
    let result = [];
    
    if (index === 0 || str === 'NaN') return "";

    // Chia chuỗi số thành các nhóm 3 số
    while (index >= 0) {
        arr.push(str.substring(Math.max(0, index - 3), index));
        index -= 3;
    }

    // Đọc từng nhóm
    for (i = arr.length - 1; i >= 0; i--) {
        if (arr[i] !== "" && arr[i] !== "000") {
            const num = parseInt(arr[i]);
            let text = doc3So(num);
            
            // Xử lý "lẻ/linh" ở đầu nếu cần thiết (tùy chỉnh sau)
            
            result.push(text);
            result.push(DOC_HANG[i]); // Thêm đơn vị (nghìn, triệu...)
        }
    }
    
    // Gép chuỗi
    let finalString = result.join(" ").trim();
    
    // Tinh chỉnh ngữ pháp
    finalString = finalString.replace(/không trăm lẻ/g, "lẻ"); // miền Nam hay dùng lẻ
    finalString = finalString.replace(/không trăm linh/g, "linh"); // miền Bắc hay dùng linh
    finalString = finalString.replace(/mươi một/g, "mươi mốt");
    
    // Viết hoa chữ cái đầu
    finalString = finalString.charAt(0).toUpperCase() + finalString.slice(1);
    
    return finalString + " đồng chẵn";
};

// --- 4. STRING UTILS (XỬ LÝ CHUỖI) ---

/**
 * Xóa dấu tiếng Việt (Dùng cho tìm kiếm)
 * VD: "Nguyễn Văn A" -> "Nguyen Van A"
 */
export const removeVietnameseTones = (str: string): string => {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
};

/**
 * Chuẩn hóa tên riêng (Title Case)
 * VD: "nguyễn văn a" -> "Nguyễn Văn A"
 */
export const normalizeName = (name: string): string => {
    if (!name) return '';
    return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Lấy chữ cái đầu của tên (Avatar)
 * VD: "Nguyễn Văn A" -> "NVA"
 */
export const getInitials = (name: string): string => {
    if (!name) return '';
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 3); // Lấy tối đa 3 ký tự
};
