
import React from 'react';
import * as General from './general';
import * as Navigation from './navigation';
import * as Medical from './medical';
import * as Office from './office';
import * as Technology from './technology';

// 1. Export all individual icons so other files can import like:
// import { SearchIcon } from '../../components/icons';
export * from './general';
export * from './navigation';
export * from './medical';
export * from './office';
export * from './technology';

// 2. Create the master ICON_MAP for dynamic rendering
// Merging all exported objects into one big object
export const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  ...General,
  ...Navigation,
  ...Medical,
  ...Office,
  ...Technology
};
