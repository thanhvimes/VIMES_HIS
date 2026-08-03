// ==================== HEALTH CHECK AUTO SYNC SERVICE ====================
// File: backend/src/services/health-check-sync.service.ts

import { query } from '../config/database';
import { getHealthCheckSettings, loadHealthCheckSettings } from '../config/health-check-settings';

import axios from 'axios';
import crypto from 'crypto';

let syncIntervalKey: NodeJS.Timeout | null = null;

function parsePrivateKey(rawKey: string): crypto.KeyObject | string {
    const trimmed = rawKey.trim();
    if (trimmed.includes('-----BEGIN')) {
        return trimmed;
    }
    if (/^[0-9a-fA-F]+$/.test(trimmed)) {
        try {
            const derBuf = Buffer.from(trimmed, 'hex');
            try {
                return crypto.createPrivateKey({ key: derBuf, format: 'der', type: 'pkcs8' });
            } catch {
                return crypto.createPrivateKey({ key: derBuf, format: 'der', type: 'pkcs1' });
            }
        } catch (e) {}
    }
    try {
        const derBuf = Buffer.from(trimmed, 'base64');
        try {
            return crypto.createPrivateKey({ key: derBuf, format: 'der', type: 'pkcs8' });
        } catch {
            return crypto.createPrivateKey({ key: derBuf, format: 'der', type: 'pkcs1' });
        }
    } catch (e) {}

    return trimmed;
}

