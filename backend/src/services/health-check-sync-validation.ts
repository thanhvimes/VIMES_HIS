export interface SyncDocumentState {
    signature_status?: string | null;
    send_status?: string | null;
    xml_data?: string | null;
    signature?: string | null;
    doctor_signature?: string | null;
}

export function validateDocumentBeforeSync(doc: SyncDocumentState, options?: { allow_unsigned_sync?: boolean; auto_hsm?: boolean; has_doctor_sig?: boolean }): string | null {
    const allowUnsigned = options?.allow_unsigned_sync === true;
    if (!allowUnsigned) {
        if (options?.has_doctor_sig === false) {
            return 'Hồ sơ chưa có chữ ký số của Bác sĩ kết luận';
        }
        if (!options?.auto_hsm) {
            if (doc.signature_status !== 'Signed') return 'Hồ sơ chưa ký số, không được gửi cổng';
            if (!doc.signature || !String(doc.signature).trim()) return 'Hồ sơ thiếu chữ ký số để gửi cổng';
        }
    }
    if (!doc.xml_data || !doc.xml_data.trim()) return 'Hồ sơ chưa có XML dữ liệu để gửi';
    if (doc.send_status === 'Success') return 'Hồ sơ đã gửi cổng thành công';
    return null;
}
