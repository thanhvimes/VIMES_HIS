import React, { useState, useEffect, useRef } from 'react';
import { XIcon, LoaderIcon, CheckCircleIcon, QrCodeIcon, AlertCircleIcon } from '../../../components/Icons';
import QRCodeLib from 'qrcode';
import { portalService, PortalInvoice } from '../../../services/portalService';
import { toast } from 'sonner';

interface QRPaymentModalProps {
    isOpen: boolean;
    bill: PortalInvoice | null;
    onClose: () => void;
    onSuccess: () => void;
}

const QRPaymentModal: React.FC<QRPaymentModalProps> = ({ isOpen, bill, onClose, onSuccess }) => {
    const [qrUrl, setQrUrl] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [transactionId, setTransactionId] = useState<number | null>(null);
    const [qrKey, setQrKey] = useState<number | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'error'>('pending');
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);

    const pollingRef = useRef<any>(null);
    const timerRef = useRef<any>(null);
    const timeoutRef = useRef<any>(null);

    useEffect(() => {
        if (isOpen && bill) {
            generateQRCode();
        } else {
            // Clean up when modal closes
            cleanup();
        }

        return () => cleanup();
    }, [isOpen, bill]);

    const cleanup = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setQrUrl('');
        setTransactionId(null);
        setQrKey(null);
        setPaymentStatus('pending');
        setError(null);
        setTimeLeft(60);
    };

    const generateQRCode = async () => {
        if (!bill) return;

        setIsGenerating(true);
        setError(null);

        try {
            const response = await portalService.generatePaymentQR(bill.id, bill.amount, bill.patientId);

            if (!response.success || !response.qrPayload) {
                throw new Error(response.message || 'Không thể tạo QR thanh toán');
            }

            setTransactionId(response.transactionId || null);
            setQrKey(response.qrKey || null);

            // Generate QR code image
            const qrImageUrl = await QRCodeLib.toDataURL(response.qrPayload, {
                width: 400,
                margin: 2,
                errorCorrectionLevel: 'M'
            });

            setQrUrl(qrImageUrl);
            startPaymentPolling(bill.id, response.qrKey);
            startTimeout();

        } catch (err: any) {
            console.error('[QR Payment] Error:', err);
            setError(err.message || 'Không thể tạo mã QR thanh toán');
            setPaymentStatus('error');
        } finally {
            setIsGenerating(false);
        }
    };

    const startPaymentPolling = (billId: string, qrKey?: number) => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            try {
                const statusResponse = await portalService.checkPaymentStatus(billId, qrKey);

                if (statusResponse.isPaid) {
                    console.log('[QR Payment] Payment Success!');
                    clearInterval(pollingRef.current);

                    // Complete transaction
                    if (transactionId) {
                        await portalService.completePayment(transactionId);
                    }

                    setPaymentStatus('paid');
                    toast.success('Thanh toán thành công!');

                    // Auto close and refresh after 2 seconds
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                    }, 2000);
                }
            } catch (err) {
                console.error('[QR Payment] Polling error:', err);
            }
        }, 4000); // Poll every 4 seconds
    };

    const startTimeout = () => {
        // Countdown timer
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Timeout after 60 seconds
        timeoutRef.current = setTimeout(() => {
            if (paymentStatus === 'pending') {
                clearInterval(pollingRef.current);
                setError('Hết thời gian chờ thanh toán. Vui lòng thử lại.');
                setPaymentStatus('error');
            }
        }, 60000);
    };

    if (!isOpen || !bill) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h3 className="text-xl font-bold text-slate-800">Thanh toán QR Code</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={paymentStatus === 'paid'}
                    >
                        <XIcon className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                <div className="p-6">
                    {paymentStatus === 'paid' ? (
                        /* Success State */
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircleIcon className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Thanh toán thành công!</h2>
                            <p className="text-slate-600">Hóa đơn {bill.id} đã được thanh toán</p>
                        </div>
                    ) : paymentStatus === 'error' ? (
                        /* Error State */
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertCircleIcon className="w-12 h-12 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Có lỗi xảy ra</h2>
                            <p className="text-red-600 text-center mb-4">{error}</p>
                            <button
                                onClick={generateQRCode}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        /* Payment State */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: Bill Details */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-800 text-lg">Chi tiết hóa đơn</h4>

                                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Số hóa đơn:</span>
                                        <span className="font-semibold text-slate-800">{bill.id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Ngày lập:</span>
                                        <span className="font-semibold text-slate-800">{bill.date}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Dịch vụ:</span>
                                        <span className="font-semibold text-slate-800">{bill.service || 'Dịch vụ y tế'}</span>
                                    </div>
                                </div>

                                {bill.items && bill.items.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold text-slate-700 mb-2">Chi tiết dịch vụ</h5>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {bill.items.map((item, idx) => (
                                                <div key={idx} className="bg-slate-50 rounded p-3 text-sm">
                                                    <div className="font-medium text-slate-800">{item.name}</div>
                                                    <div className="flex justify-between text-slate-600 mt-1">
                                                        <span>SL: {item.quantity} x {Number(item.price).toLocaleString()}</span>
                                                        <span className="font-semibold">{Number(item.total).toLocaleString()} đ</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t-2 border-dashed border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-slate-700">Tổng tiền:</span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {Number(bill.amount).toLocaleString()} đ
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: QR Code */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold text-lg">
                                    <QrCodeIcon className="w-6 h-6" />
                                    <span>THANH TOÁN VIETQR</span>
                                </div>

                                <div className="p-6 bg-white border-4 border-blue-100 rounded-2xl shadow-inner relative">
                                    {qrUrl ? (
                                        <>
                                            <img src={qrUrl} alt="VietQR" className="w-64 h-64 object-contain" />
                                            <div className="absolute inset-0 border-2 border-blue-400 m-3 rounded-xl animate-pulse opacity-10 pointer-events-none" />
                                        </>
                                    ) : (
                                        <div className="w-64 h-64 flex flex-col items-center justify-center">
                                            <LoaderIcon className="w-12 h-12 animate-spin text-blue-500 mb-2" />
                                            <span className="text-slate-600">Đang tạo mã QR...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 text-center space-y-3">
                                    <p className="text-lg font-semibold text-slate-800">
                                        Mở App Ngân hàng để quét mã
                                    </p>
                                    <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 py-2 px-4 rounded-lg border border-blue-100">
                                        <LoaderIcon className="w-4 h-4 animate-spin" />
                                        <span className="font-medium text-sm">Đang chờ xác nhận... ({timeLeft}s)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRPaymentModal;
