
export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTION = 'RECEPTION',
  DISPLAY = 'DISPLAY'
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  roomId?: string; 
  roomIds?: string[]; 
  isActive?: boolean;
}

export enum PatientStatus {
  WAITING = 'WAITING',
  SERVING = 'SERVING',
  CONCLUSION = 'CONCLUSION', 
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  SCHEDULED = 'SCHEDULED'
}

export interface Patient {
  id: string; 
  code: string; 
  name: string;
  age: number; 
  birthYear?: number; 
  gender?: 'Nam' | 'Nữ' | 'Khác'; 
  phone?: string; 
  address?: string; 
  
  reason: string;
  status: PatientStatus;
  timestamp: number; 
  isPriority?: boolean; 
  
  startedAt?: string;
  completedAt?: string;
  roomId?: string; 
  departmentId?: string; 
  
  appointmentTime?: number; 
  appointmentNote?: string; 
}

export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark'; 
  bgClass: string;       
  accentColor: string;   
  textClass: string;     
  subTextClass: string;  
  borderClass: string;   
}

export const THEME_PRESETS: Theme[] = [
  { 
    id: 'hospital-light', 
    name: 'Bệnh Viện (Mặc định)', 
    type: 'light',
    bgClass: 'bg-slate-50', 
    accentColor: 'bg-blue-600',
    textClass: 'text-slate-900',
    subTextClass: 'text-slate-500',
    borderClass: 'border-slate-200'
  },
  { 
    id: 'professional-blue', 
    name: 'Bảng Xanh (Chuyên Nghiệp)', 
    type: 'dark',
    bgClass: 'bg-[#004b87]', 
    accentColor: 'bg-[#003366]',
    textClass: 'text-white',
    subTextClass: 'text-blue-100',
    borderClass: 'border-white/20'
  }
];

export type AudioSource = 'GEMINI_AI' | 'BROWSER_TTS' | 'LOCAL_FILE';

export interface RoomVoiceConfig {
  source: AudioSource;
  browserRate?: number;
  browserPitch?: number;
  fileBasePath?: string;
  speed?: number; 
  voiceIdentifier?: string; 
  enableChime?: boolean; 
}

export interface RoomStyleConfig {
  hospitalName?: string;
  hospitalLogo?: string; 
  hospitalHotline?: string;
  appBgColor?: string;      
  appBgImage?: string;      
  clockColor?: string;      
  fontFamily?: string;      
  globalBorderRadius?: number; 
  headerBgColor?: string;
  headerTextColor?: string;
  headerHeight?: number;    
  headerLogoSize?: number;  
  headerTitleSize?: number; 
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  marqueeHeight?: number;   
  marqueeFontSize?: number; 
  mainNumberColor?: string;
  mainNameColor?: string;
  mainNumberSize?: number; 
  mainNameFontSize?: number; 
  sidebarBgColor?: string;
  sidebarBorderColor?: string;
  sidebarHeaderColor?: string; 
  sidebarWidth?: number; 
  cardNormalBg?: string;
  cardNormalText?: string;
  cardPriorityBg?: string;
  cardPriorityText?: string;
  cardShadowIntensity?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  tableHeaderBg?: string;
  tableHeaderColor?: string;
  tableBorderColor?: string;
  tableHeaderFontSize?: number; 
  servingRowBg?: string;
  servingRowText?: string;
  servingRowScale?: boolean; 
  waitingRowBg?: string; 
  waitingRowText?: string;
  rowFontSize?: number; 
  rowPadding?: number; 
  statusServingColor?: string;   
  statusRecoveryColor?: string;  
  statusWaitingColor?: string;   
  statusCompletedColor?: string; 
}

export interface Room {
  id: string; 
  code: string; 
  departmentId?: string; 
  name: string;
  description: string;
  doctorName: string;
  customDisplayName?: string;
  listTitle?: string;
  marqueeMessage?: string;
  startTime: string;
  endTime: string;
  avgDuration: number;
  maxCapacity: number;
  isActive: boolean;
  enabledDefaultAds: string[]; 
  themeId?: string; 
  adDuration?: number; 
  voiceConfig?: RoomVoiceConfig;
  styleConfig?: RoomStyleConfig;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  roomId?: string; 
}

export interface QueueState {
  patients: Patient[];
  currentRoom: Room;
  isLoading: boolean;
}

export interface CentralDisplayConfig {
  selectedRoomIds: string[];
  layout: 'grid-2' | 'grid-3' | 'grid-4' | 'list';
  title: string;
  themeId?: string;
}

export type ScreenTypeId = 'RECEPTION' | 'CLINIC' | 'IMAGING' | 'LAB' | 'PHARMACY' | 'SURGERY' | 'OTHER';

export interface ScreenType {
  id: ScreenTypeId;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  type: ScreenTypeId; 
  codePrefix?: string; 
  image?: string; 
  rooms: { id: string; name: string }[];
}
