// File: backend/src/services/his-sign.service.ts

import axios from 'axios';
import { query } from '../config/database';

/**
 * Resolves the HSM base URL from database or default settings.
 */
async function getHsmBaseUrl(partner: string, fallbackUrl?: string): Promise<string> {
    try {
        const res = await query(
            `SELECT sign_url FROM hms_sign_serverconf WHERE sign_partner = $1`,
            [partner]
        );
        if (res.rows.length > 0 && res.rows[0].sign_url) {
            return new URL(res.rows[0].sign_url).origin;
        }
    } catch (err) {
        console.warn('⚠️ [HIS Sign Service] Table hms_sign_serverconf not found or query failed, using fallback.');
    }
    
    // Fallback URL or default vimes.xyz
    const url = fallbackUrl || 'http://vimes.xyz:8091';
    return new URL(url).origin;
}

/**
 * Performs login to HSM server to get bearer token.
 */
async function loginHsm(baseUrl: string, userName: string, password: string, mid: string): Promise<string> {
    const endpoints = [
        `${baseUrl}/api/v1/signature/login`,
        `${baseUrl}/api/signature/login`
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
                return res.data.result.bearer_token;
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
        `${baseUrl}/api/Signature/credentials/list`
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
 * Signs base64 XML data via HIS HSM Server.
 */
export async function signXmlViaHisHsm(xmlBase64: string, settings: any, docNo: string): Promise<string> {
    const mid = settings.hsm_client_id || 'BCY';
    const userName = settings.hsm_username;
    const password = settings.hsm_password;
    
    if (!userName || !password) {
        throw new Error('Cấu hình HSM thiếu tài khoản hoặc mật khẩu kết nối.');
    }

    console.log(`[HIS Sign Service] Bắt đầu quy trình ký số XML cho tài liệu ${docNo}. Partner: ${mid}`);

    const baseUrl = await getHsmBaseUrl(mid, settings.hsm_url);
    console.log(`🔑 [HIS Sign Service] Sử dụng HSM Base URL: ${baseUrl}`);

    // 1. Login to get token
    console.log(`[HIS Sign Service] [1/3] Đăng nhập HSM lấy token...`);
    const token = await loginHsm(baseUrl, userName, password, mid);

    // 2. Get credential ID
    console.log(`[HIS Sign Service] [2/3] Lấy Credential ID...`);
    const credentialId = await getCredentialId(baseUrl, token, userName, password, mid);

    // Clean XML to remove nested <?xml ...?> declarations which are illegal in standard XML parsers
    const cleanedXml = xmlBase64.trim().startsWith('<')
        ? xmlBase64.replace(/(?<!^)<\?xml[^>]*\?>/gi, '')
        : xmlBase64;

    const base64Data = cleanedXml.trim().startsWith('<')
        ? Buffer.from(cleanedXml, 'utf-8').toString('base64')
        : cleanedXml;

    // 3. Call signing API
    const signUrl = `${baseUrl}/api/xml/sign/multi`;
    const body = {
        mid,
        user_Name: userName,
        password,
        ip: '127.0.0.1',
        credential_id: credentialId,
        computer_name: 'VIMES-HIS-BACKEND',
        mac: '00-00-00-00-00-00',
        os: 'Linux/Windows Server',
        data_type: 1, // XML
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

    console.log(`[HIS Sign Service] [3/3] Gửi yêu cầu ký XML đến ${signUrl}...`);
    const res = await axios.post<any>(signUrl, body, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        timeout: 30000
    });

    if (res.data && res.data.result && res.data.result[0]?.success) {
        console.log(`✅ [HIS Sign Service] Ký số XML thành công cho tài liệu ${docNo}.`);
        return res.data.result[0].signed_xml_base64 || '';
    } else {
        const errorMsg = res.data?.result?.[0]?.message || JSON.stringify(res.data) || 'Lỗi không xác định từ HSM';
        console.error(`❌ [HIS Sign Service] Ký số thất bại ở Bước 3. Chi tiết phản hồi:`, res.data);
        throw new Error(`HSM báo lỗi: ${errorMsg}`);
    }
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
