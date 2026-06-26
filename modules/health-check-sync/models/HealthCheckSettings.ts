import { healthCheckService } from '../../../services/healthCheckService';

export interface SettingsData {
    vneid_url: string;
    vneid_username: string;
    vneid_password: string;
    ma_cskcb: string;
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
}

export class HealthCheckSettings implements SettingsData {
    vneid_url: string = 'https://api-vneid.moh.gov.vn/api/v1';
    vneid_username: string = '';
    vneid_password: string = '';
    ma_cskcb: string = '15124';
    ma_gtin_cskcb: string = '1234567890123';
    auto_sync_enabled: boolean = false;
    auto_sync_interval: number = 15;
    barcode_label_size_xn: string = '50x30';
    barcode_label_size_ksk: string = '50x30';
    barcode_show_hospital: boolean = true;
    barcode_show_date: boolean = true;
    barcode_show_sample_type: boolean = true;
    allow_unsigned_sync: boolean = false;
    barcode_zpl_template_xn: string = '^XA\n^CF0,26\n^FO30,30^FD{hospital}^FS\n^FO30,70^FD{patient}^FS\n^FO30,105^FD{test}^FS\n^FO30,140^FD{sample_type} - {date}^FS\n^BY2,2,40\n^FO30,175^BCN,,N,N\n^FD{code}^FS\n^FO30,225^FD{code}^FS\n^XZ';
    barcode_zpl_template_ksk: string = '^XA\n^CF0,26\n^FO30,30^FD{hospital}^FS\n^FO30,70^FD{patient}^FS\n^FO30,105^FD{form_name}^FS\n^FO30,140^FD{info}^FS\n^BY2,2,40\n^FO30,175^BCN,,N,N\n^FD{code}^FS\n^FO30,225^FD{code}^FS\n^XZ';
    barcode_printer_name: string = 'Zebra';

    constructor(data?: Partial<SettingsData>) {
        if (data) {
            this.vneid_url = data.vneid_url ?? this.vneid_url;
            this.vneid_username = data.vneid_username ?? this.vneid_username;
            this.vneid_password = data.vneid_password ?? this.vneid_password;
            this.ma_cskcb = data.ma_cskcb ?? this.ma_cskcb;
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
        };
    }
}
