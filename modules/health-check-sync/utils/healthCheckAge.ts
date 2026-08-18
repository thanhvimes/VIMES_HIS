export type NewHealthCheckAgeGroup = 'UNDER_6' | 'AGE_6_TO_UNDER_18' | 'ADULT_18_PLUS';

export function resolveNewHealthCheckAgeGroup(dob: string, examDate = new Date()): NewHealthCheckAgeGroup | null {
    const birth = new Date(`${dob}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return null;
    let age = examDate.getFullYear() - birth.getFullYear();
    if (examDate.getMonth() < birth.getMonth() || (examDate.getMonth() === birth.getMonth() && examDate.getDate() < birth.getDate())) age--;
    if (age < 6) return 'UNDER_6';
    if (age < 18) return 'AGE_6_TO_UNDER_18';
    return 'ADULT_18_PLUS';
}

export function validateNewFormAge(formType: string, dob: string): string | null {
    const group = resolveNewHealthCheckAgeGroup(dob);
    const expected = ({ '1': 'UNDER_6', '2': 'AGE_6_TO_UNDER_18', '3': 'ADULT_18_PLUS' } as Record<string, string>)[formType];
    return group && expected && group !== expected ? 'Ngày sinh không phù hợp với nhóm tuổi của mẫu đã chọn' : null;
}
