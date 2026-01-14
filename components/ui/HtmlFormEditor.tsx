
import React from 'react';

const HtmlFormEditor = ({ formTitle }: { formTitle: string }) => (
    <div className="bg-gray-100 dark:bg-slate-900/50 h-full overflow-y-auto font-serif p-4 md:p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto shadow-2xl bg-white min-h-[900px] relative">
            {/* Paper texture effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-dust.png")'}}></div>
            
            <div className="p-8 md:p-12 relative z-10 text-black">
                {/* Form Header */}
                <div className="flex justify-between items-start mb-8">
                    <div className="text-center text-xs">
                        <p className="font-bold text-sm">BỆNH VIỆN K, BỘ Y TẾ</p>
                        <p className="italic text-gray-600">Trao hy vọng - Nhận niềm tin</p>
                        <div className="border-t border-gray-400 w-1/2 mx-auto mt-1"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                        <p className="font-bold text-sm underline decoration-dotted mb-1">Độc lập - Tự do - Hạnh phúc</p>
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-2xl font-bold uppercase text-gray-800">{formTitle}</h1>
                    <p className="font-bold mt-2 text-gray-600">Kính gửi: Khoa GPB tế bào Quán Sứ</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-5 text-base leading-relaxed">
                    <div className="space-y-3">
                        <div className="flex items-end gap-2 group">
                            <span className="whitespace-nowrap min-w-[100px]">Tên tôi là:</span>
                            <div className="flex-1 border-b border-dotted border-gray-400 group-hover:border-blue-400 transition-colors relative">
                                <input type="text" className="w-full bg-transparent focus:outline-none py-0.5 px-1 font-medium text-blue-900" />
                            </div>
                        </div>
                        <div className="flex items-end gap-2 group">
                            <span className="whitespace-nowrap min-w-[100px]">Chức vụ:</span>
                            <div className="flex-1 border-b border-dotted border-gray-400 group-hover:border-blue-400 transition-colors">
                                <input type="text" className="w-full bg-transparent focus:outline-none py-0.5 px-1 font-medium text-blue-900" />
                            </div>
                        </div>
                        <div className="flex items-end gap-2 group">
                            <span className="whitespace-nowrap min-w-[100px]">Đơn vị công tác:</span>
                            <div className="flex-1 border-b border-dotted border-gray-400 group-hover:border-blue-400 transition-colors">
                                <input type="text" className="w-full bg-transparent focus:outline-none py-0.5 px-1 font-medium text-blue-900" />
                            </div>
                        </div>
                    </div>

                    <p className="italic text-justify my-6 text-gray-700">
                        Nhằm phục vụ công tác khám, chữa bệnh đạt hiệu quả tốt nhất, kính đề nghị Quý Cơ quan cho người bệnh/người nhà người bệnh mượn khối nến và/hoặc tiêu bản, thông tin cụ thể như sau:
                    </p>

                    <div className="border-2 border-gray-800 p-6 bg-gray-50 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <div className="flex gap-2">
                                <strong>Họ và tên người bệnh:</strong> 
                                <span className="uppercase font-bold text-blue-900">NGUYỄN THỊ NGA</span>
                            </div>
                            <div className="flex gap-2">
                                <strong>Năm sinh:</strong> 1981
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <div className="flex gap-2">
                                <strong>Giới tính:</strong> Nữ
                            </div>
                            <div className="flex gap-2">
                                <strong>Mã BN:</strong> 251050296
                            </div>
                        </div>
                        <div className="flex gap-2 border-b border-gray-200 pb-2">
                            <strong>Chẩn đoán:</strong> 
                            <span>[C53] U ác của cổ tử cung</span>
                        </div>
                        <div className="flex gap-2">
                            <strong>Đang điều trị tại:</strong> 
                            <span>Khoa GMHS Quán Sứ - Bệnh viện K</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block font-bold mb-2 text-gray-800">Lý do mượn khối nến và/hoặc tiêu bản:</label>
                        <textarea className="w-full border border-gray-300 bg-white p-4 min-h-[150px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none rounded-md shadow-inner resize-none" placeholder="Nhập lý do..."></textarea>
                    </div>
                </div>

                <div className="mt-12 flex justify-end">
                    <div className="text-center w-64">
                        <p className="italic text-sm">Hà Nội, ngày ..... tháng ..... năm 2023</p>
                        <p className="font-bold uppercase mt-2">Người làm đơn</p>
                        <p className="italic text-xs text-gray-500">(Ký và ghi rõ họ tên)</p>
                        <div className="h-24"></div>
                        <div className="border-t border-dashed border-gray-400 w-32 mx-auto"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="h-12"></div>
    </div>
);

export default HtmlFormEditor;
