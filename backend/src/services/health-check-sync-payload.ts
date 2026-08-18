export interface HealthCheckSyncHeader {
    version: string;
    sender_id: string;
    receiver_id: string;
    txn_type: string;
    msg_type: string;
    data_type: 'xml/base64' | 'json/base64';
    send_datetime: number;
    msg_id: string;
}

export interface HealthCheckSyncPayload {
    header: HealthCheckSyncHeader;
    data: { file_content: string };
    signature: string;
}

export function buildHealthCheckSyncPayload(header: HealthCheckSyncHeader, fileContentBase64: string): HealthCheckSyncPayload {
    if (!fileContentBase64 || !fileContentBase64.trim()) {
        throw new Error('file_content Base64 không được để trống');
    }
    return { header, data: { file_content: fileContentBase64.replace(/\s+/g, '') }, signature: '' };
}
