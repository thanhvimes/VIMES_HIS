import React from 'react';
import { SpecialtyFormProps } from './types';
import GeneralForm from './GeneralForm';
import OphthalmicForm from './OphthalmicForm';
import ObstetricForm from './ObstetricForm';
import ENTForm from './ENTForm';
import DentalForm from './DentalForm';
import YHCTForm from './YHCTForm';

export const SPECIALTY_FORM_REGISTRY: Record<number, React.FC<SpecialtyFormProps>> = {
  1: GeneralForm,    // Đa khoa / Nội tổng quát
  2: OphthalmicForm, // Mắt
  3: ObstetricForm,  // Sản phụ khoa
  4: ENTForm,        // Tai Mũi Họng
  5: DentalForm,     // Răng Hàm Mặt
  6: YHCTForm,       // Y Học Cổ Truyền (Traditional Medicine)
};

/**
 * Tự động tạo chuỗi văn bản thuần tóm tắt từ cấu trúc dữ liệu JSON chuyên khoa
 */
export const generateSpecialtySummary = (type: number, data: any): string => {
  if (!data) return '';

  switch (type) {
    case 2: { // Mắt
      const va = data.visualAcuity || {};
      const vaText = `Thị lực: MP (không kính) ${va.rightUnassisted || '--'}, MT (không kính) ${va.leftUnassisted || '--'}` +
        (va.rightCorrected || va.leftCorrected ? `; MP (có kính) ${va.rightCorrected || '--'}, MT (có kính) ${va.leftCorrected || '--'}` : '');
      const iop = data.intraocularPressure || {};
      const iopText = `Nhãn áp: MP ${iop.right || '--'} mmHg, MT ${iop.left || '--'} mmHg`;
      const notes = data.examNotes ? `Khám mắt: ${data.examNotes}` : '';
      return [vaText, iopText, notes].filter(Boolean).join('. ');
    }
    case 3: { // Sản khoa
      const paraText = data.para ? `Para: ${data.para}` : '';
      const lmpText = data.lmp ? `Kinh cuối (LMP): ${data.lmp}` : '';
      const ageText = data.gestationalAge ? `Tuổi thai: ${data.gestationalAge} tuần` : '';
      const fhrText = data.fetalHeartRate ? `Tim thai (FHR): ${data.fetalHeartRate} l/p` : '';
      const notes = data.examNotes ? `Khám sản: ${data.examNotes}` : '';
      return [paraText, lmpText, ageText, fhrText, notes].filter(Boolean).join('. ');
    }
    case 4: { // Tai Mũi Họng
      const earText = data.ear ? `Tai: ${data.ear}` : '';
      const noseText = data.nose ? `Mũi xoang: ${data.nose}` : '';
      const throatText = data.throat ? `Họng miệng: ${data.throat}` : '';
      const larynxText = data.larynx ? `Thanh quản: ${data.larynx}` : '';
      return [earText, noseText, throatText, larynxText].filter(Boolean).join('. ');
    }
    case 5: { // Răng Hàm Mặt
      const teethText = data.teethStatus ? `Răng bệnh lý: ${data.teethStatus}` : '';
      const biteText = data.bite ? `Khớp cắn: ${data.bite}` : '';
      const gumsText = data.gums ? `Nướu quanh răng: ${data.gums}` : '';
      const mucosaText = data.oralMucosa ? `Niêm mạc miệng: ${data.oralMucosa}` : '';
      return [teethText, biteText, gumsText, mucosaText].filter(Boolean).join('. ');
    }
    case 6: { // Y Học Cổ Truyền
      const vong = data.vong || {};
      const van = data.van || {};
      const vanChan = data.vanChan || {};
      const thiet = data.thiet || {};
      
      const vongText = vong.thanSac || vong.luoi ? `Vọng chẩn: ${[vong.thanSac, vong.luoi].filter(Boolean).join(', ')}` : '';
      const vanText = van.amThanh || van.mui ? `Văn chẩn: ${[van.amThanh, van.mui].filter(Boolean).join(', ')}` : '';
      const vanChanText = vanChan.hanNhiet || vanChan.han || vanChan.tieuHoa ? `Vấn chẩn: ${[vanChan.hanNhiet, vanChan.han, vanChan.tieuHoa].filter(Boolean).join(', ')}` : '';
      const thietText = thiet.machChan || thiet.kinhLac ? `Thiết chẩn: ${[thiet.machChan, thiet.kinhLac].filter(Boolean).join(', ')}` : '';
      
      return [vongText, vanText, vanChanText, thietText].filter(Boolean).join('. ');
    }
    default:
      return '';
  }
};
