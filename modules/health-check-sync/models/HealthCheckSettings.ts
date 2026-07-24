import { healthCheckService } from '../../../services/healthCheckService';

export interface SettingsData {
    vneid_url: string;
    vneid_username: string;
    vneid_password: string;
    ma_cskcb: string;
    ma_cskcb_byt?: string;
    ma_gtin_cskcb: string;
    auto_sync_enabled: boolean;
    auto_sync_interval: number;
    barcode_label_size_xn: string;
    barcode_label_size_ksk: string;
    barcode_show_hospital: boolean;
    barcode_show_date: boolean;
    barcode_show_sample_type: boolean;
    allow_unsigned_sync: boolean;
    barcode_zpl_template_xn: string;
    barcode_zpl_template_ksk: string;
    barcode_printer_name: string;
    reception_slip_template: string;
    use_qz_tray: boolean;
    vneid_private_key: string;
    vneid_public_key: string;
    signature_type: 'USB' | 'HSM';
    hsm_url?: string;
    hsm_provider?: string;
    hsm_username?: string;
    hsm_password?: string;
    hsm_client_id?: string;
    hsm_client_secret?: string;
}

export class HealthCheckSettings implements SettingsData {
    vneid_url: string = 'https://api-sandbox.emrhub.vn/api';
    vneid_username: string = '8934285008135_api';
    vneid_password: string = '';
    ma_cskcb: string = '8934285008135';
    ma_cskcb_byt: string = '37101';
    ma_gtin_cskcb: string = '8934285008135';
    auto_sync_enabled: boolean = false;
    auto_sync_interval: number = 15;
    barcode_label_size_xn: string = '50x30';
    barcode_label_size_ksk: string = '50x30';
    barcode_show_hospital: boolean = true;
    barcode_show_date: boolean = true;
    barcode_show_sample_type: boolean = true;
    allow_unsigned_sync: boolean = false;
    barcode_zpl_template_xn: string = '^XA\\n^PW400\\n^LL240\\n^CF0,26\\n^FO15,15^FD{patient}^FS\\n^FO340,15^FD{age}^FS\\n^CF0,22\\n^FO15,45^FD{doc_no}^FS\\n^FO190,45^FD{gender}^FS\\n^FO340,45^FD{dept}^FS\\n^BY2,2,65\\n^FO30,75^BCN,65,N,N^FD{code}^FS\\n^CF0,22\\n^FO100,150^FD{code}^FS\\n^CF0,36\\n^FO330,155^FD{sample_type_short}^FS\\n^CF0,18\\n^FO15,195^FD{date}^FS\\n^XZ';
    barcode_zpl_template_ksk: string = '^XA\n^CF0,26\n^FO30,30^FD{hospital}^FS\n^FO30,70^FD{patient}^FS\n^FO30,105^FD{form_name}^FS\n^FO30,140^FD{info}^FS\n^BY2,2,40\n^FO30,175^BCN,,N,N\n^FD{code}^FS\n^FO30,225^FD{code}^FS\n^XZ';
    barcode_printer_name: string = 'Zebra';
    use_qz_tray: boolean = false;
    vneid_private_key: string = '';
    vneid_public_key: string = '';
    signature_type: 'USB' | 'HSM' = 'HSM';
    hsm_url?: string = 'http://vimes.xyz:8091';
    hsm_provider?: string = 'VNPT-CA';
    hsm_username?: string = '';
    hsm_password?: string = '';
    hsm_client_id?: string = '';
    hsm_client_secret?: string = '';
    reception_slip_template: string = `<div class="header">
    <div class="hospital-name">BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH</div>
    <div class="title">PHIẾU TIẾP ĐÓN</div>
</div>

<div class="divider"></div>

<table class="info-table">
    <tr>
        <td class="info-label">Số hồ sơ:</td>
        <td class="info-value" style="font-weight: bold; font-size: 15px;">{{docNo}}</td>
    </tr>
    <tr>
        <td class="info-label">Họ tên:</td>
        <td class="info-value" style="font-weight: bold; font-size: 15px;">{{name}}</td>
    </tr>
    <tr>
        <td class="info-label">Năm sinh:</td>
        <td class="info-value">{{dob}}</td>
    </tr>
    <tr>
        <td class="info-label">CCCD:</td>
        <td class="info-value">{{cardId}}</td>
    </tr>
    <tr>
        <td class="info-label">Địa chỉ:</td>
        <td class="info-value">{{address}}</td>
    </tr>
</table>

<div class="divider"></div>

<div class="barcode-section">
    <div class="barcode-container">
        <svg id="barcode"></svg>
    </div>
    <div class="barcode-time">In: {{dateStr}}</div>
</div>

<div class="divider"></div>

<table class="vitals-table">
    <tr>
        <td class="vitals-label">Cân nặng:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">kg</td>
    </tr>
    <tr>
        <td class="vitals-label">Chiều cao:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">cm</td>
    </tr>
    <tr>
        <td class="vitals-label">Mạch:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">lần/phút</td>
    </tr>
    <tr>
        <td class="vitals-label">Huyết áp:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit">mmHg</td>
    </tr>
    <tr>
        <td class="vitals-label">Mắt phải:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit"></td>
    </tr>
    <tr>
        <td class="vitals-label">Mắt trái:</td>
        <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
        <td class="vitals-unit"></td>
    </tr>
</table>

<div class="divider" style="margin-top: 15px;"></div>`;

