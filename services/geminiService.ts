import { Patient, AISuggestion } from '../types';
import { apiClient } from './apiClient';

export async function getAISuggestions(
  symptoms: string,
  notes: string,
  patient: Patient | { age: number; gender: string }
): Promise<AISuggestion> {
  return apiClient.post<AISuggestion>('/ai/clinical-suggestions', {
    symptoms,
    notes,
    patient: { age: patient.age, gender: patient.gender }
  });
}
