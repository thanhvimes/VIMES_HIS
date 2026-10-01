// =====================================================================
// Helper: Clinical Cross-Check for Health Examination (VIMES HIS)
// File: backend/src/services/health-check-clinical-cross-check.ts
// Thẩm định tính tương thích giữa Dấu hiệu sinh tồn, Khám thể lực, 
// các chuyên khoa lâm sàng và Phân loại sức khỏe chung (Thông tư 32/2023/TT-BYT)
// =====================================================================

export interface ClinicalCrossCheckParams {
    height?: string | number | null;
    weight?: string | number | null;
    bp?: string | null;
    pulse?: string | number | null;
    bmi?: string | number | null;
    fitnessClass?: string | null;
    isChild?: boolean;
    specialtiesPl?: Record<string, string | number | null | undefined>;
}

export interface ClinicalWarning {
    id: string;
    message: string;
    severity: 'warning' | 'info';
    source: 'VITALS_BP' | 'VITALS_BMI' | 'VITALS_PULSE' | 'SPECIALTY_MISMATCH';
    suggestedMaxClass?: number;
}

export interface ClinicalCrossCheckResult {
    hasWarnings: boolean;
    hasSevereWarnings: boolean;
    warnings: ClinicalWarning[];
    calculatedBmi: number | null;
    suggestedMinClass: number;
}

const SPECIALTY_NAMES: Record<string, string> = {
    khamTheLucPl: 'Khám Thể lực',
    noiKhoaTuanHoanPl: 'Nội khoa (Tuần hoàn)',
    noiKhoaHoHapPl: 'Nội khoa (Hô hấp)',
    noiKhoaTieuHoaPl: 'Nội khoa (Tiêu hóa)',
    noiKhoaThanTietnieuPl: 'Nội khoa (Thận - Tiết niệu)',
    noiKhoaNoiTietPl: 'Nội khoa (Nội tiết)',
    noiKhoaCoXuongKhopPl: 'Nội khoa (Cơ xương khớp)',
    noiKhoaThanKinhPl: 'Nội khoa (Thần kinh)',
    noiKhoaTamThanPl: 'Nội khoa (Tâm thần)',
    khamNgoaiKhoaPl: 'Ngoại khoa',
    khamDaLieuPl: 'Da liễu',
    khamSanPhuKhoaPl: 'Sản phụ khoa',
    khamMatPl: 'Mắt',
    khamTaiMuiHongPl: 'Tai Mũi Họng',
    khamRangHamMatPl: 'Răng Hàm Mặt',
};

export function parseFitnessClassToNumber(val?: string | number | null): number | null {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') return val >= 1 && val <= 5 ? val : null;
    const str = String(val).trim().toUpperCase();

    // 1. Khớp số 1-5 trực tiếp hoặc có chữ Loại: "1", "Loại 2", v.v.
    const numMatch = str.match(/\b([1-5])\b/);
    if (numMatch) return parseInt(numMatch[1], 10);

    // 2. Bóc tách tiền tố "LOẠI" / "LOAI" để đối chiếu số La Mã
    const clean = str.replace(/^(?:LOẠI|LOAI)\s*/i, '').trim();
    if (clean === 'V') return 5;
    if (clean === 'IV') return 4;
    if (clean === 'III') return 3;
    if (clean === 'II') return 2;
    if (clean === 'I') return 1;

    return null;
}

