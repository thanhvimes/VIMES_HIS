import React from 'react';

const ActionButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; className?: string }> = 
    ({ label, icon, onClick, className = '' }) => (
    <button onClick={onClick} className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md shadow-sm transition-colors ${className}`}>
        {icon}
        <span>{label}</span>
    </button>
);

export default ActionButton;