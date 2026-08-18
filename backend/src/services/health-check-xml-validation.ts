export interface XmlEnvelopeValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateHealthCheckEnvelope(xml: string): XmlEnvelopeValidationResult {
    const errors: string[] = [];
    if (!xml || !xml.trim()) return { valid: false, errors: ['XML không được để trống'] };
    if (!/<KHAMSUCKHOE\b[^>]*>[\s\S]*<\/KHAMSUCKHOE>/.test(xml)) errors.push('Thiếu phần tử gốc KHAMSUCKHOE');
    if (!/<THONGTINDONVI>[\s\S]*<\/THONGTINDONVI>/.test(xml)) errors.push('Thiếu THONGTINDONVI');
    if (!/<THONGTINHOSO>[\s\S]*<\/THONGTINHOSO>/.test(xml)) errors.push('Thiếu THONGTINHOSO');
    if (!/<DANHSACHHOSO>[\s\S]*<\/DANHSACHHOSO>/.test(xml)) errors.push('Thiếu DANHSACHHOSO');
    if (!/<MACSKCB>\s*\d{5,13}\s*<\/MACSKCB>/.test(xml)) errors.push('MACSKCB không hợp lệ hoặc bị thiếu');

    const files = [...xml.matchAll(/<FILEHOSO>[\s\S]*?<\/FILEHOSO>/g)].map(match => match[0]);
    if (files.length === 0) errors.push('Danh sách hồ sơ không có FILEHOSO');
    files.forEach((file, index) => {
        if (!/<LOAIHOSO>\s*XML\d+\s*<\/LOAIHOSO>/.test(file)) errors.push(`FILEHOSO thứ ${index + 1} thiếu LOAIHOSO hợp lệ`);
        if (!/<NOIDUNGFILE>[\s\S]*<\/NOIDUNGFILE>/.test(file)) errors.push(`FILEHOSO thứ ${index + 1} thiếu NOIDUNGFILE`);
    });

    const countMatch = xml.match(/<SOLUONGHOSO>\s*(\d+)\s*<\/SOLUONGHOSO>/);
    if (!countMatch) errors.push('Thiếu SOLUONGHOSO');
    else if (Number(countMatch[1]) !== files.length) errors.push('SOLUONGHOSO không khớp số FILEHOSO');
    if (!/<LOAIHOSO>\s*XML1\s*<\/LOAIHOSO>/.test(xml)) errors.push('Thiếu XML1 thông tin hành chính');
    if (!/<LOAIHOSO>\s*XML2\s*<\/LOAIHOSO>/.test(xml)) errors.push('Thiếu XML2 thông tin lần khám');
    if (!/<LOAIHOSO>\s*XML12\s*<\/LOAIHOSO>/.test(xml)) errors.push('Thiếu XML12 kết luận');
    const typeValues = [...xml.matchAll(/<TYPE>\s*([^<]+?)\s*<\/TYPE>/g)].map(match => match[1]);
    typeValues.forEach(type => {
        if (!['ChildUnder', 'Minor', 'Adult', 'Driver'].includes(type)) errors.push(`TYPE không hợp lệ: ${type}`);
    });
    const fundingValues = [...xml.matchAll(/<NGUON_CHI_TRA>\s*([^<]+?)\s*<\/NGUON_CHI_TRA>/g)].map(match => match[1]);
    fundingValues.forEach(value => {
        if (!['1', '2', '3', '4', '5', '9'].includes(value)) errors.push(`NGUON_CHI_TRA không hợp lệ: ${value}`);
    });
    const linkCodes = [...xml.matchAll(/<MA_LK>\s*([^<]*?)\s*<\/MA_LK>/g)].map(match => match[1]);
    if (linkCodes.some(value => !value)) errors.push('MA_LK không được để trống');
    const examDates = [...xml.matchAll(/<NGAY_VAO>\s*([^<]*?)\s*<\/NGAY_VAO>/g)].map(match => match[1]);
    if (examDates.some(value => !/^\d{12}$/.test(value))) errors.push('NGAY_VAO phải có định dạng YYYYMMDDHHmm');
    return { valid: errors.length === 0, errors };
}