export function getClinicalCrossCheckWarnings(params: ClinicalCrossCheckParams): ClinicalCrossCheckResult {
    const warnings: ClinicalWarning[] = [];
    const currentClass = parseFitnessClassToNumber(params.fitnessClass);
    let suggestedMinClass = 1;

    // 1. Tính toán & kiểm tra BMI
    let bmiValue: number | null = null;
    if (params.bmi && !isNaN(Number(params.bmi))) {
        bmiValue = Number(params.bmi);
    } else if (params.height && params.weight) {
        const hM = Number(params.height) / 100;
        const wKg = Number(params.weight);
        if (hM > 0 && wKg > 0) {
            bmiValue = Math.round((wKg / (hM * hM)) * 10) / 10;
        }
    }

    if (bmiValue && !params.isChild) {
        if (bmiValue >= 30.0) {
            suggestedMinClass = Math.max(suggestedMinClass, 3);
            if (currentClass !== null && currentClass < 3) {
                warnings.push({
                    id: 'BMI_OBESE_II',
                    message: `Chỉ số BMI = ${bmiValue} (Béo phì độ II/III theo chuẩn Châu Á). Khuyến nghị phân loại sức khỏe không cao hơn Loại III.`,
                    severity: 'warning',
                    source: 'VITALS_BMI',
                    suggestedMaxClass: 3,
                });
            }
        } else if (bmiValue >= 25.0) {
            suggestedMinClass = Math.max(suggestedMinClass, 2);
            if (currentClass !== null && currentClass === 1) {
                warnings.push({
                    id: 'BMI_OVERWEIGHT',
                    message: `Chỉ số BMI = ${bmiValue} (Tiền béo phì/Béo phì độ I). Khuyến nghị không xếp Loại I nếu chưa có đánh giá chế độ dinh dưỡng.`,
                    severity: 'info',
                    source: 'VITALS_BMI',
                    suggestedMaxClass: 2,
                });
            }
        } else if (bmiValue < 16.0) {
            suggestedMinClass = Math.max(suggestedMinClass, 3);
            if (currentClass !== null && currentClass < 3) {
                warnings.push({
                    id: 'BMI_SEVERELY_UNDERWEIGHT',
                    message: `Chỉ số BMI = ${bmiValue} (Thiếu năng lượng trường diễn nặng/Gầy độ III). Khuyến nghị không xếp Loại I hoặc Loại II.`,
                    severity: 'warning',
                    source: 'VITALS_BMI',
                    suggestedMaxClass: 3,
                });
            }
        } else if (bmiValue < 18.5) {
            suggestedMinClass = Math.max(suggestedMinClass, 2);
            if (currentClass !== null && currentClass === 1) {
                warnings.push({
                    id: 'BMI_UNDERWEIGHT',
                    message: `Chỉ số BMI = ${bmiValue} (Thể trạng gầy/Thiếu cân). Cân nhắc phân loại sức khỏe phù hợp.`,
                    severity: 'info',
                    source: 'VITALS_BMI',
                    suggestedMaxClass: 2,
                });
            }
        }
    }

    // 2. Kiểm tra Huyết áp (Blood Pressure)
    if (params.bp && typeof params.bp === 'string' && params.bp.includes('/')) {
        const parts = params.bp.split('/');
        const sys = parseInt(parts[0]?.trim(), 10);
        const dia = parseInt(parts[1]?.trim(), 10);

        if (!isNaN(sys) && !isNaN(dia)) {
            if (sys >= 160 || dia >= 100) {
                suggestedMinClass = Math.max(suggestedMinClass, 4);
                if (currentClass !== null && currentClass <= 2) {
                    warnings.push({
                        id: 'BP_STAGE_2_HYPERTENSION',
                        message: `Huyết áp ${sys}/${dia} mmHg (Tăng huyết áp độ 2 theo Hội Tim Mạch VN / BYT). Không thể phân loại sức khỏe Loại I hoặc Loại II.`,
                        severity: 'warning',
                        source: 'VITALS_BP',
                        suggestedMaxClass: 3,
                    });
                }
            } else if (sys >= 140 || dia >= 90) {
                suggestedMinClass = Math.max(suggestedMinClass, 3);
                if (currentClass !== null && currentClass === 1) {
                    warnings.push({
                        id: 'BP_STAGE_1_HYPERTENSION',
                        message: `Huyết áp ${sys}/${dia} mmHg (Tăng huyết áp độ 1). Khuyến nghị không phân loại sức khỏe Loại I.`,
                        severity: 'warning',
                        source: 'VITALS_BP',
                        suggestedMaxClass: 2,
                    });
                }
            } else if (sys < 90 && sys > 0) {
                suggestedMinClass = Math.max(suggestedMinClass, 2);
                if (currentClass !== null && currentClass === 1) {
                    warnings.push({
                        id: 'BP_HYPOTENSION',
                        message: `Huyết áp thấp (${sys}/${dia} mmHg). Cần lưu ý theo dõi lâm sàng nếu xếp Loại I.`,
                        severity: 'info',
                        source: 'VITALS_BP',
                        suggestedMaxClass: 2,
                    });
                }
            }
        }
    }

    // 3. Kiểm tra Mạch / Nhịp tim
    if (params.pulse !== undefined && params.pulse !== null && params.pulse !== '') {
        const pulseNum = Number(params.pulse);
        if (!isNaN(pulseNum) && !params.isChild) {
            if (pulseNum > 100) {
                if (currentClass !== null && currentClass === 1) {
                    warnings.push({
                        id: 'PULSE_TACHYCARDIA',
                        message: `Nhịp tim nhanh (${pulseNum} lần/phút khi nghỉ). Cần lưu ý chuyên khoa Tim mạch nếu xếp Loại I.`,
                        severity: 'info',
                        source: 'VITALS_PULSE',
                        suggestedMaxClass: 2,
                    });
                }
            } else if (pulseNum < 50 && pulseNum > 0) {
                if (currentClass !== null && currentClass === 1) {
                    warnings.push({
                        id: 'PULSE_BRADYCARDIA',
                        message: `Nhịp tim chậm (${pulseNum} lần/phút khi nghỉ). Cần đối chiếu với tiền sử vận động viên trước khi xếp Loại I.`,
                        severity: 'info',
                        source: 'VITALS_PULSE',
                        suggestedMaxClass: 2,
                    });
                }
            }
        }
    }

    // 4. Đối chiếu Phân loại các Chuyên khoa lâm sàng
    if (params.specialtiesPl) {
        Object.entries(params.specialtiesPl).forEach(([key, val]) => {
            const specNum = parseFitnessClassToNumber(val);
            if (specNum !== null) {
                const specName = SPECIALTY_NAMES[key] || key;
                if (specNum >= 3) {
                    suggestedMinClass = Math.max(suggestedMinClass, specNum);
                    if (currentClass !== null && currentClass === 1) {
                        warnings.push({
                            id: `SPEC_MISMATCH_${key}`,
                            message: `Chuyên khoa "${specName}" đang đánh giá Loại ${specNum}. Không tương thích khi phân loại sức khỏe chung là Loại I.`,
                            severity: 'warning',
                            source: 'SPECIALTY_MISMATCH',
                            suggestedMaxClass: specNum,
                        });
                    } else if (currentClass !== null && currentClass < specNum) {
                        warnings.push({
                            id: `SPEC_INCONSISTENT_${key}`,
                            message: `Chuyên khoa "${specName}" đang đánh giá Loại ${specNum}, nhưng kết luận chung đang chọn Loại ${currentClass}.`,
                            severity: 'info',
                            source: 'SPECIALTY_MISMATCH',
                            suggestedMaxClass: specNum,
                        });
                    }
                }
            }
        });
    }

    const hasSevereWarnings = warnings.some(w => w.severity === 'warning');

    return {
        hasWarnings: warnings.length > 0,
        hasSevereWarnings,
        warnings,
        calculatedBmi: bmiValue,
        suggestedMinClass,
    };
}
