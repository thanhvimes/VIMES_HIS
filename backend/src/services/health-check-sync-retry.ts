export function isRetryableSyncFailure(statusCode?: number, errorCode?: string, message = ''): boolean {
    if (statusCode === undefined || statusCode === null) {
        return /timeout|timed out|ETIMEDOUT|ECONNRESET|ENOTFOUND|network/i.test(message);
    }
    if (statusCode >= 500 || statusCode === 408 || statusCode === 429) return true;
    if (/TIMEOUT|GATEWAY|TEMPORARY|SERVICE_UNAVAILABLE/i.test(errorCode || '')) return true;
    return false;
}

export function shouldRetryStoredSyncError(errorMessage = ''): boolean {
    return /Lỗi kết nối cổng|timeout|timed out|ETIMEDOUT|ECONNRESET|ENOTFOUND|504|503|429/i.test(errorMessage);
}
