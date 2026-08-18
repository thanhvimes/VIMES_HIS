import { MedicalTemplate } from '../types';

export const QUICK_TEMPLATES: Record<string, MedicalTemplate[]> = {
  US: [
    {
      id: 'us-norm',
      name: 'Siêu Âm Ổ Bụng Tổng Quát (Bình Thường)',
      tag: 'BÌNH THƯỜNG',
      findings: '• Gan: Kích thước trong giới hạn bình thường, nhu mô đều, không thấy khối khu trú bất thường.\n• Túi mật & Đường mật: Túi mật thành mỏng, lòng thông thoáng không có sỏi. Đường mật trong và ngoài gan không giãn.\n• Tụy & Lách: Kích thước và cấu trúc âm nhu mô đồng nhất bình thường.\n• Thận 2 bên: Vị trí và kích thước bình thường, ranh giới vỏ tủy rõ, không thấy sỏi hay ứ nước đài bể thận.\n• Bàng quang: Nước tiểu trong, thành nhẵn mỏng, không có sỏi hay khối u bàng quang.\n• Tiền liệt tuyến / Tử cung phần phụ: Cấu trúc kích thước phù hợp lứa tuổi.\n• Dịch ổ bụng: Không có dịch tự do khoang màng bụng.',
      impression: 'Hình ảnh siêu âm ổ bụng tổng quát hiện tại CHƯA PHÁT HIỆN BẤT THƯỜNG.',
      recommendation: 'Khám sức khỏe định kỳ 6 - 12 tháng/lần.'
    },
    {
      id: 'us-fatty-liver',
      name: 'Gan Nhiễm Mỡ Độ 1 - 2',
      tag: 'BỆNH LÝ',
      findings: '• Gan: Kích thước bình thường, nhu mô tăng âm lan tỏa nhẹ (dạng sáng), giảm âm nhẹ vùng sâu. Tĩnh mạch cửa và các nhánh trong gan quan sát rõ, không có khối khu trú.\n• Túi mật & Đường mật: Bình thường không sỏi.\n• Thận 2 bên: Bình thường không ứ nước.\n• Không thấy dịch tự do ổ bụng.',
      impression: 'Hình ảnh siêu âm theo dõi GAN NHIỄM MỠ ĐỘ 1 - 2. Chưa thấy tổn thương khu trú trong gan.',
      recommendation: 'Chế độ ăn giảm dầu mỡ, hạn chế rượu bia, tăng cường vận động. Kiểm tra men gan và mỡ máu.'
    },
    {
      id: 'us-gallstone',
      name: 'Sỏi Túi Mật Đơn Thuần',
      tag: 'BỆNH LÝ',
      findings: '• Gan: Nhu mô đồng nhất bình thường.\n• Túi mật: Kích thước không to, thành túi mật mỏng < 3mm. Trong lòng túi mật có hình ảnh nốt tăng âm kích thước ~8mm, kèm bóng cản âm rõ phía sau, di động theo tư thế bệnh nhân.\n• Đường mật trong và ngoài gan không giãn.\n• Tụy, Lách, Thận: Bình thường.',
      impression: 'Hình ảnh SỎI TÚI MẬT kích thước ~8mm. Hiện chưa thấy dấu hiệu viêm túi mật cấp.',
      recommendation: 'Khám chuyên khoa Ngoại Tiêu hóa tư vấn theo dõi định kỳ.'
    },
    {
      id: 'us-renal-stone',
      name: 'Sỏi Thận & Ứ Nước Độ 1',
      tag: 'BỆNH LÝ',
      findings: '• Thận phải: Kích thước bình thường, nhu mô đều không sỏi.\n• Thận trái: Nhóm đài dưới có nốt tăng âm kích thước ~6mm kèm bóng cản. Đài thận giãn nhẹ ~7mm (ứ nước độ 1). Niệu quản đoạn 1/3 trên không giãn.\n• Bàng quang: Nước tiểu trong, thành mỏng.\n• Các tạng khác: Bình thường.',
      impression: 'Hình ảnh SỎI ĐÀI DƯỚI THẬN TRÁI (~6mm) gây ứ nước đài thận độ 1.',
      recommendation: 'Uống nhiều nước (2-2.5 lít/ngày). Khám chuyên khoa Tiết niệu điều trị.'
    }
  ],
  CT: [
    {
      id: 'ct-chest-norm',
      name: 'CT Lồng Ngực (Bình Thường)',
      tag: 'BÌNH THƯỜNG',
      findings: '• Nhu mô phổi: Hai phế trường thông khí sáng đều, không thấy tổn thương dạng đông đặc, nốt mờ đơn độc hay kính mờ.\n• Cây phế quản: Thông thoáng đến tận phế quản phân thùy.\n• Màng phổi: Không dày dính, không tràn dịch hay tràn khí màng phổi 2 bên.\n• Trung thất: Không thấy hạch phì đại. Bóng tim và các quai mạch máu lớn trong giới hạn sinh lý.\n• Khung xương lồng ngực: Không tổn thương tiêu xương hay gãy xương.',
      impression: 'Cắt lớp vi tính lồng ngực hiện tại CHƯA PHÁT HIỆN BẤT THƯỜNG nhu mô phổi và trung thất.',
      recommendation: 'Khám định kỳ 6 - 12 tháng/lần.'
    },
    {
      id: 'ct-brain-stroke',
      name: 'CT Sọ Não (Loại Trừ Xuất Huyết Cấp)',
      tag: 'CẤP CỨU',
      findings: '• Nhu mô não: Không thấy ổ tăng tỷ trọng tự nhiên dạng xuất huyết cấp tính nội sọ.\n• Hệ thống não thất: Cân đối qua đường giữa, không bị chèn ép, tỷ trọng dịch não tủy bình thường.\n• Rãnh cuộn não: Bình thường, không thấy phù não lan tỏa.\n• Xương vòm sọ: Không thấy đường nứt hay lún sọ.',
      impression: 'Hiện tại CHƯA THẤY HÌNH ẢNH XUẤT HUYẾT NỘI SỌ CẤP TÍNH trên phim CT không cản quang.',
      recommendation: 'Theo dõi sát tri giác (thang điểm Glasgow). Đề nghị chụp MRI Sọ não khuếch tán (DWI) nếu nghi ngờ nhồi máu não giai đoạn tối cấp (< 6 giờ).'
    }
  ],
  CR: [
    {
      id: 'cr-chest-norm',
      name: 'X-Quang Ngực Thẳng (Bình Thường)',
      tag: 'BÌNH THƯỜNG',
      findings: '• Trường phổi hai bên sáng đều, không thấy bóng mờ khu trú hay thâm nhiễm nhu mô.\n• Vòm hoành hai bên mềm mại, góc sườn hoành nhọn sáng.\n• Bóng tim không to, chỉ số tim/lồng ngực < 0.5 trong giới hạn bình thường.\n• Quai động mạch chủ mềm mại.\n• Khung xương lồng ngực và mô mềm thành ngực bình thường.',
      impression: 'Hình ảnh tim phổi hiện tại CHƯA PHÁT HIỆN BẤT THƯỜNG trên phim X-quang ngực thẳng.',
      recommendation: 'Tái khám khi có triệu chứng hô hấp.'
    }
  ],
  MR: [
    {
      id: 'mr-brain-norm',
      name: 'MRI Sọ Não T1/T2/FLAIR/DWI (Bình Thường)',
      tag: 'BÌNH THƯỜNG',
      findings: '• Nhu mô đại não, tiểu não và thân não có cấu trúc và tín hiệu bình thường trên các chuỗi xung T1W, T2W, FLAIR.\n• Chuỗi xung DWI không thấy hình ảnh hạn chế khuếch tán dạng nhồi máu não cấp.\n• Hệ thống não thất và các bể não kích thước bình thường, đường giữa cân đối.\n• Các xoang cạnh mũi thông khí tốt.',
      impression: 'Hình ảnh cộng hưởng từ sọ não hiện tại CHƯA THẤY TỔN THƯƠNG BẤT THƯỜNG KHU TRÚ.',
      recommendation: 'Khám chuyên khoa Thần kinh nếu còn đau đầu kéo dài.'
    }
  ]
};

