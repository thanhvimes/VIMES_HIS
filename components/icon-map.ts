
import React from 'react';
import * as General from './icons/general';
import * as Navigation from './icons/navigation';
import * as Medical from './icons/medical';
import * as Office from './icons/office';
import * as Technology from './icons/technology';

// Master map for dynamic icon rendering (used in SystemStore, Settings, etc.)
export const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  ...General,
  ...Navigation,
  ...Medical,
  ...Office,
  ...Technology
};
