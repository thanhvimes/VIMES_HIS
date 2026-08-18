import React from 'react';
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  RADIOLOGIST = 'RADIOLOGIST',
  TECHNOLOGIST = 'TECHNOLOGIST',
  CLINICIAN = 'CLINICIAN',
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
}

export interface NavItemType {
  name: string;
  path: string;
  icon: React.ReactElement;
  group?: 'clinical' | 'paraclinical' | 'finance' | 'admin' | 'support';
  section?: string;
  iconName?: string;
  adminOnly?: boolean;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  isRead: boolean;
  link?: string;
  autoClose?: boolean;
}

export interface UserSession {
  userId: string;
  username: string;
  fullName: string;
  title?: string;
  departmentId?: string;
  departmentName?: string;
  role: string;
  avatarUrl?: string;
  permissions?: string[];
  modules?: Record<string, boolean>;
}

export interface OrganizationInfo {
  hospitalCode: string;
  hospitalName: string;
  governingUnitCode: string;
  governingUnitName: string;
  address: string;
  hotline: string;
  email?: string;
  website?: string;
  logoUrl?: string;
}

export interface Study {
  ID: string;
  MainDicomTags?: {
    PatientID?: string;
    PatientName?: string;
    PatientSex?: string;
    PatientBirthDate?: string;
    StudyDate?: string;
    StudyTime?: string;
    StudyDescription?: string;
    StudyInstanceUID?: string;
    Modality?: string;
    ReferringPhysicianName?: string;
  };
  PatientMainDicomTags?: {
    PatientID?: string;
    PatientName?: string;
  };
  Series?: string[];
  SamplingSeries?: any[];
}

export interface DiagnosticReport {
  id: string;
  studyInstanceUid: string;
  patientId: string;
  patientName: string;
  modality: string;
  studyDate: string;
  templateId?: string;
  findings: string;
  impression: string;
  recommendation?: string;
  keyImages?: string[];
  status: 'DRAFT' | 'SIGNED' | 'ADDENDUM';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  signature?: {
    doctorName: string;
    doctorRole: string;
    licenseNumber: string;
    signedAt: string;
    signatureHash: string;
    verificationQrCodeUrl: string;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  modality: string;
  anatomy: string;
  findingsTemplate: string;
  impressionTemplate: string;
}

export interface WorklistEntry {
  id: string;
  patientId: string;
  patientName: string;
  gender: string;
  birthDate: string;
  modality: string;
  scheduledProcedureStepDescription: string;
  scheduledDate: string;
  scheduledTime: string;
  referringPhysician: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface AuditLog {
  id: string;
  userId?: string;
  username: string;
  role: string;
  action: string;
  resourceId?: string;
  orderId?: string;
  lineId?: string;
  docNo?: string;
  patientId?: string;
  patientName?: string;
  modality?: string;
  details?: string;
  reason?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface TelemedicineShare {
  shareToken: string;
  studyInstanceUid: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  shareUrl: string;
}