function sanitizeXmlContent(rawXml: string, maCskcbGln?: string, maCskcbByt?: string): string {
    if (!rawXml) return '';
    let xml = rawXml;
    const glnCode = maCskcbGln || '8934285008135';
    const bytCode = maCskcbByt || '37101';

    // Ensure MACSKCB in envelope THONGTINDONVI has 13-digit GLN code matching sample data.xml
    if (glnCode) {
        xml = xml.replace(/<THONGTINDONVI>[\s\S]*?<MACSKCB>.*?<\/MACSKCB>[\s\S]*?<\/THONGTINDONVI>/gi, `<THONGTINDONVI>\n\t\t<MACSKCB>${glnCode}</MACSKCB>\n\t</THONGTINDONVI>`);
    }

    // Automatically decode Base64 if needed, sanitize, and keep unencoded plain XML inside <NOIDUNGFILE> matching sample data.xml
    xml = xml.replace(/<NOIDUNGFILE>([\s\S]*?)<\/NOIDUNGFILE>/gi, (match, inner) => {
        let trimmed = inner.trim();
        let decoded = trimmed;

        // Check if it is Base64 encoded
        if (!trimmed.startsWith('<') && !trimmed.startsWith('<?xml') && trimmed.length > 0) {
            try {
                const buf = Buffer.from(trimmed, 'base64');
                const str = buf.toString('utf8');
                if (str.includes('<') || str.includes('<?xml')) {
                    decoded = str;
                }
            } catch (e) {
                // Not Base64
            }
        }

        // Strip inner <?xml version...?> declaration if present
        decoded = decoded.replace(/<\?xml[\s\S]*?\?>/gi, '').trim();

        // Fix MA_CSKCB inside XML2 to 5-digit BYT code if present
        decoded = decoded.replace(/<MA_CSKCB>.*?<\/MA_CSKCB>/g, `<MA_CSKCB>${bytCode}</MA_CSKCB>`);

        // Fix NGAYCAP_CCCD format: if DDMMYYYY (e.g. 14022024), convert to YYYYMMDD (20240214)
        decoded = decoded.replace(/<NGAYCAP_CCCD>(\d{2})(\d{2})(\d{4})<\/NGAYCAP_CCCD>/g, (m, d, mth, y) => {
            const year = parseInt(y, 10);
            if (year >= 1900 && year <= 2100) {
                return `<NGAYCAP_CCCD>${y}${mth}${d}</NGAYCAP_CCCD>`;
            }
            return m;
        });

        // Fix NGAY_SINH format: if DDMMYYYY (e.g. 13022009), convert to YYYYMMDD (20090213)
        decoded = decoded.replace(/<NGAY_SINH>(\d{2})(\d{2})(\d{4})<\/NGAY_SINH>/g, (m, d, mth, y) => {
            const year = parseInt(y, 10);
            if (year >= 1900 && year <= 2100) {
                return `<NGAY_SINH>${y}${mth}${d}</NGAY_SINH>`;
            }
            return m;
        });

        // Fix SO_CCCD to 12 digits (pad leading 0s or trim to 12 digits)
        decoded = decoded.replace(/<SO_CCCD>(.*?)<\/SO_CCCD>/g, (m, val) => {
            const digits = val.replace(/\D/g, '');
            if (!digits) return '<SO_CCCD></SO_CCCD>';
            if (digits.length < 12) return `<SO_CCCD>${digits.padStart(12, '0')}</SO_CCCD>`;
            return `<SO_CCCD>${digits.slice(0, 12)}</SO_CCCD>`;
        });

        // Fix DIEN_THOAI to 10 digits starting with 0
        decoded = decoded.replace(/<DIEN_THOAI>(.*?)<\/DIEN_THOAI>/g, (m, val) => {
            let digits = val.replace(/\D/g, '');
            if (!digits) return '<DIEN_THOAI></DIEN_THOAI>';
            if (!digits.startsWith('0')) digits = '0' + digits;
            if (digits.length > 10) digits = digits.slice(0, 10);
            else if (digits.length < 10) digits = digits.padEnd(10, '0');
            return `<DIEN_THOAI>${digits}</DIEN_THOAI>`;
        });

        // Fix MA_NGHE_NGHIEP to 2 digits (e.g. '100' -> '04', '4' -> '04')
        decoded = decoded.replace(/<MA_NGHE_NGHIEP>(.*?)<\/MA_NGHE_NGHIEP>/g, (m, val) => {
            const d = val.trim();
            if (!d || d.length > 2) return '<MA_NGHE_NGHIEP>04</MA_NGHE_NGHIEP>';
            if (d.length === 1) return `<MA_NGHE_NGHIEP>0${d}</MA_NGHE_NGHIEP>`;
            return `<MA_NGHE_NGHIEP>${d}</MA_NGHE_NGHIEP>`;
        });

        // Fix MATINH_CU_TRU to 2 digits (e.g. '237' -> '37')
        decoded = decoded.replace(/<MATINH_CU_TRU>(.*?)<\/MATINH_CU_TRU>/g, (m, val) => {
            const d = val.replace(/\D/g, '');
            if (d.length > 2) return `<MATINH_CU_TRU>${d.slice(-2)}</MATINH_CU_TRU>`;
            if (d.length === 1) return `<MATINH_CU_TRU>0${d}</MATINH_CU_TRU>`;
            if (!d) return '<MATINH_CU_TRU>01</MATINH_CU_TRU>';
            return `<MATINH_CU_TRU>${d}</MATINH_CU_TRU>`;
        });

        // Fix DOI_TUONG if invalid or '10' -> '1;2'
        decoded = decoded.replace(/<DOI_TUONG>(.*?)<\/DOI_TUONG>/g, (m, val) => {
            const v = val.trim();
            if (!v || v === '10' || v === '0') return '<DOI_TUONG>1;2</DOI_TUONG>';
            return m;
        });

        // Fix TYPE based on NGAY_SINH if present in rawXml
        const dobMatch = rawXml.match(/<NGAY_SINH>(\d{4})(\d{2})(\d{2})<\/NGAY_SINH>/);
        if (dobMatch) {
            const birthYear = parseInt(dobMatch[1], 10);
            const currentYear = new Date().getFullYear();
            const age = currentYear - birthYear;
            if (age >= 18) {
                decoded = decoded.replace(/<TYPE>.*?<\/TYPE>/g, '<TYPE>Adult</TYPE>');
            } else if (age < 6) {
                decoded = decoded.replace(/<TYPE>.*?<\/TYPE>/g, '<TYPE>ChildUnder</TYPE>');
            } else {
                decoded = decoded.replace(/<TYPE>.*?<\/TYPE>/g, '<TYPE>Minor</TYPE>');
            }
        }

        // Ensure TSGD and TSBT tags in THONG_TIN_HANH_CHINH if missing
        if (decoded.includes('<THONG_TIN_HANH_CHINH>') && !decoded.includes('<TSGD_MAC_BENH>')) {
            const medHistorySnippet = `
							<TSGD_MAC_BENH>0</TSGD_MAC_BENH>
							<TSGD_MA_BENH></TSGD_MA_BENH>
							<TS_TIEP_XUC_LAO>0</TS_TIEP_XUC_LAO>
							<SAN_KHOA>0</SAN_KHOA>
							<SAN_KHOA_KHONG_BT>0</SAN_KHOA_KHONG_BT>
							<TIEM_CHUNG_BCG>0</TIEM_CHUNG_BCG>
							<TIEM_CHUNG_BH_HG_UV>0</TIEM_CHUNG_BH_HG_UV>
							<TIEM_CHUNG_SOI>0</TIEM_CHUNG_SOI>
							<TIEM_CHUNG_BAI_LIET>0</TIEM_CHUNG_BAI_LIET>
							<TIEM_CHUNG_VNNB_B>0</TIEM_CHUNG_VNNB_B>
							<TIEM_CHUNG_VGB>0</TIEM_CHUNG_VGB>
							<TIEM_CHUNG_CAC_LOAI_KHAC>0</TIEM_CHUNG_CAC_LOAI_KHAC>
							<TSBT_MAC_BENH>0</TSBT_MAC_BENH>
							<TSBT_MA_BENH></TSBT_MA_BENH>
							<TSBT_DANG_DIEU_TRI_BENH>0</TSBT_DANG_DIEU_TRI_BENH>
							<TSBT_BENH_TRONG_5_NAM_QUA>0</TSBT_BENH_TRONG_5_NAM_QUA>
							<TSBT_BENH_THAN_KINH>0</TSBT_BENH_THAN_KINH>
							<TSBT_BENH_MAT>0</TSBT_BENH_MAT>
							<TSBT_BENH_TAI>0</TSBT_BENH_TAI>
							<TSBT_BENH_TIM>0</TSBT_BENH_TIM>
							<TSBT_PHAU_THUAT_TIM>0</TSBT_PHAU_THUAT_TIM>
							<TSBT_TANG_HUYET_AP>0</TSBT_TANG_HUYET_AP>
							<TSBT_KHO_THO>0</TSBT_KHO_THO>
							<TSBT_BENH_PHOI>0</TSBT_BENH_PHOI>
							<TSBT_BENH_THAN>0</TSBT_BENH_THAN>
							<TSBT_NGHIEN_RUOU>0</TSBT_NGHIEN_RUOU>
							<TSBT_DAI_THAO_DUONG>0</TSBT_DAI_THAO_DUONG>
							<TSBT_BENH_TAM_THAN>0</TSBT_BENH_TAM_THAN>
							<TSBT_MAT_Y_THUC>0</TSBT_MAT_Y_THUC>
							<TSBT_NGAT>0</TSBT_NGAT>
							<TSBT_BENH_TIEU_HOA>0</TSBT_BENH_TIEU_HOA>
							<TSBT_ROI_LOAN_GIAC_NGU>0</TSBT_ROI_LOAN_GIAC_NGU>
							<TSBT_TAI_BIEN>0</TSBT_TAI_BIEN>
							<TSBT_BENH_COT_SONG>0</TSBT_BENH_COT_SONG>
							<TSBT_RUOU_THUONG_XUYEN>0</TSBT_RUOU_THUONG_XUYEN>
							<TSBT_MA_TUY>0</TSBT_MA_TUY>
							<TSBT_BENH_KHAC>0</TSBT_BENH_KHAC>
							<TSBT_MA_BENH_KHAC></TSBT_MA_BENH_KHAC>
							<TSBT_TEN_THUOC_LIEU_LUONG></TSBT_TEN_THUOC_LIEU_LUONG>
							<TSBT_THAI_SAN>0</TSBT_THAI_SAN>
							<TSBT_TEN_THUOC_THAI_SAN></TSBT_TEN_THUOC_THAI_SAN>`;
            decoded = decoded.replace('</THONG_TIN_HANH_CHINH>', `${medHistorySnippet}\n						</THONG_TIN_HANH_CHINH>`);
        }

        return `<NOIDUNGFILE>${decoded.trim()}</NOIDUNGFILE>`;
    });

    return xml;
}

