
export * from './common';
export * from './patient';
export * from './finance';
export * from './clinical';
export * from './system';
export * from './telemedicine';

// Explicit re-exports to fix potential barrel file resolution issues in Vite
import { Appointment, AppointmentStatus } from './patient';
export { AppointmentStatus };
export type { Appointment };
