-- Migration: Update reception_slip_template to remove vitals table and add gender, reception time
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
            <td class="info-label">Hợp đồng:</td>
            <td class="info-value contract-value">{{contractName}}</td>
        </tr>
        <tr>
            <td class="info-label">Thời gian:</td>
            <td class="info-value">{{dateStr}}</td>
        </tr>
    </table>

    <div class="divider"></div>

    <div class="barcode-section">
        <div class="barcode-container">
            <svg id="barcode"></svg>
        </div>
    </div>

    <div class="divider"></div>
    <div class="footer-note">Quý khách vui lòng giữ phiếu trong suốt quá trình khám!</div>
</div>'
WHERE reception_slip_template LIKE '%vitals-table%' 
   OR reception_slip_template LIKE '%Cân nặng%'
   OR reception_slip_template IS NULL 
   OR reception_slip_template = '';