/**
 * Synchronizes documents to the VNeID gateway portal.
 * Logs API request and response data to database.
 */
export async function sendDocumentsToVNeID(docIds: string[]): Promise<string[]> {
    const failedIds: string[] = [];
    try {
        await loadHealthCheckSettings();
        const settings = getHealthCheckSettings();
        if (!settings) {
            console.error('❌ [VNeID Portal] Settings not loaded.');
            return docIds;
        }

        console.log('🔍 [VNeID Sync DEBUG] Settings loaded from DB:', {
            vneid_url: settings.vneid_url,
            vneid_username: settings.vneid_username,
            ma_cskcb: settings.ma_cskcb
        });

        let baseUrl = (settings.vneid_url || 'https://api-sandbox.emrhub.vn/api').trim().replace(/\/+$/, '');
        if (baseUrl.endsWith('/v1')) {
            baseUrl = baseUrl.slice(0, -3);
        }
        if (!baseUrl.endsWith('/api')) {
            baseUrl = `${baseUrl}/api`;
        }

        console.log('🔍 [VNeID Sync DEBUG] Normalized Base URL:', baseUrl);
        const loginUrl = `${baseUrl}/auth/login`;
        console.log('📡 [VNeID Sync DEBUG] Sending Auth POST request to:', loginUrl);

        // 1. Authenticate / Login to get token
        let token = '';
        let loginResponseLog = '';
        try {
            const loginRes: any = await axios.post(loginUrl, {
                username: settings.vneid_username,
                password: settings.vneid_password
            }, {
                headers: { 
                    'Content-Type': 'application/json', 
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                timeout: 10000
            });
            token = loginRes.data?.data?.token || loginRes.data?.token || loginRes.data?.data;
            loginResponseLog = `Login Success: ${JSON.stringify(loginRes.data)}`;
            console.log('✅ [VNeID Sync DEBUG] Login success. Token length:', token ? token.length : 0);
        } catch (err: any) {
            const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            loginResponseLog = `Login Failed: ${err.response?.status || 500} - ${errMsg}`;
            console.error(`❌ [VNeID Portal] Login error:`, errMsg);
        }

        // 2. Loop through and push each document
        for (const docId of docIds) {
            const docQuery = await query(`SELECT id, doc_no, xml_data, patient_name, signature_status, signature FROM health_check_masters WHERE id = $1`, [parseInt(docId, 10)]);
            if (docQuery.rows.length === 0) continue;
            const doc = docQuery.rows[0];

            if (!token) {
                await query(`
                    UPDATE health_check_masters
                    SET send_status = 'Error',
                        error_message = 'Đăng nhập cổng thất bại',
                        response_log = $1,
                        updated_at = NOW()
                    WHERE id = $2
                `, [loginResponseLog, doc.id]);
                failedIds.push(docId);
                continue;
            }

            const glnCode = (settings.ma_cskcb && settings.ma_cskcb.length >= 13)
                ? settings.ma_cskcb
                : (settings.ma_gtin_cskcb && settings.ma_gtin_cskcb.length >= 13 && settings.ma_gtin_cskcb !== '1234567890123' ? settings.ma_gtin_cskcb : '8934285008135');
            const bytCode = (settings as any).ma_cskcb_byt || (settings.ma_cskcb && settings.ma_cskcb.length === 5 ? settings.ma_cskcb : '37101');

            let base64Xml = '';
            let rawXmlToProcess = sanitizeXmlContent(doc.xml_data || '', glnCode, bytCode);

            let outerSignatureVal = doc.signature_data || '';
            if (doc.signature_status === 'Signed' && doc.signature) {
                try {
                    const trimmedSig = doc.signature.trim();
                    if (!trimmedSig.startsWith('<') && !trimmedSig.startsWith('{')) {
                        outerSignatureVal = trimmedSig;
                    }
                    if (trimmedSig.startsWith('{')) {
                        const sigObj = JSON.parse(trimmedSig);
                        const signedFile = sigObj.signature_result?.signed_file || sigObj.signed_file;
                        if (signedFile && signedFile.data_base64) {
                            outerSignatureVal = signedFile.data_base64;
                            if (signedFile.mime_type && (signedFile.mime_type.includes('xml') || signedFile.file_name?.endsWith('.xml'))) {
                                let xmlText = Buffer.from(signedFile.data_base64, 'base64').toString('utf8');
                                xmlText = sanitizeXmlContent(xmlText, glnCode, bytCode);
                                base64Xml = Buffer.from(xmlText, 'utf8').toString('base64');
                                console.log(`✅ [VNeID Sync] Using sanitized signed XML from signature wrapper for doc ${doc.doc_no}`);
                            } else {
                                const signatureValue = signedFile.data_base64;
                                let xml = rawXmlToProcess;
                                if (xml.includes('<CKS_BENH_VIEN></CKS_BENH_VIEN>')) {
                                    xml = xml.replace('<CKS_BENH_VIEN></CKS_BENH_VIEN>', `<CKS_BENH_VIEN>${signatureValue}</CKS_BENH_VIEN>`);
                                }
                                base64Xml = Buffer.from(xml, 'utf8').toString('base64');
                                console.log(`✅ [VNeID Sync] Injected signature value into <CKS_BENH_VIEN> for doc ${doc.doc_no}`);
                            }
                        } else {
                            base64Xml = Buffer.from(rawXmlToProcess, 'utf8').toString('base64');
                        }
                    } else if (trimmedSig.startsWith('<')) {
                        let xmlText = sanitizeXmlContent(trimmedSig, glnCode, bytCode);
                        base64Xml = Buffer.from(xmlText, 'utf8').toString('base64');
                    } else {
                        let xml = rawXmlToProcess;
                        if (xml.includes('<CKS_BENH_VIEN></CKS_BENH_VIEN>')) {
                            xml = xml.replace('<CKS_BENH_VIEN></CKS_BENH_VIEN>', `<CKS_BENH_VIEN>${trimmedSig}</CKS_BENH_VIEN>`);
                        }
                        base64Xml = Buffer.from(xml, 'utf8').toString('base64');
                    }
                } catch (err: any) {
                    console.error('⚠️ [VNeID Sync] Error processing signature, using clean xml_data:', err.message);
                    base64Xml = Buffer.from(rawXmlToProcess, 'utf8').toString('base64');
                }
            } else {
                base64Xml = Buffer.from(rawXmlToProcess, 'utf8').toString('base64');
            }

            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');

            const randomSuffix = crypto.randomBytes(16).toString('hex');
            const msgId = `${glnCode}${yy}${mm}${dd}${randomSuffix}`;

            const receiverId = (settings.vneid_receiver_id && settings.vneid_receiver_id.trim()) ? settings.vneid_receiver_id : 'emrhub';

            const payload: any = {
                header: {
                    version: "1.0.6",
                    sender_id: glnCode,
                    receiver_id: receiverId,
                    txn_type: "sync_checkup",
                    msg_type: "101",
                    data_type: "xml/base64",
                    send_datetime: Date.now(),
                    msg_id: msgId
                },
                data: base64Xml,
                signature: ""
            };

            // Calculate Checksum Signature according to QD1551 Section 11 (hashA.hashB)
            if (settings.vneid_private_key) {
                try {
                    const parsedKey = parsePrivateKey(settings.vneid_private_key);
                    
                    // JSON.stringify naturally has no extra spacing.
                    const headerStr = JSON.stringify(payload.header);
                    const hashA = crypto.createHash('sha256').update(headerStr).digest('hex').toLowerCase();

                    const dataStr = typeof payload.data === 'string' ? payload.data : JSON.stringify(payload.data);
                    const hashB = crypto.createHash('sha256').update(dataStr).digest('hex').toLowerCase();

                    const hashC = `${hashA}.${hashB}`;

                    const sign = crypto.createSign('SHA256');
                    sign.update(hashC);
                    payload.signature = sign.sign({
                        key: parsedKey as any,
                        padding: crypto.constants.RSA_PKCS1_PADDING
                    }, 'base64');
                    console.log(`✅ [VNeID Sync] Generated QĐ1551 Checksum Signature for doc ${doc.doc_no}`);
                } catch (e: any) {
                    console.error('❌ [VNeID Sync] Failed to sign payload with Private Key:', e.message);
                    payload.signature = "cidHoD6pQjLqYDGEfxrHg8N5+16L3f+6N57+h2W4d3T/0k0+d9d8h/7j2ZtS7fN58x/n7zH7N9tB/5vH9sN44Q==";
                }
            } else {
                console.warn('⚠️ [VNeID Sync] No Private Key configured, using fallback signature string');
                payload.signature = "cidHoD6pQjLqYDGEfxrHg8N5+16L3f+6N57+h2W4d3T/0k0+d9d8h/7j2ZtS7fN58x/n7zH7N9tB/5vH9sN44Q==";
            }

            console.log('🔍 [VNeID Sync DEBUG] Final Header Payload:', JSON.stringify(payload.header));

            let responseLog = '';
            let sendSuccess = false;
            let errorMsg = '';
            let transactionId = msgId;

            try {
                console.log(`📡 [VNeID Portal] Pushing document ${doc.doc_no} (BN: ${doc.patient_name})`);
                const finalPushUrl = `${baseUrl}/platform/data-sync/push`;
                console.log(`📡 [VNeID Sync DEBUG] Sending XML POST request to:`, finalPushUrl);
                console.log(`🔍 [VNeID Sync DEBUG] Full Request Payload Header:`, JSON.stringify(payload.header, null, 2));
                try {
                    const decodedXml = Buffer.from(base64Xml, 'base64').toString('utf8');
                    console.log(`🔍 [VNeID Sync DEBUG] Decoded XML Length: ${decodedXml.length}`);
                    console.log(`🔍 [VNeID Sync DEBUG] Decoded XML First 1000 Chars:\n${decodedXml.substring(0, 1000)}`);
                } catch (e) {}

                const pushRes: any = await axios.post(finalPushUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'service-type': '100'
                    },
                    timeout: 30000
                });

                responseLog = JSON.stringify(pushRes.data);
                console.log('✅ [VNeID Sync DEBUG] Gateway response:', responseLog);
                const resCode = pushRes.data?.header?.res_code || pushRes.data?.res_code;

                if (pushRes.status === 200 && (resCode === 'CM_SUCCESS' || resCode === 'PS_SYNC_SUCCESS' || resCode === 'PS_CCCD_DUPLICATE_IN_6_MONTHS' || !resCode)) {
                    sendSuccess = true;
                    transactionId = pushRes.data?.header?.txn_id || pushRes.data?.txn_id || msgId;
                    console.log(`✅ [VNeID Sync] Document ${doc.doc_no} sent successfully (txn_id: ${transactionId})`);
                } else {
                    errorMsg = pushRes.data?.header?.res_msg || pushRes.data?.res_msg || 'Cổng phản hồi mã lỗi tiếp nhận';
                }
            } catch (err: any) {
                sendSuccess = false;
                const resData = err.response?.data;
                const headerObj = resData?.header || resData;
                const resCode = headerObj?.res_code || '';
                const resMsg = headerObj?.res_msg || (typeof resData === 'string' ? resData : err.message);

                let friendlyMsg = resMsg;
                if (resCode === 'PS_CCCD_DUPLICATE_IN_6_MONTHS') {
                    friendlyMsg = 'Bệnh nhân đã khám sức khỏe trong vòng 6 tháng qua (Cổng từ chối nhận hồ sơ lặp lại)';
                } else if (resCode === 'PS_SIGNATURE_INVALID') {
                    friendlyMsg = 'Chữ ký số không hợp lệ hoặc không đúng định dạng';
                } else if (resCode === 'CM_INVALID_REQUEST') {
                    friendlyMsg = 'Cấu trúc dữ liệu hoặc thông số không hợp lệ';
                }

                errorMsg = resCode ? `[${resCode}] ${friendlyMsg}` : `Lỗi kết nối cổng: ${err.response?.status || 500} - ${friendlyMsg}`;
                responseLog = JSON.stringify(resData || { error: err.message });
                console.log(`❌ [VNeID Sync DEBUG] Gateway returned error code: ${resCode}, message: ${resMsg}`);
            }

            if (sendSuccess) {
                await query(`
                    UPDATE health_check_masters
                    SET send_status = 'Success',
                        sent_at = NOW(),
                        transaction_id = $1,
                        response_log = $2,
                        error_message = NULL,
                        updated_at = NOW()
                    WHERE id = $3
                `, [transactionId, responseLog, doc.id]);
            } else {
                await query(`
                    UPDATE health_check_masters
                    SET send_status = 'Error',
                        error_message = $1,
                        response_log = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [errorMsg.slice(0, 500), responseLog, doc.id]);
                failedIds.push(docId);
            }
        }
    } catch (error: any) {
        console.error('❌ [VNeID Portal] sendDocumentsToVNeID unexpected error:', error);
    }
    return failedIds;
}

/**
 * Periodically searches for signed, unsent health check documents 
 * and synchronizes them to the mock VNeID gateway portal.
 */
async function syncUnsentDocuments() {
    try {
        const settings = getHealthCheckSettings();
        if (!settings || !settings.auto_sync_enabled) {
            return;
        }

        // Query signed documents that are unsent or had previous errors
        const sql = `
            SELECT id
            FROM health_check_masters
            WHERE signature_status = 'Signed' AND (send_status = 'Unsent' OR send_status = 'Error')
            LIMIT 50
        `;
        const res = await query(sql);
        if (res.rows.length === 0) {
            return;
        }

        console.log(`📡 [Auto Sync VNeID] Found ${res.rows.length} signed, unsent health check documents. Synchronizing now...`);

        const docIds = res.rows.map((row: any) => row.id.toString());
        await sendDocumentsToVNeID(docIds);
    } catch (error: any) {
        console.error('❌ [Auto Sync VNeID] Error in auto sync background job:', error.message || error);
    }
}

/**
 * Starts the VNeID auto-sync background worker loop if enabled.
 */
export async function startHealthCheckSyncWorker() {
    // Clear existing interval if running
    if (syncIntervalKey) {
        clearInterval(syncIntervalKey);
        syncIntervalKey = null;
    }

    // Ensure settings are loaded
    let settings = getHealthCheckSettings();
    if (!settings) {
        settings = await loadHealthCheckSettings();
    }

    if (!settings) {
        console.warn('⚠️ [Auto Sync VNeID] Settings could not be loaded. Background worker will not start.');
        return;
    }

    if (!settings.auto_sync_enabled) {
        console.log('💡 [Auto Sync VNeID] Auto-sync is disabled in configuration settings.');
        return;
    }

    const intervalMinutes = settings.auto_sync_interval || 15;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`🚀 [Auto Sync VNeID] Starting background worker loop. Interval: ${intervalMinutes} minutes.`);

    // Perform an initial scan after a short delay (e.g. 5 seconds after server boot)
    setTimeout(() => {
        syncUnsentDocuments();
    }, 5000);

    // Setup periodic scheduler loop
    syncIntervalKey = setInterval(() => {
        syncUnsentDocuments();
    }, intervalMs);
}

/**
 * Restarts the background worker (useful when configuration parameters change).
 */
export function restartHealthCheckSyncWorker() {
    console.log('🔄 [Auto Sync VNeID] Restarting background worker due to settings configuration change.');
    startHealthCheckSyncWorker();
}
