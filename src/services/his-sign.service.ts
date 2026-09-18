// File: src/services/his-sign.service.ts

import axios from 'axios';
import { query } from '../config/database';

/* ================== SIGN SERVER & TOKEN CACHE ================== */
type TokenCacheItem = {
    token: string;
    expiredAt: number;
};

const tokenCacheMap = new Map<string, TokenCacheItem>();

function getTokenCacheKey(mid: string, userName: string): string {
    return `${mid}::${userName}`;
}

/**
 * Resolves the HSM base URL from hms_sign_serverconf table based on the selected partner/provider.
 * Fallbacks to explicitly customized settings.hsm_url if provided and valid.
 */
async function getHsmBaseUrl(partner: string, configuredUrl?: string): Promise<string> {
    const rawPartner = (partner || '').trim().toUpperCase();
    const rawConfigured = (configuredUrl || '').trim();

    // 1. Tra cứu cấu hình tất cả các đối tác trong bảng hms_sign_serverconf của bệnh viện
    const partnerMap: Record<string, string> = {};
    try {
        const res = await query(
            `SELECT sign_partner, sign_url, sign_url_wan 
             FROM hms_sign_serverconf 
             WHERE sign_partner != 'TOKEN'`
        );
        for (const row of res.rows) {
            const p = (row.sign_partner || '').trim().toUpperCase();
            const u = row.sign_url || row.sign_url_wan || '';
            if (p && u) {
                partnerMap[p] = u;
            }
        }
    } catch (err: any) {
        console.warn('⚠️ [HIS Sign Service] Table hms_sign_serverconf query failed:', err.message);
    }

    // 2. Ưu tiên hàng đầu: Lấy trực tiếp URL từ bảng hms_sign_serverconf của bệnh viện theo partner đã chọn
    if (rawPartner && partnerMap[rawPartner]) {
        try {
            const origin = new URL(partnerMap[rawPartner]).origin;
            console.log(`[HIS Sign Service] Sử dụng cấu hình hms_sign_serverconf của bệnh viện cho đối tác ${rawPartner}: ${origin}`);
            return origin;
        } catch {
            return partnerMap[rawPartner].replace(/\/+$/, '');
        }
    }

    // 3. Nếu partner chưa có trong hms_sign_serverconf nhưng người dùng cấu hình URL tùy chỉnh hợp lệ:
    if (rawConfigured && rawConfigured !== 'http://vimes.xyz:8091') {
        try {
            return new URL(rawConfigured).origin;
        } catch {
            return rawConfigured.replace(/\/+$/, '');
        }
    }

    // 4. Fallback theo cấu hình Ban Cơ Yếu trong hms_sign_serverconf
    if (partnerMap['BCY']) {
        try {
            return new URL(partnerMap['BCY']).origin;
        } catch {
            return partnerMap['BCY'].replace(/\/+$/, '');
        }
    }

    // 5. Fallback đối tác đầu tiên có URL trong hms_sign_serverconf
    const firstUrl = Object.values(partnerMap)[0];
    if (firstUrl) {
        try {
            return new URL(firstUrl).origin;
        } catch {
            return firstUrl.replace(/\/+$/, '');
        }
    }

    return 'http://10.1.3.200:8081';
}

/**
 * Performs login to HSM server to get bearer token (with caching).
 */
