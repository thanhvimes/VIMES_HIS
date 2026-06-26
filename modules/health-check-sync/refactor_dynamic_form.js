const fs = require('fs');

const filePath = 'd:/AI/vClinic/modules/health-check-sync/forms/DynamicForm.tsx';
const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

let startIdx = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const DynamicForm: React.FC<DynamicFormProps> = ({')) {
        startIdx = i + 1;
        break;
    }
}

let endIdx = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('return (') && i > startIdx) {
        endIdx = i;
        break;
    }
}

const hookBody = lines.slice(startIdx, endIdx);

let providerStart = 0;
let providerEnd = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<DynamicFormContext.Provider value={{')) {
        providerStart = i + 1;
    }
    if (lines[i].includes('}}>') && providerStart > 0) {
        providerEnd = i;
        break;
    }
}

const providerVars = lines.slice(providerStart, providerEnd);
providerVars.push('            handleSubmit,');

const hookImports = `import { useState, useEffect } from 'react';
import { healthCheckService } from '../../../services/healthCheckService';
import { catalogService, CatalogItem } from '../../../services/catalogService';
import { useCatalogs } from '../hooks/useCatalogs';

export const useDynamicFormState = (formType: string, initialData: any, onSave: (data: any) => void) => {
`;

let hookFileContent = hookImports + hookBody.join('\n') + '\n    return {\n' + providerVars.join('\n') + '\n    };\n};\n';

fs.mkdirSync('d:/AI/vClinic/modules/health-check-sync/hooks', { recursive: true });
fs.writeFileSync('d:/AI/vClinic/modules/health-check-sync/hooks/useDynamicFormState.ts', hookFileContent, 'utf-8');

let newDynamicForm = lines.slice(0, startIdx);
newDynamicForm.push('    const formState = useDynamicFormState(formType, initialData, onSave);');
newDynamicForm.push('    const { activeTab, setActiveTab, handleSubmit, isChild, isStudent } = formState;');
newDynamicForm.push('');
newDynamicForm.push('    return (');
newDynamicForm.push('        <DynamicFormContext.Provider value={formState}>');

newDynamicForm = newDynamicForm.concat(lines.slice(providerEnd + 1));

const importLine = "import { useDynamicFormState } from '../hooks/useDynamicFormState';";
newDynamicForm.splice(2, 0, importLine);

fs.writeFileSync(filePath, newDynamicForm.join('\n'), 'utf-8');

console.log("Done refactoring DynamicForm.tsx");
