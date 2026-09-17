import crypto from 'node:crypto';

/**
 * Service xử lý chuẩn hóa ký số 2 cấp độ (Bác sĩ kết luận + Bệnh viện)
 * Theo đúng hướng dẫn đặc tả:
 * - Bước 1: Ký CKS_NGUOI_KET_LUAN (để trống cả 2 thẻ CKS_NGUOI_KET_LUAN và CKS_BENH_VIEN, băm SHA-256)
 * - Bước 2: Ký CKS_BENH_VIEN (dán CKS_NGUOI_KET_LUAN vào, để trống CKS_BENH_VIEN, băm SHA-256, dán vào CKS_BENH_VIEN)
 */
export class HealthCheckTwoTierSignerService {

    /**
     * Chuẩn hóa XML ở trạng thái Bước 1 (để trống cả 2 thẻ CKS_NGUOI_KET_LUAN và CKS_BENH_VIEN)
     */
    public prepareXmlForStep1(rawXml: string): string {
        let xml = rawXml;
        // Đảm bảo khối CHUKYDONVI tồn tại
        if (!xml.includes('<CHUKYDONVI')) {
            if (xml.includes('</KHAMSUCKHOE>')) {
                xml = xml.replace('</KHAMSUCKHOE>', '\t<CHUKYDONVI>\n\t\t<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>\n\t\t<CKS_BENH_VIEN></CKS_BENH_VIEN>\n\t</CHUKYDONVI>\n</KHAMSUCKHOE>');
            } else {
                xml += '\n<CHUKYDONVI>\n\t<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>\n\t<CKS_BENH_VIEN></CKS_BENH_VIEN>\n</CHUKYDONVI>';
            }
        }
        if (xml.includes('<CHUKYDONVI />') || xml.includes('<CHUKYDONVI/>')) {
            xml = xml.replace(/<CHUKYDONVI\s*\/>/gi, '<CHUKYDONVI>\n\t\t<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>\n\t\t<CKS_BENH_VIEN></CKS_BENH_VIEN>\n\t</CHUKYDONVI>');
        }
        // Chuẩn hóa thẻ tự đóng thành thẻ đóng mở rỗng
        xml = xml.replace(/<CKS_NGUOI_KET_LUAN\s*\/>/gi, '<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>');
        xml = xml.replace(/<CKS_BENH_VIEN\s*\/>/gi, '<CKS_BENH_VIEN></CKS_BENH_VIEN>');

        // Xóa nội dung cũ trong 2 thẻ nếu có
        xml = xml.replace(/<CKS_NGUOI_KET_LUAN>[\s\S]*?<\/CKS_NGUOI_KET_LUAN>/gi, '<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>');
        xml = xml.replace(/<CKS_BENH_VIEN>[\s\S]*?<\/CKS_BENH_VIEN>/gi, '<CKS_BENH_VIEN></CKS_BENH_VIEN>');
        return xml;
    }

    /**
     * Bước 1: Tính hash SHA-256 của toàn bộ nội dung file (để trống 2 thẻ)
     */
    public getStep1Hash(rawXml: string): { hashHex: string; hashBase64: string; preparedXml: string } {
        const preparedXml = this.prepareXmlForStep1(rawXml);
        const hash = crypto.createHash('sha256').update(Buffer.from(preparedXml, 'utf8'));
        return {
            hashHex: hash.copy().digest('hex'),
            hashBase64: hash.digest('base64'),
            preparedXml
        };
    }

    /**
     * Bước 1 (Hoàn tất): Dán nội dung Base64 chữ ký Bác sĩ vào thẻ <CKS_NGUOI_KET_LUAN>
     */
    public applyDoctorSignature(rawXml: string, doctorSignatureBase64: string): string {
        const step1Xml = this.prepareXmlForStep1(rawXml);
        const cleanSig = (doctorSignatureBase64 || '').trim().replace(/\r?\n|\r/g, '');
        return step1Xml.replace(
            '<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>',
            `<CKS_NGUOI_KET_LUAN>${cleanSig}</CKS_NGUOI_KET_LUAN>`
        );
    }

