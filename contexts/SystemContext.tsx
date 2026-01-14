
// This file is DEPRECATED. 
// State management has been moved to src/stores/useSystemStore.ts using Zustand.
// Please import useSystemStore directly in components.

import React from 'react';

export const SystemProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    return <>{children}</>;
}

export const useSystem = () => {
    throw new Error("SystemContext is deprecated. Please use useSystemStore from 'stores/useSystemStore'");
}
