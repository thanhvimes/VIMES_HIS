import { resolveHealthCheckAgeGroup } from '../controllers/health-check/xml-generator';

export interface NewHealthCheckDocumentInput {
    formType?: string;
    dob?: string | Date;
    examDate?: string | Date;
    fundingSource?: string | number;
    fitnessClass?: string | number;
}

/** Validate minimum data required for a new QĐ 2062 three-group record. */
export function validateNewHealthCheckDocument(input: NewHealthCheckDocumentInput): string[] {
    const errors: string[] = [];
    if (!['1', '2', '3'].includes(String(input.formType || ''))) errors.push('Hồ sơ mới chỉ được sử dụng mẫu QĐ 2062: 1, 2 hoặc 3');
    const birthDate = input.dob ? new Date(input.dob) : null;
    if (!birthDate || Number.isNaN(birthDate.getTime())) errors.push('Ngày sinh là bắt buộc và phải hợp lệ');
    else if (birthDate.getTime() > new Date(input.examDate || new Date()).getTime()) errors.push('Ngày sinh không được lớn hơn ngày khám');
    const fundingSource = String(input.fundingSource ?? '').trim();
    if (!fundingSource) errors.push('Nguồn chi trả là bắt buộc');
    else if (!['1', '2', '3', '4', '5', '9'].includes(fundingSource)) errors.push('Nguồn chi trả không hợp lệ; chỉ chấp nhận mã 1, 2, 3, 4, 5 hoặc 9');
    const ageGroup = input.dob ? resolveHealthCheckAgeGroup(String(input.formType || ''), input.dob, input.examDate || new Date()) : null;
    const expectedGroupByForm: Record<string, string> = {
        '1': 'UNDER_6',
        '2': 'AGE_6_TO_UNDER_18',
        '3': 'ADULT_18_PLUS',
    };
    if (ageGroup && expectedGroupByForm[String(input.formType || '')] !== ageGroup) {
        errors.push('Ngày sinh không phù hợp với nhóm tuổi của mẫu đã chọn');
    }
    const fitnessClass = String(input.fitnessClass ?? '').trim();
    if (ageGroup !== 'UNDER_6' && !fitnessClass) errors.push('Phân loại sức khỏe là bắt buộc với nhóm từ đủ 6 tuổi');
    else if (fitnessClass && !['1', '2', '3', '4', '5'].includes(fitnessClass)) errors.push('Phân loại sức khỏe không hợp lệ; chỉ chấp nhận mã 1 đến 5');
    return errors;
}
