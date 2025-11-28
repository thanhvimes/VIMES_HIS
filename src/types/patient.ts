
export interface ExaminationRecord {
  id: string;
  recordNumber: string;
  examDate: string;
  clinic: string;
  ticketNumber: string;
  doctor: string;
  status: string;
  diagnosis: string;
  patientStatus: string;
  examType: string;
  symptoms: string;
}

export interface Patient {
  id: string;
  recordNumber: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  ethnicity?: string;
  occupation?: string;
  address: string;
  phone?: string;
  identityCard?: string;
  relativeInfo?: string;
  lastVisit?: string;
  patientType?: 'Dịch vụ' | 'Bảo hiểm' | 'Ưu tiên';
  history?: ExaminationRecord[];
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    address: string;
}

export enum AppointmentStatus {
    Scheduled = 'Scheduled',
    Waiting = 'Waiting',
    InProgress = 'InProgress',
    Completed = 'Completed',
    Cancelled = 'Cancelled'
}

export interface Appointment {
    id: string;
    patientName: string;
    patientId: string;
    time: string;
    doctor: string;
    reason: string;
    status: AppointmentStatus;
    phone?: string;
}

export interface LabAppointment {
    id: string;
    patientName: string;
    patientId: string;
    phone: string;
    testTypes: string;
    date: string;
    time: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    notes?: string;
}
