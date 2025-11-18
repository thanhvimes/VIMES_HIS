import React from 'react';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  lastVisit: string;
}

export enum AppointmentStatus {
  Scheduled = 'Scheduled',
  Waiting = 'Waiting',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface Appointment {
  id: string;
  patient: Patient;
  time: string;
  doctor: string;
  reason: string;
  status: AppointmentStatus;
}

export interface ConsultationRecord {
    id: string;
    date: string;
    doctor: string;
    symptoms: string;
    diagnosis: string;
    prescription: Drug[];
    notes: string;
}

export interface Drug {
    id: string;
    name: string;
    dosage: string;
    stock: number;
}

export interface Invoice {
    id: string;
    patientName: string;
    date: string;
    amount: number;
    status: 'Paid' | 'Unpaid';
    items: { description: string; cost: number }[];
}

export interface LabResult {
    id: string;
    patientName: string;
    testName: string;
    date: string;
    status: 'Pending' | 'Completed';
    resultUrl?: string;
}

export interface ImagingResult {
    id: string;
    patientName: string;
    testName: string;
    date: string;
    status: 'Pending' | 'Completed';
    imageUrl?: string;
}

export interface AISuggestion {
  summary: string;
  potentialDiagnoses: string[];
  nextSteps: string[];
}

export interface NavItemType {
  name: string;
  path: string;
  icon: React.ReactElement<any>;
}
