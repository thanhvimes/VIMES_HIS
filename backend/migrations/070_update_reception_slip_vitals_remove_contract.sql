-- Migration: 070_update_reception_slip_vitals_remove_contract.sql
-- Update reception_slip_template to remove contract row and add vital signs section
UPDATE health_check_settings 
SET reception_slip_template = '<div class="receipt-card">
    <div class="header">
        <div class="hospital-name">BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH</div>
        <div class="sub-header">KHOA KHÁM BỆNH - KHÁM SỨC KHỎE</div>
        <div class="title">PHIẾU TIẾP ĐÓN</div>
    </div>

    <div class="divider"></div>

    <table class="info-table">
        <tr>
            <td class="info-label">Số hồ sơ:</td>
            <td class="info-value"><span class="doc-badge">{{docNo}}</span></td>
        </tr>
        <tr>
            <td class="info-label">Họ và tên:</td>
            <td class="info-value name-value">{{name}}</td>
        </tr>
        <tr>
            <td class="info-label">Ngày sinh:</td>
            <td class="info-value">{{dob}}</td>
        </tr>
        <tr>
            <td class="info-label">Giới tính:</td>
            <td class="info-value">{{gender}}</td>
        </tr>
        <tr>
            <td class="info-label">Số CCCD:</td>
            <td class="info-value font-mono">{{cardId}}</td>
        </tr>
        <tr>
            <td class="info-label">Địa chỉ:</td>
            <td class="info-value">{{address}}</td>
        </tr>
        <tr>
            <td class="info-label">Thời gian:</td>
            <td class="info-value">{{dateStr}}</td>
        </tr>
    </table>

    <div class="divider"></div>

    <div class="vitals-section">
        <div class="vitals-title">THÔNG TIN SINH HIỆU</div>
        <table class="vitals-table">
            <tr>
                <td class="vitals-label">Mạch:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">lần/phút</td>
            </tr>
            <tr>
                <td class="vitals-label">Nhiệt độ:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">°C</td>
            </tr>
            <tr>
                <td class="vitals-label">Huyết áp:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">mmHg</td>
            </tr>
            <tr>
                <td class="vitals-label">Chiều cao:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">cm</td>
            </tr>
            <tr>
                <td class="vitals-label">Cân nặng:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">kg</td>
            </tr>
            <tr>
                <td class="vitals-label">BMI:</td>
                <td class="vitals-dots-cell"><div class="vitals-dots-border"></div></td>
                <td class="vitals-unit">kg/m²</td>
            </tr>
        </table>
    </div>

    <div class="divider"></div>

    <div class="barcode-section">
        <div class="barcode-container">
            <svg id="barcode"></svg>
        </div>
    </div>

    <div class="divider"></div>
    <div class="footer-note">Quý khách vui lòng giữ phiếu trong suốt quá trình khám!</div>
</div>';
