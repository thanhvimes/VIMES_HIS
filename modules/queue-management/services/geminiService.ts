import { MedicalRecord } from '../types';
import { apiClient } from '../../../services/apiClient';

export async function explainMedicalRecord(record: MedicalRecord): Promise<string> {
  const result = await apiClient.post<{ text: string }>('/ai/explain-medical-record', { record });
  return result.text;
}

export async function generateFeedbackResponse(rating: number, comment: string): Promise<string> {
  const result = await apiClient.post<{ text: string }>('/ai/feedback-response', { rating, comment });
  return result.text;
}
