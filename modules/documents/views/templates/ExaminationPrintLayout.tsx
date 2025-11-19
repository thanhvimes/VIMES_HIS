
import React from 'react';
import { ClinicalRecord, Patient } from '../../../../types';

interface ExaminationPrintLayoutProps {
  data: {
      record: ClinicalRecord;
      patient: Patient; // We might need to pass basic patient info separately if record doesn't have it all
  }
}

const ExaminationPrintLayout: React.FC<ExaminationPrintLayoutProps> = ({ data }) => {
  const { record, patient } = data;
  const today = new Date();

  return (
    <div className="p-10 bg-white text-black max-w-5xl mx-auto font-serif leading-relaxed">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div className="text-center">
            <h3 className="font-bold uppercase text-sm">Sở Y Tế TP.HCM</h3>
            <h2 className="font-bold uppercase text-lg">Phòng Khám Đa Khoa ClinicMS</h2>
            <p className="text-xs">123 Đường Sức Khỏe, Q.1, TP.HCM</p>
        </div>
        <div className="text-center">
            <h1 className="font-bold uppercase text-2xl tracking-wider">Phiếu Khám Bệnh</h1>
            <p className="italic text-sm">Mã phiếu: {record.id}</p>
        </div>
      </div>

      {/* Patient Info */}
      <div className="mb-6">
          <h3 className="font-bold uppercase border-b border-gray-400 mb-2">I. Hành Chính</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
              <p><span className="font-bold">Họ tên:</span> {patient.name}</p>
              <p><span className="font-bold">Tuổi:</span> {patient.age} - <span className="font-bold">Giới tính:</span> {patient.gender}</p>
              <p className="col-span-2"><span className="font-bold">Địa chỉ:</span> {patient.address}</p>
              <p className="col-span-2"><span className="font-bold">Đối tượng:</span> {patient.patientType || 'Dịch vụ'}</p>
          </div>
      </div>

      {/* Clinical Content */}
      <div className="mb-6">
          <h3 className="font-bold uppercase border-b border-gray-400 mb-2">II. Chuyên Môn</h3>
          
          <div className="mb-4">
              <p className="font-bold underline mb-1">1. Quá trình bệnh lý:</p>
              <p className="whitespace-pre-wrap pl-4">{record.history || '(Không ghi nhận)'}</p>
          </div>

          <div className="mb-4">
              <p className="font-bold underline mb-1">2. Khám lâm sàng:</p>
              <p className="whitespace-pre-wrap pl-4">{record.clinicalExam || '(Chưa có thông tin)'}</p>
          </div>

          <div className="mb-4">
              <p className="font-bold underline mb-1">3. Chẩn đoán:</p>
              <div className="pl-4">
                <p><span className="font-semibold">Sơ bộ:</span> {record.initialDiagnosis}</p>
                {record.mainDisease && <p><span className="font-semibold">Bệnh chính:</span> [{record.mainDisease.code}] {record.mainDisease.name}</p>}
              </div>
          </div>

          <div className="mb-4">
              <p className="font-bold underline mb-1">4. Kết luận & Hướng điều trị:</p>
              <div className="pl-4 border-l-4 border-gray-200 py-2">
                 <p className="font-bold text-lg">{record.conclusion}</p>
                 <p className="italic mt-2">{record.treatmentPlan}</p>
              </div>
          </div>
      </div>

      {/* Footer */}
      <div className="mt-12 flex justify-end text-center">
          <div>
              <p className="italic">Ngày {today.getDate()} tháng {today.getMonth() + 1} năm {today.getFullYear()}</p>
              <p className="font-bold uppercase mt-1">Bác sĩ khám bệnh</p>
              <div className="h-24"></div> {/* Space for signature */}
              <p className="font-bold">{record.doctorName}</p>
          </div>
      </div>
    </div>
  );
};

export default ExaminationPrintLayout;
