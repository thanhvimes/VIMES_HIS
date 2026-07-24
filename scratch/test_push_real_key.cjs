const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0aGFvcG0zMDEyQGdtYWlsLmNvbSIsInN0YXR1c19hY2NvdW50IjoiMSIsIm1hX2Nza2IiOiI4OTM0Mjg1MDA4MTM1IiwiYWNjb3VudF9sZXZlbCI6IjEiLCJzZXNzaW9uX2lkIjoiMjY4YWRmYmYtNjdlYS00MjM3LTkyMDgtZDQwNDU4YTc1ZmJmIiwicGVybWlzc2lvbl9pZCI6ImViNTczOWQwLTAzNDUtNDNjNS04ODQyLTNhOTFiYzcxMmQ5NiIsInV1aWQiOiJlZTg1YTBhNy05YmRjLTQ4ZjktODU3NC0xNzQ2NzdiZTY0ZmUiLCJhdXRob3JpdGllcyI6WyJsb2dpbiIsImZhY2lsaXR5LWFwaSJdLCJwcm92aW5jZV9pZCI6MzcsIm1hX2dyX3N5dCI6IlNZVDM3IiwidXNlcm5hbWUiOiI4OTM0Mjg1MDA4MTM1X2FwaSIsInV0IjoiZmFjaWxpdHktYXBpIiwiaXNzIjoiaWRlbnRpdHkiLCJleHAiOjE3ODUwMDI2NzQsImlhdCI6MTc4NDY0MjY3NH0.I87fQUE9vZ4ltfCWvvvpxmoukXfAmJJuZbz1fujwNLI';
const privateKeyPem = fs.readFileSync('scratch/real_private_key.pem', 'utf8');

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

const dataStr = typeof payload.data === 'string' ? payload.data : JSON.stringify(payload.data).replace(/\s+/g, '');
const hashB = crypto.createHash('sha256').update(dataStr).digest('hex').toUpperCase();

const hashC = `${hashA}.${hashB}`;

const sign = crypto.createSign('SHA256');
sign.update(hashC);
const signature = sign.sign({
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PADDING
}, 'base64');

payload.signature = signature;

async function testPushRealKey() {
    console.log(`📡 Sending test push signed with REAL CSKCB Private Key...`);
    console.log(`   msg_id: ${msgId}`);

    try {
        const res = await axios.post('https://api-sandbox.emrhub.vn/api/platform/data-sync/push', payload, {
            headers: {
                'service-type': '100',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`\n🎉🎉🎉 SUCCESS (${res.status}):`);
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.log(`\n❌ FAILED (${err.response?.status}):`);
        console.log(JSON.stringify(err.response?.data || err.message, null, 2));
    }
}

testPushRealKey();
