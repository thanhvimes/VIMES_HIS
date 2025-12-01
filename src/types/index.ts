
export * from './common';
export * from './patient';
export * from './finance';
export * from './clinical';
export * from './system';
export * from './telemedicine';

// Fix: Removed explicit re-exports of Appointment/AppointmentStatus
// because "export * from './patient'" already exports them.
// This prevents "Duplicate identifier" errors during build.