async function loginHsm(baseUrl: string, userName: string, password: string, mid: string): Promise<string> {
    const key = getTokenCacheKey(mid, userName);
    const now = Date.now();
    const cached = tokenCacheMap.get(key);
    if (cached && cached.expiredAt > now) {
        return cached.token;
    }

    const endpoints = [
        `${baseUrl}/api/v1/signature/login`,
        `${baseUrl}/api/v1/Signature/login`,
        `${baseUrl}/api/signature/login`,
        `${baseUrl}/api/Signature/login`,
        `${baseUrl}/api/XML/login`
    ];

    let lastError: any;
    for (const url of endpoints) {
        try {
            console.log(`[HIS Sign Service] Attempting HSM login at ${url}...`);
            const res = await axios.post<any>(url, {
                user_Name: userName,
                password,
                ip: '127.0.0.1',
                mid
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            if (res.data && res.data.success && res.data.result?.bearer_token) {
                console.log(`[HIS Sign Service] HSM Login successful at ${url}. Token retrieved.`);
                const token = res.data.result.bearer_token;
                const expiresIn = Number(res.data.result.expires_in) || 3600;
                tokenCacheMap.set(key, {
                    token,
                    expiredAt: now + expiresIn * 1000 - 5000
                });
                return token;
            } else {
                console.warn(`⚠️ [HIS Sign Service] HSM Login response from ${url}: success=${res.data?.success}, hasToken=${!!res.data?.result?.bearer_token}`);
            }
        } catch (err: any) {
            lastError = err;
            console.error(`❌ [HIS Sign Service] Login failed at ${url}: ${err.message}`, err.response?.data || '');
        }
    }

    throw new Error(`Đăng nhập HSM thất bại: ${lastError?.message || 'Không rõ nguyên nhân'}`);
}

/**
 * Gets credential ID for the user certificate from HSM server.
 */
async function getCredentialId(baseUrl: string, token: string, userName: string, password: string, mid: string): Promise<string> {
    const endpoints = [
        `${baseUrl}/api/v1/Signature/credentials/list`,
        `${baseUrl}/api/v1/signature/credentials/list`,
        `${baseUrl}/api/Signature/credentials/list`,
        `${baseUrl}/api/signature/credentials/list`,
        `${baseUrl}/api/XML/credentials/list`
    ];

    let lastError: any;
    for (const url of endpoints) {
        try {
            console.log(`[HIS Sign Service] Fetching credential list from ${url}...`);
            const res = await axios.post<any>(url, {
                mid,
                user_Name: userName,
                password,
                ip: '127.0.0.1'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: 10000
            });

            if (res.data && res.data.success && res.data.result && res.data.result.length > 0) {
                const credId = res.data.result[0].credential_id;
                console.log(`[HIS Sign Service] Credential ID retrieved successfully from ${url}: ${credId}`);
                return credId;
            } else {
                console.warn(`⚠️ [HIS Sign Service] Credential response from ${url}: success=${res.data?.success}, count=${res.data?.result?.length || 0}`);
            }
        } catch (err: any) {
            lastError = err;
            console.error(`❌ [HIS Sign Service] Credential fetch failed at ${url}: ${err.message}`, err.response?.data || '');
        }
    }

    throw new Error(`Không lấy được chứng thư từ HSM: ${lastError?.message || 'Danh sách chứng thư trống'}`);
}

/**
 * Signs base64 XML data via HIS HSM Server (Supports Ban Cơ Yếu BCY, Viettel MySign, InTrust, Local).
 */
export async function signXmlViaHisHsm(xmlBase64: string, settings: any, docNo: string): Promise<string> {
    // Xác định mid (Partner ID):
    // Ưu tiên settings.hsm_provider đã chọn trong thiết lập
    const providerRaw = (settings.hsm_provider || '').trim();
    let mid = providerRaw || (settings.hsm_client_id || '').trim() || 'BCY';
    if (mid.toUpperCase() === 'VNPT-CA' || mid.toUpperCase() === 'VNPT') {
        mid = 'BCY';
    }

    const upperMid = mid.toUpperCase();
    if (upperMid === 'VIETTEL-CA' || upperMid === 'MYSIGN' || upperMid === 'VIETTEL') {
        mid = 'VIETTEL';
    } else if (upperMid === 'BCY' || upperMid === 'BANCOYEU' || upperMid === 'BAN CO YEU') {
        mid = 'BCY';
    } else if (upperMid === 'INTRUST') {
        mid = 'INTRUST';
    } else if (upperMid === 'LOCAL') {
        mid = 'LOCAL';
    }

    const userName = settings?.hsm_username;
    const password = settings?.hsm_password;

    if (!userName || !password) {
        throw new Error('Chưa thiết lập tài khoản ký HSM cho cơ sở khám chữa bệnh. Vui lòng cấu hình tài khoản và mật khẩu HSM trong Cấu hình liên thông.');
    }

    console.log(`[HIS Sign Service] Bắt đầu quy trình ký số XML cho tài liệu ${docNo}. Provider: ${providerRaw || 'N/A'}, Partner/MID: ${mid}`);

    const baseUrl = await getHsmBaseUrl(mid, settings.hsm_url);
    console.log(`🔑 [HIS Sign Service] Sử dụng HSM Base URL: ${baseUrl} (Partner/MID: ${mid}, cấu hình gốc: ${settings.hsm_url || 'mặc định'})`);

    // 1. Login to get token
    console.log(`[HIS Sign Service] [1/3] Đăng nhập HSM lấy token...`);
    const token = await loginHsm(baseUrl, userName, password, mid);

    // 2. Get credential ID
    console.log(`[HIS Sign Service] [2/3] Lấy Credential ID...`);
    let credentialId = '';
    try {
        credentialId = await getCredentialId(baseUrl, token, userName, password, mid);
    } catch (credErr: any) {
        console.warn(`[HIS Sign Service] Cảnh báo lấy credential:`, credErr.message);
        if (settings?.hsm_client_secret) {
            credentialId = settings.hsm_client_secret;
        } else {
            throw credErr;
        }
    }

    // Clean XML to remove nested <?xml ...?> declarations which are illegal in standard XML parsers
    const cleanedXml = xmlBase64.trim().startsWith('<')
        ? xmlBase64.replace(/(?<!^)<\?xml[^>]*\?>/gi, '')
        : xmlBase64;

    const rawXmlUtf8 = cleanedXml.trim().startsWith('<')
        ? cleanedXml
        : Buffer.from(cleanedXml, 'base64').toString('utf-8');

    const base64Data = Buffer.from(rawXmlUtf8, 'utf-8').toString('base64');

    // 3. Call signing API (thử các endpoint chuẩn của HIS Sign Server)
    const signEndpoints = [
        `${baseUrl}/api/xml/sign/multi`,
        `${baseUrl}/api/XML/sign/multi`,
        `${baseUrl}/api/v1/Signature/sign/multi`,
        `${baseUrl}/api/Signature/sign/multi`
    ];

    const body = {
        mid,
        user_Name: userName,
        password,
        ip: '127.0.0.1',
        credential_id: credentialId,
        computer_name: 'VIMES-HIS-BACKEND',
        mac: '00-00-00-00-00-00',
        os: 'Windows 10',
        data_type: 1, // Theo đặc tả SignHSM.ts của bệnh viện
        file_datas: [
            {
                store_data: false,
                page_sign: 1,
                file_name: `${docNo || 'document'}.xml`,
                signature_name: 'nguoithuchien',
                point_x: 150,
                point_y: 150,
                width: 100,
                height: 100,
                store_uid: '',
                xml_data: base64Data,
                image_data: ''
            }
        ],
        image_data: ''
    };

    let lastSignError: any;
    for (const signUrl of signEndpoints) {
        try {
            console.log(`[HIS Sign Service] [3/3] Gửi yêu cầu ký XML đến ${signUrl}...`);
            const res = await axios.post<any>(signUrl, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: 15000
            });

            if (res.data && res.data.result && res.data.result[0]?.success) {
                console.log(`✅ [HIS Sign Service] Ký số XML thành công trực tiếp từ HSM cho tài liệu ${docNo} tại ${signUrl}.`);
                return res.data.result[0].signed_xml_base64 || '';
            }

            if (res.data && res.data.signedXml) {
                console.log(`✅ [HIS Sign Service] Ký số XML thành công trực tiếp từ HSM cho tài liệu ${docNo} tại ${signUrl}.`);
                return res.data.signedXml;
            }

            const errMsg = res.data?.result?.[0]?.message || res.data?.message || 'Máy chủ HSM không trả về kết quả ký thành công';
            lastSignError = new Error(errMsg);
            console.warn(`⚠️ [HIS Sign Service] Máy chủ ký tại ${signUrl} báo:`, errMsg);
        } catch (apiErr: any) {
            lastSignError = apiErr;
            console.error(`❌ [HIS Sign Service] Lỗi gọi API ký số XML tại ${signUrl}:`, apiErr.message);
        }
    }

    throw new Error(`Ký số HSM thất bại: ${lastSignError?.message || 'Không thể kết nối đến API ký số'}`);
}

/**
 * Signs raw XML data via workstation local USB Agent.
 */
export async function signXmlViaHisUsbAgent(ip: string, unsignedXml: string): Promise<string> {
    const url = `http://${ip}:2100/sign?mode=node`;
    console.log(`🔌 [HIS Sign Service] Gửi yêu cầu ký USB Agent tới ${url}...`);
    
    const res = await axios.post<any>(url, unsignedXml, {
        headers: {
            'Content-Type': 'application/xml',
            'X-Sign-Mode': 'node',
            'Connection': 'close'
        },
        timeout: 20000,
        responseType: 'text'
    });

    const resBody = res.data;
    if (typeof resBody === 'string' && resBody.includes('<Signature')) {
        return resBody;
    } else {
        throw new Error('Không nhận được thẻ Signature từ USB Agent. Ký số thất bại.');
    }
}