export const COMMON_PHRASES: Record<string, string[]> = {
  US: [
    'Gan kích thước bình thường, nhu mô đồng nhất.',
    'Túi mật thành mỏng, lòng không sỏi, đường mật không giãn.',
    'Thận 2 bên không sỏi, không ứ nước đài bể thận.',
    'Không thấy dịch tự do khoang màng bụng.',
    'Bàng quang nước tiểu trong, thành nhẵn mỏng.'
  ],
  CT: [
    'Nhu mô phổi thông khí đều 2 bên, không thấy tổn thương khu trú.',
    'Không thấy dày dính hay tràn dịch, tràn khí màng phổi.',
    'Trung thất và bóng tim trong giới hạn bình thường.',
    'Không thấy tổn thương gãy hay tiêu hủy xương.'
  ],
  CR: [
    'Hai phế trường sáng đều, không thấy tổn thương thâm nhiễm.',
    'Góc sườn hoành 2 bên nhọn sáng.',
    'Bóng tim không to (chỉ số tim/lồng ngực < 0.5).'
  ],
  MR: [
    'Cấu trúc và tín hiệu nhu mô não bình thường.',
    'DWI không thấy hạn chế khuếch tán dạng nhồi máu não cấp.',
    'Hệ thống não thất cân đối, đường giữa không lệch.'
  ]
};

export const DOT_PHRASES: Record<string, string> = {
  '.bt': 'Nhu mô thông khí sáng đều, không thấy tổn thương khu trú bất thường. Bóng tim và mạch máu trong giới hạn bình thường.',
  '.gan': 'Gan kích thước bình thường, nhu mô đồng nhất, không thấy khối bất thường.',
  '.soi': 'Hình ảnh nốt tăng âm kèm bóng cản âm rõ, kích thước ~6-8mm.',
  '.ruotthua': 'Hố chậu phải có hình ảnh quai ruột tịt đầu không xẹp khi đè ép, đường kính ngoài > 6mm, tăng tưới máu nhẹ.',
  '.khongdich': 'Không thấy dịch tự do màng phổi hay màng bụng 2 bên.'
};
