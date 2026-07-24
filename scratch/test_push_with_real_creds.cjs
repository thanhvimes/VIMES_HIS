const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

const rawPrivateKeyB64 = `MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDDUMitnqYjnO55+YmB1G/3/1aEj4BlygA91yia3Hd99PA7D79c2XnHN3PTZxn2nFDnfONg8om6qBxCA8fs5rBsog9ireh91YDe3dm642mEvejqxzRdtuzg4Pb6L2JZzsg5i5skZoKrvYeiF1S63bLxWzh8Vf0g1andSxdrRmAadVEpFXiu10kMtiFU2+Q+KPSquhXh10izuTGPgqibJfiaFNqxrqB+q2cW6EPJLaoHNYaPfkjwXuCAZziLNJLsZiRmJgOBFpsYdAkHwDJlSbERf5UcmE9GfwKih1OhhALU3tz+T++JE3LImLzckFvHIWwJTcRxF8ipLO9l/7oJuNvVAgMBAAECggEAXvNC28Sol9+Ov5VkF82isTlcYg0xKkrNW0Lh5ocPQBh3QP8i1IyU+xgmIruYj57mZeL81wCRnEBlnGIiKzTqx6TxPdO1lpbYk3/efVBY18NLG/fDqVtoRNqYtn+anHY+OFt6DHQZSkxVR6N3+XAVsefayfczm2bDsWTz+Z640aMkpeWm1N7bqSmoeVPDyn/6CliMHHl4+2Hb8k9tUgCHx/KKh/U4/rkHmOfGyVjGGITTeHdbY9DeOpvG76e20i5Rn9pSy9zKKJ9IQ7/2YknhZD7AIHCVK+iFgWv7RkfgCjULM4Lpkbo3hbRhT/QSx+jSROD4UGAK15fYMgarFMB58QKBgQDzSSrq1TErd/EYw+Fy4vDrtLzbiNH7NonfcBVeAliaAK0x8xfT/Pek8RHUrt+u1UD/tMfywqRXU3h+ARCFBbR7nkASN2ht1sSrbxEqUb309des1b0Qzjo3QZvhaEXCVjEDsQGQOMdILBIXVwt45T/jKvpGhpvGIgw6MEtBJ/yJKwKBgQDNhdb5gECUPn5gD6y3whpVLgWIWETNBB7Wim2VaKQFugJMxSXRIqVnsEW1EFg02FLcDHmwPkdsgqKr65HkGmYpnXkX1sfv8/1U5OMlf8LbyBbSVMy8VBjQkdugndFnuMfW2tYgJvdmz7oMHJnaI+ao3eoX29NPYQUBHGMlxVOu/wKBgQDFvqIgsFq//0S7oXOdYzL6EzUyp/otW74jHEJx4CxOOOCN6g5jI4nSypN4sQ9lVzb24OVov6a+yDz3Bjx8Mw/pLs7bP6glJ11CDwv/vuNMuYqtlCmSAF43TZ+7TnrtJAvA+V3Q8SWh1xh5WiocARK1vdgh/QWevUv8/AYfFrZgcwKBgQCHCQ06WZ4UyQrXqvTct9f9Z4OTFgv+eFqas9FUfbBnYtPoBRDX3F+5RQRH9zk9X3Txx/CccA8VqK+hLeJpcT720NSjaSds7W7hvJHSLaOmLE1yXO04QDkdsPgRDCBueeYzsQ1HitK65nljQ9eCkFwZT9VjX7fzS9ex5yjtxD07mQKBgQDXjaYD0PpKmC034w+NX/V6SDOoPpFqDibYwk3JRGhM96UDFNjQCfzY2DRkZeW90nQlldowO8o5DXNlJV+SCFFGfI75BdEHoC1fXPANZbmBMRW6x9szqpa68l5R0LUSyYQWjAHqF4fuc5doF2toz8fUxcSoD3JkNszGyg9SVCp0lQ==`;
const pemPrivateKey = `-----BEGIN PRIVATE KEY-----\n${rawPrivateKeyB64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;

const xml1 = `<?xml version="1.0" encoding="utf-8"?>
<THONG_TIN_HANH_CHINH>
    <HO_TEN>TRẦN VĂN LỚN</HO_TEN>
    <GIOI_TINH>1</GIOI_TINH>
    <NGAY_SINH>2001-07-07</NGAY_SINH>
    <MA_DAN_TOC>01</MA_DAN_TOC>
    <SO_CCCD>037080003424</SO_CCCD>
    <DIA_CHI>Số 123 Đường Trần Hưng Đạo, Hà Nội</DIA_CHI>
    <MATINH_CU_TRU>01</MATINH_CU_TRU>
    <MAXA_CU_TRU>00001</MAXA_CU_TRU>
</THONG_TIN_HANH_CHINH>`;

const xml2 = `<?xml version="1.0" encoding="utf-8"?>
<THONG_TIN_CHUNG_VE_LAN_KHAM>
    <MA_LK>26292429</MA_LK>
    <MA_CSKCB>8934285008135</MA_CSKCB>
    <MA_GTIN_CSKCB>8934285008135</MA_GTIN_CSKCB>
    <DOI_TUONG>14</DOI_TUONG>
    <NGUON_CHI_TRA>9</NGUON_CHI_TRA>
    <MA_LOAI_KCB>01</MA_LOAI_KCB>
    <NGAY_VAO>202607210000</NGAY_VAO>
</THONG_TIN_CHUNG_VE_LAN_KHAM>`;

const xml3 = `<?xml version="1.0" encoding="utf-8"?>
<DANH_GIA_DAU_HIEU_SINH_TON>
    <NHIET_DO>36.5</NHIET_DO>
    <MACH>80</MACH>
    <NHIP_THO>20</NHIP_THO>
    <HUYET_AP>120/80</HUYET_AP>
