import React from 'react';
import Barcode from 'react-barcode';
import { OnlineBookingRecord } from '../../../services/bookingService';
import { formatDate } from '../../../utils/formatters';

interface BookingPrintTemplateProps {
    booking: OnlineBookingRecord;
}

const BookingPrintTemplate: React.FC<BookingPrintTemplateProps> = ({ booking }) => {
    // Helper to format date with Vietnamese weekday
    const formatFullDate = (dateStr?: string) => {
        if (!dateStr) return '---';
        const date = new Date(dateStr);
        const weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const dayName = weekdays[date.getDay()];
        return `${dayName}, ${formatDate(dateStr.split('T')[0])}`;
    };

    return (
        <div className="print-template hidden print:block">
            <style>{`
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    
                    body * {
                        visibility: hidden;
                    }
                    
                    .print-template,
                    .print-template * {
                        visibility: visible;
                    }
                    
                    .print-template {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm;
                        background: white;
                        padding: 5mm;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        color: #000;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                }
                
                /* Layout Helpers */
                .ticket-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }
                
                .barcode-section {
                    margin-bottom: 4mm;
                }
                
                .stt-section {
                    text-align: center;
                    margin-bottom: 4mm;
                }
                
                .stt-label {
                    font-size: 14px;
                    color: #444;
                    margin-bottom: 2mm;
                }
                
                .stt-number {
                    font-size: 72px;
                    font-weight: 900;
                    color: #e11d48; /* Red-600 */
                    line-height: 1;
                    margin: 2mm 0;
                }
                
                .success-badge {
                    background-color: #22c55e; /* Green-500 */
                    color: white;
                    padding: 2mm 8mm;
                    border-radius: 9999px;
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 6mm;
                    text-transform: uppercase;
                }
                
                .details-section {
                    width: 100%;
                    border-top: 1px dashed #ccc;
                    padding-top: 4mm;
                }
                
                .detail-row {
                    display: flex;
                    margin-bottom: 2mm;
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .detail-label {
                    width: 35%;
                    color: #666;
                    font-weight: 500;
                }
                
                .detail-value {
                    width: 65%;
                    font-weight: 700;
                    text-align: right;
                }
                
                .location-text {
                    font-size: 12px;
                    font-weight: bold;
                    color: #333;
                    text-align: center;
                    margin: 3mm 0;
                    padding: 2mm;
                    background-color: #f8fafc;
                }
                
                .instruction-text {
                    font-size: 11px;
                    color: #666;
                    text-align: center;
                    font-style: italic;
                    margin-top: 4mm;
                    padding: 3mm 0;
                    border-top: 1px solid #eee;
                }
            `}</style>

            <div className="ticket-container">
                {/* Barcode at Top */}
                <div className="barcode-section">
                    <Barcode
                        value={booking.id.toString().padStart(12, '0')}
                        width={1.5}
                        height={50}
                        fontSize={14}
                        margin={0}
                    />
                </div>

                {/* Number / STT */}
                <div className="stt-section">
                    <div className="stt-label">Số thứ tự:</div>
                    <div className="stt-number">{booking.receptNo || '---'}</div>
                </div>

                {/* Success Badge */}
                <div className="success-badge">
                    Đăng ký thành công
                </div>

                {/* Clinical Details */}
                <div className="details-section">
                    <div className="detail-row">
                        <span className="detail-label">Mã hẹn:</span>
                        <span className="detail-value">{booking.id.toString().padStart(12, '0')}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">Phòng khám:</span>
                        <span className="detail-value">{booking.roomName || 'Đang phân bổ'}</span>
                    </div>

                    <div className="location-text">
                        {booking.specialityName || 'Khoa Khám Bệnh - VIMES'}
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">Ngày khám:</span>
                        <span className="detail-value">{formatFullDate(booking.bookingDate)}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">Giờ dự kiến:</span>
                        <span className="detail-value text-lg">{booking.bookingTime}</span>
                    </div>

                    <div className="detail-row mt-2">
                        <span className="detail-label">Bệnh nhân:</span>
                        <span className="detail-value uppercase">{booking.patientName}</span>
                    </div>

                    <div className="detail-row">
                        <span className="detail-label">Đối tượng:</span>
                        <span className="detail-value">
                            {booking.isInsurance ? 'BHYT' : 'Dịch vụ'}
                            {booking.isPriority && ' (Ưu tiên)'}
                        </span>
                    </div>
                </div>

                {/* Bottom Instructions */}
                <div className="instruction-text">
                    Vui lòng đến trước 15-30 phút để làm thủ tục.<br />
                    Trân trọng cảm ơn quý khách!
                </div>
            </div>
        </div>
    );
};

export default BookingPrintTemplate;
