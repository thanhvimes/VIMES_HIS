
import React, { useState } from 'react';
import { 
    SearchIcon, 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    CreditCardIcon,
    CalculatorIcon,
    UserGroupIcon
} from '../../../components/Icons';
import { insuranceService, InsuranceCardInfo } from '../../../services/insuranceService';

const CardCheckView: React.FC = () => {
    const [cardNumber, setCardNumber] = useState('');
    const [name, setName] = useState('');
    const [cardInfo, setCardInfo] = useState<InsuranceCardInfo | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Calculation State
    const [totalCost, setTotalCost] = useState<string>('');
    const [isRightRoute, setIsRightRoute] = useState(true);
    const [isEmergency, setIsEmergency] = useState(false);
    const [calcResult, setCalcResult] = useState<any>(null);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cardNumber) return;
        setLoading(true);
        setCardInfo(null);
        setCalcResult(null);
        
        try {
            const info = await insuranceService.checkCardOnline(cardNumber, name);
            setCardInfo(info);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = () => {
        if (!cardInfo || !totalCost) return;
        const cost = parseFloat(totalCost);
        const result = insuranceService.calculateCopayment(cost, cardInfo.benefitRate, isRightRoute, isEmergency);
        setCalcResult(result);
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CreditCardIcon className="w-8 h-8 text-blue-600"/> Tra cứu Thông tin Thẻ BHYT
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: INPUT FORM */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200">Nhập thông tin thẻ</h2>
                    <form onSubmit={handleCheck} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Mã số thẻ (15 ký tự)</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={cardNumber}
                                    onChange={e => setCardNumber(e.target.value.toUpperCase())}
                                    placeholder="VD: GD47902155..."
                                    className="w-full pl-10 p-3 border border-slate-300 dark:border-slate-600 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-white"
                                    maxLength={15}
                                    required
                                />
                                <CreditCardIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">Họ và tên (Tùy chọn)</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Nhập tên bệnh nhân..."
                                    className="w-full pl-10 p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-white"
                                />
                                <UserGroupIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400"/>
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SearchIcon className="w-5 h-5"/>}
                            Kiểm tra trên Cổng Giám định
                        </button>
                    </form>

                    {/* Result Card */}
                    {cardInfo && (
                        <div className={`mt-6 p-4 rounded-lg border ${cardInfo.isValid ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                {cardInfo.isValid ? <CheckCircleIcon className="w-6 h-6 text-green-600"/> : <ExclamationCircleIcon className="w-6 h-6 text-red-600"/>}
                                <span className={`font-bold text-lg ${cardInfo.isValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                    {cardInfo.message}
                                </span>
                            </div>
                            {cardInfo.isValid && (
                                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                    <div className="grid grid-cols-2 gap-2">
                                        <p><span className="font-bold">Họ tên:</span> {cardInfo.fullName}</p>
                                        <p><span className="font-bold">Giới tính:</span> {cardInfo.gender}</p>
                                        <p><span className="font-bold">Ngày sinh:</span> {cardInfo.dob}</p>
                                        <p><span className="font-bold">Khu vực:</span> {cardInfo.areaCode}</p>
                                    </div>
                                    <p><span className="font-bold">Địa chỉ:</span> {cardInfo.address}</p>
                                    <p><span className="font-bold">Nơi ĐKKCB BĐ:</span> {cardInfo.kcbBanDau}</p>
                                    <p><span className="font-bold">Hạn sử dụng:</span> {cardInfo.dateStart} - {cardInfo.dateEnd}</p>
                                    <p><span className="font-bold">Thời điểm đủ 5 năm:</span> {cardInfo.fiveYearMoment}</p>
                                    <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                                        <span className="font-bold text-green-800 dark:text-green-300">Mức hưởng quy định: {cardInfo.benefitRate}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: CALCULATOR */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                    <h2 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <CalculatorIcon className="w-6 h-6 text-orange-500"/> Tính toán Đồng chi trả
                    </h2>
                    
                    <div className="flex-1 space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Tổng chi phí khám chữa bệnh (VNĐ)</label>
                            <input 
                                type="number" 
                                value={totalCost}
                                onChange={e => setTotalCost(e.target.value)}
                                placeholder="Nhập tổng số tiền..."
                                className="w-full p-3 text-xl font-bold text-right text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                <input type="checkbox" checked={isRightRoute} onChange={e => setIsRightRoute(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" disabled={isEmergency}/>
                                <div className={isEmergency ? 'opacity-50' : ''}>
                                    <span className="font-bold text-slate-800 dark:text-white block">Đúng tuyến</span>
                                    <span className="text-xs text-slate-500">Bệnh nhân có giấy chuyển tuyến hoặc KCB tại nơi đăng ký ban đầu.</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-lg cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={isEmergency} 
                                    onChange={e => {
                                        setIsEmergency(e.target.checked);
                                        if (e.target.checked) setIsRightRoute(true);
                                    }} 
                                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                                />
                                <div>
                                    <span className="font-bold text-red-700 dark:text-red-400 block">Cấp cứu</span>
                                    <span className="text-xs text-red-600/80 dark:text-red-400/70">Tình trạng cấp cứu luôn được tính như đúng tuyến.</span>
                                </div>
                            </label>
                        </div>

                        <button 
                            onClick={handleCalculate}
                            disabled={!cardInfo || !totalCost}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tính toán Chi phí
                        </button>
                        
                        {calcResult && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Tổng cộng:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{calcResult.total.toLocaleString()} đ</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">BHYT Chi trả:</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{calcResult.insurancePay.toLocaleString()} đ</span>
                                </div>
                                <div className="flex justify-between text-lg p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                    <span className="font-bold text-slate-800 dark:text-white">Bệnh nhân trả:</span>
                                    <span className="font-extrabold text-red-600 dark:text-red-400">{calcResult.patientPay.toLocaleString()} đ</span>
                                </div>
                                {calcResult.isExempt && (
                                    <p className="text-xs text-green-600 text-center font-bold bg-green-50 py-1 rounded">
                                        * Được miễn cùng chi trả (Chi phí &lt; 15% Lương cơ sở)
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardCheckView;