</DANH_GIA_DAU_HIEU_SINH_TON>`;

const xml10 = `<?xml version="1.0" encoding="utf-8"?>
<KHAM_THE_LUC>
    <CHIEU_CAO>165</CHIEU_CAO>
    <CAN_NANG>60</CAN_NANG>
    <CHI_SO_BMI>22.0</CHI_SO_BMI>
    <KHAM_THE_LUC_PL>1</KHAM_THE_LUC_PL>
</KHAM_THE_LUC>`;

const xml11 = `<?xml version="1.0" encoding="utf-8"?>
<KHAM_CAN_LAM_SANG>
    <CHI_TIET_CLS>
        <MA_DICH_VU>B1100467</MA_DICH_VU>
        <MA_CHI_SO>B1100467</MA_CHI_SO>
        <GIA_TRI>1.0</GIA_TRI>
        <DON_VI_DO>Lần</DON_VI_DO>
        <MO_TA>Bình thường</MO_TA>
        <KET_LUAN>Bình thường</KET_LUAN>
    </CHI_TIET_CLS>
</KHAM_CAN_LAM_SANG>`;

const xml8 = `<?xml version="1.0" encoding="utf-8"?>
<KET_LUAN>
    <PHAN_LOAI_SK>1</PHAN_LOAI_SK>
    <KET_LUAN_BENH>Bình thường</KET_LUAN_BENH>
</KET_LUAN>`;

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');

const envelope = `<?xml version="1.0" encoding="utf-8"?>
<KHAMSUCKHOE xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <THONGTINDONVI>
        <MACSKCB>8934285008135</MACSKCB>
    </THONGTINDONVI>
    <THONGTINHOSO>
        <NGAYLAP>20260721</NGAYLAP>
        <SOLUONGHOSO>1</SOLUONGHOSO>
        <DANHSACHHOSO>
            <HOSO>
                <FILEHOSO>
                    <LOAIHOSO>XML1</LOAIHOSO>
                    <NOIDUNGFILE>${b64(xml1)}</NOIDUNGFILE>
                </FILEHOSO>
                <FILEHOSO>
                    <LOAIHOSO>XML2</LOAIHOSO>
                    <NOIDUNGFILE>${b64(xml2)}</NOIDUNGFILE>
                </FILEHOSO>
                <FILEHOSO>
                    <LOAIHOSO>XML3</LOAIHOSO>
                    <NOIDUNGFILE>${b64(xml3)}</NOIDUNGFILE>
                </FILEHOSO>
                <FILEHOSO>
                    <LOAIHOSO>XML10</LOAIHOSO>
                    <NOIDUNGFILE>${b64(xml10)}</NOIDUNGFILE>
                </FILEHOSO>
                <FILEHOSO>
                    <LOAIHOSO>XML11</LOAIHOSO>
                    <NOIDUNGFILE>${b64(xml11)}</NOIDUNGFILE>
                </FILEHOSO>
                <FILEHOSO>
                    <LOAIHOSO>XML8</LOAIHOSO>
                    <NOIDUNGFILE>${b64(xml8)}</NOIDUNGFILE>
                </FILEHOSO>
            </HOSO>
        </DANHSACHHOSO>
    </THONGTINHOSO>
    <CHUKYDONVI />
</KHAMSUCKHOE>`;

const base64Content = Buffer.from(envelope, 'utf8').toString('base64');

async function testFullFlow() {
    console.log('🔑 1. Logging into Sandbox Gateway...');
    const loginRes = await axios.post('https://api-sandbox.emrhub.vn/api/auth/login', {
        username: '8934285008135_api',
        password: 'Abc@1234'
    });
    const token = loginRes.data?.data?.token || loginRes.data?.token;
    console.log('✅ Login SUCCESS! Token acquired.');

    const randomUuid = Math.random().toString(36).substring(2, 10) + Date.now();
    const msgId = `8934285008135260721${randomUuid}`;

    const payload = {
        header: {
            version: "1.0.6",
            sender_id: "8934285008135",
            receiver_id: "emrhub",
            txn_type: "sync_checkup",
            msg_type: "101",
            data_type: "xml/base64",
            send_datetime: Date.now(),
            msg_id: msgId
        },
        data: base64Content
    };

    const headerStr = JSON.stringify(payload.header).replace(/\s+/g, '');
    const hashA = crypto.createHash('sha256').update(headerStr).digest('hex').toUpperCase();

    const dataStr = payload.data;
    const hashB = crypto.createHash('sha256').update(dataStr).digest('hex').toUpperCase();

    const hashC = `${hashA}.${hashB}`;

    const sign = crypto.createSign('SHA256');
    sign.update(hashC);
    const signature = sign.sign({
        key: pemPrivateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
    }, 'base64');

    payload.signature = signature;

    console.log('📡 2. Pushing payload to https://api-sandbox.emrhub.vn/api/platform/data-sync/push ...');
    try {
        const pushRes = await axios.post('https://api-sandbox.emrhub.vn/api/platform/data-sync/push', payload, {
            headers: {
                'service-type': '100',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('\n🎉🎉🎉 GATEWAY RESPONSE SUCCESS (200):');
        console.log(JSON.stringify(pushRes.data, null, 2));
    } catch (pushErr) {
        console.log(`\n❌ GATEWAY ERROR (${pushErr.response?.status}):`);
        console.log(JSON.stringify(pushErr.response?.data || pushErr.message, null, 2));
    }
}

testFullFlow().catch(e => console.error('Flow Exception:', e.message));