    constructor(data?: Partial<SettingsData>) {
        if (data) {
            this.vneid_url = data.vneid_url ?? this.vneid_url;
            this.vneid_username = data.vneid_username ?? this.vneid_username;
            this.vneid_password = data.vneid_password ?? this.vneid_password;
            this.ma_cskcb = data.ma_cskcb ?? this.ma_cskcb;
            this.ma_cskcb_byt = data.ma_cskcb_byt ?? this.ma_cskcb_byt;
            this.ma_gtin_cskcb = data.ma_gtin_cskcb ?? this.ma_gtin_cskcb;
            this.auto_sync_enabled = data.auto_sync_enabled === true;
            this.auto_sync_interval = data.auto_sync_interval ?? this.auto_sync_interval;
            this.barcode_label_size_xn = data.barcode_label_size_xn ?? this.barcode_label_size_xn;
            this.barcode_label_size_ksk = data.barcode_label_size_ksk ?? this.barcode_label_size_ksk;
            this.barcode_show_hospital = data.barcode_show_hospital !== false;
            this.barcode_show_date = data.barcode_show_date !== false;
            this.barcode_show_sample_type = data.barcode_show_sample_type !== false;
            this.allow_unsigned_sync = data.allow_unsigned_sync === true;
            this.barcode_zpl_template_xn = data.barcode_zpl_template_xn ?? this.barcode_zpl_template_xn;
            this.barcode_zpl_template_ksk = data.barcode_zpl_template_ksk ?? this.barcode_zpl_template_ksk;
            this.barcode_printer_name = data.barcode_printer_name ?? this.barcode_printer_name;
            this.reception_slip_template = data.reception_slip_template ?? this.reception_slip_template;
            this.use_qz_tray = data.use_qz_tray === true;
            this.vneid_private_key = data.vneid_private_key ?? this.vneid_private_key;
            this.vneid_public_key = data.vneid_public_key ?? this.vneid_public_key;
            this.signature_type = data.signature_type ?? this.signature_type;
            this.hsm_url = data.hsm_url ?? this.hsm_url;
            this.hsm_provider = data.hsm_provider ?? this.hsm_provider;
            this.hsm_username = data.hsm_username ?? this.hsm_username;
            this.hsm_password = data.hsm_password ?? this.hsm_password;
            this.hsm_client_id = data.hsm_client_id ?? this.hsm_client_id;
            this.hsm_client_secret = data.hsm_client_secret ?? this.hsm_client_secret;
        }
    }

    static getDefaults(): HealthCheckSettings {
        return new HealthCheckSettings();
    }

    static async loadFromServer(): Promise<HealthCheckSettings> {
        try {
            const raw = await healthCheckService.getSettings();
            return new HealthCheckSettings(raw);
        } catch (error) {
            console.error('Error loading settings through HealthCheckSettings class:', error);
            throw error;
        }
    }

    async saveToServer(): Promise<{ success: boolean }> {
        try {
            return await healthCheckService.updateSettings(this.toJSON());
        } catch (error) {
            console.error('Error saving settings through HealthCheckSettings class:', error);
            throw error;
        }
    }

    validate(): { isValid: boolean; errors: Partial<Record<keyof SettingsData, string>> } {
        const errors: Partial<Record<keyof SettingsData, string>> = {};
        if (!this.vneid_url.trim()) {
            errors.vneid_url = 'Địa chỉ URL cổng kết nối không được để trống';
        }
        if (!this.ma_cskcb.trim()) {
            errors.ma_cskcb = 'Mã cơ sở KCB không được để trống';
        }
        if (this.auto_sync_enabled && (!this.auto_sync_interval || this.auto_sync_interval <= 0)) {
            errors.auto_sync_interval = 'Khoảng thời gian đồng bộ tự động phải lớn hơn 0 phút';
        }
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    toJSON(): SettingsData {
        return {
            vneid_url: this.vneid_url,
            vneid_username: this.vneid_username,
            vneid_password: this.vneid_password,
            ma_cskcb: this.ma_cskcb,
            ma_cskcb_byt: this.ma_cskcb_byt,
            ma_gtin_cskcb: this.ma_gtin_cskcb,
            auto_sync_enabled: this.auto_sync_enabled,
            auto_sync_interval: this.auto_sync_interval,
            barcode_label_size_xn: this.barcode_label_size_xn,
            barcode_label_size_ksk: this.barcode_label_size_ksk,
            barcode_show_hospital: this.barcode_show_hospital,
            barcode_show_date: this.barcode_show_date,
            barcode_show_sample_type: this.barcode_show_sample_type,
            allow_unsigned_sync: this.allow_unsigned_sync,
            barcode_zpl_template_xn: this.barcode_zpl_template_xn,
            barcode_zpl_template_ksk: this.barcode_zpl_template_ksk,
            barcode_printer_name: this.barcode_printer_name,
            reception_slip_template: this.reception_slip_template,
            use_qz_tray: this.use_qz_tray,
            vneid_private_key: this.vneid_private_key,
            vneid_public_key: this.vneid_public_key,
            signature_type: this.signature_type,
            hsm_url: this.hsm_url,
            hsm_provider: this.hsm_provider,
            hsm_username: this.hsm_username,
            hsm_password: this.hsm_password,
            hsm_client_id: this.hsm_client_id,
            hsm_client_secret: this.hsm_client_secret
        };
    }
}
