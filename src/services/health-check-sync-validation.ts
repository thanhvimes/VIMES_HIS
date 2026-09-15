export interface SyncDocumentState {
    signature_status?: string | null;
    send_status?: string | null;
    xml_data?: string | null;
    signature?: string | null;
}

export function validateDocumentBeforeSync(doc: SyncDocumentState, options?: { allow_unsigned_sync?: boolean }): string | null {
    const allowUnsigned = options?.allow_unsigned_sync === true;
    if (!allowUnsigned) {
        if (doc.signature_status !== 'Signed') return 'Hồ sơ chưa ký số, không được gửi cổng';
        if (!doc.signature || !String(doc.signature).trim()) return 'Hồ sơ thiếu chữ ký số để gửi cổng';
    }
    if (!doc.xml_data || !doc.xml_data.trim()) return 'Hồ sơ chưa có XML dữ liệu để gửi';
    if (doc.send_status === 'Success') return 'Hồ sơ đã gửi cổng thành công';
    return null;
}
