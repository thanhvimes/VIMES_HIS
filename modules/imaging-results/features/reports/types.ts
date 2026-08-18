export interface PriorStudyReport {
  id: string;
  studyDate: string;
  modality: string;
  serviceName: string;
  icd10?: string;
  clinicalDiagnosis?: string;
  orderingDept?: string;
  referringDoctor?: string;
  readingDoctor: string;
  approvingDoctor: string;
  technologist?: string;
  device?: string;
  procedureRoom?: string;
  findings: string;
  impression: string;
  recommendation: string;
  studyInstanceUid?: string;
}

export interface ReportEditorProps {
  studyInstanceUid: string;
  patientId: string;
  patientName: string;
  modality: string;
  studyDate: string;
  description?: string;
  accessionNumber?: string;
  referringPhysician?: string;
  gender?: string;
  orderId?: number | string;
  orderLineId?: number | string;
  itemId?: string;
  docNo?: number | string;
  // Extended Clinical Context (HIS raw fields)
  birthDate?: string;
  age?: number | string;
  icd10?: string;
  clinicalDiagnosis?: string;
  performDate?: string;
  admitDate?: string;
  healthInsuranceCard?: string;
  orderingDept?: string;
  onClose: () => void;
  onNextStudy?: () => void;
  onPrevStudy?: () => void;
  currentIndex?: number;
  totalStudies?: number;
}

export interface MedicalTemplate {
  id: string;
  name: string;
  tag: string;
  findings: string;
  impression: string;
  recommendation: string;
}
