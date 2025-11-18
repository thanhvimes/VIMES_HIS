import React from 'react';
import { Patient, ExamInfo } from '../../../../types';

interface PrintLayoutProps {
  patient: Patient;
  exam: ExamInfo;
}

const RegistrationPrintLayout: React.FC<PrintLayoutProps> = ({ patient, exam }) => {
  return (
    <div className="p-8 bg-white text-black max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold">PHÒNG KHÁM ĐA KHOA CLINICMS</h1>
        <p className="text-sm">123 Đường Sức Khỏe, Quận 1, TP. HCM</p>
        <p className="text-sm">ĐT: (028) 1234 5678</p>
        <hr className="my-4 border-gray-400" />
        <h2 className="text-2xl font-bold mt-4 uppercase">Phiếu Thông tin Hành chính</h2>
      </div>

      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-12 gap-x-4">
            <p className="font-bold col-span-3">Mã Bệnh nhân:</p>
            <p className="font-bold text-lg col-span-9">{patient.id}</p>
        </div>
        <div className="grid grid-cols-12 gap-x-4">
            <p className="font-bold col-span-3">Số Hồ sơ:</p>
            <p className="font-bold text-lg col-span-9">{patient.recordNumber}</p>
        </div>
        <div className="grid grid-cols-12 gap-x-4">
          <p className="font-bold col-span-3">Họ và Tên:</p>
          <p className="font-bold text-lg uppercase col-span-9">{patient.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8">
            <div className="grid grid-cols-12">
                 <p className="font-bold col-span-6">Năm sinh:</p>
                 <p className="col-span-6">{patient.dob}</p>
            </div>
             <div className="grid grid-cols-12">
                 <p className="font-bold col-span-6">Tuổi:</p>
                 <p className="col-span-6">{patient.age}</p>
            </div>
        </div>
         <div className="grid grid-cols-2 gap-x-8">
            <div className="grid grid-cols-12">
                 <p className="font-bold col-span-6">Giới tính:</p>
                 <p className="col-span-6">{patient.gender}</p>
            </div>
             <div className="grid grid-cols-12">
                 <p className="font-bold col-span-6">Nghề nghiệp:</p>
                 <p className="col-span-6">{patient.occupation}</p>
            </div>
        </div>
        <div className="grid grid-cols-12 gap-x-4">
          <p className="font-bold col-span-3">Điện thoại:</p>
          <p className="col-span-9">{patient.phone}</p>
        </div>
        <div className="grid grid-cols-12 gap-x-4">
          <p className="font-bold col-span-3">Địa chỉ:</p>
          <p className="col-span-9">{patient.address}</p>
        </div>
        <div className="grid grid-cols-12 gap-x-4">
          <p className="font-bold col-span-3">Người thân:</p>
          <p className="col-span-9">{patient.relativeInfo || 'N/A'}</p>
        </div>

        <hr className="my-4 border-gray-300 border-dashed" />
        
        <div className="grid grid-cols-2 gap-x-8">
            <div className="grid grid-cols-12">
                 <p className="font-bold col-span-6">Đối tượng:</p>
                 <p className="col-span-6">{exam.patientType}</p>
            </div>
             <div className="grid grid-cols-12">
                 <p className="font-bold col-span-6">Số thẻ:</p>
                 <p className="col-span-6">{exam.insuranceNumber || 'N/A'}</p>
            </div>
        </div>
         <div className="grid grid-cols-2 gap-x-8">
            <div className="grid grid-cols-12">
                 <p className="font-bold col-span-6">Ngày khám:</p>
                 <p className="col-span-6">{exam.examDate}</p>
            </div>
             <div className="grid grid-cols-12">
                 <p className="font-bold col-span-6">Phòng khám:</p>
                 <p className="col-span-6">{exam.examRoom}</p>
            </div>
        </div>

      </div>

      <div className="mt-24 flex justify-around text-center">
        <div>
          <p className="font-bold">Bệnh nhân</p>
          <p className="italic text-xs">(Ký và ghi rõ họ tên)</p>
          <div className="mt-20"></div>
        </div>
        <div>
          <p className="font-bold">Nhân viên tiếp nhận</p>
          <p className="italic text-xs">(Ký và ghi rõ họ tên)</p>
          <div className="mt-20"></div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPrintLayout;