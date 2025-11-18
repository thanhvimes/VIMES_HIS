import React from 'react';

const ActionButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; className?: string; disabled?: boolean }> = 
    ({ label, icon, onClick, className = '', disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
        {icon}
        <span>{label}</span>
    </button>
);

export default ActionButton;