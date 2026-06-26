export interface SpecialtyFormProps {
  data: any;
  onChange: (data: any) => void;
  clinicalExam?: string;
  onClinicalExamChange?: (val: string) => void;
  disabled?: boolean;
}
