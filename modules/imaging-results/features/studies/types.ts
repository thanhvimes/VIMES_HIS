export interface UnifiedItem {
  type: 'PACS' | 'MWL';
  id: string;
  patientId: string;
  patientName: string;
  gender: string;
  modality: string;
  studyDate: string;
  description: string;
  accessionNumber: string;
  referringPhysician: string;
  seriesCount: number;
  status?: string;
  raw: any;
}

export interface StudyFilterState {
  modality: string;
  status: string;
  studyDateFrom: string;
  studyDateTo: string;
  patientId: string;
  patientName: string;
}

export const DEMO_STUDY_UIDS: Record<string, string> = {
  CT: '1.3.6.1.4.1.5962.1.2.1.20040119072730.12322',
  MR: '1.3.6.1.4.1.5962.1.2.4.20040826185059.5457',
  CR: '1.2.840.113619.2.30.1.1762295590.1623.978668949.886',
};

export const removeVietnameseDiacritics = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export const formatStudyDate = (raw: string): string => {
  if (!raw || raw === 'N/A') return 'N/A';
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
  }
  return raw;
};
