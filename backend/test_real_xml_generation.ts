import axios from 'axios';
import crypto from 'crypto';
import { loadHealthCheckSettings } from './src/config/health-check-settings';

async function testBase64InnerNoidungfile() {
    try {
        await loadHealthCheckSettings();

        const loginRes: any = await axios.post('https://api-sandbox.emrhub.vn/api/auth/login', {
            username: '8934285008135_api',
            password: 'Abc@1234'
        });
        const token = loginRes.data?.data?.token || loginRes.data?.token;

        const xml1_inner = Buffer.from(`<THONG_TIN_HANH_CHINH>
	<HO_TEN>NGUYỄN THỊ LAN</HO_TEN>
	<GIOI_TINH>2</GIOI_TINH>
	<NGAY_SINH>19900515</NGAY_SINH>
	<TUAN_THAI>0</TUAN_THAI>
	<SINH_NON>0</SINH_NON>
	<MA_DAN_TOC>01</MA_DAN_TOC>
	<SO_CCCD>037090008888</SO_CCCD>
	<NGAYCAP_CCCD>20210410</NGAYCAP_CCCD>
	<NOICAP_CCCD>Cục CSDLQG về dân cư</NOICAP_CCCD>
	<NHOM_MAU>O+</NHOM_MAU>
	<DIA_CHI>Số 102 Đường Lê Lợi, Phường Bến Nghé, Quận 1</DIA_CHI>
	<MATINH_CU_TRU>79</MATINH_CU_TRU>
	<MAXA_CU_TRU>26740</MAXA_CU_TRU>
	<DIEN_THOAI>0988777666</DIEN_THOAI>
	<NGUOI_GIAM_HO></NGUOI_GIAM_HO>
	<SO_CCCD_NGH></SO_CCCD_NGH>
	<DIEN_THOAI_NGH></DIEN_THOAI_NGH>
	<HO_TEN_NGUOI_DI_CUNG></HO_TEN_NGUOI_DI_CUNG>
	<SO_CCCD_NGUOI_DI_CUNG></SO_CCCD_NGUOI_DI_CUNG>
	<MOI_QUAN_HE_VOI_TRE>0</MOI_QUAN_HE_VOI_TRE>
	<DIEN_THOAI_NGUOI_DI_CUNG></DIEN_THOAI_NGUOI_DI_CUNG>
	<MA_NGHE_NGHIEP>04</MA_NGHE_NGHIEP>
	<NOI_LAM_VIEC_HOC_TAP>Bệnh viện Đa khoa Quốc tế</NOI_LAM_VIEC_HOC_TAP>
	<LY_DO_VV>Khám sức khỏe tuyển dụng</LY_DO_VV>
</THONG_TIN_HANH_CHINH>`, 'utf8').toString('base64');

        const xml2_inner = Buffer.from(`<THONG_TIN_CHUNG_VE_LAN_KHAM>
	<MA_LK>26292429</MA_LK>
	<MA_CSKCB>37101</MA_CSKCB>
	<TYPE>Adult</TYPE>
	<MA_GTIN_CSKCB>8934285008135</MA_GTIN_CSKCB>
	<DOI_TUONG>1</DOI_TUONG>
	<NGUON_CHI_TRA>2</NGUON_CHI_TRA>
	<MA_LOAI_KCB>01</MA_LOAI_KCB>
	<NGAY_VAO>202607241247</NGAY_VAO>
</THONG_TIN_CHUNG_VE_LAN_KHAM>`, 'utf8').toString('base64');

        const fullXml = `<?xml version="1.0" encoding="utf-8"?>
<KHAMSUCKHOE xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
	<THONGTINDONVI>
		<MACSKCB>8934285008135</MACSKCB>
	</THONGTINDONVI>
	<THONGTINHOSO>
		<NGAYLAP>20260724</NGAYLAP>
		<SOLUONGHOSO>1</SOLUONGHOSO>
		<DANHSACHHOSO>
			<HOSO>
				<FILEHOSO>
					<LOAIHOSO>XML1</LOAIHOSO>
					<NOIDUNGFILE>${xml1_inner}</NOIDUNGFILE>
				</FILEHOSO>
				<FILEHOSO>
					<LOAIHOSO>XML2</LOAIHOSO>
					<NOIDUNGFILE>${xml2_inner}</NOIDUNGFILE>
				</FILEHOSO>
			</HOSO>
		</DANHSACHHOSO>
	</THONGTINHOSO>
	<CHUKYDONVI>
		<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>
		<CKS_BENH_VIEN></CKS_BENH_VIEN>
	</CHUKYDONVI>
</KHAMSUCKHOE>`;

        const base64Payload = Buffer.from(fullXml, 'utf8').toString('base64');

        const gln = '8934285008135';
        const uuidHex = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : crypto.randomBytes(16).toString('hex');
        const msgId = `${gln}260724${uuidHex}`;

        const payload = {
            header: {
                version: "1.0.6",
                sender_id: gln,
                receiver_id: "TTYQG",
                txn_type: "sync_checkup",
                msg_id: msgId,
                msg_type: "101",
                data_type: "xml/base64",
                send_datetime: Date.now()
            },
            data: base64Payload
        };

        console.log('📡 Testing Base64 inner NOIDUNGFILE payload...');
        const res: any = await axios.post('https://api-sandbox.emrhub.vn/api/platform/data-sync/push', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'service-type': '100'
            },
            timeout: 30000
        });

        console.log('🎉 RESPONSE:', JSON.stringify(res.data, null, 2));

    } catch (err: any) {
        console.error('❌ Request status:', err.response?.status);
        console.error('❌ Response data:', JSON.stringify(err.response?.data || err.message, null, 2));
    }
    process.exit(0);
}

testBase64InnerNoidungfile();