    /**
     * Bước 2: Chuẩn hóa XML (đã có CKS_NGUOI_KET_LUAN, thẻ CKS_BENH_VIEN để trống) và tính hash SHA-256
     */
    public getStep2Hash(xmlWithDoctorSig: string): { hashHex: string; hashBase64: string; preparedXml: string } {
        let xml = xmlWithDoctorSig;
        // Đảm bảo thẻ CKS_BENH_VIEN để trống
        xml = xml.replace(/<CKS_BENH_VIEN\s*\/>/gi, '<CKS_BENH_VIEN></CKS_BENH_VIEN>');
        xml = xml.replace(/<CKS_BENH_VIEN>[\s\S]*?<\/CKS_BENH_VIEN>/gi, '<CKS_BENH_VIEN></CKS_BENH_VIEN>');
        const hash = crypto.createHash('sha256').update(Buffer.from(xml, 'utf8'));
        return {
            hashHex: hash.copy().digest('hex'),
            hashBase64: hash.digest('base64'),
            preparedXml: xml
        };
    }

    /**
     * Bước 2 (Hoàn tất): Dán nội dung Base64 chữ ký Bệnh viện vào thẻ <CKS_BENH_VIEN>
     */
    public applyHospitalSignature(xmlWithDoctorSig: string, hospitalSignatureBase64: string): string {
        let xml = xmlWithDoctorSig;
        // Đảm bảo thẻ CKS_BENH_VIEN để trống trước khi chèn
        xml = xml.replace(/<CKS_BENH_VIEN\s*\/>/gi, '<CKS_BENH_VIEN></CKS_BENH_VIEN>');
        xml = xml.replace(/<CKS_BENH_VIEN>[\s\S]*?<\/CKS_BENH_VIEN>/gi, '<CKS_BENH_VIEN></CKS_BENH_VIEN>');
        const cleanSig = (hospitalSignatureBase64 || '').trim().replace(/\r?\n|\r/g, '');
        return xml.replace(
            '<CKS_BENH_VIEN></CKS_BENH_VIEN>',
            `<CKS_BENH_VIEN>${cleanSig}</CKS_BENH_VIEN>`
        );
    }

    /**
     * Thực hiện ký số bằng Private Key (RSA-SHA256) trên dữ liệu chuỗi XML
     */
    public signContentWithPrivateKey(contentToSign: string, privateKeyPemOrDer: string | Buffer | crypto.KeyObject): string {
        const signer = crypto.createSign('RSA-SHA256');
        signer.update(Buffer.from(contentToSign, 'utf8'));
        signer.end();
        return signer.sign(privateKeyPemOrDer as any, 'base64');
    }

    /**
     * Kiểm tra xem XML đã chứa đầy đủ 2 chữ ký hay chưa
     */
    public isFullySigned(xml: string): { fullySigned: boolean; hasDoctorSig: boolean; hasHospitalSig: boolean } {
        if (!xml) return { fullySigned: false, hasDoctorSig: false, hasHospitalSig: false };
        const docMatch = xml.match(/<CKS_NGUOI_KET_LUAN>([\s\S]*?)<\/CKS_NGUOI_KET_LUAN>/i);
        const hasDoctorSig = Boolean(docMatch && docMatch[1].trim().length > 0);

        const hospMatch = xml.match(/<CKS_BENH_VIEN>([\s\S]*?)<\/CKS_BENH_VIEN>/i);
        const hasHospitalSig = Boolean(hospMatch && hospMatch[1].trim().length > 0);

        return {
            fullySigned: hasDoctorSig && hasHospitalSig,
            hasDoctorSig,
            hasHospitalSig
        };
    }
}

export const healthCheckTwoTierSigner = new HealthCheckTwoTierSignerService();
